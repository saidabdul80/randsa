<script setup lang="ts">
import { useForm } from '@inertiajs/vue3';
import { Check, Pencil, Plus } from '@lucide/vue';
import { computed, ref } from 'vue';
import AdminDataTable from '@/components/admin/AdminDataTable.vue';
import AdminModal from '@/components/admin/AdminModal.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import type { PermissionRecord, RoleRecord } from '@/types/domain';

const props = defineProps<{
    roles: RoleRecord[];
    permissions: Record<string, PermissionRecord[]>;
}>();

const selectedRole = ref<RoleRecord | null>(null);
const creatingRole = ref(false);
const form = useForm({
    name: '',
    description: '',
    permissions: [] as string[],
});
const columns = [
    { key: 'role', label: 'Role' },
    { key: 'type', label: 'Type' },
    { key: 'permissions', label: 'Permissions', align: 'right' as const },
    { key: 'actions', label: '', align: 'right' as const },
];
const totalPermissions = computed(() => Object.values(props.permissions).flat().length);

function openRole(role: RoleRecord): void {
    creatingRole.value = false;
    selectedRole.value = role;
    form.name = role.name;
    form.description = role.description || '';
    form.permissions = [...role.permissions];
}

function openCreateRole(): void {
    creatingRole.value = true;
    selectedRole.value = null;
    form.name = '';
    form.description = '';
    form.permissions = [];
}

function closeModal(): void {
    creatingRole.value = false;
    selectedRole.value = null;
}

function togglePermission(permission: string): void {
    form.permissions = form.permissions.includes(permission)
        ? form.permissions.filter((item) => item !== permission)
        : [...form.permissions, permission];
}

function submit(): void {
    if (creatingRole.value) {
        form.post('/admin/roles', {
            preserveScroll: true,
            onSuccess: closeModal,
        });

        return;
    }

    if (!selectedRole.value) return;

    form.patch(`/admin/roles/${selectedRole.value.id}/permissions`, {
        preserveScroll: true,
        onSuccess: closeModal,
    });
}
</script>

<template>
    <section class="space-y-5">
        <div class="flex justify-end">
            <button
                type="button"
                class="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-black text-white shadow-[0_16px_34px_-24px_rgba(6,95,70,0.8)] transition hover:bg-emerald-900"
                @click="openCreateRole"
            >
                <Plus class="h-4 w-4" stroke-width="2.4" />
                New role
            </button>
        </div>

        <AdminDataTable
            :columns="columns"
            :empty="!roles.length"
            empty-title="No roles"
            empty-body="Seed or create roles before assigning permissions."
        >
            <tr v-for="role in roles" :key="role.id" class="transition hover:bg-slate-50">
                <td class="px-5 py-4">
                    <p class="text-sm font-black capitalize text-slate-950">{{ role.name }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ role.description || 'Permission group' }}</p>
                </td>
                <td class="px-5 py-4">
                    <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="role.is_system ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'">
                        {{ role.is_system ? 'System' : 'Custom' }}
                    </span>
                </td>
                <td class="px-5 py-4 text-right text-sm font-black text-slate-950">
                    {{ role.permissions.length }} / {{ totalPermissions }}
                </td>
                <td class="px-5 py-4 text-right">
                    <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100" @click="openRole(role)">
                        <Pencil class="h-4 w-4" stroke-width="2.1" />
                        Permissions
                    </button>
                </td>
            </tr>
        </AdminDataTable>

        <AdminModal :open="Boolean(selectedRole) || creatingRole" :title="creatingRole ? 'Create role' : selectedRole ? `Manage ${selectedRole.name}` : 'Manage permissions'" @close="closeModal">
            <form v-if="selectedRole || creatingRole" class="space-y-6" @submit.prevent="submit">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <template v-if="creatingRole">
                        <div class="grid gap-4 sm:grid-cols-2">
                            <AppTextInput v-model="form.name" label="Role name" placeholder="support_manager" />
                            <AppTextInput v-model="form.description" label="Description" placeholder="Support manager" />
                        </div>
                    </template>
                    <template v-else-if="selectedRole">
                        <p class="text-sm font-black capitalize text-slate-950">{{ selectedRole.name }}</p>
                        <p class="mt-1 text-sm leading-6 text-slate-500">{{ selectedRole.description || 'Choose what this role can do.' }}</p>
                    </template>
                </div>

                <div class="grid gap-5 md:grid-cols-2">
                    <section v-for="(groupPermissions, group) in permissions" :key="group" class="rounded-2xl border border-slate-200 bg-white p-4">
                        <h4 class="text-sm font-black capitalize text-slate-950">{{ group || 'general' }}</h4>
                        <div class="mt-4 space-y-2">
                            <button
                                v-for="permission in groupPermissions"
                                :key="permission.id"
                                type="button"
                                class="flex w-full gap-3 rounded-xl border p-3 text-left transition"
                                :class="form.permissions.includes(permission.name) ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'"
                                @click="togglePermission(permission.name)"
                            >
                                <span
                                    class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border"
                                    :class="form.permissions.includes(permission.name) ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-300 bg-white text-transparent'"
                                >
                                    <Check class="h-3.5 w-3.5" stroke-width="3" />
                                </span>
                                <span class="min-w-0">
                                    <span class="block text-sm font-bold text-slate-900">{{ permission.name }}</span>
                                    <span v-if="permission.description" class="mt-1 block text-xs leading-5 text-slate-500">{{ permission.description }}</span>
                                </span>
                            </button>
                        </div>
                    </section>
                </div>

                <button type="submit" class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60" :disabled="form.processing">
                    {{ creatingRole ? 'Create role' : 'Save permissions' }}
                </button>
            </form>
        </AdminModal>
    </section>
</template>
