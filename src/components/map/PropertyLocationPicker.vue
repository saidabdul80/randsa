<template>
  <div class="grid gap-4">
    <div
      class="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/60"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Map picker</p>
          <p class="mt-2 text-sm leading-6 text-mist dark:text-slate-300">
            Tap the map or drag the marker to place the listing accurately. OpenStreetMap is the
            current free tile provider, and the tile source can be swapped later if needed.
          </p>
        </div>
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          @click="recenterMap"
        >
          Recenter map
        </button>
      </div>

      <div
        ref="mapElement"
        class="mt-4 h-80 overflow-hidden rounded-[24px]"
        role="application"
        aria-label="Listing location map picker"
      />

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Latitude
          <input
            :value="latitude ?? ''"
            type="number"
            :min="MIN_LATITUDE"
            :max="MAX_LATITUDE"
            step="any"
            :aria-invalid="Boolean(coordinateError)"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
            @input="handleCoordinateInput('latitude', $event)"
          />
        </label>
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Longitude
          <input
            :value="longitude ?? ''"
            type="number"
            :min="MIN_LONGITUDE"
            :max="MAX_LONGITUDE"
            step="any"
            :aria-invalid="Boolean(coordinateError)"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
            @input="handleCoordinateInput('longitude', $event)"
          />
        </label>
      </div>

      <p v-if="coordinateError" class="mt-3 text-sm font-semibold text-red-600" role="alert">
        {{ coordinateError }}
      </p>

      <div
        class="mt-4 rounded-[20px] bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
      >
        <p class="font-semibold">Current location summary</p>
        <p class="mt-2 leading-6">
          {{ locationSummary }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import L from 'leaflet'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

import {
  configureLeafletAssets,
  createOsmTileLayer,
  defaultPickerZoom,
  getMapCenter,
  hasCoordinates,
} from '../../lib/map'
import {
  getCoordinateValidationError,
  MAX_LATITUDE,
  MAX_LONGITUDE,
  MIN_LATITUDE,
  MIN_LONGITUDE,
} from '../../utils/coordinates'

const props = defineProps<{
  latitude: number | null
  longitude: number | null
  address?: string
  area?: string
  city?: string
  state?: string
}>()

const emit = defineEmits<{
  'update:latitude': [value: number | null]
  'update:longitude': [value: number | null]
}>()

const mapElement = ref<HTMLDivElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const marker = shallowRef<L.Marker | null>(null)
let resizeObserver: ResizeObserver | null = null

const coordinateError = computed(() =>
  getCoordinateValidationError(props.latitude, props.longitude)
)

const locationSummary = computed(() => {
  const parts = [props.address, props.area, props.city, props.state]
    .map((part) => part?.trim())
    .filter(Boolean)

  if (parts.length) {
    return parts.join(', ')
  }

  if (hasCoordinates(props.latitude, props.longitude)) {
    const latitude = props.latitude
    const longitude = props.longitude

    return `Lat ${latitude?.toFixed(6)}, Lng ${longitude?.toFixed(6)}`
  }

  return 'No nearby area summary yet. Add address, area, city, or state text to make the picked point easier to identify.'
})

onMounted(() => {
  configureLeafletAssets()

  if (!mapElement.value) {
    return
  }

  map.value = L.map(mapElement.value, {
    zoomControl: true,
    scrollWheelZoom: false,
  }).setView(
    getMapCenter(props.latitude, props.longitude),
    hasCoordinates(props.latitude, props.longitude) ? 15 : defaultPickerZoom
  )

  createOsmTileLayer().addTo(map.value)

  map.value.on('click', (event) => {
    setCoordinates(event.latlng.lat, event.latlng.lng, true)
  })

  syncMarker()
  requestAnimationFrame(() => map.value?.invalidateSize())

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => map.value?.invalidateSize())
    resizeObserver.observe(mapElement.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  map.value?.remove()
  map.value = null
  marker.value = null
})

watch(
  () => [props.latitude, props.longitude] as const,
  () => {
    syncMarker()
  }
)

function recenterMap() {
  map.value?.setView(
    getMapCenter(props.latitude, props.longitude),
    hasCoordinates(props.latitude, props.longitude) ? 15 : defaultPickerZoom
  )
}

function handleCoordinateInput(field: 'latitude' | 'longitude', event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value === '' ? null : Number(target.value)

  if (Number.isNaN(value)) {
    return
  }

  if (field === 'latitude') {
    emit('update:latitude', value)
  } else {
    emit('update:longitude', value)
  }
}

function setCoordinates(latitude: number, longitude: number, recenter = false) {
  emit('update:latitude', Number(latitude.toFixed(6)))
  emit('update:longitude', Number(longitude.toFixed(6)))

  if (recenter) {
    map.value?.setView(
      [latitude, longitude],
      Math.max(map.value?.getZoom() ?? defaultPickerZoom, 15)
    )
  }
}

function syncMarker() {
  if (!map.value || !hasCoordinates(props.latitude, props.longitude)) {
    marker.value?.remove()
    marker.value = null
    return
  }

  const latitude = props.latitude
  const longitude = props.longitude

  if (latitude === null || longitude === null) {
    return
  }

  const latLng = L.latLng(latitude, longitude)

  if (!marker.value) {
    marker.value = L.marker(latLng, { draggable: true }).addTo(map.value)
    marker.value.on('dragend', () => {
      const next = marker.value?.getLatLng()

      if (next) {
        setCoordinates(next.lat, next.lng)
      }
    })
  } else {
    marker.value.setLatLng(latLng)
  }

  if (!map.value.getBounds().pad(-0.3).contains(latLng)) {
    map.value.setView([latitude, longitude], Math.max(map.value.getZoom(), 15))
  }
}
</script>
