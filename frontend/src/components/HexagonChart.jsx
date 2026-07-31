import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { STATS } from '../utils/system.js'

/**
 * The signature Solo Leveling stat hexagon — a 6-axis holographic radar chart
 * rendered as SVG with glowing grid rings, animated stat polygon, and per-axis
 * value readouts. No bar charts here.
 */
export default function HexagonChart({ stats, size = 340 }) {
  const cx = size / 2
  const cy = size / 2
  const R = size / 2 - 56 // outer ring radius
  const max = useMemo(() => Math.max(...STATS.map((s) => stats?.[s.key] || 0), 10) * 1.15, [stats])

  const angle = (i) => (Math.PI * 2 * i) / STATS.length - Math.PI / 2
  const point = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]

  // hexagon rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1].map((f) => {
    const pts = STATS.map((_, i) => point(i, R * f).join(',')).join(' ')
    return { f, pts }
  })

  const axes = STATS.map((_, i) => {
    const [x, y] = point(i, R)
    const [lblX, lblY] = point(i, R + 26)
    return { i, x, y, lblX, lblY }
  })

  // player polygon
  const playerPts = STATS.map((s, i) => point(i, R * (Math.min(stats?.[s.key] || 0, max) / max)))
  const playerPoints = playerPts.map((p) => p.join(',')).join(' ')

  // background blur polygon for the glow
  const glowPoints = playerPts.map((p) => p.join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto" role="img" aria-label="Player stats hexagon">
      <defs>
        <filter id="hex-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="hex-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="hex-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7df9ff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* grid rings */}
      {rings.map((r) => (
        <polygon
          key={r.f}
          points={r.pts}
          fill="none"
          stroke={r.f === 1 ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.16)'}
          strokeWidth={r.f === 1 ? 1.4 : 1}
        />
      ))}

      {/* axis lines */}
      {axes.map((a) => (
        <line
          key={a.i}
          x1={cx}
          y1={cy}
          x2={a.x}
          y2={a.y}
          stroke="rgba(0,212,255,0.22)"
          strokeWidth="1"
        />
      ))}

      {/* player stat polygon — animated draw */}
      <motion.polygon
        points={glowPoints}
        fill="none"
        stroke="#00d4ff"
        strokeWidth="2"
        filter="url(#hex-glow)"
        style={{ opacity: 0.6 }}
      />
      <motion.polygon
        points={playerPoints}
        fill="url(#hex-fill)"
        stroke="url(#hex-stroke)"
        strokeWidth="2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 60, damping: 14, duration: 0.8 }}
      />

      {/* vertex dots + labels */}
      {STATS.map((s, i) => {
        const [vx, vy] = point(i, R * (Math.min(stats?.[s.key] || 0, max) / max))
        const { lblX, lblY } = axes[i]
        return (
          <g key={s.key}>
            <circle cx={vx} cy={vy} r="3.5" fill="#7df9ff" filter="url(#hex-glow)" />
            <text x={lblX} y={lblY} textAnchor="middle" fontSize="11" fill="#38bdf8" fontWeight="700" fontFamily="Orbitron, sans-serif" letterSpacing="2">
              {s.label}
            </text>
            <text x={lblX} y={lblY + 15} textAnchor="middle" fontSize="12" fill="#e2e8f0" fontWeight="600" fontFamily="Rajdhani, sans-serif">
              {stats?.[s.key]?.toFixed(1) ?? '1.0'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
