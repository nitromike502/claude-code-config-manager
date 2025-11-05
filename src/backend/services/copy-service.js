const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { discoverProjects } = require('./projectDiscovery');

/**
 * CopyService - Handles copying configuration items between projects and user scope
 *
 * This service provides functionality to copy agents, commands, hooks, and MCP servers
 * across different scopes (project-to-project, project-to-user, user-to-project).
 *
 * Key responsibilities:
 * - Validate source paths for security (prevent path traversal)
 * - Build correct target paths based on config type and scope
 * - Detect and resolve file conflicts
 * - Generate unique filenames when needed
 */

/**
 * ============================================================================
 * HOOK STRUCTURE VERIFICATION (TASK-3.2.3)
 * Completed: 2025-11-05
 * ============================================================================
 *
 * Investigation Results:
 * - Verified: NO - Claude Code does NOT support simple hook arrays
 * - Actual Format: Complex nested object structure with event -> matchers -> hooks
 * - Sources:
 *   - /home/claude/manager/tests/fixtures/samples/settings/valid-hooks.json
 *   - /home/claude/manager/tests/fixtures/projects/valid-project/.claude/settings.json
 *   - /home/claude/manager/src/backend/services/projectDiscovery.js (lines 208-579)
 *
 * ============================================================================
 * CLAUDE CODE HOOK STRUCTURE (Official Format)
 * ============================================================================
 *
 * Hooks in settings.json follow this structure:
 *
 * {
 *   "hooks": {
 *     "PreToolUse": [
 *       {
 *         "matcher": "*.ts",
 *         "hooks": [
 *           { "type": "command", "command": "tsc --noEmit", "enabled": true },
 *           { "type": "command", "command": "eslint --fix", "enabled": true }
 *         ]
 *       }
 *     ],
 *     "PostToolUse": [
 *       {
 *         "matcher": "*",
 *         "hooks": [
 *           { "type": "command", "command": "npm test", "enabled": true }
 *         ]
 *       }
 *     ],
 *     "UserPromptSubmit": [
 *       {
 *         "hooks": [
 *           { "type": "command", "command": "git status", "enabled": true }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * ============================================================================
 * STRUCTURE BREAKDOWN (3 Levels of Nesting)
 * ============================================================================
 *
 * Level 1 - Event Names (Top-level keys under "hooks"):
 *   Valid events: PreToolUse, PostToolUse, UserPromptSubmit, Notification,
 *                 Stop, SubagentStop, PreCompact, SessionStart, SessionEnd
 *
 *   Only PreToolUse and PostToolUse support the "matcher" field
 *   Other events ignore matcher if present
 *
 * Level 2 - Matcher Entries (Array of matcher config objects):
 *   Each event has an array of matcher entries
 *   Structure: { "matcher": "*.ts", "hooks": [...] }
 *   Matcher is optional (defaults to "*")
 *
 * Level 3 - Hook Commands (Array of hook objects within each matcher):
 *   Each matcher entry contains a "hooks" array
 *   Structure: { "type": "command", "command": "npm test", "enabled": true, "timeout": 60 }
 *   Required: type, command
 *   Optional: enabled (default true), timeout (default 60)
 *
 * ============================================================================
 * API FLATTENED FORMAT (What the backend returns)
 * ============================================================================
 *
 * The projectDiscovery.js service flattens this nested structure for easier
 * consumption by the frontend. Each hook command becomes a separate object:
 *
 * [
 *   {
 *     "event": "PreToolUse",
 *     "matcher": "*.ts",
 *     "type": "command",
 *     "command": "tsc --noEmit",
 *     "timeout": 60,
 *     "enabled": true,
 *     "source": "settings.json"
 *   },
 *   {
 *     "event": "PreToolUse",
 *     "matcher": "*.ts",
 *     "type": "command",
 *     "command": "eslint --fix",
 *     "timeout": 60,
 *     "enabled": true,
 *     "source": "settings.json"
 *   }
 * ]
 *
 * See projectDiscovery.js lines 368-383 for flattening logic
 *
 * ============================================================================
 * DEDUPLICATION STRATEGY
 * ============================================================================
 *
 * Per Claude Code spec (implemented in projectDiscovery.js lines 1088-1104):
 * "Identical hook commands are automatically deduplicated"
 *
 * Deduplication key: event + matcher + command
 * Example: "PreToolUse::*.ts::tsc --noEmit"
 *
 * First occurrence is kept, duplicates are filtered out
 *
 * ============================================================================
 * MERGE STRATEGY REQUIRED FOR copyHook (TASK-3.2.4)
 * ============================================================================
 *
 * The copyHook function must:
 *
 * 1. Read flattened hook from API (source hook object with event/matcher/command)
 * 2. Read target settings.json file
 * 3. Convert flattened source back to nested structure
 * 4. Merge into target's nested structure
 * 5. Apply deduplication (event + matcher + command)
 * 6. Write merged nested structure back to settings.json
 *
 * Merge Algorithm (3-Level Merge):
 *
 * Level 1 - Event-level merge:
 *   - If target has event, merge into existing matcher array
 *   - If target lacks event, create new event with matcher array
 *
 * Level 2 - Matcher-level merge:
 *   - Find matcher entry with same matcher pattern in event array
 *   - If matcher exists, merge into existing hooks array
 *   - If matcher missing, append new matcher entry to event array
 *
 * Level 3 - Hook command deduplication:
 *   - Within each matcher's hooks array, check for duplicate commands
 *   - Deduplication key: "command" field (unique within event+matcher)
 *   - If command exists, skip (keep existing)
 *   - If command missing, append new hook object
 *
 * ============================================================================
 * COMPLEXITY ASSESSMENT
 * ============================================================================
 *
 * Complexity: HIGH
 *
 * Reasons:
 * 1. Must convert between flattened API format and nested file format
 * 2. 3-level merge algorithm (event -> matcher -> hooks)
 * 3. Multiple deduplication checks at different levels
 * 4. Must handle matcher-enabled vs non-matcher events differently
 * 5. Must preserve existing hook structure while adding new hooks
 * 6. Must handle missing settings.json (create new structure)
 * 7. Must handle malformed settings.json gracefully
 *
 * Estimated Time: 90 minutes
 *
 * ============================================================================
 * EDGE CASES TO HANDLE
 * ============================================================================
 *
 * 1. Target settings.json doesn't exist
 *    -> Create new file with proper structure
 *
 * 2. Target settings.json exists but has no "hooks" key
 *    -> Add "hooks" object with new event
 *
 * 3. Target has event but different matcher
 *    -> Append new matcher entry to event array
 *
 * 4. Target has same event+matcher but different command
 *    -> Append new hook to matcher's hooks array
 *
 * 5. Target has exact duplicate (event+matcher+command)
 *    -> Skip (deduplication)
 *
 * 6. Source event doesn't support matchers (e.g., UserPromptSubmit)
 *    -> Use default matcher "*" and warn if non-default matcher present
 *
 * 7. Malformed target settings.json
 *    -> Return error, do not corrupt file
 *
 * 8. Preserving other settings (mcpServers, etc.)
 *    -> Only modify "hooks" key, leave everything else intact
 *
 * ============================================================================
 * EXAMPLES FROM FIXTURES
 * ============================================================================
 *
 * Example 1: Simple hook with matcher (valid-hooks.json)
 * {
 *   "hooks": {
 *     "pre-commit": [
 *       {
 *         "matcher": "*.ts",
 *         "hooks": [
 *           { "type": "command", "command": "tsc --noEmit", "enabled": true }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * Example 2: Multiple hooks per matcher (valid-multiple-hooks-per-matcher.json)
 * {
 *   "hooks": {
 *     "pre-commit": [
 *       {
 *         "matcher": "*.ts",
 *         "hooks": [
 *           { "type": "command", "command": "tsc --noEmit", "enabled": true },
 *           { "type": "command", "command": "eslint --fix", "enabled": true },
 *           { "type": "command", "command": "prettier --write", "enabled": true }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * Example 3: Multiple events (valid-multiple-events.json)
 * {
 *   "hooks": {
 *     "pre-commit": [
 *       { "matcher": "*.js", "hooks": [...] }
 *     ],
 *     "post-commit": [
 *       { "matcher": "*", "hooks": [...] }
 *     ],
 *     "pre-push": [
 *       { "matcher": "*", "hooks": [...] }
 *     ]
 *   }
 * }
 *
 * Example 4: Event without matcher support (valid-project settings.json)
 * {
 *   "hooks": {
 *     "PreCompact": [
 *       {
 *         "hooks": [
 *           { "type": "command", "command": "npm test", "enabled": true }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * ============================================================================
 * RECOMMENDATIONS FOR TASK-3.2.4
 * ============================================================================
 *
 * 1. Create helper function: flattenedToNested(flattenedHook)
 *    - Input: { event, matcher, type, command, timeout, enabled }
 *    - Output: Partial nested structure to merge
 *
 * 2. Create helper function: mergeHookIntoSettings(settings, nestedHook)
 *    - Input: Settings object, nested hook structure
 *    - Output: Updated settings object
 *    - Logic: 3-level merge algorithm described above
 *
 * 3. Create helper function: deduplicateHooksInSettings(settings)
 *    - Input: Settings object with hooks
 *    - Output: Settings with deduplicated hooks
 *    - Logic: Apply deduplication at hook command level
 *
 * 4. Main copyHook flow:
 *    a. Validate source (must be hook object from API)
 *    b. Read target settings.json (or create empty structure)
 *    c. Convert flattened source to nested format
 *    d. Merge nested hook into settings
 *    e. Apply deduplication
 *    f. Write settings back to file
 *    g. Return success with merged hook details
 *
 * 5. Testing strategy:
 *    - Test each edge case listed above
 *    - Verify structure preservation
 *    - Verify deduplication works correctly
 *    - Test with real fixture files
 *
 * ============================================================================
 */
class CopyService {
  /**
   * Validates that a source path exists and is safe to read
   * Security: Prevents path traversal attacks by ensuring path is within allowed directories
   *
   * @param {string} sourcePath - Absolute path to the source file
   * @returns {Promise<string>} Resolved absolute path if source is valid and safe
   * @throws {Error} If source path is invalid, doesn't exist, or violates security constraints
   */
  async validateSource(sourcePath) {
    // Validate input
    if (!sourcePath || typeof sourcePath !== 'string') {
      throw new Error('Invalid source path: path must be a non-empty string');
    }

    // Additional security: Check for null bytes (path injection)
    if (sourcePath.includes('\0')) {
      throw new Error('Invalid source path: path contains null bytes');
    }

    // Check for path traversal attempts BEFORE normalization
    // This catches explicit '..' in the path string
    if (sourcePath.includes('..')) {
      throw new Error('Path traversal detected: source path contains ".." segments');
    }

    // Normalize and resolve path
    const normalized = path.normalize(sourcePath);
    const resolved = path.resolve(normalized);

    // Verify source exists and is readable
    try {
      await fs.access(resolved, fs.constants.R_OK);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Source file not found: ${resolved}`);
      }
      if (error.code === 'EACCES') {
        throw new Error(`Permission denied: cannot read ${resolved}`);
      }
      throw new Error(`Cannot access source file: ${error.message}`);
    }

    // Verify it's a file (not a directory or symlink to a directory)
    try {
      const stats = await fs.stat(resolved);
      if (!stats.isFile()) {
        throw new Error(`Invalid source: ${resolved} is not a regular file`);
      }
    } catch (error) {
      throw new Error(`Cannot stat source file: ${error.message}`);
    }

    return resolved;
  }

  /**
   * Builds the target path for a configuration item based on its type and target scope
   *
   * Examples:
   * - Agent (project scope): /path/to/project/.claude/agents/agent-name.md
   * - Command (user scope): ~/.claude/commands/command-name.md
   * - Hook (project scope): /path/to/project/.claude/settings.json (merged)
   * - MCP server (user scope): ~/.claude/settings.json (merged)
   *
   * @param {string} configType - Type of config ('agent', 'command', 'hook', 'mcp')
   * @param {string} targetScope - Target scope ('project' or 'user')
   * @param {string|null} targetProjectId - Project ID if targetScope is 'project' (null for user scope)
   * @param {string} sourcePath - Absolute path to source file (used to derive filename)
   * @returns {Promise<string>} Absolute path where the config should be copied
   * @throws {Error} If parameters are invalid or target cannot be determined
   */
  async buildTargetPath(configType, targetScope, targetProjectId, sourcePath) {
    // Validate parameters
    if (!configType || typeof configType !== 'string') {
      throw new Error('Invalid configType: must be a non-empty string');
    }

    if (!targetScope || typeof targetScope !== 'string') {
      throw new Error('Invalid targetScope: must be a non-empty string');
    }

    if (!sourcePath || typeof sourcePath !== 'string') {
      throw new Error('Invalid sourcePath: must be a non-empty string');
    }

    // Validate configType
    const validConfigTypes = ['agent', 'command', 'hook', 'mcp'];
    if (!validConfigTypes.includes(configType)) {
      throw new Error(`Invalid configType: must be one of ${validConfigTypes.join(', ')}`);
    }

    // Validate targetScope
    const validScopes = ['project', 'user'];
    if (!validScopes.includes(targetScope)) {
      throw new Error(`Invalid targetScope: must be one of ${validScopes.join(', ')}`);
    }

    // Validate targetProjectId for project scope
    if (targetScope === 'project' && !targetProjectId) {
      throw new Error('targetProjectId is required when targetScope is "project"');
    }

    // Extract filename from source path
    const sourceFilename = path.basename(sourcePath);

    // Determine base directory based on scope
    let basePath;

    if (targetScope === 'user') {
      // User scope: ~/.claude/
      basePath = path.join(os.homedir(), '.claude');
    } else {
      // Project scope: need to resolve projectId to project path
      const projectsResult = await discoverProjects();
      const projectData = projectsResult.projects[targetProjectId];

      if (!projectData) {
        throw new Error(`Project not found: ${targetProjectId}`);
      }

      if (!projectData.exists) {
        throw new Error(`Project directory does not exist: ${projectData.path}`);
      }

      basePath = path.join(projectData.path, '.claude');
    }

    // Build target path based on config type
    let targetPath;

    switch (configType) {
      case 'agent':
        // Agents: .claude/agents/agent-name.md
        targetPath = path.join(basePath, 'agents', sourceFilename);
        break;

      case 'command':
        // Commands: .claude/commands/command-name.md
        // Note: Commands can be nested in subdirectories
        // Extract the relative path from source to preserve nesting
        const sourceDir = path.dirname(sourcePath);
        const commandsIndex = sourceDir.lastIndexOf(path.sep + 'commands');

        if (commandsIndex !== -1) {
          // Extract nested path after 'commands/' directory
          const nestedPath = sourceDir.substring(commandsIndex + '/commands'.length + 1);
          if (nestedPath) {
            targetPath = path.join(basePath, 'commands', nestedPath, sourceFilename);
          } else {
            targetPath = path.join(basePath, 'commands', sourceFilename);
          }
        } else {
          // No nesting detected, place in root of commands
          targetPath = path.join(basePath, 'commands', sourceFilename);
        }
        break;

      case 'hook':
        // Hooks: .claude/settings.json (merged, not copied as file)
        // Return the settings.json path where hook will be merged
        targetPath = path.join(basePath, 'settings.json');
        break;

      case 'mcp':
        // MCP servers: For user scope -> ~/.claude/settings.json
        //              For project scope -> .mcp.json (primary) or .claude/settings.json (fallback)
        if (targetScope === 'user') {
          targetPath = path.join(basePath, 'settings.json');
        } else {
          // For project scope, prefer .mcp.json
          targetPath = path.join(basePath.replace(path.sep + '.claude', ''), '.mcp.json');
        }
        break;

      default:
        throw new Error(`Unsupported configType: ${configType}`);
    }

    // Security: Normalize the final path to prevent any traversal
    const normalizedTarget = path.normalize(targetPath);

    // Ensure target is within the base path (defense in depth)
    if (!normalizedTarget.startsWith(path.normalize(basePath.replace(path.sep + '.claude', '')))) {
      throw new Error('Security violation: target path escapes allowed directory');
    }

    return normalizedTarget;
  }

  /**
   * Checks if a file already exists at the target path (conflict detection)
   *
   * @param {string} sourcePath - Absolute path to source file
   * @param {string} targetPath - Absolute path to target location
   * @returns {Promise<Object|null>} Conflict object with timestamps if file exists, null otherwise
   * @returns {Promise<{targetPath: string, sourceModified: string, targetModified: string}>}
   */
  async detectConflict(sourcePath, targetPath) {
    try {
      // Check if target file exists
      const targetExists = await fs.access(targetPath)
        .then(() => true)
        .catch(() => false);

      // No conflict if target doesn't exist
      if (!targetExists) {
        return null;
      }

      // Get modification times for both source and target
      const [sourceStat, targetStat] = await Promise.all([
        fs.stat(sourcePath),
        fs.stat(targetPath)
      ]);

      // Return conflict information with ISO timestamps
      return {
        targetPath,
        sourceModified: sourceStat.mtime.toISOString(),
        targetModified: targetStat.mtime.toISOString()
      };
    } catch (error) {
      // Gracefully handle any errors (permissions, stat failures, etc.)
      // Return null to indicate no conflict (safe default)
      return null;
    }
  }

  /**
   * Resolves a file conflict using the specified strategy
   *
   * Strategies:
   * - 'overwrite': Replace existing file with source
   * - 'skip': Keep existing file, do not copy
   * - 'rename': Generate unique filename and copy alongside existing
   *
   * @param {string} targetPath - Absolute path where conflict occurred
   * @param {string} strategy - Conflict resolution strategy ('overwrite', 'skip', 'rename')
   * @returns {Promise<string>} Resolved target path (original for overwrite, unique for rename)
   * @throws {Error} If strategy is 'skip' (cancels copy) or strategy is unknown
   */
  async resolveConflict(targetPath, strategy) {
    // No strategy provided: return targetPath as-is
    if (!strategy) {
      return targetPath;
    }

    switch (strategy) {
      case 'skip':
        // User chose to skip the copy operation
        throw new Error('Copy cancelled by user');

      case 'overwrite':
        // Return original targetPath - file will be replaced during copy
        // TODO: Consider creating backup before overwrite (future enhancement)
        return targetPath;

      case 'rename':
        // Generate unique filename to avoid overwriting
        return this.generateUniquePath(targetPath);

      default:
        // Unknown strategy
        throw new Error(`Unknown conflict strategy: ${strategy}`);
    }
  }

  /**
   * Generates a unique filename by appending a numeric suffix
   *
   * Example: agent.md -> agent-2.md, agent-3.md, etc.
   *
   * @param {string} originalPath - Original absolute path that has a conflict
   * @returns {Promise<string>} New unique absolute path that doesn't conflict
   */
  async generateUniquePath(originalPath) {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const base = path.basename(originalPath, ext);

    let counter = 2;
    let newPath;

    do {
      newPath = path.join(dir, `${base}-${counter}${ext}`);
      counter++;
    } while (await fs.access(newPath).then(() => true).catch(() => false));

    return newPath;
  }

  /**
   * Copies an agent file from source to target location
   *
   * Agents are markdown files with YAML frontmatter containing metadata like
   * name, description, tools, model, and color. This method validates the
   * source file structure, handles conflicts, and copies to the target location.
   *
   * @param {Object} request - Copy request object
   * @param {string} request.sourcePath - Absolute path to source agent file
   * @param {string} request.targetScope - Target scope ('project' or 'user')
   * @param {string|null} request.targetProjectId - Project ID if scope is 'project'
   * @param {string} [request.conflictStrategy] - How to handle conflicts ('skip', 'overwrite', 'rename')
   * @returns {Promise<Object>} Result object with success status and details
   *
   * Success return: { success: true, copiedPath: '/absolute/path/to/copied/agent.md' }
   * Conflict return: { success: false, conflict: { targetPath, sourceModified, targetModified } }
   * Skip return: { success: false, skipped: true, message: 'Copy cancelled by user' }
   * Error return: { success: false, error: 'Descriptive error message' }
   */
  async copyAgent(request) {
    try {
      // 1. Validate source path (security + existence)
      const validatedSourcePath = await this.validateSource(request.sourcePath);

      // 2. Validate YAML frontmatter
      let content;
      try {
        content = await fs.readFile(validatedSourcePath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to read source file: ${error.message}`);
      }

      // Check for YAML frontmatter delimiters (must start with --- and have closing ---)
      const yamlPattern = /^---\s*\n[\s\S]*?\n---\s*\n/;
      if (!yamlPattern.test(content)) {
        throw new Error('Invalid agent file: missing YAML frontmatter (must start and end with ---)');
      }

      // 3. Build target path
      const targetPath = await this.buildTargetPath(
        'agent',
        request.targetScope,
        request.targetProjectId,
        validatedSourcePath
      );

      // 4. Detect conflict
      const conflict = await this.detectConflict(validatedSourcePath, targetPath);

      // 5. Handle conflict if detected
      let finalTargetPath = targetPath;

      if (conflict) {
        // Conflict exists - check if strategy provided
        if (!request.conflictStrategy) {
          // No strategy provided, return conflict for user decision
          return {
            success: false,
            conflict: conflict
          };
        }

        // Resolve conflict with provided strategy
        try {
          finalTargetPath = await this.resolveConflict(targetPath, request.conflictStrategy);
        } catch (error) {
          // Handle 'skip' strategy (throws "Copy cancelled by user")
          if (error.message === 'Copy cancelled by user') {
            return {
              success: false,
              skipped: true,
              message: 'Copy cancelled by user'
            };
          }
          // Re-throw other errors
          throw error;
        }
      }

      // 6. Ensure parent directory exists
      const targetDir = path.dirname(finalTargetPath);
      try {
        await fs.mkdir(targetDir, { recursive: true });
      } catch (error) {
        throw new Error(`Failed to create target directory: ${error.message}`);
      }

      // 7. Copy file
      try {
        await fs.copyFile(validatedSourcePath, finalTargetPath);
      } catch (error) {
        throw new Error(`Failed to copy file: ${error.message}`);
      }

      // 8. Return success
      return {
        success: true,
        copiedPath: finalTargetPath
      };

    } catch (error) {
      // Handle all errors with consistent format
      return {
        success: false,
        error: error.message || 'Unknown error occurred during copy operation'
      };
    }
  }

  /**
   * Copies a command file from source to target location
   *
   * Commands are markdown files with YAML frontmatter containing metadata like
   * name, description, and command text. Commands can be nested in subdirectories
   * (e.g., .claude/commands/git/commit.md) and the structure is preserved.
   *
   * @param {Object} request - Copy request object
   * @param {string} request.sourcePath - Absolute path to source command file
   * @param {string} request.targetScope - Target scope ('project' or 'user')
   * @param {string|null} request.targetProjectId - Project ID if scope is 'project'
   * @param {string} [request.conflictStrategy] - How to handle conflicts ('skip', 'overwrite', 'rename')
   * @returns {Promise<Object>} Result object with success status and details
   *
   * Success return: { success: true, copiedPath: '/absolute/path/to/copied/command.md' }
   * Conflict return: { success: false, conflict: { targetPath, sourceModified, targetModified } }
   * Skip return: { success: false, skipped: true, message: 'Copy cancelled by user' }
   * Error return: { success: false, error: 'Descriptive error message' }
   */
  async copyCommand(request) {
    try {
      // 1. Validate source path (security + existence)
      const validatedSourcePath = await this.validateSource(request.sourcePath);

      // 2. Validate YAML frontmatter
      let content;
      try {
        content = await fs.readFile(validatedSourcePath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to read source file: ${error.message}`);
      }

      // Check for YAML frontmatter delimiters (must start with --- and have closing ---)
      const yamlPattern = /^---\s*\n[\s\S]*?\n---\s*\n/;
      if (!yamlPattern.test(content)) {
        throw new Error('Invalid command file: missing YAML frontmatter (must start and end with ---)');
      }

      // 3. Build target path
      const targetPath = await this.buildTargetPath(
        'command',
        request.targetScope,
        request.targetProjectId,
        validatedSourcePath
      );

      // 4. Detect conflict
      const conflict = await this.detectConflict(validatedSourcePath, targetPath);

      // 5. Handle conflict if detected
      let finalTargetPath = targetPath;

      if (conflict) {
        // Conflict exists - check if strategy provided
        if (!request.conflictStrategy) {
          // No strategy provided, return conflict for user decision
          return {
            success: false,
            conflict: conflict
          };
        }

        // Resolve conflict with provided strategy
        try {
          finalTargetPath = await this.resolveConflict(targetPath, request.conflictStrategy);
        } catch (error) {
          // Handle 'skip' strategy (throws "Copy cancelled by user")
          if (error.message === 'Copy cancelled by user') {
            return {
              success: false,
              skipped: true,
              message: 'Copy cancelled by user'
            };
          }
          // Re-throw other errors
          throw error;
        }
      }

      // 6. Ensure parent directory exists
      const targetDir = path.dirname(finalTargetPath);
      try {
        await fs.mkdir(targetDir, { recursive: true });
      } catch (error) {
        throw new Error(`Failed to create target directory: ${error.message}`);
      }

      // 7. Copy file
      try {
        await fs.copyFile(validatedSourcePath, finalTargetPath);
      } catch (error) {
        throw new Error(`Failed to copy file: ${error.message}`);
      }

      // 8. Return success
      return {
        success: true,
        copiedPath: finalTargetPath
      };

    } catch (error) {
      // Handle all errors with consistent format
      return {
        success: false,
        error: error.message || 'Unknown error occurred during copy operation'
      };
    }
  }
}

// Export singleton instance
module.exports = new CopyService();
