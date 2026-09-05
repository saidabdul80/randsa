<script setup lang="ts">
import { X } from '@lucide/vue';
import { useForm } from '@inertiajs/vue3';
import { computed, watch } from 'vue';
import AppTextInput from './AppTextInput.vue';

const props = defineProps<{
    open: boolean;
    intendedUrl: string;
}>();

const emit = defineEmits<{
    close: [];
}>();

const form = useForm({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    intended_url: '/',
});
const errors = computed(() => Object.values(form.errors).filter(Boolean));

watch(
    () => props.intendedUrl,
    (url) => {
        form.intended_url = url || '/';
    },
    { immediate: true },
);

function submit() {
    form.post('/quick-access', {
        preserveScroll: true,
        onSuccess: () => {
            emit('close');
        },
    });
}
</script>

<template>
    <div
        v-if="open"
        class="fixed inset-0 z-[90] grid place-items-center bg-slate-950/54 px-4 py-6 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-label="Continue exploring"
        @click.self="emit('close')"
    >
        <form
            class="relative w-full max-w-[500px] rounded-2xl bg-white px-5 py-5 shadow-[0_28px_90px_-32px_rgba(15,23,42,0.75)] sm:px-7"
            @submit.prevent="submit"
        >
            <button
                type="button"
                class="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="Close"
                @click="emit('close')"
            >
                <X class="h-6 w-6" stroke-width="2.2" />
            </button>

            <div class="pr-10">
                <p
                    class="text-[11px] font-black tracking-[0.2em] text-blue-600 uppercase"
                >
                    Continue exploring
                </p>
                <h2
                    class="mt-2 text-2xl leading-8 font-black tracking-normal text-slate-950"
                >
                    Create your quick access
                </h2>
            </div>

            <div
                v-if="errors.length"
                class="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            >
                <p v-for="error in errors" :key="error">{{ error }}</p>
            </div>

            <div class="mt-5 grid gap-3">
                <AppTextInput
                    v-model="form.customer_name"
                    label="Name"
                    autocomplete="name"
                    placeholder="Your name"
                    compact
                    required
                />
                <AppTextInput
                    v-model="form.customer_email"
                    label="Email"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    compact
                    required
                />
                <AppTextInput
                    v-model="form.customer_phone"
                    label="Phone"
                    autocomplete="tel"
                    placeholder="Your phone number"
                    compact
                    required
                />
            </div>

            <button
                type="submit"
                class="mt-5 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="form.processing"
            >
                {{ form.processing ? 'Continuing...' : 'Continue' }}
            </button>

            <p class="mt-5 text-center text-sm font-semibold text-slate-500">
                Already have an account?
                <a
                    href="/login"
                    class="text-emerald-700 underline-offset-4 hover:underline"
                    >Log in</a
                >
            </p>
        </form>
    </div>
</template>
