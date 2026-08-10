export const MIN_LATITUDE = -90
export const MAX_LATITUDE = 90
export const MIN_LONGITUDE = -180
export const MAX_LONGITUDE = 180

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' && !value.trim()) return null

  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function hasCoordinateValue(value: unknown) {
  return value !== null && value !== undefined && !(typeof value === 'string' && !value.trim())
}

export function normalizeLatitude(value: unknown): number | null {
  const latitude = toFiniteNumber(value)
  return latitude !== null && latitude >= MIN_LATITUDE && latitude <= MAX_LATITUDE ? latitude : null
}

export function normalizeLongitude(value: unknown): number | null {
  const longitude = toFiniteNumber(value)
  return longitude !== null && longitude >= MIN_LONGITUDE && longitude <= MAX_LONGITUDE
    ? longitude
    : null
}

export function hasCoordinates(latitude: unknown, longitude: unknown): boolean {
  return normalizeLatitude(latitude) !== null && normalizeLongitude(longitude) !== null
}

export function normalizeCoordinates(latitude: unknown, longitude: unknown) {
  if (!hasCoordinates(latitude, longitude)) {
    return { latitude: null, longitude: null }
  }

  return {
    latitude: normalizeLatitude(latitude),
    longitude: normalizeLongitude(longitude),
  }
}

export function getCoordinateValidationError(latitude: unknown, longitude: unknown): string {
  const hasLatitude = hasCoordinateValue(latitude)
  const hasLongitude = hasCoordinateValue(longitude)

  if (!hasLatitude && !hasLongitude) return ''
  if (!hasLatitude || !hasLongitude) return 'Add both latitude and longitude, or leave both empty.'
  if (normalizeLatitude(latitude) === null) return 'Latitude must be between -90 and 90.'
  if (normalizeLongitude(longitude) === null) return 'Longitude must be between -180 and 180.'

  return ''
}
