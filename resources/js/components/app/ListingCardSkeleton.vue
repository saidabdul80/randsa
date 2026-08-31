<template>
    <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.62)]">
        <div class="aspect-[1.55] animate-pulse rounded-xl bg-slate-100" />
        <div class="space-y-4 px-1 pb-1 pt-4">
            <div class="space-y-2">
                <div class="h-3 w-24 animate-pulse rounded bg-emerald-100" />
                <div class="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
            </div>
            <div class="space-y-2">
                <div class="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            </div>
            <div class="grid grid-cols-3 gap-3">
                <div v-for="index in 3" :key="index" class="space-y-2">
                    <div class="h-4 w-14 animate-pulse rounded bg-slate-200" />
                    <div class="h-3 w-12 animate-pulse rounded bg-slate-100" />
                </div>
            </div>
            <div class="h-6 w-32 animate-pulse rounded bg-emerald-100" />
        </div>
    </article>
</template>
