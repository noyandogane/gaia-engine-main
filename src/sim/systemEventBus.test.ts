import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createSystemEventBus,
  getSystemEventBus,
  resetSystemEventBus,
  type SystemEventBusSaveEvent,
  type SystemEventBusErrorEvent,
  type SystemEventBusDisasterEvent,
} from './systemEventBus'
import { notifyError, notifyInfo, notifyWarn } from '@stores'

describe('systemEventBus', () => {
  beforeEach(() => {
    resetSystemEventBus()
  })

  describe('subscription lifecycle', () => {
    it('subscribes to save events', () => {
      const bus = createSystemEventBus()
      const listener = vi.fn()

      bus.on('save', listener)

      const event: SystemEventBusSaveEvent = { slotIndex: 0, timestamp: Date.now() }
      bus.emit('save', event)

      expect(listener).toHaveBeenCalledWith(event)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('subscribes to error events', () => {
      const bus = createSystemEventBus()
      const listener = vi.fn()

      bus.on('error', listener)

      const event: SystemEventBusErrorEvent = { message: 'Test error', context: 'test' }
      bus.emit('error', event)

      expect(listener).toHaveBeenCalledWith(event)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('subscribes to disaster events', () => {
      const bus = createSystemEventBus()
      const listener = vi.fn()

      bus.on('disaster', listener)

      const event: SystemEventBusDisasterEvent = {
        type: 'volcano',
        severity: 'severe',
        description: 'Major volcanic eruption',
      }
      bus.emit('disaster', event)

      expect(listener).toHaveBeenCalledWith(event)
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('unsubscription and cleanup', () => {
    it('returns unsubscribe function from on()', () => {
      const bus = createSystemEventBus()
      const listener = vi.fn()

      const unsubscribe = bus.on('save', listener)

      expect(typeof unsubscribe).toBe('function')
    })

    it('stops calling listener after unsubscribe', () => {
      const bus = createSystemEventBus()
      const listener = vi.fn()

      const unsubscribe = bus.on('save', listener)

      const event1: SystemEventBusSaveEvent = { slotIndex: 0, timestamp: Date.now() }
      bus.emit('save', event1)
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      const event2: SystemEventBusSaveEvent = { slotIndex: 1, timestamp: Date.now() }
      bus.emit('save', event2)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('can unsubscribe using off() method', () => {
      const bus = createSystemEventBus()
      const listener = vi.fn()

      bus.on('error', listener)

      const event1: SystemEventBusErrorEvent = { message: 'Error 1' }
      bus.emit('error', event1)
      expect(listener).toHaveBeenCalledTimes(1)

      bus.off('error', listener)

      const event2: SystemEventBusErrorEvent = { message: 'Error 2' }
      bus.emit('error', event2)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('prevents memory leaks with multiple listeners', () => {
      const bus = createSystemEventBus()
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const listener3 = vi.fn()

      const unsubscribe1 = bus.on('save', listener1)
      const unsubscribe2 = bus.on('save', listener2)
      const unsubscribe3 = bus.on('save', listener3)

      const event: SystemEventBusSaveEvent = { slotIndex: 0, timestamp: Date.now() }
      bus.emit('save', event)

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
      expect(listener3).toHaveBeenCalledTimes(1)

      unsubscribe2()

      bus.emit('save', event)

      expect(listener1).toHaveBeenCalledTimes(2)
      expect(listener2).toHaveBeenCalledTimes(1)
      expect(listener3).toHaveBeenCalledTimes(2)

      unsubscribe1()
      unsubscribe3()

      bus.emit('save', event)

      expect(listener1).toHaveBeenCalledTimes(2)
      expect(listener2).toHaveBeenCalledTimes(1)
      expect(listener3).toHaveBeenCalledTimes(2)
    })
  })

  describe('multiple event types', () => {
    it('handles different event types independently', () => {
      const bus = createSystemEventBus()
      const saveListener = vi.fn()
      const errorListener = vi.fn()
      const disasterListener = vi.fn()

      bus.on('save', saveListener)
      bus.on('error', errorListener)
      bus.on('disaster', disasterListener)

      const saveEvent: SystemEventBusSaveEvent = { slotIndex: 0, timestamp: Date.now() }
      bus.emit('save', saveEvent)

      expect(saveListener).toHaveBeenCalledTimes(1)
      expect(errorListener).toHaveBeenCalledTimes(0)
      expect(disasterListener).toHaveBeenCalledTimes(0)

      const errorEvent: SystemEventBusErrorEvent = { message: 'Error' }
      bus.emit('error', errorEvent)

      expect(saveListener).toHaveBeenCalledTimes(1)
      expect(errorListener).toHaveBeenCalledTimes(1)
      expect(disasterListener).toHaveBeenCalledTimes(0)
    })
  })

  describe('global event bus singleton', () => {
    it('returns the same instance from getSystemEventBus()', () => {
      const bus1 = getSystemEventBus()
      const bus2 = getSystemEventBus()

      expect(bus1).toBe(bus2)
    })

    it('resets the global instance', () => {
      const bus1 = getSystemEventBus()
      const listener1 = vi.fn()
      bus1.on('save', listener1)

      resetSystemEventBus()

      const bus2 = getSystemEventBus()
      expect(bus1).not.toBe(bus2)

      const event: SystemEventBusSaveEvent = { slotIndex: 0, timestamp: Date.now() }
      bus2.emit('save', event)

      expect(listener1).toHaveBeenCalledTimes(0)
    })
  })

  describe('notification bridge integration', () => {
    it('can bridge save events to notifications', () => {
      vi.mock('@stores', async () => {
        const actual = await vi.importActual('@stores')
        return {
          ...actual,
          notifyInfo: vi.fn(),
        }
      })

      const bus = createSystemEventBus()
      const notificationListener = vi.fn((event: SystemEventBusSaveEvent) => {
        notifyInfo(`Planet saved to slot ${event.slotIndex}`, { durationMs: 3000 })
      })

      bus.on('save', notificationListener)

      const event: SystemEventBusSaveEvent = { slotIndex: 1, timestamp: Date.now() }
      bus.emit('save', event)

      expect(notificationListener).toHaveBeenCalledWith(event)
    })

    it('can bridge error events to notifications', () => {
      const bus = createSystemEventBus()
      const notificationListener = vi.fn((event: SystemEventBusErrorEvent) => {
        notifyError(event.message, { title: 'System Error' })
      })

      bus.on('error', notificationListener)

      const event: SystemEventBusErrorEvent = { message: 'Something went wrong', context: 'test' }
      bus.emit('error', event)

      expect(notificationListener).toHaveBeenCalledWith(event)
    })

    it('can bridge disaster events to notifications', () => {
      const bus = createSystemEventBus()
      const notificationListener = vi.fn((event: SystemEventBusDisasterEvent) => {
        const title = `${event.type} (${event.severity})`
        notifyWarn(event.description, { title })
      })

      bus.on('disaster', notificationListener)

      const event: SystemEventBusDisasterEvent = {
        type: 'asteroid',
        severity: 'catastrophic',
        description: 'Large asteroid impact detected',
      }
      bus.emit('disaster', event)

      expect(notificationListener).toHaveBeenCalledWith(event)
    })
  })

  describe('event emission', () => {
    it('emits save event with correct payload', () => {
      const bus = createSystemEventBus()
      const listener = vi.fn()

      bus.on('save', listener)

      const event: SystemEventBusSaveEvent = {
        slotIndex: 3,
        timestamp: 1234567890,
      }
      bus.emit('save', event)

      expect(listener).toHaveBeenCalledWith(event)
    })

    it('emits error event with optional error object', () => {
      const bus = createSystemEventBus()
      const listener = vi.fn()

      bus.on('error', listener)

      const error = new Error('Test error')
      const event: SystemEventBusErrorEvent = {
        message: 'An error occurred',
        error,
        context: 'rendering',
      }
      bus.emit('error', event)

      expect(listener).toHaveBeenCalledWith(event)
    })

    it('emits disaster event with all severity levels', () => {
      const bus = createSystemEventBus()
      const listener = vi.fn()

      bus.on('disaster', listener)

      const severities = ['minor', 'moderate', 'severe', 'catastrophic'] as const

      severities.forEach((severity) => {
        const event: SystemEventBusDisasterEvent = {
          type: 'test',
          severity,
          description: `Test disaster ${severity}`,
        }
        bus.emit('disaster', event)
      })

      expect(listener).toHaveBeenCalledTimes(4)
    })
  })

  describe('clear functionality', () => {
    it('clears all listeners for a specific event type', () => {
      const bus = createSystemEventBus()
      const saveListener = vi.fn()
      const errorListener = vi.fn()

      bus.on('save', saveListener)
      bus.on('error', errorListener)

      bus.clear('save')

      const saveEvent: SystemEventBusSaveEvent = { slotIndex: 0, timestamp: Date.now() }
      bus.emit('save', saveEvent)

      expect(saveListener).toHaveBeenCalledTimes(0)

      const errorEvent: SystemEventBusErrorEvent = { message: 'Error' }
      bus.emit('error', errorEvent)

      expect(errorListener).toHaveBeenCalledTimes(1)
    })

    it('clears all listeners when no event type specified', () => {
      const bus = createSystemEventBus()
      const saveListener = vi.fn()
      const errorListener = vi.fn()
      const disasterListener = vi.fn()

      bus.on('save', saveListener)
      bus.on('error', errorListener)
      bus.on('disaster', disasterListener)

      bus.clear()

      const saveEvent: SystemEventBusSaveEvent = { slotIndex: 0, timestamp: Date.now() }
      bus.emit('save', saveEvent)

      const errorEvent: SystemEventBusErrorEvent = { message: 'Error' }
      bus.emit('error', errorEvent)

      const disasterEvent: SystemEventBusDisasterEvent = {
        type: 'test',
        severity: 'minor',
        description: 'Test',
      }
      bus.emit('disaster', disasterEvent)

      expect(saveListener).toHaveBeenCalledTimes(0)
      expect(errorListener).toHaveBeenCalledTimes(0)
      expect(disasterListener).toHaveBeenCalledTimes(0)
    })
  })
})
