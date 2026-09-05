<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePage } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
import PaginationControls from '@/components/app/PaginationControls.vue';
import RecordRow from '@/components/app/RecordRow.vue';
import QuickBookingModal from '@/components/landing/QuickBookingModal.vue';
import {
    collection,
    listingLocation,
    listingPrice,
    resource,
} from '@/lib/domain';
import type {
    AppPageProps,
    BookingRecord,
    MarketplaceListing,
    PropertyRecord,
    ResourceCollection,
} from '@/types/domain';

const props = defineProps<{
    property?: PropertyRecord | { data: PropertyRecord } | null;
    listing?: MarketplaceListing | { data: MarketplaceListing } | null;
    bookings?: ResourceCollection<BookingRecord> | BookingRecord[];
}>();

const page = usePage<AppPageProps>();
const user = computed(() => page.props.auth?.user ?? null);
const property = computed(() => resource(props.property));
const listing = computed(() => resource(props.listing));
const item = computed(() => property.value || listing.value);
const itemSource = computed(() =>
    property.value ? 'property' : listing.value ? 'listing' : null,
);
const needsContactDetails = computed(() => !user.value);
const bookingModalOpen = ref(Boolean(item.value));
const bookingEntry = computed(() => {
    if (!item.value || !itemSource.value) return null;

    return itemSource.value === 'property'
        ? { source: 'property' as const, item: item.value }
        : { source: 'listing' as const, item: item.value };
});
const paginatedBookings = computed(() =>
    props.bookings && !Array.isArray(props.bookings)
        ? props.bookings
        : undefined,
);
</script>

<template>
    <AppLayout
        :title="property ? 'Book inspection' : 'Request booking'"
        eyebrow="Booking"
    >
        <div
            class="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-10"
        >
            <section class="space-y-4">
                <div
                    v-if="item"
                    class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]"
                >
                    <p
                        class="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase"
                    >
                        {{
                            item.sub_category?.label ||
                            item.category?.label ||
                            'Listing'
                        }}
                    </p>
                    <h2
                        class="mt-2 text-2xl font-semibold tracking-normal text-zinc-950"
                    >
                        {{ item.title }}
                    </h2>
                    <p class="mt-2 text-sm font-semibold text-zinc-950">
                        {{ listingPrice(item) }}
                    </p>
                    <p class="mt-3 text-sm leading-6 text-zinc-600">
                        {{
                            item.description ||
                            'Send a booking request and continue from your bookings.'
                        }}
                    </p>

                    <div
                        class="mt-5 grid gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-3"
                    >
                        <div class="rounded-xl bg-zinc-50 px-4 py-3">
                            <p
                                class="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase"
                            >
                                Location
                            </p>
                            <p class="mt-1 text-sm font-bold text-zinc-950">
                                {{ listingLocation(item) }}
                            </p>
                        </div>
                        <div class="rounded-xl bg-zinc-50 px-4 py-3">
                            <p
                                class="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase"
                            >
                                Workflow
                            </p>
                            <p class="mt-1 text-sm font-bold text-zinc-950">
                                {{
                                    property
                                        ? 'Inspection first'
                                        : 'Request first'
                                }}
                            </p>
                        </div>
                        <button
                            type="button"
                            class="rounded-xl bg-zinc-950 px-5 py-4 text-sm font-bold text-white transition hover:bg-zinc-800"
                            @click="bookingModalOpen = true"
                        >
                            Request booking
                        </button>
                    </div>
                </div>
            </section>

            <aside class="space-y-3">
                <div
                    class="rounded-[18px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]"
                >
                    <p
                        class="text-xs font-semibold tracking-[0.18em] text-blue-600 uppercase"
                    >
                        Booking workflow
                    </p>
                    <h2 class="mt-2 text-lg font-semibold text-zinc-950">
                        {{
                            needsContactDetails
                                ? 'Quick request'
                                : itemSource === 'property'
                                  ? 'Inspection first'
                                  : 'Request first'
                        }}
                    </h2>
                    <p class="mt-2 text-sm leading-6 text-zinc-600">
                        {{
                            needsContactDetails
                                ? 'Submit with your phone and email. You can update the rest of your profile later.'
                                : itemSource === 'property'
                                  ? 'Exact address and contact details are released through the booking workflow.'
                                  : 'The provider can confirm schedule, delivery, pickup, or onsite service details.'
                        }}
                    </p>
                </div>
                <template v-if="user">
                    <h2 class="text-lg font-semibold text-zinc-950">
                        Recent bookings
                    </h2>
                    <RecordRow
                        v-for="booking in collection(props.bookings).slice(
                            0,
                            6,
                        )"
                        :key="booking.id"
                        :title="
                            booking.property?.title ||
                            booking.marketplace_listing?.title ||
                            `Booking #${booking.id}`
                        "
                        :subtitle="
                            booking.inspection_date ||
                            booking.start_at ||
                            'Date pending'
                        "
                        :meta="
                            booking.estimated_total
                                ? `Estimated total: ${booking.estimated_total}`
                                : undefined
                        "
                        :status="booking.status"
                    />
                    <PaginationControls
                        :collection="paginatedBookings"
                        label="Recent bookings"
                    />
                </template>
            </aside>
        </div>

        <QuickBookingModal
            :entry="bookingEntry"
            :open="bookingModalOpen"
            @close="bookingModalOpen = false"
        />
    </AppLayout>
</template>
