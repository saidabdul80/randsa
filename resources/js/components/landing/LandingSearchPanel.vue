<script setup lang="ts">
import { computed } from 'vue';
import AppSelectInput from '@/components/app/AppSelectInput.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import type { ListingPriceRange, ServiceCategory } from '@/types/domain';

const props = defineProps<{
    categories: ServiceCategory[];
    typeOptions: Array<{ label: string; value: string }>;
    priceRanges: ListingPriceRange[];
}>();

const query = defineModel<string>('query', { required: true });
const city = defineModel<string>('city', { required: true });
const category = defineModel<string>('category', { required: true });
const type = defineModel<string>('type', { required: true });
const price = defineModel<string>('price', { required: true });

defineEmits<{
    submit: [];
}>();

const categoryOptions = computed(() => [
    { label: 'All categories', value: '' },
    ...props.categories.map((item) => ({ label: item.label, value: item.id })),
]);

const listingTypeOptions = computed(() => [
    { label: 'Any type', value: '' },
    ...props.typeOptions,
]);

const priceOptions = computed(() => [
    { label: 'Any price', value: '' },
    ...props.priceRanges.map((item) => ({ label: item.label, value: item.id })),
]);
</script>

<template>
    <form
        class="max-w-6xl rounded-lg border border-white/16 bg-zinc-950/58 p-2 shadow-2xl shadow-black/25 backdrop-blur-2xl"
        role="search"
        @submit.prevent="$emit('submit')"
    >
        <div class="grid gap-1 md:grid-cols-[1.3fr_1fr_1fr_0.9fr_0.92fr_auto] md:divide-x md:divide-white/12">
            <AppTextInput
                v-model="query"
                label="Search"
                placeholder="Homes, artisans, venues"
                type="search"
                variant="glass"
                compact
            />
            <AppTextInput
                v-model="city"
                label="Location"
                placeholder="City or street"
                type="search"
                autocomplete="address-level2"
                variant="glass"
                compact
            />
            <AppSelectInput
                v-model="category"
                label="Category"
                :options="categoryOptions"
                variant="glass"
                compact
            />
            <AppSelectInput
                v-model="type"
                label="Type"
                :options="listingTypeOptions"
                variant="glass"
                compact
            />
            <AppSelectInput
                v-model="price"
                label="Budget"
                :options="priceOptions"
                variant="glass"
                compact
            />
            <button
                type="submit"
                class="min-h-14 rounded-md bg-emerald-400 px-6 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
            >
                Explore
            </button>
        </div>
    </form>
</template>
