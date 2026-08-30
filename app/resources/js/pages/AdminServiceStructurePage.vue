<script setup lang="ts">
import { ref } from 'vue';
import AdminPortalLayout from '@/components/admin/AdminPortalLayout.vue';
import ServiceStructureManager from '@/components/admin/ServiceStructureManager.vue';
import { collection } from '@/lib/domain';
import type { ResourceCollection, ServiceCategory, ServiceField } from '@/types/domain';

defineProps<{
    serviceCategories?: ResourceCollection<ServiceCategory>;
    serviceFields?: ResourceCollection<ServiceField>;
    enumOptions: {
        service_category_types: string[];
        service_sub_category_types: string[];
        transaction_types: string[];
        provider_kinds: string[];
        listing_tables: string[];
    };
}>();

const activeTab = ref<'categories' | 'subcategories' | 'fields'>('categories');
const tabs = [
    { id: 'categories', label: 'Categories' },
    { id: 'subcategories', label: 'Subcategories' },
    { id: 'fields', label: 'Fields' },
] as const;
</script>

<template>
    <AdminPortalLayout title="Service structure" active="services">
        <template #header>
            <nav class="-mb-8 mt-7 flex flex-wrap gap-10 lg:ml-[324px]" aria-label="Service structure sections">
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

        <ServiceStructureManager
            :active-tab="activeTab"
            :categories="collection(serviceCategories)"
            :fields="collection(serviceFields)"
            :enum-options="enumOptions"
        />
    </AdminPortalLayout>
</template>
