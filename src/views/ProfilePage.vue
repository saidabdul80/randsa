<template>
  <AppShell :show-header="false" content-class="min-h-full w-full pb-28 sm:pb-8">
    <div class="account-center">
      <div class="account-center__navigation">
        <NotificationSidebarNav
          :can-manage-properties="canManageProperties"
          aria-label="Account Center navigation"
          :show-mobile="true"
        />
      </div>

      <main class="account-center__main">
        <section class="account-hero" aria-labelledby="profile-page-title">
          <div class="account-hero__copy">
            <p>RANDSA <span>/</span> Account Center</p>
            <h1 id="profile-page-title">Account Center</h1>
            <span>
              Manage your account, verification, saved listings, bookings, payments, security, and
              preferences from one place.
            </span>
          </div>
          <div class="account-hero__art" aria-hidden="true">
            <span class="account-hero__shield"><IonIcon :icon="shieldCheckmarkOutline" /></span>
            <span class="account-hero__person"><IonIcon :icon="personOutline" /></span>
            <span class="account-hero__check"><IonIcon :icon="checkmarkOutline" /></span>
          </div>
        </section>

        <div
          v-if="noticeMessage || errorMessage || state.error"
          class="account-notice"
          :class="errorMessage || state.error ? 'is-error' : 'is-info'"
          role="status"
        >
          <IonIcon :icon="alertCircleOutline" aria-hidden="true" />
          <span>{{ noticeMessage || errorMessage || state.error }}</span>
          <button
            v-if="noticeMessage || errorMessage"
            type="button"
            title="Dismiss message"
            aria-label="Dismiss message"
            @click="dismissNotice"
          >
            <IonIcon :icon="closeOutline" aria-hidden="true" />
          </button>
        </div>

        <div class="account-layout">
          <div class="account-primary">
            <section
              class="profile-overview account-panel"
              aria-labelledby="profile-overview-title"
            >
              <div class="profile-overview__identity">
                <div class="profile-avatar" :class="{ 'has-image': profile?.photoURL }">
                  <img
                    v-if="profile?.photoURL"
                    :src="profile.photoURL"
                    :alt="`${displayName} account photo`"
                    loading="lazy"
                    decoding="async"
                  />
                  <span v-else aria-hidden="true">{{ initials }}</span>
                </div>
                <div>
                  <div class="profile-overview__name-row">
                    <h2 id="profile-overview-title">{{ displayName }}</h2>
                    <span v-if="profile?.isVerifiedAgent" class="status-badge is-success">
                      <IonIcon :icon="checkmarkCircle" aria-hidden="true" /> Verified
                    </span>
                  </div>
                  <p>{{ roleLabel }} account</p>
                  <div class="completion-inline" aria-label="Account completion">
                    <span><i :style="{ width: `${completionScore}%` }" /></span>
                    <strong>{{ completionScore }}% complete</strong>
                  </div>
                </div>
              </div>

              <RouterLink
                to="/register?redirect=/profile"
                class="icon-command"
                title="Edit account details"
              >
                <IonIcon :icon="createOutline" aria-hidden="true" />
                <span>Edit account</span>
              </RouterLink>
            </section>

            <div class="account-score-grid">
              <section class="account-panel score-panel" aria-labelledby="completion-title">
                <div class="panel-heading">
                  <span class="panel-icon is-blue"
                    ><IonIcon :icon="personCircleOutline" aria-hidden="true"
                  /></span>
                  <div>
                    <p>Account readiness</p>
                    <h2 id="completion-title">Account completion</h2>
                  </div>
                  <strong>{{ completionScore }}%</strong>
                </div>
                <div class="score-progress" aria-hidden="true">
                  <span :style="{ width: `${completionScore}%` }" />
                </div>
                <ul class="check-list">
                  <li
                    v-for="check in completionChecks"
                    :key="check.label"
                    :class="{ complete: check.complete }"
                  >
                    <IonIcon
                      :icon="check.complete ? checkmarkCircle : ellipseOutline"
                      aria-hidden="true"
                    />
                    <span>{{ check.label }}</span>
                    <small>{{ check.complete ? 'Complete' : 'Missing' }}</small>
                  </li>
                </ul>
              </section>

              <section class="account-panel score-panel" aria-labelledby="security-title">
                <div class="panel-heading">
                  <span class="panel-icon is-green"
                    ><IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true"
                  /></span>
                  <div>
                    <p>Available account signals</p>
                    <h2 id="security-title">Security score</h2>
                  </div>
                  <strong>{{ securityScore }}%</strong>
                </div>
                <div class="score-progress is-green" aria-hidden="true">
                  <span :style="{ width: `${securityScore}%` }" />
                </div>
                <ul class="check-list">
                  <li
                    v-for="check in securityChecks"
                    :key="check.label"
                    :class="{ complete: check.complete, future: check.future }"
                  >
                    <IonIcon
                      :icon="
                        check.complete
                          ? checkmarkCircle
                          : check.future
                            ? timeOutline
                            : alertCircleOutline
                      "
                      aria-hidden="true"
                    />
                    <span>{{ check.label }}</span>
                    <small>{{ check.status }}</small>
                  </li>
                </ul>
              </section>
            </div>

            <section class="account-panel" aria-labelledby="personal-information-title">
              <div class="section-heading">
                <div>
                  <p>Account record</p>
                  <h2 id="personal-information-title">Personal information</h2>
                </div>
                <RouterLink to="/register?redirect=/profile" class="text-command">
                  Edit supported fields <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
                </RouterLink>
              </div>

              <dl class="information-list">
                <div v-for="item in informationRows" :key="item.label">
                  <span class="information-list__icon"
                    ><IonIcon :icon="item.icon" aria-hidden="true"
                  /></span>
                  <dt>{{ item.label }}</dt>
                  <dd>{{ item.value }}</dd>
                  <button
                    v-if="item.copyValue"
                    type="button"
                    :title="`Copy ${item.label.toLowerCase()}`"
                    :aria-label="`Copy ${item.label.toLowerCase()}`"
                    @click="copyAccountValue(item.label, item.copyValue)"
                  >
                    <IonIcon :icon="copyOutline" aria-hidden="true" />
                  </button>
                </div>
              </dl>
              <p class="copy-status" aria-live="polite">{{ copyStatus }}</p>
            </section>

            <section class="account-panel" aria-labelledby="quick-actions-title">
              <div class="section-heading">
                <div>
                  <p>Shortcuts</p>
                  <h2 id="quick-actions-title">Account Center quick actions</h2>
                </div>
              </div>
              <div class="quick-action-grid">
                <RouterLink
                  v-for="action in quickActions"
                  :key="action.title"
                  :to="action.to"
                  class="quick-action"
                >
                  <span class="panel-icon" :class="action.tone"
                    ><IonIcon :icon="action.icon" aria-hidden="true"
                  /></span>
                  <span>
                    <strong>{{ action.title }}</strong>
                    <small>{{ action.copy }}</small>
                  </span>
                  <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
                </RouterLink>
              </div>
            </section>

            <section class="account-panel verification-panel" aria-labelledby="verification-title">
              <div class="section-heading">
                <div>
                  <p>Trust &amp; identity</p>
                  <h2 id="verification-title">Verification timeline</h2>
                </div>
                <span class="status-badge" :class="verificationTone">{{ verificationLabel }}</span>
              </div>

              <div class="verification-layout">
                <ol class="verification-timeline">
                  <li v-for="stage in verificationStages" :key="stage.label" :class="stage.state">
                    <span
                      ><IonIcon
                        :icon="
                          stage.state === 'complete'
                            ? checkmarkOutline
                            : stage.state === 'rejected'
                              ? closeOutline
                              : ellipseOutline
                        "
                        aria-hidden="true"
                    /></span>
                    <div>
                      <strong>{{ stage.label }}</strong>
                      <small>{{ stage.copy }}</small>
                    </div>
                  </li>
                </ol>

                <div class="verification-guidance">
                  <h3>{{ verificationGuidance.title }}</h3>
                  <p>{{ verificationGuidance.copy }}</p>
                  <ul v-if="profile?.role === 'agent'">
                    <li>Profile photograph and identity document</li>
                    <li>Contact and office information</li>
                    <li>Authorization document</li>
                  </ul>
                  <RouterLink
                    v-if="profile?.role === 'agent'"
                    to="/agent-verification"
                    class="primary-command"
                  >
                    {{ verificationActionLabel }}
                    <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
                  </RouterLink>
                </div>
              </div>
            </section>

            <section
              id="role-access"
              class="account-panel role-panel"
              aria-labelledby="role-access-title"
            >
              <div class="section-heading">
                <div>
                  <p>Access control</p>
                  <h2 id="role-access-title">Role permissions</h2>
                </div>
                <span class="role-badge">{{ roleLabel }}</span>
              </div>
              <p>{{ roleSummary }}</p>
              <ul>
                <li v-for="permission in rolePermissions" :key="permission">
                  <IonIcon :icon="checkmarkCircleOutline" aria-hidden="true" /> {{ permission }}
                </li>
              </ul>
              <RouterLink v-if="roleAction" :to="roleAction.to" class="primary-command">
                {{ roleAction.label }} <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
              </RouterLink>
            </section>

            <section class="account-panel" aria-labelledby="preferences-title">
              <div class="section-heading">
                <div>
                  <p>Preferences &amp; access</p>
                  <h2 id="preferences-title">Account settings</h2>
                </div>
              </div>
              <div class="settings-grid">
                <component
                  :is="setting.to ? RouterLink : 'article'"
                  v-for="setting in settingsItems"
                  :key="setting.title"
                  v-bind="setting.to ? { to: setting.to } : {}"
                  class="setting-item"
                >
                  <IonIcon :icon="setting.icon" aria-hidden="true" />
                  <span
                    ><strong>{{ setting.title }}</strong
                    ><small>{{ setting.value }}</small></span
                  >
                  <IonIcon v-if="setting.to" :icon="chevronForwardOutline" aria-hidden="true" />
                </component>
              </div>
            </section>

            <section class="account-panel" aria-labelledby="activity-title">
              <div class="section-heading">
                <div>
                  <p>Known account events</p>
                  <h2 id="activity-title">Recent activity</h2>
                </div>
              </div>
              <ol class="activity-list">
                <li>
                  <span><IonIcon :icon="logInOutline" aria-hidden="true" /></span>
                  <div>
                    <strong>Current session active</strong
                    ><small>You are signed in on this device.</small>
                  </div>
                  <time>Now</time>
                </li>
                <li v-if="memberSinceDate">
                  <span><IonIcon :icon="personAddOutline" aria-hidden="true" /></span>
                  <div>
                    <strong>Account created</strong><small>Your RANDSA membership began.</small>
                  </div>
                  <time :datetime="memberSinceDate.toISOString()">{{ memberSinceLabel }}</time>
                </li>
              </ol>
              <p class="empty-data-note">
                Booking, payment, saved-listing, and device activity will appear here when a
                dedicated activity feed is available.
              </p>
            </section>

            <details v-if="showDeveloperTools" class="developer-mode">
              <summary>
                <span class="panel-icon is-amber"
                  ><IonIcon :icon="codeSlashOutline" aria-hidden="true"
                /></span>
                <span
                  ><strong>Developer mode</strong
                  ><small>Admin and local-development maintenance tools</small></span
                >
                <IonIcon :icon="chevronDownOutline" aria-hidden="true" />
              </summary>
              <div class="developer-mode__content">
                <div v-if="isLocalAuthBypassEnabled" class="role-switcher">
                  <h3>Local bypass role switcher</h3>
                  <p>
                    Temporary local testing only. This uses the existing bypass role-switch
                    function.
                  </p>
                  <div>
                    <button
                      v-for="item in switchableRoles"
                      :key="item"
                      type="button"
                      :class="{ active: profile?.role === item }"
                      @click="handleRoleSwitch(item)"
                    >
                      {{ item }}
                    </button>
                  </div>
                </div>
                <StoragePathTester :profile="profile" />
                <LocalDataMigrationCard :profile="profile" />
              </div>
            </details>

            <section class="logout-panel" aria-labelledby="logout-title">
              <div>
                <h2 id="logout-title">Sign out of RANDSA</h2>
                <p>Your saved account data remains available when you sign in again.</p>
              </div>
              <button type="button" :disabled="isSigningOut" @click="handleLogout">
                <IonIcon :icon="logOutOutline" aria-hidden="true" />
                {{ isSigningOut ? 'Signing out...' : 'Log out' }}
              </button>
            </section>
          </div>

          <aside class="account-summary" aria-label="Account summary">
            <div class="account-summary__sticky">
              <section>
                <div class="account-summary__topline">
                  <p>Current role</p>
                  <RouterLink
                    to="/register?redirect=/profile"
                    class="icon-only"
                    title="Quick edit account"
                    aria-label="Quick edit account details"
                  >
                    <IonIcon :icon="createOutline" aria-hidden="true" />
                  </RouterLink>
                </div>
                <span class="role-badge">{{ roleLabel }}</span>
                <p>{{ roleSummary }}</p>
                <a href="#role-access" class="secondary-command">View role permissions</a>
              </section>

              <section class="summary-metrics">
                <div>
                  <span>Verification</span
                  ><strong class="status-badge" :class="verificationTone">{{
                    verificationLabel
                  }}</strong>
                </div>
                <div>
                  <span>Account completion</span><strong>{{ completionScore }}%</strong>
                </div>
                <div>
                  <span>Security score</span><strong>{{ securityScore }}%</strong>
                </div>
                <div><span>Last login</span><strong>Current session</strong></div>
                <div>
                  <span>Member since</span><strong>{{ memberSinceLabel }}</strong>
                </div>
                <div><span>Storage usage</span><strong>Not tracked yet</strong></div>
              </section>

              <section class="summary-security">
                <span><IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" /></span>
                <div>
                  <strong>Account protected</strong
                  ><small>Firebase authentication and role-based access are active.</small>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  alertCircleOutline,
  arrowForwardOutline,
  calendarOutline,
  cardOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkOutline,
  chevronDownOutline,
  chevronForwardOutline,
  closeOutline,
  codeSlashOutline,
  colorPaletteOutline,
  copyOutline,
  createOutline,
  documentTextOutline,
  ellipseOutline,
  heartOutline,
  helpCircleOutline,
  idCardOutline,
  languageOutline,
  lockClosedOutline,
  logInOutline,
  logOutOutline,
  mailOutline,
  notificationsOutline,
  personAddOutline,
  personCircleOutline,
  personOutline,
  phonePortraitOutline,
  shieldCheckmarkOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import NotificationSidebarNav from '../components/notifications/NotificationSidebarNav.vue'
import LocalDataMigrationCard from '../components/profile/LocalDataMigrationCard.vue'
import StoragePathTester from '../components/profile/StoragePathTester.vue'
import { rehydrateAuthState, signOutCurrentUser, useAuth } from '../composables/useAuth'
import { switchLocalBypassRole, toDisplayError } from '../services/auth'
import type { UserRole } from '../types/user'
import { formatVerificationStatusLabel } from '../types/verification'

type VerificationStageState = 'complete' | 'current' | 'upcoming' | 'rejected'

const route = useRoute()
const router = useRouter()
const { canManageProperties, isLocalAuthBypassEnabled, state } = useAuth()
const isSigningOut = ref(false)
const errorMessage = ref('')
const copyStatus = ref('')
const isNoticeDismissed = ref(false)
const switchableRoles: UserRole[] = ['tenant', 'landlord', 'agent', 'admin']

const profile = computed(() => state.profile)
const user = computed(() => state.user)
const displayName = computed(() => profile.value?.fullName || user.value?.email || 'RANDSA User')
const roleLabel = computed(() => titleCase(profile.value?.role ?? 'tenant'))
const verificationLabel = computed(() =>
  titleCase(formatVerificationStatusLabel(profile.value?.verificationStatus ?? 'not_submitted'))
)
const verificationTone = computed(() => {
  const status = profile.value?.verificationStatus ?? 'not_submitted'
  if (status === 'approved') return 'is-success'
  if (status === 'rejected') return 'is-error'
  if (status === 'pending') return 'is-warning'
  return 'is-neutral'
})
const noticeMessage = computed(() => {
  if (isNoticeDismissed.value) return ''
  if (route.query.notice === 'property-manager-only') {
    return 'Only landlord, agent, and admin accounts can open Add Property. Your current role does not have listing access yet.'
  }
  if (route.query.notice === 'admin-only') {
    return 'Only admin accounts can open that page. Sign in with an admin account to use moderation tools.'
  }
  if (route.query.notice === 'agent-only') {
    return 'Only agent accounts can open the verification form.'
  }
  return ''
})
const initials = computed(
  () =>
    displayName.value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'R'
)

const completionChecks = computed(() => {
  const checks = [
    { label: 'Full name', complete: Boolean(profile.value?.fullName.trim()) },
    { label: 'Email address', complete: Boolean(profile.value?.email || user.value?.email) },
    { label: 'Phone number', complete: Boolean(profile.value?.phone.trim()) },
    { label: 'Profile photo', complete: Boolean(profile.value?.photoURL.trim()) },
  ]
  if (profile.value?.role === 'agent') {
    checks.push({ label: 'Agent verification', complete: Boolean(profile.value.isVerifiedAgent) })
  }
  return checks
})
const completionScore = computed(() => {
  if (!completionChecks.value.length) return 0
  const completed = completionChecks.value.filter((check) => check.complete).length
  return Math.round((completed / completionChecks.value.length) * 100)
})

const securityChecks = computed(() => [
  {
    label: 'Signed-in session',
    complete: Boolean(user.value),
    future: false,
    status: user.value ? 'Active' : 'Pending',
  },
  {
    label: 'Email on file',
    complete: Boolean(profile.value?.email || user.value?.email),
    future: false,
    status: profile.value?.email || user.value?.email ? 'Available' : 'Missing',
  },
  {
    label: 'Phone on file',
    complete: Boolean(profile.value?.phone),
    future: false,
    status: profile.value?.phone ? 'Available' : 'Missing',
  },
  { label: 'Two-factor authentication', complete: false, future: true, status: 'Future' },
])
const securityScore = computed(() => {
  const scored = securityChecks.value.filter((check) => !check.future)
  return Math.round((scored.filter((check) => check.complete).length / scored.length) * 100)
})

const informationRows = computed(() => [
  {
    label: 'Email',
    value: profile.value?.email || user.value?.email || 'Unavailable',
    copyValue: profile.value?.email || user.value?.email || '',
    icon: mailOutline,
  },
  {
    label: 'Phone',
    value: profile.value?.phone || 'Not added yet',
    copyValue: profile.value?.phone || '',
    icon: phonePortraitOutline,
  },
  { label: 'Role', value: roleLabel.value, copyValue: '', icon: idCardOutline },
  {
    label: 'Verification',
    value: verificationLabel.value,
    copyValue: '',
    icon: shieldCheckmarkOutline,
  },
  {
    label: 'Address',
    value: 'Not supported by the current profile schema',
    copyValue: '',
    icon: documentTextOutline,
  },
  { label: 'Date joined', value: memberSinceLabel.value, copyValue: '', icon: calendarOutline },
])

const quickActions = computed(() => {
  const actions = [
    {
      title: 'My bookings',
      copy: 'Review inspection and rental bookings.',
      to: '/my-bookings',
      icon: calendarOutline,
      tone: 'is-blue',
    },
    {
      title: 'Saved listings',
      copy: 'Return to properties you saved.',
      to: '/saved-properties',
      icon: heartOutline,
      tone: 'is-red',
    },
    {
      title: 'Notifications',
      copy: 'Review booking and payment alerts.',
      to: '/notifications',
      icon: notificationsOutline,
      tone: 'is-purple',
    },
    {
      title: 'Payments',
      copy: 'Open the existing payment workspace.',
      to: '/payment',
      icon: walletOutline,
      tone: 'is-green',
    },
  ]
  if (canManageProperties.value) {
    actions.push({
      title: 'Add property',
      copy: 'Create a new marketplace listing.',
      to: '/add-property',
      icon: documentTextOutline,
      tone: 'is-green',
    })
  }
  if (profile.value?.role === 'agent') {
    actions.push({
      title: 'Verification',
      copy: 'Manage your agent verification.',
      to: '/agent-verification',
      icon: idCardOutline,
      tone: 'is-amber',
    })
  }
  if (profile.value?.role === 'admin') {
    actions.push({
      title: 'Admin tools',
      copy: 'Open moderation and review tools.',
      to: '/admin',
      icon: shieldCheckmarkOutline,
      tone: 'is-purple',
    })
  }
  return actions
})

const verificationStages = computed<
  { label: string; copy: string; state: VerificationStageState }[]
>(() => {
  const status = profile.value?.verificationStatus ?? 'not_submitted'
  if (status === 'approved') {
    return [
      { label: 'Submitted', copy: 'Verification documents received.', state: 'complete' },
      { label: 'Under review', copy: 'Administrative review completed.', state: 'complete' },
      { label: 'Approved', copy: 'Agent verification approved.', state: 'complete' },
    ]
  }
  if (status === 'rejected') {
    return [
      { label: 'Submitted', copy: 'Verification documents received.', state: 'complete' },
      { label: 'Under review', copy: 'Administrative review completed.', state: 'complete' },
      { label: 'Rejected', copy: 'Review the verification form and resubmit.', state: 'rejected' },
    ]
  }
  if (status === 'pending') {
    return [
      { label: 'Submitted', copy: 'Verification documents received.', state: 'complete' },
      { label: 'Under review', copy: 'Waiting for an administrator decision.', state: 'current' },
      { label: 'Approved', copy: 'Available after successful review.', state: 'upcoming' },
    ]
  }
  return [
    { label: 'Not submitted', copy: 'No verification request is on file.', state: 'current' },
    { label: 'Under review', copy: 'Begins after an agent submits documents.', state: 'upcoming' },
    { label: 'Approved', copy: 'Available after successful review.', state: 'upcoming' },
  ]
})
const verificationGuidance = computed(() => {
  if (profile.value?.role !== 'agent') {
    return {
      title: 'Agent-only verification',
      copy: 'The current verification workflow is available only to agent accounts.',
    }
  }
  if (profile.value.verificationStatus === 'pending') {
    return {
      title: 'Review in progress',
      copy: 'Processing time depends on the current administrator review queue.',
    }
  }
  if (profile.value.verificationStatus === 'approved') {
    return { title: 'Verification complete', copy: 'Your account is marked as a verified agent.' }
  }
  if (profile.value.verificationStatus === 'rejected') {
    return {
      title: 'Updates required',
      copy: 'Open the verification form to review and resubmit supported documents.',
    }
  }
  return {
    title: 'Start agent verification',
    copy: 'Submit the existing identity, office, and authorization requirements for review.',
  }
})
const verificationActionLabel = computed(() =>
  profile.value?.verificationStatus === 'not_submitted' ? 'Start verification' : 'Open verification'
)

const roleSummary = computed(() => {
  const role = profile.value?.role ?? 'tenant'
  if (role === 'admin')
    return 'Full moderation and listing-management access is enabled for this account.'
  if (role === 'agent')
    return 'Create and manage listings, bookings, and your agent verification request.'
  if (role === 'landlord')
    return 'Create and manage property listings and their associated booking activity.'
  return 'Explore, save, book, pay, and receive updates across the rental marketplace.'
})
const rolePermissions = computed(() => {
  const base = [
    'Explore approved rental listings',
    'Save listings and manage bookings',
    'Open payments and notifications',
  ]
  if (canManageProperties.value) base.push('Create and manage property listings')
  if (profile.value?.role === 'agent') base.push('Submit an agent verification request')
  if (profile.value?.role === 'admin') base.push('Open administration and moderation tools')
  return base
})
const roleAction = computed(() => {
  if (profile.value?.role === 'admin') return { label: 'Open admin tools', to: '/admin' }
  if (profile.value?.role === 'agent')
    return { label: 'Manage verification', to: '/agent-verification' }
  if (profile.value?.role === 'landlord') return { label: 'Add property', to: '/add-property' }
  return null
})

const settingsItems = computed(() => [
  { title: 'Theme', value: 'Uses your app and system theme', icon: colorPaletteOutline, to: '' },
  { title: 'Language', value: 'English', icon: languageOutline, to: '' },
  {
    title: 'Notifications',
    value: 'Open notification preferences and status',
    icon: notificationsOutline,
    to: '/notifications',
  },
  {
    title: 'Privacy & security',
    value: 'Protected by current account permissions',
    icon: lockClosedOutline,
    to: '',
  },
  {
    title: 'Connected accounts',
    value: 'Managed by Firebase Authentication',
    icon: cardOutline,
    to: '',
  },
  {
    title: 'Device sessions',
    value: 'Current device session available',
    icon: phonePortraitOutline,
    to: '',
  },
  {
    title: 'Help & support',
    value: 'No dedicated support route is configured yet',
    icon: helpCircleOutline,
    to: '',
  },
])

const memberSinceDate = computed(() => parseDate(profile.value?.createdAt))
const memberSinceLabel = computed(() => {
  if (!memberSinceDate.value) return 'Unavailable'
  return new Intl.DateTimeFormat('en-NG', { month: 'short', year: 'numeric' }).format(
    memberSinceDate.value
  )
})
const showDeveloperTools = computed(
  () => profile.value?.role === 'admin' || isLocalAuthBypassEnabled.value
)

watch(
  () => route.query.notice,
  () => {
    isNoticeDismissed.value = false
  }
)

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function parseDate(value: unknown) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (typeof value === 'object') {
    const timestamp = value as { toDate?: () => Date; seconds?: number }
    if (typeof timestamp.toDate === 'function') {
      const parsed = timestamp.toDate()
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    if (typeof timestamp.seconds === 'number') return new Date(timestamp.seconds * 1000)
  }
  return null
}

async function copyAccountValue(label: string, value: string) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    copyStatus.value = `${label} copied.`
  } catch {
    copyStatus.value = `${label} could not be copied in this browser.`
  }
}

function dismissNotice() {
  isNoticeDismissed.value = true
  errorMessage.value = ''
}

async function handleLogout() {
  if (!window.confirm('Log out of your RANDSA account on this device?')) return
  errorMessage.value = ''
  isSigningOut.value = true
  try {
    await signOutCurrentUser()
    await router.replace('/login')
  } catch (error) {
    errorMessage.value = toDisplayError(error)
  } finally {
    isSigningOut.value = false
  }
}

async function handleRoleSwitch(role: UserRole) {
  if (!profile.value) {
    errorMessage.value = 'Sign in before switching the local bypass role.'
    return
  }
  errorMessage.value = ''
  try {
    await switchLocalBypassRole(profile.value.uid, role)
    await rehydrateAuthState()
  } catch (error) {
    errorMessage.value = toDisplayError(error)
  }
}
</script>

<style scoped>
.account-center {
  --ac-bg: #f5f7fa;
  --ac-surface: #ffffff;
  --ac-soft: #f4f7fb;
  --ac-text: #102033;
  --ac-muted: #66778d;
  --ac-subtle: #8a98aa;
  --ac-border: #e0e7ef;
  --ac-blue: #1769ef;
  --ac-blue-soft: #edf4ff;
  --ac-green: #079455;
  --ac-green-soft: #ecfdf3;
  --ac-amber: #b76a00;
  --ac-amber-soft: #fff8e8;
  --ac-red: #d92d4f;
  --ac-red-soft: #fff1f3;
  min-height: 100%;
  background: var(--ac-bg);
  color: var(--ac-text);
}
.account-center__navigation {
  padding: 12px 12px 0;
}
.account-center__main {
  min-width: 0;
  padding: 0 12px 30px;
}
.account-hero {
  position: relative;
  display: flex;
  min-height: 180px;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--ac-border);
  border-radius: 20px;
  background: linear-gradient(110deg, var(--ac-surface), var(--ac-blue-soft));
  padding: 28px 32px;
}
.account-hero__copy {
  position: relative;
  z-index: 2;
  max-width: 620px;
}
.account-hero__copy > p {
  margin: 0;
  color: var(--ac-blue);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}
.account-hero__copy > p span {
  color: var(--ac-subtle);
}
.account-hero h1 {
  margin: 10px 0 0;
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 0;
}
.account-hero__copy > span {
  display: block;
  max-width: 610px;
  margin-top: 8px;
  color: var(--ac-muted);
  font-size: 13px;
  line-height: 1.6;
}
.account-hero__art {
  position: absolute;
  right: 4%;
  bottom: 0;
  width: 250px;
  height: 168px;
}
.account-hero__shield {
  position: absolute;
  right: 56px;
  bottom: 20px;
  display: grid;
  width: 112px;
  height: 126px;
  place-items: center;
  border-radius: 42% 42% 52% 52%;
  background: linear-gradient(145deg, #5aa2ff, #1769ef 70%);
  color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 28px 45px -30px rgba(23, 105, 239, 0.9);
  transform: perspective(300px) rotateY(-7deg);
}
.account-hero__shield ion-icon {
  font-size: 62px;
}
.account-hero__person {
  position: absolute;
  z-index: 2;
  right: 85px;
  bottom: 53px;
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 50%;
  background: #fff;
  color: #406b9e;
  box-shadow: 0 12px 25px -18px #102033;
}
.account-hero__person ion-icon {
  font-size: 36px;
}
.account-hero__check {
  position: absolute;
  z-index: 3;
  right: 37px;
  bottom: 18px;
  display: grid;
  width: 55px;
  height: 55px;
  place-items: center;
  border: 6px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  background: #25c986;
  color: #fff;
  box-shadow: 0 14px 27px -18px #079455;
}
.account-hero__check ion-icon {
  font-size: 28px;
}
.account-notice {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 12px;
  border: 1px solid;
  border-radius: 12px;
  padding: 11px 13px;
  font-size: 11px;
}
.account-notice > ion-icon {
  flex: 0 0 auto;
  font-size: 18px;
}
.account-notice > span {
  flex: 1;
}
.account-notice button {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: currentColor;
}
.account-notice.is-error {
  border-color: #f6bcc8;
  background: var(--ac-red-soft);
  color: var(--ac-red);
}
.account-notice.is-info {
  border-color: #bcd7fb;
  background: var(--ac-blue-soft);
  color: #175fbf;
}
.account-layout {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}
.account-primary {
  display: grid;
  min-width: 0;
  gap: 16px;
}
.account-panel,
.account-summary__sticky,
.developer-mode,
.logout-panel {
  border: 1px solid var(--ac-border);
  border-radius: 20px;
  background: var(--ac-surface);
  box-shadow: 0 22px 55px -45px rgba(16, 32, 51, 0.55);
}
.account-panel {
  padding: 20px;
}
.profile-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.profile-overview__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 15px;
}
.profile-avatar {
  display: grid;
  width: 78px;
  height: 78px;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border: 4px solid var(--ac-surface);
  border-radius: 24px;
  background: var(--ac-blue-soft);
  color: var(--ac-blue);
  font-size: 25px;
  font-weight: 900;
  box-shadow:
    0 0 0 1px var(--ac-border),
    0 16px 30px -24px rgba(16, 32, 51, 0.55);
  transition:
    box-shadow 200ms ease,
    transform 200ms ease;
}
.profile-avatar:hover {
  box-shadow:
    0 0 0 3px rgba(23, 105, 239, 0.2),
    0 18px 32px -23px rgba(16, 32, 51, 0.6);
  transform: translateY(-2px);
}
.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-overview__name-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.profile-overview h2 {
  margin: 0;
  font-size: 21px;
  font-weight: 900;
}
.profile-overview__identity p {
  margin: 4px 0 0;
  color: var(--ac-muted);
  font-size: 11px;
}
.completion-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.completion-inline > span {
  width: 100px;
  height: 5px;
  overflow: hidden;
  border-radius: 4px;
  background: #e8edf3;
}
.completion-inline i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--ac-blue);
  transition: width 500ms ease;
}
.completion-inline strong {
  color: var(--ac-muted);
  font-size: 8px;
}
.status-badge,
.role-badge {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 4px;
  border-radius: 12px;
  padding: 5px 8px;
  font-size: 8px;
  font-weight: 850;
}
.status-badge.is-success {
  background: var(--ac-green-soft);
  color: var(--ac-green);
}
.status-badge.is-warning {
  background: var(--ac-amber-soft);
  color: var(--ac-amber);
}
.status-badge.is-error {
  background: var(--ac-red-soft);
  color: var(--ac-red);
}
.status-badge.is-neutral,
.role-badge {
  background: var(--ac-blue-soft);
  color: var(--ac-blue);
}
.icon-command,
.text-command,
.primary-command,
.secondary-command {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  font-weight: 800;
  transition:
    transform 190ms ease,
    border-color 190ms ease,
    background 190ms ease;
}
.icon-command {
  min-height: 38px;
  border: 1px solid var(--ac-border);
  border-radius: 10px;
  padding: 0 12px;
  color: var(--ac-text);
  font-size: 9px;
}
.icon-command:hover,
.primary-command:hover,
.secondary-command:hover {
  transform: translateY(-2px);
}
.text-command {
  color: var(--ac-blue);
  font-size: 9px;
}
.primary-command {
  min-height: 40px;
  width: fit-content;
  border-radius: 10px;
  background: var(--ac-blue);
  padding: 0 14px;
  color: #fff;
  font-size: 9px;
}
.secondary-command {
  min-height: 38px;
  border: 1px solid #a9c8f8;
  border-radius: 10px;
  padding: 0 12px;
  color: var(--ac-blue);
  font-size: 9px;
}
.account-score-grid {
  display: grid;
  gap: 16px;
}
.panel-heading,
.section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.panel-heading > div,
.section-heading > div {
  min-width: 0;
  flex: 1;
}
.panel-heading p,
.section-heading p {
  margin: 0;
  color: var(--ac-blue);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.panel-heading h2,
.section-heading h2 {
  margin: 3px 0 0;
  font-size: 15px;
  font-weight: 900;
}
.panel-heading > strong {
  color: var(--ac-blue);
  font-size: 20px;
}
.panel-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 11px;
  background: var(--ac-soft);
  color: #526a84;
}
.panel-icon ion-icon {
  font-size: 19px;
}
.panel-icon.is-blue {
  background: var(--ac-blue-soft);
  color: var(--ac-blue);
}
.panel-icon.is-green {
  background: var(--ac-green-soft);
  color: var(--ac-green);
}
.panel-icon.is-red {
  background: var(--ac-red-soft);
  color: var(--ac-red);
}
.panel-icon.is-purple {
  background: #f5edff;
  color: #7c3aed;
}
.panel-icon.is-amber {
  background: var(--ac-amber-soft);
  color: var(--ac-amber);
}
.score-progress {
  height: 6px;
  overflow: hidden;
  margin-top: 16px;
  border-radius: 5px;
  background: #e9eef4;
}
.score-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--ac-blue);
  transition: width 500ms ease;
}
.score-progress.is-green span {
  background: var(--ac-green);
}
.check-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
  margin: 15px 0 0;
  padding: 0;
  list-style: none;
}
.check-list li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  color: var(--ac-muted);
  font-size: 9px;
}
.check-list li > ion-icon {
  color: #bdc7d2;
  font-size: 15px;
}
.check-list li small {
  color: var(--ac-subtle);
  font-size: 7px;
}
.check-list li.complete > ion-icon {
  color: var(--ac-green);
}
.check-list li.future > ion-icon {
  color: var(--ac-amber);
}
.information-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
  margin: 16px 0 0;
}
.information-list > div {
  display: grid;
  min-width: 0;
  grid-template-columns: 33px minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  gap: 2px 9px;
  align-items: center;
  border-top: 1px solid var(--ac-border);
  padding: 12px 0;
}
.information-list__icon {
  display: grid;
  width: 32px;
  height: 32px;
  grid-row: 1 / 3;
  place-items: center;
  border-radius: 9px;
  background: var(--ac-soft);
  color: var(--ac-blue);
}
.information-list dt {
  color: var(--ac-subtle);
  font-size: 8px;
  font-weight: 750;
}
.information-list dd {
  overflow: hidden;
  margin: 0;
  color: var(--ac-text);
  font-size: 10px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.information-list button {
  display: grid;
  width: 30px;
  height: 30px;
  grid-column: 3;
  grid-row: 1 / 3;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ac-muted);
}
.information-list button:hover {
  background: var(--ac-soft);
  color: var(--ac-blue);
}
.copy-status {
  min-height: 14px;
  margin: 2px 0 0;
  color: var(--ac-green);
  font-size: 8px;
}
.quick-action-grid {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}
.quick-action {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--ac-border);
  border-radius: 13px;
  padding: 12px;
  color: var(--ac-text);
  text-decoration: none;
  transition:
    transform 200ms ease,
    border-color 200ms ease,
    box-shadow 200ms ease;
}
.quick-action:hover {
  border-color: #b9d3f9;
  box-shadow: 0 18px 30px -28px rgba(16, 32, 51, 0.6);
  transform: translateY(-4px);
}
.quick-action strong,
.quick-action small {
  display: block;
}
.quick-action strong {
  font-size: 10px;
}
.quick-action small {
  margin-top: 4px;
  color: var(--ac-muted);
  font-size: 8px;
  line-height: 1.45;
}
.quick-action > ion-icon {
  color: var(--ac-muted);
}
.verification-layout {
  display: grid;
  gap: 18px;
  margin-top: 18px;
}
.verification-timeline {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}
.verification-timeline li {
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 9px;
  padding-bottom: 18px;
}
.verification-timeline li:not(:last-child)::after {
  position: absolute;
  top: 27px;
  bottom: 0;
  left: 13px;
  width: 2px;
  background: var(--ac-border);
  content: '';
}
.verification-timeline li > span {
  position: relative;
  z-index: 1;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid var(--ac-border);
  border-radius: 50%;
  background: var(--ac-surface);
  color: #b6c0cb;
}
.verification-timeline strong,
.verification-timeline small {
  display: block;
}
.verification-timeline strong {
  font-size: 10px;
}
.verification-timeline small {
  margin-top: 3px;
  color: var(--ac-muted);
  font-size: 8px;
  line-height: 1.4;
}
.verification-timeline li.complete > span {
  border-color: #a9e0c7;
  background: var(--ac-green-soft);
  color: var(--ac-green);
}
.verification-timeline li.current > span {
  border-color: #9ec3fa;
  background: var(--ac-blue-soft);
  color: var(--ac-blue);
}
.verification-timeline li.rejected > span {
  border-color: #f5b6c3;
  background: var(--ac-red-soft);
  color: var(--ac-red);
}
.verification-guidance {
  border-left: 1px solid var(--ac-border);
  padding-left: 18px;
}
.verification-guidance h3 {
  margin: 0;
  font-size: 13px;
}
.verification-guidance p {
  margin: 7px 0 0;
  color: var(--ac-muted);
  font-size: 9px;
  line-height: 1.6;
}
.verification-guidance ul {
  margin: 10px 0 14px;
  padding-left: 17px;
  color: var(--ac-muted);
  font-size: 8px;
  line-height: 1.7;
}
.role-panel > p {
  margin: 14px 0 0;
  color: var(--ac-muted);
  font-size: 10px;
  line-height: 1.65;
}
.role-panel > ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 14px 0;
  padding: 0;
  list-style: none;
}
.role-panel > ul li {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ac-muted);
  font-size: 9px;
}
.role-panel > ul ion-icon {
  flex: 0 0 auto;
  color: var(--ac-green);
  font-size: 15px;
}
.settings-grid {
  display: grid;
  gap: 0 18px;
  margin-top: 14px;
}
.setting-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  border-top: 1px solid var(--ac-border);
  padding: 12px 0;
  color: var(--ac-text);
  text-decoration: none;
}
.setting-item > ion-icon:first-child {
  color: var(--ac-blue);
  font-size: 18px;
}
.setting-item strong,
.setting-item small {
  display: block;
}
.setting-item strong {
  font-size: 9px;
}
.setting-item small {
  margin-top: 3px;
  color: var(--ac-muted);
  font-size: 8px;
}
.activity-list {
  display: grid;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}
.activity-list li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--ac-border);
  padding: 12px 0;
}
.activity-list li > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background: var(--ac-blue-soft);
  color: var(--ac-blue);
}
.activity-list strong,
.activity-list small {
  display: block;
}
.activity-list strong {
  font-size: 9px;
}
.activity-list small {
  margin-top: 3px;
  color: var(--ac-muted);
  font-size: 8px;
}
.activity-list time {
  color: var(--ac-subtle);
  font-size: 8px;
}
.empty-data-note {
  margin: 4px 0 0;
  border-radius: 10px;
  background: var(--ac-soft);
  padding: 10px 12px;
  color: var(--ac-muted);
  font-size: 8px;
  line-height: 1.5;
}
.developer-mode {
  overflow: hidden;
}
.developer-mode summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  cursor: pointer;
  list-style: none;
}
.developer-mode summary::-webkit-details-marker {
  display: none;
}
.developer-mode summary strong,
.developer-mode summary small {
  display: block;
}
.developer-mode summary strong {
  font-size: 10px;
}
.developer-mode summary small {
  margin-top: 3px;
  color: var(--ac-muted);
  font-size: 8px;
}
.developer-mode[open] summary > ion-icon {
  transform: rotate(180deg);
}
.developer-mode__content {
  display: grid;
  gap: 14px;
  border-top: 1px solid var(--ac-border);
  padding: 16px;
}
.role-switcher {
  border-radius: 14px;
  background: var(--ac-blue-soft);
  padding: 14px;
}
.role-switcher h3 {
  margin: 0;
  font-size: 11px;
}
.role-switcher p {
  margin: 5px 0 0;
  color: var(--ac-muted);
  font-size: 8px;
}
.role-switcher > div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.role-switcher button {
  min-height: 34px;
  border: 1px solid #b9d4fb;
  border-radius: 10px;
  background: var(--ac-surface);
  padding: 0 10px;
  color: var(--ac-blue);
  font-size: 8px;
  font-weight: 800;
  text-transform: capitalize;
}
.role-switcher button.active {
  border-color: var(--ac-blue);
  background: var(--ac-blue);
  color: #fff;
}
.logout-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
}
.logout-panel h2 {
  margin: 0;
  font-size: 14px;
}
.logout-panel p {
  margin: 5px 0 0;
  color: var(--ac-muted);
  font-size: 9px;
}
.logout-panel button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 7px;
  border: 1px solid #f5b5c2;
  border-radius: 11px;
  background: var(--ac-red-soft);
  padding: 0 15px;
  color: var(--ac-red);
  font-size: 9px;
  font-weight: 850;
}
.logout-panel button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.account-summary {
  display: block;
}
.account-summary__sticky {
  overflow: hidden;
}
.account-summary__sticky > section {
  padding: 18px;
}
.account-summary__sticky > section + section {
  border-top: 1px solid var(--ac-border);
}
.account-summary__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.account-summary__topline > p {
  margin: 0;
  color: var(--ac-blue);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.icon-only {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--ac-border);
  border-radius: 9px;
  color: var(--ac-text);
}
.account-summary section > .role-badge {
  margin-top: 10px;
}
.account-summary section > p {
  margin: 12px 0 14px;
  color: var(--ac-muted);
  font-size: 9px;
  line-height: 1.6;
}
.summary-metrics {
  display: grid;
}
.summary-metrics > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
}
.summary-metrics span {
  color: var(--ac-muted);
  font-size: 8px;
}
.summary-metrics strong {
  color: var(--ac-text);
  font-size: 9px;
  text-align: right;
}
.summary-security {
  display: flex;
  gap: 10px;
  background: var(--ac-green-soft);
}
.summary-security > span {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  background: #fff;
  color: var(--ac-green);
}
.summary-security strong,
.summary-security small {
  display: block;
}
.summary-security strong {
  font-size: 9px;
}
.summary-security small {
  margin-top: 3px;
  color: #44705c;
  font-size: 7px;
  line-height: 1.5;
}

@media (min-width: 640px) {
  .account-center__main {
    padding-inline: 18px;
  }
  .account-score-grid,
  .quick-action-grid,
  .settings-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .verification-layout {
    grid-template-columns: 0.85fr 1.15fr;
  }
  :deep(nav[aria-label='Primary navigation']) {
    display: none !important;
  }
}

@media (min-width: 1024px) {
  .account-center {
    display: grid;
    grid-template-columns: 205px minmax(0, 1fr);
    gap: 18px;
    padding: 14px 18px 28px;
  }
  .account-center__navigation,
  .account-center__main {
    padding: 0;
  }
}

@media (min-width: 1200px) {
  .account-layout {
    grid-template-columns: minmax(0, 1fr) 280px;
    align-items: start;
  }
  .account-summary {
    display: block;
  }
  .account-summary__sticky {
    position: sticky;
    top: 16px;
  }
}

@media (max-width: 639px) {
  .account-center__navigation {
    display: none;
  }
  .account-center__main {
    padding-top: 10px;
  }
  .account-hero {
    min-height: 158px;
    padding: 20px;
  }
  .account-hero h1 {
    font-size: 29px;
  }
  .account-hero__copy > span {
    max-width: 290px;
    font-size: 10px;
  }
  .account-hero__art {
    right: -45px;
    opacity: 0.34;
  }
  .profile-overview {
    align-items: flex-start;
  }
  .profile-overview__identity {
    align-items: flex-start;
  }
  .profile-avatar {
    width: 65px;
    height: 65px;
    border-radius: 20px;
    font-size: 21px;
  }
  .profile-overview h2 {
    font-size: 17px;
  }
  .icon-command {
    width: 38px;
    padding: 0;
  }
  .icon-command span {
    display: none;
  }
  .account-panel {
    padding: 16px;
  }
  .check-list,
  .information-list,
  .role-panel > ul {
    grid-template-columns: 1fr;
  }
  .information-list > div:first-child {
    border-top: 0;
  }
  .section-heading {
    align-items: flex-start;
  }
  .text-command {
    max-width: 110px;
    text-align: right;
  }
  .verification-guidance {
    border-top: 1px solid var(--ac-border);
    border-left: 0;
    padding-top: 15px;
    padding-left: 0;
  }
  .logout-panel {
    align-items: stretch;
    flex-direction: column;
  }
  .logout-panel button {
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-avatar,
  .completion-inline i,
  .score-progress span,
  .quick-action,
  .icon-command,
  .primary-command,
  .secondary-command {
    transition: none;
  }
}

:global(.dark) .account-center {
  --ac-bg: #0b1420;
  --ac-surface: #111c2a;
  --ac-soft: #182638;
  --ac-text: #f7f9fc;
  --ac-muted: #b6c3d2;
  --ac-subtle: #8797aa;
  --ac-border: #2a394b;
  --ac-blue: #67a6f5;
  --ac-blue-soft: #162942;
  --ac-green: #54d39a;
  --ac-green-soft: #153126;
  --ac-amber: #f0bd61;
  --ac-amber-soft: #302718;
  --ac-red: #ff9aae;
  --ac-red-soft: #341d26;
}
:global(.dark) .account-hero {
  background: linear-gradient(110deg, #111c2a, #13243a);
}
:global(.dark) .summary-security > span {
  background: #203b2e;
}
</style>
