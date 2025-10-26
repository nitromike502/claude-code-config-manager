<template>
  <div class="test-page">
    <div class="test-container">
      <h1>Utility Components Test Page</h1>

      <!-- BreadcrumbNavigation Test -->
      <section class="test-section">
        <h2>BreadcrumbNavigation Component</h2>
        <div class="test-box">
          <h3>Example 1: Home → Dashboard</h3>
          <BreadcrumbNavigation :items="breadcrumbs1" />
        </div>
        <div class="test-box">
          <h3>Example 2: Home → Project → Details</h3>
          <BreadcrumbNavigation :items="breadcrumbs2" />
        </div>
        <div class="test-box">
          <h3>Example 3: Single item (current page)</h3>
          <BreadcrumbNavigation :items="breadcrumbs3" />
        </div>
      </section>

      <!-- LoadingState Test -->
      <section class="test-section">
        <h2>LoadingState Component</h2>
        <div class="test-box">
          <h3>Type: item (default, count: 3)</h3>
          <LoadingState />
        </div>
        <div class="test-box">
          <h3>Type: item (count: 5)</h3>
          <LoadingState :count="5" />
        </div>
        <div class="test-box">
          <h3>Type: card (count: 2)</h3>
          <LoadingState type="card" :count="2" />
        </div>
        <div class="test-box">
          <h3>Type: list (count: 4)</h3>
          <LoadingState type="list" :count="4" />
        </div>
      </section>

      <!-- EmptyState Test -->
      <section class="test-section">
        <h2>EmptyState Component</h2>
        <div class="test-box">
          <h3>Basic empty state (no action)</h3>
          <EmptyState
            icon="pi pi-users"
            title="No Agents Found"
            message="No subagents are configured for this project."
          />
        </div>
        <div class="test-box">
          <h3>Empty state with action button</h3>
          <EmptyState
            icon="pi pi-folder"
            title="No Projects Found"
            message="Add projects in Claude Code and click Rescan to see them here."
            action-text="Rescan Projects"
            action-icon="pi pi-refresh"
            @action="handleAction"
          />
        </div>
        <div class="test-box">
          <h3>Different icons</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <EmptyState
              icon="pi pi-bolt"
              title="No Commands"
            />
            <EmptyState
              icon="pi pi-link"
              title="No Hooks"
            />
            <EmptyState
              icon="pi pi-server"
              title="No MCP Servers"
            />
          </div>
        </div>
      </section>

      <!-- Action Log -->
      <section v-if="actionLog.length > 0" class="test-section">
        <h2>Action Log</h2>
        <div class="test-box">
          <ul>
            <li v-for="(log, index) in actionLog" :key="index">{{ log }}</li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import BreadcrumbNavigation from './BreadcrumbNavigation.vue'
import LoadingState from './LoadingState.vue'
import EmptyState from './EmptyState.vue'

export default {
  name: 'TestUtilityComponents',
  components: {
    BreadcrumbNavigation,
    LoadingState,
    EmptyState
  },
  setup() {
    const actionLog = ref([])

    const breadcrumbs1 = [
      { label: 'Home', route: '/', icon: 'pi pi-home' },
      { label: 'Dashboard' }
    ]

    const breadcrumbs2 = [
      { label: 'Home', route: '/', icon: 'pi pi-home' },
      { label: 'Projects', route: '/projects' },
      { label: 'Project Details' }
    ]

    const breadcrumbs3 = [
      { label: 'Current Page' }
    ]

    const handleAction = () => {
      const timestamp = new Date().toLocaleTimeString()
      actionLog.value.push(`Action button clicked at ${timestamp}`)
    }

    return {
      breadcrumbs1,
      breadcrumbs2,
      breadcrumbs3,
      actionLog,
      handleAction
    }
  }
}
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 2rem;
}

.test-container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: var(--text-primary);
  margin-bottom: 2rem;
  text-align: center;
}

.test-section {
  margin-bottom: 3rem;
}

.test-section h2 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-primary);
}

.test-box {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.test-box h3 {
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.test-box ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--text-secondary);
}

.test-box li {
  margin: 0.5rem 0;
}
</style>
