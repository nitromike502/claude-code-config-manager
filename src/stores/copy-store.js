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

      // Update state with last operation result
      lastCopyResult.value = result

      return result
    } finally {
      // Always reset copying flag, even if error occurs
      copying.value = false
    }
  }

  /**
   * Map configuration type to appropriate API endpoint method
   *
   * @param {string} type - Configuration type (agent, command, hook, mcp)
   * @returns {string} API endpoint path segment
   * @todo Implement in TASK-3.5.4
   */
  function getEndpointForType(type) {
    // TODO: Implement in TASK-3.5.4
    throw new Error('getEndpointForType not yet implemented')
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
