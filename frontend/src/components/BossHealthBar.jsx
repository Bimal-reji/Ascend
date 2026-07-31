import { motion } from 'framer-motion'

/**
 * Boss exercise health bar — the hardest lift of the session. HP depletes
 * as the player completes sets. Frame-perfect drain animation via Framer.
 */
export default function BossHealthBar({ hp, bossName = 'BOSS' }) {
  const color = hp > 55 ? '#4ade80' : hp > 25 ? '#fbbf24' : '#ff3b5c'

  return (
    <div className="system-panel p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">👹</span>
          <span className="font-display text-sm font-bold tracking-widest text-white">{bossName.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-xl" style={{ color }}>{hp.toFixed(0)}%</span>
          <span className="text-[10px] tracking-widest text-slate-500 uppercase">HP</span>
        </div>
      </div>

      {/* HP bar */}
      <div className="h-6 rounded-full bg-black/50 border border-white/10 overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 16px ${color}99`,
          }}
          initial={{ width: '100%' }}
          animate={{ width: `${hp}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
        {/* animated damage shimmer on the remaining HP */}
        {hp > 0 && (
          <motion.div
            className="absolute inset-y-0 w-10 bg-white/20 blur-[6px]"
            style={{ left: `${hp}%` }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-display font-bold tracking-[0.2em] text-white/80">
          {hp <= 0 ? 'BOSS DEFEATED' : 'FIGHTING'}
        </div>
      </div>
    </div>
  )
}
