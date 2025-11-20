import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import App from '@/App.vue'
import router from '@/router'
import { useThemeStore } from '@/stores/theme'

// Import global styles
import '@/styles/variables.css'
import '@/styles/global.css'
import '@/styles/components.css'

// Import PrimeIcons
import 'primeicons/primeicons.css'

// Import PrimeVue directives and services
import Tooltip from 'primevue/tooltip'
import ToastService from 'primevue/toastservice'

// Initialize Vue app
const app = createApp(App)
const pinia = createPinia()

// Use Pinia and Vue Router
app.use(pinia)
app.use(router)

// Use PrimeVue with Aura theme preset
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '[data-theme="dark"]',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities'
      }
    }
  }
})

// Use PrimeVue services
app.use(ToastService)

// Register PrimeVue directives globally
app.directive('tooltip', Tooltip)

// Load theme before mounting
const themeStore = useThemeStore()
themeStore.loadTheme()

// Mount to #app
app.mount('#app')
