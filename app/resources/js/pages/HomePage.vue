<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
import LandingCategoryRail from '@/components/landing/LandingCategoryRail.vue';
import LandingHero from '@/components/landing/LandingHero.vue';
import LandingListingSection from '@/components/landing/LandingListingSection.vue';
import LandingWorkflowBand from '@/components/landing/LandingWorkflowBand.vue';
import { collection } from '@/lib/domain';
import type {
    LandingPageSection,
    ListingPriceRange,
    MarketplaceResultMeta,
    MarketplaceSearchFilters,
    MarketplaceSearchResult,
    ResourceCollection,
    ServiceCategory,
} from '@/types/domain';

const props = defineProps<{
    serviceCategories?: ResourceCollection<ServiceCategory>;
    marketplaceResults?: MarketplaceSearchResult[];
    searchFilters?: MarketplaceSearchFilters;
    resultMeta?: MarketplaceResultMeta;
    landingMetrics?: Array<{ label: string; value: string }>;
    landingHeroSlides?: ResourceCollection<LandingPageSection>;
    landingWorkflowItems?: ResourceCollection<LandingPageSection>;
    priceRanges?: ResourceCollection<ListingPriceRange>;
}>();

const filters = reactive({
    query: props.searchFilters?.query ?? '',
    city: props.searchFilters?.city ?? '',
    category: props.searchFilters?.category ?? '',
    type: props.searchFilters?.type ?? '',
    price: props.searchFilters?.price ?? '',
});

const activeSlideIndex = ref(0);
const displayedResults = ref<MarketplaceSearchResult[]>(props.marketplaceResults ?? []);
const visibleResultMeta = ref<MarketplaceResultMeta>(props.resultMeta ?? { count: 0, has_more: false, next_cursor: null, per_page: 18 });
const isFiltering = ref(false);
const isLoadingMore = ref(false);
const paginationError = ref('');
let carouselTimer: ReturnType<typeof setInterval> | null = null;

const categories = computed(() => collection(props.serviceCategories));
const priceRanges = computed(() => collection(props.priceRanges));
const heroSlides = computed(() =>
    collection(props.landingHeroSlides).map((slide) => ({
        image: slide.image_url || '',
        eyebrow: slide.eyebrow || '',
        title: slide.title,
        description: slide.description || '',
    })),
);
const workflowItems = computed(() => collection(props.landingWorkflowItems));

const typeOptions = computed(() => {
    const options = new Map<string, string>();

    categories.value.forEach((category) => {
        collection(category.sub_categories).forEach((subCategory) => {
            if (subCategory.type) {
                options.set(subCategory.type, subCategory.label);
            }
        });
    });

    return Array.from(options, ([value, label]) => ({ value, label }));
});

const metrics = computed(() => props.landingMetrics ?? []);
const resultMeta = computed(() => visibleResultMeta.value);

const hasFilters = computed(() => Boolean(filters.query || filters.city || filters.category || filters.type || filters.price));

function currentQuery(overrides: Partial<MarketplaceSearchFilters> = {}) {
    return Object.fromEntries(
        Object.entries({
            query: filters.query.trim(),
            city: filters.city.trim(),
            category: filters.category,
            type: filters.type,
            price: filters.price,
            per_page: resultMeta.value.per_page,
            ...overrides,
        }).filter(([, value]) => value !== '' && value !== null && value !== undefined),
    );
}

function scrollToListings() {
    window.requestAnimationFrame(() => {
        document.querySelector('#listings')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    });
}

function fetchResults(overrides: Partial<MarketplaceSearchFilters> = {}, shouldScrollToListings = true) {
    router.get('/', currentQuery(overrides), {
        preserveScroll: true,
        preserveState: false,
        replace: true,
        onStart: () => {
            isFiltering.value = true;
        },
        onSuccess: () => {
            if (shouldScrollToListings) {
                scrollToListings();
            }
        },
        onFinish: () => {
            isFiltering.value = false;
        },
    });
}

function clearFilters() {
    filters.query = '';
    filters.city = '';
    filters.category = '';
    filters.type = '';
    filters.price = '';

    router.get(
        '/',
        { per_page: resultMeta.value.per_page },
        {
            preserveScroll: true,
            preserveState: false,
            replace: true,
            onStart: () => {
                isFiltering.value = true;
            },
            onSuccess: scrollToListings,
            onFinish: () => {
                isFiltering.value = false;
            },
        },
    );
}

function selectCategory(categoryId: string) {
    filters.category = categoryId;
    fetchResults({ category: categoryId, cursor: '' });
}

function selectType(type: string) {
    filters.type = filters.type === type ? '' : type;
    fetchResults({ type: filters.type, cursor: '' });
}

function showSlide(index: number) {
    if (!heroSlides.value.length) return;

    activeSlideIndex.value = (index + heroSlides.value.length) % heroSlides.value.length;
}

function showNextSlide() {
    showSlide(activeSlideIndex.value + 1);
}

function submitSearch() {
    fetchResults({ cursor: '' });
}

async function showNextResults() {
    if (!resultMeta.value.next_cursor || isLoadingMore.value) return;

    isLoadingMore.value = true;
    paginationError.value = '';

    const params = new URLSearchParams();
    Object.entries(currentQuery({ cursor: resultMeta.value.next_cursor })).forEach(([key, value]) => {
        params.set(key, String(value));
    });

    try {
        const response = await fetch(`/marketplace-results?${params.toString()}`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok) {
            throw new Error('Unable to load more marketplace results.');
        }

        const payload = (await response.json()) as {
            data: MarketplaceSearchResult[];
            meta: MarketplaceResultMeta;
        };
        const existingKeys = new Set(displayedResults.value.map((entry) => `${entry.source}:${entry.item.id}`));
        const nextResults = payload.data.filter((entry) => !existingKeys.has(`${entry.source}:${entry.item.id}`));

        displayedResults.value = [...displayedResults.value, ...nextResults];
        visibleResultMeta.value = payload.meta;
    } catch {
        paginationError.value = 'More results could not be loaded. Please try again.';
    } finally {
        isLoadingMore.value = false;
    }
}

onMounted(() => {
    carouselTimer = setInterval(() => {
        showNextSlide();
    }, 6000);
});

onBeforeUnmount(() => {
    if (carouselTimer) {
        clearInterval(carouselTimer);
    }
});
</script>

<template>
    <AppLayout title="Marketplace" bleed transparent-header>
        <LandingHero
            v-model:query="filters.query"
            v-model:city="filters.city"
            v-model:category="filters.category"
            v-model:type="filters.type"
            v-model:price="filters.price"
            :slides="heroSlides"
            :active-index="activeSlideIndex"
            :categories="categories"
            :type-options="typeOptions"
            :price-ranges="priceRanges"
            :metrics="metrics"
            @search="submitSearch"
        />

        <LandingCategoryRail
            :categories="categories"
            :active-category="filters.category"
            :active-type="filters.type"
            @select-category="selectCategory"
            @select-type="selectType"
        />

        <LandingWorkflowBand :items="workflowItems" />

        <LandingListingSection
            :listings="displayedResults"
            :result-count="displayedResults.length"
            :has-more="resultMeta.has_more"
            :has-filters="hasFilters"
            :loading="isFiltering"
            :loading-more="isLoadingMore"
            :error="paginationError"
            @clear="clearFilters"
            @next="showNextResults"
        />
    </AppLayout>
</template>
