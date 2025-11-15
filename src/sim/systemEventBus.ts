import { createEventBus, type EventBus } from './eventBus'

export type SystemEventBusSaveEvent = {
  slotIndex: number
  timestamp: number
}

export type SystemEventBusErrorEvent = {
  message: string
  error?: Error
  context?: string
}

export type SystemEventBusDisasterEvent = {
  type: string
  severity: 'minor' | 'moderate' | 'severe' | 'catastrophic'
  description: string
}

export type SystemEvents = {
  save: SystemEventBusSaveEvent
  error: SystemEventBusErrorEvent
  disaster: SystemEventBusDisasterEvent
}

export type SystemEventBus = EventBus<SystemEvents>

let globalBusInstance: SystemEventBus | null = null

export const createSystemEventBus = (): SystemEventBus => {
  return createEventBus<SystemEvents>()
}

export const getSystemEventBus = (): SystemEventBus => {
  if (!globalBusInstance) {
    globalBusInstance = createSystemEventBus()
  }
  return globalBusInstance
}

export const resetSystemEventBus = (): void => {
  if (globalBusInstance) {
    globalBusInstance.clear()
  }
  globalBusInstance = null
}
