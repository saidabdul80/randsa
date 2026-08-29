<template>
  <section
    class="listing-classification"
    :class="{ 'listing-classification--details': currentStep === 3 }"
    aria-labelledby="listing-classification-title"
  >
    <header class="listing-classification__topbar">
      <div>
        <p>New marketplace listing</p>
        <h2 id="listing-classification-title">Classify your listing</h2>
      </div>
      <strong>Step {{ currentStep }} of 3</strong>
    </header>

    <div class="listing-classification__progress">
      <div class="listing-classification__track" aria-hidden="true">
        <span :style="{ width: `${progress}%` }" />
      </div>
      <ol aria-label="Listing classification progress">
        <li
          v-for="step in steps"
          :key="step.number"
          :class="{
            'listing-classification__step--active': currentStep === step.number,
            'listing-classification__step--complete': currentStep > step.number,
          }"
          :aria-current="currentStep === step.number ? 'step' : undefined"
        >
          <span>
            <IonIcon v-if="currentStep > step.number" :icon="checkmark" aria-hidden="true" />
            <template v-else>{{ step.number }}</template>
          </span>
          <small>{{ step.label }}</small>
        </li>
      </ol>
    </div>

    <main
      class="listing-classification__stage"
      :class="{ 'listing-classification__stage--details': currentStep === 3 }"
    >
      <CategorySelector
        v-if="currentStep === 1"
        :model-value="selectedCategoryId"
        :categories="categories"
        @select="handleCategorySelect"
      />

      <SubcategorySelector
        v-else-if="currentStep === 2 && selectedCategory"
        :category="selectedCategory"
        :model-value="selectedSubcategoryId"
        @back="goToCategories"
        @select="handleSubcategorySelect"
      />

      <section v-else-if="resolvedSelection" class="listing-classification__details">
        <header class="listing-classification__selection">
          <div class="listing-classification__selection-icon" aria-hidden="true">
            <IonIcon :icon="resolvedSelection.category.icon" />
          </div>
          <div>
            <p>Listing details</p>
            <h2>{{ resolvedSelection.subcategory.label }}</h2>
            <span>{{ resolvedSelection.category.label }}</span>
          </div>
          <div class="listing-classification__selection-actions">
            <button type="button" @click="changeSubcategory">
              <IonIcon :icon="swapHorizontalOutline" aria-hidden="true" />
              Change type
            </button>
            <button type="button" @click="goToCategories">
              <IonIcon :icon="gridOutline" aria-hidden="true" />
              Change category
            </button>
          </div>
        </header>

        <div class="listing-classification__slot">
          <slot
            name="details"
            :category="resolvedSelection.category"
            :subcategory="resolvedSelection.subcategory"
            :selection="selection"
            :change-category="goToCategories"
            :change-subcategory="changeSubcategory"
          />
        </div>

        <footer class="listing-classification__footer">
          <button type="button" @click="changeSubcategory">
            <IonIcon :icon="arrowBack" aria-hidden="true" />
            Back to subcategories
          </button>
        </footer>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { arrowBack, checkmark, gridOutline, swapHorizontalOutline } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'

import { marketplaceCategories } from '../../config/marketplaceCategories'
import type {
  ListingClassification,
  MarketplaceCategory,
  MarketplaceCategoryId,
  MarketplaceSubcategory,
  ResolvedListingClassification,
} from '../../types/listing'
import CategorySelector from './CategorySelector.vue'
import SubcategorySelector from './SubcategorySelector.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: ListingClassification
    categories?: readonly MarketplaceCategory[]
  }>(),
  {
    modelValue: () => ({ categoryId: null, subcategoryId: null }),
    categories: () => marketplaceCategories,
  }
)

const emit = defineEmits<{
  'update:modelValue': [selection: ListingClassification]
  'category-change': [category: MarketplaceCategory | null]
  'subcategory-change': [subcategory: MarketplaceSubcategory | null]
  complete: [selection: ResolvedListingClassification]
}>()

const steps = [
  { number: 1, label: 'Category' },
  { number: 2, label: 'Subcategory' },
  { number: 3, label: 'Details' },
] as const

const selectedCategoryId = ref<MarketplaceCategoryId | null>(props.modelValue.categoryId)
const selectedSubcategoryId = ref<string | null>(props.modelValue.subcategoryId)

const selectedCategory = computed(
  () => props.categories.find((category) => category.id === selectedCategoryId.value) ?? null
)

const selectedSubcategory = computed(
  () =>
    selectedCategory.value?.subcategories.find(
      (subcategory) => subcategory.id === selectedSubcategoryId.value
    ) ?? null
)

const resolvedSelection = computed<ResolvedListingClassification | null>(() => {
  if (!selectedCategory.value || !selectedSubcategory.value) return null
  return { category: selectedCategory.value, subcategory: selectedSubcategory.value }
})

const currentStep = ref(resolvedSelection.value ? 3 : selectedCategory.value ? 2 : 1)
const progress = computed(() => (currentStep.value / steps.length) * 100)
const selection = computed<ListingClassification>(() => ({
  categoryId: selectedCategoryId.value,
  subcategoryId: selectedSubcategoryId.value,
}))

watch(
  () => props.modelValue,
  (value) => {
    if (
      value.categoryId === selectedCategoryId.value &&
      value.subcategoryId === selectedSubcategoryId.value
    ) {
      return
    }

    selectedCategoryId.value = value.categoryId
    selectedSubcategoryId.value = value.subcategoryId
    currentStep.value = value.subcategoryId ? 3 : value.categoryId ? 2 : 1
  },
  { deep: true }
)

function publishSelection() {
  emit('update:modelValue', selection.value)
}

function handleCategorySelect(category: MarketplaceCategory) {
  const categoryChanged = selectedCategoryId.value !== category.id
  selectedCategoryId.value = category.id

  if (categoryChanged) {
    selectedSubcategoryId.value = null
    emit('subcategory-change', null)
  }

  currentStep.value = selectedSubcategoryId.value ? 3 : 2
  publishSelection()
  emit('category-change', category)
}

function handleSubcategorySelect(subcategory: MarketplaceSubcategory) {
  selectedSubcategoryId.value = subcategory.id
  currentStep.value = 3
  publishSelection()
  emit('subcategory-change', subcategory)

  if (resolvedSelection.value) emit('complete', resolvedSelection.value)
}

function goToCategories() {
  currentStep.value = 1
}

function changeSubcategory() {
  currentStep.value = selectedCategory.value ? 2 : 1
}

function reset() {
  selectedCategoryId.value = null
  selectedSubcategoryId.value = null
  currentStep.value = 1
  publishSelection()
  emit('category-change', null)
  emit('subcategory-change', null)
}

defineExpose({
  reset,
  changeCategory: goToCategories,
  changeSubcategory,
})
</script>

<style scoped>
.listing-classification {
  width: min(100%, 900px);
  margin: 0 auto;
  color: #142033;
}

.listing-classification--details {
  width: 100%;
}

.listing-classification__topbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 15px;
}

.listing-classification__topbar p,
.listing-classification__topbar h2 {
  margin: 0;
}

.listing-classification__topbar p {
  margin-bottom: 5px;
  color: #6c7d90;
  font-size: 11px;
  font-weight: 750;
}

.listing-classification__topbar h2 {
  font-size: 25px;
  line-height: 1.2;
  letter-spacing: 0;
}

.listing-classification__topbar > strong {
  flex: 0 0 auto;
  color: var(--rd-brass);
  font-size: 12px;
}

.listing-classification__progress {
  margin-bottom: 18px;
}

.listing-classification__track {
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: #dfe6ef;
}

.listing-classification__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--rd-brass);
  transition: width 180ms ease;
}

.listing-classification__progress ol {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.listing-classification__progress li {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #8a99aa;
}

.listing-classification__progress li:nth-child(2) {
  justify-content: center;
}

.listing-classification__progress li:last-child {
  justify-content: flex-end;
}

.listing-classification__progress li > span {
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 800;
}

.listing-classification__progress li small {
  font-size: 10px;
  font-weight: 750;
}

.listing-classification__step--active,
.listing-classification__step--complete {
  color: var(--rd-brass) !important;
}

.listing-classification__step--active > span,
.listing-classification__step--complete > span {
  border-color: var(--rd-brass) !important;
}

.listing-classification__step--complete > span {
  background: var(--rd-brass);
  color: #fff;
}

.listing-classification__stage {
  border: 0;
  background: transparent;
  padding: 0;
}

.listing-classification__stage--details {
  border: 0;
  background: transparent;
  padding: 0;
  box-shadow: none;
}

.listing-classification__details {
  min-width: 0;
}

.listing-classification__selection {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e7ecf2;
  padding-bottom: 18px;
}

.listing-classification__selection-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 8px;
  background: var(--rd-brass);
  color: #fff;
  font-size: 22px;
}

.listing-classification__selection p,
.listing-classification__selection h2 {
  margin: 0;
}

.listing-classification__selection p {
  margin-bottom: 3px;
  color: var(--rd-brass);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.listing-classification__selection h2 {
  font-size: 18px;
  line-height: 1.25;
  letter-spacing: 0;
}

.listing-classification__selection div > span {
  color: #6c7d90;
  font-size: 11px;
}

.listing-classification__selection-actions {
  display: flex;
  gap: 6px;
}

.listing-classification__selection-actions button,
.listing-classification__footer button {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: var(--rd-surface);
  padding: 0 10px;
  color: #40576f;
  cursor: pointer;
  font-size: 10px;
  font-weight: 750;
}

.listing-classification__selection-actions button:hover,
.listing-classification__footer button:hover {
  border-color: #a9c9f5;
  color: var(--rd-brass);
}

.listing-classification__selection-actions button:focus-visible,
.listing-classification__footer button:focus-visible {
  outline: 3px solid rgba(30, 109, 224, 0.2);
  outline-offset: 1px;
}

.listing-classification__slot {
  min-height: 120px;
  padding: 22px 0;
}

.listing-classification__footer {
  display: flex;
  border-top: 1px solid #e7ecf2;
  padding-top: 16px;
}

@media (max-width: 720px) {
  .listing-classification__topbar h2 {
    font-size: 21px;
  }

  .listing-classification__stage {
    padding: 17px;
  }

  .listing-classification__selection {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .listing-classification__selection-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 430px) {
  .listing-classification__topbar {
    align-items: flex-start;
  }

  .listing-classification__progress li small {
    display: none;
  }

  .listing-classification__selection-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .listing-classification__track span {
    transition: none;
  }
}

:global(.dark) .listing-classification,
:global(.dark) .listing-classification__topbar h2,
:global(.dark) .listing-classification__selection h2 {
  color: var(--rd-brass-soft);
}

:global(.dark) .listing-classification__stage,
:global(.dark) .listing-classification__selection-actions button,
:global(.dark) .listing-classification__footer button {
  border-color: #2a394b;
  background: #111c2a;
  color: #d6e0eb;
}

:global(.dark) .listing-classification__selection,
:global(.dark) .listing-classification__footer {
  border-color: #2a394b;
}
</style>
