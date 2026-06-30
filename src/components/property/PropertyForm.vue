<template>
  <form class="grid gap-5" @submit.prevent="handleSubmit">
    <PropertyFieldGroup
      title="Listing basics"
      description="Capture the core property details first. We are deliberately leaving map pinning for the later map phase."
    >
      <div class="grid gap-4 md:grid-cols-2">
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
          Property title
          <input
            v-model="form.title"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Example: Newly renovated 2-bedroom flat"
          >
        </label>
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Category
          <select
            v-model="form.category"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
          </select>
        </label>
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Property type
          <select
            v-model="form.propertyType"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          >
            <option v-for="item in propertyTypes" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
          Description
          <textarea
            v-model="form.description"
            rows="5"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Describe the property, nearby area, and standout features."
          />
        </label>
      </div>
    </PropertyFieldGroup>

    <PropertyFieldGroup
      title="Pricing and terms"
      description="Property approval status is assigned automatically. Landlord and agent updates stay pending for review."
    >
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label
          v-for="moneyField in moneyFields"
          :key="moneyField.key"
          class="text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          {{ moneyField.label }}
          <input
            v-model.number="form[moneyField.key]"
            type="number"
            min="0"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          >
        </label>
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Payment duration
          <select
            v-model="form.paymentDuration"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="biannually">Biannually</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label class="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          <input v-model="form.isAvailable" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600">
          Property is currently available
        </label>
      </div>
    </PropertyFieldGroup>

    <PropertyFieldGroup
      title="Location"
      description="Address text and map coordinates now work together, using Leaflet with OpenStreetMap as the current free map provider."
    >
      <div class="grid gap-4 md:grid-cols-2">
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          State
          <input
            v-model="form.state"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          >
        </label>
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          City
          <input
            v-model="form.city"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          >
        </label>
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Area
          <input
            v-model="form.area"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          >
        </label>
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Contact phone
          <input
            v-model="form.ownerPhone"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          >
        </label>
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
          Full address
          <textarea
            v-model="form.address"
            rows="3"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <div class="md:col-span-2">
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
    </PropertyFieldGroup>

    <PropertyFieldGroup
      v-if="showResidentialFields"
      title="Residential details"
      description="These fields are shown for house-style properties only."
    >
      <div class="grid gap-4 md:grid-cols-3">
        <label
          v-for="roomField in roomFields"
          :key="roomField.key"
          class="text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          {{ roomField.label }}
          <input
            v-model.number="form[roomField.key]"
            type="number"
            min="0"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          >
        </label>
      </div>
      <div class="mt-4 grid gap-3 md:grid-cols-2">
        <label
          v-for="feature in residentialFeatureToggles"
          :key="feature.key"
          class="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        >
          <input v-model="form[feature.key]" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600">
          {{ feature.label }}
        </label>
      </div>
    </PropertyFieldGroup>

    <PropertyFieldGroup
      v-if="showCommercialFields"
      title="Shop details"
      description="Bedrooms and bathrooms are hidden here, and the shop-specific fields are shown instead."
    >
      <div class="grid gap-4 md:grid-cols-2">
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Shop size
          <input
            v-model="form.shopSize"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Example: 120 sqm"
          >
        </label>
      </div>
      <div class="mt-4 grid gap-3 md:grid-cols-2">
        <label
          v-for="feature in commercialFeatureToggles"
          :key="feature.key"
          class="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        >
          <input v-model="form[feature.key]" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600">
          {{ feature.label }}
        </label>
      </div>
    </PropertyFieldGroup>

    <PropertyFieldGroup
      title="Amenities and images"
      description="Amenities can be comma separated. Property images are compressed first and then uploaded to Firebase Storage when you save the listing."
    >
      <div class="grid gap-4">
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Amenities
          <input
            v-model="amenitiesText"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Security, Borehole, Parking, POP ceiling"
          >
        </label>
        <PropertyImageUploader
          v-model="form.images"
          @processing-change="areImagesProcessing = $event"
        />
      </div>
    </PropertyFieldGroup>

    <div
      v-if="errorMessage"
      class="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
    >
      {{ errorMessage }}
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        class="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isSubmitting || areImagesProcessing"
      >
        {{ isSubmitting ? 'Saving...' : areImagesProcessing ? 'Preparing images...' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import {
  allowsCommercialFieldGroup,
  createRemotePropertyImage,
  createEmptyPropertyInput,
  showsResidentialRoomFields,
  type PropertyFormInput,
  type PropertyType,
} from '../../types/property'
import PropertyLocationPicker from '../map/PropertyLocationPicker.vue'
import PropertyFieldGroup from './PropertyFieldGroup.vue'
import PropertyImageUploader from './PropertyImageUploader.vue'

const props = withDefaults(
  defineProps<{
    initialValue?: Partial<PropertyFormInput>
    submitLabel?: string
    isSubmitting?: boolean
  }>(),
  {
    initialValue: undefined,
    submitLabel: 'Save property',
    isSubmitting: false,
  },
)

const emit = defineEmits<{
  submit: [value: PropertyFormInput]
  cancel: []
}>()

const propertyTypes: PropertyType[] = [
  'House rent',
  'Shop rent',
  'Office space',
  'Apartment',
  'Self-contained',
  'Flat',
  'Duplex',
  'Land',
]

const moneyFields = [
  { key: 'rentPrice', label: 'Rent price' },
  { key: 'cautionFee', label: 'Caution fee' },
  { key: 'agencyFee', label: 'Agency fee' },
  { key: 'inspectionFee', label: 'Inspection fee' },
] as const

const roomFields = [
  { key: 'bedrooms', label: 'Bedrooms' },
  { key: 'bathrooms', label: 'Bathrooms' },
  { key: 'toilets', label: 'Toilets' },
] as const

const residentialFeatureToggles = [
  { key: 'kitchen', label: 'Kitchen available' },
  { key: 'parking', label: 'Parking available' },
  { key: 'water', label: 'Water available' },
  { key: 'electricity', label: 'Electricity available' },
  { key: 'security', label: 'Security available' },
] as const

const commercialFeatureToggles = [
  { key: 'roadAccess', label: 'Road access' },
  { key: 'marketArea', label: 'Located in market area' },
  { key: 'electricityAvailability', label: 'Electricity available' },
  { key: 'security', label: 'Security available' },
  { key: 'waterAccess', label: 'Water access' },
] as const

function mergeInitialValue(initialValue?: Partial<PropertyFormInput>) {
  const incomingImages = (initialValue?.images ?? []) as Array<PropertyFormInput['images'][number] | string>

  return {
    ...createEmptyPropertyInput(),
    ...initialValue,
    amenities: initialValue?.amenities ?? [],
    images: incomingImages.map((image) =>
      typeof image === 'string' ? createRemotePropertyImage(image) : image,
    ),
  }
}

const form = reactive<PropertyFormInput>(mergeInitialValue(props.initialValue))
const amenitiesText = ref(form.amenities.join(', '))
const errorMessage = ref('')
const areImagesProcessing = ref(false)

watch(
  () => props.initialValue,
  (value) => {
    Object.assign(form, mergeInitialValue(value))
    amenitiesText.value = (value?.amenities ?? []).join(', ')
  },
  { deep: true },
)

const showResidentialFields = computed(() => showsResidentialRoomFields(form.propertyType))
const showCommercialFields = computed(() => allowsCommercialFieldGroup(form.propertyType))

watch(
  () => form.propertyType,
  (value) => {
    if (!showsResidentialRoomFields(value)) {
      form.bedrooms = null
      form.bathrooms = null
      form.toilets = null
      form.kitchen = false
      form.parking = false
      form.water = false
      form.electricity = false
    }

    if (!allowsCommercialFieldGroup(value)) {
      form.shopSize = ''
      form.roadAccess = false
      form.marketArea = false
      form.electricityAvailability = false
      form.waterAccess = false
    }

    if (value === 'Shop rent') {
      form.category = 'commercial'
    } else if (value === 'Land') {
      form.category = 'land'
    } else if (value === 'Office space') {
      form.category = 'commercial'
    } else {
      form.category = 'residential'
    }
  },
)

function handleSubmit() {
  errorMessage.value = ''

  const amenities = amenitiesText.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const payload: PropertyFormInput = {
    ...form,
    amenities,
  }

  if (!payload.title.trim()) {
    errorMessage.value = 'Add a property title before saving.'
    return
  }

  emit('submit', payload)
}
</script>
