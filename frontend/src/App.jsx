import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { useSystem } from './context/SystemContext.jsx'
import SystemNav from './components/SystemNav.jsx'
import LevelUpSequence from './components/LevelUpSequence.jsx'
import RankUpSequence from './components/RankUpSequence.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Quests from './pages/Quests.jsx'
import Dungeons from './pages/Dungeons.jsx'
import Progress from './pages/Progress.jsx'
import Nutrition from './pages/Nutrition.jsx'
import Profile from './pages/Profile.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center text-cyan-300/60 font-display tracking-widest text-sm animate-pulse">INITIALIZING SYSTEM…</div>
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  const { stats, rewardQueue } = useSystem()

  const activeReward = rewardQueue[rewardQueue.length - 1] || null

  return (
    <div className="min-h-screen">
      <div className="system-backdrop" />
      {user && <SystemNav />}
      <main className={user ? 'pt-28 md:pt-20 pb-16 px-4 md:px-8 max-w-7xl mx-auto' : ''}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/quests" element={<Protected><Quests /></Protected>} />
          <Route path="/dungeons" element={<Protected><Dungeons /></Protected>} />
          <Route path="/progress" element={<Protected><Progress /></Protected>} />
          <Route path="/nutrition" element={<Protected><Nutrition /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Full-screen System sequences */}
      <LevelUpSequence
        levelsUp={activeReward?.levels_up || 0}
        newLevel={activeReward?.new_level || stats?.level || 1}
      />
      <RankUpSequence
        rankChanged={Boolean(activeReward?.rank_changed)}
        newRank={activeReward?.new_rank || stats?.rank || 'E'}
        oldRank={activeReward?.old_rank}
      />
    </div>
  )
}
