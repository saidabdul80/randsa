<script setup lang="ts">
import AppTextInput from '@/components/app/AppTextInput.vue';
import AppToggleInput from '@/components/app/AppToggleInput.vue';
import type { ListingEditorFormState } from '@/types/domain';

defineProps<{
    form: ListingEditorFormState;
    isProperty: boolean;
}>();
</script>

<template>
    <section class="grid gap-4 md:grid-cols-2">
        <AppTextInput v-if="!isProperty" v-model="form.contact_name" label="Contact name" />
        <AppTextInput v-model="form.contact_phone" :label="isProperty ? 'Owner phone' : 'Contact phone'" @input="form.owner_phone = form.contact_phone" />
        <AppToggleInput v-if="!isProperty" v-model="form.whatsapp_enabled" label="WhatsApp enabled" />
        <AppToggleInput v-if="!isProperty" v-model="form.delivery_available" label="Delivery or onsite service available" />
    </section>
</template>
