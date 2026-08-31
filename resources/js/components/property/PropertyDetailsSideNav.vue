<script setup lang="ts">
withDefaults(
    defineProps<{
        activeTitle: string;
        contextLabel?: string;
        links?: Array<{ href: string; label: string }>;
    }>(),
    {
        contextLabel: 'Property details',
        links: () => [
            { href: '#summary', label: 'Summary' },
            { href: '#facts', label: 'At a glance' },
            { href: '#overview', label: 'Overview' },
            { href: '#details', label: 'Details' },
            { href: '#location', label: 'Area' },
            { href: '#before-booking', label: 'Before booking' },
        ],
    },
);
</script>

<template>
    <aside class="hidden lg:block">
        <nav class="sticky top-5 space-y-3" aria-label="Property details navigation">
            <a
                href="/"
                class="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_16px_40px_-30px_rgba(16,32,51,0.45)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200"
            >
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-base font-bold text-white">R</span>
                <span class="min-w-0">
                    <span class="block truncate text-base font-extrabold leading-tight text-zinc-950">RANDSA</span>
                    <span class="block truncate text-[11px] font-semibold leading-tight text-slate-400">{{ contextLabel }}</span>
                </span>
            </a>

            <div class="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_16px_40px_-30px_rgba(16,32,51,0.45)]">
                <p class="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">On this page</p>
                <a
                    v-for="link in links"
                    :key="link.href"
                    :href="link.href"
                    class="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-zinc-950"
                >
                    {{ link.label }}
                </a>
            </div>

            <div class="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Viewing</p>
                <p class="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-zinc-950">{{ activeTitle }}</p>
            </div>
        </nav>
    </aside>
</template>
