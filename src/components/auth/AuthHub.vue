<template>
  <AuthHubLayout>
    <section class="auth-card" aria-labelledby="auth-card-title">
      <div
        v-if="activeMode === 'sign-in' || activeMode === 'register'"
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
                <h2 id="auth-card-title">Welcome back.</h2>
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

              <div class="auth-form-options">
                <label class="auth-remember">
                  <input v-model="rememberMe" type="checkbox" :disabled="isBusy" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  class="auth-link-button"
                  :disabled="isBusy"
                  @click="setMode('reset')"
                >
                  Forgot password?
                </button>
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
            </div>

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
            </div>

            <p class="auth-switch-copy">
              Already have an account?
              <button type="button" @click="setMode('sign-in')">
                Sign in
                <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
              </button>
            </p>
          </template>

          <template v-else-if="activeMode === 'reset'">
            <header class="auth-card-header">
              <span class="auth-card-icon"><IonIcon :icon="keyOutline" aria-hidden="true" /></span>
              <div>
                <h2 id="auth-card-title">Reset your password</h2>
                <p>Enter your account email and RANDSA will send you a secure reset link.</p>
              </div>
            </header>

            <form class="auth-form" novalidate @submit.prevent="handlePasswordResetSubmit">
              <AuthField
                v-model="resetEmail"
                label="Email address"
                name="reset-email"
                type="email"
                inputmode="email"
                autocomplete="email"
                :icon="mailOutline"
                :disabled="isResetSubmitting"
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

              <button type="submit" class="auth-primary-button" :disabled="isResetSubmitting">
                <IonIcon
                  :icon="isResetSubmitting ? syncOutline : mailOutline"
                  :class="{ 'auth-spinner': isResetSubmitting }"
                  aria-hidden="true"
                />
                {{ isResetSubmitting ? 'Sending reset link...' : 'Send reset link' }}
              </button>
            </form>

            <p class="auth-switch-copy">
              Remembered it?
              <button type="button" @click="setMode('sign-in')">
                Back to sign in
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
  keyOutline,
  lockClosedOutline,
  logInOutline,
  mailOutline,
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
  loginUser,
  registerUser,
  sendPasswordReset,
  setAuthPersistence,
  signInWithGoogle,
  toDisplayError,
  updateUserProfileDetails,
} from '../../services/auth'
import { sanitizeInternalRedirect } from '../../utils/navigation'
import AuthAlert from './AuthAlert.vue'
import AuthField from './AuthField.vue'
import AuthHubLayout from './AuthHubLayout.vue'

type GuestAuthMode = 'sign-in' | 'register'
type AuthMode = GuestAuthMode | 'reset' | 'profile'

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
const rememberMe = ref(true)
const resetEmail = ref('')
const isSubmitting = ref(false)
const isGoogleSubmitting = ref(false)
const isResetSubmitting = ref(false)
const isProfileSubmitting = ref(false)
const statusMessage = ref('')
const statusTone = ref<'error' | 'success'>('error')

const profile = computed(() => state.profile)
const isBusy = computed(
  () => isSubmitting.value || isGoogleSubmitting.value || isResetSubmitting.value
)
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

function setMode(mode: Exclude<AuthMode, 'profile'>) {
  if (isBusy.value) return
  activeMode.value = mode
  statusMessage.value = ''

  if (mode === 'register' && !registerForm.email && loginForm.email) {
    registerForm.email = loginForm.email
  }

  if (mode === 'sign-in' && !loginForm.email && registerForm.email) {
    loginForm.email = registerForm.email
  }

  if (mode === 'reset' && !resetEmail.value) {
    resetEmail.value = loginForm.email
  }

  if (mode === 'sign-in' && !loginForm.email && resetEmail.value) {
    loginForm.email = resetEmail.value
  }
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
    // Persistence has to be chosen before the sign-in so the credential is stored correctly.
    await setAuthPersistence(rememberMe.value)
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

async function handlePasswordResetSubmit() {
  if (isBusy.value) return
  statusMessage.value = ''

  if (!resetEmail.value.trim()) {
    statusTone.value = 'error'
    statusMessage.value = 'Enter the email address for your account.'
    return
  }

  isResetSubmitting.value = true

  try {
    await sendPasswordReset(resetEmail.value)
    statusTone.value = 'success'
    // Worded so it never confirms whether the address has an account.
    statusMessage.value = `If an account exists for ${resetEmail.value.trim()}, a reset link is on its way. Check your inbox and spam folder.`
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
  } finally {
    isResetSubmitting.value = false
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

  try {
    await signInWithGoogle({ returnTo: loginRedirect(), source: 'login' })
    await rehydrateAuthState()
    statusTone.value = 'success'
    statusMessage.value = 'Google sign-in successful. Redirecting...'
    await router.replace(loginRedirect())
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error, 'google')
  } finally {
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

  try {
    await signInWithGoogle({
      phone: registerForm.phone,
      acceptedTerms: true,
      returnTo: '/home',
      source: 'register',
    })
    await rehydrateAuthState()
    statusTone.value = 'success'
    statusMessage.value = 'Google sign-in successful. Redirecting...'
    await router.replace('/home')
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error, 'google')
  } finally {
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
/* On wide screens the form sits directly on the canvas: no card, no border, no shadow.
   It only becomes a panel once the plate stacks above it. */
.auth-card {
  width: 100%;
}

.auth-mode-tabs {
  display: flex;
  gap: 32px;
  border-bottom: 1px solid var(--auth-hairline);
  margin-bottom: 34px;
}

.auth-mode-tabs button {
  margin-bottom: -1px;
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  padding: 0 0 14px;
  color: var(--auth-subtle);
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    color 240ms ease,
    border-color 240ms ease;
}

.auth-mode-tabs button:hover {
  color: var(--auth-text);
}

.auth-mode-tabs .auth-mode-tab--active {
  border-bottom-color: var(--auth-blue);
  color: var(--auth-text);
}

.auth-card > .auth-alert + .auth-mode-content {
  margin-top: 20px;
}

.auth-card-header {
  display: flex;
  align-items: flex-start;
  gap: 13px;
}

/* The serif headline carries the hierarchy on its own; the icon chip only crowded it. */
.auth-card-icon {
  display: none;
}

.auth-card-header h2 {
  margin: 0;
  color: var(--auth-text);
  font-family: 'Fraunces', 'Space Grotesk', serif;
  font-size: clamp(28px, 2.5vw, 38px);
  font-weight: 400;
  letter-spacing: -0.015em;
  line-height: 1.1;
  text-wrap: balance;
}

.auth-card-header p {
  max-width: 400px;
  margin: 14px 0 0;
  color: var(--auth-muted);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.75;
}

.auth-form {
  display: grid;
  gap: 18px;
  margin-top: 32px;
}

.auth-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.auth-field-wide {
  grid-column: 1 / -1;
}

.auth-form-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
}

.auth-remember {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--auth-muted);
  font-size: 11px;
  font-weight: 550;
  cursor: pointer;
}

.auth-remember input {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  accent-color: var(--auth-blue);
  cursor: pointer;
}

.auth-remember input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.auth-link-button {
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--auth-blue);
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: color 240ms ease;
}

.auth-link-button:hover:not(:disabled) {
  color: var(--auth-blue-dark);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-link-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.auth-primary-button,
.auth-google-button,
.auth-redirect-button {
  display: inline-flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 4px;
  padding: 0 18px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background-color 240ms ease,
    border-color 240ms ease,
    color 240ms ease,
    box-shadow 240ms ease;
}

.auth-primary-button {
  border: 1px solid var(--auth-primary-bg);
  background: var(--auth-primary-bg);
  color: var(--auth-primary-text);
}

.auth-primary-button:hover:not(:disabled) {
  border-color: var(--auth-primary-bg-hover);
  background: var(--auth-primary-bg-hover);
  box-shadow: 0 14px 30px -20px rgba(11, 14, 19, 0.85);
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 26px 0;
  color: var(--auth-subtle);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
}

.auth-divider::before,
.auth-divider::after {
  height: 1px;
  flex: 1 1 auto;
  background: var(--auth-hairline);
  content: '';
}

.auth-provider-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
  gap: 10px;
}

.auth-google-button,
.auth-redirect-button {
  border: 1px solid var(--auth-border);
  background: transparent;
  color: var(--auth-text);
}

.auth-google-button:hover:not(:disabled),
.auth-redirect-button:hover:not(:disabled) {
  border-color: var(--auth-blue);
  background: var(--auth-hover);
}

.google-mark {
  display: grid;
  width: 19px;
  height: 19px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background: var(--rd-surface);
  color: #4285f4;
  font-family: 'Space Grotesk', 'Manrope', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.auth-redirect-button {
  color: var(--auth-muted);
}

.auth-redirect-button ion-icon {
  font-size: 15px;
}

.auth-primary-button:disabled,
.auth-google-button:disabled,
.auth-redirect-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.auth-google-message {
  margin-top: 14px;
}

.auth-switch-copy {
  margin: 28px 0 0;
  color: var(--auth-muted);
  font-size: 11px;
  font-weight: 500;
}

.auth-switch-copy button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--auth-blue);
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: color 240ms ease;
}

.auth-switch-copy button:hover {
  color: var(--auth-blue-dark);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-switch-copy button ion-icon {
  font-size: 13px;
  transition: transform 240ms ease;
}

.auth-switch-copy button:hover ion-icon {
  transform: translateX(3px);
}

.auth-terms {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  color: var(--auth-muted);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.65;
  cursor: pointer;
}

.auth-terms input {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  accent-color: var(--auth-blue);
  cursor: pointer;
}

.auth-spinner {
  animation: auth-spin 900ms linear infinite;
}

@keyframes auth-spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-mode-enter-active,
.auth-mode-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms cubic-bezier(0.33, 0, 0.2, 1);
}

.auth-mode-enter-from {
  transform: translateY(8px);
  opacity: 0;
}

.auth-mode-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}

.auth-mode-tabs button:focus-visible,
.auth-primary-button:focus-visible,
.auth-google-button:focus-visible,
.auth-redirect-button:focus-visible,
.auth-switch-copy button:focus-visible,
.auth-link-button:focus-visible,
.auth-terms input:focus-visible,
.auth-remember input:focus-visible {
  outline: 2px solid var(--auth-focus-border);
  outline-offset: 3px;
}

/* Once the plate stacks above the form, the form needs its own surface again. */
@media (max-width: 1080px) {
  .auth-card {
    border: 1px solid var(--auth-hairline);
    border-radius: 6px;
    background: var(--auth-surface);
    padding: 30px 32px 34px;
  }
}

@media (max-width: 680px) {
  /* The card floats over the photo backdrop on phones, so it needs real lift. */
  .auth-card {
    border-color: var(--auth-border);
    padding: 24px 18px 28px;
    box-shadow: 0 30px 60px -30px rgba(5, 8, 13, 0.75);
  }

  .auth-mode-tabs {
    gap: 24px;
    margin-bottom: 26px;
  }

  .auth-card-header h2 {
    font-size: 26px;
  }

  .auth-card-header p {
    font-size: 11px;
  }

  .auth-form {
    margin-top: 24px;
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

  .auth-divider {
    margin: 20px 0;
  }
}

@media (min-width: 1081px) and (max-height: 820px) {
  .auth-mode-tabs {
    margin-bottom: 22px;
  }

  .auth-card-header h2 {
    font-size: 30px;
  }

  .auth-card-header p {
    margin-top: 10px;
  }

  .auth-form {
    gap: 13px;
    margin-top: 20px;
  }

  .auth-form-grid {
    gap: 10px;
  }

  .auth-card :deep(.auth-input-wrap) {
    height: 50px;
  }

  .auth-primary-button,
  .auth-google-button,
  .auth-redirect-button {
    min-height: 48px;
  }

  .auth-divider {
    margin: 16px 0;
  }

  .auth-switch-copy {
    margin-top: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-mode-enter-active,
  .auth-mode-leave-active,
  .auth-mode-tabs button,
  .auth-primary-button,
  .auth-google-button,
  .auth-redirect-button,
  .auth-link-button,
  .auth-switch-copy button,
  .auth-switch-copy button ion-icon {
    transition: none;
  }

  .auth-spinner {
    animation: none;
  }
}
</style>
