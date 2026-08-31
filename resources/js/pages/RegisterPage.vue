<script setup lang="ts">
import { Link, useForm } from '@inertiajs/vue3';
import AppLayout from '@/components/app/AppLayout.vue';
import AppTextInput from '@/components/app/AppTextInput.vue';
import AppToggleInput from '@/components/app/AppToggleInput.vue';

const form = useForm({
    first_name: '',
    middle_name: '',
    last_name: '',
    nin: '',
    bvn: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    password_confirmation: '',
    terms_accepted: false,
});

function submit() {
    form.post('/register');
}
</script>

<template>
    <AppLayout title="Create account" eyebrow="Join RANDSA">
        <section class="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <form class="grid gap-4 rounded-[18px] border border-zinc-200 bg-white p-6 shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)] md:grid-cols-2" @submit.prevent="submit">
                <div>
                    <AppTextInput v-model="form.first_name" label="First name" autocomplete="given-name" />
                    <span v-if="form.errors.first_name" class="mt-1 block text-xs text-rose-600">{{ form.errors.first_name }}</span>
                </div>

                <div>
                    <AppTextInput v-model="form.last_name" label="Last name" autocomplete="family-name" />
                    <span v-if="form.errors.last_name" class="mt-1 block text-xs text-rose-600">{{ form.errors.last_name }}</span>
                </div>

                <AppTextInput v-model="form.middle_name" label="Middle name" autocomplete="additional-name" />

                <AppTextInput v-model="form.phone" label="Phone" autocomplete="tel" />

                <div>
                    <AppTextInput v-model="form.email" label="Email" type="email" autocomplete="email" />
                    <span v-if="form.errors.email" class="mt-1 block text-xs text-rose-600">{{ form.errors.email }}</span>
                </div>

                <AppTextInput v-model="form.nin" label="NIN" />

                <AppTextInput v-model="form.bvn" label="BVN" />

                <AppTextInput v-model="form.location" label="Location" autocomplete="address-level2" />

                <div>
                    <AppTextInput v-model="form.password" label="Password" type="password" autocomplete="new-password" />
                    <span v-if="form.errors.password" class="mt-1 block text-xs text-rose-600">{{ form.errors.password }}</span>
                </div>

                <AppTextInput v-model="form.password_confirmation" label="Confirm password" type="password" autocomplete="new-password" />

                <AppToggleInput v-model="form.terms_accepted" label="I accept the account terms." class="md:col-span-2" />

                <button type="submit" class="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2" :disabled="form.processing">
                    {{ form.processing ? 'Creating account...' : 'Create account' }}
                </button>

                <p class="text-center text-sm text-zinc-600 md:col-span-2">
                    Already have an account?
                    <Link href="/login" class="font-medium text-zinc-950 underline">Sign in</Link>
                </p>
            </form>
        </section>
    </AppLayout>
</template>
