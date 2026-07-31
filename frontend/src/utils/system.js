export const STATS = [
  { key: 'str', label: 'STR', full: 'Strength', desc: 'Weight-lifted volume' },
  { key: 'vit', label: 'VIT', full: 'Vitality', desc: 'Consistency & cardio' },
  { key: 'agi', label: 'AGI', full: 'Agility', desc: 'HIIT / sprint / mobility' },
  { key: 'per', label: 'PER', full: 'Perception', desc: 'Logging discipline & form' },
  { key: 'int', label: 'INT', full: 'Intelligence', desc: 'Nutrition & study' },
  { key: 'sen', label: 'SEN', full: 'Sense', desc: 'Sleep & streak recovery' },
]

export function rankColor(rank) {
  switch (rank) {
    case 'E': return '#94a3b8'
    case 'D': return '#4ade80'
    case 'C': return '#38bdf8'
    case 'B': return '#a78bfa'
    case 'A': return '#f472b6'
    case 'S': return '#fbbf24'
    case 'National Level': return '#f97316'
    default: return '#94a3b8'
  }
}

export function rankGlow(rank) {
  switch (rank) {
    case 'E': return 'rgba(148,163,184,0.5)'
    case 'D': return 'rgba(74,222,128,0.5)'
    case 'C': return 'rgba(56,189,248,0.5)'
    case 'B': return 'rgba(167,139,250,0.5)'
    case 'A': return 'rgba(244,114,182,0.5)'
    case 'S': return 'rgba(251,191,36,0.5)'
    case 'National Level': return 'rgba(249,115,22,0.6)'
    default: return 'rgba(148,163,184,0.5)'
  }
}

export const fmt = (n, d = 0) =>
  n == null ? '0' : n.toLocaleString('en-US', { maximumFractionDigits: d })

export function statGainKeys(payload) {
  // returns list of {key, label, value} for non-zero stat gains
  return STATS
    .map((s) => ({ ...s, value: payload?.stat_points?.[s.key] || 0 }))
    .filter((s) => s.value > 0)
}
