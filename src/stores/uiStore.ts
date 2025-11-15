import { create } from 'zustand'

export type PanelId = 'simulation' | 'settings' | 'inspector'
export type ToolId = 'orbit' | 'pan' | 'zoom'

type PanelState = Record<PanelId, boolean>

const createDefaultPanels = (): PanelState => ({
  simulation: true,
  settings: false,
  inspector: false,
})

export const DEFAULT_ACTIVE_TOOL: ToolId = 'orbit'

export type UIStoreState = {
  panels: PanelState
  activeTool: ToolId
  openPanel: (panel: PanelId) => void
  closePanel: (panel: PanelId) => void
  togglePanel: (panel: PanelId) => void
  setPanelState: (panel: PanelId, isOpen: boolean) => void
  setActiveTool: (tool: ToolId) => void
  reset: () => void
}

export const useUIStore = create<UIStoreState>()((set) => ({
  panels: createDefaultPanels(),
  activeTool: DEFAULT_ACTIVE_TOOL,
  openPanel: (panel) =>
    set((state) => {
      if (state.panels[panel]) {
        return state
      }

      return {
        panels: { ...state.panels, [panel]: true },
      }
    }),
  closePanel: (panel) =>
    set((state) => {
      if (!state.panels[panel]) {
        return state
      }

      return {
        panels: { ...state.panels, [panel]: false },
      }
    }),
  togglePanel: (panel) =>
    set((state) => ({
      panels: { ...state.panels, [panel]: !state.panels[panel] },
    })),
  setPanelState: (panel, isOpen) =>
    set((state) => {
      if (state.panels[panel] === isOpen) {
        return state
      }

      return {
        panels: { ...state.panels, [panel]: isOpen },
      }
    }),
  setActiveTool: (tool) =>
    set((state) => {
      if (state.activeTool === tool) {
        return state
      }

      return { activeTool: tool }
    }),
  reset: () =>
    set(() => ({
      panels: createDefaultPanels(),
      activeTool: DEFAULT_ACTIVE_TOOL,
    })),
}))

export const selectUIPanel = (panel: PanelId) => (state: UIStoreState) => state.panels[panel]
export const selectUIActiveTool = (state: UIStoreState) => state.activeTool
