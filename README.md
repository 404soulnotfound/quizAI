<div align="center">

# ⚡ QuizAI

### Real-Time Multiplayer AI-Powered Quiz Arena

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_1.5-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Live_Duplex-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://websockets.spec.whatwg.org/)

<p align="center">
  <b>Generate instant custom quizzes on any topic using Google Gemini. Invite friends via a 6-character room code, race against synchronized timers, and climb the live gamified leaderboard in real time.</b>
</p>

</div>

---

## 🌟 Highlights & Features

- 🧠 **Dynamic AI Question Generation**: Type literally *any* topic—from *Quantum Physics* to *Taylor Swift Discography*. Google Gemini 1.5 Flash generates tailored, high-quality MCQs with smart distractor options and clear explanations.
- ⚡ **Real-Time Multiplayer (WebSockets)**: True full-duplex communication connects all players in a room. Synchronized countdown clocks, immediate answer reveals, and sub-millisecond leaderboard shifts.
- 🎮 **Gamified Scoring Mechanics**:
  - **Base Points**: 100 points per correct answer.
  - **Speed Multiplier**: Up to +50 bonus points the faster you lock in your choice.
  - **Streak Fire**: Multiplier rewards for consecutive correct answers (🔥 up to +30 bonus).
- 🎨 **Modern Glassmorphic UI/UX**: Built with React 19, Tailwind CSS v4, dynamic sound/visual cues, avatar customization, and victory celebration confetti.
- 🛡️ **Stateless JWT & Secure DB**: Scalable authentication powered by `python-jose` and `passlib[bcrypt]`, backed by SQLAlchemy with zero-config local SQLite or cloud PostgreSQL (Railway/Supabase/Neon).

---

## 📐 System Architecture & Flow

```
┌────────────────────────┐                    ┌────────────────────────┐
│     React Frontend     │                    │    FastAPI Backend     │
│   (Vite + Tailwind)    │                    │ (Uvicorn + SQLAlchemy) │
└───────────┬────────────┘                    └───────────┬────────────┘
            │                                             │
            │─── 1. POST /api/rooms/create {topic} ──────>│─── Calls Gemini 1.5 Flash ───┐
            │<── Returns Room Code (e.g., 'ABC123') ──────│<── Stores MCQs in DB ────────┘
            │                                             │
            │─── 2. Connects: ws:///ws/ABC123?token=JWT ─>│─── Registers in GameManager ──┐
            │<── Broadcasts player_joined to room ────────│<── Tracks in-memory state ────┘
            │                                             │
            │─── 3. Host initiates game ─────────────────>│
            │<── Synchronized "question" pushed to ALL ───│─── Starts 20s server timer
            │                                             │
            │─── 4. Player submits answer with latency ──>│─── Computes speed + streak bonus
            │<── Immediate "answer_result" to player ─────│
            │                                             │
            │<── "answer_reveal" & live leaderboard ──────│─── Broadcast when timer ends
            │                                             │
            │<── "game_over" + podium standings ──────────│─── Trigger victory celebration
```

---

## 🗂️ Project Structure

```
quizAI/
├── backend/
│   ├── Procfile                # Production runner: uvicorn main:app
│   ├── requirements.txt        # FastAPI, Uvicorn, SQLAlchemy, Google-GenAI, etc.
│   ├── .env.example
│   ├── main.py                 # FastAPI application, CORS & router registrations
│   └── app/
│       ├── config.py           # Pydantic BaseSettings & env configuration
│       ├── database.py         # SQLAlchemy engine & session factory
│       ├── models/             # ORM entities (User, Room, Question, Score)
│       ├── schemas/            # Pydantic models for validation & serialization
│       ├── routers/            # Auth, room management, and WebSocket endpoints
│       └── services/           # Password hashing, Gemini integration, GameManager
└── frontend/
    ├── package.json
    ├── vite.config.js          # Vite configuration with @tailwindcss/vite
    ├── vercel.json             # SPA routing rewrite rule for Vercel
    ├── .env.example
    └── src/
        ├── context/            # AuthContext & session management
        ├── components/         # Navbar, glass cards, and status badges
        ├── pages/              # Home, Login, Register, Dashboard, Create, Lobby, Game, Results
        └── utils/              # Fetch API wrapper & WebSocket URL resolver
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/404soulnotfound/quizAI.git
cd quizAI
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Add your Gemini API Key in `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///./quizai.db
ALLOWED_ORIGINS=http://localhost:5173
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```
- API is live at: `http://localhost:8000`
- Interactive Swagger docs at: `http://localhost:8000/docs`

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---



---

## 🔑 Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google Account.
3. Click **Create API Key**.
4. Paste it into your `GEMINI_API_KEY` configuration.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Crafted with ⚡ and passion by <a href="https://github.com/404soulnotfound">soumili_gg</a></sub>
</div>
