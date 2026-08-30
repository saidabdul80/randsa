<script setup lang="ts">
import { Link, router } from '@inertiajs/vue3';
import { computed, ref, watch } from 'vue';
import { collection, listingImage } from '@/lib/domain';
import { configuredDisplayItems, propertyPrice, propertyPublicLocation, propertyTransactionLabel } from '@/lib/propertyShow';
import type { CollectionLike, PropertyRecord } from '@/types/domain';
import PropertyShowIcon from './PropertyShowIcon.vue';

const props = defineProps<{
    items?: CollectionLike<PropertyRecord>;
}>();

const records = computed(() => collection(props.items).slice(0, 5));
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

function isSaved(item: PropertyRecord): boolean {
    return savedState.value[item.id] ?? Boolean(item.is_saved);
}

function saveProperty(item: PropertyRecord): void {
    router.post('/saved-items', {
        item_type: 'property',
        property_id: item.id,
        marketplace_listing_id: null,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            savedState.value[item.id] = !isSaved(item);
        },
    });
}
</script>

<template>
    <section v-if="records.length" class="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.58)]">
        <header class="flex items-center justify-between gap-4">
            <h2 class="font-serif text-2xl font-bold tracking-normal text-slate-950">Similar properties you might like</h2>
            <Link href="/#listings" class="hidden text-sm font-bold text-emerald-900 sm:inline-flex">View all properties</Link>
        </header>

        <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <article
                v-for="item in records"
                :key="item.id"
                class="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_34px_-30px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.7)]"
            >
                <Link :href="`/properties/${item.id}`" class="absolute inset-0 z-10 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100" :aria-label="`Open ${item.title}`" />
                <div class="relative aspect-[1.35/1] overflow-hidden bg-slate-100">
                    <img
                        v-if="listingImage(item)"
                        :src="listingImage(item)"
                        :alt="item.title"
                        loading="lazy"
                        decoding="async"
                        class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div v-else class="grid h-full place-items-center text-sm font-bold text-slate-500">RANDSA</div>
                    <span class="absolute left-2 top-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
                        {{ propertyTransactionLabel(item) }}
                    </span>
                    <button
                        type="button"
                        class="absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm transition hover:scale-105"
                        :class="isSaved(item) ? 'text-rose-500' : 'text-slate-700'"
                        :aria-label="isSaved(item) ? 'Remove from saved properties' : 'Save property'"
                        @click.stop="saveProperty(item)"
                    >
                        <PropertyShowIcon name="heart" :size="18" :stroke-width="2.1" :class="isSaved(item) ? 'fill-current' : ''" />
                    </button>
                </div>

                <div class="p-4">
                    <h3 class="line-clamp-2 min-h-11 text-sm font-bold leading-5 text-slate-950">{{ item.title }}</h3>
                    <p class="mt-2 flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <PropertyShowIcon name="map-pin" :size="13" :stroke-width="2" class="shrink-0" />
                        <span class="truncate">{{ propertyPublicLocation(item) }}</span>
                    </p>
                    <p class="mt-4 text-base font-extrabold text-emerald-800">{{ propertyPrice(item) }}</p>
                    <div v-if="configuredDisplayItems(item, 'card', 3).length" class="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600">
                        <span v-for="fact in configuredDisplayItems(item, 'card', 3)" :key="fact.label" class="inline-flex items-center gap-1.5">
                            <PropertyShowIcon :name="fact.icon" :size="14" :stroke-width="2" />
                            {{ fact.value }} {{ fact.label }}
                        </span>
                    </div>
                </div>
            </article>
        </div>
    </section>
</template>
