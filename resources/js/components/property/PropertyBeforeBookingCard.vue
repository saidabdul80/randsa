<template>
    <section id="before-booking" class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
        <header>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Book with confidence</p>
            <h2 class="mt-2 text-xl font-semibold text-zinc-950">Before you book</h2>
        </header>

        <div class="mt-5 grid gap-3">
            <p
                v-for="item in [
                    'Review every available property photo and listing detail.',
                    'Use inspection booking before making a full property payment.',
                    'Exact address and contact details are released through the proper workflow.',
                    'Keep payments and saved records inside the platform where possible.',
                ]"
                :key="item"
                class="flex gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm font-medium leading-6 text-zinc-700"
            >
                <span class="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700" aria-hidden="true">✓</span>
                <span>{{ item }}</span>
            </p>
        </div>
    </section>
</template>
