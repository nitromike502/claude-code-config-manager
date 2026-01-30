/**
 * MCP Server Validation Service
 * Validates MCP server update operations
 */

const VALID_TRANSPORT_TYPES = ['stdio', 'http', 'sse'];

/**
 * Validates an MCP server update request
 * @param {Object} updates - Fields to update
 * @param {Object} existingServer - Current server configuration
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateMcpUpdate(updates, existingServer) {
  const errors = [];

  // Determine effective transport type (what it will be after update)
  const effectiveType = updates.type || existingServer.type || 'stdio';

  // Validate transport type if being changed
  if (updates.type !== undefined && !VALID_TRANSPORT_TYPES.includes(updates.type)) {
    errors.push(`Invalid transport type. Must be one of: ${VALID_TRANSPORT_TYPES.join(', ')}`);
  }

  // Transport-specific validation
  if (effectiveType === 'stdio') {
    // command required if being updated or transport changed to stdio
    if (updates.command !== undefined) {
      if (typeof updates.command !== 'string' || updates.command.trim() === '') {
        errors.push('Command must be a non-empty string for stdio transport');
      }
    } else if (updates.type === 'stdio' && !existingServer.command) {
      errors.push('Command is required for stdio transport');
    }

    // args must be array of strings
    if (updates.args !== undefined) {
      if (!Array.isArray(updates.args)) {
        errors.push('Args must be an array');
      } else if (!updates.args.every(arg => typeof arg === 'string')) {
        errors.push('All args must be strings');
      }
    }

    // env must be object with string values
    if (updates.env !== undefined) {
      if (typeof updates.env !== 'object' || Array.isArray(updates.env) || updates.env === null) {
        errors.push('Env must be an object');
      } else if (!Object.values(updates.env).every(v => typeof v === 'string')) {
        errors.push('All env values must be strings');
      }
    }

    // Reject http/sse fields for stdio
    if (updates.url !== undefined) {
      errors.push('URL is not valid for stdio transport');
    }
    if (updates.headers !== undefined) {
      errors.push('Headers is not valid for stdio transport');
    }
  }

  if (effectiveType === 'http' || effectiveType === 'sse') {
    // url required if being updated or transport changed
    if (updates.url !== undefined) {
      if (typeof updates.url !== 'string' || updates.url.trim() === '') {
        errors.push('URL must be a non-empty string for http/sse transport');
      }
    } else if ((updates.type === 'http' || updates.type === 'sse') && !existingServer.url) {
      errors.push('URL is required for http/sse transport');
    }

    // headers must be object with string values
    if (updates.headers !== undefined) {
      if (typeof updates.headers !== 'object' || Array.isArray(updates.headers) || updates.headers === null) {
        errors.push('Headers must be an object');
      } else if (!Object.values(updates.headers).every(v => typeof v === 'string')) {
        errors.push('All header values must be strings');
      }
    }

    // Reject stdio fields for http/sse
    if (updates.command !== undefined) {
      errors.push('Command is not valid for http/sse transport');
    }
    if (updates.args !== undefined) {
      errors.push('Args is not valid for http/sse transport');
    }
    if (updates.env !== undefined) {
      errors.push('Env is not valid for http/sse transport');
    }
  }

  // Name validation (if changing name)
  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || updates.name.trim() === '') {
      errors.push('Name must be a non-empty string');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(updates.name)) {
      errors.push('Name can only contain letters, numbers, hyphens, and underscores');
    }
  }

  // Common field validation
  if (updates.enabled !== undefined && typeof updates.enabled !== 'boolean') {
    errors.push('Enabled must be a boolean');
  }

  if (updates.timeout !== undefined) {
    if (typeof updates.timeout !== 'number' || !Number.isInteger(updates.timeout) || updates.timeout <= 0) {
      errors.push('Timeout must be a positive integer');
    }
  }

  if (updates.retries !== undefined) {
    if (typeof updates.retries !== 'number' || !Number.isInteger(updates.retries) || updates.retries < 0) {
      errors.push('Retries must be a non-negative integer');
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateMcpUpdate, VALID_TRANSPORT_TYPES };
