/**
 * Rules API module
 * Provides API functions for rules-related operations
 */

import { fetchWithTimeout, BASE_URL } from './client'

/**
 * Get project rules
 * @param {string} projectId - Project identifier
 * @returns {Promise<Object>} - { rules: [], warnings: [] }
 */
export async function getProjectRules(projectId) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/rules`)
  return response.json()
}

/**
 * Get user rules
 * @returns {Promise<Object>} - { rules: [], warnings: [] }
 */
export async function getUserRules() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/rules`)
  return response.json()
}

/**
 * Copy rule to target scope
 * @param {Object} request - { sourcePath, targetScope, targetProjectId, conflictStrategy }
 * @returns {Promise<Object>} - { success: boolean, message: string, createdPath?: string }
 */
export async function copyRule(request) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/copy/rule`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}

/**
 * Update a project rule
 * @param {string} projectId - Project identifier
 * @param {string} ruleName - Rule name (path relative to rules dir)
 * @param {Object} updates - Properties to update (content, paths, name)
 * @returns {Promise<Object>} - { success: boolean, rule: Object }
 */
export async function updateProjectRule(projectId, ruleName, updates) {
  const encodedName = encodeURIComponent(ruleName)
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/rules/${encodedName}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Update a user-level rule
 * @param {string} ruleName - Rule name (path relative to rules dir)
 * @param {Object} updates - Properties to update (content, paths, name)
 * @returns {Promise<Object>} - { success: boolean, rule: Object }
 */
export async function updateUserRule(ruleName, updates) {
  const encodedName = encodeURIComponent(ruleName)
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/rules/${encodedName}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Delete a project rule
 * @param {string} projectId - Project identifier
 * @param {string} ruleName - Rule name
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function deleteProjectRule(projectId, ruleName) {
  const encodedName = encodeURIComponent(ruleName)
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/rules/${encodedName}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * Delete a user-level rule
 * @param {string} ruleName - Rule name
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function deleteUserRule(ruleName) {
  const encodedName = encodeURIComponent(ruleName)
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/rules/${encodedName}`, {
    method: 'DELETE'
  })
  return response.json()
}
