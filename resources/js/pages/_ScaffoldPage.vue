<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';

defineProps<{
    title: string;
}>();

const page = usePage();
</script>

<template>
    <Head :title="title" />
    <main class="min-h-screen bg-neutral-50 text-neutral-950">
        <header class="border-b border-neutral-200 bg-white">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                <Link href="/" class="text-lg font-semibold tracking-normal">RANDSA</Link>
                <nav class="flex items-center gap-4 text-sm">
                    <Link href="/">Home</Link>
                    <Link href="/post-listing">Post</Link>
                    <Link href="/my-listings">Listings</Link>
                    <Link href="/profile">Profile</Link>
                </nav>
            </div>
        </header>

        <section class="mx-auto max-w-6xl px-4 py-10">
            <div class="border border-neutral-200 bg-white p-6">
                <p class="text-sm text-neutral-500">Laravel/Inertia route</p>
                <h1 class="mt-2 text-2xl font-semibold">{{ title }}</h1>
                <pre class="mt-6 max-h-[420px] overflow-auto bg-neutral-950 p-4 text-xs text-neutral-50">{{ page.props }}</pre>
            </div>
        </section>
    </main>
</template>
