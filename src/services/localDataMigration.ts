import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'

import { authMode, db, firebaseConfigError, isFirebaseConfigured } from '../lib/firebase'
import { getAllStoredVerificationRecords } from './agentVerificationDb'
import { cancelBooking, createBooking, listAllLocalBookings } from './bookings'
import { getAllStoredProperties } from './propertyDb'
import { normalizeVerificationRecord, type AgentVerificationRecord } from '../types/verification'
import type { PropertyRecord } from '../types/property'
import type { UserProfile } from '../types/user'

export interface LocalMigrationPreviewSection {
  detected: number
  eligible: number
  blocked: number
}

export interface LocalMigrationPreview {
  properties: LocalMigrationPreviewSection
  bookings: LocalMigrationPreviewSection
  verifications: LocalMigrationPreviewSection
  hasAnythingToMigrate: boolean
  notes: string[]
}

export interface LocalMigrationResultSection {
  migrated: number
  skipped: number
  failed: number
}

export interface LocalMigrationResult {
  properties: LocalMigrationResultSection
  bookings: LocalMigrationResultSection
  verifications: LocalMigrationResultSection
  notes: string[]
}

function ensureFirestoreReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      firebaseConfigError ||
        'Firebase is not configured. Add your VITE_FIREBASE_* values before migrating local data.',
    )
  }

  return db
}

function toTimestampOrServerValue(value: string | null | undefined) {
  const parsedDate = value ? new Date(value) : null
  return parsedDate && !Number.isNaN(parsedDate.getTime())
    ? Timestamp.fromDate(parsedDate)
    : serverTimestamp()
}

function isPropertyEligibleForCurrentProfile(property: PropertyRecord, profile: UserProfile) {
  return (
    property.ownerId === profile.uid &&
    ['landlord', 'agent', 'admin'].includes(profile.role) &&
    property.ownerRole === profile.role
  )
}

function isBookingEligibleForCurrentProfile(booking: { userId: string; status: string }, profile: UserProfile) {
  return (
    booking.userId === profile.uid &&
    booking.status !== 'confirmed' &&
    booking.status !== 'completed'
  )
}

function isVerificationEligibleForCurrentProfile(
  verification: AgentVerificationRecord,
  profile: UserProfile,
) {
  return verification.agentId === profile.uid && profile.role === 'agent'
}

export async function getLocalDataMigrationPreview(profile: UserProfile): Promise<LocalMigrationPreview> {
  const localProperties = await getAllStoredProperties()
  const localBookings = listAllLocalBookings()
  const localVerifications = await getAllStoredVerificationRecords()

  const profileProperties = localProperties.filter((property) => property.ownerId === profile.uid)
  const profileBookings = localBookings.filter((booking) => booking.userId === profile.uid)
  const profileVerifications = localVerifications.filter(
    (verification) => verification.agentId === profile.uid,
  )

  const eligibleProperties = profileProperties.filter((property) =>
    isPropertyEligibleForCurrentProfile(property, profile),
  )
  const eligibleBookings = profileBookings.filter((booking) =>
    isBookingEligibleForCurrentProfile(booking, profile),
  )
  const eligibleVerifications = profileVerifications.filter((verification) =>
    isVerificationEligibleForCurrentProfile(verification, profile),
  )

  let propertiesEligible = eligibleProperties.length
  let bookingsEligible = eligibleBookings.length
  let verificationsEligible = eligibleVerifications.length

  if (authMode === 'firebase') {
    const firestore = ensureFirestoreReady()

    propertiesEligible = (
      await Promise.all(
        eligibleProperties.map(async (property) => {
          const snapshot = await getDoc(doc(firestore, 'properties', property.id))
          return snapshot.exists()
        }),
      )
    ).filter((exists) => !exists).length

    bookingsEligible = (
      await Promise.all(
        eligibleBookings.map(async (booking) => {
          const snapshot = await getDoc(doc(firestore, 'bookings', booking.id))
          return snapshot.exists()
        }),
      )
    ).filter((exists) => !exists).length

    verificationsEligible = (
      await Promise.all(
        eligibleVerifications.map(async (verification) => {
          const snapshot = await getDoc(doc(firestore, 'agentVerifications', verification.id))
          return snapshot.exists()
        }),
      )
    ).filter((exists) => !exists).length
  }

  const notes: string[] = []

  if (profileProperties.some((property) => property.status !== 'pending') && profile.role !== 'admin') {
    notes.push('Owner-managed local listings will be re-submitted as pending so admin review can happen again in Firestore.')
  }

  if (profileVerifications.some((verification) => verification.status !== 'pending')) {
    notes.push('Local verification records will be migrated as a fresh pending submission because approval state must be reviewed again under the live backend rules.')
  }

  if (profileBookings.some((booking) => booking.status === 'confirmed' || booking.status === 'completed')) {
    notes.push('Confirmed or completed local bookings cannot be recreated safely from the client, so they will be skipped.')
  }

  return {
    properties: {
      detected: profileProperties.length,
      eligible: propertiesEligible,
      blocked: profileProperties.length - propertiesEligible,
    },
    bookings: {
      detected: profileBookings.length,
      eligible: bookingsEligible,
      blocked: profileBookings.length - bookingsEligible,
    },
    verifications: {
      detected: profileVerifications.length,
      eligible: verificationsEligible,
      blocked: profileVerifications.length - verificationsEligible,
    },
    hasAnythingToMigrate:
      propertiesEligible > 0 || bookingsEligible > 0 || verificationsEligible > 0,
    notes,
  }
}

function buildFirestorePropertyPayload(property: PropertyRecord, profile: UserProfile) {
  return {
    title: property.title,
    description: property.description,
    category: property.category,
    propertyType: property.propertyType,
    rentPrice: property.rentPrice,
    cautionFee: property.cautionFee,
    agencyFee: property.agencyFee,
    inspectionFee: property.inspectionFee,
    paymentDuration: property.paymentDuration,
    state: property.state,
    city: property.city,
    area: property.area,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    toilets: property.toilets,
    shopSize: property.shopSize,
    roadAccess: property.roadAccess,
    marketArea: property.marketArea,
    electricityAvailability: property.electricityAvailability,
    security: property.security,
    waterAccess: property.waterAccess,
    kitchen: property.kitchen,
    parking: property.parking,
    water: property.water,
    electricity: property.electricity,
    amenities: property.amenities,
    images: property.images,
    ownerId: property.ownerId,
    ownerRole: property.ownerRole,
    ownerPhone: property.ownerPhone,
    status: profile.role === 'admin' ? property.status : 'pending',
    isAvailable: property.isAvailable,
    availabilityConfig: property.availabilityConfig,
    createdAt: toTimestampOrServerValue(property.createdAt),
    updatedAt: toTimestampOrServerValue(property.updatedAt),
  }
}

export async function migrateLocalDataForCurrentProfile(
  profile: UserProfile,
): Promise<LocalMigrationResult> {
  if (authMode !== 'firebase') {
    throw new Error('Switch to live Firebase mode before migrating local browser data.')
  }

  const firestore = ensureFirestoreReady()
  const localProperties = await getAllStoredProperties()
  const localBookings = listAllLocalBookings()
  const localVerifications = await getAllStoredVerificationRecords()

  const result: LocalMigrationResult = {
    properties: { migrated: 0, skipped: 0, failed: 0 },
    bookings: { migrated: 0, skipped: 0, failed: 0 },
    verifications: { migrated: 0, skipped: 0, failed: 0 },
    notes: [],
  }

  for (const property of localProperties.filter((item) => item.ownerId === profile.uid)) {
    if (!isPropertyEligibleForCurrentProfile(property, profile)) {
      result.properties.skipped += 1
      continue
    }

    try {
      const propertyRef = doc(firestore, 'properties', property.id)
      const existing = await getDoc(propertyRef)

      if (existing.exists()) {
        result.properties.skipped += 1
        continue
      }

      if (profile.role !== 'admin' && property.status !== 'pending') {
        result.notes.push(`Property "${property.title}" was re-submitted as pending for fresh moderation.`)
      }

      await setDoc(propertyRef, buildFirestorePropertyPayload(property, profile))
      result.properties.migrated += 1
    } catch {
      result.properties.failed += 1
    }
  }

  for (const booking of localBookings.filter((item) => item.userId === profile.uid)) {
    if (!isBookingEligibleForCurrentProfile(booking, profile)) {
      result.bookings.skipped += 1
      continue
    }

    try {
      const bookingRef = doc(firestore, 'bookings', booking.id)
      const existing = await getDoc(bookingRef)

      if (existing.exists()) {
        result.bookings.skipped += 1
        continue
      }

      const property = localProperties.find((item) => item.id === booking.propertyId)
      if (!property) {
        result.bookings.skipped += 1
        continue
      }

      const migrated = await createBooking(
        {
          inspectionDate: booking.inspectionDate,
          inspectionTime: booking.inspectionTime,
          endDate: booking.endAt ? booking.endAt.slice(0, 10) : '',
          endTime: booking.endAt
            ? new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Africa/Lagos',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
              }).format(new Date(booking.endAt))
            : '',
          durationMinutes: booking.durationMinutes,
          quantity: booking.quantity,
          categoryDetails: booking.categoryDetails,
          requestId: booking.id.replace(/^booking-/, ''),
          guestPhone: booking.guestPhone,
          notes: booking.notes,
        },
        profile,
        property,
      )

      if (booking.status === 'cancelled') {
        await cancelBooking(migrated.id, profile.uid)
      }

      result.bookings.migrated += 1
    } catch {
      result.bookings.failed += 1
    }
  }

  for (const verification of localVerifications.filter((item) => item.agentId === profile.uid)) {
    if (!isVerificationEligibleForCurrentProfile(verification, profile)) {
      result.verifications.skipped += 1
      continue
    }

    try {
      const verificationRef = doc(firestore, 'agentVerifications', verification.id)
      const existing = await getDoc(verificationRef)

      if (existing.exists()) {
        result.verifications.skipped += 1
        continue
      }

      const normalized = normalizeVerificationRecord(verification)

      if (normalized.status !== 'pending') {
        result.notes.push('An older local verification record was re-submitted as pending for a fresh admin review.')
      }

      await setDoc(verificationRef, {
        agentId: normalized.agentId,
        fullName: normalized.fullName,
        phone: normalized.phone,
        whatsappNumber: normalized.whatsappNumber,
        officeAddress: normalized.officeAddress,
        profilePhoto: normalized.profilePhoto,
        idDocument: normalized.idDocument,
        cacDocument: normalized.cacDocument,
        authorizationDocument: normalized.authorizationDocument,
        status: 'pending',
        adminNote: '',
        submittedAt: toTimestampOrServerValue(normalized.submittedAt),
        reviewedAt: null,
      })

      result.verifications.migrated += 1
    } catch {
      result.verifications.failed += 1
    }
  }

  return result
}
