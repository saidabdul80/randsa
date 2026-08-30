<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features' },
    { id: 'location', label: 'Location' },
    { id: 'payment', label: 'Payment' },
    { id: 'similar', label: 'Similar Properties' },
];

const activeTab = ref(tabs[0].id);
const scrollSpyLockedUntil = ref(0);
const stickyTop = 78;
const stickyTabsHeight = 96;
const stickyOffset = stickyTop + stickyTabsHeight;
const activeIndex = computed(() => Math.max(tabs.findIndex((tab) => tab.id === activeTab.value), 0));
const indicatorStyle = computed(() => ({
    width: `${100 / tabs.length}%`,
    left: `${activeIndex.value * (100 / tabs.length)}%`,
}));

function scrollToSection(id: string): void {
    const target = document.getElementById(id);

    if (!target) return;

    activeTab.value = id;
    scrollSpyLockedUntil.value = Date.now() + 900;
    window.history.replaceState(null, '', `#${id}`);

    window.scrollTo({
        top: Math.max(target.getBoundingClientRect().top + window.scrollY - stickyOffset, 0),
        behavior: 'smooth',
    });

    window.setTimeout(() => {
        if (activeTab.value === id) {
            scrollSpyLockedUntil.value = 0;
        }
    }, 950);
}

function updateActiveTab(): void {
    if (Date.now() < scrollSpyLockedUntil.value) {
        return;
    }

    const offset = stickyOffset + 8;
    const positions = tabs
        .map((tab) => {
            const element = document.getElementById(tab.id);

            return element ? { id: tab.id, top: element.getBoundingClientRect().top } : null;
        })
        .filter((item): item is { id: string; top: number } => item !== null);

    const passed = positions.filter((item) => item.top <= offset).at(-1);
    const next = passed || positions.sort((a, b) => Math.abs(a.top - offset) - Math.abs(b.top - offset))[0];

    if (next) {
        activeTab.value = next.id;
    }
}

onMounted(() => {
    if (window.location.hash) {
        activeTab.value = window.location.hash.replace('#', '');
    }

    updateActiveTab();
    window.addEventListener('scroll', updateActiveTab, { passive: true });
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', updateActiveTab);
});
</script>

<template>
    <div class="sticky top-[78px] z-40 -mx-7 mt-10 bg-white/95 px-7 py-2 backdrop-blur">
        <nav class="overflow-x-auto rounded-[14px] border border-slate-200 bg-white shadow-[0_10px_30px_-28px_rgba(15,23,42,0.45)]" aria-label="Property sections">
            <div class="relative flex min-w-[760px] overflow-hidden">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    type="button"
                    class="h-[70px] flex-1 px-6 text-center text-sm font-bold text-slate-700 transition hover:text-emerald-950"
                    :class="activeTab === tab.id ? 'text-emerald-950' : ''"
                    @click="scrollToSection(tab.id)"
                >
                    {{ tab.label }}
                </button>
                <span
                    class="pointer-events-none absolute bottom-[-1px] h-[3px] bg-emerald-900 transition-all duration-300 ease-out"
                    :style="indicatorStyle"
                    aria-hidden="true"
                />
            </div>
        </nav>
    </div>
</template>
