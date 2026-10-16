# ⚡ QuizAI — Real-time Multiplayer Quiz

AI generates questions on ANY topic. Players join with a code. Live WebSocket leaderboard.

## Stack
- **Frontend**: React + Vite + TailwindCSS → Vercel
- **Backend**: FastAPI + SQLAlchemy + WebSocket → Railway
- **AI**: Google Gemini 1.5 Flash
- **DB**: SQLite (local) / PostgreSQL (production)

## Quick Start (Local)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # add your GEMINI_API_KEY
uvicorn main:app --reload
```
Backend runs at http://localhost:8000 · Docs at http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend runs at http://localhost:5173

## Get a Gemini API Key (Free)
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy it into backend/.env as GEMINI_API_KEY=your_key

## Deploy

### Backend → Railway
1. Push to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Select the `backend` folder as root
4. Add environment variables:
   - GEMINI_API_KEY=your_key
   - SECRET_KEY=any_long_random_string
   - DATABASE_URL=postgresql://... (Railway provides this)
   - ALLOWED_ORIGINS=https://your-frontend.vercel.app
5. Deploy — Railway auto-detects Procfile

### Frontend → Vercel
1. Go to vercel.com → New Project → Import GitHub repo
2. Set Root Directory to `frontend`
3. Add environment variables:
   - VITE_API_URL=https://your-backend.railway.app
   - VITE_WS_URL=https://your-backend.railway.app
4. Deploy

## How WebSocket works
```
Player opens /room/ABC123/game
  → React connects: ws://backend/ws/ABC123?token=JWT
  → Game manager registers player
  → Host clicks Start → server broadcasts "question" to ALL players
  → Player answers → server calculates score, broadcasts "answer_reveal"
  → After all questions → server broadcasts "game_over" with final scores
```

## Project Structure
```
quizai/
├── backend/
│   ├── main.py              ← FastAPI app entry point
│   ├── app/
│   │   ├── config.py        ← Settings from .env
│   │   ├── database.py      ← SQLAlchemy setup
│   │   ├── models/          ← DB models (User, Room, Question, Score)
│   │   ├── schemas/         ← Pydantic validation
│   │   ├── routers/         ← auth, rooms, websocket
│   │   └── services/        ← auth, gemini AI, game manager
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx           ← Routes
    │   ├── context/          ← Auth state
    │   ├── pages/            ← Home, Login, Register, Dashboard,
    │   │                        CreateRoom, Lobby, Game, Results
    │   └── utils/            ← API client
    └── package.json
```
