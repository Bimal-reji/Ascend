import { AnimatePresence, motion } from 'framer-motion'
import { useSystem } from '../context/SystemContext.jsx'

/**
 * Full-screen "LEVEL UP" sequence — a holographic System burst that plays
 * whenever the reward queue contains levels_up > 0. This is a proper
 * cinematic component, not a toast.
 */
export default function LevelUpSequence({ levelsUp = 0, newLevel = 1 }) {
  const { rewardQueue } = useSystem()
  const shouldShow = levelsUp > 0 && rewardQueue.length > 0

  // particles for the burst
  const particles = Array.from({ length: 26 }, (_, i) => ({
    angle: (i / 26) * Math.PI * 2,
    dist: 120 + (i % 5) * 40,
    color: i % 3 === 0 ? '#8b5cf6' : i % 3 === 1 ? '#00d4ff' : '#38f9d7',
  }))

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="levelup"
          className="fixed inset-0 z-[75] grid place-items-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 1.6, duration: 0.5 } }}
        >
          {/* radial flash */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0], transition: { duration: 1.2, times: [0, 0.3, 1] } }}
            style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.4), transparent 60%)' }}
          />

          {/* ring shockwave */}
          <motion.div
            className="absolute w-40 h-40 rounded-full border-2 border-cyan-300"
            initial={{ scale: 0.3, opacity: 1 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />

          {/* particles */}
          {particles.map((p, i) => (
            <motion.span
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.dist,
                y: Math.sin(p.angle) * p.dist,
                opacity: 0,
                transition: { duration: 1.3, ease: 'easeOut' },
              }}
            />
          ))}

          <div className="relative text-center">
            <motion.div
              className="font-display font-black tracking-[0.35em] text-5xl md:text-7xl"
              style={{ color: '#7df9ff', textShadow: '0 0 30px rgba(0,212,255,0.9)' }}
              initial={{ scale: 2.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 14 }}
            >
              LEVEL UP
            </motion.div>
            <motion.div
              className="mt-3 font-display text-3xl font-bold text-cyan-200"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              {levelsUp > 1 ? `+${levelsUp} LEVELS` : ''}
            </motion.div>
            <motion.div
              className="mt-2 text-slate-300 font-semibold tracking-widest text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              NOW LEVEL <span className="font-display font-black text-4xl text-white align-middle mx-1">{newLevel}</span>
            </motion.div>
            <motion.div
              className="mt-4 text-[11px] tracking-[0.3em] text-cyan-400/70 uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              ▸ You have obtained the qualifications to be a Player ◂
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
