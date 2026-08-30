<script setup lang="ts">
import AppLayout from '@/components/app/AppLayout.vue';
import ListingWorkspace from '@/components/app/ListingWorkspace.vue';
import type { MarketplaceListing, PropertyRecord, ResourceCollection, ServiceCategory, ServiceField } from '@/types/domain';

defineProps<{
    serviceCategories?: ResourceCollection<ServiceCategory>;
    serviceFields?: ResourceCollection<ServiceField>;
    properties?: ResourceCollection<PropertyRecord>;
    marketplaceListings?: ResourceCollection<MarketplaceListing>;
}>();
</script>

<template>
    <AppLayout title="My listings" eyebrow="Seller workspace">
        <ListingWorkspace
            :service-categories="serviceCategories"
            :service-fields="serviceFields"
            :properties="properties"
            :marketplace-listings="marketplaceListings"
        />
    </AppLayout>
</template>
