/**
 * API Client Barrel Export
 *
 * This module re-exports all API functions from their respective entity modules.
 * Use this as the single entry point for all API operations:
 *
 * import { getProjectAgents, copyAgent, deleteUserCommand } from '@/api'
 *
 * Or import the default object for backward compatibility:
 *
 * import api from '@/api'
 * api.getProjectAgents(projectId)
 */

// Base utilities and project functions
export {
  BASE_URL,
  DEFAULT_TIMEOUT,
  fetchWithTimeout,
  getProjects,
  scanProjects,
  healthCheck
} from './client'

// Entity modules - re-export all named exports
export * from './agents'
export * from './commands'
export * from './skills'
export * from './hooks'
export * from './mcp'

// Default export for backward compatibility
// Allows: import api from '@/api'; api.getProjectAgents()
import * as agents from './agents'
import * as commands from './commands'
import * as skills from './skills'
import * as hooks from './hooks'
import * as mcp from './mcp'
import { BASE_URL, getProjects, scanProjects, healthCheck } from './client'

export default {
  BASE_URL,
  getProjects,
  scanProjects,
  healthCheck,
  ...agents,
  ...commands,
  ...skills,
  ...hooks,
  ...mcp
}
