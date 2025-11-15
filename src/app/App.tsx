import { useEffect, useMemo, useRef, useState } from 'react'

import './app.css'

import { createPlanetScene, PlanetSceneController } from '@render'
import {
  createTickScheduler,
  DEFAULT_SIMULATION_SPEEDS,
  findMostRecentValidSaveSlot,
  loadPlanetSaveSlot,
} from '@sim'
import {
  selectCameraSettings,
  selectLoadLastSaveOnStartup,
  useCameraStore,
  usePlanetStore,
  useSettingsStore,
  useSimulationStore,
} from '@stores'

import CameraControls from './CameraControls'
import ClimateControls from './ClimateControls'
import HudStats from './HudStats'
import NotificationCenter from './NotificationCenter'
import SimulationControls from './SimulationControls'
import TerrainControls from './TerrainControls'

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sceneController, setSceneController] = useState<PlanetSceneController | null>(null)
  const simulation = useMemo(() => createTickScheduler({ speeds: DEFAULT_SIMULATION_SPEEDS }), [])
  const hydrateSimulation = useSimulationStore((state) => state.hydrateFromScheduler)
  const loadLastSaveOnStartup = useSettingsStore(selectLoadLastSaveOnStartup)
  const setPlanetState = usePlanetStore((state) => state.setPlanetState)

  useEffect(() => {
    const detach = hydrateSimulation(simulation)

    return () => {
      detach()
    }
  }, [hydrateSimulation, simulation])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const cameraSettingsSnapshot = selectCameraSettings(useCameraStore.getState())
    const controller = createPlanetScene(canvas, cameraSettingsSnapshot)
    setSceneController(controller)

    return () => {
      controller.dispose()
    }
  }, [])

  useEffect(() => {
    simulation.play()

    return () => {
      simulation.dispose()
    }
  }, [simulation])

  useEffect(() => {
    if (!loadLastSaveOnStartup) {
      return
    }

    const summary = findMostRecentValidSaveSlot()
    if (!summary) {
      return
    }

    try {
      const save = loadPlanetSaveSlot(summary.slot)
      setPlanetState(save.planetState, summary.slot)
    } catch (error) {
      console.warn('Failed to auto-load saved planet state', error)
    }
  }, [loadLastSaveOnStartup, setPlanetState])

  return (
    <main className="hud" aria-label="Planet simulation interface">
      <canvas ref={canvasRef} className="hud__scene" aria-label="Planet visualization" />

      <TerrainControls sceneController={sceneController} />
      <CameraControls sceneController={sceneController} />
      <ClimateControls sceneController={sceneController} />

      <div className="hud__overlay">
        <header className="hud__overlay-top">
          <HudStats />
        </header>

        <footer className="hud__overlay-bottom">
          <SimulationControls />
        </footer>
      </div>

      <NotificationCenter />
    </main>
  )
}

export default App
