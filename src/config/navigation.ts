import {
  addCircleOutline,
  albumsOutline,
  bookmarkOutline,
  calendarOutline,
  compassOutline,
  homeOutline,
  notificationsOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'

/**
 * Single source of truth for app navigation.
 *
 * Previously each page kept its own copy of this list, so adding a destination meant
 * editing four files and they had already drifted apart. Every navigation surface
 * (header, drawer, bottom bar, account menu) now renders from these definitions.
 */
export interface NavItem {
  label: string
  /** Short label for the bottom bar, where horizontal space is tight. */
  shortLabel?: string
  to: string
  icon: string
  /** Paths that should light this item up, including nested routes. */
  matchers: string[]
  requiresAuth?: boolean
  adminOnly?: boolean
}

/** Destinations shown in the mobile bottom bar, in order. Keep this at five. */
export const primaryNavItems: NavItem[] = [
  {
    label: 'Marketplace',
    shortLabel: 'Browse',
    to: '/home',
    icon: compassOutline,
    matchers: ['/home', '/properties', '/listings'],
  },
  {
    label: 'Saved',
    shortLabel: 'Saved',
    to: '/saved-properties',
    icon: bookmarkOutline,
    matchers: ['/saved-properties'],
    requiresAuth: true,
  },
  {
    label: 'Post a listing',
    shortLabel: 'Post',
    to: '/post-listing',
    icon: addCircleOutline,
    matchers: ['/post-listing', '/add-property', '/edit-property', '/edit-listing'],
    requiresAuth: true,
  },
  {
    label: 'Bookings',
    shortLabel: 'Bookings',
    to: '/my-bookings',
    icon: calendarOutline,
    matchers: ['/my-bookings', '/booking', '/payment'],
    requiresAuth: true,
  },
  {
    label: 'Account',
    shortLabel: 'Account',
    to: '/profile',
    icon: personOutline,
    matchers: ['/profile'],
    requiresAuth: true,
  },
]

/** Everything else, surfaced in the header and the mobile drawer. */
export const secondaryNavItems: NavItem[] = [
  {
    label: 'My listings',
    to: '/my-listings',
    icon: albumsOutline,
    matchers: ['/my-listings'],
    requiresAuth: true,
  },
  {
    label: 'Notifications',
    to: '/notifications',
    icon: notificationsOutline,
    matchers: ['/notifications'],
    requiresAuth: true,
  },
  {
    label: 'Get verified',
    to: '/agent-verification',
    icon: shieldCheckmarkOutline,
    matchers: ['/agent-verification'],
    requiresAuth: true,
  },
  {
    label: 'Admin',
    to: '/admin',
    icon: shieldCheckmarkOutline,
    matchers: ['/admin'],
    requiresAuth: true,
    adminOnly: true,
  },
]

/** Compact set for the desktop header bar. */
export const headerNavItems: NavItem[] = [
  { label: 'Marketplace', to: '/home', icon: compassOutline, matchers: ['/home'] },
  { label: 'Listings', to: '/home#listings', icon: homeOutline, matchers: [] },
  {
    label: 'My listings',
    to: '/my-listings',
    icon: albumsOutline,
    matchers: ['/my-listings'],
    requiresAuth: true,
  },
  {
    label: 'Bookings',
    to: '/my-bookings',
    icon: calendarOutline,
    matchers: ['/my-bookings', '/booking', '/payment'],
    requiresAuth: true,
  },
]

export const allNavItems: NavItem[] = [...primaryNavItems, ...secondaryNavItems]

/** True when `path` is the item's route or a route nested beneath it. */
export function isNavItemActive(item: NavItem, path: string) {
  return item.matchers.some((matcher) => path === matcher || path.startsWith(`${matcher}/`))
}

/**
 * Auth-gated destinations stay visible to signed-out visitors so the app never looks
 * emptier than it is; the route guard sends them to sign-in with a redirect back.
 */
export function visibleNavItems(items: NavItem[], options: { isAdmin: boolean }) {
  return items.filter((item) => !item.adminOnly || options.isAdmin)
}
