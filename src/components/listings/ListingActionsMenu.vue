<template>
  <div ref="root" class="listing-actions" :class="{ 'listing-actions--overlay': overlay }">
    <button
      type="button"
      class="listing-actions__trigger"
      :aria-label="`More actions for ${item.title}`"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      title="More actions"
      :disabled="busy"
      @click.stop="isOpen = !isOpen"
      @keydown.esc="isOpen = false"
    >
      <IonIcon :icon="ellipsisVerticalOutline" aria-hidden="true" />
    </button>

    <Transition name="listing-menu">
      <div v-if="isOpen" class="listing-actions__menu" role="menu" @click.stop>
        <RouterLink :to="listingViewRoute(item)" role="menuitem" @click="isOpen = false">
          <IonIcon :icon="eyeOutline" aria-hidden="true" />
          View listing
        </RouterLink>
        <RouterLink :to="listingEditRoute(item)" role="menuitem" @click="isOpen = false">
          <IonIcon :icon="createOutline" aria-hidden="true" />
          Edit listing
        </RouterLink>
        <template v-if="item.source === 'listing'">
          <span v-if="statusActions.length" class="listing-actions__divider" aria-hidden="true" />
          <button
            v-for="action in statusActions"
            :key="action.value"
            type="button"
            role="menuitem"
            @click="runAction(action.value)"
          >
            <IonIcon :icon="action.icon" aria-hidden="true" />
            {{ action.label }}
          </button>
          <span class="listing-actions__divider" aria-hidden="true" />
          <button
            type="button"
            class="listing-actions__danger"
            role="menuitem"
            @click="runAction('delete')"
          >
            <IonIcon :icon="trashOutline" aria-hidden="true" />
            Delete listing
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  checkmarkCircleOutline,
  createOutline,
  ellipsisVerticalOutline,
  eyeOutline,
  keyOutline,
  pauseCircleOutline,
  refreshOutline,
  storefrontOutline,
  trashOutline,
} from 'ionicons/icons'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { ListingStatus } from '../../types/listing'
import {
  listingEditRoute,
  listingViewRoute,
  type ManageListingAction,
  type ManageListingItem,
} from './manageListing'

const props = withDefaults(
  defineProps<{
    item: ManageListingItem
    overlay?: boolean
    busy?: boolean
  }>(),
  {
    overlay: false,
    busy: false,
  }
)

const emit = defineEmits<{
  action: [action: ManageListingAction]
}>()

const root = ref<HTMLElement | null>(null)
const isOpen = ref(false)

const statusActions = computed<Array<{ value: ListingStatus; label: string; icon: string }>>(() => {
  const status = props.item.status
  const actions: Array<{ value: ListingStatus; label: string; icon: string }> = []

  if (status === 'active') {
    actions.push({ value: 'paused', label: 'Pause listing', icon: pauseCircleOutline })
  }
  if (status === 'active' || status === 'paused') {
    actions.push(
      { value: 'sold', label: 'Mark as sold', icon: storefrontOutline },
      { value: 'rented', label: 'Mark as rented', icon: keyOutline },
      { value: 'completed', label: 'Mark completed', icon: checkmarkCircleOutline }
    )
  }
  if (['paused', 'sold', 'rented', 'completed', 'rejected', 'expired'].includes(status)) {
    actions.push({ value: 'pending_review', label: 'Repost for review', icon: refreshOutline })
  }

  return actions
})

function runAction(action: ManageListingAction) {
  isOpen.value = false
  emit('action', action)
}

function closeFromOutside(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) isOpen.value = false
}

onMounted(() => document.addEventListener('click', closeFromOutside))
onBeforeUnmount(() => document.removeEventListener('click', closeFromOutside))
</script>

<style scoped>
.listing-actions {
  position: relative;
  z-index: 12;
}

.listing-actions__trigger {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid #dfe6ef;
  border-radius: 10px;
  background: var(--rd-surface);
  color: #40546d;
  cursor: pointer;
  font-size: 18px;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.listing-actions__trigger:hover {
  border-color: #b9c9dd;
  background: #f7f9fc;
  color: var(--rd-brass);
  transform: translateY(-1px);
}

.listing-actions__trigger:focus-visible {
  outline: 3px solid rgba(23, 105, 239, 0.2);
  outline-offset: 2px;
}

.listing-actions__trigger:disabled {
  cursor: wait;
  opacity: 0.55;
}

.listing-actions--overlay .listing-actions__trigger {
  border-color: rgba(255, 255, 255, 0.74);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(10px);
}

.listing-actions__menu {
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  right: 0;
  display: grid;
  width: 190px;
  overflow: hidden;
  border: 1px solid #dde5ef;
  border-radius: 12px;
  background: var(--rd-surface);
  padding: 6px;
  box-shadow: 0 18px 50px -20px rgba(15, 23, 42, 0.38);
}

.listing-actions__menu a,
.listing-actions__menu button {
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 9px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 0 10px;
  color: #263a52;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  text-decoration: none;
}

.listing-actions__menu a:hover,
.listing-actions__menu button:hover {
  background: #f3f6fa;
  color: var(--rd-brass);
}

.listing-actions__menu ion-icon {
  flex: 0 0 auto;
  font-size: 17px;
}

.listing-actions__divider {
  height: 1px;
  margin: 5px 4px;
  background: var(--rd-hairline);
}

.listing-actions__menu .listing-actions__danger {
  color: #d92d4c;
}

.listing-actions__menu .listing-actions__danger:hover {
  background: #fff1f3;
  color: #c01036;
}

.listing-menu-enter-active,
.listing-menu-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
  transform-origin: top right;
}

.listing-menu-enter-from,
.listing-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

:global(.dark) .listing-actions__trigger,
:global(.dark) .listing-actions__menu {
  border-color: #334155;
  background: #172233;
  color: #e5edf7;
}

:global(.dark) .listing-actions__menu a,
:global(.dark) .listing-actions__menu button {
  color: #d8e2ee;
}

:global(.dark) .listing-actions__menu a:hover,
:global(.dark) .listing-actions__menu button:hover {
  background: #223147;
}

@media (prefers-reduced-motion: reduce) {
  .listing-actions__trigger,
  .listing-menu-enter-active,
  .listing-menu-leave-active {
    transition: none;
  }
}
</style>
