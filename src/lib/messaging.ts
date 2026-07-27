import { getMessaging, getToken, isSupported } from 'firebase/messaging'

import { firebaseApp } from './firebase'

export const firebaseVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? ''

async function ensureMessagingSupport() {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured yet for push notifications.')
  }

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('Push notifications are only available in the browser.')
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported on this device.')
  }

  if (!firebaseVapidKey) {
    throw new Error(
      'Missing VITE_FIREBASE_VAPID_KEY. Add your Firebase Web Push certificate key before enabling push notifications.'
    )
  }

  const supported = await isSupported()

  if (!supported) {
    throw new Error('Firebase Messaging is not supported in this browser.')
  }

  return getMessaging(firebaseApp)
}

async function registerMessagingServiceWorker() {
  return navigator.serviceWorker.register('/firebase-messaging-sw.js')
}

export async function requestFirebaseMessagingToken() {
  const messaging = await ensureMessagingSupport()
  const serviceWorkerRegistration = await registerMessagingServiceWorker()
  const token = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration,
  })

  if (!token) {
    throw new Error(
      'Firebase did not return a device token. Check that Web Push certificates are configured in the Firebase console.'
    )
  }

  return token
}
