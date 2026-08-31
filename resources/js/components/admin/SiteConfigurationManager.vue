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
import type { LandingPageSection, ListingPriceRange } from '@/types/domain';

const props = defineProps<{
    activeTab: 'price_ranges' | 'content';
    priceRanges: ListingPriceRange[];
    landingSections: LandingPageSection[];
}>();

const activeModal = ref<'price_range' | 'content' | null>(null);
const editingPriceRangeId = ref('');
const editingSectionId = ref<number | null>(null);
const sectionTypes = [
    { label: 'Hero slide', value: 'hero_slide' },
    { label: 'Workflow item', value: 'workflow_item' },
    { label: 'Property trust item', value: 'property_trust_item' },
];
const createLabel = computed(() => (props.activeTab === 'price_ranges' ? 'New price range' : 'New content'));
const priceRangeColumns = [
    { key: 'label', label: 'Range' },
    { key: 'min', label: 'Minimum', align: 'right' as const },
    { key: 'max', label: 'Maximum', align: 'right' as const },
    { key: 'visibility', label: 'Visibility' },
    { key: 'sort', label: 'Sort', align: 'right' as const },
    { key: 'actions', label: '', align: 'right' as const },
];
const contentColumns = [
    { key: 'title', label: 'Content' },
    { key: 'section', label: 'Section' },
    { key: 'placement', label: 'Placement' },
    { key: 'visibility', label: 'Status' },
    { key: 'sort', label: 'Sort', align: 'right' as const },
    { key: 'actions', label: '', align: 'right' as const },
];

const priceRangeForm = useForm({
    id: '',
    label: '',
    currency: 'NGN',
    min_amount: null as number | null,
    max_amount: null as number | null,
    sort_order: 0,
    is_active: true,
    is_public: true,
});

const landingSectionForm = useForm({
    section_key: 'hero_slide',
    placement: 'home',
    eyebrow: '',
    title: '',
    description: '',
    image_url: '',
    action_label: '',
    action_url: '',
    payload: {} as Record<string, string | number | boolean | null>,
    sort_order: 0,
    is_active: true,
});

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
}

function amount(value?: string | number | null): string {
    if (value === null || value === undefined || value === '') return 'Open';

    return Number(value).toLocaleString('en-NG');
}

function resetPriceRangeForm(range?: ListingPriceRange) {
    editingPriceRangeId.value = range?.id || '';
    Object.assign(priceRangeForm, {
        id: range?.id || '',
        label: range?.label || '',
        currency: range?.currency || 'NGN',
        min_amount: range?.min_amount === undefined || range?.min_amount === null ? null : Number(range.min_amount),
        max_amount: range?.max_amount === undefined || range?.max_amount === null ? null : Number(range.max_amount),
        sort_order: range?.sort_order || 0,
        is_active: range?.is_active ?? true,
        is_public: range?.is_public ?? true,
    });
}

function resetSectionForm(section?: LandingPageSection) {
    editingSectionId.value = section?.id ?? null;
    Object.assign(landingSectionForm, {
        section_key: section?.section_key || 'hero_slide',
        placement: section?.placement || 'home',
        eyebrow: section?.eyebrow || '',
        title: section?.title || '',
        description: section?.description || '',
        image_url: section?.image_url || '',
        action_label: section?.action_label || '',
        action_url: section?.action_url || '',
        payload: section?.payload || {},
        sort_order: section?.sort_order || 0,
        is_active: section?.is_active ?? true,
    });
}

function openCreateModal() {
    if (props.activeTab === 'price_ranges') {
        resetPriceRangeForm();
        activeModal.value = 'price_range';
        return;
    }

    resetSectionForm();
    activeModal.value = 'content';
}

function openPriceRangeModal(range: ListingPriceRange) {
    resetPriceRangeForm(range);
    activeModal.value = 'price_range';
}

function openSectionModal(section: LandingPageSection) {
    resetSectionForm(section);
    activeModal.value = 'content';
}

function submitPriceRange() {
    if (!priceRangeForm.id) {
        priceRangeForm.id = slugify(priceRangeForm.label);
    }

    const options = {
        preserveScroll: true,
        onSuccess: () => {
            activeModal.value = null;
        },
    };

    editingPriceRangeId.value
        ? priceRangeForm.patch(`/admin/listing-price-ranges/${editingPriceRangeId.value}`, options)
        : priceRangeForm.post('/admin/listing-price-ranges', options);
}

function submitLandingSection() {
    const options = {
        preserveScroll: true,
        onSuccess: () => {
            activeModal.value = null;
        },
    };

    editingSectionId.value
        ? landingSectionForm.patch(`/admin/landing-page-sections/${editingSectionId.value}`, options)
        : landingSectionForm.post('/admin/landing-page-sections', options);
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
                {{ createLabel }}
            </button>
        </div>

        <AdminDataTable
            v-if="activeTab === 'price_ranges'"
            :columns="priceRangeColumns"
            :empty="!priceRanges.length"
            empty-title="No price ranges"
            empty-body="Create search ranges for public marketplace filtering."
        >
            <tr v-for="range in priceRanges" :key="range.id" class="transition hover:bg-slate-50">
                <td class="px-5 py-4">
                    <p class="text-sm font-black text-slate-950">{{ range.label }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ range.id }} · {{ range.currency }}</p>
                </td>
                <td class="px-5 py-4 text-right text-sm font-semibold text-slate-700">{{ amount(range.min_amount) }}</td>
                <td class="px-5 py-4 text-right text-sm font-semibold text-slate-700">{{ amount(range.max_amount) }}</td>
                <td class="px-5 py-4">
                    <div class="flex flex-wrap gap-2">
                        <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="range.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'">
                            {{ range.is_active ? 'Active' : 'Inactive' }}
                        </span>
                        <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="range.is_public ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'">
                            {{ range.is_public ? 'Public' : 'Private' }}
                        </span>
                    </div>
                </td>
                <td class="px-5 py-4 text-right text-sm font-semibold text-slate-600">{{ range.sort_order }}</td>
                <td class="px-5 py-4 text-right">
                    <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100" @click="openPriceRangeModal(range)">
                        <Pencil class="h-4 w-4" stroke-width="2.1" />
                        Edit
                    </button>
                </td>
            </tr>
        </AdminDataTable>

        <AdminDataTable
            v-if="activeTab === 'content'"
            :columns="contentColumns"
            :empty="!landingSections.length"
            empty-title="No content sections"
            empty-body="Create public content sections for landing and details pages."
        >
            <tr v-for="section in landingSections" :key="`${section.section_key}:${section.id}`" class="transition hover:bg-slate-50">
                <td class="px-5 py-4">
                    <p class="text-sm font-black text-slate-950">{{ section.title }}</p>
                    <p class="mt-1 line-clamp-1 text-xs text-slate-500">{{ section.description }}</p>
                </td>
                <td class="px-5 py-4 text-sm font-semibold capitalize text-slate-700">{{ section.section_key.replaceAll('_', ' ') }}</td>
                <td class="px-5 py-4 text-sm font-semibold text-slate-700">{{ section.placement }}</td>
                <td class="px-5 py-4">
                    <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="section.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'">
                        {{ section.is_active ? 'Active' : 'Inactive' }}
                    </span>
                </td>
                <td class="px-5 py-4 text-right text-sm font-semibold text-slate-600">{{ section.sort_order }}</td>
                <td class="px-5 py-4 text-right">
                    <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100" @click="openSectionModal(section)">
                        <Pencil class="h-4 w-4" stroke-width="2.1" />
                        Edit
                    </button>
                </td>
            </tr>
        </AdminDataTable>

        <AdminModal :open="activeModal === 'price_range'" :title="editingPriceRangeId ? 'Update price range' : 'Create price range'" @close="activeModal = null">
            <form class="space-y-5" @submit.prevent="submitPriceRange">
                <div class="grid gap-4 sm:grid-cols-2">
                    <AppTextInput v-model="priceRangeForm.label" label="Label" placeholder="Under NGN 250,000" />
                    <AppTextInput v-model="priceRangeForm.id" label="Key" placeholder="under_250k" />
                    <AppTextInput v-model="priceRangeForm.currency" label="Currency" placeholder="NGN" />
                    <AppTextInput v-model="priceRangeForm.sort_order" label="Sort order" type="number" min="0" />
                    <AppTextInput v-model="priceRangeForm.min_amount" label="Minimum amount" type="number" min="0" />
                    <AppTextInput v-model="priceRangeForm.max_amount" label="Maximum amount" type="number" min="0" />
                    <AppToggleInput v-model="priceRangeForm.is_active" label="Active" />
                    <AppToggleInput v-model="priceRangeForm.is_public" label="Public" />
                </div>
                <button type="submit" class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60" :disabled="priceRangeForm.processing">
                    {{ editingPriceRangeId ? 'Update price range' : 'Create price range' }}
                </button>
            </form>
        </AdminModal>

        <AdminModal :open="activeModal === 'content'" :title="editingSectionId ? 'Update content' : 'Create content'" @close="activeModal = null">
            <form class="space-y-5" @submit.prevent="submitLandingSection">
                <div class="grid gap-4 sm:grid-cols-2">
                    <AppSelectInput v-model="landingSectionForm.section_key" label="Section" :options="sectionTypes" />
                    <AppTextInput v-model="landingSectionForm.placement" label="Placement" placeholder="home" />
                    <AppTextInput v-model="landingSectionForm.sort_order" label="Sort order" type="number" min="0" />
                    <AppTextInput v-model="landingSectionForm.eyebrow" label="Eyebrow" placeholder="Housing" />
                    <AppTextInput v-model="landingSectionForm.title" label="Title" placeholder="Find homes and trusted services" class="sm:col-span-2" />
                    <AppTextInput v-model="landingSectionForm.image_url" class="sm:col-span-2" label="Image URL" placeholder="/images/home.webp" />
                    <AppTextInput v-model="landingSectionForm.action_label" label="Action label" />
                    <AppTextInput v-model="landingSectionForm.action_url" label="Action URL" />
                    <AppTextareaInput v-model="landingSectionForm.description" class="sm:col-span-2" label="Description" />
                    <AppToggleInput v-model="landingSectionForm.is_active" label="Active" />
                </div>
                <button type="submit" class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60" :disabled="landingSectionForm.processing">
                    {{ editingSectionId ? 'Update content' : 'Create content' }}
                </button>
            </form>
        </AdminModal>
    </section>
</template>
