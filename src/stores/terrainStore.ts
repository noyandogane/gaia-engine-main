import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { resolveStorage } from '@/utils/storage'

export type TerrainSnapshot = {
  seed: number
  scale: number
  persistence: number
  lacunarity: number
  octaves: number
  waterLevel: number
  beachLevel: number
  plainsLevel: number
  hillsLevel: number
}

const DEFAULT_TERRAIN_SNAPSHOT: TerrainSnapshot = {
  seed: 12345,
  scale: 0.5,
  persistence: 0.5,
  lacunarity: 2.0,
  octaves: 6,
  waterLevel: 0.4,
  beachLevel: 0.42,
  plainsLevel: 0.55,
  hillsLevel: 0.75,
}

const createDefaultTerrainSnapshot = (): TerrainSnapshot => ({
  ...DEFAULT_TERRAIN_SNAPSHOT,
})

export type TerrainStoreState = TerrainSnapshot & {
  setSeed: (seed: number) => void
  setScale: (scale: number) => void
  setPersistence: (persistence: number) => void
  setLacunarity: (lacunarity: number) => void
  setOctaves: (octaves: number) => void
  setWaterLevel: (level: number) => void
  setBeachLevel: (level: number) => void
  setPlainsLevel: (level: number) => void
  setHillsLevel: (level: number) => void
  randomizeSeed: () => void
  reset: () => void
}

export const useTerrainStore = create<TerrainStoreState>()(
  persist(
    (set) => ({
      ...createDefaultTerrainSnapshot(),
      setSeed: (seed) => set(() => ({ seed })),
      setScale: (scale) => set(() => ({ scale: Math.max(0.01, Math.min(2, scale)) })),
      setPersistence: (persistence) =>
        set(() => ({ persistence: Math.max(0, Math.min(1, persistence)) })),
      setLacunarity: (lacunarity) =>
        set(() => ({ lacunarity: Math.max(1, Math.min(4, lacunarity)) })),
      setOctaves: (octaves) =>
        set(() => ({ octaves: Math.max(1, Math.min(10, Math.floor(octaves))) })),
      setWaterLevel: (level) => set(() => ({ waterLevel: Math.max(0, Math.min(1, level)) })),
      setBeachLevel: (level) => set(() => ({ beachLevel: Math.max(0, Math.min(1, level)) })),
      setPlainsLevel: (level) => set(() => ({ plainsLevel: Math.max(0, Math.min(1, level)) })),
      setHillsLevel: (level) => set(() => ({ hillsLevel: Math.max(0, Math.min(1, level)) })),
      randomizeSeed: () =>
        set(() => ({
          seed: Math.floor(Math.random() * 1000000),
        })),
      reset: () => set(() => createDefaultTerrainSnapshot()),
    }),
    {
      name: 'app-terrain',
      version: 1,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        seed: state.seed,
        scale: state.scale,
        persistence: state.persistence,
        lacunarity: state.lacunarity,
        octaves: state.octaves,
        waterLevel: state.waterLevel,
        beachLevel: state.beachLevel,
        plainsLevel: state.plainsLevel,
        hillsLevel: state.hillsLevel,
      }),
    },
  ),
)

export const selectSeed = (state: TerrainStoreState) => state.seed
export const selectScale = (state: TerrainStoreState) => state.scale
export const selectPersistence = (state: TerrainStoreState) => state.persistence
export const selectLacunarity = (state: TerrainStoreState) => state.lacunarity
export const selectOctaves = (state: TerrainStoreState) => state.octaves
export const selectWaterLevel = (state: TerrainStoreState) => state.waterLevel
export const selectBeachLevel = (state: TerrainStoreState) => state.beachLevel
export const selectPlainsLevel = (state: TerrainStoreState) => state.plainsLevel
export const selectHillsLevel = (state: TerrainStoreState) => state.hillsLevel
