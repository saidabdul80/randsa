import type {
  PropertyAvailabilityConfig,
  PropertyFormInput,
  PropertyImageInput,
} from '../types/property'

const DB_NAME = 'randsa-property-drafts'
const DB_VERSION = 1
const STORE_NAME = 'drafts'
const ADD_PROPERTY_DRAFT_ID = 'add-property'

export interface PropertyWizardDraft {
  id: string
  userId: string
  value: PropertyFormInput
  step: number
  updatedAt: string
}

function openDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Draft storage is unavailable in this browser.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open property draft storage.'))
  })
}

async function useDraftStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDraftDatabase()

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = operation(transaction.objectStore(STORE_NAME))

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not complete the draft request.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => reject(transaction.error ?? new Error('The draft transaction failed.'))
  })
}

function prepareImageForStorage(image: PropertyImageInput): PropertyImageInput {
  return image.source === 'local'
    ? { ...image, previewUrl: '' }
    : { ...image }
}

function prepareAvailabilityForStorage(
  availabilityConfig: PropertyAvailabilityConfig,
): PropertyAvailabilityConfig {
  return {
    limitedRemainingCapacity: availabilityConfig.limitedRemainingCapacity,
    blockedDates: [...availabilityConfig.blockedDates],
    bufferMinutes: availabilityConfig.bufferMinutes,
    minimumDurationMinutes: availabilityConfig.minimumDurationMinutes,
    agents: availabilityConfig.agents.map((agent) => ({
      ...agent,
      workingDays: [...agent.workingDays],
      unavailableDates: [...agent.unavailableDates],
      vacationPeriods: agent.vacationPeriods.map((period) => ({ ...period })),
    })),
  }
}

function restoreImagePreview(image: PropertyImageInput): PropertyImageInput | null {
  if (image.source === 'remote') return { ...image }
  if (!image.file) return null

  return {
    ...image,
    previewUrl: URL.createObjectURL(image.file),
  }
}

function draftId(userId: string) {
  return `${ADD_PROPERTY_DRAFT_ID}:${userId}`
}

export async function savePropertyWizardDraft(
  userId: string,
  value: PropertyFormInput,
  step: number,
) {
  const draft: PropertyWizardDraft = {
    id: draftId(userId),
    userId,
    value: {
      ...value,
      amenities: [...value.amenities],
      images: value.images.map(prepareImageForStorage),
      availabilityConfig: prepareAvailabilityForStorage(value.availabilityConfig),
    },
    step,
    updatedAt: new Date().toISOString(),
  }

  await useDraftStore('readwrite', (store) => store.put(draft))
  return draft
}

export async function loadPropertyWizardDraft(userId: string) {
  const draft = await useDraftStore<PropertyWizardDraft | undefined>('readonly', (store) =>
    store.get(draftId(userId)),
  )

  if (!draft) return null

  return {
    ...draft,
    value: {
      ...draft.value,
      amenities: [...draft.value.amenities],
      images: draft.value.images
        .map(restoreImagePreview)
        .filter((image): image is PropertyImageInput => Boolean(image)),
    },
  } satisfies PropertyWizardDraft
}

export async function deletePropertyWizardDraft(userId: string) {
  await useDraftStore('readwrite', (store) => store.delete(draftId(userId)))
}
