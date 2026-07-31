import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { endpoints } from '../api/client'

const SystemContext = createContext(null)

/**
 * Central player state + reward queue. Any mutation that returns a reward
 * payload can call `applyReward(payload)` — if it contains levels_up or a rank
 * change, the full-screen Level-Up / Rank-Up sequences fire automatically.
 */
export function SystemProvider({ children }) {
  const [stats, setStats] = useState(null)
  const [rewardQueue, setRewardQueue] = useState([])
  const timerRef = useRef(null)

  const refreshStats = useCallback(async () => {
    try {
      const s = await endpoints.stats()
      setStats(s)
      return s
    } catch {
      return null
    }
  }, [])

  const applyReward = useCallback((payload = {}) => {
    if (!payload) return
    setRewardQueue((q) => [...q, payload])
    refreshStats()
  }, [refreshStats])

  // dismiss rewards over time so the queue drains even if overlays are missed
  useEffect(() => {
    if (rewardQueue.length === 0) return
    timerRef.current = setTimeout(() => {
      setRewardQueue((q) => q.slice(1))
    }, 9000)
    return () => clearTimeout(timerRef.current)
  }, [rewardQueue])

  return (
    <SystemContext.Provider value={{ stats, rewardQueue, refreshStats, applyReward }}>
      {children}
    </SystemContext.Provider>
  )
}

export function useSystem() {
  return useContext(SystemContext)
}
