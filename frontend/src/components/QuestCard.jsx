import { motion } from 'framer-motion'
import { endpoints } from '../api/client.js'

export default function QuestCard({ quest, onChanged, onReward }) {

  const complete = async () => {
    try {
      const reward = await endpoints.completeQuest(quest.id)
      onReward?.({ ...reward, source: 'quest', questTitle: quest.title })
      onChanged?.()
    } catch (e) {
      alert(e.message)
    }
  }

  const firstTarget = Object.entries(quest.targets || {})[0] || ['reps', 50]
  const [tKey, tVal] = firstTarget
  const done = quest.progress?.[tKey] || 0
  const pct = Math.min((done / tVal) * 100, 100)

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="system-panel p-4 flex flex-col"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.25em] text-violet-300/70 uppercase">Custom Quest</span>
        <span className="text-[11px] font-bold text-violet-300">+{quest.reward_xp} XP</span>
      </div>
      <h4 className="font-semibold text-white mt-1.5 leading-snug">{quest.title}</h4>
      {quest.description && <p className="text-[13px] text-slate-400 mt-1 line-clamp-2">{quest.description}</p>}

      <div className="mt-3 flex items-center justify-between text-[12px] text-slate-400">
        <span>Progress</span>
        <span className="tabular-nums">{done}/{tVal}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          style={{ boxShadow: '0 0 10px rgba(139,92,246,0.6)' }}
        />
      </div>

      <button
        onClick={complete}
        disabled={quest.status === 'completed'}
        className="mt-4 py-2 rounded-md bg-gradient-to-r from-violet-600/40 to-fuchsia-600/40 border border-violet-400/30 font-display text-xs font-bold tracking-widest text-violet-100 hover:from-violet-600/60 hover:to-fuchsia-600/60 transition-all disabled:opacity-40"
      >
        {quest.status === 'completed' ? '✓ COMPLETE' : 'COMPLETE QUEST'}
      </button>
    </motion.div>
  )
}
