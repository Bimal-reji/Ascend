import PlotlyChart from './PlotlyChart.jsx'

const MUSCLE_COLORS = {
  Chest: '#38bdf8',
  Back: '#a78bfa',
  Legs: '#4ade80',
  Shoulders: '#fbbf24',
  Arms: '#f472b6',
  Core: '#22d3ee',
  Cardio: '#fb7185',
  Other: '#64748b',
}

export default function VolumeChart({ volume }) {
  if (!volume?.length) return null

  // group by week
  const byWeek = {}
  for (const v of volume) {
    if (!byWeek[v.week]) byWeek[v.week] = {}
    byWeek[v.week][v.muscle] = (byWeek[v.week][v.muscle] || 0) + v.volume
  }
  const weeks = Object.keys(byWeek).sort()
  const muscles = [...new Set(volume.map((v) => v.muscle))]

  const traces = muscles.map((m) => ({
    type: 'bar',
    name: m,
    x: weeks,
    y: weeks.map((w) => Math.round(byWeek[w][m] || 0)),
    marker: { color: MUSCLE_COLORS[m] || '#64748b' },
    hovertemplate: `${m}: %{y}kg<extra></extra>`,
  }))

  return (
    <PlotlyChart
      data={traces}
      layout={{
        barmode: 'stack',
        margin: { l: 50, r: 12, t: 12, b: 34 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#94a3b8', family: 'Rajdhani, sans-serif' },
        xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zeroline: false },
        yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zeroline: false, title: 'kg' },
        legend: { orientation: 'h', y: 1.12, font: { size: 11 } },
        hovermode: 'x unified',
      }}
    />
  )
}
