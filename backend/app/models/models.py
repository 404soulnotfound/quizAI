from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_emoji = Column(String(10), default="🎮")
    created_at = Column(DateTime, default=datetime.utcnow)

    rooms = relationship("Room", back_populates="host")
    scores = relationship("Score", back_populates="user")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)
    topic = Column(String(150), nullable=False)
    num_questions = Column(Integer, default=10)
    time_per_q = Column(Integer, default=20)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="waiting")  # waiting, active, finished
    created_at = Column(DateTime, default=datetime.utcnow)

    host = relationship("User", back_populates="rooms")
    questions = relationship("Question", back_populates="room", cascade="all, delete-orphan")
    scores = relationship("Score", back_populates="room", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    option_a = Column(String(255), nullable=False)
    option_b = Column(String(255), nullable=False)
    option_c = Column(String(255), nullable=False)
    option_d = Column(String(255), nullable=False)
    correct_answer = Column(String(1), nullable=False)
    explanation = Column(Text, default="")
    order_index = Column(Integer, default=0)

    room = relationship("Room", back_populates="questions")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    max_streak = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("Room", back_populates="scores")
    user = relationship("User", back_populates="scores")
