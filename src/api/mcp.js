/**
 * MCP Server API Client
 * Handles all MCP server-related API requests
 */

import { fetchWithTimeout, BASE_URL } from './client'

// ========================================
// MCP Read Operations
// ========================================

/**
 * Get project MCP servers
 * @param {string} projectId - Project identifier
 * @returns {Promise<Object>} - { mcpServers: [], warnings: [] }
 */
export async function getProjectMcp(projectId) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/mcp`)
  return response.json()
}

/**
 * Get user MCP servers
 * @returns {Promise<Object>} - { mcp: [], warnings: [] }
 */
export async function getUserMcp() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/mcp`)
  return response.json()
}

// ========================================
// MCP Copy Operations
// ========================================

/**
 * Copy MCP server to target scope
 * @param {Object} request - Copy request parameters
 * @param {string} request.sourcePath - Source project path or 'user'
 * @param {string} request.targetScope - Target scope ('user' or 'project')
 * @param {string} [request.targetProjectId] - Target project ID (required for project scope)
 * @param {string} [request.conflictStrategy] - Conflict resolution strategy ('skip', 'overwrite', 'rename')
 * @returns {Promise<Object>} - { success: boolean, message: string, warnings?: string[] }
 */
export async function copyMcp(request) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/copy/mcp`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}

// ========================================
// MCP CRUD Operations
// ========================================

/**
 * Update a project MCP server
 * @param {string} projectId - Project identifier
 * @param {string} serverName - MCP server name (current name)
 * @param {Object} updates - Properties to update
 * @param {string} [updates.type] - Server type ('stdio' or 'sse')
 * @param {string} [updates.command] - Command to execute (stdio only)
 * @param {string[]} [updates.args] - Command arguments (stdio only)
 * @param {Object} [updates.env] - Environment variables (stdio only)
 * @param {string} [updates.url] - Server URL (sse only)
 * @param {Object} [updates.headers] - HTTP headers (sse only)
 * @param {boolean} [updates.enabled] - Whether server is enabled
 * @returns {Promise<Object>} - { success: boolean, server: Object }
 */
export async function updateProjectMcp(projectId, serverName, updates) {
  const encodedName = encodeURIComponent(serverName)
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/mcp/${encodedName}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Update a user-level MCP server
 * @param {string} serverName - MCP server name (current name)
 * @param {Object} updates - Properties to update
 * @param {string} [updates.type] - Server type ('stdio' or 'sse')
 * @param {string} [updates.command] - Command to execute (stdio only)
 * @param {string[]} [updates.args] - Command arguments (stdio only)
 * @param {Object} [updates.env] - Environment variables (stdio only)
 * @param {string} [updates.url] - Server URL (sse only)
 * @param {Object} [updates.headers] - HTTP headers (sse only)
 * @param {boolean} [updates.enabled] - Whether server is enabled
 * @returns {Promise<Object>} - { success: boolean, server: Object }
 */
export async function updateUserMcp(serverName, updates) {
  const encodedName = encodeURIComponent(serverName)
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/mcp/${encodedName}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Delete a project MCP server
 * @param {string} projectId - Project identifier
 * @param {string} serverName - MCP server name
 * @returns {Promise<Object>} - { success: boolean, message: string, references?: string[] }
 */
export async function deleteProjectMcpServer(projectId, serverName) {
  const encodedName = encodeURIComponent(serverName)
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/mcp/${encodedName}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * Delete a user-level MCP server
 * @param {string} serverName - MCP server name
 * @returns {Promise<Object>} - { success: boolean, message: string, references?: string[] }
 */
export async function deleteUserMcpServer(serverName) {
  const encodedName = encodeURIComponent(serverName)
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/mcp/${encodedName}`, {
    method: 'DELETE'
  })
  return response.json()
}

// Default export with all MCP functions
export default {
  getProjectMcp,
  getUserMcp,
  copyMcp,
  updateProjectMcp,
  updateUserMcp,
  deleteProjectMcpServer,
  deleteUserMcpServer
}
