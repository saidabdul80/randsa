import type { ListingFormInput, ListingMediaInput } from '../types/listing'

const DB_NAME = 'randsa-marketplace-drafts'
const DB_VERSION = 1
const STORE_NAME = 'drafts'

export interface MarketplaceListingDraft {
  id: string
  userId: string
  value: ListingFormInput
  step: number
  updatedAt: string
}

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
    request.onerror = () => reject(request.error ?? new Error('Could not open listing drafts.'))
  })
}

async function useStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
) {
  const database = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = run(transaction.objectStore(STORE_NAME))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Could not complete the draft request.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('The draft transaction failed.'))
  })
}

function draftId(userId: string, categoryId: string, subcategoryId: string) {
  return `${userId}:${categoryId}:${subcategoryId}`
}

function prepareImage(image: ListingMediaInput): ListingMediaInput {
  return image.source === 'local' ? { ...image, previewUrl: '' } : { ...image }
}

function restoreImage(image: ListingMediaInput): ListingMediaInput | null {
  if (image.source === 'remote') return { ...image }
  if (!image.file) return null
  return { ...image, previewUrl: URL.createObjectURL(image.file) }
}

export async function saveMarketplaceListingDraft(
  userId: string,
  value: ListingFormInput,
  step: number
) {
  const draft: MarketplaceListingDraft = {
    id: draftId(userId, value.categoryId, value.subcategoryId),
    userId,
    value: {
      ...value,
      images: value.images.map(prepareImage),
      attributes: { ...value.attributes },
    },
    step,
    updatedAt: new Date().toISOString(),
  }
  await useStore('readwrite', (store) => store.put(draft))
  return draft
}

export async function loadMarketplaceListingDraft(
  userId: string,
  categoryId: string,
  subcategoryId: string
) {
  const draft = await useStore<MarketplaceListingDraft | undefined>('readonly', (store) =>
    store.get(draftId(userId, categoryId, subcategoryId))
  )
  if (!draft) return null
  return {
    ...draft,
    value: {
      ...draft.value,
      images: draft.value.images
        .map(restoreImage)
        .filter((image): image is ListingMediaInput => Boolean(image)),
      attributes: { ...draft.value.attributes },
    },
  }
}

export async function deleteMarketplaceListingDraft(
  userId: string,
  categoryId: string,
  subcategoryId: string
) {
  await useStore<undefined>('readwrite', (store) =>
    store.delete(draftId(userId, categoryId, subcategoryId))
  )
}
