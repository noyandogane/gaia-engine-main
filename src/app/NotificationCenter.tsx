import { useEffect } from 'react'

import { selectNotifications, useNotificationStore } from '@stores'

const VARIANT_LABELS = {
  info: 'Information',
  warn: 'Warning',
  error: 'Error',
} as const

const NotificationCenter = () => {
  const notifications = useNotificationStore(selectNotifications)
  const dismiss = useNotificationStore((state) => state.dismiss)

  useEffect(() => {
    const timers = notifications.map((notification) => {
      if (notification.durationMs === null) {
        return null
      }

      const elapsed = Date.now() - notification.createdAt
      const remaining = notification.durationMs - elapsed

      if (remaining <= 0) {
        dismiss(notification.id)
        return null
      }

      const timerId = window.setTimeout(() => dismiss(notification.id), remaining)

      return () => {
        window.clearTimeout(timerId)
      }
    })

    return () => {
      for (const dispose of timers) {
        dispose?.()
      }
    }
  }, [notifications, dismiss])

  if (notifications.length === 0) {
    return null
  }

  return (
    <aside
      className="hud__notifications"
      aria-live="assertive"
      aria-relevant="additions text"
      role="region"
      aria-label="Simulation notifications"
      data-testid="notification-center"
    >
      {notifications.map((notification) => {
        const label = notification.title ?? VARIANT_LABELS[notification.variant]

        return (
          <div
            key={notification.id}
            className="hud__notification"
            data-variant={notification.variant}
            role="status"
          >
            <div className="hud__notification-text">
              <span className="hud__notification-title">{label}</span>
              <p className="hud__notification-message">{notification.message}</p>
            </div>

            <button
              type="button"
              className="hud__notification-dismiss"
              onClick={() => dismiss(notification.id)}
              aria-label={`Dismiss ${label} notification`}
            >
              Dismiss
            </button>
          </div>
        )
      })}
    </aside>
  )
}

export default NotificationCenter
