<script setup lang="ts">
import type { ServiceSubCategory } from '@/types/domain';

defineProps<{
    subCategory?: ServiceSubCategory;
}>();
</script>

<template>
    <section v-if="subCategory" class="grid gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm md:grid-cols-4">
        <div>
            <span class="text-xs text-zinc-500">Type</span>
            <strong class="block">{{ subCategory.type }}</strong>
        </div>
        <div>
            <span class="text-xs text-zinc-500">Transaction</span>
            <strong class="block">{{ subCategory.transaction_type }}</strong>
        </div>
        <div>
            <span class="text-xs text-zinc-500">Provider</span>
            <strong class="block">{{ subCategory.provider_kind }}</strong>
        </div>
        <div>
            <span class="text-xs text-zinc-500">Verification</span>
            <strong class="block">{{ subCategory.requires_provider_verification ? 'Required' : 'Optional' }}</strong>
        </div>
    </section>
</template>
