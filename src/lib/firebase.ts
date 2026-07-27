import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getFunctions, type Functions } from 'firebase/functions'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

export const isLocalAuthBypassEnabled = import.meta.env.VITE_ENABLE_LOCAL_AUTH_BYPASS === 'true'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
}

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const

const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key])

export const isFirebaseConfigured = missingKeys.length === 0
export const authMode = isLocalAuthBypassEnabled
  ? 'local'
  : isFirebaseConfigured
    ? 'firebase'
    : 'unconfigured'
export const firebaseConfigError = isFirebaseConfigured
  ? ''
  : `Missing Firebase environment values: ${missingKeys.join(', ')}`

export const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null
export const storage: FirebaseStorage | null = firebaseApp ? getStorage(firebaseApp) : null
export const functionsRegion = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION ?? 'us-central1'
export const functions: Functions | null = firebaseApp
  ? getFunctions(firebaseApp, functionsRegion)
  : null
