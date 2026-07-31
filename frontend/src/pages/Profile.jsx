import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { endpoints } from '../api/client.js'
import { useSystem } from '../context/SystemContext.jsx'
import HexagonChart from '../components/HexagonChart.jsx'
import { STATS, rankColor } from '../utils/system.js'

export default function Profile() {
  const { stats } = useSystem()
  const [inventory, setInventory] = useState([])

  useEffect(() => {
    endpoints.inventory().then(setInventory).catch(() => {})
  }, [])

  const titles = inventory.filter((t) => t.kind === 'title')
  const badges = inventory.filter((t) => t.kind === 'badge')

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide text-white">HUNTER PROFILE</h1>
        <p className="text-slate-500 text-sm mt-1 tracking-wide">The System's record of your awakening.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* stat sheet */}
        <div className="lg:col-span-1 system-panel system-corners p-5 scanline-overlay">
          <h3 className="font-display text-sm font-bold tracking-[0.25em] text-cyan-300 text-glow mb-2">STAT SHEET</h3>
          {stats ? (
            <>
              <HexagonChart stats={stats} size={300} />
              <div className="mt-2 space-y-2">
                {STATS.map((s) => (
                  <div key={s.key} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 font-semibold">{s.label}</span>
                    <span className="tabular-nums text-white font-bold">{stats[s.key]?.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] grid place-items-center text-cyan-300/40 animate-pulse">…</div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          {/* current rank banner */}
          <div className="system-panel p-6 flex items-center gap-6" style={{ borderColor: stats ? `${rankColor(stats.rank)}44` : undefined }}>
            <div
              className="w-20 h-20 grid place-items-center rounded-full font-display font-black text-4xl shrink-0"
              style={stats ? { color: rankColor(stats.rank), border: `3px solid ${rankColor(stats.rank)}`, boxShadow: `0 0 30px ${rankColor(stats.rank)}66` } : {}}
            >
              {stats?.rank === 'National Level' ? 'NL' : stats?.rank}
            </div>
            <div>
              <div className="text-[11px] tracking-[0.3em] text-slate-500 uppercase">Current Rank</div>
              <div className="font-display text-2xl font-bold text-white mt-1">
                {stats?.rank} RANK HUNTER
              </div>
              <div className="text-sm text-slate-400 mt-1">
                Level {stats?.level} · {stats?.xp} XP
                {stats?.next_rank && <span className="text-slate-500"> · next: {stats.next_rank}</span>}
              </div>
            </div>
          </div>

          {/* titles */}
          <div className="system-panel p-5">
            <h3 className="font-display text-sm font-bold tracking-[0.25em] text-cyan-300 mb-3">◈ TITLES</h3>
            {titles.length === 0 ? (
              <p className="text-sm text-slate-500">None yet. Reach level and rank milestones to claim titles.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {titles.map((t) => (
                  <span key={t.id} className="px-3 py-1.5 rounded border border-cyan-400/40 bg-cyan-400/10 text-sm font-bold text-cyan-200">
                    ◈ {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* badges */}
          <div className="system-panel p-5">
            <h3 className="font-display text-sm font-bold tracking-[0.25em] text-violet-300 mb-3">◆ INVENTORY — BADGES</h3>
            {badges.length === 0 ? (
              <p className="text-sm text-slate-500">No badges yet. Streaks, PRs, dungeon clears and milestones earn them.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {badges.map((b) => (
                  <motion.div
                    key={b.id}
                    whileHover={{ y: -2 }}
                    className="rounded border border-violet-400/30 bg-violet-400/5 px-3 py-2 text-center"
                  >
                    <div className="text-lg">◆</div>
                    <div className="text-xs font-bold text-violet-200 mt-1">{b.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{new Date(b.unlocked_at).toLocaleDateString()}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* lifetime stats */}
          {stats && (
            <div className="system-panel p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-[10px] tracking-[0.25em] text-slate-500 uppercase">Dungeons Cleared</div>
                <div className="font-display font-black text-2xl text-cyan-300">{stats.dungeons_cleared}</div>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.25em] text-slate-500 uppercase">Quests Done</div>
                <div className="font-display font-black text-2xl text-violet-300">{stats.quests_completed}</div>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.25em] text-slate-500 uppercase">Total Volume</div>
                <div className="font-display font-black text-2xl text-emerald-300">{Math.round(stats.total_volume).toLocaleString()} kg</div>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.25em] text-slate-500 uppercase">PRs</div>
                <div className="font-display font-black text-2xl text-gold">{stats.prs}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
