/**
 * Centralized API client for all backend requests
 * Provides consistent error handling, timeout management, and request/response interceptors
 */

/**
 * Get API base URL based on environment
 *
 * Priority order:
 * 1. VITE_API_BASE_URL environment variable (deployment override)
 * 2. Development mode: localhost:8420 (Vite dev server)
 * 3. Same origin (production default)
 *
 * @returns {string} Base URL for API requests
 */
function getBaseUrl() {
  // Priority 1: Explicit environment variable
  // Allows deployment-specific configuration (Docker, Kubernetes, etc.)
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    console.log('[API Client] Using env-specified base URL:', envApiUrl);
    return envApiUrl;
  }

  // Priority 2: Development mode (Vite dev server on port 5173)
  // Use empty string (same origin) to allow Vite proxy to forward API requests
  if (import.meta.env.DEV && window.location.port === '5173') {
    const devUrl = ''; // Vite proxy will forward /api/* to localhost:8420
    console.log('[API Client] Using dev mode with Vite proxy (same origin)');
    return devUrl;
  }

  // Priority 3: Same origin (production)
  const origin = window.location.origin;
  console.log('[API Client] Using same-origin base URL:', origin);
  return origin;
}

const BASE_URL = getBaseUrl()
const DEFAULT_TIMEOUT = 30000 // 30 seconds

/**
 * Fetch with timeout support
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Try to get error message from response body
      const error = await response.json().catch(() => ({ message: response.statusText }))
      const apiError = new Error(error.message || `HTTP ${response.status}: ${response.statusText}`)
      // Mark as expected error to suppress console logging
      apiError.isExpected = true
      throw apiError
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle abort errors (timeout)
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`Request timeout after ${timeout}ms`)
      timeoutError.isExpected = true
      throw timeoutError
    }

    // Handle network errors (Failed to fetch, etc)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Failed to connect to server')
      networkError.isExpected = true
      networkError.name = 'NetworkError'
      throw networkError
    }

    // Mark other errors as expected (handled by UI)
    if (!error.isExpected) {
      error.isExpected = true
    }

    throw error
  }
}

/**
 * Get all projects
 * @returns {Promise<Object>} - { projects: [], warnings: [] }
 */
export async function getProjects() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects`)
  return response.json()
}

/**
 * Scan/refresh projects
 * @returns {Promise<Object>} - { message: string }
 */
export async function scanProjects() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/scan`, {
    method: 'POST'
  })
  return response.json()
}

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
 * Get project commands
 * @param {string} projectId - Project identifier
 * @returns {Promise<Object>} - { commands: [], warnings: [] }
 */
export async function getProjectCommands(projectId) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/commands`)
  return response.json()
}

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
 * Get project MCP servers
 * @param {string} projectId - Project identifier
 * @returns {Promise<Object>} - { mcpServers: [], warnings: [] }
 */
export async function getProjectMcp(projectId) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/projects/${projectId}/mcp`)
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
 * Get user commands
 * @returns {Promise<Object>} - { commands: [], warnings: [] }
 */
export async function getUserCommands() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/commands`)
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
 * Get user MCP servers
 * @returns {Promise<Object>} - { mcp: [], warnings: [] }
 */
export async function getUserMcp() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/mcp`)
  return response.json()
}

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
 * Health check endpoint
 * @returns {Promise<Object>} - { status: string }
 */
export async function healthCheck() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/health`)
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

/**
 * Copy MCP server to target scope
 * @param {Object} request - { sourcePath, targetScope, targetProjectId, conflictStrategy }
 * @returns {Promise<Object>} - { success: boolean, message: string, warnings?: string[] }
 */
export async function copyMcp(request) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/copy/mcp`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}

/**
 * Copy skill to target scope
 * @param {Object} request - { sourcePath, targetScope, targetProjectId, conflictStrategy, acknowledgedWarnings }
 * @returns {Promise<Object>} - { success: boolean, message: string, createdPath?: string }
 */
export async function copySkill(request) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/copy/skill`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response.json()
}

// ========================================
// Agent CRUD Operations
// ========================================

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
 * Get references to a user-level agent
 * @param {string} agentName - Agent name
 * @returns {Promise<Object>} - { success: boolean, references: Array, hasReferences: boolean }
 */
export async function getUserAgentReferences(agentName) {
  const response = await fetchWithTimeout(`${BASE_URL}/api/user/agents/${agentName}/references`)
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

// ========================================
// Skill CRUD Operations
// ========================================

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

// ========================================
// Hook CRUD Operations
// ========================================

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

// Default export with all API functions
export default {
  BASE_URL,
  getProjects,
  scanProjects,
  getProjectAgents,
  getProjectCommands,
  getProjectHooks,
  getProjectMcp,
  getProjectSkills,
  getUserAgents,
  getUserCommands,
  getUserHooks,
  getUserMcp,
  getUserSkills,
  healthCheck,
  copyAgent,
  copyCommand,
  copyHook,
  copyMcp,
  copySkill,
  // Agent CRUD
  updateProjectAgent,
  deleteProjectAgent,
  getProjectAgentReferences,
  updateUserAgent,
  deleteUserAgent,
  getUserAgentReferences,
  // Command CRUD
  updateProjectCommand,
  deleteProjectCommand,
  getProjectCommandReferences,
  updateUserCommand,
  deleteUserCommand,
  getUserCommandReferences,
  // Skill CRUD
  updateProjectSkill,
  updateUserSkill,
  // Hook CRUD
  updateProjectHook,
  updateUserHook
}
