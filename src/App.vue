<template>
  <div id="app" class="app-container" :data-theme="themeStore.currentTheme">
    <header class="app-header">
      <div class="header-content">
        <h1>Claude Code Manager</h1>
        <!-- TAILWIND PHASE 2: Replace theme-toggle button with PrimeVue Button component -->
        <button
          @click="themeStore.toggleTheme"
          class="theme-toggle"
          :title="`Switch to ${themeStore.currentTheme === 'light' ? 'dark' : 'light'} mode`"
          aria-label="Toggle theme"
        >
          <span class="theme-icon">{{ themeStore.currentTheme === 'light' ? '🌙' : '☀️' }}</span>
          <span class="theme-text">{{ themeStore.currentTheme === 'light' ? 'Dark' : 'Light' }}</span>
        </button>
      </div>
    </header>

    <main class="app-main">
      <ErrorBoundary>
        <router-view />
      </ErrorBoundary>
    </main>

    <!-- PrimeVue Toast Component -->
    <Toast position="bottom-right" />

    <!-- TAILWIND PHASE 2: Remove custom notifications container, migrate to PrimeVue Toast -->
    <!-- Notifications Container (legacy - to be replaced with Toast service) -->
    <div class="notifications" v-if="notificationsStore.notifications.length">
      <div
        v-for="notification in notificationsStore.notifications"
        :key="notification.id"
        class="notification"
        :class="'notification-' + notification.type"
      >
        <p>{{ notification.message }}</p>
        <button
          @click="notificationsStore.removeNotification(notification.id)"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useThemeStore } from './stores/theme'
import { useNotificationsStore } from './stores/notifications'
import { useProjectsStore } from './stores/projects'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import Toast from 'primevue/toast'

export default {
  name: 'App',
  components: {
    ErrorBoundary,
    Toast
  },
  setup() {
    const themeStore = useThemeStore()
    const notificationsStore = useNotificationsStore()
    const projectsStore = useProjectsStore()

    return {
      themeStore,
      notificationsStore,
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

/* TAILWIND PHASE 2: bg-*, border, px-*, py-*, rounded,
   flex, items-center, gap, hover:bg-*, transition
   Current: button styling with CSS custom properties */
.theme-toggle {
  background: none;
  border: 1px solid var(--border-primary);
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.theme-toggle:hover {
  background: var(--bg-hover);
}

.theme-icon {
  font-size: 1.2rem;
  display: inline-block;
  line-height: 1;
}

.theme-text {
  font-weight: 500;
  color: var(--text-primary);
}

/* TAILWIND PHASE 2: flex-1 */
.app-main {
  flex: 1;
}

/* ============================================
   Notifications Container
   TAILWIND PHASE 2: Remove entirely, migrate to PrimeVue Toast service
   Current utilities: fixed, bottom-*, right-*, flex, flex-col, gap, z-*
   ============================================ */
.notifications {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
}

/* TAILWIND PHASE 2: p-*, rounded, bg-*, shadow,
   flex, justify-between, items-center, gap, animation
   Recommendation: Migrate to Toast component for consistency with PrimeVue design system */
.notification {
  padding: 1rem;
  border-radius: 4px;
  background: var(--bg-secondary);
  box-shadow: var(--shadow-card);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  animation: slideIn 0.3s ease-out;
}

/* Status-specific border colors - will be handled by Toast severity variants */
.notification-success {
  border-left: 4px solid var(--color-success);
}

.notification-error {
  border-left: 4px solid var(--color-error);
}

.notification-warning {
  border-left: 4px solid var(--color-warning);
}

.notification-info {
  border-left: 4px solid var(--color-info);
}

/* TAILWIND PHASE 2: button reset styles, text-*, cursor-pointer
   Current: background, border, cursor, font-size, color */
.notification button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--text-muted);
}

/* ============================================
   Animation Utilities
   TAILWIND PHASE 2: Replace with Tailwind animate-* or custom animation config
   Current: Custom keyframe for slide-in from right
   ============================================ */
@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
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
