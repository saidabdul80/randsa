<script setup lang="ts">
import DynamicFieldInputs from '@/components/app/DynamicFieldInputs.vue';
import type { FieldValue, ServiceSubCategoryField } from '@/types/domain';

defineProps<{
    fields: ServiceSubCategoryField[];
    values: FieldValue[];
}>();

const emit = defineEmits<{
    'update:values': [values: FieldValue[]];
}>();
</script>

<template>
    <section>
        <h2 class="text-base font-semibold">Dynamic details</h2>
        <p class="mt-1 text-sm text-zinc-600">These fields come from admin-managed service field configuration.</p>
        <DynamicFieldInputs :values="values" :fields="fields" class="mt-4" @update:values="emit('update:values', $event)" />
    </section>
</template>
