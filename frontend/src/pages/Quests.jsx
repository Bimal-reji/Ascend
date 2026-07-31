import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { endpoints } from '../api/client.js'
import { useSystem } from '../context/SystemContext.jsx'
import DailyQuestCard from '../components/DailyQuestCard.jsx'
import PenaltyBanner from '../components/PenaltyBanner.jsx'
import QuestCard from '../components/QuestCard.jsx'
import RewardCard from '../components/RewardCard.jsx'
import PRCelebration from '../components/PRCelebration.jsx'

export default function Quests() {
  const { refreshStats, applyReward } = useSystem()
  const [daily, setDaily] = useState(null)
  const [quests, setQuests] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [xp, setXp] = useState(50)
  const [reward, setReward] = useState(null)

  const load = async () => {
    const [d, q] = await Promise.all([endpoints.dailyQuest(), endpoints.quests()])
    setDaily(d)
    setQuests(q)
  }

  useEffect(() => {
    load()
  }, [])

  const handleReward = (r) => {
    if (r?.new_prs?.length) setReward(r)
    if (r?.unlocked?.length || r?.xp_gained) setReward(r)
    applyReward(r)
    refreshStats()
    load()
  }

  const createQuest = async () => {
    if (!title.trim() || !target.trim()) return
    const val = parseFloat(target)
    if (!val || val <= 0) return
    try {
      await endpoints.createQuest({ title: title.trim(), targets: { reps: val }, reward_xp: xp })
      setShowCreate(false)
      setTitle('')
      setTarget('')
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide text-white">QUESTS</h1>
          <p className="text-slate-500 text-sm mt-1 tracking-wide">The System assigns your obligations.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-md bg-gradient-to-r from-violet-600/40 to-fuchsia-600/40 border border-violet-400/30 font-display text-xs font-bold tracking-widest text-violet-100 hover:from-violet-600/60 hover:to-fuchsia-600/60 transition-all"
        >
          + NEW QUEST
        </button>
      </motion.div>

      <PenaltyBanner active={daily?.penalty_active} />

      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="system-panel p-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_8rem_7rem_auto] gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quest title — e.g. 'Study 30 min'" className="px-3 py-2.5 rounded bg-black/40 border border-white/10 focus:border-violet-400/50 outline-none text-sm" />
            <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target" className="px-3 py-2.5 rounded bg-black/40 border border-white/10 focus:border-violet-400/50 outline-none text-sm text-center" />
            <input type="number" value={xp} onChange={(e) => setXp(+e.target.value || 50)} placeholder="XP" className="px-3 py-2.5 rounded bg-black/40 border border-white/10 focus:border-violet-400/50 outline-none text-sm text-center" />
            <button onClick={createQuest} className="px-4 py-2 rounded-md bg-violet-500/30 border border-violet-400/40 font-display text-xs font-bold tracking-widest text-violet-100 hover:bg-violet-500/50 transition-all">CREATE</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DailyQuestCard data={daily} onChanged={() => { load(); refreshStats() }} />
        <div className="space-y-3">
          {quests.filter((q) => q.type === 'custom').length === 0 ? (
            <div className="system-panel p-8 text-center text-slate-500">
              <div className="text-3xl mb-2">❖</div>
              No custom quests yet. The System awaits your decree.
            </div>
          ) : (
            quests.filter((q) => q.type === 'custom').map((q) => (
              <QuestCard key={q.id} quest={q} onChanged={() => { load(); refreshStats() }} onReward={handleReward} />
            ))
          )}
        </div>
      </div>

      <RewardCard reward={reward} onClose={() => setReward(null)} />
      <PRCelebration prs={reward?.new_prs} />
    </div>
  )
}
