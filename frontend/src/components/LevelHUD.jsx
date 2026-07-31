import { motion } from 'framer-motion'
import { rankColor, rankGlow } from '../utils/system.js'

export default function LevelHUD({ stats }) {
  if (!stats) return null
  const rc = rankColor(stats.rank)
  const pct = Math.min(stats.xp_pct, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="system-panel system-corners p-5 flex items-center gap-5"
    >
      {/* Rank emblem */}
      <div
        className="relative w-24 h-24 grid place-items-center rounded-full shrink-0"
        style={{
          border: `2px solid ${rc}`,
          boxShadow: `0 0 24px ${rankGlow(stats.rank)}, inset 0 0 18px ${rankGlow(stats.rank)}`,
        }}
      >
        <div className="absolute inset-1.5 rounded-full border border-white/10" />
        <motion.div
          key={stats.rank}
          initial={{ scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="text-center"
        >
          <div className="font-display font-black text-3xl leading-none" style={{ color: rc, textShadow: `0 0 16px ${rankGlow(stats.rank)}` }}>
            {stats.rank === 'National Level' ? 'NL' : stats.rank}
          </div>
          <div className="text-[9px] tracking-[0.25em] text-slate-400 mt-1">RANK</div>
        </motion.div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <div className="font-display text-sm tracking-widest text-cyan-300 text-glow">PLAYER LEVEL</div>
          <div className="font-display font-black text-4xl text-white">{stats.level}</div>
        </div>

        {/* XP bar */}
        <div className="mt-2 h-3.5 rounded-full bg-white/5 border border-white/10 overflow-hidden relative">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-300"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            style={{ boxShadow: '0 0 14px rgba(56,249,215,0.6)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-black/70 mix-blend-overlay">
            {stats.xp} / {stats.xp_to_next} XP
          </div>
        </div>

        <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
          <span>{stats.xp} XP</span>
          <span className="text-cyan-300/80">{stats.xp_to_next} XP TO NEXT LEVEL</span>
        </div>

        {stats.next_rank && (
          <div className="mt-2 text-[11px] text-slate-500">
            Next rank: <span style={{ color: rankColor(stats.next_rank) }}>{stats.next_rank}</span> — {Math.round(stats.rank_progress * 100)}% through {stats.rank} tier
          </div>
        )}
      </div>
    </motion.div>
  )
}
