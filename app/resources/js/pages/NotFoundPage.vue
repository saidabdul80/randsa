<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
</script>

<template>
    <AppLayout title="Page not found" eyebrow="404">
        <div class="mx-auto max-w-3xl px-4 py-12 pb-24 text-center sm:px-6 lg:pb-10">
            <div class="border border-zinc-200 bg-white p-8">
                <p class="text-sm leading-6 text-zinc-600">The page you opened is not available in the Laravel app.</p>
                <Link href="/" class="mt-5 inline-flex rounded bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">Back to marketplace</Link>
            </div>
        </div>
    </AppLayout>
</template>
