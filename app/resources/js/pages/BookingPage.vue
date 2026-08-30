<script setup lang="ts">
import { computed } from 'vue';
import { useForm } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
import AppTextareaInput from '@/components/app/AppTextareaInput.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import PaginationControls from '@/components/app/PaginationControls.vue';
import RecordRow from '@/components/app/RecordRow.vue';
import { collection, listingPrice, resource } from '@/lib/domain';
import type { BookingRecord, MarketplaceListing, PropertyRecord, ResourceCollection } from '@/types/domain';

const props = defineProps<{
    property?: PropertyRecord | { data: PropertyRecord } | null;
    listing?: MarketplaceListing | { data: MarketplaceListing } | null;
    bookings?: ResourceCollection<BookingRecord>;
}>();

const property = computed(() => resource(props.property));
const listing = computed(() => resource(props.listing));
const item = computed(() => property.value || listing.value);
const itemSource = computed(() => (property.value ? 'property' : listing.value ? 'listing' : null));
const config = computed(() => item.value?.sub_category?.booking_config);
const form = useForm({
    property_id: property.value?.id || null,
    marketplace_listing_id: listing.value?.id || null,
    service_category_id: item.value?.service_category_id || '',
    service_sub_category_id: item.value?.service_sub_category_id || '',
    booking_config_id: config.value?.id || null,
    booking_mode: config.value?.booking_mode || (property.value ? 'inspection' : 'service_request'),
    inspection_date: '',
    inspection_time: '',
    duration_minutes: config.value?.default_duration_minutes || 60,
    quantity: 1,
    pricing_unit: property.value?.pricing_unit || listing.value?.pricing.billing_period || '',
    estimated_total: property.value?.base_price || listing.value?.pricing.amount || '',
    guest_phone: '',
    notes: '',
});

function submit() {
    form.post('/bookings');
}
</script>

<template>
    <AppLayout :title="property ? 'Book inspection' : 'Request booking'" eyebrow="Booking">
        <div class="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-10">
            <section class="space-y-4">
                <div v-if="item" class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
                    <p class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{{ item.sub_category?.label || item.category?.label || 'Listing' }}</p>
                    <h2 class="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">{{ item.title }}</h2>
                    <p class="mt-2 text-sm font-semibold text-zinc-950">{{ listingPrice(item) }}</p>
                    <p class="mt-3 text-sm leading-6 text-zinc-600">{{ item.description || 'Send a booking request and continue from your bookings.' }}</p>
                </div>

                <form class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]" @submit.prevent="submit">
                    <h2 class="text-lg font-semibold text-zinc-950">{{ config?.title || 'Booking request' }}</h2>
                    <div class="mt-5 grid gap-4 sm:grid-cols-2">
                        <AppTextInput v-model="form.inspection_date" :label="config?.date_label || 'Date'" type="date" />
                        <AppTextInput v-model="form.inspection_time" :label="config?.start_time_label || 'Time'" type="time" />
                        <AppTextInput v-model="form.guest_phone" label="Phone" autocomplete="tel" placeholder="Your phone number" />
                        <AppTextInput v-model="form.estimated_total" label="Estimated total" type="number" min="0" />
                    </div>
                    <AppTextareaInput v-model="form.notes" label="Notes" :rows="4" class="mt-4" placeholder="Anything the listing contact should know" />
                    <button type="submit" class="mt-5 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" :disabled="form.processing || !item">
                        {{ form.processing ? 'Sending...' : config?.primary_action_label || 'Submit booking' }}
                    </button>
                </form>
            </section>

            <aside class="space-y-3">
                <div class="rounded-[18px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Booking workflow</p>
                    <h2 class="mt-2 text-lg font-semibold text-zinc-950">{{ itemSource === 'property' ? 'Inspection first' : 'Request first' }}</h2>
                    <p class="mt-2 text-sm leading-6 text-zinc-600">
                        {{ itemSource === 'property' ? 'Exact address and contact details are released through the booking workflow.' : 'The provider can confirm schedule, delivery, pickup, or onsite service details.' }}
                    </p>
                </div>
                <h2 class="text-lg font-semibold text-zinc-950">Recent bookings</h2>
                <RecordRow
                    v-for="booking in collection(props.bookings).slice(0, 6)"
                    :key="booking.id"
                    :title="booking.property?.title || booking.marketplace_listing?.title || `Booking #${booking.id}`"
                    :subtitle="booking.inspection_date || booking.start_at || 'Date pending'"
                    :meta="booking.estimated_total ? `Estimated total: ${booking.estimated_total}` : undefined"
                    :status="booking.status"
                />
                <PaginationControls :collection="bookings" label="Recent bookings" />
            </aside>
        </div>
    </AppLayout>
</template>
