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

  <!-- Command Delete Confirmation Dialog -->
  <DeleteConfirmationModal
    v-model:visible="showCommandDeleteDialog"
    item-type="command"
    :item-name="deletingCommand?.name || ''"
    :dependent-items="commandReferences"
    :loading="commandDeleteLoading"
    @confirm="handleCommandDeleteConfirm"
    @cancel="handleCommandDeleteCancel"
  />

  <!-- Skill Delete Confirmation Dialog -->
  <DeleteConfirmationModal
    v-model:visible="showSkillDeleteDialog"
    item-type="skill"
    :item-name="deletingSkill?.name || ''"
    :dependent-items="[]"
    :loading="skillDeleteLoading"
    warning-message="This will permanently delete the skill directory and all its files. This action cannot be undone."
    @confirm="handleSkillDeleteConfirm"
    @cancel="handleSkillDeleteCancel"
  />

  <!-- Hook Delete Confirmation Dialog -->
  <DeleteConfirmationModal
    v-model:visible="showHookDeleteDialog"
    item-type="hook"
    :item-name="getHookDisplayName(deletingHook)"
    :loading="hookDeleteLoading"
    @confirm="handleHookDeleteConfirm"
    @cancel="handleHookDeleteCancel"
  />

  <!-- MCP Delete Confirmation Dialog -->
  <DeleteConfirmationModal
    v-model:visible="showMcpDeleteDialog"
    item-type="mcp"
    :item-name="deletingMcp?.name || ''"
    :loading="mcpDeleteLoading"
    @confirm="handleMcpDeleteConfirm"
    @cancel="handleMcpDeleteCancel"
  />
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
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

    // Agent CRUD state
    const showDeleteDialog = ref(false)
    const deletingAgent = ref(null)
    const agentDeleteLoading = ref(false)
    const agentReferences = ref([])

    // Command CRUD state
    const showCommandDeleteDialog = ref(false)
    const deletingCommand = ref(null)
    const commandDeleteLoading = ref(false)
    const commandReferences = ref([])

    // Skill CRUD state
    const showSkillDeleteDialog = ref(false)
    const deletingSkill = ref(null)
    const skillDeleteLoading = ref(false)

    // Hook CRUD state
    const showHookDeleteDialog = ref(false)
    const deletingHook = ref(null)
    const hookDeleteLoading = ref(false)

    // MCP CRUD state
    const showMcpDeleteDialog = ref(false)
    const deletingMcp = ref(null)
    const mcpDeleteLoading = ref(false)

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
    const handleAgentUpdated = async () => {
      // Refresh agent list after sidebar edit
      await loadAgents()
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

    // Command CRUD handlers
    const handleCommandDelete = async (command) => {
      deletingCommand.value = command
      commandDeleteLoading.value = true

      try {
        // Get command path for API calls (construct from namespace + name + .md)
        const commandPath = command.namespace
          ? `${command.namespace}/${command.name}.md`
          : `${command.name}.md`

        // Check for references before showing the modal
        const references = await commandsStore.getCommandReferences(
          'user',
          null, // no projectId for user scope
          commandPath
        )

        commandReferences.value = references || []
        showCommandDeleteDialog.value = true
      } finally {
        commandDeleteLoading.value = false
      }
    }

    const handleCommandDeleteConfirm = async () => {
      commandDeleteLoading.value = true

      try {
        // Get command path for API calls (construct from namespace + name + .md)
        const commandPath = deletingCommand.value.namespace
          ? `${deletingCommand.value.namespace}/${deletingCommand.value.name}.md`
          : `${deletingCommand.value.name}.md`

        const result = await commandsStore.deleteCommand(
          'user',
          null, // no projectId for user scope
          commandPath
        )

        if (result.success) {
          showCommandDeleteDialog.value = false
          await loadCommands() // Refresh command list

          // Close sidebar if the deleted command was being viewed
          if (selectedItem.value?.path === commandPath || selectedItem.value?.name === commandPath) {
            sidebarVisible.value = false
          }
        }
      } finally {
        commandDeleteLoading.value = false
      }
    }

    const handleCommandDeleteCancel = () => {
      showCommandDeleteDialog.value = false
      deletingCommand.value = null
      commandReferences.value = []
    }

    const handleCommandUpdated = async () => {
      // Refresh commands list after update
      await loadCommands()
    }

    // Hook CRUD handlers
    const handleHookUpdated = async () => {
      // Refresh hooks list after sidebar edit
      await loadHooks()
    }

    const handleHookDelete = (hook) => {
      deletingHook.value = hook
      showHookDeleteDialog.value = true
    }

    const handleHookDeleteConfirm = async () => {
      hookDeleteLoading.value = true

      try {
        // Build hookId from hook object
        const hookId = hooksStore.buildHookId(deletingHook.value)

        // Call store to delete hook
        const result = await hooksStore.deleteHook(null, hookId, 'user')

        if (result.success) {
          showHookDeleteDialog.value = false
          await loadHooks() // Refresh hooks list

          // Close sidebar if the deleted hook was being viewed
          if (selectedItem.value && hooksStore.buildHookId(selectedItem.value) === hookId) {
            sidebarVisible.value = false
          }

          // Show success toast
          const eventType = hookId.split('::')[0]
          configToast.deleteSuccess('Hook', `${eventType} hook`)
        } else {
          // Handle delete failure
          configToast.deleteError({ error: result.error || 'Failed to delete hook' })
          showHookDeleteDialog.value = false
        }
      } catch (err) {
        // Handle unexpected errors
        configToast.deleteError(err)
        showHookDeleteDialog.value = false
      } finally {
        hookDeleteLoading.value = false
      }
    }

    const handleHookDeleteCancel = () => {
      showHookDeleteDialog.value = false
      deletingHook.value = null
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

    // Skill CRUD handlers
    const handleSkillDelete = async (skill) => {
      // Extract skill name (directory name) from the skill object
      const skillName = skill.directoryPath
        ? skill.directoryPath.split('/').pop()
        : skill.name

      deletingSkill.value = { ...skill, name: skillName }
      showSkillDeleteDialog.value = true
    }

    const handleSkillDeleteConfirm = async () => {
      skillDeleteLoading.value = true
      const skillName = deletingSkill.value.name

      try {
        const result = await skillsStore.deleteSkill(
          null, // no projectId for user scope
          skillName,
          'user'
        )

        if (result.success) {
          showSkillDeleteDialog.value = false
          await loadSkills() // Refresh skills list

          // Close sidebar if the deleted skill was being viewed
          if (selectedItem.value?.name === skillName) {
            sidebarVisible.value = false
          }

          configToast.deleteSuccess('Skill', `Skill "${skillName}"`)
        } else {
          configToast.deleteError({ error: result.error || 'Failed to delete skill' })
          showSkillDeleteDialog.value = false
        }
      } catch (err) {
        configToast.deleteError(err)
        showSkillDeleteDialog.value = false
      } finally {
        skillDeleteLoading.value = false
      }
    }

    const handleSkillDeleteCancel = () => {
      showSkillDeleteDialog.value = false
      deletingSkill.value = null
    }

    // MCP CRUD handlers
    const handleMcpDelete = (mcp) => {
      deletingMcp.value = mcp
      showMcpDeleteDialog.value = true
    }

    const handleMcpDeleteConfirm = async () => {
      mcpDeleteLoading.value = true

      try {
        const result = await mcpStore.deleteMcpServer(
          null, // no projectId for user scope
          deletingMcp.value.name,
          'user'
        )

        if (result.success) {
          showMcpDeleteDialog.value = false
          await loadMCP() // Refresh MCP servers list

          // Close sidebar if the deleted MCP server was being viewed
          if (selectedItem.value?.name === deletingMcp.value.name) {
            sidebarVisible.value = false
          }

          configToast.deleteSuccess('MCP Server', `MCP server "${deletingMcp.value.name}"`)
        } else {
          configToast.deleteError({ error: result.error || 'Failed to delete MCP server' })
          showMcpDeleteDialog.value = false
        }
      } catch (err) {
        configToast.deleteError(err)
        showMcpDeleteDialog.value = false
      } finally {
        mcpDeleteLoading.value = false
      }
    }

    const handleMcpDeleteCancel = () => {
      showMcpDeleteDialog.value = false
      deletingMcp.value = null
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
      // Agent CRUD
      showDeleteDialog,
      deletingAgent,
      agentDeleteLoading,
      agentReferences,
      handleAgentUpdated,
      handleAgentDelete,
      handleAgentDeleteConfirm,
      handleAgentDeleteCancel,
      // Command CRUD
      showCommandDeleteDialog,
      deletingCommand,
      commandDeleteLoading,
      commandReferences,
      handleCommandUpdated,
      handleCommandDelete,
      handleCommandDeleteConfirm,
      handleCommandDeleteCancel,
      // Hook CRUD
      showHookDeleteDialog,
      deletingHook,
      hookDeleteLoading,
      handleHookUpdated,
      handleHookDelete,
      handleHookDeleteConfirm,
      handleHookDeleteCancel,
      getHookDisplayName,
      // Skill CRUD
      showSkillDeleteDialog,
      deletingSkill,
      skillDeleteLoading,
      handleSkillDelete,
      handleSkillDeleteConfirm,
      handleSkillDeleteCancel,
      // MCP CRUD
      showMcpDeleteDialog,
      deletingMcp,
      mcpDeleteLoading,
      handleMcpDelete,
      handleMcpDeleteConfirm,
      handleMcpDeleteCancel
    }
  }
}
</script>
