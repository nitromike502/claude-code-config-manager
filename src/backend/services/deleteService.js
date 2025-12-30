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

/**
 * Deletes a hook from settings.json using hookId format
 *
 * Process:
 * 1. Parse hookId to extract event, matcher, index
 * 2. Load settings.json from project's .claude/ directory
 * 3. Navigate to hooks[event] → find matcher entry → hooks[index]
 * 4. Remove hook at specified index
 * 5. Clean up empty structures (hooks array, matcher entry, event key, hooks object)
 * 6. Write back atomically (temp file + rename)
 *
 * Hook ID Format: event::matcher::index
 * - "PreToolUse::Bash::0" - First hook for PreToolUse with Bash matcher
 * - "SessionEnd::::0" - First hook for SessionEnd (no matcher, empty string between ::)
 *
 * Hook Structure in settings.json (3-level nested):
 * {
 *   "hooks": {
 *     "PreToolUse": [                    // Event level
 *       {
 *         "matcher": "Bash",              // Matcher entry level (optional field)
 *         "hooks": [                      // Hooks array
 *           { "type": "command", "command": "echo hello" }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * @param {string} hookId - Hook identifier (event::matcher::index)
 * @param {string} settingsPath - Absolute path to settings.json
 * @returns {Promise<{success: boolean, deleted: string}>} Success indicator and deleted hookId
 * @throws {Error} If hook not found, invalid format, or write fails
 */
async function deleteHook(hookId, settingsPath) {
  // Step 1: Parse hookId
  if (!hookId || typeof hookId !== 'string') {
    throw new Error('Invalid hookId: must be a non-empty string');
  }

  const parts = hookId.split('::');
  if (parts.length !== 3) {
    throw new Error('Invalid hookId format: must be event::matcher::index');
  }

  const [event, matcher, indexStr] = parts;

  // Validate event
  if (!event) {
    throw new Error('Invalid hookId: event cannot be empty');
  }

  // Validate index
  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 0) {
    throw new Error('Invalid hookId: index must be a non-negative integer');
  }

  // Step 2: Validate settings path
  const validatedPath = validatePath(settingsPath);

  try {
    // Step 3: Read settings.json
    const content = await fs.readFile(validatedPath, 'utf8');
    let settings;
    try {
      settings = JSON.parse(content);
    } catch (jsonError) {
      throw new Error(`Failed to parse settings.json: ${jsonError.message}`);
    }

    // Verify hooks structure exists
    if (!settings.hooks || typeof settings.hooks !== 'object') {
      throw new Error(`Hook not found: ${hookId}`);
    }

    // Step 4: Navigate to event
    const eventEntries = settings.hooks[event];
    if (!Array.isArray(eventEntries) || eventEntries.length === 0) {
      throw new Error(`Hook not found: no hooks configured for event "${event}"`);
    }

    // Step 5: Find the matcher entry that contains this hook
    let matcherEntryIndex = -1;
    let hooksArray = null;

    // Normalize matcher for comparison
    // Both '*' and empty string/missing field represent "match all"
    // Settings.json may store it as '*' or omit the field entirely
    const normalizeMatcher = (m) => (m === '*' || m === '' || m === undefined) ? '' : m;
    const normalizedMatcher = normalizeMatcher(matcher);

    for (let i = 0; i < eventEntries.length; i++) {
      const matcherEntry = eventEntries[i];
      const entryMatcher = normalizeMatcher(matcherEntry.matcher);

      if (entryMatcher === normalizedMatcher) {
        // Found the right matcher entry
        if (!Array.isArray(matcherEntry.hooks)) {
          throw new Error(`Hook not found: ${hookId} (matcher entry has no hooks array)`);
        }

        if (index >= matcherEntry.hooks.length) {
          throw new Error(`Hook not found: index ${index} out of range (only ${matcherEntry.hooks.length} hook(s) in this matcher group)`);
        }

        matcherEntryIndex = i;
        hooksArray = matcherEntry.hooks;
        break;
      }
    }

    if (matcherEntryIndex === -1) {
      const matcherDisplay = normalizedMatcher || '(no matcher)';
      throw new Error(`Hook not found: no matcher entry for "${matcherDisplay}" in event "${event}"`);
    }

    // Step 6: Remove the hook at the specified index
    hooksArray.splice(index, 1);

    // Step 7: Clean up empty structures
    // If hooks array is now empty, remove the matcher entry
    if (hooksArray.length === 0) {
      eventEntries.splice(matcherEntryIndex, 1);
    }

    // If event has no more matcher entries, remove the event key
    if (eventEntries.length === 0) {
      delete settings.hooks[event];
    }

    // If hooks object is now empty, remove it entirely
    if (Object.keys(settings.hooks).length === 0) {
      delete settings.hooks;
    }

    // Step 8: Write back atomically (temp file + rename for safety)
    const tempPath = `${validatedPath}.tmp`;
    const jsonString = JSON.stringify(settings, null, 2);
    await fs.writeFile(tempPath, jsonString, 'utf8');
    await fs.rename(tempPath, validatedPath);

    return { success: true, deleted: hookId };
  } catch (error) {
    // Handle specific error codes
    if (error.code === 'ENOENT') {
      throw new Error(`Settings file not found: ${validatedPath}`);
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
  deleteJsonProperty,
  deleteHook
};
