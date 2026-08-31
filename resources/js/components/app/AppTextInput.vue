<script setup lang="ts">
defineOptions({
    inheritAttrs: false,
});

withDefaults(
    defineProps<{
        label: string;
        placeholder?: string;
        type?: string;
        autocomplete?: string;
        variant?: 'light' | 'dark' | 'glass';
        compact?: boolean;
    }>(),
    {
        placeholder: '',
        type: 'text',
        autocomplete: undefined,
        variant: 'light',
        compact: false,
    },
);

const model = defineModel<string | number | null>({ required: true });
</script>

<template>
    <label
        class="group flex items-center rounded-[10px] px-4 transition"
        :class="
            [
                compact ? 'min-h-12' : 'min-h-14',
                variant === 'dark'
                    ? 'border border-white/12 bg-white/10 text-white focus-within:border-emerald-300 focus-within:bg-white/14'
                    : variant === 'glass'
                      ? 'border border-transparent bg-transparent text-white focus-within:bg-white/8'
                      : 'border border-slate-200 bg-white text-slate-950 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.7)] focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-100',
            ]
        "
    >
        <span class="min-w-0 flex-1">
            <span
                class="block text-[11px] font-semibold uppercase"
                :class="variant === 'light' ? 'text-slate-500' : 'text-white/56'"
            >
                {{ label }}
            </span>
            <input
                v-bind="$attrs"
                v-model="model"
                :type="type"
                :placeholder="placeholder"
                :autocomplete="autocomplete"
                class="mt-0.5 w-full min-w-0 border-0 bg-transparent text-sm font-semibold outline-none"
                :class="
                    variant === 'dark' || variant === 'glass'
                        ? 'text-white placeholder:text-white/42'
                        : 'text-slate-950 placeholder:text-slate-400'
                "
            />
        </span>
    </label>
</template>
