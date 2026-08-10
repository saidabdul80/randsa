import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const projectRoot = new URL('../', import.meta.url)

const [firestoreRules, storageRules, indexConfig] = await Promise.all([
  readFile(new URL('firestore.rules', projectRoot), 'utf8'),
  readFile(new URL('storage.rules', projectRoot), 'utf8'),
  readFile(new URL('firestore.indexes.json', projectRoot), 'utf8').then(JSON.parse),
])

function hasCompositeIndex(collectionGroup, expectedFields) {
  return indexConfig.indexes.some(
    (index) =>
      index.collectionGroup === collectionGroup &&
      expectedFields.every((expected) =>
        index.fields.some(
          (field) => field.fieldPath === expected.fieldPath && field.order === expected.order
        )
      )
  )
}

test('Firestore rules retain ownership and public moderation boundaries', () => {
  assert.doesNotMatch(firestoreRules, /allow\s+read\s*,\s*write\s*:\s*if\s+true/)
  assert.match(firestoreRules, /request\.resource\.data\.ownerId == request\.auth\.uid/)
  assert.match(firestoreRules, /function listingOwnerFieldsUnchanged\(\)/)
  assert.match(firestoreRules, /function listingSubmissionFieldsValid\(\)/)
  assert.match(
    firestoreRules,
    /request\.resource\.data\.status == 'pending_review'[\s\S]*request\.resource\.data\.moderationStatus == 'pending'/
  )
  assert.match(firestoreRules, /resource\.data\.status == 'active'/)
  assert.match(firestoreRules, /resource\.data\.moderationStatus == 'approved'/)
  assert.match(firestoreRules, /request\.resource\.data\.source in \['property', 'listing'\]/)
})

test('client payment writes and notification content edits remain blocked', () => {
  const paymentBlock = firestoreRules.match(
    /match \/payments\/\{paymentId\} \{([\s\S]*?)\n {4}\}/
  )?.[1]
  const notificationBlock = firestoreRules.match(
    /match \/notifications\/\{notificationId\} \{([\s\S]*?)\n {4}\}/
  )?.[1]

  assert.ok(paymentBlock)
  assert.match(paymentBlock, /allow create: if false/)
  assert.match(paymentBlock, /allow update, delete: if false/)
  assert.ok(notificationBlock)
  assert.match(notificationBlock, /affectedKeys\(\)\.hasOnly\(\['readAt'\]\)/)
})

test('inactive accounts cannot register tokens and upload paths require safe filenames', () => {
  assert.match(
    firestoreRules,
    /match \/tokens\/\{tokenId\} \{[\s\S]*?allow create: if isSelf\(userId\)\s*&& currentUserIsActive\(\)/
  )
  assert.match(
    storageRules,
    /function isSafeFileName\(fileName\)[\s\S]*?fileName\.matches\('\^\[A-Za-z0-9\]/
  )
  assert.match(
    storageRules,
    /match \/listings\/\{ownerId\}\/\{listingId\}\/\{fileName\} \{[\s\S]*?allow create, update: if signedIn\(\)\s*&& isSafeFileName\(fileName\)/
  )
})

test('Storage rules restrict paths, image types, and upload size', () => {
  assert.doesNotMatch(storageRules, /allow\s+read\s*,\s*write\s*:\s*if\s+true/)
  assert.match(storageRules, /function isSupportedImage\(contentType\)/)
  assert.doesNotMatch(storageRules, /contentType\.matches\('image\/\.\*'\)/)
  assert.match(storageRules, /request\.resource\.size <= 2 \* 1024 \* 1024/)
  assert.match(storageRules, /request\.auth\.uid == ownerId \|\| isAdmin\(\)/)
  assert.match(storageRules, /match \/\{allPaths=\*\*\} \{\s*allow read, write: if false;/)
})

test('Firestore indexes cover marketplace and saved-listing queries', () => {
  assert.equal(
    hasCompositeIndex('listings', [
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'moderationStatus', order: 'ASCENDING' },
    ]),
    true
  )
  assert.equal(
    hasCompositeIndex('listings', [
      { fieldPath: 'ownerId', order: 'ASCENDING' },
      { fieldPath: 'updatedAt', order: 'DESCENDING' },
    ]),
    true
  )
  assert.equal(
    hasCompositeIndex('savedProperties', [
      { fieldPath: 'userId', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' },
    ]),
    true
  )
})
