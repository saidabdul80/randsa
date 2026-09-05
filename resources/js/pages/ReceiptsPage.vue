<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm, usePage } from '@inertiajs/vue3';
import { Download, Eye, ReceiptText, X } from '@lucide/vue';
import AppDataTable from '@/components/app/AppDataTable.vue';
import AppDatePicker from '@/components/app/AppDatePicker.vue';
import AppLayout from '@/components/app/AppLayout.vue';
import AppSelectInput from '@/components/app/AppSelectInput.vue';
import AppTextareaInput from '@/components/app/AppTextareaInput.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import AppToggleInput from '@/components/app/AppToggleInput.vue';
import EmptyState from '@/components/app/EmptyState.vue';
import PaginationControls from '@/components/app/PaginationControls.vue';
import StatusBadge from '@/components/app/StatusBadge.vue';
import { collection, listingLocation, money, statusLabel } from '@/lib/domain';
import type {
    AppPageProps,
    BookingRecord,
    MarketplaceListing,
    PropertyRecord,
    ReceiptRecord,
    ResourceCollection,
} from '@/types/domain';

const props = defineProps<{
    properties?: ResourceCollection<PropertyRecord>;
    marketplaceListings?: ResourceCollection<MarketplaceListing>;
    bookings?: ResourceCollection<BookingRecord>;
    receipts?: ResourceCollection<ReceiptRecord>;
}>();

const page = usePage<AppPageProps>();
const user = computed(() => page.props.auth?.user ?? null);
const receiptModalOpen = ref(false);
const receiptPreviewOpen = ref(false);
const selectedReceipt = ref<ReceiptRecord | null>(null);
const activeRecordsTab = ref<'bookings' | 'receipts'>('bookings');
const selectedPostKey = ref('');
const properties = computed(() => collection(props.properties));
const marketplaceListings = computed(() =>
    collection(props.marketplaceListings),
);
const bookings = computed(() => collection(props.bookings));
const receipts = computed(() => collection(props.receipts));
const paginatedBookings = computed(() => props.bookings);
const paginatedReceipts = computed(() => props.receipts);
const postChoices = computed(() => [
    ...properties.value.map((property) => ({
        id: property.id,
        kind: 'property' as const,
        label: `Housing - ${property.title}`,
        value: `property:${property.id}`,
        item: property,
    })),
    ...marketplaceListings.value.map((listing) => ({
        id: listing.id,
        kind: 'listing' as const,
        label: `Service - ${listing.title}`,
        value: `listing:${listing.id}`,
        item: listing,
    })),
]);
const postOptions = computed(() => [
    { label: 'Choose post', value: '' },
    ...postChoices.value.map((post) => ({
        label: post.label,
        value: post.value,
    })),
]);
const selectedPost = computed(
    () =>
        postChoices.value.find(
            (post) => post.value === selectedPostKey.value,
        ) ?? null,
);
const filteredBookings = computed(() => {
    const post = selectedPost.value;

    if (!post) return [];

    return bookings.value.filter((booking) =>
        post.kind === 'property'
            ? booking.property_id === post.id
            : booking.marketplace_listing_id === post.id,
    );
});
const displayBookings = computed(() =>
    selectedPost.value ? filteredBookings.value : bookings.value,
);
const bookingOptions = computed(() => [
    {
        label: filteredBookings.value.length
            ? 'Choose customer booking'
            : 'No booked users for this post',
        value: '',
    },
    ...filteredBookings.value.map((booking) => ({
        label: `${booking.customer_name || booking.customer_email || `Booking #${booking.id}`} - ${bookingTitle(booking)}`,
        value: String(booking.id),
    })),
]);
const selectedBooking = computed(() =>
    bookings.value.find((booking) => String(booking.id) === form.booking_id),
);
const selectedItem = computed(
    () =>
        selectedBooking.value?.property ||
        selectedBooking.value?.marketplace_listing ||
        selectedPost.value?.item ||
        null,
);
const receiptTitle = computed(() =>
    selectedBooking.value
        ? bookingTitle(selectedBooking.value)
        : selectedPost.value?.item.title || 'Receipt title',
);
const receiptAddress = computed(() =>
    selectedItem.value ? listingLocation(selectedItem.value) : 'Post location',
);
const receiptColumns = [
    { key: 'receipt', label: 'Receipt' },
    { key: 'customer', label: 'Customer' },
    { key: 'post', label: 'Post' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'issued', label: 'Issued' },
    { key: 'actions', label: '', align: 'right' as const },
];
const customerColumns = [
    { key: 'customer', label: 'Customer' },
    { key: 'post', label: 'Post' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'payment', label: 'Payment' },
    { key: 'action', label: '' },
];
const paymentMethodOptions = [
    { label: 'Bank transfer', value: 'bank_transfer' },
    { label: 'Cash', value: 'cash' },
    { label: 'POS', value: 'pos' },
    { label: 'Card', value: 'card' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Online', value: 'online' },
    { label: 'Other', value: 'other' },
];
const form = useForm({
    property_id: null as number | null,
    marketplace_listing_id: null as number | null,
    booking_id: '',
    receipt_type: 'rent',
    amount: '',
    currency: 'NGN',
    payment_method: 'bank_transfer',
    payment_reference: '',
    paid_at: new Date().toISOString().slice(0, 10),
    period_start: '',
    period_end: '',
    item_description: '',
    notes: '',
    send_email: true,
});
const errors = computed(() => Object.values(form.errors).filter(Boolean));
const inferredReceiptType = computed(() =>
    selectedPost.value ? statusLabel(form.receipt_type) : 'Select post',
);
const inferredCurrency = computed(() =>
    selectedPost.value ? form.currency || 'NGN' : 'Select post',
);
const recordTabs = computed(() => [
    {
        id: 'bookings' as const,
        label: 'Booked users',
        count: displayBookings.value.length,
    },
    {
        id: 'receipts' as const,
        label: 'Issued receipts',
        count: receipts.value.length,
    },
]);
const activeRecordsTitle = computed(() =>
    activeRecordsTab.value === 'bookings'
        ? 'Customers from your posts'
        : 'Issued receipts',
);
const activeRecordsEyebrow = computed(() =>
    activeRecordsTab.value === 'bookings' ? 'Booked users' : 'Receipt ledger',
);
const activeRecordsCount = computed(() =>
    activeRecordsTab.value === 'bookings'
        ? displayBookings.value.length
        : receipts.value.length,
);

watch(
    postChoices,
    (posts) => {
        if (!selectedPostKey.value && posts[0]) {
            selectedPostKey.value = posts[0].value;
        }
    },
    { immediate: true },
);

watch(
    selectedPost,
    (post) => {
        form.property_id = post?.kind === 'property' ? post.id : null;
        form.marketplace_listing_id = post?.kind === 'listing' ? post.id : null;
        form.receipt_type = receiptTypeForSelectedPost();
        form.item_description = post?.item.title || '';

        if (post?.kind === 'property') {
            form.amount = String(post.item.base_price || '');
            form.currency = post.item.currency || 'NGN';
        } else if (post?.kind === 'listing') {
            form.amount = String(post.item.pricing.amount || '');
            form.currency = post.item.pricing.currency || 'NGN';
        }

        const firstBooking = filteredBookings.value[0];
        form.booking_id = firstBooking ? String(firstBooking.id) : '';
    },
    { immediate: true },
);

watch(
    filteredBookings,
    (items) => {
        if (
            form.booking_id &&
            items.some((booking) => String(booking.id) === form.booking_id)
        ) {
            return;
        }

        form.booking_id = items[0] ? String(items[0].id) : '';
    },
    { immediate: true },
);

watch(selectedBooking, (booking) => {
    if (!booking) return;

    const item = booking.property || booking.marketplace_listing;

    form.receipt_type = receiptTypeForBooking(booking);
    form.amount = String(booking.estimated_total || '');
    form.currency =
        item && 'pricing' in item
            ? item.pricing.currency || 'NGN'
            : item?.currency || 'NGN';
    form.item_description = bookingTitle(booking);

    if (booking.property && !form.period_start) {
        form.period_start = new Date().toISOString().slice(0, 10);
    }
});

function bookingTitle(booking: BookingRecord): string {
    return (
        booking.property?.title ||
        booking.marketplace_listing?.title ||
        `Booking #${booking.id}`
    );
}

function bookingDate(booking: BookingRecord): string {
    return booking.inspection_date
        ? `${formatDate(booking.inspection_date)} ${booking.inspection_time || ''}`
        : booking.start_at
          ? formatDate(booking.start_at)
          : 'Schedule pending';
}

function receiptTypeForSelectedPost(): string {
    const post = selectedPost.value;
    const transactionType = post?.item.sub_category?.transaction_type;

    if (post?.kind === 'property') {
        return transactionType === 'sale' ? 'deposit' : 'rent';
    }

    return transactionType === 'hire' || transactionType === 'booking'
        ? 'service_charge'
        : 'service';
}

function receiptTypeForBooking(booking: BookingRecord): string {
    if (booking.property) {
        return booking.property.sub_category?.transaction_type === 'sale'
            ? 'deposit'
            : 'rent';
    }

    const transactionType =
        booking.marketplace_listing?.sub_category?.transaction_type;

    return transactionType === 'hire' || transactionType === 'booking'
        ? 'service_charge'
        : 'service';
}

function formatDate(value?: string | null): string {
    if (!value) return 'Not set';

    return new Intl.DateTimeFormat('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function receiptAddressFor(receipt: ReceiptRecord): string {
    if (receipt.property_address) return receipt.property_address;
    if (receipt.property) return listingLocation(receipt.property);
    if (receipt.marketplace_listing) {
        return listingLocation(receipt.marketplace_listing);
    }

    return 'Post location not supplied';
}

function receiptPeriodFor(receipt: ReceiptRecord): string {
    if (!receipt.period_start && !receipt.period_end) return 'Not specified';

    return `${formatDate(receipt.period_start)} to ${formatDate(receipt.period_end)}`;
}

function openReceiptPreview(receipt: ReceiptRecord): void {
    selectedReceipt.value = receipt;
    receiptPreviewOpen.value = true;
}

function closeReceiptPreview(): void {
    receiptPreviewOpen.value = false;
    selectedReceipt.value = null;
}

function escapeReceiptHtml(value?: string | number | null): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function receiptHtml(receipt: ReceiptRecord): string {
    const receiptType = statusLabel(receipt.receipt_type);
    const amount = money(receipt.amount, receipt.currency);

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeReceiptHtml(receipt.receipt_number)}</title>
<style>
body{margin:0;background:#f1f5f9;color:#020617;font-family:Inter,Arial,sans-serif}
.page{max-width:760px;margin:32px auto;background:#fff;padding:42px;box-shadow:0 24px 70px rgba(15,23,42,.14)}
.head{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #020617;padding-bottom:18px}
.title{font-size:30px;line-height:1.18;font-weight:900;color:#047857}
.muted{color:#64748b}.caps{font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:900}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:28px}
.block{margin-top:28px}.label{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;font-weight:900}
.value{margin-top:8px;font-weight:900}.amount{margin-top:28px;background:#047857;color:white;padding:20px 24px}
.amount strong{display:block;margin-top:6px;font-size:40px}.line{border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:20px 0;margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:24px}
.note{margin-top:24px;background:#f8fafc;padding:16px;color:#475569;font-weight:700;line-height:1.7}
.sign{margin-top:56px;display:grid;grid-template-columns:1fr 1fr;gap:40px;text-align:center;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#64748b}
.sign div{border-top:1px solid #020617;padding-top:12px}
@media(max-width:640px){.page{margin:0;padding:24px}.head,.line,.grid,.sign{grid-template-columns:1fr;display:grid}.title{font-size:24px}.amount strong{font-size:30px}}
</style>
</head>
<body>
<main class="page">
<header class="head">
<div><div class="title">${escapeReceiptHtml(receipt.item_title)}</div><div class="caps muted">${escapeReceiptHtml(receiptType)}</div></div>
<div style="text-align:right"><div style="font-size:28px;font-weight:900">Receipt</div><div class="muted">${escapeReceiptHtml(receipt.receipt_number)}</div></div>
</header>
<section class="grid">
<div><div class="label">Payment date</div><div class="value">${escapeReceiptHtml(formatDate(receipt.paid_at))}</div></div>
<div><div class="label">Issued</div><div class="value">${escapeReceiptHtml(formatDate(receipt.issued_at))}</div></div>
<div><div class="label">Method</div><div class="value">${escapeReceiptHtml(statusLabel(receipt.payment_method))}</div></div>
</section>
<section class="block"><div class="label">Post location</div><div class="value">${escapeReceiptHtml(receiptAddressFor(receipt))}</div></section>
<section class="line">
<div><div class="label">Received from</div><div class="value">${escapeReceiptHtml(receipt.customer_name)}</div></div>
<div><div class="label">Issued by</div><div class="value">${escapeReceiptHtml(receipt.issuer_name)}</div></div>
</section>
<section class="amount"><div class="caps">Amount received</div><strong>${escapeReceiptHtml(amount)}</strong></section>
<p class="block" style="font-weight:700;line-height:1.75;color:#334155">This acknowledges that the amount above was received from ${escapeReceiptHtml(receipt.customer_name)} as payment for ${escapeReceiptHtml(receipt.item_title)}.</p>
<section class="grid">
<div><div class="label">Period covered</div><div class="value">${escapeReceiptHtml(receiptPeriodFor(receipt))}</div></div>
<div><div class="label">Reference</div><div class="value">${escapeReceiptHtml(receipt.payment_reference || 'Not supplied')}</div></div>
<div><div class="label">Status</div><div class="value">${escapeReceiptHtml(statusLabel(receipt.status))}</div></div>
</section>
${receipt.notes ? `<div class="note">${escapeReceiptHtml(receipt.notes)}</div>` : ''}
<section class="sign"><div>Landlord / provider sign</div><div>Customer sign</div></section>
</main>
</body>
</html>`;
}

function downloadReceipt(receipt: ReceiptRecord): void {
    const blob = new Blob([receiptHtml(receipt)], {
        type: 'text/html;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${receipt.receipt_number}.html`;
    link.click();
    URL.revokeObjectURL(url);
}

function issueReceipt() {
    form.post('/receipts', {
        preserveScroll: true,
        onSuccess: () => {
            receiptModalOpen.value = false;
            form.reset('payment_reference', 'notes');
        },
    });
}

function postKeyForBooking(booking: BookingRecord): string {
    if (booking.property_id) return `property:${booking.property_id}`;
    if (booking.marketplace_listing_id) {
        return `listing:${booking.marketplace_listing_id}`;
    }

    return '';
}

function openReceiptModal(booking?: BookingRecord): void {
    if (booking) {
        const key = postKeyForBooking(booking);

        if (key) selectedPostKey.value = key;

        form.booking_id = String(booking.id);
    }

    receiptModalOpen.value = true;
}
</script>

<template>
    <AppLayout title="Receipts" eyebrow="Seller workspace">
        <template #header>
            <nav
                class="mt-7 -mb-8 flex flex-wrap gap-10"
                aria-label="Receipt sections"
            >
                <button
                    v-for="tab in recordTabs"
                    :key="tab.id"
                    type="button"
                    class="flex items-center gap-2 border-b-2 px-1 pt-2 pb-5 text-sm font-black transition"
                    :class="
                        activeRecordsTab === tab.id
                            ? 'border-emerald-800 text-emerald-900'
                            : 'border-transparent text-slate-500 hover:text-slate-950'
                    "
                    @click="activeRecordsTab = tab.id"
                >
                    <span>{{ tab.label }}</span>
                    <span
                        class="rounded-full px-2 py-0.5 text-[11px]"
                        :class="
                            activeRecordsTab === tab.id
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                        "
                    >
                        {{ tab.count }}
                    </span>
                </button>
            </nav>
        </template>

        <div
            class="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24 sm:px-6 lg:pb-10"
        >
            <div
                v-if="receiptModalOpen"
                class="fixed inset-0 z-[80] grid place-items-center bg-slate-950/54 px-3 py-5 backdrop-blur-[2px] sm:px-5"
                role="dialog"
                aria-modal="true"
                aria-label="Issue receipt"
                @click.self="receiptModalOpen = false"
            >
                <form
                    class="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-[0_28px_90px_-32px_rgba(15,23,42,0.75)]"
                    @submit.prevent="issueReceipt"
                >
                    <button
                        type="button"
                        class="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                        aria-label="Close"
                        @click="receiptModalOpen = false"
                    >
                        <X class="h-6 w-6" stroke-width="2.2" />
                    </button>

                    <div
                        class="grid lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]"
                    >
                        <section class="px-5 py-5 sm:px-7">
                            <div class="pr-10">
                                <p
                                    class="text-[11px] font-black tracking-[0.18em] text-emerald-800 uppercase"
                                >
                                    Issue receipt
                                </p>
                                <h2
                                    class="mt-1 text-2xl font-black tracking-normal text-slate-950"
                                >
                                    Create paid receipt
                                </h2>
                                <p
                                    class="mt-1 text-sm leading-6 text-slate-500"
                                >
                                    Select a post, choose its booked customer,
                                    then email the paid receipt.
                                </p>
                            </div>

                            <div
                                v-if="errors.length"
                                class="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                            >
                                <p v-for="error in errors" :key="error">
                                    {{ error }}
                                </p>
                            </div>

                            <div class="mt-5 grid gap-3">
                                <AppSelectInput
                                    v-model="selectedPostKey"
                                    label="Post"
                                    :options="postOptions"
                                    compact
                                />
                                <AppSelectInput
                                    v-model="form.booking_id"
                                    label="Customer booking"
                                    :options="bookingOptions"
                                    compact
                                />
                                <div class="grid min-w-0 gap-3 sm:grid-cols-2">
                                    <div
                                        class="flex min-h-12 min-w-0 items-center rounded-[10px] bg-slate-50 px-4"
                                    >
                                        <span class="min-w-0 flex-1">
                                            <span
                                                class="block text-[11px] font-semibold text-slate-500 uppercase"
                                            >
                                                Receipt type
                                            </span>
                                            <span
                                                class="mt-0.5 block truncate text-sm font-black text-slate-950"
                                            >
                                                {{ inferredReceiptType }}
                                            </span>
                                        </span>
                                    </div>
                                    <AppTextInput
                                        v-model="form.amount"
                                        label="Amount paid"
                                        type="number"
                                        min="1"
                                        compact
                                    />
                                </div>
                                <div class="grid min-w-0 gap-3 sm:grid-cols-2">
                                    <div
                                        class="flex min-h-12 min-w-0 items-center rounded-[10px] bg-slate-50 px-4"
                                    >
                                        <span class="min-w-0 flex-1">
                                            <span
                                                class="block text-[11px] font-semibold text-slate-500 uppercase"
                                            >
                                                Currency
                                            </span>
                                            <span
                                                class="mt-0.5 block truncate text-sm font-black text-slate-950"
                                            >
                                                {{ inferredCurrency }}
                                            </span>
                                        </span>
                                    </div>
                                    <AppSelectInput
                                        v-model="form.payment_method"
                                        label="Payment method"
                                        :options="paymentMethodOptions"
                                        compact
                                    />
                                </div>
                                <AppTextInput
                                    v-model="form.payment_reference"
                                    label="Payment reference"
                                    placeholder="Transfer, cheque, or POS reference"
                                    compact
                                />
                                <div class="grid min-w-0 gap-3 sm:grid-cols-3">
                                    <AppDatePicker
                                        v-model="form.paid_at"
                                        label="Paid on"
                                        compact
                                    />
                                    <AppDatePicker
                                        v-model="form.period_start"
                                        label="Period start"
                                        compact
                                    />
                                    <AppDatePicker
                                        v-model="form.period_end"
                                        label="Period end"
                                        compact
                                    />
                                </div>
                                <AppTextareaInput
                                    v-model="form.notes"
                                    label="Notes"
                                    :rows="3"
                                    placeholder="Part payment, balance, deposit terms, or handover notes"
                                    compact
                                />
                                <AppToggleInput
                                    v-model="form.send_email"
                                    label="Email receipt to customer"
                                />
                            </div>

                            <button
                                type="submit"
                                class="mt-5 w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                                :disabled="
                                    form.processing ||
                                    !selectedPostKey ||
                                    !form.booking_id
                                "
                            >
                                {{
                                    form.processing
                                        ? 'Issuing...'
                                        : 'Issue paid receipt'
                                }}
                            </button>
                        </section>

                        <section class="bg-slate-100 p-4 sm:p-6 lg:min-h-full">
                            <article
                                class="mx-auto max-w-xl bg-white p-5 text-slate-950 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.95)] ring-1 ring-slate-200 sm:p-7"
                            >
                                <div
                                    class="flex items-start justify-between gap-4 border-b-2 border-slate-950 pb-4"
                                >
                                    <div>
                                        <p
                                            class="line-clamp-2 text-2xl leading-8 font-black tracking-normal text-emerald-800"
                                        >
                                            {{ receiptTitle }}
                                        </p>
                                        <p
                                            class="mt-1 text-xs font-bold tracking-[0.12em] text-slate-500 uppercase"
                                        >
                                            {{ inferredReceiptType }}
                                        </p>
                                    </div>
                                    <div class="text-right">
                                        <p
                                            class="text-2xl font-black tracking-normal"
                                        >
                                            Receipt
                                        </p>
                                        <p
                                            class="mt-1 text-xs font-bold text-slate-500"
                                        >
                                            Draft preview
                                        </p>
                                    </div>
                                </div>

                                <div
                                    class="mt-5 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-3"
                                >
                                    <div>
                                        <p
                                            class="text-[10px] tracking-[0.14em] text-slate-400 uppercase"
                                        >
                                            Receipt no
                                        </p>
                                        <p class="mt-1 text-slate-950">
                                            Generated on issue
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            class="text-[10px] tracking-[0.14em] text-slate-400 uppercase"
                                        >
                                            Payment date
                                        </p>
                                        <p class="mt-1 text-slate-950">
                                            {{ formatDate(form.paid_at) }}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            class="text-[10px] tracking-[0.14em] text-slate-400 uppercase"
                                        >
                                            Method
                                        </p>
                                        <p class="mt-1 text-slate-950">
                                            {{
                                                statusLabel(form.payment_method)
                                            }}
                                        </p>
                                    </div>
                                </div>

                                <div class="mt-6">
                                    <p
                                        class="text-[11px] font-black tracking-[0.16em] text-emerald-800 uppercase"
                                    >
                                        Post location
                                    </p>
                                    <p
                                        class="mt-2 text-base leading-7 font-black text-slate-950"
                                    >
                                        {{ receiptAddress }}
                                    </p>
                                </div>

                                <div
                                    class="mt-6 grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-2"
                                >
                                    <div>
                                        <p
                                            class="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase"
                                        >
                                            Received from
                                        </p>
                                        <p
                                            class="mt-2 text-base font-black text-slate-950"
                                        >
                                            {{
                                                selectedBooking?.customer_name ||
                                                'Customer name'
                                            }}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            class="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase"
                                        >
                                            Issued by
                                        </p>
                                        <p
                                            class="mt-2 text-base font-black text-slate-950"
                                        >
                                            {{ user?.name || 'Post owner' }}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    class="mt-6 bg-emerald-700 px-5 py-4 text-white"
                                >
                                    <p
                                        class="text-[11px] font-black tracking-[0.16em] text-emerald-100 uppercase"
                                    >
                                        Amount received
                                    </p>
                                    <p
                                        class="mt-1 text-4xl font-black tracking-normal"
                                    >
                                        {{
                                            money(
                                                form.amount,
                                                form.currency || 'NGN',
                                            )
                                        }}
                                    </p>
                                </div>

                                <p
                                    class="mt-6 text-sm leading-7 font-semibold text-slate-700"
                                >
                                    This acknowledges that the amount above was
                                    received from
                                    {{
                                        selectedBooking?.customer_name ||
                                        'the customer'
                                    }}
                                    as payment for {{ receiptTitle }}.
                                </p>

                                <div
                                    class="mt-5 grid gap-3 text-sm font-bold sm:grid-cols-2"
                                >
                                    <div>
                                        <p class="text-slate-500">
                                            Period covered
                                        </p>
                                        <p class="mt-1 text-slate-950">
                                            {{ formatDate(form.period_start) }}
                                            to
                                            {{ formatDate(form.period_end) }}
                                        </p>
                                    </div>
                                    <div>
                                        <p class="text-slate-500">Reference</p>
                                        <p
                                            class="mt-1 break-words text-slate-950"
                                        >
                                            {{
                                                form.payment_reference ||
                                                'Not supplied'
                                            }}
                                        </p>
                                    </div>
                                </div>

                                <p
                                    v-if="form.notes"
                                    class="mt-5 bg-slate-50 px-4 py-3 text-sm leading-6 font-semibold text-slate-600"
                                >
                                    {{ form.notes }}
                                </p>

                                <div
                                    class="mt-10 grid gap-8 text-center text-xs font-black tracking-[0.12em] text-slate-500 uppercase sm:grid-cols-2"
                                >
                                    <div class="border-t border-slate-950 pt-3">
                                        Landlord / provider sign
                                    </div>
                                    <div class="border-t border-slate-950 pt-3">
                                        Customer sign
                                    </div>
                                </div>
                            </article>
                        </section>
                    </div>
                </form>
            </div>

            <div
                v-if="receiptPreviewOpen && selectedReceipt"
                class="fixed inset-0 z-[80] grid place-items-center bg-slate-950/54 px-3 py-5 backdrop-blur-[2px] sm:px-5"
                role="dialog"
                aria-modal="true"
                aria-label="Receipt preview"
                @click.self="closeReceiptPreview"
            >
                <div
                    class="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-slate-100 p-4 shadow-[0_28px_90px_-32px_rgba(15,23,42,0.75)] sm:p-6"
                >
                    <button
                        type="button"
                        class="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                        aria-label="Close"
                        @click="closeReceiptPreview"
                    >
                        <X class="h-6 w-6" stroke-width="2.2" />
                    </button>

                    <article
                        class="mx-auto bg-white p-5 text-slate-950 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.95)] ring-1 ring-slate-200 sm:p-8"
                    >
                        <div
                            class="flex flex-col gap-4 border-b-2 border-slate-950 pb-4 sm:flex-row sm:items-start sm:justify-between"
                        >
                            <div class="min-w-0">
                                <p
                                    class="line-clamp-2 text-2xl leading-8 font-black tracking-normal break-words text-emerald-800"
                                >
                                    {{ selectedReceipt.item_title }}
                                </p>
                                <p
                                    class="mt-1 text-xs font-bold tracking-[0.12em] text-slate-500 uppercase"
                                >
                                    {{
                                        statusLabel(
                                            selectedReceipt.receipt_type,
                                        )
                                    }}
                                </p>
                            </div>
                            <div class="shrink-0 sm:text-right">
                                <p class="text-2xl font-black tracking-normal">
                                    Receipt
                                </p>
                                <p
                                    class="mt-1 text-xs font-bold text-slate-500"
                                >
                                    {{ selectedReceipt.receipt_number }}
                                </p>
                            </div>
                        </div>

                        <div
                            class="mt-5 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-3"
                        >
                            <div>
                                <p
                                    class="text-[10px] tracking-[0.14em] text-slate-400 uppercase"
                                >
                                    Payment date
                                </p>
                                <p class="mt-1 text-slate-950">
                                    {{ formatDate(selectedReceipt.paid_at) }}
                                </p>
                            </div>
                            <div>
                                <p
                                    class="text-[10px] tracking-[0.14em] text-slate-400 uppercase"
                                >
                                    Issued
                                </p>
                                <p class="mt-1 text-slate-950">
                                    {{ formatDate(selectedReceipt.issued_at) }}
                                </p>
                            </div>
                            <div>
                                <p
                                    class="text-[10px] tracking-[0.14em] text-slate-400 uppercase"
                                >
                                    Method
                                </p>
                                <p class="mt-1 text-slate-950">
                                    {{
                                        statusLabel(
                                            selectedReceipt.payment_method,
                                        )
                                    }}
                                </p>
                            </div>
                        </div>

                        <div class="mt-6">
                            <p
                                class="text-[11px] font-black tracking-[0.16em] text-emerald-800 uppercase"
                            >
                                Post location
                            </p>
                            <p
                                class="mt-2 text-base leading-7 font-black break-words text-slate-950"
                            >
                                {{ receiptAddressFor(selectedReceipt) }}
                            </p>
                        </div>

                        <div
                            class="mt-6 grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-2"
                        >
                            <div>
                                <p
                                    class="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase"
                                >
                                    Received from
                                </p>
                                <p
                                    class="mt-2 text-base font-black text-slate-950"
                                >
                                    {{ selectedReceipt.customer_name }}
                                </p>
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase"
                                >
                                    Issued by
                                </p>
                                <p
                                    class="mt-2 text-base font-black text-slate-950"
                                >
                                    {{ selectedReceipt.issuer_name }}
                                </p>
                            </div>
                        </div>

                        <div class="mt-6 bg-emerald-700 px-5 py-4 text-white">
                            <p
                                class="text-[11px] font-black tracking-[0.16em] text-emerald-100 uppercase"
                            >
                                Amount received
                            </p>
                            <p class="mt-1 text-3xl font-black tracking-normal">
                                {{
                                    money(
                                        selectedReceipt.amount,
                                        selectedReceipt.currency,
                                    )
                                }}
                            </p>
                        </div>

                        <p
                            class="mt-6 text-sm leading-7 font-semibold text-slate-700"
                        >
                            This acknowledges that the amount above was received
                            from {{ selectedReceipt.customer_name }} as payment
                            for {{ selectedReceipt.item_title }}.
                        </p>

                        <div
                            class="mt-5 grid gap-3 text-sm font-bold sm:grid-cols-2"
                        >
                            <div>
                                <p class="text-slate-500">Period covered</p>
                                <p class="mt-1 text-slate-950">
                                    {{ receiptPeriodFor(selectedReceipt) }}
                                </p>
                            </div>
                            <div>
                                <p class="text-slate-500">Reference</p>
                                <p class="mt-1 break-words text-slate-950">
                                    {{
                                        selectedReceipt.payment_reference ||
                                        'Not supplied'
                                    }}
                                </p>
                            </div>
                        </div>

                        <p
                            v-if="selectedReceipt.notes"
                            class="mt-5 bg-slate-50 px-4 py-3 text-sm leading-6 font-semibold text-slate-600"
                        >
                            {{ selectedReceipt.notes }}
                        </p>

                        <div
                            class="mt-10 grid gap-8 text-center text-xs font-black tracking-[0.12em] text-slate-500 uppercase sm:grid-cols-2"
                        >
                            <div class="border-t border-slate-950 pt-3">
                                Landlord / provider sign
                            </div>
                            <div class="border-t border-slate-950 pt-3">
                                Customer sign
                            </div>
                        </div>
                    </article>

                    <button
                        type="button"
                        class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
                        @click="downloadReceipt(selectedReceipt)"
                    >
                        <Download class="h-4 w-4" stroke-width="2.4" />
                        Download receipt
                    </button>
                </div>
            </div>

            <section
                class="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_90px_-58px_rgba(15,23,42,0.72)]"
            >
                <div class="px-4 pt-4 sm:px-6">
                    <div
                        class="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div>
                            <p
                                class="text-[11px] font-black tracking-[0.18em] text-emerald-800 uppercase"
                            >
                                {{ activeRecordsEyebrow }}
                            </p>
                            <h2
                                class="mt-1 text-2xl font-black tracking-normal text-slate-950"
                            >
                                {{ activeRecordsTitle }}
                            </h2>
                            <p
                                class="mt-1 text-sm font-semibold text-slate-500"
                            >
                                {{ activeRecordsCount }} on this page
                            </p>
                        </div>
                        <button
                            type="button"
                            class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
                            @click="openReceiptModal()"
                        >
                            <ReceiptText class="h-4 w-4" stroke-width="2.4" />
                            Issue receipt
                        </button>
                    </div>
                </div>

                <div v-if="activeRecordsTab === 'bookings'" role="tabpanel">
                    <div v-if="displayBookings.length">
                        <AppDataTable :columns="customerColumns" flush>
                            <tr
                                v-for="booking in displayBookings"
                                :key="booking.id"
                            >
                                <td class="px-5 py-4">
                                    <p
                                        class="text-sm font-black text-slate-950"
                                    >
                                        {{
                                            booking.customer_name ||
                                            booking.customer_email
                                        }}
                                    </p>
                                    <p
                                        class="mt-1 text-xs font-semibold text-slate-500"
                                    >
                                        {{ booking.customer_email }}
                                    </p>
                                </td>
                                <td class="px-5 py-4">
                                    <p
                                        class="line-clamp-1 text-sm font-semibold text-slate-800"
                                    >
                                        {{ bookingTitle(booking) }}
                                    </p>
                                    <p class="mt-1 text-xs text-slate-500">
                                        {{
                                            booking.property
                                                ? 'Housing'
                                                : 'Service'
                                        }}
                                    </p>
                                </td>
                                <td
                                    class="px-5 py-4 text-sm font-semibold text-slate-700"
                                >
                                    {{ bookingDate(booking) }}
                                </td>
                                <td class="px-5 py-4">
                                    <StatusBadge
                                        :status="booking.payment_status"
                                    />
                                </td>
                                <td class="px-5 py-4 text-right">
                                    <button
                                        type="button"
                                        class="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
                                        @click="openReceiptModal(booking)"
                                    >
                                        Issue
                                    </button>
                                </td>
                            </tr>
                        </AppDataTable>
                    </div>
                    <EmptyState
                        v-else
                        :title="
                            selectedPostKey
                                ? 'No booked customers for this post'
                                : 'No booked customers yet'
                        "
                        body="Users who book your posts will appear here for receipt issuance."
                    />
                    <PaginationControls
                        :collection="paginatedBookings"
                        label="Booked users"
                        class="m-4"
                    />
                </div>

                <div v-else role="tabpanel">
                    <div v-if="receipts.length">
                        <AppDataTable :columns="receiptColumns" flush>
                            <tr v-for="receipt in receipts" :key="receipt.id">
                                <td class="px-5 py-4">
                                    <p
                                        class="text-sm font-black text-slate-950"
                                    >
                                        {{ receipt.receipt_number }}
                                    </p>
                                    <p
                                        class="mt-1 text-xs font-semibold text-slate-500"
                                    >
                                        {{ statusLabel(receipt.receipt_type) }}
                                    </p>
                                </td>
                                <td class="px-5 py-4">
                                    <p
                                        class="text-sm font-semibold text-slate-800"
                                    >
                                        {{ receipt.customer_name }}
                                    </p>
                                    <p class="mt-1 text-xs text-slate-500">
                                        {{ receipt.customer_email }}
                                    </p>
                                </td>
                                <td
                                    class="px-5 py-4 text-sm font-semibold text-slate-700"
                                >
                                    {{ receipt.item_title }}
                                </td>
                                <td
                                    class="px-5 py-4 text-sm font-black text-slate-950"
                                >
                                    {{
                                        money(receipt.amount, receipt.currency)
                                    }}
                                </td>
                                <td class="px-5 py-4">
                                    <StatusBadge
                                        :status="
                                            receipt.sent_at
                                                ? 'emailed'
                                                : receipt.status
                                        "
                                    />
                                </td>
                                <td class="px-5 py-4 text-sm text-slate-600">
                                    {{ formatDate(receipt.issued_at) }}
                                </td>
                                <td class="px-5 py-4">
                                    <div
                                        class="flex justify-end gap-2 whitespace-nowrap"
                                    >
                                        <button
                                            type="button"
                                            class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                                            @click="openReceiptPreview(receipt)"
                                        >
                                            <Eye
                                                class="h-3.5 w-3.5"
                                                stroke-width="2.4"
                                            />
                                            Preview
                                        </button>
                                        <button
                                            type="button"
                                            class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
                                            @click="downloadReceipt(receipt)"
                                        >
                                            <Download
                                                class="h-3.5 w-3.5"
                                                stroke-width="2.4"
                                            />
                                            Download
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </AppDataTable>
                    </div>
                    <EmptyState
                        v-else
                        title="No receipts issued yet"
                        body="Create a paid receipt from a booking to start your receipt ledger."
                    />
                    <PaginationControls
                        :collection="paginatedReceipts"
                        label="Receipts"
                        class="m-4"
                    />
                </div>
            </section>
        </div>
    </AppLayout>
</template>
