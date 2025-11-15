import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type SettingsModule = typeof import('./settingsStore')

type MockedStorage = {
  storage: Storage
  store: Map<string, string>
}

const createMockStorage = (): MockedStorage => {
  const store = new Map<string, string>()

  const storage: Storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  }

  return { storage, store }
}

let settingsModule: SettingsModule
let mockedStorage: MockedStorage

const importSettingsStore = async () => {
  settingsModule = await import('./settingsStore')
  await settingsModule.useSettingsStore.persist.rehydrate()
}

beforeEach(async () => {
  mockedStorage = createMockStorage()
  vi.resetModules()
  vi.unstubAllGlobals()
  vi.stubGlobal('localStorage', mockedStorage.storage)
  await importSettingsStore()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('settingsStore', () => {
  it('updates settings and persists to storage', () => {
    const store = settingsModule.useSettingsStore.getState()

    store.setTheme('dark')
    store.setShowSimulationMetrics(false)
    store.setSoundEnabled(false)
    store.setLoadLastSaveOnStartup(true)

    const persisted = mockedStorage.store.get('app-settings')
    expect(persisted).toBeTypeOf('string')

    const parsed = JSON.parse(persisted ?? '{}')
    expect(parsed.state).toMatchObject({
      theme: 'dark',
      showSimulationMetrics: false,
      soundEnabled: false,
      loadLastSaveOnStartup: true,
    })
  })

  it('rehydrates persisted settings from storage', async () => {
    const store = settingsModule.useSettingsStore.getState()

    store.setTheme('light')
    store.setShowSimulationMetrics(false)
    store.setSoundEnabled(false)
    store.setLoadLastSaveOnStartup(true)

    vi.resetModules()
    await importSettingsStore()

    const state = settingsModule.useSettingsStore.getState()

    expect(settingsModule.selectTheme(state)).toBe('light')
    expect(settingsModule.selectShowSimulationMetrics(state)).toBe(false)
    expect(settingsModule.selectSoundEnabled(state)).toBe(false)
    expect(settingsModule.selectLoadLastSaveOnStartup(state)).toBe(true)
  })
})
