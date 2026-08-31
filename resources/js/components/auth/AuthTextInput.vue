<script setup lang="ts">
import type { Component } from 'vue';

defineOptions({
    inheritAttrs: false,
});

withDefaults(
    defineProps<{
        label: string;
        icon: Component;
        type?: string;
        placeholder?: string;
        autocomplete?: string;
        error?: string;
    }>(),
    {
        type: 'text',
        placeholder: '',
        autocomplete: undefined,
        error: '',
    },
);

const model = defineModel<string>({ required: true });
</script>

<template>
    <label class="block">
        <span class="text-[13px] font-bold text-slate-950">{{ label }}</span>
        <span
            class="mt-2 flex h-[52px] items-center gap-3 rounded-[10px] border bg-white px-4 shadow-sm transition focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-50"
            :class="error ? 'border-rose-300' : 'border-slate-200'"
        >
            <component :is="icon" class="h-5 w-5 shrink-0 text-slate-600" stroke-width="2.1" />
            <input
                v-bind="$attrs"
                v-model="model"
                :type="type"
                :placeholder="placeholder"
                :autocomplete="autocomplete"
                class="h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
            />
            <slot name="suffix" />
        </span>
        <span v-if="error" class="mt-1 block text-xs font-semibold text-rose-600">{{ error }}</span>
    </label>
</template>
