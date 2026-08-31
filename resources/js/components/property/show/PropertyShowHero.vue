<script setup lang="ts">
import { Link, router } from '@inertiajs/vue3';
import { computed, ref, watch } from 'vue';
import { collection } from '@/lib/domain';
import {
    configuredDisplayItems,
    propertyDate,
    propertyPrice,
    propertyPublicLocation,
    propertyTransactionLabel,
} from '@/lib/propertyShow';
import type { PropertyRecord } from '@/types/domain';
import PropertyShowIcon from './PropertyShowIcon.vue';

const props = defineProps<{
    property: PropertyRecord;
}>();

const activeImageIndex = ref(0);
const images = computed(() => collection(props.property.images));
const activeImage = computed(() => images.value[activeImageIndex.value] || images.value[0]);
const thumbnails = computed(() => images.value.slice(0, 5));
const hiddenCount = computed(() => Math.max(images.value.length - thumbnails.value.length, 0));
const listedDate = computed(() => propertyDate(props.property.created_at));
const heroFacts = computed(() => configuredDisplayItems(props.property, 'hero', 5));
const isSaved = ref(Boolean(props.property.is_saved));
const isSaving = ref(false);

watch(
    () => props.property.is_saved,
    (saved) => {
        isSaved.value = Boolean(saved);
    },
);

function moveImage(direction: -1 | 1): void {
    if (!images.value.length) return;

    activeImageIndex.value = (activeImageIndex.value + direction + images.value.length) % images.value.length;
}

function saveProperty(): void {
    if (isSaving.value) return;

    router.post('/saved-items', {
        item_type: 'property',
        property_id: props.property.id,
        marketplace_listing_id: null,
    }, {
        preserveScroll: true,
        onStart: () => {
            isSaving.value = true;
        },
        onSuccess: () => {
            isSaved.value = !isSaved.value;
        },
        onFinish: () => {
            isSaving.value = false;
        },
    });
}
</script>

<template>
    <section class="grid gap-7 lg:grid-cols-[minmax(280px,0.9fr)_minmax(430px,1.15fr)_360px]">
        <div class="min-w-0 py-3">
            <div class="flex flex-wrap items-center gap-4">
                <span class="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-emerald-900">
                    {{ propertyTransactionLabel(property) }}
                </span>
                <span class="inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                    <PropertyShowIcon name="gem" :size="17" :stroke-width="2.2" />
                    Premium Listing
                </span>
            </div>

            <h1 class="mt-6 max-w-[520px] font-serif text-[44px] font-bold leading-[0.98] tracking-normal text-slate-950">
                {{ property.title }}
            </h1>

            <p class="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-800">
                <PropertyShowIcon name="map-pin" :size="21" :stroke-width="2.15" class="text-slate-700" />
                <span>{{ propertyPublicLocation(property) }}</span>
                <span class="text-slate-300">•</span>
                <a href="#location" class="text-emerald-900">View on map</a>
            </p>

            <p v-if="property.description" class="mt-6 max-w-[460px] text-sm leading-7 text-slate-700">{{ property.description }}</p>

            <div v-if="heroFacts.length" class="mt-9 grid gap-4 text-slate-900" :class="heroFacts.length >= 5 ? 'grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'">
                <div v-for="fact in heroFacts" :key="fact.label">
                    <span class="flex items-center gap-2 text-base font-bold">
                        <PropertyShowIcon :name="fact.icon" :size="20" :stroke-width="2.1" class="text-slate-600" />
                        <span>{{ fact.value }}</span>
                    </span>
                    <span class="mt-1 block text-xs text-slate-500">{{ fact.label }}</span>
                </div>
            </div>

            <div class="mt-10">
                <p class="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Listed price</p>
                <p class="mt-4 text-[42px] font-extrabold leading-none tracking-normal text-emerald-900">{{ propertyPrice(property) }}</p>
            </div>

            <div class="mt-6 flex max-w-[450px] items-center gap-4 rounded-xl bg-emerald-50 px-5 py-5 text-sm font-semibold text-emerald-900">
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-200 bg-white">
                    <PropertyShowIcon name="shield" :size="20" :stroke-width="2.1" />
                </span>
                <span>Inspection first. Seller contact shared only after booking.</span>
            </div>
        </div>

        <div class="min-w-0">
            <div class="relative overflow-hidden rounded-[18px] bg-slate-100 shadow-[0_16px_36px_-24px_rgb(15_23_42_/_0.42)]">
                <img
                    v-if="activeImage?.url"
                    :src="activeImage.url"
                    :alt="activeImage.alt_text || property.title"
                    class="aspect-[1.08/1] w-full object-cover"
                    decoding="async"
                />
                <div v-else class="grid aspect-[1.08/1] place-items-center text-sm font-bold text-slate-500">RANDSA</div>

                <button
                    type="button"
                    class="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full border-2 border-white/80 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] backdrop-blur transition hover:bg-white/20 disabled:opacity-70"
                    :class="isSaved ? 'bg-white/25' : 'bg-white/10'"
                    :aria-label="isSaved ? 'Remove from saved properties' : 'Save property'"
                    :disabled="isSaving"
                    @click="saveProperty"
                >
                    <PropertyShowIcon name="heart" :size="27" :stroke-width="2.15" :class="isSaved ? 'fill-current' : ''" />
                </button>

                <div v-if="images.length > 1" class="absolute bottom-5 left-5 flex gap-2">
                    <button type="button" class="grid h-12 w-12 place-items-center rounded-full border-2 border-white/80 bg-slate-950/35 text-white shadow-[0_10px_24px_rgba(15,23,42,0.2)] backdrop-blur transition hover:bg-slate-950/45" aria-label="Previous image" @click="moveImage(-1)">
                        <PropertyShowIcon name="chevron-left" :size="28" :stroke-width="2.6" />
                    </button>
                    <button type="button" class="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.2)] transition hover:bg-slate-100" aria-label="Next image" @click="moveImage(1)">
                        <PropertyShowIcon name="chevron-right" :size="28" :stroke-width="2.6" />
                    </button>
                </div>

                <span v-if="images.length" class="absolute bottom-5 right-5 rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white">
                    {{ activeImageIndex + 1 }} / {{ images.length }}
                </span>
            </div>

            <div v-if="thumbnails.length > 1" class="mt-3 grid grid-cols-5 gap-2">
                <button
                    v-for="(image, index) in thumbnails"
                    :key="image.id || image.url"
                    type="button"
                    class="relative overflow-hidden rounded-xl border bg-slate-100 transition"
                    :class="activeImageIndex === index ? 'border-emerald-800' : 'border-slate-200 hover:border-slate-300'"
                    @click="activeImageIndex = index"
                >
                    <img :src="image.url" :alt="image.alt_text || property.title" class="aspect-[1.28/1] w-full object-cover" loading="lazy" decoding="async" />
                    <span v-if="hiddenCount && index === thumbnails.length - 1" class="absolute inset-0 grid place-items-center bg-black/45 text-lg font-bold text-white">+{{ hiddenCount }}</span>
                </button>
            </div>
        </div>

        <aside class="rounded-[18px] border border-slate-200 bg-white p-7 shadow-[0_18px_42px_-34px_rgb(15_23_42_/_0.5)]">
            <p class="text-sm text-slate-700">Ready to take the next step?</p>
            <h2 class="mt-2 font-serif text-2xl font-bold tracking-normal text-slate-950">Schedule an inspection</h2>
            <p class="mt-3 text-sm leading-6 text-slate-600">Start with an inspection. Continue payment after you're satisfied.</p>

            <div class="mt-7 grid gap-4">
                <Link :href="`/booking/${property.id}`" class="rounded-xl bg-emerald-900 px-5 py-4 text-center text-sm font-bold text-white shadow-[0_14px_28px_-18px_rgb(6_95_70_/_0.65)] transition hover:bg-emerald-800">
                    <span class="inline-flex items-center justify-center gap-3">
                        <PropertyShowIcon name="calendar" :size="20" :stroke-width="2.1" />
                        Schedule inspection
                    </span>
                </Link>
                <Link :href="`/booking/${property.id}`" class="rounded-xl border border-emerald-900/25 px-5 py-4 text-center text-sm font-bold text-emerald-900 transition hover:bg-emerald-50">
                    <span class="inline-flex items-center justify-center gap-3">
                        <PropertyShowIcon name="whatsapp" :size="20" :stroke-width="2.1" />
                        Chat on WhatsApp
                    </span>
                </Link>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-3">
                <button
                    type="button"
                    class="rounded-xl border px-4 py-5 text-sm font-semibold transition disabled:opacity-70"
                    :class="isSaved ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-900 hover:bg-slate-50'"
                    :disabled="isSaving"
                    @click="saveProperty"
                >
                    <PropertyShowIcon name="heart" :size="25" :stroke-width="2.1" class="mx-auto mb-2" :class="isSaved ? 'fill-current' : ''" />
                    {{ isSaved ? 'Saved' : 'Save property' }}
                </button>
                <button type="button" class="rounded-xl border border-slate-200 px-4 py-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                    <PropertyShowIcon name="share" :size="25" :stroke-width="2.1" class="mx-auto mb-2" />
                    Share listing
                </button>
            </div>

            <div class="mt-6 rounded-xl bg-emerald-50 p-5 text-sm text-emerald-950">
                <div class="flex gap-4">
                    <PropertyShowIcon name="lock" :size="24" :stroke-width="2.1" class="mt-0.5 shrink-0 text-emerald-900" />
                    <div>
                        <p class="font-bold">Seller contact protected</p>
                        <p class="mt-2 leading-5 text-emerald-900/80">Exact address and seller contact are shared after inspection booking.</p>
                    </div>
                </div>
            </div>

            <div class="mt-6 border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500">
                <p v-if="listedDate">Listed on {{ listedDate }}</p>
                <p>Property ID: RND-{{ String(property.id).padStart(3, '0') }}</p>
            </div>
        </aside>
    </section>
</template>
