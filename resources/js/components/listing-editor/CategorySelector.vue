<script setup lang="ts">
import { computed } from 'vue';
import AppSelectInput from '@/components/app/AppSelectInput.vue';
import type { ServiceCategory, ServiceSubCategory } from '@/types/domain';

const props = defineProps<{
    categories: ServiceCategory[];
    subCategories: ServiceSubCategory[];
    selectedCategoryId: string;
    selectedSubCategoryId: string;
}>();

const emit = defineEmits<{
    'update:selectedCategoryId': [value: string];
    'update:selectedSubCategoryId': [value: string];
}>();

const categoryOptions = computed(() => props.categories.map((category) => ({ label: category.label, value: category.id })));
const subCategoryOptions = computed(() => [
    { label: 'Choose type', value: '' },
    ...props.subCategories.map((subcategory) => ({ label: subcategory.label, value: subcategory.id })),
]);
</script>

<template>
    <section class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
            <AppSelectInput :model-value="selectedCategoryId" label="Category" :options="categoryOptions" @update:model-value="emit('update:selectedCategoryId', $event)" />
            <AppSelectInput :model-value="selectedSubCategoryId" label="Subcategory" :options="subCategoryOptions" @update:model-value="emit('update:selectedSubCategoryId', $event)" />
        </div>
    </section>
</template>
