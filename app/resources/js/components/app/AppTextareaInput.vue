<script setup lang="ts">
defineOptions({
    inheritAttrs: false,
});

withDefaults(
    defineProps<{
        label: string;
        placeholder?: string;
        rows?: number;
        variant?: 'light' | 'dark' | 'glass';
    }>(),
    {
        placeholder: '',
        rows: 4,
        variant: 'light',
    },
);

const model = defineModel<string | null>({ required: true });
</script>

<template>
    <label
        class="block rounded-[10px] px-4 py-3 transition"
        :class="
            variant === 'dark'
                ? 'border border-white/12 bg-white/10 text-white focus-within:border-emerald-300 focus-within:bg-white/14'
                : variant === 'glass'
                  ? 'border border-transparent bg-transparent text-white focus-within:bg-white/8'
                  : 'border border-slate-200 bg-white text-slate-950 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.7)] focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-100'
        "
    >
        <span
            class="block text-[11px] font-semibold uppercase"
            :class="variant === 'light' ? 'text-slate-500' : 'text-white/56'"
        >
            {{ label }}
        </span>
        <textarea
            v-bind="$attrs"
            v-model="model"
            :rows="rows"
            :placeholder="placeholder"
            class="mt-2 w-full resize-y border-0 bg-transparent text-sm font-medium leading-6 outline-none"
            :class="
                variant === 'dark' || variant === 'glass'
                    ? 'text-white placeholder:text-white/42'
                    : 'text-slate-950 placeholder:text-slate-400'
            "
        />
    </label>
</template>
