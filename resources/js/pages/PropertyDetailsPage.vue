<script setup lang="ts">
import { Link, router } from '@inertiajs/vue3';
import { ArrowLeft, ChevronRight } from '@lucide/vue';
import { computed } from 'vue';
import AppLayout from '@/components/app/AppLayout.vue';
import PropertyShowHero from '@/components/property/show/PropertyShowHero.vue';
import PropertyShowOverviewGrid from '@/components/property/show/PropertyShowOverviewGrid.vue';
import PropertyShowSimilarSection from '@/components/property/show/PropertyShowSimilarSection.vue';
import PropertyShowTabs from '@/components/property/show/PropertyShowTabs.vue';
import PropertyShowTopNav from '@/components/property/show/PropertyShowTopNav.vue';
import PropertyShowTrustBand from '@/components/property/show/PropertyShowTrustBand.vue';
import { collection, resource } from '@/lib/domain';
import { propertyPublicLocation } from '@/lib/propertyShow';
import type { LandingPageSection, PropertyRecord } from '@/types/domain';

const props = defineProps<{
    property: PropertyRecord | { data: PropertyRecord };
    similarProperties?: { data: PropertyRecord[] } | PropertyRecord[];
    propertyTrustItems?: { data: LandingPageSection[] } | LandingPageSection[];
}>();

const property = computed(() => resource(props.property)!);
const similarProperties = computed(() => collection(props.similarProperties));

function goBack(): void {
    window.history.length > 1 ? window.history.back() : router.visit('/');
}
</script>

<template>
    <AppLayout :title="property.title" bleed :show-mobile-nav="false" :show-header="false">
        <div class="min-h-screen bg-white text-slate-950">
            <PropertyShowTopNav />

            <main class="mx-auto max-w-[1440px] px-7 pb-12 pt-6">
                <nav class="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500" aria-label="Breadcrumb">
                    <button type="button" class="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-slate-800 transition hover:text-emerald-900" @click="goBack">
                        <ArrowLeft class="h-4 w-4" stroke-width="2" />
                        <span>Back</span>
                    </button>
                    <ChevronRight class="h-3.5 w-3.5 text-slate-300" stroke-width="2" />
                    <Link href="/" class="transition hover:text-emerald-900">Home</Link>
                    <ChevronRight class="h-3.5 w-3.5 text-slate-300" stroke-width="2" />
                    <span>{{ property.sub_category?.transaction_type === 'rent' ? 'Rent' : 'Buy' }}</span>
                    <ChevronRight class="h-3.5 w-3.5 text-slate-300" stroke-width="2" />
                    <span>{{ propertyPublicLocation(property) }}</span>
                    <ChevronRight class="h-3.5 w-3.5 text-slate-300" stroke-width="2" />
                    <span class="text-slate-800">{{ property.title }}</span>
                </nav>

                <div class="mt-8">
                    <PropertyShowHero :property="property" />
                </div>

                <PropertyShowTabs />

                <div class="mt-7">
                    <PropertyShowOverviewGrid :property="property" />
                </div>

                <div id="payment" class="mt-7 scroll-mt-[166px]">
                    <PropertyShowTrustBand :items="propertyTrustItems" />
                </div>

                <div id="similar" class="mt-7 scroll-mt-[166px]">
                    <PropertyShowSimilarSection :items="similarProperties" />
                </div>
            </main>
        </div>
    </AppLayout>
</template>
