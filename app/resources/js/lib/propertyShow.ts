import { collection, listingLocation, listingPrice, money, statusLabel } from '@/lib/domain';
import type { FieldValue, PropertyRecord, ServiceDisplayField } from '@/types/domain';

export interface PropertyDisplayItem {
    label: string;
    value: string;
    icon?: string | null;
}

export function fieldDisplayValue(value?: FieldValue, format = 'text'): string {
    if (!value) return '';

    const rawValue = value.value_string
        || (value.value_number !== null && value.value_number !== undefined ? String(value.value_number) : '')
        || (value.value_boolean !== null && value.value_boolean !== undefined ? (value.value_boolean ? 'Yes' : 'No') : '')
        || value.value_date
        || (value.value_json ? JSON.stringify(value.value_json) : '');

    if (!rawValue) return '';

    if (format === 'currency') {
        return money(rawValue);
    }

    if (format === 'area_sqm') {
        return `${Number(rawValue).toLocaleString('en-NG')} SQM`;
    }

    if (format === 'integer') {
        return Number(rawValue).toLocaleString('en-NG', { maximumFractionDigits: 0 });
    }

    if (format === 'status') {
        return statusLabel(rawValue);
    }

    return rawValue;
}

export function propertyDate(value?: string): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function propertyPublicLocation(property: PropertyRecord): string {
    return listingLocation(property);
}

export function propertyPrice(property: PropertyRecord): string {
    return listingPrice(property);
}

export function propertyTransactionLabel(property: PropertyRecord): string {
    const transactionType = property.sub_category?.transaction_type;

    if (transactionType === 'rent') return 'For rent';
    if (transactionType === 'lease') return 'For lease';
    if (transactionType === 'sale') return 'For sale';

    return statusLabel(transactionType || property.sub_category?.label || property.category?.label || 'Listing');
}

export function configuredDisplayItems(property: PropertyRecord, area: string, limit?: number): PropertyDisplayItem[] {
    const valuesByFieldId = new Map(collection(property.field_values).map((value) => [value.service_field_id, value]));
    const valuesByKey = new Map(collection(property.field_values).map((value) => [value.field_key || value.field?.key || '', value]));

    const items = collection(property.sub_category?.display_fields)
        .filter((displayField) => displayField.is_active && displayField.display_area === area)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((displayField: ServiceDisplayField) => {
            const value = valuesByFieldId.get(displayField.service_field_id) || valuesByKey.get(displayField.field?.key || '');
            const formattedValue = fieldDisplayValue(value, displayField.format || 'text');

            return {
                label: displayField.label || displayField.field?.label || value?.field_key || '',
                value: formattedValue,
                icon: displayField.icon_key,
            };
        })
        .filter((item) => item.label && item.value);

    return typeof limit === 'number' ? items.slice(0, limit) : items;
}
