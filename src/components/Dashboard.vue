<template>
  <!-- PHASE 2: Replace .dashboard/.main-content/.dashboard-container with Tailwind utility classes
       Current: Custom CSS with flex, padding, max-width
       Tailwind: class="w-full" / class="px-8 py-8" / class="max-w-7xl mx-auto" -->
  <div class="dashboard">
    <!-- PHASE 2: Replace .main-content with px-8 py-8 (padding: 2rem) -->
    <div class="main-content">
      <!-- PHASE 2: Replace .dashboard-container with max-w-7xl mx-auto (max-width: 1400px; margin: auto) -->
      <div class="dashboard-container">
        <!-- PHASE 2: Replace .dashboard-header flex layout with Tailwind
             Current: display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem
             Tailwind: class="flex justify-between items-center flex-wrap gap-4" -->
        <div class="dashboard-header">
          <!-- PHASE 2: Replace h2 styling with Tailwind
               Current: font-size: 1.75rem; color: var(--text-primary)
               Tailwind: class="text-2xl text-slate-100 dark:text-slate-100" -->
          <h2>Projects</h2>
          <!-- PHASE 2: Replace .dashboard-actions flex layout with Tailwind
               Current: display: flex; gap: 0.75rem; align-items: center
               Tailwind: class="flex gap-3 items-center" -->
          <div class="dashboard-actions">
            <!-- PHASE 2: Replace .sort-dropdown with Tailwind form styling
                 Current: Custom styling with border, background, color, font-size
                 Tailwind: class="px-4 py-2 border border-slate-600 rounded bg-slate-800 text-slate-100 text-sm cursor-pointer min-w-[200px]"
                 Hover: class="hover:border-blue-500" -->
            <select v-model="sortBy" class="sort-dropdown">
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="agents">Most Agents</option>
              <option value="commands">Most Commands</option>
            </select>
            <!-- PHASE 2: PrimeVue Button component - Keep as-is (PrimeVue provides Tailwind-like theming)
                 Note: .rescan-btn styling will be removed - Button component handles styling
                 Spinning animation (keyframe spin) will be managed by Tailwind animation classes
                 Alternative: animate-spin utility class, or custom animation via Tailwind config -->
            <Button
              @click="handleRescan"
              :disabled="scanning"
              :label="scanning ? 'Scanning...' : 'Rescan'"
              icon="pi pi-refresh"
              :iconClass="{ spinning: scanning }"
              class="rescan-btn"
            />
          </div>
        </div>

        <!-- Loading State -->
        <!-- PHASE 2: Replace .loading-container with Tailwind
             Current: text-align: center; padding: 3rem 1rem
             Tailwind: class="text-center py-12 px-4" -->
        <div v-if="projectsStore.isLoading" class="loading-container">
          <!-- PHASE 2: Replace .spinner with Tailwind
               Current: Custom border animation with 40px size
               Tailwind: class="w-10 h-10 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"
               Note: animate-spin utility handles rotation, no need for custom @keyframes -->
          <div class="spinner"></div>
          <!-- PHASE 2: Replace paragraph color with Tailwind
               Current: color: var(--text-secondary)
               Tailwind: class="text-slate-400" -->
          <p>Loading projects...</p>
        </div>

        <!-- Error State -->
        <!-- PHASE 2: Replace .error-state with Tailwind
             Current: text-align: center; padding: 3rem 1rem; color: var(--color-error)
             Tailwind: class="text-center py-12 px-4 text-red-500" -->
        <div v-else-if="projectsStore.error" class="error-state">
          <!-- PHASE 2: Replace h4 styling with Tailwind
               Current: font-size: 1.25rem; margin: 0 0 0.5rem 0
               Tailwind: class="text-xl mb-2" -->
          <h4>Error Loading Projects</h4>
          <!-- PHASE 2: Replace paragraph with Tailwind
               Current: margin: 0 0 1.5rem 0
               Tailwind: class="mb-6" -->
          <p>{{ projectsStore.error }}</p>
          <!-- PHASE 2: PrimeVue Button - Keep severity="danger" (PrimeVue theming)
               Note: .retry-btn styling will be removed, Button component handles styling -->
          <Button @click="loadProjects" label="Retry" severity="danger" class="retry-btn" />
        </div>

        <!-- Empty State -->
        <!-- PHASE 2: Replace .empty-state with Tailwind
             Current: text-align: center; padding: 4rem 1rem; color: var(--text-secondary)
             Tailwind: class="text-center py-16 px-4 text-slate-400" -->
        <div v-else-if="sortedProjects.length === 0" class="empty-state">
          <!-- PHASE 2: Replace .empty-state i with Tailwind
               Current: font-size: 4rem; opacity: 0.3; margin-bottom: 1rem
               Tailwind: class="text-6xl opacity-30 mb-4" -->
          <i class="pi pi-folder"></i>
          <!-- PHASE 2: Replace h3 with Tailwind
               Current: font-size: 1.5rem; margin: 0 0 0.5rem 0; color: var(--text-primary)
               Tailwind: class="text-2xl mb-2 text-slate-100" -->
          <h3>No Projects Found</h3>
          <!-- PHASE 2: Replace p with Tailwind
               Current: margin: 0; font-size: 1rem
               Tailwind: class="text-base" -->
          <p>Add projects in Claude Code and click "Rescan" to see them here.</p>
        </div>

        <!-- Projects Grid -->
        <!-- PHASE 2: Replace .project-grid with Tailwind
             Current: display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem
             Tailwind: class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-fit"
             Note: Tailwind auto-fit not directly available, use grid-cols-[repeat(auto-fit,minmax(320px,1fr))] or responsive cols -->
        <div v-else class="project-grid">
          <!-- PHASE 2: Replace .project-card flex layout with Tailwind
               Current: background, border, padding, flex-direction: column, gap, cursor, transition, hover effects
               Tailwind: class="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col gap-4 cursor-pointer transition-all hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5"
               Note: user-card variant styling (different border/background) will be handled with conditional classes -->
          <div
            v-for="project in sortedProjects"
            :key="project.id"
            class="project-card"
            :class="{ 'user-card': project.isUser }"
            @click="navigateToProject(project.id)"
          >
            <!-- PHASE 2: Replace .project-header flex with Tailwind
                 Current: display: flex; align-items: center; gap: 0.75rem
                 Tailwind: class="flex items-center gap-3" -->
            <div class="project-header">
              <!-- PHASE 2: Replace icon color with Tailwind
                   Current: font-size: 1.5rem; color: var(--color-primary) / var(--color-user)
                   Tailwind: class="text-2xl text-blue-500" or "text-2xl text-purple-500" (for user-card) -->
              <i :class="project.isUser ? 'pi pi-user' : 'pi pi-folder'"></i>
              <!-- PHASE 2: Replace .project-name with Tailwind
                   Current: font-size: 1.1rem; color: var(--text-primary); font-weight: 600; text-overflow: ellipsis
                   Tailwind: class="text-lg text-slate-100 font-semibold truncate" -->
              <h3 class="project-name">{{ project.name }}</h3>
            </div>

            <!-- PHASE 2: Replace .project-path with Tailwind
                 Current: font-size: 0.85rem; color: var(--text-secondary); line-clamp: 2
                 Tailwind: class="text-sm text-slate-400 line-clamp-2" -->
            <div class="project-path">{{ project.path }}</div>

            <!-- PHASE 2: Replace .project-stats grid with Tailwind
                 Current: display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem
                 Tailwind: class="grid grid-cols-2 gap-2" -->
            <div class="project-stats">
              <!-- PHASE 2: Replace .stat flex with Tailwind
                   Current: display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem
                   Tailwind: class="flex items-center gap-2 text-sm text-slate-400" -->
              <div class="stat stat-agents">
                <!-- PHASE 2: Replace icon colors with Tailwind
                     Current: var(--color-agents) = green / var(--color-commands) = blue, etc.
                     Tailwind: class="text-green-500" / class="text-blue-500" / class="text-amber-500" / class="text-purple-500" -->
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

            <!-- PHASE 2: Replace .project-footer with Tailwind
                 Current: margin-top: auto; padding-top: 0.5rem; border-top: 1px solid var(--border-primary)
                 Tailwind: class="mt-auto pt-2 border-t border-slate-700" -->
            <div class="project-footer">
              <!-- PHASE 2: PrimeVue Button - Keep as-is (PrimeVue provides theming)
                   Note: .view-btn styling will be removed, Button component handles styling -->
              <Button label="View" icon="pi pi-arrow-right" iconPos="right" class="view-btn" />
            </div>
          </div>
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

export default {
  name: 'Dashboard',
  components: { Button },
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

    // Header search event handler (extracted for cleanup)
    const handleHeaderSearch = (e) => {
      projectsStore.setSearchQuery(e.detail)
    }

    // Listen for search from header (backwards compat with Phase 1)
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

<!-- PHASE 2: Complete stylesheet migration from custom CSS to Tailwind
     This entire <style> block will be removed and replaced with Tailwind utility classes
     applied directly to template elements. See template comments for Tailwind equivalents.

     Migration Strategy:
     1. Layout utilities (flex, grid, gap) - Tailwind layout classes
     2. Spacing (padding, margin) - Tailwind p-*, m-*, px-*, py-* classes
     3. Colors (CSS variables) - Tailwind color classes (slate-*, blue-*, etc.)
     4. Typography (font-size, font-weight) - Tailwind text-*, font-* classes
     5. Shadows & transitions - Tailwind shadow-*, transition-* classes
     6. Responsive (media queries) - Tailwind responsive modifiers (md:, lg:, xl:)
     7. Animations (@keyframes) - Tailwind animate-* utilities (e.g., animate-spin)
-->

<style scoped>
/* PHASE 2: DELETE .dashboard (replaced with w-full) */
.dashboard {
  width: 100%;
}

/* PHASE 2: DELETE .main-content (replaced with px-8 py-8) */
.main-content {
  padding: 2rem;
}

/* PHASE 2: DELETE .dashboard-container (replaced with max-w-7xl mx-auto) */
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* PHASE 2: DELETE .dashboard-header (replaced with flex justify-between items-center flex-wrap gap-4) */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

/* PHASE 2: DELETE .dashboard-header h2 (replaced with text-2xl text-slate-100) */
.dashboard-header h2 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--text-primary);
}

/* PHASE 2: DELETE .dashboard-actions (replaced with flex gap-3 items-center) */
.dashboard-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* PHASE 2: DELETE .sort-dropdown and convert to Tailwind form styling
   New Tailwind classes: px-4 py-2 border border-slate-600 rounded bg-slate-800 text-slate-100 text-sm cursor-pointer min-w-[200px]
   Hover: hover:border-blue-500 -->
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

/* PHASE 2: DELETE .rescan-btn (PrimeVue Button handles styling)
   Note: Button component in PrimeVue already applies appropriate styling
   No need for .rescan-btn custom CSS -->
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

/* PHASE 2: DELETE .rescan-btn i.spinning
   Replace with Tailwind: animate-spin (uses built-in rotate animation)
   No custom @keyframes needed -->
.rescan-btn i.spinning {
  animation: spin 1s linear infinite;
}

/* PHASE 2: DELETE @keyframes spin
   Tailwind provides animate-spin utility that handles rotation 360deg -->
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* PHASE 2: Loading State */
/* DELETE .loading-container (replaced with text-center py-12 px-4) */
.loading-container {
  text-align: center;
  padding: 3rem 1rem;
}

/* DELETE .spinner (replaced with Tailwind spin animation)
   Tailwind: w-10 h-10 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4 -->
.spinner {
  border: 3px solid var(--border-primary);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

/* DELETE .loading-container p (replaced with text-slate-400) */
.loading-container p {
  color: var(--text-secondary);
}

/* PHASE 2: Error State */
/* DELETE .error-state (replaced with text-center py-12 px-4 text-red-500) */
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-error);
}

/* DELETE .error-state h4 (replaced with text-xl mb-2) */
.error-state h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

/* DELETE .error-state p (replaced with mb-6) */
.error-state p {
  margin: 0 0 1.5rem 0;
}

/* DELETE .retry-btn (PrimeVue Button handles styling) */
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

/* PHASE 2: Empty State */
/* DELETE .empty-state (replaced with text-center py-16 px-4 text-slate-400) */
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-secondary);
}

/* DELETE .empty-state i (replaced with text-6xl opacity-30 mb-4) */
.empty-state i {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: 1rem;
}

/* DELETE .empty-state h3 (replaced with text-2xl mb-2 text-slate-100) */
.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

/* DELETE .empty-state p (replaced with text-base) */
.empty-state p {
  margin: 0;
  font-size: 1rem;
}

/* PHASE 2: Projects Grid */
/* DELETE .project-grid (replaced with grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5)
   Note: auto-fill responsive column sizing will use grid-cols-[repeat(auto-fit,minmax(320px,1fr))] or responsive breakdown -->
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

/* DELETE .project-card (replaced with bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col gap-4...)
   Includes hover states: hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5 -->
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
  box-shadow: var(--shadow-hover-md);
  transform: translateY(-2px);
}

/* DELETE .project-card.user-card variant (replaced with user-card:border-purple-500 user-card:bg-slate-700) -->
.project-card.user-card {
  border-color: var(--color-user);
  background: var(--bg-primary);
}

.project-card.user-card:hover {
  border-color: var(--color-user);
  box-shadow: var(--shadow-hover-md);
}

/* DELETE .project-header (replaced with flex items-center gap-3) */
.project-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* DELETE .project-header i (replaced with text-2xl text-blue-500) */
.project-header i {
  font-size: 1.5rem;
  color: var(--color-primary);
}

/* DELETE .user-card .project-header i (replaced with user-card:text-purple-500) -->
.user-card .project-header i {
  color: var(--color-user);
}

/* DELETE .project-name (replaced with text-lg text-slate-100 font-semibold truncate) */
.project-name {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* DELETE .project-path (replaced with text-sm text-slate-400 line-clamp-2) */
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

/* DELETE .project-stats (replaced with grid grid-cols-2 gap-2) */
.project-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

/* DELETE .stat (replaced with flex items-center gap-2 text-sm text-slate-400) */
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

/* DELETE .stat-agents/commands/hooks/mcp icon colors
   Replace with Tailwind color modifiers:
   - stat-agents i: text-green-500
   - stat-commands i: text-blue-500
   - stat-hooks i: text-amber-500
   - stat-mcp i: text-purple-500 -->
.stat-agents i { color: var(--color-agents); }
.stat-commands i { color: var(--color-commands); }
.stat-hooks i { color: var(--color-hooks); }
.stat-mcp i { color: var(--color-mcp); }

/* DELETE .project-footer (replaced with mt-auto pt-2 border-t border-slate-700) */
.project-footer {
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-primary);
}

/* DELETE .view-btn (PrimeVue Button handles styling) */
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

/* PHASE 2: Responsive Breakpoints
   Current: Single @media query at 768px
   Tailwind: Responsive modifiers built into utility classes
   - sm: (640px) - md:, lg:, xl:, 2xl: modifiers in template classes
   - Example: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
   - No need for separate @media blocks */
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
