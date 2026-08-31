<script setup lang="ts">
import { computed } from 'vue';
import { collection } from '@/lib/domain';
import type { CollectionLike, FieldValue } from '@/types/domain';

const props = defineProps<{
    values?: CollectionLike<FieldValue>;
}>();

const valueList = computed(() => collection(props.values));

function displayValue(value: FieldValue): string {
    if (value.value_string) return value.value_string;
    if (value.value_number !== null && value.value_number !== undefined) return String(value.value_number);
    if (value.value_boolean !== null && value.value_boolean !== undefined) return value.value_boolean ? 'Yes' : 'No';
    if (value.value_date) return value.value_date;
    if (value.value_json) return JSON.stringify(value.value_json);

    return 'Not specified';
}
</script>

<template>
    <section class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
        <h2 class="text-lg font-semibold text-zinc-950">Additional details</h2>
        <dl v-if="valueList.length" class="mt-4 grid gap-3 sm:grid-cols-2">
            <div v-for="value in valueList" :key="value.id || value.service_field_id" class="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <dt class="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                    {{ value.field?.label || value.field_key }}
                </dt>
                <dd class="mt-1 text-sm font-semibold text-zinc-900">{{ displayValue(value) }}</dd>
            </div>
        </dl>
        <p v-else class="mt-3 text-sm text-zinc-600">No additional details were supplied.</p>
    </section>
</template>
