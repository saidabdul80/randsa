<script setup lang="ts">
import { collection } from '@/lib/domain';
import type { ServiceCategory } from '@/types/domain';

defineProps<{
    categories: ServiceCategory[];
    activeCategory: string;
    activeType: string;
}>();

const emit = defineEmits<{
    selectCategory: [id: string];
    selectType: [type: string];
}>();

function selectCategory(categoryId: string) {
    emit('selectCategory', categoryId);
}

function selectType(type: string) {
    emit('selectType', type);
}
</script>

<template>
    <section class="border-b border-zinc-200 bg-stone-50">
        <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Browse by structure</p>
                    <h2 class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">Find the right service faster</h2>
                </div>
                <button
                    type="button"
                    class="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
                    @click="$emit('selectCategory', '')"
                >
                    View all
                </button>
            </div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article
                    v-for="category in categories"
                    :key="category.id"
                    role="button"
                    tabindex="0"
                    class="group cursor-pointer rounded-lg border bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-950/10 active:translate-y-0 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
                    :class="activeCategory === category.id ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-zinc-200'"
                    @click="selectCategory(category.id)"
                    @keydown.enter.prevent="selectCategory(category.id)"
                    @keydown.space.prevent="selectCategory(category.id)"
                >
                    <div class="block w-full text-left">
                        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{{ category.type }}</p>
                        <h3 class="mt-3 text-xl font-semibold text-zinc-950 transition-colors duration-300 group-hover:text-emerald-700">{{ category.label }}</h3>
                        <p class="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-zinc-600">
                            {{ category.description || 'Explore trusted options across housing, services, rentals, and marketplace listings.' }}
                        </p>
                    </div>

                    <div v-if="collection(category.sub_categories).length" class="mt-5 flex flex-wrap gap-2">
                        <button
                            v-for="subCategory in collection(category.sub_categories).slice(0, 4)"
                            :key="subCategory.id"
                            type="button"
                            class="cursor-pointer rounded-md border px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                            :class="activeType === subCategory.type ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'"
                            @click.stop="selectType(subCategory.type)"
                        >
                            {{ subCategory.label }}
                        </button>
                    </div>
                </article>
            </div>
        </div>
    </section>
</template>
