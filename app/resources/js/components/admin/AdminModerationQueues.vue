<script setup lang="ts">
import { router } from '@inertiajs/vue3';
import { Check, X } from '@lucide/vue';
import AdminDataTable from '@/components/admin/AdminDataTable.vue';
import PaginationControls from '@/components/app/PaginationControls.vue';
import StatusBadge from '@/components/app/StatusBadge.vue';
import { collection, listingLocation } from '@/lib/domain';
import type { AgentVerificationRecord, MarketplaceListing, PropertyRecord, ResourceCollection } from '@/types/domain';

defineProps<{
    activeTab: 'properties' | 'listings' | 'verifications';
    properties?: ResourceCollection<PropertyRecord>;
    listings?: ResourceCollection<MarketplaceListing>;
    verifications?: ResourceCollection<AgentVerificationRecord>;
}>();

const listingColumns = [
    { key: 'title', label: 'Listing' },
    { key: 'location', label: 'Location' },
    { key: 'owner', label: 'Owner' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '', align: 'right' as const },
];
const verificationColumns = [
    { key: 'name', label: 'Provider' },
    { key: 'office', label: 'Office' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '', align: 'right' as const },
];

function reviewProperty(id: number, status: 'approved' | 'rejected') {
    router.patch(`/admin/properties/${id}/review`, { status }, { preserveScroll: true });
}

function reviewListing(id: number, moderationStatus: 'approved' | 'rejected') {
    router.patch(`/admin/listings/${id}/review`, {
        status: moderationStatus === 'approved' ? 'active' : 'inactive',
        moderation_status: moderationStatus,
    }, { preserveScroll: true });
}

function reviewVerification(id: number, status: 'approved' | 'rejected') {
    router.patch(`/admin/agent-verifications/${id}/review`, { status }, { preserveScroll: true });
}
</script>

<template>
    <section class="space-y-5">
        <div v-if="activeTab === 'properties'" class="space-y-5">
            <AdminDataTable
                :columns="listingColumns"
                :empty="!collection(properties).length"
                empty-title="No pending properties"
                empty-body="Property submissions ready for review will appear here."
            >
                <tr v-for="property in collection(properties)" :key="property.id" class="transition hover:bg-slate-50">
                    <td class="px-5 py-4">
                        <p class="text-sm font-black text-slate-950">{{ property.title }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ property.sub_category?.label || 'Property' }}</p>
                    </td>
                    <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ listingLocation(property) }}</td>
                    <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ property.owner?.name || property.owner?.email || 'Unavailable' }}</td>
                    <td class="px-5 py-4"><StatusBadge :status="property.status" /></td>
                    <td class="px-5 py-4 text-right">
                        <div class="inline-flex gap-2">
                            <button class="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-3 py-2 text-sm font-black text-white transition hover:bg-emerald-900" type="button" @click="reviewProperty(property.id, 'approved')">
                                <Check class="h-4 w-4" stroke-width="2.4" />
                                Approve
                            </button>
                            <button class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100" type="button" @click="reviewProperty(property.id, 'rejected')">
                                <X class="h-4 w-4" stroke-width="2.4" />
                                Reject
                            </button>
                        </div>
                    </td>
                </tr>
            </AdminDataTable>
            <PaginationControls :collection="properties" label="Pending properties" />
        </div>

        <div v-if="activeTab === 'listings'" class="space-y-5">
            <AdminDataTable
                :columns="listingColumns"
                :empty="!collection(listings).length"
                empty-title="No pending services"
                empty-body="Marketplace and artisan submissions ready for review will appear here."
            >
                <tr v-for="listing in collection(listings)" :key="listing.id" class="transition hover:bg-slate-50">
                    <td class="px-5 py-4">
                        <p class="text-sm font-black text-slate-950">{{ listing.title }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ listing.sub_category?.label || 'Marketplace listing' }}</p>
                    </td>
                    <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ listingLocation(listing) }}</td>
                    <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ listing.owner?.name || listing.owner?.email || 'Unavailable' }}</td>
                    <td class="px-5 py-4"><StatusBadge :status="listing.moderation_status" /></td>
                    <td class="px-5 py-4 text-right">
                        <div class="inline-flex gap-2">
                            <button class="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-3 py-2 text-sm font-black text-white transition hover:bg-emerald-900" type="button" @click="reviewListing(listing.id, 'approved')">
                                <Check class="h-4 w-4" stroke-width="2.4" />
                                Approve
                            </button>
                            <button class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100" type="button" @click="reviewListing(listing.id, 'rejected')">
                                <X class="h-4 w-4" stroke-width="2.4" />
                                Reject
                            </button>
                        </div>
                    </td>
                </tr>
            </AdminDataTable>
            <PaginationControls :collection="listings" label="Pending services" />
        </div>

        <div v-if="activeTab === 'verifications'" class="space-y-5">
            <AdminDataTable
                :columns="verificationColumns"
                :empty="!collection(verifications).length"
                empty-title="No pending verifications"
                empty-body="Provider verification requests ready for review will appear here."
            >
                <tr v-for="verification in collection(verifications)" :key="verification.id" class="transition hover:bg-slate-50">
                    <td class="px-5 py-4">
                        <p class="text-sm font-black text-slate-950">{{ verification.full_name }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ verification.agent?.email || 'Account unavailable' }}</p>
                    </td>
                    <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ verification.office_address }}</td>
                    <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ verification.phone }}</td>
                    <td class="px-5 py-4"><StatusBadge :status="verification.status" /></td>
                    <td class="px-5 py-4 text-right">
                        <div class="inline-flex gap-2">
                            <button class="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-3 py-2 text-sm font-black text-white transition hover:bg-emerald-900" type="button" @click="reviewVerification(verification.id, 'approved')">
                                <Check class="h-4 w-4" stroke-width="2.4" />
                                Approve
                            </button>
                            <button class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100" type="button" @click="reviewVerification(verification.id, 'rejected')">
                                <X class="h-4 w-4" stroke-width="2.4" />
                                Reject
                            </button>
                        </div>
                    </td>
                </tr>
            </AdminDataTable>
            <PaginationControls :collection="verifications" label="Verifications" />
        </div>
    </section>
</template>
