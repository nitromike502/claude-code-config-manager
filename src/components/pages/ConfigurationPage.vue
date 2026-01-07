<template>
  <ConfigPageLayout
    :page-title="pageTitle"
    :page-subtitle="pageSubtitle"
    :page-icon="pageIcon"
    :page-icon-color="pageIconColor"
    :breadcrumb-items="breadcrumbItems"
    :loading="loading"
    :loading-message="loadingMessage"
    :loading-agents="loadingAgents"
    :loading-commands="loadingCommands"
    :loading-hooks="loadingHooks"
    :loading-mcp="loadingMCP"
    :loading-skills="loadingSkills"
    :error="error"
    :error-message="errorMessage"
    :warnings="warnings"
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
    :scope="scope"
    :project-id="projectId"
    :enable-agent-crud="true"
    :enable-command-crud="true"
    :enable-skill-crud="true"
    :enable-hook-crud="true"
    :enable-mcp-crud="true"
    @retry="retryLoad"
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
import { useRoute } from 'vue-router'
import * as api from '@/api'
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

/**
 * ConfigurationPage Component
 *
 * Reusable component that displays configuration details for either user-level
 * or project-level configurations. Consolidates shared logic from ProjectDetail
 * and UserGlobal components.
 *
 * @component
 * @example
 * // User-level configuration
 * <ConfigurationPage scope="user" />
 *
 * // Project-level configuration
 * <ConfigurationPage scope="project" :projectId="projectId" />
 */
export default {
  name: 'ConfigurationPage',
  components: { ConfigPageLayout, CopyModal, DeleteConfirmationModal },
  props: {
    /**
     * Configuration scope - determines which API endpoints to use
     * @type {'user' | 'project'}
     */
    scope: {
      type: String,
      required: true,
      validator: (value) => ['user', 'project'].includes(value)
    },
    /**
     * Project ID - required when scope is 'project'
     * @type {String}
     */
    projectId: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const route = useRoute()
    const configToast = useConfigToast()
    const copyStore = useCopyStore()
    const projectsStore = useProjectsStore()
    const agentsStore = useAgentsStore()
    const commandsStore = useCommandsStore()
    const skillsStore = useSkillsStore()
    const hooksStore = useHooksStore()
    const mcpStore = useMcpStore()

    // Project-specific state (only used when scope='project')
    const projectName = ref('Loading...')
    const projectPath = ref('')

    // Computed properties for conditional page metadata
    const pageTitle = computed(() => {
      return props.scope === 'user' ? 'User Configurations' : projectName.value
    })

    const pageSubtitle = computed(() => {
      return props.scope === 'user' ? '~/.claude' : projectPath.value
    })

    const pageIcon = computed(() => {
      return props.scope === 'user' ? 'pi pi-user' : 'pi pi-folder'
    })

    const pageIconColor = computed(() => {
      return props.scope === 'user' ? 'var(--text-primary)' : 'var(--color-primary)'
    })

    const loadingMessage = computed(() => {
      return props.scope === 'user'
        ? 'Loading user configurations...'
        : 'Loading project details...'
    })

    const breadcrumbItems = computed(() => {
      const items = [
        { label: 'Dashboard', route: '/', icon: 'pi pi-home' }
      ]

      if (props.scope === 'user') {
        items.push({ label: 'User Configurations', route: null, icon: null })
      } else {
        items.push({ label: projectName.value || 'Project', route: null, icon: null })
      }

      return items
    })

    // Configuration data
    const agents = ref([])
    const commands = ref([])
    const hooks = ref([])
    const mcpServers = ref([])
    const skills = ref([])

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

    // Loading states
    const loading = ref(true)
    const loadingAgents = ref(false)
    const loadingCommands = ref(false)
    const loadingHooks = ref(false)
    const loadingMCP = ref(false)
    const loadingSkills = ref(false)

    // Error states (only used for project scope)
    const error = ref(false)
    const errorMessage = ref('')
    const warnings = ref([])

    // Display state
    const initialDisplayCount = 5
    const showingAllAgents = ref(false)
    const showingAllCommands = ref(false)
    const showingAllHooks = ref(false)
    const showingAllMcp = ref(false)
    const showingAllSkills = ref(false)

    // Sidebar state
    const sidebarVisible = ref(false)
    const selectedItem = ref(null)
    const selectedType = ref(null)
    const currentItems = ref([])
    const currentIndex = ref(-1)

    /**
     * Load configuration data based on scope
     * For project scope: loads project metadata and all configs with error handling
     * For user scope: loads all user configs (simpler, no error state display)
     */
    const loadConfigData = async () => {
      loading.value = true
      error.value = false
      errorMessage.value = ''
      warnings.value = []

      // Project-specific: validate project ID and load metadata
      if (props.scope === 'project') {
        if (!props.projectId) {
          error.value = true
          errorMessage.value = 'No project ID provided in URL'
          loading.value = false
          return
        }

        // Load projects from store if not already loaded
        if (projectsStore.projects.length === 0) {
          await projectsStore.loadProjects()
        }

        // Find the project by ID to get the actual name and path
        const project = projectsStore.projects.find(p => p.id === props.projectId)
        if (project) {
          projectName.value = project.name
          projectPath.value = project.path
        } else {
          // Fallback: use the project ID as name if project not found in store
          projectName.value = props.projectId
          projectPath.value = ''
        }
      }

      try {
        // Use allSettled to allow individual config loads to fail without breaking the entire page
        const results = await Promise.allSettled([
          loadAgents(),
          loadCommands(),
          loadHooks(),
          loadMCP(),
          loadSkills()
        ])

        // Project scope: Check if ALL config loads failed
        if (props.scope === 'project') {
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
                const configNames = ['agents', 'commands', 'hooks', 'MCP servers', 'skills']
                console.error(`Error loading ${configNames[index]}:`, result.reason)

                // Add warning message for this config type
                warnings.value.push({
                  type: configNames[index],
                  message: `Failed to load ${configNames[index]}: ${result.reason?.message || 'Unknown error'}`
                })
              }
            })
          }
        } else {
          // User scope: Log any failures but don't break the page (no error state display)
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              const configNames = ['agents', 'commands', 'hooks', 'MCP servers', 'skills']
              console.error(`Error loading user ${configNames[index]}:`, result.reason)
            }
          })
        }
      } catch (err) {
        // This catch should rarely trigger since allSettled doesn't reject
        console.error('Unexpected error loading configuration data:', err)
        if (props.scope === 'project') {
          error.value = true
          errorMessage.value = err.message || 'An unexpected error occurred while loading configurations'
        }
      } finally {
        loading.value = false
      }

      // User scope: Load projects for copy modal on mount
      if (props.scope === 'user') {
        projectsStore.loadProjects()
      }
    }

    /**
     * Retry loading after error (project scope only)
     */
    const retryLoad = () => {
      loadConfigData()
    }

    /**
     * Load agents based on scope
     */
    const loadAgents = async () => {
      loadingAgents.value = true
      try {
        const data = props.scope === 'project'
          ? await api.getProjectAgents(props.projectId)
          : await api.getUserAgents()
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

    /**
     * Load commands based on scope
     */
    const loadCommands = async () => {
      loadingCommands.value = true
      try {
        const data = props.scope === 'project'
          ? await api.getProjectCommands(props.projectId)
          : await api.getUserCommands()
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

    /**
     * Load hooks based on scope
     */
    const loadHooks = async () => {
      loadingHooks.value = true
      try {
        const data = props.scope === 'project'
          ? await api.getProjectHooks(props.projectId)
          : await api.getUserHooks()
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

    /**
     * Load MCP servers based on scope
     */
    const loadMCP = async () => {
      loadingMCP.value = true
      try {
        const data = props.scope === 'project'
          ? await api.getProjectMcp(props.projectId)
          : await api.getUserMcp()
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

    /**
     * Load skills based on scope
     */
    const loadSkills = async () => {
      loadingSkills.value = true
      try {
        const data = props.scope === 'project'
          ? await api.getProjectSkills(props.projectId)
          : await api.getUserSkills()
        skills.value = data.skills || []
        return data
      } catch (err) {
        // Only log unexpected errors to console
        if (!err.isExpected) {
          console.error('Error loading skills:', err)
        }
        skills.value = []
        throw err
      } finally {
        loadingSkills.value = false
      }
    }

    /**
     * Show detail sidebar for a configuration item
     */
    const showDetail = (item, type, items) => {
      selectedItem.value = item
      selectedType.value = type
      currentItems.value = items
      currentIndex.value = items.findIndex(i => i === item)
      sidebarVisible.value = true
    }

    /**
     * Navigate to previous item in sidebar
     */
    const navigatePrev = () => {
      if (currentIndex.value > 0) {
        currentIndex.value--
        selectedItem.value = currentItems.value[currentIndex.value]
      }
    }

    /**
     * Navigate to next item in sidebar
     */
    const navigateNext = () => {
      if (currentIndex.value < currentItems.value.length - 1) {
        currentIndex.value++
        selectedItem.value = currentItems.value[currentIndex.value]
      }
    }

    /**
     * Handle sidebar navigation from ConfigDetailSidebar component
     */
    const onNavigate = (direction) => {
      if (direction === 'prev') {
        navigatePrev()
      } else if (direction === 'next') {
        navigateNext()
      }
    }

    /**
     * Open delete modal for a configuration item
     */
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

    /**
     * Load agent references for delete confirmation
     */
    const loadAgentReferences = async (agent) => {
      deleteModal.loading = true
      try {
        const result = await agentsStore.checkAgentReferences(
          props.scope === 'project' ? props.projectId : null,
          agent.name,
          props.scope
        )
        if (result.success) {
          deleteModal.references = result.references || []
        }
      } finally {
        deleteModal.loading = false
      }
    }

    /**
     * Load command references for delete confirmation
     */
    const loadCommandReferences = async (command) => {
      deleteModal.loading = true
      try {
        const commandPath = command.namespace
          ? `${command.namespace}/${command.name}.md`
          : `${command.name}.md`

        const references = await commandsStore.getCommandReferences(
          props.scope,
          props.scope === 'project' ? props.projectId : null,
          commandPath
        )
        deleteModal.references = references || []
      } finally {
        deleteModal.loading = false
      }
    }

    /**
     * Handle delete confirmation
     */
    const handleDeleteConfirm = async () => {
      deleteModal.loading = true

      try {
        let result
        const itemType = deleteModal.itemType
        const item = deleteModal.item

        // Route to appropriate store delete method
        if (itemType === 'agent') {
          result = await agentsStore.deleteAgent(
            props.scope === 'project' ? props.projectId : null,
            item.name,
            props.scope
          )
        } else if (itemType === 'command') {
          const commandPath = item.namespace
            ? `${item.namespace}/${item.name}.md`
            : `${item.name}.md`

          result = await commandsStore.deleteCommand(
            props.scope,
            props.scope === 'project' ? props.projectId : null,
            commandPath
          )
        } else if (itemType === 'skill') {
          const skillName = item.directoryPath
            ? item.directoryPath.split('/').pop()
            : item.name

          result = await skillsStore.deleteSkill(
            props.scope === 'project' ? props.projectId : null,
            skillName,
            props.scope
          )
        } else if (itemType === 'hook') {
          const hookId = hooksStore.buildHookId(item)
          result = await hooksStore.deleteHook(
            props.scope === 'project' ? props.projectId : null,
            hookId,
            props.scope
          )
        } else if (itemType === 'mcp') {
          result = await mcpStore.deleteMcpServer(
            props.scope === 'project' ? props.projectId : null,
            item.name,
            props.scope
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

    /**
     * Handle delete cancellation
     */
    const handleDeleteCancel = () => {
      deleteModal.visible = false
      deleteModal.itemType = null
      deleteModal.item = null
      deleteModal.loading = false
      deleteModal.references = []
      deleteModal.warningMessage = ''
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

    // Individual type-specific delete handlers
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
     * Handle copy button click - opens copy modal
     */
    const handleCopyClick = (configItem) => {
      // Normalize configType to type and add projectId for CopyModal compatibility
      const normalizedConfig = {
        ...configItem,
        type: configItem.configType || configItem.type,
        projectId: props.scope === 'project' ? props.projectId : null
      }
      selectedConfig.value = normalizedConfig
      showCopyModal.value = true
    }

    /**
     * Handle successful copy operation
     */
    const handleCopySuccess = async (result) => {
      showCopyModal.value = false

      // Show toast
      const filename = result.filename || result.source?.name || 'Configuration'
      configToast.copySuccess(filename)

      // Refresh data if copied to current scope
      const shouldRefresh = props.scope === 'user'
        ? result.destination?.id === 'user-global'
        : result.destination?.id === props.projectId

      if (shouldRefresh) {
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

    /**
     * Handle copy error
     */
    const handleCopyError = (error) => {
      showCopyModal.value = false
      configToast.copyError(error)
    }

    /**
     * Handle copy cancellation
     */
    const handleCopyCancelled = () => {
      showCopyModal.value = false
      configToast.copyCancelled()
    }

    // Watch for project ID changes (project scope only)
    watch(() => props.projectId, () => {
      if (props.scope === 'project') {
        loadConfigData()
      }
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
      loadConfigData()
    })

    // Cleanup: restore body scroll when component unmounts
    onBeforeUnmount(() => {
      document.body.style.overflow = ''
    })

    return {
      // Computed page metadata
      pageTitle,
      pageSubtitle,
      pageIcon,
      pageIconColor,
      loadingMessage,
      breadcrumbItems,
      // Configuration data
      agents,
      commands,
      hooks,
      mcpServers,
      skills,
      // Loading states
      loading,
      loadingAgents,
      loadingCommands,
      loadingHooks,
      loadingMCP,
      loadingSkills,
      // Error states
      error,
      errorMessage,
      warnings,
      retryLoad,
      // Display state
      initialDisplayCount,
      showingAllAgents,
      showingAllCommands,
      showingAllHooks,
      showingAllMcp,
      showingAllSkills,
      // Sidebar state
      sidebarVisible,
      selectedItem,
      selectedType,
      currentItems,
      currentIndex,
      showDetail,
      onNavigate,
      // Copy modal
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
