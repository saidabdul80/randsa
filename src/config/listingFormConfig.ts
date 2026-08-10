import type {
  PaymentDuration,
  PropertyCategory,
  PropertyFormInput,
  PropertyType,
} from '../types/property'

export type ListingDetailMode = 'residential' | 'commercial' | 'generic'
export type ListingMoneyField = Extract<
  keyof PropertyFormInput,
  'rentPrice' | 'cautionFee' | 'agencyFee' | 'inspectionFee'
>

export interface ListingMoneyFieldConfig {
  key: ListingMoneyField
  label: string
  help: string
}

export interface ListingFormConfig {
  category: PropertyCategory
  title: string
  shortLabel: string
  detailMode: ListingDetailMode
  propertyTypes: PropertyType[]
  paymentDurations: PaymentDuration[]
  moneyFields: ListingMoneyFieldConfig[]
  suggestedAmenities: string[]
  descriptionPrompts: string[]
  imageGuidance: string[]
}

const propertyMoneyFields: ListingMoneyFieldConfig[] = [
  { key: 'rentPrice', label: 'Rent price', help: 'The main rental amount.' },
  {
    key: 'inspectionFee',
    label: 'Inspection fee',
    help: 'Enter zero when no inspection fee applies.',
  },
  { key: 'agencyFee', label: 'Agency fee', help: 'Enter zero when no agency fee applies.' },
  {
    key: 'cautionFee',
    label: 'Caution fee',
    help: 'Refundable or protective deposit, when applicable.',
  },
]

const configurations: Record<PropertyCategory, ListingFormConfig> = {
  residential: {
    category: 'residential',
    title: 'Add a residential property',
    shortLabel: 'Residential',
    detailMode: 'residential',
    propertyTypes: ['House rent', 'Apartment', 'Self-contained', 'Flat', 'Duplex'],
    paymentDurations: ['monthly', 'quarterly', 'biannually', 'yearly', 'custom'],
    moneyFields: propertyMoneyFields,
    suggestedAmenities: [
      'Security',
      'Parking',
      'Borehole',
      'Generator',
      'Air conditioning',
      'POP ceiling',
      'Garden',
      'Swimming pool',
      'Furnished',
      'Balcony',
    ],
    descriptionPrompts: [
      'Property condition and room layout',
      'Water, electricity, and security',
      'Access road and nearby landmarks',
      'The type of tenant the property suits',
    ],
    imageGuidance: [
      'Exterior',
      'Living room',
      'Bedrooms',
      'Kitchen',
      'Bathrooms',
      'Compound',
      'Street view',
    ],
  },
  commercial: {
    category: 'commercial',
    title: 'Add a commercial space',
    shortLabel: 'Commercial',
    detailMode: 'commercial',
    propertyTypes: ['Shop rent', 'Office space', 'Warehouse'],
    paymentDurations: ['monthly', 'quarterly', 'biannually', 'yearly', 'custom'],
    moneyFields: propertyMoneyFields,
    suggestedAmenities: [
      'Parking',
      'Generator',
      'Air conditioning',
      'Furnished',
      'Reception area',
      'Meeting room',
      'Security',
      'Water access',
      'Road access',
    ],
    descriptionPrompts: [
      'Floor layout and usable area',
      'Power, water, parking, and security',
      'Road access and nearby commercial landmarks',
      'Suitable business or office use',
    ],
    imageGuidance: ['Exterior', 'Main floor', 'Rooms', 'Utilities', 'Parking', 'Road access'],
  },
  land: {
    category: 'land',
    title: 'Add land',
    shortLabel: 'Land',
    detailMode: 'generic',
    propertyTypes: ['Land'],
    paymentDurations: ['fixed', 'monthly', 'yearly', 'custom'],
    moneyFields: [propertyMoneyFields[0], propertyMoneyFields[2], propertyMoneyFields[3]],
    suggestedAmenities: [
      'Road access',
      'Fenced',
      'Survey available',
      'Water access',
      'Electricity nearby',
    ],
    descriptionPrompts: [
      'Land size and shape',
      'Road and utility access',
      'Nearby landmarks',
      'Suitable use and known conditions',
    ],
    imageGuidance: [
      'Full plot',
      'Boundary points',
      'Road access',
      'Surrounding area',
      'Nearby landmarks',
    ],
  },
  vehicle: {
    category: 'vehicle',
    title: 'Add a vehicle',
    shortLabel: 'Vehicle',
    detailMode: 'generic',
    propertyTypes: ['Car', 'Vehicle'],
    paymentDurations: ['hourly', 'daily', 'monthly', 'custom'],
    moneyFields: [
      { key: 'rentPrice', label: 'Rental rate', help: 'The amount for the selected pricing unit.' },
      { key: 'cautionFee', label: 'Security deposit', help: 'Enter zero when no deposit applies.' },
    ],
    suggestedAmenities: [
      'Air conditioning',
      'Bluetooth',
      'Reverse camera',
      'GPS',
      'Child seat',
      'Driver available',
      'Automatic transmission',
      'Full insurance',
    ],
    descriptionPrompts: [
      'Make, model, year, and vehicle condition',
      'Transmission, fuel type, seating, and mileage',
      'Pickup arrangement and driver availability',
      'Rental conditions and restrictions',
    ],
    imageGuidance: ['Front', 'Rear', 'Both sides', 'Interior', 'Dashboard', 'Boot', 'Engine area'],
  },
  event: {
    category: 'event',
    title: 'Add an event space',
    shortLabel: 'Event space',
    detailMode: 'generic',
    propertyTypes: ['Event space', 'Event centre'],
    paymentDurations: ['hourly', 'daily', 'fixed', 'custom'],
    moneyFields: [
      { key: 'rentPrice', label: 'Venue rate', help: 'The amount for the selected booking unit.' },
      { key: 'cautionFee', label: 'Security deposit', help: 'Enter zero when no deposit applies.' },
    ],
    suggestedAmenities: [
      'Chairs',
      'Tables',
      'Stage',
      'Sound system',
      'Generator',
      'Air conditioning',
      'Changing room',
      'Catering area',
      'Parking',
      'Security',
    ],
    descriptionPrompts: [
      'Guest capacity and suitable event types',
      'Indoor or outdoor layout and decoration rules',
      'Power supply, parking, chairs, and tables',
      'Setup access, opening time, and closing rules',
    ],
    imageGuidance: [
      'Main hall',
      'Stage',
      'Seating',
      'Exterior',
      'Parking',
      'Restrooms',
      'Changing rooms',
    ],
  },
  horse: {
    category: 'horse',
    title: 'Add a horse rental',
    shortLabel: 'Horse',
    detailMode: 'generic',
    propertyTypes: ['Horse rental'],
    paymentDurations: ['hourly', 'per_session', 'daily', 'custom'],
    moneyFields: [
      {
        key: 'rentPrice',
        label: 'Session rate',
        help: 'The amount for the selected session unit.',
      },
      { key: 'cautionFee', label: 'Security deposit', help: 'Enter zero when no deposit applies.' },
    ],
    suggestedAmenities: [
      'Trained',
      'Handler included',
      'Saddle included',
      'Transport available',
      'Beginner friendly',
      'Event suitable',
      'Photography suitable',
    ],
    descriptionPrompts: [
      'Breed, age, training, and temperament',
      'Suitable riding or event activities',
      'Handler, transport, and equipment availability',
      'Session duration, experience level, and safety rules',
    ],
    imageGuidance: ['Full body', 'Front', 'Side profile', 'Riding session', 'Stable', 'Equipment'],
  },
  other: {
    category: 'other',
    title: 'Add another rental',
    shortLabel: 'Other rental',
    detailMode: 'generic',
    propertyTypes: ['Hotel or guest house', 'Other property', 'Other rental'],
    paymentDurations: ['hourly', 'daily', 'per_session', 'fixed', 'monthly', 'custom'],
    moneyFields: [
      { key: 'rentPrice', label: 'Rental rate', help: 'The amount for the selected pricing unit.' },
      { key: 'cautionFee', label: 'Security deposit', help: 'Enter zero when no deposit applies.' },
    ],
    suggestedAmenities: [
      'Delivery available',
      'Setup included',
      'Support included',
      'Flexible pickup',
    ],
    descriptionPrompts: [
      'Item condition and quantity',
      'What is included',
      'Pickup or delivery arrangement',
      'Rental conditions and return expectations',
    ],
    imageGuidance: [
      'Full item',
      'Multiple angles',
      'Included accessories',
      'Condition details',
      'Packaging or storage',
    ],
  },
}

export const listingCategoryOptions = Object.values(configurations).map((config) => ({
  value: config.category,
  label: config.shortLabel,
}))

export function categoryForPropertyType(propertyType: PropertyType): PropertyCategory {
  const match = Object.values(configurations).find((config) =>
    config.propertyTypes.includes(propertyType)
  )
  return match?.category ?? 'other'
}

export function resolveListingFormConfig(category: PropertyCategory, propertyType?: PropertyType) {
  if (propertyType) {
    const resolvedCategory = categoryForPropertyType(propertyType)
    if (resolvedCategory === category) return configurations[resolvedCategory]
  }

  return configurations[category] ?? configurations.other
}

export function getListingCategoryConfig(category: PropertyCategory) {
  return configurations[category] ?? configurations.other
}
