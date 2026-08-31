<script setup lang="ts">
import { ref } from 'vue';
import AdminModerationQueues from '@/components/admin/AdminModerationQueues.vue';
import AdminPortalLayout from '@/components/admin/AdminPortalLayout.vue';
import type { AgentVerificationRecord, MarketplaceListing, PropertyRecord, ResourceCollection } from '@/types/domain';

defineProps<{
    pendingProperties?: ResourceCollection<PropertyRecord>;
    pendingListings?: ResourceCollection<MarketplaceListing>;
    pendingVerifications?: ResourceCollection<AgentVerificationRecord>;
}>();

const activeTab = ref<'properties' | 'listings' | 'verifications'>('properties');
const tabs = [
    { id: 'properties', label: 'Properties' },
    { id: 'listings', label: 'Services' },
    { id: 'verifications', label: 'Verifications' },
] as const;
</script>

<template>
    <AdminPortalLayout title="Review queues" active="queues">
        <template #header>
            <nav class="-mb-8 mt-7 flex flex-wrap gap-10 lg:ml-[324px]" aria-label="Review queue sections">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    type="button"
                    class="border-b-2 px-1 pb-5 pt-2 text-sm font-black transition"
                    :class="activeTab === tab.id ? 'border-emerald-800 text-emerald-900' : 'border-transparent text-slate-500 hover:text-slate-950'"
                    @click="activeTab = tab.id"
                >
                    {{ tab.label }}
                </button>
            </nav>
        </template>

        <AdminModerationQueues
            :active-tab="activeTab"
            :properties="pendingProperties"
            :listings="pendingListings"
            :verifications="pendingVerifications"
        />
    </AdminPortalLayout>
</template>
