<script setup lang="ts">
import { CalendarPlus, Repeat2, X } from '@lucide/vue';
import { computed, ref } from 'vue';
import type {
    AvailabilityRule,
    AvailabilitySlot,
    ListingEditorFormState,
} from '@/types/domain';

const props = defineProps<{
    form: ListingEditorFormState;
}>();

type AvailabilityMode = 'repeat' | 'single';

const today = new Date();
today.setHours(0, 0, 0, 0);

const mode = ref<AvailabilityMode>('repeat');
const slotDate = ref(toDateKey(today));
const slotTime = ref('09:00');
const selectedWeekdays = ref<number[]>([1, 6]);
const selectedRuleTimes = ref<string[]>(['09:00']);
const timeOptions = Array.from({ length: 21 }, (_, index) => {
    const hour = Math.floor(index / 2) + 8;
    const minute = index % 2 === 0 ? '00' : '30';

    return `${String(hour).padStart(2, '0')}:${minute}`;
});
const weekdayOptions = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
];
const dateOptions = computed(() =>
    Array.from({ length: 21 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);

        return {
            key: toDateKey(date),
            weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
            day: date.getDate(),
            month: date.toLocaleDateString(undefined, { month: 'short' }),
        };
    }),
);
const singleSlotSummary = computed(() =>
    [...props.form.availability_slots]
        .filter((slot) => slot.date && slot.time)
        .sort((a, b) =>
            `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
        )
        .map((slot) => ({
            ...slot,
            dateLabel: formatDateLabel(slot.date),
        })),
);
const recurringSummary = computed(() =>
    normalizedAvailabilityRules(props.form.availability_rules)
        .map((rule) => ({
            ...rule,
            weekdayLabels: rule.weekdays
                .map(
                    (weekday) =>
                        weekdayOptions.find(
                            (option) => option.value === weekday,
                        )?.label,
                )
                .filter(Boolean)
                .join(', '),
        }))
        .filter((rule) => rule.weekdayLabels && rule.times.length),
);
const totalAvailabilityCount = computed(
    () => props.form.availability_slots.length + recurringSummary.value.length,
);

function addSlot() {
    if (!slotDate.value || !slotTime.value) return;

    const exists = props.form.availability_slots.some(
        (slot) => slot.date === slotDate.value && slot.time === slotTime.value,
    );

    if (exists) return;

    props.form.availability_slots = [
        ...props.form.availability_slots,
        {
            date: slotDate.value,
            time: slotTime.value,
        },
    ].sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    );
}

function removeSlot(slotToRemove: AvailabilitySlot) {
    props.form.availability_slots = props.form.availability_slots.filter(
        (slot) =>
            !(
                slot.date === slotToRemove.date &&
                slot.time === slotToRemove.time
            ),
    );
}

function toggleWeekday(weekday: number) {
    selectedWeekdays.value = selectedWeekdays.value.includes(weekday)
        ? selectedWeekdays.value.filter((item) => item !== weekday)
        : [...selectedWeekdays.value, weekday].sort((a, b) => a - b);
}

function toggleRuleTime(time: string) {
    selectedRuleTimes.value = selectedRuleTimes.value.includes(time)
        ? selectedRuleTimes.value.filter((item) => item !== time)
        : [...selectedRuleTimes.value, time].sort((a, b) => a.localeCompare(b));
}

function addRecurringRule() {
    if (!selectedWeekdays.value.length || !selectedRuleTimes.value.length) {
        return;
    }

    const selectedRules = selectedRuleTimes.value.map((time) => ({
        weekdays: [...selectedWeekdays.value],
        times: [time],
    }));

    props.form.availability_rules = normalizedAvailabilityRules([
        ...props.form.availability_rules,
        ...selectedRules,
    ]);
}

function removeRecurringRule(ruleToRemove: AvailabilityRule) {
    props.form.availability_rules = normalizedAvailabilityRules(
        props.form.availability_rules,
    ).filter(
        (rule) =>
            !(
                rule.weekdays.join(',') === ruleToRemove.weekdays.join(',') &&
                rule.times.join(',') === ruleToRemove.times.join(',')
            ),
    );
}

function normalizedAvailabilityRules(
    rules: AvailabilityRule[],
): AvailabilityRule[] {
    const weekdaysByTime = new Map<string, Set<number>>();

    rules.forEach((rule) => {
        rule.times.forEach((time) => {
            const weekdays = weekdaysByTime.get(time) || new Set<number>();

            rule.weekdays.forEach((weekday) => weekdays.add(weekday));
            weekdaysByTime.set(time, weekdays);
        });
    });

    return [...weekdaysByTime.entries()]
        .map(([time, weekdays]) => ({
            weekdays: [...weekdays].sort((a, b) => a - b),
            times: [time],
        }))
        .sort((a, b) => a.times[0].localeCompare(b.times[0]));
}

function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatDateLabel(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}
</script>

<template>
    <section class="space-y-3 pt-1">
        <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
                <p class="text-sm font-bold text-slate-950">Availability</p>
                <p class="mt-1 text-xs leading-5 text-slate-500">
                    Set weekly hours once, then add specific extra dates only
                    when needed.
                </p>
            </div>
            <span
                class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
            >
                {{ totalAvailabilityCount }} saved
            </span>
        </div>

        <div class="grid grid-cols-2 rounded-full bg-slate-100 p-1">
            <button
                type="button"
                class="inline-flex min-h-10 items-center justify-center gap-2 rounded-full text-sm font-black transition"
                :class="
                    mode === 'repeat'
                        ? 'bg-white text-slate-950 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.75)]'
                        : 'text-slate-500'
                "
                @click="mode = 'repeat'"
            >
                <Repeat2 class="h-4 w-4" />
                Weekly
            </button>
            <button
                type="button"
                class="inline-flex min-h-10 items-center justify-center gap-2 rounded-full text-sm font-black transition"
                :class="
                    mode === 'single'
                        ? 'bg-white text-slate-950 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.75)]'
                        : 'text-slate-500'
                "
                @click="mode = 'single'"
            >
                <CalendarPlus class="h-4 w-4" />
                One-off
            </button>
        </div>

        <div
            v-if="mode === 'repeat'"
            class="space-y-3 rounded-2xl bg-slate-50 p-3"
        >
            <div
                class="-mx-1 flex touch-pan-x snap-x snap-mandatory scrollbar-none gap-2 overflow-x-auto scroll-smooth px-1 pb-1"
            >
                <button
                    v-for="weekday in weekdayOptions"
                    :key="weekday.value"
                    type="button"
                    class="min-w-14 shrink-0 snap-start rounded-full px-3 py-2 text-xs font-black transition"
                    :class="
                        selectedWeekdays.includes(weekday.value)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                    "
                    @click="toggleWeekday(weekday.value)"
                >
                    {{ weekday.label }}
                </button>
            </div>

            <div
                class="-mx-1 flex touch-pan-x snap-x snap-mandatory scrollbar-none gap-2 overflow-x-auto scroll-smooth px-1 pb-1"
            >
                <button
                    v-for="time in timeOptions"
                    :key="`rule-${time}`"
                    type="button"
                    class="shrink-0 snap-start rounded-full px-4 py-2 text-sm font-black transition"
                    :class="
                        selectedRuleTimes.includes(time)
                            ? 'bg-slate-950 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-200'
                    "
                    @click="toggleRuleTime(time)"
                >
                    {{ time }}
                </button>
            </div>

            <button
                type="button"
                class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="
                    !selectedWeekdays.length || !selectedRuleTimes.length
                "
                @click="addRecurringRule"
            >
                <CalendarPlus class="h-5 w-5" stroke-width="2.3" />
                Add weekly rule
            </button>
        </div>

        <div v-else class="space-y-3 rounded-2xl bg-slate-50 p-3">
            <div
                class="-mx-1 flex touch-pan-x snap-x snap-mandatory scrollbar-none gap-2 overflow-x-auto scroll-smooth px-1 pb-1"
            >
                <button
                    v-for="date in dateOptions"
                    :key="date.key"
                    type="button"
                    class="relative grid min-h-16 min-w-16 shrink-0 snap-start place-items-center rounded-2xl px-2 py-2 text-center transition"
                    :class="
                        slotDate === date.key
                            ? 'bg-emerald-600 text-white shadow-[0_16px_30px_-22px_rgba(5,150,105,0.9)]'
                            : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                    "
                    @click="slotDate = date.key"
                >
                    <span class="text-[10px] font-black uppercase">
                        {{ date.weekday }}
                    </span>
                    <span class="text-lg leading-none font-black">
                        {{ date.day }}
                    </span>
                    <span class="text-[10px] font-bold uppercase">
                        {{ date.month }}
                    </span>
                    <span
                        v-if="
                            form.availability_slots.some(
                                (slot) => slot.date === date.key,
                            )
                        "
                        class="absolute right-2 bottom-2 h-1.5 w-1.5 rounded-full"
                        :class="
                            slotDate === date.key
                                ? 'bg-white'
                                : 'bg-emerald-500'
                        "
                    ></span>
                </button>
            </div>

            <div
                class="-mx-1 flex touch-pan-x snap-x snap-mandatory scrollbar-none gap-2 overflow-x-auto scroll-smooth px-1 pb-1"
            >
                <button
                    v-for="time in timeOptions"
                    :key="time"
                    type="button"
                    class="shrink-0 snap-start rounded-full px-4 py-2 text-sm font-black transition"
                    :class="
                        slotTime === time
                            ? 'bg-slate-950 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-200'
                    "
                    @click="slotTime = time"
                >
                    {{ time }}
                </button>
            </div>

            <button
                type="button"
                class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!slotDate || !slotTime"
                @click="addSlot"
            >
                <CalendarPlus class="h-5 w-5" stroke-width="2.3" />
                Add date slot
            </button>
        </div>

        <div
            v-if="recurringSummary.length || singleSlotSummary.length"
            class="space-y-2"
        >
            <p
                class="text-[11px] font-black tracking-[0.14em] text-slate-500 uppercase"
            >
                Saved availability
            </p>
            <div
                class="-mx-1 flex touch-pan-x snap-x snap-mandatory scrollbar-none gap-2 overflow-x-auto scroll-smooth px-1 pb-1"
            >
                <button
                    v-for="rule in recurringSummary"
                    :key="`${rule.weekdays.join('-')}-${rule.times.join('-')}`"
                    type="button"
                    class="inline-flex min-h-10 shrink-0 snap-start items-center gap-2 rounded-full bg-emerald-50 px-3 text-xs font-black text-emerald-900 transition hover:bg-rose-50 hover:text-rose-700"
                    @click="removeRecurringRule(rule)"
                >
                    <Repeat2 class="h-3.5 w-3.5" />
                    {{ rule.weekdayLabels }} · {{ rule.times.join(', ') }}
                    <X class="h-3.5 w-3.5" stroke-width="2.5" />
                </button>

                <button
                    v-for="slot in singleSlotSummary"
                    :key="`${slot.date}-${slot.time}`"
                    type="button"
                    class="inline-flex min-h-10 shrink-0 snap-start items-center gap-2 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-800 transition hover:bg-rose-50 hover:text-rose-700"
                    @click="removeSlot(slot)"
                >
                    <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                    {{ slot.dateLabel }} · {{ slot.time }}
                    <X class="h-3.5 w-3.5" stroke-width="2.5" />
                </button>
            </div>
        </div>

        <p v-else class="text-xs leading-5 font-semibold text-slate-500">
            Nothing saved yet. Add weekly availability first for the fastest
            setup.
        </p>
    </section>
</template>
