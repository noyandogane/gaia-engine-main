import { useEffect, useRef } from 'react'

import type { PlanetSceneController } from '@render'
import {
  selectDamping,
  selectInvertHorizontalAxis,
  selectInvertVerticalAxis,
  selectPanSensitivity,
  selectRotateSensitivity,
  selectZoomSensitivity,
  useCameraStore,
} from '@stores'

type CameraControlsProps = {
  sceneController: PlanetSceneController | null
}

const CameraControls = ({ sceneController }: CameraControlsProps) => {
  const rotateSensitivity = useCameraStore(selectRotateSensitivity)
  const zoomSensitivity = useCameraStore(selectZoomSensitivity)
  const panSensitivity = useCameraStore(selectPanSensitivity)
  const dampingFactor = useCameraStore(selectDamping)
  const invertHorizontalAxis = useCameraStore(selectInvertHorizontalAxis)
  const invertVerticalAxis = useCameraStore(selectInvertVerticalAxis)
  const setRotateSensitivity = useCameraStore((state) => state.setRotateSensitivity)
  const setZoomSensitivity = useCameraStore((state) => state.setZoomSensitivity)
  const setPanSensitivity = useCameraStore((state) => state.setPanSensitivity)
  const setDampingFactor = useCameraStore((state) => state.setDampingFactor)
  const setInvertHorizontalAxis = useCameraStore((state) => state.setInvertHorizontalAxis)
  const setInvertVerticalAxis = useCameraStore((state) => state.setInvertVerticalAxis)
  const resetCameraSettings = useCameraStore((state) => state.reset)

  const previousControllerRef = useRef<PlanetSceneController | null>(null)

  useEffect(() => {
    const controllerChanged = previousControllerRef.current !== sceneController

    if (sceneController && controllerChanged) {
      const cameraSettings = {
        rotateSensitivity,
        zoomSensitivity,
        panSensitivity,
        dampingFactor,
        invertHorizontalAxis,
        invertVerticalAxis,
      }
      sceneController.updateCameraSettings(cameraSettings)
      previousControllerRef.current = sceneController
    }

    if (!sceneController) {
      previousControllerRef.current = null
    }
  }, [sceneController, rotateSensitivity, zoomSensitivity, panSensitivity, dampingFactor, invertHorizontalAxis, invertVerticalAxis])

  return (
    <section className="hud__camera-controls" aria-label="Camera control settings" data-testid="camera-controls">
      <div className="camera-panel">
        <h3 className="camera-panel__title">Camera Controls</h3>

        <div className="camera-controls__slider-group">
          <label htmlFor="camera-rotate-slider" className="camera-controls__label">
            Rotate sensitivity: {rotateSensitivity.toFixed(2)}
          </label>
          <input
            id="camera-rotate-slider"
            type="range"
            min="0.1"
            max="2.5"
            step="0.05"
            value={rotateSensitivity}
            onChange={(event) => setRotateSensitivity(parseFloat(event.target.value))}
            className="camera-controls__slider"
          />
        </div>

        <div className="camera-controls__slider-group">
          <label htmlFor="camera-zoom-slider" className="camera-controls__label">
            Zoom sensitivity: {zoomSensitivity.toFixed(2)}
          </label>
          <input
            id="camera-zoom-slider"
            type="range"
            min="0.05"
            max="2"
            step="0.05"
            value={zoomSensitivity}
            onChange={(event) => setZoomSensitivity(parseFloat(event.target.value))}
            className="camera-controls__slider"
          />
        </div>

        <div className="camera-controls__slider-group">
          <label htmlFor="camera-pan-slider" className="camera-controls__label">
            Pan sensitivity: {panSensitivity.toFixed(2)}
          </label>
          <input
            id="camera-pan-slider"
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={panSensitivity}
            onChange={(event) => setPanSensitivity(parseFloat(event.target.value))}
            className="camera-controls__slider"
          />
        </div>

        <div className="camera-controls__slider-group">
          <label htmlFor="camera-damping-slider" className="camera-controls__label">
            Damping: {dampingFactor.toFixed(2)}
          </label>
          <input
            id="camera-damping-slider"
            type="range"
            min="0"
            max="0.25"
            step="0.005"
            value={dampingFactor}
            onChange={(event) => setDampingFactor(parseFloat(event.target.value))}
            className="camera-controls__slider"
          />
        </div>

        <div className="camera-controls__toggle-group" role="group" aria-label="Invert axis options">
          <label className="camera-controls__toggle">
            <input
              type="checkbox"
              checked={invertHorizontalAxis}
              onChange={(event) => setInvertHorizontalAxis(event.target.checked)}
            />
            <span>Invert horizontal</span>
          </label>
          <label className="camera-controls__toggle">
            <input
              type="checkbox"
              checked={invertVerticalAxis}
              onChange={(event) => setInvertVerticalAxis(event.target.checked)}
            />
            <span>Invert vertical</span>
          </label>
        </div>

        <button
          type="button"
          className="camera-controls__reset-btn"
          onClick={resetCameraSettings}
        >
          Reset to defaults
        </button>
      </div>
    </section>
  )
}

export default CameraControls
