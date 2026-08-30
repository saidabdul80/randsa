<script setup lang="ts">
import { X } from '@lucide/vue';

defineProps<{
    open: boolean;
    title: string;
}>();

defineEmits<{
    close: [];
}>();
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="open" class="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/45 px-4 py-7 backdrop-blur-sm" @click.self="$emit('close')">
                <div class="mx-auto flex max-h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_34px_100px_-44px_rgba(15,23,42,0.82)]">
                    <div class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
                        <div>
                            <p class="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">Admin portal</p>
                            <h2 class="mt-1 text-xl font-black tracking-normal text-slate-950">{{ title }}</h2>
                        </div>
                        <button
                            type="button"
                            class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
                            aria-label="Close modal"
                            @click="$emit('close')"
                        >
                            <X class="h-5 w-5" stroke-width="2.2" />
                        </button>
                    </div>
                    <div class="min-h-0 overflow-y-auto p-6">
                        <slot />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
