<script setup lang="ts">
import { computed } from 'vue';
import { useForm, usePage } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import JsonDocumentFields from '@/components/app/JsonDocumentFields.vue';
import StatusBadge from '@/components/app/StatusBadge.vue';
import { resource } from '@/lib/domain';
import type { AgentVerificationRecord, AppPageProps } from '@/types/domain';

const props = defineProps<{
    verification?: AgentVerificationRecord | { data: AgentVerificationRecord } | null;
}>();

const page = usePage<AppPageProps>();
const user = computed(() => page.props.auth?.user);
const verification = computed(() => resource(props.verification));
const form = useForm({
    full_name: verification.value?.full_name || user.value?.name || '',
    phone: verification.value?.phone || user.value?.phone || '',
    whatsapp_number: verification.value?.whatsapp_number || user.value?.phone || '',
    office_address: verification.value?.office_address || user.value?.location || '',
    profile_photo: verification.value?.profile_photo || { url: user.value?.photo_url || '', type: 'profile_photo' },
    id_document: verification.value?.id_document || { url: '', type: 'id_document' },
    cac_document: verification.value?.cac_document || { url: '', type: 'cac_document' },
    authorization_document: verification.value?.authorization_document || { url: '', type: 'authorization_document' },
});

function submit() {
    form.post('/agent-verifications');
}
</script>

<template>
    <AppLayout title="Professional verification" eyebrow="Artisan and agent trust">
        <div class="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-24 sm:px-6 lg:grid-cols-[1fr_360px] lg:pb-10">
            <form class="space-y-5" @submit.prevent="submit">
                <section class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
                    <h2 class="text-lg font-semibold">Identity details</h2>
                    <div class="mt-5 grid gap-4 sm:grid-cols-2">
                        <AppTextInput v-model="form.full_name" label="Full name" autocomplete="name" />
                        <AppTextInput v-model="form.phone" label="Phone" autocomplete="tel" />
                        <AppTextInput v-model="form.whatsapp_number" label="WhatsApp" autocomplete="tel" />
                        <AppTextInput v-model="form.office_address" label="Office address" autocomplete="street-address" />
                    </div>
                </section>

                <JsonDocumentFields v-model="form.profile_photo" title="Profile photo" required />
                <JsonDocumentFields v-model="form.id_document" title="ID document" required />
                <JsonDocumentFields v-model="form.authorization_document" title="Authorization document" required />
                <JsonDocumentFields v-model="form.cac_document" title="CAC document" />

                <button type="submit" class="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" :disabled="form.processing">
                    {{ form.processing ? 'Submitting...' : 'Submit verification' }}
                </button>
            </form>

            <aside class="rounded-[18px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)]">
                <h2 class="text-base font-semibold">Current status</h2>
                <div class="mt-4">
                    <StatusBadge :status="verification?.status || (user?.is_verified ? 'verified' : 'not_submitted')" />
                </div>
                <p v-if="verification?.admin_note" class="mt-4 text-sm leading-6 text-zinc-600">{{ verification.admin_note }}</p>
                <p v-else class="mt-4 text-sm leading-6 text-zinc-600">Verification supports agents, landlords, artisans, and businesses without hardcoded Firebase-specific profile rules.</p>
            </aside>
        </div>
    </AppLayout>
</template>
