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
}

// Export singleton instance
module.exports = new CopyService();
