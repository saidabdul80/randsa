<template>
  <form class="property-wizard" @submit.prevent="handlePrimaryAction">
    <div class="property-wizard__progress" aria-label="Listing progress">
      <div class="property-wizard__progress-summary">
        <span>Step {{ currentStep }} of {{ steps.length }}</span>
        <strong>{{ progress }}% complete</strong>
      </div>
      <div class="property-wizard__progress-track" aria-hidden="true">
        <span :style="{ width: `${progress}%` }" />
      </div>
    </div>

    <div class="property-wizard__layout">
      <nav class="property-wizard__steps" aria-label="Listing form steps">
        <button
          v-for="step in steps"
          :key="step.number"
          type="button"
          :class="{
            active: currentStep === step.number,
            complete: currentStep > step.number,
            available: step.number <= highestVisited,
          }"
          :disabled="step.number > highestVisited"
          @click="goToVisitedStep(step.number)"
        >
          <span class="property-wizard__step-number">
            <IonIcon v-if="currentStep > step.number" :icon="checkmarkOutline" aria-hidden="true" />
            <span v-else>{{ step.number }}</span>
          </span>
          <span>
            <strong>{{ step.label }}</strong>
            <small>{{ step.description }}</small>
          </span>
        </button>
      </nav>

      <section class="property-wizard__stage" :aria-labelledby="`listing-step-${currentStep}`">
        <header class="property-wizard__stage-header">
          <span class="property-wizard__stage-icon">
            <IonIcon :icon="activeStep.icon" aria-hidden="true" />
          </span>
          <div>
            <p>Smart listing assistant</p>
            <h2 :id="`listing-step-${currentStep}`">{{ currentStep }}. {{ activeStep.label }}</h2>
            <span>{{ activeStep.longDescription }}</span>
          </div>
        </header>

        <div v-if="currentStep === 1" class="property-wizard__fields">
          <label class="field field--wide">
            <span>Listing title</span>
            <div class="field__with-action">
              <input
                v-model.trim="form.title"
                maxlength="120"
                placeholder="Example: Renovated 2-bedroom flat in Gwarimpa"
                autocomplete="off"
              />
              <button
                type="button"
                class="field__inline-button"
                :disabled="!titleSuggestion"
                title="Use a title based on the details entered"
                @click="applyTitleSuggestion"
              >
                <IonIcon :icon="sparklesOutline" aria-hidden="true" />
                Suggest
              </button>
            </div>
            <small v-if="titleSuggestion">Suggestion: {{ titleSuggestion }}</small>
          </label>

          <div v-if="classificationLocked" class="classification-summary field--wide">
            <span><IonIcon :icon="checkmarkCircleOutline" aria-hidden="true" /></span>
            <div>
              <small>Selected property type</small>
              <strong>{{ form.propertyType }}</strong>
            </div>
            <em>{{ config.shortLabel }}</em>
          </div>

          <template v-else>
            <label class="field">
              <span>Category</span>
              <select :value="form.category" @change="handleCategoryChange">
                <option
                  v-for="option in listingCategoryOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Listing type</span>
              <select :value="form.propertyType" @change="handlePropertyTypeChange">
                <option v-for="item in config.propertyTypes" :key="item" :value="item">
                  {{ item }}
                </option>
              </select>
            </label>
          </template>

          <label class="field field--wide">
            <span>Description</span>
            <textarea
              v-model="form.description"
              rows="7"
              maxlength="2000"
              placeholder="Describe what is being rented, its condition, location, and the terms a customer should know."
            />
            <span class="field__counter">{{ form.description.length }} / 2000</span>
          </label>

          <div class="assistant-panel field--wide">
            <div>
              <IonIcon :icon="bulbOutline" aria-hidden="true" />
              <span>
                <strong>Writing guide for {{ config.shortLabel.toLowerCase() }}</strong>
                Add only details that are true for this listing.
              </span>
            </div>
            <ul>
              <li v-for="prompt in config.descriptionPrompts" :key="prompt">{{ prompt }}</li>
            </ul>
            <button type="button" class="text-command" @click="insertDescriptionOutline">
              Insert editable outline
              <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div v-else-if="currentStep === 2" class="property-wizard__fields">
          <div class="currency-note field--wide">
            <span>Currency</span>
            <strong>NGN - Nigerian naira</strong>
            <small>All amounts use the project’s existing NGN pricing fields.</small>
          </div>

          <label v-for="moneyField in config.moneyFields" :key="moneyField.key" class="field">
            <span>{{ moneyField.label }}</span>
            <div class="field__money">
              <span>NGN</span>
              <input v-model.number="form[moneyField.key]" type="number" min="0" step="1" />
            </div>
            <small>{{ moneyField.help }}</small>
          </label>

          <label class="field">
            <span>Pricing unit</span>
            <select v-model="form.paymentDuration">
              <option v-for="duration in config.paymentDurations" :key="duration" :value="duration">
                {{ formatPaymentDuration(duration) }}
              </option>
            </select>
          </label>

          <label class="toggle-card">
            <input v-model="form.isAvailable" type="checkbox" />
            <span>
              <strong>Currently available</strong>
              <small>Customers can see the listing as available.</small>
            </span>
            <span class="toggle-card__switch" aria-hidden="true" />
          </label>

          <div class="pricing-summary field--wide">
            <span>
              <small>Entered charges</small>
              <strong>{{ formatNaira(enteredChargeTotal) }}</strong>
            </span>
            <p>
              This is an entry summary only. The existing payment and booking systems remain
              unchanged.
            </p>
          </div>
        </div>

        <div v-else-if="currentStep === 3" class="property-wizard__fields">
          <label class="field">
            <span>State</span>
            <input
              v-model.trim="form.state"
              autocomplete="address-level1"
              placeholder="Niger State"
            />
          </label>
          <label class="field">
            <span>City</span>
            <input v-model.trim="form.city" autocomplete="address-level2" placeholder="Minna" />
          </label>
          <label class="field">
            <span>Area</span>
            <input v-model.trim="form.area" autocomplete="address-level3" placeholder="Tunga" />
          </label>
          <label class="field">
            <span>Contact phone</span>
            <input
              v-model.trim="form.ownerPhone"
              type="tel"
              autocomplete="tel"
              placeholder="0800 000 0000"
            />
          </label>
          <label class="field field--wide">
            <span>Full address</span>
            <textarea
              v-model="form.address"
              rows="3"
              autocomplete="street-address"
              placeholder="Street, landmark, and other useful directions"
            />
          </label>

          <div class="map-actions field--wide">
            <button type="button" :disabled="isLocating" @click="useCurrentLocation">
              <IonIcon :icon="navigateOutline" aria-hidden="true" />
              {{ isLocating ? 'Finding location...' : 'Use current location' }}
            </button>
            <button
              type="button"
              :disabled="form.latitude === null || form.longitude === null"
              @click="copyCoordinates"
            >
              <IonIcon :icon="copyOutline" aria-hidden="true" />
              {{ coordinatesCopied ? 'Coordinates copied' : 'Copy coordinates' }}
            </button>
          </div>

          <div v-if="locationMessage" class="inline-message field--wide" role="status">
            {{ locationMessage }}
          </div>

          <div class="map-shell field--wide">
            <PropertyLocationPicker
              v-model:latitude="form.latitude"
              v-model:longitude="form.longitude"
              :address="form.address"
              :area="form.area"
              :city="form.city"
              :state="form.state"
            />
          </div>
        </div>

        <div v-else-if="currentStep === 4" class="property-wizard__fields">
          <template v-if="config.detailMode === 'residential'">
            <div v-for="room in roomFields" :key="room.key" class="stepper-field">
              <span>{{ room.label }}</span>
              <div>
                <button
                  type="button"
                  :aria-label="`Reduce ${room.label}`"
                  @click="adjustRoom(room.key, -1)"
                >
                  <IonIcon :icon="removeOutline" aria-hidden="true" />
                </button>
                <input v-model.number="form[room.key]" type="number" min="0" inputmode="numeric" />
                <button
                  type="button"
                  :aria-label="`Increase ${room.label}`"
                  @click="adjustRoom(room.key, 1)"
                >
                  <IonIcon :icon="addOutline" aria-hidden="true" />
                </button>
              </div>
            </div>

            <label v-for="feature in residentialFeatures" :key="feature.key" class="feature-card">
              <input v-model="form[feature.key]" type="checkbox" />
              <IonIcon :icon="feature.icon" aria-hidden="true" />
              <span>{{ feature.label }}</span>
              <IonIcon
                class="feature-card__check"
                :icon="checkmarkCircleOutline"
                aria-hidden="true"
              />
            </label>
          </template>

          <template v-else-if="config.detailMode === 'commercial'">
            <label class="field field--wide">
              <span>Space size</span>
              <input v-model.trim="form.shopSize" placeholder="Example: 120 sqm" />
              <small>Required for shop listings by the current property validation.</small>
            </label>
            <label v-for="feature in commercialFeatures" :key="feature.key" class="feature-card">
              <input v-model="form[feature.key]" type="checkbox" />
              <IonIcon :icon="feature.icon" aria-hidden="true" />
              <span>{{ feature.label }}</span>
              <IonIcon
                class="feature-card__check"
                :icon="checkmarkCircleOutline"
                aria-hidden="true"
              />
            </label>
          </template>

          <div v-else class="generic-detail-panel field--wide">
            <IonIcon :icon="optionsOutline" aria-hidden="true" />
            <div>
              <h3>{{ config.shortLabel }} details stay flexible</h3>
              <p>
                Use the description and amenity fields for the true category-specific details. This
                keeps your entry compatible with the project’s current Firebase property schema.
              </p>
              <ul>
                <li v-for="prompt in config.descriptionPrompts" :key="prompt">{{ prompt }}</li>
              </ul>
              <button type="button" class="text-command" @click="goToVisitedStep(1)">
                Improve description
                <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="currentStep === 5" class="amenities-stage">
          <div>
            <p class="section-label">Suggested for {{ config.shortLabel.toLowerCase() }}</p>
            <div class="chip-grid">
              <button
                v-for="amenity in config.suggestedAmenities"
                :key="amenity"
                type="button"
                :class="{ selected: hasAmenity(amenity) }"
                @click="toggleAmenity(amenity)"
              >
                <IonIcon
                  :icon="hasAmenity(amenity) ? checkmarkCircle : addCircleOutline"
                  aria-hidden="true"
                />
                {{ amenity }}
              </button>
            </div>
          </div>

          <div class="custom-amenity">
            <label class="field">
              <span>Add a custom amenity</span>
              <input
                v-model.trim="customAmenity"
                maxlength="60"
                placeholder="Enter an amenity"
                @keydown.enter.prevent="addCustomAmenity"
              />
            </label>
            <button type="button" :disabled="!customAmenity" @click="addCustomAmenity">
              <IonIcon :icon="addOutline" aria-hidden="true" />
              Add
            </button>
          </div>

          <div v-if="form.amenities.length" class="selected-amenities">
            <p class="section-label">Selected amenities</p>
            <div>
              <button
                v-for="amenity in form.amenities"
                :key="amenity"
                type="button"
                @click="removeAmenity(amenity)"
              >
                {{ amenity }}
                <IonIcon :icon="closeOutline" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="currentStep === 6" class="images-stage">
          <div class="image-guidance">
            <IonIcon :icon="cameraOutline" aria-hidden="true" />
            <div>
              <strong>Recommended shots</strong>
              <span v-for="guidance in config.imageGuidance" :key="guidance">{{ guidance }}</span>
            </div>
          </div>
          <PropertyImageUploader
            v-model="form.images"
            @processing-change="areImagesProcessing = $event"
          />
        </div>

        <div v-else-if="currentStep === 7" class="preview-stage">
          <div class="preview-stage__toolbar" aria-label="Preview size">
            <span>Preview size</span>
            <div>
              <button
                v-for="device in previewDevices"
                :key="device.value"
                type="button"
                :class="{ active: previewDevice === device.value }"
                :title="device.label"
                @click="previewDevice = device.value"
              >
                <IonIcon :icon="device.icon" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div class="preview-stage__canvas" :class="`is-${previewDevice}`">
            <PropertyListingPreview :value="formSnapshot" />
          </div>
        </div>

        <div v-else class="publish-stage">
          <div class="publish-stage__score" :class="quality.score >= 80 ? 'strong' : ''">
            <div>
              <span>{{ quality.score }}%</span>
              <small>listing quality</small>
            </div>
            <p>
              <strong>{{
                quality.missingRequired.length
                  ? 'A few required details remain.'
                  : 'Ready for final validation.'
              }}</strong>
              Publish uses the project’s existing validation, review status, Storage upload, and
              Firebase save flow.
            </p>
          </div>

          <div class="publish-stage__checks">
            <article
              v-for="check in quality.checks"
              :key="check.id"
              :class="{ complete: check.complete }"
            >
              <IonIcon
                :icon="check.complete ? checkmarkCircle : ellipseOutline"
                aria-hidden="true"
              />
              <span>
                <strong>{{ check.label }}</strong>
                <small>{{ check.complete ? 'Complete' : 'Needs attention' }}</small>
              </span>
            </article>
          </div>

          <div class="publish-stage__notice">
            <IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" />
            <span>
              <strong>Existing approval rules apply</strong>
              New listings remain pending until approved. Your account can continue managing the
              listing while it is under review.
            </span>
          </div>
        </div>

        <div v-if="errorMessage" class="property-wizard__error" role="alert">
          <IonIcon :icon="alertCircleOutline" aria-hidden="true" />
          <span>{{ errorMessage }}</span>
        </div>

        <footer class="property-wizard__actions">
          <button type="button" class="button button--quiet" @click="emit('cancel')">Cancel</button>
          <button
            type="button"
            class="button button--draft"
            :disabled="isSubmitting || areImagesProcessing"
            @click="emitDraft"
          >
            <IonIcon :icon="documentTextOutline" aria-hidden="true" />
            Save draft
          </button>
          <span class="property-wizard__actions-spacer" />
          <button
            v-if="currentStep > 1"
            type="button"
            class="button button--back"
            @click="moveBack"
          >
            <IonIcon :icon="arrowBackOutline" aria-hidden="true" />
            Back
          </button>
          <button
            type="submit"
            class="button button--primary"
            :disabled="isSubmitting || areImagesProcessing"
          >
            <span v-if="currentStep < steps.length">Save &amp; continue</span>
            <span v-else>{{ isSubmitting ? 'Creating listing...' : 'Publish listing' }}</span>
            <IonIcon
              :icon="currentStep < steps.length ? arrowForwardOutline : cloudUploadOutline"
              aria-hidden="true"
            />
          </button>
        </footer>
      </section>
    </div>
  </form>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  addCircleOutline,
  addOutline,
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  bulbOutline,
  businessOutline,
  cameraOutline,
  carOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkOutline,
  closeOutline,
  cloudUploadOutline,
  copyOutline,
  desktopOutline,
  documentTextOutline,
  ellipseOutline,
  eyeOutline,
  imagesOutline,
  laptopOutline,
  locationOutline,
  navigateOutline,
  optionsOutline,
  phonePortraitOutline,
  removeOutline,
  restaurantOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  walletOutline,
  waterOutline,
} from 'ionicons/icons'
import { computed, reactive, ref, watch } from 'vue'
import { confirmAction } from '../../composables/useConfirm'

import {
  getListingCategoryConfig,
  listingCategoryOptions,
  resolveListingFormConfig,
  type ListingDetailMode,
} from '../../config/listingFormConfig'
import { validatePropertyInput } from '../../services/properties'
import {
  createEmptyPropertyInput,
  type PaymentDuration,
  type PropertyCategory,
  type PropertyFormInput,
  type PropertyType,
} from '../../types/property'
import { resolveListingQuality } from '../../utils/listingQuality'
import PropertyLocationPicker from '../map/PropertyLocationPicker.vue'
import PropertyImageUploader from './PropertyImageUploader.vue'
import PropertyListingPreview from './PropertyListingPreview.vue'

const props = withDefaults(
  defineProps<{
    initialValue?: Partial<PropertyFormInput>
    initialStep?: number
    isSubmitting?: boolean
    classificationLocked?: boolean
  }>(),
  {
    initialValue: undefined,
    initialStep: 1,
    isSubmitting: false,
    classificationLocked: false,
  }
)

const emit = defineEmits<{
  submit: [value: PropertyFormInput]
  cancel: []
  'update:value': [value: PropertyFormInput]
  'step-change': [step: number]
  'save-draft': [value: PropertyFormInput, step: number]
}>()

type RoomField = 'bedrooms' | 'bathrooms' | 'toilets'
type BooleanField = Extract<
  keyof PropertyFormInput,
  | 'roadAccess'
  | 'marketArea'
  | 'electricityAvailability'
  | 'security'
  | 'waterAccess'
  | 'kitchen'
  | 'parking'
  | 'water'
  | 'electricity'
>
type PreviewDevice = 'desktop' | 'tablet' | 'phone'

const steps = [
  {
    number: 1,
    label: 'Listing basics',
    description: 'Category, title & description',
    longDescription: 'Tell customers what is available and choose the right rental category.',
    icon: documentTextOutline,
  },
  {
    number: 2,
    label: 'Pricing & terms',
    description: 'Rates, fees & availability',
    longDescription: 'Set the rental rate and the pricing unit already supported by RANDSA.',
    icon: walletOutline,
  },
  {
    number: 3,
    label: 'Location',
    description: 'Address & map pin',
    longDescription: 'Add the contact location and pin the real place on the existing map.',
    icon: locationOutline,
  },
  {
    number: 4,
    label: 'Adaptive details',
    description: 'Fields matched to category',
    longDescription: 'Complete the structured details supported for this category.',
    icon: optionsOutline,
  },
  {
    number: 5,
    label: 'Amenities',
    description: 'Useful listing features',
    longDescription: 'Select true features that help customers compare this rental.',
    icon: sparklesOutline,
  },
  {
    number: 6,
    label: 'Images',
    description: 'Cover & gallery',
    longDescription: 'Upload, optimize, reorder, and choose the cover image.',
    icon: imagesOutline,
  },
  {
    number: 7,
    label: 'Preview',
    description: 'Customer card preview',
    longDescription: 'Review how the listing reads before final validation.',
    icon: eyeOutline,
  },
  {
    number: 8,
    label: 'Review & publish',
    description: 'Quality & submission',
    longDescription: 'Check completeness and submit through the existing listing flow.',
    icon: cloudUploadOutline,
  },
] as const

const roomFields: { key: RoomField; label: string }[] = [
  { key: 'bedrooms', label: 'Bedrooms' },
  { key: 'bathrooms', label: 'Bathrooms' },
  { key: 'toilets', label: 'Toilets' },
]

const residentialFeatures: { key: BooleanField; label: string; icon: string }[] = [
  { key: 'kitchen', label: 'Kitchen', icon: restaurantOutline },
  { key: 'parking', label: 'Parking', icon: carOutline },
  { key: 'water', label: 'Water supply', icon: waterOutline },
  { key: 'electricity', label: 'Electricity', icon: businessOutline },
  { key: 'security', label: 'Security', icon: shieldCheckmarkOutline },
]

const commercialFeatures: { key: BooleanField; label: string; icon: string }[] = [
  { key: 'roadAccess', label: 'Road access', icon: carOutline },
  { key: 'marketArea', label: 'Market area', icon: businessOutline },
  { key: 'electricityAvailability', label: 'Electricity', icon: businessOutline },
  { key: 'security', label: 'Security', icon: shieldCheckmarkOutline },
  { key: 'waterAccess', label: 'Water access', icon: waterOutline },
  { key: 'parking', label: 'Parking', icon: carOutline },
]

const previewDevices: { value: PreviewDevice; label: string; icon: string }[] = [
  { value: 'desktop', label: 'Desktop preview', icon: desktopOutline },
  { value: 'tablet', label: 'Tablet preview', icon: laptopOutline },
  { value: 'phone', label: 'Phone preview', icon: phonePortraitOutline },
]

function mergeInput(value?: Partial<PropertyFormInput>): PropertyFormInput {
  const empty = createEmptyPropertyInput()
  return {
    ...empty,
    ...value,
    amenities: [...(value?.amenities ?? empty.amenities)],
    images: [...(value?.images ?? empty.images)],
    availabilityConfig: {
      ...empty.availabilityConfig,
      ...(value?.availabilityConfig ?? {}),
      agents: [...(value?.availabilityConfig?.agents ?? empty.availabilityConfig.agents)],
      blockedDates: [
        ...(value?.availabilityConfig?.blockedDates ?? empty.availabilityConfig.blockedDates),
      ],
    },
  }
}

function snapshotInput(): PropertyFormInput {
  return mergeInput(form)
}

const form = reactive<PropertyFormInput>(mergeInput(props.initialValue))
const currentStep = ref(Math.min(Math.max(props.initialStep, 1), steps.length))
const highestVisited = ref(currentStep.value)
const errorMessage = ref('')
const customAmenity = ref('')
const areImagesProcessing = ref(false)
const isLocating = ref(false)
const locationMessage = ref('')
const coordinatesCopied = ref(false)
const previewDevice = ref<PreviewDevice>('desktop')

const activeStep = computed(() => steps[currentStep.value - 1] ?? steps[0])
const progress = computed(() => Math.round((currentStep.value / steps.length) * 100))
const config = computed(() => resolveListingFormConfig(form.category, form.propertyType))
const formSnapshot = computed(snapshotInput)
const quality = computed(() => resolveListingQuality(formSnapshot.value))
const enteredChargeTotal = computed(() =>
  config.value.moneyFields.reduce(
    (total, field) => total + Math.max(0, Number(form[field.key]) || 0),
    0
  )
)
const titleSuggestion = computed(() => {
  const location = form.area.trim() || form.city.trim() || form.state.trim()
  const type = form.propertyType
  if (!location && form.bedrooms === null) return ''

  if (config.value.detailMode === 'residential' && form.bedrooms !== null) {
    return `${form.bedrooms}-bedroom ${type.toLowerCase()}${location ? ` in ${location}` : ''}`
  }

  return `${type}${location ? ` in ${location}` : ''}`
})

watch(
  () => props.initialValue,
  (value) => {
    Object.assign(form, mergeInput(value))
  },
  { deep: true }
)

watch(
  () => props.initialStep,
  (step) => {
    const nextStep = Math.min(Math.max(step, 1), steps.length)
    currentStep.value = nextStep
    highestVisited.value = Math.max(highestVisited.value, nextStep)
  }
)

watch(form, () => emit('update:value', snapshotInput()), { deep: true, immediate: true })

watch(currentStep, (step) => {
  errorMessage.value = ''
  emit('step-change', step)
})

function formatPaymentDuration(duration: PaymentDuration) {
  const labels: Record<PaymentDuration, string> = {
    hourly: 'Hourly',
    daily: 'Daily',
    per_session: 'Per session',
    fixed: 'Fixed rate',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    biannually: 'Biannually',
    yearly: 'Yearly',
    custom: 'Custom',
  }
  return labels[duration]
}

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

function hasSpecificDetails(mode: ListingDetailMode) {
  if (mode === 'residential') {
    return (
      form.bedrooms !== null ||
      form.bathrooms !== null ||
      form.toilets !== null ||
      form.kitchen ||
      form.water ||
      form.electricity
    )
  }
  if (mode === 'commercial') {
    return (
      Boolean(form.shopSize.trim()) ||
      form.roadAccess ||
      form.marketArea ||
      form.electricityAvailability ||
      form.waterAccess
    )
  }
  return false
}

function clearSpecificDetails(mode: ListingDetailMode) {
  if (mode === 'residential') {
    form.bedrooms = null
    form.bathrooms = null
    form.toilets = null
    form.kitchen = false
    form.water = false
    form.electricity = false
  }
  if (mode === 'commercial') {
    form.shopSize = ''
    form.roadAccess = false
    form.marketArea = false
    form.electricityAvailability = false
    form.waterAccess = false
  }
}

async function confirmDetailModeChange(nextMode: ListingDetailMode) {
  const currentMode = config.value.detailMode
  if (currentMode === nextMode || !hasSpecificDetails(currentMode)) return true

  return confirmAction({
    title: 'Change category?',
    message:
      'Details that do not apply to the new listing type will be cleared. Everything else you have entered is kept.',
    confirmLabel: 'Change category',
  })
}

async function handleCategoryChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const nextCategory = target.value as PropertyCategory
  const nextConfig = getListingCategoryConfig(nextCategory)

  if (!(await confirmDetailModeChange(nextConfig.detailMode))) {
    // Put the control back on the category the form is actually still using.
    target.value = form.category
    return
  }

  const oldMode = config.value.detailMode
  if (oldMode !== nextConfig.detailMode) clearSpecificDetails(oldMode)
  form.category = nextCategory
  form.propertyType = nextConfig.propertyTypes[0] ?? 'Other rental'
  form.paymentDuration = nextConfig.paymentDurations[0] ?? 'custom'
}

function handlePropertyTypeChange(event: Event) {
  form.propertyType = (event.target as HTMLSelectElement).value as PropertyType
}

function applyTitleSuggestion() {
  if (titleSuggestion.value) form.title = titleSuggestion.value
}

function insertDescriptionOutline() {
  const outline = config.value.descriptionPrompts.map((prompt) => `${prompt}:`).join('\n')
  form.description = form.description.trim() ? `${form.description.trim()}\n\n${outline}` : outline
}

function adjustRoom(key: RoomField, amount: number) {
  form[key] = Math.max(0, (form[key] ?? 0) + amount)
}

function hasAmenity(amenity: string) {
  return form.amenities.some((item) => item.toLocaleLowerCase() === amenity.toLocaleLowerCase())
}

function toggleAmenity(amenity: string) {
  if (hasAmenity(amenity)) removeAmenity(amenity)
  else form.amenities.push(amenity)
}

function removeAmenity(amenity: string) {
  const normalized = amenity.toLocaleLowerCase()
  form.amenities = form.amenities.filter((item) => item.toLocaleLowerCase() !== normalized)
}

function addCustomAmenity() {
  const amenity = customAmenity.value.trim()
  if (!amenity) return
  if (!hasAmenity(amenity)) form.amenities.push(amenity)
  customAmenity.value = ''
}

function validateCurrentStep() {
  if (currentStep.value === 1 && (!form.title.trim() || !form.description.trim())) {
    return 'Add a listing title and description before continuing.'
  }
  if (currentStep.value === 2 && form.rentPrice <= 0) {
    return 'Enter a rental price greater than zero before continuing.'
  }
  if (
    currentStep.value === 3 &&
    (!form.state.trim() ||
      !form.city.trim() ||
      !form.area.trim() ||
      !form.address.trim() ||
      !form.ownerPhone.trim())
  ) {
    return 'Complete the state, city, area, full address, and contact phone.'
  }
  if (
    currentStep.value === 4 &&
    config.value.detailMode === 'residential' &&
    (form.bedrooms === null || form.bathrooms === null || form.toilets === null)
  ) {
    return 'Add the bedrooms, bathrooms, and toilets for this residential listing.'
  }
  if (currentStep.value === 4 && form.propertyType === 'Shop rent' && !form.shopSize.trim()) {
    return 'Add the shop size before continuing.'
  }
  if (currentStep.value === 6 && !form.images.length) {
    return 'Upload at least one image before previewing the listing.'
  }
  return ''
}

function handlePrimaryAction() {
  errorMessage.value = validateCurrentStep()
  if (errorMessage.value) return

  if (currentStep.value < steps.length) {
    currentStep.value += 1
    highestVisited.value = Math.max(highestVisited.value, currentStep.value)
    return
  }

  errorMessage.value = validatePropertyInput(snapshotInput())
  if (!errorMessage.value) emit('submit', snapshotInput())
}

function moveBack() {
  currentStep.value = Math.max(1, currentStep.value - 1)
}

function goToVisitedStep(step: number) {
  if (step <= highestVisited.value) currentStep.value = step
}

function emitDraft() {
  emit('save-draft', snapshotInput(), currentStep.value)
}

function useCurrentLocation() {
  locationMessage.value = ''
  coordinatesCopied.value = false
  if (!navigator.geolocation) {
    locationMessage.value =
      'Location access is unavailable in this browser. You can still place the map pin manually.'
    return
  }

  isLocating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.latitude = position.coords.latitude
      form.longitude = position.coords.longitude
      isLocating.value = false
      locationMessage.value =
        'Current coordinates added. Confirm the marker is at the correct listing location.'
    },
    () => {
      isLocating.value = false
      locationMessage.value =
        'We could not access your current location. Allow location access or place the pin manually.'
    },
    { enableHighAccuracy: true, timeout: 12000 }
  )
}

async function copyCoordinates() {
  if (form.latitude === null || form.longitude === null) return
  try {
    await navigator.clipboard.writeText(`${form.latitude}, ${form.longitude}`)
    coordinatesCopied.value = true
  } catch {
    locationMessage.value =
      'The browser could not copy the coordinates. They are still saved with this draft.'
  }
}
</script>

<style scoped>
.property-wizard {
  color: var(--rd-ink);
}
.property-wizard__progress {
  display: none;
  margin-bottom: 14px;
}
.property-wizard__progress-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 7px;
  color: #66778d;
  font-size: 10px;
}
.property-wizard__progress-summary strong {
  color: #1d5fd1;
}
.property-wizard__progress-track {
  height: 5px;
  overflow: hidden;
  border-radius: 4px;
  background: #e9eef5;
}
.property-wizard__progress-track > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--rd-brass);
  transition: width 200ms ease;
}
.property-wizard__layout {
  display: grid;
  grid-template-columns: 186px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.property-wizard__steps,
.property-wizard__stage {
  border: 1px solid #e1e8f0;
  border-radius: 17px;
  background: var(--rd-surface);
  box-shadow: 0 20px 50px -42px rgba(16, 32, 51, 0.45);
}
.property-wizard__steps {
  position: sticky;
  top: 20px;
  display: grid;
  gap: 1px;
  padding: 13px 9px;
}
.property-wizard__steps button {
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 9px;
  align-items: start;
  width: 100%;
  border: 0;
  border-radius: 10px;
  background: transparent;
  padding: 9px 7px;
  color: #8290a1;
  text-align: left;
  cursor: not-allowed;
}
.property-wizard__steps button.available {
  color: #41536a;
  cursor: pointer;
}
.property-wizard__steps button.active {
  background: #f1f6ff;
  color: #155ed5;
}
.property-wizard__steps button.complete {
  color: #1b7f55;
}
.property-wizard__step-number {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 1px solid #d8e1eb;
  border-radius: 50%;
  background: var(--rd-surface);
  font-size: 10px;
  font-weight: 850;
}
.property-wizard__steps button.active .property-wizard__step-number {
  border-color: var(--rd-brass);
  background: var(--rd-brass);
  color: #fff;
}
.property-wizard__steps button.complete .property-wizard__step-number {
  border-color: #c7f0dc;
  background: #e9fbf2;
  color: #0e8a57;
}
.property-wizard__steps strong {
  display: block;
  margin-top: 1px;
  font-size: 11px;
  line-height: 1.3;
}
.property-wizard__steps small {
  display: block;
  margin-top: 4px;
  font-size: 9px;
  line-height: 1.45;
}
.property-wizard__stage {
  min-width: 0;
  padding: 20px;
}
.property-wizard__stage-header {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  margin-bottom: 22px;
}
.property-wizard__stage-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  background: var(--rd-brass);
  color: #fff;
  box-shadow: 0 9px 22px -14px var(--rd-brass);
}
.property-wizard__stage-icon ion-icon {
  font-size: 21px;
}
.property-wizard__stage-header p {
  margin: 1px 0 4px;
  color: var(--rd-brass);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.property-wizard__stage-header h2 {
  margin: 0;
  font-size: 21px;
  letter-spacing: 0;
}
.property-wizard__stage-header div > span {
  display: block;
  margin-top: 5px;
  color: #6d7d91;
  font-size: 11px;
  line-height: 1.5;
}
.property-wizard__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.field {
  position: relative;
  display: grid;
  min-width: 0;
  gap: 7px;
  color: #25364b;
  font-size: 11px;
  font-weight: 800;
}
.field--wide {
  grid-column: 1 / -1;
}
.classification-summary {
  display: grid;
  min-height: 54px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  border: 1px solid #d9e5f5;
  border-radius: 10px;
  background: #f5f9ff;
  padding: 9px 12px;
}
.classification-summary > span {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 8px;
  background: #e7f0ff;
  color: var(--rd-brass);
  font-size: 18px;
}
.classification-summary small,
.classification-summary strong {
  display: block;
  margin: 0;
}
.classification-summary small {
  color: #6f8196;
  font-size: 8px;
  font-weight: 750;
}
.classification-summary strong {
  margin-top: 2px;
  color: #15283f;
  font-size: 11px;
}
.classification-summary em {
  border-radius: 999px;
  background: #e7f0ff;
  padding: 5px 8px;
  color: var(--rd-brass);
  font-size: 8px;
  font-style: normal;
  font-weight: 800;
}
.field input,
.field select,
.field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--rd-hairline);
  border-radius: 11px;
  background: var(--rd-surface);
  padding: 11px 12px;
  color: var(--rd-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 550;
  line-height: 1.5;
  outline: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}
.field select {
  appearance: auto;
}
.field textarea {
  resize: vertical;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #68a0f5;
  box-shadow: 0 0 0 3px rgba(23, 105, 239, 0.09);
}
.field small {
  color: #8090a3;
  font-size: 9px;
  font-weight: 550;
  line-height: 1.45;
}
.field__with-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}
.field__inline-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #cfe0fa;
  border-radius: 10px;
  background: #f4f8ff;
  padding: 0 12px;
  color: #1763d7;
  font-size: 9px;
  font-weight: 800;
}
.field__inline-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.field__counter {
  position: absolute;
  right: 10px;
  bottom: 8px;
  color: #8b99aa;
  font-size: 7px;
}
.field__money {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--rd-hairline);
  border-radius: 11px;
  background: var(--rd-surface);
}
.field__money > span {
  padding: 0 10px;
  color: #65768a;
  font-size: 8px;
}
.field__money input {
  border: 0;
  border-left: 1px solid #e4eaf1;
  border-radius: 0;
}
.assistant-panel,
.generic-detail-panel {
  border: 1px solid #dce9fb;
  border-radius: 13px;
  background: #f7faff;
  padding: 14px;
  color: #576b83;
}
.assistant-panel > div:first-child {
  display: flex;
  gap: 9px;
  font-size: 10px;
  line-height: 1.5;
}
.assistant-panel > div ion-icon {
  flex: 0 0 auto;
  color: var(--rd-brass);
  font-size: 18px;
}
.assistant-panel strong {
  display: block;
  color: #20364f;
}
.assistant-panel ul,
.generic-detail-panel ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 20px;
  margin: 12px 0;
  padding-left: 18px;
  font-size: 9px;
  line-height: 1.45;
}
.text-command {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  padding: 0;
  color: #1763d7;
  font-size: 9px;
  font-weight: 850;
}
.currency-note,
.pricing-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  border-radius: 12px;
  background: #f6f9fc;
  padding: 12px 14px;
}
.currency-note > span {
  color: #66778c;
  font-size: 8px;
  font-weight: 750;
}
.currency-note > strong {
  color: #17283e;
  font-size: 10px;
}
.currency-note > small {
  color: #7d8da0;
  font-size: 8px;
}
.toggle-card {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--rd-hairline);
  border-radius: 12px;
  padding: 11px 12px;
  cursor: pointer;
}
.toggle-card input,
.feature-card input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.toggle-card > span:nth-of-type(1) {
  min-width: 0;
  flex: 1;
}
.toggle-card strong,
.toggle-card small {
  display: block;
}
.toggle-card strong {
  font-size: 9px;
}
.toggle-card small {
  margin-top: 3px;
  color: #7c8da0;
  font-size: 7px;
}
.toggle-card__switch {
  position: relative;
  width: 31px;
  height: 18px;
  flex: 0 0 auto;
  border-radius: 10px;
  background: #d5dde7;
  transition: background 160ms ease;
}
.toggle-card__switch::after {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--rd-surface);
  content: '';
  transition: transform 160ms ease;
}
.toggle-card input:checked ~ .toggle-card__switch {
  background: var(--rd-brass);
}
.toggle-card input:checked ~ .toggle-card__switch::after {
  transform: translateX(13px);
}
.pricing-summary {
  justify-content: space-between;
  background: #f0fbf5;
}
.pricing-summary span {
  display: grid;
}
.pricing-summary small {
  color: #418069;
  font-size: 7px;
}
.pricing-summary strong {
  margin-top: 2px;
  color: #079455;
  font-size: 15px;
}
.pricing-summary p {
  max-width: 330px;
  margin: 0;
  color: #577465;
  font-size: 7px;
  line-height: 1.5;
}
.map-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.map-actions button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #d9e3ee;
  border-radius: 10px;
  background: var(--rd-surface);
  padding: 9px 11px;
  color: #2b4968;
  font-size: 8px;
  font-weight: 800;
}
.map-actions button:disabled {
  opacity: 0.45;
}
.inline-message {
  border-radius: 10px;
  background: #f4f8fd;
  padding: 10px 12px;
  color: #516d8b;
  font-size: 8px;
}
.map-shell {
  min-width: 0;
}
.map-shell :deep(.rounded-\[24px\]) {
  border-radius: 13px;
}
.map-shell :deep(.h-80) {
  height: 250px;
}
.stepper-field {
  display: grid;
  gap: 8px;
  color: #26384d;
  font-size: 9px;
  font-weight: 800;
}
.stepper-field > div {
  display: grid;
  grid-template-columns: 35px minmax(0, 1fr) 35px;
  overflow: hidden;
  border: 1px solid var(--rd-hairline);
  border-radius: 11px;
}
.stepper-field button {
  display: grid;
  place-items: center;
  border: 0;
  background: var(--rd-surface-alt);
  color: #315473;
}
.stepper-field input {
  width: 100%;
  min-width: 0;
  border: 0;
  border-right: 1px solid #e4eaf1;
  border-left: 1px solid #e4eaf1;
  padding: 10px;
  color: var(--rd-ink);
  text-align: center;
  outline: 0;
}
.feature-card {
  position: relative;
  display: flex;
  min-height: 54px;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--rd-hairline);
  border-radius: 12px;
  padding: 12px;
  color: #596c81;
  font-size: 9px;
  font-weight: 750;
  cursor: pointer;
}
.feature-card > ion-icon:first-of-type {
  color: #6d829b;
  font-size: 18px;
}
.feature-card__check {
  margin-left: auto;
  color: #c8d2dd;
  font-size: 17px;
}
.feature-card:has(input:checked) {
  border-color: #a8c9f9;
  background: #f2f7ff;
  color: #175fce;
}
.feature-card input:checked ~ .feature-card__check {
  color: var(--rd-brass);
}
.generic-detail-panel {
  display: flex;
  gap: 14px;
}
.generic-detail-panel > ion-icon {
  flex: 0 0 auto;
  color: var(--rd-brass);
  font-size: 25px;
}
.generic-detail-panel h3 {
  margin: 0;
  color: #19324c;
  font-size: 14px;
}
.generic-detail-panel p {
  margin: 7px 0 0;
  font-size: 9px;
  line-height: 1.65;
}
.amenities-stage,
.images-stage,
.publish-stage {
  display: grid;
  gap: 18px;
}
.section-label {
  margin: 0 0 9px;
  color: #33485f;
  font-size: 9px;
  font-weight: 850;
}
.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.chip-grid button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #dde5ee;
  border-radius: 15px;
  background: var(--rd-surface);
  padding: 7px 9px;
  color: #53667d;
  font-size: 8px;
  font-weight: 750;
}
.chip-grid button.selected {
  border-color: #a8c9f9;
  background: var(--rd-brass-soft);
  color: #145dce;
}
.custom-amenity {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 9px;
}
.custom-amenity > button {
  display: inline-flex;
  min-height: 39px;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 10px;
  background: #102033;
  padding: 0 14px;
  color: #fff;
  font-size: 8px;
  font-weight: 800;
}
.custom-amenity > button:disabled {
  opacity: 0.45;
}
.selected-amenities {
  border-top: 1px solid #e6ebf1;
  padding-top: 14px;
}
.selected-amenities > div {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.selected-amenities button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 14px;
  background: #eef3f8;
  padding: 7px 9px;
  color: #42576e;
  font-size: 8px;
}
.image-guidance {
  display: flex;
  gap: 10px;
  border-radius: 12px;
  background: #f6f9fd;
  padding: 12px;
}
.image-guidance > ion-icon {
  flex: 0 0 auto;
  color: var(--rd-brass);
  font-size: 20px;
}
.image-guidance > div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.image-guidance strong {
  width: 100%;
  color: #2b4159;
  font-size: 9px;
}
.image-guidance span {
  border-radius: 12px;
  background: var(--rd-surface);
  padding: 5px 7px;
  color: #61758b;
  font-size: 7px;
}
.preview-stage {
  display: grid;
  gap: 13px;
}
.preview-stage__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.preview-stage__toolbar > span {
  color: #566a82;
  font-size: 9px;
  font-weight: 800;
}
.preview-stage__toolbar > div {
  display: flex;
  padding: 3px;
  border-radius: 10px;
  background: #edf2f7;
}
.preview-stage__toolbar button {
  display: grid;
  width: 31px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #75869a;
}
.preview-stage__toolbar button.active {
  background: var(--rd-surface);
  color: var(--rd-brass);
  box-shadow: 0 4px 12px -9px rgba(0, 0, 0, 0.35);
}
.preview-stage__canvas {
  width: 100%;
  margin: auto;
  transition: max-width 180ms ease;
}
.preview-stage__canvas.is-tablet {
  max-width: 480px;
}
.preview-stage__canvas.is-phone {
  max-width: 320px;
}
.publish-stage__score {
  display: flex;
  align-items: center;
  gap: 15px;
  border: 1px solid #dce8f8;
  border-radius: 14px;
  background: #f5f9ff;
  padding: 14px;
}
.publish-stage__score > div {
  display: grid;
  width: 65px;
  height: 65px;
  flex: 0 0 auto;
  place-content: center;
  border-radius: 50%;
  background: var(--rd-brass);
  color: #fff;
  text-align: center;
}
.publish-stage__score > div span {
  font-size: 17px;
  font-weight: 900;
}
.publish-stage__score > div small {
  font-size: 6px;
}
.publish-stage__score.strong > div {
  background: #0a9b60;
}
.publish-stage__score p {
  margin: 0;
  color: #5b7088;
  font-size: 8px;
  line-height: 1.55;
}
.publish-stage__score p strong {
  display: block;
  margin-bottom: 4px;
  color: #20374f;
  font-size: 11px;
}
.publish-stage__checks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.publish-stage__checks article {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e3e9f0;
  border-radius: 11px;
  padding: 10px;
  color: #8695a7;
}
.publish-stage__checks article > ion-icon {
  flex: 0 0 auto;
  font-size: 18px;
}
.publish-stage__checks strong,
.publish-stage__checks small {
  display: block;
}
.publish-stage__checks strong {
  font-size: 8px;
}
.publish-stage__checks small {
  margin-top: 2px;
  font-size: 6px;
}
.publish-stage__checks article.complete {
  border-color: #d6f1e4;
  color: #138359;
}
.publish-stage__notice {
  display: flex;
  gap: 10px;
  border-radius: 12px;
  background: #f6f9fc;
  padding: 12px;
  color: #65788d;
  font-size: 8px;
  line-height: 1.55;
}
.publish-stage__notice > ion-icon {
  flex: 0 0 auto;
  color: var(--rd-brass);
  font-size: 19px;
}
.publish-stage__notice strong {
  display: block;
  color: #2c435b;
}
.property-wizard__error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 17px;
  border: 1px solid var(--rd-danger-bg);
  border-radius: 11px;
  background: var(--rd-danger-bg);
  padding: 11px 12px;
  color: var(--rd-danger);
  font-size: 9px;
  line-height: 1.5;
}
.property-wizard__error ion-icon {
  flex: 0 0 auto;
  font-size: 17px;
}
.property-wizard__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  border-top: 1px solid var(--rd-hairline);
  padding-top: 16px;
}
.property-wizard__actions-spacer {
  flex: 1;
}
.button {
  display: inline-flex;
  min-height: 39px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 10px;
  padding: 0 13px;
  font-size: 10px;
  font-weight: 850;
  transition:
    transform 150ms ease,
    opacity 150ms ease;
}
.button:hover:not(:disabled) {
  transform: translateY(-1px);
}
.button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.button--quiet {
  border: 0;
  background: transparent;
  color: #6a7b8e;
}
.button--draft,
.button--back {
  border: 1px solid #dae3ed;
  background: var(--rd-surface);
  color: #27425f;
}
.button--primary {
  border: 1px solid var(--rd-brass);
  background: var(--rd-brass);
  padding-inline: 17px;
  color: #fff;
  box-shadow: 0 10px 22px -15px var(--rd-brass);
}

@media (max-width: 900px) {
  .property-wizard__progress {
    display: block;
  }
  .property-wizard__layout {
    grid-template-columns: 1fr;
  }
  .property-wizard__steps {
    position: static;
    display: flex;
    overflow-x: auto;
    padding: 7px;
    scroll-snap-type: x proximity;
  }
  .property-wizard__steps {
    scrollbar-width: none;
  }
  .property-wizard__steps::-webkit-scrollbar {
    display: none;
  }
  .property-wizard__steps button {
    min-width: 138px;
    scroll-snap-align: start;
  }
  .property-wizard__steps small {
    display: none;
  }
}

@media (max-width: 639px) {
  .property-wizard__stage {
    border-radius: 14px;
    padding: 15px;
  }
  .property-wizard__stage-header {
    margin-bottom: 17px;
  }
  .property-wizard__stage-header h2 {
    font-size: 17px;
  }
  .property-wizard__fields {
    grid-template-columns: 1fr;
  }
  .field--wide {
    grid-column: auto;
  }
  .assistant-panel ul,
  .generic-detail-panel ul,
  .publish-stage__checks {
    grid-template-columns: 1fr;
  }
  .field__with-action {
    grid-template-columns: 1fr;
  }
  .field__inline-button {
    min-height: 36px;
    justify-content: center;
  }
  .pricing-summary {
    align-items: flex-start;
  }
  .custom-amenity {
    grid-template-columns: 1fr;
  }
  .custom-amenity > button {
    justify-content: center;
  }
  .property-wizard__actions {
    margin-bottom: 72px;
    padding-top: 14px;
  }
  .property-wizard__actions .button--quiet,
  .property-wizard__actions .button--draft {
    display: none;
  }
  .property-wizard__actions-spacer {
    display: none;
  }
  .property-wizard__actions .button {
    flex: 1;
  }
  .property-wizard__steps {
    margin-inline: -2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .property-wizard__progress-track > span,
  .preview-stage__canvas,
  .button {
    transition: none;
  }
}

:global(.dark) .property-wizard {
  color: var(--rd-surface-alt);
}
:global(.dark) .property-wizard__steps,
:global(.dark) .property-wizard__stage,
:global(.dark) .field input,
:global(.dark) .field select,
:global(.dark) .field textarea,
:global(.dark) .field__money,
:global(.dark) .field__inline-button,
:global(.dark) .toggle-card,
:global(.dark) .feature-card,
:global(.dark) .chip-grid button,
:global(.dark) .map-actions button,
:global(.dark) .button--draft,
:global(.dark) .button--back {
  border-color: #2a394b;
  background: #111c2a;
  color: #e8eef6;
}
:global(.dark) .property-wizard__steps button.available,
:global(.dark) .property-wizard__stage-header div > span,
:global(.dark) .field,
:global(.dark) .section-label {
  color: #c3cfdd;
}
:global(.dark) .property-wizard__steps button.active,
:global(.dark) .assistant-panel,
:global(.dark) .generic-detail-panel,
:global(.dark) .currency-note,
:global(.dark) .image-guidance,
:global(.dark) .publish-stage__notice {
  background: #172638;
}
:global(.dark) .property-wizard__stage-header h2,
:global(.dark) .assistant-panel strong,
:global(.dark) .generic-detail-panel h3,
:global(.dark) .currency-note > strong {
  color: var(--rd-surface-alt);
}
:global(.dark) .property-wizard__actions {
  border-color: #2a394b;
}
</style>
