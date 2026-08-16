<template>
  <article class="my-listing-card" :aria-busy="busy">
    <figure class="my-listing-card__media">
      <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" decoding="async" />
      <span v-else class="my-listing-card__placeholder">
        <IonIcon :icon="imagesOutline" aria-hidden="true" />
      </span>
      <span class="my-listing-card__status" :class="`status-${listingStatusTone(item.status)}`">
        {{ listingStatusLabel(item.status) }}
      </span>
      <ListingActionsMenu
        class="my-listing-card__top-menu"
        :item="item"
        :busy="busy"
        overlay
        @action="emit('action', $event)"
      />
      <span v-if="item.mediaCount" class="my-listing-card__media-count">
        <IonIcon :icon="imageOutline" aria-hidden="true" />
        1/{{ item.mediaCount }}
      </span>
    </figure>

    <div class="my-listing-card__body">
      <h2 :title="item.title">{{ item.title }}</h2>
      <strong>{{ item.price }}</strong>

      <div class="my-listing-card__details">
        <span :title="item.category">
          <IonIcon :icon="pricetagOutline" aria-hidden="true" />
          {{ item.category }}
        </span>
        <span :title="item.location || 'Location not added'">
          <IonIcon :icon="locationOutline" aria-hidden="true" />
          {{ item.location || 'Location not added' }}
        </span>
      </div>

      <div class="my-listing-card__activity">
        <span>{{ item.updatedLabel }}</span>
        <span class="my-listing-card__performance" aria-label="Listing engagement">
          <span title="Views"
            ><IonIcon :icon="eyeOutline" aria-hidden="true" />{{ item.views }}</span
          >
          <span title="Saves"
            ><IonIcon :icon="heartOutline" aria-hidden="true" />{{ item.favourites }}</span
          >
        </span>
      </div>
    </div>

    <footer class="my-listing-card__footer">
      <RouterLink :to="listingViewRoute(item)">
        <IonIcon :icon="eyeOutline" aria-hidden="true" />
        View
      </RouterLink>
      <RouterLink :to="listingEditRoute(item)">
        <IonIcon :icon="createOutline" aria-hidden="true" />
        Edit
      </RouterLink>
      <ListingActionsMenu :item="item" :busy="busy" @action="emit('action', $event)" />
    </footer>
  </article>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  createOutline,
  eyeOutline,
  heartOutline,
  imageOutline,
  imagesOutline,
  locationOutline,
  pricetagOutline,
} from 'ionicons/icons'
import { RouterLink } from 'vue-router'
import ListingActionsMenu from './ListingActionsMenu.vue'
import {
  listingEditRoute,
  listingStatusLabel,
  listingStatusTone,
  listingViewRoute,
  type ManageListingAction,
  type ManageListingItem,
} from './manageListing'

withDefaults(
  defineProps<{
    item: ManageListingItem
    busy?: boolean
  }>(),
  {
    busy: false,
  }
)

const emit = defineEmits<{
  action: [action: ManageListingAction]
}>()
</script>

<style scoped>
.my-listing-card {
  position: relative;
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  overflow: visible;
  border: 1px solid #dfe6ef;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 16px 36px -30px rgba(16, 32, 51, 0.6);
  transition:
    border-color 190ms ease,
    box-shadow 190ms ease,
    transform 190ms ease;
}

.my-listing-card:hover {
  border-color: #c9d5e4;
  box-shadow: 0 24px 48px -30px rgba(16, 32, 51, 0.42);
  transform: translateY(-2px);
}

.my-listing-card__media {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 10.5;
  margin: 0;
  border-radius: 15px 15px 0 0;
  background: #eaf0f6;
}

.my-listing-card__media img,
.my-listing-card__placeholder {
  width: 100%;
  height: 100%;
}

.my-listing-card__media img {
  display: block;
  object-fit: cover;
  transition: transform 220ms ease;
}

.my-listing-card:hover .my-listing-card__media img {
  transform: scale(1.015);
}

.my-listing-card__placeholder {
  display: grid;
  place-items: center;
  color: #7d8fa4;
  font-size: 34px;
}

.my-listing-card__status {
  position: absolute;
  z-index: 3;
  top: 14px;
  left: 14px;
  max-width: calc(100% - 76px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.74);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  padding: 6px 10px;
  color: #53657a;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  backdrop-filter: blur(10px);
}

.my-listing-card__status.status-active {
  background: #e9fbf1;
  color: #087443;
}

.my-listing-card__status.status-review {
  background: #fff6df;
  color: #b45d07;
}

.my-listing-card__status.status-paused {
  background: #fff4e8;
  color: #ad5700;
}

.my-listing-card__status.status-completed {
  background: #eaf2ff;
  color: #215fbd;
}

.my-listing-card__status.status-rejected {
  background: #fff0f2;
  color: #c52445;
}

.my-listing-card__top-menu {
  position: absolute;
  top: 11px;
  right: 12px;
}

.my-listing-card__media-count {
  position: absolute;
  z-index: 3;
  right: 13px;
  bottom: 12px;
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 5px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  padding: 0 8px;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  backdrop-filter: blur(7px);
}

.my-listing-card__body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  padding: 18px 18px 15px;
}

.my-listing-card__body h2 {
  display: -webkit-box;
  overflow: hidden;
  min-height: 24px;
  margin: 0;
  color: #102033;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.my-listing-card__body > strong {
  display: block;
  margin-top: 7px;
  color: #079455;
  font-size: 16px;
  font-weight: 850;
  line-height: 1.25;
}

.my-listing-card__details {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 10px;
  margin-top: 17px;
}

.my-listing-card__details > span {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  color: #62758c;
  font-size: 11px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.my-listing-card__details ion-icon {
  flex: 0 0 auto;
  color: #49617d;
  font-size: 16px;
}

.my-listing-card__activity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 17px;
  color: #7a8da3;
  font-size: 11px;
}

.my-listing-card__performance {
  display: flex;
  flex: 0 0 auto;
  gap: 9px;
}

.my-listing-card__performance > span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.my-listing-card__footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 9px;
  border-top: 1px solid #edf1f5;
  padding: 13px 16px 16px;
}

.my-listing-card__footer > a {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #dfe6ef;
  border-radius: 10px;
  color: #36506d;
  font-size: 11px;
  font-weight: 800;
  text-decoration: none;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.my-listing-card__footer > a:hover {
  border-color: #abc3e4;
  background: #f5f8fd;
  color: #1769ef;
}

.my-listing-card__footer > a:focus-visible {
  outline: 3px solid rgba(23, 105, 239, 0.2);
  outline-offset: 2px;
}

:global(.dark) .my-listing-card {
  border-color: #2c3b4d;
  background: #111c2a;
}

:global(.dark) .my-listing-card__body h2 {
  color: #f8fafc;
}

:global(.dark) .my-listing-card__footer,
:global(.dark) .my-listing-card__footer > a {
  border-color: #2c3b4d;
}

:global(.dark) .my-listing-card__footer > a {
  color: #d6e0ec;
}

@media (max-width: 420px) {
  .my-listing-card__body {
    padding-inline: 15px;
  }

  .my-listing-card__details {
    grid-template-columns: 1fr;
    gap: 7px;
    margin-top: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .my-listing-card,
  .my-listing-card__media img {
    transition: none;
  }
}
</style>
