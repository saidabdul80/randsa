import type { PropertyRecord } from '../types/property'

const DB_NAME = 'randsa-local-db'
const DB_VERSION = 1
const STORE_NAME = 'properties'

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local property database.'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDatabase()

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = handler(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Could not complete the local property request.'))

    transaction.oncomplete = () => database.close()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('The local property transaction failed.'))
  })
}

export async function getAllStoredProperties() {
  const result = await withStore<PropertyRecord[]>('readonly', (store) => store.getAll())
  return Array.isArray(result) ? result : []
}

export async function getStoredPropertyById(propertyId: string) {
  const result = await withStore<PropertyRecord | undefined>('readonly', (store) => store.get(propertyId))
  return result ?? null
}

export async function putStoredProperty(property: PropertyRecord) {
  const serializableRecord = JSON.parse(JSON.stringify(property)) as PropertyRecord
  await withStore<IDBValidKey>('readwrite', (store) => store.put(serializableRecord))
  return property
}
