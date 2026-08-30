<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import {
    CalendarDays,
    Check,
    CreditCard,
    Eye,
    Home,
    Lock,
    Mail,
    MessageSquare,
    ShieldCheck,
} from '@lucide/vue';
import AuthFeatureItem from '@/components/auth/AuthFeatureItem.vue';
import AuthTextInput from '@/components/auth/AuthTextInput.vue';
import GoogleLogo from '@/components/auth/GoogleLogo.vue';
import RandsaAuthLogo from '@/components/auth/RandsaAuthLogo.vue';
import heroHome from '@/assets/randsa-hero-home.webp';

const form = useForm({
    email: '',
    password: '',
    remember: true,
});

const features = [
    {
        icon: Home,
        title: 'Save & manage listings',
        body: 'Post, edit, and manage your properties with ease.',
    },
    {
        icon: CalendarDays,
        title: 'Book inspections',
        body: 'Schedule and track inspections and appointments.',
    },
    {
        icon: CreditCard,
        title: 'Find artisans & services',
        body: 'Discover trusted artisans, book services, and manage payments.',
    },
];
const trustItems = [
    {
        icon: ShieldCheck,
        title: 'Secure account access',
        body: 'Your data is encrypted',
    },
    {
        icon: CalendarDays,
        title: 'Protected bookings',
        body: 'Trusted & verified partners',
    },
    {
        icon: Lock,
        title: 'Private & confidential',
        body: 'We respect your privacy',
    },
];

function submit() {
    form.post('/login');
}
</script>

<template>
    <Head title="Sign in" />

    <main class="h-screen overflow-hidden bg-white text-slate-950">
        <section class="mx-auto grid h-full w-full max-w-[1680px] gap-8 px-5 py-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 lg:px-12 lg:py-7 xl:grid-cols-[minmax(0,1fr)_560px] xl:gap-16">
            <div class="relative hidden h-full min-h-0 lg:block">
                <div
                    class="pointer-events-none absolute -left-[260px] -top-[120px] z-0 h-[980px] w-[980px] overflow-hidden rounded-[40%] bg-[#edf4fb] bg-cover bg-center bg-no-repeat xl:h-[1040px] xl:w-[1040px]"
                    :style="{ backgroundImage: `url(${heroHome})` }"
                    aria-hidden="true"
                >
                    <div class="absolute inset-y-0 left-0 w-[100%] bg-gradient-to-r from-white via-white/82 to-transparent" />
                </div>

                <div class="relative z-10 flex h-full flex-col">
                    <RandsaAuthLogo />

                    <div class="relative z-20 mt-[64px] max-w-[520px] xl:mt-[78px] xl:max-w-[560px]">
                        <p class="flex items-center gap-2 text-[15px] font-bold text-emerald-900 xl:text-[16px]">
                            <span class="h-1.5 w-3 rounded-sm bg-emerald-700" aria-hidden="true" />
                            One account. Everything you need.
                        </p>
                        <h1 class="mt-5 max-w-[500px] font-serif text-[40px] font-black leading-[1.13] tracking-normal text-slate-950 xl:max-w-[540px] xl:text-[46px]">
                            Manage your property, book services, and simplify your life.
                        </h1>
                        <p class="mt-5 max-w-[520px] text-[15px] leading-7 text-slate-600 xl:text-[16px]">
                            From listing your property to booking inspections and finding trusted artisans, do it all in one secure account.
                        </p>
                    </div>

                    <div class="relative z-20 mt-6 max-w-[500px] space-y-3 xl:max-w-[520px]">
                        <AuthFeatureItem
                            v-for="feature in features"
                            :key="feature.title"
                            :icon="feature.icon"
                            :title="feature.title"
                            :body="feature.body"
                        />
                    </div>
<!-- 
                    <div class="relative z-20 mt-auto max-w-[800px] rounded-xl border border-slate-200 bg-white/84 px-4 py-3 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.55)] backdrop-blur">
                        <div class="grid gap-3 md:grid-cols-3">
                            <article v-for="item in trustItems" :key="item.title" class="flex items-center gap-3 border-slate-200 md:border-r md:pr-5 last:md:border-r-0">
                                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-emerald-900">
                                    <component :is="item.icon" class="h-5 w-5" stroke-width="2.1" />
                                </span>
                                <span>
                                    <span class="block text-xs font-black text-slate-950">{{ item.title }}</span>
                                    <span class="mt-0.5 block text-xs text-slate-500">{{ item.body }}</span>
                                </span>
                            </article>
                        </div>
                    </div> -->

                </div>
            </div>

            <div class="flex  items-center justify-center py-0">
                <div class="w-full max-w-[450px]">
                    <div class="mb-8 flex justify-center lg:hidden">
                        <RandsaAuthLogo compact />
                    </div>

                    <form
                        class="rounded-[22px] border border-slate-200 bg-white px-5 py-6 shadow-[0_34px_100px_-58px_rgba(15,23,42,0.82)] sm:px-9 sm:py-8 lg:px-9 lg:py-8 xl:px-11 xl:py-10"
                        @submit.prevent="submit"
                    >
                        <RandsaAuthLogo centered compact />

                        <div class="mt-7 text-center">
                            <h2 class="text-[26px] font-black tracking-normal text-slate-950 xl:text-[28px]">Welcome back</h2>
                            <p class="mt-2 text-sm font-medium text-slate-500 xl:text-[15px]">Sign in to continue to your account</p>
                        </div>

                        <div class="mt-8 space-y-5">
                            <AuthTextInput
                                v-model="form.email"
                                label="Email address"
                                :icon="Mail"
                                type="email"
                                autocomplete="email"
                                placeholder="you@example.com"
                                :error="form.errors.email"
                            />

                            <AuthTextInput
                                v-model="form.password"
                                label="Password"
                                :icon="Lock"
                                type="password"
                                autocomplete="current-password"
                                placeholder="Enter your password"
                                :error="form.errors.password"
                            >
                                <template #suffix>
                                    <Eye class="h-5 w-5 shrink-0 text-slate-600" stroke-width="2.1" />
                                </template>
                            </AuthTextInput>
                        </div>

                        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <button type="button" class="inline-flex items-center gap-3 text-sm font-semibold text-slate-600" @click="form.remember = !form.remember">
                                <span
                                    class="grid h-6 w-6 place-items-center rounded-md border transition"
                                    :class="form.remember ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-300 bg-white text-transparent'"
                                >
                                    <Check class="h-4 w-4" stroke-width="3" />
                                </span>
                                Remember me
                            </button>
                            <button type="button" class="text-sm font-bold text-emerald-900">
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            class="mt-5 h-12 w-full rounded-[10px] bg-emerald-800 px-4 text-sm font-black text-white shadow-[0_18px_40px_-26px_rgba(6,95,70,0.95)] transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="form.processing"
                        >
                            {{ form.processing ? 'Signing in...' : 'Sign in' }}
                        </button>

                        <div class="my-4 flex items-center gap-4 text-sm font-semibold text-slate-500">
                            <span class="h-px flex-1 bg-slate-200" />
                            or
                            <span class="h-px flex-1 bg-slate-200" />
                        </div>

                        <Link href="/auth/google/redirect" class="flex h-12 w-full items-center justify-center gap-3 rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50">
                            <GoogleLogo class="h-5 w-5 shrink-0" />
                            Continue with Google
                        </Link>

                        <button type="button" class="mt-3 flex w-full items-center gap-4 rounded-[10px] bg-emerald-50/80 px-5 py-3 text-left text-emerald-900 ring-1 ring-emerald-50 transition hover:bg-emerald-50">
                            <MessageSquare class="h-5 w-5 shrink-0" stroke-width="2.1" />
                            <span>
                                <span class="block text-sm font-black">Use a one-time code</span>
                                <span class="mt-0.5 block text-sm text-slate-600">We’ll send a sign-in code to your email</span>
                            </span>
                        </button>

                        <p class="mt-6 text-center text-sm font-medium text-slate-600">
                            Don’t have an account?
                            <Link href="/register" class="font-black text-emerald-900">Create account</Link>
                        </p>
                    </form>

                    <p class="mt-4 flex items-center justify-center gap-2 px-3 text-center text-xs leading-5 text-slate-500 xl:text-sm">
                        <Lock class="h-4 w-4 shrink-0" stroke-width="2.1" />
                        <span>
                            By signing in, you agree to our
                            <Link href="/" class="font-bold text-emerald-900">Terms of Service</Link>
                            and
                            <Link href="/" class="font-bold text-emerald-900">Privacy Policy</Link>.
                        </span>
                    </p>
                </div>
            </div>
        </section>
    </main>
</template>
