import homeHeroImage from '../assets/randsa-hero-home.webp'
import type { PropertyRecord, PropertyType } from '../types/property'

interface DesignedPropertyDefinition {
  id: string
  title: string
  location: string
  area: string
  city: string
  state: string
  bedrooms: number
  bathrooms: number
  parkingSpaces: number
  rentPrice: number
  priceLabel: string
  propertyType: PropertyType
}

export interface DesignedMarketplaceCard {
  key: string
  id: string
  title: string
  location: string
  beds: number
  parking: number
  baths: number
  price: string
  numericPrice: number
  paymentDuration: string
  propertyType: PropertyType
  isAvailable: boolean
  image: string
  canSpanWide: boolean
  record: PropertyRecord
}

const definitions: DesignedPropertyDefinition[] = [
  {
    id: 'designed-ocean-breeze-villa',
    title: 'Ocean Breeze Villa',
    location: 'Lekki Phase 1, Lagos',
    area: 'Lekki Phase 1',
    city: 'Lagos',
    state: 'Lagos',
    bedrooms: 4,
    bathrooms: 4,
    parkingSpaces: 2,
    rentPrice: 4_500_000,
    priceLabel: 'NGN 4.5M',
    propertyType: 'House rent',
  },
  {
    id: 'designed-jakson-house',
    title: 'Jakson House',
    location: 'Wuse 2, Abuja',
    area: 'Wuse 2',
    city: 'Abuja',
    state: 'Abuja',
    bedrooms: 3,
    bathrooms: 3,
    parkingSpaces: 2,
    rentPrice: 3_200_000,
    priceLabel: 'NGN 3.2M',
    propertyType: 'House rent',
  },
  {
    id: 'designed-lakeside-cottage',
    title: 'Lakeside Cottage',
    location: 'GRA, Port Harcourt',
    area: 'GRA',
    city: 'Port Harcourt',
    state: 'Port Harcourt',
    bedrooms: 5,
    bathrooms: 5,
    parkingSpaces: 2,
    rentPrice: 5_700_000,
    priceLabel: 'NGN 5.7M',
    propertyType: 'House rent',
  },
  {
    id: 'designed-parkview-apartment',
    title: 'Parkview Apartment',
    location: 'Ikoyi, Lagos',
    area: 'Ikoyi',
    city: 'Lagos',
    state: 'Lagos',
    bedrooms: 3,
    bathrooms: 3,
    parkingSpaces: 2,
    rentPrice: 6_200_000,
    priceLabel: 'NGN 6.2M',
    propertyType: 'Apartment',
  },
  {
    id: 'designed-cedar-court',
    title: 'Cedar Court',
    location: 'Maitama, Abuja',
    area: 'Maitama',
    city: 'Abuja',
    state: 'Abuja',
    bedrooms: 4,
    bathrooms: 4,
    parkingSpaces: 2,
    rentPrice: 7_500_000,
    priceLabel: 'NGN 7.5M',
    propertyType: 'Duplex',
  },
  {
    id: 'designed-garden-city-flat',
    title: 'Garden City Flat',
    location: 'Independence Layout, Enugu',
    area: 'Independence Layout',
    city: 'Enugu',
    state: 'Enugu',
    bedrooms: 3,
    bathrooms: 3,
    parkingSpaces: 1,
    rentPrice: 2_800_000,
    priceLabel: 'NGN 2.8M',
    propertyType: 'Flat',
  },
  {
    id: 'designed-palm-residence',
    title: 'Palm Residence',
    location: 'Bodija, Ibadan',
    area: 'Bodija',
    city: 'Ibadan',
    state: 'Ibadan',
    bedrooms: 4,
    bathrooms: 4,
    parkingSpaces: 2,
    rentPrice: 3_900_000,
    priceLabel: 'NGN 3.9M',
    propertyType: 'House rent',
  },
  {
    id: 'designed-marina-view-home',
    title: 'Marina View Home',
    location: 'Victoria Island, Lagos',
    area: 'Victoria Island',
    city: 'Lagos',
    state: 'Lagos',
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    rentPrice: 5_100_000,
    priceLabel: 'NGN 5.1M',
    propertyType: 'Apartment',
  },
]

function createRecord(definition: DesignedPropertyDefinition): PropertyRecord {
  return {
    id: definition.id,
    title: definition.title,
    description: '',
    category: 'residential',
    propertyType: definition.propertyType,
    rentPrice: definition.rentPrice,
    cautionFee: 0,
    agencyFee: 0,
    inspectionFee: 0,
    paymentDuration: 'yearly',
    state: definition.state,
    city: definition.city,
    area: definition.area,
    address: '',
    latitude: null,
    longitude: null,
    bedrooms: definition.bedrooms,
    bathrooms: definition.bathrooms,
    toilets: null,
    shopSize: '',
    roadAccess: false,
    marketArea: false,
    electricityAvailability: false,
    security: false,
    waterAccess: false,
    kitchen: false,
    parking: definition.parkingSpaces > 0,
    water: false,
    electricity: false,
    amenities: [],
    images: [homeHeroImage],
    ownerId: '',
    ownerRole: 'landlord',
    ownerPhone: '',
    status: 'approved',
    isAvailable: true,
    availabilityConfig: {
      agents: [],
      limitedRemainingCapacity: 3,
      blockedDates: [],
      bufferMinutes: null,
      minimumDurationMinutes: null,
    },
    createdAt: '',
    updatedAt: '',
  }
}

export const designedMarketplaceCards: DesignedMarketplaceCard[] = definitions.map((definition) => {
  const record = createRecord(definition)

  return {
    key: definition.id,
    id: definition.id,
    title: definition.title,
    location: definition.location,
    beds: definition.bedrooms,
    parking: definition.parkingSpaces,
    baths: definition.bathrooms,
    price: definition.priceLabel,
    numericPrice: definition.rentPrice,
    paymentDuration: 'year',
    propertyType: definition.propertyType,
    isAvailable: true,
    image: homeHeroImage,
    canSpanWide: true,
    record,
  }
})

export const designedMarketplacePropertyRecords = designedMarketplaceCards.map(
  (property) => property.record
)

export function getDesignedMarketplaceProperty(propertyId: string) {
  return designedMarketplacePropertyRecords.find((property) => property.id === propertyId) ?? null
}
