import {
  type Auth,
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type UserCredential,
  type User,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

import { auth, authMode, db, firebaseConfigError, isFirebaseConfigured } from '../lib/firebase'
import type {
  ProfileCompletionPayload,
  RegisterPayload,
  SessionUser,
  UserProfile,
  UserRole,
} from '../types/user'
import type { VerificationStatus } from '../types/user'

interface LocalAuthRecord {
  uid: string
  email: string
  password: string
  profile: UserProfile
}

const LOCAL_USERS_KEY = 'randsa.local-auth.users'
const LOCAL_SESSION_KEY = 'randsa.local-auth.session'
const GOOGLE_REDIRECT_CONTEXT_KEY = 'randsa.google-auth.redirect-context'
const GOOGLE_REDIRECT_RETURN_TO_KEY = 'randsa.google-auth.return-to'
const GOOGLE_FLOW_STATE_KEY = 'randsa.google-auth.flow-state'

interface GoogleRedirectContext {
  phone?: string
  role?: Exclude<UserRole, 'admin'>
  returnTo?: string
  source?: 'login' | 'register'
}

interface GoogleFlowState {
  mode: 'popup' | 'redirect'
  source?: 'login' | 'register'
  returnTo?: string
  startedAt: string
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function readLocalUsers() {
  if (!canUseStorage()) {
    return [] as LocalAuthRecord[]
  }

  const raw = window.localStorage.getItem(LOCAL_USERS_KEY)

  if (!raw) {
    return [] as LocalAuthRecord[]
  }

  try {
    return JSON.parse(raw) as LocalAuthRecord[]
  } catch {
    return [] as LocalAuthRecord[]
  }
}

function writeLocalUsers(users: LocalAuthRecord[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

function persistLocalSession(user: SessionUser | null) {
  if (!canUseStorage()) {
    return
  }

  if (!user) {
    window.localStorage.removeItem(LOCAL_SESSION_KEY)
    return
  }

  window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user))
}

export function getLocalSessionUser() {
  if (!canUseStorage()) {
    return null
  }

  const raw = window.localStorage.getItem(LOCAL_SESSION_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

function createSessionUser(profile: UserProfile): SessionUser {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.fullName,
  }
}

function updateLocalUserProfile(uid: string, updater: (profile: UserProfile) => UserProfile) {
  const users = readLocalUsers()
  const index = users.findIndex((user) => user.uid === uid)

  if (index === -1) {
    throw new Error('Your local bypass account was not found.')
  }

  const current = users[index]
  const nextProfile = sanitizeProfile(updater(current.profile))

  users[index] = {
    ...current,
    email: nextProfile.email,
    profile: nextProfile,
  }

  writeLocalUsers(users)
  persistLocalSession(createSessionUser(nextProfile))
  return nextProfile
}

function getFirebaseServices() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(
      firebaseConfigError ||
        'Firebase is not configured. Add your VITE_FIREBASE_* values before using authentication.'
    )
  }

  return { auth, db }
}

function sanitizeProfile(data: Partial<UserProfile> & { uid: string }): UserProfile {
  return {
    uid: data.uid,
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    role: data.role ?? 'tenant',
    photoURL: data.photoURL ?? '',
    isVerifiedAgent: data.isVerifiedAgent ?? false,
    verificationStatus: data.verificationStatus ?? 'not_submitted',
    createdAt: data.createdAt ?? null,
  }
}

function buildDisplayNameFromUser(user: User) {
  const trimmedName = user.displayName?.trim()

  if (trimmedName) {
    return trimmedName
  }

  const emailName = user.email
    ?.split('@')[0]
    ?.replace(/[._-]+/g, ' ')
    .trim()

  if (emailName) {
    return emailName
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  return 'RANDSA User'
}

function createGoogleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account',
  })

  return provider
}

function writeGoogleRedirectContext(context: GoogleRedirectContext) {
  if (!canUseSessionStorage()) {
    return
  }

  window.sessionStorage.setItem(GOOGLE_REDIRECT_CONTEXT_KEY, JSON.stringify(context))
}

function readGoogleRedirectContext() {
  if (!canUseSessionStorage()) {
    return null
  }

  const raw = window.sessionStorage.getItem(GOOGLE_REDIRECT_CONTEXT_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as GoogleRedirectContext
  } catch {
    return null
  }
}

function clearGoogleRedirectContext() {
  if (!canUseSessionStorage()) {
    return
  }

  window.sessionStorage.removeItem(GOOGLE_REDIRECT_CONTEXT_KEY)
}

function writeGoogleFlowState(state: GoogleFlowState) {
  if (!canUseSessionStorage()) {
    return
  }

  window.sessionStorage.setItem(GOOGLE_FLOW_STATE_KEY, JSON.stringify(state))
}

function readGoogleFlowState() {
  if (!canUseSessionStorage()) {
    return null
  }

  const raw = window.sessionStorage.getItem(GOOGLE_FLOW_STATE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as GoogleFlowState
  } catch {
    return null
  }
}

function clearGoogleFlowState() {
  if (!canUseSessionStorage()) {
    return
  }

  window.sessionStorage.removeItem(GOOGLE_FLOW_STATE_KEY)
}

function writeGoogleRedirectReturnTo(path: string) {
  if (!canUseSessionStorage()) {
    return
  }

  window.sessionStorage.setItem(GOOGLE_REDIRECT_RETURN_TO_KEY, path)
}

export function consumeGoogleRedirectReturnTo() {
  if (!canUseSessionStorage()) {
    return null
  }

  const target = window.sessionStorage.getItem(GOOGLE_REDIRECT_RETURN_TO_KEY)

  if (!target) {
    return null
  }

  window.sessionStorage.removeItem(GOOGLE_REDIRECT_RETURN_TO_KEY)
  return target
}

export function hasPendingGoogleAuthFlow() {
  return Boolean(readGoogleFlowState())
}

export function getPendingGoogleAuthMessage() {
  const flow = readGoogleFlowState()

  if (!flow) {
    return ''
  }

  const ageMs = Date.now() - new Date(flow.startedAt).getTime()
  const isSlow = Number.isFinite(ageMs) && ageMs > 15000

  if (flow.mode === 'redirect') {
    return isSlow
      ? 'Google redirect is taking longer than expected on this network. If it keeps hanging, reload once or use email and password for now.'
      : 'Google redirect sign-in is in progress. If you were sent away and came back, wait a moment for Firebase to finish the redirect result.'
  }

  return isSlow
    ? 'Google popup sign-in took too long to respond. RANDSA can fall back to redirect mode, or you can continue with email and password for now.'
    : 'Google popup sign-in is still trying to connect. If it stalls, RANDSA will fall back to redirect mode.'
}

function signInWithPopupWithTimeout(auth: Auth, provider: GoogleAuthProvider, timeoutMs = 12000) {
  return new Promise<UserCredential>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject({ code: 'auth/popup-timeout' })
    }, timeoutMs)

    signInWithPopup(auth, provider)
      .then((credential) => {
        window.clearTimeout(timer)
        resolve(credential)
      })
      .catch((error) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
}

function shouldFallbackGooglePopupToRedirect(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : ''

  const message = error instanceof Error ? error.message : ''

  return (
    code === 'auth/network-request-failed' ||
    code === 'auth/popup-timeout' ||
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/popup-blocked' ||
    code === 'auth/cancelled-popup-request' ||
    /ERR_CONNECTION_TIMED_OUT/i.test(message) ||
    /apis\.google\.com/i.test(message)
  )
}

async function finalizeGoogleSignInCredential(
  credential: UserCredential,
  options?: {
    phone?: string
    role?: Exclude<UserRole, 'admin'>
  }
) {
  const isNewUser = Boolean(getAdditionalUserInfo(credential)?.isNewUser)

  try {
    return await ensureFirebaseUserProfile(credential.user, options)
  } catch (error) {
    if (isNewUser) {
      await deleteUser(credential.user).catch(() => undefined)
    }

    throw error
  }
}

async function ensureFirebaseUserProfile(
  user: User,
  options?: {
    phone?: string
    role?: Exclude<UserRole, 'admin'>
  }
) {
  const { db } = getFirebaseServices()
  const snapshot = await getDoc(doc(db, 'users', user.uid))

  if (snapshot.exists()) {
    return sanitizeProfile({
      uid: snapshot.id,
      ...(snapshot.data() as Partial<UserProfile>),
    })
  }

  const email = user.email?.trim().toLowerCase()

  if (!email) {
    throw new Error('Your Google account did not return an email address.')
  }

  const profile = {
    fullName: buildDisplayNameFromUser(user),
    email,
    phone: options?.phone?.trim() || user.phoneNumber || '',
    role: options?.role ?? 'tenant',
    photoURL: user.photoURL ?? '',
    isVerifiedAgent: false,
    verificationStatus: 'not_submitted' as const,
    createdAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'users', user.uid), profile)

  return sanitizeProfile({
    uid: user.uid,
    ...profile,
  })
}

export function toDisplayError(error: unknown, context: 'default' | 'google' = 'default') {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    const code = error.code.replace('auth/', '')
    const messages: Record<string, string> = {
      'email-already-in-use': 'This email is already registered.',
      'invalid-email': 'Enter a valid email address.',
      'user-not-found': 'No account was found with this email.',
      'wrong-password': 'The password is incorrect.',
      'invalid-credential': 'The email or password is incorrect.',
      'weak-password': 'Use a stronger password with at least 6 characters.',
      'network-request-failed':
        context === 'google'
          ? 'Network error. Google sign-in could not reach Google services in time. Check your connection, allow Google scripts/popups, and try again.'
          : 'Network error. Firebase Authentication could not be reached. Check your connection and try again.',
      'too-many-requests': 'Too many attempts. Please wait a little and try again.',
      'popup-closed-by-user':
        'The Google sign-in popup was closed before sign-in finished. If your browser closed it automatically, use Google redirect sign-in instead.',
      'popup-blocked': 'The browser blocked the Google sign-in popup. Allow popups and try again.',
      'popup-timeout':
        'Google popup sign-in took too long to respond. Use Google redirect sign-in or continue with email and password for now.',
      'cancelled-popup-request':
        'Another sign-in popup is already open. Finish that one or try again.',
      'account-exists-with-different-credential':
        'This email already exists with a different sign-in method. Try signing in with the original method first.',
    }

    return messages[code] ?? `Authentication error: ${code}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

export async function registerUser(payload: RegisterPayload) {
  if (authMode === 'local') {
    const normalizedEmail = payload.email.trim().toLowerCase()
    const trimmedName = payload.fullName.trim()
    const trimmedPhone = payload.phone.trim()
    const users = readLocalUsers()

    if (users.some((user) => user.email === normalizedEmail)) {
      throw new Error('This email is already registered.')
    }

    const profile = sanitizeProfile({
      uid: `local-${crypto.randomUUID()}`,
      fullName: trimmedName,
      email: normalizedEmail,
      phone: trimmedPhone,
      role: payload.role,
      photoURL: '',
      isVerifiedAgent: false,
      verificationStatus: 'not_submitted',
      createdAt: new Date().toISOString(),
    })

    users.push({
      uid: profile.uid,
      email: normalizedEmail,
      password: payload.password,
      profile,
    })

    writeLocalUsers(users)
    persistLocalSession(createSessionUser(profile))
    return profile
  }

  const { auth, db } = getFirebaseServices()

  const normalizedEmail = payload.email.trim().toLowerCase()
  const trimmedName = payload.fullName.trim()
  const trimmedPhone = payload.phone.trim()

  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, payload.password)

  const profile = {
    fullName: trimmedName,
    email: normalizedEmail,
    phone: trimmedPhone,
    role: payload.role,
    photoURL: '',
    isVerifiedAgent: false,
    verificationStatus: 'not_submitted' as const,
    createdAt: serverTimestamp(),
  }

  try {
    await setDoc(doc(db, 'users', credential.user.uid), profile)
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined)
    throw error
  }

  return sanitizeProfile({
    uid: credential.user.uid,
    ...profile,
  })
}

export async function loginUser(email: string, password: string) {
  if (authMode === 'local') {
    const normalizedEmail = email.trim().toLowerCase()
    const matchedUser = readLocalUsers().find(
      (user) => user.email === normalizedEmail && user.password === password
    )

    if (!matchedUser) {
      throw new Error('The email or password is incorrect.')
    }

    const sessionUser = createSessionUser(matchedUser.profile)
    persistLocalSession(sessionUser)
    return sessionUser
  }

  const { auth } = getFirebaseServices()
  return signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
}

export async function signInWithGoogle(options?: {
  role?: Exclude<UserRole, 'admin'>
  phone?: string
  returnTo?: string
  source?: 'login' | 'register'
}) {
  if (authMode === 'local') {
    throw new Error('Google sign-in is only available when Firebase Authentication is active.')
  }

  const { auth } = getFirebaseServices()
  const provider = createGoogleProvider()
  writeGoogleFlowState({
    mode: 'popup',
    source: options?.source,
    returnTo: options?.returnTo,
    startedAt: new Date().toISOString(),
  })

  try {
    const credential = await signInWithPopupWithTimeout(auth, provider)
    const profile = await finalizeGoogleSignInCredential(credential, options)
    clearGoogleFlowState()
    return profile
  } catch (error) {
    if (shouldFallbackGooglePopupToRedirect(error)) {
      writeGoogleRedirectContext({
        phone: options?.phone,
        role: options?.role,
        returnTo: options?.returnTo,
        source: options?.source,
      })
      writeGoogleFlowState({
        mode: 'redirect',
        source: options?.source,
        returnTo: options?.returnTo,
        startedAt: new Date().toISOString(),
      })

      try {
        await signInWithRedirect(auth, provider)
        return null
      } catch {
        clearGoogleRedirectContext()
        clearGoogleFlowState()
        throw new Error(
          'Google sign-in could not finish in popup mode. Check your connection, allow Google popups/cookies, and try again.'
        )
      }
    }

    clearGoogleFlowState()
    throw error
  }
}

export async function startGoogleRedirectSignIn(options?: {
  role?: Exclude<UserRole, 'admin'>
  phone?: string
  returnTo?: string
  source?: 'login' | 'register'
}) {
  if (authMode === 'local') {
    throw new Error('Google sign-in is only available when Firebase Authentication is active.')
  }

  const { auth } = getFirebaseServices()
  writeGoogleFlowState({
    mode: 'redirect',
    source: options?.source,
    returnTo: options?.returnTo,
    startedAt: new Date().toISOString(),
  })

  writeGoogleRedirectContext({
    phone: options?.phone,
    role: options?.role,
    returnTo: options?.returnTo,
    source: options?.source,
  })

  try {
    await signInWithRedirect(auth, createGoogleProvider())
  } catch (error) {
    clearGoogleFlowState()
    clearGoogleRedirectContext()
    throw error
  }
}

export async function completePendingGoogleRedirectSignIn() {
  if (authMode === 'local') {
    return null
  }

  const { auth } = getFirebaseServices()
  const context = readGoogleRedirectContext()

  try {
    const credential = await getRedirectResult(auth)

    if (!credential) {
      return null
    }

    const profile = await finalizeGoogleSignInCredential(credential, context ?? undefined)

    if (context?.returnTo?.startsWith('/')) {
      writeGoogleRedirectReturnTo(context.returnTo)
    }

    clearGoogleFlowState()
    clearGoogleRedirectContext()
    return profile
  } catch (error) {
    clearGoogleFlowState()
    clearGoogleRedirectContext()
    throw error
  }
}

export async function logoutUser() {
  clearGoogleFlowState()

  if (authMode === 'local') {
    persistLocalSession(null)
    return
  }

  const { auth } = getFirebaseServices()
  return signOut(auth)
}

export async function getUserProfile(uid: string) {
  if (authMode === 'local') {
    const matchedUser = readLocalUsers().find((user) => user.uid === uid)

    if (!matchedUser) {
      throw new Error('Your local test profile was not found.')
    }

    return sanitizeProfile(matchedUser.profile)
  }

  const { db } = getFirebaseServices()

  const snapshot = await getDoc(doc(db, 'users', uid))

  if (!snapshot.exists()) {
    throw new Error('Your user profile was not found in Firestore.')
  }

  return sanitizeProfile({
    uid: snapshot.id,
    ...(snapshot.data() as Partial<UserProfile>),
  })
}

export async function switchLocalBypassRole(uid: string, role: UserRole) {
  if (authMode !== 'local') {
    throw new Error('Role switching is only available while local auth bypass is enabled.')
  }

  return updateLocalUserProfile(uid, (profile) => ({
    ...profile,
    role,
  }))
}

export async function updateUserVerificationStatus(uid: string, status: VerificationStatus) {
  if (authMode === 'local') {
    return updateLocalUserProfile(uid, (profile) => ({
      ...profile,
      isVerifiedAgent: status === 'approved',
      verificationStatus: status,
    }))
  }

  const { db } = getFirebaseServices()

  await updateDoc(doc(db, 'users', uid), {
    isVerifiedAgent: status === 'approved',
    verificationStatus: status,
  })

  return getUserProfile(uid)
}

export async function updateUserProfileDetails(uid: string, payload: ProfileCompletionPayload) {
  const fullName = payload.fullName.trim()
  const phone = payload.phone.trim()

  if (!fullName) {
    throw new Error('Enter your full name before saving your profile.')
  }

  if (!phone) {
    throw new Error('Enter your phone number before saving your profile.')
  }

  if (authMode === 'local') {
    return updateLocalUserProfile(uid, (profile) => ({
      ...profile,
      fullName,
      phone,
    }))
  }

  const { db } = getFirebaseServices()
  await updateDoc(doc(db, 'users', uid), {
    fullName,
    phone,
  })

  return getUserProfile(uid)
}

export async function getUserProfilesByIds(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))]

  const profiles = await Promise.all(
    uniqueIds.map(async (userId) => {
      try {
        return await getUserProfile(userId)
      } catch {
        return null
      }
    })
  )

  return profiles.reduce<Record<string, UserProfile>>((result, profile) => {
    if (profile) {
      result[profile.uid] = profile
    }

    return result
  }, {})
}

export async function listAllUserProfiles() {
  if (authMode === 'local') {
    return readLocalUsers()
      .map((user) => sanitizeProfile(user.profile))
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
  }

  const { db, auth } = getFirebaseServices()

  if (!auth.currentUser) {
    throw new Error('Sign in before loading admin user records.')
  }

  const currentProfile = await getUserProfile(auth.currentUser.uid)

  if (currentProfile.role !== 'admin') {
    throw new Error('Only admin accounts can load all user profiles.')
  }

  const snapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))

  return snapshot.docs.map((userDoc) =>
    sanitizeProfile({
      uid: userDoc.id,
      ...(userDoc.data() as Partial<UserProfile>),
    })
  )
}
