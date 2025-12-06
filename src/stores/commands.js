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
   * @param {string} scope - 'project' or 'user'
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} commandPath - Current command path (e.g., 'utils/helper.md')
   * @param {Object} updates - Properties to update (name, description, model, allowedTools, argumentHint, disableModelInvocation)
   * @returns {Promise<Object>} - { success: boolean, command?: Object, error?: string }
   */
  async function updateCommand(scope, projectId, commandPath, updates) {
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
        ? await api.updateProjectCommand(projectId, commandPath, updates)
        : await api.updateUserCommand(commandPath, updates)

      if (result.success) {
        // Update local state
        if (scope === 'project') {
          const commands = projectCommands.value.get(projectId) || []
          const index = commands.findIndex(c => c.path === commandPath)
          if (index !== -1) {
            // Replace with updated command
            commands[index] = result.command
            projectCommands.value.set(projectId, [...commands])
          }
        } else {
          // User scope
          const index = userCommands.value.findIndex(c => c.path === commandPath)
          if (index !== -1) {
            userCommands.value[index] = result.command
          }
        }

        // Show success notification
        notifications.success(`Command updated successfully`)

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
   * @param {string} scope - 'project' or 'user'
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} commandPath - Command path to delete (e.g., 'utils/helper.md')
   * @returns {Promise<Object>} - { success: boolean, error?: string }
   */
  async function deleteCommand(scope, projectId, commandPath) {
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
        ? await api.deleteProjectCommand(projectId, commandPath)
        : await api.deleteUserCommand(commandPath)

      if (result.success) {
        // Remove from local state
        if (scope === 'project') {
          const commands = projectCommands.value.get(projectId) || []
          const filtered = commands.filter(c => c.path !== commandPath)
          projectCommands.value.set(projectId, filtered)
        } else {
          // User scope
          userCommands.value = userCommands.value.filter(c => c.path !== commandPath)
        }

        // Show success notification
        notifications.success(`Command deleted successfully`)

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
   * @param {string} scope - 'project' or 'user'
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} commandPath - Command path (e.g., 'utils/helper.md')
   * @returns {Promise<Array>} - Array of reference objects
   */
  async function getCommandReferences(scope, projectId, commandPath) {
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
        ? await api.getProjectCommandReferences(projectId, commandPath)
        : await api.getUserCommandReferences(commandPath)

      if (result.success) {
        return result.references || []
      } else {
        throw new Error(result.message || 'Failed to get command references')
      }
    } catch (err) {
      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error getting command references:', err)
      }

      // Return empty array on error (fail gracefully)
      return []
    }
  }

  // Return store API
  return {
    // State
    projectCommands,
    userCommands,
    isLoading,
    error,

    // Actions
    updateCommand,
    deleteCommand,
    getCommandReferences
  }
})
