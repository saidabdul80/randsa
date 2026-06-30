self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification?.data?.link || '/notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existingClient = windowClients.find((client) => 'focus' in client)

      if (existingClient) {
        existingClient.navigate(targetUrl)
        return existingClient.focus()
      }

      return clients.openWindow(targetUrl)
    }),
  )
})
