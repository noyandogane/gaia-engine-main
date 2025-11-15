import { useMemo } from 'react'

import {
  selectSimulationRunning,
  selectSimulationSpeed,
  selectSimulationSpeeds,
  useSimulationStore,
} from '@stores'

const resolveActiveSpeedLabel = (speed: number, labels: ReadonlyArray<{ label: string; multiplier: number }>) => {
  const match = labels.find((option) => option.multiplier === speed)
  return match?.label ?? `${speed}x`
}

const SimulationControls = () => {
  const running = useSimulationStore(selectSimulationRunning)
  const speed = useSimulationStore(selectSimulationSpeed)
  const speeds = useSimulationStore(selectSimulationSpeeds)
  const play = useSimulationStore((state) => state.play)
  const pause = useSimulationStore((state) => state.pause)
  const setSpeedMultiplier = useSimulationStore((state) => state.setSpeed)

  const activeSpeedLabel = useMemo(() => resolveActiveSpeedLabel(speed, speeds), [speed, speeds])

  const handleToggle = () => {
    if (running) {
      pause()
      return
    }

    play()
  }

  const handleSpeedChange = (multiplier: number) => {
    if (speed === multiplier && running) {
      return
    }

    setSpeedMultiplier(multiplier)

    if (!running) {
      play()
    }
  }

  return (
    <section className="hud__time-controls" aria-label="Simulation time controls" data-testid="simulation-controls">
      <div className="hud__time-primary">
        <button
          type="button"
          className="hud__time-toggle"
          data-running={running}
          onClick={handleToggle}
          aria-pressed={running}
          aria-label={running ? 'Pause simulation' : 'Resume simulation'}
        >
          {running ? 'Pause' : 'Play'}
        </button>

        <span className="hud__time-status" role="status">
          {running ? 'Running' : 'Paused'} · {activeSpeedLabel}
        </span>
      </div>

      <div className="hud__time-speeds" role="group" aria-label="Simulation speed multipliers">
        {speeds.map((option) => {
          const isActive = speed === option.multiplier

          return (
            <button
              key={option.label}
              type="button"
              className="hud__time-speed"
              data-active={isActive}
              onClick={() => handleSpeedChange(option.multiplier)}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default SimulationControls
