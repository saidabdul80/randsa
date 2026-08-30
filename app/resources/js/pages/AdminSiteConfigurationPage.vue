<script setup lang="ts">
import { ref } from 'vue';
import AdminPortalLayout from '@/components/admin/AdminPortalLayout.vue';
import SiteConfigurationManager from '@/components/admin/SiteConfigurationManager.vue';
import { collection } from '@/lib/domain';
import type { LandingPageSection, ListingPriceRange, ResourceCollection } from '@/types/domain';

defineProps<{
    priceRanges?: ResourceCollection<ListingPriceRange>;
    landingPageSections?: ResourceCollection<LandingPageSection>;
}>();

const activeTab = ref<'price_ranges' | 'content'>('price_ranges');
const tabs = [
    { id: 'price_ranges', label: 'Price ranges' },
    { id: 'content', label: 'Content sections' },
] as const;
</script>

<template>
    <AdminPortalLayout title="Site configuration" active="site">
        <template #header>
            <nav class="-mb-8 mt-7 flex flex-wrap gap-10 lg:ml-[324px]" aria-label="Site configuration sections">
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

        <SiteConfigurationManager
            :active-tab="activeTab"
            :price-ranges="collection(priceRanges)"
            :landing-sections="collection(landingPageSections)"
        />
    </AdminPortalLayout>
</template>
