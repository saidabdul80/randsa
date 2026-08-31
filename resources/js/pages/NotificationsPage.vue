<script setup lang="ts">
import { router } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
import EmptyState from '@/components/app/EmptyState.vue';
import PaginationControls from '@/components/app/PaginationControls.vue';
import RecordRow from '@/components/app/RecordRow.vue';
import { collection } from '@/lib/domain';
import type { NotificationRecord, ResourceCollection } from '@/types/domain';

const props = defineProps<{
    notifications?: ResourceCollection<NotificationRecord>;
}>();

function markRead(id: number) {
    router.patch(`/notifications/${id}/read`);
}
</script>

<template>
    <AppLayout title="Notifications" eyebrow="Updates">
        <div class="mx-auto max-w-5xl space-y-3 px-4 py-6 pb-24 sm:px-6 lg:pb-10">
            <template v-if="collection(props.notifications).length">
                <RecordRow
                    v-for="notification in collection(props.notifications)"
                    :key="notification.id"
                    :title="notification.title"
                    :subtitle="notification.body"
                    :meta="notification.channel"
                    :status="notification.read_at ? 'read' : 'unread'"
                >
                    <template #actions>
                        <button
                            v-if="!notification.read_at"
                            type="button"
                            class="rounded bg-zinc-950 px-3 py-2 text-sm font-semibold text-white"
                            @click="markRead(notification.id)"
                        >
                            Mark read
                        </button>
                    </template>
                </RecordRow>
            </template>
            <EmptyState v-else title="No notifications" body="Listing reviews, bookings, payments, and verification messages will appear here." />
            <PaginationControls :collection="notifications" label="Notifications" />
        </div>
    </AppLayout>
</template>
