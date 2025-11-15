import { useEffect, useRef } from 'react'

import {
  selectBeachLevel,
  selectHillsLevel,
  selectLacunarity,
  selectOctaves,
  selectPersistence,
  selectPlainsLevel,
  selectScale,
  selectSeed,
  selectWaterLevel,
  useTerrainStore,
} from '@stores'
import { PlanetSceneController } from '@render'

type TerrainControlsProps = {
  sceneController: PlanetSceneController | null
}

const TerrainControls = ({ sceneController }: TerrainControlsProps) => {
  const seed = useTerrainStore(selectSeed)
  const scale = useTerrainStore(selectScale)
  const persistence = useTerrainStore(selectPersistence)
  const lacunarity = useTerrainStore(selectLacunarity)
  const octaves = useTerrainStore(selectOctaves)
  const waterLevel = useTerrainStore(selectWaterLevel)
  const beachLevel = useTerrainStore(selectBeachLevel)
  const plainsLevel = useTerrainStore(selectPlainsLevel)
  const hillsLevel = useTerrainStore(selectHillsLevel)

  const setSeed = useTerrainStore((state) => state.setSeed) as (seed: number) => void
  const setScale = useTerrainStore((state) => state.setScale) as (scale: number) => void
  const setPersistence = useTerrainStore((state) => state.setPersistence) as (
    persistence: number,
  ) => void
  const setLacunarity = useTerrainStore((state) => state.setLacunarity) as (
    lacunarity: number,
  ) => void
  const setOctaves = useTerrainStore((state) => state.setOctaves) as (octaves: number) => void
  const setWaterLevel = useTerrainStore((state) => state.setWaterLevel) as (level: number) => void
  const setBeachLevel = useTerrainStore((state) => state.setBeachLevel) as (level: number) => void
  const setPlainsLevel = useTerrainStore((state) => state.setPlainsLevel) as (level: number) => void
  const setHillsLevel = useTerrainStore((state) => state.setHillsLevel) as (level: number) => void
  const randomizeSeed = useTerrainStore((state) => state.randomizeSeed) as () => void
  const resetTerrain = useTerrainStore((state) => state.reset) as () => void

  const prevParamsRef = useRef({
    seed,
    scale,
    persistence,
    lacunarity,
    octaves,
    waterLevel,
    beachLevel,
    plainsLevel,
    hillsLevel,
  })

  useEffect(() => {
    const currentParams = {
      seed,
      scale,
      persistence,
      lacunarity,
      octaves,
      waterLevel,
      beachLevel,
      plainsLevel,
      hillsLevel,
    }

    const paramsChanged = Object.keys(currentParams).some(
      (key) =>
        currentParams[key as keyof typeof currentParams] !==
        prevParamsRef.current[key as keyof typeof prevParamsRef.current],
    )

    if (paramsChanged) {
      sceneController?.updateTerrainParams(currentParams)
      prevParamsRef.current = currentParams
    }
  }, [
    seed,
    scale,
    persistence,
    lacunarity,
    octaves,
    waterLevel,
    beachLevel,
    plainsLevel,
    hillsLevel,
    sceneController,
  ])

  return (
    <section className="hud__terrain-controls" aria-label="Terrain generation parameters" data-testid="terrain-controls">
      <div className="terrain-panel">
        <h3 className="terrain-panel__title">Terrain Parameters</h3>

        <div className="terrain-controls__seed-section">
          <label htmlFor="seed-input" className="terrain-controls__label">
            Seed: {seed}
          </label>
          <input
            id="seed-input"
            type="number"
            min="0"
            max="1000000"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
            className="terrain-controls__input"
          />
          <button
            type="button"
            className="terrain-controls__randomize-btn"
            onClick={randomizeSeed}
            aria-label="Generate random seed"
          >
            Randomize
          </button>
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="scale-slider" className="terrain-controls__label">
            Scale: {scale.toFixed(2)}
          </label>
          <input
            id="scale-slider"
            type="range"
            min="0.01"
            max="2"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="persistence-slider" className="terrain-controls__label">
            Persistence: {persistence.toFixed(2)}
          </label>
          <input
            id="persistence-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={persistence}
            onChange={(e) => setPersistence(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="lacunarity-slider" className="terrain-controls__label">
            Lacunarity: {lacunarity.toFixed(2)}
          </label>
          <input
            id="lacunarity-slider"
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={lacunarity}
            onChange={(e) => setLacunarity(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="octaves-slider" className="terrain-controls__label">
            Octaves: {octaves}
          </label>
          <input
            id="octaves-slider"
            type="range"
            min="1"
            max="10"
            step="1"
            value={octaves}
            onChange={(e) => setOctaves(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <h4 className="terrain-panel__subtitle">Color Thresholds</h4>

        <div className="terrain-controls__slider-group">
          <label htmlFor="water-slider" className="terrain-controls__label">
            Water Level: {waterLevel.toFixed(2)}
          </label>
          <input
            id="water-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={waterLevel}
            onChange={(e) => setWaterLevel(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="beach-slider" className="terrain-controls__label">
            Beach Level: {beachLevel.toFixed(2)}
          </label>
          <input
            id="beach-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={beachLevel}
            onChange={(e) => setBeachLevel(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="plains-slider" className="terrain-controls__label">
            Plains Level: {plainsLevel.toFixed(2)}
          </label>
          <input
            id="plains-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={plainsLevel}
            onChange={(e) => setPlainsLevel(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="hills-slider" className="terrain-controls__label">
            Hills Level: {hillsLevel.toFixed(2)}
          </label>
          <input
            id="hills-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={hillsLevel}
            onChange={(e) => setHillsLevel(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <button
          type="button"
          className="terrain-controls__reset-btn"
          onClick={resetTerrain}
          aria-label="Reset all terrain parameters to defaults"
        >
          Reset to Defaults
        </button>
      </div>
    </section>
  )
}

export default TerrainControls
