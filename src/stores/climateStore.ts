import { create } from 'zustand'
import type { ClimateState } from '@sim'
import { createDefaultClimateState } from '@sim'

export type ClimateStoreState = {
  climate: ClimateState
  showTemperatureOverlay: boolean
  setAxialTilt: (tilt: number) => void
  setAlbedo: (albedo: number) => void
  setGreenhouseMultiplier: (multiplier: number) => void
  setCurrentTime: (time: number) => void
  setYearLength: (length: number) => void
  incrementTime: (days: number) => void
  toggleTemperatureOverlay: () => void
  setShowTemperatureOverlay: (show: boolean) => void
  reset: () => void
}

const createDefaultClimateSnapshot = () => ({
  climate: createDefaultClimateState(),
  showTemperatureOverlay: false,
})

export const useClimateStore = create<ClimateStoreState>()((set) => ({
  ...createDefaultClimateSnapshot(),

  setAxialTilt: (tilt) =>
    set((state) => ({
      climate: { ...state.climate, axialTiltDegrees: Math.max(0, Math.min(90, tilt)) },
    })),

  setAlbedo: (albedo) =>
    set((state) => ({
      climate: { ...state.climate, albedo: Math.max(0, Math.min(1, albedo)) },
    })),

  setGreenhouseMultiplier: (multiplier) =>
    set((state) => ({
      climate: { ...state.climate, greenhouseMultiplier: Math.max(0, multiplier) },
    })),

  setCurrentTime: (time) =>
    set((state) => ({
      climate: { ...state.climate, currentTime: Math.max(0, time) },
    })),

  setYearLength: (length) =>
    set((state) => ({
      climate: { ...state.climate, yearLength: Math.max(1, length) },
    })),

  incrementTime: (days) =>
    set((state) => ({
      climate: {
        ...state.climate,
        currentTime: (state.climate.currentTime + days) % state.climate.yearLength,
      },
    })),

  toggleTemperatureOverlay: () =>
    set((state) => ({
      showTemperatureOverlay: !state.showTemperatureOverlay,
    })),

  setShowTemperatureOverlay: (show) =>
    set(() => ({
      showTemperatureOverlay: show,
    })),

  reset: () => set(() => createDefaultClimateSnapshot()),
}))

// Selectors
export const selectClimateState = (state: ClimateStoreState) => state.climate
export const selectAxialTilt = (state: ClimateStoreState) => state.climate.axialTiltDegrees
export const selectAlbedo = (state: ClimateStoreState) => state.climate.albedo
export const selectGreenhouseMultiplier = (state: ClimateStoreState) =>
  state.climate.greenhouseMultiplier
export const selectCurrentTime = (state: ClimateStoreState) => state.climate.currentTime
export const selectYearLength = (state: ClimateStoreState) => state.climate.yearLength
export const selectShowTemperatureOverlay = (state: ClimateStoreState) =>
  state.showTemperatureOverlay
export const selectSeasonProgress = (state: ClimateStoreState) =>
  state.climate.currentTime / state.climate.yearLength
