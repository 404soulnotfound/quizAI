"""
app/routers/websocket.py
-------------------------
WebSocket endpoint — the real-time heart of the game.
ws://server/ws/{room_code}?token=JWT
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from app.config import get_settings
from app.services.game_manager import game_manager
import json

router   = APIRouter()
settings = get_settings()


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None


@router.websocket("/ws/{room_code}")
async def websocket_endpoint(
    websocket:  WebSocket,
    room_code:  str,
    token:      str = Query(...),
    username:   str = Query("Player"),
    avatar:     str = Query("🎮"),
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = int(payload.get("sub", 0))
    code    = room_code.upper()

    room = await game_manager.connect_player(
        websocket, code, user_id, username, avatar
    )
    if not room:
        return

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type", "")
            data     = msg.get("data", {})

            if msg_type == "answer":
                await game_manager.handle_answer(
                    code,
                    user_id,
                    data.get("answer", ""),
                    float(data.get("time_taken", 20)),
                )

            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        await game_manager.disconnect_player(code, user_id)
    except Exception:
        await game_manager.disconnect_player(code, user_id)
