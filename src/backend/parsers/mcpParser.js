/**
 * MCP Server Parser
 * Parses MCP server configurations from .mcp.json and settings.json files
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

/**
 * Parse MCP servers from .mcp.json file
 * @param {string} filePath - Absolute path to .mcp.json
 * @returns {Promise<Array>} Array of MCP server objects
 */
async function parseMcpJson(filePath) {
  try {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return []; // File doesn't exist
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const mcpConfig = JSON.parse(content);

    // MCP servers can be in various formats, most commonly under mcpServers key
    const servers = mcpConfig.mcpServers || mcpConfig;

    if (typeof servers !== 'object' || servers === null) {
      return [];
    }

    const result = [];

    for (const [name, config] of Object.entries(servers)) {
      // Skip if config is not an object
      if (typeof config !== 'object' || config === null) continue;

      result.push({
        name: name,
        command: config.command || '',
        args: Array.isArray(config.args) ? config.args : [],
        env: config.env || {},
        enabled: config.enabled !== false, // Default to true
        transportType: detectTransportType(config),
        scope: 'project',
        filePath: filePath
      });
    }

    return result;
  } catch (error) {
    console.error(`Error parsing MCP config from ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Parse MCP servers from settings.json mcpServers section
 * @param {string} filePath - Absolute path to settings.json
 * @param {string} scope - 'project', 'project-local', or 'user'
 * @returns {Promise<Array>} Array of MCP server objects
 */
async function parseMcpFromSettings(filePath, scope) {
  try {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return []; // File doesn't exist
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const settings = JSON.parse(content);

    if (!settings.mcpServers || typeof settings.mcpServers !== 'object') {
      return []; // No mcpServers section
    }

    const result = [];

    for (const [name, config] of Object.entries(settings.mcpServers)) {
      // Skip if config is not an object
      if (typeof config !== 'object' || config === null) continue;

      result.push({
        name: name,
        command: config.command || '',
        args: Array.isArray(config.args) ? config.args : [],
        env: config.env || {},
        enabled: config.enabled !== false, // Default to true
        transportType: detectTransportType(config),
        scope: scope,
        filePath: filePath
      });
    }

    return result;
  } catch (error) {
    console.error(`Error parsing MCP servers from ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Detect transport type from MCP server config
 * @param {Object} config - MCP server configuration
 * @returns {string} Transport type (stdio, http, or sse)
 */
function detectTransportType(config) {
  // Check for explicit transport field
  if (config.transport) {
    return config.transport.toLowerCase();
  }

  // Infer from configuration
  if (config.url || config.endpoint) {
    return 'http';
  }

  if (config.command) {
    return 'stdio';
  }

  if (config.sse || config.eventSource) {
    return 'sse';
  }

  return 'stdio'; // Default
}

/**
 * Parse all MCP servers for a project
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Array>} Array of MCP server objects
 */
async function parseProjectMcpServers(projectPath) {
  const mcpJsonPath = config.paths.getProjectMcpPath(projectPath);
  const settingsPath = config.paths.getProjectSettingsPath(projectPath);
  const localSettingsPath = config.paths.getProjectLocalSettingsPath(projectPath);

  const [mcpServers, settingsServers, localServers] = await Promise.all([
    parseMcpJson(mcpJsonPath),
    parseMcpFromSettings(settingsPath, 'project'),
    parseMcpFromSettings(localSettingsPath, 'project-local')
  ]);

  return [...mcpServers, ...settingsServers, ...localServers];
}

/**
 * Parse user-level MCP servers
 * @param {string} userHomePath - Absolute path to user home directory
 * @returns {Promise<Array>} Array of MCP server objects
 */
async function parseUserMcpServers(userHomePath) {
  const settingsPath = config.paths.getUserSettingsPath();
  return parseMcpFromSettings(settingsPath, 'user');
}

/**
 * Get all MCP servers (project + user)
 * @param {string} projectPath - Absolute path to project root
 * @param {string} userHomePath - Absolute path to user home directory
 * @returns {Promise<Object>} Object with project and user MCP server arrays
 */
async function getAllMcpServers(projectPath, userHomePath) {
  const [projectServers, userServers] = await Promise.all([
    parseProjectMcpServers(projectPath),
    parseUserMcpServers(userHomePath)
  ]);

  return {
    project: projectServers,
    user: userServers
  };
}

/**
 * Filter MCP servers by enabled status
 * @param {Array} servers - Array of MCP server objects
 * @returns {Object} Object with enabled and disabled server arrays
 */
function filterMcpServersByStatus(servers) {
  return {
    enabled: servers.filter(s => s.enabled),
    disabled: servers.filter(s => !s.enabled)
  };
}

module.exports = {
  parseMcpJson,
  parseMcpFromSettings,
  parseProjectMcpServers,
  parseUserMcpServers,
  getAllMcpServers,
  filterMcpServersByStatus
};
