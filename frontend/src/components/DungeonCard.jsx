import { motion } from 'framer-motion'
import { rankColor, rankGlow } from '../utils/system.js'

export default function DungeonCard({ dungeon, onEnter, onResume }) {
  const rc = rankColor(dungeon.rank)
  const boss = dungeon.exercises?.find((e) => e.is_boss)
  const totalSets = dungeon.exercises?.reduce((a, e) => a + e.sets, 0) || 0
  const doneSets = dungeon.exercises?.reduce((a, e) => a + e.sets_completed, 0) || 0
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: `0 0 30px ${rankGlow(dungeon.rank)}` }}
      className="system-panel p-4 flex flex-col"
      style={{ borderColor: `rgba(0,212,255,0.18)` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 grid place-items-center rounded-lg font-display font-black text-lg"
          style={{
            color: rc,
            border: `2px solid ${rc}`,
            boxShadow: `0 0 14px ${rankGlow(dungeon.rank)}, inset 0 0 10px ${rankGlow(dungeon.rank)}`,
          }}
        >
          {dungeon.rank}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{dungeon.title}</h4>
          <div className="text-[11px] text-slate-500 capitalize">{dungeon.type} · {dungeon.exercises?.length || 0} exercises{boss ? ` · 👹 ${boss.name}` : ''}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
          <span>{dungeon.status === 'active' ? 'In progress' : 'Cleared'}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${dungeon.status === 'completed' ? 100 : pct}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => (dungeon.status === 'active' ? onResume?.(dungeon) : onEnter?.(dungeon))}
        className="mt-4 py-2 rounded-md bg-gradient-to-r from-cyan-500/25 to-violet-500/25 border border-cyan-400/30 font-display text-xs font-bold tracking-widest text-cyan-100 hover:from-cyan-500/45 hover:to-violet-500/45 transition-all"
      >
        {dungeon.status === 'active' ? '▶ RESUME' : '◈ VIEW'}
      </button>
    </motion.div>
  )
}
