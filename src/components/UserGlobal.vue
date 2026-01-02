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
    :enable-command-crud="true"
    :enable-skill-crud="true"
    :enable-hook-crud="true"
    :enable-mcp-crud="true"
    @toggle-agents="showingAllAgents = !showingAllAgents"
    @toggle-commands="showingAllCommands = !showingAllCommands"
    @toggle-hooks="showingAllHooks = !showingAllHooks"
    @toggle-mcp="showingAllMcp = !showingAllMcp"
    @toggle-skills="showingAllSkills = !showingAllSkills"
    @show-detail="showDetail"
    @close-sidebar="sidebarVisible = false"
    @navigate="onNavigate"
    @copy-clicked="handleCopyClick"
    @agent-delete="handleAgentDelete"
    @agent-updated="handleAgentUpdated"
    @command-delete="handleCommandDelete"
    @command-updated="handleCommandUpdated"
    @hook-updated="handleHookUpdated"
    @hook-delete="handleHookDelete"
    @skill-delete="handleSkillDelete"
    @mcp-delete="handleMcpDelete"
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

  <!-- Unified Delete Confirmation Dialog -->
  <DeleteConfirmationModal
    v-model:visible="deleteModal.visible"
    :item-type="deleteModal.itemType || 'agent'"
    :item-name="getDeleteItemName()"
    :dependent-items="deleteModal.references"
    :loading="deleteModal.loading"
    :warning-message="deleteModal.warningMessage"
    @confirm="handleDeleteConfirm"
    @cancel="handleDeleteCancel"
  />
</template>

<script>
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import * as api from '@/api/client'
import ConfigPageLayout from '@/components/layouts/ConfigPageLayout.vue'
import CopyModal from '@/components/copy/CopyModal.vue'
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue'
import { useCopyStore } from '@/stores/copy-store'
import { useProjectsStore } from '@/stores/projects'
import { useAgentsStore } from '@/stores/agents'
import { useCommandsStore } from '@/stores/commands'
import { useSkillsStore } from '@/stores/skills'
import { useHooksStore } from '@/stores/hooks'
import { useMcpStore } from '@/stores/mcp'
import { useConfigToast } from '@/composables/useConfigToast'
import { formatType } from '@/utils/typeMapping'

export default {
  name: 'UserGlobal',
  components: {
    ConfigPageLayout,
    CopyModal,
    DeleteConfirmationModal
  },
  setup() {
    // Initialize stores and composables
    const configToast = useConfigToast()
    const copyStore = useCopyStore()
    const projectsStore = useProjectsStore()
    const agentsStore = useAgentsStore()
    const commandsStore = useCommandsStore()
    const skillsStore = useSkillsStore()
    const hooksStore = useHooksStore()
    const mcpStore = useMcpStore()

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

    // Consolidated delete modal state
    const deleteModal = reactive({
      visible: false,
      itemType: null,      // 'agent' | 'command' | 'skill' | 'hook' | 'mcp'
      item: null,          // The item being deleted
      loading: false,
      references: [],      // For agents/commands
      warningMessage: ''   // For skills
    })

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

    // Unified delete modal handlers
    const openDeleteModal = (itemType, item) => {
      deleteModal.itemType = itemType
      deleteModal.item = item
      deleteModal.loading = false
      deleteModal.references = []
      deleteModal.warningMessage = ''

      // Set type-specific properties
      if (itemType === 'skill') {
        deleteModal.warningMessage = 'This will permanently delete the skill directory and all its files. This action cannot be undone.'
      }

      deleteModal.visible = true

      // Load references for agents/commands asynchronously
      if (itemType === 'agent') {
        loadAgentReferences(item)
      } else if (itemType === 'command') {
        loadCommandReferences(item)
      }
    }

    const loadAgentReferences = async (agent) => {
      deleteModal.loading = true
      try {
        const result = await agentsStore.checkAgentReferences(
          null, // no projectId for user scope
          agent.name,
          'user'
        )
        if (result.success) {
          deleteModal.references = result.references || []
        }
      } finally {
        deleteModal.loading = false
      }
    }

    const loadCommandReferences = async (command) => {
      deleteModal.loading = true
      try {
        const commandPath = command.namespace
          ? `${command.namespace}/${command.name}.md`
          : `${command.name}.md`

        const references = await commandsStore.getCommandReferences(
          'user',
          null, // no projectId for user scope
          commandPath
        )
        deleteModal.references = references || []
      } finally {
        deleteModal.loading = false
      }
    }

    const handleDeleteConfirm = async () => {
      deleteModal.loading = true

      try {
        let result
        const itemType = deleteModal.itemType
        const item = deleteModal.item

        // Route to appropriate store delete method
        if (itemType === 'agent') {
          result = await agentsStore.deleteAgent(
            null, // no projectId for user scope
            item.name,
            'user'
          )
        } else if (itemType === 'command') {
          const commandPath = item.namespace
            ? `${item.namespace}/${item.name}.md`
            : `${item.name}.md`

          result = await commandsStore.deleteCommand(
            'user',
            null, // no projectId for user scope
            commandPath
          )
        } else if (itemType === 'skill') {
          const skillName = item.directoryPath
            ? item.directoryPath.split('/').pop()
            : item.name

          result = await skillsStore.deleteSkill(
            null, // no projectId for user scope
            skillName,
            'user'
          )
        } else if (itemType === 'hook') {
          const hookId = hooksStore.buildHookId(item)
          result = await hooksStore.deleteHook(null, hookId, 'user')
        } else if (itemType === 'mcp') {
          result = await mcpStore.deleteMcpServer(
            null, // no projectId for user scope
            item.name,
            'user'
          )
        }

        if (result?.success) {
          deleteModal.visible = false

          // Refresh the appropriate list
          if (itemType === 'agent') {
            await loadAgents()
            if (selectedItem.value?.name === item.name) {
              sidebarVisible.value = false
            }
          } else if (itemType === 'command') {
            await loadCommands()
            const commandPath = item.namespace
              ? `${item.namespace}/${item.name}.md`
              : `${item.name}.md`
            if (selectedItem.value?.path === commandPath || selectedItem.value?.name === commandPath) {
              sidebarVisible.value = false
            }
          } else if (itemType === 'skill') {
            await loadSkills()
            const skillName = item.directoryPath ? item.directoryPath.split('/').pop() : item.name
            if (selectedItem.value?.name === skillName) {
              sidebarVisible.value = false
            }
            configToast.deleteSuccess('Skill', `Skill "${skillName}"`)
          } else if (itemType === 'hook') {
            await loadHooks()
            const hookId = hooksStore.buildHookId(item)
            if (selectedItem.value && hooksStore.buildHookId(selectedItem.value) === hookId) {
              sidebarVisible.value = false
            }
            const eventType = hookId.split('::')[0]
            configToast.deleteSuccess('Hook', `${eventType} hook`)
          } else if (itemType === 'mcp') {
            await loadMCP()
            if (selectedItem.value?.name === item.name) {
              sidebarVisible.value = false
            }
            configToast.deleteSuccess('MCP Server', `MCP server "${item.name}"`)
          }
        } else {
          configToast.deleteError({ error: result?.error || 'Failed to delete configuration' })
          deleteModal.visible = false
        }
      } catch (err) {
        configToast.deleteError(err)
        deleteModal.visible = false
      } finally {
        deleteModal.loading = false
      }
    }

    const handleDeleteCancel = () => {
      deleteModal.visible = false
      deleteModal.itemType = null
      deleteModal.item = null
      deleteModal.loading = false
      deleteModal.references = []
      deleteModal.warningMessage = ''
    }

    // Individual type-specific delete handlers (now just call openDeleteModal)
    const handleAgentUpdated = async () => {
      // Refresh agent list after sidebar edit
      await loadAgents()
    }

    const handleAgentDelete = async (agent) => {
      openDeleteModal('agent', agent)
    }

    const handleCommandDelete = async (command) => {
      openDeleteModal('command', command)
    }

    const handleCommandUpdated = async () => {
      // Refresh commands list after update
      await loadCommands()
    }

    const handleHookUpdated = async () => {
      // Refresh hooks list after sidebar edit
      await loadHooks()
    }

    const handleHookDelete = (hook) => {
      openDeleteModal('hook', hook)
    }

    const handleSkillDelete = async (skill) => {
      openDeleteModal('skill', skill)
    }

    const handleMcpDelete = (mcp) => {
      openDeleteModal('mcp', mcp)
    }

    /**
     * Get display name for hook in delete modal
     * Shows event type and command preview
     */
    const getHookDisplayName = (hook) => {
      if (!hook) return ''

      const event = hook.event || 'Unknown'
      const command = hook.command || hook.shell || ''
      const commandPreview = command.length > 50 ? command.substring(0, 50) + '...' : command

      return `${event}${commandPreview ? ': ' + commandPreview : ''}`
    }

    /**
     * Get display name for the item being deleted in the modal
     * Handles type-specific name extraction
     */
    const getDeleteItemName = () => {
      const item = deleteModal.item
      const itemType = deleteModal.itemType

      if (!item) return ''

      if (itemType === 'hook') {
        return getHookDisplayName(item)
      } else if (itemType === 'skill') {
        return item.directoryPath ? item.directoryPath.split('/').pop() : item.name
      } else {
        return item.name || ''
      }
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
      configToast.copySuccess(filename)

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
      configToast.copyError(error)
    }

    const handleCopyCancelled = () => {
      showCopyModal.value = false
      configToast.copyCancelled()
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
      // Unified delete modal
      deleteModal,
      handleDeleteConfirm,
      handleDeleteCancel,
      getDeleteItemName,
      // CRUD handlers
      handleAgentUpdated,
      handleAgentDelete,
      handleCommandUpdated,
      handleCommandDelete,
      handleHookUpdated,
      handleHookDelete,
      handleSkillDelete,
      handleMcpDelete
    }
  }
}
</script>
