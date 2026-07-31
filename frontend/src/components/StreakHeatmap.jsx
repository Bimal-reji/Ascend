import { motion } from 'framer-motion'

/**
 * GitHub-style calendar heatmap of the last 84 days. Columns = weeks,
 * rows = Mon..Sun. Active days glow in the System blue.
 */
export default function StreakHeatmap({ days }) {
  if (!days?.length) return null

  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const maxIntensity = Math.max(...days.map((d) => d.intensity), 1)

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-1.5 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            {week.map((day) => {
              const level = day.intensity
              const active = day.active
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: wi * 0.02 + day.date.slice(-2) % 7 * 0.01 }}
                  title={`${day.date} — ${active ? 'activity' : 'no activity'}`}
                  className={`w-3.5 h-3.5 rounded-[3px] ${
                    active
                      ? 'bg-gradient-to-br from-cyan-400 to-violet-500'
                      : 'bg-white/[0.06]'
                  }`}
                  style={active ? { boxShadow: `0 0 8px rgba(0,212,255,${0.3 + 0.5 * (level / maxIntensity)})` } : {}}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
        <span>Less</span>
        {[0, 1, 2, 3].map((l) => (
          <span
            key={l}
            className="w-3 h-3 rounded-[3px]"
            style={{
              background: l === 0 ? 'rgba(255,255,255,0.06)' : `rgba(0,212,255,${0.25 + l * 0.2})`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
