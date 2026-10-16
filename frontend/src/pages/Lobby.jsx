import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { WS_BASE } from '../utils/api'
import { Copy, Play, Users, Clock, Hash, Check, Sparkles, Shield, ArrowLeft } from 'lucide-react'

export default function Lobby() {
  const { code } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    api.get(`/api/rooms/${code}`)
      .then(r => setRoom(r))
      .catch(() => nav('/dashboard'))

    const token = localStorage.getItem('token')
    if (!token) {
      nav(`/login?redirect=/room/${code}/lobby`)
      return
    }

    const wsUrl = `${WS_BASE}/ws/${code}?token=${token}&username=${encodeURIComponent(user?.username || '')}&avatar=${encodeURIComponent(user?.avatar_emoji || '🎮')}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'room_state' || msg.type === 'player_joined' || msg.type === 'player_left') {
        if (msg.data.all_players) setPlayers(msg.data.all_players)
      }
      if (msg.type === 'game_starting') {
        setTimeout(() => nav(`/room/${code}/game`), 500)
      }
    }

    ws.onerror = () => {
      console.warn("WebSocket error, returning to dashboard")
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [code, user])

  async function startGame() {
    setStarting(true)
    try {
      await api.post(`/api/rooms/${code}/start`)
    } catch (e) {
      alert(e.message || 'Failed to start game')
      setStarting(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isHost = room?.host_id === user?.id

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-10 relative">
      <div className="w-full max-w-lg">
        {/* Back navigation */}
        <button
          onClick={() => nav('/dashboard')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-6 transition"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>

        {/* Room Header Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-3 border border-indigo-500/20">
            <Sparkles size={14} /> Room Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {room?.topic || 'Loading Quiz Topic...'}
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Hash size={13} /> {room?.num_questions || 10} Questions
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} /> {room?.time_per_q || 20}s timer
            </span>
          </div>
        </div>

        {/* Code Sharing Box */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 mb-6 text-center border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
            Share this Game Code
          </p>
          <div className="text-5xl sm:text-6xl font-black text-white tracking-[0.2em] font-mono mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300 select-all">
            {code}
          </div>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Code Copied to Clipboard!' : 'Copy Invite Code'}</span>
          </button>
        </div>

        {/* Connected Players List */}
        <div className="glass-card rounded-3xl p-6 mb-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-bold">
              <Users size={16} className="text-indigo-400" />
              <span>Joined Competitors</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {players.length} Ready
            </span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {players.map((p, i) => (
              <div
                key={p.user_id || i}
                className="flex items-center justify-between bg-slate-900/80 border border-slate-800/60 rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-1 bg-slate-800 rounded-xl">{p.avatar}</span>
                  <span className="text-slate-200 font-semibold text-sm">{p.username}</span>
                </div>
                {p.user_id === room?.host_id && (
                  <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                    <Shield size={12} /> Host
                  </span>
                )}
              </div>
            ))}
            {players.length === 0 && (
              <p className="text-slate-500 text-xs text-center py-6">
                Waiting for competitors to connect...
              </p>
            )}
          </div>
        </div>

        {/* Start Game Controls */}
        {isHost ? (
          <button
            onClick={startGame}
            disabled={starting || players.length === 0}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-xl shadow-emerald-500/20 active:scale-98 transition"
          >
            <Play size={20} fill="currentColor" />
            <span>{starting ? 'Starting Game Session...' : 'Start The Quiz Now'}</span>
          </button>
        ) : (
          <div className="glass-card rounded-2xl p-4 text-center text-slate-400 text-xs font-medium border border-slate-800 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Waiting for room host to initiate the countdown...</span>
          </div>
        )}
      </div>
    </div>
  )
}
