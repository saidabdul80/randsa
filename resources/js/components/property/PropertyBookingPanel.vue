<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { listingPrice } from '@/lib/domain';
import type { PropertyRecord } from '@/types/domain';

defineProps<{
    property: PropertyRecord;
}>();

defineEmits<{
    save: [];
}>();
</script>

<template>
    <aside id="booking" class="sticky top-5 space-y-4">
        <section class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]">
            <div class="flex items-center justify-between gap-3">
                <span
                    class="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]"
                    :class="property.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                >
                    {{ property.is_available ? 'Available' : 'Unavailable' }}
                </span>
                <button
                    type="button"
                    class="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-zinc-700 transition hover:bg-zinc-50"
                    @click="$emit('save')"
                >
                    Save
                </button>
            </div>

            <p class="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Starting price</p>
            <p class="mt-2 text-3xl font-bold tabular-nums text-zinc-950">{{ listingPrice(property) }}</p>

            <dl class="my-5 grid gap-3 border-y border-zinc-100 py-4 text-sm">
                <div class="flex items-center justify-between gap-3">
                    <dt class="text-zinc-500">Inspection</dt>
                    <dd class="font-semibold text-zinc-950">Book before payment</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                    <dt class="text-zinc-500">Address</dt>
                    <dd class="font-semibold text-zinc-950">Shared after request</dd>
                </div>
            </dl>

            <div class="mt-5 grid gap-2">
                <Link :href="`/booking/${property.id}`" class="rounded-lg bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800">
                    Book inspection
                </Link>
                <Link :href="`/payment/${property.id}`" class="rounded-lg border border-zinc-200 px-4 py-3 text-center text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50">
                    Continue payment
                </Link>
            </div>

            <p class="mt-4 text-sm leading-6 text-zinc-600">
                Exact address and representative contact are shared through the inspection and booking workflow.
            </p>
        </section>

        <section class="rounded-2xl border border-zinc-200 bg-white p-5 text-sm shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]">
            <h2 class="text-base font-semibold text-zinc-950">Quick actions</h2>
            <div class="mt-4 grid gap-3">
                <button type="button" class="rounded-xl bg-zinc-950 px-4 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800" @click="$emit('save')">
                    Save property
                </button>
                <Link :href="`/booking/${property.id}`" class="rounded-xl border border-zinc-200 px-4 py-4 text-center text-sm font-semibold text-zinc-900 transition hover:border-blue-200 hover:bg-blue-50">
                    Call listing contact
                </Link>
                <Link :href="`/booking/${property.id}`" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                    Chat on WhatsApp
                </Link>
            </div>
        </section>

        <section class="rounded-2xl border border-zinc-200 bg-white p-5 text-sm shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]">
            <h2 class="text-base font-semibold text-zinc-950">Contact overview</h2>
            <div class="mt-4 flex items-center gap-3">
                <span class="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700" aria-hidden="true">R</span>
                <div>
                    <p class="font-semibold text-zinc-950">Listing contact</p>
                    <p class="text-xs text-zinc-500">Available through booking</p>
                </div>
            </div>
            <div class="mt-4 rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
                Contact details are intentionally hidden on the public page.
            </div>
        </section>

        <section class="rounded-2xl border border-zinc-200 bg-white p-5 text-sm shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]">
            <h2 class="text-base font-semibold text-zinc-950">Payment options</h2>
            <div class="mt-4 grid gap-3">
                <Link :href="`/payment/${property.id}?type=service_fee`" class="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-50">
                    <span>Pay service fees</span>
                    <span aria-hidden="true">-&gt;</span>
                </Link>
                <Link :href="`/payment/${property.id}?type=full_rent_payment`" class="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-50">
                    <span>Pay full rent</span>
                    <span aria-hidden="true">-&gt;</span>
                </Link>
            </div>
        </section>
    </aside>
</template>
