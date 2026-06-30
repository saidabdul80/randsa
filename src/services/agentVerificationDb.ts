import { normalizeVerificationRecord, type AgentVerificationRecord } from '../types/verification'

const DATABASE_NAME = 'randsa-local-verification-db'
const DATABASE_VERSION = 1
const STORE_NAME = 'agent-verifications'

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open verification storage.'))
  })
}

function withStore<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore) => IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    openDatabase()
      .then((database) => {
        const transaction = database.transaction(STORE_NAME, mode)
        const store = transaction.objectStore(STORE_NAME)
        const request = handler(store)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () =>
          reject(request.error ?? new Error('Verification storage request failed.'))
        transaction.oncomplete = () => database.close()
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Verification storage transaction failed.'))
      })
      .catch(reject)
  })
}

function cloneRecord<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function getAllStoredVerificationRecords() {
  const records = await withStore<AgentVerificationRecord[]>('readonly', (store) => store.getAll())
  return records.map((record) => normalizeVerificationRecord(cloneRecord(record)))
}

export async function getStoredVerificationRecordByAgentId(agentId: string) {
  const records = await getAllStoredVerificationRecords()
  return records.find((record) => record.agentId === agentId) ?? null
}

export async function getStoredVerificationRecordById(verificationId: string) {
  const record = await withStore<AgentVerificationRecord | undefined>('readonly', (store) =>
    store.get(verificationId),
  )

  return record ? normalizeVerificationRecord(cloneRecord(record)) : null
}

export async function putStoredVerificationRecord(record: AgentVerificationRecord) {
  const safeRecord = normalizeVerificationRecord(cloneRecord(record))
  await withStore<IDBValidKey>('readwrite', (store) => store.put(safeRecord))
  return safeRecord
}
