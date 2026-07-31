import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { endpoints } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSystem } from '../context/SystemContext.jsx'
import HexagonChart from '../components/HexagonChart.jsx'
import LevelHUD from '../components/LevelHUD.jsx'
import DailyQuestCard from '../components/DailyQuestCard.jsx'
import PenaltyBanner from '../components/PenaltyBanner.jsx'
import { STATS } from '../utils/system.js'

export default function Dashboard() {
  const { user } = useAuth()
  const { stats, refreshStats } = useSystem()
  const [daily, setDaily] = useState(null)
  const [streak, setStreak] = useState(null)
  const [dungeons, setDungeons] = useState([])
  const [inventory, setInventory] = useState([])

  const load = async () => {
    const [d, s, dun, inv] = await Promise.all([
      endpoints.dailyQuest().catch(() => null),
      endpoints.streak().catch(() => null),
      endpoints.dungeons().catch(() => []),
      endpoints.inventory().catch(() => []),
    ])
    setDaily(d)
    setStreak(s)
    setDungeons(dun)
    setInventory(inv)
  }

  useEffect(() => {
    load()
    refreshStats()
  }, [])

  const activeDungeons = dungeons.filter((d) => d.status === 'active')

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide text-white">
          WELCOME, <span className="text-cyan-300 text-glow">{user?.email?.split('@')[0]?.toUpperCase()}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1 tracking-wide">The System monitors your progress, Hunter.</p>
      </motion.div>

      <PenaltyBanner active={daily?.penalty_active} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: HUD + hexagon */}
        <div className="lg:col-span-1 space-y-5">
          <LevelHUD stats={stats} />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="system-panel system-corners p-5 scanline-overlay"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-sm font-bold tracking-[0.25em] text-cyan-300 text-glow">PLAYER STATS</h3>
              <span className="text-[10px] text-slate-500 tracking-widest">HUNTER PROFILE</span>
            </div>
            {stats ? (
              <HexagonChart stats={stats} />
            ) : (
              <div className="h-[300px] grid place-items-center text-cyan-300/40 animate-pulse">…</div>
            )}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
              {STATS.map((s) => (
                <div key={s.key} className="flex justify-between text-xs">
                  <span className="text-slate-500">{s.label} — {s.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          <DailyQuestCard data={daily} onChanged={() => { load(); refreshStats() }} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* streak */}
            <div className="system-panel p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold tracking-[0.25em] text-violet-300 text-glow-violet">HUNTING STREAK</h3>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="mt-3 flex gap-6">
                <div>
                  <div className="font-display font-black text-4xl text-white">{streak?.current ?? 0}</div>
                  <div className="text-[10px] tracking-widest text-slate-500 uppercase">Current</div>
                </div>
                <div>
                  <div className="font-display font-black text-4xl text-violet-300">{streak?.best ?? 0}</div>
                  <div className="text-[10px] tracking-widest text-slate-500 uppercase">Best</div>
                </div>
              </div>
              <Link to="/progress" className="inline-block mt-3 text-xs text-cyan-300 hover:text-cyan-200 tracking-wider">View heatmap →</Link>
            </div>

            {/* active dungeons */}
            <div className="system-panel p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold tracking-[0.25em] text-cyan-300">ACTIVE DUNGEONS</h3>
                <Link to="/dungeons" className="text-xs text-cyan-300 hover:text-cyan-200">→</Link>
              </div>
              {activeDungeons.length === 0 ? (
                <div className="mt-4 text-sm text-slate-500">
                  No dungeon entered. <Link to="/dungeons" className="text-cyan-300 hover:underline">Enter one →</Link>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {activeDungeons.slice(0, 3).map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded bg-white/[0.03] border border-white/5 px-3 py-2">
                      <span className="text-sm text-slate-200 truncate">{d.title}</span>
                      <span className="text-[10px] font-display font-bold text-cyan-300">{d.rank}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* titles earned */}
          <div className="system-panel p-5">
            <h3 className="font-display text-sm font-bold tracking-[0.25em] text-slate-300">TITLES & BADGES</h3>
            {inventory.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No titles yet. Clear dungeons and hit milestones to earn them.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {inventory.slice(0, 10).map((t) => (
                  <span key={t.id} className={`px-2.5 py-1 rounded border text-xs font-bold ${t.kind === 'title' ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-violet-400/40 bg-violet-400/10 text-violet-200'}`}>
                    {t.kind === 'title' ? '◈' : '◆'} {t.name}
                  </span>
                ))}
                {inventory.length > 10 && <Link to="/profile" className="text-xs text-slate-500 self-center hover:text-cyan-300">+{inventory.length - 10} more</Link>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
