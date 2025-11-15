import { useEffect, useRef, useCallback } from 'react'

import { PlanetSceneController } from '@render'
import {
  selectAxialTilt,
  selectAlbedo,
  selectGreenhouseMultiplier,
  selectCurrentTime,
  selectYearLength,
  selectShowTemperatureOverlay,
  selectSeasonProgress,
  useClimateStore,
} from '@stores'

type ClimateControlsProps = {
  sceneController: PlanetSceneController | null
}

const ClimateControls = ({ sceneController }: ClimateControlsProps) => {
  const axialTilt = useClimateStore(selectAxialTilt)
  const albedo = useClimateStore(selectAlbedo)
  const greenhouseMultiplier = useClimateStore(selectGreenhouseMultiplier)
  const currentTime = useClimateStore(selectCurrentTime)
  const yearLength = useClimateStore(selectYearLength)
  const showTemperatureOverlay = useClimateStore(selectShowTemperatureOverlay)
  const seasonProgress = useClimateStore(selectSeasonProgress)

  const setAxialTilt = useClimateStore((state) => state.setAxialTilt)
  const setAlbedo = useClimateStore((state) => state.setAlbedo)
  const setGreenhouseMultiplier = useClimateStore((state) => state.setGreenhouseMultiplier)
  const setCurrentTime = useClimateStore((state) => state.setCurrentTime)
  const setYearLength = useClimateStore((state) => state.setYearLength)
  const incrementTime = useClimateStore((state) => state.incrementTime)
  const toggleTemperatureOverlay = useClimateStore((state) => state.toggleTemperatureOverlay)
  const resetClimate = useClimateStore((state) => state.reset)

  const prevParamsRef = useRef({
    showTemperatureOverlay,
    axialTilt,
    albedo,
    greenhouseMultiplier,
    currentTime,
  })

  useEffect(() => {
    const currentParams = {
      showTemperatureOverlay,
      axialTilt,
      albedo,
      greenhouseMultiplier,
      currentTime,
    }

    const paramsChanged = Object.keys(currentParams).some(
      (key) =>
        currentParams[key as keyof typeof currentParams] !==
        prevParamsRef.current[key as keyof typeof prevParamsRef.current],
    )

    if (paramsChanged) {
      sceneController?.updateClimateParams(currentParams)
      prevParamsRef.current = currentParams
    }
  }, [
    showTemperatureOverlay,
    axialTilt,
    albedo,
    greenhouseMultiplier,
    currentTime,
    sceneController,
  ])

  const getSeasonName = useCallback(() => {
    const progress = seasonProgress
    if (progress < 0.25) return 'Spring'
    if (progress < 0.5) return 'Summer'
    if (progress < 0.75) return 'Autumn'
    return 'Winter'
  }, [seasonProgress])

  const formatDayOfYear = useCallback(() => {
    return `Day ${Math.floor(currentTime) + 1} of ${Math.floor(yearLength)}`
  }, [currentTime, yearLength])

  return (
    <section
      className="hud__climate-controls"
      aria-label="Climate model parameters"
      data-testid="climate-controls"
    >
      <div className="terrain-panel">
        <h3 className="terrain-panel__title">Climate Model</h3>

        <div className="terrain-controls__slider-group">
          <label htmlFor="axial-tilt-slider" className="terrain-controls__label">
            Axial Tilt: {axialTilt.toFixed(1)}°
          </label>
          <input
            id="axial-tilt-slider"
            type="range"
            min="0"
            max="90"
            step="0.5"
            value={axialTilt}
            onChange={(e) => setAxialTilt(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="albedo-slider" className="terrain-controls__label">
            Albedo: {albedo.toFixed(2)}
          </label>
          <input
            id="albedo-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={albedo}
            onChange={(e) => setAlbedo(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="greenhouse-slider" className="terrain-controls__label">
            Greenhouse Multiplier: {greenhouseMultiplier.toFixed(2)}
          </label>
          <input
            id="greenhouse-slider"
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={greenhouseMultiplier}
            onChange={(e) => setGreenhouseMultiplier(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <h4 className="terrain-panel__subtitle">Time & Seasons</h4>

        <div className="terrain-controls__time-display">
          <div className="terrain-controls__time-info">
            <span className="terrain-controls__season">{getSeasonName()}</span>
            <span className="terrain-controls__day">{formatDayOfYear()}</span>
          </div>
          <div className="terrain-controls__season-progress">
            <div
              className="terrain-controls__progress-bar"
              style={{ width: `${seasonProgress * 100}%` }}
            />
          </div>
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="time-slider" className="terrain-controls__label">
            Time Progress: {Math.floor(currentTime)}
          </label>
          <input
            id="time-slider"
            type="range"
            min="0"
            max={yearLength}
            step="1"
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <div className="terrain-controls__slider-group">
          <label htmlFor="year-length-slider" className="terrain-controls__label">
            Year Length: {Math.floor(yearLength)} days
          </label>
          <input
            id="year-length-slider"
            type="range"
            min="100"
            max="1000"
            step="10"
            value={yearLength}
            onChange={(e) => setYearLength(parseFloat(e.target.value))}
            className="terrain-controls__slider"
          />
        </div>

        <div className="terrain-controls__time-buttons">
          <button
            type="button"
            className="terrain-controls__time-btn"
            onClick={() => incrementTime(1)}
            aria-label="Advance 1 day"
          >
            +1 Day
          </button>
          <button
            type="button"
            className="terrain-controls__time-btn"
            onClick={() => incrementTime(7)}
            aria-label="Advance 1 week"
          >
            +1 Week
          </button>
          <button
            type="button"
            className="terrain-controls__time-btn"
            onClick={() => incrementTime(30)}
            aria-label="Advance 1 month"
          >
            +1 Month
          </button>
        </div>

        <h4 className="terrain-panel__subtitle">Visualization</h4>

        <div className="terrain-controls__checkbox-group">
          <label className="terrain-controls__checkbox">
            <input
              type="checkbox"
              checked={showTemperatureOverlay}
              onChange={toggleTemperatureOverlay}
              className="terrain-controls__checkbox-input"
            />
            Show Temperature Overlay
          </label>
        </div>

        <button
          type="button"
          className="terrain-controls__reset-btn"
          onClick={resetClimate}
          aria-label="Reset all climate parameters to defaults"
        >
          Reset to Defaults
        </button>
      </div>
    </section>
  )
}

export default ClimateControls
