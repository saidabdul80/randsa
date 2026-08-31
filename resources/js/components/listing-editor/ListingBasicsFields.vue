<script setup lang="ts">
import AppTextareaInput from '@/components/app/AppTextareaInput.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import type { ListingEditorFormState } from '@/types/domain';

defineProps<{
    form: ListingEditorFormState;
}>();
</script>

<template>
    <section class="space-y-4">
        <div>
            <AppTextInput v-model="form.title" label="Title" />
            <span v-if="form.errors.title" class="mt-1 block text-xs text-rose-600">{{ form.errors.title }}</span>
        </div>

        <div>
            <AppTextareaInput v-model="form.description" label="Description" :rows="5" />
            <span v-if="form.errors.description" class="mt-1 block text-xs text-rose-600">{{ form.errors.description }}</span>
        </div>
    </section>
</template>
