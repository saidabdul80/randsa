<script setup lang="ts">
import { useForm } from '@inertiajs/vue3';
import { Pencil, Plus } from '@lucide/vue';
import { computed, ref } from 'vue';
import AdminDataTable from '@/components/admin/AdminDataTable.vue';
import AdminModal from '@/components/admin/AdminModal.vue';
import AppSelectInput from '@/components/app/AppSelectInput.vue';
import AppTextareaInput from '@/components/app/AppTextareaInput.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import AppToggleInput from '@/components/app/AppToggleInput.vue';
import { collection, statusLabel } from '@/lib/domain';
import type { ServiceCategory, ServiceField, ServiceSubCategory } from '@/types/domain';

const props = withDefaults(
    defineProps<{
        activeTab: 'categories' | 'subcategories' | 'fields';
        categories: ServiceCategory[];
        fields?: ServiceField[];
        enumOptions: {
            service_category_types: string[];
            service_sub_category_types: string[];
            transaction_types: string[];
            provider_kinds: string[];
            listing_tables: string[];
        };
    }>(),
    {
        fields: () => [],
    },
);

const activeModal = ref<'category' | 'subcategory' | 'field' | null>(null);
const editingCategoryId = ref('');
const editingSubCategoryId = ref('');
const editingFieldId = ref('');

const categoryForm = useForm({
    id: '',
    name: '',
    label: '',
    slug: '',
    description: '',
    type: props.enumOptions.service_category_types[0] || 'other',
    icon_key: '',
    keywords: [] as string[],
    sort_order: 0,
    is_active: true,
    is_public: true,
});

const subCategoryForm = useForm({
    id: '',
    service_category_id: props.categories[0]?.id || '',
    name: '',
    label: '',
    slug: '',
    description: '',
    keywords: [] as string[],
    type: props.enumOptions.service_sub_category_types[0] || 'other',
    transaction_type: props.enumOptions.transaction_types[0] || 'other',
    provider_kind: props.enumOptions.provider_kinds[0] || 'user',
    fulfillment_mode: 'direct',
    default_listing_table: props.enumOptions.listing_tables[0] || 'marketplace_listings',
    default_status: 'pending',
    requires_moderation: true,
    requires_provider_verification: false,
    uses_service_area: false,
    is_bookable: true,
    is_payable: true,
    allows_private_document: false,
    sort_order: 0,
    is_active: true,
    is_public: true,
});

const fieldForm = useForm({
    id: '',
    key: '',
    label: '',
    management_label: '',
    field_type: 'text',
    data_type: 'string',
    placeholder: '',
    help_text: '',
    default_value: {} as Record<string, string | number | boolean | null>,
    validation_rules: {} as Record<string, string | number | boolean | null>,
    is_system: false,
    is_active: true,
    options: [] as Array<{ id: string; value: string; label: string; sort_order: number; is_active: boolean }>,
});

const categoryOptions = computed(() => props.categories.map((category) => ({ label: category.label, value: category.id })));
const subCategories = computed(() =>
    props.categories.flatMap((category) =>
        collection(category.sub_categories).map((subCategory) => ({
            ...subCategory,
            category_label: category.label,
        })),
    ),
);
const categoryTypeOptions = computed(() => props.enumOptions.service_category_types.map((type) => ({ label: statusLabel(type), value: type })));
const subCategoryTypeOptions = computed(() => props.enumOptions.service_sub_category_types.map((type) => ({ label: statusLabel(type), value: type })));
const transactionTypeOptions = computed(() => props.enumOptions.transaction_types.map((type) => ({ label: statusLabel(type), value: type })));
const providerKindOptions = computed(() => props.enumOptions.provider_kinds.map((kind) => ({ label: statusLabel(kind), value: kind })));
const listingTableOptions = computed(() => props.enumOptions.listing_tables.map((table) => ({ label: statusLabel(table), value: table })));
const fieldTypeOptions = [
    { label: 'Text', value: 'text' },
    { label: 'Number', value: 'number' },
    { label: 'Select', value: 'select' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Date', value: 'date' },
    { label: 'Textarea', value: 'textarea' },
];
const dataTypeOptions = [
    { label: 'String', value: 'string' },
    { label: 'Integer', value: 'integer' },
    { label: 'Decimal', value: 'decimal' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Date', value: 'date' },
    { label: 'JSON', value: 'json' },
];
const categoryColumns = [
    { key: 'label', label: 'Category' },
    { key: 'type', label: 'Type' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'subcategories', label: 'Subcategories', align: 'right' as const },
    { key: 'sort', label: 'Sort', align: 'right' as const },
    { key: 'actions', label: '', align: 'right' as const },
];
const subCategoryColumns = [
    { key: 'label', label: 'Subcategory' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type' },
    { key: 'provider', label: 'Provider' },
    { key: 'rules', label: 'Rules' },
    { key: 'actions', label: '', align: 'right' as const },
];
const fieldColumns = [
    { key: 'label', label: 'Field' },
    { key: 'type', label: 'Input type' },
    { key: 'data', label: 'Data type' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '', align: 'right' as const },
];
const activeCreateLabel = computed(() => {
    if (props.activeTab === 'categories') return 'New category';
    if (props.activeTab === 'subcategories') return 'New subcategory';

    return 'New field';
});

function slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function applyCategoryLabel() {
    if (!categoryForm.name) categoryForm.name = slugify(categoryForm.label).replaceAll('-', '_');
    if (!categoryForm.id) categoryForm.id = slugify(categoryForm.label).replaceAll('-', '_');
    if (!categoryForm.slug) categoryForm.slug = slugify(categoryForm.label);
}

function applySubCategoryLabel() {
    if (!subCategoryForm.name) subCategoryForm.name = slugify(subCategoryForm.label).replaceAll('-', '_');
    if (!subCategoryForm.id) subCategoryForm.id = `${subCategoryForm.service_category_id}_${slugify(subCategoryForm.label).replaceAll('-', '_')}`;
    if (!subCategoryForm.slug) subCategoryForm.slug = slugify(subCategoryForm.label);
}

function applyFieldLabel() {
    if (!fieldForm.key) fieldForm.key = slugify(fieldForm.label).replaceAll('-', '_');
    if (!fieldForm.id) fieldForm.id = fieldForm.key;
}

function resetCategoryForm(category?: ServiceCategory) {
    editingCategoryId.value = category?.id || '';
    Object.assign(categoryForm, {
        id: category?.id || '',
        name: category?.name || '',
        label: category?.label || '',
        slug: category?.slug || '',
        description: category?.description || '',
        type: category?.type || props.enumOptions.service_category_types[0] || 'other',
        icon_key: category?.icon_key || '',
        keywords: category?.keywords || [],
        sort_order: category?.sort_order || 0,
        is_active: category?.is_active ?? true,
        is_public: category?.is_public ?? true,
    });
}

function resetSubCategoryForm(subCategory?: ServiceSubCategory) {
    editingSubCategoryId.value = subCategory?.id || '';
    Object.assign(subCategoryForm, {
        id: subCategory?.id || '',
        service_category_id: subCategory?.service_category_id || props.categories[0]?.id || '',
        name: subCategory?.name || '',
        label: subCategory?.label || '',
        slug: subCategory?.slug || '',
        description: subCategory?.description || '',
        keywords: subCategory?.keywords || [],
        type: subCategory?.type || props.enumOptions.service_sub_category_types[0] || 'other',
        transaction_type: subCategory?.transaction_type || props.enumOptions.transaction_types[0] || 'other',
        provider_kind: subCategory?.provider_kind || props.enumOptions.provider_kinds[0] || 'user',
        fulfillment_mode: subCategory?.fulfillment_mode || 'direct',
        default_listing_table: subCategory?.default_listing_table || props.enumOptions.listing_tables[0] || 'marketplace_listings',
        default_status: subCategory?.default_status || 'pending',
        requires_moderation: subCategory?.requires_moderation ?? true,
        requires_provider_verification: subCategory?.requires_provider_verification ?? false,
        uses_service_area: subCategory?.uses_service_area ?? false,
        is_bookable: subCategory?.is_bookable ?? true,
        is_payable: subCategory?.is_payable ?? true,
        allows_private_document: subCategory?.allows_private_document ?? false,
        sort_order: subCategory?.sort_order || 0,
        is_active: subCategory?.is_active ?? true,
        is_public: subCategory?.is_public ?? true,
    });
}

function resetFieldForm(field?: ServiceField) {
    editingFieldId.value = field?.id || '';
    Object.assign(fieldForm, {
        id: field?.id || '',
        key: field?.key || '',
        label: field?.label || '',
        management_label: field?.management_label || '',
        field_type: field?.field_type || 'text',
        data_type: field?.data_type || 'string',
        placeholder: field?.placeholder || '',
        help_text: field?.help_text || '',
        default_value: field?.default_value || {},
        validation_rules: field?.validation_rules || {},
        is_system: field?.is_system ?? false,
        is_active: field?.is_active ?? true,
        options: [],
    });
}

function openCreateModal() {
    if (props.activeTab === 'categories') {
        resetCategoryForm();
        activeModal.value = 'category';
        return;
    }

    if (props.activeTab === 'subcategories') {
        resetSubCategoryForm();
        activeModal.value = 'subcategory';
        return;
    }

    resetFieldForm();
    activeModal.value = 'field';
}

function openCategoryModal(category: ServiceCategory) {
    resetCategoryForm(category);
    activeModal.value = 'category';
}

function openSubCategoryModal(subCategory: ServiceSubCategory) {
    resetSubCategoryForm(subCategory);
    activeModal.value = 'subcategory';
}

function openFieldModal(field: ServiceField) {
    resetFieldForm(field);
    activeModal.value = 'field';
}

function submitCategory() {
    applyCategoryLabel();
    const options = {
        preserveScroll: true,
        onSuccess: () => {
            activeModal.value = null;
        },
    };

    editingCategoryId.value
        ? categoryForm.patch(`/admin/service-categories/${editingCategoryId.value}`, options)
        : categoryForm.post('/admin/service-categories', options);
}

function submitSubCategory() {
    applySubCategoryLabel();
    const options = {
        preserveScroll: true,
        onSuccess: () => {
            activeModal.value = null;
        },
    };

    editingSubCategoryId.value
        ? subCategoryForm.patch(`/admin/service-sub-categories/${editingSubCategoryId.value}`, options)
        : subCategoryForm.post('/admin/service-sub-categories', options);
}

function submitField() {
    applyFieldLabel();
    const options = {
        preserveScroll: true,
        onSuccess: () => {
            activeModal.value = null;
        },
    };

    editingFieldId.value
        ? fieldForm.patch(`/admin/service-fields/${editingFieldId.value}`, options)
        : fieldForm.post('/admin/service-fields', options);
}
</script>

<template>
    <section class="space-y-5">
        <div class="flex items-center justify-end">
            <button
                type="button"
                class="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-black text-white shadow-[0_16px_34px_-24px_rgba(6,95,70,0.8)] transition hover:bg-emerald-900"
                @click="openCreateModal"
            >
                <Plus class="h-4 w-4" stroke-width="2.4" />
                {{ activeCreateLabel }}
            </button>
        </div>

        <AdminDataTable
            v-if="activeTab === 'categories'"
            :columns="categoryColumns"
            :empty="!categories.length"
            empty-title="No categories"
            empty-body="Create the first service category."
        >
            <tr v-for="category in categories" :key="category.id" class="transition hover:bg-slate-50">
                <td class="px-5 py-4">
                    <p class="text-sm font-black text-slate-950">{{ category.label }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ category.id }}</p>
                </td>
                <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ statusLabel(category.type) }}</td>
                <td class="px-5 py-4">
                    <div class="flex flex-wrap gap-2">
                        <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="category.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'">
                            {{ category.is_active ? 'Active' : 'Inactive' }}
                        </span>
                        <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="category.is_public ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'">
                            {{ category.is_public ? 'Public' : 'Private' }}
                        </span>
                    </div>
                </td>
                <td class="px-5 py-4 text-right text-sm font-black text-slate-950">{{ collection(category.sub_categories).length }}</td>
                <td class="px-5 py-4 text-right text-sm font-semibold text-slate-600">{{ category.sort_order }}</td>
                <td class="px-5 py-4 text-right">
                    <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100" @click="openCategoryModal(category)">
                        <Pencil class="h-4 w-4" stroke-width="2.1" />
                        Edit
                    </button>
                </td>
            </tr>
        </AdminDataTable>

        <AdminDataTable
            v-if="activeTab === 'subcategories'"
            :columns="subCategoryColumns"
            :empty="!subCategories.length"
            empty-title="No subcategories"
            empty-body="Create customer-facing service subcategories."
        >
            <tr v-for="subCategory in subCategories" :key="subCategory.id" class="transition hover:bg-slate-50">
                <td class="px-5 py-4">
                    <p class="text-sm font-black text-slate-950">{{ subCategory.label }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ subCategory.id }}</p>
                </td>
                <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ subCategory.category_label }}</td>
                <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ statusLabel(subCategory.type) }}</td>
                <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ statusLabel(subCategory.provider_kind) }}</td>
                <td class="px-5 py-4">
                    <div class="flex flex-wrap gap-2">
                        <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{{ statusLabel(subCategory.default_listing_table) }}</span>
                        <span v-if="subCategory.is_bookable" class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">Bookable</span>
                        <span v-if="subCategory.is_payable" class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">Payable</span>
                    </div>
                </td>
                <td class="px-5 py-4 text-right">
                    <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100" @click="openSubCategoryModal(subCategory)">
                        <Pencil class="h-4 w-4" stroke-width="2.1" />
                        Edit
                    </button>
                </td>
            </tr>
        </AdminDataTable>

        <AdminDataTable
            v-if="activeTab === 'fields'"
            :columns="fieldColumns"
            :empty="!fields.length"
            empty-title="No fields"
            empty-body="Create reusable fields that categories can display."
        >
            <tr v-for="field in fields" :key="field.id" class="transition hover:bg-slate-50">
                <td class="px-5 py-4">
                    <p class="text-sm font-black text-slate-950">{{ field.label }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ field.key }}</p>
                </td>
                <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ statusLabel(field.field_type) }}</td>
                <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ statusLabel(field.data_type) }}</td>
                <td class="px-5 py-4">
                    <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="field.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'">
                        {{ field.is_active ? 'Active' : 'Inactive' }}
                    </span>
                </td>
                <td class="px-5 py-4 text-right">
                    <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100" @click="openFieldModal(field)">
                        <Pencil class="h-4 w-4" stroke-width="2.1" />
                        Edit
                    </button>
                </td>
            </tr>
        </AdminDataTable>

        <AdminModal :open="activeModal === 'category'" :title="editingCategoryId ? 'Update category' : 'Create category'" @close="activeModal = null">
            <form class="space-y-5" @submit.prevent="submitCategory">
                <div class="grid gap-4 sm:grid-cols-2">
                    <AppTextInput v-model="categoryForm.label" label="Label" class="sm:col-span-2" @blur="applyCategoryLabel" />
                    <AppTextInput v-model="categoryForm.id" label="ID" />
                    <AppTextInput v-model="categoryForm.name" label="Name" />
                    <AppTextInput v-model="categoryForm.slug" label="Slug" />
                    <AppSelectInput v-model="categoryForm.type" label="Type" :options="categoryTypeOptions" />
                    <AppTextInput v-model="categoryForm.icon_key" label="Icon key" />
                    <AppTextInput v-model="categoryForm.sort_order" label="Sort order" type="number" min="0" />
                    <AppTextareaInput v-model="categoryForm.description" label="Description" :rows="3" class="sm:col-span-2" />
                    <AppToggleInput v-model="categoryForm.is_active" label="Active" />
                    <AppToggleInput v-model="categoryForm.is_public" label="Public" />
                </div>
                <button type="submit" class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60" :disabled="categoryForm.processing">
                    {{ editingCategoryId ? 'Update category' : 'Create category' }}
                </button>
            </form>
        </AdminModal>

        <AdminModal :open="activeModal === 'subcategory'" :title="editingSubCategoryId ? 'Update subcategory' : 'Create subcategory'" @close="activeModal = null">
            <form class="space-y-5" @submit.prevent="submitSubCategory">
                <div class="grid gap-4 sm:grid-cols-2">
                    <AppSelectInput v-model="subCategoryForm.service_category_id" label="Category" :options="categoryOptions" class="sm:col-span-2" />
                    <AppTextInput v-model="subCategoryForm.label" label="Label" class="sm:col-span-2" @blur="applySubCategoryLabel" />
                    <AppTextInput v-model="subCategoryForm.id" label="ID" />
                    <AppTextInput v-model="subCategoryForm.name" label="Name" />
                    <AppTextInput v-model="subCategoryForm.slug" label="Slug" />
                    <AppSelectInput v-model="subCategoryForm.type" label="Type" :options="subCategoryTypeOptions" />
                    <AppSelectInput v-model="subCategoryForm.default_listing_table" label="Target table" :options="listingTableOptions" />
                    <AppSelectInput v-model="subCategoryForm.transaction_type" label="Transaction" :options="transactionTypeOptions" />
                    <AppSelectInput v-model="subCategoryForm.provider_kind" label="Provider" :options="providerKindOptions" />
                    <AppTextInput v-model="subCategoryForm.fulfillment_mode" label="Fulfillment mode" />
                    <AppTextInput v-model="subCategoryForm.default_status" label="Default status" />
                    <AppTextInput v-model="subCategoryForm.sort_order" label="Sort order" type="number" min="0" />
                    <AppTextareaInput v-model="subCategoryForm.description" label="Description" :rows="3" class="sm:col-span-2" />
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                    <AppToggleInput v-model="subCategoryForm.requires_moderation" label="Moderation" />
                    <AppToggleInput v-model="subCategoryForm.requires_provider_verification" label="Provider verification" />
                    <AppToggleInput v-model="subCategoryForm.is_bookable" label="Bookable" />
                    <AppToggleInput v-model="subCategoryForm.is_payable" label="Payable" />
                    <AppToggleInput v-model="subCategoryForm.uses_service_area" label="Uses service area" />
                    <AppToggleInput v-model="subCategoryForm.allows_private_document" label="Private document" />
                    <AppToggleInput v-model="subCategoryForm.is_active" label="Active" />
                    <AppToggleInput v-model="subCategoryForm.is_public" label="Public" />
                </div>
                <button type="submit" class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60" :disabled="subCategoryForm.processing">
                    {{ editingSubCategoryId ? 'Update subcategory' : 'Create subcategory' }}
                </button>
            </form>
        </AdminModal>

        <AdminModal :open="activeModal === 'field'" :title="editingFieldId ? 'Update field' : 'Create field'" @close="activeModal = null">
            <form class="space-y-5" @submit.prevent="submitField">
                <div class="grid gap-4 sm:grid-cols-2">
                    <AppTextInput v-model="fieldForm.label" label="Label" class="sm:col-span-2" placeholder="Bedrooms" @blur="applyFieldLabel" />
                    <AppTextInput v-model="fieldForm.key" label="Key" placeholder="bedrooms" />
                    <AppTextInput v-model="fieldForm.id" label="ID" placeholder="bedrooms" />
                    <AppTextInput v-model="fieldForm.management_label" label="Management label" />
                    <AppSelectInput v-model="fieldForm.field_type" label="Field type" :options="fieldTypeOptions" />
                    <AppSelectInput v-model="fieldForm.data_type" label="Data type" :options="dataTypeOptions" />
                    <AppTextInput v-model="fieldForm.placeholder" label="Placeholder" class="sm:col-span-2" />
                    <AppTextareaInput v-model="fieldForm.help_text" label="Help text" :rows="3" class="sm:col-span-2" />
                    <AppToggleInput v-model="fieldForm.is_active" label="Active" />
                </div>
                <button type="submit" class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60" :disabled="fieldForm.processing">
                    {{ editingFieldId ? 'Update field' : 'Create field' }}
                </button>
            </form>
        </AdminModal>
    </section>
</template>
