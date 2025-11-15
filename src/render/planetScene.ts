import {
  AmbientLight,
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import type { CameraSettings } from '@stores'

import { createRenderLoop } from './loop'
import { createTerrainMaterial } from './terrainShader'

export type PlanetSceneController = {
  dispose: () => void
  updateTerrainParams: (params: {
    seed?: number
    scale?: number
    persistence?: number
    lacunarity?: number
    octaves?: number
    waterLevel?: number
    beachLevel?: number
    plainsLevel?: number
    hillsLevel?: number
  }) => void
  updateClimateParams: (params: {
    showTemperatureOverlay?: boolean
    axialTilt?: number
    albedo?: number
    greenhouseMultiplier?: number
    currentTime?: number
  }) => void
  updateCameraSettings: (settings: Partial<CameraSettings>) => void
}

const clampPixelRatio = () => Math.min(window.devicePixelRatio ?? 1, 2)

const defaultCameraSettings: CameraSettings = {
  rotateSensitivity: 0.85,
  zoomSensitivity: 0.75,
  panSensitivity: 0.5,
  dampingFactor: 0.08,
  invertHorizontalAxis: false,
  invertVerticalAxis: false,
}

const watchDevicePixelRatio = (callback: () => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }

  let cleanup: (() => void) | null = null

  const register = () => {
    cleanup?.()

    const ratio = window.devicePixelRatio || 1
    const mediaQuery = window.matchMedia(`(resolution: ${ratio}dppx)`)

    const handleChange = () => {
      callback()
      register()
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      cleanup = () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
      cleanup = () => mediaQuery.removeListener(handleChange)
    }
  }

  register()

  return () => {
    cleanup?.()
    cleanup = null
  }
}

const configureRenderer = (canvas: HTMLCanvasElement) => {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  })

  renderer.outputColorSpace = SRGBColorSpace
  renderer.setPixelRatio(clampPixelRatio())
  renderer.setClearColor(0x000000, 0)

  return renderer
}

const createCamera = () => {
  const camera = new PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 1.2, 3.5)
  camera.lookAt(0, 0, 0)
  return camera
}

export const createPlanetScene = (
  canvas: HTMLCanvasElement,
  initialCameraSettings: CameraSettings = defaultCameraSettings,
): PlanetSceneController => {
  const renderer = configureRenderer(canvas)
  const scene = new Scene()

  const camera = createCamera()

  const controls = new OrbitControls(camera, canvas)

  const clampSettings = (settings: CameraSettings): CameraSettings => ({
    rotateSensitivity: Math.max(0.1, settings.rotateSensitivity),
    zoomSensitivity: Math.max(0.05, settings.zoomSensitivity),
    panSensitivity: Math.max(0, settings.panSensitivity),
    dampingFactor: Math.min(Math.max(settings.dampingFactor, 0), 0.25),
    invertHorizontalAxis: settings.invertHorizontalAxis,
    invertVerticalAxis: settings.invertVerticalAxis,
  })

  let cameraSettings = clampSettings({
    ...defaultCameraSettings,
    ...initialCameraSettings,
  })

  let horizontalInversion = 1
  let verticalInversion = 1

  const updateInversion = () => {
    horizontalInversion = cameraSettings.invertHorizontalAxis ? -1 : 1
    verticalInversion = cameraSettings.invertVerticalAxis ? -1 : 1
  }

  const baseRotateLeft = controls.rotateLeft.bind(controls)
  const baseRotateUp = controls.rotateUp.bind(controls)

  const rotateLeftWithInversion = (angle: number) => {
    baseRotateLeft(angle * horizontalInversion)
  }
  const rotateUpWithInversion = (angle: number) => {
    baseRotateUp(angle * verticalInversion)
  }

  controls.rotateLeft = rotateLeftWithInversion
  controls.rotateUp = rotateUpWithInversion

  const applyCameraSettings = (next: Partial<CameraSettings>) => {
    cameraSettings = clampSettings({
      ...cameraSettings,
      ...next,
    })

    updateInversion()

    controls.rotateSpeed = cameraSettings.rotateSensitivity
    controls.zoomSpeed = cameraSettings.zoomSensitivity
    controls.panSpeed = cameraSettings.panSensitivity
    controls.enablePan = cameraSettings.panSensitivity > 0.0001
    controls.dampingFactor = cameraSettings.dampingFactor
    controls.enableDamping = cameraSettings.dampingFactor > 0

    controls.update()
  }

  controls.target.set(0, 0, 0)
  controls.minDistance = 1.5
  controls.maxDistance = 6
  controls.maxPolarAngle = Math.PI - 0.1
  updateInversion()
  applyCameraSettings({})

  const ambientLight = new AmbientLight(0xffffff, 0.35)
  scene.add(ambientLight)

  const keyLight = new DirectionalLight(0xffffff, 0.9)
  keyLight.position.set(3, 4, 2)
  scene.add(keyLight)

  const fillLight = new DirectionalLight(0x60a5fa, 0.4)
  fillLight.position.set(-4, -2, -1.5)
  scene.add(fillLight)

  const planetGeometry = new SphereGeometry(1, 128, 128)
  const planetMaterial = createTerrainMaterial()
  const planet = new Mesh(planetGeometry, planetMaterial)
  scene.add(planet)

  const updateRendererSize = () => {
    const { width, height } = canvas.getBoundingClientRect()
    if (width === 0 || height === 0) {
      return
    }

    renderer.setPixelRatio(clampPixelRatio())
    renderer.setSize(width, height, false)

    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  updateRendererSize()
  window.addEventListener('resize', updateRendererSize)

  const resizeObserver =
    typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => updateRendererSize()) : null
  resizeObserver?.observe(canvas)

  const detachPixelRatioObserver = watchDevicePixelRatio(() => updateRendererSize())

  const renderLoop = createRenderLoop((deltaTime) => {
    planet.rotation.y += deltaTime * 0.2
    controls.update()
    renderer.render(scene, camera)
  })

  renderLoop.start()

  return {
    dispose: () => {
      renderLoop.stop()
      window.removeEventListener('resize', updateRendererSize)
      resizeObserver?.disconnect()
      detachPixelRatioObserver()
      controls.dispose()
      planetGeometry.dispose()
      planetMaterial.dispose()
      renderer.dispose()
    },
    updateTerrainParams: (params) => {
      if (params.seed !== undefined) {
        planetMaterial.uniforms.uSeed.value = params.seed
      }
      if (params.scale !== undefined) {
        planetMaterial.uniforms.uScale.value = params.scale
      }
      if (params.persistence !== undefined) {
        planetMaterial.uniforms.uPersistence.value = params.persistence
      }
      if (params.lacunarity !== undefined) {
        planetMaterial.uniforms.uLacunarity.value = params.lacunarity
      }
      if (params.octaves !== undefined) {
        planetMaterial.uniforms.uOctaves.value = params.octaves
      }
      if (params.waterLevel !== undefined) {
        planetMaterial.uniforms.uWaterLevel.value = params.waterLevel
      }
      if (params.beachLevel !== undefined) {
        planetMaterial.uniforms.uBeachLevel.value = params.beachLevel
      }
      if (params.plainsLevel !== undefined) {
        planetMaterial.uniforms.uPlainsLevel.value = params.plainsLevel
      }
      if (params.hillsLevel !== undefined) {
        planetMaterial.uniforms.uHillsLevel.value = params.hillsLevel
      }
    },
    updateClimateParams: (params) => {
      if (params.showTemperatureOverlay !== undefined) {
        planetMaterial.uniforms.uShowTemperatureOverlay.value = params.showTemperatureOverlay
      }
      if (params.axialTilt !== undefined) {
        planetMaterial.uniforms.uAxialTilt.value = params.axialTilt
      }
      if (params.albedo !== undefined) {
        planetMaterial.uniforms.uAlbedo.value = params.albedo
      }
      if (params.greenhouseMultiplier !== undefined) {
        planetMaterial.uniforms.uGreenhouseMultiplier.value = params.greenhouseMultiplier
      }
      if (params.currentTime !== undefined) {
        planetMaterial.uniforms.uCurrentTime.value = params.currentTime
      }
    },
    updateCameraSettings: (settings) => {
      applyCameraSettings(settings)
    },
  }
}
