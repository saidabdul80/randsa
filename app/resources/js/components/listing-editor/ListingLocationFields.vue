<script setup lang="ts">
import AppTextInput from '@/components/app/AppTextInput.vue';
import type { ListingEditorFormState } from '@/types/domain';

defineProps<{
    form: ListingEditorFormState;
}>();
</script>

<template>
    <section class="space-y-4">
        <div class="grid gap-4 md:grid-cols-3">
            <AppTextInput v-model="form.state" label="State" />
            <AppTextInput v-model="form.city" label="City" />
            <AppTextInput v-model="form.area" label="Area" />
        </div>

        <AppTextInput v-model="form.address" label="Address" />
    </section>
</template>
