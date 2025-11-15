import { describe, expect, it, vi } from 'vitest'

import { createEventBus } from './eventBus'

type TestEvents = {
  tick: { frame: number }
  state: { running: boolean }
  message: string
}

describe('eventBus', () => {
  describe('subscription and emission', () => {
    it('subscribes to events and calls listener', () => {
      const bus = createEventBus<TestEvents>()
      const listener = vi.fn()

      bus.on('tick', listener)
      bus.emit('tick', { frame: 1 })

      expect(listener).toHaveBeenCalledWith({ frame: 1 })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('handles multiple listeners for the same event', () => {
      const bus = createEventBus<TestEvents>()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      bus.on('tick', listener1)
      bus.on('tick', listener2)

      bus.emit('tick', { frame: 1 })

      expect(listener1).toHaveBeenCalledWith({ frame: 1 })
      expect(listener2).toHaveBeenCalledWith({ frame: 1 })
    })

    it('handles multiple event types', () => {
      const bus = createEventBus<TestEvents>()
      const tickListener = vi.fn()
      const stateListener = vi.fn()
      const messageListener = vi.fn()

      bus.on('tick', tickListener)
      bus.on('state', stateListener)
      bus.on('message', messageListener)

      bus.emit('tick', { frame: 1 })
      bus.emit('state', { running: true })
      bus.emit('message', 'hello')

      expect(tickListener).toHaveBeenCalledWith({ frame: 1 })
      expect(stateListener).toHaveBeenCalledWith({ running: true })
      expect(messageListener).toHaveBeenCalledWith('hello')
    })
  })

  describe('unsubscription', () => {
    it('on() returns an unsubscribe function', () => {
      const bus = createEventBus<TestEvents>()
      const listener = vi.fn()

      const unsubscribe = bus.on('tick', listener)

      expect(typeof unsubscribe).toBe('function')
    })

    it('calling returned function unsubscribes listener', () => {
      const bus = createEventBus<TestEvents>()
      const listener = vi.fn()

      const unsubscribe = bus.on('tick', listener)

      bus.emit('tick', { frame: 1 })
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      bus.emit('tick', { frame: 2 })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('off() method removes listener', () => {
      const bus = createEventBus<TestEvents>()
      const listener = vi.fn()

      bus.on('tick', listener)
      bus.emit('tick', { frame: 1 })
      expect(listener).toHaveBeenCalledTimes(1)

      bus.off('tick', listener)
      bus.emit('tick', { frame: 2 })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('unsubscribing one listener does not affect others', () => {
      const bus = createEventBus<TestEvents>()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      const unsubscribe1 = bus.on('tick', listener1)
      bus.on('tick', listener2)

      bus.emit('tick', { frame: 1 })
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)

      unsubscribe1()

      bus.emit('tick', { frame: 2 })
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(2)
    })
  })

  describe('memory management', () => {
    it('removes empty listener sets to prevent memory leaks', () => {
      const bus = createEventBus<TestEvents>()
      const listener = vi.fn()

      const unsubscribe = bus.on('tick', listener)
      unsubscribe()

      bus.emit('tick', { frame: 1 })
      expect(listener).toHaveBeenCalledTimes(0)
    })

    it('adds the same listener twice to the set', () => {
      const bus = createEventBus<TestEvents>()
      const listener = vi.fn()

      bus.on('tick', listener)
      bus.on('tick', listener)

      bus.emit('tick', { frame: 1 })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('cleanly removes multiple listeners', () => {
      const bus = createEventBus<TestEvents>()
      const listeners = [vi.fn(), vi.fn(), vi.fn()]
      const unsubscribes = listeners.map((listener) => bus.on('tick', listener))

      listeners.forEach((listener) => {
        expect(listener).toHaveBeenCalledTimes(0)
      })

      bus.emit('tick', { frame: 1 })
      listeners.forEach((listener) => {
        expect(listener).toHaveBeenCalledTimes(1)
      })

      unsubscribes[1]()

      bus.emit('tick', { frame: 2 })
      expect(listeners[0]).toHaveBeenCalledTimes(2)
      expect(listeners[1]).toHaveBeenCalledTimes(1)
      expect(listeners[2]).toHaveBeenCalledTimes(2)

      unsubscribes[0]()
      unsubscribes[2]()

      bus.emit('tick', { frame: 3 })
      expect(listeners[0]).toHaveBeenCalledTimes(2)
      expect(listeners[1]).toHaveBeenCalledTimes(1)
      expect(listeners[2]).toHaveBeenCalledTimes(2)
    })
  })

  describe('clear functionality', () => {
    it('clears all listeners for a specific event', () => {
      const bus = createEventBus<TestEvents>()
      const tickListener = vi.fn()
      const stateListener = vi.fn()

      bus.on('tick', tickListener)
      bus.on('state', stateListener)

      bus.clear('tick')

      bus.emit('tick', { frame: 1 })
      bus.emit('state', { running: true })

      expect(tickListener).toHaveBeenCalledTimes(0)
      expect(stateListener).toHaveBeenCalledTimes(1)
    })

    it('clears all listeners when no event specified', () => {
      const bus = createEventBus<TestEvents>()
      const tickListener = vi.fn()
      const stateListener = vi.fn()
      const messageListener = vi.fn()

      bus.on('tick', tickListener)
      bus.on('state', stateListener)
      bus.on('message', messageListener)

      bus.clear()

      bus.emit('tick', { frame: 1 })
      bus.emit('state', { running: true })
      bus.emit('message', 'hello')

      expect(tickListener).toHaveBeenCalledTimes(0)
      expect(stateListener).toHaveBeenCalledTimes(0)
      expect(messageListener).toHaveBeenCalledTimes(0)
    })
  })

  describe('edge cases', () => {
    it('handles emission with no listeners', () => {
      const bus = createEventBus<TestEvents>()

      expect(() => {
        bus.emit('tick', { frame: 1 })
      }).not.toThrow()
    })

    it('handles listener that throws', () => {
      const bus = createEventBus<TestEvents>()
      const throwingListener = vi.fn(() => {
        throw new Error('Listener error')
      })
      const normalListener = vi.fn()

      bus.on('tick', throwingListener)
      bus.on('tick', normalListener)

      expect(() => {
        bus.emit('tick', { frame: 1 })
      }).toThrow()

      expect(throwingListener).toHaveBeenCalled()
      expect(normalListener).not.toHaveBeenCalled()
    })

    it('handles unsubscribing same listener multiple times', () => {
      const bus = createEventBus<TestEvents>()
      const listener = vi.fn()

      const unsubscribe = bus.on('tick', listener)

      unsubscribe()
      expect(() => {
        unsubscribe()
      }).not.toThrow()

      bus.emit('tick', { frame: 1 })
      expect(listener).toHaveBeenCalledTimes(0)
    })

    it('handles off() with non-existent listener', () => {
      const bus = createEventBus<TestEvents>()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      bus.on('tick', listener1)

      expect(() => {
        bus.off('tick', listener2)
      }).not.toThrow()

      bus.emit('tick', { frame: 1 })
      expect(listener1).toHaveBeenCalledTimes(1)
    })
  })

  describe('unsubscribe patterns', () => {
    it('supports cleanup pattern with unsubscribe return value', () => {
      const bus = createEventBus<TestEvents>()
      const listener = vi.fn()

      let unsubscribe: (() => void) | null = null
      unsubscribe = bus.on('tick', listener)

      bus.emit('tick', { frame: 1 })
      expect(listener).toHaveBeenCalledTimes(1)

      if (unsubscribe) {
        unsubscribe()
      }

      bus.emit('tick', { frame: 2 })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('supports multiple subscriptions with independent unsubscribe', () => {
      const bus = createEventBus<TestEvents>()
      const listener = vi.fn()

      const unsubscribe1 = bus.on('tick', listener)
      const unsubscribe2 = bus.on('state', listener)

      bus.emit('tick', { frame: 1 })
      bus.emit('state', { running: true })
      expect(listener).toHaveBeenCalledTimes(2)

      unsubscribe1()

      bus.emit('tick', { frame: 2 })
      bus.emit('state', { running: false })
      expect(listener).toHaveBeenCalledTimes(3)

      unsubscribe2()

      bus.emit('tick', { frame: 3 })
      bus.emit('state', { running: true })
      expect(listener).toHaveBeenCalledTimes(3)
    })
  })
})
