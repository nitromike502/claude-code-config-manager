const copyService = require('../../services/copy-service');
const { validateCopyParams } = require('./validation');

/**
 * POST /api/copy/command
 * Copy a slash command configuration to a new location
 *
 * Request body:
 * - sourcePath: Absolute path to source command file
 * - targetScope: 'user' or 'project'
 * - targetProjectId: Project ID (required if targetScope is 'project')
 * - conflictStrategy: 'skip', 'overwrite', or 'rename' (optional)
 *
 * Response formats:
 * - 200: { success: true, message: "Command copied successfully", copiedPath: "/path/to/command.md" }
 * - 409: { success: false, conflict: { targetPath, sourceModified, targetModified } }
 * - 400/403/404/500/507: { success: false, error: "Error message" }
 */
async function copyCommand(req, res) {
  // 1. Validate request parameters
  const validationError = validateCopyParams(req.body);
  if (validationError) {
    return res.status(400).json({
      success: false,
      ...validationError
    });
  }

  // 2. Extract parameters from request body
  const { sourcePath, targetScope, targetProjectId, conflictStrategy } = req.body;

  try {
    // Call copy service with request object format
    const result = await copyService.copyCommand({
      sourcePath,
      targetScope,
      targetProjectId,
      conflictStrategy: conflictStrategy || 'skip'
    });

    // Handle different result scenarios

    // Case 1: Skip strategy was applied (user cancelled)
    if (result.skipped) {
      return res.status(200).json({
        success: false,
        skipped: true,
        message: result.message
      });
    }

    // Case 2: Conflict detected (no strategy provided or conflict needs user decision)
    if (result.conflict) {
      return res.status(409).json({
        success: false,
        conflict: result.conflict
      });
    }

    // Case 3: Error occurred
    if (!result.success) {
      // Map error message to appropriate status code
      const statusCode = mapErrorToStatus(result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }

    // Case 4: Success
    return res.status(200).json({
      success: true,
      message: 'Command copied successfully',
      copiedPath: result.copiedPath
    });

  } catch (error) {
    // Handle unexpected exceptions
    const statusCode = mapErrorToStatus(error);
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Unknown error occurred during command copy'
    });
  }
}

/**
 * Map error codes and messages to HTTP status codes
 *
 * @param {Error|string} error - Error object or error message
 * @returns {number} HTTP status code
 */
function mapErrorToStatus(error) {
  // Handle both Error objects and string messages
  const errorCode = error.code;
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Map specific error codes
  if (errorCode === 'EACCES') return 403;  // Permission denied
  if (errorCode === 'ENOENT') return 404;  // File not found
  if (errorCode === 'ENOSPC') return 507;  // Insufficient storage

  // Map error messages
  if (errorMessage && errorMessage.includes('Path traversal')) return 400;
  if (errorMessage && errorMessage.includes('Invalid')) return 400;

  // Default to 500 Internal Server Error
  return 500;
}

module.exports = copyCommand;
