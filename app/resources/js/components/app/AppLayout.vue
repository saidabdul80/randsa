<script setup lang="ts">
import { computed } from 'vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import type { AppPageProps } from '@/types/domain';
import AppToastHost from './AppToastHost.vue';

const props = withDefaults(
    defineProps<{
        title: string;
        eyebrow?: string;
        bleed?: boolean;
        transparentHeader?: boolean;
        showMobileNav?: boolean;
        showHeader?: boolean;
    }>(),
    {
        eyebrow: '',
        bleed: false,
        transparentHeader: false,
        showMobileNav: true,
        showHeader: true,
    },
);

const page = usePage<AppPageProps>();
const user = computed(() => page.props.auth?.user ?? null);
const permissions = computed(() => new Set(user.value?.permissions ?? []));
const canAccessAdmin = computed(() => permissions.value.has('admin.access'));
const flashStatus = computed(() => page.props.flash?.status);
const headerClass = computed(() =>
    props.transparentHeader
        ? 'fixed top-0 right-0 left-0 z-40 border-b border-white/10 bg-zinc-950/20 text-white backdrop-blur-xl'
        : 'sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur',
);
const navLinkClass = computed(() =>
    props.transparentHeader
        ? 'rounded px-3 py-2 text-sm font-medium text-white/78 hover:bg-white/10 hover:text-white'
        : 'rounded px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
);
const pageHeaderClass = computed(() =>
    [
        'sticky z-30 border-b border-zinc-200 bg-white/95 backdrop-blur',
        props.showHeader ? 'top-[65px]' : 'top-0',
    ].join(' '),
);

const navItems = computed(() =>
    [
        { label: 'Post', href: '/post-listing', auth: true },
        { label: 'My listings', href: '/my-listings', auth: true },
        { label: 'Bookings', href: '/my-bookings', auth: true },
        { label: 'Saved', href: '/saved-properties', auth: true },
        { label: 'Admin', href: '/admin', auth: true, admin: true },
    ].filter((item) => (!item.auth || user.value) && (!item.admin || canAccessAdmin.value)),
);

function logout() {
    router.post('/logout');
}
</script>

<template>
    <Head :title="props.title" />

    <main class="min-h-screen bg-stone-50 text-zinc-950">
        <AppToastHost :status="flashStatus" />

        <header v-if="showHeader" :class="headerClass">
            <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                <Link href="/" class="flex items-center gap-3">
                    <span
                        class="grid h-10 w-10 place-items-center rounded text-sm font-semibold"
                        :class="transparentHeader ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white'"
                    >
                        R
                    </span>
                    <span>
                        <span class="block text-sm font-semibold leading-4">RANDSA</span>
                        <span class="block text-xs" :class="transparentHeader ? 'text-white/62' : 'text-zinc-500'">
                            Housing and services
                        </span>
                    </span>
                </Link>

                <nav class="hidden items-center gap-1 lg:flex" aria-label="Primary">
                    <Link
                        v-for="item in navItems"
                        :key="item.href"
                        :href="item.href"
                        :class="navLinkClass"
                    >
                        {{ item.label }}
                    </Link>
                </nav>

                <div class="flex items-center gap-2">
                    <template v-if="user">
                        <Link href="/notifications" class="hidden rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 sm:inline-flex">
                            Alerts
                        </Link>
                        <button type="button" class="rounded bg-zinc-950 px-3 py-2 text-sm font-medium text-white" @click="logout">
                            Logout
                        </button>
                    </template>
                    <template v-else>
                        <Link
                            href="/login"
                            class="rounded px-3 py-2 text-sm font-medium"
                            :class="transparentHeader ? 'text-white/82 hover:bg-white/10 hover:text-white' : 'text-zinc-700 hover:bg-zinc-100'"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            class="rounded px-3 py-2 text-sm font-medium"
                            :class="transparentHeader ? 'bg-white text-zinc-950 hover:bg-white/88' : 'bg-zinc-950 text-white'"
                        >
                            Create account
                        </Link>
                    </template>
                </div>
            </div>
        </header>

        <section v-if="!bleed" :class="pageHeaderClass">
            <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ eyebrow }}</p>
                <h1 class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">{{ title }}</h1>
                <slot name="header" />
            </div>
        </section>

        <slot />

        <nav v-if="showMobileNav" class="fixed right-0 bottom-0 left-0 z-40 grid grid-cols-5 border-t border-zinc-200 bg-white lg:hidden" aria-label="Mobile">
            <Link href="/" class="px-2 py-3 text-center text-xs font-medium text-zinc-700">Browse</Link>
            <Link href="/saved-properties" class="px-2 py-3 text-center text-xs font-medium text-zinc-700">Saved</Link>
            <Link href="/post-listing" class="bg-zinc-950 px-2 py-3 text-center text-xs font-medium text-white">Post</Link>
            <Link href="/my-bookings" class="px-2 py-3 text-center text-xs font-medium text-zinc-700">Bookings</Link>
            <Link href="/profile" class="px-2 py-3 text-center text-xs font-medium text-zinc-700">Account</Link>
        </nav>
    </main>
</template>
