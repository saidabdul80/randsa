<script setup lang="ts">
import AppTextInput from '@/components/app/AppTextInput.vue';
import type { ListingEditorFormState } from '@/types/domain';

defineProps<{
    form: ListingEditorFormState;
    isOptional?: boolean;
}>();
</script>

<template>
    <section class="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
                <p class="text-sm font-bold text-slate-950">Pricing</p>
                <p class="mt-1 text-xs leading-5 text-slate-500">
                    {{ isOptional ? 'Leave price empty when customers should request a quote.' : 'Set the public price shown on the listing.' }}
                </p>
            </div>
            <span v-if="isOptional" class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100">
                Optional for services
            </span>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
            <AppTextInput v-model="form.base_price" :label="isOptional ? 'Starting price' : 'Listed price'" type="number" min="0" />
            <AppTextInput v-model="form.currency" label="Currency" />
            <AppTextInput v-model="form.pricing_unit" label="Price unit" placeholder="month, job, day" @input="form.billing_period = form.pricing_unit" />
        </div>
    </section>
</template>
