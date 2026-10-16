import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { WS_BASE } from '../utils/api'
import confetti from 'canvas-confetti'
import { Flame, Trophy, Clock, CheckCircle2, XCircle, Sparkles } from 'lucide-react'

const OPTION_STYLES = {
  A: 'bg-indigo-950/70 hover:bg-indigo-900/80 border-indigo-700/60 text-indigo-100',
  B: 'bg-violet-950/70 hover:bg-violet-900/80 border-violet-700/60 text-violet-100',
  C: 'bg-blue-950/70 hover:bg-blue-900/80 border-blue-700/60 text-blue-100',
  D: 'bg-fuchsia-950/70 hover:bg-fuchsia-900/80 border-fuchsia-700/60 text-fuchsia-100',
}

const CORRECT_STYLE = 'bg-emerald-950/90 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20'
const WRONG_STYLE = 'bg-rose-950/70 border-rose-800 text-rose-300 opacity-60'
const NEUTRAL_STYLE = 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-40'

export default function Game() {
  const { code } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()

  const [question, setQuestion] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [total, setTotal] = useState(10)
  const [timeLeft, setTimeLeft] = useState(20)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [correctAns, setCorrectAns] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [myScore, setMyScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [phase, setPhase] = useState('question') // question | reveal | done
  const [qStartTime, setQStartTime] = useState(Date.now())

  const wsRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      nav(`/login?redirect=/room/${code}/game`)
      return
    }

    const wsUrl = `${WS_BASE}/ws/${code}?token=${token}&username=${encodeURIComponent(user?.username || '')}&avatar=${encodeURIComponent(user?.avatar_emoji || '🎮')}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'question') {
        setQuestion(msg.data)
        setQIndex(msg.data.index)
        setTotal(msg.data.total)
        setTimeLeft(msg.data.time_limit)
        setAnswered(false)
        setSelected(null)
        setResult(null)
        setCorrectAns(null)
        setExplanation('')
        setPhase('question')
        setQStartTime(Date.now())
        startTimer(msg.data.time_limit)
      }

      if (msg.type === 'answer_result') {
        setResult(msg.data)
        setMyScore(msg.data.total_score)
        setStreak(msg.data.streak)
        if (msg.data.correct) {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#10b981', '#6366f1', '#ec4899'],
          })
        }
      }

      if (msg.type === 'answer_reveal') {
        setCorrectAns(msg.data.correct_answer)
        setExplanation(msg.data.explanation || '')
        setLeaderboard(msg.data.leaderboard || [])
        setPhase('reveal')
        clearInterval(timerRef.current)
      }

      if (msg.type === 'game_over') {
        clearInterval(timerRef.current)
        const lb = msg.data.leaderboard || []
        sessionStorage.setItem(`results_${code}`, JSON.stringify(lb))
        nav(`/room/${code}/results`)
      }
    }

    ws.onerror = () => nav('/dashboard')
    return () => {
      ws.close()
      clearInterval(timerRef.current)
    }
  }, [code, user])

  function startTimer(seconds) {
    clearInterval(timerRef.current)
    setTimeLeft(seconds)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function sendAnswer(option) {
    if (answered || phase !== 'question') return
    setAnswered(true)
    setSelected(option)
    const timeTaken = (Date.now() - qStartTime) / 1000
    wsRef.current?.send(
      JSON.stringify({
        type: 'answer',
        data: { answer: option, time_taken: timeTaken },
      })
    )
  }

  function getOptionClass(opt) {
    if (phase === 'reveal') {
      if (opt === correctAns) return CORRECT_STYLE
      if (opt === selected && opt !== correctAns) return WRONG_STYLE
      return NEUTRAL_STYLE
    }
    if (answered && opt === selected) return `${OPTION_STYLES[opt]} ring-2 ring-indigo-400 opacity-90 cursor-default scale-[1.01]`
    if (answered) return `${OPTION_STYLES[opt]} opacity-40 cursor-default`
    return `${OPTION_STYLES[opt]} cursor-pointer active:scale-[0.99]`
  }

  if (!question) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-4xl mb-4 animate-bounce">
            ⚡
          </div>
          <h2 className="text-2xl font-black text-white">Get Ready!</h2>
          <p className="text-slate-400 text-sm mt-1">Starting live round...</p>
        </div>
      </div>
    )
  }

  const timerPct = (timeLeft / (question?.time_limit || 20)) * 100

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold">
              Q {qIndex + 1} of {total}
            </span>
            {streak > 1 && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 animate-pulse">
                <Flame size={14} /> {streak} Streak
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className={`font-mono font-black text-2xl ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Score</span>
              <span className="font-mono font-bold text-emerald-400 text-base">{myScore} pts</span>
            </div>
          </div>
        </div>

        {/* Animated Timer Bar */}
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 mb-6">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${timerPct}%`,
              backgroundColor: timerPct < 25 ? '#f43f5e' : timerPct < 50 ? '#f59e0b' : '#6366f1',
            }}
          />
        </div>

        {/* Question Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 mb-6 border border-slate-800 min-h-[160px] flex items-center justify-center text-center shadow-xl relative overflow-hidden">
          <p className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed">
            {question.question}
          </p>
        </div>

        {/* 4 Multi-Choice Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          {['A', 'B', 'C', 'D'].map((opt) => (
            <button
              key={opt}
              onClick={() => sendAnswer(opt)}
              disabled={answered || phase === 'reveal'}
              className={`${getOptionClass(opt)} border rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 text-left transition duration-200 shadow-md`}
            >
              <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {opt}
              </span>
              <span className="font-medium text-sm sm:text-base leading-snug">
                {question.options?.[opt]}
              </span>
            </button>
          ))}
        </div>

        {/* Immediate Result / Reveal Explanation Banner */}
        {phase === 'reveal' && (
          <div className="glass-card rounded-2xl p-5 border border-slate-800 animate-fade-in mb-6">
            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
              {selected === correctAns ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={18} /> Spot on! +{result?.points || 0} points
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1.5">
                  <XCircle size={18} /> Missed it! Correct answer is {correctAns}
                </span>
              )}
            </div>
            {explanation && (
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                💡 <span className="text-slate-400 font-semibold">Explanation:</span> {explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Live Mini Leaderboard Bar */}
      {leaderboard.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-400" /> Current Leaderboard
            </span>
            <span className="text-xs text-slate-500">Live rankings</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {leaderboard.slice(0, 4).map((p, i) => (
              <div
                key={p.username}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  p.username === user?.username
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <span>{['🥇', '🥈', '🥉', '4'][i]}</span>
                <span className="text-base">{p.avatar}</span>
                <span className="truncate flex-1">{p.username}</span>
                <span className="font-mono text-white font-bold">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
