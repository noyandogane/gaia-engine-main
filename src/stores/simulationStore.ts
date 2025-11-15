import { create } from 'zustand'

import {
  DEFAULT_SIMULATION_SPEEDS,
  type SimulationTickEvent,
  type SimulationTickScheduler,
  type SimulationSpeedOption,
} from '@sim'

const DEFAULT_SPEED = DEFAULT_SIMULATION_SPEEDS[0]?.multiplier ?? 1

const createDefaultSnapshot = () => ({
  running: false,
  speed: DEFAULT_SPEED,
  speeds: DEFAULT_SIMULATION_SPEEDS,
  fixedDeltaMs: 0,
  lastTick: null as SimulationTickEvent | null,
  frame: 0,
  elapsedMs: 0,
})

type SimulationStoreSnapshot = ReturnType<typeof createDefaultSnapshot>

type SimulationStoreActions = {
  hydrateFromScheduler: (scheduler: SimulationTickScheduler) => () => void
  play: () => void
  pause: () => void
  toggle: () => void
  setSpeed: (multiplier: number) => void
  reset: () => void
}

export type SimulationStoreState = SimulationStoreSnapshot & SimulationStoreActions

let schedulerRef: SimulationTickScheduler | null = null
let unsubscribeState: (() => void) | null = null
let unsubscribeTick: (() => void) | null = null

const clearSubscriptions = () => {
  unsubscribeState?.()
  unsubscribeState = null
  unsubscribeTick?.()
  unsubscribeTick = null
}

const withHydratedSpeeds = (speeds: ReadonlyArray<SimulationSpeedOption>) =>
  speeds.length > 0 ? speeds : DEFAULT_SIMULATION_SPEEDS

export const useSimulationStore = create<SimulationStoreState>()((set) => ({
  ...createDefaultSnapshot(),
  hydrateFromScheduler: (scheduler) => {
    clearSubscriptions()
    schedulerRef = scheduler

    const nextSpeeds = withHydratedSpeeds(scheduler.getSpeeds())
    const currentState = scheduler.getState()

    set(() => ({
      ...createDefaultSnapshot(),
      running: currentState.running,
      speed: currentState.speed,
      speeds: nextSpeeds,
      fixedDeltaMs: scheduler.getFixedDeltaMs(),
    }))

    unsubscribeState = scheduler.onStateChange((state) => {
      set((storeState) => {
        if (storeState.running === state.running && storeState.speed === state.speed) {
          return storeState
        }

        return {
          running: state.running,
          speed: state.speed,
        }
      })
    })

    unsubscribeTick = scheduler.onTick((tick) => {
      set((storeState) => {
        if (storeState.lastTick?.frame === tick.frame && storeState.lastTick?.elapsedMs === tick.elapsedMs) {
          return storeState
        }

        return {
          lastTick: tick,
          frame: tick.frame,
          elapsedMs: tick.elapsedMs,
        }
      })
    })

    return () => {
      clearSubscriptions()
      schedulerRef = null
      set(() => createDefaultSnapshot())
    }
  },
  play: () => {
    schedulerRef?.play()
  },
  pause: () => {
    schedulerRef?.pause()
  },
  toggle: () => {
    schedulerRef?.toggle()
  },
  setSpeed: (multiplier) => {
    schedulerRef?.setSpeed(multiplier)
  },
  reset: () => {
    clearSubscriptions()
    schedulerRef = null
    set(() => createDefaultSnapshot())
  },
}))

export const selectSimulationRunning = (state: SimulationStoreState) => state.running
export const selectSimulationSpeed = (state: SimulationStoreState) => state.speed
export const selectSimulationSpeeds = (state: SimulationStoreState) => state.speeds
export const selectSimulationFixedDelta = (state: SimulationStoreState) => state.fixedDeltaMs
export const selectSimulationFrame = (state: SimulationStoreState) => state.frame
export const selectSimulationElapsedMs = (state: SimulationStoreState) => state.elapsedMs
export const selectSimulationLastTick = (state: SimulationStoreState) => state.lastTick
