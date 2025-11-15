import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { resolveStorage } from '@/utils/storage'

export type ThemePreference = 'system' | 'light' | 'dark'

type SettingsSnapshot = {
  theme: ThemePreference
  showSimulationMetrics: boolean
  soundEnabled: boolean
  loadLastSaveOnStartup: boolean
}

const DEFAULT_SETTINGS_SNAPSHOT: SettingsSnapshot = {
  theme: 'system',
  showSimulationMetrics: true,
  soundEnabled: true,
  loadLastSaveOnStartup: false,
}

const createDefaultSettingsSnapshot = (): SettingsSnapshot => ({
  ...DEFAULT_SETTINGS_SNAPSHOT,
})


export type SettingsStoreState = SettingsSnapshot & {
  setTheme: (theme: ThemePreference) => void
  setShowSimulationMetrics: (visible: boolean) => void
  toggleSimulationMetrics: () => void
  setSoundEnabled: (enabled: boolean) => void
  setLoadLastSaveOnStartup: (enabled: boolean) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      ...createDefaultSettingsSnapshot(),
      setTheme: (theme) => set(() => ({ theme })),
      setShowSimulationMetrics: (visible) => set(() => ({ showSimulationMetrics: visible })),
      toggleSimulationMetrics: () =>
        set((state) => ({ showSimulationMetrics: !state.showSimulationMetrics })),
      setSoundEnabled: (enabled) => set(() => ({ soundEnabled: enabled })),
      setLoadLastSaveOnStartup: (enabled) => set(() => ({ loadLastSaveOnStartup: enabled })),
      reset: () => set(() => createDefaultSettingsSnapshot()),
    }),
    {
      name: 'app-settings',
      version: 1,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        theme: state.theme,
        showSimulationMetrics: state.showSimulationMetrics,
        soundEnabled: state.soundEnabled,
        loadLastSaveOnStartup: state.loadLastSaveOnStartup,
      }),
    },
  ),
)

export const selectTheme = (state: SettingsStoreState) => state.theme
export const selectShowSimulationMetrics = (state: SettingsStoreState) => state.showSimulationMetrics
export const selectSoundEnabled = (state: SettingsStoreState) => state.soundEnabled
export const selectLoadLastSaveOnStartup = (state: SettingsStoreState) => state.loadLastSaveOnStartup
