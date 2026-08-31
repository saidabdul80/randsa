<script setup lang="ts">
import { computed, ref } from 'vue';
import { Link } from '@inertiajs/vue3';
import { Eye, Pencil, Plus } from '@lucide/vue';
import AppDataTable from '@/components/app/AppDataTable.vue';
import AppModal from '@/components/app/AppModal.vue';
import ListingEditor from '@/components/app/ListingEditor.vue';
import PaginationControls from '@/components/app/PaginationControls.vue';
import StatusBadge from '@/components/app/StatusBadge.vue';
import { collection, listingLocation, listingPrice, resource, statusLabel } from '@/lib/domain';
import type { MarketplaceListing, PropertyRecord, ResourceCollection, ServiceCategory, ServiceField } from '@/types/domain';

const props = defineProps<{
    serviceCategories?: ResourceCollection<ServiceCategory>;
    serviceFields?: ResourceCollection<ServiceField>;
    properties?: ResourceCollection<PropertyRecord>;
    marketplaceListings?: ResourceCollection<MarketplaceListing>;
    property?: PropertyRecord | { data: PropertyRecord } | null;
    listing?: MarketplaceListing | { data: MarketplaceListing } | null;
}>();

const initialProperty = resource(props.property);
const initialListing = resource(props.listing);
const activeTab = ref<'housing' | 'services'>(initialListing ? 'services' : 'housing');
const activeModal = ref<'create' | 'edit-property' | 'edit-listing' | null>(initialProperty ? 'edit-property' : initialListing ? 'edit-listing' : null);
const editingProperty = ref<PropertyRecord | null>(initialProperty);
const editingListing = ref<MarketplaceListing | null>(initialListing);
const editorKey = ref(0);

const properties = computed(() => collection(props.properties));
const marketplaceListings = computed(() => collection(props.marketplaceListings));
const activeCollection = computed(() => (activeTab.value === 'housing' ? props.properties : props.marketplaceListings));
const activeCount = computed(() => (activeTab.value === 'housing' ? properties.value.length : marketplaceListings.value.length));
const columns = [
    { key: 'listing', label: 'Listing' },
    { key: 'type', label: 'Type' },
    { key: 'location', label: 'Location' },
    { key: 'price', label: 'Price' },
    { key: 'status', label: 'Status' },
    { key: 'updated', label: 'Updated' },
    { key: 'actions', label: '', align: 'right' as const },
];

function formatDate(value?: string): string {
    if (!value) return 'Not available';

    return new Intl.DateTimeFormat('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function openCreate(tab: 'housing' | 'services' = activeTab.value) {
    activeTab.value = tab;
    editingProperty.value = null;
    editingListing.value = null;
    editorKey.value += 1;
    activeModal.value = 'create';
}

function openProperty(property: PropertyRecord) {
    editingProperty.value = property;
    editingListing.value = null;
    editorKey.value += 1;
    activeModal.value = 'edit-property';
}

function openListing(listing: MarketplaceListing) {
    editingListing.value = listing;
    editingProperty.value = null;
    editorKey.value += 1;
    activeModal.value = 'edit-listing';
}

function closeModal() {
    activeModal.value = null;
}
</script>

<template>
    <section class="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24 sm:px-6 lg:pb-10">
        <div class="grid gap-4 sm:grid-cols-3">
            <button
                type="button"
                class="rounded-[18px] border bg-white p-5 text-left shadow-[0_20px_55px_-42px_rgba(15,23,42,0.62)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_28px_70px_-48px_rgba(6,95,70,0.7)]"
                :class="activeTab === 'housing' ? 'border-emerald-700 ring-2 ring-emerald-100' : 'border-slate-200'"
                @click="activeTab = 'housing'"
            >
                <p class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Housing</p>
                <p class="mt-3 text-2xl font-black text-slate-950">{{ properties.length }}</p>
                <p class="mt-1 text-sm font-semibold text-slate-600">Property listings</p>
            </button>

            <button
                type="button"
                class="rounded-[18px] border bg-white p-5 text-left shadow-[0_20px_55px_-42px_rgba(15,23,42,0.62)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_28px_70px_-48px_rgba(6,95,70,0.7)]"
                :class="activeTab === 'services' ? 'border-emerald-700 ring-2 ring-emerald-100' : 'border-slate-200'"
                @click="activeTab = 'services'"
            >
                <p class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Services</p>
                <p class="mt-3 text-2xl font-black text-slate-950">{{ marketplaceListings.length }}</p>
                <p class="mt-1 text-sm font-semibold text-slate-600">Marketplace records</p>
            </button>

            <div class="rounded-[18px] border border-emerald-100 bg-emerald-50/60 p-5">
                <p class="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-900">Create</p>
                <p class="mt-3 text-sm leading-6 text-slate-600">Post housing, artisan services, rentals, and marketplace listings from one configured form.</p>
                <button
                    type="button"
                    class="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-emerald-800 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-900"
                    @click="openCreate()"
                >
                    <Plus class="h-4 w-4" stroke-width="2.4" />
                    New listing
                </button>
            </div>
        </div>

        <div class="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.72)]">
            <div class="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p class="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">Seller workspace</p>
                    <h2 class="mt-1 text-2xl font-black tracking-normal text-slate-950">
                        {{ activeTab === 'housing' ? 'Housing listings' : 'Services and marketplace' }}
                    </h2>
                    <p class="mt-1 text-sm text-slate-500">{{ activeCount }} records on this page</p>
                </div>
                <div class="flex gap-2">
                    <button
                        type="button"
                        class="border-b-2 px-1 py-3 text-sm font-black transition"
                        :class="activeTab === 'housing' ? 'border-emerald-800 text-emerald-900' : 'border-transparent text-slate-500 hover:text-slate-950'"
                        @click="activeTab = 'housing'"
                    >
                        Housing
                    </button>
                    <button
                        type="button"
                        class="border-b-2 px-1 py-3 text-sm font-black transition"
                        :class="activeTab === 'services' ? 'border-emerald-800 text-emerald-900' : 'border-transparent text-slate-500 hover:text-slate-950'"
                        @click="activeTab = 'services'"
                    >
                        Services
                    </button>
                </div>
            </div>

            <div class="mt-4">
                <AppDataTable
                    v-if="activeTab === 'housing'"
                    :columns="columns"
                    :empty="!properties.length"
                    empty-title="No housing listings yet"
                    empty-body="Create your first rent or sale listing."
                >
                    <tr v-for="property in properties" :key="`property-${property.id}`">
                        <td class="px-5 py-4">
                            <p class="text-sm font-black text-slate-950">{{ property.title }}</p>
                            <p class="mt-1 text-xs text-slate-500">#{{ property.id }}</p>
                        </td>
                        <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ property.sub_category?.label || statusLabel(property.service_sub_category_id) }}</td>
                        <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ listingLocation(property) }}</td>
                        <td class="px-5 py-4 text-sm font-black text-slate-950">{{ listingPrice(property) }}</td>
                        <td class="px-5 py-4"><StatusBadge :status="property.status" /></td>
                        <td class="px-5 py-4 text-sm text-slate-600">{{ formatDate(property.updated_at) }}</td>
                        <td class="px-5 py-4 text-right">
                            <div class="inline-flex gap-2">
                                <Link :href="`/properties/${property.id}`" class="grid h-10 w-10 place-items-center rounded-[10px] border border-slate-200 text-slate-700 transition hover:bg-slate-50" aria-label="Preview listing">
                                    <Eye class="h-4 w-4" stroke-width="2.2" />
                                </Link>
                                <button type="button" class="grid h-10 w-10 place-items-center rounded-[10px] bg-slate-950 text-white transition hover:bg-slate-800" aria-label="Edit listing" @click="openProperty(property)">
                                    <Pencil class="h-4 w-4" stroke-width="2.2" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </AppDataTable>

                <AppDataTable
                    v-else
                    :columns="columns"
                    :empty="!marketplaceListings.length"
                    empty-title="No service listings yet"
                    empty-body="Create artisan services, rentals, or marketplace records."
                >
                    <tr v-for="listing in marketplaceListings" :key="`listing-${listing.id}`">
                        <td class="px-5 py-4">
                            <p class="text-sm font-black text-slate-950">{{ listing.title }}</p>
                            <p class="mt-1 text-xs text-slate-500">#{{ listing.id }}</p>
                        </td>
                        <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ listing.sub_category?.label || statusLabel(listing.service_sub_category_id) }}</td>
                        <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ listingLocation(listing) }}</td>
                        <td class="px-5 py-4 text-sm font-black text-slate-950">{{ listingPrice(listing) }}</td>
                        <td class="px-5 py-4"><StatusBadge :status="listing.moderation_status || listing.status" /></td>
                        <td class="px-5 py-4 text-sm text-slate-600">{{ formatDate(listing.updated_at) }}</td>
                        <td class="px-5 py-4 text-right">
                            <div class="inline-flex gap-2">
                                <Link :href="`/listings/${listing.id}`" class="grid h-10 w-10 place-items-center rounded-[10px] border border-slate-200 text-slate-700 transition hover:bg-slate-50" aria-label="Preview listing">
                                    <Eye class="h-4 w-4" stroke-width="2.2" />
                                </Link>
                                <button type="button" class="grid h-10 w-10 place-items-center rounded-[10px] bg-slate-950 text-white transition hover:bg-slate-800" aria-label="Edit listing" @click="openListing(listing)">
                                    <Pencil class="h-4 w-4" stroke-width="2.2" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </AppDataTable>

                <PaginationControls
                    :collection="activeCollection"
                    :label="activeTab === 'housing' ? 'Housing listings' : 'Service listings'"
                    class="mt-5"
                />
            </div>
        </div>

        <AppModal
            :open="Boolean(activeModal)"
            :title="activeModal === 'create' ? 'Create listing' : 'Update listing'"
            eyebrow="Publishing"
            size="xl"
            @close="closeModal"
        >
            <ListingEditor
                :key="editorKey"
                :service-categories="serviceCategories"
                :property="editingProperty"
                :listing="editingListing"
                @submitted="closeModal"
            />
        </AppModal>
    </section>
</template>
