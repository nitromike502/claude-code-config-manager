/**
 * Pure validation functions for copy API endpoints
 *
 * Each function returns null if validation passes, or an error object if validation fails.
 * This approach is cleaner than Express middleware pattern for direct function calls.
 */

const { pathToProjectId } = require('../../utils/pathUtils');

/**
 * Extract project ID from a source file path
 * Source paths look like: /home/user/project/.claude/agents/foo.md
 * User paths look like: /home/user/.claude/agents/foo.md
 *
 * @param {string} sourcePath - Path to source file
 * @returns {string|null} - Project ID or null for user-scope sources
 */
function extractProjectIdFromPath(sourcePath) {
  if (!sourcePath || typeof sourcePath !== 'string') {
    return null;
  }

  // Find .claude/ in the path - everything before it is the project path
  const claudeIndex = sourcePath.indexOf('/.claude/');
  if (claudeIndex === -1) {
    return null;
  }

  const projectPath = sourcePath.substring(0, claudeIndex);

  // Check if this looks like a user-level path (ends with home dir)
  // User paths are typically ~/.claude/ which expands to /home/user/.claude/
  // Project paths have something after the home dir like /home/user/project/.claude/
  const homeDir = process.env.HOME || require('os').homedir();
  if (projectPath === homeDir) {
    // This is a user-scope source, not a project
    return null;
  }

  return pathToProjectId(projectPath);
}

/**
 * Validate that source and target are not the same location
 * Prevents copying a config to itself
 *
 * @param {Object} body - Request body
 * @param {string} body.sourcePath - Source file path
 * @param {string} body.targetScope - Target scope ('user' or 'project')
 * @param {string} body.targetProjectId - Target project ID
 * @returns {object|null} - Returns error object if same-project copy, null if valid
 */
function validateNotSameProject(body) {
  const { sourcePath, targetScope, targetProjectId } = body;

  // If sourcePath doesn't contain .claude/, we can't determine the source location
  // This shouldn't happen in real usage, but allow it for backwards compatibility
  if (!sourcePath || !sourcePath.includes('/.claude/')) {
    return null;
  }

  // Extract source project ID from path
  const sourceProjectId = extractProjectIdFromPath(sourcePath);

  // Case 1: Source is user-scope (path is ~/.claude/...), target is user-scope → same location
  if (sourceProjectId === null && targetScope === 'user') {
    return { error: 'Cannot copy configuration to the same location (User Global to User Global)' };
  }

  // Case 2: Source is project-scope, target is same project
  if (sourceProjectId !== null && targetScope === 'project' && sourceProjectId === targetProjectId) {
    return { error: 'Cannot copy configuration to the same project' };
  }

  return null; // Different locations - valid
}

/**
 * Validate copy request parameters for file-based copies (agent, command)
 * @param {object} body - Request body
 * @returns {object|null} - Returns error object if invalid, null if valid
 */
function validateCopyParams(body) {
  const { sourcePath, targetScope, targetProjectId, conflictStrategy } = body;

  // Validate sourcePath
  if (!sourcePath || typeof sourcePath !== 'string') {
    return { error: 'sourcePath is required and must be a string' };
  }

  if (sourcePath.trim() === '') {
    return { error: 'sourcePath must not be empty' };
  }

  // Validate targetScope
  if (!targetScope || !['user', 'project'].includes(targetScope)) {
    return { error: 'targetScope is required and must be "user" or "project"' };
  }

  // Validate targetProjectId (required if targetScope is 'project')
  if (targetScope === 'project') {
    if (!targetProjectId || typeof targetProjectId !== 'string') {
      return { error: 'targetProjectId is required when targetScope is "project"' };
    }
    if (targetProjectId.trim() === '') {
      return { error: 'targetProjectId must not be empty' };
    }
  }

  // Validate conflictStrategy (optional)
  if (conflictStrategy && !['skip', 'overwrite', 'rename'].includes(conflictStrategy)) {
    return { error: 'conflictStrategy must be "skip", "overwrite", or "rename"' };
  }

  return null; // No errors - validation passed
}

/**
 * Validate hook copy request parameters
 * @param {object} body - Request body
 * @returns {object|null} - Returns error object if invalid, null if valid
 */
function validateHookParams(body) {
  const { sourceHook, targetScope, targetProjectId } = body;

  // Validate sourceHook object exists
  if (!sourceHook || typeof sourceHook !== 'object') {
    return { error: 'sourceHook is required and must be an object' };
  }

  // Validate sourceHook required fields
  if (!sourceHook.event || typeof sourceHook.event !== 'string') {
    return { error: 'sourceHook.event is required and must be a string' };
  }

  if (!sourceHook.command || typeof sourceHook.command !== 'string') {
    return { error: 'sourceHook.command is required and must be a string' };
  }

  // Validate targetScope
  if (!targetScope || !['user', 'project'].includes(targetScope)) {
    return { error: 'targetScope is required and must be "user" or "project"' };
  }

  // Validate targetProjectId (required if targetScope is 'project')
  if (targetScope === 'project') {
    if (!targetProjectId || typeof targetProjectId !== 'string') {
      return { error: 'targetProjectId is required when targetScope is "project"' };
    }
    if (targetProjectId.trim() === '') {
      return { error: 'targetProjectId must not be empty' };
    }
  }

  return null; // No errors - validation passed
}

/**
 * Validate MCP copy request parameters
 * @param {object} body - Request body
 * @returns {object|null} - Returns error object if invalid, null if valid
 */
function validateMcpParams(body) {
  const { sourceServerName, sourceMcpConfig, targetScope, targetProjectId, conflictStrategy } = body;

  // Validate sourceServerName
  if (!sourceServerName || typeof sourceServerName !== 'string') {
    return { error: 'sourceServerName is required and must be a string' };
  }

  // Validate sourceMcpConfig
  if (!sourceMcpConfig || typeof sourceMcpConfig !== 'object') {
    return { error: 'sourceMcpConfig is required and must be an object' };
  }

  // Validate targetScope
  if (!targetScope || !['user', 'project'].includes(targetScope)) {
    return { error: 'targetScope is required and must be "user" or "project"' };
  }

  // Validate targetProjectId (required if targetScope is 'project')
  if (targetScope === 'project') {
    if (!targetProjectId || typeof targetProjectId !== 'string') {
      return { error: 'targetProjectId is required when targetScope is "project"' };
    }
    if (targetProjectId.trim() === '') {
      return { error: 'targetProjectId must not be empty' };
    }
  }

  // Validate conflictStrategy (optional)
  if (conflictStrategy && !['skip', 'overwrite'].includes(conflictStrategy)) {
    return { error: 'conflictStrategy must be "skip" or "overwrite"' };
  }

  return null; // No errors - validation passed
}

module.exports = {
  validateCopyParams,
  validateHookParams,
  validateMcpParams,
  validateNotSameProject,
  extractProjectIdFromPath
};
