import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { endpoints } from '../api/client.js'
import StatHistoryChart from '../components/StatHistoryChart.jsx'
import VolumeChart from '../components/VolumeChart.jsx'
import StreakHeatmap from '../components/StreakHeatmap.jsx'
import { fmt } from '../utils/system.js'

export default function Progress() {
  const [history, setHistory] = useState([])
  const [volume, setVolume] = useState([])
  const [streak, setStreak] = useState(null)
  const [prs, setPrs] = useState([])

  useEffect(() => {
    Promise.all([
      endpoints.statsHistory(),
      endpoints.volume(),
      endpoints.streak(),
      endpoints.prs(),
    ]).then(([h, v, s, p]) => {
      setHistory(h)
      setVolume(v)
      setStreak(s)
      setPrs(p)
    }).catch(() => {})
  }, [])

  const totalVolume = volume.reduce((a, v) => a + v.volume, 0)

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide text-white">PROGRESS</h1>
        <p className="text-slate-500 text-sm mt-1 tracking-wide">Growth is measured. The System never forgets.</p>
      </motion.div>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="system-panel p-4">
          <div className="text-[10px] tracking-[0.25em] text-slate-500 uppercase">Total Volume</div>
          <div className="font-display font-black text-2xl text-cyan-300 mt-1">{fmt(totalVolume)} <span className="text-xs text-slate-500">kg</span></div>
        </div>
        <div className="system-panel p-4">
          <div className="text-[10px] tracking-[0.25em] text-slate-500 uppercase">Current Streak</div>
          <div className="font-display font-black text-2xl text-violet-300 mt-1">{streak?.current ?? 0} <span className="text-xs text-slate-500">days</span></div>
        </div>
        <div className="system-panel p-4">
          <div className="text-[10px] tracking-[0.25em] text-slate-500 uppercase">Best Streak</div>
          <div className="font-display font-black text-2xl text-emerald-300 mt-1">{streak?.best ?? 0} <span className="text-xs text-slate-500">days</span></div>
        </div>
        <div className="system-panel p-4">
          <div className="text-[10px] tracking-[0.25em] text-slate-500 uppercase">Personal Records</div>
          <div className="font-display font-black text-2xl text-gold mt-1">{prs.length} <span className="text-xs text-slate-500">PRs</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="system-panel p-5">
          <h3 className="font-display text-sm font-bold tracking-[0.25em] text-cyan-300 text-glow mb-3">STAT GROWTH</h3>
          <div className="h-[320px]">
            <StatHistoryChart history={history} />
          </div>
        </div>
        <div className="system-panel p-5">
          <h3 className="font-display text-sm font-bold tracking-[0.25em] text-violet-300 text-glow-violet mb-3">WEEKLY VOLUME BY MUSCLE</h3>
          <div className="h-[320px]">
            <VolumeChart volume={volume} />
          </div>
        </div>
      </div>

      <div className="system-panel p-5">
        <h3 className="font-display text-sm font-bold tracking-[0.25em] text-emerald-300 mb-3">HUNTING STREAK — LAST 12 WEEKS</h3>
        <StreakHeatmap days={streak?.days} />
      </div>

      <div className="system-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-bold tracking-[0.25em] text-gold">PERSONAL RECORDS</h3>
        </div>
        {prs.length === 0 ? (
          <p className="text-sm text-slate-500">No PRs yet. Lift heavy to etch your name into the System.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {prs.map((p) => (
              <div key={p.exercise_name} className="flex items-center justify-between rounded bg-white/[0.03] border border-white/5 px-4 py-3">
                <div>
                  <div className="font-semibold text-white">{p.exercise_name}</div>
                  <div className="text-[11px] text-slate-500">{new Date(p.achieved_at).toLocaleDateString()}</div>
                </div>
                <div className="text-gold font-display font-black text-lg">{p.weight}kg <span className="text-xs text-slate-500">×{p.reps}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
