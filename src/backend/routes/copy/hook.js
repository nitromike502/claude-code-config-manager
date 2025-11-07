const copyService = require('../../services/copy-service');

/**
 * POST /api/copy/hook
 * Copy a hook configuration to a new location
 *
 * Note: Hooks use 3-level nested merge algorithm (event → matcher → command)
 *
 * Request body:
 * {
 *   sourceHook: {
 *     event: string (required) - Event name (e.g., 'PreToolUse')
 *     matcher: string (optional) - Matcher pattern (e.g., '*.ts')
 *     type: string (optional) - Hook type (default: 'command')
 *     command: string (required) - Command to execute
 *     enabled: boolean (optional) - Whether hook is enabled (default: true)
 *     timeout: number (optional) - Timeout in seconds (default: 60)
 *   },
 *   targetScope: string - 'user' or 'project'
 *   targetProjectId: string - Required if targetScope is 'project'
 * }
 */
async function copyHook(req, res) {
  // 1. Validate request body structure
  const { sourceHook, targetScope, targetProjectId } = req.body;

  // Validate sourceHook object exists
  if (!sourceHook || typeof sourceHook !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'sourceHook is required and must be an object'
    });
  }

  // Validate sourceHook required fields
  if (!sourceHook.event || typeof sourceHook.event !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'sourceHook.event is required and must be a string'
    });
  }

  if (!sourceHook.command || typeof sourceHook.command !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'sourceHook.command is required and must be a string'
    });
  }

  // Validate targetScope
  if (!targetScope || !['user', 'project'].includes(targetScope)) {
    return res.status(400).json({
      success: false,
      error: 'targetScope is required and must be "user" or "project"'
    });
  }

  // Validate targetProjectId (required if targetScope is 'project')
  if (targetScope === 'project') {
    if (!targetProjectId || typeof targetProjectId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'targetProjectId is required when targetScope is "project"'
      });
    }

    // Additional security: Check for empty strings
    if (targetProjectId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'targetProjectId must not be empty'
      });
    }
  }

  try {
    // 2. Call copy service with hook-specific request structure
    const result = await copyService.copyHook({
      sourceHook,
      targetScope,
      targetProjectId
    });

    // 3. Handle service response
    if (!result.success) {
      // Service returned error
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // 4. Return success
    return res.status(200).json({
      success: true,
      message: 'Hook copied successfully',
      copiedPath: result.mergedInto,
      hook: result.hook
    });

  } catch (error) {
    // 5. Map error to status code
    const statusCode = mapErrorToStatus(error);
    return res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Map error codes to HTTP status codes
 */
function mapErrorToStatus(error) {
  if (error.code === 'EACCES') return 403;
  if (error.code === 'ENOENT') return 404;
  if (error.code === 'ENOSPC') return 507;
  if (error.message && error.message.includes('Path traversal')) return 400;
  return 500;
}

module.exports = copyHook;
