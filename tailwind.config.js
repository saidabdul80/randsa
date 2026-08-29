/** @type {import('tailwindcss').Config} */

/*
 * Tailwind reads the same CSS variables as editorial.css.
 *
 * That means a utility like `bg-surface` or `text-brass` is automatically correct in
 * light and dark, and the legacy `brand-*` / `ink` / `mist` names used across older
 * pages now resolve to the premium palette instead of the old blue-glass one.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Premium brass accent. The `brand-*` scale is kept so existing markup
        // picks up the new palette without a find-and-replace across 38k lines.
        brand: {
          50: 'rgb(250 247 240 / <alpha-value>)',
          100: 'rgb(243 236 222 / <alpha-value>)',
          200: 'rgb(232 217 189 / <alpha-value>)',
          300: 'rgb(214 190 145 / <alpha-value>)',
          400: 'rgb(186 154 100 / <alpha-value>)',
          500: 'rgb(160 125 70 / <alpha-value>)',
          600: 'rgb(138 106 47 / <alpha-value>)',
          700: 'rgb(111 84 36 / <alpha-value>)',
          800: 'rgb(88 66 30 / <alpha-value>)',
          900: 'rgb(66 50 24 / <alpha-value>)',
        },

        // Token-backed semantic colours: these follow the active theme.
        canvas: 'var(--rd-canvas)',
        surface: 'var(--rd-surface)',
        'surface-alt': 'var(--rd-surface-alt)',
        brass: 'var(--rd-brass)',
        'brass-soft': 'var(--rd-brass-soft)',
        hairline: 'var(--rd-hairline)',

        // Legacy names, repointed at the premium palette.
        sand: '#f4f1eb',
        ink: '#14181f',
        mist: '#5b6470',
        plate: '#0b0e13',
      },
      boxShadow: {
        panel: 'var(--rd-shadow)',
        plate: 'var(--rd-shadow-lg)',
        hairline: 'var(--rd-shadow-sm)',
      },
      borderRadius: {
        plate: '6px',
        card: '10px',
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Space Grotesk', 'Georgia', 'serif'],
      },
      letterSpacing: {
        editorial: '0.18em',
        wordmark: '0.34em',
      },
      backgroundImage: {
        'plate-veil':
          'linear-gradient(to top, rgba(7,10,15,0.86) 2%, rgba(7,10,15,0.22) 48%, transparent 76%)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.33, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
