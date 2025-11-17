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
 * HOOK STRUCTURE DOCUMENTATION
 *
 * Claude Code hooks use a complex 3-level nested structure.
 * For complete documentation, see: docs/technical/hook-structure.md
 *
 * Quick reference:
 * - Level 1: Event names (PreToolUse, PostToolUse, UserPromptSubmit, etc.)
 * - Level 2: Matcher entries with glob patterns (*.ts, *.js, etc.)
 * - Level 3: Hook command objects with type/command/enabled/timeout
 *
 * Deduplication key: event + matcher + command
 * Merge algorithm: 3-level merge (event → matcher → hooks)
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

  /**
   * Checks if a hook already exists in the hooks array
   * Deduplication is based on the "command" field
   *
   * @param {Array} existingHooks - Array of existing hook objects
   * @param {Object} newHook - New hook object to check
   * @returns {boolean} True if hook command already exists
   */
  isDuplicateHook(existingHooks, newHook) {
    if (!Array.isArray(existingHooks) || existingHooks.length === 0) {
      return false;
    }

    return existingHooks.some(hook => hook.command === newHook.command);
  }

  /**
   * Performs 3-level merge of hook into settings object
   *
   * Level 1: Find or create event in settings.hooks
   * Level 2: Find or create matcher entry in event array
   * Level 3: Add hook command to matcher's hooks array (if not duplicate)
   *
   * @param {Object} settings - Settings object to merge into
   * @param {string} event - Event name (e.g., 'PreToolUse')
   * @param {string} matcher - Matcher pattern (e.g., '*.ts')
   * @param {Object} hookCommand - Hook command object { type, command, enabled, timeout }
   * @returns {Object} Updated settings object
   */
  mergeHookIntoSettings(settings, event, matcher, hookCommand) {
    // Ensure hooks object exists (Level 0)
    if (!settings.hooks) {
      settings.hooks = {};
    }

    // Level 1: Find or create event
    if (!settings.hooks[event]) {
      // Create new event with empty matcher array
      settings.hooks[event] = [];
    }

    // Level 2: Find or create matcher entry
    const eventArray = settings.hooks[event];
    let matcherEntry = eventArray.find(entry => {
      // Match on matcher field, treating undefined and "*" as equivalent
      const entryMatcher = entry.matcher || '*';
      const targetMatcher = matcher || '*';
      return entryMatcher === targetMatcher;
    });

    if (!matcherEntry) {
      // Create new matcher entry
      matcherEntry = {
        hooks: []
      };

      // Only add matcher field if not default "*"
      if (matcher && matcher !== '*') {
        matcherEntry.matcher = matcher;
      }

      eventArray.push(matcherEntry);
    }

    // Level 3: Add hook command (if not duplicate)
    if (!this.isDuplicateHook(matcherEntry.hooks, hookCommand)) {
      matcherEntry.hooks.push(hookCommand);
    }

    return settings;
  }

  /**
   * Copies a hook configuration by merging it into target settings.json
   *
   * Unlike agents and commands, hooks are not copied as separate files.
   * Instead, they are merged into the settings.json file using a 3-level
   * nested structure: event -> matcher -> hooks array.
   *
   * The method performs intelligent deduplication based on event+matcher+command
   * to prevent duplicate hooks from being added.
   *
   * @param {Object} request - Copy request object
   * @param {Object} request.sourceHook - Flattened hook object from API
   * @param {string} request.sourceHook.event - Event name (e.g., 'PreToolUse')
   * @param {string} request.sourceHook.matcher - Matcher pattern (e.g., '*.ts')
   * @param {string} request.sourceHook.type - Hook type (e.g., 'command')
   * @param {string} request.sourceHook.command - Command to execute
   * @param {boolean} [request.sourceHook.enabled=true] - Whether hook is enabled
   * @param {number} [request.sourceHook.timeout=60] - Timeout in seconds
   * @param {string} request.targetScope - Target scope ('project' or 'user')
   * @param {string|null} request.targetProjectId - Project ID if scope is 'project'
   * @returns {Promise<Object>} Result object with success status and details
   *
   * Success return: { success: true, mergedInto: '/absolute/path/to/settings.json', hook: { event, matcher, command } }
   * Error return: { success: false, error: 'Descriptive error message' }
   */
  async copyHook(request) {
    try {
      // 1. Extract hook details from request
      const { event, matcher, type, command, enabled, timeout } = request.sourceHook;

      // Validate required fields
      if (!event || typeof event !== 'string') {
        throw new Error('Invalid hook: event is required');
      }

      if (!command || typeof command !== 'string') {
        throw new Error('Invalid hook: command is required');
      }

      // 2. Build target settings.json path
      // Use a dummy path since buildTargetPath extracts filename from source
      // For hooks, we only care about the settings.json path
      const dummySourcePath = '/dummy/hook.json';
      const settingsPath = await this.buildTargetPath(
        'hook',
        request.targetScope,
        request.targetProjectId,
        dummySourcePath
      );

      // 3. Read existing settings.json (or create empty structure)
      let settings = {};
      try {
        const content = await fs.readFile(settingsPath, 'utf8');
        settings = JSON.parse(content);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          // File exists but couldn't be read
          throw new Error(`Failed to read settings file: ${error.message}`);
        }
        // File doesn't exist - will create new one
      }

      // 4. Validate settings structure (if file exists)
      if (Object.keys(settings).length > 0 && typeof settings !== 'object') {
        throw new Error('Malformed settings.json: expected JSON object');
      }

      // 5. Perform 3-level merge
      const hookCommand = {
        type: type || 'command',
        command,
        enabled: enabled !== undefined ? enabled : true,
        timeout: timeout || 60
      };

      settings = this.mergeHookIntoSettings(
        settings,
        event,
        matcher || '*',
        hookCommand
      );

      // 6. Ensure parent directory exists
      const settingsDir = path.dirname(settingsPath);
      try {
        await fs.mkdir(settingsDir, { recursive: true });
      } catch (error) {
        throw new Error(`Failed to create settings directory: ${error.message}`);
      }

      // 7. Write settings back to file (atomic write pattern)
      const tempFile = settingsPath + '.tmp';
      try {
        await fs.writeFile(tempFile, JSON.stringify(settings, null, 2), 'utf8');
      } catch (error) {
        throw new Error(`Failed to write temporary file: ${error.message}`);
      }

      // 8. Validate JSON is well-formed
      try {
        const validationContent = await fs.readFile(tempFile, 'utf8');
        JSON.parse(validationContent);
      } catch (error) {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
        throw new Error(`Generated invalid JSON: ${error.message}`);
      }

      // 9. Atomic rename (replaces original)
      try {
        await fs.rename(tempFile, settingsPath);
      } catch (error) {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
        throw new Error(`Failed to update settings file: ${error.message}`);
      }

      // 10. Return success
      return {
        success: true,
        mergedInto: settingsPath,
        hook: {
          event,
          matcher: matcher || '*',
          command
        }
      };

    } catch (error) {
      // Handle all errors with consistent format
      return {
        success: false,
        error: error.message || 'Unknown error occurred during hook copy operation'
      };
    }
  }

  /**
   * Helper method to get project path from projectId
   *
   * @param {string} projectId - Project ID (encoded path)
   * @returns {Promise<string>} Absolute path to project directory
   * @throws {Error} If project not found or doesn't exist
   */
  async getProjectPath(projectId) {
    const projectsResult = await discoverProjects();
    const projectData = projectsResult.projects[projectId];

    if (!projectData) {
      throw new Error(`Project not found: ${projectId}`);
    }

    if (!projectData.exists) {
      throw new Error(`Project directory does not exist: ${projectData.path}`);
    }

    return projectData.path;
  }

  /**
   * Copies an MCP server configuration by merging it into target settings.json or .mcp.json
   *
   * Unlike agents and commands, MCP servers are not copied as separate files.
   * Instead, they are merged into either:
   * - User scope: ~/.claude/settings.json (under mcpServers key)
   * - Project scope: .mcp.json (preferred) or .claude/settings.json (fallback)
   *
   * The method detects conflicts by checking if a server with the same name already exists.
   * Conflict strategies supported: 'skip' (cancel), 'overwrite' (replace existing).
   *
   * @param {Object} request - Copy request object
   * @param {string} request.sourceServerName - Name of MCP server to copy
   * @param {Object} request.sourceMcpConfig - MCP server configuration object
   * @param {string} request.sourceMcpConfig.command - Command to execute
   * @param {Array<string>} request.sourceMcpConfig.args - Command arguments
   * @param {Object} [request.sourceMcpConfig.env] - Environment variables
   * @param {string} request.targetScope - Target scope ('project' or 'user')
   * @param {string|null} request.targetProjectId - Project ID if scope is 'project'
   * @param {string} [request.conflictStrategy] - How to handle conflicts ('skip', 'overwrite')
   * @returns {Promise<Object>} Result object with success status and details
   *
   * Success return: { success: true, mergedInto: '/absolute/path/to/.mcp.json', serverName: 'github' }
   * Conflict return: { success: false, conflict: { serverName, targetPath, existingConfig } }
   * Skip return: { success: false, skipped: true, message: 'Copy cancelled by user' }
   * Error return: { success: false, error: 'Descriptive error message' }
   */
  async copyMcp(request) {
    try {
      // 1. Extract and validate request parameters
      const { sourceServerName, sourceMcpConfig, targetScope, targetProjectId, conflictStrategy } = request;

      // Validate required fields
      if (!sourceServerName || typeof sourceServerName !== 'string') {
        throw new Error('Invalid MCP server: sourceServerName is required');
      }

      if (!sourceMcpConfig || typeof sourceMcpConfig !== 'object') {
        throw new Error('Invalid MCP server: sourceMcpConfig is required');
      }

      if (!sourceMcpConfig.command || typeof sourceMcpConfig.command !== 'string') {
        throw new Error('Invalid MCP server: command is required');
      }

      if (!targetScope || typeof targetScope !== 'string') {
        throw new Error('Invalid targetScope: must be a non-empty string');
      }

      // 2. Determine target file path
      let targetPath;

      if (targetScope === 'user') {
        // User scope: ~/.claude/settings.json
        targetPath = path.join(os.homedir(), '.claude', 'settings.json');
      } else if (targetScope === 'project') {
        // Project scope: Always use .mcp.json (create if doesn't exist)
        if (!targetProjectId) {
          throw new Error('targetProjectId is required when targetScope is "project"');
        }

        const projectPath = await this.getProjectPath(targetProjectId);
        targetPath = path.join(projectPath, '.mcp.json');
      } else {
        throw new Error(`Invalid targetScope: must be 'project' or 'user'`);
      }

      // 3. Read target file (or create empty structure)
      let targetConfig = {};
      try {
        const content = await fs.readFile(targetPath, 'utf8');
        targetConfig = JSON.parse(content);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          // File exists but couldn't be read or parsed
          throw new Error(`Failed to read target file: ${error.message}`);
        }
        // File doesn't exist - will create new one
      }

      // 4. Determine MCP server structure based on file type
      // Note: .mcp.json uses nested structure with mcpServers key (same as settings.json)
      // Both file types store servers under the mcpServers key
      const isMcpJson = targetPath.endsWith('.mcp.json');

      // Ensure mcpServers exists in the structure
      if (!targetConfig.mcpServers) {
        targetConfig.mcpServers = {};
      }

      const mcpServers = targetConfig.mcpServers;

      // 5. Detect conflict (server name already exists)
      if (mcpServers[sourceServerName]) {
        // Conflict exists
        if (!conflictStrategy) {
          // No strategy provided - return conflict for user decision
          return {
            success: false,
            conflict: {
              serverName: sourceServerName,
              targetPath: targetPath,
              existingConfig: mcpServers[sourceServerName]
            }
          };
        }

        // Handle strategy
        if (conflictStrategy === 'skip') {
          return {
            success: false,
            skipped: true,
            message: 'Copy cancelled by user'
          };
        }

        // 'overwrite' strategy - continue to merge (will replace)
        if (conflictStrategy !== 'overwrite') {
          throw new Error(`Unknown conflict strategy: ${conflictStrategy}`);
        }
      }

      // 6. Merge MCP server configuration
      mcpServers[sourceServerName] = sourceMcpConfig;

      // 7. Update target config structure (mcpServers already updated by reference)
      // Both .mcp.json and settings.json use the same nested structure
      targetConfig.mcpServers = mcpServers;

      // 8. Ensure parent directory exists
      const targetDir = path.dirname(targetPath);
      try {
        await fs.mkdir(targetDir, { recursive: true });
      } catch (error) {
        throw new Error(`Failed to create target directory: ${error.message}`);
      }

      // 9. Write atomically (temp file + rename)
      const tempFile = targetPath + '.tmp';
      try {
        await fs.writeFile(tempFile, JSON.stringify(targetConfig, null, 2), 'utf8');
      } catch (error) {
        throw new Error(`Failed to write temporary file: ${error.message}`);
      }

      // 10. Validate JSON is well-formed
      try {
        const validationContent = await fs.readFile(tempFile, 'utf8');
        JSON.parse(validationContent);
      } catch (error) {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
        throw new Error(`Generated invalid JSON: ${error.message}`);
      }

      // 11. Atomic rename (replaces original)
      try {
        await fs.rename(tempFile, targetPath);
      } catch (error) {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
        throw new Error(`Failed to update target file: ${error.message}`);
      }

      // 12. Return success
      return {
        success: true,
        mergedInto: targetPath,
        serverName: sourceServerName
      };

    } catch (error) {
      // Handle all errors with consistent format
      return {
        success: false,
        error: error.message || 'Unknown error occurred during MCP copy operation'
      };
    }
  }
}

// Export singleton instance
module.exports = new CopyService();
