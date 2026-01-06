/**
 * Agent API module
 * Provides API functions for agent-related operations
 */

import { fetchWithTimeout, BASE_URL } from './client'

/**
 * Get project agents
 * @param {string} projectId - Project identifier
 * @returns {Promise<Object>} - { agents: [], warnings: [] }
 */
export async function getProjectAgents(projectId) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/agents`)
  return response.json()
}

/**
 * Get user agents
 * @returns {Promise<Object>} - { agents: [], warnings: [] }
 */
export async function getUserAgents() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/agents`)
  return response.json()
}

/**
 * Update a project agent
 * @param {string} projectId - Project identifier
 * @param {string} agentName - Agent name (current name)
 * @param {Object} updates - Properties to update
 * @returns {Promise<Object>} - { success: boolean, agent: Object }
 */
export async function updateProjectAgent(projectId, agentName, updates) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/agents/${agentName}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Update a user-level agent
 * @param {string} agentName - Agent name (current name)
 * @param {Object} updates - Properties to update
 * @returns {Promise<Object>} - { success: boolean, agent: Object }
 */
export async function updateUserAgent(agentName, updates) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/agents/${agentName}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Delete a project agent
 * @param {string} projectId - Project identifier
 * @param {string} agentName - Agent name
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function deleteProjectAgent(projectId, agentName) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/agents/${agentName}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * Delete a user-level agent
 * @param {string} agentName - Agent name
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function deleteUserAgent(agentName) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/agents/${agentName}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * Get references to a project agent
 * @param {string} projectId - Project identifier
 * @param {string} agentName - Agent name
 * @returns {Promise<Object>} - { success: boolean, references: Array, hasReferences: boolean }
 */
export async function getProjectAgentReferences(projectId, agentName) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/agents/${agentName}/references`)
  return response.json()
}

/**
 * Get references to a user-level agent
 * @param {string} agentName - Agent name
 * @returns {Promise<Object>} - { success: boolean, references: Array, hasReferences: boolean }
 */
export async function getUserAgentReferences(agentName) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/agents/${agentName}/references`)
  return response.json()
}

/**
 * Copy agent to target scope
 * @param {Object} request - { sourcePath, targetScope, targetProjectId, conflictStrategy }
 * @returns {Promise<Object>} - { success: boolean, message: string, createdPath?: string }
 */
export async function copyAgent(request) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/copy/agent`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}
