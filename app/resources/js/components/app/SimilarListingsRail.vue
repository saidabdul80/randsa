<script setup lang="ts">
import { Link, router } from '@inertiajs/vue3';
import { ArrowRight, Heart } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { collection, listingImage, listingLocation, listingPrice } from '@/lib/domain';
import type { CollectionLike, MarketplaceListing, PropertyRecord } from '@/types/domain';

const props = withDefaults(
    defineProps<{
        title: string;
        eyebrow?: string;
        description?: string;
        items?: CollectionLike<PropertyRecord | MarketplaceListing>;
        source: 'property' | 'listing';
    }>(),
    {
        eyebrow: 'Continue exploring',
        description: '',
    },
);

const records = computed(() => collection(props.items).slice(0, 8));
const savedState = ref<Record<number, boolean>>({});

watch(
    records,
    (items) => {
        savedState.value = items.reduce<Record<number, boolean>>((state, item) => {
            state[item.id] = savedState.value[item.id] ?? Boolean(item.is_saved);

            return state;
        }, {});
    },
    { immediate: true },
);

function isSaved(item: PropertyRecord | MarketplaceListing): boolean {
    return savedState.value[item.id] ?? Boolean(item.is_saved);
}

function detailHref(item: PropertyRecord | MarketplaceListing): string {
    return props.source === 'property' ? `/properties/${item.id}` : `/listings/${item.id}`;
}

function categoryLabel(item: PropertyRecord | MarketplaceListing): string {
    return item.sub_category?.label || item.category?.label || (props.source === 'property' ? 'Property' : 'Listing');
}

function saveItem(item: PropertyRecord | MarketplaceListing): void {
    router.post('/saved-items', {
        item_type: props.source,
        property_id: props.source === 'property' ? item.id : null,
        marketplace_listing_id: props.source === 'listing' ? item.id : null,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            savedState.value[item.id] = !isSaved(item);
        },
    });
}
</script>

<template>
    <section v-if="records.length" class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.55)] sm:p-6">
        <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{{ eyebrow }}</p>
                <h2 class="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">{{ title }}</h2>
                <p v-if="description" class="mt-1 text-sm text-zinc-500">{{ description }}</p>
            </div>
            <Link href="/#listings" class="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
        </header>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article
                v-for="item in records"
                :key="`${props.source}-${item.id}`"
                class="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-950/10"
            >
                <Link :href="detailHref(item)" class="absolute inset-0 z-10 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" :aria-label="`Open ${item.title}`" />

                <div class="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                    <img
                        v-if="listingImage(item)"
                        :src="listingImage(item)"
                        :alt="item.title"
                        loading="lazy"
                        decoding="async"
                        class="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                    />
                    <div v-else class="grid h-full place-items-center text-sm font-semibold text-zinc-500">RANDSA</div>
                    <span class="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-sm">
                        {{ props.source === 'property' && 'is_available' in item && !item.is_available ? 'Unavailable' : 'Available' }}
                    </span>
                    <button
                        type="button"
                        class="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm transition hover:scale-105"
                        :class="isSaved(item) ? 'text-rose-500' : 'text-zinc-700'"
                        :aria-label="isSaved(item) ? 'Remove from saved listings' : 'Save'"
                        @click.stop="saveItem(item)"
                    >
                        <Heart class="h-5 w-5" :class="isSaved(item) ? 'fill-current' : ''" stroke-width="2.1" />
                    </button>
                </div>

                <div class="p-4">
                    <p class="truncate text-xs font-bold uppercase tracking-[0.14em] text-blue-600">{{ categoryLabel(item) }}</p>
                    <h3 class="mt-2 line-clamp-2 min-h-12 text-lg font-semibold leading-6 text-zinc-950">{{ item.title }}</h3>
                    <p class="mt-2 truncate text-sm text-zinc-500">{{ listingLocation(item) }}</p>
                    <p class="mt-4 truncate text-lg font-bold tabular-nums text-emerald-700">{{ listingPrice(item) }}</p>
                    <div class="relative z-20 mt-5 grid grid-cols-[1fr_1fr_44px] gap-2">
                        <Link :href="detailHref(item)" class="rounded-xl bg-zinc-50 px-3 py-3 text-center text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100">
                            Quick view
                        </Link>
                        <button type="button" class="rounded-xl bg-zinc-50 px-3 py-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100">
                            Compare
                        </button>
                        <Link :href="detailHref(item)" class="grid place-items-center rounded-xl bg-zinc-50 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100" aria-label="Open listing">
                            <ArrowRight class="h-4 w-4" stroke-width="2.1" />
                        </Link>
                    </div>
                </div>
            </article>
        </div>
    </section>
</template>
