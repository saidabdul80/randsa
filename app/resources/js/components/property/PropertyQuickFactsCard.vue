<script setup lang="ts">
import { computed } from 'vue';
import { configuredDisplayItems } from '@/lib/propertyShow';
import type { PropertyRecord } from '@/types/domain';

const props = defineProps<{
    property: PropertyRecord;
}>();

const facts = computed(() => configuredDisplayItems(props.property, 'details'));
</script>

<template>
    <section v-if="facts.length" id="facts" class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
        <header>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">At a glance</p>
            <h2 class="mt-2 text-xl font-semibold text-zinc-950">Property details</h2>
        </header>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article v-for="fact in facts" :key="fact.label" class="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <span class="grid h-11 w-11 flex-none place-items-center rounded-xl bg-white text-sm font-bold text-emerald-700 shadow-sm" aria-hidden="true">
                    {{ fact.icon || fact.label.charAt(0) }}
                </span>
                <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{{ fact.label }}</p>
                    <p class="mt-1 truncate text-sm font-semibold text-zinc-950">{{ fact.value }}</p>
                </div>
            </article>
        </div>
    </section>
</template>
