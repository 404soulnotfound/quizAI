"""
app/services/game_manager.py
-----------------------------
In-memory game state manager.
Tracks all active rooms, connected players, scores, and game flow.
Uses WebSocket connections to broadcast events to all players.

This is the heart of the real-time multiplayer system.
"""
import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket


class PlayerConnection:
    def __init__(self, websocket: WebSocket, user_id: int, username: str, avatar: str):
        self.websocket = websocket
        self.user_id   = user_id
        self.username  = username
        self.avatar    = avatar
        self.score     = 0
        self.streak    = 0
        self.max_streak= 0
        self.correct   = 0
        self.answered_current = False  # prevent double answers per question

    def to_dict(self):
        return {
            "user_id":  self.user_id,
            "username": self.username,
            "avatar":   self.avatar,
            "score":    self.score,
            "streak":   self.streak,
            "correct":  self.correct,
        }


class GameRoom:
    def __init__(self, room_code: str, host_id: int, time_per_q: int):
        self.room_code     = room_code
        self.host_id       = host_id
        self.time_per_q    = time_per_q
        self.players: Dict[int, PlayerConnection] = {}
        self.questions: list = []
        self.current_q_idx = -1   # -1 = not started
        self.status        = "waiting"  # waiting, active, finished
        self.q_timer_task  = None
        self.answers_this_q: Dict[int, str] = {}  # user_id → answer

    @property
    def current_question(self):
        if 0 <= self.current_q_idx < len(self.questions):
            return self.questions[self.current_q_idx]
        return None

    def get_leaderboard(self) -> list:
        sorted_players = sorted(
            self.players.values(),
            key=lambda p: (-p.score, -p.correct)
        )
        return [
            {**p.to_dict(), "rank": i + 1}
            for i, p in enumerate(sorted_players)
        ]


class GameManager:
    """
    Central manager for all active game rooms.
    One instance shared across the entire FastAPI app.
    """

    def __init__(self):
        self.rooms: Dict[str, GameRoom] = {}

    # ─── Room management ──────────────────────────────────────────────────────

    def create_room(self, room_code: str, host_id: int, time_per_q: int) -> GameRoom:
        room = GameRoom(room_code, host_id, time_per_q)
        self.rooms[room_code] = room
        return room

    def get_room(self, room_code: str) -> GameRoom | None:
        return self.rooms.get(room_code)

    def remove_room(self, room_code: str):
        if room_code in self.rooms:
            del self.rooms[room_code]

    # ─── Player management ────────────────────────────────────────────────────

    async def connect_player(
        self, websocket: WebSocket, room_code: str,
        user_id: int, username: str, avatar: str
    ) -> GameRoom | None:
        room = self.get_room(room_code)
        if not room:
            await websocket.close(code=4004, reason="Room not found")
            return None

        await websocket.accept()
        player = PlayerConnection(websocket, user_id, username, avatar)
        room.players[user_id] = player

        # Tell everyone someone joined
        await self.broadcast(room_code, {
            "type": "player_joined",
            "data": {
                "player":    player.to_dict(),
                "all_players": room.get_leaderboard(),
                "room_status": room.status,
            }
        })

        # Send current game state to the newly joined player
        await self._send_to_player(player, {
            "type": "room_state",
            "data": {
                "room_code":   room_code,
                "status":      room.status,
                "all_players": room.get_leaderboard(),
                "is_host":     user_id == room.host_id,
                "current_q":   room.current_q_idx,
                "total_q":     len(room.questions),
            }
        })

        return room

    async def disconnect_player(self, room_code: str, user_id: int):
        room = self.get_room(room_code)
        if not room or user_id not in room.players:
            return

        username = room.players[user_id].username
        del room.players[user_id]

        await self.broadcast(room_code, {
            "type": "player_left",
            "data": {
                "username":    username,
                "all_players": room.get_leaderboard(),
            }
        })

        # Clean up empty rooms
        if not room.players:
            self.remove_room(room_code)

    # ─── Game flow ────────────────────────────────────────────────────────────

    async def start_game(self, room_code: str, questions: list):
        room = self.get_room(room_code)
        if not room:
            return

        room.questions = questions
        room.status    = "active"
        room.current_q_idx = -1

        await self.broadcast(room_code, {
            "type": "game_starting",
            "data": {
                "total_questions": len(questions),
                "time_per_q":      room.time_per_q,
                "message":         "Get ready! First question in 3 seconds...",
            }
        })

        await asyncio.sleep(3)
        await self._send_next_question(room_code)

    async def _send_next_question(self, room_code: str):
        room = self.get_room(room_code)
        if not room:
            return

        room.current_q_idx += 1
        room.answers_this_q = {}

        # Reset answered flag for all players
        for player in room.players.values():
            player.answered_current = False

        if room.current_q_idx >= len(room.questions):
            await self._end_game(room_code)
            return

        q = room.questions[room.current_q_idx]

        # Send question WITHOUT correct answer
        await self.broadcast(room_code, {
            "type": "question",
            "data": {
                "index":      room.current_q_idx,
                "total":      len(room.questions),
                "question":   q["question"],
                "options":    q["options"],
                "time_limit": room.time_per_q,
            }
        })

        # Start countdown timer
        if room.q_timer_task:
            room.q_timer_task.cancel()
        room.q_timer_task = asyncio.create_task(
            self._question_timer(room_code, room.time_per_q)
        )

    async def _question_timer(self, room_code: str, seconds: int):
        """Wait for timer, then reveal answer and move on."""
        await asyncio.sleep(seconds)
        await self._reveal_answer(room_code)

    async def _reveal_answer(self, room_code: str):
        room = self.get_room(room_code)
        if not room or room.current_question is None:
            return

        q = room.current_question

        await self.broadcast(room_code, {
            "type": "answer_reveal",
            "data": {
                "correct_answer": q["correct"],
                "explanation":    q.get("explanation", ""),
                "leaderboard":    room.get_leaderboard(),
            }
        })

        # Wait 3 seconds then send next question
        await asyncio.sleep(3)
        await self._send_next_question(room_code)

    async def handle_answer(
        self, room_code: str, user_id: int,
        answer: str, time_taken: float
    ):
        room = self.get_room(room_code)
        if not room or user_id not in room.players:
            return

        player = room.players[user_id]

        # Prevent double answering
        if player.answered_current:
            return
        player.answered_current = True

        q = room.current_question
        if not q:
            return

        is_correct = answer.upper() == q["correct"].upper()
        room.answers_this_q[user_id] = answer

        if is_correct:
            # Score = base (100) + speed bonus (up to 50) + streak bonus (up to 30)
            speed_bonus  = max(0, int(50 * (1 - time_taken / room.time_per_q)))
            streak_bonus = min(30, player.streak * 10)
            points       = 100 + speed_bonus + streak_bonus

            player.score   += points
            player.streak  += 1
            player.correct += 1
            player.max_streak = max(player.max_streak, player.streak)
        else:
            points        = 0
            player.streak = 0

        # Tell this player their result immediately
        await self._send_to_player(player, {
            "type": "answer_result",
            "data": {
                "correct":     is_correct,
                "points":      points,
                "total_score": player.score,
                "streak":      player.streak,
                "answer":      answer,
            }
        })

        # If everyone answered, reveal early
        answered_count = sum(1 for p in room.players.values() if p.answered_current)
        if answered_count == len(room.players):
            if room.q_timer_task:
                room.q_timer_task.cancel()
            await self._reveal_answer(room_code)

    async def _end_game(self, room_code: str):
        room = self.get_room(room_code)
        if not room:
            return

        room.status = "finished"
        final_lb    = room.get_leaderboard()

        await self.broadcast(room_code, {
            "type": "game_over",
            "data": {
                "leaderboard": final_lb,
                "winner":      final_lb[0] if final_lb else None,
                "message":     "Game over! 🏆",
            }
        })

    # ─── Messaging helpers ────────────────────────────────────────────────────

    async def broadcast(self, room_code: str, message: dict):
        """Send a message to ALL players in a room."""
        room = self.get_room(room_code)
        if not room:
            return

        text = json.dumps(message)
        disconnected = []

        for uid, player in room.players.items():
            try:
                await player.websocket.send_text(text)
            except Exception:
                disconnected.append(uid)

        for uid in disconnected:
            await self.disconnect_player(room_code, uid)

    async def _send_to_player(self, player: PlayerConnection, message: dict):
        """Send a message to a single player."""
        try:
            await player.websocket.send_text(json.dumps(message))
        except Exception:
            pass


# Singleton — one game manager for the whole app
game_manager = GameManager()
