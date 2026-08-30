<script setup lang="ts">
import { Link, router } from '@inertiajs/vue3';
import { computed } from 'vue';
import AppLayout from '@/components/app/AppLayout.vue';
import FieldValueList from '@/components/app/FieldValueList.vue';
import MediaGallery from '@/components/app/MediaGallery.vue';
import SimilarListingsRail from '@/components/app/SimilarListingsRail.vue';
import StatusBadge from '@/components/app/StatusBadge.vue';
import PropertyDetailsHeader from '@/components/property/PropertyDetailsHeader.vue';
import PropertyDetailsSideNav from '@/components/property/PropertyDetailsSideNav.vue';
import { collection, listingLocation, listingPrice, resource } from '@/lib/domain';
import type { MarketplaceListing } from '@/types/domain';

const props = defineProps<{
    listing: MarketplaceListing | { data: MarketplaceListing };
    similarListings?: { data: MarketplaceListing[] } | MarketplaceListing[];
}>();

const listing = computed(() => resource(props.listing)!);
const similarListings = computed(() => collection(props.similarListings));
const callLink = computed(() => {
    const phone = listing.value.contact.phone?.replace(/[^\d+]/g, '') ?? '';

    return phone ? `tel:${phone}` : '';
});
const whatsappLink = computed(() => {
    if (!listing.value.contact.whatsapp_enabled) return '';

    const phone = listing.value.contact.phone?.replace(/\D/g, '') ?? '';

    return phone ? `https://wa.me/${phone}` : '';
});
const sideLinks = [
    { href: '#summary', label: 'Summary' },
    { href: '#overview', label: 'Overview' },
    { href: '#details', label: 'Details' },
    { href: '#delivery', label: 'Fulfilment' },
    { href: '#similar', label: 'Similar listings' },
];

function saveListing() {
    router.post('/saved-items', {
        item_type: 'listing',
        property_id: null,
        marketplace_listing_id: listing.value.id,
    });
}

function goBack() {
    window.history.length > 1 ? window.history.back() : router.visit('/');
}

async function shareListing() {
    const url = window.location.href;

    if (navigator.share) {
        await navigator.share({
            title: listing.value.title,
            url,
        });
        return;
    }

    await navigator.clipboard?.writeText(url);
}
</script>

<template>
    <AppLayout :title="listing.title" bleed :show-mobile-nav="false" :show-header="false">
        <div class="min-h-screen bg-zinc-50">
            <div class="mx-auto grid max-w-[1800px] gap-3 px-4 py-3 pb-28 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-5 lg:pb-12">
                <PropertyDetailsSideNav :active-title="listing.title" context-label="Listing details" :links="sideLinks" />

                <main class="min-w-0">
                    <PropertyDetailsHeader
                        :title="listing.title"
                        kind-label="Listing details"
                        explore-href="/#listings"
                        explore-label="Explore"
                        @back="goBack"
                        @save="saveListing"
                        @share="shareListing"
                    />

                    <div class="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
                        <article class="min-w-0 space-y-5">
                            <MediaGallery :images="listing.images" :title="listing.title" />

                            <section id="summary" class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                                        {{ listing.sub_category?.label || listing.category?.label || 'Listing' }}
                                    </span>
                                    <StatusBadge :status="listing.status === 'active' ? 'Available' : listing.status" />
                                </div>
                                <h1 class="mt-4 max-w-3xl text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
                                    {{ listing.title }}
                                </h1>
                                <p class="mt-3 flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-600">
                                    <span class="h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
                                    <span class="truncate">{{ listingLocation(listing) }}</span>
                                </p>
                            </section>

                            <section id="overview" class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
                                <header>
                                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Overview</p>
                                    <h2 class="mt-2 text-xl font-semibold text-zinc-950">About this listing</h2>
                                </header>
                                <p class="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-700">
                                    {{ listing.description || 'More details are available from the listing contact.' }}
                                </p>
                            </section>

                            <div id="details">
                                <FieldValueList :values="listing.field_values" />
                            </div>

                            <section id="delivery" class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
                                <header>
                                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Fulfilment</p>
                                    <h2 class="mt-2 text-xl font-semibold text-zinc-950">Delivery and pickup</h2>
                                </header>
                                <div class="mt-5 grid gap-3 sm:grid-cols-2">
                                    <div class="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                                        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Delivery</p>
                                        <p class="mt-1 text-sm font-semibold text-zinc-950">{{ listing.delivery?.available ? 'Available' : 'Not listed' }}</p>
                                    </div>
                                    <div class="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                                        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Pickup</p>
                                        <p class="mt-1 text-sm font-semibold text-zinc-950">{{ listing.delivery?.pickup_available ? 'Available' : 'Not listed' }}</p>
                                    </div>
                                </div>
                                <p v-if="listing.delivery?.details" class="mt-4 text-sm leading-6 text-zinc-600">{{ listing.delivery.details }}</p>
                            </section>

                            <div id="similar">
                                <SimilarListingsRail
                                    title="Similar listings"
                                    description="You may also like these related services and marketplace offers."
                                    :items="similarListings"
                                    source="listing"
                                />
                            </div>
                        </article>

                        <aside class="sticky top-5 space-y-4 self-start">
                            <section class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]">
                                <div class="flex items-center justify-between gap-3">
                                    <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Available</span>
                                    <button type="button" class="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-zinc-700 transition hover:bg-zinc-50" @click="saveListing">
                                        Save
                                    </button>
                                </div>

                                <p class="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Starting price</p>
                                <p class="mt-2 text-3xl font-bold tabular-nums text-zinc-950">{{ listingPrice(listing) }}</p>

                                <dl class="my-5 grid gap-3 border-y border-zinc-100 py-4 text-sm">
                                    <div class="flex items-center justify-between gap-3">
                                        <dt class="text-zinc-500">Category</dt>
                                        <dd class="font-semibold text-zinc-950">{{ listing.sub_category?.label || listing.category?.label }}</dd>
                                    </div>
                                    <div class="flex items-center justify-between gap-3">
                                        <dt class="text-zinc-500">Location</dt>
                                        <dd class="font-semibold text-zinc-950">{{ listingLocation(listing) }}</dd>
                                    </div>
                                </dl>

                                <div class="grid gap-3">
                                    <Link :href="`/booking?listing=${listing.id}`" class="rounded-xl bg-zinc-950 px-4 py-4 text-center text-sm font-semibold text-white transition hover:bg-zinc-800">
                                        Request booking
                                    </Link>
                                    <a v-if="callLink" :href="callLink" class="rounded-xl border border-zinc-200 px-4 py-4 text-center text-sm font-semibold text-zinc-900 transition hover:border-blue-200 hover:bg-blue-50">
                                        Call listing contact
                                    </a>
                                    <a v-if="whatsappLink" :href="whatsappLink" target="_blank" rel="noreferrer" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                                        Chat on WhatsApp
                                    </a>
                                    <button type="button" class="rounded-xl border border-zinc-200 px-4 py-4 text-sm font-semibold text-zinc-900 transition hover:border-blue-200 hover:bg-blue-50" @click="saveListing">
                                        Save listing
                                    </button>
                                </div>
                            </section>

                            <section class="rounded-2xl border border-zinc-200 bg-white p-5 text-sm shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]">
                                <h2 class="text-base font-semibold text-zinc-950">Contact overview</h2>
                                <div class="mt-4 flex items-center gap-3">
                                    <span class="grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-700" aria-hidden="true">
                                        {{ listing.contact.name.charAt(0).toUpperCase() }}
                                    </span>
                                    <div>
                                        <p class="font-semibold text-zinc-950">{{ listing.contact.name }}</p>
                                        <p class="text-xs text-zinc-500">Listing contact</p>
                                    </div>
                                </div>
                                <dl class="mt-4 grid gap-3 text-sm">
                                    <div class="flex items-center justify-between gap-3">
                                        <dt class="text-zinc-500">Phone</dt>
                                        <dd class="font-semibold text-zinc-900">{{ listing.contact.phone }}</dd>
                                    </div>
                                    <div class="flex items-center justify-between gap-3">
                                        <dt class="text-zinc-500">Location</dt>
                                        <dd class="font-semibold text-zinc-900">{{ listingLocation(listing) }}</dd>
                                    </div>
                                </dl>
                            </section>

                            <section class="rounded-2xl border border-zinc-200 bg-white p-5 text-sm shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]">
                                <h2 class="text-base font-semibold text-zinc-950">Payment options</h2>
                                <div class="mt-4 grid gap-3">
                                    <Link :href="`/payment?listing=${listing.id}&type=service_fee`" class="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-50">
                                        <span>Pay service fees</span>
                                        <span aria-hidden="true">-&gt;</span>
                                    </Link>
                                </div>
                            </section>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    </AppLayout>
</template>
