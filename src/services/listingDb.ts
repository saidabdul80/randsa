import type { ListingRecord } from '../types/listing'

const DB_NAME = 'randsa-marketplace-db'
const DB_VERSION = 1
const STORE_NAME = 'listings'

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
    request.onerror = () => reject(request.error ?? new Error('Could not open listing storage.'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T>
) {
  const database = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = handler(transaction.objectStore(STORE_NAME))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Could not complete listing storage.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => reject(transaction.error ?? new Error('Listing storage failed.'))
  })
}

export async function getStoredListings() {
  const records = await withStore<ListingRecord[]>('readonly', (store) => store.getAll())
  return Array.isArray(records) ? records : []
}

export async function putStoredListing(record: ListingRecord) {
  const serializable = JSON.parse(JSON.stringify(record)) as ListingRecord
  await withStore<IDBValidKey>('readwrite', (store) => store.put(serializable))
  return record
}

export async function deleteStoredListing(listingId: string) {
  await withStore<undefined>('readwrite', (store) => store.delete(listingId))
}
