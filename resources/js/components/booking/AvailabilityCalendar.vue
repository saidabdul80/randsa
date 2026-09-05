<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import type { AvailabilityRule, AvailabilitySlot } from '@/types/domain';

const props = withDefaults(
    defineProps<{
        slots?: AvailabilitySlot[] | null;
        rules?: AvailabilityRule[] | null;
        selectedDate?: string | null;
        selectedTime?: string | null;
        dateLabel?: string;
        timeLabel?: string;
        surface?: 'card' | 'flush';
    }>(),
    {
        slots: null,
        rules: null,
        selectedDate: '',
        selectedTime: '',
        dateLabel: 'Date',
        timeLabel: 'Time',
        surface: 'card',
    },
);

const emit = defineEmits<{
    'update:selectedDate': [value: string];
    'update:selectedTime': [value: string];
}>();

const defaultTimes = ['09:00', '11:00', '14:00', '16:00'];
const pageOffset = ref(0);

const today = new Date();
today.setHours(0, 0, 0, 0);

const todayKey = toDateKey(today);
const hasConfiguredSlots = computed(() =>
    Boolean(
        props.slots?.some((slot) => slot.date && slot.time) ||
        props.rules?.some((rule) => rule.weekdays.length && rule.times.length),
    ),
);
const slotsByDate = computed(() => {
    const groups = new Map<string, AvailabilitySlot[]>();

    props.slots?.forEach((slot) => {
        if (!slot.date || !slot.time || slot.date < todayKey) return;

        groups.set(slot.date, [...(groups.get(slot.date) || []), slot]);
    });

    groups.forEach((slots, date) => {
        groups.set(
            date,
            [...slots].sort((a, b) => a.time.localeCompare(b.time)),
        );
    });

    return groups;
});
const rulesByWeekday = computed(() => {
    const groups = new Map<number, AvailabilityRule[]>();

    props.rules?.forEach((rule) => {
        if (!rule.weekdays.length || !rule.times.length) return;

        rule.weekdays.forEach((weekday) => {
            groups.set(weekday, [...(groups.get(weekday) || []), rule]);
        });
    });

    return groups;
});
const days = computed(() => {
    const start = new Date(today);
    start.setDate(today.getDate() + pageOffset.value * 28);

    return Array.from({ length: 28 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const key = toDateKey(date);
        const hasSlots =
            slotsByDate.value.has(key) ||
            rulesByWeekday.value.has(date.getDay());

        return {
            key,
            weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
            day: date.getDate(),
            month: date.toLocaleDateString(undefined, { month: 'short' }),
            hasSlots: hasSlots || !hasConfiguredSlots.value,
            isSelected: props.selectedDate === key,
        };
    });
});
const selectedSlots = computed(() => {
    if (!props.selectedDate) return [];

    const selectedDate = new Date(`${props.selectedDate}T00:00:00`);
    const configured = [
        ...(slotsByDate.value.get(props.selectedDate) || []),
        ...(rulesByWeekday.value.get(selectedDate.getDay()) || []).flatMap(
            (rule) =>
                rule.times.map((time) => ({
                    date: props.selectedDate || '',
                    time,
                    label: rule.label,
                    capacity: rule.capacity,
                })),
        ),
    ]
        .filter(
            (slot, index, slots) =>
                slots.findIndex((item) => item.time === slot.time) === index,
        )
        .sort((a, b) => a.time.localeCompare(b.time));

    if (configured.length) return configured;

    if (!hasConfiguredSlots.value) {
        return defaultTimes.map((time) => ({
            date: props.selectedDate || '',
            time,
        }));
    }

    return [];
});
const monthLabel = computed(() => {
    const first = days.value[0];
    const last = days.value[days.value.length - 1];

    return first && last
        ? `${first.month} ${first.day} - ${last.month} ${last.day}`
        : '';
});

watch(
    () => props.selectedDate,
    () => {
        if (!props.selectedTime) return;

        const hasTime = selectedSlots.value.some(
            (slot) => slot.time === props.selectedTime,
        );
        if (!hasTime) {
            emit('update:selectedTime', '');
        }
    },
);

function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function selectDate(date: string) {
    emit('update:selectedDate', date);
    emit('update:selectedTime', '');
}

function selectTime(time: string) {
    emit('update:selectedTime', time);
}
</script>

<template>
    <section
        class="min-w-0 rounded-2xl p-3"
        :class="
            surface === 'card'
                ? 'border border-slate-200 bg-white shadow-[0_10px_30px_-26px_rgba(15,23,42,0.7)]'
                : 'bg-slate-50/80'
        "
    >
        <div class="flex min-w-0 items-center justify-between gap-3">
            <div class="min-w-0">
                <p
                    class="text-[11px] font-black tracking-[0.14em] text-slate-500 uppercase"
                >
                    {{ dateLabel }}
                </p>
                <p class="mt-1 truncate text-sm font-black text-slate-950">
                    {{ monthLabel }}
                </p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
                <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                    :disabled="pageOffset === 0"
                    aria-label="Previous dates"
                    @click="pageOffset = Math.max(0, pageOffset - 1)"
                >
                    <ChevronLeft class="h-4 w-4" />
                </button>
                <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    aria-label="Next dates"
                    @click="pageOffset += 1"
                >
                    <ChevronRight class="h-4 w-4" />
                </button>
            </div>
        </div>

        <div
            class="-mx-1 mt-4 flex min-w-0 touch-pan-x snap-x snap-mandatory [scrollbar-width:none] gap-2 overflow-x-auto scroll-smooth px-1 pb-1 [&::-webkit-scrollbar]:hidden"
        >
            <button
                v-for="day in days"
                :key="day.key"
                type="button"
                class="relative min-h-14 min-w-14 shrink-0 snap-start rounded-2xl px-2 py-2 text-center transition sm:min-h-16 sm:min-w-16"
                :class="
                    day.isSelected
                        ? 'bg-emerald-600 text-white shadow-[0_16px_30px_-22px_rgba(5,150,105,0.9)]'
                        : day.hasSlots
                          ? 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                          : 'bg-slate-50 text-slate-400'
                "
                :disabled="!day.hasSlots"
                @click="selectDate(day.key)"
            >
                <span class="block text-[10px] font-bold uppercase">{{
                    day.weekday
                }}</span>
                <span class="mt-0.5 block text-sm font-black">{{
                    day.day
                }}</span>
                <span
                    v-if="day.hasSlots"
                    class="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                    :class="day.isSelected ? 'bg-white' : 'bg-emerald-500'"
                ></span>
            </button>
        </div>

        <div class="mt-4">
            <p
                class="text-[11px] font-black tracking-[0.14em] text-slate-500 uppercase"
            >
                {{ timeLabel }}
            </p>
            <div v-if="selectedDate" class="mt-2 flex min-w-0 flex-wrap gap-2">
                <button
                    v-for="slot in selectedSlots"
                    :key="`${slot.date}-${slot.time}`"
                    type="button"
                    class="min-w-0 rounded-full px-4 py-2 text-sm font-black transition"
                    :class="
                        selectedTime === slot.time
                            ? 'bg-slate-950 text-white'
                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    "
                    @click="selectTime(slot.time)"
                >
                    {{ slot.time }}
                </button>
                <p
                    v-if="!selectedSlots.length"
                    class="text-sm font-semibold text-slate-500"
                >
                    No time slots are open on this date.
                </p>
            </div>
            <p v-else class="mt-2 text-sm font-semibold text-slate-500">
                Select an available date to see times.
            </p>
        </div>
    </section>
</template>
