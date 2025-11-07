const copyService = require('../../services/copy-service');
const { validateCopyRequest } = require('./validation');

/**
 * POST /api/copy/mcp
 * Copy an MCP server configuration to a new location
 *
 * Request body:
 * - sourceServerName: Name of the MCP server to copy
 * - sourceMcpConfig: MCP server configuration object (command, args, env)
 * - targetScope: 'user' or 'project'
 * - targetProjectId: Project ID (required if targetScope is 'project')
 * - conflictStrategy: 'skip' or 'overwrite' (optional)
 *
 * Response codes:
 * - 200: Success - MCP server copied successfully
 * - 400: Bad Request - Invalid request parameters or path traversal
 * - 403: Forbidden - Permission denied (EACCES)
 * - 404: Not Found - Source file not found (ENOENT)
 * - 409: Conflict - MCP server name already exists at target
 * - 500: Internal Server Error - Other errors
 * - 507: Insufficient Storage - Disk full (ENOSPC)
 */
async function copyMcp(req, res) {
  // 1. Validate request parameters
  // Note: For MCP copy, we need different validation than file-based copies
  // We don't have a sourcePath (file), but rather sourceServerName and sourceMcpConfig
  const { sourceServerName, sourceMcpConfig, targetScope, targetProjectId, conflictStrategy } = req.body;

  // Custom validation for MCP-specific parameters
  if (!sourceServerName || typeof sourceServerName !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'sourceServerName is required and must be a string'
    });
  }

  if (!sourceMcpConfig || typeof sourceMcpConfig !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'sourceMcpConfig is required and must be an object'
    });
  }

  if (!targetScope || !['user', 'project'].includes(targetScope)) {
    return res.status(400).json({
      success: false,
      error: 'targetScope is required and must be "user" or "project"'
    });
  }

  if (targetScope === 'project' && (!targetProjectId || typeof targetProjectId !== 'string')) {
    return res.status(400).json({
      success: false,
      error: 'targetProjectId is required when targetScope is "project"'
    });
  }

  if (conflictStrategy && !['skip', 'overwrite'].includes(conflictStrategy)) {
    return res.status(400).json({
      success: false,
      error: 'conflictStrategy must be "skip" or "overwrite"'
    });
  }

  try {
    // 2. Call copy service with MCP-specific request format
    const result = await copyService.copyMcp({
      sourceServerName,
      sourceMcpConfig,
      targetScope,
      targetProjectId,
      conflictStrategy: conflictStrategy || 'skip'
    });

    // 3. Handle conflict response
    if (result.conflict) {
      return res.status(409).json({
        success: false,
        conflict: result.conflict
      });
    }

    // 4. Handle skip response
    if (result.skipped) {
      return res.status(200).json({
        success: false,
        skipped: true,
        message: result.message
      });
    }

    // 5. Handle error response
    if (result.error) {
      // Map error to appropriate status code
      const statusCode = mapErrorToStatus(new Error(result.error));
      return res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }

    // 6. Return success response
    return res.status(200).json({
      success: true,
      message: 'MCP server copied successfully',
      copiedPath: result.mergedInto,
      serverName: result.serverName
    });

  } catch (error) {
    // 7. Handle unexpected errors
    const statusCode = mapErrorToStatus(error);
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Unknown error occurred during MCP copy operation'
    });
  }
}

/**
 * Map error codes to HTTP status codes
 *
 * @param {Error} error - Error object with optional code property
 * @returns {number} HTTP status code
 */
function mapErrorToStatus(error) {
  if (error.code === 'EACCES') return 403;
  if (error.code === 'ENOENT') return 404;
  if (error.code === 'ENOSPC') return 507;
  if (error.message && error.message.includes('Path traversal')) return 400;
  return 500;
}

module.exports = copyMcp;
