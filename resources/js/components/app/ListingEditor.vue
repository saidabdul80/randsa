<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm } from '@inertiajs/vue3';
import CategoryConfigurationSummary from '@/components/listing-editor/CategoryConfigurationSummary.vue';
import CategorySelector from '@/components/listing-editor/CategorySelector.vue';
import DynamicDetailsSection from '@/components/listing-editor/DynamicDetailsSection.vue';
import ImageUrlPanel from '@/components/listing-editor/ImageUrlPanel.vue';
import ListingBasicsFields from '@/components/listing-editor/ListingBasicsFields.vue';
import ListingContactFields from '@/components/listing-editor/ListingContactFields.vue';
import ListingLocationFields from '@/components/listing-editor/ListingLocationFields.vue';
import ListingPricingFields from '@/components/listing-editor/ListingPricingFields.vue';
import PublishingRulesPanel from '@/components/listing-editor/PublishingRulesPanel.vue';
import { collection, resource, subCategoriesFor } from '@/lib/domain';
import type {
    FieldValue,
    MarketplaceListing,
    PropertyRecord,
    ResourceCollection,
    ServiceCategory,
    ServiceSubCategory,
} from '@/types/domain';

const props = defineProps<{
    serviceCategories?: ResourceCollection<ServiceCategory>;
    property?: PropertyRecord | null;
    listing?: MarketplaceListing | null;
}>();

const emit = defineEmits<{
    submitted: [];
}>();

const property = computed(() => resource(props.property));
const listing = computed(() => resource(props.listing));
const categories = computed(() => collection(props.serviceCategories));
const selectedCategoryId = ref(property.value?.service_category_id || listing.value?.service_category_id || categories.value[0]?.id || '');
const selectedSubCategoryId = ref(property.value?.service_sub_category_id || listing.value?.service_sub_category_id || '');

const availableSubCategories = computed(() => subCategoriesFor(categories.value, selectedCategoryId.value));
const selectedSubCategory = computed<ServiceSubCategory | undefined>(() =>
    availableSubCategories.value.find((item) => item.id === selectedSubCategoryId.value),
);
const isPropertyFlow = computed(() => selectedSubCategory.value?.default_listing_table === 'properties');
const isEditing = computed(() => Boolean(property.value || listing.value));
const isPriceOptional = computed(() =>
    !isPropertyFlow.value
    && ['artisan', 'professional'].includes(selectedSubCategory.value?.provider_kind || ''),
);
const dynamicValues = ref<FieldValue[]>(collection(property.value?.field_values || listing.value?.field_values));
const existingImages = ref(collection(property.value?.images || listing.value?.images));
const imageFiles = ref<File[]>([]);

const form = useForm({
    service_category_id: selectedCategoryId.value,
    service_sub_category_id: selectedSubCategoryId.value,
    title: property.value?.title || listing.value?.title || '',
    description: property.value?.description || listing.value?.description || '',
    state: property.value?.state || listing.value?.location?.state || '',
    city: property.value?.city || listing.value?.location?.city || '',
    area: property.value?.area || listing.value?.location?.area || '',
    address: property.value?.address || listing.value?.location?.address || '',
    base_price: property.value?.base_price || listing.value?.pricing?.amount || '',
    maximum_amount: listing.value?.pricing?.maximum_amount || '',
    currency: property.value?.currency || listing.value?.pricing?.currency || 'NGN',
    pricing_unit: property.value?.pricing_unit || listing.value?.pricing?.billing_period || '',
    billing_period: listing.value?.pricing?.billing_period || property.value?.pricing_unit || '',
    owner_phone: property.value?.owner_phone || listing.value?.contact?.phone || '',
    contact_name: listing.value?.contact?.name || '',
    contact_phone: listing.value?.contact?.phone || property.value?.owner_phone || '',
    preferred_contact_method: listing.value?.contact?.preferred_method || 'phone',
    whatsapp_enabled: Boolean(listing.value?.contact?.whatsapp_enabled),
    delivery_available: Boolean(listing.value?.delivery?.available),
    pickup_available: listing.value?.delivery?.pickup_available ?? true,
    delivery_details: listing.value?.delivery?.details || '',
    price_type: listing.value?.pricing?.price_type || 'fixed',
    negotiable: Boolean(listing.value?.pricing?.negotiable),
    field_values: dynamicValues.value,
    images: [] as Array<{ url: string; storage_path?: string; alt_text?: string; sort_order: number; is_cover: boolean }>,
    image_files: [] as File[],
    private_data: {
        document_url: '',
        document_type: 'cv',
        storage_path: '',
    },
});

watch(selectedCategoryId, (categoryId) => {
    form.service_category_id = categoryId;

    if (!availableSubCategories.value.some((item) => item.id === selectedSubCategoryId.value)) {
        selectedSubCategoryId.value = availableSubCategories.value[0]?.id || '';
    }
});

watch(selectedSubCategoryId, (subCategoryId) => {
    form.service_sub_category_id = subCategoryId;
});

watch(dynamicValues, (values) => {
    form.field_values = values;
});

function imagePayload() {
    return existingImages.value.map((image, index) => ({
        url: image.url,
        storage_path: image.storage_path || undefined,
        alt_text: image.alt_text || undefined,
        sort_order: index,
        is_cover: index === 0,
    }));
}

function submit() {
    form.images = imagePayload();
    form.image_files = imageFiles.value;
    form.owner_phone = form.contact_phone || form.owner_phone;
    form.billing_period = form.pricing_unit || form.billing_period;

    const options = {
        forceFormData: true,
        onSuccess: () => emit('submitted'),
    };

    if (isPropertyFlow.value) {
        if (property.value) {
            form.transform((data) => ({ ...data, _method: 'patch' })).post(`/properties/${property.value.id}`, options);
            return;
        }

        form.post('/properties', options);
        return;
    }

    if (listing.value) {
        form.transform((data) => ({ ...data, _method: 'patch' })).post(`/listings/${listing.value.id}`, options);
        return;
    }

    form.post('/listings', options);
}
</script>

<template>
    <form class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" @submit.prevent="submit">
        <section class="space-y-5 rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
            <CategorySelector
                v-model:selected-category-id="selectedCategoryId"
                v-model:selected-sub-category-id="selectedSubCategoryId"
                :categories="categories"
                :sub-categories="availableSubCategories"
            />
            <CategoryConfigurationSummary :sub-category="selectedSubCategory" />
            <ListingBasicsFields :form="form" />
            <ListingLocationFields :form="form" />
            <ListingPricingFields :form="form" :is-optional="isPriceOptional" />
            <ListingContactFields :form="form" :is-property="isPropertyFlow" />
            <DynamicDetailsSection
                v-model:values="dynamicValues"
                :fields="collection(selectedSubCategory?.fields)"
            />
        </section>

        <aside class="space-y-5">
            <ImageUrlPanel v-model:existing-images="existingImages" v-model:files="imageFiles" />
            <PublishingRulesPanel
                :sub-category="selectedSubCategory"
                :processing="form.processing"
                :can-submit="Boolean(selectedSubCategoryId)"
                :is-editing="isEditing"
            />
        </aside>
    </form>
</template>
