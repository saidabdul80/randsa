<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { Image, Upload, X } from '@lucide/vue';
import type { MediaImage } from '@/types/domain';

const existingImages = defineModel<MediaImage[]>('existingImages', { required: true });
const files = defineModel<File[]>('files', { required: true });

const fileInput = ref<HTMLInputElement | null>(null);
const previews = ref<Array<{ file: File; url: string }>>([]);
const totalImages = computed(() => existingImages.value.length + files.value.length);

watch(
    files,
    (nextFiles) => {
        previews.value.forEach((preview) => URL.revokeObjectURL(preview.url));
        previews.value = nextFiles.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    previews.value.forEach((preview) => URL.revokeObjectURL(preview.url));
});

function openPicker() {
    fileInput.value?.click();
}

function addFiles(selectedFiles: FileList | null) {
    if (!selectedFiles?.length) return;

    const acceptedFiles = Array.from(selectedFiles).filter((file) => file.type.startsWith('image/'));
    files.value = [...files.value, ...acceptedFiles].slice(0, 20);

    if (fileInput.value) {
        fileInput.value.value = '';
    }
}

function removeExisting(index: number) {
    existingImages.value = existingImages.value.filter((_, imageIndex) => imageIndex !== index);
}

function removeFile(index: number) {
    files.value = files.value.filter((_, fileIndex) => fileIndex !== index);
}

function handleDrop(event: DragEvent) {
    addFiles(event.dataTransfer?.files ?? null);
}
</script>

<template>
    <section class="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-34px_rgba(15,23,42,0.46)]">
        <div class="flex items-start justify-between gap-4">
            <div>
                <h2 class="text-base font-black text-slate-950">Images</h2>
                <p class="mt-1 text-sm leading-6 text-slate-600">Upload listing photos. The first image becomes the cover.</p>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{{ totalImages }}/20</span>
        </div>

        <button
            type="button"
            class="mt-4 flex w-full flex-col items-center justify-center rounded-[14px] border border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-8 text-center transition hover:border-emerald-600 hover:bg-emerald-50"
            @click="openPicker"
            @dragover.prevent
            @drop.prevent="handleDrop"
        >
            <span class="grid h-12 w-12 place-items-center rounded-full bg-white text-emerald-800 shadow-[0_18px_36px_-26px_rgba(6,95,70,0.85)]">
                <Upload class="h-5 w-5" stroke-width="2.2" />
            </span>
            <span class="mt-3 text-sm font-black text-slate-950">Upload images</span>
            <span class="mt-1 text-xs font-medium text-slate-500">JPG, PNG, or WEBP. Up to 5MB each.</span>
        </button>

        <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            class="sr-only"
            @change="addFiles(($event.target as HTMLInputElement).files)"
        />

        <div v-if="totalImages" class="mt-4 grid grid-cols-2 gap-3">
            <article
                v-for="(image, index) in existingImages"
                :key="image.id || image.url"
                class="group relative aspect-[4/3] overflow-hidden rounded-[12px] border border-slate-200 bg-slate-100"
            >
                <img :src="image.url" :alt="image.alt_text || 'Listing image'" class="h-full w-full object-cover" />
                <span v-if="index === 0" class="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">Cover</span>
                <button
                    type="button"
                    class="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-slate-700 opacity-0 shadow-lg transition group-hover:opacity-100"
                    aria-label="Remove image"
                    @click="removeExisting(index)"
                >
                    <X class="h-4 w-4" stroke-width="2.4" />
                </button>
            </article>

            <article
                v-for="(preview, index) in previews"
                :key="`${preview.file.name}-${preview.file.lastModified}-${index}`"
                class="group relative aspect-[4/3] overflow-hidden rounded-[12px] border border-slate-200 bg-slate-100"
            >
                <img :src="preview.url" :alt="preview.file.name" class="h-full w-full object-cover" />
                <span v-if="existingImages.length === 0 && index === 0" class="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">Cover</span>
                <button
                    type="button"
                    class="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-slate-700 opacity-0 shadow-lg transition group-hover:opacity-100"
                    aria-label="Remove image"
                    @click="removeFile(index)"
                >
                    <X class="h-4 w-4" stroke-width="2.4" />
                </button>
            </article>
        </div>

        <div v-else class="mt-4 flex items-center gap-3 rounded-[12px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <Image class="h-5 w-5 shrink-0" stroke-width="2.1" />
            No images selected yet.
        </div>
    </section>
</template>
