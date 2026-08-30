<script setup lang="ts">
import { Link, router, usePage } from '@inertiajs/vue3';
import { Bell, ChevronDown, Heart, Home, Search } from '@lucide/vue';
import { computed, ref } from 'vue';
import type { AppPageProps } from '@/types/domain';

const page = usePage<AppPageProps>();
const user = computed(() => page.props.auth?.user ?? null);
const query = ref('');

function search() {
    router.get('/', query.value ? { query: query.value } : {}, {
        preserveScroll: false,
        preserveState: false,
    });
}
</script>

<template>
    <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div class="mx-auto flex h-[78px] max-w-[1440px] items-center gap-8 px-7">
            <Link href="/" class="flex shrink-0 items-center gap-3" aria-label="RANDSA properties">
                <span class="grid h-9 w-9 place-items-center rounded bg-emerald-900 text-white">
                    <Home class="h-5 w-5" stroke-width="2.5" />
                </span>
                <span>
                    <span class="block text-lg font-extrabold leading-4 tracking-[0.04em] text-emerald-950">RANDSA</span>
                    <span class="block text-[10px] font-bold uppercase leading-3 tracking-[0.28em] text-emerald-900">Properties</span>
                </span>
            </Link>

            <form class="hidden min-w-0 max-w-[520px] flex-1 md:block" role="search" @submit.prevent="search">
                <label class="flex h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 shadow-[0_10px_26px_-24px_rgb(15_23_42_/_0.45)] focus-within:border-emerald-700">
                    <span class="sr-only">Search properties</span>
                    <input
                        v-model="query"
                        class="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Search by location, property, or keyword..."
                        type="search"
                    />
                    <button type="submit" class="grid h-8 w-8 place-items-center rounded-lg text-slate-700 transition hover:bg-slate-50" aria-label="Search">
                        <Search class="h-4.5 w-4.5" stroke-width="2" />
                    </button>
                </label>
            </form>

            <nav class="ml-auto hidden items-center gap-8 text-sm font-semibold text-slate-800 lg:flex" aria-label="Property navigation">
                <Link href="/?type=housing_sale">Buy</Link>
                <Link href="/?type=housing_rent">Rent</Link>
                <Link href="/#listings">New Developments</Link>
                <Link href="/#workflow">Resources</Link>
            </nav>

            <div class="ml-auto flex items-center gap-4 lg:ml-0">
                <Link href="/saved-properties" class="grid h-10 w-10 place-items-center rounded-full text-xl text-slate-900 transition hover:bg-slate-50" aria-label="Saved listings">
                    <Heart class="h-5 w-5" stroke-width="2" />
                </Link>
                <Link href="/notifications" class="relative grid h-10 w-10 place-items-center rounded-full text-xl text-slate-900 transition hover:bg-slate-50" aria-label="Notifications">
                    <Bell class="h-5 w-5" stroke-width="2" />
                    <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-800" aria-hidden="true" />
                </Link>
                <Link :href="user ? '/profile' : '/login'" class="flex h-10 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm font-bold text-slate-600" aria-label="Account">
                    <span class="grid h-7 w-7 place-items-center rounded-full bg-slate-200">{{ user?.name?.charAt(0) || 'R' }}</span>
                    <ChevronDown class="h-4 w-4" stroke-width="2" />
                </Link>
            </div>
        </div>
    </header>
</template>
