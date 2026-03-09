import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api'
import { useNotificationsStore } from './notifications'

/**
 * Pinia store for managing rule operations
 * Provides centralized state management for rules across project and user scopes
 */
export const useRulesStore = defineStore('rules', () => {
  // State
  const projectRules = ref(new Map()) // projectId -> rules array
  const userRules = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get notifications store for toast messages
  const notifications = useNotificationsStore()

  /**
   * Load project rules into store cache
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} - { success: boolean, rules?: Array, error?: string }
   */
  async function loadProjectRules(projectId) {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getProjectRules(projectId)

      if (result.rules) {
        projectRules.value.set(projectId, result.rules)
        return { success: true, rules: result.rules }
      } else {
        throw new Error('No rules data in response')
      }
    } catch (err) {
      error.value = err.message

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error loading project rules:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load user rules into store cache
   * @returns {Promise<Object>} - { success: boolean, rules?: Array, error?: string }
   */
  async function loadUserRules() {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getUserRules()

      if (result.rules) {
        userRules.value = result.rules
        return { success: true, rules: result.rules }
      } else {
        throw new Error('No rules data in response')
      }
    } catch (err) {
      error.value = err.message

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error loading user rules:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update a rule (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} ruleName - Current rule name
   * @param {Object} updates - Properties to update (content, paths, name)
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, rule?: Object, error?: string }
   */
  async function updateRule(projectId, ruleName, updates, scope) {
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
        ? await api.updateProjectRule(projectId, ruleName, updates)
        : await api.updateUserRule(ruleName, updates)

      if (result.success) {
        // Update local state
        if (scope === 'project') {
          const rules = projectRules.value.get(projectId) || []
          const index = rules.findIndex(r => r.name === ruleName)
          if (index !== -1) {
            rules[index] = result.rule
            projectRules.value.set(projectId, [...rules])
          }
        } else {
          const index = userRules.value.findIndex(r => r.name === ruleName)
          if (index !== -1) {
            userRules.value[index] = result.rule
          }
        }

        // Show success notification
        notifications.success(`Rule "${ruleName}" updated successfully`)

        return { success: true, rule: result.rule }
      } else {
        throw new Error(result.message || 'Failed to update rule')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to update rule: ${err.message}`)

      if (!err.isExpected) {
        console.error('Error updating rule:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a rule (project or user scope)
   * @param {string} scope - 'project' or 'user'
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} ruleName - Rule name to delete
   * @returns {Promise<Object>} - { success: boolean, error?: string }
   */
  async function deleteRule(scope, projectId, ruleName) {
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
        ? await api.deleteProjectRule(projectId, ruleName)
        : await api.deleteUserRule(ruleName)

      if (result.success) {
        // Remove from local state
        if (scope === 'project') {
          const rules = projectRules.value.get(projectId) || []
          const filtered = rules.filter(r => r.name !== ruleName)
          projectRules.value.set(projectId, filtered)
        } else {
          // User scope
          userRules.value = userRules.value.filter(r => r.name !== ruleName)
        }

        // Show success notification
        notifications.success(`Rule "${ruleName}" deleted successfully`)

        return { success: true }
      } else {
        throw new Error(result.message || 'Failed to delete rule')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to delete rule: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error deleting rule:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Copy a rule to target scope
   * @param {Object} payload - { sourcePath, targetScope, targetProjectId, conflictStrategy }
   * @returns {Promise<Object>} - { success: boolean, error?: string }
   */
  async function copyRule(payload) {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.copyRule(payload)

      if (result.success) {
        notifications.success('Rule copied successfully')
        return { success: true, ...result }
      } else {
        throw new Error(result.message || 'Failed to copy rule')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to copy rule: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error copying rule:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get cached project rules
   * @param {string} projectId - Project identifier
   * @returns {Array} - Rules array (empty if not loaded)
   */
  function getProjectRulesCache(projectId) {
    return projectRules.value.get(projectId) || []
  }

  /**
   * Clear all cached rules
   */
  function clearCache() {
    projectRules.value.clear()
    userRules.value = []
    error.value = null
  }

  return {
    // State
    projectRules,
    userRules,
    isLoading,
    error,

    // Actions
    loadProjectRules,
    loadUserRules,
    updateRule,
    deleteRule,
    copyRule,
    getProjectRulesCache,
    clearCache
  }
})
