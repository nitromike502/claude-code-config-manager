/**
 * Hooks API Module
 * Provides functions for interacting with hook-related endpoints
 */

import { fetchWithTimeout, BASE_URL } from './client'

/**
 * Get project hooks
 * @param {string} projectId - Project identifier
 * @returns {Promise<Object>} - { hooks: [], warnings: [] }
 */
export async function getProjectHooks(projectId) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/hooks`)
  return response.json()
}

/**
 * Get user hooks
 * @returns {Promise<Object>} - { hooks: [], warnings: [] }
 */
export async function getUserHooks() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/hooks`)
  return response.json()
}

/**
 * Update a project hook
 * @param {string} projectId - Project identifier
 * @param {string} hookId - Hook identifier (format: event::matcher::index)
 * @param {Object} updates - Properties to update (matcher, type, command, timeout, enabled, etc.)
 * @returns {Promise<Object>} - { success: boolean, hook: Object }
 */
export async function updateProjectHook(projectId, hookId, updates) {
  const encodedHookId = encodeURIComponent(hookId)
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/hooks/${encodedHookId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Update a user-level hook
 * @param {string} hookId - Hook identifier (format: event::matcher::index)
 * @param {Object} updates - Properties to update (matcher, type, command, timeout, enabled, etc.)
 * @returns {Promise<Object>} - { success: boolean, hook: Object }
 */
export async function updateUserHook(hookId, updates) {
  const encodedHookId = encodeURIComponent(hookId)
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/hooks/${encodedHookId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Delete a project hook
 * @param {string} projectId - Project identifier
 * @param {string} hookId - Hook identifier (format: event::matcher::index)
 * @returns {Promise<Object>} - { success: boolean, message?: string }
 */
export async function deleteProjectHook(projectId, hookId) {
  const encodedHookId = encodeURIComponent(hookId)
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/hooks/${encodedHookId}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * Delete a user-level hook
 * @param {string} hookId - Hook identifier (format: event::matcher::index)
 * @returns {Promise<Object>} - { success: boolean, message?: string }
 */
export async function deleteUserHook(hookId) {
  const encodedHookId = encodeURIComponent(hookId)
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/hooks/${encodedHookId}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * Copy hook to target scope
 * @param {Object} request - { sourcePath, targetScope, targetProjectId, conflictStrategy }
 * @returns {Promise<Object>} - { success: boolean, message: string, warnings?: string[] }
 */
export async function copyHook(request) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/copy/hook`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}
