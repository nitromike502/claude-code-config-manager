import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/client'
import { useNotificationsStore } from './notifications'

/**
 * Pinia store for managing MCP server CRUD operations
 * Provides centralized state management for MCP servers across project and user scopes
 *
 * MCP Server Identification:
 * MCP servers are identified by their server name (unique within a scope)
 */
export const useMcpStore = defineStore('mcp', () => {
  // State
  const projectMcpServers = ref(new Map()) // projectId -> MCP servers array
  const userMcpServers = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get notifications store for toast messages
  const notifications = useNotificationsStore()

  /**
   * Update an MCP server (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} serverName - MCP server name
   * @param {Object} updates - Properties to update (type, command, args, env, url, headers, enabled, etc.)
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, server?: Object, error?: string }
   */
  async function updateMcpServer(projectId, serverName, updates, scope) {
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
        ? await api.updateProjectMcp(projectId, serverName, updates)
        : await api.updateUserMcp(serverName, updates)

      if (result.success) {
        // Update local state
        if (scope === 'project') {
          const servers = projectMcpServers.value.get(projectId) || []
          // Find server by name
          const index = servers.findIndex(s => s.name === serverName)
          if (index !== -1) {
            // Replace with updated server
            servers[index] = result.server
            projectMcpServers.value.set(projectId, [...servers])
          }
        } else {
          // User scope
          const index = userMcpServers.value.findIndex(s => s.name === serverName)
          if (index !== -1) {
            userMcpServers.value[index] = result.server
          }
        }

        // Show success notification
        notifications.success(`MCP server "${serverName}" updated successfully`)

        return { success: true, server: result.server }
      } else {
        throw new Error(result.error || result.message || 'Failed to update MCP server')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to update MCP server: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error updating MCP server:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load project MCP servers into store cache
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} - { success: boolean, servers?: Array, error?: string }
   */
  async function loadProjectMcp(projectId) {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getProjectMcp(projectId)

      if (result.mcpServers) {
        projectMcpServers.value.set(projectId, result.mcpServers)
        return { success: true, servers: result.mcpServers }
      } else {
        throw new Error('No MCP servers data in response')
      }
    } catch (err) {
      error.value = err.message

      if (!err.isExpected) {
        console.error('Error loading project MCP servers:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load user MCP servers into store cache
   * @returns {Promise<Object>} - { success: boolean, servers?: Array, error?: string }
   */
  async function loadUserMcp() {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getUserMcp()

      if (result.mcp) {
        userMcpServers.value = result.mcp
        return { success: true, servers: result.mcp }
      } else {
        throw new Error('No MCP servers data in response')
      }
    } catch (err) {
      error.value = err.message

      if (!err.isExpected) {
        console.error('Error loading user MCP servers:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete an MCP server (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} serverName - MCP server name to delete
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, message?: string, references?: Array, error?: string }
   */
  async function deleteMcpServer(projectId, serverName, scope) {
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
        ? await api.deleteProjectMcpServer(projectId, serverName)
        : await api.deleteUserMcpServer(serverName)

      if (result.success) {
        // Remove from local state
        if (scope === 'project') {
          const servers = projectMcpServers.value.get(projectId) || []
          const filtered = servers.filter(s => s.name !== serverName)
          projectMcpServers.value.set(projectId, filtered)
        } else {
          // User scope
          userMcpServers.value = userMcpServers.value.filter(s => s.name !== serverName)
        }

        // Show success notification
        notifications.success(`MCP server "${serverName}" deleted successfully`)

        return {
          success: true,
          message: result.message,
          references: result.references
        }
      } else {
        throw new Error(result.message || 'Failed to delete MCP server')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to delete MCP server: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error deleting MCP server:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get cached project MCP servers
   * @param {string} projectId - Project identifier
   * @returns {Array} - MCP servers array (empty if not loaded)
   */
  function getProjectMcpCache(projectId) {
    return projectMcpServers.value.get(projectId) || []
  }

  /**
   * Clear all cached MCP servers
   */
  function clearCache() {
    projectMcpServers.value.clear()
    userMcpServers.value = []
    error.value = null
  }

  return {
    // State
    projectMcpServers,
    userMcpServers,
    isLoading,
    error,

    // Actions
    updateMcpServer,
    deleteMcpServer,
    loadProjectMcp,
    loadUserMcp,
    getProjectMcpCache,
    clearCache
  }
})
