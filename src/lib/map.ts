import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url'
import iconUrl from 'leaflet/dist/images/marker-icon.png?url'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url'

import { hasCoordinates, normalizeLatitude, normalizeLongitude } from '../utils/coordinates'

export { hasCoordinates } from '../utils/coordinates'

export const osmTileProvider = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}

export const defaultMapCenter: [number, number] = [6.5244, 3.3792]
export const defaultPickerZoom = 12
export const defaultPreviewZoom = 14

let leafletIconsConfigured = false

export function configureLeafletAssets() {
  if (leafletIconsConfigured) {
    return
  }

  delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  })

  leafletIconsConfigured = true
}

export function createOsmTileLayer() {
  return L.tileLayer(osmTileProvider.url, {
    attribution: osmTileProvider.attribution,
    maxZoom: 19,
  })
}

export function getMapCenter(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): [number, number] {
  if (!hasCoordinates(latitude, longitude)) {
    return defaultMapCenter
  }

  return [normalizeLatitude(latitude) as number, normalizeLongitude(longitude) as number]
}
