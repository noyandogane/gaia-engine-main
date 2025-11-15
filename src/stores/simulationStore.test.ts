import { beforeEach, describe, expect, it } from 'vitest'

import {
  createEventBus,
  DEFAULT_SIMULATION_SPEEDS,
  type SimulationEvents,
  type SimulationTickEvent,
  type SimulationTickScheduler,
} from '@sim'

import {
  selectSimulationElapsedMs,
  selectSimulationRunning,
  selectSimulationSpeeds,
  useSimulationStore,
} from './simulationStore'

type StateListener = (state: { running: boolean; speed: number }) => void

type TickListener = (tick: SimulationTickEvent) => void

const createMockScheduler = () => {
  const speeds = Object.freeze([
    { label: '1x', multiplier: 1 },
    { label: '3x', multiplier: 3 },
  ]) satisfies ReadonlyArray<(typeof DEFAULT_SIMULATION_SPEEDS)[number]>
  const fixedDeltaMs = 25
  let state = { running: false, speed: speeds[0].multiplier }
  const stateListeners = new Set<StateListener>()
  const tickListeners = new Set<TickListener>()
  const bus = createEventBus<SimulationEvents>()

  const emitState = () => {
    const snapshot = { ...state }
    stateListeners.forEach((listener) => listener(snapshot))
    bus.emit('state', snapshot)
  }

  const scheduler: SimulationTickScheduler = {
    play: () => {
      if (state.running) {
        return
      }

      state = { ...state, running: true }
      emitState()
    },
    pause: () => {
      if (!state.running) {
        return
      }

      state = { ...state, running: false }
      emitState()
    },
    toggle: () => {
      if (state.running) {
        scheduler.pause()
      } else {
        scheduler.play()
      }
    },
    setSpeed: (multiplier) => {
      if (state.speed === multiplier) {
        return
      }

      state = { ...state, speed: multiplier }
      emitState()
    },
    getSpeeds: () => speeds,
    getState: () => ({ ...state }),
    onTick: (listener) => {
      tickListeners.add(listener)
      return () => {
        tickListeners.delete(listener)
      }
    },
    onStateChange: (listener) => {
      stateListeners.add(listener)
      listener({ ...state })
      return () => {
        stateListeners.delete(listener)
      }
    },
    dispose: () => {
      stateListeners.clear()
      tickListeners.clear()
    },
    getFixedDeltaMs: () => fixedDeltaMs,
    bus,
  }

  const emitTick = (tick: SimulationTickEvent) => {
    tickListeners.forEach((listener) => listener(tick))
    bus.emit('tick', tick)
  }

  return { scheduler, emitTick, speeds, fixedDeltaMs }
}

describe('simulationStore', () => {
  beforeEach(() => {
    useSimulationStore.getState().reset()
  })

  it('hydrates from a scheduler snapshot', () => {
    const { scheduler, speeds, fixedDeltaMs } = createMockScheduler()

    const detach = useSimulationStore.getState().hydrateFromScheduler(scheduler)
    const state = useSimulationStore.getState()

    expect(state.running).toBe(false)
    expect(state.speed).toBe(speeds[0].multiplier)
    expect(state.speeds).toEqual(speeds)
    expect(state.fixedDeltaMs).toBe(fixedDeltaMs)
    expect(state.lastTick).toBeNull()

    detach()
  })

  it('reflects scheduler updates', () => {
    const { scheduler, emitTick } = createMockScheduler()

    const detach = useSimulationStore.getState().hydrateFromScheduler(scheduler)

    scheduler.play()
    expect(selectSimulationRunning(useSimulationStore.getState())).toBe(true)

    scheduler.setSpeed(3)
    expect(useSimulationStore.getState().speed).toBe(3)

    const tick: SimulationTickEvent = {
      frame: 5,
      fixedDeltaMs: scheduler.getFixedDeltaMs(),
      elapsedMs: 125,
      speed: 3,
    }
    emitTick(tick)

    const state = useSimulationStore.getState()
    expect(state.frame).toBe(tick.frame)
    expect(selectSimulationElapsedMs(state)).toBe(tick.elapsedMs)
    expect(state.lastTick).toEqual(tick)

    detach()
  })

  it('controls the scheduler through actions', () => {
    const { scheduler } = createMockScheduler()

    const detach = useSimulationStore.getState().hydrateFromScheduler(scheduler)

    useSimulationStore.getState().play()
    expect(scheduler.getState().running).toBe(true)

    useSimulationStore.getState().setSpeed(3)
    expect(scheduler.getState().speed).toBe(3)

    useSimulationStore.getState().toggle()
    expect(scheduler.getState().running).toBe(false)

    detach()
  })

  it('resets snapshot when detached', () => {
    const { scheduler, emitTick } = createMockScheduler()

    const detach = useSimulationStore.getState().hydrateFromScheduler(scheduler)

    scheduler.play()
    emitTick({
      frame: 2,
      fixedDeltaMs: scheduler.getFixedDeltaMs(),
      elapsedMs: 50,
      speed: 1,
    })

    detach()

    const state = useSimulationStore.getState()
    expect(selectSimulationRunning(state)).toBe(false)
    expect(selectSimulationSpeeds(state)).toEqual(DEFAULT_SIMULATION_SPEEDS)
    expect(state.lastTick).toBeNull()
    expect(state.frame).toBe(0)
    expect(state.elapsedMs).toBe(0)
  })
})
