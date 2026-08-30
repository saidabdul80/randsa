<script setup lang="ts">
import { computed } from 'vue';
import { useForm, usePage } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
import AppTextareaInput from '@/components/app/AppTextareaInput.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import StatusBadge from '@/components/app/StatusBadge.vue';
import type { AppPageProps } from '@/types/domain';

const page = usePage<AppPageProps>();
const user = computed(() => page.props.auth?.user);
const form = useForm({
    first_name: user.value?.first_name || '',
    middle_name: user.value?.middle_name || '',
    last_name: user.value?.last_name || '',
    nin: user.value?.nin || '',
    bvn: user.value?.bvn || '',
    phone: user.value?.phone || '',
    location: user.value?.location || '',
    bio: user.value?.bio || '',
    photo_url: user.value?.photo_url || '',
});

function submit() {
    form.patch('/profile');
}
</script>

<template>
    <AppLayout title="Account centre" eyebrow="Profile">
        <div class="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-24 sm:px-6 lg:grid-cols-[360px_1fr] lg:pb-10">
            <aside class="rounded-[18px] border border-zinc-200 bg-white p-5 shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
                <div class="aspect-square overflow-hidden rounded-2xl bg-zinc-100">
                    <img v-if="user?.photo_url" :src="user.photo_url" :alt="user.name" class="h-full w-full object-cover" />
                    <div v-else class="grid h-full place-items-center text-4xl font-semibold text-zinc-400">{{ user?.name?.charAt(0) || 'R' }}</div>
                </div>
                <h2 class="mt-4 text-xl font-semibold">{{ user?.name }}</h2>
                <p class="mt-1 text-sm text-zinc-600">{{ user?.email }}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                    <StatusBadge :status="user?.is_verified ? 'verified' : 'not_verified'" />
                    <StatusBadge :status="user?.account_status" />
                </div>
                <a href="/agent-verification" class="mt-5 inline-flex w-full justify-center rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50">
                    Professional verification
                </a>
            </aside>

            <form class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]" @submit.prevent="submit">
                <h2 class="text-lg font-semibold">Profile details</h2>
                <div class="mt-5 grid gap-4 sm:grid-cols-2">
                    <AppTextInput v-model="form.first_name" label="First name" autocomplete="given-name" />
                    <AppTextInput v-model="form.last_name" label="Last name" autocomplete="family-name" />
                    <AppTextInput v-model="form.middle_name" label="Middle name" />
                    <AppTextInput v-model="form.phone" label="Phone" autocomplete="tel" />
                    <AppTextInput v-model="form.nin" label="NIN" />
                    <AppTextInput v-model="form.bvn" label="BVN" />
                    <AppTextInput v-model="form.location" label="Location" class="sm:col-span-2" />
                    <AppTextInput v-model="form.photo_url" label="Photo URL" type="url" class="sm:col-span-2" />
                    <AppTextareaInput v-model="form.bio" label="Bio" :rows="6" class="sm:col-span-2" />
                </div>
                <button type="submit" class="mt-5 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" :disabled="form.processing">
                    {{ form.processing ? 'Saving...' : 'Save profile' }}
                </button>
            </form>
        </div>
    </AppLayout>
</template>
