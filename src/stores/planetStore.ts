import { create } from 'zustand'

import { createDefaultPlanetState, type PlanetState } from '@sim'

export type PlanetStoreState = {
  planet: PlanetState
  lastLoadedSlot: number | null
  setPlanetState: (planet: PlanetState, slot?: number | null) => void
  reset: () => void
}

const createDefaultPlanetSnapshot = () => ({
  planet: createDefaultPlanetState(),
  lastLoadedSlot: null as number | null,
})

export const usePlanetStore = create<PlanetStoreState>()((set) => ({
  ...createDefaultPlanetSnapshot(),
  setPlanetState: (planet, slot = null) =>
    set(() => ({
      planet,
      lastLoadedSlot: slot,
    })),
  reset: () => set(() => createDefaultPlanetSnapshot()),
}))

export const selectPlanetState = (state: PlanetStoreState) => state.planet
export const selectPlanetLastLoadedSlot = (state: PlanetStoreState) => state.lastLoadedSlot
