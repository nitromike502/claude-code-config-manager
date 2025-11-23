<template>
  <div id="app" class="app-container" :data-theme="themeStore.currentTheme">
    <header class="app-header">
      <div class="header-content">
        <h1>Claude Code Manager</h1>
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

    <main class="app-main">
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
   App Layout - Core Flex Structure
   Candidates for Tailwind: flex, min-h, flex-col, flex-1
   ============================================ */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* TAILWIND PHASE 2: bg-*, py-*, px-*, border-b
   Current: var(--bg-header), padding, border-bottom */
.app-header {
  background: var(--bg-header);
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border-primary);
}

/* TAILWIND PHASE 2: flex, justify-between, items-center, mb-*
   Current: display: flex, justify-content, align-items, margin */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

/* TAILWIND PHASE 2: flex-1 */
.app-main {
  flex: 1;
}

/* ============================================
   Theme System
   Status: Complete - CSS custom properties (--bg-*, --text-*, --color-*, --shadow-*)
   are properly defined in variables.css

   Phase 2 Note: Tailwind CSS + tailwindcss-primeui will replace the need for
   these custom property utilities. Both themes (light/dark) are already
   properly segregated in variables.css with data-theme attribute selector.
   ============================================ */
</style>
