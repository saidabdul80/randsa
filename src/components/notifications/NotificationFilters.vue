<template>
  <nav class="overflow-x-auto" aria-label="Notification filters">
    <div class="flex min-w-max items-center gap-1 border-b border-slate-200 px-4 sm:px-5 dark:border-slate-800">
      <button
        v-for="filter in filters"
        :key="filter.value"
        type="button"
        class="relative min-h-12 px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        :class="modelValue === filter.value
          ? 'text-brand-700 dark:text-brand-300'
          : 'text-slate-500 hover:text-ink dark:text-slate-400 dark:hover:text-white'"
        :aria-current="modelValue === filter.value ? 'page' : undefined"
        @click="$emit('update:modelValue', filter.value)"
      >
        {{ filter.label }}
        <span
          v-if="filter.count !== undefined"
          class="ml-1 text-xs"
          :class="modelValue === filter.value ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400'"
        >
          ({{ filter.count }})
        </span>
        <span
          v-if="modelValue === filter.value"
          class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-600"
          aria-hidden="true"
        />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
export interface NotificationFilterOption {
  value: string
  label: string
  count?: number
}

defineProps<{
  filters: NotificationFilterOption[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
