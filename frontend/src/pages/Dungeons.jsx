import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { endpoints } from '../api/client.js'
import { useSystem } from '../context/SystemContext.jsx'
import DungeonCard from '../components/DungeonCard.jsx'
import CreateDungeonModal from '../components/CreateDungeonModal.jsx'
import LiveSession from '../components/LiveSession.jsx'
import RewardCard from '../components/RewardCard.jsx'
import PRCelebration from '../components/PRCelebration.jsx'

export default function Dungeons() {
  const { stats, refreshStats } = useSystem()
  const [dungeons, setDungeons] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [live, setLive] = useState(null) // dungeon id of active session
  const [reward, setReward] = useState(null)

  const load = async () => {
    setDungeons(await endpoints.dungeons())
  }

  useEffect(() => {
    load()
  }, [])

  const active = dungeons.filter((d) => d.status === 'active')
  const completed = dungeons.filter((d) => d.status === 'completed')

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide text-white">DUNGEONS</h1>
          <p className="text-slate-500 text-sm mt-1 tracking-wide">Every workout is a raid. Defeat the boss, take the loot.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-md bg-gradient-to-r from-cyan-500/40 to-violet-500/40 border border-cyan-400/40 font-display text-xs font-bold tracking-widest text-cyan-100 hover:from-cyan-500/60 hover:to-violet-500/60 transition-all"
          style={{ boxShadow: '0 0 16px rgba(0,212,255,0.2)' }}
        >
          ⚔ ENTER DUNGEON
        </button>
      </motion.div>

      {live && (
        <LiveSession
          dungeonId={live}
          onExit={() => { setLive(null); load() }}
          onReward={(r) => setReward(r)}
        />
      )}

      {!live && (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-bold tracking-[0.25em] text-cyan-300 text-glow mb-3">IN PROGRESS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {active.map((d) => (
                  <DungeonCard key={d.id} dungeon={d} onResume={setLive} onEnter={setLive} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-sm font-bold tracking-[0.25em] text-slate-300 mb-3">
              {active.length > 0 ? 'CLEARED' : 'ALL DUNGEONS'}
            </h2>
            {dungeons.length === 0 ? (
              <div className="system-panel p-10 text-center text-slate-500">
                <div className="text-4xl mb-3">▲</div>
                No dungeons yet. The gates are open — enter your first workout.
                {stats && <div className="mt-2 text-xs text-cyan-300/70">Recommended difficulty: {stats.rank}</div>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(completed.length ? completed : dungeons).map((d) => (
                  <DungeonCard key={d.id} dungeon={d} onResume={setLive} onEnter={setLive} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <CreateDungeonModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        suggestRank={stats?.rank || 'E'}
        onCreated={() => load()}
      />
      <RewardCard reward={reward} onClose={() => setReward(null)} />
      <PRCelebration prs={reward?.new_prs} />
    </div>
  )
}
