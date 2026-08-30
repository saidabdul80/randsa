<script setup lang="ts">
import { computed } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';
import { Boxes, ClipboardCheck, LayoutDashboard, Settings2, ShieldCheck } from '@lucide/vue';
import AppLayout from '@/components/app/AppLayout.vue';
import type { AppPageProps } from '@/types/domain';

const props = defineProps<{
    title: string;
    active: 'overview' | 'services' | 'site' | 'permissions' | 'queues';
}>();

const page = usePage<AppPageProps>();
const permissions = computed(() => new Set(page.props.auth?.user?.permissions ?? []));
const items = computed(() =>
    [
        {
            id: 'overview',
            label: 'Overview',
            description: 'Health, activity, and counts',
            href: '/admin',
            icon: LayoutDashboard,
            can: 'admin.access',
        },
        {
            id: 'services',
            label: 'Service structure',
            description: 'Categories, types, and listing rules',
            href: '/admin/services',
            icon: Boxes,
            can: 'service-categories.manage',
        },
        {
            id: 'site',
            label: 'Site configuration',
            description: 'Landing content and filters',
            href: '/admin/site',
            icon: Settings2,
            can: 'admin.access',
        },
        {
            id: 'permissions',
            label: 'Roles and permissions',
            description: 'Permission-driven access',
            href: '/admin/permissions',
            icon: ShieldCheck,
            can: 'roles.manage',
        },
        {
            id: 'queues',
            label: 'Review queues',
            description: 'Moderation and verification',
            href: '/admin/review-queues',
            icon: ClipboardCheck,
            can: 'admin.access',
        },
    ].filter((item) => permissions.value.has(item.can)),
);
</script>

<template>
    <AppLayout :title="props.title" eyebrow="Admin portal">
        <template #header>
            <slot name="header" />
        </template>

        <div class="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 pb-24 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:pb-10">
            <aside class="lg:sticky lg:top-24 lg:self-start">
                <div class="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.65)]">
                    <div class="border-b border-slate-100 p-5">
                        <div class="flex items-center gap-3">
                            <span class="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-800 text-base font-black text-white">
                                R
                            </span>
                            <div class="min-w-0">
                                <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-900">RANDSA</p>
                                <p class="truncate text-sm font-medium text-slate-500">Admin portal</p>
                            </div>
                        </div>
                    </div>

                    <nav class="space-y-1 p-3" aria-label="Admin navigation">
                        <Link
                            v-for="item in items"
                            :key="item.id"
                            :href="item.href"
                            class="group flex items-center gap-3 rounded-2xl px-3 py-3 transition"
                            :class="active === item.id ? 'bg-emerald-800 text-white shadow-[0_16px_34px_-24px_rgba(6,95,70,0.8)]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'"
                        >
                            <span
                                class="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition"
                                :class="active === item.id ? 'bg-white/14 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-emerald-800'"
                            >
                                <component :is="item.icon" class="h-5 w-5" stroke-width="2.1" />
                            </span>
                            <span class="min-w-0">
                                <span class="block text-sm font-bold">{{ item.label }}</span>
                                <span class="mt-0.5 block truncate text-xs" :class="active === item.id ? 'text-white/72' : 'text-slate-500'">
                                    {{ item.description }}
                                </span>
                            </span>
                        </Link>
                    </nav>
                </div>
            </aside>

            <main class="min-w-0">
                <slot />
            </main>
        </div>
    </AppLayout>
</template>
