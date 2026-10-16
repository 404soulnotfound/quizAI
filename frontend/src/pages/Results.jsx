import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import confetti from 'canvas-confetti'
import { Trophy, RotateCcw, Home, Sparkles, Flame, CheckCircle, Award } from 'lucide-react'

export default function Results() {
  const { code } = useParams()
  const { user } = useAuth()

  const leaderboard = (() => {
    try {
      return JSON.parse(sessionStorage.getItem(`results_${code}`) || '[]')
    } catch {
      return []
    }
  })()

  const myResult = leaderboard.find((p) => p.username === user?.username)
  const winner = leaderboard[0]
  const medals = ['🥇', '🥈', '🥉']

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Victory Celebration Badge */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-5xl mb-4 shadow-xl shadow-amber-500/10">
            {myResult?.rank === 1 ? '🏆' : myResult?.rank === 2 ? '🥈' : myResult?.rank === 3 ? '🥉' : '🎮'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            {myResult?.rank === 1
              ? 'Victory! Champion of QuizAI 👑'
              : myResult
              ? `You Finished #${myResult.rank}!`
              : 'Match Completed!'}
          </h1>
          {winner && (
            <p className="text-slate-400 text-sm">
              <span className="text-white font-semibold">{winner.username}</span> took 1st place with{' '}
              <span className="text-emerald-400 font-bold">{winner.score} pts</span>
            </p>
          )}
        </div>

        {/* Player Personal Stat Cards */}
        {myResult && (
          <div className="grid grid-cols-3 gap-3.5 mb-6">
            <div className="glass-card rounded-2xl p-4 text-center border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Final Score
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono">{myResult.score}</div>
            </div>

            <div className="glass-card rounded-2xl p-4 text-center border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Correct
              </span>
              <div className="text-2xl font-black text-indigo-400 font-mono">{myResult.correct}</div>
            </div>

            <div className="glass-card rounded-2xl p-4 text-center border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Best Streak
              </span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {myResult.max_streak || myResult.streak}🔥
              </div>
            </div>
          </div>
        )}

        {/* Podium / Full Leaderboard */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 mb-6 border border-slate-800 shadow-2xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" /> Final Leaderboard
          </h2>

          <div className="space-y-2.5">
            {leaderboard.map((p, i) => {
              const isMe = p.username === user?.username
              return (
                <div
                  key={p.username || i}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                    isMe
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-md'
                      : 'bg-slate-900/80 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center text-lg font-bold">
                      {medals[i] || `${i + 1}`}
                    </span>
                    <span className="text-2xl">{p.avatar}</span>
                    <div>
                      <span className={`font-bold text-sm ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                        {p.username}
                      </span>
                      {isMe && (
                        <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-semibold">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-black text-white text-base">{p.score} pts</div>
                    <div className="text-[11px] text-slate-400">{p.correct} correct</div>
                  </div>
                </div>
              )
            })}

            {leaderboard.length === 0 && (
              <p className="text-slate-500 text-xs text-center py-6">
                No score records found for this match.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            to="/create"
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-98 transition"
          >
            <RotateCcw size={16} /> Play Another Quiz
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition"
          >
            <Home size={16} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
