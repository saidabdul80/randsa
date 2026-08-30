import type {
    MarketplaceListing,
    PropertyRecord,
    ResourceCollection,
    ServiceCategory,
    ServiceSubCategory,
} from '@/types/domain';

export function collection<T>(value?: ResourceCollection<T> | T[] | null): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : value.data ?? [];
}

export function resource<T extends object>(value?: T | { data: T } | null): T | null {
    if (!value) return null;
    return 'data' in value ? value.data : value;
}

export function money(value?: string | number | null, currency = 'NGN'): string {
    const amount = Number(value ?? 0);

    if (!Number.isFinite(amount) || amount <= 0) {
        return 'Contact for price';
    }

    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function location(parts: Array<string | null | undefined>): string {
    return parts.map((part) => part?.trim()).filter(Boolean).join(', ') || 'Location available on request';
}

export function listingImage(item: PropertyRecord | MarketplaceListing): string {
    const images = collection(item.images);

    return images.find((image) => image.is_cover)?.url || images[0]?.url || '';
}

export function listingPrice(item: PropertyRecord | MarketplaceListing): string {
    if ('pricing' in item) {
        const amount = money(item.pricing.amount, item.pricing.currency || 'NGN');
        const suffix = item.pricing.billing_period && amount !== 'Contact for price' ? ` / ${item.pricing.billing_period}` : '';

        return `${amount}${suffix}`;
    }

    const amount = money(item.base_price, item.currency || 'NGN');
    const suffix = item.pricing_unit && amount !== 'Contact for price' ? ` / ${item.pricing_unit}` : '';

    return `${amount}${suffix}`;
}

export function listingLocation(item: PropertyRecord | MarketplaceListing): string {
    if ('location' in item) {
        return location([item.location.area, item.location.city, item.location.state]);
    }

    return location([item.area, item.city, item.state]);
}

export function statusLabel(value?: string | null): string {
    return (value || 'unknown').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function categoryOptions(categories: ServiceCategory[]): Array<{ label: string; value: string }> {
    return categories.map((category) => ({ label: category.label, value: category.id }));
}

export function subCategoriesFor(categories: ServiceCategory[], categoryId: string): ServiceSubCategory[] {
    return collection(categories.find((category) => category.id === categoryId)?.sub_categories);
}
