<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
import heroHome from '@/assets/randsa-hero-home.webp';
import heroEvent from '@/assets/randsa-hero-event.webp';
</script>

<template>
    <AppLayout title="Welcome" bleed>
        <section class="relative min-h-[calc(100vh-65px)] overflow-hidden bg-zinc-950 text-white">
            <img :src="heroHome" alt="Modern home listing" class="absolute inset-0 h-full w-full object-cover opacity-70" />
            <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-zinc-950/10" />

            <div class="relative mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl content-end px-4 pb-24 sm:px-6 lg:grid-cols-[1fr_420px] lg:gap-12">
                <div class="max-w-3xl pb-8">
                    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">RANDSA marketplace</p>
                    <h1 class="mt-4 text-5xl font-semibold tracking-normal sm:text-7xl">Find homes, rentals, and trusted service renderers.</h1>
                    <p class="mt-6 max-w-2xl text-lg leading-8 text-white/82">
                        A unified marketplace for housing rent and sale, everyday rentals, artisan services, bookings, payments, saved listings, and verification.
                    </p>
                    <div class="mt-8 flex flex-wrap gap-3">
                        <Link href="/" class="rounded bg-white px-5 py-3 text-sm font-semibold text-zinc-950">Explore marketplace</Link>
                        <Link href="/post-listing" class="rounded border border-white/40 px-5 py-3 text-sm font-semibold text-white">Post a listing</Link>
                    </div>
                </div>

                <div class="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <article class="border border-white/20 bg-white/10 p-5 backdrop-blur">
                        <p class="text-sm font-semibold">Housing</p>
                        <p class="mt-2 text-sm leading-6 text-white/75">Rent, sale, inspections, agent schedules, pricing fields, and property details are category-configured.</p>
                    </article>
                    <article class="border border-white/20 bg-white/10 p-5 backdrop-blur">
                        <p class="text-sm font-semibold">Artisan services</p>
                        <p class="mt-2 text-sm leading-6 text-white/75">Admins define plumbers, electricians, cleaners, mechanics, service areas, fees, and verification rules.</p>
                    </article>
                    <article class="hidden overflow-hidden border border-white/20 bg-white/10 sm:block">
                        <img :src="heroEvent" alt="Event rental listing" class="h-36 w-full object-cover" />
                    </article>
                </div>
            </div>
        </section>
    </AppLayout>
</template>
