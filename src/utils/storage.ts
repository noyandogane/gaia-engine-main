const createNoopStorage = (): Storage => ({
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  get length() {
    return 0
  },
})

const noopStorage = createNoopStorage()

export type ResolveStorage = () => Storage

export const resolveStorage: ResolveStorage = () => {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // Ignore access errors, fall back to noop storage
  }

  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    const storage = (globalThis as { localStorage?: Storage }).localStorage
    if (storage) {
      return storage
    }
  }

  return noopStorage
}
