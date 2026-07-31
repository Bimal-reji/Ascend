import PlotlyChart from './PlotlyChart.jsx'
import { STATS } from '../utils/system.js'

const COLORS = ['#38bdf8', '#4ade80', '#f472b6', '#a78bfa', '#fbbf24', '#7df9ff']

export default function StatHistoryChart({ history }) {
  if (!history?.length) return null

  const dates = history.map((h) => h.date)
  const traces = STATS.map((s, i) => ({
    type: 'scatter',
    mode: 'lines+markers',
    name: s.label,
    x: dates,
    y: history.map((h) => h[s.key]),
    line: { color: COLORS[i], width: 2, shape: 'spline' },
    marker: { size: 4, color: COLORS[i] },
    hovertemplate: `${s.label}: %{y}<extra></extra>`,
  }))

  return (
    <PlotlyChart
      data={traces}
      layout={{
        margin: { l: 44, r: 12, t: 12, b: 34 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#94a3b8', family: 'Rajdhani, sans-serif' },
        xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zeroline: false },
        yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zeroline: false },
        legend: { orientation: 'h', y: 1.12, font: { size: 11 } },
        hovermode: 'x unified',
      }}
    />
  )
}
