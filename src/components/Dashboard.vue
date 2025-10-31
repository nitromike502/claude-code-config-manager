<template>
  <div class="dashboard">
    <div class="main-content">
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h2>Projects</h2>
          <div class="dashboard-actions">
            <select v-model="sortBy" class="sort-dropdown">
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="agents">Most Agents</option>
              <option value="commands">Most Commands</option>
            </select>
            <button
              @click="handleRescan"
              :disabled="scanning"
              class="rescan-btn"
            >
              <i class="pi pi-refresh" :class="{ spinning: scanning }"></i>
              {{ scanning ? 'Scanning...' : 'Rescan' }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="projectsStore.isLoading" class="loading-container">
          <div class="spinner"></div>
          <p>Loading projects...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="projectsStore.error" class="error-state">
          <h4>Error Loading Projects</h4>
          <p>{{ projectsStore.error }}</p>
          <button @click="loadProjects" class="retry-btn">Retry</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="sortedProjects.length === 0" class="empty-state">
          <i class="pi pi-folder"></i>
          <h3>No Projects Found</h3>
          <p>Add projects in Claude Code and click "Rescan" to see them here.</p>
        </div>

        <!-- Projects Grid -->
        <div v-else class="project-grid">
          <div
            v-for="project in sortedProjects"
            :key="project.id"
            class="project-card"
            :class="{ 'user-card': project.isUser }"
            @click="navigateToProject(project.id)"
          >
            <div class="project-header">
              <i :class="project.isUser ? 'pi pi-user' : 'pi pi-folder'"></i>
              <h3 class="project-name">{{ project.name }}</h3>
            </div>

            <div class="project-path">{{ project.path }}</div>

            <div class="project-stats">
              <div class="stat stat-agents">
                <i class="pi pi-users"></i>
                <span>{{ project.stats?.agents || 0 }} Agents</span>
              </div>
              <div class="stat stat-commands">
                <i class="pi pi-bolt"></i>
                <span>{{ project.stats?.commands || 0 }} Commands</span>
              </div>
              <div class="stat stat-hooks">
                <i class="pi pi-link"></i>
                <span>{{ project.stats?.hooks || 0 }} Hooks</span>
              </div>
              <div class="stat stat-mcp">
                <i class="pi pi-server"></i>
                <span>{{ project.stats?.mcp || 0 }} MCP</span>
              </div>
            </div>

            <div class="project-footer">
              <button class="view-btn">
                View
                <i class="pi pi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import * as api from '@/api/client'

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    const projectsStore = useProjectsStore()

    const sortBy = ref('name-asc')
    const scanning = ref(false)
    const userConfig = ref(null)

    // Load user config stats
    const loadUserConfig = async () => {
      try {
        // Get user stats by calling all endpoints and counting
        const [agents, commands, hooks, mcp] = await Promise.all([
          api.getUserAgents(),
          api.getUserCommands(),
          api.getUserHooks(),
          api.getUserMcp(),
        ])

        const stats = {
          agents: agents.agents?.length || 0,
          commands: commands.commands?.length || 0,
          hooks: hooks.hooks?.length || 0,
          mcp: mcp.mcp?.length || 0,
        }

        userConfig.value = {
          id: 'user',
          name: 'User Configurations',
          path: '~/.claude',
          stats,
          isUser: true
        }
      } catch (err) {
        console.error('Failed to load user config:', err)
        // Don't set error state, just skip user config card
      }
    }

    // Computed: sorted projects with user config prepended
    const sortedProjects = computed(() => {
      let projects = [...(projectsStore.filteredProjects || [])]

      // Apply sorting
      switch (sortBy.value) {
        case 'name-asc':
          projects.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'name-desc':
          projects.sort((a, b) => b.name.localeCompare(a.name))
          break
        case 'agents':
          projects.sort((a, b) => (b.stats?.agents || 0) - (a.stats?.agents || 0))
          break
        case 'commands':
          projects.sort((a, b) => (b.stats?.commands || 0) - (a.stats?.commands || 0))
          break
      }

      // Prepend user configuration as first card if available
      if (userConfig.value) {
        projects.unshift(userConfig.value)
      }

      return projects
    })

    // Load projects
    const loadProjects = async () => {
      await projectsStore.loadProjects()
      await loadUserConfig()
    }

    // Rescan projects
    const handleRescan = async () => {
      scanning.value = true
      try {
        await projectsStore.refreshProjects()
        await loadUserConfig()
      } catch (err) {
        console.error('Rescan failed:', err)
      } finally {
        scanning.value = false
      }
    }

    // Navigate to project
    const navigateToProject = (projectId) => {
      if (projectId === 'user') {
        router.push('/user')
      } else {
        router.push(`/project/${projectId}`)
      }
    }

    // Listen for search from header (backwards compat with Phase 1)
    onMounted(async () => {
      if (!projectsStore.projects.length) {
        await loadProjects()
      } else {
        // Always load user config even if projects already loaded
        await loadUserConfig()
      }

      window.addEventListener('header-search', (e) => {
        projectsStore.setSearchQuery(e.detail)
      })
    })

    return {
      projectsStore,
      sortBy,
      scanning,
      sortedProjects,
      loadProjects,
      handleRescan,
      navigateToProject
    }
  }
}
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.main-content {
  padding: 2rem;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--text-primary);
}

.dashboard-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.sort-dropdown {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.95rem;
  cursor: pointer;
  min-width: 200px;
}

.sort-dropdown:hover {
  border-color: var(--color-primary);
}

.rescan-btn {
  padding: 0.5rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.rescan-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.rescan-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rescan-btn i.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Loading State */
.loading-container {
  text-align: center;
  padding: 3rem 1rem;
}

.spinner {
  border: 3px solid var(--border-primary);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-container p {
  color: var(--text-secondary);
}

/* Error State */
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-error);
}

.error-state h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.error-state p {
  margin: 0 0 1.5rem 0;
}

.retry-btn {
  padding: 0.5rem 1.5rem;
  background: var(--color-error);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}

.retry-btn:hover {
  background: var(--color-error);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

/* Projects Grid */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.project-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.project-card.user-card {
  border-color: var(--color-user);
  background: var(--bg-primary);
}

.project-card.user-card:hover {
  border-color: var(--color-user);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.project-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.project-header i {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.user-card .project-header i {
  color: var(--color-user);
}

.project-name {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-path {
  font-size: 0.85rem;
  color: var(--text-secondary);
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stat i {
  font-size: 1rem;
}

.stat-agents i { color: var(--color-agents); }
.stat-commands i { color: var(--color-commands); }
.stat-hooks i { color: var(--color-hooks); }
.stat-mcp i { color: var(--color-mcp); }

.project-footer {
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-primary);
}

.view-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.view-btn:hover {
  background: var(--color-primary-hover);
}

.view-btn i {
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }

  .dashboard-actions {
    flex-direction: column;
  }

  .sort-dropdown {
    width: 100%;
  }

  .project-grid {
    grid-template-columns: 1fr;
  }
}
</style>
