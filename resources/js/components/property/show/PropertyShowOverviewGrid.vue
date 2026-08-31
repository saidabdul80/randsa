<script setup lang="ts">
import { computed } from 'vue';
import { configuredDisplayItems, propertyPrice, propertyPublicLocation, propertyTransactionLabel } from '@/lib/propertyShow';
import type { PropertyRecord } from '@/types/domain';
import PropertyShowIcon from './PropertyShowIcon.vue';

const props = defineProps<{
    property: PropertyRecord;
}>();

const highlights = computed(() => configuredDisplayItems(props.property, 'highlights', 4));
const glanceItems = computed(() => configuredDisplayItems(props.property, 'details'));
</script>

<template>
    <section class="grid gap-5 lg:grid-cols-[1.05fr_0.75fr_0.95fr]">
        <article id="overview" class="scroll-mt-[166px] rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.58)]">
            <h2 class="text-xl font-bold tracking-normal text-slate-950">About this property</h2>
            <div class="mt-4 space-y-4 text-sm leading-7 text-slate-700">
                <p v-if="property.description">{{ property.description }}</p>
                <p v-else>Details are available through the booking workflow.</p>
            </div>

            <span id="features" class="block scroll-mt-[166px]" aria-hidden="true" />
            <div v-if="highlights.length" class="mt-8 grid gap-5 sm:grid-cols-2">
                <div v-for="item in highlights" :key="item.label" class="flex gap-3">
                    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-900">
                        <PropertyShowIcon :name="item.icon" :size="19" :stroke-width="2.1" />
                    </span>
                    <span>
                        <span class="block text-sm font-bold text-slate-950">{{ item.label }}</span>
                        <span class="mt-0.5 block text-xs leading-5 text-slate-500">{{ item.value }}</span>
                    </span>
                </div>
            </div>
        </article>

        <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.58)]">
            <h2 class="text-xl font-bold tracking-normal text-slate-950">At a glance</h2>
            <dl class="mt-5 space-y-4">
                <div
                    v-for="item in glanceItems"
                    :key="item.label"
                    class="grid grid-cols-[24px_minmax(0,1fr)_minmax(110px,0.9fr)] items-start gap-3 text-sm"
                >
                    <span class="grid h-6 w-6 place-items-center rounded-full bg-slate-50 text-xs font-bold text-slate-500">
                        <PropertyShowIcon :name="item.icon" :size="16" :stroke-width="2" />
                    </span>
                    <dt class="text-slate-500">{{ item.label }}</dt>
                    <dd class="font-bold text-slate-950">{{ item.value }}</dd>
                </div>
                <div class="grid grid-cols-[24px_minmax(0,1fr)_minmax(110px,0.9fr)] items-start gap-3 text-sm">
                    <span class="grid h-6 w-6 place-items-center rounded-full bg-slate-50 text-xs font-bold text-slate-500">
                        <PropertyShowIcon name="price" :size="16" :stroke-width="2" />
                    </span>
                    <dt class="text-slate-500">Listed price</dt>
                    <dd class="font-bold text-slate-950">{{ propertyPrice(property) }}</dd>
                </div>
                <div class="grid grid-cols-[24px_minmax(0,1fr)_minmax(110px,0.9fr)] items-start gap-3 text-sm">
                    <span class="grid h-6 w-6 place-items-center rounded-full bg-slate-50 text-xs font-bold text-slate-500">
                        <PropertyShowIcon name="tag" :size="16" :stroke-width="2" />
                    </span>
                    <dt class="text-slate-500">Listing type</dt>
                    <dd class="font-bold text-slate-950">{{ propertyTransactionLabel(property) }}</dd>
                </div>
            </dl>
        </article>

        <article id="location" class="scroll-mt-[166px] rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.58)]">
            <div class="flex items-center justify-between gap-4">
                <h2 class="text-xl font-bold tracking-normal text-slate-950">Neighbourhood</h2>
                <span class="text-sm font-bold text-emerald-900">View map</span>
            </div>
            <div class="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div class="relative h-40 bg-[linear-gradient(135deg,#eef4f1_25%,transparent_25%),linear-gradient(225deg,#eef4f1_25%,transparent_25%),linear-gradient(45deg,#e4ece8_25%,transparent_25%),linear-gradient(315deg,#e4ece8_25%,#f8fafc_25%)] bg-[length:36px_36px]">
                    <span class="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-slate-800 text-white shadow-lg">
                        <PropertyShowIcon name="map-pin" :size="24" :stroke-width="2.1" />
                    </span>
                </div>
            </div>
            <h3 class="mt-5 text-base font-bold text-slate-950">{{ propertyPublicLocation(property) }}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">Exact address is shared only after the inspection booking step.</p>
        </article>
    </section>
</template>
