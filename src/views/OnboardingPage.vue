<template>
  <AppShell :show-header="false" :show-bottom-nav="false" content-class="min-h-full w-full">
    <main class="rd-page welcome">
      <header class="welcome-top">
        <RouterLink to="/home" class="welcome-wordmark" aria-label="RANDSA home">
          <span class="welcome-monogram" aria-hidden="true">R</span>
          <span class="welcome-wordmark-text">RANDSA</span>
        </RouterLink>

        <RouterLink to="/login" class="welcome-signin">Sign in</RouterLink>
      </header>

      <section class="welcome-hero" aria-labelledby="welcome-title">
        <div class="welcome-copy">
          <p class="rd-eyebrow">
            <span class="rd-rule" aria-hidden="true"></span>Welcome to RANDSA
          </p>

          <h1 id="welcome-title" class="rd-display welcome-title">
            A smoother way to rent, list, and book.
          </h1>

          <p class="rd-lede welcome-lede">
            One account to discover, post, book, save, and manage every rental you care about, from
            homes and offices to cars, event spaces, and horses.
          </p>

          <div class="welcome-actions">
            <RouterLink to="/register" class="rd-cta">Create account</RouterLink>
            <RouterLink to="/home" class="rd-cta rd-cta--ghost">Browse listings</RouterLink>
          </div>

          <p class="welcome-trust rd-meta">
            Secure accounts &middot; Verified listings &middot; Clear booking flow
          </p>
        </div>

        <figure class="rd-plate welcome-plate">
          <img
            :src="homeImage"
            alt="A lit modern home at dusk, listed on RANDSA"
            fetchpriority="high"
            decoding="async"
          />
          <span class="rd-plate-veil" aria-hidden="true"></span>
          <figcaption class="welcome-plate-caption">
            <span class="welcome-plate-eyebrow">Featured</span>
            <span class="welcome-plate-title">Homes ready to move into</span>
          </figcaption>
        </figure>
      </section>

      <section class="welcome-section" aria-labelledby="welcome-categories-title">
        <header class="welcome-section-head">
          <p class="rd-eyebrow"><span class="rd-rule" aria-hidden="true"></span>Explore</p>
          <h2 id="welcome-categories-title" class="rd-display welcome-section-title">
            Every category, one marketplace.
          </h2>
        </header>

        <div class="welcome-categories">
          <RouterLink
            v-for="category in categories"
            :key="category.label"
            :to="category.to"
            class="rd-plate rd-plate-link welcome-category"
          >
            <img :src="category.image" :alt="category.alt" loading="lazy" decoding="async" />
            <span class="rd-plate-veil" aria-hidden="true"></span>
            <span class="welcome-category-body">
              <span class="welcome-category-label">{{ category.label }}</span>
              <span class="welcome-category-copy">{{ category.copy }}</span>
            </span>
          </RouterLink>
        </div>
      </section>

      <section class="welcome-section" aria-labelledby="welcome-values-title">
        <header class="welcome-section-head">
          <p class="rd-eyebrow"><span class="rd-rule" aria-hidden="true"></span>Why RANDSA</p>
          <h2 id="welcome-values-title" class="rd-display welcome-section-title">
            Built around the whole rental decision.
          </h2>
        </header>

        <ol class="welcome-values">
          <li v-for="(item, index) in onboardingItems" :key="item.title">
            <span class="welcome-value-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <hr class="rd-hairline" />
            <h3>{{ item.title }}</h3>
            <p>{{ item.copy }}</p>
          </li>
        </ol>
      </section>

      <footer class="welcome-foot">
        <p class="rd-meta">Ready when you are</p>
        <RouterLink to="/register" class="rd-cta">Create your account</RouterLink>
      </footer>
    </main>
  </AppShell>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import carImage from '../assets/randsa-hero-car.webp'
import eventImage from '../assets/randsa-hero-event.webp'
import homeImage from '../assets/randsa-hero-home.webp'
import horsesImage from '../assets/randsa-hero-horses.webp'
import AppShell from '../components/layout/AppShell.vue'

/*
 * Each card deep-links into the marketplace pre-filtered to its category, rather than
 * dropping everyone on the same unfiltered listings page.
 */
const categories = [
  {
    label: 'Homes and spaces',
    copy: 'Houses, apartments, offices, and shops.',
    image: homeImage,
    alt: 'A modern home lit at dusk',
    to: '/home?category=property#listings',
  },
  {
    label: 'Cars and rides',
    copy: 'Daily rentals with confirmed availability.',
    image: carImage,
    alt: 'A car parked outside a modern building at night',
    to: '/home?category=vehicles#listings',
  },
  {
    label: 'Event spaces',
    copy: 'Halls and venues for every occasion.',
    image: eventImage,
    alt: 'An outdoor event marquee lit for a reception',
    to: '/home?category=commercial-equipment-tools#listings',
  },
  {
    label: 'Horses and more',
    copy: 'Land, fashion, electronics, and beyond.',
    image: horsesImage,
    alt: 'Two horses in an open field at sunset',
    to: '/home?category=food-agriculture-farming#listings',
  },
]

const onboardingItems = [
  {
    title: 'Location-first search',
    copy: 'Explore listings by city, area, and property type through a search flow built for mobile first.',
  },
  {
    title: 'Optional professional verification',
    copy: 'Any standard account can submit professional details for admin review and clearer trust signals.',
  },
  {
    title: 'Post, book, and save',
    copy: 'Posting, booking, payment, and saved listings stay close to every decision you make.',
  },
]
</script>

<style scoped>
.welcome {
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  gap: clamp(52px, 8vh, 104px);
  padding: clamp(20px, 3vw, 38px) clamp(20px, 4vw, 56px) clamp(40px, 6vh, 72px);
}

/* ---------- top bar ---------- */

.welcome-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.welcome-wordmark {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--rd-ink);
  text-decoration: none;
}

.welcome-monogram {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--rd-brass);
  border-radius: 3px;
  color: var(--rd-brass);
  font-family: 'Fraunces', 'Space Grotesk', serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
}

.welcome-wordmark-text {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.34em;
}

.welcome-signin {
  color: var(--rd-ink);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-decoration: none;
  text-transform: uppercase;
  transition: color 240ms ease;
}

.welcome-signin:hover {
  color: var(--rd-brass);
  text-decoration: underline;
  text-underline-offset: 5px;
}

.welcome-signin:focus-visible,
.welcome-wordmark:focus-visible {
  outline: 2px solid var(--rd-brass);
  outline-offset: 4px;
}

/* ---------- hero ---------- */

.welcome-hero {
  display: grid;
  align-items: center;
  gap: clamp(28px, 4vw, 72px);
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.02fr);
}

.welcome-title {
  margin-top: 26px;
  font-size: clamp(36px, 4.4vw, 68px);
}

.welcome-lede {
  max-width: 480px;
  margin: 24px 0 0;
}

.welcome-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 36px;
}

.welcome-trust {
  margin: 26px 0 0;
}

.welcome-plate {
  aspect-ratio: 4 / 3;
}

.welcome-plate-caption {
  position: absolute;
  right: 28px;
  bottom: 28px;
  left: 28px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.welcome-plate-eyebrow {
  color: #c9a96a;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.welcome-plate-title {
  color: var(--rd-plate-ink);
  font-family: 'Fraunces', 'Space Grotesk', serif;
  font-size: clamp(20px, 1.9vw, 28px);
  font-weight: 400;
  line-height: 1.16;
}

/* ---------- sections ---------- */

.welcome-section-head {
  max-width: 620px;
  margin-bottom: clamp(26px, 3vw, 42px);
}

.welcome-section-title {
  margin-top: 20px;
  font-size: clamp(26px, 2.9vw, 42px);
}

/* ---------- categories ---------- */

.welcome-categories {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.welcome-category {
  position: relative;
  display: block;
  aspect-ratio: 3 / 4;
  text-decoration: none;
}

.welcome-category img {
  transition: transform 700ms cubic-bezier(0.33, 0, 0.2, 1);
}

.welcome-category:hover img {
  transform: scale(1.06);
}

.welcome-category-body {
  position: absolute;
  right: 22px;
  bottom: 22px;
  left: 22px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.welcome-category-label {
  color: var(--rd-plate-ink);
  font-family: 'Fraunces', 'Space Grotesk', serif;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.15;
}

.welcome-category-copy {
  color: rgba(240, 236, 229, 0.72);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.6;
}

/* ---------- values ---------- */

.welcome-values {
  display: grid;
  gap: clamp(24px, 3vw, 52px);
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  list-style: none;
}

.welcome-value-index {
  display: block;
  color: var(--rd-brass);
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.2em;
}

.welcome-values hr {
  margin: 16px 0 20px;
}

.welcome-values h3 {
  margin: 0;
  color: var(--rd-ink);
  font-family: 'Fraunces', 'Space Grotesk', serif;
  font-size: 21px;
  font-weight: 400;
  line-height: 1.2;
}

.welcome-values p {
  margin: 14px 0 0;
  color: var(--rd-muted);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.78;
}

/* ---------- foot ---------- */

.welcome-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-top: 1px solid var(--rd-hairline);
  padding-top: clamp(26px, 3vw, 40px);
}

.welcome-foot p {
  margin: 0;
}

/* ---------- responsive ---------- */

@media (max-width: 1080px) {
  .welcome-hero {
    gap: 32px;
    grid-template-columns: minmax(0, 1fr);
  }

  .welcome-plate {
    aspect-ratio: 16 / 9;
  }

  .welcome-categories {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .welcome-values {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }
}

@media (max-width: 680px) {
  .welcome {
    gap: 46px;
    padding: 16px 16px 34px;
  }

  .welcome-wordmark-text {
    font-size: 11px;
    letter-spacing: 0.28em;
  }

  .welcome-title {
    margin-top: 20px;
    font-size: clamp(30px, 8.4vw, 42px);
  }

  .welcome-lede {
    margin-top: 18px;
    font-size: 12px;
  }

  .welcome-actions {
    margin-top: 28px;
  }

  .welcome-actions .rd-cta {
    width: 100%;
  }

  .welcome-plate {
    aspect-ratio: 5 / 4;
  }

  .welcome-plate-caption {
    right: 20px;
    bottom: 20px;
    left: 20px;
  }

  .welcome-categories {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .welcome-category {
    aspect-ratio: 16 / 10;
  }

  .welcome-foot {
    flex-direction: column;
    align-items: stretch;
  }

  .welcome-foot .rd-cta {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-category img,
  .welcome-signin {
    transition: none;
  }

  .welcome-category:hover img {
    transform: none;
  }
}
</style>
