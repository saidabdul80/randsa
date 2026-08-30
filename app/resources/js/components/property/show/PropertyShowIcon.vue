<script setup lang="ts">
import {
    Armchair,
    BadgeCheck,
    Bath,
    Bed,
    Building2,
    CalendarCheck,
    Check,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    CircleDollarSign,
    ExternalLink,
    FileCheck2,
    Gem,
    Headphones,
    Heart,
    Home,
    House,
    LandPlot,
    Lock,
    MapPin,
    MessageCircle,
    Ruler,
    Search,
    Share2,
    ShieldCheck,
    Store,
    Tag,
    Warehouse,
} from '@lucide/vue';
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        name?: string | null;
        size?: number;
        strokeWidth?: number;
    }>(),
    {
        name: 'circle-check',
        size: 18,
        strokeWidth: 2,
    },
);

const icons = {
    area: Ruler,
    armchair: Armchair,
    available: CalendarCheck,
    bath: Bath,
    bathroom: Bath,
    bathrooms: Bath,
    bed: Bed,
    bedroom: Bed,
    bedrooms: Bed,
    building: Building2,
    calendar: CalendarCheck,
    check: Check,
    'chevron-left': ChevronLeft,
    'chevron-right': ChevronRight,
    'circle-check': CircleCheck,
    clear_access: ExternalLink,
    'clear-access': ExternalLink,
    external: ExternalLink,
    file: FileCheck2,
    furnishing: Armchair,
    gem: Gem,
    headphones: Headphones,
    heart: Heart,
    home: House,
    house: House,
    land: LandPlot,
    lock: Lock,
    location: MapPin,
    map: MapPin,
    'map-pin': MapPin,
    message: MessageCircle,
    naira: CircleDollarSign,
    price: CircleDollarSign,
    ruler: Ruler,
    search: Search,
    secure_area: ShieldCheck,
    'secure-area': ShieldCheck,
    share: Share2,
    shop: Store,
    shield: ShieldCheck,
    status: CalendarCheck,
    store: Store,
    tag: Tag,
    title: FileCheck2,
    title_available: FileCheck2,
    'title-available': FileCheck2,
    verified: BadgeCheck,
    verified_listing: BadgeCheck,
    'verified-listing': BadgeCheck,
    warehouse: Warehouse,
    whatsapp: MessageCircle,
};

const icon = computed(() => icons[(props.name || '').toLowerCase() as keyof typeof icons] || CircleCheck);
</script>

<template>
    <component :is="icon" :size="size" :stroke-width="strokeWidth" />
</template>
