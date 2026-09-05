<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import {
    Bookmark,
    CalendarDays,
    Home,
    PlusSquare,
    ReceiptText,
    UserRound,
} from '@lucide/vue';
import type { AppPageProps } from '@/types/domain';
import AppToastHost from './AppToastHost.vue';
import QuickAccessModal from './QuickAccessModal.vue';
import SaveAccessModal from './SaveAccessModal.vue';

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
const quickAccessOpen = ref(false);
const quickAccessUrl = ref('/');
const saveAccessOpen = ref(false);
const saveAccessUrl = ref('/');
const pendingSave = ref<{
    item_type: 'property' | 'listing';
    property_id: number | null;
    marketplace_listing_id: number | null;
} | null>(null);
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
        { label: 'Receipts', href: '/receipts', auth: true },
        { label: 'Saved', href: '/saved-properties', auth: true },
        { label: 'Admin', href: '/admin', auth: true, admin: true },
    ].filter(
        (item) =>
            (!item.auth || user.value) && (!item.admin || canAccessAdmin.value),
    ),
);
const mobileNavItems = [
    { label: 'Browse', href: '/', icon: Home },
    { label: 'Saved', href: '/saved-properties', icon: Bookmark },
    { label: 'Post', href: '/post-listing', icon: PlusSquare, primary: true },
    { label: 'Book', href: '/my-bookings', icon: CalendarDays },
    { label: 'Receipt', href: '/receipts', icon: ReceiptText },
    { label: 'Account', href: '/profile', icon: UserRound },
];

const authEntryPaths = ['/login', '/register', '/auth/google/redirect'];
const protectedPathPrefixes = [
    '/add-property',
    '/admin',
    '/agent-verification',
    '/booking-records',
    '/edit-listing',
    '/edit-property',
    '/listing-records',
    '/my-bookings',
    '/my-listings',
    '/notifications',
    '/payment',
    '/post-listing',
    '/profile',
    '/property-records',
    '/receipt-records',
    '/receipts',
    '/saved-properties',
];

function logout() {
    router.post('/logout');
}

function pathNeedsQuickAccess(pathname: string): boolean {
    return protectedPathPrefixes.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
}

function openQuickAccess(path: string): void {
    quickAccessUrl.value = path || '/';
    quickAccessOpen.value = true;
}

function openSaveAccess(event: Event): void {
    const detail = (event as CustomEvent).detail;

    if (!detail?.payload) return;

    pendingSave.value = detail.payload;
    saveAccessUrl.value =
        detail.intendedUrl ||
        `${window.location.pathname}${window.location.search}${window.location.hash}`;
    saveAccessOpen.value = true;
}

function savePendingItem(): void {
    saveAccessOpen.value = false;

    if (!pendingSave.value) return;

    router.post('/saved-items', pendingSave.value, {
        preserveScroll: true,
        onFinish: () => {
            pendingSave.value = null;
        },
    });
}

function handleProtectedNavigation(event: MouseEvent): void {
    if (
        user.value ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
    ) {
        return;
    }

    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest('a[href]');

    if (!(link instanceof HTMLAnchorElement)) {
        return;
    }

    const url = new URL(link.href, window.location.origin);

    if (
        url.origin !== window.location.origin ||
        authEntryPaths.includes(url.pathname)
    ) {
        return;
    }

    if (!pathNeedsQuickAccess(url.pathname)) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    openQuickAccess(`${url.pathname}${url.search}${url.hash}`);
}

onMounted(() => {
    window.addEventListener('randsa:save-access', openSaveAccess);
});

onBeforeUnmount(() => {
    window.removeEventListener('randsa:save-access', openSaveAccess);
});
</script>

<template>
    <Head :title="props.title" />

    <main
        class="min-h-screen bg-stone-50 text-zinc-950"
        @click.capture="handleProtectedNavigation"
    >
        <AppToastHost :status="flashStatus" />
        <QuickAccessModal
            :open="quickAccessOpen"
            :intended-url="quickAccessUrl"
            @close="quickAccessOpen = false"
        />
        <SaveAccessModal
            :open="saveAccessOpen"
            :intended-url="saveAccessUrl"
            @close="saveAccessOpen = false"
            @authenticated="savePendingItem"
        />

        <header v-if="showHeader" :class="headerClass">
            <div
                class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"
            >
                <Link href="/" class="flex items-center gap-3">
                    <span
                        class="grid h-10 w-10 place-items-center rounded text-sm font-semibold"
                        :class="
                            transparentHeader
                                ? 'bg-white text-zinc-950'
                                : 'bg-zinc-950 text-white'
                        "
                    >
                        R
                    </span>
                    <span>
                        <span class="block text-sm leading-4 font-semibold"
                            >RANDSA</span
                        >
                        <span
                            class="block text-xs"
                            :class="
                                transparentHeader
                                    ? 'text-white/62'
                                    : 'text-zinc-500'
                            "
                        >
                            Housing and services
                        </span>
                    </span>
                </Link>

                <nav
                    class="hidden items-center gap-1 lg:flex"
                    aria-label="Primary"
                >
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
                        <Link
                            href="/notifications"
                            class="hidden rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 sm:inline-flex"
                        >
                            Alerts
                        </Link>
                        <button
                            type="button"
                            class="rounded bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
                            @click="logout"
                        >
                            Logout
                        </button>
                    </template>
                    <template v-else>
                        <Link
                            href="/login"
                            class="rounded px-3 py-2 text-sm font-medium"
                            :class="
                                transparentHeader
                                    ? 'text-white/82 hover:bg-white/10 hover:text-white'
                                    : 'text-zinc-700 hover:bg-zinc-100'
                            "
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            class="rounded px-3 py-2 text-sm font-medium"
                            :class="
                                transparentHeader
                                    ? 'bg-white text-zinc-950 hover:bg-white/88'
                                    : 'bg-zinc-950 text-white'
                            "
                        >
                            Create account
                        </Link>
                    </template>
                </div>
            </div>
        </header>

        <section v-if="!bleed" :class="pageHeaderClass">
            <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                <p
                    v-if="eyebrow"
                    class="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase"
                >
                    {{ eyebrow }}
                </p>
                <h1
                    class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl"
                >
                    {{ title }}
                </h1>
                <slot name="header" />
            </div>
        </section>

        <slot />

        <nav
            v-if="showMobileNav"
            class="fixed right-0 bottom-0 left-0 z-40 grid grid-cols-6 border-t border-zinc-200 bg-white px-1 lg:hidden"
            aria-label="Mobile"
        >
            <Link
                v-for="item in mobileNavItems"
                :key="item.href"
                :href="item.href"
                class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] leading-none font-bold"
                :class="
                    item.primary
                        ? 'bg-zinc-950 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                "
            >
                <component :is="item.icon" class="h-4 w-4" stroke-width="2.3" />
                <span class="w-full truncate text-center">{{
                    item.label
                }}</span>
            </Link>
        </nav>
    </main>
</template>
