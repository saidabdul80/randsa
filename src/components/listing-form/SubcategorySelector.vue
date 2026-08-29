<template>
  <section class="subcategory-selector" :aria-labelledby="titleId">
    <header class="subcategory-selector__header">
      <button type="button" class="subcategory-selector__back" @click="emit('back')">
        <IonIcon :icon="arrowBack" aria-hidden="true" />
        <span>Categories</span>
      </button>
      <div class="subcategory-selector__heading">
        <span class="subcategory-selector__category-icon" aria-hidden="true">
          <IonIcon :icon="category.icon" />
        </span>
        <div>
          <p>{{ category.label }}</p>
          <h2 :id="titleId">Choose a subcategory</h2>
        </div>
      </div>
    </header>

    <div class="subcategory-selector__grid" role="radiogroup" :aria-labelledby="titleId">
      <label
        v-for="subcategory in category.subcategories"
        :key="subcategory.id"
        class="subcategory-option"
        :class="{ 'subcategory-option--selected': subcategory.id === modelValue }"
      >
        <input
          type="radio"
          :name="inputName"
          :value="subcategory.id"
          :checked="subcategory.id === modelValue"
          @change="selectSubcategory(subcategory)"
        />
        <span class="subcategory-option__marker" aria-hidden="true">
          <IonIcon v-if="subcategory.id === modelValue" :icon="checkmark" />
        </span>
        <span class="subcategory-option__copy">
          <strong>{{ subcategory.label }}</strong>
          <small>{{ subcategory.description }}</small>
        </span>
        <IonIcon class="subcategory-option__arrow" :icon="chevronForward" aria-hidden="true" />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { arrowBack, checkmark, chevronForward } from 'ionicons/icons'
import { computed } from 'vue'

import type { MarketplaceCategory, MarketplaceSubcategory } from '../../types/listing'

const props = withDefaults(
  defineProps<{
    category: MarketplaceCategory
    modelValue?: string | null
    name?: string
  }>(),
  {
    modelValue: null,
    name: 'listing-subcategory',
  }
)

const emit = defineEmits<{
  'update:modelValue': [subcategoryId: string]
  select: [subcategory: MarketplaceSubcategory]
  back: []
}>()

const inputName = computed(() => `${props.name}-${props.category.id}`)
const titleId = computed(() => `subcategory-selector-title-${props.category.id}`)

function selectSubcategory(subcategory: MarketplaceSubcategory) {
  emit('update:modelValue', subcategory.id)
  emit('select', subcategory)
}
</script>

<style scoped>
.subcategory-selector {
  color: #142033;
}

.subcategory-selector__header {
  display: grid;
  gap: 18px;
  margin-bottom: 20px;
}

.subcategory-selector__back {
  display: inline-flex;
  width: fit-content;
  min-height: 34px;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  padding: 0;
  color: #52677e;
  cursor: pointer;
  font-size: 12px;
  font-weight: 750;
}

.subcategory-selector__back:hover {
  color: var(--rd-brass);
}

.subcategory-selector__back:focus-visible {
  outline: 3px solid rgba(30, 109, 224, 0.2);
  outline-offset: 3px;
}

.subcategory-selector__back ion-icon {
  font-size: 17px;
}

.subcategory-selector__heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subcategory-selector__category-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  background: var(--rd-brass);
  color: #fff;
  font-size: 22px;
}

.subcategory-selector__heading p,
.subcategory-selector__heading h2 {
  margin: 0;
}

.subcategory-selector__heading p {
  margin-bottom: 4px;
  color: var(--rd-brass);
  font-size: 11px;
  font-weight: 800;
}

.subcategory-selector__heading h2 {
  font-size: 21px;
  line-height: 1.2;
  letter-spacing: 0;
}

.subcategory-selector__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.subcategory-option {
  position: relative;
  display: grid;
  min-height: 78px;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border: 1px solid #e0e6ee;
  border-radius: 8px;
  background: var(--rd-surface);
  padding: 12px;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background 150ms ease;
}

.subcategory-option:hover {
  border-color: #a9c9f5;
  background: #f8fbff;
}

.subcategory-option:focus-within {
  outline: 3px solid rgba(30, 109, 224, 0.2);
  outline-offset: 1px;
}

.subcategory-option--selected {
  border-color: var(--rd-brass);
  background: #f3f7ff;
}

.subcategory-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.subcategory-option__marker {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border: 1px solid #bcc9d7;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
}

.subcategory-option--selected .subcategory-option__marker {
  border-color: var(--rd-brass);
  background: var(--rd-brass);
}

.subcategory-option__copy {
  min-width: 0;
}

.subcategory-option__copy strong,
.subcategory-option__copy small {
  display: block;
}

.subcategory-option__copy strong {
  color: #1d3148;
  font-size: 13px;
  line-height: 1.25;
}

.subcategory-option__copy small {
  margin-top: 4px;
  color: #6c7d90;
  font-size: 10px;
  line-height: 1.4;
}

.subcategory-option__arrow {
  color: #93a1b2;
  font-size: 16px;
}

@media (max-width: 620px) {
  .subcategory-selector__heading h2 {
    font-size: 19px;
  }

  .subcategory-selector__grid {
    grid-template-columns: 1fr;
  }

  .subcategory-option {
    min-height: 72px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .subcategory-option {
    transition: none;
  }
}

:global(.dark) .subcategory-selector,
:global(.dark) .subcategory-selector__heading h2,
:global(.dark) .subcategory-option__copy strong {
  color: var(--rd-brass-soft);
}

:global(.dark) .subcategory-option {
  border-color: #2a394b;
  background: #111c2a;
}

:global(.dark) .subcategory-option:hover,
:global(.dark) .subcategory-option--selected {
  border-color: #4e8de8;
  background: #172638;
}
</style>
