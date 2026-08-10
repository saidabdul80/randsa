import type { MarketplaceSaveSource } from '../types/marketplace'

export function normalizeSavedSource(value: unknown): MarketplaceSaveSource {
  return value === 'listing' ? 'listing' : 'property'
}

export function savedItemKey(itemId: string, source: MarketplaceSaveSource) {
  return `${source}:${itemId}`
}

export function savedRecordId(userId: string, itemId: string, source: MarketplaceSaveSource) {
  return `${encodeURIComponent(userId)}--${source}--${encodeURIComponent(itemId)}`
}
