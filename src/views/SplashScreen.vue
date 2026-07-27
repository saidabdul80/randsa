<template>
  <IonPage class="welcome-page">
    <IonContent :fullscreen="true" class="welcome-content">
      <main class="welcome-main">
        <section class="welcome-hero" aria-labelledby="welcome-title">
          <div class="welcome-copy">
            <div class="brand-lockup" aria-label="RANDSA">
              <span class="brand-mark" aria-hidden="true">
                <IonIcon :icon="homeOutline" />
              </span>
              <span>RANDSA</span>
            </div>

            <p class="welcome-badge">Welcome to RANDSA</p>

            <h1 id="welcome-title" class="welcome-title">
              Find better spaces with <span>RANDSA</span>
            </h1>
            <p class="welcome-description">
              Explore houses, cars, offices, shops, event spaces, horses, and more through one
              trusted rental marketplace.
            </p>

            <ul class="category-list" aria-label="Rental categories">
              <li v-for="category in categories" :key="category.label" class="category-item">
                <span class="category-icon" aria-hidden="true">
                  <IonIcon :icon="category.icon" />
                </span>
                <span>{{ category.label }}</span>
              </li>
            </ul>

            <div id="welcome-actions" class="welcome-actions">
              <RouterLink to="/onboarding" class="continue-button">
                <span>Continue</span>
                <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
              </RouterLink>
              <RouterLink to="/login" class="sign-in-button">Sign in</RouterLink>
            </div>

            <p class="trust-note">
              <IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" />
              <span>Secure accounts. Verified listings. Clear booking flow.</span>
            </p>
          </div>

          <div id="welcome-showcase" class="showcase-grid" aria-label="RANDSA rental categories">
            <article
              v-for="(item, index) in showcaseItems"
              :key="item.key"
              class="showcase-card"
              :class="`showcase-card--${item.key}`"
              :style="{ '--delay': `${index * 45}ms` }"
            >
              <div class="showcase-media">
                <img
                  :src="item.image"
                  :alt="item.alt"
                  loading="lazy"
                  decoding="async"
                  :class="item.imageClass"
                />
                <span class="showcase-favourite" aria-hidden="true">
                  <IonIcon :icon="heartOutline" />
                </span>
              </div>
            </article>
          </div>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import {
  arrowForwardOutline,
  businessOutline,
  carSportOutline,
  gridOutline,
  heartOutline,
  homeOutline,
  leafOutline,
  shieldCheckmarkOutline,
  storefrontOutline,
} from 'ionicons/icons'
import { RouterLink } from 'vue-router'

import carImage from '../assets/randsa-hero-car.png'
import eventImage from '../assets/randsa-hero-event.png'
import homeImage from '../assets/randsa-hero-home.png'
import horsesImage from '../assets/randsa-hero-horses.png'

const categories = [
  { label: 'Houses', icon: homeOutline },
  { label: 'Shops', icon: storefrontOutline },
  { label: 'Offices', icon: businessOutline },
  { label: 'Cars', icon: carSportOutline },
  { label: 'Horses', icon: leafOutline },
  { label: 'More', icon: gridOutline },
]

const showcaseItems = [
  {
    key: 'property',
    image: homeImage,
    alt: 'Modern house with large windows beside a swimming pool',
    imageClass: 'image-home',
  },
  {
    key: 'car',
    image: carImage,
    alt: 'Premium car available for rent',
    imageClass: 'image-car',
  },
  {
    key: 'office',
    image: homeImage,
    alt: 'Bright modern interior suitable for an office',
    imageClass: 'image-office',
  },
  {
    key: 'apartment',
    image: homeImage,
    alt: 'Contemporary apartment exterior at dusk',
    imageClass: 'image-apartment',
  },
  {
    key: 'shop',
    image: eventImage,
    alt: 'Warmly lit space suitable for a shop or showroom',
    imageClass: 'image-shop',
  },
  {
    key: 'horse',
    image: horsesImage,
    alt: 'Two horses standing together in an open field',
    imageClass: 'image-horse',
  },
  {
    key: 'event',
    image: eventImage,
    alt: 'Elegant outdoor event setting prepared for guests',
    imageClass: 'image-event',
  },
]
</script>

<style scoped>
.welcome-page,
.welcome-content {
  --background: #f7f7f5;
  --overflow: hidden;
  background: #f7f7f5;
}

.welcome-main {
  height: 100%;
  overflow: hidden;
  background: #f7f7f5;
}

.welcome-hero {
  display: grid;
  height: 100dvh;
  min-height: 0;
  grid-template-columns: minmax(0, 0.88fr) minmax(620px, 1.12fr);
  align-items: center;
  gap: 64px;
  width: min(100%, 1600px);
  margin: 0 auto;
  padding: 40px 56px;
}

.welcome-copy {
  width: 100%;
  min-width: 0;
  max-width: 610px;
  animation: welcome-enter 520ms ease-out both;
}

.brand-lockup {
  display: flex;
  width: fit-content;
  align-items: center;
  gap: 12px;
  color: #102033;
  font-family: 'Space Grotesk', 'Manrope', sans-serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.brand-mark {
  display: inline-flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #1f6fe7;
  color: #ffffff;
  box-shadow: 0 12px 28px -14px rgba(31, 111, 231, 0.85);
}

.brand-mark ion-icon {
  font-size: 22px;
}

.welcome-badge {
  display: inline-flex;
  margin: 72px 0 0;
  border: 1px solid #cfe3ff;
  border-radius: 999px;
  background: #edf6ff;
  padding: 8px 13px;
  color: #1858c8;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.welcome-title {
  max-width: 600px;
  margin: 22px 0 0;
  overflow-wrap: break-word;
  color: #102033;
  font-family: 'Space Grotesk', 'Manrope', sans-serif;
  font-size: 60px;
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: 0;
}

.welcome-title span {
  color: #1f6fe7;
}

.welcome-description {
  max-width: 560px;
  margin: 24px 0 0;
  color: #5d6c80;
  font-size: 17px;
  line-height: 1.75;
}

.category-list {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  margin: 32px 0 0;
  padding: 0 0 6px;
  overflow-x: auto;
  list-style: none;
  scrollbar-width: none;
}

.category-list::-webkit-scrollbar {
  display: none;
}

.category-item {
  display: grid;
  flex: 0 0 58px;
  justify-items: center;
  gap: 9px;
  color: #3e4c5e;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.category-icon {
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e3e7ed;
  border-radius: 50%;
  background: #ffffff;
  color: #1f6fe7;
  box-shadow: 0 12px 28px -20px rgba(16, 32, 51, 0.6);
  transition:
    transform 200ms ease,
    border-color 200ms ease,
    box-shadow 200ms ease;
}

.category-item:hover .category-icon {
  transform: translateY(-3px);
  border-color: #b8d8ff;
  box-shadow: 0 16px 30px -18px rgba(31, 111, 231, 0.55);
}

.category-icon ion-icon {
  font-size: 21px;
}

.welcome-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 38px;
}

.continue-button,
.sign-in-button {
  display: inline-flex;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  transition:
    transform 200ms ease,
    background-color 200ms ease,
    border-color 200ms ease,
    box-shadow 200ms ease,
    color 200ms ease;
}

.continue-button {
  min-width: 170px;
  gap: 34px;
  background: #1f6fe7;
  color: #ffffff;
  box-shadow: 0 14px 30px -16px rgba(31, 111, 231, 0.9);
}

.continue-button ion-icon {
  font-size: 18px;
  transition: transform 200ms ease;
}

.continue-button:hover {
  transform: translateY(-2px);
  background: #1858c8;
  box-shadow: 0 18px 34px -16px rgba(31, 111, 231, 0.95);
}

.continue-button:hover ion-icon {
  transform: translateX(3px);
}

.sign-in-button {
  min-width: 128px;
  border: 1px solid #ccd4df;
  background: #ffffff;
  color: #233246;
}

.sign-in-button:hover {
  transform: translateY(-2px);
  border-color: #7fb8ff;
  color: #1858c8;
  box-shadow: 0 14px 28px -20px rgba(16, 32, 51, 0.65);
}

.continue-button:focus-visible,
.sign-in-button:focus-visible {
  outline: 3px solid rgba(50, 143, 255, 0.32);
  outline-offset: 3px;
}

.trust-note {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 19px 0 0;
  color: #68778a;
  font-size: 12px;
  line-height: 1.5;
}

.trust-note ion-icon {
  flex: 0 0 auto;
  color: #159562;
  font-size: 17px;
}

.showcase-grid {
  display: grid;
  height: calc(100dvh - 80px);
  min-height: 0;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(10, minmax(0, 1fr));
  gap: 14px;
}

.showcase-card {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(218, 224, 232, 0.92);
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 22px 50px -34px rgba(16, 32, 51, 0.55);
  animation: card-enter 480ms ease-out both;
  animation-delay: var(--delay);
  transition:
    transform 200ms ease,
    box-shadow 200ms ease;
}

.showcase-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 28px 56px -32px rgba(16, 32, 51, 0.6);
}

.showcase-card--property {
  grid-column: 1 / span 7;
  grid-row: 1 / span 4;
}

.showcase-card--car {
  grid-column: 8 / span 5;
  grid-row: 1 / span 2;
}

.showcase-card--office {
  grid-column: 8 / span 5;
  grid-row: 3 / span 2;
}

.showcase-card--apartment {
  grid-column: 1 / span 4;
  grid-row: 5 / span 2;
}

.showcase-card--shop {
  grid-column: 5 / span 4;
  grid-row: 5 / span 2;
}

.showcase-card--horse {
  grid-column: 9 / span 4;
  grid-row: 5 / span 2;
}

.showcase-card--event {
  grid-column: 1 / span 12;
  grid-row: 7 / span 4;
}

.showcase-media {
  position: relative;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
  background: #e9edf2;
}

.showcase-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 360ms ease;
}

.showcase-card:hover .showcase-media img {
  transform: scale(1.025);
}

.showcase-media .image-office {
  object-position: 72% 58%;
}

.showcase-media .image-apartment {
  object-position: 26% 45%;
}

.showcase-media .image-shop {
  object-position: 58% 52%;
}

.showcase-media .image-horse {
  object-position: center 46%;
}

.showcase-media .image-event {
  object-position: center 54%;
}

.showcase-favourite {
  position: absolute;
  top: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.9);
  color: #26364a;
  box-shadow: 0 10px 22px -16px rgba(16, 32, 51, 0.7);
  backdrop-filter: blur(12px);
}

.showcase-favourite {
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 16px;
}

@keyframes welcome-enter {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1279px) {
  .welcome-hero {
    grid-template-columns: minmax(0, 0.9fr) minmax(540px, 1.1fr);
    gap: 40px;
    padding-right: 36px;
    padding-left: 36px;
  }

  .welcome-title {
    font-size: 50px;
  }

  .welcome-badge {
    margin-top: 48px;
  }

  .category-list {
    gap: 12px;
  }
}

@media (max-width: 1023px) {
  .welcome-hero {
    height: 100dvh;
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    gap: 28px;
    padding: 28px 32px;
  }

  .welcome-copy {
    max-width: 680px;
  }

  .welcome-badge {
    margin-top: 36px;
  }

  .showcase-grid {
    width: 100%;
    height: 100%;
    min-height: 0;
  }
}

@media (max-width: 639px) {
  .welcome-hero {
    gap: 18px;
    padding: 16px;
  }

  .brand-lockup {
    gap: 10px;
    font-size: 19px;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
    border-radius: 11px;
  }

  .welcome-badge {
    margin-top: 26px;
  }

  .welcome-title {
    margin-top: 18px;
    font-size: 40px;
    line-height: 1.08;
  }

  .welcome-description {
    margin-top: 18px;
    font-size: 15px;
    line-height: 1.7;
  }

  .category-list {
    gap: 14px;
    margin-right: -16px;
    margin-top: 26px;
    padding-right: 16px;
  }

  .category-item {
    flex-basis: 54px;
  }

  .category-icon {
    width: 50px;
    height: 50px;
  }

  .welcome-actions {
    align-items: center;
    flex-direction: row;
    margin-top: 24px;
  }

  .continue-button,
  .sign-in-button {
    width: 50%;
    min-width: 0;
    min-height: 48px;
  }

  .continue-button {
    justify-content: space-between;
  }

  .trust-note {
    align-items: flex-start;
  }

  .showcase-grid {
    height: 100%;
    min-height: 0;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .showcase-card {
    border-radius: 16px;
  }

  .showcase-card--property {
    grid-column: 1 / span 2;
    grid-row: 1 / span 2;
  }

  .showcase-card--car {
    grid-column: 3 / span 2;
    grid-row: 1;
  }

  .showcase-card--office {
    grid-column: 3 / span 2;
    grid-row: 2;
  }

  .showcase-card--apartment {
    grid-column: 1;
    grid-row: 3;
  }

  .showcase-card--shop {
    grid-column: 2;
    grid-row: 3;
  }

  .showcase-card--horse {
    grid-column: 3;
    grid-row: 3;
  }

  .showcase-card--event {
    grid-column: 4;
    grid-row: 3;
  }

  .showcase-favourite {
    top: 9px;
    right: 9px;
    width: 29px;
    height: 29px;
  }
}

@media (max-width: 374px) {
  .welcome-title {
    font-size: 36px;
  }

  .welcome-description {
    line-height: 1.55;
  }
}

@media (min-width: 1024px) and (max-height: 760px) {
  .welcome-badge {
    margin-top: 28px;
  }

  .welcome-title {
    margin-top: 16px;
    font-size: 52px;
  }

  .welcome-description {
    margin-top: 16px;
    line-height: 1.55;
  }

  .category-list {
    margin-top: 20px;
  }

  .category-icon {
    width: 48px;
    height: 48px;
  }

  .welcome-actions {
    margin-top: 24px;
  }

  .continue-button,
  .sign-in-button {
    min-height: 48px;
  }

  .trust-note {
    margin-top: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-copy,
  .showcase-card {
    animation: none;
  }

  .category-icon,
  .continue-button,
  .sign-in-button,
  .continue-button ion-icon,
  .showcase-card,
  .showcase-media img {
    transition: none;
  }
}
</style>
