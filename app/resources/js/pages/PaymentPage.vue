<script setup lang="ts">
import { computed } from 'vue';
import { useForm, usePage } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import PaginationControls from '@/components/app/PaginationControls.vue';
import RecordRow from '@/components/app/RecordRow.vue';
import { collection, listingPrice, money, resource } from '@/lib/domain';
import type { AppPageProps, MarketplaceListing, PaymentRecord, PropertyRecord, ResourceCollection } from '@/types/domain';

const props = defineProps<{
    property?: PropertyRecord | { data: PropertyRecord } | null;
    listing?: MarketplaceListing | { data: MarketplaceListing } | null;
    payments?: ResourceCollection<PaymentRecord>;
}>();

const page = usePage<AppPageProps>();
const property = computed(() => resource(props.property));
const listing = computed(() => resource(props.listing));
const item = computed(() => property.value || listing.value);
const user = computed(() => page.props.auth?.user);
const form = useForm({
    property_id: property.value?.id || null,
    marketplace_listing_id: listing.value?.id || null,
    booking_id: null,
    item_title: item.value?.title || '',
    payer_name: user.value?.name || '',
    payer_email: user.value?.email || '',
    amount: property.value?.base_price || listing.value?.pricing.amount || '',
    currency: property.value?.currency || listing.value?.pricing.currency || 'NGN',
    payment_type: property.value ? 'property_payment' : listing.value ? 'listing_payment' : 'general_payment',
});

function submit() {
    form.post('/payments');
}
</script>

<template>
    <AppLayout title="Payment" eyebrow="Transaction">
        <div class="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-10">
            <form class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]" @submit.prevent="submit">
                <h2 class="text-lg font-semibold text-zinc-950">Create payment record</h2>
                <p v-if="item" class="mt-2 text-sm text-zinc-600">{{ item.title }} · {{ listingPrice(item) }}</p>
                <div class="mt-5 grid gap-4 sm:grid-cols-2">
                    <AppTextInput v-model="form.item_title" label="Item title" class="sm:col-span-2" />
                    <AppTextInput v-model="form.payer_name" label="Payer name" autocomplete="name" />
                    <AppTextInput v-model="form.payer_email" label="Payer email" type="email" autocomplete="email" />
                    <AppTextInput v-model="form.amount" label="Amount" type="number" min="1" />
                    <AppTextInput v-model="form.currency" label="Currency" />
                </div>
                <button type="submit" class="mt-5 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" :disabled="form.processing">
                    {{ form.processing ? 'Creating...' : 'Create payment' }}
                </button>
            </form>

            <aside class="space-y-3">
                <div class="rounded-[18px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Payment workflow</p>
                    <h2 class="mt-2 text-lg font-semibold text-zinc-950">Backend verification</h2>
                    <p class="mt-2 text-sm leading-6 text-zinc-600">Payments are recorded for gateway verification before the listing or booking is marked paid.</p>
                </div>
                <h2 class="text-lg font-semibold text-zinc-950">Payment history</h2>
                <RecordRow
                    v-for="payment in collection(props.payments).slice(0, 8)"
                    :key="payment.id"
                    :title="payment.item_title"
                    :subtitle="payment.paystack_reference"
                    :meta="money(payment.amount, payment.currency)"
                    :status="payment.status"
                />
                <PaginationControls :collection="payments" label="Payment history" />
            </aside>
        </div>
    </AppLayout>
</template>
