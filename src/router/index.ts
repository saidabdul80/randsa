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
        path: '/add-property',
        name: 'add-property',
        component: () => import('../views/AddPropertyPage.vue'),
        meta: { requiresAuth: true, requiresPropertyManager: true },
      },
      {
        path: '/edit-property/:propertyId',
        name: 'edit-property',
        component: () => import('../views/EditPropertyPage.vue'),
        meta: { requiresAuth: true, requiresPropertyManager: true },
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
        meta: { requiresAuth: true },
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
        meta: { requiresAuth: true },
      },
      {
        path: '/agent-verification',
        name: 'agent-verification',
        component: () => import('../views/AgentVerificationPage.vue'),
        meta: { requiresAuth: true, requiresAgent: true },
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
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
    scrollBehavior() {
      return { top: 0 }
    },
  })

  router.beforeEach(async (to) => {
    const needsResolvedAuth = Boolean(
      to.meta.requiresAuth ||
      to.meta.guestOnly ||
      to.meta.requiresAdmin ||
      to.meta.requiresPropertyManager ||
      to.meta.requiresAgent
    )

    if (needsResolvedAuth) {
      await ensureAuthReady()
    }

    const { canManageProperties, isAuthenticated, role, state } = useAuth()

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

    if (to.meta.requiresAdmin && role.value !== 'admin') {
      return {
        path: '/profile',
        query: { notice: 'admin-only' },
      }
    }

    if (to.meta.requiresPropertyManager && !canManageProperties.value) {
      return {
        path: '/profile',
        query: { notice: 'property-manager-only' },
      }
    }

    if (to.meta.requiresAgent && role.value !== 'agent') {
      return {
        path: '/profile',
        query: { notice: 'agent-only' },
      }
    }

    if (to.meta.guestOnly && isAuthenticated.value) {
      return role.value === 'admin' ? '/admin' : '/home'
    }

    return true
  })

  return router
}
