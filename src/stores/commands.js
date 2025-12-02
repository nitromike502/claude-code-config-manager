import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/client'
import { useNotificationsStore } from './notifications'

/**
 * Pinia store for managing command CRUD operations
 * Provides centralized state management for commands across project and user scopes
 */
export const useCommandsStore = defineStore('commands', () => {
  // State
  const projectCommands = ref(new Map()) // projectId -> commands array
  const userCommands = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get notifications store for toast messages
  const notifications = useNotificationsStore()

  /**
   * Update a command (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} commandPath - Command path (relative to .claude/commands/, without .md extension)
   * @param {Object} updates - Properties to update (name, description, content, model, color, etc.)
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, command?: Object, error?: string }
   */
  async function updateCommand(projectId, commandPath, updates, scope) {
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
        ? await api.updateCommand(projectId, commandPath, updates)
        : await api.updateUserCommand(commandPath, updates)

      if (result.success) {
        // Update local state
        if (scope === 'project') {
          const commands = projectCommands.value.get(projectId) || []
          const index = commands.findIndex(c => {
            // Match by filePath or by extracting path from filePath
            const cmdPath = c.filePath.replace(/\.claude\/commands\//, '').replace(/\.md$/, '')
            return cmdPath === commandPath
          })
          if (index !== -1) {
            // Replace with updated command
            commands[index] = result.command
            projectCommands.value.set(projectId, [...commands])
          }
        } else {
          // User scope
          const index = userCommands.value.findIndex(c => {
            const cmdPath = c.filePath.replace(/\.claude\/commands\//, '').replace(/\.md$/, '')
            return cmdPath === commandPath
          })
          if (index !== -1) {
            userCommands.value[index] = result.command
          }
        }

        // Show success notification
        const commandName = result.command?.name || commandPath
        notifications.success(`Command "${commandName}" updated successfully`)

        return { success: true, command: result.command }
      } else {
        throw new Error(result.message || 'Failed to update command')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to update command: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error updating command:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a command (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} commandPath - Command path (relative to .claude/commands/, without .md extension)
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, error?: string }
   */
  async function deleteCommand(projectId, commandPath, scope) {
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
        ? await api.deleteCommand(projectId, commandPath)
        : await api.deleteUserCommand(commandPath)

      if (result.success) {
        // Remove from local state
        if (scope === 'project') {
          const commands = projectCommands.value.get(projectId) || []
          const filtered = commands.filter(c => {
            const cmdPath = c.filePath.replace(/\.claude\/commands\//, '').replace(/\.md$/, '')
            return cmdPath !== commandPath
          })
          projectCommands.value.set(projectId, filtered)
        } else {
          // User scope
          userCommands.value = userCommands.value.filter(c => {
            const cmdPath = c.filePath.replace(/\.claude\/commands\//, '').replace(/\.md$/, '')
            return cmdPath !== commandPath
          })
        }

        // Show success notification
        notifications.success(`Command "${commandPath}" deleted successfully`)

        return { success: true }
      } else {
        throw new Error(result.message || 'Failed to delete command')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to delete command: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error deleting command:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Check if a command has references (is used by other configurations)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} commandPath - Command path (relative to .claude/commands/, without .md extension)
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, hasReferences: boolean, references: Array, error?: string }
   */
  async function checkCommandReferences(projectId, commandPath, scope) {
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
        ? await api.getCommandReferences(projectId, commandPath)
        : await api.getUserCommandReferences(commandPath)

      if (result.success) {
        return {
          success: true,
          hasReferences: result.hasReferences,
          references: result.references || []
        }
      } else {
        throw new Error(result.message || 'Failed to check command references')
      }
    } catch (err) {
      error.value = err.message

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error checking command references:', err)
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
   * Load project commands into store cache
   * Useful for pre-loading or refreshing command data
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} - { success: boolean, commands?: Array, error?: string }
   */
  async function loadProjectCommands(projectId) {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getProjectCommands(projectId)

      if (result.commands) {
        projectCommands.value.set(projectId, result.commands)
        return { success: true, commands: result.commands }
      } else {
        throw new Error('No commands data in response')
      }
    } catch (err) {
      error.value = err.message

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error loading project commands:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load user commands into store cache
   * @returns {Promise<Object>} - { success: boolean, commands?: Array, error?: string }
   */
  async function loadUserCommands() {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getUserCommands()

      if (result.commands) {
        userCommands.value = result.commands
        return { success: true, commands: result.commands }
      } else {
        throw new Error('No commands data in response')
      }
    } catch (err) {
      error.value = err.message

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error loading user commands:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get cached project commands
   * @param {string} projectId - Project identifier
   * @returns {Array} - Commands array (empty if not loaded)
   */
  function getProjectCommandsCache(projectId) {
    return projectCommands.value.get(projectId) || []
  }

  /**
   * Clear all cached commands
   */
  function clearCache() {
    projectCommands.value.clear()
    userCommands.value = []
    error.value = null
  }

  return {
    // State
    projectCommands,
    userCommands,
    isLoading,
    error,

    // Actions
    updateCommand,
    deleteCommand,
    checkCommandReferences,
    loadProjectCommands,
    loadUserCommands,
    getProjectCommandsCache,
    clearCache
  }
})
