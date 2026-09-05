<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm } from '@inertiajs/vue3';
import { X } from '@lucide/vue';
import AppTextInput from './AppTextInput.vue';

const props = defineProps<{
    open: boolean;
    intendedUrl: string;
}>();

const emit = defineEmits<{
    close: [];
    authenticated: [];
}>();

const mode = ref<'login' | 'register'>('login');
const loginForm = useForm({
    email: '',
    password: '',
    remember: true,
    intended_url: '/',
});
const registerForm = useForm({
    first_name: 'Customer',
    last_name: 'User',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    terms_accepted: true,
    intended_url: '/',
});
const activeForm = computed(() =>
    mode.value === 'login' ? loginForm : registerForm,
);
const errors = computed(() =>
    Object.values(activeForm.value.errors).filter(Boolean),
);

watch(
    () => props.intendedUrl,
    (url) => {
        loginForm.intended_url = url || '/';
        registerForm.intended_url = url || '/';
    },
    { immediate: true },
);

function submit(): void {
    if (mode.value === 'login') {
        loginForm.post('/login', {
            preserveScroll: true,
            onSuccess: () => emit('authenticated'),
        });
        return;
    }

    registerForm.password_confirmation = registerForm.password;
    registerForm.post('/register', {
        preserveScroll: true,
        onSuccess: () => emit('authenticated'),
    });
}
</script>

<template>
    <div
        v-if="open"
        class="fixed inset-0 z-[95] grid place-items-center bg-slate-950/54 px-4 py-6 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-label="Save listing access"
        @click.self="emit('close')"
    >
        <form
            class="relative w-full max-w-[480px] rounded-2xl bg-white px-5 py-5 shadow-[0_28px_90px_-32px_rgba(15,23,42,0.75)] sm:px-7"
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
                    class="text-[11px] font-black tracking-[0.2em] text-emerald-700 uppercase"
                >
                    Save listing
                </p>
                <h2
                    class="mt-2 text-2xl leading-8 font-black tracking-normal text-slate-950"
                >
                    Continue to save
                </h2>
            </div>

            <div
                class="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1"
            >
                <button
                    type="button"
                    class="rounded-lg px-4 py-2.5 text-sm font-black transition"
                    :class="
                        mode === 'login'
                            ? 'bg-white text-slate-950 shadow-sm'
                            : 'text-slate-500 hover:text-slate-950'
                    "
                    @click="mode = 'login'"
                >
                    Login
                </button>
                <button
                    type="button"
                    class="rounded-lg px-4 py-2.5 text-sm font-black transition"
                    :class="
                        mode === 'register'
                            ? 'bg-white text-slate-950 shadow-sm'
                            : 'text-slate-500 hover:text-slate-950'
                    "
                    @click="mode = 'register'"
                >
                    Register
                </button>
            </div>

            <div
                v-if="errors.length"
                class="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            >
                <p v-for="error in errors" :key="error">{{ error }}</p>
            </div>

            <div v-if="mode === 'login'" class="mt-5 grid gap-3">
                <AppTextInput
                    v-model="loginForm.email"
                    label="Email"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    compact
                    required
                />
                <AppTextInput
                    v-model="loginForm.password"
                    label="Password"
                    type="password"
                    autocomplete="current-password"
                    placeholder="Your password"
                    compact
                    required
                />
            </div>

            <div v-else class="mt-5 grid gap-3">
                <AppTextInput
                    v-model="registerForm.email"
                    label="Email"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    compact
                    required
                />
                <AppTextInput
                    v-model="registerForm.phone"
                    label="Phone"
                    autocomplete="tel"
                    placeholder="Your phone number"
                    compact
                    required
                />
                <AppTextInput
                    v-model="registerForm.password"
                    label="Password"
                    type="password"
                    autocomplete="new-password"
                    placeholder="Create password"
                    compact
                    required
                />
            </div>

            <button
                type="submit"
                class="mt-5 w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-base font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="activeForm.processing"
            >
                {{
                    activeForm.processing
                        ? 'Continuing...'
                        : mode === 'login'
                          ? 'Login and save'
                          : 'Register and save'
                }}
            </button>
        </form>
    </div>
</template>
