const path = require('path');
const fs = require('fs').promises;
const yaml = require('js-yaml');
const matter = require('gray-matter');

/**
 * UpdateService - Handles atomic updates to configuration files
 *
 * This service provides safe, atomic update operations for configuration files
 * used by Claude Code projects. All write operations use a temp file pattern
 * to ensure atomicity and prevent corruption on failure.
 *
 * Key responsibilities:
 * - Atomic file writes using temp file pattern
 * - YAML frontmatter updates with content preservation
 * - JSON file deep merge updates
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
 * Atomically writes content to a file using temp file pattern
 *
 * Process:
 * 1. Create temp file with .tmp suffix
 * 2. Write content to temp file
 * 3. Verify write (file exists, size > 0)
 * 4. Atomic rename temp to target
 * 5. Clean up temp on error
 *
 * @param {string} filePath - Absolute path where file should be written
 * @param {string} newContent - Content to write to file
 * @returns {Promise<{success: boolean}>} Success indicator
 * @throws {Error} On write failure, validation errors, or file system errors
 */
async function updateFile(filePath, newContent) {
  // Validate path
  const validatedPath = validatePath(filePath);

  // Validate content
  if (typeof newContent !== 'string') {
    throw new Error('Invalid content: must be a string');
  }

  // Create temp file path
  const tempPath = `${validatedPath}.tmp`;

  try {
    // Step 1 & 2: Create and write to temp file
    await fs.writeFile(tempPath, newContent, 'utf8');

    // Step 3: Verify write
    const stats = await fs.stat(tempPath);
    if (!stats.isFile()) {
      throw new Error('Temp file write verification failed: not a file');
    }
    if (stats.size === 0 && newContent.length > 0) {
      throw new Error('Temp file write verification failed: file is empty');
    }

    // Step 4: Atomic rename
    await fs.rename(tempPath, validatedPath);

    return { success: true };
  } catch (error) {
    // Step 5: Clean up temp file on error
    try {
      await fs.unlink(tempPath);
    } catch (cleanupError) {
      // Ignore cleanup errors (temp file may not exist)
    }

    // Handle specific error codes
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found: ${path.dirname(validatedPath)}`);
    }
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: cannot write to ${validatedPath}`);
    }
    if (error.code === 'EEXIST') {
      throw new Error(`File already exists: ${validatedPath}`);
    }

    throw error;
  }
}

/**
 * Updates YAML frontmatter in a markdown file while preserving body content
 *
 * Process:
 * 1. Read existing file
 * 2. Parse frontmatter and body using gray-matter (robust, handles edge cases)
 * 3. Shallow merge updates into existing frontmatter
 * 4. Reconstruct file with updated frontmatter and original body using gray-matter
 * 5. Write atomically using updateFile()
 *
 * Benefits of gray-matter:
 * - Handles various frontmatter formats (different line endings, spacing)
 * - Consistent with parsing used in subagentParser.js
 * - Prevents duplicate frontmatter bugs from regex mismatches
 *
 * @param {string} filePath - Absolute path to markdown file with YAML frontmatter
 * @param {Object} updates - Object with frontmatter properties to update/add
 * @returns {Promise<{success: boolean}>} Success indicator
 * @throws {Error} On read failure, parse errors, or write errors
 */
async function updateYamlFrontmatter(filePath, updates) {
  // Validate path
  const validatedPath = validatePath(filePath);

  // Validate updates
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw new Error('Invalid updates: must be a non-null object');
  }

  try {
    // Step 1: Read existing file
    const content = await fs.readFile(validatedPath, 'utf8');

    // Step 2: Parse frontmatter and body using gray-matter
    let parsed;
    try {
      parsed = matter(content);
    } catch (parseError) {
      throw new Error(`Failed to parse file with gray-matter: ${parseError.message}`);
    }

    // Step 3: Shallow merge updates into existing frontmatter
    const mergedFrontmatter = { ...parsed.data, ...updates };

    // Step 4: Reconstruct file using gray-matter's stringify
    let newContent;
    try {
      newContent = matter.stringify(parsed.content, mergedFrontmatter);
    } catch (stringifyError) {
      throw new Error(`Failed to serialize updated frontmatter: ${stringifyError.message}`);
    }

    // Step 5: Write atomically
    return await updateFile(validatedPath, newContent);
  } catch (error) {
    // Handle specific error codes
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${validatedPath}`);
    }
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: cannot read ${validatedPath}`);
    }

    throw error;
  }
}

/**
 * Deep merge helper function
 * Recursively merges source object into target object
 *
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // Recursively merge nested objects
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        // Overwrite primitive values and arrays
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Updates a JSON file with deep merge of updates
 *
 * Process:
 * 1. Read existing JSON file
 * 2. Parse JSON content
 * 3. Deep merge updates into existing data
 * 4. Validate by serializing to JSON
 * 5. Pretty print with 2-space indentation
 * 6. Write atomically using updateFile()
 *
 * @param {string} filePath - Absolute path to JSON file
 * @param {Object} updates - Object with properties to merge
 * @returns {Promise<{success: boolean}>} Success indicator
 * @throws {Error} On read failure, parse errors, or write errors
 */
async function updateJsonFile(filePath, updates) {
  // Validate path
  const validatedPath = validatePath(filePath);

  // Validate updates
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw new Error('Invalid updates: must be a non-null object');
  }

  try {
    // Step 1: Read existing JSON file
    let existingData = {};
    try {
      const content = await fs.readFile(validatedPath, 'utf8');
      // Step 2: Parse JSON content
      existingData = JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, start with empty object
        existingData = {};
      } else if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse existing JSON: ${error.message}`);
      } else {
        throw error;
      }
    }

    // Step 3: Deep merge updates
    const mergedData = deepMerge(existingData, updates);

    // Step 4: Validate by serializing
    let jsonString;
    try {
      // Step 5: Pretty print with 2-space indentation
      jsonString = JSON.stringify(mergedData, null, 2);
    } catch (jsonError) {
      throw new Error(`Failed to serialize updated JSON: ${jsonError.message}`);
    }

    // Step 6: Write atomically
    return await updateFile(validatedPath, jsonString);
  } catch (error) {
    // Handle specific error codes (if not already handled)
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: cannot access ${validatedPath}`);
    }

    throw error;
  }
}

module.exports = {
  updateFile,
  updateYamlFrontmatter,
  updateJsonFile
};
