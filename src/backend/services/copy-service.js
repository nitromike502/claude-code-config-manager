const path = require('path');
const fs = require('fs').promises;

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
   * @returns {Promise<boolean>} True if source is valid and safe
   * @throws {Error} If source path is invalid, doesn't exist, or violates security constraints
   */
  async validateSource(sourcePath) {
    // TODO: Implement in TASK-3.1.2
    throw new Error('Not implemented');
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
   * @returns {string} Absolute path where the config should be copied
   * @throws {Error} If parameters are invalid or target cannot be determined
   */
  buildTargetPath(configType, targetScope, targetProjectId, sourcePath) {
    // TODO: Implement in TASK-3.1.2
    throw new Error('Not implemented');
  }

  /**
   * Checks if a file already exists at the target path (conflict detection)
   *
   * @param {string} sourcePath - Absolute path to source file
   * @param {string} targetPath - Absolute path to target location
   * @returns {Promise<Object>} Object with { hasConflict: boolean, existingFile: string|null }
   */
  async detectConflict(sourcePath, targetPath) {
    // TODO: Implement in TASK-3.1.3
    throw new Error('Not implemented');
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
   * @returns {Promise<Object>} Object with { action: string, finalPath: string }
   */
  async resolveConflict(targetPath, strategy) {
    // TODO: Implement in TASK-3.1.3
    throw new Error('Not implemented');
  }

  /**
   * Generates a unique filename by appending a numeric suffix
   *
   * Example: agent.md -> agent-1.md, agent-2.md, etc.
   *
   * @param {string} originalPath - Original absolute path that has a conflict
   * @returns {Promise<string>} New unique absolute path that doesn't conflict
   */
  async generateUniquePath(originalPath) {
    // TODO: Implement in TASK-3.1.3
    throw new Error('Not implemented');
  }
}

// Export singleton instance
module.exports = new CopyService();
