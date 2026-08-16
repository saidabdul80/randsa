<template>
  <article class="listing-skeleton" aria-hidden="true">
    <div class="listing-skeleton__image shimmer" />
    <div class="listing-skeleton__body">
      <span class="shimmer listing-skeleton__title" />
      <span class="shimmer listing-skeleton__price" />
      <div><span class="shimmer" /><span class="shimmer" /></div>
      <span class="shimmer listing-skeleton__updated" />
    </div>
    <footer><span class="shimmer" /><span class="shimmer" /><span class="shimmer" /></footer>
  </article>
</template>

<style scoped>
.listing-skeleton {
  overflow: hidden;
  border: 1px solid #e1e7ef;
  border-radius: 16px;
  background: #fff;
}

.listing-skeleton__image {
  aspect-ratio: 16 / 10.5;
}

.listing-skeleton__body {
  display: grid;
  gap: 11px;
  padding: 18px;
}

.listing-skeleton__body > span,
.listing-skeleton__body div span,
.listing-skeleton footer span {
  display: block;
  height: 11px;
  border-radius: 999px;
}

.listing-skeleton__title {
  width: 72%;
  height: 17px !important;
}

.listing-skeleton__price {
  width: 45%;
  height: 14px !important;
}

.listing-skeleton__body div {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 16px;
  margin-top: 8px;
}

.listing-skeleton__updated {
  width: 38%;
  margin-top: 8px;
}

.listing-skeleton footer {
  display: grid;
  grid-template-columns: 1fr 1fr 38px;
  gap: 9px;
  border-top: 1px solid #edf1f5;
  padding: 14px 16px 16px;
}

.listing-skeleton footer span {
  height: 38px;
  border-radius: 10px;
}

.shimmer {
  background: linear-gradient(90deg, #edf1f5 25%, #f7f9fb 42%, #edf1f5 60%);
  background-size: 220% 100%;
  animation: listing-shimmer 1.4s ease-in-out infinite;
}

@keyframes listing-shimmer {
  to {
    background-position-x: -220%;
  }
}

:global(.dark) .listing-skeleton {
  border-color: #2c3b4d;
  background: #111c2a;
}

:global(.dark) .shimmer {
  background: linear-gradient(90deg, #1b293a 25%, #26364a 42%, #1b293a 60%);
  background-size: 220% 100%;
}

@media (prefers-reduced-motion: reduce) {
  .shimmer {
    animation: none;
  }
}
</style>
