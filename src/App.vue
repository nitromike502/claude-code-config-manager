<template>
  <div id="app" class="app-container" :data-theme="themeStore.currentTheme">
    <header class="app-header">
      <div class="header-content">
        <h1>Claude Code Manager</h1>
        <button @click="themeStore.toggleTheme" class="theme-toggle" :title="`Switch to ${themeStore.currentTheme === 'light' ? 'dark' : 'light'} mode`">
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

    <!-- Notifications Container -->
    <div class="notifications" v-if="notificationsStore.notifications.length">
      <div
        v-for="notification in notificationsStore.notifications"
        :key="notification.id"
        class="notification"
        :class="'notification-' + notification.type"
      >
        <p>{{ notification.message }}</p>
        <button @click="notificationsStore.removeNotification(notification.id)">✕</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useThemeStore } from './stores/theme'
import { useNotificationsStore } from './stores/notifications'
import { useProjectsStore } from './stores/projects'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

export default {
  name: 'App',
  components: {
    ErrorBoundary
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
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--bg-header);
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border-primary);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

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

.app-main {
  flex: 1;
}

.notifications {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
}

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

.notification button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--text-muted);
}

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

/* Theme-specific overrides are now handled in variables.css */
</style>
