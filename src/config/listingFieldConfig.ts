import type { MarketplaceCategoryId } from '../types/listing'

export type ListingFieldType =
  'text' | 'number' | 'select' | 'textarea' | 'date' | 'tags' | 'boolean'

export interface ListingFieldOption {
  value: string
  label: string
}

export interface ListingFieldDefinition {
  key: string
  label: string
  type: ListingFieldType
  required?: boolean
  placeholder?: string
  help?: string
  min?: number
  max?: number
  options?: readonly ListingFieldOption[]
}

const option = (value: string, label = value): ListingFieldOption => ({ value, label })

const conditionOptions = [
  option('brand_new', 'Brand new'),
  option('used_like_new', 'Used, like new'),
  option('used', 'Used'),
  option('refurbished', 'Refurbished'),
]

const generalProductFields: readonly ListingFieldDefinition[] = [
  { key: 'brand', label: 'Brand', type: 'text', placeholder: 'Brand, if applicable' },
  { key: 'model', label: 'Model', type: 'text', placeholder: 'Model, if applicable' },
  {
    key: 'condition',
    label: 'Condition',
    type: 'select',
    required: true,
    options: conditionOptions,
  },
  { key: 'quantity', label: 'Quantity', type: 'number', min: 1, placeholder: '1' },
]

const serviceFields: readonly ListingFieldDefinition[] = [
  {
    key: 'experienceLevel',
    label: 'Experience level',
    type: 'select',
    options: [
      option('beginner', 'Beginner'),
      option('intermediate', 'Intermediate'),
      option('expert', 'Expert'),
    ],
  },
  {
    key: 'serviceArea',
    label: 'Service area',
    type: 'text',
    required: true,
    placeholder: 'Areas you cover',
  },
  {
    key: 'deliveryMode',
    label: 'Service delivery',
    type: 'select',
    required: true,
    options: [
      option('physical', 'Physical'),
      option('remote', 'Remote'),
      option('both', 'Remote and physical'),
    ],
  },
  {
    key: 'availability',
    label: 'Availability',
    type: 'text',
    placeholder: 'For example: Monday to Saturday',
  },
]

const categoryFields: Partial<Record<MarketplaceCategoryId, readonly ListingFieldDefinition[]>> = {
  vehicles: [
    { key: 'vehicleType', label: 'Vehicle type', type: 'text', required: true },
    {
      key: 'make',
      label: 'Make',
      type: 'text',
      required: true,
      placeholder: 'For example: Toyota',
    },
    { key: 'model', label: 'Model', type: 'text', required: true },
    { key: 'year', label: 'Year', type: 'number', required: true, min: 1900, max: 2100 },
    { key: 'trim', label: 'Trim', type: 'text' },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      required: true,
      options: conditionOptions,
    },
    {
      key: 'transmission',
      label: 'Transmission',
      type: 'select',
      options: [option('automatic', 'Automatic'), option('manual', 'Manual')],
    },
    {
      key: 'fuelType',
      label: 'Fuel type',
      type: 'select',
      options: [
        option('petrol', 'Petrol'),
        option('diesel', 'Diesel'),
        option('electric', 'Electric'),
        option('hybrid', 'Hybrid'),
      ],
    },
    { key: 'mileage', label: 'Mileage (km)', type: 'number', min: 0 },
    { key: 'colour', label: 'Colour', type: 'text' },
    {
      key: 'registrationStatus',
      label: 'Registration',
      type: 'select',
      options: [option('registered', 'Registered'), option('unregistered', 'Unregistered')],
    },
    { key: 'exchangePossible', label: 'Exchange possible', type: 'boolean' },
  ],
  'phones-tablets': [
    { key: 'brand', label: 'Brand', type: 'text', required: true },
    { key: 'model', label: 'Model', type: 'text', required: true },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      required: true,
      options: conditionOptions,
    },
    { key: 'storage', label: 'Storage capacity', type: 'text', placeholder: 'For example: 256 GB' },
    { key: 'ram', label: 'RAM', type: 'text', placeholder: 'For example: 8 GB' },
    { key: 'colour', label: 'Colour', type: 'text' },
    { key: 'operatingSystem', label: 'Operating system', type: 'text' },
    {
      key: 'accessories',
      label: 'Accessories included',
      type: 'tags',
      placeholder: 'Charger, case, box',
    },
    { key: 'exchangePossible', label: 'Exchange possible', type: 'boolean' },
  ],
  electronics: [
    { key: 'brand', label: 'Brand', type: 'text', required: true },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'itemType', label: 'Electronic type', type: 'text', required: true },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      required: true,
      options: conditionOptions,
    },
    { key: 'powerSpecification', label: 'Power specification', type: 'text' },
    {
      key: 'warrantyStatus',
      label: 'Warranty status',
      type: 'select',
      options: [
        option('valid', 'Valid warranty'),
        option('expired', 'Expired'),
        option('none', 'No warranty'),
      ],
    },
  ],
  services: serviceFields,
  jobs: [
    { key: 'companyName', label: 'Company or employer', type: 'text', required: true },
    { key: 'jobCategory', label: 'Job category', type: 'text', required: true },
    {
      key: 'employmentType',
      label: 'Employment type',
      type: 'select',
      required: true,
      options: [
        option('full_time', 'Full time'),
        option('part_time', 'Part time'),
        option('contract', 'Contract'),
        option('internship', 'Internship'),
      ],
    },
    {
      key: 'workplaceType',
      label: 'Workplace type',
      type: 'select',
      required: true,
      options: [
        option('onsite', 'On-site'),
        option('remote', 'Remote'),
        option('hybrid', 'Hybrid'),
      ],
    },
    {
      key: 'requirements',
      label: 'Requirements',
      type: 'textarea',
      required: true,
      placeholder: 'Skills, qualifications, and experience',
    },
    {
      key: 'applicationMethod',
      label: 'Application method',
      type: 'text',
      required: true,
      placeholder: 'Email, phone, or application link',
    },
    { key: 'applicationDeadline', label: 'Application deadline', type: 'date' },
  ],
  'seeking-work-cvs': [
    { key: 'professionalTitle', label: 'Professional title', type: 'text', required: true },
    {
      key: 'skills',
      label: 'Skills',
      type: 'tags',
      required: true,
      placeholder: 'Design, customer service, Excel',
    },
    { key: 'experience', label: 'Experience', type: 'textarea', required: true },
    {
      key: 'preferredJobType',
      label: 'Preferred job type',
      type: 'select',
      options: [
        option('full_time', 'Full time'),
        option('part_time', 'Part time'),
        option('contract', 'Contract'),
        option('freelance', 'Freelance'),
      ],
    },
    { key: 'preferredLocation', label: 'Preferred location', type: 'text' },
  ],
  'food-agriculture-farming': [
    { key: 'productType', label: 'Product type', type: 'text', required: true },
    { key: 'farmCategory', label: 'Crop, animal, or farm category', type: 'text', required: true },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    {
      key: 'unit',
      label: 'Unit of measurement',
      type: 'text',
      required: true,
      placeholder: 'Bag, kg, crate, head',
    },
    { key: 'freshness', label: 'Condition or freshness', type: 'text' },
    { key: 'productionDate', label: 'Harvest or production date', type: 'date' },
    {
      key: 'saleType',
      label: 'Sale type',
      type: 'select',
      options: [
        option('retail', 'Retail'),
        option('wholesale', 'Wholesale'),
        option('both', 'Retail and wholesale'),
      ],
    },
    { key: 'minimumOrder', label: 'Minimum order', type: 'text' },
  ],
  'repair-construction': serviceFields,
}

export function getListingFieldConfig(categoryId: MarketplaceCategoryId, subcategoryId = '') {
  if (categoryId === 'repair-construction' && subcategoryId === 'building-materials') {
    return generalProductFields
  }
  if (categoryId === 'pets' && subcategoryId === 'pet-services') return serviceFields
  return categoryFields[categoryId] ?? generalProductFields
}

export function isPhotoRequired(categoryId: MarketplaceCategoryId) {
  return !['jobs', 'seeking-work-cvs', 'services'].includes(categoryId)
}

export function supportsPrivateCv(categoryId: MarketplaceCategoryId) {
  return categoryId === 'seeking-work-cvs'
}

export function getBillingPeriodOptions(categoryId: MarketplaceCategoryId) {
  if (categoryId === 'services') {
    return [
      option('', 'Not applicable'),
      option('hour', 'Per hour'),
      option('day', 'Per day'),
      option('project', 'Per project'),
    ]
  }
  if (categoryId === 'jobs') {
    return [
      option('month', 'Per month'),
      option('year', 'Per year'),
      option('contract', 'Contract total'),
    ]
  }
  return [
    option('', 'One-time price'),
    option('day', 'Per day'),
    option('week', 'Per week'),
    option('month', 'Per month'),
  ]
}
