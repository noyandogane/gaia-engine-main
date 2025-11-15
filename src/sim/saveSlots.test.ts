import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PLANET_STATE_VERSION, createDefaultPlanetState } from './planetState'

type SaveSlotsModule = typeof import('./saveSlots')

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

let saveSlots: SaveSlotsModule
let mockedStorage: MockedStorage

const importSaveSlots = async () => {
  saveSlots = await import('./saveSlots')
}

beforeEach(async () => {
  mockedStorage = createMockStorage()
  vi.resetModules()
  vi.unstubAllGlobals()
  vi.stubGlobal('localStorage', mockedStorage.storage)
  await importSaveSlots()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('saveSlots', () => {
  it('serializes and deserializes saves with metadata', () => {
    const planetState = createDefaultPlanetState()
    const metadata = {
      slot: 0,
      label: 'Slot 1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }

    const serialized = saveSlots.serializePlanetSave(planetState, metadata)
    const restored = saveSlots.deserializePlanetSave(serialized, { expectedSlot: 0 })

    expect(restored.metadata).toEqual(metadata)
    expect(restored.planetState).toEqual(planetState)
    expect(restored.planetStateVersion).toBe(PLANET_STATE_VERSION)
  })

  it('guards against unsupported save format versions', () => {
    const payload = {
      version: 99,
      metadata: {
        slot: 0,
        label: 'Slot 1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      planetStateVersion: PLANET_STATE_VERSION,
      planetState: createDefaultPlanetState(),
    }

    expect(() => saveSlots.deserializePlanetSave(payload)).toThrow(
      saveSlots.PlanetSaveUnsupportedVersionError,
    )
  })

  it('guards against incompatible planet state versions', () => {
    const payload = {
      version: saveSlots.PLANET_SAVE_FORMAT_VERSION,
      metadata: {
        slot: 0,
        label: 'Slot 1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      planetStateVersion: PLANET_STATE_VERSION + 1,
      planetState: {
        version: PLANET_STATE_VERSION + 1,
      },
    }

    expect(() => saveSlots.deserializePlanetSave(payload, { expectedSlot: 0 })).toThrow(
      saveSlots.PlanetSaveIncompatibleError,
    )
  })

  it('marks slots as available after saving and exposes metadata', () => {
    const planetState = createDefaultPlanetState()
    const timestamp = new Date('2024-01-01T12:00:00.000Z')

    const save = saveSlots.savePlanetStateToSlot(0, planetState, { timestamp })

    expect(save.metadata.slot).toBe(0)
    expect(save.metadata.updatedAt).toBe(timestamp.toISOString())

    const summaries = saveSlots.listPlanetSaveSlots()
    const firstSlot = summaries[0]

    expect(firstSlot.status).toBe('available')
    expect(firstSlot.metadata.updatedAt).toBe(timestamp.toISOString())
  })

  it('finds the most recent valid save slot', () => {
    const planetState = createDefaultPlanetState()

    saveSlots.savePlanetStateToSlot(0, planetState, { timestamp: new Date('2024-01-01T10:00:00.000Z') })
    saveSlots.savePlanetStateToSlot(1, planetState, { timestamp: new Date('2024-01-02T09:00:00.000Z') })

    const summary = saveSlots.findMostRecentValidSaveSlot()

    expect(summary).not.toBeNull()
    expect(summary?.slot).toBe(1)
  })

  it('detects corrupted and incompatible saves when listing slots', () => {
    mockedStorage.storage.setItem('planet-save-slot-0', 'not-json')

    mockedStorage.storage.setItem(
      'planet-save-slot-1',
      JSON.stringify({
        version: saveSlots.PLANET_SAVE_FORMAT_VERSION,
        metadata: {
          slot: 1,
          label: 'Slot 2',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
        planetStateVersion: PLANET_STATE_VERSION + 1,
        planetState: {
          version: PLANET_STATE_VERSION + 1,
        },
      }),
    )

    const summaries = saveSlots.listPlanetSaveSlots()

    const corrupted = summaries.find((entry) => entry.slot === 0)
    const incompatible = summaries.find((entry) => entry.slot === 1)

    expect(corrupted?.status).toBe('corrupted')
    expect(incompatible?.status).toBe('incompatible')
  })
})
