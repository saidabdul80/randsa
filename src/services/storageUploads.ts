import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'

import { auth, authMode, firebaseConfigError, isFirebaseConfigured, storage } from '../lib/firebase'
import { isListingCapableRole, type PropertyImageInput } from '../types/property'
import type { VerificationAsset } from '../types/verification'
import type { UserProfile } from '../types/user'
import type { ListingMediaInput } from '../types/listing'

export interface StorageUploadResult {
  downloadURL: string
  fullPath: string
  name: string
}

function ensureStorageReady(profile: UserProfile) {
  if (authMode === 'local') {
    throw new Error(
      'Real Firebase Storage testing is disabled while local auth bypass is on. Set VITE_ENABLE_LOCAL_AUTH_BYPASS=false, restart the dev server, and sign in with a real Firebase account first.'
    )
  }

  if (!isFirebaseConfigured || !storage || !auth) {
    throw new Error(
      firebaseConfigError ||
        'Firebase Storage is not configured yet. Add your VITE_FIREBASE_* values before testing uploads.'
    )
  }

  if (!auth.currentUser) {
    throw new Error('Sign in with Firebase before testing uploads.')
  }

  if (auth.currentUser.uid !== profile.uid) {
    throw new Error('The signed-in Firebase user does not match the active profile.')
  }
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function buildFileName(file: File) {
  const sanitizedName = sanitizeFileName(file.name || 'upload.bin').slice(0, 180)
  return `${Date.now()}-${sanitizedName || 'upload.bin'}`
}

async function uploadAtPath(path: string, file: File) {
  if (!storage) {
    throw new Error('Firebase Storage is not available.')
  }

  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  })

  return {
    downloadURL: await getDownloadURL(storageRef),
    fullPath: storageRef.fullPath,
    name: storageRef.name,
  } satisfies StorageUploadResult
}

export async function uploadUserFile(profile: UserProfile, file: File) {
  ensureStorageReady(profile)
  return uploadAtPath(`users/${profile.uid}/${buildFileName(file)}`, file)
}

export async function uploadAgentVerificationFile(profile: UserProfile, file: File) {
  ensureStorageReady(profile)
  return uploadAtPath(`agent-verifications/${profile.uid}/${buildFileName(file)}`, file)
}

export async function uploadPropertyFile(profile: UserProfile, propertyId: string, file: File) {
  ensureStorageReady(profile)

  if (!isListingCapableRole(profile.role)) {
    throw new Error('Your account cannot upload property images.')
  }

  const trimmedPropertyId = propertyId.trim()

  if (!trimmedPropertyId) {
    throw new Error('Enter a property ID before testing the property upload path.')
  }

  return uploadAtPath(`properties/${profile.uid}/${trimmedPropertyId}/${buildFileName(file)}`, file)
}

function extractStoragePathFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.hostname === 'firebasestorage.googleapis.com') {
      const pathMatch = parsedUrl.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)$/)
      return pathMatch ? decodeURIComponent(pathMatch[1]) : ''
    }

    if (parsedUrl.hostname.endsWith('.firebasestorage.app')) {
      return decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''))
    }

    return ''
  } catch {
    return ''
  }
}

export async function deleteStorageObjectByUrl(url: string) {
  if (!storage) {
    return
  }

  const path = extractStoragePathFromUrl(url)

  if (!path) {
    return
  }

  await deleteObject(ref(storage, path))
}

export async function uploadPropertyImages(
  profile: UserProfile,
  propertyId: string,
  images: PropertyImageInput[]
) {
  ensureStorageReady(profile)

  const uploadedUrls: string[] = []

  for (const image of images) {
    if (image.source === 'remote' && image.remoteUrl) {
      uploadedUrls.push(image.remoteUrl)
      continue
    }

    if (!image.file) {
      throw new Error(`The file for ${image.fileName || 'one property image'} is missing.`)
    }

    const uploaded = await uploadPropertyFile(profile, propertyId, image.file)
    uploadedUrls.push(uploaded.downloadURL)
  }

  return uploadedUrls
}

export async function uploadListingFile(profile: UserProfile, listingId: string, file: File) {
  ensureStorageReady(profile)
  const trimmedListingId = listingId.trim()
  if (!trimmedListingId) throw new Error('A listing ID is required before uploading media.')
  return uploadAtPath(`listings/${profile.uid}/${trimmedListingId}/${buildFileName(file)}`, file)
}

export async function uploadListingImages(
  profile: UserProfile,
  listingId: string,
  images: ListingMediaInput[],
  onProgress?: (completed: number, total: number) => void
) {
  ensureStorageReady(profile)
  const uploadedUrls: string[] = []

  for (const [index, image] of images.entries()) {
    if (image.source === 'remote' && image.remoteUrl) {
      uploadedUrls.push(image.remoteUrl)
    } else {
      if (!image.file) {
        throw new Error(`The file for ${image.fileName || 'one listing image'} is missing.`)
      }
      try {
        const uploaded = await uploadListingFile(profile, listingId, image.file)
        uploadedUrls.push(uploaded.downloadURL)
      } catch (error) {
        const fileLabel = image.fileName || `image ${index + 1}`
        throw new Error(
          `Firebase Storage could not upload image ${index + 1} (${fileLabel}). ${toStorageDisplayError(error)}`,
          { cause: error }
        )
      }
    }
    onProgress?.(uploadedUrls.length, images.length)
  }

  return uploadedUrls
}

export async function uploadPrivateListingDocument(
  profile: UserProfile,
  listingId: string,
  file: File
) {
  ensureStorageReady(profile)
  if (file.type !== 'application/pdf') {
    throw new Error('CV documents must be uploaded as PDF files.')
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('The CV document must be smaller than 2 MB.')
  }
  return uploadAtPath(`listing-private/${profile.uid}/${listingId}/${buildFileName(file)}`, file)
}

export async function uploadVerificationAssets(profile: UserProfile, assets: VerificationAsset[]) {
  ensureStorageReady(profile)

  const uploadedUrls: string[] = []

  for (const asset of assets) {
    if (asset.source === 'remote' && asset.remoteUrl) {
      uploadedUrls.push(asset.remoteUrl)
      continue
    }

    if (!asset.file) {
      throw new Error(`The file for ${asset.name || 'one verification document'} is missing.`)
    }

    const uploaded = await uploadAgentVerificationFile(profile, asset.file)
    uploadedUrls.push(uploaded.downloadURL)
  }

  return uploadedUrls
}

export function toStorageDisplayError(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    const code = error.code.replace('storage/', '')
    const messages: Record<string, string> = {
      unauthorized:
        'Firebase Storage rejected the upload. Double-check your sign-in state, role, and rules.',
      unauthenticated: 'Sign in with Firebase before uploading.',
      'object-not-found': 'The uploaded file could not be found after upload.',
      'quota-exceeded': 'The Firebase Storage bucket quota was exceeded.',
      canceled: 'The upload was canceled.',
      'retry-limit-exceeded': 'The upload timed out. Please try again.',
      'invalid-checksum': 'Firebase rejected the file because the upload checksum did not match.',
    }

    return messages[code] ?? `Storage error: ${code}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'The upload failed. Please try again.'
}
