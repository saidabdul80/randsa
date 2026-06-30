<template>
  <label class="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
    <span>Sort</span>
    <select
      :value="modelValue"
      class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
      @change="handleChange"
    >
      <option value="newest">Newest</option>
      <option value="lowest-price">Lowest price</option>
      <option value="highest-price">Highest price</option>
    </select>
  </label>
</template>

<script setup lang="ts">
import type { PropertySortOption } from '../../types/property'

defineProps<{
  modelValue: PropertySortOption
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PropertySortOption]
}>()

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value as PropertySortOption)
}
</script>
