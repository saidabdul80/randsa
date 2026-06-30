import type { PropertyRecord } from '../types/property'

export interface SavedPropertyRecord {
  id: string
  userId: string
  propertyId: string
  createdAt: string
}

const LOCAL_SAVED_PROPERTIES_KEY = 'randsa.local.saved-properties'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readSavedProperties() {
  if (!canUseStorage()) {
    return [] as SavedPropertyRecord[]
  }

  const raw = window.localStorage.getItem(LOCAL_SAVED_PROPERTIES_KEY)

  if (!raw) {
    return [] as SavedPropertyRecord[]
  }

  try {
    return JSON.parse(raw) as SavedPropertyRecord[]
  } catch {
    return [] as SavedPropertyRecord[]
  }
}

function writeSavedProperties(records: SavedPropertyRecord[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(LOCAL_SAVED_PROPERTIES_KEY, JSON.stringify(records))
}

export function listSavedProperties(userId: string) {
  return readSavedProperties()
    .filter((record) => record.userId === userId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export function isPropertySaved(userId: string, propertyId: string) {
  return readSavedProperties().some(
    (record) => record.userId === userId && record.propertyId === propertyId,
  )
}

export function saveProperty(userId: string, property: PropertyRecord) {
  const records = readSavedProperties()
  const existing = records.find(
    (record) => record.userId === userId && record.propertyId === property.id,
  )

  if (existing) {
    return existing
  }

  const savedRecord: SavedPropertyRecord = {
    id: crypto.randomUUID(),
    userId,
    propertyId: property.id,
    createdAt: new Date().toISOString(),
  }

  records.push(savedRecord)
  writeSavedProperties(records)
  return savedRecord
}

export function removeSavedProperty(userId: string, propertyId: string) {
  const records = readSavedProperties()
  const nextRecords = records.filter(
    (record) => !(record.userId === userId && record.propertyId === propertyId),
  )

  writeSavedProperties(nextRecords)
}
