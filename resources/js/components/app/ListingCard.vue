<script setup lang="ts">
import { Link, router, usePage } from '@inertiajs/vue3';
import {
    ArrowRight,
    CalendarCheck,
    Heart,
    MapPin,
    MessageCircle,
} from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import {
    listingImage,
    listingLocation,
    listingPrice,
    statusLabel,
} from '@/lib/domain';
import {
    configuredDisplayItems,
    propertyTransactionLabel,
} from '@/lib/propertyShow';
import type {
    AppPageProps,
    MarketplaceListing,
    PropertyRecord,
} from '@/types/domain';
import PropertyShowIcon from '@/components/property/show/PropertyShowIcon.vue';
import StatusBadge from './StatusBadge.vue';

const props = withDefaults(
    defineProps<{
        item: PropertyRecord | MarketplaceListing;
        source: 'property' | 'listing';
        manage?: boolean;
        compact?: boolean;
    }>(),
    {
        manage: false,
        compact: false,
    },
);

const emit = defineEmits<{
    book: [];
}>();

const detailHref =
    props.source === 'property'
        ? `/properties/${props.item.id}`
        : `/listings/${props.item.id}`;
const editHref =
    props.source === 'property'
        ? `/edit-property/${props.item.id}`
        : `/edit-listing/${props.item.id}`;
const image = listingImage(props.item);
const page = usePage<AppPageProps>();
const user = computed(() => page.props.auth?.user ?? null);
const isSaved = ref(Boolean(props.item.is_saved));
const isSaving = ref(false);
const categoryLabel = computed(
    () =>
        props.item.sub_category?.label ||
        props.item.category?.label ||
        (props.source === 'property' ? 'Housing' : 'Marketplace'),
);
const availabilityLabel = computed(() => {
    if (props.manage) {
        return props.source === 'listing' && 'moderation_status' in props.item
            ? props.item.moderation_status
            : props.item.status;
    }

    if (props.source === 'property') {
        return propertyTransactionLabel(props.item as PropertyRecord);
    }

    return props.item.sub_category?.transaction_type
        ? statusLabel(props.item.sub_category.transaction_type)
        : 'Available';
});
const facts = computed(() => {
    if (props.source === 'property') {
        return configuredDisplayItems(props.item as PropertyRecord, 'card', 3);
    }

    const listing = props.item as MarketplaceListing;

    return [
        {
            label: listing.sub_category?.label || 'Service',
            value: listing.category?.label || 'Marketplace',
            icon: 'tag',
        },
        listing.sub_category?.provider_kind
            ? {
                  label: 'Provider',
                  value: statusLabel(listing.sub_category.provider_kind),
                  icon: 'store',
              }
            : null,
    ]
        .filter(Boolean)
        .slice(0, 3) as Array<{ label: string; value: string; icon?: string }>;
});
const priceLabel = computed(() => listingPrice(props.item));
const hasPublishedPrice = computed(
    () => !priceLabel.value.toLowerCase().startsWith('contact for price'),
);
const publicLocation = computed(() => listingLocation(props.item));
const compactMetaLabel = computed(() => {
    const viewedCount =
        'view_count' in props.item ? props.item.view_count : null;
    const savedCount =
        'favourite_count' in props.item ? props.item.favourite_count : null;

    if (viewedCount) {
        return `${new Intl.NumberFormat('en', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(viewedCount)} viewed`;
    }

    if (savedCount) {
        return `${new Intl.NumberFormat('en', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(savedCount)} saved`;
    }

    return publicLocation.value;
});
const cardClass = computed(() =>
    props.manage ? 'min-h-[430px]' : 'min-h-[392px]',
);

function saveItem() {
    if (isSaving.value) return;

    const payload = {
        item_type: props.source,
        property_id: props.source === 'property' ? props.item.id : null,
        marketplace_listing_id:
            props.source === 'listing' ? props.item.id : null,
    };

    if (!user.value) {
        window.dispatchEvent(
            new CustomEvent('randsa:save-access', {
                detail: {
                    payload,
                    intendedUrl: `${window.location.pathname}${window.location.search}${window.location.hash}`,
                },
            }),
        );
        return;
    }

    router.post('/saved-items', payload, {
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

watch(
    () => props.item.is_saved,
    (saved) => {
        isSaved.value = Boolean(saved);
    },
);
</script>

<template>
    <article
        class="group relative overflow-hidden bg-white"
        :class="
            compact && !manage
                ? 'min-w-0'
                : [
                      'flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.62)] transition-all duration-300 ease-out focus-within:border-emerald-600 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_28px_70px_-42px_rgba(15,23,42,0.72)]',
                      cardClass,
                  ]
        "
    >
        <template v-if="compact && !manage">
            <Link
                :href="detailHref"
                class="absolute inset-0 z-10 rounded-md focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                :aria-label="`Open ${item.title}`"
            >
                <span class="sr-only">Open {{ item.title }}</span>
            </Link>

            <div
                class="relative aspect-square overflow-hidden rounded-md bg-slate-100"
            >
                <img
                    v-if="image"
                    :src="image"
                    :alt="item.title"
                    loading="lazy"
                    decoding="async"
                    class="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
                />
                <div
                    v-else
                    class="grid h-full place-items-center bg-slate-100 text-[11px] font-black tracking-[0.16em] text-slate-400"
                >
                    RANDSA
                </div>
            </div>

            <div class="px-1 pt-1.5 pb-2">
                <h3
                    class="line-clamp-2 min-h-9 text-[13px] leading-[18px] font-semibold tracking-normal text-slate-800 transition-colors group-hover:text-orange-700 sm:text-sm sm:leading-5"
                >
                    {{ item.title }}
                </h3>

                <div
                    class="mt-1 flex min-w-0 items-center gap-1 text-[11px] leading-4 font-semibold text-slate-500"
                >
                    <span
                        class="shrink-0 rounded-[3px] bg-orange-500 px-1 py-0.5 text-[10px] leading-3 font-black text-white uppercase"
                    >
                        {{ availabilityLabel }}
                    </span>
                    <span class="truncate">{{ categoryLabel }}</span>
                </div>

                <div
                    class="mt-1 flex min-w-0 items-center gap-1 text-[11px] leading-4 font-medium text-slate-500"
                >
                    <MapPin class="h-3 w-3 shrink-0" stroke-width="2.2" />
                    <span class="truncate">{{ compactMetaLabel }}</span>
                </div>

                <div
                    class="mt-1.5 flex min-w-0 items-end justify-between gap-1.5"
                >
                    <p
                        v-if="hasPublishedPrice"
                        class="min-w-0 truncate text-[17px] leading-5 font-black tracking-normal text-orange-600 tabular-nums sm:text-lg"
                    >
                        {{ priceLabel }}
                    </p>
                    <p
                        v-else
                        class="min-w-0 truncate text-[13px] leading-5 font-black text-orange-600"
                    >
                        Request quote
                    </p>

                    <button
                        type="button"
                        class="relative z-20 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-slate-900 bg-white text-slate-900 transition hover:scale-105 hover:border-emerald-600 hover:text-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                        :aria-label="`Book ${item.title}`"
                        @click.stop="emit('book')"
                    >
                        <CalendarCheck class="h-4 w-4" stroke-width="2.4" />
                    </button>
                </div>
            </div>
        </template>

        <template v-else>
            <Link
                :href="detailHref"
                class="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
                :aria-label="`Open ${item.title}`"
            >
                <span class="sr-only">Open {{ item.title }}</span>
            </Link>

            <div
                class="relative mx-3 mt-3 aspect-[1.55] overflow-hidden rounded-xl bg-slate-100"
            >
                <img
                    v-if="image"
                    :src="image"
                    :alt="item.title"
                    loading="lazy"
                    decoding="async"
                    class="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                />
                <div
                    v-else
                    class="grid h-full place-items-center bg-slate-100 text-sm font-black tracking-[0.18em] text-slate-400"
                >
                    RANDSA
                </div>
                <span
                    class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/42 to-transparent"
                    aria-hidden="true"
                />

                <div class="absolute top-3 left-3 z-20">
                    <StatusBadge v-if="manage" :status="availabilityLabel" />
                    <span
                        v-else
                        class="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-emerald-800 uppercase shadow-sm ring-1 ring-emerald-100"
                    >
                        {{ availabilityLabel }}
                    </span>
                </div>

                <button
                    v-if="!manage"
                    type="button"
                    class="absolute top-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/92 text-slate-700 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.8)] backdrop-blur transition hover:scale-105 hover:text-rose-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70 disabled:opacity-70"
                    :class="isSaved ? 'text-rose-500' : ''"
                    :aria-label="
                        isSaved ? 'Remove from saved listings' : 'Save listing'
                    "
                    :disabled="isSaving"
                    @click.stop="saveItem"
                >
                    <Heart
                        class="h-5 w-5"
                        :class="isSaved ? 'fill-current' : ''"
                        stroke-width="2.1"
                    />
                </button>
            </div>

            <div class="flex flex-1 flex-col px-4 pt-3 pb-4">
                <p
                    class="truncate text-[11px] font-black tracking-[0.14em] text-emerald-700 uppercase"
                >
                    {{ categoryLabel }}
                </p>
                <h3
                    class="mt-2 line-clamp-2 min-h-13 text-[17px] leading-6 font-black tracking-normal text-slate-950 transition-colors group-hover:text-emerald-800"
                >
                    {{ item.title }}
                </h3>

                <p
                    class="mt-2 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-500"
                >
                    <MapPin class="h-3.5 w-3.5 shrink-0" stroke-width="2.1" />
                    <span class="truncate">{{ publicLocation }}</span>
                </p>

                <div class="mt-4 grid min-h-10 grid-cols-3 gap-2">
                    <div
                        v-for="fact in facts"
                        :key="`${fact.label}:${fact.value}`"
                        class="min-w-0"
                    >
                        <p
                            class="flex items-center gap-1.5 text-xs font-bold text-slate-700"
                        >
                            <PropertyShowIcon
                                :name="fact.icon || fact.label"
                                :size="14"
                                :stroke-width="2"
                            />
                            <span class="truncate">{{ fact.value }}</span>
                        </p>
                        <p
                            class="mt-1 truncate text-[11px] font-medium text-slate-500"
                        >
                            {{ fact.label }}
                        </p>
                    </div>
                </div>

                <div class="mt-auto pt-5">
                    <p
                        v-if="hasPublishedPrice"
                        class="truncate text-xl font-black tracking-normal text-emerald-800 tabular-nums"
                    >
                        {{ priceLabel }}
                    </p>
                    <p
                        v-else
                        class="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"
                    >
                        <MessageCircle class="h-4 w-4" stroke-width="2.1" />
                        Request quote
                    </p>
                </div>

                <div
                    v-if="manage"
                    class="relative z-20 mt-4 flex flex-wrap gap-2"
                >
                    <Link
                        :href="detailHref"
                        class="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                        Open
                    </Link>
                    <Link
                        :href="editHref"
                        class="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                        Edit
                    </Link>
                    <Link
                        v-if="source === 'property'"
                        :href="`/booking/${item.id}`"
                        class="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
                    >
                        Book
                    </Link>
                </div>
                <div
                    v-else
                    class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-bold text-slate-700"
                >
                    <span>View details</span>
                    <ArrowRight
                        class="h-4 w-4 transition group-hover:translate-x-1"
                        stroke-width="2.1"
                    />
                </div>
            </div>
        </template>
    </article>
</template>
