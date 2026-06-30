import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'

import App from './App.vue'
import { createRouter } from './router'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'
import 'leaflet/dist/leaflet.css'

import './theme/variables.css'
import './assets/styles/tailwind.css'
import { initializeAuthState } from './composables/useAuth'

const app = createApp(App)
const router = createRouter()

app.use(IonicVue)
app.use(router)
initializeAuthState()

app.mount('#app')
