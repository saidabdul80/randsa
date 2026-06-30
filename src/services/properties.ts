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

import {
  auth,
  authMode,
  db,
  firebaseConfigError,
  isFirebaseConfigured,
} from '../lib/firebase'
import { getUserProfile } from './auth'
import {
  getAllStoredProperties,
  getStoredPropertyById,
  putStoredProperty,
} from './propertyDb'
import { deleteStorageObjectByUrl, uploadPropertyImages } from './storageUploads'
import {
  createEmptyPropertyInput,
  MAX_PROPERTY_IMAGES,
  type PropertyFormInput,
  type PropertyRecord,
} from '../types/property'
import type { UserProfile } from '../types/user'

function ensureFirestoreReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      firebaseConfigError ||
        'Firebase is not configured. Add your VITE_FIREBASE_* values before using properties.',
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

function mapDocToPropertyRecord(propertyId: string, data: DocumentData) {
  return {
    id: propertyId,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    category: data.category ?? 'residential',
    propertyType: data.propertyType ?? 'House rent',
    rentPrice: Number(data.rentPrice ?? 0),
    cautionFee: Number(data.cautionFee ?? 0),
    agencyFee: Number(data.agencyFee ?? 0),
    inspectionFee: Number(data.inspectionFee ?? 0),
    paymentDuration: data.paymentDuration ?? 'yearly',
    state: String(data.state ?? ''),
    city: String(data.city ?? ''),
    area: String(data.area ?? ''),
    address: String(data.address ?? ''),
    latitude: data.latitude === null || data.latitude === undefined ? null : Number(data.latitude),
    longitude:
      data.longitude === null || data.longitude === undefined ? null : Number(data.longitude),
    bedrooms: data.bedrooms === null || data.bedrooms === undefined ? null : Number(data.bedrooms),
    bathrooms:
      data.bathrooms === null || data.bathrooms === undefined ? null : Number(data.bathrooms),
    toilets: data.toilets === null || data.toilets === undefined ? null : Number(data.toilets),
    shopSize: String(data.shopSize ?? ''),
    roadAccess: Boolean(data.roadAccess),
    marketArea: Boolean(data.marketArea),
    electricityAvailability: Boolean(data.electricityAvailability),
    security: Boolean(data.security),
    waterAccess: Boolean(data.waterAccess),
    kitchen: Boolean(data.kitchen),
    parking: Boolean(data.parking),
    water: Boolean(data.water),
    electricity: Boolean(data.electricity),
    amenities: Array.isArray(data.amenities) ? data.amenities.map(String) : [],
    images: Array.isArray(data.images) ? data.images.map(String) : [],
    ownerId: String(data.ownerId ?? ''),
    ownerRole: data.ownerRole ?? 'tenant',
    ownerPhone: String(data.ownerPhone ?? ''),
    status: data.status ?? 'pending',
    isAvailable: Boolean(data.isAvailable),
    createdAt: normalizeTimestampLike(data.createdAt) ?? '',
    updatedAt: normalizeTimestampLike(data.updatedAt) ?? normalizeTimestampLike(data.createdAt) ?? '',
  } satisfies PropertyRecord
}

function sortProperties(properties: PropertyRecord[]) {
  return [...properties].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
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

async function listFirestoreProperties(firestore: Firestore) {
  const propertyCollection = collection(firestore, 'properties')
  const currentUser = auth?.currentUser ?? null
  const currentRole = await getCurrentUserRole()

  if (!currentUser) {
    const snapshot = await getDocs(query(propertyCollection, where('status', '==', 'approved')))
    return sortProperties(snapshot.docs.map((propertyDoc) => mapDocToPropertyRecord(propertyDoc.id, propertyDoc.data())))
  }

  if (currentRole === 'admin') {
    const snapshot = await getDocs(propertyCollection)
    return sortProperties(snapshot.docs.map((propertyDoc) => mapDocToPropertyRecord(propertyDoc.id, propertyDoc.data())))
  }

  const [approvedSnapshot, ownSnapshot] = await Promise.all([
    getDocs(query(propertyCollection, where('status', '==', 'approved'))),
    getDocs(query(propertyCollection, where('ownerId', '==', currentUser.uid))),
  ])

  const recordMap = new Map<string, PropertyRecord>()

  for (const propertyDoc of [...approvedSnapshot.docs, ...ownSnapshot.docs]) {
    recordMap.set(propertyDoc.id, mapDocToPropertyRecord(propertyDoc.id, propertyDoc.data()))
  }

  return sortProperties([...recordMap.values()])
}

function normalizeMoney(value: number) {
  if (Number.isNaN(value) || value < 0) {
    return 0
  }

  return Math.round(value)
}

function cleanAmenities(amenities: string[]) {
  return amenities
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
}

function sanitizeInput(input: PropertyFormInput): PropertyFormInput {
  const safeInput = {
    ...createEmptyPropertyInput(),
    ...input,
  }

  return {
    ...safeInput,
    title: safeInput.title.trim(),
    description: safeInput.description.trim(),
    state: safeInput.state.trim(),
    city: safeInput.city.trim(),
    area: safeInput.area.trim(),
    address: safeInput.address.trim(),
    shopSize: safeInput.shopSize.trim(),
    ownerPhone: safeInput.ownerPhone.trim(),
    rentPrice: normalizeMoney(safeInput.rentPrice),
    cautionFee: normalizeMoney(safeInput.cautionFee),
    agencyFee: normalizeMoney(safeInput.agencyFee),
    inspectionFee: normalizeMoney(safeInput.inspectionFee),
    bedrooms: safeInput.bedrooms ?? null,
    bathrooms: safeInput.bathrooms ?? null,
    toilets: safeInput.toilets ?? null,
    amenities: cleanAmenities(safeInput.amenities),
    images: safeInput.images.slice(0, MAX_PROPERTY_IMAGES),
  }
}

export function validatePropertyInput(input: PropertyFormInput) {
  const safeInput = sanitizeInput(input)

  if (!safeInput.title) {
    return 'Add a property title.'
  }

  if (!safeInput.description) {
    return 'Add a property description.'
  }

  if (!safeInput.state || !safeInput.city || !safeInput.area || !safeInput.address) {
    return 'Complete the full property location.'
  }

  if (!safeInput.ownerPhone) {
    return 'Add an owner or contact phone number.'
  }

  if (!safeInput.images.length) {
    return 'Upload at least one property image.'
  }

  if (safeInput.images.length > MAX_PROPERTY_IMAGES) {
    return `You can only keep ${MAX_PROPERTY_IMAGES} images on one property.`
  }

  if (safeInput.rentPrice <= 0) {
    return 'Enter a rent price greater than zero.'
  }

  if (safeInput.propertyType === 'Shop rent' && !safeInput.shopSize) {
    return 'Enter the shop size for shop rent listings.'
  }

  if (
    ['House rent', 'Apartment', 'Self-contained', 'Flat', 'Duplex'].includes(
      safeInput.propertyType,
    ) &&
    (safeInput.bedrooms === null || safeInput.bathrooms === null || safeInput.toilets === null)
  ) {
    return 'Add bedrooms, bathrooms, and toilets for residential listings.'
  }

  return ''
}

export async function listProperties() {
  if (authMode !== 'local') {
    return listFirestoreProperties(ensureFirestoreReady())
  }

  const properties = await getAllStoredProperties()
  return sortProperties(properties)
}

export async function getPropertyById(propertyId: string) {
  if (authMode !== 'local') {
    const firestore = ensureFirestoreReady()
    const snapshot = await getDoc(doc(firestore, 'properties', propertyId))
    return snapshot.exists() ? mapDocToPropertyRecord(snapshot.id, snapshot.data()) : null
  }

  return getStoredPropertyById(propertyId)
}

export async function createProperty(input: PropertyFormInput, owner: UserProfile) {
  const validationError = validatePropertyInput(input)

  if (validationError) {
    throw new Error(validationError)
  }

  const safeInput = sanitizeInput(input)
  const now = new Date().toISOString()
  const propertyId = crypto.randomUUID()
  let uploadedImageUrls: string[] = []

  try {
    uploadedImageUrls = await uploadPropertyImages(owner, propertyId, safeInput.images)
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Could not upload the selected property images.')
  }

  const record: PropertyRecord = {
    id: propertyId,
    title: safeInput.title,
    description: safeInput.description,
    category: safeInput.category,
    propertyType: safeInput.propertyType,
    rentPrice: safeInput.rentPrice,
    cautionFee: safeInput.cautionFee,
    agencyFee: safeInput.agencyFee,
    inspectionFee: safeInput.inspectionFee,
    paymentDuration: safeInput.paymentDuration,
    state: safeInput.state,
    city: safeInput.city,
    area: safeInput.area,
    address: safeInput.address,
    latitude: safeInput.latitude,
    longitude: safeInput.longitude,
    bedrooms: safeInput.bedrooms,
    bathrooms: safeInput.bathrooms,
    toilets: safeInput.toilets,
    shopSize: safeInput.shopSize,
    roadAccess: safeInput.roadAccess,
    marketArea: safeInput.marketArea,
    electricityAvailability: safeInput.electricityAvailability,
    security: safeInput.security,
    waterAccess: safeInput.waterAccess,
    kitchen: safeInput.kitchen,
    parking: safeInput.parking,
    water: safeInput.water,
    electricity: safeInput.electricity,
    amenities: safeInput.amenities,
    images: uploadedImageUrls,
    ownerId: owner.uid,
    ownerRole: owner.role,
    ownerPhone: safeInput.ownerPhone,
    status: owner.role === 'admin' ? 'approved' : 'pending',
    isAvailable: safeInput.isAvailable,
    createdAt: now,
    updatedAt: now,
  }

  try {
    if (authMode !== 'local') {
      const firestore = ensureFirestoreReady()
      await setDoc(doc(firestore, 'properties', propertyId), {
        title: record.title,
        description: record.description,
        category: record.category,
        propertyType: record.propertyType,
        rentPrice: record.rentPrice,
        cautionFee: record.cautionFee,
        agencyFee: record.agencyFee,
        inspectionFee: record.inspectionFee,
        paymentDuration: record.paymentDuration,
        state: record.state,
        city: record.city,
        area: record.area,
        address: record.address,
        latitude: record.latitude,
        longitude: record.longitude,
        bedrooms: record.bedrooms,
        bathrooms: record.bathrooms,
        toilets: record.toilets,
        shopSize: record.shopSize,
        roadAccess: record.roadAccess,
        marketArea: record.marketArea,
        electricityAvailability: record.electricityAvailability,
        security: record.security,
        waterAccess: record.waterAccess,
        kitchen: record.kitchen,
        parking: record.parking,
        water: record.water,
        electricity: record.electricity,
        amenities: record.amenities,
        images: record.images,
        ownerId: record.ownerId,
        ownerRole: record.ownerRole,
        ownerPhone: record.ownerPhone,
        status: record.status,
        isAvailable: record.isAvailable,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return (await getPropertyById(propertyId)) ?? record
    }

    await putStoredProperty(record)
    return record
  } catch (error) {
    await Promise.allSettled(uploadedImageUrls.map((url) => deleteStorageObjectByUrl(url)))
    throw error
  }
}

export async function updateProperty(propertyId: string, input: PropertyFormInput, owner: UserProfile) {
  const validationError = validatePropertyInput(input)

  if (validationError) {
    throw new Error(validationError)
  }

  const current = await getStoredPropertyById(propertyId)

  if (!current) {
    throw new Error('The property you are trying to edit was not found.')
  }

  if (current.ownerId !== owner.uid && owner.role !== 'admin') {
    throw new Error('You can only edit your own property listings.')
  }

  const safeInput = sanitizeInput(input)
  const previousImageUrls = current.images
  let nextImageUrls: string[] = []

  try {
    nextImageUrls = await uploadPropertyImages(owner, propertyId, safeInput.images)
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Could not upload the selected property images.')
  }

  const updated: PropertyRecord = {
    ...current,
    ...safeInput,
    images: nextImageUrls,
    status: current.status,
    updatedAt: new Date().toISOString(),
  }

  try {
    if (authMode !== 'local') {
      const firestore = ensureFirestoreReady()
      await updateDoc(doc(firestore, 'properties', propertyId), {
        title: updated.title,
        description: updated.description,
        category: updated.category,
        propertyType: updated.propertyType,
        rentPrice: updated.rentPrice,
        cautionFee: updated.cautionFee,
        agencyFee: updated.agencyFee,
        inspectionFee: updated.inspectionFee,
        paymentDuration: updated.paymentDuration,
        state: updated.state,
        city: updated.city,
        area: updated.area,
        address: updated.address,
        latitude: updated.latitude,
        longitude: updated.longitude,
        bedrooms: updated.bedrooms,
        bathrooms: updated.bathrooms,
        toilets: updated.toilets,
        shopSize: updated.shopSize,
        roadAccess: updated.roadAccess,
        marketArea: updated.marketArea,
        electricityAvailability: updated.electricityAvailability,
        security: updated.security,
        waterAccess: updated.waterAccess,
        kitchen: updated.kitchen,
        parking: updated.parking,
        water: updated.water,
        electricity: updated.electricity,
        amenities: updated.amenities,
        images: updated.images,
        ownerPhone: updated.ownerPhone,
        isAvailable: updated.isAvailable,
        updatedAt: serverTimestamp(),
      })

      const refreshed = (await getPropertyById(propertyId)) ?? updated
      const removedImageUrls = previousImageUrls.filter((url) => !nextImageUrls.includes(url))
      await Promise.allSettled(removedImageUrls.map((url) => deleteStorageObjectByUrl(url)))
      return refreshed
    }

    await putStoredProperty(updated)

    const removedImageUrls = previousImageUrls.filter((url) => !nextImageUrls.includes(url))
    await Promise.allSettled(removedImageUrls.map((url) => deleteStorageObjectByUrl(url)))

    return updated
  } catch (error) {
    const newlyUploadedUrls = nextImageUrls.filter((url) => !previousImageUrls.includes(url))
    await Promise.allSettled(newlyUploadedUrls.map((url) => deleteStorageObjectByUrl(url)))
    throw error
  }
}

export async function reviewPropertyStatus(
  propertyId: string,
  admin: UserProfile,
  status: Extract<PropertyRecord['status'], 'approved' | 'rejected'>,
) {
  if (admin.role !== 'admin') {
    throw new Error('Only admin accounts can review property listings.')
  }

  const current = await getStoredPropertyById(propertyId)

  if (!current) {
    throw new Error('The selected property listing was not found.')
  }

  const updated: PropertyRecord = {
    ...current,
    status,
    updatedAt: new Date().toISOString(),
  }

  if (authMode !== 'local') {
    const firestore = ensureFirestoreReady()
    await updateDoc(doc(firestore, 'properties', propertyId), {
      status,
      updatedAt: serverTimestamp(),
    })

    return (await getPropertyById(propertyId)) ?? updated
  }

  await putStoredProperty(updated)
  return updated
}
