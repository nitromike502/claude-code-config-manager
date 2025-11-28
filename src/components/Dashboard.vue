<template>
  <div class="w-full">
    <!-- Mobile-first padding: p-4 on mobile, p-8 on desktop -->
    <div class="p-4 md:p-8">
      <!-- Max width container (1400px = 87.5rem, closest is 7xl at 80rem) -->
      <div class="max-w-7xl mx-auto">
        <!-- Dashboard header: flex layout with responsive behavior -->
        <div class="flex justify-between items-center mb-6 flex-wrap gap-4 md:flex-row flex-col md:items-center items-stretch">
          <!-- Title with Tailwind text color -->
          <h2 class="m-0 text-[1.75rem] text-text-primary">Projects</h2>
          <!-- Actions: responsive flex layout -->
          <div class="flex gap-3 items-center md:flex-row flex-col">
            <!-- PrimeVue Select for sort selection -->
            <Select
              v-model="sortBy"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sort by..."
              class="min-w-[200px]"
            />
            <!-- PrimeVue Button with animate-spin for icon -->
            <Button
              @click="handleRescan"
              :disabled="scanning"
              :label="scanning ? 'Scanning...' : 'Rescan'"
              icon="pi pi-refresh"
              :class="{ 'animate-spin-icon': scanning }"
            />
          </div>
        </div>

        <!-- Loading State -->
        <LoadingState v-if="projectsStore.isLoading" message="Loading projects..." />

        <!-- Error State -->
        <ErrorState
          v-else-if="projectsStore.error"
          title="Error Loading Projects"
          :message="projectsStore.error"
          retryText="Retry"
          @retry="loadProjects"
        />

        <!-- Empty State -->
        <EmptyState
          v-else-if="sortedProjects.length === 0"
          icon="pi pi-folder"
          title="No Projects Found"
          message="Add projects in Claude Code and click 'Rescan' to see them here."
        />

        <!-- Projects Grid with responsive auto-fill layout -->
        <div v-else class="grid gap-5 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
          <!-- Using PrimeVue Card component with passthrough props -->
          <Card
            v-for="project in sortedProjects"
            :key="project.id"
            :pt="projectCardPt"
            :class="['project-card', { 'user-card': project.isUser }]"
            @click="navigateToProject(project.id)"
          >
            <!-- Header slot -->
            <template #header>
              <div class="project-header">
                <i :class="project.isUser ? 'pi pi-user' : 'pi pi-folder'"></i>
                <h3 class="project-name">{{ project.name }}</h3>
              </div>
            </template>

            <!-- Content slot -->
            <template #content>
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
                <div class="stat stat-skills">
                  <i class="pi pi-sparkles"></i>
                  <span>{{ project.stats?.skills || 0 }} Skills</span>
                </div>
              </div>

              <div class="project-footer">
                <Button label="View" icon="pi pi-arrow-right" iconPos="right" class="view-btn" />
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import * as api from '@/api/client'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

export default {
  name: 'Dashboard',
  components: { Button, Card, Select, LoadingState, EmptyState, ErrorState },
  setup() {
    const router = useRouter()
    const projectsStore = useProjectsStore()

    const sortBy = ref('name-asc')
    const scanning = ref(false)
    const userConfig = ref(null)

    // Sort options for PrimeVue Dropdown
    const sortOptions = [
      { label: 'Name (A-Z)', value: 'name-asc' },
      { label: 'Name (Z-A)', value: 'name-desc' },
      { label: 'Most Agents', value: 'agents' },
      { label: 'Most Commands', value: 'commands' }
    ]

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

    // Header search event handler (extracted for cleanup)
    const handleHeaderSearch = (e) => {
      projectsStore.setSearchQuery(e.detail)
    }

    // Listen for search from header
    onMounted(async () => {
      if (!projectsStore.projects.length) {
        await loadProjects()
      } else {
        // Always load user config even if projects already loaded
        await loadUserConfig()
      }

      window.addEventListener('header-search', handleHeaderSearch)
    })

    // Cleanup event listener on unmount to prevent memory leak
    onBeforeUnmount(() => {
      window.removeEventListener('header-search', handleHeaderSearch)
    })

    // PrimeVue Card passthrough configuration
    const projectCardPt = {
      root: {
        class: 'project-card-root',
        style: { overflow: 'hidden' }
      },
      header: {
        class: 'project-card-header',
        style: {
          padding: '0',
          backgroundColor: 'transparent',
          border: 'none'
        }
      },
      body: {
        class: 'project-card-body',
        style: { padding: '0' }
      },
      content: {
        class: 'project-card-content',
        style: { padding: '1.5rem' }
      }
    }

    return {
      projectsStore,
      sortBy,
      sortOptions,
      scanning,
      sortedProjects,
      loadProjects,
      handleRescan,
      navigateToProject,
      projectCardPt
    }
  }
}
</script>

<style scoped>
/* Custom animation for spinning icon (Tailwind animate-spin targets the element itself) */
.animate-spin-icon :deep(.pi-refresh) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Project Card - PrimeVue Card customization */
.project-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-hover-md);
  transform: translateY(-2px);
}

/* User Card Variant */
.project-card.user-card {
  border-color: var(--color-user);
  background: var(--bg-primary);
}

.project-card.user-card:hover {
  border-color: var(--color-user);
  box-shadow: var(--shadow-hover-md);
}

/* Project Card Header */
.project-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem 0.75rem;
}

.project-header i {
  font-size: 1.5rem;
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
  flex: 1;
}

/* Project Card Content */
.project-path {
  font-size: 0.85rem;
  color: var(--text-secondary);
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 1rem;
}

.project-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
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

/* Domain-specific stat icon colors */
.stat-agents i { color: var(--color-agents); }
.stat-commands i { color: var(--color-commands); }
.stat-hooks i { color: var(--color-hooks); }
.stat-mcp i { color: var(--color-mcp); }
.stat-skills i { color: var(--color-skills); }

/* Project Card Footer */
.project-footer {
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-primary);
}

.view-btn {
  width: 100%;
}

/* Responsive breakpoints handled by Tailwind responsive modifiers in template */
</style>
