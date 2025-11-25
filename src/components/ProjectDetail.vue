<template>
  <div class="flex min-h-screen">
    <div class="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
      <!-- Breadcrumbs -->
      <BreadcrumbNavigation
        :items="[
          { label: 'Dashboard', route: '/', icon: 'pi pi-home' },
          { label: projectName, route: null, icon: null }
        ]"
      />

      <!-- Project Info Bar -->
      <div class="mb-8">
        <div class="flex items-center gap-3 text-2xl font-semibold mb-2" style="color: var(--text-primary)">
          <i class="pi pi-folder text-[1.75rem]" style="color: var(--color-primary)"></i>
          <span>{{ projectName }}</span>
        </div>
        <div class="text-sm ml-10" style="color: var(--text-secondary)">{{ projectPath }}</div>
      </div>

      <!-- Loading State -->
      <LoadingState v-if="loading" message="Loading project details..." />

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12 px-4 rounded-lg mt-8" style="background: var(--bg-secondary); border: 1px solid var(--border-primary)">
        <i class="pi pi-exclamation-triangle text-5xl mb-4" style="color: var(--color-error)"></i>
        <p class="text-base mb-6" style="color: var(--text-primary)">{{ errorMessage }}</p>
        <Button @click="retryLoad" label="Retry" icon="pi pi-refresh" severity="danger" />
      </div>

      <!-- Content Area (warnings + config cards) -->
      <div v-else>
        <!-- Warning Banner -->
        <div v-if="warnings.length > 0" class="rounded-lg p-4 md:p-6 mb-6" style="background: var(--color-warning-bg); border: 1px solid var(--color-warning)">
          <div class="flex items-center gap-3 font-semibold mb-2" style="color: var(--color-warning)">
            <i class="pi pi-exclamation-circle text-xl"></i>
            <span>{{ warnings.length }} Warning{{ warnings.length > 1 ? 's' : '' }}</span>
          </div>
          <ul class="list-disc ml-8" style="color: var(--color-warning)">
            <li v-for="(warning, index) in warnings" :key="index" class="my-1 text-sm">
              <template v-if="typeof warning === 'string'">{{ warning }}</template>
              <template v-else>{{ warning.message || warning }}</template>
            </li>
          </ul>
        </div>

        <!-- Config Panels Container -->
        <div class="grid gap-6 xl:grid-cols-2">
        <!-- Agents Panel -->
        <ConfigPanel
          card-type="agents"
          title="Subagents"
          :count="agents.length"
          icon="pi pi-users"
          color="var(--color-agents)"
          :loading="loadingAgents"
          :items="agents"
          :showing-all="showingAllAgents"
          :initial-display-count="initialDisplayCount"
          @toggle-show-all="showingAllAgents = !showingAllAgents"
          @copy-clicked="handleCopyClick"
        >
          <template #default="{ items }">
            <ConfigItemList
              :items="items"
              item-type="agents"
              @item-selected="(item) => showDetail(item, 'agents', agents)"
              @copy-clicked="handleCopyClick"
            />
          </template>
        </ConfigPanel>

        <!-- Commands Panel -->
        <ConfigPanel
          card-type="commands"
          title="Slash Commands"
          :count="commands.length"
          icon="pi pi-bolt"
          color="var(--color-commands)"
          :loading="loadingCommands"
          :items="commands"
          :showing-all="showingAllCommands"
          :initial-display-count="initialDisplayCount"
          @toggle-show-all="showingAllCommands = !showingAllCommands"
          @copy-clicked="handleCopyClick"
        >
          <template #default="{ items }">
            <ConfigItemList
              :items="items"
              item-type="commands"
              @item-selected="(item) => showDetail(item, 'commands', commands)"
              @copy-clicked="handleCopyClick"
            />
          </template>
        </ConfigPanel>

        <!-- Hooks Panel -->
        <ConfigPanel
          card-type="hooks"
          title="Hooks"
          :count="hooks.length"
          icon="pi pi-link"
          color="var(--color-hooks)"
          :loading="loadingHooks"
          :items="hooks"
          :showing-all="showingAllHooks"
          :initial-display-count="initialDisplayCount"
          @toggle-show-all="showingAllHooks = !showingAllHooks"
          @copy-clicked="handleCopyClick"
        >
          <template #default="{ items }">
            <ConfigItemList
              :items="items"
              item-type="hooks"
              @item-selected="(item) => showDetail(item, 'hooks', hooks)"
              @copy-clicked="handleCopyClick"
            />
          </template>
        </ConfigPanel>

        <!-- MCP Servers Panel -->
        <ConfigPanel
          card-type="mcp"
          title="MCP Servers"
          :count="mcpServers.length"
          icon="pi pi-server"
          color="var(--color-mcp)"
          :loading="loadingMCP"
          :items="mcpServers"
          :showing-all="showingAllMcp"
          :initial-display-count="initialDisplayCount"
          @toggle-show-all="showingAllMcp = !showingAllMcp"
          @copy-clicked="handleCopyClick"
        >
          <template #default="{ items }">
            <ConfigItemList
              :items="items"
              item-type="mcp"
              @item-selected="(item) => showDetail(item, 'mcp', mcpServers)"
              @copy-clicked="handleCopyClick"
            />
          </template>
        </ConfigPanel>
        </div>
      </div>
    </div>

    <!-- Sidebar Overlay -->
    <div v-if="sidebarVisible" class="fixed inset-0 z-[999] animate-fade-in" style="background: rgba(0, 0, 0, 0.5)" @click="sidebarVisible = false"></div>

    <!-- Detail Sidebar Component -->
    <ConfigDetailSidebar
      :visible="sidebarVisible"
      :selected-item="selectedItem"
      :selected-type="selectedType"
      :current-items="currentItems"
      :selected-index="currentIndex"
      @close="sidebarVisible = false"
      @navigate="onNavigate"
      @copy-clicked="handleCopyClick"
    />

    <!-- Copy Modal -->
    <CopyModal
      v-if="selectedConfig"
      v-model:visible="showCopyModal"
      :sourceConfig="selectedConfig"
      @copy-success="handleCopySuccess"
      @copy-error="handleCopyError"
      @copy-cancelled="handleCopyCancelled"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import * as api from '@/api/client'
import Button from 'primevue/button'
import ConfigPanel from '@/components/cards/ConfigPanel.vue'
import ConfigItemList from '@/components/cards/ConfigItemList.vue'
import BreadcrumbNavigation from '@/components/common/BreadcrumbNavigation.vue'
import ConfigDetailSidebar from '@/components/sidebars/ConfigDetailSidebar.vue'
import CopyModal from '@/components/copy/CopyModal.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { useCopyStore } from '@/stores/copy-store'
import { useProjectsStore } from '@/stores/projects'

export default {
  name: 'ProjectDetail',
  components: { Button, ConfigPanel, ConfigItemList, BreadcrumbNavigation, ConfigDetailSidebar, CopyModal, LoadingState },
  props: ['id'],
  setup(props) {
    const route = useRoute()
    const toast = useToast()
    const copyStore = useCopyStore()
    const projectsStore = useProjectsStore()

    const projectId = computed(() => props.id || route.params.id)
    const projectName = ref('')
    const projectPath = ref('')

    const agents = ref([])
    const commands = ref([])
    const hooks = ref([])
    const mcpServers = ref([])

    // Copy modal state
    const showCopyModal = ref(false)
    const selectedConfig = ref(null)

    const loading = ref(true)
    const loadingAgents = ref(false)
    const loadingCommands = ref(false)
    const loadingHooks = ref(false)
    const loadingMCP = ref(false)

    const error = ref(false)
    const errorMessage = ref('')
    const warnings = ref([])

    const initialDisplayCount = 5
    const showingAllAgents = ref(false)
    const showingAllCommands = ref(false)
    const showingAllHooks = ref(false)
    const showingAllMcp = ref(false)

    const sidebarVisible = ref(false)
    const selectedItem = ref(null)
    const selectedType = ref(null)
    const currentItems = ref([])
    const currentIndex = ref(-1)

    // Computed: displayed items with show more/less
    const displayedAgents = computed(() => {
      return showingAllAgents.value ? agents.value : agents.value.slice(0, initialDisplayCount)
    })

    const displayedCommands = computed(() => {
      return showingAllCommands.value ? commands.value : commands.value.slice(0, initialDisplayCount)
    })

    const displayedHooks = computed(() => {
      return showingAllHooks.value ? hooks.value : hooks.value.slice(0, initialDisplayCount)
    })

    const displayedMcp = computed(() => {
      return showingAllMcp.value ? mcpServers.value : mcpServers.value.slice(0, initialDisplayCount)
    })

    // Computed: sidebar navigation
    const hasPrev = computed(() => currentIndex.value > 0)
    const hasNext = computed(() => currentIndex.value < currentItems.value.length - 1)

    const typeIcon = computed(() => {
      const icons = {
        agents: 'pi pi-users',
        commands: 'pi pi-bolt',
        hooks: 'pi pi-link',
        mcp: 'pi pi-server'
      }
      return icons[selectedType.value] || 'pi pi-file'
    })

    const typeColor = computed(() => {
      // For agents, use the defined color if available
      if (selectedType.value === 'agents' && selectedItem.value?.color) {
        return selectedItem.value.color
      }

      // Otherwise use default type colors
      const colors = {
        agents: 'var(--color-agents)',
        commands: 'var(--color-commands)',
        hooks: 'var(--color-hooks)',
        mcp: 'var(--color-mcp)'
      }
      return colors[selectedType.value] || 'var(--text-primary)'
    })

    // Load project data
    const loadProjectData = async () => {
      loading.value = true
      error.value = false
      errorMessage.value = ''
      warnings.value = []

      // Validate project ID
      if (!projectId.value) {
        error.value = true
        errorMessage.value = 'No project ID provided in URL'
        loading.value = false
        return
      }

      // Decode project ID to get path
      projectPath.value = decodeURIComponent(projectId.value)
      projectName.value = projectPath.value.split('/').pop()

      try {
        // Use allSettled to allow individual config loads to fail without breaking the entire page
        const results = await Promise.allSettled([
          loadAgents(),
          loadCommands(),
          loadHooks(),
          loadMCP()
        ])

        // Check if ALL config loads failed
        const allFailed = results.every(result => result.status === 'rejected')

        if (allFailed) {
          // If all config loads failed, show error state instead of warnings
          error.value = true
          const firstError = results[0].reason

          // Determine error message based on error type
          const errorMsg = firstError?.message || ''

          if (errorMsg.includes('404') || errorMsg.includes('400') || errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('bad request')) {
            errorMessage.value = 'Project not found'
          } else if (errorMsg.includes('500') || errorMsg.toLowerCase().includes('internal server error') ||
                     errorMsg.toLowerCase().includes('failed to fetch') || errorMsg.toLowerCase().includes('network') ||
                     firstError?.name === 'TypeError' || firstError?.name === 'NetworkError') {
            errorMessage.value = 'Failed to connect to server'
          } else {
            errorMessage.value = errorMsg || 'Failed to load project configurations'
          }
        } else {
          // Process results and collect warnings (only if not all failed)
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              // Success - collect warnings if any
              if (result.value?.warnings && result.value.warnings.length > 0) {
                warnings.value.push(...result.value.warnings)
              }
            } else {
              // Failed - log error but don't break the page
              const configNames = ['agents', 'commands', 'hooks', 'MCP servers']
              console.error(`Error loading ${configNames[index]}:`, result.reason)

              // Add warning message for this config type
              warnings.value.push({
                type: configNames[index],
                message: `Failed to load ${configNames[index]}: ${result.reason?.message || 'Unknown error'}`
              })
            }
          })
        }
      } catch (err) {
        // This catch should rarely trigger since allSettled doesn't reject
        console.error('Unexpected error loading project data:', err)
        error.value = true
        errorMessage.value = err.message || 'An unexpected error occurred while loading the project'
      } finally {
        loading.value = false
      }
    }

    // Retry loading after error
    const retryLoad = () => {
      loadProjectData()
    }

    const loadAgents = async () => {
      loadingAgents.value = true
      try {
        const data = await api.getProjectAgents(projectId.value)
        agents.value = data.agents || []
        return data
      } catch (err) {
        // Only log unexpected errors to console
        if (!err.isExpected) {
          console.error('Error loading agents:', err)
        }
        agents.value = []
        throw err
      } finally {
        loadingAgents.value = false
      }
    }

    const loadCommands = async () => {
      loadingCommands.value = true
      try {
        const data = await api.getProjectCommands(projectId.value)
        commands.value = data.commands || []
        return data
      } catch (err) {
        // Only log unexpected errors to console
        if (!err.isExpected) {
          console.error('Error loading commands:', err)
        }
        commands.value = []
        throw err
      } finally {
        loadingCommands.value = false
      }
    }

    const loadHooks = async () => {
      loadingHooks.value = true
      try {
        const data = await api.getProjectHooks(projectId.value)
        hooks.value = data.hooks || []
        return data
      } catch (err) {
        // Only log unexpected errors to console
        if (!err.isExpected) {
          console.error('Error loading hooks:', err)
        }
        hooks.value = []
        throw err
      } finally {
        loadingHooks.value = false
      }
    }

    const loadMCP = async () => {
      loadingMCP.value = true
      try {
        const data = await api.getProjectMcp(projectId.value)
        mcpServers.value = data.mcp || []
        return data
      } catch (err) {
        // Only log unexpected errors to console
        if (!err.isExpected) {
          console.error('Error loading MCP servers:', err)
        }
        mcpServers.value = []
        throw err
      } finally {
        loadingMCP.value = false
      }
    }

    // Sidebar actions
    const showDetail = (item, type, items) => {
      selectedItem.value = item
      selectedType.value = type
      currentItems.value = items
      currentIndex.value = items.findIndex(i => i === item)
      sidebarVisible.value = true
    }

    const navigatePrev = () => {
      if (hasPrev.value) {
        currentIndex.value--
        selectedItem.value = currentItems.value[currentIndex.value]
      }
    }

    const navigateNext = () => {
      if (hasNext.value) {
        currentIndex.value++
        selectedItem.value = currentItems.value[currentIndex.value]
      }
    }

    // Handle sidebar navigation from ConfigDetailSidebar component
    const onNavigate = (direction) => {
      if (direction === 'prev') {
        navigatePrev()
      } else if (direction === 'next') {
        navigateNext()
      }
    }

    // Copy modal handlers
    const handleCopyClick = (configItem) => {
      // Normalize configType to type and add projectId for CopyModal compatibility
      const normalizedConfig = {
        ...configItem,
        type: configItem.configType || configItem.type,
        projectId: projectId.value
      };
      selectedConfig.value = normalizedConfig
      showCopyModal.value = true
    }

    const handleCopySuccess = async (result) => {
      showCopyModal.value = false

      // Show toast
      const filename = result.filename || result.source?.name || 'Configuration'
      toast.add({
        severity: 'success',
        summary: 'Configuration Copied',
        detail: `${filename} has been copied successfully`,
        life: 5000
      })

      // Refresh data if copied to current project
      const currentProjectId = route.params.id || props.id
      if (result.destination?.id === currentProjectId) {
        const configType = result.source?.type
        if (configType === 'agent') {
          await loadAgents()
        } else if (configType === 'command') {
          await loadCommands()
        } else if (configType === 'hook') {
          await loadHooks()
        } else if (configType === 'mcp') {
          await loadMCP()
        }
      }
    }

    const handleCopyError = (error) => {
      showCopyModal.value = false
      toast.add({
        severity: 'error',
        summary: 'Copy Failed',
        detail: error.message || 'An error occurred during the copy operation',
        life: 0  // Manual dismiss
      })
    }

    const handleCopyCancelled = () => {
      showCopyModal.value = false
      toast.add({
        severity: 'info',
        summary: 'Copy operation cancelled',
        detail: '',
        life: 3000
      })
    }

    // Watch for route changes
    watch(() => projectId.value, () => {
      loadProjectData()
    })

    // Watch for sidebar visibility to manage body scroll
    watch(() => sidebarVisible.value, (newVal) => {
      if (newVal) {
        // Disable body scroll when sidebar opens
        document.body.style.overflow = 'hidden'
      } else {
        // Re-enable body scroll when sidebar closes
        document.body.style.overflow = ''
      }
    })

    onMounted(() => {
      loadProjectData()
    })

    // Cleanup: restore body scroll when component unmounts
    onBeforeUnmount(() => {
      document.body.style.overflow = ''
    })

    return {
      projectId,
      projectName,
      projectPath,
      agents,
      commands,
      hooks,
      mcpServers,
      loading,
      loadingAgents,
      loadingCommands,
      loadingHooks,
      loadingMCP,
      error,
      errorMessage,
      warnings,
      retryLoad,
      initialDisplayCount,
      showingAllAgents,
      showingAllCommands,
      showingAllHooks,
      showingAllMcp,
      displayedAgents,
      displayedCommands,
      displayedHooks,
      displayedMcp,
      sidebarVisible,
      selectedItem,
      selectedType,
      currentItems,
      currentIndex,
      hasPrev,
      hasNext,
      typeIcon,
      typeColor,
      showDetail,
      navigatePrev,
      navigateNext,
      onNavigate,
      showCopyModal,
      selectedConfig,
      handleCopyClick,
      handleCopySuccess,
      handleCopyError,
      handleCopyCancelled
    }
  }
}
</script>

<style scoped>
/* Breadcrumbs - Will be replaced in TASK-5.2.3 */
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  font-size: 0.9rem;
  max-width: 960px;
  margin: -2rem auto 2rem auto;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.breadcrumb-link i {
  font-size: 0.85rem;
}

.breadcrumb-separator {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: 500;
}

/* Domain-Specific Card Styles - Preserve for component-specific behavior */
.config-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.config-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.config-header-left i {
  font-size: 1.5rem;
}

.config-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.expand-btn {
  width: 100%;
  padding: 0.75rem 0;
  background: transparent;
  color: var(--color-primary);
  border: none;
  border-top: 1px solid var(--border-primary);
  border-radius: 0;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
}

.expand-btn:hover {
  background: var(--bg-primary);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton {
  background: linear-gradient(90deg, var(--bg-primary) 0%, var(--border-primary) 50%, var(--bg-primary) 100%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  height: 60px;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

/* Items List */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  margin-bottom: 1rem;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 1rem;
}

.config-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-details-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  transition: all 0.2s;
}

.view-details-btn:hover {
  background: var(--color-primary);
  color: white;
}

/* Sidebar Overlay - Migrated to Tailwind classes in template */

/* Sidebar animation for fade-in */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease;
}

/* Sidebar */
.sidebar {
  position: fixed;
  right: 0;
  top: 0;
  width: 75vw;
  min-width: 500px;
  max-width: 75vw;
  height: 100vh;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-primary);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.sidebar-header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
}

.sidebar-header-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-nav {
  display: flex;
  gap: 0.5rem;
}

.nav-btn,
.close-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-primary);
}

.nav-btn i,
.close-btn i {
  color: var(--text-primary);
}

.nav-btn:hover:not(:disabled),
.close-btn:hover {
  background: var(--bg-primary);
  border-color: var(--color-primary);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.sidebar-section {
  margin-bottom: 1.5rem;
}

.sidebar-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-section p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.sidebar-section strong {
  color: var(--text-primary);
}

.sidebar-section code {
  background: var(--bg-primary);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--color-primary);
}

.content-preview {
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid var(--border-primary);
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-primary);
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.action-btn:hover {
  background: var(--color-primary-hover);
}

/* Responsive - Sidebar mobile behavior preserved */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
  }
}
</style>
