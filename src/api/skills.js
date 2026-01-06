/**
 * Skills API module
 * Handles all skill-related API operations (GET, UPDATE, DELETE, COPY)
 */

import { fetchWithTimeout, BASE_URL } from './client'

/**
 * Get project skills
 * @param {string} projectId - Project identifier
 * @returns {Promise<Object>} - { skills: [], warnings: [] }
 */
export async function getProjectSkills(projectId) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/skills`)
  return response.json()
}

/**
 * Get user skills
 * @returns {Promise<Object>} - { skills: [], warnings: [] }
 */
export async function getUserSkills() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/skills`)
  return response.json()
}

/**
 * Update a project skill
 * @param {string} projectId - Project identifier
 * @param {string} skillName - Skill name (directory name)
 * @param {Object} updates - Properties to update (description, allowedTools, content)
 * @returns {Promise<Object>} - { success: boolean, skill: Object, warnings?: string[] }
 */
export async function updateProjectSkill(projectId, skillName, updates) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/skills/${skillName}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Update a user-level skill
 * @param {string} skillName - Skill name (directory name)
 * @param {Object} updates - Properties to update (description, allowedTools, content)
 * @returns {Promise<Object>} - { success: boolean, skill: Object, warnings?: string[] }
 */
export async function updateUserSkill(skillName, updates) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/skills/${skillName}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.json()
}

/**
 * Delete a project skill
 * @param {string} projectId - Project identifier
 * @param {string} skillName - Skill name (directory name)
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function deleteProjectSkill(projectId, skillName) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/skills/${skillName}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * Delete a user-level skill
 * @param {string} skillName - Skill name (directory name)
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function deleteUserSkill(skillName) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/skills/${skillName}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * Copy skill to target scope
 * @param {Object} request - { sourcePath, targetScope, targetProjectId, conflictStrategy, acknowledgedWarnings }
 * @returns {Promise<Object>} - { success: boolean, message: string, createdPath?: string, warnings?: string[] }
 */
export async function copySkill(request) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/copy/skill`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}
