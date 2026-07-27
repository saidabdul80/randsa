<template>
  <figure
    ref="carouselRoot"
    class="auth-featured-carousel"
    aria-label="Featured RANDSA rentals"
    aria-roledescription="carousel"
    :aria-busy="isLoadingListings"
    @mouseenter="pauseForHover"
    @mouseleave="resumeFromHover"
    @focusin="pauseForFocus"
    @focusout="resumeFromFocus"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <Transition name="auth-featured-fade">
      <article
        :key="currentSlide.key"
        class="auth-featured-slide"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${activeSlide + 1} of ${slides.length}`"
      >
        <img
          :src="currentSlide.image"
          :alt="currentSlide.alt"
          :loading="activeSlide === 0 ? 'eager' : 'lazy'"
          :fetchpriority="activeSlide === 0 ? 'high' : 'auto'"
          decoding="async"
          @error="handleImageError"
        />

        <div class="auth-featured-copy">
          <span class="auth-featured-category">{{ currentSlide.category }}</span>
          <h2>{{ currentSlide.title }}</h2>
          <p>{{ currentSlide.tagline }}</p>

          <div v-if="currentSlide.location || currentSlide.price" class="auth-featured-meta">
            <span v-if="currentSlide.location">
              <IonIcon :icon="locationOutline" aria-hidden="true" />
              {{ currentSlide.location }}
            </span>
            <strong v-if="currentSlide.price">{{ currentSlide.price }}</strong>
          </div>

          <RouterLink
            v-if="currentSlide.route"
            :to="currentSlide.route"
            class="auth-featured-link"
            :aria-label="`View ${currentSlide.title}`"
          >
            View listing
            <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
          </RouterLink>
        </div>
      </article>
    </Transition>

    <div v-if="slides.length > 1" class="auth-featured-dots" aria-label="Choose featured rental">
      <button
        v-for="(slide, index) in slides"
        :key="slide.key"
        type="button"
        :class="{ 'auth-featured-dot--active': activeSlide === index }"
        :aria-label="`Show ${slide.title}`"
        :aria-pressed="activeSlide === index"
        @click="selectSlide(index)"
      />
    </div>

    <div v-if="slides.length > 1" class="auth-featured-controls">
      <button
        type="button"
        aria-label="Previous featured rental"
        title="Previous"
        @click="previousSlide"
      >
        <IonIcon :icon="chevronBackOutline" aria-hidden="true" />
      </button>
      <button type="button" aria-label="Next featured rental" title="Next" @click="nextSlide">
        <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
      </button>
    </div>
  </figure>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  arrowForwardOutline,
  chevronBackOutline,
  chevronForwardOutline,
  locationOutline,
} from 'ionicons/icons'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import carImage from '../../assets/randsa-hero-car.png'
import eventImage from '../../assets/randsa-hero-event.png'
import homeImage from '../../assets/randsa-hero-home.png'
import horseImage from '../../assets/randsa-hero-horses.png'
import {
  listPublicCarouselProperties,
  type PublicCarouselProperty,
} from '../../services/properties'

interface AuthFeaturedSlide {
  key: string
  categoryKey: string
  image: string
  alt: string
  title: string
  category: string
  tagline: string
  location: string
  price: string
  route: string
}

interface RentalCategoryCopy {
  key: string
  label: string
  tagline: string
}

const fallbackSlides: AuthFeaturedSlide[] = [
  {
    key: 'fallback-home',
    categoryKey: 'home',
    image: homeImage,
    alt: 'Modern luxury rental home',
    title: 'Luxury homes',
    category: 'Homes',
    tagline: 'Find your perfect home.',
    location: '',
    price: '',
    route: '',
  },
  {
    key: 'fallback-car',
    categoryKey: 'vehicle',
    image: carImage,
    alt: 'Premium car available for rental',
    title: 'Premium cars',
    category: 'Cars',
    tagline: 'Drive what you need.',
    location: '',
    price: '',
    route: '',
  },
  {
    key: 'fallback-event',
    categoryKey: 'event',
    image: eventImage,
    alt: 'Prepared outdoor event rental space',
    title: 'Event spaces',
    category: 'Event spaces',
    tagline: 'Book unforgettable venues.',
    location: '',
    price: '',
    route: '',
  },
  {
    key: 'fallback-horse',
    categoryKey: 'horse',
    image: horseImage,
    alt: 'Horses available for a rental experience',
    title: 'Horse rentals',
    category: 'Horses',
    tagline: 'Unique rental experiences await.',
    location: '',
    price: '',
    route: '',
  },
]

const slides = ref<AuthFeaturedSlide[]>(fallbackSlides)
const activeSlide = ref(0)
const isLoadingListings = ref(true)
const isHovering = ref(false)
const isFocusWithin = ref(false)
const prefersReducedMotion = ref(false)
const carouselRoot = ref<HTMLElement | null>(null)
const preloadedImages = new Set<string>([fallbackSlides[0].image])
const imagePreloads = new Map<string, Promise<void>>()
const currentSlide = computed(() => slides.value[activeSlide.value] ?? fallbackSlides[0])

let slideTimer: number | null = null
let motionQuery: MediaQueryList | null = null
let touchStartX: number | null = null
let isUnmounted = false

function getRentalCategory(property: PublicCarouselProperty): RentalCategoryCopy {
  const category = String(property.category).toLowerCase()
  const propertyType = String(property.propertyType).toLowerCase()

  if (category === 'vehicle' || propertyType.includes('car') || propertyType.includes('vehicle')) {
    return { key: 'vehicle', label: 'Cars', tagline: 'Drive what you need.' }
  }

  if (category === 'event' || propertyType.includes('event')) {
    return { key: 'event', label: 'Event spaces', tagline: 'Book unforgettable venues.' }
  }

  if (category === 'horse' || propertyType.includes('horse')) {
    return { key: 'horse', label: 'Horses', tagline: 'Unique rental experiences await.' }
  }

  if (propertyType.includes('office')) {
    return { key: 'office', label: 'Offices', tagline: 'Work from the right location.' }
  }

  if (propertyType.includes('shop')) {
    return { key: 'shop', label: 'Shops', tagline: 'Find the right place for your business.' }
  }

  if (category === 'land' || propertyType.includes('land')) {
    return { key: 'land', label: 'Land', tagline: 'Find space for what comes next.' }
  }

  if (
    ['residential', 'house', 'home', 'apartment'].includes(category) ||
    ['house', 'villa', 'apartment', 'self', 'flat', 'duplex', 'bedroom'].some((term) =>
      propertyType.includes(term)
    )
  ) {
    return { key: 'home', label: 'Homes', tagline: 'Find your perfect home.' }
  }

  return { key: 'other', label: 'Rentals', tagline: 'Discover a rental that fits your plans.' }
}

function getPropertyLocation(property: PublicCarouselProperty) {
  const locationParts = [property.area, property.city, property.state]
    .map((part) => part.trim())
    .filter(Boolean)

  return locationParts
    .filter(
      (part, index) =>
        locationParts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) ===
        index
    )
    .join(', ')
}

function formatPropertyPrice(property: PublicCarouselProperty) {
  if (!Number.isFinite(property.rentPrice) || property.rentPrice <= 0) return ''

  const amount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(property.rentPrice)
  const unit = property.paymentDuration.replaceAll('_', ' ')

  return `${amount} / ${unit}`
}

function mapPropertyToSlide(property: PublicCarouselProperty): AuthFeaturedSlide | null {
  const image = property.images.find((candidate) => candidate.trim())?.trim()
  if (!image) return null

  const category = getRentalCategory(property)
  const location = getPropertyLocation(property)

  return {
    key: `listing-${property.id}`,
    categoryKey: category.key,
    image,
    alt: location
      ? `${property.title} ${category.label.toLowerCase()} listing in ${location}`
      : `${property.title} ${category.label.toLowerCase()} listing`,
    title: property.title,
    category: category.label,
    tagline: category.tagline,
    location,
    price: formatPropertyPrice(property),
    route: `/properties/${property.id}`,
  }
}

function selectDiverseLiveSlides(properties: PublicCarouselProperty[]) {
  const candidates = properties
    .map(mapPropertyToSlide)
    .filter((slide): slide is AuthFeaturedSlide => Boolean(slide))
  const selected: AuthFeaturedSlide[] = []
  const selectedKeys = new Set<string>()
  const selectedCategories = new Set<string>()

  for (const slide of candidates) {
    if (selectedCategories.has(slide.categoryKey)) continue
    selected.push(slide)
    selectedKeys.add(slide.key)
    selectedCategories.add(slide.categoryKey)
    if (selected.length === 5) return selected
  }

  for (const slide of candidates) {
    if (selectedKeys.has(slide.key)) continue
    selected.push(slide)
    selectedKeys.add(slide.key)
    if (selected.length === 5) break
  }

  return selected
}

function addResilientFallbacks(liveSlides: AuthFeaturedSlide[]) {
  if (!liveSlides.length) return [...fallbackSlides]

  const combined = [...liveSlides]
  const categories = new Set(combined.map((slide) => slide.categoryKey))

  for (const fallback of fallbackSlides) {
    if (categories.has(fallback.categoryKey)) continue
    if (combined.length >= 4 && categories.size >= 2) break
    if (combined.length >= 6) break
    combined.push(fallback)
    categories.add(fallback.categoryKey)
  }

  return combined.slice(0, 6)
}

async function loadFeaturedListings() {
  try {
    const properties = await listPublicCarouselProperties()
    if (isUnmounted) return

    const liveSlides = selectDiverseLiveSlides(properties)
    slides.value = addResilientFallbacks(liveSlides)
    activeSlide.value = 0
    void preloadSlide(1)
    restartSlideshow()
  } catch (error) {
    console.warn(
      'RANDSA featured listings are unavailable; using local authentication slides.',
      error
    )
  } finally {
    if (!isUnmounted) isLoadingListings.value = false
  }
}

function stopSlideshow() {
  if (slideTimer !== null) {
    window.clearInterval(slideTimer)
    slideTimer = null
  }
}

function canAutoplay() {
  return (
    slides.value.length > 1 &&
    !prefersReducedMotion.value &&
    !isHovering.value &&
    !isFocusWithin.value &&
    !document.hidden
  )
}

function restartSlideshow() {
  stopSlideshow()
  if (!canAutoplay()) return

  slideTimer = window.setInterval(() => {
    void showSlide(activeSlide.value + 1)
  }, 7000)
}

function preloadSlide(index: number) {
  if (slides.value.length < 2) return Promise.resolve()
  const normalizedIndex = (index + slides.value.length) % slides.value.length
  const imageUrl = slides.value[normalizedIndex]?.image
  if (!imageUrl || preloadedImages.has(imageUrl)) return Promise.resolve()

  const pending = imagePreloads.get(imageUrl)
  if (pending) return pending

  const preload = new Promise<void>((resolve) => {
    const image = new Image()
    let settled = false
    const settle = (loaded: boolean) => {
      if (settled) return
      settled = true
      if (loaded) preloadedImages.add(imageUrl)
      imagePreloads.delete(imageUrl)
      resolve()
    }

    const timeout = window.setTimeout(() => settle(false), 4000)
    image.onload = () => {
      window.clearTimeout(timeout)
      settle(true)
    }
    image.onerror = () => {
      window.clearTimeout(timeout)
      settle(false)
    }
    image.src = imageUrl
  })

  imagePreloads.set(imageUrl, preload)
  return preload
}

async function showSlide(index: number) {
  if (slides.value.length < 2) return
  const normalizedIndex = (index + slides.value.length) % slides.value.length
  const targetSlide = slides.value[normalizedIndex]
  if (!targetSlide || targetSlide.key === currentSlide.value.key) return

  await preloadSlide(normalizedIndex)
  if (isUnmounted) return

  const currentTargetIndex = slides.value.findIndex((slide) => slide.key === targetSlide.key)
  if (currentTargetIndex === -1) return

  activeSlide.value = currentTargetIndex
  void preloadSlide(currentTargetIndex + 1)
}

async function selectSlide(index: number) {
  await showSlide(index)
  restartSlideshow()
}

async function previousSlide() {
  await showSlide(activeSlide.value - 1)
  restartSlideshow()
}

async function nextSlide() {
  await showSlide(activeSlide.value + 1)
  restartSlideshow()
}

function pauseForHover() {
  isHovering.value = true
  stopSlideshow()
}

function resumeFromHover() {
  isHovering.value = false
  restartSlideshow()
}

function pauseForFocus() {
  isFocusWithin.value = true
  stopSlideshow()
}

function resumeFromFocus() {
  window.setTimeout(() => {
    if (isUnmounted || carouselRoot.value?.contains(document.activeElement)) return
    isFocusWithin.value = false
    restartSlideshow()
  })
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopSlideshow()
  } else {
    restartSlideshow()
  }
}

function handleMotionPreference() {
  prefersReducedMotion.value = Boolean(motionQuery?.matches)
  restartSlideshow()
}

function handleTouchStart(event: TouchEvent) {
  touchStartX = event.touches[0]?.clientX ?? null
}

function handleTouchEnd(event: TouchEvent) {
  if (touchStartX === null) return
  const touchEndX = event.changedTouches[0]?.clientX
  if (touchEndX === undefined) return

  const distance = touchEndX - touchStartX
  touchStartX = null
  if (Math.abs(distance) < 45) return

  if (distance < 0) {
    void nextSlide()
  } else {
    void previousSlide()
  }
}

function handleImageError(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  if (image.dataset.authFallbackApplied) return

  image.dataset.authFallbackApplied = 'true'
  image.src = fallbackSlides[activeSlide.value % fallbackSlides.length].image
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionPreference)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  void preloadSlide(1)
  restartSlideshow()
  void loadFeaturedListings()
})

onBeforeUnmount(() => {
  isUnmounted = true
  stopSlideshow()
  motionQuery?.removeEventListener('change', handleMotionPreference)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.auth-featured-carousel {
  position: relative;
  width: calc(100% + 84px);
  height: 260px;
  flex: 0 0 260px;
  overflow: hidden;
  margin: auto -42px 0;
  background: #dce9f7;
}

.auth-featured-carousel::after {
  position: absolute;
  z-index: 1;
  inset: 0;
  background: linear-gradient(
    180deg,
    var(--auth-panel) 0%,
    transparent 28%,
    rgba(7, 19, 33, 0.76) 100%
  );
  content: '';
  pointer-events: none;
}

.auth-featured-slide {
  position: absolute;
  inset: 0;
}

.auth-featured-slide > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.01);
  transition: transform 7000ms ease;
}

.auth-featured-copy {
  position: absolute;
  z-index: 2;
  right: 102px;
  bottom: 16px;
  left: 18px;
  color: #ffffff;
}

.auth-featured-category {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.44);
  border-radius: 11px;
  background: rgba(10, 28, 49, 0.48);
  padding: 0 9px;
  font-size: 7px;
  font-weight: 850;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}

.auth-featured-copy h2 {
  overflow: hidden;
  margin: 7px 0 0;
  color: #ffffff;
  font-family: 'Space Grotesk', 'Manrope', sans-serif;
  font-size: 17px;
  font-weight: 850;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-featured-copy > p {
  overflow: hidden;
  margin: 3px 0 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 9px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-featured-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 8px;
}

.auth-featured-meta span {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-featured-meta ion-icon {
  flex: 0 0 auto;
  font-size: 12px;
}

.auth-featured-meta strong {
  flex: 0 0 auto;
  color: #ffffff;
  font-weight: 800;
}

.auth-featured-link {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  gap: 5px;
  margin-top: 7px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 0 9px;
  color: #134f9e;
  font-size: 8px;
  font-weight: 850;
  text-decoration: none;
  transition:
    background-color 190ms ease,
    transform 190ms ease;
}

.auth-featured-link:hover {
  background: #ffffff;
  transform: translateY(-1px);
}

.auth-featured-link ion-icon {
  font-size: 11px;
}

.auth-featured-dots {
  position: absolute;
  z-index: 3;
  top: 17px;
  right: 18px;
  display: flex;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 14px;
  background: rgba(10, 28, 49, 0.42);
  padding: 8px 9px;
  backdrop-filter: blur(10px);
}

.auth-featured-dots button {
  width: 7px;
  height: 7px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.58);
  padding: 0;
  cursor: pointer;
  transition:
    width 190ms ease,
    border-radius 190ms ease,
    background-color 190ms ease;
}

.auth-featured-dots .auth-featured-dot--active {
  width: 20px;
  border-radius: 4px;
  background: #ffffff;
}

.auth-featured-controls {
  position: absolute;
  z-index: 3;
  right: 18px;
  bottom: 17px;
  display: flex;
  gap: 7px;
}

.auth-featured-controls button {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  background: rgba(10, 28, 49, 0.46);
  color: #ffffff;
  font-size: 16px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition:
    background-color 190ms ease,
    transform 190ms ease;
}

.auth-featured-controls button:hover {
  background: rgba(10, 28, 49, 0.72);
  transform: translateY(-1px);
}

.auth-featured-controls button:focus-visible,
.auth-featured-dots button:focus-visible,
.auth-featured-link:focus-visible {
  outline: 3px solid var(--auth-focus);
  outline-offset: 3px;
}

.auth-featured-fade-enter-active,
.auth-featured-fade-leave-active {
  transition: opacity 210ms ease;
}

.auth-featured-fade-enter-from,
.auth-featured-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1120px) and (min-width: 1024px) {
  .auth-featured-carousel {
    width: calc(100% + 60px);
    margin-right: -30px;
    margin-left: -30px;
  }
}

@media (max-width: 1023px) {
  .auth-featured-carousel {
    width: calc(100% + 80px);
    height: 250px;
    flex-basis: 250px;
    margin-right: -40px;
    margin-left: -40px;
  }
}

@media (max-width: 680px) {
  .auth-featured-carousel {
    width: calc(100% + 40px);
    height: 195px;
    flex-basis: 195px;
    margin-right: -20px;
    margin-left: -20px;
  }

  .auth-featured-copy {
    right: 92px;
    bottom: 12px;
    left: 14px;
  }

  .auth-featured-copy h2 {
    font-size: 14px;
  }
  .auth-featured-meta {
    display: grid;
    gap: 2px;
    margin-top: 4px;
  }
  .auth-featured-link {
    margin-top: 5px;
  }
  .auth-featured-dots {
    top: 12px;
    right: 14px;
  }
  .auth-featured-controls {
    right: 14px;
    bottom: 12px;
  }
  .auth-featured-controls button {
    width: 33px;
    height: 33px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-featured-slide > img,
  .auth-featured-link,
  .auth-featured-dots button,
  .auth-featured-controls button,
  .auth-featured-fade-enter-active,
  .auth-featured-fade-leave-active {
    transition: none;
  }
}
</style>
