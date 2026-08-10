import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'

import { auth, authMode, db, firebaseConfigError, isFirebaseConfigured } from '../lib/firebase'
import { getUserProfile, updateUserVerificationStatus } from './auth'
import {
  getAllStoredVerificationRecords,
  getStoredVerificationRecordByAgentId,
  getStoredVerificationRecordById,
  putStoredVerificationRecord,
} from './agentVerificationDb'
import { deleteStorageObjectByUrl, uploadVerificationAssets } from './storageUploads'
import type { UserProfile } from '../types/user'
import {
  normalizeVerificationRecord,
  createEmptyAgentVerificationForm,
  type AgentVerificationFormInput,
  type AgentVerificationRecord,
  type AgentVerificationStatus,
  type VerificationAsset,
} from '../types/verification'

function ensureFirestoreReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      firebaseConfigError ||
        'Firebase is not configured. Add your VITE_FIREBASE_* values before using verification.'
    )
  }

  return db
}

function normalizeTimestampLike(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }

  return value ? String(value) : null
}

function mapStoredAsset(data: Partial<VerificationAsset> | null | undefined, fallbackName: string) {
  if (!data) {
    return null
  }

  const remoteUrl =
    typeof data.remoteUrl === 'string' && data.remoteUrl
      ? data.remoteUrl
      : typeof data.previewUrl === 'string'
        ? data.previewUrl
        : null

  return {
    id: typeof data.id === 'string' && data.id ? data.id : `remote-${crypto.randomUUID()}`,
    name: typeof data.name === 'string' && data.name ? data.name : fallbackName,
    mimeType:
      typeof data.mimeType === 'string' && data.mimeType
        ? data.mimeType
        : 'application/octet-stream',
    size: Number(data.size ?? 0),
    previewUrl: remoteUrl ?? '',
    remoteUrl,
    file: null,
    source: 'remote' as const,
  } satisfies VerificationAsset
}

function mapDocToVerificationRecord(verificationId: string, data: DocumentData) {
  const profilePhoto = mapStoredAsset(
    data.profilePhoto as Partial<VerificationAsset>,
    'profile-photo'
  )
  const idDocument = mapStoredAsset(data.idDocument as Partial<VerificationAsset>, 'id-document')
  const authorizationDocument = mapStoredAsset(
    data.authorizationDocument as Partial<VerificationAsset>,
    'authorization-document'
  )

  if (!profilePhoto || !idDocument || !authorizationDocument) {
    throw new Error('The verification request is missing one or more required uploaded files.')
  }

  return normalizeVerificationRecord({
    id: verificationId,
    agentId: String(data.agentId ?? ''),
    fullName: String(data.fullName ?? ''),
    phone: String(data.phone ?? ''),
    whatsappNumber: String(data.whatsappNumber ?? ''),
    officeAddress: String(data.officeAddress ?? ''),
    profilePhoto,
    idDocument,
    cacDocument: mapStoredAsset(
      data.cacDocument as Partial<VerificationAsset> | null,
      'cac-document'
    ),
    authorizationDocument,
    status: (data.status ?? 'pending') as AgentVerificationStatus,
    adminNote: String(data.adminNote ?? ''),
    submittedAt: normalizeTimestampLike(data.submittedAt) ?? '',
    reviewedAt: normalizeTimestampLike(data.reviewedAt),
  } satisfies AgentVerificationRecord)
}

async function getCurrentUserRole() {
  if (!auth?.currentUser) {
    return null
  }

  try {
    const profile = await getUserProfile(auth.currentUser.uid)
    return profile.role
  } catch {
    return null
  }
}

function sortRequests(records: AgentVerificationRecord[]) {
  return [...records].sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
}

async function listFirestoreVerificationRequests(firestore: Firestore) {
  const currentUser = auth?.currentUser ?? null

  if (!currentUser) {
    return [] as AgentVerificationRecord[]
  }

  const verificationCollection = collection(firestore, 'agentVerifications')
  const role = await getCurrentUserRole()
  const snapshot =
    role === 'admin'
      ? await getDocs(verificationCollection)
      : await getDocs(query(verificationCollection, where('agentId', '==', currentUser.uid)))

  return sortRequests(
    snapshot.docs.map((requestDoc) => mapDocToVerificationRecord(requestDoc.id, requestDoc.data()))
  )
}

function sanitizeFormInput(input: Partial<AgentVerificationFormInput>) {
  const emptyForm = createEmptyAgentVerificationForm()

  return {
    ...emptyForm,
    ...input,
    fullName: input.fullName?.trim() ?? '',
    phone: input.phone?.trim() ?? '',
    whatsappNumber: input.whatsappNumber?.trim() ?? '',
    officeAddress: input.officeAddress?.trim() ?? '',
  }
}

function buildRemoteAsset(source: VerificationAsset, remoteUrl: string): VerificationAsset {
  return {
    ...source,
    id: `remote-${crypto.randomUUID()}`,
    previewUrl: remoteUrl,
    remoteUrl,
    file: null,
    source: 'remote',
  }
}

export function validateAgentVerificationInput(input: AgentVerificationFormInput) {
  if (!input.fullName) {
    throw new Error('Enter the full name to appear on the verification request.')
  }

  if (!input.phone) {
    throw new Error('Add a phone number for the verification request.')
  }

  if (!input.whatsappNumber) {
    throw new Error('Add a WhatsApp number so interested users can reach you.')
  }

  if (!input.officeAddress) {
    throw new Error('Add the office address for the verification request.')
  }

  if (!input.profilePhoto) {
    throw new Error('Upload a profile photo before submitting verification.')
  }

  if (!input.idDocument) {
    throw new Error('Upload a government ID document before submitting verification.')
  }

  if (!input.authorizationDocument) {
    throw new Error('Upload proof of property authorization before submitting verification.')
  }
}

export async function getAgentVerificationByAgentId(agentId: string) {
  if (authMode !== 'local') {
    const firestore = ensureFirestoreReady()
    const snapshot = await getDocs(
      query(collection(firestore, 'agentVerifications'), where('agentId', '==', agentId))
    )

    const records = sortRequests(
      snapshot.docs.map((requestDoc) =>
        mapDocToVerificationRecord(requestDoc.id, requestDoc.data())
      )
    )

    return records[0] ?? null
  }

  return getStoredVerificationRecordByAgentId(agentId)
}

export async function listAgentVerificationRequests() {
  if (authMode !== 'local') {
    return listFirestoreVerificationRequests(ensureFirestoreReady())
  }

  const records = await getAllStoredVerificationRecords()
  return sortRequests(records)
}

export async function submitAgentVerification(
  agent: UserProfile,
  input: AgentVerificationFormInput
) {
  if (agent.role === 'admin') {
    throw new Error('Admin accounts review professional verification requests.')
  }

  const sanitized = sanitizeFormInput(input)
  validateAgentVerificationInput(sanitized)

  const existing =
    authMode !== 'local'
      ? await getAgentVerificationByAgentId(agent.uid)
      : await getStoredVerificationRecordByAgentId(agent.uid)
  const now = new Date().toISOString()
  const previousUrls = [
    existing?.profilePhoto.remoteUrl,
    existing?.idDocument.remoteUrl,
    existing?.cacDocument?.remoteUrl,
    existing?.authorizationDocument.remoteUrl,
  ].filter(Boolean) as string[]

  let profilePhotoUrl: string
  let idDocumentUrl: string
  let cacDocumentUrl: string | null = null
  let authorizationDocumentUrl: string

  try {
    ;[profilePhotoUrl] = await uploadVerificationAssets(agent, [sanitized.profilePhoto!])
    ;[idDocumentUrl] = await uploadVerificationAssets(agent, [sanitized.idDocument!])

    if (sanitized.cacDocument) {
      ;[cacDocumentUrl] = await uploadVerificationAssets(agent, [sanitized.cacDocument])
    }

    ;[authorizationDocumentUrl] = await uploadVerificationAssets(agent, [
      sanitized.authorizationDocument!,
    ])
  } catch (error) {
    throw error instanceof Error ? error : new Error('Could not upload the verification documents.')
  }

  const shouldCreateNewSubmission = authMode !== 'local' && existing?.status !== 'pending'
  const record: AgentVerificationRecord = {
    id:
      authMode !== 'local' && shouldCreateNewSubmission
        ? `verification-${crypto.randomUUID()}`
        : (existing?.id ?? `verification-${crypto.randomUUID()}`),
    agentId: agent.uid,
    fullName: sanitized.fullName,
    phone: sanitized.phone,
    whatsappNumber: sanitized.whatsappNumber,
    officeAddress: sanitized.officeAddress,
    profilePhoto: buildRemoteAsset(sanitized.profilePhoto!, profilePhotoUrl),
    idDocument: buildRemoteAsset(sanitized.idDocument!, idDocumentUrl),
    cacDocument:
      sanitized.cacDocument && cacDocumentUrl
        ? buildRemoteAsset(sanitized.cacDocument, cacDocumentUrl)
        : null,
    authorizationDocument: buildRemoteAsset(
      sanitized.authorizationDocument!,
      authorizationDocumentUrl
    ),
    status: 'pending',
    adminNote: '',
    submittedAt: now,
    reviewedAt: null,
  }

  try {
    if (authMode !== 'local') {
      const firestore = ensureFirestoreReady()
      await setDoc(
        doc(firestore, 'agentVerifications', record.id),
        {
          agentId: record.agentId,
          fullName: record.fullName,
          phone: record.phone,
          whatsappNumber: record.whatsappNumber,
          officeAddress: record.officeAddress,
          profilePhoto: record.profilePhoto,
          idDocument: record.idDocument,
          cacDocument: record.cacDocument,
          authorizationDocument: record.authorizationDocument,
          status: record.status,
          adminNote: record.adminNote,
          submittedAt: serverTimestamp(),
          reviewedAt: null,
        },
        { merge: true }
      )

      await updateUserVerificationStatus(agent.uid, 'pending')

      if (existing && !shouldCreateNewSubmission) {
        const nextUrls = [
          record.profilePhoto.remoteUrl,
          record.idDocument.remoteUrl,
          record.cacDocument?.remoteUrl,
          record.authorizationDocument.remoteUrl,
        ].filter(Boolean) as string[]

        const removedUrls = previousUrls.filter((url) => !nextUrls.includes(url))
        await Promise.allSettled(removedUrls.map((url) => deleteStorageObjectByUrl(url)))
      }

      return (await getVerificationById(record.id, firestore)) ?? record
    }

    await putStoredVerificationRecord(record)
    await updateUserVerificationStatus(agent.uid, 'pending')

    const nextUrls = [
      record.profilePhoto.remoteUrl,
      record.idDocument.remoteUrl,
      record.cacDocument?.remoteUrl,
      record.authorizationDocument.remoteUrl,
    ].filter(Boolean) as string[]

    const removedUrls = previousUrls.filter((url) => !nextUrls.includes(url))
    await Promise.allSettled(removedUrls.map((url) => deleteStorageObjectByUrl(url)))

    return record
  } catch (error) {
    const uploadedUrls = [
      profilePhotoUrl,
      idDocumentUrl,
      cacDocumentUrl,
      authorizationDocumentUrl,
    ].filter(Boolean) as string[]

    const freshUrls = uploadedUrls.filter((url) => !previousUrls.includes(url))
    await Promise.allSettled(freshUrls.map((url) => deleteStorageObjectByUrl(url)))
    throw error
  }
}

export async function reviewAgentVerification(
  admin: UserProfile,
  verificationId: string,
  status: Exclude<AgentVerificationStatus, 'pending'>,
  adminNote: string
) {
  if (admin.role !== 'admin') {
    throw new Error('Only admin accounts can review verification requests.')
  }

  const existing =
    authMode !== 'local'
      ? await getVerificationById(verificationId, ensureFirestoreReady())
      : await getStoredVerificationRecordById(verificationId)

  if (!existing) {
    throw new Error('The verification request could not be found.')
  }

  const nextRecord: AgentVerificationRecord = {
    ...existing,
    status,
    adminNote: adminNote.trim(),
    reviewedAt: new Date().toISOString(),
  }

  if (authMode !== 'local') {
    const firestore = ensureFirestoreReady()
    await updateDoc(doc(firestore, 'agentVerifications', verificationId), {
      status,
      adminNote: nextRecord.adminNote,
      reviewedAt: serverTimestamp(),
    })
    await updateUserVerificationStatus(existing.agentId, status)
    return (await getVerificationById(verificationId, firestore)) ?? nextRecord
  }

  await putStoredVerificationRecord(nextRecord)
  await updateUserVerificationStatus(existing.agentId, status)
  return nextRecord
}

async function getVerificationById(verificationId: string, firestore: Firestore) {
  const snapshot = await getDoc(doc(firestore, 'agentVerifications', verificationId))
  return snapshot.exists() ? mapDocToVerificationRecord(snapshot.id, snapshot.data()) : null
}
