<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CalendarDays, ChevronLeft, ChevronRight } from '@lucide/vue';

defineOptions({
    inheritAttrs: false,
});

const props = withDefaults(
    defineProps<{
        label: string;
        compact?: boolean;
    }>(),
    {
        compact: false,
    },
);

const model = defineModel<string | null>({ required: true });

const isOpen = ref(false);
const root = ref<HTMLElement | null>(null);
const viewDate = ref(parseDate(model.value) ?? new Date());

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const todayKey = toDateKey(new Date());

const monthLabel = computed(() =>
    new Intl.DateTimeFormat('en-NG', {
        month: 'long',
        year: 'numeric',
    }).format(viewDate.value),
);

const displayValue = computed(() => {
    const parsed = parseDate(model.value);

    if (!parsed) return 'Choose date';

    return new Intl.DateTimeFormat('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsed);
});

const calendarDays = computed(() => {
    const year = viewDate.value.getFullYear();
    const month = viewDate.value.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const start = new Date(year, month, 1 - firstOfMonth.getDay());

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);

        const key = toDateKey(date);

        return {
            key,
            day: date.getDate(),
            inMonth: date.getMonth() === month,
            isToday: key === todayKey,
            selected: key === model.value,
        };
    });
});

watch(
    () => model.value,
    (value) => {
        const parsed = parseDate(value);

        if (parsed) {
            viewDate.value = parsed;
        }
    },
);

function parseDate(value?: string | null): Date | null {
    if (!value) return null;

    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);

    if (
        !Number.isFinite(parsed.getTime()) ||
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }

    return parsed;
}

function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function moveMonth(offset: number): void {
    const next = new Date(viewDate.value);
    next.setMonth(next.getMonth() + offset, 1);
    viewDate.value = next;
}

function chooseDate(value: string): void {
    model.value = value;
    isOpen.value = false;
}

function handleOutside(event: PointerEvent): void {
    if (!root.value?.contains(event.target as Node)) {
        isOpen.value = false;
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
    <div ref="root" class="relative w-full min-w-0">
        <button
            v-bind="$attrs"
            type="button"
            class="group flex w-full min-w-0 items-center gap-3 rounded-[10px] border border-slate-200 bg-white px-4 text-left text-slate-950 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.7)] transition hover:border-emerald-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 focus:outline-none"
            :class="compact ? 'min-h-12' : 'min-h-14'"
            :aria-expanded="isOpen"
            aria-haspopup="dialog"
            @click="isOpen = !isOpen"
        >
            <span class="min-w-0 flex-1">
                <span
                    class="block text-[11px] font-semibold text-slate-500 uppercase"
                >
                    {{ props.label }}
                </span>
                <span class="mt-0.5 block truncate text-sm font-semibold">
                    {{ displayValue }}
                </span>
            </span>
            <CalendarDays class="h-5 w-5 shrink-0 text-slate-500" />
        </button>

        <div
            v-if="isOpen"
            class="fixed top-1/2 left-1/2 z-[90] w-[calc(100vw-2rem)] max-w-80 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-3 text-slate-950 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.95)] sm:absolute sm:top-[calc(100%+0.65rem)] sm:right-0 sm:left-auto sm:w-80 sm:max-w-[min(20rem,calc(100vw-2rem))] sm:translate-x-0 sm:translate-y-0"
            role="dialog"
            :aria-label="`${props.label} calendar`"
        >
            <div class="flex items-center justify-between gap-3">
                <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                    aria-label="Previous month"
                    @click="moveMonth(-1)"
                >
                    <ChevronLeft class="h-5 w-5" />
                </button>
                <p class="text-sm font-black text-slate-950">
                    {{ monthLabel }}
                </p>
                <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                    aria-label="Next month"
                    @click="moveMonth(1)"
                >
                    <ChevronRight class="h-5 w-5" />
                </button>
            </div>

            <div
                class="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-black tracking-[0.08em] text-slate-400 uppercase"
            >
                <span v-for="weekday in weekdays" :key="weekday">
                    {{ weekday }}
                </span>
            </div>

            <div class="mt-2 grid grid-cols-7 gap-1">
                <button
                    v-for="day in calendarDays"
                    :key="day.key"
                    type="button"
                    class="relative grid aspect-square place-items-center rounded-full text-sm font-black transition"
                    :class="
                        day.selected
                            ? 'bg-emerald-700 text-white shadow-[0_12px_28px_-18px_rgba(4,120,87,0.9)]'
                            : day.inMonth
                              ? 'text-slate-800 hover:bg-emerald-50 hover:text-emerald-800'
                              : 'text-slate-300 hover:bg-slate-50'
                    "
                    @click="chooseDate(day.key)"
                >
                    {{ day.day }}
                    <span
                        v-if="day.isToday && !day.selected"
                        class="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-600"
                    />
                </button>
            </div>
        </div>
    </div>
</template>
