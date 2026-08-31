<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Lock } from '@lucide/vue';
import AppLayout from '@/components/app/AppLayout.vue';

withDefaults(
    defineProps<{
        title?: string;
        message?: string;
        actionLabel?: string;
        actionHref?: string;
    }>(),
    {
        title: 'Access required',
        message: 'Your account does not have permission to open this area.',
        actionLabel: 'Return home',
        actionHref: '/',
    },
);
</script>

<template>
    <AppLayout :title="title" bleed>
        <main class="grid min-h-screen place-items-center bg-zinc-50 px-4 py-16">
            <section class="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-[0_24px_70px_-48px_rgba(15,23,42,0.75)]">
                <span class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-900">
                    <Lock class="h-8 w-8" stroke-width="2" />
                </span>
                <h1 class="mt-6 text-2xl font-bold tracking-normal text-zinc-950">{{ title }}</h1>
                <p class="mt-3 text-sm leading-6 text-zinc-600">{{ message }}</p>
                <div class="mt-7 flex flex-wrap justify-center gap-3">
                    <Link :href="actionHref" class="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
                        {{ actionLabel }}
                    </Link>
                    <Link href="/" class="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50">
                        Browse listings
                    </Link>
                </div>
            </section>
        </main>
    </AppLayout>
</template>
