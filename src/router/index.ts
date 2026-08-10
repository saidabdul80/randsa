import { createRouter as createVueRouter, createWebHistory } from '@ionic/vue-router'

import { ensureAuthReady, useAuth } from '../composables/useAuth'

export function createRouter() {
  const router = createVueRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      { path: '/', redirect: '/splash' },
      { path: '/splash', name: 'splash', component: () => import('../views/SplashScreen.vue') },
      {
        path: '/onboarding',
        name: 'onboarding',
        component: () => import('../views/OnboardingPage.vue'),
        meta: { guestOnly: true },
      },
      {
        path: '/login',
        name: 'login',
        component: () => import('../views/LoginPage.vue'),
        meta: { guestOnly: true },
      },
      {
        path: '/register',
        name: 'register',
        component: () => import('../views/RegisterPage.vue'),
      },
      { path: '/home', name: 'home', component: () => import('../views/HomePage.vue') },
      {
        path: '/properties',
        name: 'properties',
        redirect: () => ({ path: '/home', hash: '#listings' }),
      },
      {
        path: '/properties/:propertyId',
        name: 'property-details',
        component: () => import('../views/PropertyDetailsPage.vue'),
      },
      {
        path: '/listings/:listingId',
        name: 'marketplace-listing-details',
        component: () => import('../views/MarketplaceListingDetailsPage.vue'),
      },
      {
        path: '/post-listing',
        name: 'post-listing',
        alias: '/add-property',
        component: () => import('../views/AddPropertyPage.vue'),
        meta: { requiresAuth: true, requiresActiveAccount: true },
      },
      {
        path: '/edit-listing/:listingId',
        name: 'edit-listing',
        component: () => import('../views/AddPropertyPage.vue'),
        meta: { requiresAuth: true, requiresActiveAccount: true },
      },
      {
        path: '/my-listings',
        name: 'my-listings',
        component: () => import('../views/MyListingsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/edit-property/:propertyId',
        name: 'edit-property',
        component: () => import('../views/EditPropertyPage.vue'),
        meta: { requiresAuth: true, requiresActiveAccount: true },
      },
      {
        path: '/saved-properties',
        name: 'saved-properties',
        component: () => import('../views/SavedPropertiesPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/booking/:propertyId?',
        name: 'booking',
        component: () => import('../views/BookingPage.vue'),
        meta: { requiresAuth: true, requiresActiveAccount: true },
      },
      {
        path: '/my-bookings',
        name: 'my-bookings',
        component: () => import('../views/MyBookingsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/payment/:propertyId?',
        name: 'payment',
        component: () => import('../views/PaymentPage.vue'),
        meta: { requiresAuth: true, requiresActiveAccount: true },
      },
      {
        path: '/agent-verification',
        name: 'agent-verification',
        component: () => import('../views/AgentVerificationPage.vue'),
        meta: { requiresAuth: true, requiresActiveAccount: true },
      },
      {
        path: '/notifications',
        name: 'notifications',
        component: () => import('../views/NotificationsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/profile',
        name: 'profile',
        component: () => import('../views/ProfilePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin',
        name: 'admin',
        component: () => import('../views/AdminDashboardPage.vue'),
        meta: { requiresAuth: true, requiresActiveAccount: true, requiresAdmin: true },
      },
      { path: '/:pathMatch(.*)*', redirect: '/home' },
    ],
    scrollBehavior() {
      return { top: 0 }
    },
  })

  router.beforeEach(async (to) => {
    const needsResolvedAuth = Boolean(
      to.meta.requiresAuth ||
      to.meta.guestOnly ||
      to.meta.requiresActiveAccount ||
      to.meta.requiresAdmin
    )

    if (needsResolvedAuth) {
      await ensureAuthReady()
    }

    const { isAuthenticated, role, state } = useAuth()

    if (to.meta.requiresAuth && !isAuthenticated.value) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }

    if (to.meta.requiresAuth && isAuthenticated.value && !state.profile && to.name !== 'register') {
      return {
        path: '/register',
        query: { notice: 'complete-profile', redirect: to.fullPath },
      }
    }

    if (to.meta.requiresActiveAccount && state.profile?.accountStatus !== 'active') {
      return {
        path: '/profile',
        query: { notice: 'account-inactive' },
      }
    }

    if (to.meta.requiresAdmin && role.value !== 'admin') {
      return {
        path: '/profile',
        query: { notice: 'admin-only' },
      }
    }

    if (to.name === 'register' && isAuthenticated.value && state.profile) {
      return role.value === 'admin' ? '/admin' : '/home'
    }

    if (to.meta.guestOnly && isAuthenticated.value) {
      if (!state.profile) {
        return {
          path: '/register',
          query: { notice: 'complete-profile', redirect: to.fullPath },
        }
      }

      return role.value === 'admin' ? '/admin' : '/home'
    }

    return true
  })

  return router
}
