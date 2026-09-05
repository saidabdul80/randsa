<script setup lang="ts">
import { X } from '@lucide/vue';
import { useForm, usePage } from '@inertiajs/vue3';
import { computed, watch } from 'vue';
import AppTextareaInput from '@/components/app/AppTextareaInput.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import AvailabilityCalendar from '@/components/booking/AvailabilityCalendar.vue';
import { listingPrice } from '@/lib/domain';
import type {
    AppPageProps,
    MarketplaceListing,
    PropertyRecord,
} from '@/types/domain';

type BookingEntry = {
    source: 'property' | 'listing';
    item: PropertyRecord | MarketplaceListing;
};

const props = defineProps<{
    entry: BookingEntry | null;
    open: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();

const page = usePage<AppPageProps>();
const user = computed(() => page.props.auth?.user ?? null);
const item = computed(() => props.entry?.item ?? null);
const config = computed(() => item.value?.sub_category?.booking_config);
const title = computed(() =>
    props.entry?.source === 'property' ? 'Book inspection' : 'Request booking',
);
const form = useForm({
    property_id: null as number | null,
    marketplace_listing_id: null as number | null,
    service_category_id: '',
    service_sub_category_id: '',
    booking_config_id: null as string | null,
    booking_mode: '',
    inspection_date: '',
    inspection_time: '',
    duration_minutes: 60,
    quantity: 1,
    pricing_unit: '',
    estimated_total: '' as string | number,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: '',
    redirect_to: 'back',
});
const errors = computed(() => Object.values(form.errors).filter(Boolean));

watch(
    () => props.entry,
    (entry) => {
        const selectedItem = entry?.item;

        form.clearErrors();
        form.property_id =
            entry?.source === 'property' ? selectedItem?.id || null : null;
        form.marketplace_listing_id =
            entry?.source === 'listing' ? selectedItem?.id || null : null;
        form.service_category_id = selectedItem?.service_category_id || '';
        form.service_sub_category_id =
            selectedItem?.service_sub_category_id || '';
        form.booking_config_id =
            selectedItem?.sub_category?.booking_config?.id || null;
        form.booking_mode =
            selectedItem?.sub_category?.booking_config?.booking_mode ||
            (entry?.source === 'property' ? 'inspection' : 'service_request');
        form.inspection_date = '';
        form.inspection_time = '';
        form.duration_minutes =
            selectedItem?.sub_category?.booking_config
                ?.default_duration_minutes || 60;
        form.quantity = 1;
        form.pricing_unit =
            entry?.source === 'property'
                ? (selectedItem as PropertyRecord | undefined)?.pricing_unit ||
                  ''
                : (selectedItem as MarketplaceListing | undefined)?.pricing
                      .billing_period || '';
        form.estimated_total =
            entry?.source === 'property'
                ? (selectedItem as PropertyRecord | undefined)?.base_price || ''
                : (selectedItem as MarketplaceListing | undefined)?.pricing
                      .amount || '';
        form.customer_name = user.value?.name || '';
        form.customer_email = user.value?.email || '';
        form.customer_phone = user.value?.phone || '';
        form.notes = '';
        form.redirect_to = 'back';
    },
    { immediate: true },
);

function submit() {
    if (!item.value) return;

    form.post('/bookings', {
        preserveScroll: true,
        onSuccess: () => {
            emit('close');
        },
    });
}
</script>

<template>
    <div
        v-if="open && item"
        class="fixed inset-0 z-50 grid place-items-end bg-slate-950/54 p-0 backdrop-blur-[2px] sm:place-items-center sm:px-4 sm:py-6"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @click.self="emit('close')"
    >
        <form
            class="relative flex max-h-[94vh] w-full max-w-[540px] min-w-0 flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_28px_90px_-32px_rgba(15,23,42,0.75)] sm:max-h-[92vh] sm:rounded-2xl"
            @submit.prevent="submit"
        >
            <button
                type="button"
                class="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="Close"
                @click="emit('close')"
            >
                <X class="h-6 w-6" stroke-width="2.2" />
            </button>

            <div class="min-w-0 overflow-y-auto px-4 pt-5 pb-4 sm:px-7">
                <div class="min-w-0 pr-10">
                    <p
                        class="truncate text-[11px] font-black tracking-[0.18em] text-emerald-700 uppercase"
                    >
                        {{
                            item.sub_category?.label ||
                            item.category?.label ||
                            'Booking'
                        }}
                    </p>
                    <h2
                        class="mt-2 text-2xl leading-8 font-black tracking-normal text-slate-950"
                    >
                        {{ title }}
                    </h2>
                    <p
                        class="mt-1 line-clamp-2 min-w-0 text-sm leading-6 font-semibold break-words text-slate-500"
                    >
                        {{ item.title }} · {{ listingPrice(item) }}
                    </p>
                </div>

                <div
                    v-if="errors.length"
                    class="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                >
                    <p v-for="error in errors" :key="error">{{ error }}</p>
                </div>

                <div class="mt-5 grid min-w-0 gap-3">
                    <AppTextInput
                        v-model="form.customer_name"
                        label="Name"
                        autocomplete="name"
                        placeholder="Your name"
                        compact
                        required
                    />
                    <AppTextInput
                        v-model="form.customer_email"
                        label="Email"
                        type="email"
                        autocomplete="email"
                        placeholder="you@example.com"
                        compact
                        required
                    />
                    <AppTextInput
                        v-model="form.customer_phone"
                        label="Phone"
                        autocomplete="tel"
                        placeholder="Your phone number"
                        compact
                        required
                    />
                    <AvailabilityCalendar
                        v-model:selected-date="form.inspection_date"
                        v-model:selected-time="form.inspection_time"
                        :slots="item.availability_slots"
                        :rules="item.availability_rules"
                        :date-label="config?.date_label || 'Available dates'"
                        :time-label="
                            config?.start_time_label || 'Available times'
                        "
                        surface="flush"
                    />
                    <AppTextInput
                        v-model="form.estimated_total"
                        label="Estimated total"
                        type="number"
                        min="0"
                        compact
                    />
                    <AppTextareaInput
                        v-model="form.notes"
                        label="Notes"
                        :rows="3"
                        placeholder="Anything the provider should know"
                        compact
                    />
                </div>
            </div>

            <div
                class="shrink-0 border-t border-slate-100 bg-white px-4 py-3 shadow-[0_-18px_36px_-30px_rgba(15,23,42,0.7)] sm:px-7 sm:py-5"
            >
                <button
                    type="submit"
                    class="w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="form.processing"
                >
                    {{
                        form.processing
                            ? 'Sending...'
                            : config?.primary_action_label || 'Submit request'
                    }}
                </button>
            </div>
        </form>
    </div>
</template>
