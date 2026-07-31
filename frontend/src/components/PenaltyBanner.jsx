import { motion } from 'framer-motion'

/**
 * Penalty Zone banner — pure UI pressure for missing the daily quest.
 * Shows a menacing debuff state until today's quest is cleared.
 */
export default function PenaltyBanner({ active }) {
  if (!active) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative overflow-hidden rounded-lg border border-rose-500/50 bg-gradient-to-r from-rose-950/60 to-[#2a0510]/60 px-5 py-3 flex items-center gap-4"
      style={{ boxShadow: '0 0 24px rgba(255,59,92,0.25)' }}
    >
      <motion.span
        className="text-2xl"
        animate={{ rotate: [0, -12, 12, 0] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
      >
        🚫
      </motion.span>
      <div>
        <div className="font-display text-sm font-bold tracking-[0.2em] text-rose-300">PENALTY ZONE</div>
        <div className="text-[13px] text-rose-200/80 mt-0.5">
          You failed to clear the Daily Quest. Complete today's objectives to lift the debuff.
        </div>
      </div>
      <motion.div
        className="ml-auto hidden md:block text-2xl"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
      >
        ⚠️
      </motion.div>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,59,92,0.06) 2px, rgba(255,59,92,0.06) 4px)' }} />
    </motion.div>
  )
}
