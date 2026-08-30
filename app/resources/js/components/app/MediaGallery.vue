<script setup lang="ts">
import { computed } from 'vue';
import { collection } from '@/lib/domain';
import type { CollectionLike, MediaImage } from '@/types/domain';

const props = defineProps<{
    images?: CollectionLike<MediaImage>;
    title: string;
}>();

const imageList = computed(() => collection(props.images));
const previewImages = computed(() => imageList.value.slice(1, 5));
</script>

<template>
    <section
        class="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.55)]"
        :class="imageList.length > 1 ? 'grid gap-1 md:grid-cols-[minmax(0,1.75fr)_minmax(230px,0.85fr)]' : ''"
    >
        <div class="group relative aspect-[16/10] overflow-hidden bg-zinc-200 md:aspect-[16/9]">
            <img
                v-if="imageList[0]?.url"
                :src="imageList[0].url"
                :alt="title"
                class="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div v-else class="grid h-full place-items-center text-sm font-semibold text-zinc-500">RANDSA</div>
            <span class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" aria-hidden="true" />
        </div>

        <div v-if="previewImages.length" class="grid gap-1" :class="previewImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-1'">
            <div
                v-for="image in previewImages"
                :key="image.id || image.url"
                class="group relative aspect-[16/10] overflow-hidden bg-zinc-200"
                :class="previewImages.length > 2 ? 'md:aspect-[16/8.9]' : 'md:aspect-[16/9]'"
            >
                <img :src="image.url" :alt="image.alt_text || title" class="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]" />
            </div>
        </div>
    </section>
</template>
