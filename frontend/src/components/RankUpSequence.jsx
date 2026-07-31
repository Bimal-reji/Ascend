import { AnimatePresence, motion } from 'framer-motion'
import { rankColor, rankGlow } from '../utils/system.js'

/**
 * Rank-up full-screen sequence — plays when a reward payload contains
 * rank_changed. Dramatically different from a toast: full screen, glowing
 * rank emblem, scanlines, System wording.
 */
export default function RankUpSequence({ rankChanged = false, newRank = 'E', oldRank = 'E' }) {
  const rc = rankColor(newRank)
  const glow = rankGlow(newRank)

  return (
    <AnimatePresence>
      {rankChanged && (
        <motion.div
          key={`rankup-${newRank}`}
          className="fixed inset-0 z-[85] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 2.6, duration: 0.8 } }}
          style={{ background: 'rgba(2,4,12,0.94)', backdropFilter: 'blur(4px)' }}
        >
          {/* scanline sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,212,255,0.12), transparent)', height: '40%' }}
            initial={{ top: '-40%' }}
            animate={{ top: '100%' }}
            transition={{ duration: 1.4, ease: 'linear' }}
          />

          {/* expanding glow circle */}
          <motion.div
            className="absolute w-[420px] h-[420px] rounded-full"
            style={{ boxShadow: `0 0 120px ${glow}` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: [0, 0.9, 0.5] }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          />

          <div className="relative text-center px-6">
            <motion.div
              className="text-[12px] tracking-[0.45em] text-slate-400 uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Rank Up
            </motion.div>

            <motion.div
              initial={{ scale: 2.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.55 }}
              className="mt-4"
            >
              <div
                className="font-display font-black text-[120px] md:text-[160px] leading-none"
                style={{ color: rc, textShadow: `0 0 40px ${glow}, 0 0 90px ${glow}` }}
              >
                {newRank === 'National Level' ? 'NL' : newRank}
              </div>
              <div className="mt-1 font-display text-[11px] tracking-[0.4em] text-slate-400">
                {newRank === 'National Level' ? 'NATIONAL LEVEL HUNTER' : `${newRank}-RANK HUNTER`}
              </div>
            </motion.div>

            <motion.div
              className="mt-8 max-w-md mx-auto text-slate-200 font-semibold text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              {newRank === 'S'
                ? 'You have obtained the qualifications of a Monarch-grade Hunter.'
                : newRank === 'National Level'
                ? 'The System acknowledges a force that transcends all ranks. The world will remember your name.'
                : 'You have obtained the qualifications to be a Player.'}
            </motion.div>

            <motion.div
              className="mt-4 text-[11px] tracking-[0.3em] text-cyan-300/70 uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              {oldRank} → {newRank}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
