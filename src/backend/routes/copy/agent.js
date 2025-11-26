const copyService = require('../../services/copy-service');
const { validateCopyParams, validateNotSameProject } = require('./validation');

/**
 * POST /api/copy/agent
 * Copy a subagent configuration to a new location
 *
 * Request body:
 * - sourcePath: Absolute path to source agent file
 * - targetScope: Target scope ('project' or 'user')
 * - targetProjectId: Project ID if scope is 'project' (null for user scope)
 * - conflictStrategy: Optional conflict resolution ('skip', 'overwrite', 'rename')
 *
 * Response formats:
 * - Success (200): { success: true, message: 'Agent copied successfully', copiedPath: '/path/to/agent.md' }
 * - Conflict (409): { success: false, conflict: { targetPath, sourceModified, targetModified } }
 * - Error (400/403/404/500/507): { success: false, error: 'Error message' }
 */
async function copyAgent(req, res) {
  // 1. Validate request parameters
  const validationError = validateCopyParams(req.body);
  if (validationError) {
    return res.status(400).json({
      success: false,
      ...validationError
    });
  }

  // 1b. Validate source and target are different (prevent same-project copy)
  const sameProjectError = validateNotSameProject(req.body);
  if (sameProjectError) {
    return res.status(400).json({
      success: false,
      ...sameProjectError
    });
  }

  // 2. Extract parameters from request body
  const { sourcePath, targetScope, targetProjectId, conflictStrategy } = req.body;

  try {
    // 3. Call copy service with request object
    // Note: CopyService.copyAgent expects a request object with specific properties
    const result = await copyService.copyAgent({
      sourcePath,
      targetScope,
      targetProjectId,
      conflictStrategy: conflictStrategy || 'skip'
    });

    // 4. Check if result indicates a conflict
    if (result.conflict) {
      return res.status(409).json({
        success: false,
        conflict: result.conflict
      });
    }

    // 5. Check if copy was skipped by user
    if (result.skipped) {
      return res.status(200).json({
        success: false,
        skipped: true,
        message: result.message
      });
    }

    // 6. Check if copy failed (error field present)
    if (result.error) {
      // Map error message to appropriate status code
      const statusCode = mapErrorMessageToStatus(result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }

    // 7. Return success response
    return res.status(200).json({
      success: true,
      message: 'Agent copied successfully',
      copiedPath: result.copiedPath
    });

  } catch (error) {
    // 8. Handle unexpected errors (errors thrown during copy operation)
    const statusCode = mapErrorToStatus(error);
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Unknown error occurred during agent copy operation'
    });
  }
}

/**
 * Map error objects to HTTP status codes
 * This handles errors thrown during copy operation
 *
 * @param {Error} error - Error object with code property
 * @returns {number} HTTP status code
 */
function mapErrorToStatus(error) {
  // Permission denied
  if (error.code === 'EACCES') {
    return 403;
  }

  // File or directory not found
  if (error.code === 'ENOENT') {
    return 404;
  }

  // Insufficient storage
  if (error.code === 'ENOSPC') {
    return 507;
  }

  // Path traversal attempt
  if (error.message && error.message.includes('Path traversal')) {
    return 400;
  }

  // Invalid source path
  if (error.message && (
    error.message.includes('Invalid source path') ||
    error.message.includes('Invalid agent file')
  )) {
    return 400;
  }

  // Default to internal server error
  return 500;
}

/**
 * Map error messages to HTTP status codes
 * This handles errors returned by copyService.copyAgent in result.error
 *
 * @param {string} errorMessage - Error message string
 * @returns {number} HTTP status code
 */
function mapErrorMessageToStatus(errorMessage) {
  // Permission denied
  if (errorMessage.includes('Permission denied') || errorMessage.includes('EACCES')) {
    return 403;
  }

  // File or directory not found
  if (errorMessage.includes('not found') || errorMessage.includes('ENOENT')) {
    return 404;
  }

  // Insufficient storage
  if (errorMessage.includes('ENOSPC')) {
    return 507;
  }

  // Path traversal attempt or invalid input
  if (errorMessage.includes('Path traversal') ||
      errorMessage.includes('Invalid source path') ||
      errorMessage.includes('Invalid agent file') ||
      errorMessage.includes('missing YAML frontmatter')) {
    return 400;
  }

  // Default to internal server error
  return 500;
}

module.exports = copyAgent;
