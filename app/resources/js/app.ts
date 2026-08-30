import { createInertiaApp } from '@inertiajs/vue3';
import type { DefineComponent } from 'vue';
import { createApp, createSSRApp, h } from 'vue';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const pages = import.meta.glob<{ default: DefineComponent }>('./pages/**/*.vue', { eager: true });

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const page = pages[`./pages/${name}.vue`] ?? pages['./pages/NotFoundPage.vue'];

        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }

        return page.default;
    },
    setup({ el, App, props, plugin }) {
        if (!el) {
            return createSSRApp({ render: () => h(App, props) }).use(plugin);
        }

        createApp({ render: () => h(App, props) }).use(plugin).mount(el);
    },
    progress: {
        color: '#4B5563',
    },
});
