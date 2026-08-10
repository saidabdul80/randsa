<template>
  <AuthHubLayout>
    <section class="auth-card" aria-labelledby="auth-card-title">
      <div
        v-if="activeMode !== 'profile'"
        class="auth-mode-tabs"
        role="tablist"
        aria-label="Authentication mode"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeMode === 'sign-in'"
          :class="{ 'auth-mode-tab--active': activeMode === 'sign-in' }"
          @click="setMode('sign-in')"
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeMode === 'register'"
          :class="{ 'auth-mode-tab--active': activeMode === 'register' }"
          @click="setMode('register')"
        >
          Create account
        </button>
      </div>

      <AuthAlert v-if="isLocalAuthBypassEnabled" tone="info" role="status">
        Local auth bypass is enabled. Use accounts created in this browser.
      </AuthAlert>
      <AuthAlert v-else-if="firebaseConfigError" tone="warning" role="alert">
        {{ firebaseConfigError }}. Add the values from `.env.example` before testing authentication.
      </AuthAlert>

      <Transition name="auth-mode" mode="out-in">
        <div :key="activeMode" class="auth-mode-content">
          <template v-if="activeMode === 'sign-in'">
            <header class="auth-card-header">
              <span class="auth-card-icon"
                ><IonIcon :icon="logInOutline" aria-hidden="true"
              /></span>
              <div>
                <h2 id="auth-card-title">Welcome back <span aria-hidden="true">&#128075;</span></h2>
                <p>Sign in to continue to your RANDSA account.</p>
              </div>
            </header>

            <form class="auth-form" novalidate @submit.prevent="handleLoginSubmit">
              <AuthField
                v-model="loginForm.email"
                label="Email address"
                name="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                :icon="mailOutline"
                :disabled="isBusy"
                required
                :describedby="statusMessage ? 'auth-status-message' : undefined"
              />
              <AuthField
                v-model="loginForm.password"
                label="Password"
                name="password"
                type="password"
                autocomplete="current-password"
                :icon="lockClosedOutline"
                :disabled="isBusy"
                required
                :describedby="statusMessage ? 'auth-status-message' : undefined"
              />

              <AuthAlert
                v-if="statusMessage"
                id="auth-status-message"
                :tone="statusTone"
                :role="statusTone === 'error' ? 'alert' : 'status'"
                aria-live="polite"
              >
                {{ statusMessage }}
              </AuthAlert>

              <button type="submit" class="auth-primary-button" :disabled="isBusy">
                <IonIcon
                  :icon="isSubmitting ? syncOutline : lockClosedOutline"
                  :class="{ 'auth-spinner': isSubmitting }"
                  aria-hidden="true"
                />
                {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
              </button>
            </form>

            <div class="auth-divider" aria-hidden="true"><span>OR</span></div>

            <div class="auth-provider-actions">
              <button
                type="button"
                class="auth-google-button"
                :disabled="googleDisabled"
                @click="handleGoogleLogin"
              >
                <span class="google-mark" aria-hidden="true">G</span>
                {{ isGoogleSubmitting ? 'Connecting to Google...' : 'Continue with Google' }}
              </button>
              <button
                type="button"
                class="auth-redirect-button"
                :disabled="googleDisabled"
                @click="handleGoogleRedirectLogin"
              >
                <IonIcon :icon="openOutline" aria-hidden="true" />
                {{
                  isGoogleSubmitting ? 'Switching to redirect...' : 'Use Google redirect instead'
                }}
              </button>
            </div>

            <AuthAlert
              v-if="googleHelperMessage"
              class="auth-google-message"
              tone="warning"
              role="status"
              aria-live="polite"
            >
              {{ googleHelperMessage }}
            </AuthAlert>

            <p class="auth-switch-copy">
              Don&apos;t have an account?
              <button type="button" @click="setMode('register')">
                Create account
                <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
              </button>
            </p>
          </template>

          <template v-else-if="activeMode === 'register'">
            <header class="auth-card-header">
              <span class="auth-card-icon"
                ><IonIcon :icon="personAddOutline" aria-hidden="true"
              /></span>
              <div>
                <h2 id="auth-card-title">Create your account</h2>
                <p>Create one account to discover, post, book, and manage rentals.</p>
              </div>
            </header>

            <form
              class="auth-form auth-register-form"
              novalidate
              @submit.prevent="handleRegisterSubmit"
            >
              <div class="auth-form-grid">
                <AuthField
                  v-model="registerForm.fullName"
                  label="Full name"
                  name="name"
                  autocomplete="name"
                  :icon="personOutline"
                  :disabled="isBusy"
                  required
                  :describedby="statusMessage ? 'auth-status-message' : undefined"
                />
                <AuthField
                  v-model="registerForm.phone"
                  label="Phone number"
                  name="phone"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel"
                  :icon="callOutline"
                  :disabled="isBusy"
                  required
                  :describedby="statusMessage ? 'auth-status-message' : undefined"
                />
                <AuthField
                  v-model="registerForm.email"
                  class="auth-field-wide"
                  label="Email address"
                  name="email"
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  :icon="mailOutline"
                  :disabled="isBusy"
                  required
                  :describedby="statusMessage ? 'auth-status-message' : undefined"
                />
                <AuthField
                  v-model="registerForm.password"
                  label="Password"
                  name="new-password"
                  type="password"
                  autocomplete="new-password"
                  :icon="lockClosedOutline"
                  :disabled="isBusy"
                  required
                  :describedby="statusMessage ? 'auth-status-message' : undefined"
                />
                <AuthField
                  v-model="confirmPassword"
                  label="Confirm password"
                  name="confirm-password"
                  type="password"
                  autocomplete="new-password"
                  :icon="lockClosedOutline"
                  :disabled="isBusy"
                  required
                  :describedby="statusMessage ? 'auth-status-message' : undefined"
                />
              </div>

              <label class="auth-terms">
                <input v-model="acceptTerms" type="checkbox" :disabled="isBusy" required />
                <span>I agree to the RANDSA terms of use and privacy policy.</span>
              </label>

              <AuthAlert
                v-if="statusMessage"
                id="auth-status-message"
                :tone="statusTone"
                :role="statusTone === 'error' ? 'alert' : 'status'"
                aria-live="polite"
              >
                {{ statusMessage }}
              </AuthAlert>

              <button type="submit" class="auth-primary-button" :disabled="isBusy">
                <IonIcon
                  :icon="isSubmitting ? syncOutline : personAddOutline"
                  :class="{ 'auth-spinner': isSubmitting }"
                  aria-hidden="true"
                />
                {{ isSubmitting ? 'Creating account...' : 'Create account' }}
              </button>
            </form>

            <div class="auth-divider" aria-hidden="true"><span>OR</span></div>

            <div class="auth-provider-actions">
              <button
                type="button"
                class="auth-google-button"
                :disabled="googleDisabled"
                @click="handleGoogleRegister"
              >
                <span class="google-mark" aria-hidden="true">G</span>
                {{ isGoogleSubmitting ? 'Connecting to Google...' : 'Continue with Google' }}
              </button>
              <button
                type="button"
                class="auth-redirect-button"
                :disabled="googleDisabled"
                @click="handleGoogleRedirectRegister"
              >
                <IonIcon :icon="openOutline" aria-hidden="true" />
                {{
                  isGoogleSubmitting ? 'Switching to redirect...' : 'Use Google redirect instead'
                }}
              </button>
            </div>

            <AuthAlert
              v-if="googleHelperMessage"
              class="auth-google-message"
              tone="warning"
              role="status"
              aria-live="polite"
            >
              {{ googleHelperMessage }}
            </AuthAlert>

            <p class="auth-switch-copy">
              Already have an account?
              <button type="button" @click="setMode('sign-in')">
                Sign in
                <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
              </button>
            </p>
          </template>

          <template v-else>
            <header class="auth-card-header">
              <span class="auth-card-icon"
                ><IonIcon :icon="personCircleOutline" aria-hidden="true"
              /></span>
              <div>
                <h2 id="auth-card-title">Complete your account</h2>
                <p>Finish the account details required by the existing RANDSA setup flow.</p>
              </div>
            </header>

            <AuthAlert tone="info" role="status">
              You are already signed in. Saving this form updates your existing account details
              instead of creating another account.
            </AuthAlert>

            <form class="auth-form" novalidate @submit.prevent="handleProfileCompletion">
              <div class="auth-form-grid">
                <AuthField
                  v-model="registerForm.fullName"
                  label="Full name"
                  name="name"
                  autocomplete="name"
                  :icon="personOutline"
                  :disabled="isProfileSubmitting"
                  required
                />
                <AuthField
                  v-model="registerForm.phone"
                  label="Phone number"
                  name="phone"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel"
                  :icon="callOutline"
                  :disabled="isProfileSubmitting"
                  required
                />
                <AuthField
                  v-model="registerForm.email"
                  class="auth-field-wide"
                  label="Email address"
                  name="email"
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  :icon="mailOutline"
                  disabled
                />
              </div>

              <AuthAlert
                v-if="statusMessage"
                id="auth-status-message"
                :tone="statusTone"
                :role="statusTone === 'error' ? 'alert' : 'status'"
                aria-live="polite"
              >
                {{ statusMessage }}
              </AuthAlert>

              <button type="submit" class="auth-primary-button" :disabled="isProfileSubmitting">
                <IonIcon
                  :icon="isProfileSubmitting ? syncOutline : checkmarkCircleOutline"
                  :class="{ 'auth-spinner': isProfileSubmitting }"
                  aria-hidden="true"
                />
                {{ isProfileSubmitting ? 'Saving account...' : 'Save account' }}
              </button>
            </form>
          </template>
        </div>
      </Transition>
    </section>
  </AuthHubLayout>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  arrowForwardOutline,
  callOutline,
  checkmarkCircleOutline,
  lockClosedOutline,
  logInOutline,
  mailOutline,
  openOutline,
  personAddOutline,
  personCircleOutline,
  personOutline,
  syncOutline,
} from 'ionicons/icons'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { rehydrateAuthState, useAuth } from '../../composables/useAuth'
import { firebaseConfigError, isLocalAuthBypassEnabled } from '../../lib/firebase'
import {
  consumeGoogleRedirectReturnTo,
  getPendingGoogleAuthMessage,
  loginUser,
  registerUser,
  signInWithGoogle,
  startGoogleRedirectSignIn,
  toDisplayError,
  updateUserProfileDetails,
} from '../../services/auth'
import { sanitizeInternalRedirect } from '../../utils/navigation'
import AuthAlert from './AuthAlert.vue'
import AuthField from './AuthField.vue'
import AuthHubLayout from './AuthHubLayout.vue'

type GuestAuthMode = 'sign-in' | 'register'
type AuthMode = GuestAuthMode | 'profile'

const props = withDefaults(
  defineProps<{
    initialMode?: GuestAuthMode
    allowProfileCompletion?: boolean
  }>(),
  {
    initialMode: 'sign-in',
    allowProfileCompletion: false,
  }
)

const route = useRoute()
const router = useRouter()
const { isAuthenticated, state } = useAuth()

const activeMode = ref<AuthMode>(props.initialMode)
const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({
  fullName: '',
  phone: '',
  email: '',
  password: '',
})
const confirmPassword = ref('')
const acceptTerms = ref(false)
const isSubmitting = ref(false)
const isGoogleSubmitting = ref(false)
const isProfileSubmitting = ref(false)
const statusMessage = ref('')
const statusTone = ref<'error' | 'success'>('error')
const isRedirectingAfterGoogle = ref(false)
const googleHelperMessage = ref(getPendingGoogleAuthMessage())

const profile = computed(() => state.profile)
const isBusy = computed(() => isSubmitting.value || isGoogleSubmitting.value)
const googleDisabled = computed(
  () => isBusy.value || isLocalAuthBypassEnabled || Boolean(firebaseConfigError)
)

watch(
  () => props.initialMode,
  (mode) => {
    if (!isAuthenticated.value) activeMode.value = mode
  }
)

watch(
  () => isAuthenticated.value,
  (authenticated) => {
    if (authenticated && props.allowProfileCompletion) {
      activeMode.value = 'profile'
    } else if (!authenticated && activeMode.value === 'profile') {
      activeMode.value = props.initialMode
    }
  },
  { immediate: true }
)

watch(
  () => profile.value,
  (value) => {
    if (!value) return
    registerForm.fullName = value.fullName || state.user?.displayName || ''
    registerForm.phone = value.phone || ''
    registerForm.email = value.email || state.user?.email || ''
  },
  { immediate: true }
)

watch(
  () => state.user?.uid,
  async (userId) => {
    const redirectTarget = consumeGoogleRedirectReturnTo()

    if (!userId || !redirectTarget || isRedirectingAfterGoogle.value) return

    isRedirectingAfterGoogle.value = true
    statusTone.value = 'success'
    statusMessage.value = 'Google sign-in completed. Redirecting...'
    await router.replace(sanitizeInternalRedirect(redirectTarget))
  },
  { immediate: true }
)

function setMode(mode: GuestAuthMode) {
  if (isBusy.value) return
  activeMode.value = mode
  statusMessage.value = ''
  refreshGoogleHelperMessage()

  if (mode === 'register' && !registerForm.email && loginForm.email) {
    registerForm.email = loginForm.email
  }

  if (mode === 'sign-in' && !loginForm.email && registerForm.email) {
    loginForm.email = registerForm.email
  }
}

function refreshGoogleHelperMessage() {
  googleHelperMessage.value = getPendingGoogleAuthMessage()
}

function loginRedirect() {
  return sanitizeInternalRedirect(route.query.redirect)
}

async function handleLoginSubmit() {
  if (isBusy.value) return
  statusMessage.value = ''

  if (!loginForm.email.trim() || !loginForm.password) {
    statusTone.value = 'error'
    statusMessage.value = 'Enter your email and password to continue.'
    return
  }

  isSubmitting.value = true

  try {
    await loginUser(loginForm.email, loginForm.password)
    await rehydrateAuthState()
    statusTone.value = 'success'
    statusMessage.value = 'Login successful. Redirecting...'
    await router.replace(loginRedirect())
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
  } finally {
    isSubmitting.value = false
  }
}

async function handleRegisterSubmit() {
  if (isBusy.value) return
  statusMessage.value = ''

  if (
    !registerForm.fullName.trim() ||
    !registerForm.phone.trim() ||
    !registerForm.email.trim() ||
    !registerForm.password
  ) {
    statusTone.value = 'error'
    statusMessage.value = 'Fill in your full name, phone, email, and password.'
    return
  }

  if (registerForm.password.length < 6) {
    statusTone.value = 'error'
    statusMessage.value = 'Password must be at least 6 characters long.'
    return
  }

  if (registerForm.password !== confirmPassword.value) {
    statusTone.value = 'error'
    statusMessage.value = 'Password confirmation does not match.'
    return
  }

  if (!acceptTerms.value) {
    statusTone.value = 'error'
    statusMessage.value = 'Accept the terms and privacy policy before creating your account.'
    return
  }

  isSubmitting.value = true

  try {
    await registerUser({ ...registerForm, acceptTerms: acceptTerms.value })
    await rehydrateAuthState()
    statusTone.value = 'success'
    statusMessage.value = 'Account created successfully. Redirecting...'
    await router.replace('/home')
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
  } finally {
    isSubmitting.value = false
  }
}

async function handleGoogleLogin() {
  if (isBusy.value) return
  statusMessage.value = ''
  isGoogleSubmitting.value = true
  refreshGoogleHelperMessage()

  try {
    const googleProfile = await signInWithGoogle({ returnTo: loginRedirect(), source: 'login' })

    if (!googleProfile) {
      statusTone.value = 'success'
      statusMessage.value =
        'Google popup sign-in could not finish, so RANDSA is switching to redirect mode now...'
      refreshGoogleHelperMessage()
      return
    }

    await rehydrateAuthState()
    refreshGoogleHelperMessage()
    statusTone.value = 'success'
    statusMessage.value = 'Google sign-in successful. Redirecting...'
    await router.replace(loginRedirect())
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error, 'google')
    refreshGoogleHelperMessage()
  } finally {
    isGoogleSubmitting.value = false
  }
}

async function handleGoogleRedirectLogin() {
  if (isBusy.value) return
  statusTone.value = 'success'
  statusMessage.value = 'Switching to Google redirect sign-in...'
  isGoogleSubmitting.value = true
  refreshGoogleHelperMessage()

  try {
    await startGoogleRedirectSignIn({ returnTo: loginRedirect(), source: 'login' })
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error, 'google')
    refreshGoogleHelperMessage()
    isGoogleSubmitting.value = false
  }
}

async function handleGoogleRegister() {
  if (isBusy.value) return
  statusMessage.value = ''

  if (!acceptTerms.value) {
    statusTone.value = 'error'
    statusMessage.value = 'Accept the terms and privacy policy before creating your account.'
    return
  }

  isGoogleSubmitting.value = true
  refreshGoogleHelperMessage()

  try {
    const googleProfile = await signInWithGoogle({
      phone: registerForm.phone,
      acceptedTerms: true,
      returnTo: '/home',
      source: 'register',
    })

    if (!googleProfile) {
      statusTone.value = 'success'
      statusMessage.value =
        'Google popup sign-in could not finish, so RANDSA is switching to redirect mode now...'
      refreshGoogleHelperMessage()
      return
    }

    await rehydrateAuthState()
    refreshGoogleHelperMessage()
    statusTone.value = 'success'
    statusMessage.value = 'Google sign-in successful. Redirecting...'
    await router.replace('/home')
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error, 'google')
    refreshGoogleHelperMessage()
  } finally {
    isGoogleSubmitting.value = false
  }
}

async function handleGoogleRedirectRegister() {
  if (isBusy.value) return

  if (!acceptTerms.value) {
    statusTone.value = 'error'
    statusMessage.value = 'Accept the terms and privacy policy before creating your account.'
    return
  }

  statusTone.value = 'success'
  statusMessage.value = 'Switching to Google redirect sign-in...'
  isGoogleSubmitting.value = true
  refreshGoogleHelperMessage()

  try {
    await startGoogleRedirectSignIn({
      phone: registerForm.phone,
      acceptedTerms: true,
      returnTo: '/home',
      source: 'register',
    })
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error, 'google')
    refreshGoogleHelperMessage()
    isGoogleSubmitting.value = false
  }
}

async function handleProfileCompletion() {
  if (isProfileSubmitting.value) return
  statusMessage.value = ''

  if (!profile.value) {
    statusTone.value = 'error'
    statusMessage.value =
      'Your signed-in account is still loading. Please wait a moment and try again.'
    return
  }

  isProfileSubmitting.value = true

  try {
    await updateUserProfileDetails(profile.value.uid, {
      fullName: registerForm.fullName,
      phone: registerForm.phone,
    })
    await rehydrateAuthState()
    statusTone.value = 'success'
    statusMessage.value = 'Account updated successfully. Redirecting to Account Center...'
    await router.replace('/profile')
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
  } finally {
    isProfileSubmitting.value = false
  }
}
</script>

<style scoped>
.auth-card {
  width: min(680px, 100%);
  border: 1px solid var(--auth-border);
  border-radius: 20px;
  background: var(--auth-surface);
  padding: 28px 36px 32px;
  box-shadow: 0 24px 62px -44px rgba(16, 32, 51, 0.55);
}

.auth-mode-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 22px;
  border: 1px solid var(--auth-border);
  border-radius: 12px;
  background: var(--auth-hover);
  padding: 4px;
}

.auth-mode-tabs button {
  min-height: 38px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--auth-muted);
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  transition:
    background-color 190ms ease,
    color 190ms ease,
    box-shadow 190ms ease;
}

.auth-mode-tabs .auth-mode-tab--active {
  background: var(--auth-surface);
  color: var(--auth-blue);
  box-shadow: 0 8px 18px -14px rgba(16, 32, 51, 0.65);
}

.auth-card > .auth-alert + .auth-mode-content {
  margin-top: 18px;
}

.auth-card-header {
  display: flex;
  align-items: flex-start;
  gap: 13px;
}

.auth-card-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  background: var(--auth-hover);
  color: var(--auth-blue);
  font-size: 21px;
}

.auth-card-header h2 {
  margin: 0;
  color: var(--auth-text);
  font-family: 'Space Grotesk', 'Manrope', sans-serif;
  font-size: 23px;
  font-weight: 850;
  letter-spacing: 0;
}

.auth-card-header p {
  margin: 7px 0 0;
  color: var(--auth-muted);
  font-size: 11px;
  line-height: 1.55;
}

.auth-form {
  display: grid;
  gap: 15px;
  margin-top: 24px;
}

.auth-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.auth-field-wide {
  grid-column: 1 / -1;
}

.auth-primary-button,
.auth-google-button,
.auth-redirect-button {
  display: inline-flex;
  width: 100%;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border-radius: 12px;
  padding: 0 16px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 200ms ease,
    box-shadow 200ms ease,
    border-color 200ms ease,
    background-color 200ms ease,
    color 200ms ease;
}

.auth-primary-button {
  border: 1px solid var(--auth-blue);
  background: var(--auth-blue);
  color: #ffffff;
  box-shadow: 0 16px 28px -20px rgba(23, 105, 223, 0.8);
}

.auth-primary-button:hover:not(:disabled),
.auth-google-button:hover:not(:disabled),
.auth-redirect-button:hover:not(:disabled) {
  transform: translateY(-4px);
}

.auth-primary-button:hover:not(:disabled) {
  background: var(--auth-blue-dark);
  box-shadow: 0 20px 32px -18px rgba(23, 105, 223, 0.72);
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0;
  color: var(--auth-subtle);
  font-size: 8px;
  font-weight: 800;
}

.auth-divider::before,
.auth-divider::after {
  height: 1px;
  flex: 1 1 auto;
  background: var(--auth-border);
  content: '';
}

.auth-divider span {
  display: grid;
  width: 34px;
  height: 22px;
  place-items: center;
  border-radius: 11px;
  background: var(--auth-hover);
}

.auth-provider-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.78fr);
  gap: 9px;
}

.auth-google-button {
  border: 1px solid var(--auth-border);
  background: var(--auth-surface);
  color: var(--auth-text);
}

.auth-google-button:hover:not(:disabled) {
  border-color: #b8cee8;
  box-shadow: 0 16px 27px -22px rgba(16, 32, 51, 0.55);
}

.google-mark {
  color: #4285f4;
  font-family: Arial, sans-serif;
  font-size: 18px;
  font-weight: 800;
}

.auth-redirect-button {
  border: 1px dashed #9ebde2;
  background: transparent;
  color: var(--auth-blue);
}

.auth-redirect-button:hover:not(:disabled) {
  border-color: var(--auth-blue);
  background: var(--auth-hover);
}

.auth-primary-button:disabled,
.auth-google-button:disabled,
.auth-redirect-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
  box-shadow: none;
}

.auth-google-message {
  margin-top: 12px;
}

.auth-switch-copy {
  margin: 20px 0 0;
  color: var(--auth-muted);
  font-size: 10px;
  text-align: center;
}

.auth-switch-copy button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 4px;
  border: 0;
  background: transparent;
  padding: 4px;
  color: var(--auth-blue);
  font-size: inherit;
  font-weight: 800;
  cursor: pointer;
}

.auth-switch-copy button ion-icon {
  transition: transform 190ms ease;
}

.auth-switch-copy button:hover ion-icon {
  transform: translateX(3px);
}

.auth-terms {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--auth-muted);
  font-size: 10px;
  line-height: 1.5;
  cursor: pointer;
}

.auth-terms input {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  margin: 0;
  accent-color: var(--auth-blue);
}

.auth-spinner {
  animation: auth-spin 850ms linear infinite;
}

.auth-mode-enter-active,
.auth-mode-leave-active {
  transition:
    opacity 190ms ease,
    transform 190ms ease;
}

.auth-mode-enter-from {
  opacity: 0;
  transform: translateX(10px) scale(0.995);
}

.auth-mode-leave-to {
  opacity: 0;
  transform: translateX(-8px) scale(0.995);
}

@keyframes auth-spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-mode-tabs button:focus-visible,
.auth-primary-button:focus-visible,
.auth-google-button:focus-visible,
.auth-redirect-button:focus-visible,
.auth-switch-copy button:focus-visible,
.auth-terms input:focus-visible {
  outline: 3px solid var(--auth-focus);
  outline-offset: 2px;
}

@media (max-width: 680px) {
  .auth-card {
    border-radius: 16px;
    padding: 18px 16px 24px;
    box-shadow: 0 18px 40px -34px rgba(16, 32, 51, 0.55);
  }

  .auth-card-header h2 {
    font-size: 20px;
  }
  .auth-card-header p {
    font-size: 10px;
  }
  .auth-form-grid {
    grid-template-columns: 1fr;
  }
  .auth-field-wide {
    grid-column: auto;
  }
  .auth-provider-actions {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1024px) and (max-height: 760px) {
  .auth-card {
    padding: 18px 28px 20px;
  }

  .auth-mode-tabs {
    margin-bottom: 14px;
  }

  .auth-mode-tabs button {
    min-height: 34px;
  }

  .auth-card-header {
    gap: 10px;
  }

  .auth-card-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    font-size: 19px;
  }

  .auth-card-header h2 {
    font-size: 21px;
  }

  .auth-card-header p {
    margin-top: 4px;
    font-size: 9px;
  }

  .auth-form {
    gap: 10px;
    margin-top: 14px;
  }

  .auth-form-grid {
    gap: 8px;
  }

  .auth-card :deep(.auth-input-wrap) {
    height: 46px;
  }

  .auth-primary-button,
  .auth-google-button,
  .auth-redirect-button {
    min-height: 44px;
  }

  .auth-divider {
    margin: 11px 0;
  }

  .auth-switch-copy {
    margin-top: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-mode-enter-active,
  .auth-mode-leave-active,
  .auth-primary-button,
  .auth-google-button,
  .auth-redirect-button,
  .auth-switch-copy button ion-icon {
    transition: none;
  }

  .auth-spinner {
    animation: none;
  }
}
</style>
