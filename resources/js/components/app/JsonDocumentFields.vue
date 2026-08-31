<script setup lang="ts">
import AppTextInput from '@/components/app/AppTextInput.vue';
import type { DocumentPayload } from '@/types/domain';

const props = defineProps<{
    modelValue: DocumentPayload;
    title: string;
    required?: boolean;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: DocumentPayload];
}>();

function updateField(key: string, value: string) {
    emit('update:modelValue', {
        ...props.modelValue,
        [key]: value,
    });
}
</script>

<template>
    <fieldset class="rounded-[18px] border border-zinc-200 bg-white p-5 shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
        <legend class="px-1 text-sm font-semibold text-zinc-900">
            {{ title }} <span v-if="required" class="text-rose-600">*</span>
        </legend>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <AppTextInput :model-value="String(modelValue.url || '')" label="URL" type="url" @update:model-value="updateField('url', String($event || ''))" />
            <AppTextInput :model-value="String(modelValue.type || '')" label="Type" @update:model-value="updateField('type', String($event || ''))" />
        </div>
    </fieldset>
</template>
