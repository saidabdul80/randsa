<script setup lang="ts">
import { router } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
import EmptyState from '@/components/app/EmptyState.vue';
import PaginationControls from '@/components/app/PaginationControls.vue';
import RecordRow from '@/components/app/RecordRow.vue';
import StatusBadge from '@/components/app/StatusBadge.vue';
import { collection, money } from '@/lib/domain';
import type { BookingRecord, ResourceCollection } from '@/types/domain';

const props = defineProps<{
    bookings?: ResourceCollection<BookingRecord>;
}>();

function cancelBooking(id: number) {
    router.patch(`/bookings/${id}/cancel`);
}
</script>

<template>
    <AppLayout title="My bookings" eyebrow="Schedule">
        <div class="mx-auto max-w-7xl space-y-4 px-4 py-6 pb-24 sm:px-6 lg:pb-10">
            <template v-if="collection(props.bookings).length">
                <RecordRow
                    v-for="booking in collection(props.bookings)"
                    :key="booking.id"
                    :title="booking.property?.title || booking.marketplace_listing?.title || `Booking #${booking.id}`"
                    :subtitle="booking.inspection_date ? `${booking.inspection_date} ${booking.inspection_time || ''}` : booking.start_at || 'Schedule pending'"
                    :meta="booking.estimated_total ? money(booking.estimated_total) : undefined"
                >
                    <template #actions>
                        <div class="flex flex-wrap items-center gap-2">
                            <StatusBadge :status="booking.status" />
                            <StatusBadge :status="booking.payment_status" />
                            <button
                                v-if="!['cancelled', 'completed'].includes(booking.status)"
                                type="button"
                                class="rounded border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800"
                                @click="cancelBooking(booking.id)"
                            >
                                Cancel
                            </button>
                        </div>
                    </template>
                </RecordRow>
            </template>
            <EmptyState v-else title="No bookings yet" body="Inspections and service bookings will appear here after you request one." action-label="Browse listings" action-href="/" />
            <PaginationControls :collection="bookings" label="Bookings" />
        </div>
    </AppLayout>
</template>
