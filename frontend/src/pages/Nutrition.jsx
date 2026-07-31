import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { endpoints } from '../api/client.js'
import { useSystem } from '../context/SystemContext.jsx'
import { fmt } from '../utils/system.js'

const MACROS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: '#38bdf8' },
  { key: 'protein', label: 'Protein', unit: 'g', color: '#a78bfa' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: '#fbbf24' },
  { key: 'fat', label: 'Fat', unit: 'g', color: '#f472b6' },
]

export default function Nutrition() {
  const { refreshStats } = useSystem()
  const [data, setData] = useState(null)
  const [form, setForm] = useState({ calories: '', protein: '', carbs: '', fat: '', sleep_hours: '' })
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setData(await endpoints.nutritionToday())
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await endpoints.nutritionLog({
        calories: +form.calories || 0,
        protein: +form.protein || 0,
        carbs: +form.carbs || 0,
        fat: +form.fat || 0,
        sleep_hours: form.sleep_hours ? +form.sleep_hours : null,
      })
      setForm({ calories: '', protein: '', carbs: '', fat: '', sleep_hours: '' })
      await Promise.all([load(), refreshStats()])
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide text-white">NUTRITION</h1>
        <p className="text-slate-500 text-sm mt-1 tracking-wide">Fuel the System. Logging feeds your INT.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* targets vs actual */}
        <div className="system-panel p-5">
          <h3 className="font-display text-sm font-bold tracking-[0.25em] text-cyan-300 text-glow mb-4">TODAY'S FUEL</h3>
          <div className="space-y-4">
            {MACROS.map((m) => {
              const target = data?.targets?.[m.key] || 1
              const actual = data?.[m.key] || 0
              const pct = Math.min((actual / target) * 100, 100)
              const over = actual > target
              return (
                <div key={m.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">{m.label}</span>
                    <span className="tabular-nums">{fmt(actual)}/{fmt(target)} {m.unit}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${m.color}88, ${m.color})`, boxShadow: `0 0 10px ${m.color}66` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                    />
                  </div>
                  {over && <div className="text-[10px] text-amber-300/80 mt-0.5">Over target</div>}
                </div>
              )
            })}
            <div className="pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold">Sleep</span>
                <span className="tabular-nums text-violet-300">{data?.sleep_hours != null ? `${data.sleep_hours}h` : 'Not logged'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* log form */}
        <form onSubmit={submit} className="system-panel system-corners p-5">
          <h3 className="font-display text-sm font-bold tracking-[0.25em] text-violet-300 text-glow-violet mb-4">LOG INTAKE</h3>
          <div className="grid grid-cols-2 gap-3">
            {MACROS.map((m) => (
              <div key={m.key}>
                <label className="block text-[10px] tracking-[0.25em] text-slate-500 uppercase mb-1">{m.label} ({m.unit})</label>
                <input
                  type="number"
                  value={form[m.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [m.key]: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 focus:border-violet-400/50 outline-none text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-[10px] tracking-[0.25em] text-slate-500 uppercase mb-1">Sleep (hours)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={form.sleep_hours}
                onChange={(e) => setForm((f) => ({ ...f, sleep_hours: e.target.value }))}
                placeholder="7.5"
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 focus:border-violet-400/50 outline-none text-sm"
              />
            </div>
          </div>
          <button
            disabled={busy}
            className="mt-5 w-full py-2.5 rounded-md bg-gradient-to-r from-violet-600/40 to-fuchsia-600/40 border border-violet-400/40 font-display text-xs font-bold tracking-widest text-violet-100 hover:from-violet-600/60 hover:to-fuchsia-600/60 transition-all disabled:opacity-50"
          >
            {busy ? 'LOGGING…' : '✚ LOG MACROS'}
          </button>
          <p className="mt-3 text-[11px] text-slate-500">Logging consistently grants INT stat points. Sleep feeds SEN.</p>
        </form>
      </div>
    </div>
  )
}
