/**
 * Pure validation functions for copy API endpoints
 *
 * Each function returns null if validation passes, or an error object if validation fails.
 * This approach is cleaner than Express middleware pattern for direct function calls.
 */

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
  validateMcpParams
};
