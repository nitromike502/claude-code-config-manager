/**
 * MCP Server Delete Service
 *
 * Handles deletion of MCP servers from various configuration files.
 *
 * MCP servers can be stored in multiple locations:
 * - Project level:
 *   - .mcp.json (project root) - mcpServers object
 *   - .claude/settings.json - mcpServers object
 *   - .claude/settings.local.json - mcpServers object
 * - User level:
 *   - ~/.claude/settings.json - mcpServers object
 *
 * This service checks all applicable locations and deletes the server
 * from the file where it's found.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Check for references to an MCP server in configuration files
 *
 * Searches for references in:
 * - Hooks configuration (command fields may reference MCP server)
 * - Tool permissions (format: mcp__servername__toolname or mcp__servername)
 *
 * @param {string} serverName - Name of MCP server to check
 * @param {string} configPath - Absolute path to settings.json or .claude.json
 * @returns {Promise<Array<string>>} Array of reference descriptions
 */
async function findMcpServerReferences(serverName, configPath) {
  const references = [];

  try {
    // Check if file exists
    await fs.access(configPath);

    // Read configuration file
    const content = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(content);

    // 1. Check hooks configuration
    if (config.hooks && typeof config.hooks === 'object') {
      for (const [event, matchers] of Object.entries(config.hooks)) {
        if (!Array.isArray(matchers)) continue;

        for (let matcherIdx = 0; matcherIdx < matchers.length; matcherIdx++) {
          const matcherEntry = matchers[matcherIdx];
          const hooks = matcherEntry.hooks || [];
          const matcher = matcherEntry.matcher || '*';

          for (let hookIdx = 0; hookIdx < hooks.length; hookIdx++) {
            const hook = hooks[hookIdx];
            const command = hook.command || '';

            // Check if command mentions the MCP server name
            // This is a simple heuristic - hooks might reference MCP servers in various ways
            if (command.toLowerCase().includes(serverName.toLowerCase())) {
              const matcherDisplay = matcher === '*' ? 'all matchers' : `matcher "${matcher}"`;
              references.push(
                `hooks.${event}[${matcherIdx}] (${matcherDisplay}, hook ${hookIdx}): Command may reference this server`
              );
            }
          }
        }
      }
    }

    // 2. Check tool permissions
    if (config.permissions && typeof config.permissions === 'object') {
      // Check both allow and deny arrays
      const permissionTypes = ['allow', 'deny', 'ask'];

      for (const permType of permissionTypes) {
        const permissions = config.permissions[permType];
        if (!Array.isArray(permissions)) continue;

        for (let i = 0; i < permissions.length; i++) {
          const permission = permissions[i];
          if (typeof permission !== 'string') continue;

          // Check for MCP server references
          // Format: mcp__servername__toolname or mcp__servername
          if (permission.startsWith(`mcp__${serverName}__`) || permission === `mcp__${serverName}`) {
            references.push(
              `permissions.${permType}[${i}]: "${permission}" references this server`
            );
          }
        }
      }
    }
  } catch (error) {
    // If file doesn't exist or can't be read, no references found
    if (error.code === 'ENOENT') {
      return references;
    }
    // For other errors (parse errors, permission errors), log but continue
    console.warn(`Warning: Could not check references in ${configPath}:`, error.message);
  }

  return references;
}

/**
 * Find all references to an MCP server across multiple configuration files
 *
 * @param {string} serverName - Name of MCP server to check
 * @param {Array<string>} configPaths - Array of absolute paths to check
 * @returns {Promise<Array<string>>} Array of reference descriptions
 */
async function findAllMcpServerReferences(serverName, configPaths) {
  const allReferences = [];

  // Check all config files in parallel
  const referenceLists = await Promise.all(
    configPaths.map(configPath => findMcpServerReferences(serverName, configPath))
  );

  // Flatten results
  for (const references of referenceLists) {
    allReferences.push(...references);
  }

  return allReferences;
}

/**
 * Delete an MCP server from a project
 *
 * Searches for the server in all project MCP configuration files:
 * 1. .mcp.json
 * 2. .claude/settings.json
 * 3. .claude/settings.local.json
 *
 * Deletes from the first file where it's found.
 * Also checks for references to the server in hooks and permissions (soft warning).
 *
 * @param {string} projectPath - Absolute path to project root
 * @param {string} serverName - Name of MCP server to delete
 * @returns {Promise<{success: boolean, message: string, filePath?: string, references?: Array<string>}>}
 * @throws {Error} If server not found in any location
 */
async function deleteProjectMcpServer(projectPath, serverName) {
  // Define all possible locations (in order of precedence)
  const locations = [
    path.join(projectPath, '.mcp.json'),
    path.join(projectPath, '.claude', 'settings.json'),
    path.join(projectPath, '.claude', 'settings.local.json')
  ];

  // Check for references in settings files
  const referenceCheckPaths = [
    path.join(projectPath, '.claude', 'settings.json'),
    path.join(projectPath, '.claude', 'settings.local.json')
  ];
  const references = await findAllMcpServerReferences(serverName, referenceCheckPaths);

  // Try each location
  for (const filePath of locations) {
    try {
      // Check if file exists
      await fs.access(filePath);

      // Read file
      const content = await fs.readFile(filePath, 'utf8');
      const config = JSON.parse(content);

      // Check if server exists in this file
      if (config.mcpServers && config.mcpServers[serverName]) {
        // Delete the server
        delete config.mcpServers[serverName];

        // Clean up empty mcpServers object
        if (Object.keys(config.mcpServers).length === 0) {
          delete config.mcpServers;
        }

        // Write back atomically (temp file + rename)
        const tempPath = `${filePath}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(config, null, 2), 'utf8');
        await fs.rename(tempPath, filePath);

        const result = {
          success: true,
          message: `MCP server "${serverName}" deleted successfully`,
          filePath: filePath
        };

        // Include references if any found (soft warning)
        if (references.length > 0) {
          result.references = references;
        }

        return result;
      }
    } catch (error) {
      // If file doesn't exist or can't be read, continue to next location
      if (error.code === 'ENOENT') {
        continue;
      }
      // Re-throw other errors (parse errors, permission errors, etc.)
      throw error;
    }
  }

  // Server not found in any location
  throw new Error(`MCP server not found: ${serverName}`);
}

/**
 * Delete an MCP server from user-level configuration
 *
 * Deletes from ~/.claude.json mcpServers object
 * Note: User-level MCP servers are stored in ~/.claude.json (root-level mcpServers key),
 * NOT in ~/.claude/settings.json (which stores permissions and hooks)
 *
 * Also checks for references to the server in user-level hooks and permissions (soft warning).
 *
 * @param {string} userHome - Absolute path to user home directory
 * @param {string} serverName - Name of MCP server to delete
 * @returns {Promise<{success: boolean, message: string, references?: Array<string>}>}
 * @throws {Error} If server not found or file doesn't exist
 */
async function deleteUserMcpServer(userHome, serverName) {
  const claudeJsonPath = path.join(userHome, '.claude.json');

  try {
    // Check if file exists
    await fs.access(claudeJsonPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`MCP server not found: ${serverName} (.claude.json does not exist)`);
    }
    throw error;
  }

  // Check for references in user settings
  const userSettingsPath = path.join(userHome, '.claude', 'settings.json');
  const references = await findAllMcpServerReferences(serverName, [userSettingsPath]);

  // Read .claude.json file
  const content = await fs.readFile(claudeJsonPath, 'utf8');
  const claudeConfig = JSON.parse(content);

  // Check if server exists
  if (!claudeConfig.mcpServers || !claudeConfig.mcpServers[serverName]) {
    throw new Error(`MCP server not found: ${serverName}`);
  }

  // Delete the server
  delete claudeConfig.mcpServers[serverName];

  // Clean up empty mcpServers object
  if (Object.keys(claudeConfig.mcpServers).length === 0) {
    delete claudeConfig.mcpServers;
  }

  // Write back atomically (temp file + rename)
  const tempPath = `${claudeJsonPath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(claudeConfig, null, 2), 'utf8');
  await fs.rename(tempPath, claudeJsonPath);

  const result = {
    success: true,
    message: `MCP server "${serverName}" deleted successfully`
  };

  // Include references if any found (soft warning)
  if (references.length > 0) {
    result.references = references;
  }

  return result;
}

module.exports = {
  deleteProjectMcpServer,
  deleteUserMcpServer
};
