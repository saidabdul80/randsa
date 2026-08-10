import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'

import { authMode, db, firebaseConfigError, isFirebaseConfigured } from '../lib/firebase'
import { deleteStoredListing, getStoredListings, putStoredListing } from './listingDb'
import {
  cleanListingAttributes,
  sanitizeListingInput,
  validateMarketplaceListing,
} from './listingValidation'
import {
  deleteStorageObjectByUrl,
  uploadListingImages,
  uploadPrivateListingDocument,
} from './storageUploads'
import type {
  ListingContactMethod,
  ListingFormInput,
  ListingModerationStatus,
  ListingNegotiable,
  ListingPriceType,
  ListingRecord,
  ListingStatus,
} from '../types/listing'
import type { UserProfile } from '../types/user'
import { normalizeCoordinates } from '../utils/coordinates'

function ensureFirestoreReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      firebaseConfigError || 'Firebase is not configured. Add your Firebase environment values.'
    )
  }
  return db
}

type ListingPersistenceStage =
  'preparing-images' | 'uploading-private-document' | 'writing-listing' | 'writing-private-document'

function firebaseErrorCode(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code
  }
  return ''
}

function listingPersistenceError(error: unknown, stage: ListingPersistenceStage) {
  if (error instanceof Error && error.message.startsWith('Firebase Storage could not upload')) {
    return error
  }

  const code = firebaseErrorCode(error)
  if (stage === 'preparing-images') {
    return new Error(
      `Firebase Storage could not save the listing images${code ? ` (${code})` : ''}. Please sign in again and retry.`
    )
  }
  if (stage === 'uploading-private-document') {
    return new Error(
      `Firebase Storage could not save the private PDF${code ? ` (${code})` : ''}. Confirm it is a PDF below 2 MB and retry.`
    )
  }
  if (stage === 'writing-private-document') {
    return new Error(
      `The listing was prepared, but Firestore rejected its private document record${code ? ` (${code})` : ''}.`
    )
  }
  if (code === 'permission-denied') {
    return new Error(
      'The images uploaded, but Firestore rejected the final listing document (permission-denied). Sign out, sign in again, and retry. If it persists, the Review panel now identifies the failing stage.'
    )
  }
  return error instanceof Error
    ? error
    : new Error('Firestore could not save the final listing document.')
}

function normalizeDate(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return value ? String(value) : ''
}

function normalizePriceType(value: unknown): ListingPriceType {
  return ['fixed', 'negotiable', 'free', 'contact', 'range'].includes(String(value))
    ? (String(value) as ListingPriceType)
    : 'fixed'
}

function normalizeNegotiable(value: unknown): ListingNegotiable {
  return ['yes', 'no', 'not_sure'].includes(String(value))
    ? (String(value) as ListingNegotiable)
    : 'no'
}

function normalizeContactMethod(value: unknown): ListingContactMethod {
  return ['phone', 'whatsapp', 'both', 'email'].includes(String(value))
    ? (String(value) as ListingContactMethod)
    : 'phone'
}

export { validateMarketplaceListing } from './listingValidation'

function mapDoc(listingId: string, data: DocumentData): ListingRecord {
  const location = (data.location ?? {}) as Record<string, unknown>
  const coordinates = normalizeCoordinates(location.latitude, location.longitude)
  const pricing = (data.pricing ?? {}) as Record<string, unknown>
  const media = (data.media ?? {}) as Record<string, unknown>
  const contact = (data.contact ?? {}) as Record<string, unknown>
  const delivery = (data.delivery ?? {}) as Record<string, unknown>
  return {
    id: listingId,
    ownerId: String(data.ownerId ?? ''),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    categoryId: data.categoryId,
    categoryName: String(data.categoryName ?? ''),
    subcategoryId: String(data.subcategoryId ?? ''),
    subcategoryName: String(data.subcategoryName ?? ''),
    status: data.status ?? 'pending_review',
    moderationStatus: data.moderationStatus ?? 'pending',
    location: {
      country: String(location.country ?? 'Nigeria'),
      state: String(location.state ?? ''),
      city: String(location.city ?? ''),
      area: String(location.area ?? ''),
      address: String(location.address ?? ''),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    },
    pricing: {
      currency: String(pricing.currency ?? 'NGN'),
      amount: Number(pricing.amount ?? 0),
      maximumAmount: pricing.maximumAmount == null ? null : Number(pricing.maximumAmount),
      priceType: normalizePriceType(pricing.priceType),
      billingPeriod: String(pricing.billingPeriod ?? ''),
      negotiable: normalizeNegotiable(pricing.negotiable),
    },
    media: {
      coverImage: String(media.coverImage ?? ''),
      images: Array.isArray(media.images) ? media.images.map(String) : [],
      videoUrl: String(media.videoUrl ?? ''),
    },
    contact: {
      name: String(contact.name ?? ''),
      phone: String(contact.phone ?? ''),
      whatsappEnabled: Boolean(contact.whatsappEnabled),
      preferredMethod: normalizeContactMethod(contact.preferredMethod),
    },
    delivery: {
      available: Boolean(delivery.available),
      pickupAvailable: Boolean(delivery.pickupAvailable),
      details: String(delivery.details ?? ''),
    },
    attributes: cleanListingAttributes(data.attributes ?? {}),
    createdAt: normalizeDate(data.createdAt),
    updatedAt: normalizeDate(data.updatedAt),
    publishedAt: data.publishedAt ? normalizeDate(data.publishedAt) : null,
    viewCount: Number(data.viewCount ?? 0),
    favouriteCount: Number(data.favouriteCount ?? 0),
  }
}

function sortRecords(records: ListingRecord[]) {
  return [...records].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

async function listOwnedFirestoreListings(firestore: Firestore, ownerId: string) {
  const snapshot = await getDocs(
    query(collection(firestore, 'listings'), where('ownerId', '==', ownerId))
  )
  return sortRecords(snapshot.docs.map((listingDoc) => mapDoc(listingDoc.id, listingDoc.data())))
}

async function listPublicFirestoreListings(firestore: Firestore, maximumResults: number) {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'listings'),
      where('status', '==', 'active'),
      where('moderationStatus', '==', 'approved'),
      limit(maximumResults)
    )
  )
  return sortRecords(snapshot.docs.map((listingDoc) => mapDoc(listingDoc.id, listingDoc.data())))
}

export async function listOwnedListings(ownerId: string) {
  if (authMode !== 'local') return listOwnedFirestoreListings(ensureFirestoreReady(), ownerId)
  return sortRecords((await getStoredListings()).filter((record) => record.ownerId === ownerId))
}

export async function listPublicListings(maximumResults = 60) {
  if (authMode !== 'local') {
    return listPublicFirestoreListings(ensureFirestoreReady(), maximumResults)
  }
  return sortRecords(
    (await getStoredListings())
      .filter((record) => record.status === 'active' && record.moderationStatus === 'approved')
      .slice(0, maximumResults)
  )
}

export async function listAllMarketplaceListings() {
  if (authMode !== 'local') {
    const snapshot = await getDocs(collection(ensureFirestoreReady(), 'listings'))
    return sortRecords(snapshot.docs.map((listingDoc) => mapDoc(listingDoc.id, listingDoc.data())))
  }
  return sortRecords(await getStoredListings())
}

export async function getListingById(listingId: string) {
  if (authMode !== 'local') {
    const snapshot = await getDoc(doc(ensureFirestoreReady(), 'listings', listingId))
    return snapshot.exists() ? mapDoc(snapshot.id, snapshot.data()) : null
  }
  return (await getStoredListings()).find((record) => record.id === listingId) ?? null
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Could not prepare the local image.'))
    reader.readAsDataURL(file)
  })
}

async function resolveLocalImageUrls(input: ListingFormInput) {
  return Promise.all(
    input.images.map(async (image) => {
      if (image.source === 'remote' && image.remoteUrl) return image.remoteUrl
      if (image.file) return fileToDataUrl(image.file)
      return image.previewUrl
    })
  )
}

function buildRecord(
  listingId: string,
  input: ListingFormInput,
  owner: UserProfile,
  imageUrls: string[],
  current?: ListingRecord | null
): ListingRecord {
  const now = new Date().toISOString()
  const requiresNewReview = Boolean(
    current && (current.status !== 'pending_review' || current.moderationStatus !== 'pending')
  )
  return {
    id: listingId,
    ownerId: owner.uid,
    title: input.title,
    description: input.description,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    subcategoryId: input.subcategoryId,
    subcategoryName: input.subcategoryName,
    status: requiresNewReview ? 'pending_review' : (current?.status ?? 'pending_review'),
    moderationStatus: requiresNewReview ? 'pending' : (current?.moderationStatus ?? 'pending'),
    location: input.location,
    pricing: input.pricing,
    media: { coverImage: imageUrls[0] ?? '', images: imageUrls, videoUrl: input.videoUrl },
    contact: input.contact,
    delivery: input.delivery,
    attributes: cleanListingAttributes(input.attributes),
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
    publishedAt: current?.publishedAt ?? null,
    viewCount: current?.viewCount ?? 0,
    favouriteCount: current?.favouriteCount ?? 0,
  }
}

function firestorePayload(record: ListingRecord, isNew: boolean) {
  return {
    ownerId: record.ownerId,
    title: record.title,
    description: record.description,
    categoryId: record.categoryId,
    categoryName: record.categoryName,
    subcategoryId: record.subcategoryId,
    subcategoryName: record.subcategoryName,
    status: record.status,
    moderationStatus: record.moderationStatus,
    location: record.location,
    pricing: record.pricing,
    media: record.media,
    contact: record.contact,
    delivery: record.delivery,
    attributes: record.attributes,
    createdAt: isNew ? serverTimestamp() : record.createdAt,
    updatedAt: serverTimestamp(),
    publishedAt: record.publishedAt ? serverTimestamp() : null,
    viewCount: record.viewCount,
    favouriteCount: record.favouriteCount,
  }
}

function firestoreUpdatePayload(record: ListingRecord) {
  return {
    title: record.title,
    description: record.description,
    categoryId: record.categoryId,
    categoryName: record.categoryName,
    subcategoryId: record.subcategoryId,
    subcategoryName: record.subcategoryName,
    location: record.location,
    pricing: record.pricing,
    media: record.media,
    contact: record.contact,
    delivery: record.delivery,
    attributes: record.attributes,
    status: record.status,
    moderationStatus: record.moderationStatus,
    updatedAt: serverTimestamp(),
  }
}

async function getPrivateListingAsset(firestore: Firestore, listingId: string) {
  const snapshot = await getDoc(doc(firestore, 'listingPrivate', listingId))
  if (!snapshot.exists()) return null
  return {
    ownerId: String(snapshot.data().ownerId ?? ''),
    cvUrl: String(snapshot.data().cvUrl ?? ''),
  }
}

export async function createListing(
  input: ListingFormInput,
  owner: UserProfile,
  onProgress?: (percent: number) => void
) {
  const validationError = validateMarketplaceListing(input)
  if (validationError) throw new Error(validationError)
  const value = sanitizeListingInput(input)
  const listingId = crypto.randomUUID()
  let imageUrls: string[] = []
  let cvUrl = ''
  let firestore: Firestore | null = null
  let listingCreated = false
  let privateDocumentCreated = false
  let persistenceStage: ListingPersistenceStage = 'preparing-images'

  try {
    if (authMode === 'local') {
      imageUrls = await resolveLocalImageUrls(value)
      onProgress?.(75)
    } else {
      imageUrls = await uploadListingImages(owner, listingId, value.images, (done, total) => {
        onProgress?.(Math.round((done / Math.max(total, 1)) * 70))
      })
      if (value.privateCvFile) {
        persistenceStage = 'uploading-private-document'
        cvUrl = (await uploadPrivateListingDocument(owner, listingId, value.privateCvFile))
          .downloadURL
      }
    }

    const record = buildRecord(listingId, value, owner, imageUrls)
    if (authMode !== 'local') {
      firestore = ensureFirestoreReady()
      persistenceStage = 'writing-listing'
      onProgress?.(72)
      await setDoc(doc(firestore, 'listings', listingId), firestorePayload(record, true))
      listingCreated = true
      if (cvUrl) {
        persistenceStage = 'writing-private-document'
        await setDoc(doc(firestore, 'listingPrivate', listingId), {
          ownerId: owner.uid,
          cvUrl,
          updatedAt: serverTimestamp(),
        })
        privateDocumentCreated = true
      }
      onProgress?.(100)
      return (await getListingById(listingId)) ?? record
    }

    await putStoredListing(record)
    onProgress?.(100)
    return record
  } catch (error) {
    if (firestore && listingCreated) {
      await Promise.allSettled([
        deleteDoc(doc(firestore, 'listings', listingId)),
        ...(privateDocumentCreated ? [deleteDoc(doc(firestore, 'listingPrivate', listingId))] : []),
      ])
    }
    await Promise.allSettled([...imageUrls, cvUrl].filter(Boolean).map(deleteStorageObjectByUrl))
    throw listingPersistenceError(error, persistenceStage)
  }
}

export async function updateListing(
  listingId: string,
  input: ListingFormInput,
  owner: UserProfile,
  onProgress?: (percent: number) => void
) {
  const validationError = validateMarketplaceListing(input)
  if (validationError) throw new Error(validationError)
  const current = await getListingById(listingId)
  if (!current) throw new Error('The listing you are editing was not found.')
  if (current.ownerId !== owner.uid && owner.role !== 'admin')
    throw new Error('You can only edit your own listings.')
  const value = sanitizeListingInput(input)
  const previousUrls = current.media.images
  let imageUrls: string[] = []
  let newCvUrl = ''
  let previousCvUrl = ''
  let privateDocumentUpdated = false
  try {
    if (authMode === 'local') {
      imageUrls = await resolveLocalImageUrls(value)
    } else {
      imageUrls = await uploadListingImages(owner, listingId, value.images, (done, total) =>
        onProgress?.(Math.round((done / Math.max(total, 1)) * 80))
      )
      if (value.privateCvFile) {
        const firestore = ensureFirestoreReady()
        previousCvUrl = (await getPrivateListingAsset(firestore, listingId))?.cvUrl ?? ''
        newCvUrl = (await uploadPrivateListingDocument(owner, listingId, value.privateCvFile))
          .downloadURL
      }
    }
    const record = buildRecord(listingId, value, owner, imageUrls, current)
    if (authMode !== 'local') {
      await updateDoc(
        doc(ensureFirestoreReady(), 'listings', listingId),
        firestoreUpdatePayload(record)
      )
      if (newCvUrl) {
        await setDoc(doc(ensureFirestoreReady(), 'listingPrivate', listingId), {
          ownerId: current.ownerId,
          cvUrl: newCvUrl,
          updatedAt: serverTimestamp(),
        })
        privateDocumentUpdated = true
      }
      await Promise.allSettled(
        previousUrls.filter((url) => !imageUrls.includes(url)).map(deleteStorageObjectByUrl)
      )
      if (previousCvUrl && previousCvUrl !== newCvUrl) {
        await deleteStorageObjectByUrl(previousCvUrl).catch(() => undefined)
      }
      onProgress?.(100)
      return (await getListingById(listingId)) ?? record
    }
    await putStoredListing(record)
    onProgress?.(100)
    return record
  } catch (error) {
    await Promise.allSettled(
      imageUrls.filter((url) => !previousUrls.includes(url)).map(deleteStorageObjectByUrl)
    )
    if (newCvUrl && !privateDocumentUpdated) {
      await deleteStorageObjectByUrl(newCvUrl).catch(() => undefined)
    }
    throw error
  }
}

export async function setListingStatus(
  listingId: string,
  owner: UserProfile,
  status: ListingStatus
) {
  const current = await getListingById(listingId)
  if (!current) throw new Error('The selected listing was not found.')
  if (current.ownerId !== owner.uid && owner.role !== 'admin')
    throw new Error('You can only manage your own listings.')
  const updated: ListingRecord = {
    ...current,
    status,
    moderationStatus: status === 'pending_review' ? 'pending' : current.moderationStatus,
    updatedAt: new Date().toISOString(),
  }
  if (authMode !== 'local') {
    await updateDoc(doc(ensureFirestoreReady(), 'listings', listingId), {
      status: updated.status,
      moderationStatus: updated.moderationStatus,
      updatedAt: serverTimestamp(),
    })
    return (await getListingById(listingId)) ?? updated
  }
  await putStoredListing(updated)
  return updated
}

export async function reviewMarketplaceListing(
  listingId: string,
  admin: UserProfile,
  moderationStatus: Extract<ListingModerationStatus, 'approved' | 'rejected'>
) {
  if (admin.role !== 'admin') throw new Error('Only admins can moderate marketplace listings.')
  const current = await getListingById(listingId)
  if (!current) throw new Error('The selected listing was not found.')
  const updated: ListingRecord = {
    ...current,
    status: moderationStatus === 'approved' ? 'active' : 'rejected',
    moderationStatus,
    publishedAt: moderationStatus === 'approved' ? new Date().toISOString() : current.publishedAt,
    updatedAt: new Date().toISOString(),
  }
  if (authMode !== 'local') {
    const moderationPayload = {
      status: updated.status,
      moderationStatus,
      updatedAt: serverTimestamp(),
      ...(moderationStatus === 'approved' ? { publishedAt: serverTimestamp() } : {}),
    }
    await updateDoc(doc(ensureFirestoreReady(), 'listings', listingId), moderationPayload)
    return (await getListingById(listingId)) ?? updated
  }
  await putStoredListing(updated)
  return updated
}

async function storedMediaInputs(record: ListingRecord) {
  return Promise.all(
    record.media.images.map(async (url, index) => {
      if (!url.startsWith('data:')) {
        return {
          id: `remote-${index}-${record.id}`,
          source: 'remote' as const,
          previewUrl: url,
          remoteUrl: url,
          file: null,
          fileName: `listing-image-${index + 1}`,
          mimeType: 'image/*',
          size: 0,
        }
      }
      const response = await fetch(url)
      const blob = await response.blob()
      const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
      const file = new File([blob], `listing-image-${index + 1}.${extension}`, {
        type: blob.type || 'image/jpeg',
      })
      return {
        id: `local-${index}-${record.id}`,
        source: 'local' as const,
        previewUrl: url,
        remoteUrl: null,
        file,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      }
    })
  )
}

export async function migrateStoredMarketplaceListing(record: ListingRecord, owner: UserProfile) {
  if (authMode !== 'firebase') throw new Error('Live Firebase mode is required for migration.')
  if (record.ownerId !== owner.uid) throw new Error('You can migrate only listings you own.')
  const firestore = ensureFirestoreReady()
  const existing = await getDoc(doc(firestore, 'listings', record.id))
  if (existing.exists()) return { record: mapDoc(existing.id, existing.data()), migrated: false }

  const mediaInputs = await storedMediaInputs(record)
  let imageUrls: string[] = []
  try {
    imageUrls = await uploadListingImages(owner, record.id, mediaInputs)
    const migratedRecord: ListingRecord = {
      ...record,
      ownerId: owner.uid,
      status: 'pending_review',
      moderationStatus: 'pending',
      media: { ...record.media, coverImage: imageUrls[0] ?? '', images: imageUrls },
      publishedAt: null,
      viewCount: 0,
      favouriteCount: 0,
      updatedAt: new Date().toISOString(),
    }
    await setDoc(doc(firestore, 'listings', record.id), firestorePayload(migratedRecord, true))
    return {
      record: (await getListingById(record.id)) ?? migratedRecord,
      migrated: true,
    }
  } catch (error) {
    await Promise.allSettled(imageUrls.map(deleteStorageObjectByUrl))
    throw error
  }
}

export async function removeListing(listingId: string, owner: UserProfile) {
  const current = await getListingById(listingId)
  if (!current) return
  if (current.ownerId !== owner.uid && owner.role !== 'admin')
    throw new Error('You can only delete your own listings.')
  if (authMode !== 'local') {
    const firestore = ensureFirestoreReady()
    const privateAsset = await getPrivateListingAsset(firestore, listingId).catch(() => null)
    await Promise.all([
      deleteDoc(doc(firestore, 'listings', listingId)),
      deleteDoc(doc(firestore, 'listingPrivate', listingId)).catch(() => undefined),
    ])
    await Promise.allSettled(
      [...current.media.images, privateAsset?.cvUrl ?? '']
        .filter(Boolean)
        .map(deleteStorageObjectByUrl)
    )
    return
  }
  await deleteStoredListing(listingId)
}
