import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, ArrowRight, Zap, Trophy, Users, ShieldCheck } from 'lucide-react'

export default function Home() {
  const [joinCode, setJoinCode] = useState('')
  const { user } = useAuth()
  const nav = useNavigate()

  const handleJoin = (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    const code = joinCode.trim().toUpperCase()
    if (!user) {
      nav(`/login?redirect=/room/${code}/lobby`)
    } else {
      nav(`/room/${code}/lobby`)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/20 to-pink-500/10 blur-[130px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-cyan-600/10 blur-[120px] -z-10 pointer-events-none rounded-full" />

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 flex-1 flex flex-col items-center text-center">
        {/* Highlight badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs sm:text-sm font-medium mb-8 backdrop-blur-md shadow-inner">
          <Sparkles size={14} className="text-indigo-400 animate-spin-slow" />
          <span>Powered by Google Gemini 1.5 Flash</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          AI-Generated Quizzes,{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Live Multiplayer
          </span>{' '}
          Thrill.
        </h1>

        <p className="text-slate-400 text-base sm:text-xl max-w-2xl font-normal leading-relaxed mb-10">
          Enter any topic—from <em>Quantum Computing</em> to <em>90s Pop Culture</em>. Generate tailored questions instantly, invite friends via code, and battle in real-time.
        </p>

        {/* Action Area: Join or Create */}
        <div className="w-full max-w-md flex flex-col gap-4 mb-14">
          <form onSubmit={handleJoin} className="relative flex items-center">
            <input
              type="text"
              placeholder="ENTER 6-DIGIT ROOM CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full pl-5 pr-32 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-center text-lg sm:text-xl font-mono tracking-widest uppercase text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-xl backdrop-blur-md transition"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="absolute right-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold rounded-xl text-sm transition active:scale-95 shadow-md shadow-indigo-600/30"
            >
              Join Room
            </button>
          </form>

          <div className="flex items-center justify-center gap-3 text-slate-500 text-xs">
            <span className="h-px bg-slate-800 flex-1" />
            <span>OR BE THE HOST</span>
            <span className="h-px bg-slate-800 flex-1" />
          </div>

          <Link
            to={user ? "/create" : "/register"}
            className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-indigo-500/20 active:scale-98 transition"
          >
            <Zap size={18} />
            <span>Create a New AI Quiz</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="glass-card p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Sparkles size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Unlimited Topics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Gemini AI crafts 10 balanced questions complete with multiple choices and detailed explanations on the fly.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800/80 hover:border-purple-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Zap size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live WebSockets</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sub-millisecond synchronization. Everyone gets the question simultaneously with synchronized countdowns.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <Trophy size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Gamified Leaderboard</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Earn bonus points for speed and hot streaks! Watch ranks shift dynamically after every round.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-slate-500 text-xs">
        <p>© 2026 QuizAI. Built for multiplayer excitement.</p>
      </footer>
    </div>
  )
}
