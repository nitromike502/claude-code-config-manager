import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/client'
import { useNotificationsStore } from './notifications'

/**
 * Pinia store for managing MCP server CRUD operations
 * Provides centralized state management for MCP servers across project and user scopes
 *
 * MCP Server Identification:
 * MCP servers are identified by their name property
 */
export const useMcpStore = defineStore('mcp', () => {
  // State
  const projectMcpServers = ref(new Map()) // projectId -> servers array
  const userMcpServers = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get notifications store for toast messages
  const notifications = useNotificationsStore()

  /**
   * Update an MCP server (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} serverName - MCP server name
   * @param {Object} updates - Properties to update (name, type, command, args, env, url, headers, enabled, timeout, retries)
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
          // Find server by name (or by old name if renaming)
          const oldName = updates.name && updates.name !== serverName ? serverName : result.server.name
          const index = servers.findIndex(s => s.name === oldName)
          if (index !== -1) {
            // Replace with updated server
            servers[index] = result.server
            projectMcpServers.value.set(projectId, [...servers])
          }
        } else {
          // User scope
          const oldName = updates.name && updates.name !== serverName ? serverName : result.server.name
          const index = userMcpServers.value.findIndex(s => s.name === oldName)
          if (index !== -1) {
            userMcpServers.value[index] = result.server
          }
        }

        // Show success notification
        notifications.success(`MCP server "${result.server.name}" updated successfully`)

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
   * @returns {Promise<Object>} - { success: boolean, mcpServers?: Array, error?: string }
   */
  async function loadProjectMcpServers(projectId) {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getProjectMcp(projectId)

      if (result.mcp) {
        projectMcpServers.value.set(projectId, result.mcp)
        return { success: true, mcpServers: result.mcp }
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
   * @returns {Promise<Object>} - { success: boolean, mcpServers?: Array, error?: string }
   */
  async function loadUserMcpServers() {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getUserMcp()

      if (result.mcp !== undefined) {
        userMcpServers.value = result.mcp
        return { success: true, mcpServers: result.mcp }
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
   * Get cached project MCP servers
   * @param {string} projectId - Project identifier
   * @returns {Array} - MCP servers array (empty if not loaded)
   */
  function getProjectMcpServersCache(projectId) {
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
    loadProjectMcpServers,
    loadUserMcpServers,
    getProjectMcpServersCache,
    clearCache
  }
})
