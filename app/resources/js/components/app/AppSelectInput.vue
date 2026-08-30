<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

defineOptions({
    inheritAttrs: false,
});

const props = withDefaults(
    defineProps<{
        label: string;
        options: Array<{ label: string; value: string }>;
        variant?: 'light' | 'dark' | 'glass';
        compact?: boolean;
    }>(),
    {
        variant: 'light',
        compact: false,
    },
);

const model = defineModel<string>({ required: true });

const isOpen = ref(false);
const highlightedIndex = ref(-1);
const root = ref<HTMLElement | null>(null);

const selectedIndex = computed(() =>
    props.options.findIndex((option) => option.value === model.value),
);
const selectedOption = computed(
    () =>
        props.options.find((option) => option.value === model.value) ??
        props.options[0],
);

function openList() {
    isOpen.value = true;
    highlightedIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0;
}

function closeList() {
    isOpen.value = false;
}

function toggleList() {
    if (isOpen.value) {
        closeList();
        return;
    }

    openList();
}

function choose(value: string) {
    model.value = value;
    closeList();
}

function moveHighlight(offset: number) {
    if (!isOpen.value) {
        openList();
        return;
    }

    const lastIndex = props.options.length - 1;
    if (lastIndex < 0) return;

    const current = highlightedIndex.value < 0 ? selectedIndex.value : highlightedIndex.value;
    highlightedIndex.value = Math.min(Math.max(current + offset, 0), lastIndex);
}

function chooseHighlighted() {
    if (!isOpen.value) {
        openList();
        return;
    }

    const option = props.options[highlightedIndex.value];
    if (option) {
        choose(option.value);
    }
}

function handleOutside(event: PointerEvent) {
    if (!root.value?.contains(event.target as Node)) {
        closeList();
    }
}

onMounted(() => {
    document.addEventListener('pointerdown', handleOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', handleOutside);
});
</script>

<template>
    <div
        ref="root"
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
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.prevent="chooseHighlighted"
        @keydown.space.prevent="chooseHighlighted"
        @keydown.esc.prevent="closeList"
    >
        <div class="relative min-w-0 flex-1">
            <span
                class="block text-[11px] font-semibold uppercase"
                :class="variant === 'light' ? 'text-slate-500' : 'text-white/56'"
            >
                {{ label }}
            </span>

            <button
                v-bind="$attrs"
                type="button"
                class="mt-0.5 flex w-full min-w-0 items-center justify-between gap-3 border-0 bg-transparent text-left text-sm font-semibold outline-none"
                :class="variant === 'light' ? 'text-slate-950' : 'text-white'"
                :aria-expanded="isOpen"
                aria-haspopup="listbox"
                @click="toggleList"
            >
                <span class="min-w-0 truncate">{{ selectedOption?.label }}</span>
                <span
                    class="h-2 w-2 shrink-0 rotate-45 border-r-2 border-b-2 transition"
                    :class="[
                        isOpen ? 'translate-y-1 rotate-[225deg]' : '-translate-y-0.5',
                        variant === 'light' ? 'border-slate-500' : 'border-white/58',
                    ]"
                    aria-hidden="true"
                />
            </button>

            <div
                v-if="isOpen"
                class="absolute top-[calc(100%+0.75rem)] left-0 z-50 w-max min-w-full max-w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[10px] border border-slate-200 bg-white p-1 text-slate-950 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.9)]"
                role="listbox"
            >
                <button
                    v-for="option in options"
                    :key="option.value"
                    type="button"
                    class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition"
                    :class="
                        option.value === model
                            ? 'bg-emerald-800 text-white'
                            : options[highlightedIndex]?.value === option.value
                              ? 'bg-slate-100 text-slate-950'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                    "
                    role="option"
                    :aria-selected="option.value === model"
                    @mouseenter="highlightedIndex = options.findIndex((item) => item.value === option.value)"
                    @click="choose(option.value)"
                >
                    <span class="w-4 shrink-0 text-center">
                        {{ option.value === model ? '✓' : '' }}
                    </span>
                    <span class="min-w-0 truncate">
                        {{ option.label }}
                    </span>
                </button>
            </div>
        </div>
    </div>
</template>
