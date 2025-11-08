import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/client.js'

/**
 * Copy Store - Manages state for copy configuration operations
 *
 * Handles copying agents, commands, hooks, and MCP servers
 * between projects and user-level configurations.
 */
export const useCopyStore = defineStore('copy', () => {
  // State

  /**
   * Indicates if a copy operation is currently in progress
   * @type {import('vue').Ref<boolean>}
   */
  const copying = ref(false)

  /**
   * Stores the result of the last copy operation
   * @type {import('vue').Ref<Object|null>}
   */
  const lastCopyResult = ref(null)

  // Actions

  /**
   * Orchestrate a copy operation for a configuration item
   *
   * @param {Object} request - Copy request parameters
   * @param {Object} request.sourceConfig - Source configuration object with type and path
   * @param {string} request.sourceConfig.type - Configuration type (agent, command, hook, mcp)
   * @param {string} request.sourceConfig.path - Source file path (or filePath)
   * @param {string} request.targetScope - Target scope: 'user' or 'project'
   * @param {string|null} request.targetProjectId - Target project ID (required if targetScope is 'project')
   * @param {string} request.conflictStrategy - How to handle conflicts (skip, overwrite, rename)
   * @returns {Promise<Object>} Copy operation result with success, message, conflict?, copiedPath?
   */
  async function copyConfiguration(request) {
    copying.value = true

    try {
      const { sourceConfig, targetScope, targetProjectId, conflictStrategy } = request

      // Validate required fields
      if (!sourceConfig || !sourceConfig.type) {
        throw new Error('sourceConfig.type is required')
      }
      if (!targetScope) {
        throw new Error('targetScope is required')
      }
      if (targetScope === 'project' && !targetProjectId) {
        throw new Error('targetProjectId is required when targetScope is "project"')
      }

      // Determine which API method to call based on config type
      const endpointMethod = getEndpointForType(sourceConfig.type)

      // Extract source path (handle both 'path' and 'filePath' properties)
      const sourcePath = sourceConfig.path || sourceConfig.filePath
      if (!sourcePath) {
        throw new Error('sourceConfig must have either path or filePath property')
      }

      // Build request payload for API
      const payload = {
        sourcePath,
        targetScope,
        targetProjectId: targetScope === 'project' ? targetProjectId : null,
        conflictStrategy
      }

      // Call API
      const result = await api[endpointMethod](payload)

      // Check for conflict (409) - return without throwing
      // Conflicts are not errors - UI will handle resolution
      if (result.conflict) {
        lastCopyResult.value = result
        return result
      }

      // Update state with last operation result
      lastCopyResult.value = result

      return result
    } catch (error) {
      // Map HTTP errors to user-friendly messages
      let userMessage

      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        userMessage = 'Permission denied - Check file permissions'
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        userMessage = 'Source file not found'
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        userMessage = `Invalid request - ${error.message}`
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        userMessage = 'An error occurred - Please try again'
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        userMessage = 'Network error - Check your connection'
      } else {
        userMessage = `Copy failed - ${error.message}`
      }

      throw new Error(userMessage)
    } finally {
      // Always reset copying flag, even if error occurs
      copying.value = false
    }
  }

  /**
   * Map configuration type to appropriate API client method name
   *
   * @param {string} type - Configuration type (agent, command, skill, hook, mcp)
   * @returns {string} API client method name
   * @throws {Error} If type is unknown
   */
  function getEndpointForType(type) {
    const typeMap = {
      'agent': 'copyAgent',
      'command': 'copyCommand',
      'skill': 'copySkill',
      'hook': 'copyHook',
      'mcp': 'copyMcp'
    }

    if (!typeMap[type]) {
      throw new Error(`Unknown configuration type: ${type}`)
    }

    return typeMap[type]
  }

  return {
    // State
    copying,
    lastCopyResult,

    // Actions
    copyConfiguration,
    getEndpointForType
  }
})
