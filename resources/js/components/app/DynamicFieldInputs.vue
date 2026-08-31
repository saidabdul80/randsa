<script setup lang="ts">
import AppSelectInput from '@/components/app/AppSelectInput.vue';
import AppTextareaInput from '@/components/app/AppTextareaInput.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import AppToggleInput from '@/components/app/AppToggleInput.vue';
import type { FieldValue, ServiceSubCategoryField } from '@/types/domain';

const props = defineProps<{
    fields: ServiceSubCategoryField[];
    values: FieldValue[];
}>();

const emit = defineEmits<{
    'update:values': [values: FieldValue[]];
}>();

function valueFor(field: ServiceSubCategoryField): FieldValue {
    const current = props.values.find((item) => item.service_field_id === field.service_field_id);

    return (
        current ?? {
            service_field_id: field.service_field_id,
            field_key: field.field?.key ?? field.service_field_id,
            value_string: '',
        }
    );
}

function setValue(field: ServiceSubCategoryField, key: keyof FieldValue, value: unknown) {
    const next = props.values.filter((item) => item.service_field_id !== field.service_field_id);
    next.push({
        ...valueFor(field),
        [key]: value,
    });
    emit('update:values', next);
}

function optionsFor(field: ServiceSubCategoryField): Array<{ label: string; value: string }> {
    return [
        { label: 'Select option', value: '' },
        ...(field.field?.options || []).map((option) => ({ label: option.label, value: option.value })),
    ];
}

function fieldLabel(field: ServiceSubCategoryField): string {
    const label = field.field?.label || field.service_field_id;

    return field.is_required ? `${label} *` : label;
}
</script>

<template>
    <div v-if="fields.length" class="grid gap-4 md:grid-cols-2">
        <div v-for="link in fields" :key="link.id" class="space-y-1 text-sm">
            <AppSelectInput
                v-if="['select', 'multi_select'].includes(link.field?.field_type || '')"
                :model-value="valueFor(link).value_string || ''"
                :label="fieldLabel(link)"
                :options="optionsFor(link)"
                @update:model-value="setValue(link, 'value_string', $event)"
            />

            <AppTextInput
                v-else-if="link.field?.data_type === 'number' || link.field?.field_type === 'number'"
                :model-value="valueFor(link).value_number ?? ''"
                :label="fieldLabel(link)"
                :placeholder="link.field?.placeholder || ''"
                type="number"
                @update:model-value="setValue(link, 'value_number', $event)"
            />

            <AppToggleInput
                v-else-if="link.field?.data_type === 'boolean' || link.field?.field_type === 'boolean'"
                :model-value="Boolean(valueFor(link).value_boolean)"
                :label="link.field?.placeholder || link.field?.label || 'Enabled'"
                @update:model-value="setValue(link, 'value_boolean', $event)"
            />

            <AppTextareaInput
                v-else-if="link.field?.field_type === 'textarea'"
                :model-value="valueFor(link).value_string || ''"
                :label="fieldLabel(link)"
                :placeholder="link.field?.placeholder || ''"
                :rows="4"
                @update:model-value="setValue(link, 'value_string', $event)"
            />

            <AppTextInput
                v-else
                :model-value="valueFor(link).value_string || ''"
                :label="fieldLabel(link)"
                :placeholder="link.field?.placeholder || ''"
                type="text"
                @update:model-value="setValue(link, 'value_string', $event)"
            />

            <span v-if="link.field?.help_text" class="block text-xs text-zinc-500">{{ link.field.help_text }}</span>
        </div>
    </div>
</template>
