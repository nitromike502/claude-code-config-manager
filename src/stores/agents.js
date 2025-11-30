import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/client'
import { useNotificationsStore } from './notifications'

/**
 * Pinia store for managing agent CRUD operations
 * Provides centralized state management for agents across project and user scopes
 */
export const useAgentsStore = defineStore('agents', () => {
  // State
  const projectAgents = ref(new Map()) // projectId -> agents array
  const userAgents = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get notifications store for toast messages
  const notifications = useNotificationsStore()

  /**
   * Update an agent (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} agentName - Current agent name
   * @param {Object} updates - Properties to update (name, description, content, etc.)
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, agent?: Object, error?: string }
   */
  async function updateAgent(projectId, agentName, updates, scope) {
    isLoading.value = true
    error.value = null

    try {
      // Validate scope
      if (!['project', 'user'].includes(scope)) {
        throw new Error('Invalid scope: must be "project" or "user"')
      }

      // Validate projectId for project scope
      if (scope === 'project' && !projectId) {
        throw new Error('projectId is required for project scope')
      }

      // Call appropriate API method based on scope
      const result = scope === 'project'
        ? await api.updateProjectAgent(projectId, agentName, updates)
        : await api.updateUserAgent(agentName, updates)

      if (result.success) {
        // Update local state
        if (scope === 'project') {
          const agents = projectAgents.value.get(projectId) || []
          const index = agents.findIndex(a => a.name === agentName)
          if (index !== -1) {
            // Replace with updated agent
            agents[index] = result.agent
            projectAgents.value.set(projectId, [...agents])
          }
        } else {
          // User scope
          const index = userAgents.value.findIndex(a => a.name === agentName)
          if (index !== -1) {
            userAgents.value[index] = result.agent
          }
        }

        // Show success notification
        notifications.success(`Agent "${agentName}" updated successfully`)

        return { success: true, agent: result.agent }
      } else {
        throw new Error(result.message || 'Failed to update agent')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to update agent: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error updating agent:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete an agent (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} agentName - Agent name to delete
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, error?: string }
   */
  async function deleteAgent(projectId, agentName, scope) {
    isLoading.value = true
    error.value = null

    try {
      // Validate scope
      if (!['project', 'user'].includes(scope)) {
        throw new Error('Invalid scope: must be "project" or "user"')
      }

      // Validate projectId for project scope
      if (scope === 'project' && !projectId) {
        throw new Error('projectId is required for project scope')
      }

      // Call appropriate API method based on scope
      const result = scope === 'project'
        ? await api.deleteProjectAgent(projectId, agentName)
        : await api.deleteUserAgent(agentName)

      if (result.success) {
        // Remove from local state
        if (scope === 'project') {
          const agents = projectAgents.value.get(projectId) || []
          const filtered = agents.filter(a => a.name !== agentName)
          projectAgents.value.set(projectId, filtered)
        } else {
          // User scope
          userAgents.value = userAgents.value.filter(a => a.name !== agentName)
        }

        // Show success notification
        notifications.success(`Agent "${agentName}" deleted successfully`)

        return { success: true }
      } else {
        throw new Error(result.message || 'Failed to delete agent')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to delete agent: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error deleting agent:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Check if an agent has references (is used by other configurations)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} agentName - Agent name to check
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, hasReferences: boolean, references: Array, error?: string }
   */
  async function checkAgentReferences(projectId, agentName, scope) {
    try {
      // Validate scope
      if (!['project', 'user'].includes(scope)) {
        throw new Error('Invalid scope: must be "project" or "user"')
      }

      // Validate projectId for project scope
      if (scope === 'project' && !projectId) {
        throw new Error('projectId is required for project scope')
      }

      // Call appropriate API method based on scope
      const result = scope === 'project'
        ? await api.getProjectAgentReferences(projectId, agentName)
        : await api.getUserAgentReferences(agentName)

      if (result.success) {
        return {
          success: true,
          hasReferences: result.hasReferences,
          references: result.references || []
        }
      } else {
        throw new Error(result.message || 'Failed to check agent references')
      }
    } catch (err) {
      error.value = err.message

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error checking agent references:', err)
      }

      return {
        success: false,
        hasReferences: false,
        references: [],
        error: err.message
      }
    }
  }

  /**
   * Load project agents into store cache
   * Useful for pre-loading or refreshing agent data
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} - { success: boolean, agents?: Array, error?: string }
   */
  async function loadProjectAgents(projectId) {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getProjectAgents(projectId)

      if (result.agents) {
        projectAgents.value.set(projectId, result.agents)
        return { success: true, agents: result.agents }
      } else {
        throw new Error('No agents data in response')
      }
    } catch (err) {
      error.value = err.message

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error loading project agents:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load user agents into store cache
   * @returns {Promise<Object>} - { success: boolean, agents?: Array, error?: string }
   */
  async function loadUserAgents() {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getUserAgents()

      if (result.agents) {
        userAgents.value = result.agents
        return { success: true, agents: result.agents }
      } else {
        throw new Error('No agents data in response')
      }
    } catch (err) {
      error.value = err.message

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error loading user agents:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get cached project agents
   * @param {string} projectId - Project identifier
   * @returns {Array} - Agents array (empty if not loaded)
   */
  function getProjectAgentsCache(projectId) {
    return projectAgents.value.get(projectId) || []
  }

  /**
   * Clear all cached agents
   */
  function clearCache() {
    projectAgents.value.clear()
    userAgents.value = []
    error.value = null
  }

  return {
    // State
    projectAgents,
    userAgents,
    isLoading,
    error,

    // Actions
    updateAgent,
    deleteAgent,
    checkAgentReferences,
    loadProjectAgents,
    loadUserAgents,
    getProjectAgentsCache,
    clearCache
  }
})
