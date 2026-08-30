<script setup lang="ts">
defineProps<{
    label: string;
    description?: string;
}>();

const model = defineModel<boolean>({ required: true });
</script>

<template>
    <button
        type="button"
        class="flex w-full items-center justify-between gap-4 rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_10px_30px_-26px_rgba(15,23,42,0.7)] transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        role="switch"
        :aria-checked="model"
        @click="model = !model"
    >
        <span>
            <span class="block text-sm font-semibold text-slate-900">{{ label }}</span>
            <span v-if="description" class="mt-1 block text-xs leading-5 text-slate-500">{{ description }}</span>
        </span>
        <span
            class="flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition"
            :class="model ? 'bg-emerald-800' : 'bg-slate-300'"
            aria-hidden="true"
        >
            <span
                class="h-4 w-4 rounded-full bg-white shadow transition"
                :class="model ? 'translate-x-5' : 'translate-x-0'"
            />
        </span>
    </button>
</template>
