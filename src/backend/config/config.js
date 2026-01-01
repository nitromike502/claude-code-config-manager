/**
 * Consolidated Configuration Module
 *
 * Central configuration for all hardcoded values across the codebase.
 * Supports both production and development modes via USE_DEV_PATHS environment variable.
 *
 * @module backend/config
 */

const os = require('os');
const path = require('path');

/**
 * Expands ~ to home directory in file paths
 * Respects process.env.HOME for testing purposes
 * @param {string} filePath - Path that may contain ~
 * @returns {string} Expanded absolute path
 */
function expandHome(filePath) {
  if (!filePath) return filePath;

  if (filePath.startsWith('~/') || filePath === '~') {
    // Use process.env.HOME if set (for testing), otherwise use os.homedir()
    const homeDir = process.env.HOME || os.homedir();
    return path.join(homeDir, filePath.slice(2));
  }

  return filePath;
}

/**
 * Server Configuration
 * Contains all server-related settings including ports, hosts, and URLs
 */
const server = {
  /**
   * Get backend server port
   * @returns {number} Backend port (default: 8420)
   */
  getBackendPort: () => parseInt(process.env.PORT || '8420', 10),

  /**
   * Get frontend development server port
   * @returns {number} Frontend port (default: 5173)
   */
  getFrontendPort: () => parseInt(process.env.VITE_PORT || '5173', 10),

  /**
   * Get backend server host
   * @returns {string} Backend host (default: 'localhost')
   */
  getBackendHost: () => process.env.HOST || 'localhost',

  /**
   * Get server protocol
   * @returns {string} Protocol (default: 'http')
   */
  getProtocol: () => process.env.PROTOCOL || 'http',

  /**
   * Get full backend URL
   * @returns {string} Complete backend URL (e.g., 'http://localhost:8420')
   */
  getBackendUrl: function() {
    return `${this.getProtocol()}://${this.getBackendHost()}:${this.getBackendPort()}`;
  }
};

/**
 * Path Configuration
 * Handles all file system paths with support for development mode
 * When USE_DEV_PATHS=true, uses .claude-dev instead of .claude
 */
const paths = {
  /**
   * Check if development mode is enabled
   * @returns {boolean} True if USE_DEV_PATHS environment variable is 'true'
   */
  isDevelopmentMode: () => process.env.USE_DEV_PATHS === 'true',

  /**
   * Get the appropriate .claude or .claude-dev directory name
   * @private
   * @returns {string} Directory name based on environment
   */
  _getClaudeDir: function() {
    return this.isDevelopmentMode() ? '.claude-dev' : '.claude';
  },

  /**
   * Get the appropriate .mcp.json or .mcp-dev.json file name
   * @private
   * @returns {string} File name based on environment
   */
  _getMcpFileName: function() {
    return this.isDevelopmentMode() ? '.mcp-dev.json' : '.mcp.json';
  },

  /**
   * Get the appropriate .claude.json or .claude-dev.json file name
   * @private
   * @returns {string} File name based on environment
   */
  _getClaudeJsonFileName: function() {
    return this.isDevelopmentMode() ? '.claude-dev.json' : '.claude.json';
  },

  // User-level paths

  /**
   * Get user's Claude configuration file path
   * @returns {string} Path to ~/.claude.json or ~/.claude-dev.json
   */
  getUserClaudeJsonPath: function() {
    return expandHome(`~/${this._getClaudeJsonFileName()}`);
  },

  /**
   * Get user's base Claude directory
   * @returns {string} Path to ~/.claude or ~/.claude-dev
   */
  getUserClaudeDir: function() {
    return expandHome(`~/${this._getClaudeDir()}`);
  },

  /**
   * Get user's settings file path
   * @returns {string} Path to ~/.claude/settings.json or ~/.claude-dev/settings.json
   */
  getUserSettingsPath: function() {
    return path.join(this.getUserClaudeDir(), 'settings.json');
  },

  /**
   * Get user's agents directory
   * @returns {string} Path to ~/.claude/agents or ~/.claude-dev/agents
   */
  getUserAgentsDir: function() {
    return path.join(this.getUserClaudeDir(), 'agents');
  },

  /**
   * Get user's commands directory
   * @returns {string} Path to ~/.claude/commands or ~/.claude-dev/commands
   */
  getUserCommandsDir: function() {
    return path.join(this.getUserClaudeDir(), 'commands');
  },

  /**
   * Get user's skills directory
   * @returns {string} Path to ~/.claude/skills or ~/.claude-dev/skills
   */
  getUserSkillsDir: function() {
    return path.join(this.getUserClaudeDir(), 'skills');
  },

  // Project-level paths

  /**
   * Get project's base Claude directory
   * @param {string} projectPath - Full path to project
   * @returns {string} Path to {project}/.claude or {project}/.claude-dev
   */
  getProjectClaudeDir: function(projectPath) {
    return path.join(projectPath, this._getClaudeDir());
  },

  /**
   * Get project's settings file path
   * @param {string} projectPath - Full path to project
   * @returns {string} Path to {project}/.claude/settings.json or {project}/.claude-dev/settings.json
   */
  getProjectSettingsPath: function(projectPath) {
    return path.join(this.getProjectClaudeDir(projectPath), 'settings.json');
  },

  /**
   * Get project's local settings file path
   * @param {string} projectPath - Full path to project
   * @returns {string} Path to {project}/.claude/settings.local.json or {project}/.claude-dev/settings.local.json
   */
  getProjectLocalSettingsPath: function(projectPath) {
    return path.join(this.getProjectClaudeDir(projectPath), 'settings.local.json');
  },

  /**
   * Get project's agents directory
   * @param {string} projectPath - Full path to project
   * @returns {string} Path to {project}/.claude/agents or {project}/.claude-dev/agents
   */
  getProjectAgentsDir: function(projectPath) {
    return path.join(this.getProjectClaudeDir(projectPath), 'agents');
  },

  /**
   * Get project's commands directory
   * @param {string} projectPath - Full path to project
   * @returns {string} Path to {project}/.claude/commands or {project}/.claude-dev/commands
   */
  getProjectCommandsDir: function(projectPath) {
    return path.join(this.getProjectClaudeDir(projectPath), 'commands');
  },

  /**
   * Get project's skills directory
   * @param {string} projectPath - Full path to project
   * @returns {string} Path to {project}/.claude/skills or {project}/.claude-dev/skills
   */
  getProjectSkillsDir: function(projectPath) {
    return path.join(this.getProjectClaudeDir(projectPath), 'skills');
  },

  /**
   * Get project's MCP configuration file path
   * @param {string} projectPath - Full path to project
   * @returns {string} Path to {project}/.mcp.json or {project}/.mcp-dev.json
   */
  getProjectMcpPath: function(projectPath) {
    return path.join(projectPath, this._getMcpFileName());
  },

  /**
   * Utility function to expand home directory in paths
   * @param {string} filePath - Path that may contain ~
   * @returns {string} Expanded absolute path
   */
  expandHome
};

/**
 * Timeout Configuration
 * All timeout values in milliseconds
 */
const timeouts = {
  /**
   * Default timeout for API client requests
   * @type {number}
   */
  DEFAULT_API_TIMEOUT: 30000, // 30 seconds

  /**
   * Timeout for skill external reference checks
   * @type {number}
   */
  REFERENCE_CHECK_TIMEOUT: 5000, // 5 seconds

  /**
   * Default timeout for hook execution
   * @type {number}
   */
  DEFAULT_HOOK_TIMEOUT: 60000, // 60 seconds

  /**
   * Duration for UI notification display
   * @type {number}
   */
  NOTIFICATION_DURATION: 5000 // 5 seconds
};

/**
 * External URLs
 * Documentation links and external resources
 */
const urls = {
  /**
   * Official Claude Code hooks documentation
   * @type {string}
   */
  DOCS_HOOKS: 'https://docs.claude.com/en/docs/claude-code/hooks',

  /**
   * JSON Schema Store URL for Claude Code settings
   * @type {string}
   */
  SCHEMA_SETTINGS: 'https://json.schemastore.org/claude-code-settings.json',

  /**
   * GitHub issues URL for bug reports and feature requests
   * @type {string}
   */
  GITHUB_ISSUES: 'https://github.com/nitromike502/claude-code-web-manager/issues/new'
};

module.exports = {
  server,
  paths,
  timeouts,
  urls
};
