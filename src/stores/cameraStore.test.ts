import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStore, selectCameraSettings, selectRotateSensitivity } from './cameraStore'

describe('cameraStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useCameraStore.setState({
      rotateSensitivity: 0.85,
      zoomSensitivity: 0.75,
      panSensitivity: 0.5,
      dampingFactor: 0.08,
      invertHorizontalAxis: false,
      invertVerticalAxis: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with default camera settings', () => {
    const state = useCameraStore.getState()
    
    expect(state.rotateSensitivity).toBe(0.85)
    expect(state.zoomSensitivity).toBe(0.75)
    expect(state.panSensitivity).toBe(0.5)
    expect(state.dampingFactor).toBe(0.08)
    expect(state.invertHorizontalAxis).toBe(false)
    expect(state.invertVerticalAxis).toBe(false)
  })

  it('updates rotate sensitivity', () => {
    const store = useCameraStore.getState()
    store.setRotateSensitivity(2.5)
    
    const state = useCameraStore.getState()
    expect(state.rotateSensitivity).toBe(2.5)
  })

  it('updates zoom sensitivity', () => {
    const store = useCameraStore.getState()
    store.setZoomSensitivity(0.5)
    
    const state = useCameraStore.getState()
    expect(state.zoomSensitivity).toBe(0.5)
  })

  it('updates pan sensitivity', () => {
    const store = useCameraStore.getState()
    store.setPanSensitivity(1.5)
    
    const state = useCameraStore.getState()
    expect(state.panSensitivity).toBe(1.5)
  })

  it('updates damping factor', () => {
    const store = useCameraStore.getState()
    store.setDampingFactor(0.2)
    
    const state = useCameraStore.getState()
    expect(state.dampingFactor).toBe(0.2)
  })

  it('toggles axis inversion', () => {
    const store = useCameraStore.getState()
    
    store.setInvertHorizontalAxis(true)
    store.setInvertVerticalAxis(true)
    
    const state = useCameraStore.getState()
    expect(state.invertHorizontalAxis).toBe(true)
    expect(state.invertVerticalAxis).toBe(true)
  })

  it('selectCameraSettings returns all camera settings', () => {
    const state = useCameraStore.getState()
    const settings = selectCameraSettings(state)
    
    expect(settings).toEqual({
      rotateSensitivity: 0.85,
      zoomSensitivity: 0.75,
      panSensitivity: 0.5,
      dampingFactor: 0.08,
      invertHorizontalAxis: false,
      invertVerticalAxis: false,
    })
  })

  it('selectRotateSensitivity returns rotate sensitivity', () => {
    const state = useCameraStore.getState()
    const sensitivity = selectRotateSensitivity(state)
    
    expect(sensitivity).toBe(0.85)
  })

  it('updates multiple settings at once', () => {
    const store = useCameraStore.getState()
    
    store.setRotateSensitivity(1.5)
    store.setZoomSensitivity(0.8)
    store.setInvertHorizontalAxis(true)
    
    const state = useCameraStore.getState()
    expect(state.rotateSensitivity).toBe(1.5)
    expect(state.zoomSensitivity).toBe(0.8)
    expect(state.invertHorizontalAxis).toBe(true)
  })
})