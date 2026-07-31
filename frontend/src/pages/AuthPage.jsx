import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthPage() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  if (user) return null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 16 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            className="text-5xl"
            animate={{ filter: ['drop-shadow(0 0 6px rgba(0,212,255,0.8))', 'drop-shadow(0 0 22px rgba(139,92,246,0.9))'] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            ⬢
          </motion.div>
          <h1 className="mt-3 font-display font-black text-4xl tracking-[0.3em] text-cyan-300 text-glow">ASCEND</h1>
          <p className="mt-2 text-slate-400 text-sm tracking-widest uppercase">Solo Leveling Fitness System</p>
        </div>

        <form onSubmit={submit} className="system-panel system-corners p-7">
          <div className="flex gap-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-md font-display text-xs font-bold tracking-[0.25em] transition-all ${
                  mode === m
                    ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-200'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {m === 'login' ? 'LOGIN' : 'REGISTER'}
              </button>
            ))}
          </div>

          <label className="block text-[11px] tracking-[0.25em] text-slate-500 uppercase mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hunter@system.io"
            className="w-full mb-4 px-3.5 py-2.5 rounded-md bg-black/40 border border-white/10 focus:border-cyan-400/50 outline-none text-sm"
          />

          <label className="block text-[11px] tracking-[0.25em] text-slate-500 uppercase mb-1.5">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-md bg-black/40 border border-white/10 focus:border-cyan-400/50 outline-none text-sm"
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 text-rose-300 text-xs bg-rose-500/10 border border-rose-500/30 rounded px-3 py-2"
            >
              ⚠ {error}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={busy}
            className="mt-5 w-full py-3 rounded-md bg-gradient-to-r from-cyan-500 to-violet-500 font-display font-bold tracking-[0.25em] text-black hover:brightness-110 transition-all disabled:opacity-60"
            style={{ boxShadow: '0 0 24px rgba(0,212,255,0.35)' }}
          >
            {busy ? 'CONNECTING…' : mode === 'login' ? '▶ AWAKEN' : '⚔ FORGE YOUR PATH'}
          </motion.button>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            {mode === 'login' ? 'New hunter?' : 'Already a hunter?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
            >
              {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </form>

        <p className="mt-6 text-center text-[11px] text-slate-600 tracking-wider">
          "The System has chosen you. Rise."
        </p>
      </motion.div>
    </div>
  )
}
