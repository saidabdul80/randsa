<script setup lang="ts">
defineProps<{
    columns: Array<{ key: string; label: string; align?: 'left' | 'right' | 'center' }>;
    empty?: boolean;
    emptyTitle?: string;
    emptyBody?: string;
}>();
</script>

<template>
    <div class="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_90px_-58px_rgba(15,23,42,0.72)]">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100 text-[13px]">
                <thead class="bg-slate-50/90">
                    <tr>
                        <th
                            v-for="column in columns"
                            :key="column.key"
                            scope="col"
                            class="whitespace-nowrap px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500"
                            :class="{
                                'text-right': column.align === 'right',
                                'text-center': column.align === 'center',
                                'text-left': !column.align || column.align === 'left',
                            }"
                        >
                            {{ column.label }}
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white [&_tr]:transition [&_tr:hover]:bg-emerald-50/25">
                    <slot />
                </tbody>
            </table>
        </div>

        <div v-if="empty" class="px-6 py-14 text-center">
            <p class="text-sm font-black text-slate-950">{{ emptyTitle || 'No records' }}</p>
            <p v-if="emptyBody" class="mt-2 text-sm text-slate-500">{{ emptyBody }}</p>
        </div>
    </div>
</template>
