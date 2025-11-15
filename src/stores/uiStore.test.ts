import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_ACTIVE_TOOL, selectUIPanel, useUIStore } from './uiStore'

const selectSimulationPanel = selectUIPanel('simulation')

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.getState().reset()
  })

  it('initializes with default panels and tool', () => {
    const state = useUIStore.getState()

    expect(selectSimulationPanel(state)).toBe(true)
    expect(state.panels.settings).toBe(false)
    expect(state.panels.inspector).toBe(false)
    expect(state.activeTool).toBe(DEFAULT_ACTIVE_TOOL)
  })

  it('opens and closes panels', () => {
    const { openPanel, closePanel } = useUIStore.getState()

    openPanel('settings')
    expect(useUIStore.getState().panels.settings).toBe(true)

    closePanel('settings')
    expect(useUIStore.getState().panels.settings).toBe(false)
  })

  it('toggles panel visibility', () => {
    const { togglePanel } = useUIStore.getState()

    togglePanel('simulation')
    expect(selectSimulationPanel(useUIStore.getState())).toBe(false)

    togglePanel('simulation')
    expect(selectSimulationPanel(useUIStore.getState())).toBe(true)
  })

  it('sets panel state explicitly', () => {
    const { setPanelState } = useUIStore.getState()

    setPanelState('settings', true)
    expect(useUIStore.getState().panels.settings).toBe(true)

    setPanelState('settings', false)
    expect(useUIStore.getState().panels.settings).toBe(false)
  })

  it('updates active tool', () => {
    const { setActiveTool } = useUIStore.getState()

    setActiveTool('pan')
    expect(useUIStore.getState().activeTool).toBe('pan')
  })

  it('resets to defaults', () => {
    const { setActiveTool, togglePanel, reset } = useUIStore.getState()

    setActiveTool('zoom')
    togglePanel('simulation')

    reset()

    const state = useUIStore.getState()
    expect(selectSimulationPanel(state)).toBe(true)
    expect(state.activeTool).toBe(DEFAULT_ACTIVE_TOOL)
  })
})
