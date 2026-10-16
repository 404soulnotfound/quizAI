import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/api'
import { Sparkles, Clock, Hash, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

export default function CreateRoom() {
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(10)
  const [timePerQ, setTimePerQ] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get('topic')
    if (t) setTopic(t)
  }, [location.search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!topic.trim()) return
    setError('')
    setLoading(true)

    try {
      const room = await api.post('/api/rooms/create', {
        topic: topic.trim(),
        num_questions: parseInt(numQuestions),
        time_per_q: parseInt(timePerQ),
      })
      nav(`/room/${room.code}/lobby`)
    } catch (err) {
      setError(err.message || 'Failed to generate questions. Check API key or try a different topic.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-3 border border-indigo-500/20">
            <Sparkles size={14} /> Gemini 1.5 Flash Generator
          </div>
          <h1 className="text-3xl font-black text-white">Generate an AI Quiz</h1>
          <p className="text-slate-400 text-sm mt-1">
            Pick any topic in the world. Our AI will formulate unique MCQs with answers & explanations.
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm p-4 rounded-xl">
              <AlertCircle size={18} className="flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Quiz Topic or Theme
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Christopher Nolan Movies, Ancient Rome, Quantum Mechanics..."
                className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Hash size={14} className="text-indigo-400" /> Number of Questions
                </label>
                <select
                  value={numQuestions}
                  disabled={loading}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                >
                  <option value={5}>5 Questions (Quick Match)</option>
                  <option value={10}>10 Questions (Standard)</option>
                  <option value={15}>15 Questions (Long Run)</option>
                  <option value={20}>20 Questions (Endurance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-400" /> Time Per Question
                </label>
                <select
                  value={timePerQ}
                  disabled={loading}
                  onChange={(e) => setTimePerQ(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                >
                  <option value={10}>10 Seconds (Speed Blitz)</option>
                  <option value={15}>15 Seconds (Fast)</option>
                  <option value={20}>20 Seconds (Balanced)</option>
                  <option value={30}>30 Seconds (Relaxed)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-indigo-200" />
                  <span>Gemini AI is generating your questions...</span>
                </>
              ) : (
                <>
                  <span>Create Room & Generate Questions</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
