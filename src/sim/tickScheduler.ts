import { createEventBus, type EventBus } from './eventBus'

type Listener<Payload> = (payload: Payload) => void

type TimerInterface = {
  set: (callback: () => void, delay: number) => unknown
  clear: (handle: unknown) => void
}

const DEFAULT_FIXED_DELTA_MS = 50
const DEFAULT_FRAME_INTERVAL_MS = 16
const DEFAULT_MAX_STEPS_PER_FRAME = 200

export type SimulationSpeedOption = {
  label: string
  multiplier: number
}

export type SimulationTickEvent = {
  frame: number
  fixedDeltaMs: number
  elapsedMs: number
  speed: number
}

export type SimulationState = {
  running: boolean
  speed: number
}

export type SimulationEvents = {
  tick: SimulationTickEvent
  state: SimulationState
}

export type SimulationTickSchedulerOptions = {
  fixedDeltaMs?: number
  frameIntervalMs?: number
  maxStepsPerFrame?: number
  speeds?: ReadonlyArray<SimulationSpeedOption>
  initialSpeedMultiplier?: number
  autoStart?: boolean
  now?: () => number
  timer?: TimerInterface
  bus?: EventBus<SimulationEvents>
}

export type SimulationTickScheduler = {
  play: () => void
  pause: () => void
  toggle: () => void
  setSpeed: (multiplier: number) => void
  getSpeeds: () => ReadonlyArray<SimulationSpeedOption>
  getState: () => SimulationState
  onTick: (listener: Listener<SimulationTickEvent>) => () => void
  onStateChange: (listener: Listener<SimulationState>) => () => void
  dispose: () => void
  getFixedDeltaMs: () => number
  bus: EventBus<SimulationEvents>
}

export const DEFAULT_SIMULATION_SPEEDS: ReadonlyArray<SimulationSpeedOption> = Object.freeze([
  { label: '1x', multiplier: 1 },
  { label: '5x', multiplier: 5 },
  { label: '20x', multiplier: 20 },
])

const createDefaultTimer = (): TimerInterface => ({
  set: (callback, delay) => globalThis.setTimeout(callback, delay),
  clear: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
})

export const createTickScheduler = (
  options: SimulationTickSchedulerOptions = {},
): SimulationTickScheduler => {
  const fixedDeltaMs = options.fixedDeltaMs ?? DEFAULT_FIXED_DELTA_MS
  if (fixedDeltaMs <= 0) {
    throw new Error('fixedDeltaMs must be greater than zero.')
  }

  const frameIntervalMs = Math.max(
    0,
    options.frameIntervalMs ?? Math.min(DEFAULT_FRAME_INTERVAL_MS, fixedDeltaMs),
  )
  const maxStepsPerFrame = Math.max(1, options.maxStepsPerFrame ?? DEFAULT_MAX_STEPS_PER_FRAME)

  const speedOptions: ReadonlyArray<SimulationSpeedOption> = Object.freeze(
    (options.speeds ?? DEFAULT_SIMULATION_SPEEDS).map((option) => ({
      label: option.label,
      multiplier: option.multiplier,
    })),
  )

  if (speedOptions.length === 0) {
    throw new Error('At least one speed option must be provided.')
  }

  const speedMultipliers = new Set(speedOptions.map((option) => option.multiplier))
  for (const multiplier of speedMultipliers) {
    if (multiplier <= 0) {
      throw new Error('Speed multipliers must be greater than zero.')
    }
  }

  const initialSpeed = options.initialSpeedMultiplier ?? speedOptions[0].multiplier
  if (!speedMultipliers.has(initialSpeed)) {
    throw new Error('Initial speed multiplier must be one of the configured speed options.')
  }

  const bus = options.bus ?? createEventBus<SimulationEvents>()
  const timer = options.timer ?? createDefaultTimer()
  const now = options.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()))

  let running = false
  let speed = initialSpeed
  let lastTime: number | null = null
  let accumulator = 0
  let frame = 0
  let elapsedMs = 0
  let timerHandle: unknown | null = null

  const getState = (): SimulationState => ({
    running,
    speed,
  })

  const emitState = () => {
    bus.emit('state', getState())
  }

  const scheduleLoop = () => {
    if (!running || timerHandle !== null) {
      return
    }

    timerHandle = timer.set(() => {
      timerHandle = null
      loop()
    }, frameIntervalMs)
  }

  const loop = () => {
    if (!running) {
      return
    }

    const currentTime = now()
    if (lastTime === null) {
      lastTime = currentTime
      scheduleLoop()
      return
    }

    const delta = currentTime - lastTime
    lastTime = currentTime

    if (delta <= 0) {
      scheduleLoop()
      return
    }

    const activeSpeed = speed
    accumulator += delta * activeSpeed

    let steps = 0
    while (accumulator >= fixedDeltaMs && steps < maxStepsPerFrame) {
      steps += 1
      accumulator -= fixedDeltaMs
      frame += 1
      elapsedMs += fixedDeltaMs

      bus.emit('tick', {
        frame,
        fixedDeltaMs,
        elapsedMs,
        speed: activeSpeed,
      })
    }

    if (steps === maxStepsPerFrame && accumulator >= fixedDeltaMs) {
      accumulator %= fixedDeltaMs
    }

    scheduleLoop()
  }

  const play = () => {
    if (running) {
      return
    }

    running = true
    lastTime = now()
    emitState()
    scheduleLoop()
  }

  const pause = () => {
    if (!running) {
      return
    }

    running = false

    if (timerHandle !== null) {
      timer.clear(timerHandle)
      timerHandle = null
    }

    lastTime = null
    emitState()
  }

  const toggle = () => {
    if (running) {
      pause()
    } else {
      play()
    }
  }

  const setSpeed = (multiplier: number) => {
    if (!speedMultipliers.has(multiplier)) {
      throw new Error(`Unsupported speed multiplier: ${multiplier}`)
    }

    if (multiplier === speed) {
      return
    }

    speed = multiplier
    emitState()
  }

  const onTick = (listener: Listener<SimulationTickEvent>) => bus.on('tick', listener)
  const onStateChange = (listener: Listener<SimulationState>) => {
    listener(getState())
    return bus.on('state', listener)
  }

  const dispose = () => {
    pause()
    accumulator = 0
    frame = 0
    elapsedMs = 0
    bus.clear()
  }

  emitState()

  if (options.autoStart) {
    play()
  }

  return {
    play,
    pause,
    toggle,
    setSpeed,
    getSpeeds: () => speedOptions,
    getState,
    onTick,
    onStateChange,
    dispose,
    getFixedDeltaMs: () => fixedDeltaMs,
    bus,
  }
}
