<script setup lang="ts">
import { CheckCircle2, Info, X } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
    status?: string | null;
}>();

const visible = ref(false);
let hideTimer: number | undefined;

const messages: Record<string, { title: string; body: string }> = {
    'agent-verification-reviewed': { title: 'Verification updated', body: 'The verification request has been reviewed.' },
    'agent-verification-submitted': { title: 'Verification submitted', body: 'Your verification request has been submitted.' },
    'booking-cancelled': { title: 'Booking cancelled', body: 'The booking has been cancelled.' },
    'booking-created': { title: 'Booking created', body: 'Your booking has been created.' },
    'item-saved': { title: 'Saved', body: 'This listing has been added to your saved list.' },
    'landing-page-section-created': { title: 'Content saved', body: 'The content section has been created.' },
    'landing-page-section-deleted': { title: 'Content removed', body: 'The content section has been deleted.' },
    'landing-page-section-updated': { title: 'Content updated', body: 'The content section has been updated.' },
    'listing-created': { title: 'Listing created', body: 'Your listing has been created.' },
    'listing-deleted': { title: 'Listing deleted', body: 'The listing has been deleted.' },
    'listing-price-range-created': { title: 'Price range saved', body: 'The price range has been created.' },
    'listing-price-range-deleted': { title: 'Price range removed', body: 'The price range has been deleted.' },
    'listing-price-range-updated': { title: 'Price range updated', body: 'The price range has been updated.' },
    'listing-updated': { title: 'Listing updated', body: 'Your listing has been updated.' },
    'marketplace-listing-reviewed': { title: 'Listing reviewed', body: 'The marketplace listing has been reviewed.' },
    'notification-read': { title: 'Notification read', body: 'The notification was marked as read.' },
    'payment-created': { title: 'Payment started', body: 'Your payment record has been created.' },
    'payment-marked-successful': { title: 'Payment updated', body: 'The payment has been marked successful.' },
    'profile-updated': { title: 'Profile updated', body: 'Your profile changes have been saved.' },
    'property-created': { title: 'Property created', body: 'Your property listing has been created.' },
    'property-deleted': { title: 'Property deleted', body: 'The property listing has been deleted.' },
    'property-reviewed': { title: 'Property reviewed', body: 'The property listing has been reviewed.' },
    'property-updated': { title: 'Property updated', body: 'Your property listing has been updated.' },
    'role-created': { title: 'Role created', body: 'The role and selected permissions have been saved.' },
    'role-permissions-updated': { title: 'Permissions updated', body: 'The role permissions have been saved.' },
    'saved-item-removed': { title: 'Removed', body: 'This listing has been removed from your saved list.' },
    'service-category-created': { title: 'Category saved', body: 'The service category has been created.' },
    'service-category-deleted': { title: 'Category removed', body: 'The service category has been deleted.' },
    'service-category-updated': { title: 'Category updated', body: 'The service category has been updated.' },
    'service-field-created': { title: 'Field saved', body: 'The service field has been created.' },
    'service-field-deleted': { title: 'Field removed', body: 'The service field has been deleted.' },
    'service-field-updated': { title: 'Field updated', body: 'The service field has been updated.' },
    'service-sub-category-created': { title: 'Subcategory saved', body: 'The service subcategory has been created.' },
    'service-sub-category-deleted': { title: 'Subcategory removed', body: 'The service subcategory has been deleted.' },
    'service-sub-category-updated': { title: 'Subcategory updated', body: 'The service subcategory has been updated.' },
    'verification-reviewed': { title: 'Verification reviewed', body: 'The verification request has been reviewed.' },
    'verification-submitted': { title: 'Verification submitted', body: 'Your verification request has been submitted.' },
};

const toast = computed(() => {
    if (!props.status) return null;

    return messages[props.status] || { title: 'Updated', body: props.status.replaceAll('-', ' ') };
});

watch(
    () => props.status,
    (status) => {
        if (typeof window === 'undefined') return;
        if (!status) return;

        visible.value = true;
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
            visible.value = false;
        }, 3600);
    },
    { immediate: true },
);
</script>

<template>
    <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-3 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-3 opacity-0"
    >
        <aside v-if="visible && toast" class="fixed right-5 top-5 z-[80] w-[min(360px,calc(100vw-40px))] rounded-2xl border border-emerald-100 bg-white p-4 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.7)]">
            <div class="flex gap-3">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 v-if="status !== 'saved-item-removed'" class="h-5 w-5" stroke-width="2.2" />
                    <Info v-else class="h-5 w-5" stroke-width="2.2" />
                </span>
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-bold text-slate-950">{{ toast.title }}</p>
                    <p class="mt-1 text-sm leading-5 text-slate-600">{{ toast.body }}</p>
                </div>
                <button type="button" class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-700" aria-label="Dismiss notification" @click="visible = false">
                    <X class="h-4 w-4" stroke-width="2.2" />
                </button>
            </div>
        </aside>
    </Transition>
</template>
