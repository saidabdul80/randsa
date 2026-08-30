<script setup lang="ts">
import { computed } from 'vue';
import type { ListingPriceRange, ServiceCategory } from '@/types/domain';
import LandingSearchPanel from './LandingSearchPanel.vue';

interface HeroSlide {
    image: string;
    eyebrow: string;
    title: string;
    description: string;
}

const props = defineProps<{
    slides: HeroSlide[];
    activeIndex: number;
    categories: ServiceCategory[];
    typeOptions: Array<{ label: string; value: string }>;
    priceRanges: ListingPriceRange[];
    metrics: Array<{ label: string; value: string }>;
}>();

const query = defineModel<string>('query', { required: true });
const city = defineModel<string>('city', { required: true });
const category = defineModel<string>('category', { required: true });
const type = defineModel<string>('type', { required: true });
const price = defineModel<string>('price', { required: true });

defineEmits<{
    search: [];
}>();

const activeSlide = computed(() => props.slides[props.activeIndex] ?? props.slides[0]);
</script>

<template>
    <section class="relative min-h-[700px] overflow-hidden bg-zinc-950 text-white lg:min-h-[760px]">
        <img
            v-for="(slide, index) in slides"
            v-show="activeIndex === index"
            :key="slide.title"
            :src="slide.image"
            :alt="slide.eyebrow"
            class="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700"
        />
        <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,14,20,0.92)_0%,rgba(9,14,20,0.72)_43%,rgba(9,14,20,0.22)_100%)]" />
        <div class="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-stone-50 to-transparent" />

        <div class="relative mx-auto grid min-h-[700px] max-w-7xl content-end gap-8 px-4 pb-12 pt-32 sm:px-6 lg:min-h-[760px] lg:grid-cols-[minmax(0,1.02fr)_390px] lg:items-end lg:pb-16">
            <div class="max-w-5xl">
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                    {{ activeSlide.eyebrow }}
                </p>
                <h1 class="mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-normal sm:text-7xl">
                    {{ activeSlide.title }}
                </h1>
                <p class="mt-6 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
                    {{ activeSlide.description }}
                </p>

                <div class="mt-9 max-w-6xl">
                    <LandingSearchPanel
                        v-model:query="query"
                        v-model:city="city"
                        v-model:category="category"
                        v-model:type="type"
                        v-model:price="price"
                        :categories="categories"
                        :type-options="typeOptions"
                        :price-ranges="priceRanges"
                        @submit="$emit('search')"
                    />
                </div>

            </div>

            <aside class="hidden rounded-lg border border-white/16 bg-white/12 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl lg:block">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">What you can find</p>
                <div class="mt-5 grid gap-3">
                    <div v-for="metric in metrics" :key="metric.label" class="rounded-md bg-white p-4 text-zinc-950">
                        <p class="text-2xl font-semibold">{{ metric.value }}</p>
                        <p class="mt-1 text-sm text-zinc-500">{{ metric.label }}</p>
                    </div>
                </div>
            </aside>
        </div>
    </section>
</template>
