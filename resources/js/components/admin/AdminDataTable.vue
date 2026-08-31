<script setup lang="ts">
import AppDataTable from '@/components/app/AppDataTable.vue';

defineProps<{
    columns: Array<{ key: string; label: string; align?: 'left' | 'right' | 'center' }>;
    empty?: boolean;
    emptyTitle?: string;
    emptyBody?: string;
}>();
</script>

<template>
    <AppDataTable :columns="columns" :empty="empty" :empty-title="emptyTitle" :empty-body="emptyBody">
        <slot />
    </AppDataTable>
</template>
