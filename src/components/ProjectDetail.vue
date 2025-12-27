<template>
  <ConfigPageLayout
    :page-title="projectName"
    :page-subtitle="projectPath"
    page-icon="pi pi-folder"
    page-icon-color="var(--color-primary)"
    :breadcrumb-items="breadcrumbItems"
    :loading="loading"
    loading-message="Loading project details..."
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
    scope="project"
    :project-id="projectId"
    :enable-agent-crud="true"
    :enable-command-crud="true"
    :enable-hook-crud="true"
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
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import * as api from '@/api/client'
import ConfigPageLayout from '@/components/layouts/ConfigPageLayout.vue'
import CopyModal from '@/components/copy/CopyModal.vue'
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue'
import { useCopyStore } from '@/stores/copy-store'
import { useProjectsStore } from '@/stores/projects'
import { useAgentsStore } from '@/stores/agents'
import { useCommandsStore } from '@/stores/commands'
import { useSkillsStore } from '@/stores/skills'

export default {
  name: 'ProjectDetail',
  components: { ConfigPageLayout, CopyModal, DeleteConfirmationModal },
  props: ['id'],
  setup(props) {
    const route = useRoute()
    const toast = useToast()
    const copyStore = useCopyStore()
    const projectsStore = useProjectsStore()
    const agentsStore = useAgentsStore()
    const commandsStore = useCommandsStore()
    const skillsStore = useSkillsStore()

    const projectId = computed(() => props.id || route.params.id)
    const projectName = ref('Loading...')
    const projectPath = ref('')

    const breadcrumbItems = computed(() => [
      { label: 'Dashboard', route: '/', icon: 'pi pi-home' },
      { label: projectName.value || 'Project', route: null, icon: null }
    ])

    const agents = ref([])
    const commands = ref([])
    const hooks = ref([])
    const mcpServers = ref([])
    const skills = ref([])

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

    const loading = ref(true)
    const loadingAgents = ref(false)
    const loadingCommands = ref(false)
    const loadingHooks = ref(false)
    const loadingMCP = ref(false)
    const loadingSkills = ref(false)

    const error = ref(false)
    const errorMessage = ref('')
    const warnings = ref([])

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

      // Load projects from store if not already loaded
      if (projectsStore.projects.length === 0) {
        await projectsStore.loadProjects()
      }

      // Find the project by ID to get the actual name and path
      const project = projectsStore.projects.find(p => p.id === projectId.value)
      if (project) {
        projectName.value = project.name
        projectPath.value = project.path
      } else {
        // Fallback: use the project ID as name if project not found in store
        projectName.value = projectId.value
        projectPath.value = ''
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

    const loadSkills = async () => {
      loadingSkills.value = true
      try {
        const data = await api.getProjectSkills(projectId.value)
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
          projectId.value,
          agent.name,
          'project'
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
          projectId.value,
          deletingAgent.value.name,
          'project'
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
          'project',
          projectId.value,
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
          'project',
          projectId.value,
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

    const handleHookDelete = async (hook) => {
      // Note: Hook delete is not yet implemented in the UI
      // This handler is a placeholder for future implementation
      console.log('Hook delete requested:', hook)
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
          projectId.value,
          skillName,
          'project'
        )

        if (result.success) {
          showSkillDeleteDialog.value = false
          await loadSkills() // Refresh skills list

          // Close sidebar if the deleted skill was being viewed
          if (selectedItem.value?.name === skillName) {
            sidebarVisible.value = false
          }

          toast.add({
            severity: 'success',
            summary: 'Skill Deleted',
            detail: `Skill "${skillName}" has been deleted successfully`,
            life: 5000
          })
        } else {
          toast.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: result.error || 'Failed to delete skill',
            life: 0
          })
          showSkillDeleteDialog.value = false
        }
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: err.message || 'An unexpected error occurred',
          life: 0
        })
        showSkillDeleteDialog.value = false
      } finally {
        skillDeleteLoading.value = false
      }
    }

    const handleSkillDeleteCancel = () => {
      showSkillDeleteDialog.value = false
      deletingSkill.value = null
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
      error,
      errorMessage,
      warnings,
      retryLoad,
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
      handleHookUpdated,
      handleHookDelete,
      // Skill CRUD
      showSkillDeleteDialog,
      deletingSkill,
      skillDeleteLoading,
      handleSkillDelete,
      handleSkillDeleteConfirm,
      handleSkillDeleteCancel
    }
  }
}
</script>
