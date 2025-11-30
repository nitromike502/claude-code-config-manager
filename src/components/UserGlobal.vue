<template>
  <ConfigPageLayout
    page-title="User Configurations"
    page-subtitle="~/.claude"
    page-icon="pi pi-user"
    page-icon-color="var(--text-primary)"
    :breadcrumb-items="breadcrumbItems"
    :loading="loading"
    loading-message="Loading user configurations..."
    :loading-agents="loadingAgents"
    :loading-commands="loadingCommands"
    :loading-hooks="loadingHooks"
    :loading-mcp="loadingMCP"
    :loading-skills="loadingSkills"
    :error="false"
    error-message=""
    :warnings="[]"
    :agents="agents"
    :commands="commands"
    :hooks="hooks"
    :mcp-servers="mcpServers"
    :skills="skills"
    :showing-all-agents="showingAllAgents"
    :showing-all-commands="showingAllCommands"
    :showing-all-hooks="showingAllHooks"
    :showing-all-mcp="showingAllMcp"
    :showing-all-skills="showingAllSkills"
    :initial-display-count="initialDisplayCount"
    :sidebar-visible="sidebarVisible"
    :selected-item="selectedItem"
    :selected-type="selectedType"
    :current-items="currentItems"
    :selected-index="currentIndex"
    scope="user"
    :enable-agent-crud="true"
    @toggle-agents="showingAllAgents = !showingAllAgents"
    @toggle-commands="showingAllCommands = !showingAllCommands"
    @toggle-hooks="showingAllHooks = !showingAllHooks"
    @toggle-mcp="showingAllMcp = !showingAllMcp"
    @toggle-skills="showingAllSkills = !showingAllSkills"
    @show-detail="showDetail"
    @close-sidebar="sidebarVisible = false"
    @navigate="onNavigate"
    @copy-clicked="handleCopyClick"
    @agent-edit="handleAgentEdit"
    @agent-delete="handleAgentDelete"
  >
    <template #copy-modal>
      <CopyModal
        v-if="selectedConfig"
        v-model:visible="showCopyModal"
        :sourceConfig="selectedConfig"
        @copy-success="handleCopySuccess"
        @copy-error="handleCopyError"
        @copy-cancelled="handleCopyCancelled"
      />
    </template>
  </ConfigPageLayout>

  <!-- Agent Edit Dialog -->
  <AgentEditDialog
    v-if="editingAgent"
    v-model:visible="showEditDialog"
    :agent="editingAgent"
    :loading="agentEditLoading"
    @save="handleAgentSave"
    @cancel="handleAgentEditCancel"
  />

  <!-- Agent Delete Confirmation Dialog -->
  <DeleteConfirmationModal
    v-model:visible="showDeleteDialog"
    item-type="agent"
    :item-name="deletingAgent?.name || ''"
    :dependent-items="agentReferences"
    :loading="agentDeleteLoading"
    @confirm="handleAgentDeleteConfirm"
    @cancel="handleAgentDeleteCancel"
  />
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import * as api from '@/api/client'
import ConfigPageLayout from '@/components/layouts/ConfigPageLayout.vue'
import CopyModal from '@/components/copy/CopyModal.vue'
import AgentEditDialog from '@/components/dialogs/AgentEditDialog.vue'
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue'
import { useCopyStore } from '@/stores/copy-store'
import { useProjectsStore } from '@/stores/projects'
import { useAgentsStore } from '@/stores/agents'

export default {
  name: 'UserGlobal',
  components: {
    ConfigPageLayout,
    CopyModal,
    AgentEditDialog,
    DeleteConfirmationModal
  },
  setup() {
    // Initialize stores
    const toast = useToast()
    const copyStore = useCopyStore()
    const projectsStore = useProjectsStore()
    const agentsStore = useAgentsStore()

    const breadcrumbItems = [
      { label: 'Dashboard', route: '/', icon: 'pi pi-home' },
      { label: 'User Configurations', route: null, icon: null }
    ]

    const agents = ref([])
    const commands = ref([])
    const hooks = ref([])
    const mcpServers = ref([])
    const skills = ref([])

    const loading = ref(true)
    const loadingAgents = ref(false)
    const loadingCommands = ref(false)
    const loadingHooks = ref(false)
    const loadingMCP = ref(false)
    const loadingSkills = ref(false)

    const initialDisplayCount = 5
    const showingAllAgents = ref(false)
    const showingAllCommands = ref(false)
    const showingAllHooks = ref(false)
    const showingAllMcp = ref(false)
    const showingAllSkills = ref(false)

    const sidebarVisible = ref(false)
    const selectedItem = ref(null)
    const selectedType = ref(null)
    const currentItems = ref([])
    const currentIndex = ref(-1)

    // Copy modal state
    const showCopyModal = ref(false)
    const selectedConfig = ref(null)

    // Agent CRUD state
    const showEditDialog = ref(false)
    const editingAgent = ref(null)
    const agentEditLoading = ref(false)

    const showDeleteDialog = ref(false)
    const deletingAgent = ref(null)
    const agentDeleteLoading = ref(false)
    const agentReferences = ref([])

    // Load user data
    const loadUserData = async () => {
      loading.value = true

      try {
        // Use allSettled to allow individual config loads to fail without breaking the entire page
        const results = await Promise.allSettled([
          loadAgents(),
          loadCommands(),
          loadHooks(),
          loadMCP(),
          loadSkills()
        ])

        // Log any failures but don't break the page
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const configNames = ['agents', 'commands', 'hooks', 'MCP servers', 'skills']
            console.error(`Error loading user ${configNames[index]}:`, result.reason)
          }
        })
      } catch (err) {
        // This catch should rarely trigger since allSettled doesn't reject
        console.error('Unexpected error loading user data:', err)
      } finally {
        loading.value = false
      }
    }

    const loadAgents = async () => {
      loadingAgents.value = true
      try {
        const data = await api.getUserAgents()
        agents.value = data.agents || []
      } catch (err) {
        // Only log unexpected errors to console
        if (!err.isExpected) {
          console.error('Error loading agents:', err)
        }
        agents.value = []
      } finally {
        loadingAgents.value = false
      }
    }

    const loadCommands = async () => {
      loadingCommands.value = true
      try {
        const data = await api.getUserCommands()
        commands.value = data.commands || []
      } catch (err) {
        // Only log unexpected errors to console
        if (!err.isExpected) {
          console.error('Error loading commands:', err)
        }
        commands.value = []
      } finally {
        loadingCommands.value = false
      }
    }

    const loadHooks = async () => {
      loadingHooks.value = true
      try {
        const data = await api.getUserHooks()
        hooks.value = data.hooks || []
      } catch (err) {
        // Only log unexpected errors to console
        if (!err.isExpected) {
          console.error('Error loading hooks:', err)
        }
        hooks.value = []
      } finally {
        loadingHooks.value = false
      }
    }

    const loadMCP = async () => {
      loadingMCP.value = true
      try {
        const data = await api.getUserMcp()
        mcpServers.value = data.mcp || []
      } catch (err) {
        // Only log unexpected errors to console
        if (!err.isExpected) {
          console.error('Error loading MCP servers:', err)
        }
        mcpServers.value = []
      } finally {
        loadingMCP.value = false
      }
    }

    const loadSkills = async () => {
      loadingSkills.value = true
      try {
        const data = await api.getUserSkills()
        skills.value = data.skills || []
      } catch (err) {
        // Only log unexpected errors to console
        if (!err.isExpected) {
          console.error('Error loading skills:', err)
        }
        skills.value = []
      } finally {
        loadingSkills.value = false
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
      if (currentIndex.value > 0) {
        currentIndex.value--
        selectedItem.value = currentItems.value[currentIndex.value]
      }
    }

    const navigateNext = () => {
      if (currentIndex.value < currentItems.value.length - 1) {
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

    // Agent CRUD handlers
    const handleAgentEdit = (agent) => {
      editingAgent.value = agent
      showEditDialog.value = true
    }

    const handleAgentSave = async (updates) => {
      agentEditLoading.value = true

      try {
        const result = await agentsStore.updateAgent(
          null, // no projectId for user scope
          editingAgent.value.name,
          updates,
          'user'
        )

        if (result.success) {
          showEditDialog.value = false
          await loadAgents() // Refresh agent list
        }
      } finally {
        agentEditLoading.value = false
      }
    }

    const handleAgentEditCancel = () => {
      showEditDialog.value = false
      editingAgent.value = null
    }

    const handleAgentDelete = async (agent) => {
      deletingAgent.value = agent
      agentDeleteLoading.value = true

      try {
        // Check for references before showing the modal
        const result = await agentsStore.checkAgentReferences(
          null, // no projectId for user scope
          agent.name,
          'user'
        )

        if (result.success) {
          agentReferences.value = result.references || []
          showDeleteDialog.value = true
        }
      } finally {
        agentDeleteLoading.value = false
      }
    }

    const handleAgentDeleteConfirm = async () => {
      agentDeleteLoading.value = true

      try {
        const result = await agentsStore.deleteAgent(
          null, // no projectId for user scope
          deletingAgent.value.name,
          'user'
        )

        if (result.success) {
          showDeleteDialog.value = false
          await loadAgents() // Refresh agent list

          // Close sidebar if the deleted agent was being viewed
          if (selectedItem.value?.name === deletingAgent.value.name) {
            sidebarVisible.value = false
          }
        }
      } finally {
        agentDeleteLoading.value = false
      }
    }

    const handleAgentDeleteCancel = () => {
      showDeleteDialog.value = false
      deletingAgent.value = null
      agentReferences.value = []
    }

    // Copy modal event handlers
    const handleCopyClick = (configItem) => {
      // Use type from configItem if already present (added by ConfigItemList)
      // ConfigItemList uses 'configType', so check both 'configType' and 'type'
      // Otherwise, determine config type based on which array it belongs to
      let type = configItem.configType || configItem.type || null
      if (!type) {
        if (agents.value.includes(configItem)) {
          type = 'agent'
        } else if (commands.value.includes(configItem)) {
          type = 'command'
        } else if (hooks.value.includes(configItem)) {
          type = 'hook'
        } else if (mcpServers.value.includes(configItem)) {
          type = 'mcp'
        } else if (skills.value.includes(configItem)) {
          type = 'skill'
        }
      }

      // Enrich config item with type information
      selectedConfig.value = {
        ...configItem,
        type
      }
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

      // Refresh data if copied to user-level
      if (result.destination?.id === 'user-global') {
        const configType = result.source?.type
        if (configType === 'agent') {
          await loadAgents()
        } else if (configType === 'command') {
          await loadCommands()
        } else if (configType === 'hook') {
          await loadHooks()
        } else if (configType === 'mcp') {
          await loadMCP()
        } else if (configType === 'skill') {
          await loadSkills()
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

    onMounted(() => {
      loadUserData()
      // Load projects for copy modal
      projectsStore.loadProjects()
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
      breadcrumbItems,
      agents,
      commands,
      hooks,
      mcpServers,
      skills,
      loading,
      loadingAgents,
      loadingCommands,
      loadingHooks,
      loadingMCP,
      loadingSkills,
      initialDisplayCount,
      showingAllAgents,
      showingAllCommands,
      showingAllHooks,
      showingAllMcp,
      showingAllSkills,
      sidebarVisible,
      selectedItem,
      selectedType,
      currentItems,
      currentIndex,
      showDetail,
      onNavigate,
      showCopyModal,
      selectedConfig,
      handleCopyClick,
      handleCopySuccess,
      handleCopyError,
      handleCopyCancelled,
      // Agent CRUD
      showEditDialog,
      editingAgent,
      agentEditLoading,
      showDeleteDialog,
      deletingAgent,
      agentDeleteLoading,
      agentReferences,
      handleAgentEdit,
      handleAgentSave,
      handleAgentEditCancel,
      handleAgentDelete,
      handleAgentDeleteConfirm,
      handleAgentDeleteCancel
    }
  }
}
</script>
