const DEFAULT_NOTIFICATION_LINK = '/notifications'

function getNotificationPayload(event) {
  if (!event.data) return null

  try {
    return event.data.json()
  } catch {
    return { notification: { title: 'RANDSA', body: event.data.text() }, data: {} }
  }
}

function getSafeNotificationLink(value) {
  const link = typeof value === 'string' ? value.trim() : ''
  return link.startsWith('/') && !link.startsWith('//') ? link : DEFAULT_NOTIFICATION_LINK
}

self.addEventListener('push', (event) => {
  const payload = getNotificationPayload(event)
  if (!payload) return

  const notification = payload.notification || {}
  const data = payload.data || {}
  const title = notification.title || data.title || 'RANDSA'
  const body = notification.body || data.body || 'You have a new notification.'
  const link = getSafeNotificationLink(data.link || notification.click_action)

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { ...data, link },
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.notificationId || undefined,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = new URL(
    getSafeNotificationLink(event.notification?.data?.link),
    self.location.origin
  ).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windowClients) => {
      const existingClient = windowClients.find((client) =>
        client.url.startsWith(self.location.origin)
      )

      if (existingClient) {
        await existingClient.navigate(targetUrl)
        return existingClient.focus()
      }

      return clients.openWindow(targetUrl)
    })
  )
})
