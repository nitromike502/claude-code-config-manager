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
  if (import.meta.env.DEV && window.location.port === '5173') {
    const devUrl = 'http://localhost:8420';
    console.log('[API Client] Using dev mode base URL:', devUrl);
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

    // Mark network errors as expected (handled by UI)
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

// Default export with all API functions
export default {
  BASE_URL,
  getProjects,
  scanProjects,
  getProjectAgents,
  getProjectCommands,
  getProjectHooks,
  getProjectMcp,
  getUserAgents,
  getUserCommands,
  getUserHooks,
  getUserMcp,
  healthCheck,
  copyAgent,
  copyCommand,
  copyHook,
  copyMcp
}
