<script setup lang="ts">
import AdminMetricGrid from '@/components/admin/AdminMetricGrid.vue';
import AdminPortalLayout from '@/components/admin/AdminPortalLayout.vue';

defineProps<{
    counts: Record<string, number>;
}>();
</script>

<template>
    <AdminPortalLayout title="Overview" active="overview">
        <AdminMetricGrid :counts="counts" />
    </AdminPortalLayout>
</template>
