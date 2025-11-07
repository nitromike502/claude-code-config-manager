const copyService = require('../../services/copy-service');
const { validateHookParams } = require('./validation');

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
  // 1. Validate request parameters
  const validationError = validateHookParams(req.body);
  if (validationError) {
    return res.status(400).json({
      success: false,
      ...validationError
    });
  }

  // 2. Extract parameters from request body
  const { sourceHook, targetScope, targetProjectId } = req.body;

  try {
    // 3. Call copy service with hook-specific request structure
    const result = await copyService.copyHook({
      sourceHook,
      targetScope,
      targetProjectId
    });

    // 4. Handle service response
    if (!result.success) {
      // Service returned error
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // 5. Return success
    return res.status(200).json({
      success: true,
      message: 'Hook copied successfully',
      copiedPath: result.mergedInto,
      hook: result.hook
    });

  } catch (error) {
    // 6. Map error to status code
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
