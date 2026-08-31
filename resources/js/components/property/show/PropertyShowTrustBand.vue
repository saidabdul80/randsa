<script setup lang="ts">
import { computed } from 'vue';
import { collection } from '@/lib/domain';
import type { CollectionLike, LandingPageSection } from '@/types/domain';
import PropertyShowIcon from './PropertyShowIcon.vue';

const props = defineProps<{
    items?: CollectionLike<LandingPageSection>;
}>();

const trustItems = computed(() => collection(props.items));
</script>

<template>
    <section v-if="trustItems.length" class="rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-5 shadow-[0_18px_46px_-40px_rgba(15,23,42,0.6)]">
        <div class="grid gap-5 lg:grid-cols-[260px_repeat(4,1fr)]">
            <div class="flex items-center gap-4">
                <span class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-900 shadow-inner">
                    <PropertyShowIcon name="shield" :size="32" :stroke-width="2" />
                </span>
                <div>
                    <h2 class="text-xl font-bold text-emerald-950">Buy with confidence</h2>
                    <p class="mt-1 text-sm text-emerald-800">Your safety is our priority.</p>
                </div>
            </div>

            <div v-for="item in trustItems" :key="item.id || `${item.title}:${item.sort_order}`" class="flex gap-3 border-emerald-100 lg:border-l lg:pl-5">
                <PropertyShowIcon :name="String(item.payload?.icon || 'circle-check')" :size="22" :stroke-width="2" class="mt-0.5 shrink-0 text-emerald-900" />
                <div>
                    <h3 class="text-sm font-bold text-slate-950">{{ item.title }}</h3>
                    <p v-if="item.description" class="mt-1 text-xs leading-5 text-slate-600">{{ item.description }}</p>
                </div>
            </div>
        </div>
    </section>
</template>
