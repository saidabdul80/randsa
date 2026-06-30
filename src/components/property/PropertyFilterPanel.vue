<template>
  <section class="glass-panel p-5 sm:p-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Filters</p>
        <h2 class="mt-1 text-lg font-bold text-ink dark:text-white">Narrow your results</h2>
      </div>
      <button
        type="button"
        class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        @click="$emit('reset')"
      >
        Reset filters
      </button>
    </div>

    <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Area
        <input
          :value="modelValue.area"
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          placeholder="Lekki, GRA, Wuse"
          @input="updateField('area', ($event.target as HTMLInputElement).value)"
        >
      </label>

      <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        City
        <input
          :value="modelValue.city"
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          placeholder="Lagos, Abuja, Enugu"
          @input="updateField('city', ($event.target as HTMLInputElement).value)"
        >
      </label>

      <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Property type
        <select
          :value="modelValue.propertyType"
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          @change="updatePropertyType(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">All property types</option>
          <option v-for="item in propertyTypes" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        House or shop
        <select
          :value="modelValue.kind"
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          @change="updateKind(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">All</option>
          <option value="house">House style</option>
          <option value="shop">Shop rent</option>
        </select>
      </label>

      <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Min price
        <input
          :value="modelValue.minPrice ?? ''"
          type="number"
          min="0"
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          @input="updateNumericField('minPrice', ($event.target as HTMLInputElement).value)"
        >
      </label>

      <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Max price
        <input
          :value="modelValue.maxPrice ?? ''"
          type="number"
          min="0"
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          @input="updateNumericField('maxPrice', ($event.target as HTMLInputElement).value)"
        >
      </label>

      <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Bedrooms
        <select
          :value="modelValue.bedrooms ?? ''"
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          @change="updateBedrooms(($event.target as HTMLSelectElement).value)"
        >
          <option value="">Any</option>
          <option value="1">1 bedroom</option>
          <option value="2">2 bedrooms</option>
          <option value="3">3 bedrooms</option>
          <option value="4">4 bedrooms</option>
          <option value="5">5+ bedrooms</option>
        </select>
      </label>

      <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Availability
        <select
          :value="modelValue.availability"
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          @change="updateAvailability(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">All</option>
          <option value="available">Available only</option>
          <option value="unavailable">Unavailable only</option>
        </select>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import type {
  AvailabilityFilter,
  PropertyFilterState,
  PropertyKindFilter,
  PropertyType,
} from '../../types/property'

const props = defineProps<{
  modelValue: PropertyFilterState
  propertyTypes: PropertyType[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PropertyFilterState]
  reset: []
}>()

function updateField<Key extends keyof PropertyFilterState>(
  key: Key,
  value: PropertyFilterState[Key],
) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

function updateNumericField(
  key: 'minPrice' | 'maxPrice',
  value: string,
) {
  updateField(key, value === '' ? null : Number(value))
}

function updatePropertyType(value: string) {
  updateField('propertyType', value as PropertyType | 'all')
}

function updateKind(value: string) {
  updateField('kind', value as PropertyKindFilter)
}

function updateBedrooms(value: string) {
  updateField('bedrooms', value === '' ? null : Number(value))
}

function updateAvailability(value: string) {
  updateField('availability', value as AvailabilityFilter)
}
</script>
