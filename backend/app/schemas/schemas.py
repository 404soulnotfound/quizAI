from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    avatar_emoji: Optional[str] = "🎮"

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    avatar_emoji: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Room Schemas ---
class RoomCreate(BaseModel):
    topic: str
    num_questions: int = 10
    time_per_q: int = 20

class QuestionOut(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    order_index: int

    class Config:
        from_attributes = True

class RoomOut(BaseModel):
    id: int
    code: str
    topic: str
    num_questions: int
    time_per_q: int
    host_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
