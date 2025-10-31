import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import { useThemeStore } from '@/stores/theme'

// Import global styles
import '@/styles/variables.css'
import '@/styles/global.css'
import '@/styles/components.css'

// Import PrimeIcons
import 'primeicons/primeicons.css'

// Initialize Vue app
const app = createApp(App)
const pinia = createPinia()

// Use Pinia and Vue Router
app.use(pinia)
app.use(router)

// Load theme before mounting
const themeStore = useThemeStore()
themeStore.loadTheme()

// Mount to #app
app.mount('#app')
