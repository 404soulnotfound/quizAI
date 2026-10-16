"""
app/routers/rooms.py — Create room, join room, get room info
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Room, Question
from app.schemas.schemas import RoomCreate, RoomOut
from app.services.auth import get_current_user
from app.services.gemini import generate_questions
from app.services.game_manager import game_manager
import asyncio, uuid

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


def gen_code() -> str:
    return str(uuid.uuid4())[:6].upper()


@router.post("/create", response_model=RoomOut)
async def create_room(
    room_in: RoomCreate,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    # Generate unique room code
    code = gen_code()
    while db.query(Room).filter(Room.code == code).first():
        code = gen_code()

    room = Room(
        code          = code,
        topic         = room_in.topic,
        num_questions = room_in.num_questions,
        time_per_q    = room_in.time_per_q,
        host_id       = user.id,
        status        = "waiting",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    # Generate questions with Gemini (async, stored in DB)
    questions_raw = await generate_questions(room_in.topic, room_in.num_questions)
    for i, q in enumerate(questions_raw):
        question = Question(
            room_id       = room.id,
            question_text = q["question"],
            option_a      = q["options"]["A"],
            option_b      = q["options"]["B"],
            option_c      = q["options"]["C"],
            option_d      = q["options"]["D"],
            correct_answer= q["correct"],
            explanation   = q.get("explanation", ""),
            order_index   = i,
        )
        db.add(question)
    db.commit()

    # Register room in game manager
    game_manager.create_room(code, user.id, room_in.time_per_q)

    return room


@router.get("/{code}", response_model=RoomOut)
def get_room(code: str, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.code == code.upper()).first()
    if not room:
        raise HTTPException(404, f"Room {code} not found")
    return room


@router.post("/{code}/start")
async def start_game(
    code: str,
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    room = db.query(Room).filter(Room.code == code.upper()).first()
    if not room:
        raise HTTPException(404, "Room not found")
    if room.host_id != user.id:
        raise HTTPException(403, "Only the host can start the game")
    if room.status != "waiting":
        raise HTTPException(400, "Game already started")

    # Load questions from DB
    questions_db = (
        db.query(Question)
        .filter(Question.room_id == room.id)
        .order_by(Question.order_index)
        .all()
    )

    # Convert to dict format game manager expects
    questions = [
        {
            "question": q.question_text,
            "options":  {"A": q.option_a, "B": q.option_b, "C": q.option_c, "D": q.option_d},
            "correct":  q.correct_answer,
            "explanation": q.explanation,
        }
        for q in questions_db
    ]

    # Update DB status
    room.status = "active"
    db.commit()

    # Kick off game (runs in background via asyncio)
    asyncio.create_task(game_manager.start_game(code.upper(), questions))

    return {"message": "Game started!", "room_code": code}


@router.get("/")
def list_my_rooms(
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    rooms = db.query(Room).filter(Room.host_id == user.id).order_by(Room.created_at.desc()).limit(10).all()
    return rooms
