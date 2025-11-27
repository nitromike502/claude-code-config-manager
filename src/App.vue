<template>
  <div id="app" class="min-h-screen flex flex-col" :data-theme="themeStore.currentTheme">
    <header class="px-8 py-4 bg-bg-header border-b border-border-primary">
      <div class="flex justify-between items-center mb-2">
        <h1>Claude Code Config Manager</h1>
        <Button
          @click="themeStore.toggleTheme"
          :icon="themeStore.currentTheme === 'light' ? 'pi pi-moon' : 'pi pi-sun'"
          :label="themeStore.currentTheme === 'light' ? 'Dark' : 'Light'"
          severity="secondary"
          outlined
          aria-label="Toggle theme"
        />
      </div>
    </header>

    <main class="flex-1">
      <ErrorBoundary>
        <router-view />
      </ErrorBoundary>
    </main>

    <!-- PrimeVue Toast Component -->
    <Toast position="bottom-right" />
  </div>
</template>

<script>
import { useThemeStore } from './stores/theme'
import { useProjectsStore } from './stores/projects'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import Toast from 'primevue/toast'
import Button from 'primevue/button'

export default {
  name: 'App',
  components: {
    ErrorBoundary,
    Toast,
    Button
  },
  setup() {
    const themeStore = useThemeStore()
    const projectsStore = useProjectsStore()

    return {
      themeStore,
      projectsStore
    }
  }
}
</script>

<style scoped>
/* ============================================
   Theme System
   Layout: Tailwind utility classes (min-h-screen, flex, flex-col, px-8, py-4)
   Theming: CSS custom properties (--bg-*, --text-*, --color-*) in variables.css
   Theme Switching: Applied via data-theme attribute on #app element
   ============================================ */
</style>
