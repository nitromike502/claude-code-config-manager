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

export const BASE_URL = getBaseUrl()
export const DEFAULT_TIMEOUT = 30000 // 30 seconds

/**
 * Fetch with timeout support
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
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
 * Health check endpoint
 * @returns {Promise<Object>} - { status: string }
 */
export async function healthCheck() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/health`)
  return response.json()
}
