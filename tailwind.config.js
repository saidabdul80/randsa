/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dbeeff',
          200: '#bfe1ff',
          300: '#93cdff',
          400: '#5eb0ff',
          500: '#328fff',
          600: '#1f6fe7',
          700: '#1858c8',
          800: '#1949a2',
          900: '#1a3f80',
        },
        sand: '#f6efe7',
        ink: '#102033',
        mist: '#6b7a90',
      },
      boxShadow: {
        panel: '0 18px 45px -24px rgba(16, 32, 51, 0.35)',
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'sans-serif'],
      },
      backgroundImage: {
        'hero-mesh':
          'radial-gradient(circle at top left, rgba(50, 143, 255, 0.28), transparent 32%), radial-gradient(circle at bottom right, rgba(255, 187, 120, 0.22), transparent 28%)',
      },
    },
  },
  plugins: [],
}
