from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import create_tables
from app.routers import auth, rooms, websocket

settings = get_settings()
app = FastAPI(title="QuizAI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(websocket.router)

# Ensure database tables exist immediately on startup
try:
    create_tables()
except Exception as e:
    print(f"Database table creation warning: {e}")

@app.on_event("startup")
async def startup():
    try:
        create_tables()
    except Exception as e:
        print(f"Startup DB init warning: {e}")

@app.get("/")
def root():
    return {"message": "QuizAI API running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}
