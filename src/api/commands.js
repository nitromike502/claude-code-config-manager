/**
 * API client for command-related operations
 * Handles project and user-level command CRUD operations
 */

import { fetchWithTimeout, BASE_URL } from './client'

// ========================================
// Command Read Operations
// ========================================

/**
 * Get project commands
 * @param {string} projectId - Project identifier
 * @returns {Promise<Object>} - { commands: [], warnings: [] }
 */
export async function getProjectCommands(projectId) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/commands`)
  return response.json()
}

/**
 * Get user commands
 * @returns {Promise<Object>} - { commands: [], warnings: [] }
 */
export async function getUserCommands() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/commands`)
  return response.json()
}

// ========================================
// Command Copy Operations
// ========================================

/**
 * Copy command to target scope
 * @param {Object} request - { sourcePath, targetScope, targetProjectId, conflictStrategy }
 * @returns {Promise<Object>} - { success: boolean, message: string, createdPath?: string }
 */
export async function copyCommand(request) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/copy/command`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}

// ========================================
// Command CRUD Operations
// ========================================

/**
 * Update a project command
 * @param {string} projectId - Project identifier
 * @param {string} commandPath - Command path (e.g., 'utils/helper.md')
 * @param {Object} updates - Properties to update
 * @returns {Promise<Object>} - { success: boolean, command: Object }
 */
export async function updateProjectCommand(projectId, commandPath, updates) {
  const encodedPath = encodeURIComponent(commandPath)
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/commands/${encodedPath}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Delete a project command
 * @param {string} projectId - Project identifier
 * @param {string} commandPath - Command path (e.g., 'utils/helper.md')
 * @returns {Promise<Object>} - { success: boolean, message?: string }
 */
export async function deleteProjectCommand(projectId, commandPath) {
  const encodedPath = encodeURIComponent(commandPath)
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/commands/${encodedPath}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * Get references to a project command
 * @param {string} projectId - Project identifier
 * @param {string} commandPath - Command path (e.g., 'utils/helper.md')
 * @returns {Promise<Object>} - { success: boolean, references: Array, hasReferences: boolean }
 */
export async function getProjectCommandReferences(projectId, commandPath) {
  const encodedPath = encodeURIComponent(commandPath)
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/commands/${encodedPath}/references`)
  return response.json()
}

/**
 * Update a user-level command
 * @param {string} commandPath - Command path (e.g., 'utils/helper.md')
 * @param {Object} updates - Properties to update
 * @returns {Promise<Object>} - { success: boolean, command: Object }
 */
export async function updateUserCommand(commandPath, updates) {
  const encodedPath = encodeURIComponent(commandPath)
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/commands/${encodedPath}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Delete a user-level command
 * @param {string} commandPath - Command path (e.g., 'utils/helper.md')
 * @returns {Promise<Object>} - { success: boolean, message?: string }
 */
export async function deleteUserCommand(commandPath) {
  const encodedPath = encodeURIComponent(commandPath)
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/commands/${encodedPath}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * Get references to a user-level command
 * @param {string} commandPath - Command path (e.g., 'utils/helper.md')
 * @returns {Promise<Object>} - { success: boolean, references: Array, hasReferences: boolean }
 */
export async function getUserCommandReferences(commandPath) {
  const encodedPath = encodeURIComponent(commandPath)
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/commands/${encodedPath}/references`)
  return response.json()
}

// Default export with all command functions
export default {
  getProjectCommands,
  getUserCommands,
  copyCommand,
  updateProjectCommand,
  deleteProjectCommand,
  getProjectCommandReferences,
  updateUserCommand,
  deleteUserCommand,
  getUserCommandReferences
}
