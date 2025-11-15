import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createSystemEventBus,
  getSystemEventBus,
  resetSystemEventBus,
  type SystemEventBusSaveEvent,
  type SystemEventBusErrorEvent,
  type SystemEventBusDisasterEvent,
} from './systemEventBus'

describe('systemEventBus integration patterns', () => {
  beforeEach(() => {
    resetSystemEventBus()
  })

  describe('notification bridge patterns', () => {
    it('bridges save events to notification callbacks', () => {
      const bus = getSystemEventBus()
      const notificationCallback = vi.fn()

      bus.on('save', (event) => {
        notificationCallback(`Planet saved to slot ${event.slotIndex}`, 'info', 3000)
      })

      const event: SystemEventBusSaveEvent = {
        slotIndex: 1,
        timestamp: Date.now(),
      }

      bus.emit('save', event)

      expect(notificationCallback).toHaveBeenCalledWith('Planet saved to slot 1', 'info', 3000)
      expect(notificationCallback).toHaveBeenCalledTimes(1)
    })

    it('bridges error events to notification callbacks', () => {
      const bus = getSystemEventBus()
      const notificationCallback = vi.fn()

      bus.on('error', (event) => {
        notificationCallback(event.message, 'error', 5000)
      })

      const event: SystemEventBusErrorEvent = {
        message: 'Failed to load terrain data',
        context: 'terrain_generation',
      }

      bus.emit('error', event)

      expect(notificationCallback).toHaveBeenCalledWith(
        'Failed to load terrain data',
        'error',
        5000,
      )
      expect(notificationCallback).toHaveBeenCalledTimes(1)
    })

    it('bridges disaster events to notification callbacks', () => {
      const bus = getSystemEventBus()
      const notificationCallback = vi.fn()

      bus.on('disaster', (event) => {
        notificationCallback(event.description, 'warn', 8000)
      })

      const event: SystemEventBusDisasterEvent = {
        type: 'volcano',
        severity: 'severe',
        description: 'Major volcanic eruption in equatorial region',
      }

      bus.emit('disaster', event)

      expect(notificationCallback).toHaveBeenCalledWith(
        'Major volcanic eruption in equatorial region',
        'warn',
        8000,
      )
      expect(notificationCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('multiple notification subscriptions', () => {
    it('handles multiple events with different notification callbacks', () => {
      const bus = getSystemEventBus()
      const saveCallback = vi.fn()
      const errorCallback = vi.fn()
      const disasterCallback = vi.fn()

      bus.on('save', (event) => {
        saveCallback(`Saved to slot ${event.slotIndex}`)
      })

      bus.on('error', (event) => {
        errorCallback(event.message)
      })

      bus.on('disaster', (event) => {
        disasterCallback(event.description)
      })

      const saveEvent: SystemEventBusSaveEvent = { slotIndex: 0, timestamp: Date.now() }
      bus.emit('save', saveEvent)

      const errorEvent: SystemEventBusErrorEvent = { message: 'System error occurred' }
      bus.emit('error', errorEvent)

      const disasterEvent: SystemEventBusDisasterEvent = {
        type: 'earthquake',
        severity: 'moderate',
        description: 'Earthquake detected',
      }
      bus.emit('disaster', disasterEvent)

      expect(saveCallback).toHaveBeenCalledTimes(1)
      expect(errorCallback).toHaveBeenCalledTimes(1)
      expect(disasterCallback).toHaveBeenCalledTimes(1)
    })

    it('allows cleanup of notification subscriptions', () => {
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
  })

  describe('global event bus singleton pattern', () => {
    it('maintains consistent listener subscriptions across resets', () => {
      const bus1 = getSystemEventBus()
      const listener1 = vi.fn()

      bus1.on('save', listener1)

      const event1: SystemEventBusSaveEvent = { slotIndex: 0, timestamp: Date.now() }
      bus1.emit('save', event1)

      expect(listener1).toHaveBeenCalledTimes(1)

      resetSystemEventBus()

      const bus2 = getSystemEventBus()
      expect(bus1).not.toBe(bus2)

      const listener2 = vi.fn()
      bus2.on('save', listener2)

      const event2: SystemEventBusSaveEvent = { slotIndex: 1, timestamp: Date.now() }
      bus2.emit('save', event2)

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('clears old listeners after reset', () => {
      const bus1 = getSystemEventBus()
      const listener = vi.fn()

      bus1.on('error', listener)

      resetSystemEventBus()

      const bus2 = getSystemEventBus()

      const event: SystemEventBusErrorEvent = { message: 'Test error' }
      bus2.emit('error', event)

      expect(listener).toHaveBeenCalledTimes(0)
    })
  })
})
