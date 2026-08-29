import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        /*
         * Everything used to land in one 1.5 MB entry chunk, so the first paint waited
         * on the whole Firebase SDK. Splitting by vendor lets the shell render while
         * the heavier SDKs stream in, and keeps them cached across app deploys.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase'
          if (id.includes('@ionic') || id.includes('ionicons')) return 'ionic'
          if (id.includes('leaflet')) return 'leaflet'
          if (id.includes('/vue/') || id.includes('vue-router') || id.includes('@vue/')) {
            return 'vue'
          }

          return 'vendor'
        },
      },
    },
  },
})
