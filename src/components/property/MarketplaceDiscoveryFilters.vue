<template>
  <section class="marketplace-filters" aria-label="Marketplace filters">
    <div class="marketplace-filters__primary">
      <label>
        <span>Category</span>
        <select :value="modelValue.categoryId" @change="updateCategory">
          <option value="all">All categories</option>
          <option v-for="category in marketplaceCategories" :key="category.id" :value="category.id">
            {{ category.label }}
          </option>
        </select>
      </label>

      <label>
        <span>Subcategory</span>
        <select
          :value="modelValue.subcategoryId"
          :disabled="!selectedCategory"
          @change="updateField('subcategoryId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All subcategories</option>
          <option
            v-for="subcategory in selectedCategory?.subcategories ?? []"
            :key="subcategory.id"
            :value="subcategory.id"
          >
            {{ subcategory.label }}
          </option>
        </select>
      </label>

      <label>
        <span>Date posted</span>
        <select
          :value="modelValue.datePosted"
          @change="updateDate(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">Any time</option>
          <option value="today">Today</option>
          <option value="7-days">Last 7 days</option>
          <option value="30-days">Last 30 days</option>
        </select>
      </label>

      <button
        type="button"
        class="marketplace-filters__toggle"
        :aria-expanded="isExpanded"
        aria-controls="marketplace-advanced-filters"
        @click="isExpanded = !isExpanded"
      >
        <IonIcon :icon="funnelOutline" aria-hidden="true" />
        Filters
        <b v-if="activeAdvancedCount">{{ activeAdvancedCount }}</b>
      </button>
    </div>

    <div v-if="isExpanded" id="marketplace-advanced-filters" class="marketplace-filters__advanced">
      <label>
        <span>Minimum price</span>
        <input
          :value="modelValue.minPrice ?? ''"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="No minimum"
          @input="updateNumber('minPrice', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>Maximum price</span>
        <input
          :value="modelValue.maxPrice ?? ''"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="No maximum"
          @input="updateNumber('maxPrice', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <template v-if="showCondition">
        <label>
          <span>Condition</span>
          <select
            :value="modelValue.condition"
            @change="updateField('condition', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Any condition</option>
            <option value="brand_new">Brand new</option>
            <option value="used_like_new">Used, like new</option>
            <option value="used">Used</option>
            <option value="refurbished">Refurbished</option>
          </select>
        </label>
      </template>

      <template v-if="modelValue.categoryId === 'property'">
        <label>
          <span>Listing purpose</span>
          <select
            :value="modelValue.listingPurpose"
            @change="updateField('listingPurpose', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Rent, sale or stay</option>
            <option value="for_rent">For rent</option>
            <option value="for_sale">For sale</option>
            <option value="short_stay">Short stay</option>
            <option value="lease">Lease</option>
          </select>
        </label>
        <label>
          <span>Property type</span>
          <input
            :value="modelValue.propertyType"
            placeholder="House, flat, office"
            @input="updateField('propertyType', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>Minimum bedrooms</span>
          <select
            :value="modelValue.bedrooms ?? ''"
            @change="updateNumber('bedrooms', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Any bedrooms</option>
            <option v-for="count in 5" :key="count" :value="count">{{ count }}+</option>
          </select>
        </label>
        <label>
          <span>Furnishing</span>
          <select
            :value="modelValue.furnishing"
            @change="updateField('furnishing', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Any furnishing</option>
            <option value="furnished">Furnished</option>
            <option value="semi_furnished">Semi-furnished</option>
            <option value="unfurnished">Unfurnished</option>
          </select>
        </label>
      </template>

      <template v-if="modelValue.categoryId === 'vehicles'">
        <label>
          <span>Make</span>
          <input
            :value="modelValue.make"
            placeholder="Toyota, Honda"
            @input="updateField('make', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>Model</span>
          <input
            :value="modelValue.model"
            placeholder="Corolla, Civic"
            @input="updateField('model', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>Minimum year</span>
          <input
            :value="modelValue.minimumYear ?? ''"
            type="number"
            min="1900"
            :max="new Date().getFullYear() + 1"
            placeholder="2018"
            @input="updateNumber('minimumYear', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>Transmission</span>
          <select
            :value="modelValue.transmission"
            @change="updateField('transmission', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Any transmission</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </label>
      </template>

      <template v-if="modelValue.categoryId === 'phones-tablets'">
        <label>
          <span>Brand</span>
          <input
            :value="modelValue.brand"
            placeholder="Apple, Samsung"
            @input="updateField('brand', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>Storage</span>
          <input
            :value="modelValue.storage"
            placeholder="128 GB"
            @input="updateField('storage', ($event.target as HTMLInputElement).value)"
          />
        </label>
      </template>

      <button type="button" class="marketplace-filters__reset" @click="$emit('reset')">
        <IonIcon :icon="refreshOutline" aria-hidden="true" /> Reset filters
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { funnelOutline, refreshOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'

import { marketplaceCategories } from '../../config/marketplaceCategories'
import type {
  MarketplaceCategoryFilter,
  MarketplaceDateFilter,
  MarketplaceDiscoveryFilters,
} from '../../types/marketplace'

const props = defineProps<{ modelValue: MarketplaceDiscoveryFilters }>()
const emit = defineEmits<{
  'update:modelValue': [value: MarketplaceDiscoveryFilters]
  reset: []
}>()
const isExpanded = ref(false)

const selectedCategory = computed(
  () =>
    marketplaceCategories.find((category) => category.id === props.modelValue.categoryId) ?? null
)
const showCondition = computed(() =>
  [
    'vehicles',
    'phones-tablets',
    'electronics',
    'home-furniture-appliances',
    'fashion',
    'beauty-personal-care',
    'babies-kids',
    'commercial-equipment-tools',
    'pets',
  ].includes(props.modelValue.categoryId)
)
const activeAdvancedCount = computed(
  () =>
    [
      props.modelValue.minPrice !== null,
      props.modelValue.maxPrice !== null,
      Boolean(props.modelValue.condition),
      Boolean(props.modelValue.propertyType),
      Boolean(props.modelValue.listingPurpose),
      props.modelValue.bedrooms !== null,
      Boolean(props.modelValue.furnishing),
      Boolean(props.modelValue.make),
      Boolean(props.modelValue.model),
      props.modelValue.minimumYear !== null,
      Boolean(props.modelValue.transmission),
      Boolean(props.modelValue.brand),
      Boolean(props.modelValue.storage),
    ].filter(Boolean).length
)

function updateField<Key extends keyof MarketplaceDiscoveryFilters>(
  key: Key,
  value: MarketplaceDiscoveryFilters[Key]
) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function updateCategory(event: Event) {
  emit('update:modelValue', {
    ...props.modelValue,
    categoryId: (event.target as HTMLSelectElement).value as MarketplaceCategoryFilter,
    subcategoryId: '',
    condition: '',
    propertyType: '',
    listingPurpose: '',
    bedrooms: null,
    furnishing: '',
    make: '',
    model: '',
    minimumYear: null,
    transmission: '',
    brand: '',
    storage: '',
  })
}

function updateNumber(key: 'minPrice' | 'maxPrice' | 'bedrooms' | 'minimumYear', value: string) {
  updateField(key, value === '' ? null : Math.max(0, Number(value)))
}

function updateDate(value: string) {
  updateField('datePosted', value as MarketplaceDateFilter)
}
</script>

<style scoped>
.marketplace-filters {
  margin-top: 20px;
  border-block: 1px solid rgb(226 232 240);
  background: rgb(255 255 255 / 0.78);
  padding: 14px 0;
}

.marketplace-filters__primary,
.marketplace-filters__advanced {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.marketplace-filters label {
  min-width: 0;
  color: rgb(71 85 105);
  font-size: 0.72rem;
  font-weight: 700;
}

.marketplace-filters label span {
  display: block;
  margin-bottom: 5px;
}

.marketplace-filters select,
.marketplace-filters input,
.marketplace-filters button {
  width: 100%;
  min-height: 42px;
  border: 1px solid rgb(203 213 225);
  border-radius: 8px;
  background: white;
  padding: 0 12px;
  color: rgb(15 23 42);
  font-size: 0.82rem;
  font-weight: 600;
  outline: none;
}

.marketplace-filters select:focus,
.marketplace-filters input:focus,
.marketplace-filters button:focus-visible {
  border-color: rgb(37 99 235);
  box-shadow: 0 0 0 3px rgb(37 99 235 / 0.14);
}

.marketplace-filters__toggle,
.marketplace-filters__reset {
  align-self: end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.marketplace-filters__toggle b {
  display: inline-grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 50%;
  background: rgb(37 99 235);
  color: white;
  font-size: 0.68rem;
}

.marketplace-filters__advanced {
  margin-top: 12px;
  border-top: 1px solid rgb(226 232 240);
  padding-top: 12px;
}

.marketplace-filters__reset {
  align-self: end;
  color: rgb(29 78 216) !important;
}

:global(.dark) .marketplace-filters {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42 / 0.72);
}

:global(.dark) .marketplace-filters label {
  color: rgb(203 213 225);
}

:global(.dark) .marketplace-filters select,
:global(.dark) .marketplace-filters input,
:global(.dark) .marketplace-filters button {
  border-color: rgb(71 85 105);
  background: rgb(15 23 42);
  color: white;
}

@media (max-width: 900px) {
  .marketplace-filters__primary,
  .marketplace-filters__advanced {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 540px) {
  .marketplace-filters__primary,
  .marketplace-filters__advanced {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
