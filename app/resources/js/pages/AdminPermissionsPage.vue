<script setup lang="ts">
import AdminPortalLayout from '@/components/admin/AdminPortalLayout.vue';
import RolePermissionManager from '@/components/admin/RolePermissionManager.vue';
import type { PermissionRecord, RoleRecord } from '@/types/domain';

defineProps<{
    roles: RoleRecord[];
    permissions: Record<string, PermissionRecord[]>;
}>();
</script>

<template>
    <AdminPortalLayout title="Roles and permissions" active="permissions">
        <RolePermissionManager :roles="roles" :permissions="permissions" />
    </AdminPortalLayout>
</template>
