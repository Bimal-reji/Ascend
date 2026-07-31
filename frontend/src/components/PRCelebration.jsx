import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * "NEW PR" celebratory animation — triggered from reward payloads that
 * contain new_prs entries. A distinct flourish, not a toast.
 */
export default function PRCelebration({ prs }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (prs?.length) {
      setShow(true)
      const t = setTimeout(() => setShow(false), 3200)
      return () => clearTimeout(t)
    }
  }, [JSON.stringify(prs)])

  if (!prs?.length) return null

  const pieces = Array.from({ length: 30 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    color: ['#fbbf24', '#00d4ff', '#a78bfa', '#38f9d7', '#f472b6'][i % 5],
    dx: (Math.random() - 0.5) * 200,
    dy: -60 - Math.random() * 120,
  }))

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={`pr-${prs[0].exercise}`}
          className="fixed inset-0 z-[90] grid place-items-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {pieces.map((p, i) => (
            <motion.span
              key={i}
              className="absolute w-2 h-2 rounded-sm"
              style={{ left: `${p.left}%`, backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}
              initial={{ y: 0, opacity: 1 }}
              animate={{ x: p.dx, y: p.dy, opacity: 0, rotate: 360 }}
              transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
            />
          ))}

          <div className="relative text-center px-6 py-8 system-panel scanline-overlay" style={{ borderColor: 'rgba(251,191,36,0.5)', boxShadow: '0 0 40px rgba(251,191,36,0.3)' }}>
            <motion.div
              className="font-display font-black tracking-[0.3em] text-4xl md:text-6xl text-gold text-glow-gold"
              initial={{ scale: 1.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            >
              NEW PR
            </motion.div>
            {prs.map((p) => (
              <motion.div
                key={p.exercise}
                className="mt-3 text-white text-lg font-semibold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {p.exercise}: <span className="text-gold font-bold">{p.weight}kg × {p.reps}</span>
              </motion.div>
            ))}
            <div className="mt-2 text-[11px] tracking-[0.3em] text-amber-200/70 uppercase">Personal Record</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
