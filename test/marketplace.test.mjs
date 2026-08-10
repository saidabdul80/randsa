import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolve } from 'node:path'

import { build } from 'esbuild'

async function loadTypeScriptModule(entryPoint) {
  const result = await build({
    entryPoints: [resolve(entryPoint)],
    bundle: true,
    format: 'esm',
    logLevel: 'silent',
    platform: 'node',
    target: 'node22',
    write: false,
  })
  const source = result.outputFiles[0].text
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

const validation = await loadTypeScriptModule('src/services/listingValidation.ts')
const discovery = await loadTypeScriptModule('src/services/marketplaceDiscovery.ts')
const coordinates = await loadTypeScriptModule('src/utils/coordinates.ts')
const savedRecords = await loadTypeScriptModule('src/utils/savedRecords.ts')

function mediaInput(index = 1) {
  const url = `https://example.com/listing-${index}.jpg`
  return {
    id: `media-${index}`,
    source: 'remote',
    previewUrl: url,
    remoteUrl: url,
    file: null,
    fileName: `listing-${index}.jpg`,
    mimeType: 'image/jpeg',
    size: 1000,
  }
}

function listingInput(overrides = {}) {
  return {
    title: '  iPhone 15 Pro  ',
    description: '  Clean device with original accessories.  ',
    categoryId: 'phones-tablets',
    categoryName: 'Incorrect client label',
    subcategoryId: 'mobile-phones',
    subcategoryName: 'Incorrect client label',
    location: {
      country: ' Nigeria ',
      state: ' Lagos ',
      city: ' Ikeja ',
      area: ' Allen Avenue ',
      address: ' Computer Village ',
      latitude: null,
      longitude: null,
    },
    pricing: {
      currency: 'NGN',
      amount: 850000,
      maximumAmount: null,
      priceType: 'fixed',
      billingPeriod: '',
      negotiable: 'yes',
    },
    images: [mediaInput()],
    videoUrl: '',
    contact: {
      name: '  Marketplace Seller  ',
      phone: ' 08000000000 ',
      whatsappEnabled: true,
      preferredMethod: 'both',
    },
    delivery: {
      available: true,
      pickupAvailable: true,
      details: '  Lagos delivery available  ',
    },
    attributes: {
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      condition: 'used_like_new',
      storage: '256 GB',
      unused: '   ',
    },
    privateCvFile: null,
    ...overrides,
  }
}

function listingRecord(overrides = {}) {
  const input = listingInput()
  return {
    id: 'listing-phone-1',
    ownerId: 'owner-1',
    title: input.title.trim(),
    description: input.description.trim(),
    categoryId: input.categoryId,
    categoryName: 'Phones & Tablets',
    subcategoryId: input.subcategoryId,
    subcategoryName: 'Mobile phones',
    status: 'active',
    moderationStatus: 'approved',
    location: input.location,
    pricing: input.pricing,
    media: {
      coverImage: input.images[0].remoteUrl,
      images: [input.images[0].remoteUrl],
      videoUrl: '',
    },
    contact: input.contact,
    delivery: input.delivery,
    attributes: input.attributes,
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z',
    publishedAt: '2026-08-01T12:00:00.000Z',
    viewCount: 0,
    favouriteCount: 0,
    ...overrides,
  }
}

function filters(overrides = {}) {
  return {
    search: '',
    categoryId: 'all',
    subcategoryId: '',
    minPrice: null,
    maxPrice: null,
    datePosted: 'all',
    condition: '',
    propertyType: '',
    listingPurpose: '',
    bedrooms: null,
    furnishing: '',
    make: '',
    model: '',
    minimumYear: null,
    transmission: '',
    brand: '',
    storage: '',
    ...overrides,
  }
}

test('sanitizes listing input and restores canonical category labels', () => {
  const input = listingInput({
    images: Array.from({ length: 14 }, (_, index) => mediaInput(index)),
  })
  const value = validation.sanitizeListingInput(input)

  assert.equal(value.title, 'iPhone 15 Pro')
  assert.equal(value.categoryName, 'Phones & tablets')
  assert.equal(value.subcategoryName, 'Mobile phones')
  assert.equal(value.location.city, 'Ikeja')
  assert.equal(value.contact.name, 'Marketplace Seller')
  assert.equal(value.images.length, 12)
  assert.equal('unused' in value.attributes, false)
})

test('restores optional nested defaults from an older saved listing draft', () => {
  const input = listingInput()
  delete input.pricing.maximumAmount
  delete input.pricing.billingPeriod
  delete input.contact.whatsappEnabled
  delete input.delivery.pickupAvailable

  const value = validation.sanitizeListingInput(input)

  assert.equal(value.pricing.maximumAmount, null)
  assert.equal(value.pricing.billingPeriod, '')
  assert.equal(value.contact.whatsappEnabled, false)
  assert.equal(value.delivery.pickupAvailable, false)
  assert.equal(validation.validateMarketplaceListing(input), '')
})

test('normalizes valid coordinates and rejects incomplete or out-of-range map pins', () => {
  assert.deepEqual(coordinates.normalizeCoordinates('6.5244', '3.3792'), {
    latitude: 6.5244,
    longitude: 3.3792,
  })
  assert.equal(coordinates.hasCoordinates(Number.NaN, 3.3792), false)
  assert.equal(
    coordinates.getCoordinateValidationError(91, 3.3792),
    'Latitude must be between -90 and 90.'
  )
  assert.equal(
    coordinates.getCoordinateValidationError(6.5244, null),
    'Add both latitude and longitude, or leave both empty.'
  )

  const invalidListing = listingInput({
    location: {
      ...listingInput().location,
      latitude: 6.5244,
      longitude: 181,
    },
  })
  assert.equal(
    validation.validateMarketplaceListing(invalidListing),
    'Longitude must be between -180 and 180.'
  )
})

test('builds stable source-aware saved listing identities', () => {
  assert.equal(savedRecords.normalizeSavedSource('listing'), 'listing')
  assert.equal(savedRecords.normalizeSavedSource('unsupported'), 'property')
  assert.notEqual(
    savedRecords.savedItemKey('shared-id', 'property'),
    savedRecords.savedItemKey('shared-id', 'listing')
  )
  assert.equal(
    savedRecords.savedRecordId('user/one', 'item/one', 'listing'),
    'user%2Fone--listing--item%2Fone'
  )
})

test('enforces category-specific required fields before publishing', () => {
  const input = listingInput({
    attributes: { model: 'iPhone 15 Pro', condition: 'used_like_new' },
  })
  assert.equal(validation.validateMarketplaceListing(input), 'Add brand.')
})

test('requires media only for categories configured to need it', () => {
  assert.equal(
    validation.validateMarketplaceListing(listingInput({ images: [] })),
    'Upload at least one clear photo for this category.'
  )

  const service = listingInput({
    categoryId: 'services',
    categoryName: 'Services',
    subcategoryId: 'professional-services',
    subcategoryName: 'Professional services',
    images: [],
    attributes: { serviceArea: 'Lagos', deliveryMode: 'both' },
  })
  assert.equal(validation.validateMarketplaceListing(service), '')
})

test('rejects invalid price ranges and unsupported video hosts', () => {
  assert.equal(
    validation.validateMarketplaceListing(
      listingInput({
        pricing: {
          ...listingInput().pricing,
          priceType: 'range',
          amount: 900000,
          maximumAmount: 800000,
        },
      })
    ),
    'Enter a valid maximum price for the range.'
  )
  assert.equal(
    validation.validateMarketplaceListing(
      listingInput({ videoUrl: 'https://example.com/video/unsafe' })
    ),
    'Use a valid YouTube or Facebook video link.'
  )
})

test('maps non-property listings to category-aware marketplace cards', () => {
  const item = discovery.listingToMarketplaceItem(listingRecord())

  assert.equal(item.detailPath, '/listings/listing-phone-1')
  assert.equal(item.categoryId, 'phones-tablets')
  assert.equal(item.propertyRecord, null)
  assert.deepEqual(
    item.metadata.map((entry) => entry.label),
    ['Brand', 'Storage', 'Condition']
  )
})

test('applies category-specific discovery filters without property assumptions', () => {
  const phone = discovery.listingToMarketplaceItem(listingRecord())
  const vehicle = discovery.listingToMarketplaceItem(
    listingRecord({
      id: 'listing-car-1',
      title: 'Toyota Corolla',
      categoryId: 'vehicles',
      categoryName: 'Vehicles',
      subcategoryId: 'cars',
      subcategoryName: 'Cars',
      pricing: { ...listingRecord().pricing, amount: 12500000 },
      attributes: {
        vehicleType: 'Car',
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        condition: 'used_like_new',
        transmission: 'automatic',
      },
    })
  )

  assert.deepEqual(
    discovery
      .filterMarketplaceItems(
        [phone, vehicle],
        filters({ categoryId: 'vehicles', make: 'toy', minimumYear: 2020 })
      )
      .map((item) => item.id),
    ['listing-car-1']
  )
  assert.deepEqual(
    discovery
      .filterMarketplaceItems([phone, vehicle], filters({ brand: 'Apple' }))
      .map((item) => item.id),
    ['listing-phone-1', 'listing-car-1']
  )
  assert.deepEqual(
    discovery
      .filterMarketplaceItems(
        [phone, vehicle],
        filters({ categoryId: 'phones-tablets', brand: 'Apple', storage: '256' })
      )
      .map((item) => item.id),
    ['listing-phone-1']
  )
})
