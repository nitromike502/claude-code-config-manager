import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from '@/App.vue'
import router from '@/router'
import { useThemeStore } from '@/stores/theme'

// Import global styles
import '@/styles/variables.css'
import '@/styles/global.css'
import '@/styles/components.css'

// Import PrimeIcons
import 'primeicons/primeicons.css'

// Import PrimeVue directives
import Tooltip from 'primevue/tooltip'

// Initialize Vue app
const app = createApp(App)
const pinia = createPinia()

// Use Pinia and Vue Router
app.use(pinia)
app.use(router)

// Use PrimeVue (required for Dialog and other components)
app.use(PrimeVue, {
  unstyled: true // We use our own CSS variables for styling
})

// Register PrimeVue directives globally
app.directive('tooltip', Tooltip)

// Load theme before mounting
const themeStore = useThemeStore()
themeStore.loadTheme()

// Mount to #app
app.mount('#app')
