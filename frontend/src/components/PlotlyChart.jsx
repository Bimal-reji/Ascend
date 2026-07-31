import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'

/**
 * Minimal Plotly wrapper — renders newPlot into a div, purges on unmount.
 * Uses the dist-min build to keep the bundle lean.
 */
export default function PlotlyChart({ data, layout = {}, config = {}, style }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !data?.length) return
    Plotly.newPlot(ref.current, data, layout, {
      displayModeBar: false,
      responsive: true,
      ...config,
    })
    return () => Plotly.purge(ref.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), JSON.stringify(layout)])

  if (!data?.length) return null
  return <div ref={ref} style={{ width: '100%', height: '100%', ...style }} />
}
