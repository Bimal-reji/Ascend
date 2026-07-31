import { useState } from 'react'
import { motion } from 'framer-motion'
import { endpoints } from '../api/client.js'
import { useSystem } from '../context/SystemContext.jsx'
import RewardCard from './RewardCard.jsx'
import PRCelebration from './PRCelebration.jsx'

const TARGET_META = {
  pushups: { label: 'Pushups', unit: 'reps', step: 5 },
  squats: { label: 'Squats', unit: 'reps', step: 5 },
  situps: { label: 'Situps', unit: 'reps', step: 5 },
  running_km: { label: 'Run', unit: 'km', step: 0.5 },
}

export default function DailyQuestCard({ data, onChanged }) {
  const { applyReward } = useSystem()
  const [busy, setBusy] = useState(null)
  const [customAmounts, setCustomAmounts] = useState({})
  const [reward, setReward] = useState(null)

  if (!data?.quest) return null
  const { quest, penalty_active, complete } = data

  const log = async (subtask, amount) => {
    setBusy(subtask)
    try {
      const res = await endpoints.logQuest(quest.id, { subtask, amount })
      if (res?.reward) {
        // daily quest completed — surface the reward card + level-up/rank-up
        setReward(res.reward)
        applyReward({ ...res.reward, source: 'quest', questTitle: 'Daily Quest' })
      }
      onChanged?.()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  const handleCustom = async (subtask) => {
    const amt = parseFloat(customAmounts[subtask])
    if (!amt || amt <= 0) return
    await log(subtask, amt)
    setCustomAmounts((c) => ({ ...c, [subtask]: '' }))
  }

  const pct = quest.status === 'completed'
    ? 100
    : Math.round(
        (Object.entries(quest.targets).filter(([k, t]) => (quest.progress?.[k] || 0) >= t).length /
          Object.keys(quest.targets).length) * 100
      )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`system-panel p-5 ${quest.status === 'completed' ? 'system-panel--violet' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] tracking-[0.3em] text-cyan-300/70 uppercase">Mandatory · Resets at Midnight</div>
          <h3 className="font-display text-lg font-bold tracking-wide mt-1 text-white">
            {quest.status === 'completed' ? '✓ DAILY QUEST CLEARED' : 'DAILY QUEST'}
          </h3>
        </div>
        <div className="text-right">
          <div className="font-display font-black text-2xl text-cyan-300 text-glow">{quest.reward_xp}</div>
          <div className="text-[10px] tracking-widest text-slate-500">XP REWARD</div>
        </div>
      </div>

      {/* progress bar */}
      <div className="mt-4 h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 to-violet-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          style={{ boxShadow: '0 0 10px rgba(0,212,255,0.5)' }}
        />
      </div>
      <div className="mt-1 text-right text-[11px] text-slate-500">{pct}%</div>

      {/* targets */}
      <div className="mt-3 space-y-2">
        {Object.entries(quest.targets).map(([key, target]) => {
          const meta = TARGET_META[key] || { label: key, unit: '' }
          const done = Math.min(quest.progress?.[key] || 0, target)
          const reached = done >= target
          const isRunning = key === 'running_km'
          return (
            <div key={key} className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${reached ? 'bg-emerald-400' : 'bg-cyan-400/40'}`} style={reached ? { boxShadow: '0 0 8px rgba(52,211,153,0.8)' } : {}} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm">
                  <span className={`font-semibold ${reached ? 'text-emerald-300 line-through' : 'text-slate-200'}`}>{meta.label}</span>
                  <span className="text-slate-400 tabular-nums">{isRunning ? done.toFixed(1) : done}/{target}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400/70 to-cyan-300/70"
                    style={{ width: `${Math.min((done / target) * 100, 100)}%` }}
                  />
                </div>
              </div>
              {!reached && quest.status !== 'completed' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    value={customAmounts[key] ?? ''}
                    onChange={(e) => setCustomAmounts((c) => ({ ...c, [key]: e.target.value }))}
                    placeholder={`+${meta.step}`}
                    className="w-16 px-2 py-1 rounded bg-black/40 border border-white/10 text-sm text-center focus:border-cyan-400/50 outline-none"
                  />
                  <button
                    onClick={() => (customAmounts[key] ? handleCustom(key) : log(key, meta.step))}
                    disabled={busy === key}
                    className="px-2.5 py-1 rounded bg-cyan-400/15 border border-cyan-400/30 text-xs font-bold text-cyan-200 hover:bg-cyan-400/25 disabled:opacity-50 transition-all"
                  >
                    {busy === key ? '…' : '+LOG'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        {quest.status === 'completed'
          ? 'Quest cleared — see you tomorrow, Hunter.'
          : complete
          ? 'All targets met — completing…'
          : 'The System demands its toll.'}
      </div>

      <RewardCard reward={reward} onClose={() => setReward(null)} />
      <PRCelebration prs={reward?.new_prs} />
    </motion.div>
  )
}
