import {
  accessibilityOutline,
  bedOutline,
  briefcaseOutline,
  businessOutline,
  carSportOutline,
  constructOutline,
  documentTextOutline,
  footballOutline,
  hammerOutline,
  homeOutline,
  leafOutline,
  pawOutline,
  phonePortraitOutline,
  shirtOutline,
  sparklesOutline,
  tvOutline,
} from 'ionicons/icons'

import type {
  MarketplaceCategory,
  MarketplaceCategoryId,
  MarketplaceSubcategory,
} from '../types/listing'
import type { PaymentDuration, PropertyCategory, PropertyType } from '../types/property'

const subcategory = (
  id: string,
  label: string,
  description: string,
  keywords: readonly string[] = []
): MarketplaceSubcategory => ({ id, label, description, keywords })

export const marketplaceSubcategories = {
  property: [
    subcategory('houses', 'Houses', 'Detached, terrace, and semi-detached homes.', ['villa']),
    subcategory('apartments', 'Apartments', 'Apartments and managed residential units.', ['condo']),
    subcategory('self-contained', 'Self-contained', 'Private single-room homes with facilities.', [
      'studio',
    ]),
    subcategory('flats', 'Flats', 'Multi-room flats and maisonettes.', ['rooms']),
    subcategory('duplexes', 'Duplexes', 'Multi-level residential homes.', ['townhouse']),
    subcategory('shops', 'Shops', 'Retail shops, stalls, and storefronts.', ['retail']),
    subcategory('offices', 'Offices', 'Private offices and managed workspaces.', ['workspace']),
    subcategory('land', 'Land', 'Residential, commercial, and mixed-use plots.', ['plot']),
    subcategory('warehouses', 'Warehouses', 'Storage and distribution premises.', ['storage']),
    subcategory('event-centres', 'Event centres', 'Indoor and outdoor event venues.', ['hall']),
    subcategory(
      'hotels-guest-houses',
      'Hotels & guest houses',
      'Hospitality and short-stay properties.',
      ['hotel', 'lodge']
    ),
    subcategory('other-property', 'Other property', 'Other supported real-estate listings.'),
  ],
  vehicles: [
    subcategory('cars', 'Cars', 'Saloons, hatchbacks, and everyday cars.'),
    subcategory('suvs', 'SUVs & 4x4s', 'Sport utility and four-wheel-drive vehicles.', ['jeep']),
    subcategory('buses-vans', 'Buses & vans', 'Passenger buses, minibuses, and vans.'),
    subcategory('motorcycles', 'Motorcycles', 'Motorcycles, scooters, and power bikes.', ['bike']),
    subcategory('trucks', 'Trucks & trailers', 'Haulage, pickup, and moving vehicles.', ['lorry']),
    subcategory('vehicle-parts', 'Parts & accessories', 'Vehicle parts, tyres, and accessories.'),
  ],
  'phones-tablets': [
    subcategory('mobile-phones', 'Mobile phones', 'Smartphones and feature phones.'),
    subcategory('tablets', 'Tablets', 'Android, iPad, and other tablets.'),
    subcategory('smart-watches', 'Smart watches', 'Wearable smart devices and watches.'),
    subcategory(
      'phone-accessories',
      'Accessories',
      'Chargers, cases, earbuds, and other accessories.'
    ),
  ],
  electronics: [
    subcategory('computers', 'Computers', 'Laptops, desktops, and computer accessories.', [
      'laptop',
    ]),
    subcategory('televisions', 'Televisions', 'Smart TVs and display equipment.', ['tv']),
    subcategory('audio-equipment', 'Audio equipment', 'Speakers, microphones, and sound systems.'),
    subcategory('cameras', 'Cameras', 'Photo and video cameras with accessories.'),
    subcategory('gaming', 'Gaming', 'Consoles, controllers, and gaming equipment.'),
    subcategory(
      'power-electronics',
      'Power electronics',
      'Inverters, batteries, and solar equipment.'
    ),
  ],
  'home-furniture-appliances': [
    subcategory('furniture', 'Furniture', 'Indoor and outdoor furniture.', ['chair', 'table']),
    subcategory('large-appliances', 'Large appliances', 'Fridges, cookers, washers, and freezers.'),
    subcategory(
      'small-appliances',
      'Small appliances',
      'Blenders, irons, fans, and similar items.'
    ),
    subcategory(
      'kitchen-dining',
      'Kitchen & dining',
      'Cookware, dining sets, and kitchen equipment.'
    ),
    subcategory('home-decor', 'Home decor', 'Decorative pieces and home styling.'),
  ],
  fashion: [
    subcategory('mens-fashion', "Men's fashion", 'Clothing, shoes, and accessories for men.'),
    subcategory('womens-fashion', "Women's fashion", 'Clothing, shoes, and accessories for women.'),
    subcategory('traditional-wear', 'Traditional wear', 'Traditional outfits and cultural attire.'),
    subcategory('bags-luggage', 'Bags & luggage', 'Handbags, travel cases, and luggage.'),
    subcategory('jewellery-watches', 'Jewellery & watches', 'Jewellery, watches, and accessories.'),
  ],
  'beauty-personal-care': [
    subcategory('skin-care', 'Skin care', 'Skin-care products and treatments.'),
    subcategory('hair-care', 'Hair care', 'Hair products, extensions, and tools.'),
    subcategory('makeup', 'Makeup', 'Cosmetics and makeup accessories.'),
    subcategory('fragrances', 'Fragrances', 'Perfumes, body sprays, and oils.'),
    subcategory('personal-care', 'Personal care', 'Grooming and personal-care products.'),
  ],
  'babies-kids': [
    subcategory('baby-clothing', 'Baby clothing', 'Clothing and footwear for babies.'),
    subcategory('kids-clothing', 'Kids clothing', 'Clothing and footwear for children.'),
    subcategory('toys-games', 'Toys & games', 'Toys, games, and learning activities.'),
    subcategory('baby-equipment', 'Baby equipment', 'Prams, cots, carriers, and feeding items.'),
    subcategory(
      'school-supplies',
      'School supplies',
      'Books, bags, uniforms, and learning materials.'
    ),
  ],
  'food-agriculture-farming': [
    subcategory('crops-produce', 'Crops & produce', 'Fresh and processed farm produce.'),
    subcategory('livestock', 'Livestock', 'Farm animals and livestock products.'),
    subcategory('food-beverages', 'Food & beverages', 'Packaged food, meals, and drinks.'),
    subcategory('seeds-inputs', 'Seeds & farm inputs', 'Seeds, feed, fertilizer, and farm inputs.'),
    subcategory(
      'farm-machinery',
      'Farm machinery',
      'Tractors, implements, and processing equipment.'
    ),
  ],
  'commercial-equipment-tools': [
    subcategory(
      'industrial-equipment',
      'Industrial equipment',
      'Industrial machines and equipment.'
    ),
    subcategory(
      'restaurant-equipment',
      'Restaurant equipment',
      'Catering and food-service equipment.'
    ),
    subcategory('medical-equipment', 'Medical equipment', 'Approved medical and care equipment.'),
    subcategory(
      'office-equipment',
      'Office equipment',
      'Printers, copiers, and workplace equipment.'
    ),
    subcategory('power-tools', 'Power tools', 'Powered tools for trade and projects.'),
    subcategory('hand-tools', 'Hand tools', 'Manual tools and complete tool kits.'),
  ],
  'repair-construction': [
    subcategory(
      'building-materials',
      'Building materials',
      'Materials for building and renovation.'
    ),
    subcategory('construction-services', 'Construction services', 'Building and site services.'),
    subcategory('electrical-repairs', 'Electrical repairs', 'Electrical installation and repair.'),
    subcategory('plumbing', 'Plumbing', 'Plumbing installation and repair.'),
    subcategory('carpentry', 'Carpentry', 'Woodwork, cabinetry, and furniture repair.'),
    subcategory('device-repairs', 'Device repairs', 'Phone, computer, and electronics repair.'),
  ],
  services: [
    subcategory(
      'professional-services',
      'Professional services',
      'Business and professional support.'
    ),
    subcategory('home-services', 'Home services', 'Cleaning, moving, and household support.'),
    subcategory('events-services', 'Event services', 'Planning, decoration, catering, and media.'),
    subcategory('education-training', 'Education & training', 'Tutoring, coaching, and training.'),
    subcategory(
      'digital-services',
      'Digital services',
      'Design, development, and online services.'
    ),
    subcategory(
      'transport-logistics',
      'Transport & logistics',
      'Delivery, haulage, and transport services.'
    ),
  ],
  jobs: [
    subcategory('full-time-jobs', 'Full-time jobs', 'Permanent full-time opportunities.'),
    subcategory('part-time-jobs', 'Part-time jobs', 'Part-time and flexible opportunities.'),
    subcategory('contract-jobs', 'Contract jobs', 'Fixed-term and project-based work.'),
    subcategory('internships', 'Internships', 'Internship and graduate opportunities.'),
    subcategory('remote-jobs', 'Remote jobs', 'Roles that can be completed remotely.'),
  ],
  'seeking-work-cvs': [
    subcategory('professional-cvs', 'Professional CVs', 'Profiles for professional roles.'),
    subcategory('skilled-trades', 'Skilled trades', 'Profiles for artisans and skilled workers.'),
    subcategory('domestic-work', 'Domestic work', 'Profiles for household support roles.'),
    subcategory(
      'graduate-entry',
      'Graduate & entry level',
      'Profiles for graduates and new entrants.'
    ),
    subcategory('freelance-work', 'Freelance work', 'Profiles for freelance and contract work.'),
  ],
  'leisure-activities': [
    subcategory('event-spaces', 'Event spaces', 'Venues for celebrations and gatherings.'),
    subcategory(
      'sports-fitness',
      'Sports & fitness',
      'Training, recreation, and sports activities.'
    ),
    subcategory(
      'travel-experiences',
      'Travel & experiences',
      'Tours, stays, and local experiences.'
    ),
    subcategory('music-media', 'Music & media', 'Instruments, studios, and production activities.'),
    subcategory(
      'party-supplies',
      'Party supplies',
      'Decor, seating, catering, and event equipment.'
    ),
    subcategory('horse-rentals', 'Horse rentals', 'Guided riding and event horse bookings.'),
  ],
  pets: [
    subcategory('dogs', 'Dogs', 'Dogs from responsible owners and providers.'),
    subcategory('cats', 'Cats', 'Cats from responsible owners and providers.'),
    subcategory('birds', 'Birds', 'Domestic birds and bird-care items.'),
    subcategory(
      'pet-accessories',
      'Pet accessories',
      'Food, carriers, grooming, and pet supplies.'
    ),
    subcategory(
      'pet-services',
      'Pet services',
      'Grooming, training, sitting, and veterinary services.'
    ),
  ],
} as const satisfies Record<MarketplaceCategoryId, readonly MarketplaceSubcategory[]>

export const marketplaceCategories: readonly MarketplaceCategory[] = [
  {
    id: 'property',
    label: 'Property',
    description: 'Homes, commercial spaces, land, and short stays.',
    icon: homeOutline,
    keywords: ['house', 'apartment', 'shop', 'office', 'land', 'rent', 'sale'],
    subcategories: marketplaceSubcategories.property,
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    description: 'Cars, motorcycles, vans, trucks, and parts.',
    icon: carSportOutline,
    keywords: ['car', 'transport', 'motorcycle', 'truck'],
    subcategories: marketplaceSubcategories.vehicles,
  },
  {
    id: 'phones-tablets',
    label: 'Phones & tablets',
    description: 'Mobile devices, tablets, wearables, and accessories.',
    icon: phonePortraitOutline,
    keywords: ['phone', 'mobile', 'tablet', 'smartwatch'],
    subcategories: marketplaceSubcategories['phones-tablets'],
  },
  {
    id: 'electronics',
    label: 'Electronics',
    description: 'Computers, TVs, cameras, audio, and gaming.',
    icon: tvOutline,
    keywords: ['computer', 'laptop', 'camera', 'television'],
    subcategories: marketplaceSubcategories.electronics,
  },
  {
    id: 'home-furniture-appliances',
    label: 'Home furniture & appliances',
    description: 'Furniture, appliances, kitchen, and decor.',
    icon: bedOutline,
    keywords: ['furniture', 'appliance', 'home', 'kitchen'],
    subcategories: marketplaceSubcategories['home-furniture-appliances'],
  },
  {
    id: 'fashion',
    label: 'Fashion',
    description: 'Clothing, footwear, jewellery, bags, and watches.',
    icon: shirtOutline,
    keywords: ['clothes', 'shoes', 'bags', 'jewellery'],
    subcategories: marketplaceSubcategories.fashion,
  },
  {
    id: 'beauty-personal-care',
    label: 'Beauty & personal care',
    description: 'Skin, hair, makeup, fragrances, and grooming.',
    icon: sparklesOutline,
    keywords: ['beauty', 'cosmetics', 'hair', 'skin'],
    subcategories: marketplaceSubcategories['beauty-personal-care'],
  },
  {
    id: 'babies-kids',
    label: 'Babies & kids',
    description: 'Clothing, toys, baby equipment, and school items.',
    icon: accessibilityOutline,
    keywords: ['baby', 'children', 'toys', 'school'],
    subcategories: marketplaceSubcategories['babies-kids'],
  },
  {
    id: 'food-agriculture-farming',
    label: 'Food, agriculture & farming',
    description: 'Produce, livestock, food, inputs, and machinery.',
    icon: leafOutline,
    keywords: ['food', 'farm', 'crop', 'livestock'],
    subcategories: marketplaceSubcategories['food-agriculture-farming'],
  },
  {
    id: 'commercial-equipment-tools',
    label: 'Commercial equipment & tools',
    description: 'Industrial, office, medical, catering, and trade tools.',
    icon: constructOutline,
    keywords: ['equipment', 'tools', 'machine', 'industrial'],
    subcategories: marketplaceSubcategories['commercial-equipment-tools'],
  },
  {
    id: 'repair-construction',
    label: 'Repair & construction',
    description: 'Building materials, construction, and repair work.',
    icon: hammerOutline,
    keywords: ['repair', 'building', 'construction', 'plumbing'],
    subcategories: marketplaceSubcategories['repair-construction'],
  },
  {
    id: 'services',
    label: 'Services',
    description: 'Professional, home, event, digital, and logistics services.',
    icon: briefcaseOutline,
    keywords: ['service', 'professional', 'digital', 'delivery'],
    subcategories: marketplaceSubcategories.services,
  },
  {
    id: 'jobs',
    label: 'Jobs',
    description: 'Full-time, part-time, contract, internship, and remote roles.',
    icon: businessOutline,
    keywords: ['job', 'employment', 'vacancy', 'work'],
    subcategories: marketplaceSubcategories.jobs,
  },
  {
    id: 'seeking-work-cvs',
    label: 'Seeking work or CVs',
    description: 'Professional profiles, skills, and work availability.',
    icon: documentTextOutline,
    keywords: ['cv', 'resume', 'seeking work', 'skills'],
    subcategories: marketplaceSubcategories['seeking-work-cvs'],
  },
  {
    id: 'leisure-activities',
    label: 'Leisure & activities',
    description: 'Events, sports, travel, music, and experiences.',
    icon: footballOutline,
    keywords: ['leisure', 'activity', 'event', 'sport', 'travel'],
    subcategories: marketplaceSubcategories['leisure-activities'],
  },
  {
    id: 'pets',
    label: 'Pets',
    description: 'Pets, accessories, care, and responsible services.',
    icon: pawOutline,
    keywords: ['pet', 'dog', 'cat', 'animal'],
    subcategories: marketplaceSubcategories.pets,
  },
]

export function getMarketplaceCategory(categoryId: MarketplaceCategoryId | null | undefined) {
  return marketplaceCategories.find((category) => category.id === categoryId) ?? null
}

export function getMarketplaceSubcategory(
  categoryId: MarketplaceCategoryId | null | undefined,
  subcategoryId: string | null | undefined
) {
  return (
    getMarketplaceCategory(categoryId)?.subcategories.find(
      (subcategoryOption) => subcategoryOption.id === subcategoryId
    ) ?? null
  )
}

export interface PropertyClassificationDefaults {
  category: PropertyCategory
  propertyType: PropertyType
  paymentDuration: PaymentDuration
}

const propertyClassificationDefaults: Record<string, PropertyClassificationDefaults> = {
  houses: { category: 'residential', propertyType: 'House rent', paymentDuration: 'yearly' },
  apartments: { category: 'residential', propertyType: 'Apartment', paymentDuration: 'yearly' },
  'self-contained': {
    category: 'residential',
    propertyType: 'Self-contained',
    paymentDuration: 'yearly',
  },
  flats: { category: 'residential', propertyType: 'Flat', paymentDuration: 'yearly' },
  duplexes: { category: 'residential', propertyType: 'Duplex', paymentDuration: 'yearly' },
  shops: { category: 'commercial', propertyType: 'Shop rent', paymentDuration: 'yearly' },
  offices: { category: 'commercial', propertyType: 'Office space', paymentDuration: 'yearly' },
  land: { category: 'land', propertyType: 'Land', paymentDuration: 'fixed' },
  warehouses: { category: 'commercial', propertyType: 'Warehouse', paymentDuration: 'monthly' },
  'event-centres': { category: 'event', propertyType: 'Event centre', paymentDuration: 'daily' },
  'hotels-guest-houses': {
    category: 'other',
    propertyType: 'Hotel or guest house',
    paymentDuration: 'daily',
  },
  'other-property': {
    category: 'other',
    propertyType: 'Other property',
    paymentDuration: 'fixed',
  },
}

export function getPropertyClassificationDefaults(subcategoryId: string | null | undefined) {
  return subcategoryId ? (propertyClassificationDefaults[subcategoryId] ?? null) : null
}

const propertyTypeSubcategoryIds: Partial<Record<PropertyType, string>> = {
  'House rent': 'houses',
  Apartment: 'apartments',
  'Self-contained': 'self-contained',
  Flat: 'flats',
  Duplex: 'duplexes',
  'Shop rent': 'shops',
  'Office space': 'offices',
  Land: 'land',
  Warehouse: 'warehouses',
  'Event space': 'event-centres',
  'Event centre': 'event-centres',
  'Hotel or guest house': 'hotels-guest-houses',
  'Other property': 'other-property',
}

export function getPropertySubcategoryId(propertyType: PropertyType) {
  return propertyTypeSubcategoryIds[propertyType] ?? 'other-property'
}
