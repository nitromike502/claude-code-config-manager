import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api'
import { useNotificationsStore } from './notifications'

/**
 * Pinia store for managing hook CRUD operations
 * Provides centralized state management for hooks across project and user scopes
 *
 * Hook Identification:
 * Hooks are identified by a composite ID: event::matcher::index
 * - event: The hook event type (PreToolUse, PostToolUse, Stop, etc.)
 * - matcher: For matcher-based events, the tool matcher (e.g., "Bash", "Read|Write")
 * - index: Position in the array of hooks with same event+matcher
 */
export const useHooksStore = defineStore('hooks', () => {
  // State
  const projectHooks = ref(new Map()) // projectId -> hooks array
  const userHooks = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get notifications store for toast messages
  const notifications = useNotificationsStore()

  /**
   * Build hookId from hook object
   * @param {Object} hook - Hook object with event, matcher, and index properties
   * @returns {string} hookId in format event::matcher::index
   */
  function buildHookId(hook) {
    return `${hook.event}::${hook.matcher || ''}::${hook.index || 0}`
  }

  /**
   * Update a hook (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} hookId - Hook identifier (event::matcher::index)
   * @param {Object} updates - Properties to update (matcher, type, command, timeout, enabled, etc.)
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, hook?: Object, error?: string }
   */
  async function updateHook(projectId, hookId, updates, scope) {
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
        ? await api.updateProjectHook(projectId, hookId, updates)
        : await api.updateUserHook(hookId, updates)

      if (result.success) {
        // Update local state
        if (scope === 'project') {
          const hooks = projectHooks.value.get(projectId) || []
          // Find hook by hookId
          const index = hooks.findIndex(h => buildHookId(h) === hookId)
          if (index !== -1) {
            // Replace with updated hook
            hooks[index] = result.hook
            projectHooks.value.set(projectId, [...hooks])
          }
        } else {
          // User scope
          const index = userHooks.value.findIndex(h => buildHookId(h) === hookId)
          if (index !== -1) {
            userHooks.value[index] = result.hook
          }
        }

        // Show success notification
        const eventType = hookId.split('::')[0]
        notifications.success(`${eventType} hook updated successfully`)

        return { success: true, hook: result.hook }
      } else {
        throw new Error(result.error || result.message || 'Failed to update hook')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to update hook: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error updating hook:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load project hooks into store cache
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} - { success: boolean, hooks?: Array, error?: string }
   */
  async function loadProjectHooks(projectId) {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getProjectHooks(projectId)

      if (result.hooks) {
        projectHooks.value.set(projectId, result.hooks)
        return { success: true, hooks: result.hooks }
      } else {
        throw new Error('No hooks data in response')
      }
    } catch (err) {
      error.value = err.message

      if (!err.isExpected) {
        console.error('Error loading project hooks:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load user hooks into store cache
   * @returns {Promise<Object>} - { success: boolean, hooks?: Array, error?: string }
   */
  async function loadUserHooks() {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getUserHooks()

      if (result.hooks) {
        userHooks.value = result.hooks
        return { success: true, hooks: result.hooks }
      } else {
        throw new Error('No hooks data in response')
      }
    } catch (err) {
      error.value = err.message

      if (!err.isExpected) {
        console.error('Error loading user hooks:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a hook (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} hookId - Hook identifier (event::matcher::index)
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, error?: string }
   */
  async function deleteHook(projectId, hookId, scope = 'project') {
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
        ? await api.deleteProjectHook(projectId, hookId)
        : await api.deleteUserHook(hookId)

      if (result.success) {
        // Refresh hooks from API since indexes may have changed after deletion
        if (scope === 'project') {
          await loadProjectHooks(projectId)
        } else {
          await loadUserHooks()
        }

        // Show success notification
        const eventType = hookId.split('::')[0]
        notifications.success(`${eventType} hook deleted successfully`)

        return { success: true }
      } else {
        throw new Error(result.error || result.message || 'Failed to delete hook')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to delete hook: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error deleting hook:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get cached project hooks
   * @param {string} projectId - Project identifier
   * @returns {Array} - Hooks array (empty if not loaded)
   */
  function getProjectHooksCache(projectId) {
    return projectHooks.value.get(projectId) || []
  }

  /**
   * Clear all cached hooks
   */
  function clearCache() {
    projectHooks.value.clear()
    userHooks.value = []
    error.value = null
  }

  return {
    // State
    projectHooks,
    userHooks,
    isLoading,
    error,

    // Actions
    buildHookId,
    updateHook,
    deleteHook,
    loadProjectHooks,
    loadUserHooks,
    getProjectHooksCache,
    clearCache
  }
})
