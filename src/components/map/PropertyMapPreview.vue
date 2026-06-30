<template>
  <div class="grid gap-4">
    <div
      v-if="hasCoordinates(latitude, longitude)"
      class="overflow-hidden rounded-[24px] border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/60"
    >
      <div ref="mapElement" class="h-72 w-full" />
      <div class="border-t border-slate-200 px-4 py-4 text-xs leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Map data by OpenStreetMap contributors. Keep production tile usage respectful and swap providers later if your traffic grows.
      </div>
    </div>

    <div
      v-else
      class="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm leading-7 text-mist dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
    >
      This listing does not have map coordinates yet, so the location preview cannot be rendered.
    </div>
  </div>
</template>

<script setup lang="ts">
import L from 'leaflet'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

import {
  configureLeafletAssets,
  createOsmTileLayer,
  defaultPreviewZoom,
  hasCoordinates,
} from '../../lib/map'

const props = defineProps<{
  latitude: number | null
  longitude: number | null
  title: string
  priceLabel: string
}>()

const mapElement = ref<HTMLDivElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const marker = shallowRef<L.Marker | null>(null)

onMounted(() => {
  configureLeafletAssets()
  createOrUpdateMap()
})

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
  marker.value = null
})

watch(
  () => [props.latitude, props.longitude, props.title, props.priceLabel] as const,
  () => {
    createOrUpdateMap()
  },
)

function createOrUpdateMap() {
  if (!mapElement.value || !hasCoordinates(props.latitude, props.longitude)) {
    return
  }

  const latitude = props.latitude
  const longitude = props.longitude

  if (latitude === null || longitude === null) {
    return
  }

  const latLng: [number, number] = [latitude, longitude]

  if (!map.value) {
    map.value = L.map(mapElement.value, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: false,
    }).setView(latLng, defaultPreviewZoom)

    createOsmTileLayer().addTo(map.value)
  } else {
    map.value.setView(latLng, defaultPreviewZoom)
  }

  const popupMarkup = `<strong>${props.title}</strong><br />${props.priceLabel}`

  if (!marker.value) {
    marker.value = L.marker(latLng).addTo(map.value)
  } else {
    marker.value.setLatLng(latLng)
  }

  marker.value.bindPopup(popupMarkup).openPopup()
}
</script>
