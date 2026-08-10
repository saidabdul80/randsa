import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'

import { authMode, db, firebaseConfigError, isFirebaseConfigured } from '../lib/firebase'
import type { PropertyRecord } from '../types/property'
import type { MarketplaceSaveSource } from '../types/marketplace'
import { normalizeSavedSource, savedItemKey, savedRecordId } from '../utils/savedRecords'

export interface SavedPropertyRecord {
  id: string
  userId: string
  propertyId: string
  source: MarketplaceSaveSource
  createdAt: string
}

const LOCAL_SAVED_PROPERTIES_KEY = 'randsa.local.saved-properties'

function ensureFirestoreReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      firebaseConfigError || 'Firebase is not configured. Add your Firebase environment values.'
    )
  }
  return db
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }

  const parsed = new Date(String(value ?? ''))
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString()
}

function mapSavedRecord(id: string, value: DocumentData): SavedPropertyRecord | null {
  const userId = String(value.userId ?? '').trim()
  const propertyId = String(value.propertyId ?? '').trim()
  if (!id || !userId || !propertyId) return null

  return {
    id,
    userId,
    propertyId,
    source: normalizeSavedSource(value.source),
    createdAt: normalizeDate(value.createdAt),
  }
}

function readSavedProperties() {
  if (!canUseStorage()) return [] as SavedPropertyRecord[]

  const raw = window.localStorage.getItem(LOCAL_SAVED_PROPERTIES_KEY)
  if (!raw) return [] as SavedPropertyRecord[]

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [] as SavedPropertyRecord[]
    return parsed.flatMap((value, index) => {
      if (!value || typeof value !== 'object') return []
      const record = mapSavedRecord(
        String((value as Record<string, unknown>).id ?? `local-saved-${index}`),
        value as DocumentData
      )
      return record ? [record] : []
    })
  } catch {
    return [] as SavedPropertyRecord[]
  }
}

function writeSavedProperties(records: SavedPropertyRecord[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(LOCAL_SAVED_PROPERTIES_KEY, JSON.stringify(records))
}

function sortSavedRecords(records: SavedPropertyRecord[]) {
  return [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function deduplicateSavedRecords(records: SavedPropertyRecord[]) {
  const unique = new Map<string, SavedPropertyRecord>()
  for (const record of records) {
    const key = savedItemKey(record.propertyId, record.source)
    if (!unique.has(key)) unique.set(key, record)
  }
  return sortSavedRecords([...unique.values()])
}

async function listFirestoreSavedProperties(firestore: Firestore, userId: string) {
  const snapshot = await getDocs(
    query(collection(firestore, 'savedProperties'), where('userId', '==', userId))
  )
  return deduplicateSavedRecords(
    snapshot.docs.flatMap((savedDoc) => {
      const record = mapSavedRecord(savedDoc.id, savedDoc.data())
      return record ? [record] : []
    })
  )
}

async function migrateLocalSavedProperties(
  firestore: Firestore,
  userId: string,
  remoteRecords: SavedPropertyRecord[]
) {
  const allLocalRecords = readSavedProperties()
  const localRecords = allLocalRecords.filter((record) => record.userId === userId)
  if (!localRecords.length) return remoteRecords

  const remoteKeys = new Set(
    remoteRecords.map((record) => savedItemKey(record.propertyId, record.source))
  )
  const recordsToMigrate = localRecords.filter(
    (record) => !remoteKeys.has(savedItemKey(record.propertyId, record.source))
  )

  await Promise.all(
    recordsToMigrate.map((record) =>
      setDoc(
        doc(
          firestore,
          'savedProperties',
          savedRecordId(record.userId, record.propertyId, record.source)
        ),
        {
          userId: record.userId,
          propertyId: record.propertyId,
          source: record.source,
          createdAt: new Date(record.createdAt),
        }
      )
    )
  )

  writeSavedProperties(allLocalRecords.filter((record) => record.userId !== userId))
  const migratedRecords = recordsToMigrate.map((record) => ({
    ...record,
    id: savedRecordId(record.userId, record.propertyId, record.source),
  }))
  return deduplicateSavedRecords([...remoteRecords, ...migratedRecords])
}

export async function listSavedProperties(userId: string) {
  if (authMode === 'local') {
    return deduplicateSavedRecords(
      readSavedProperties().filter((record) => record.userId === userId)
    )
  }

  const firestore = ensureFirestoreReady()
  const remoteRecords = await listFirestoreSavedProperties(firestore, userId)
  return migrateLocalSavedProperties(firestore, userId, remoteRecords)
}

export function saveProperty(userId: string, property: PropertyRecord) {
  return saveMarketplaceItem(userId, property.id, 'property')
}

export async function saveMarketplaceItem(
  userId: string,
  itemId: string,
  source: MarketplaceSaveSource
) {
  const existing = (await listSavedProperties(userId)).find(
    (record) => record.propertyId === itemId && record.source === source
  )
  if (existing) return existing

  const savedRecord: SavedPropertyRecord = {
    id: savedRecordId(userId, itemId, source),
    userId,
    propertyId: itemId,
    source,
    createdAt: new Date().toISOString(),
  }

  if (authMode === 'local') {
    const records = readSavedProperties()
    records.push(savedRecord)
    writeSavedProperties(records)
    return savedRecord
  }

  await setDoc(doc(ensureFirestoreReady(), 'savedProperties', savedRecord.id), {
    userId,
    propertyId: itemId,
    source,
    createdAt: serverTimestamp(),
  })
  return savedRecord
}

export async function removeSavedProperty(
  userId: string,
  propertyId: string,
  source: MarketplaceSaveSource = 'property'
) {
  if (authMode === 'local') {
    writeSavedProperties(
      readSavedProperties().filter(
        (record) =>
          !(
            record.userId === userId &&
            record.propertyId === propertyId &&
            record.source === source
          )
      )
    )
    return
  }

  const matches = (await listSavedProperties(userId)).filter(
    (record) => record.propertyId === propertyId && record.source === source
  )
  await Promise.all(
    matches.map((record) => deleteDoc(doc(ensureFirestoreReady(), 'savedProperties', record.id)))
  )
}
