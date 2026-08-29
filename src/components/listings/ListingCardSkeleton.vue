<template>
  <article class="listing-skeleton" aria-hidden="true">
    <div class="listing-skeleton__image rd-skeleton" />
    <div class="listing-skeleton__body">
      <span class="rd-skeleton listing-skeleton__location" />
      <span class="rd-skeleton listing-skeleton__title" />
      <span class="rd-skeleton listing-skeleton__title listing-skeleton__title--short" />
      <div class="listing-skeleton__meta">
        <span class="rd-skeleton" />
        <span class="rd-skeleton" />
      </div>
      <span class="rd-skeleton listing-skeleton__price" />
    </div>
  </article>
</template>

<style scoped>
/*
 * Mirrors MarketplaceListingCard geometry exactly - same 4/3 media, same padding,
 * same line rhythm - so the grid does not shift when real cards replace these.
 */
.listing-skeleton {
  display: flex;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--rd-hairline);
  border-radius: var(--rd-radius);
  background: var(--rd-surface);
}

/* Matches the card: the media takes the leftover height of a fixed mosaic row. */
.listing-skeleton__image {
  min-height: 0;
  flex: 1;
  border-radius: 0;
}

.listing-skeleton__body {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 7px;
  padding: 12px 14px 14px;
}

.listing-skeleton__body span {
  display: block;
  height: 11px;
}

.listing-skeleton__location {
  width: 55%;
  height: 10px;
}

.listing-skeleton__title {
  width: 92%;
  height: 14px;
  margin-top: 2px;
}

.listing-skeleton__title--short {
  width: 64%;
}

.listing-skeleton__meta {
  display: flex;
  gap: 12px;
  margin-top: 2px;
}

.listing-skeleton__meta span {
  width: 46px;
  height: 10px;
}

.listing-skeleton__price {
  width: 58%;
  height: 13px;
  border-top: 1px solid var(--rd-hairline);
  margin-top: 8px;
  padding-top: 9px;
}

@media (max-width: 639px) {
  .listing-skeleton__body {
    padding: 11px 12px 13px;
  }
}
</style>
