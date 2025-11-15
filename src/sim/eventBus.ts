type Listener<Payload> = (payload: Payload) => void

type ListenerSet = Set<Listener<unknown>>

type ListenerMap<EventKey> = Map<EventKey, ListenerSet>

export type EventBus<Events extends Record<string, unknown>> = {
  emit: <Key extends keyof Events>(event: Key, payload: Events[Key]) => void
  on: <Key extends keyof Events>(event: Key, listener: Listener<Events[Key]>) => () => void
  off: <Key extends keyof Events>(event: Key, listener: Listener<Events[Key]>) => void
  clear: (event?: keyof Events) => void
}

export const createEventBus = <Events extends Record<string, unknown>>(): EventBus<Events> => {
  const listeners: ListenerMap<keyof Events> = new Map()

  const getListenerSet = (event: keyof Events): ListenerSet => {
    let set = listeners.get(event)
    if (!set) {
      set = new Set()
      listeners.set(event, set)
    }
    return set
  }

  const emit = <Key extends keyof Events>(event: Key, payload: Events[Key]) => {
    const set = listeners.get(event)
    if (!set) {
      return
    }

    for (const listener of set) {
      ;(listener as Listener<Events[Key]>)(payload)
    }
  }

  const on = <Key extends keyof Events>(event: Key, listener: Listener<Events[Key]>) => {
    const set = getListenerSet(event)
    set.add(listener as Listener<unknown>)

    return () => {
      off(event, listener)
    }
  }

  const off = <Key extends keyof Events>(event: Key, listener: Listener<Events[Key]>) => {
    const set = listeners.get(event)
    if (!set) {
      return
    }

    set.delete(listener as Listener<unknown>)
    if (set.size === 0) {
      listeners.delete(event)
    }
  }

  const clear = (event?: keyof Events) => {
    if (typeof event === 'undefined') {
      listeners.clear()
      return
    }

    listeners.delete(event)
  }

  return { emit, on, off, clear }
}
