import { useState } from 'react'
import { motion } from 'framer-motion'
import { statGainKeys } from '../utils/system.js'

/**
 * Quest/dungeon completion reward card — flips open like a card reveal,
 * listing XP, stat gains, PRs and unlocked titles/badges.
 */
export default function RewardCard({ reward, onClose }) {
  const [flipped, setFlipped] = useState(false)

  if (!reward) return null

  const statGains = statGainKeys(reward)
  const prs = reward.new_prs || []
  const unlocks = reward.unlocked || []

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative [perspective:1200px] w-full max-w-md" onClick={() => setFlipped(true)}>
        <motion.div
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 15 }}
          className={`relative [transform-style:preserve-3d] transition-transform duration-700 ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
        >
          {/* FRONT — dungeon clear / quest complete */}
          <div className="system-panel system-corners p-6 [backface-visibility:hidden] scanline-overlay">
            <div className="text-center">
              <div className="text-[11px] tracking-[0.4em] text-cyan-300/80 uppercase">System Reward</div>
              <h3 className="font-display font-bold text-2xl mt-2 text-white text-glow">
                {reward.status === 'completed' ? 'DUNGEON CLEAR' : 'QUEST COMPLETE'}
              </h3>
              <div className="mt-4 flex justify-center gap-8">
                <div>
                  <div className="font-display font-black text-4xl text-cyan-300 text-glow">+{reward.xp_gained}</div>
                  <div className="text-[10px] tracking-widest text-slate-400 mt-1">XP</div>
                </div>
                <div>
                  <div className="font-display font-black text-4xl text-emerald-300">
                    {reward.levels_up > 0 ? `+${reward.levels_up} ⬆` : '—'}
                  </div>
                  <div className="text-[10px] tracking-widest text-slate-400 mt-1">LEVELS</div>
                </div>
              </div>

              {statGains.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {statGains.map((s) => (
                    <span key={s.key} className="px-2.5 py-1 rounded border border-cyan-400/30 bg-cyan-400/10 text-xs font-bold text-cyan-200">
                      {s.label} +{s.value}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 text-[11px] text-slate-500 tracking-widest uppercase">
                Tap to open loot →
              </div>
            </div>
          </div>

          {/* BACK — loot */}
          <div
            className="absolute inset-0 system-panel system-corners p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto max-h-[70vh]"
            style={{ borderColor: 'rgba(139,92,246,0.35)' }}
          >
            <div className="text-center">
              <div className="text-[11px] tracking-[0.4em] text-violet-300/80 uppercase">Loot Acquired</div>

              {prs.length > 0 && (
                <div className="mt-4 text-left">
                  <div className="text-xs font-bold tracking-widest text-gold mb-2">🏆 NEW PERSONAL RECORDS</div>
                  {prs.map((p) => (
                    <div key={p.exercise} className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="font-semibold">{p.exercise}</span>
                      <span className="text-gold font-bold">{p.weight}kg × {p.reps}</span>
                    </div>
                  ))}
                </div>
              )}

              {unlocks.length > 0 && (
                <div className="mt-4 text-left">
                  <div className="text-xs font-bold tracking-widest text-violet-300 mb-2">⚔ UNLOCKED</div>
                  <div className="flex flex-wrap gap-2">
                    {unlocks.map((u) => (
                      <span key={u.name} className="px-2.5 py-1 rounded border border-violet-400/40 bg-violet-400/10 text-xs font-bold text-violet-200">
                        {u.kind === 'title' ? '◈' : '◆'} {u.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {prs.length === 0 && unlocks.length === 0 && (
                <div className="mt-6 text-slate-400 text-sm">
                  The System records your progress. Return daily for better loot.
                </div>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); onClose?.() }}
                className="mt-5 w-full py-2.5 rounded-md bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-400/30 font-display text-sm tracking-widest text-cyan-200 hover:from-cyan-500/30 hover:to-violet-500/30 transition-all"
              >
                ACCEPT
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
