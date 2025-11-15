import { describe, expect, it } from 'vitest'

import { createTickScheduler, type SimulationTickEvent } from './tickScheduler'

type TestRuntime = {
  now: () => number
  timer: {
    set: (callback: () => void, delay: number) => unknown
    clear: (handle: unknown) => void
  }
  advance: (ms: number) => void
  flush: () => void
}

const createTestRuntime = (): TestRuntime => {
  let currentTime = 0
  const queue: Array<() => void> = []

  const timer = {
    set: (callback: () => void) => {
      queue.push(callback)
      return callback
    },
    clear: (handle: unknown) => {
      const index = queue.indexOf(handle as () => void)
      if (index >= 0) {
        queue.splice(index, 1)
      }
    },
  }

  const flush = () => {
    if (queue.length === 0) {
      return
    }

    const callbacks = queue.splice(0, queue.length)
    for (const callback of callbacks) {
      callback()
    }
  }

  const advance = (ms: number) => {
    currentTime += ms
    flush()
  }

  return {
    now: () => currentTime,
    timer,
    advance,
    flush,
  }
}

describe('createTickScheduler', () => {
  it('emits ticks at the configured cadence', () => {
    const runtime = createTestRuntime()
    const scheduler = createTickScheduler({
      fixedDeltaMs: 50,
      frameIntervalMs: 0,
      now: runtime.now,
      timer: runtime.timer,
    })

    const ticks: SimulationTickEvent[] = []
    scheduler.onTick((tick) => ticks.push(tick))
    scheduler.play()

    runtime.advance(0)
    expect(ticks).toHaveLength(0)

    runtime.advance(50)
    expect(ticks).toHaveLength(1)
    expect(ticks[0]).toMatchObject({ frame: 1, fixedDeltaMs: 50, elapsedMs: 50 })

    runtime.advance(50)
    expect(ticks).toHaveLength(2)

    runtime.advance(100)
    expect(ticks).toHaveLength(4)
    expect(ticks.at(-1)?.frame).toBe(4)
    expect(ticks.at(-1)?.elapsedMs).toBe(200)

    scheduler.pause()

    runtime.advance(200)
    expect(ticks).toHaveLength(4)

    scheduler.dispose()
  })

  it('scales tick frequency with the selected speed multiplier', () => {
    const runtime = createTestRuntime()
    const scheduler = createTickScheduler({
      fixedDeltaMs: 50,
      frameIntervalMs: 0,
      now: runtime.now,
      timer: runtime.timer,
    })

    const ticks: SimulationTickEvent[] = []
    scheduler.onTick((tick) => ticks.push(tick))

    scheduler.play()
    runtime.advance(50)

    expect(ticks).toHaveLength(1)

    scheduler.setSpeed(5)
    runtime.advance(50)

    expect(ticks).toHaveLength(6)

    const acceleratedTicks = ticks.slice(1)
    expect(acceleratedTicks).toHaveLength(5)
    expect(acceleratedTicks.every((tick) => tick.fixedDeltaMs === 50)).toBe(true)
    expect(acceleratedTicks.at(-1)?.frame).toBe(6)
    expect(acceleratedTicks.at(-1)?.elapsedMs).toBe(300)

    scheduler.dispose()
  })
})
