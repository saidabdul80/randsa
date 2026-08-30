<script setup lang="ts">
import { Boxes, CheckCircle2, Clock3, ListChecks, ShieldCheck, Users } from '@lucide/vue';
import { computed } from 'vue';

defineProps<{
    counts: Record<string, number>;
}>();

const metricConfig: Record<string, { label: string; caption: string; icon: unknown }> = {
    users: { label: 'Users', caption: 'Registered accounts', icon: Users },
    pending_properties: { label: 'Pending properties', caption: 'Housing listings awaiting review', icon: Clock3 },
    pending_listings: { label: 'Pending services', caption: 'Marketplace listings awaiting review', icon: ListChecks },
    pending_verifications: { label: 'Pending verifications', caption: 'Provider checks to review', icon: ShieldCheck },
    service_categories: { label: 'Service categories', caption: 'Configured marketplace groups', icon: Boxes },
    active_services: { label: 'Active services', caption: 'Publicly available categories', icon: CheckCircle2 },
    published_listings: { label: 'Published listings', caption: 'Visible customer results', icon: ListChecks },
};

const entries = computed(() => Object.entries(metricConfig));
</script>

<template>
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div
            v-for="[key, item] in entries"
            :key="key"
            class="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.62)]"
        >
            <div class="flex items-start justify-between gap-4">
                <div>
                    <p class="text-sm font-bold text-slate-600">{{ item.label }}</p>
                    <p class="mt-1 text-xs leading-5 text-slate-500">{{ item.caption }}</p>
                </div>
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <component :is="item.icon" class="h-5 w-5" stroke-width="2.1" />
                </span>
            </div>
            <p class="mt-8 text-4xl font-black tracking-normal text-slate-950">{{ counts[key] ?? 0 }}</p>
        </div>
    </section>
</template>
