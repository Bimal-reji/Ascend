import { useState } from 'react'
import { motion } from 'framer-motion'
import { endpoints } from '../api/client.js'

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S']

export default function CreateDungeonModal({ open, onClose, onCreated, suggestRank = 'E' }) {
  const [title, setTitle] = useState('')
  const [rank, setRank] = useState(suggestRank)
  const [exercises, setExercises] = useState([
    { name: '', sets: 3, reps: 10, weight: 0, is_boss: false },
  ])
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const updateExercise = (i, patch) => {
    setExercises((list) => list.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  }

  const addExercise = () => {
    setExercises((list) => [...list, { name: '', sets: 3, reps: 10, weight: 0, is_boss: false }])
  }

  const removeExercise = (i) => {
    setExercises((list) => list.filter((_, idx) => idx !== i))
  }

  const submit = async () => {
    const clean = exercises
      .filter((e) => e.name.trim())
      .map((e) => ({ ...e, name: e.name.trim() }))
    if (!title.trim() || clean.length === 0) {
      alert('Give the dungeon a title and at least one exercise.')
      return
    }
    setBusy(true)
    try {
      const dungeon = await endpoints.createDungeon({
        title: title.trim(),
        rank,
        exercises: clean,
      })
      onCreated?.(dungeon)
      onClose()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="system-panel system-corners p-6 w-full max-w-lg my-8"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg tracking-widest text-cyan-300 text-glow">ENTER A NEW DUNGEON</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dungeon title (e.g. Bench Cathedral)"
            className="w-full px-3 py-2.5 rounded bg-black/40 border border-white/10 focus:border-cyan-400/50 outline-none text-sm"
          />

          <div>
            <div className="text-[11px] tracking-[0.25em] text-slate-500 uppercase mb-1.5">Difficulty Rank</div>
            <div className="flex gap-2">
              {RANKS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRank(r)}
                  className={`w-10 h-10 rounded-md font-display font-bold border transition-all ${
                    rank === r
                      ? 'text-black bg-cyan-300 border-cyan-300 shadow-[0_0_14px_rgba(0,212,255,0.6)]'
                      : 'text-slate-400 border-white/10 hover:border-cyan-400/40'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* exercises */}
        <div className="mt-4 space-y-2">
          <div className="text-[11px] tracking-[0.25em] text-slate-500 uppercase">Exercises</div>
          {exercises.map((ex, i) => (
            <div key={i} className="grid grid-cols-[1fr_3.4rem_3.4rem_3.4rem_auto] gap-2 items-center rounded bg-white/[0.03] border border-white/5 p-2">
              <input
                value={ex.name}
                onChange={(e) => updateExercise(i, { name: e.target.value })}
                placeholder="Exercise"
                className="px-2 py-1.5 rounded bg-black/40 border border-white/10 text-sm outline-none focus:border-cyan-400/50"
              />
              <input type="number" value={ex.sets} min={1} onChange={(e) => updateExercise(i, { sets: +e.target.value || 1 })} placeholder="Sets" title="Sets" className="px-1 py-1.5 rounded bg-black/40 border border-white/10 text-sm text-center outline-none" />
              <input type="number" value={ex.reps} min={1} onChange={(e) => updateExercise(i, { reps: +e.target.value || 1 })} placeholder="Reps" title="Reps" className="px-1 py-1.5 rounded bg-black/40 border border-white/10 text-sm text-center outline-none" />
              <input type="number" value={ex.weight} min={0} onChange={(e) => updateExercise(i, { weight: +e.target.value || 0 })} placeholder="kg" title="Weight kg" className="px-1 py-1.5 rounded bg-black/40 border border-white/10 text-sm text-center outline-none" />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateExercise(i, { is_boss: !ex.is_boss })}
                  title="Mark as boss (hardest lift)"
                  className={`px-2 py-1.5 rounded text-xs font-bold border transition-all ${ex.is_boss ? 'bg-rose-500/30 border-rose-400/50 text-rose-200' : 'border-white/10 text-slate-500 hover:border-rose-400/40'}`}
                >
                  👹
                </button>
                {exercises.length > 1 && (
                  <button onClick={() => removeExercise(i)} className="text-slate-600 hover:text-rose-300">✕</button>
                )}
              </div>
            </div>
          ))}
          <button onClick={addExercise} className="text-xs font-semibold text-cyan-300/80 hover:text-cyan-200 tracking-wider">
            + Add Exercise
          </button>
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="mt-5 w-full py-2.5 rounded-md bg-gradient-to-r from-cyan-500/30 to-violet-500/30 border border-cyan-400/40 font-display font-bold tracking-widest text-cyan-100 hover:from-cyan-500/50 hover:to-violet-500/50 disabled:opacity-50 transition-all"
        >
          {busy ? 'GENERATING DUNGEON…' : '⚔ ENTER DUNGEON'}
        </button>
      </motion.div>
    </div>
  )
}
