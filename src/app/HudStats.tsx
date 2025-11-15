import { useMemo } from 'react'

import { selectSimulationElapsedMs, useSimulationStore } from '@stores'
import { useFrameRate } from '@/utils/useFrameRate'

const padTimeUnit = (value: number) => value.toString().padStart(2, '0')

const formatSimulationTime = (elapsedMs: number) => {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return '00:00:00'
  }

  const totalSeconds = Math.floor(elapsedMs / 1000)
  const seconds = totalSeconds % 60
  const minutes = Math.floor((totalSeconds / 60) % 60)
  const hours = Math.floor(totalSeconds / 3600)

  return `${padTimeUnit(hours)}:${padTimeUnit(minutes)}:${padTimeUnit(seconds)}`
}

const HudStats = () => {
  const elapsedMs = useSimulationStore(selectSimulationElapsedMs)
  const fps = useFrameRate()

  const formattedTime = useMemo(() => formatSimulationTime(elapsedMs), [elapsedMs])

  return (
    <div className="hud__stats" role="status" aria-live="polite" data-testid="hud-stats">
      <div className="hud__stat">
        <span className="hud__stat-label">FPS</span>
        <span className="hud__stat-value">{fps}</span>
      </div>
      <div className="hud__stat">
        <span className="hud__stat-label">Sim time</span>
        <span className="hud__stat-value">{formattedTime}</span>
      </div>
    </div>
  )
}

export default HudStats
