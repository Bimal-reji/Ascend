import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function RestTimer({ defaultSeconds = 60 }) {
  const [total, setTotal] = useState(defaultSeconds)
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    audioRef.current = typeof Audio !== 'undefined' ? new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA') : null
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          try { audioRef.current?.play() } catch {}
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const start = () => {
    setRemaining(total)
    setRunning(true)
  }
  const stop = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setRemaining(0)
  }

  const pct = total > 0 ? remaining / total : 0
  const R = 26
  const C = 2 * Math.PI * R

  return (
    <div className="system-panel p-4 flex items-center gap-4">
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <motion.circle
            cx="32"
            cy="32"
            r={R}
            fill="none"
            stroke={remaining > 10 ? '#00d4ff' : '#ff3b5c'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - pct) }}
            transition={{ duration: 1, ease: 'linear' }}
            style={{ boxShadow: '0 0 12px rgba(0,212,255,0.6)' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center font-display font-bold text-sm tabular-nums">
          {running ? remaining : '—'}
        </div>
      </div>

      <div className="flex-1">
        <div className="text-[10px] tracking-[0.25em] text-cyan-300/70 uppercase">Rest Timer</div>
        <div className="flex items-center gap-2 mt-1.5">
          <input
            type="number"
            value={total}
            onChange={(e) => setTotal(Math.max(5, Number(e.target.value) || 60))}
            disabled={running}
            className="w-16 px-2 py-1 rounded bg-black/40 border border-white/10 text-sm text-center disabled:opacity-40"
          />
          <span className="text-xs text-slate-400">sec</span>
          {!running ? (
            <button onClick={start} className="px-3 py-1 rounded bg-cyan-400/15 border border-cyan-400/30 text-xs font-bold text-cyan-200 hover:bg-cyan-400/25 transition-all">
              ▶ START
            </button>
          ) : (
            <button onClick={stop} className="px-3 py-1 rounded bg-rose-500/20 border border-rose-400/40 text-xs font-bold text-rose-200 hover:bg-rose-500/30 transition-all">
              ■ STOP
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
