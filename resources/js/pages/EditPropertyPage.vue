<script setup lang="ts">
import AppLayout from '@/components/app/AppLayout.vue';
import ListingWorkspace from '@/components/app/ListingWorkspace.vue';
import type { MarketplaceListing, PropertyRecord, ResourceCollection, ServiceCategory, ServiceField } from '@/types/domain';

defineProps<{
    serviceCategories?: ResourceCollection<ServiceCategory>;
    serviceFields?: ResourceCollection<ServiceField>;
    properties?: ResourceCollection<PropertyRecord>;
    marketplaceListings?: ResourceCollection<MarketplaceListing>;
    property?: PropertyRecord | null;
}>();
</script>

<template>
    <AppLayout title="Post listing" eyebrow="Seller workspace">
        <ListingWorkspace
            :service-categories="serviceCategories"
            :service-fields="serviceFields"
            :properties="properties"
            :marketplace-listings="marketplaceListings"
            :property="property"
        />
    </AppLayout>
</template>
