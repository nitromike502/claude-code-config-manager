const path = require('path');
const fs = require('fs').promises;

/**
 * DeleteService - Handles safe deletion of configuration files and directories
 *
 * This service provides validated deletion operations for configuration files
 * and directories used by Claude Code projects. All operations include
 * comprehensive validation and error handling.
 *
 * Key responsibilities:
 * - Safe file deletion with validation
 * - Recursive directory deletion
 * - JSON property deletion with file preservation
 * - Path validation and security
 */

/**
 * Validates that a file path is safe and within allowed boundaries
 * Security: Prevents path traversal attacks
 *
 * @param {string} filePath - Absolute path to validate
 * @returns {string} Normalized absolute path if valid
 * @throws {Error} If path is invalid or violates security constraints
 */
function validatePath(filePath) {
  // Validate input
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path: path must be a non-empty string');
  }

  // Check for null bytes (path injection)
  if (filePath.includes('\0')) {
    throw new Error('Invalid file path: path contains null bytes');
  }

  // Check for path traversal attempts BEFORE normalization
  if (filePath.includes('..')) {
    throw new Error('Path traversal detected: file path contains ".." segments');
  }

  // Normalize and resolve path
  const normalized = path.normalize(filePath);
  const resolved = path.resolve(normalized);

  return resolved;
}

/**
 * Safely deletes a file
 *
 * Process:
 * 1. Validate path
 * 2. Verify file exists
 * 3. Verify it's a file (not directory)
 * 4. Delete file
 *
 * @param {string} filePath - Absolute path to file to delete
 * @returns {Promise<{success: boolean, deleted: string}>} Success indicator and deleted path
 * @throws {Error} If file doesn't exist, is not a file, or deletion fails
 */
async function deleteFile(filePath) {
  // Step 1: Validate path
  const validatedPath = validatePath(filePath);

  try {
    // Step 2: Verify file exists
    await fs.access(validatedPath, fs.constants.F_OK);

    // Step 3: Verify it's a file, not directory
    const stats = await fs.stat(validatedPath);
    if (!stats.isFile()) {
      throw new Error(`Cannot delete: ${validatedPath} is not a file (use deleteDirectory for directories)`);
    }

    // Step 4: Delete file
    await fs.unlink(validatedPath);

    return { success: true, deleted: validatedPath };
  } catch (error) {
    // Handle specific error codes
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${validatedPath}`);
    }
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: cannot delete ${validatedPath}`);
    }

    throw error;
  }
}

/**
 * Recursively deletes a directory and all its contents
 *
 * Process:
 * 1. Validate path
 * 2. Verify directory exists
 * 3. Verify it's a directory (not file)
 * 4. Recursively delete directory
 *
 * @param {string} dirPath - Absolute path to directory to delete
 * @returns {Promise<{success: boolean, deleted: string}>} Success indicator and deleted path
 * @throws {Error} If directory doesn't exist, is not a directory, or deletion fails
 */
async function deleteDirectory(dirPath) {
  // Step 1: Validate path
  const validatedPath = validatePath(dirPath);

  try {
    // Step 2: Verify directory exists
    await fs.access(validatedPath, fs.constants.F_OK);

    // Step 3: Verify it's a directory, not file
    const stats = await fs.stat(validatedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Cannot delete: ${validatedPath} is not a directory (use deleteFile for files)`);
    }

    // Step 4: Recursive delete using fs.rm with recursive option
    await fs.rm(validatedPath, { recursive: true, force: true });

    return { success: true, deleted: validatedPath };
  } catch (error) {
    // Handle specific error codes
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found: ${validatedPath}`);
    }
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: cannot delete ${validatedPath}`);
    }

    throw error;
  }
}

/**
 * Deletes a property from a JSON file using dot notation
 *
 * Process:
 * 1. Validate path
 * 2. Read JSON file
 * 3. Navigate to property using dot notation
 * 4. Delete the property
 * 5. Write back with pretty print
 *
 * Examples:
 * - deleteJsonProperty('/path/to/file.json', 'hooks.PreToolUse')
 * - deleteJsonProperty('/path/to/file.json', 'servers.myserver')
 *
 * @param {string} filePath - Absolute path to JSON file
 * @param {string} propertyPath - Dot notation path to property (e.g., "hooks.PreToolUse")
 * @returns {Promise<{success: boolean, deleted: string}>} Success indicator and deleted property path
 * @throws {Error} If file doesn't exist, property not found, or write fails
 */
async function deleteJsonProperty(filePath, propertyPath) {
  // Step 1: Validate path
  const validatedPath = validatePath(filePath);

  // Validate propertyPath
  if (!propertyPath || typeof propertyPath !== 'string') {
    throw new Error('Invalid property path: must be a non-empty string');
  }

  try {
    // Step 2: Read JSON file
    const content = await fs.readFile(validatedPath, 'utf8');
    let data;
    try {
      data = JSON.parse(content);
    } catch (jsonError) {
      throw new Error(`Failed to parse JSON: ${jsonError.message}`);
    }

    // Step 3: Navigate to property using dot notation
    const pathParts = propertyPath.split('.');
    const propertyName = pathParts.pop(); // Get last part (property to delete)

    // Navigate to parent object
    let parent = data;
    for (const part of pathParts) {
      if (!parent || typeof parent !== 'object') {
        throw new Error(`Property path not found: ${propertyPath} (invalid at "${part}")`);
      }
      if (!(part in parent)) {
        throw new Error(`Property path not found: ${propertyPath} (missing "${part}")`);
      }
      parent = parent[part];
    }

    // Verify parent is an object
    if (!parent || typeof parent !== 'object') {
      throw new Error(`Property path not found: ${propertyPath} (parent is not an object)`);
    }

    // Verify property exists
    if (!(propertyName in parent)) {
      throw new Error(`Property not found: ${propertyPath}`);
    }

    // Step 4: Delete the property
    delete parent[propertyName];

    // Step 5: Write back with pretty print
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(validatedPath, jsonString, 'utf8');

    return { success: true, deleted: propertyPath };
  } catch (error) {
    // Handle specific error codes
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${validatedPath}`);
    }
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: cannot access ${validatedPath}`);
    }

    throw error;
  }
}

module.exports = {
  deleteFile,
  deleteDirectory,
  deleteJsonProperty
};
