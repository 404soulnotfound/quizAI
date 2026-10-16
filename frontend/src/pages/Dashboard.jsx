import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { PlusCircle, Play, Users, Clock, Hash, ChevronRight, Zap } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [quickCode, setQuickCode] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    api.get('/api/rooms/')
      .then(res => setRooms(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const handleJoin = (e) => {
    e.preventDefault()
    if (!quickCode.trim()) return
    nav(`/room/${quickCode.trim().toUpperCase()}/lobby`)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* User Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl shadow-inner">
            {user?.avatar_emoji || '🎮'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Hey, {user?.username || 'Player'}!
            </h1>
            <p className="text-slate-400 text-sm">
              Ready to test your knowledge or host a new showdown?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/create"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition"
          >
            <PlusCircle size={18} />
            <span>Create New Quiz</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column: Recent Rooms Hosted */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap size={18} className="text-indigo-400" />
              Your Created Quizzes
            </h2>
            <span className="text-xs text-slate-500">{rooms.length} Total</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading your games...</div>
          ) : rooms.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center border border-slate-800">
              <p className="text-slate-400 mb-4">You haven't hosted any quizzes yet.</p>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold text-sm rounded-xl transition"
              >
                Create your first quiz now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-indigo-500/40 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                        {room.code}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                        room.status === 'active' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        room.status === 'finished' ? 'bg-slate-800 text-slate-400' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {room.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base mb-2 line-clamp-1">{room.topic}</h3>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Hash size={13} /> {room.num_questions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {room.time_per_q}s each
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/room/${room.code}/lobby`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                  >
                    <span>Enter Lobby</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Join & Stats */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-2">Join a Game</h3>
            <p className="text-slate-400 text-xs mb-4">
              Enter an invite code provided by another host to jump in.
            </p>

            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                placeholder="ROOM CODE"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full py-3 px-4 bg-slate-900 border border-slate-700/80 rounded-xl text-center font-mono tracking-widest text-lg font-bold text-white uppercase placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!quickCode.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
              >
                Join Live Room
              </button>
            </form>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-3">Trending Topics</h3>
            <div className="flex flex-wrap gap-2">
              {[
                'Machine Learning',
                'Harry Potter',
                'World Geography',
                '90s Video Games',
                'Quantum Physics',
                'Marvel MCU',
              ].map((topic) => (
                <Link
                  key={topic}
                  to={`/create?topic=${encodeURIComponent(topic)}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 text-xs font-medium border border-slate-800 transition"
                >
                  + {topic}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
