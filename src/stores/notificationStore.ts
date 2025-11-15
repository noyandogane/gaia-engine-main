import { create } from 'zustand'

export type NotificationVariant = 'info' | 'warn' | 'error'

export type NotificationEntry = {
  readonly id: string
  readonly variant: NotificationVariant
  readonly message: string
  readonly title?: string
  readonly createdAt: number
  readonly durationMs: number | null
}

type NotificationInput = {
  readonly id?: string
  readonly variant: NotificationVariant
  readonly message: string
  readonly title?: string
  readonly durationMs?: number | null
}

type NotificationStoreState = {
  readonly notifications: ReadonlyArray<NotificationEntry>
  readonly push: (input: NotificationInput) => NotificationEntry
  readonly dismiss: (id: string) => void
  readonly clear: () => void
}

const DEFAULT_DURATION_MS = 6000
let notificationSeed = 0

const createNotificationId = () => {
  notificationSeed += 1
  return `toast-${Date.now()}-${notificationSeed}`
}

const resolveDuration = (duration: NotificationInput['durationMs']): number | null => {
  if (typeof duration === 'number') {
    return duration > 0 ? duration : null
  }

  if (duration === null) {
    return null
  }

  return DEFAULT_DURATION_MS
}

export const useNotificationStore = create<NotificationStoreState>()((set) => ({
  notifications: [],
  push: (input) => {
    const id = input.id ?? createNotificationId()
    const notification: NotificationEntry = {
      id,
      variant: input.variant,
      message: input.message,
      title: input.title,
      createdAt: Date.now(),
      durationMs: resolveDuration(input.durationMs),
    }

    set((state) => ({
      notifications: [...state.notifications.filter((item) => item.id !== id), notification],
    }))

    return notification
  },
  dismiss: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    }))
  },
  clear: () => {
    set(() => ({ notifications: [] }))
  },
}))

export const selectNotifications = (state: NotificationStoreState) => state.notifications

export type NotifyOptions = {
  readonly id?: string
  readonly title?: string
  readonly durationMs?: number | null
}

const dispatchNotification = (
  variant: NotificationVariant,
  message: string,
  options: NotifyOptions = {},
) => {
  const record = useNotificationStore.getState().push({
    variant,
    message,
    title: options.title,
    durationMs: options.durationMs,
    id: options.id,
  })

  return record
}

export const notifyInfo = (message: string, options?: NotifyOptions) =>
  dispatchNotification('info', message, options)

export const notifyWarn = (message: string, options?: NotifyOptions) =>
  dispatchNotification('warn', message, options)

export const notifyError = (message: string, options?: NotifyOptions) =>
  dispatchNotification('error', message, options)

export const dismissNotification = (id: string) => {
  useNotificationStore.getState().dismiss(id)
}

export const clearNotifications = () => {
  useNotificationStore.getState().clear()
}

export const notify = (
  variant: NotificationVariant,
  message: string,
  options?: NotifyOptions,
) => dispatchNotification(variant, message, options)
