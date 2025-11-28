const copyService = require('../../services/copy-service');
const { validateCopyParams, validateNotSameProject } = require('./validation');

/**
 * POST /api/copy/skill
 * Copy a skill directory to a new location
 *
 * Request body:
 * - sourceSkillPath: Absolute path to source skill directory
 * - targetScope: Target scope ('project' or 'user')
 * - targetProjectId: Project ID if scope is 'project' (null for user scope)
 * - conflictStrategy: Optional conflict resolution ('skip', 'overwrite', 'rename')
 * - acknowledgedWarnings: Boolean indicating if external references were acknowledged
 *
 * Response formats:
 * - Success (200): { success: true, message: 'Skill copied successfully', copiedPath: '/path/to/skill/', fileCount: 15, dirCount: 3 }
 * - Conflict (409): { success: false, conflict: { targetPath, sourceModified, targetModified } }
 * - Warning (422): { success: false, warnings: { externalReferences: [...] }, requiresAcknowledgement: true }
 * - Error (400/403/404/500/507): { success: false, error: 'Error message' }
 */
async function copySkill(req, res) {
  // 1. Validate request parameters (using standard copy validation)
  // Note: Skills use directory paths, but we validate the same way as file paths
  const customValidation = validateSkillParams(req.body);
  if (customValidation) {
    return res.status(400).json({
      success: false,
      ...customValidation
    });
  }

  // 1b. Validate source and target are different (prevent same-project copy)
  // Note: For skills, sourcePath is actually sourceSkillPath (directory)
  const sameProjectError = validateNotSameProject({
    sourcePath: req.body.sourceSkillPath,
    targetScope: req.body.targetScope,
    targetProjectId: req.body.targetProjectId
  });

  if (sameProjectError) {
    return res.status(400).json({
      success: false,
      ...sameProjectError
    });
  }

  // 2. Extract parameters from request body
  const { sourceSkillPath, targetScope, targetProjectId, conflictStrategy, acknowledgedWarnings } = req.body;

  try {
    // 3. Call copy service with request object
    const result = await copyService.copySkill({
      sourceSkillPath,
      targetScope,
      targetProjectId,
      conflictStrategy: conflictStrategy || 'skip',
      acknowledgedWarnings: acknowledgedWarnings || false
    });

    // 4. Check if result indicates external reference warnings
    if (result.warnings && result.warnings.externalReferences && result.warnings.externalReferences.length > 0) {
      // External references detected - require user acknowledgement
      if (!acknowledgedWarnings) {
        return res.status(422).json({
          success: false,
          warnings: result.warnings,
          requiresAcknowledgement: true,
          message: 'Skill contains external file references. Please review and acknowledge before copying.'
        });
      }
    }

    // 5. Check if result indicates a conflict
    if (result.conflict) {
      return res.status(409).json({
        success: false,
        conflict: result.conflict
      });
    }

    // 6. Check if copy was skipped by user
    if (result.skipped) {
      return res.status(200).json({
        success: false,
        skipped: true,
        message: result.message
      });
    }

    // 7. Check if copy failed (error field present)
    if (result.error) {
      // Map error message to appropriate status code
      const statusCode = mapErrorMessageToStatus(result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }

    // 8. Return success response
    return res.status(200).json({
      success: true,
      message: 'Skill copied successfully',
      copiedPath: result.copiedPath,
      fileCount: result.fileCount,
      dirCount: result.dirCount
    });

  } catch (error) {
    // 9. Handle unexpected errors (errors thrown during copy operation)
    const statusCode = mapErrorToStatus(error);
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Unknown error occurred during skill copy operation'
    });
  }
}

/**
 * Validate skill-specific copy parameters
 * @param {object} body - Request body
 * @returns {object|null} - Returns error object if invalid, null if valid
 */
function validateSkillParams(body) {
  const { sourceSkillPath, targetScope, targetProjectId, conflictStrategy } = body;

  // Validate sourceSkillPath
  if (!sourceSkillPath || typeof sourceSkillPath !== 'string') {
    return { error: 'sourceSkillPath is required and must be a string' };
  }

  if (sourceSkillPath.trim() === '') {
    return { error: 'sourceSkillPath must not be empty' };
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
    error.message.includes('Invalid skill directory')
  )) {
    return 400;
  }

  // Default to internal server error
  return 500;
}

/**
 * Map error messages to HTTP status codes
 * This handles errors returned by copyService.copySkill in result.error
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
      errorMessage.includes('Invalid skill directory') ||
      errorMessage.includes('missing SKILL.md')) {
    return 400;
  }

  // Default to internal server error
  return 500;
}

module.exports = copySkill;
