<template>
  <section class="category-selector" aria-labelledby="category-selector-title">
    <header class="category-selector__header">
      <div>
        <p>Marketplace category</p>
        <h2 id="category-selector-title">What are you listing?</h2>
      </div>
      <span>{{ categories.length }} categories</span>
    </header>

    <label class="category-selector__search">
      <IonIcon :icon="searchOutline" aria-hidden="true" />
      <span class="sr-only">Search categories</span>
      <input
        ref="searchInput"
        v-model.trim="query"
        type="search"
        inputmode="search"
        autocomplete="off"
        placeholder="Find a category..."
        aria-controls="marketplace-category-list"
      />
      <button v-if="query" type="button" title="Clear search" @click="clearSearch">
        <IonIcon :icon="closeCircle" aria-hidden="true" />
        <span class="sr-only">Clear search</span>
      </button>
    </label>

    <p class="category-selector__result-count" role="status" aria-live="polite">
      {{ resultLabel }}
    </p>

    <div
      v-if="filteredCategories.length"
      id="marketplace-category-list"
      class="category-selector__grid"
      role="listbox"
      aria-label="Marketplace categories"
    >
      <button
        v-for="category in filteredCategories"
        :key="category.id"
        type="button"
        role="option"
        class="category-option"
        :class="{ 'category-option--selected': category.id === modelValue }"
        :aria-selected="category.id === modelValue"
        @click="selectCategory(category)"
      >
        <span class="category-option__icon" aria-hidden="true">
          <IonIcon :icon="category.icon" />
        </span>
        <span class="category-option__copy">
          <strong>{{ category.label }}</strong>
          <small>{{ category.description }}</small>
        </span>
        <IonIcon class="category-option__arrow" :icon="chevronForward" aria-hidden="true" />
      </button>
    </div>

    <div v-else class="category-selector__empty">
      <IonIcon :icon="searchOutline" aria-hidden="true" />
      <strong>No matching categories</strong>
      <span>Try a broader search term.</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronForward, closeCircle, searchOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'

import { marketplaceCategories } from '../../config/marketplaceCategories'
import type { MarketplaceCategory, MarketplaceCategoryId } from '../../types/listing'

const props = withDefaults(
  defineProps<{
    modelValue?: MarketplaceCategoryId | null
    categories?: readonly MarketplaceCategory[]
  }>(),
  {
    modelValue: null,
    categories: () => marketplaceCategories,
  }
)

const emit = defineEmits<{
  'update:modelValue': [categoryId: MarketplaceCategoryId]
  select: [category: MarketplaceCategory]
}>()

const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

const filteredCategories = computed(() => {
  const search = query.value.toLocaleLowerCase()
  if (!search) return props.categories

  return props.categories.filter((category) =>
    [category.label, category.description, ...category.keywords].some((value) =>
      value.toLocaleLowerCase().includes(search)
    )
  )
})

const resultLabel = computed(() => {
  if (!query.value) return 'Browse all categories'
  const count = filteredCategories.value.length
  return `${count} ${count === 1 ? 'category' : 'categories'} found`
})

function selectCategory(category: MarketplaceCategory) {
  emit('update:modelValue', category.id)
  emit('select', category)
}

function clearSearch() {
  query.value = ''
  searchInput.value?.focus()
}
</script>

<style scoped>
.category-selector {
  color: #142033;
}

.category-selector__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.category-selector__header p,
.category-selector__header h2 {
  margin: 0;
}

.category-selector__header p {
  margin-bottom: 5px;
  color: var(--rd-brass);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.category-selector__header h2 {
  color: #142033;
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: 0;
}

.category-selector__header > span {
  flex: 0 0 auto;
  color: #75869a;
  font-size: 12px;
  font-weight: 700;
}

.category-selector__search {
  display: grid;
  min-height: 44px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: var(--rd-surface);
  padding: 0 12px;
  color: #75869a;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.category-selector__search:focus-within {
  border-color: var(--rd-brass);
  box-shadow: 0 0 0 3px rgba(30, 109, 224, 0.12);
}

.category-selector__search > ion-icon {
  font-size: 18px;
}

.category-selector__search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #142033;
  font: inherit;
  font-size: 14px;
}

.category-selector__search input::placeholder {
  color: #91a0b1;
}

.category-selector__search button {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  background: transparent;
  color: #75869a;
  cursor: pointer;
  font-size: 18px;
}

.category-selector__result-count {
  min-height: 17px;
  margin: 10px 0;
  color: #6c7d90;
  font-size: 11px;
  font-weight: 650;
}

.category-selector__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.category-option {
  display: grid;
  min-height: 76px;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  border: 1px solid #e0e6ee;
  border-radius: 8px;
  background: var(--rd-surface);
  padding: 11px;
  color: #142033;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background 150ms ease,
    transform 150ms ease;
}

.category-option:hover {
  border-color: #a9c9f5;
  background: #f8fbff;
  transform: translateY(-1px);
}

.category-option:focus-visible {
  outline: 3px solid rgba(30, 109, 224, 0.2);
  outline-offset: 1px;
}

.category-option--selected {
  border-color: var(--rd-brass);
  background: #f3f7ff;
}

.category-option__icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 8px;
  background: #eef4fc;
  color: var(--rd-brass);
  font-size: 20px;
}

.category-option--selected .category-option__icon {
  background: var(--rd-brass);
  color: #fff;
}

.category-option__copy {
  min-width: 0;
}

.category-option__copy strong,
.category-option__copy small {
  display: block;
}

.category-option__copy strong {
  font-size: 13px;
  line-height: 1.25;
}

.category-option__copy small {
  margin-top: 4px;
  color: #6c7d90;
  font-size: 10px;
  line-height: 1.4;
}

.category-option__arrow {
  color: #93a1b2;
  font-size: 16px;
}

.category-selector__empty {
  display: grid;
  min-height: 180px;
  place-items: center;
  align-content: center;
  gap: 6px;
  border: 1px dashed #cfd9e5;
  border-radius: 8px;
  color: #75869a;
  text-align: center;
}

.category-selector__empty ion-icon {
  margin-bottom: 4px;
  color: var(--rd-brass);
  font-size: 24px;
}

.category-selector__empty strong {
  color: #263b52;
  font-size: 13px;
}

.category-selector__empty span {
  font-size: 11px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 620px) {
  .category-selector__header {
    align-items: flex-start;
  }

  .category-selector__header h2 {
    font-size: 19px;
  }

  .category-selector__grid {
    grid-template-columns: 1fr;
  }

  .category-option {
    min-height: 70px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .category-option,
  .category-selector__search {
    transition: none;
  }
}

:global(.dark) .category-selector,
:global(.dark) .category-selector__header h2,
:global(.dark) .category-selector__search input,
:global(.dark) .category-option {
  color: var(--rd-brass-soft);
}

:global(.dark) .category-selector__search,
:global(.dark) .category-option {
  border-color: #2a394b;
  background: #111c2a;
}

:global(.dark) .category-option:hover,
:global(.dark) .category-option--selected {
  border-color: #4e8de8;
  background: #172638;
}

:global(.dark) .category-selector__empty strong {
  color: var(--rd-brass-soft);
}
</style>
