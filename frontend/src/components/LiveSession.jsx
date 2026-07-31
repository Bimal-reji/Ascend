import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { endpoints } from '../api/client.js'
import { useSystem } from '../context/SystemContext.jsx'
import BossHealthBar from './BossHealthBar.jsx'
import RestTimer from './RestTimer.jsx'

/**
 * The live dungeon session — framed as "entering a dungeon". Exercise list
 * with per-set logging, rest timer, boss health bar, and a Clear button that
 * triggers the reward flow.
 */
export default function LiveSession({ dungeonId, onExit, onReward }) {
  const { applyReward } = useSystem()
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const data = await endpoints.getDungeon(dungeonId)
      setSession(data)
    } catch (e) {
      setError(e.message)
    }
  }

  // initial load
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dungeonId])

  const logSet = async (exerciseId) => {
    setBusy(exerciseId)
    try {
      const data = await endpoints.logSet(dungeonId, { exercise_id: exerciseId })
      setSession(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(null)
    }
  }

  const complete = async () => {
    const mins = Math.max(0, Math.round(prompt('Session duration (minutes)?', '45') || 0))
    try {
      const reward = await endpoints.completeDungeon(dungeonId, { duration_minutes: mins })
      applyReward({ ...reward, source: 'dungeon' })
      onReward?.(reward)
      onExit()
    } catch (e) {
      setError(e.message)
    }
  }

  if (error) return <div className="text-rose-300 p-6 text-center">{error}</div>
  if (!session) return <div className="text-center p-10 text-cyan-300/60 animate-pulse font-display tracking-widest">LOADING DUNGEON…</div>

  const { dungeon, boss_hp_pct, total_volume } = session
  const boss = dungeon.exercises?.find((e) => e.is_boss)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="system-panel p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-cyan-300/70 uppercase">Dungeon Session</div>
            <h2 className="font-display text-xl font-bold text-white text-glow mt-1">{dungeon.title}</h2>
          </div>
          <div className="text-right">
            <div className="font-display font-black text-xl text-cyan-300">{total_volume.toLocaleString()} kg</div>
            <div className="text-[10px] tracking-widest text-slate-500">VOLUME</div>
          </div>
        </div>
      </div>

      {/* Boss health bar */}
      {boss ? (
        <BossHealthBar hp={boss_hp_pct} bossName={boss.name} />
      ) : (
        <BossHealthBar hp={boss_hp_pct} bossName="Dungeon Boss" />
      )}

      <RestTimer />

      {/* exercise list */}
      <div className="mt-4 space-y-2">
        {dungeon.exercises.map((ex) => (
          <div key={ex.id} className={`system-panel px-4 py-3 flex items-center gap-3 ${ex.is_boss ? 'system-panel--violet' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold truncate ${ex.is_boss ? 'text-violet-200' : 'text-white'}`}>{ex.name}</span>
                {ex.is_boss && <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold">BOSS</span>}
              </div>
              <div className="text-[11px] text-slate-500">
                {ex.sets_completed}/{ex.sets} sets · {ex.reps} reps · {ex.weight} kg
              </div>
              {/* per-set pips */}
              <div className="mt-1.5 flex gap-1">
                {Array.from({ length: ex.sets }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full ${i < ex.sets_completed ? 'w-6 bg-cyan-400' : 'w-6 bg-white/10'}`}
                    style={i < ex.sets_completed ? { boxShadow: '0 0 6px rgba(0,212,255,0.7)' } : {}}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={() => logSet(ex.id)}
              disabled={busy === ex.id || ex.sets_completed >= ex.sets}
              className="px-3 py-2 rounded-md bg-cyan-400/15 border border-cyan-400/40 font-display text-xs font-bold tracking-wider text-cyan-200 hover:bg-cyan-400/30 disabled:opacity-30 transition-all shrink-0"
            >
              {ex.sets_completed >= ex.sets ? 'DONE' : busy === ex.id ? '…' : `LOG SET ${ex.sets_completed + 1}`}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onExit} className="flex-1 py-3 rounded-md border border-white/15 font-display text-xs font-bold tracking-widest text-slate-400 hover:text-white transition-all">
          {dungeon.status === 'completed' ? 'CLOSE' : 'ABANDON'}
        </button>
        {dungeon.status === 'active' && (
          <button
            onClick={complete}
            className="flex-1 py-3 rounded-md bg-gradient-to-r from-cyan-500/40 to-violet-500/40 border border-cyan-400/50 font-display text-sm font-black tracking-widest text-white hover:from-cyan-500/60 hover:to-violet-500/60 transition-all"
            style={{ boxShadow: '0 0 20px rgba(0,212,255,0.25)' }}
          >
            ⚔ CLEAR DUNGEON
          </button>
        )}
      </div>
    </motion.div>
  )
}
