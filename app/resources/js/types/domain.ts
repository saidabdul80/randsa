import type { PageProps } from '@inertiajs/core';

export interface ResourceCollection<T> {
    data: T[];
    links?: {
        first?: string | null;
        last?: string | null;
        prev?: string | null;
        next?: string | null;
    };
    meta?: {
        current_page?: number;
        from?: number | null;
        last_page?: number;
        path?: string;
        per_page?: number;
        to?: number | null;
        total?: number;
    };
}

export type CollectionLike<T> = ResourceCollection<T> | T[];

export interface UserProfile {
    id: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    name: string;
    nin?: string | null;
    nin_verified_at?: string | null;
    bvn?: string | null;
    bvn_verified_at?: string | null;
    email: string;
    email_verified_at?: string | null;
    phone?: string | null;
    phone_verified_at?: string | null;
    location?: string | null;
    bio?: string | null;
    photo_url?: string | null;
    is_verified?: boolean;
    account_status?: string;
    terms_accepted_at?: string | null;
    permissions?: string[];
    roles?: string[];
}

export interface RoleRecord {
    id: number;
    name: string;
    description?: string | null;
    is_system?: boolean;
    permissions: string[];
}

export interface PermissionRecord {
    id: number;
    name: string;
    description?: string | null;
    group?: string | null;
}

export interface ServiceCategory {
    id: string;
    name: string;
    label: string;
    description?: string | null;
    slug: string;
    type: string;
    icon_key?: string | null;
    keywords?: string[] | null;
    sort_order: number;
    is_active: boolean;
    is_public: boolean;
    sub_categories?: CollectionLike<ServiceSubCategory>;
}

export interface ServiceSubCategory {
    id: string;
    service_category_id: string;
    name: string;
    label: string;
    description?: string | null;
    slug: string;
    keywords?: string[] | null;
    type: string;
    transaction_type?: string;
    provider_kind?: string;
    fulfillment_mode?: string;
    default_listing_table?: 'properties' | 'marketplace_listings';
    default_status?: string;
    requires_moderation?: boolean;
    requires_provider_verification?: boolean;
    uses_service_area?: boolean;
    is_bookable?: boolean;
    is_payable?: boolean;
    allows_private_document?: boolean;
    sort_order?: number;
    is_active?: boolean;
    is_public?: boolean;
    fields?: CollectionLike<ServiceSubCategoryField>;
    pricing_fields?: CollectionLike<ServicePricingField>;
    booking_config?: ServiceBookingConfig | null;
    display_fields?: CollectionLike<ServiceDisplayField>;
}

export interface ServiceField {
    id: string;
    key: string;
    label: string;
    management_label?: string | null;
    field_type: string;
    data_type: string;
    placeholder?: string | null;
    help_text?: string | null;
    default_value?: Record<string, string | number | boolean | null> | null;
    validation_rules?: Record<string, string | number | boolean | null> | null;
    is_system?: boolean;
    is_active?: boolean;
    options?: ServiceFieldOption[];
}

export interface ServiceFieldOption {
    id: string;
    value: string;
    label: string;
}

export interface ServiceSubCategoryField {
    id: string;
    service_field_id: string;
    field_group: string;
    section_label?: string | null;
    is_required: boolean;
    sort_order: number;
    field?: ServiceField;
}

export interface ServicePricingField {
    id: string;
    key: string;
    label: string;
    default_amount?: string | number | null;
    currency?: string;
    pricing_unit?: string;
}

export interface ServiceBookingConfig {
    id: string;
    booking_mode: string;
    title: string;
    primary_action_label: string;
    date_label: string;
    start_time_label: string;
    payment_label: string;
    default_duration_minutes: number;
}

export interface ServiceDisplayField {
    id: string;
    service_sub_category_id: string;
    service_field_id: string;
    display_area: string;
    label?: string | null;
    icon_key?: string | null;
    format?: string | null;
    sort_order: number;
    is_active: boolean;
    field?: ServiceField;
}

export interface MediaImage {
    id?: number;
    url: string;
    storage_path?: string | null;
    alt_text?: string | null;
    sort_order?: number;
    is_cover?: boolean;
}

export interface FieldValue {
    id?: number;
    service_field_id: string;
    field_key: string;
    value_string?: string | null;
    value_number?: string | number | null;
    value_boolean?: boolean | null;
    value_date?: string | null;
    value_json?: Record<string, string | number | boolean | null> | Array<string | number | boolean | null> | null;
    field?: ServiceField;
}

export interface PropertyRecord {
    id: number;
    owner_id?: string;
    service_category_id: string;
    service_sub_category_id: string;
    title: string;
    description?: string | null;
    state?: string;
    city?: string;
    area?: string | null;
    address?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    owner_phone?: string | null;
    status: string;
    is_available: boolean;
    is_saved?: boolean;
    base_price?: string | number | null;
    currency?: string;
    pricing_unit?: string | null;
    category?: ServiceCategory | null;
    sub_category?: ServiceSubCategory | null;
    owner?: UserProfile | null;
    field_values?: CollectionLike<FieldValue>;
    images?: CollectionLike<MediaImage>;
    created_at?: string;
    updated_at?: string;
}

export interface MarketplaceListing {
    id: number;
    owner_id?: string;
    service_category_id: string;
    service_sub_category_id: string;
    title: string;
    description: string;
    status: string;
    moderation_status: string;
    is_saved?: boolean;
    location: {
        country?: string | null;
        state: string;
        city: string;
        area?: string | null;
        address?: string | null;
    };
    pricing: {
        currency?: string;
        amount?: string | number | null;
        maximum_amount?: string | number | null;
        price_type?: string;
        billing_period?: string | null;
        negotiable?: boolean;
    };
    contact: {
        name: string;
        phone: string;
        whatsapp_enabled?: boolean;
        preferred_method?: string;
    };
    delivery?: {
        available?: boolean;
        pickup_available?: boolean;
        details?: string | null;
    };
    view_count?: number;
    favourite_count?: number;
    category?: ServiceCategory | null;
    sub_category?: ServiceSubCategory | null;
    owner?: UserProfile | null;
    field_values?: CollectionLike<FieldValue>;
    images?: CollectionLike<MediaImage>;
    created_at?: string;
    updated_at?: string;
}

export interface MarketplaceSearchResult {
    source: 'property' | 'listing';
    item: PropertyRecord | MarketplaceListing;
}

export interface MarketplaceSearchFilters {
    query: string;
    city: string;
    category: string;
    type: string;
    price: string;
    cursor?: string;
    per_page?: number;
}

export interface MarketplaceResultMeta {
    count: number;
    has_more: boolean;
    next_cursor?: string | null;
    per_page: number;
}

export interface ListingPriceRange {
    id: string;
    label: string;
    currency: string;
    min_amount?: string | number | null;
    max_amount?: string | number | null;
    sort_order: number;
    is_active: boolean;
    is_public: boolean;
}

export interface LandingPageSection {
    id?: number;
    section_key: 'hero_slide' | 'workflow_item' | 'property_trust_item';
    placement: string;
    eyebrow?: string | null;
    title: string;
    description?: string | null;
    image_url?: string | null;
    action_label?: string | null;
    action_url?: string | null;
    payload?: Record<string, string | number | boolean | null> | null;
    sort_order: number;
    is_active: boolean;
}

export interface BookingRecord {
    id: number;
    user_id?: string;
    property_id?: number | null;
    marketplace_listing_id?: number | null;
    agent_id?: string | null;
    booking_mode: string;
    inspection_date?: string | null;
    inspection_time?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    estimated_total?: string | number | null;
    status: string;
    payment_status: string;
    property?: PropertyRecord | null;
    marketplace_listing?: MarketplaceListing | null;
    created_at?: string;
}

export interface PaymentRecord {
    id: number;
    property_id?: number | null;
    marketplace_listing_id?: number | null;
    booking_id?: number | null;
    service_pricing_field_id?: string | null;
    agent_id?: string | null;
    item_title: string;
    payer_name?: string;
    payer_email?: string;
    amount: string | number;
    currency: string;
    payment_type: string;
    paystack_reference: string;
    status: string;
    verification_mode?: string;
    gateway?: string;
    verified_at?: string | null;
    booking?: BookingRecord | null;
    created_at?: string;
}

export interface SavedItem {
    id: number;
    item_type: string;
    property?: PropertyRecord | null;
    marketplace_listing?: MarketplaceListing | null;
}

export interface AgentVerificationRecord {
    id: number;
    agent_id: string;
    full_name: string;
    phone: string;
    whatsapp_number: string;
    office_address: string;
    profile_photo?: DocumentPayload | null;
    id_document?: DocumentPayload | null;
    cac_document?: DocumentPayload | null;
    authorization_document?: DocumentPayload | null;
    status: string;
    admin_note?: string | null;
    submitted_at?: string | null;
    reviewed_at?: string | null;
    agent?: UserProfile | null;
}

export interface NotificationRecord {
    id: number;
    user_id: string;
    type: string;
    title: string;
    body: string;
    channel: string;
    property_id?: number | null;
    marketplace_listing_id?: number | null;
    booking_id?: number | null;
    payment_id?: number | null;
    delivered_at?: string | null;
    read_at?: string | null;
    created_at?: string;
}

export interface DocumentPayload {
    url: string;
    type: string;
    storage_path?: string;
}

export interface AppPageProps extends PageProps {
    name?: string;
    auth?: {
        user?: UserProfile | null;
    };
    flash?: {
        status?: string | null;
    };
}

export interface ListingImageInput {
    url: string;
    sort_order: number;
    is_cover: boolean;
}

export interface ListingEditorFormData {
    service_category_id: string;
    service_sub_category_id: string;
    title: string;
    description: string;
    state: string;
    city: string;
    area: string;
    address: string;
    base_price: string | number;
    maximum_amount: string | number;
    currency: string;
    pricing_unit: string;
    billing_period: string;
    owner_phone: string;
    contact_name: string;
    contact_phone: string;
    preferred_contact_method: string;
    whatsapp_enabled: boolean;
    delivery_available: boolean;
    pickup_available: boolean;
    delivery_details: string;
    price_type: string;
    negotiable: boolean;
    field_values: FieldValue[];
    images: ListingImageInput[];
    image_files: File[];
    private_data: {
        document_url: string;
        document_type: string;
        storage_path: string;
    };
}

export type ListingEditorFormState = ListingEditorFormData & {
    errors: Record<string, string | undefined>;
    processing: boolean;
};
