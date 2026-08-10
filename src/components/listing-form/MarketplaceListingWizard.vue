<template>
  <section class="marketplace-wizard">
    <aside class="marketplace-wizard__steps" aria-label="Listing details progress">
      <button
        v-for="item in steps"
        :key="item.number"
        type="button"
        :class="{ active: step === item.number, complete: step > item.number }"
        :disabled="item.number > highestStep"
        @click="goToStep(item.number)"
      >
        <span
          ><IonIcon v-if="step > item.number" :icon="checkmark" aria-hidden="true" /><template
            v-else
            >{{ item.number }}</template
          ></span
        >
        <b>{{ item.label }}</b>
      </button>
    </aside>

    <div class="marketplace-wizard__content">
      <header>
        <div>
          <p>Step {{ step }} of {{ steps.length }}</p>
          <h2>{{ currentStepLabel }}</h2>
        </div>
        <button
          type="button"
          class="marketplace-wizard__draft"
          :disabled="isSubmitting"
          @click="emitDraft"
        >
          <IonIcon :icon="documentTextOutline" aria-hidden="true" /> Save draft
        </button>
      </header>

      <div v-if="visibleError" class="marketplace-wizard__error" role="alert">
        <IonIcon :icon="alertCircleOutline" aria-hidden="true" /> {{ visibleError }}
      </div>

      <section v-if="step === 1" class="marketplace-wizard__panel">
        <div class="shared-grid">
          <label class="is-wide"
            ><span>Listing title <b>Required</b></span
            ><input
              v-model.trim="value.title"
              type="text"
              maxlength="100"
              placeholder="What are you offering?"
          /></label>
          <label class="is-wide"
            ><span>Description <b>Required</b></span
            ><textarea
              v-model.trim="value.description"
              rows="5"
              maxlength="3000"
              placeholder="Describe the item, service, or opportunity clearly."
            />
          </label>
        </div>
        <DynamicAttributeFields v-model="value.attributes" :fields="fields" />
        <label v-if="allowCv" class="private-file">
          <span><IonIcon :icon="documentAttachOutline" aria-hidden="true" /></span>
          <b>Private CV document</b>
          <small>Optional PDF, up to 2 MB. Only you and RANDSA admins can access it.</small>
          <input type="file" accept="application/pdf" @change="handleCvChange" />
          <em v-if="value.privateCvFile">{{ value.privateCvFile.name }}</em>
        </label>
      </section>

      <section v-else-if="step === 2" class="marketplace-wizard__panel shared-grid">
        <label
          ><span>Country</span><input v-model.trim="value.location.country" type="text"
        /></label>
        <label
          ><span>State <b>Required</b></span
          ><input v-model.trim="value.location.state" type="text" placeholder="State"
        /></label>
        <label
          ><span>City <b>Required</b></span
          ><input v-model.trim="value.location.city" type="text" placeholder="City or town"
        /></label>
        <label
          ><span>Area</span
          ><input
            v-model.trim="value.location.area"
            type="text"
            placeholder="Neighbourhood or area"
        /></label>
        <label class="is-wide"
          ><span>Address or landmark</span
          ><input
            v-model.trim="value.location.address"
            type="text"
            placeholder="Optional exact address or nearby landmark"
        /></label>
        <div class="is-wide">
          <PropertyLocationPicker
            v-model:latitude="value.location.latitude"
            v-model:longitude="value.location.longitude"
            :address="value.location.address"
            :area="value.location.area"
            :city="value.location.city"
            :state="value.location.state"
          />
        </div>
      </section>

      <section v-else-if="step === 3" class="marketplace-wizard__panel shared-grid">
        <label
          ><span>Price type</span
          ><select v-model="value.pricing.priceType">
            <option value="fixed">Fixed</option>
            <option value="negotiable">Negotiable</option>
            <option value="range">Price range</option>
            <option value="free">Free</option>
            <option value="contact">Contact for price</option>
          </select></label
        >
        <label
          ><span>Currency</span
          ><select v-model="value.pricing.currency">
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select></label
        >
        <label v-if="!priceWithoutAmount"
          ><span
            >{{ value.pricing.priceType === 'range' ? 'Minimum amount' : 'Amount' }}
            <b>Required</b></span
          ><input v-model.number="value.pricing.amount" type="number" min="0" inputmode="decimal"
        /></label>
        <label v-if="value.pricing.priceType === 'range'"
          ><span>Maximum amount <b>Required</b></span
          ><input
            v-model.number="value.pricing.maximumAmount"
            type="number"
            min="0"
            inputmode="decimal"
        /></label>
        <label
          ><span>Billing period</span
          ><select v-model="value.pricing.billingPeriod">
            <option v-for="choice in billingPeriods" :key="choice.value" :value="choice.value">
              {{ choice.label }}
            </option>
          </select></label
        >
        <label
          ><span>Negotiation</span
          ><select v-model="value.pricing.negotiable">
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="not_sure">Not sure</option>
          </select></label
        >
      </section>

      <section v-else-if="step === 4" class="marketplace-wizard__panel">
        <PropertyImageUploader
          v-model="value.images"
          :max-images="12"
          @processing-change="isProcessingImages = $event"
        />
        <label class="video-field"
          ><span>Video link</span
          ><input
            v-model.trim="value.videoUrl"
            type="url"
            placeholder="Optional YouTube or Facebook URL"
        /></label>
      </section>

      <section v-else-if="step === 5" class="marketplace-wizard__panel">
        <div class="shared-grid">
          <label
            ><span>Contact name <b>Required</b></span
            ><input v-model.trim="value.contact.name" type="text"
          /></label>
          <label
            ><span>Phone number <b>Required</b></span
            ><input v-model.trim="value.contact.phone" type="tel" inputmode="tel"
          /></label>
          <label
            ><span>Preferred contact</span
            ><select v-model="value.contact.preferredMethod">
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="both">Phone and WhatsApp</option>
              <option value="email">Email</option>
            </select></label
          >
          <label class="switch-field"
            ><span>WhatsApp available</span
            ><input v-model="value.contact.whatsappEnabled" type="checkbox"
          /></label>
          <label class="switch-field"
            ><span>Delivery available</span
            ><input v-model="value.delivery.available" type="checkbox"
          /></label>
          <label class="switch-field"
            ><span>Pickup available</span
            ><input v-model="value.delivery.pickupAvailable" type="checkbox"
          /></label>
          <label class="is-wide"
            ><span>Delivery or coverage details</span
            ><textarea
              v-model.trim="value.delivery.details"
              rows="3"
              placeholder="Coverage area, pickup point, or delivery terms"
            />
          </label>
        </div>
      </section>

      <section v-else class="marketplace-wizard__panel marketplace-wizard__review">
        <MarketplaceListingPreview :value="value" />
        <dl>
          <div>
            <dt>Category</dt>
            <dd>{{ value.categoryName }} / {{ value.subcategoryName }}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{{ value.contact.name }} · {{ value.contact.phone }}</dd>
          </div>
          <div>
            <dt>Media</dt>
            <dd>{{ value.images.length }} image{{ value.images.length === 1 ? '' : 's' }}</dd>
          </div>
          <div>
            <dt>Review</dt>
            <dd>New listings are submitted for moderation.</dd>
          </div>
        </dl>
      </section>

      <footer>
        <button
          type="button"
          class="secondary"
          @click="step === 1 ? emit('cancel') : previousStep()"
        >
          <IonIcon :icon="step === 1 ? closeOutline : arrowBack" aria-hidden="true" />
          {{ step === 1 ? 'Cancel' : 'Back' }}
        </button>
        <button
          v-if="step < steps.length"
          type="button"
          class="primary"
          :disabled="isProcessingImages"
          @click="nextStep"
        >
          Continue <IonIcon :icon="arrowForward" aria-hidden="true" />
        </button>
        <button
          v-else
          type="button"
          class="primary"
          :disabled="isSubmitting || isProcessingImages"
          @click="submit"
        >
          <IonIcon :icon="cloudUploadOutline" aria-hidden="true" />
          {{ isSubmitting ? progressLabel : submitLabel }}
        </button>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  alertCircleOutline,
  arrowBack,
  arrowForward,
  checkmark,
  closeOutline,
  cloudUploadOutline,
  documentAttachOutline,
  documentTextOutline,
} from 'ionicons/icons'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  getBillingPeriodOptions,
  getListingFieldConfig,
  isPhotoRequired,
  supportsPrivateCv,
} from '../../config/listingFieldConfig'
import type {
  MarketplaceCategory,
  MarketplaceSubcategory,
  ListingFormInput,
} from '../../types/listing'
import { createEmptyListingInput } from '../../types/listing'
import type { UserProfile } from '../../types/user'
import { getCoordinateValidationError } from '../../utils/coordinates'
import PropertyLocationPicker from '../map/PropertyLocationPicker.vue'
import PropertyImageUploader from '../property/PropertyImageUploader.vue'
import DynamicAttributeFields from './DynamicAttributeFields.vue'
import MarketplaceListingPreview from './MarketplaceListingPreview.vue'

const props = withDefaults(
  defineProps<{
    category: MarketplaceCategory
    subcategory: MarketplaceSubcategory
    profile?: UserProfile | null
    initialValue?: ListingFormInput | null
    initialStep?: number
    isSubmitting?: boolean
    uploadProgress?: number
    submitLabel?: string
    submitError?: string
  }>(),
  {
    profile: null,
    initialValue: null,
    initialStep: 1,
    isSubmitting: false,
    uploadProgress: 0,
    submitLabel: 'Publish listing',
    submitError: '',
  }
)

const emit = defineEmits<{
  'update:value': [value: ListingFormInput]
  'step-change': [step: number]
  'save-draft': [value: ListingFormInput, step: number]
  submit: [value: ListingFormInput]
  cancel: []
}>()

const steps = [
  { number: 1, label: 'Details' },
  { number: 2, label: 'Location' },
  { number: 3, label: 'Pricing' },
  { number: 4, label: 'Media' },
  { number: 5, label: 'Contact' },
  { number: 6, label: 'Review' },
] as const
const value = ref<ListingFormInput>(
  props.initialValue
    ? structuredCloneSafe(props.initialValue)
    : createEmptyListingInput(props.category, props.subcategory, props.profile)
)
const step = ref(Math.min(6, Math.max(1, props.initialStep)))
const highestStep = ref(step.value)
const errorMessage = ref('')
const isProcessingImages = ref(false)
const fields = computed(() => getListingFieldConfig(props.category.id, props.subcategory.id))
const billingPeriods = computed(() => getBillingPeriodOptions(props.category.id))
const allowCv = computed(() => supportsPrivateCv(props.category.id))
const priceWithoutAmount = computed(() =>
  ['free', 'contact'].includes(value.value.pricing.priceType)
)
const currentStepLabel = computed(
  () => steps.find((item) => item.number === step.value)?.label ?? 'Listing details'
)
const progressLabel = computed(() =>
  props.uploadProgress ? `Publishing ${props.uploadProgress}%` : 'Publishing...'
)
const visibleError = computed(() => errorMessage.value || props.submitError)

watch(
  () => props.initialValue,
  (next) => {
    if (next) value.value = structuredCloneSafe(next)
  }
)
watch(value, (next) => emit('update:value', next), { deep: true })
watch(step, (next) => emit('step-change', next), { immediate: true })

function structuredCloneSafe(input: ListingFormInput): ListingFormInput {
  return {
    ...input,
    location: { ...input.location },
    pricing: { ...input.pricing },
    contact: { ...input.contact },
    delivery: { ...input.delivery },
    attributes: { ...input.attributes },
    images: input.images.map((image) => ({ ...image })),
  }
}

function validateStep(current: number) {
  if (current === 1) {
    if (!value.value.title.trim() || !value.value.description.trim())
      return 'Add a title and description.'
    const missing = fields.value.find((field) => field.required && !hasAttributeValue(field.key))
    if (missing) return `Complete ${missing.label.toLowerCase()}.`
  }
  if (current === 2) {
    if (!value.value.location.state.trim() || !value.value.location.city.trim())
      return 'Add the state and city.'
    const coordinateError = getCoordinateValidationError(
      value.value.location.latitude,
      value.value.location.longitude
    )
    if (coordinateError) return coordinateError
  }
  if (current === 3 && !priceWithoutAmount.value && value.value.pricing.amount <= 0)
    return 'Enter a valid amount.'
  if (
    current === 3 &&
    value.value.pricing.priceType === 'range' &&
    (!value.value.pricing.maximumAmount ||
      value.value.pricing.maximumAmount < value.value.pricing.amount)
  )
    return 'The maximum amount must be at least the minimum amount.'
  if (current === 4 && isPhotoRequired(props.category.id) && !value.value.images.length)
    return 'Upload at least one photo.'
  if (current === 5 && (!value.value.contact.name.trim() || !value.value.contact.phone.trim()))
    return 'Add the listing contact name and phone number.'
  return ''
}

function hasAttributeValue(key: string) {
  const attribute = value.value.attributes[key]
  if (attribute === undefined) return false
  if (typeof attribute === 'string') return Boolean(attribute.trim())
  if (Array.isArray(attribute)) return attribute.length > 0
  if (typeof attribute === 'number') return Number.isFinite(attribute)
  return true
}

function nextStep() {
  errorMessage.value = validateStep(step.value)
  if (errorMessage.value) return
  step.value += 1
  highestStep.value = Math.max(highestStep.value, step.value)
}
function previousStep() {
  errorMessage.value = ''
  step.value = Math.max(1, step.value - 1)
}
function goToStep(target: number) {
  if (target <= highestStep.value) {
    errorMessage.value = ''
    step.value = target
  }
}
function emitDraft() {
  emit('save-draft', structuredCloneSafe(value.value), step.value)
}
function submit() {
  for (let current = 1; current <= 5; current += 1) {
    const message = validateStep(current)
    if (message) {
      step.value = current
      errorMessage.value = message
      return
    }
  }
  errorMessage.value = ''
  emit('submit', structuredCloneSafe(value.value))
}
function handleCvChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  errorMessage.value = ''
  if (file && (file.type !== 'application/pdf' || file.size > 2 * 1024 * 1024)) {
    errorMessage.value = 'Choose a PDF CV smaller than 2 MB.'
    ;(event.target as HTMLInputElement).value = ''
    return
  }
  value.value.privateCvFile = file
}
function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (
    !props.isSubmitting &&
    (value.value.title || value.value.description || value.value.images.length)
  )
    event.preventDefault()
}
window.addEventListener('beforeunload', warnBeforeUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))
</script>

<style scoped>
.marketplace-wizard {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.marketplace-wizard__steps {
  display: grid;
  gap: 5px;
}
.marketplace-wizard__steps button {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 6px 8px;
  color: #74869a;
  text-align: left;
}
.marketplace-wizard__steps button > span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid #d6e0ea;
  border-radius: 50%;
  font-size: 9px;
  font-weight: 850;
}
.marketplace-wizard__steps b {
  font-size: 10px;
}
.marketplace-wizard__steps button.active {
  background: #edf4ff;
  color: #1769ef;
}
.marketplace-wizard__steps button.active > span,
.marketplace-wizard__steps button.complete > span {
  border-color: #1769ef;
  background: #1769ef;
  color: #fff;
}
.marketplace-wizard__content {
  min-width: 0;
  border: 1px solid #dfe7f0;
  border-radius: 15px;
  background: #fff;
  padding: 20px;
  box-shadow: 0 22px 55px -46px rgba(16, 32, 51, 0.55);
}
.marketplace-wizard__content > header,
.marketplace-wizard__content > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.marketplace-wizard__content > header {
  border-bottom: 1px solid #e8edf3;
  padding-bottom: 15px;
}
.marketplace-wizard__content header p,
.marketplace-wizard__content header h2 {
  margin: 0;
}
.marketplace-wizard__content header p {
  color: #1769ef;
  font-size: 8px;
  font-weight: 850;
  text-transform: uppercase;
}
.marketplace-wizard__content header h2 {
  margin-top: 3px;
  color: #102033;
  font-size: 19px;
}
.marketplace-wizard__draft {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 6px;
  border: 1px solid #dce4ed;
  border-radius: 8px;
  background: #fff;
  padding: 0 10px;
  color: #3f5770;
  font-size: 9px;
  font-weight: 800;
}
.marketplace-wizard__panel {
  display: grid;
  gap: 18px;
  padding: 20px 0;
}
.shared-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.shared-grid label,
.video-field {
  display: grid;
  align-content: start;
  gap: 7px;
}
.shared-grid .is-wide {
  grid-column: 1 / -1;
}
.shared-grid label > span,
.video-field > span {
  color: #243950;
  font-size: 11px;
  font-weight: 800;
}
.shared-grid label > span b {
  margin-left: 5px;
  color: #1769ef;
  font-size: 7px;
  text-transform: uppercase;
}
.shared-grid input:not([type='checkbox']),
.shared-grid select,
.shared-grid textarea,
.video-field input {
  width: 100%;
  border: 1px solid #dce4ed;
  border-radius: 10px;
  background: #fff;
  padding: 11px 12px;
  color: #102033;
  font: inherit;
  font-size: 11px;
  outline: none;
}
.shared-grid input:focus,
.shared-grid select:focus,
.shared-grid textarea:focus,
.video-field input:focus {
  border-color: #1769ef;
  box-shadow: 0 0 0 3px rgba(23, 105, 239, 0.12);
}
.switch-field {
  grid-template-columns: 1fr auto;
  min-height: 43px;
  align-items: center;
  border: 1px solid #dce4ed;
  border-radius: 10px;
  padding: 0 12px;
}
.switch-field input {
  width: 18px;
  height: 18px;
  accent-color: #1769ef;
}
.private-file {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 4px 10px;
  border: 1px dashed #b8c8da;
  border-radius: 12px;
  padding: 14px;
}
.private-file > span {
  grid-row: 1 / 4;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 9px;
  background: #edf4ff;
  color: #1769ef;
  font-size: 19px;
}
.private-file b {
  color: #243950;
  font-size: 11px;
}
.private-file small,
.private-file em {
  color: #718399;
  font-size: 8px;
}
.private-file input {
  grid-column: 2;
  font-size: 9px;
}
.marketplace-wizard__error {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 14px;
  border: 1px solid #fecdd3;
  border-radius: 9px;
  background: #fff1f2;
  padding: 9px 11px;
  color: #be123c;
  font-size: 9px;
}
.marketplace-wizard__review {
  grid-template-columns: minmax(0, 1fr) minmax(200px, 0.7fr);
  align-items: start;
}
.marketplace-wizard__review dl {
  display: grid;
  gap: 0;
  margin: 0;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.marketplace-wizard__review dl div {
  padding: 12px;
  border-bottom: 1px solid #edf1f5;
}
.marketplace-wizard__review dl div:last-child {
  border: 0;
}
.marketplace-wizard__review dt {
  color: #75869a;
  font-size: 8px;
}
.marketplace-wizard__review dd {
  margin: 4px 0 0;
  color: #243950;
  font-size: 10px;
  font-weight: 750;
}
.marketplace-wizard__content > footer {
  border-top: 1px solid #e8edf3;
  padding-top: 15px;
}
.marketplace-wizard__content > footer button {
  display: inline-flex;
  min-height: 39px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 9px;
  padding: 0 15px;
  font-size: 10px;
  font-weight: 850;
}
.marketplace-wizard__content > footer .secondary {
  border: 1px solid #dce4ed;
  background: #fff;
  color: #40576f;
}
.marketplace-wizard__content > footer .primary {
  border: 1px solid #1769ef;
  background: #1769ef;
  color: #fff;
}
.marketplace-wizard__content > footer button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
@media (max-width: 760px) {
  .marketplace-wizard {
    grid-template-columns: 1fr;
  }
  .marketplace-wizard__steps {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  .marketplace-wizard__steps button {
    display: grid;
    grid-template-columns: 1fr;
    place-items: center;
    padding: 3px;
  }
  .marketplace-wizard__steps b {
    display: none;
  }
  .marketplace-wizard__review {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .marketplace-wizard__content {
    padding: 15px;
  }
  .shared-grid {
    grid-template-columns: 1fr;
  }
  .shared-grid .is-wide {
    grid-column: auto;
  }
  .marketplace-wizard__draft {
    padding-inline: 8px;
  }
  .marketplace-wizard__content > header h2 {
    font-size: 16px;
  }
}
:global(.dark) .marketplace-wizard__content,
:global(.dark) .marketplace-wizard__draft,
:global(.dark) .shared-grid input:not([type='checkbox']),
:global(.dark) .shared-grid select,
:global(.dark) .shared-grid textarea,
:global(.dark) .video-field input {
  border-color: #2a394b;
  background: #111c2a;
  color: #f8fafc;
}
:global(.dark) .marketplace-wizard__content header h2,
:global(.dark) .shared-grid label > span,
:global(.dark) .video-field > span,
:global(.dark) .private-file b,
:global(.dark) .marketplace-wizard__review dd {
  color: #f8fafc;
}
</style>
