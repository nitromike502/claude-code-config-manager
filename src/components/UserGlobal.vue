<template>
  <div class="user-global">
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <router-link to="/" class="breadcrumb-link">
          <i class="pi pi-home"></i>
          Dashboard
        </router-link>
        <i class="pi pi-chevron-right breadcrumb-separator"></i>
        <span class="breadcrumb-current">User Configurations</span>
      </div>

      <!-- User Info Bar -->
      <div class="user-info-bar">
        <div class="user-info-title">
          <i class="pi pi-user"></i>
          <span>User Configurations</span>
        </div>
        <div class="user-info-subtitle">~/.claude</div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading user configurations...</p>
      </div>

      <!-- Config Cards Container -->
      <div v-else class="config-cards-container">
        <!-- Agents Card -->
        <ConfigCard
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
        >
          <template #default="{ items }">
            <ConfigItemList
              :items="items"
              item-type="agents"
              @item-selected="(item) => showDetail(item, 'agents', agents)"
            />
          </template>
        </ConfigCard>

        <!-- Commands Card -->
        <ConfigCard
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
        >
          <template #default="{ items }">
            <ConfigItemList
              :items="items"
              item-type="commands"
              @item-selected="(item) => showDetail(item, 'commands', commands)"
            />
          </template>
        </ConfigCard>

        <!-- Hooks Card -->
        <ConfigCard
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
        >
          <template #default="{ items }">
            <ConfigItemList
              :items="items"
              item-type="hooks"
              @item-selected="(item) => showDetail(item, 'hooks', hooks)"
            />
          </template>
        </ConfigCard>

        <!-- MCP Servers Card -->
        <ConfigCard
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
        >
          <template #default="{ items }">
            <ConfigItemList
              :items="items"
              item-type="mcp"
              @item-selected="(item) => showDetail(item, 'mcp', mcpServers)"
            />
          </template>
        </ConfigCard>
      </div>
    </div>

    <!-- Sidebar Overlay -->
    <div v-if="sidebarVisible" class="sidebar-overlay" @click="sidebarVisible = false"></div>

    <!-- Detail Sidebar -->
    <div v-if="sidebarVisible" class="sidebar" @click.stop>
      <div class="sidebar-header">
        <div class="sidebar-header-title">
          <i :class="typeIcon" :style="{ color: typeColor }"></i>
          <span>{{ selectedItem?.name || selectedItem?.event || 'Item Details' }}</span>
        </div>
        <div class="sidebar-nav">
          <button @click="navigatePrev" :disabled="!hasPrev" class="nav-btn">
            <i class="pi pi-chevron-left"></i>
          </button>
          <button @click="navigateNext" :disabled="!hasNext" class="nav-btn">
            <i class="pi pi-chevron-right"></i>
          </button>
          <button @click="sidebarVisible = false" class="close-btn">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <div class="sidebar-content">
        <div class="sidebar-section">
          <h4>Metadata</h4>
          <div v-if="selectedType === 'agents'">
            <p><strong>Name:</strong> {{ selectedItem.name }}</p>
            <p><strong>Description:</strong> {{ selectedItem.description }}</p>
            <p><strong>Color:</strong> {{ selectedItem.color || 'Not specified' }}</p>
            <p><strong>Model:</strong> {{ selectedItem.model || 'inherit' }}</p>
            <p v-if="selectedItem.tools && selectedItem.tools.length > 0">
              <strong>Allowed Tools:</strong> {{ selectedItem.tools.join(', ') }}
            </p>
            <p v-else-if="selectedItem.tools && selectedItem.tools.length === 0">
              <strong>Allowed Tools:</strong> None specified
            </p>
          </div>
          <div v-else-if="selectedType === 'commands'">
            <p><strong>Name:</strong> {{ selectedItem.name }}</p>
            <p><strong>Description:</strong> {{ selectedItem.description }}</p>
            <p v-if="selectedItem.namespace"><strong>Namespace:</strong> {{ selectedItem.namespace }}</p>
            <p v-if="selectedItem.tools && selectedItem.tools.length > 0">
              <strong>Allowed Tools:</strong> {{ selectedItem.tools.join(', ') }}
            </p>
            <p v-else-if="selectedItem.tools && selectedItem.tools.length === 0">
              <strong>Allowed Tools:</strong> None specified
            </p>
          </div>
          <div v-else-if="selectedType === 'hooks'">
            <p><strong>Event:</strong> {{ selectedItem.event }}</p>
            <p><strong>Pattern:</strong> {{ selectedItem.pattern }}</p>
            <p v-if="selectedItem.command"><strong>Command:</strong> {{ selectedItem.command }}</p>
          </div>
          <div v-else-if="selectedType === 'mcp'">
            <p><strong>Name:</strong> {{ selectedItem.name }}</p>
            <p><strong>Transport:</strong> {{ selectedItem.transport }}</p>
            <p v-if="selectedItem.command"><strong>Command:</strong> {{ selectedItem.command }}</p>
          </div>
        </div>

        <div v-if="selectedItem?.content" class="sidebar-section">
          <h4>Content</h4>
          <pre class="content-preview">{{ selectedItem.content }}</pre>
        </div>
      </div>

      <div class="sidebar-footer">
        <button @click="sidebarVisible = false" class="action-btn close-action-btn">
          <i class="pi pi-times"></i>
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { userAPI } from '../frontend/js/api'
import ConfigCard from './cards/ConfigCard.vue'
import ConfigItemList from './cards/ConfigItemList.vue'

export default {
  name: 'UserGlobal',
  components: {
    ConfigCard,
    ConfigItemList
  },
  setup() {
    const agents = ref([])
    const commands = ref([])
    const hooks = ref([])
    const mcpServers = ref([])

    const loading = ref(true)
    const loadingAgents = ref(false)
    const loadingCommands = ref(false)
    const loadingHooks = ref(false)
    const loadingMCP = ref(false)

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

    // Load user data
    const loadUserData = async () => {
      loading.value = true

      try {
        await Promise.all([
          loadAgents(),
          loadCommands(),
          loadHooks(),
          loadMCP()
        ])
      } catch (err) {
        console.error('Error loading user data:', err)
      } finally {
        loading.value = false
      }
    }

    const loadAgents = async () => {
      loadingAgents.value = true
      try {
        const data = await userAPI.getAgents()
        agents.value = data.agents || []
      } catch (err) {
        console.error('Error loading agents:', err)
        agents.value = []
      } finally {
        loadingAgents.value = false
      }
    }

    const loadCommands = async () => {
      loadingCommands.value = true
      try {
        const data = await userAPI.getCommands()
        commands.value = data.commands || []
      } catch (err) {
        console.error('Error loading commands:', err)
        commands.value = []
      } finally {
        loadingCommands.value = false
      }
    }

    const loadHooks = async () => {
      loadingHooks.value = true
      try {
        const data = await userAPI.getHooks()
        hooks.value = data.hooks || []
      } catch (err) {
        console.error('Error loading hooks:', err)
        hooks.value = []
      } finally {
        loadingHooks.value = false
      }
    }

    const loadMCP = async () => {
      loadingMCP.value = true
      try {
        const data = await userAPI.getMCP()
        mcpServers.value = data.mcp || []
      } catch (err) {
        console.error('Error loading MCP servers:', err)
        mcpServers.value = []
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


    onMounted(() => {
      loadUserData()
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

    // Cleanup: restore body scroll when component unmounts
    onBeforeUnmount(() => {
      document.body.style.overflow = ''
    })

    return {
      agents,
      commands,
      hooks,
      mcpServers,
      loading,
      loadingAgents,
      loadingCommands,
      loadingHooks,
      loadingMCP,
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
      hasPrev,
      hasNext,
      typeIcon,
      typeColor,
      showDetail,
      navigatePrev,
      navigateNext
    }
  }
}
</script>

<style scoped>
.user-global {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* User Info Bar */
.user-info-bar {
  margin-bottom: 2rem;
}

.user-info-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.user-info-title i {
  font-size: 1.75rem;
  color: var(--color-user);
}

.user-info-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-left: 2.5rem;
}

/* Breadcrumbs */
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
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--primary-color-dark);
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

/* Loading State */
.loading-container {
  text-align: center;
  padding: 3rem 1rem;
}

.spinner {
  border: 3px solid var(--surface-border);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-container p {
  color: var(--text-secondary);
}

/* Config Cards Container */
.config-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 1.5rem;
}

/* Sidebar Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  background: var(--surface-card);
  border-left: 1px solid var(--surface-border);
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
  border-bottom: 1px solid var(--surface-border);
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
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled),
.close-btn:hover {
  background: var(--surface-ground);
  border-color: var(--primary-color);
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

.content-preview {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid var(--surface-border);
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
  border-top: 1px solid var(--surface-border);
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--primary-color);
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
  background: var(--primary-color-dark);
}

/* Responsive */
@media (max-width: 1200px) {
  .config-cards-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>
