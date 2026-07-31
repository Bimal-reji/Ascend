import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { useSystem } from '../context/SystemContext.jsx'
import { rankColor } from '../utils/system.js'

const links = [
  { to: '/', label: 'DASHBOARD', icon: '⬡' },
  { to: '/quests', label: 'QUESTS', icon: '❖' },
  { to: '/dungeons', label: 'DUNGEONS', icon: '▲' },
  { to: '/progress', label: 'PROGRESS', icon: '◔' },
  { to: '/nutrition', label: 'NUTRITION', icon: '✚' },
  { to: '/profile', label: 'PROFILE', icon: '☰' },
]

export default function SystemNav() {
  const { logout } = useAuth()
  const { stats } = useSystem()
  const navigate = useNavigate()
  const rc = rankColor(stats?.rank)

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      className="fixed top-0 left-0 right-0 z-40 border-b border-cyan-400/20 bg-[#05060f]/85 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-display text-lg font-bold tracking-widest text-cyan-300 text-glow"
        >
          <span className="text-xl">⬢</span> ASCEND
        </button>

        <nav className="hidden md:flex items-center gap-1 flex-1 ml-6">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-semibold tracking-wider transition-all ${
                  isActive
                    ? 'text-cyan-200 bg-cyan-400/10 shadow-[0_0_12px_rgba(0,212,255,0.25)]'
                    : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-400/5'
                }`
              }
            >
              {l.icon} {l.label}
            </NavLink>
          ))}
        </nav>

        {/* mobile nav — horizontal scroll strip under the header bar */}
        <nav className="md:hidden fixed top-16 left-0 right-0 z-30 flex gap-1 overflow-x-auto px-4 py-2 bg-[#05060f]/90 backdrop-blur-md border-b border-cyan-400/10">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `shrink-0 px-3 py-1 rounded-md text-xs font-semibold tracking-wider transition-all ${
                  isActive
                    ? 'text-cyan-200 bg-cyan-400/10 shadow-[0_0_12px_rgba(0,212,255,0.25)]'
                    : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-400/5'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-white/10 bg-white/5">
              <span className="font-display font-black text-xs" style={{ color: rc }}>{stats.rank}</span>
              <span className="text-[10px] text-slate-400 font-display">LV.{stats.level}</span>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/auth') }}
            className="px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-400/40 transition-all"
          >
            EXIT
          </button>
        </div>
      </div>
    </motion.header>
  )
}
