<script setup lang="ts">
import { computed } from 'vue';
import { listingLocation } from '@/lib/domain';
import type { PropertyRecord } from '@/types/domain';

const props = defineProps<{
    property: PropertyRecord;
}>();

const hasPrivateLocation = computed(() => Boolean(props.property.address || props.property.latitude || props.property.longitude));
</script>

<template>
    <section id="location" class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
        <header>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Location</p>
            <h2 class="mt-2 text-xl font-semibold text-zinc-950">Explore the area</h2>
            <p class="mt-2 text-sm leading-6 text-zinc-600">
                {{ listingLocation(property) }}
            </p>
        </header>

        <div class="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
            <div class="relative min-h-72 bg-[radial-gradient(circle_at_20%_20%,#d1fae5,transparent_30%),linear-gradient(135deg,#f4f4f5,#e4e4e7)]">
                <div class="absolute inset-6 rounded-2xl border border-white/80 bg-white/55 backdrop-blur-sm" />
                <div class="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-zinc-950 text-sm font-bold text-white shadow-xl">
                    Area
                </div>
                <div class="absolute bottom-5 left-5 right-5 rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                    <p class="text-sm font-semibold text-zinc-950">{{ listingLocation(property) }}</p>
                    <p class="mt-1 text-xs leading-5 text-zinc-600">
                        Exact address is kept private until the proper booking or inspection step.
                    </p>
                </div>
            </div>
        </div>

        <div v-if="hasPrivateLocation" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Private location data is available in this admin or owner context.
        </div>
    </section>
</template>
