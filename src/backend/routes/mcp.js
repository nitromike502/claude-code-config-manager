/**
 * MCP Server CRUD Routes
 * Handles update operations for MCP server configurations
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { validateMcpUpdate, VALID_TRANSPORT_TYPES } = require('../services/mcpValidation');
const { discoverProjects } = require('../services/projectDiscovery');

// Cache for projects (shared with projects.js routes)
let projectsCache = null;

/**
 * Helper: Resolve projectId to project path
 * @param {string} projectId - Project ID from URL parameter
 * @returns {Promise<string|null>} Project path or null if not found
 */
async function resolveProjectPath(projectId) {
  // Ensure projects are loaded
  if (!projectsCache) {
    const result = await discoverProjects();
    projectsCache = result;
  }

  // Find project path
  const projectData = projectsCache.projects[projectId];

  if (!projectData || !projectData.exists) {
    return null;
  }

  return projectData.path;
}

/**
 * Helper: Read .mcp.json file
 * @param {string} filePath - Path to .mcp.json file
 * @returns {Promise<Object>} MCP configuration object
 */
async function readMcpFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { mcpServers: {} };
    }
    throw error;
  }
}

/**
 * Helper: Write .mcp.json file atomically (temp file + rename)
 * @param {string} filePath - Path to .mcp.json file
 * @param {Object} config - MCP configuration object
 */
async function writeMcpFile(filePath, config) {
  const tempPath = `${filePath}.tmp`;
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(config, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}

/**
 * Helper: Read settings.json file
 * @param {string} filePath - Path to settings.json file
 * @returns {Promise<Object>} Settings configuration object
 */
async function readSettingsFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { mcpServers: {} };
    }
    throw error;
  }
}

/**
 * Helper: Write settings.json file atomically (temp file + rename)
 * @param {string} filePath - Path to settings.json file
 * @param {Object} settings - Settings configuration object
 */
async function writeSettingsFile(filePath, settings) {
  const tempPath = `${filePath}.tmp`;
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(settings, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}

/**
 * PUT /api/projects/:projectId/mcp/:serverName
 * Updates an MCP server configuration for a project
 */
router.put('/:projectId/mcp/:serverName', async (req, res) => {
  try {
    const { projectId, serverName } = req.params;
    const updates = req.body;

    // 1. URL-decode serverName
    const decodedName = decodeURIComponent(serverName);

    // 2. Resolve project path
    const projectPath = await resolveProjectPath(projectId);
    if (!projectPath) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // 3. Read .mcp.json
    const mcpPath = path.join(projectPath, '.mcp.json');
    const config = await readMcpFile(mcpPath);

    // 4. Find server
    if (!config.mcpServers || !config.mcpServers[decodedName]) {
      return res.status(404).json({ success: false, error: 'MCP server not found' });
    }

    const existingServer = config.mcpServers[decodedName];

    // 5. Validate updates
    const validation = validateMcpUpdate(updates, existingServer);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // 6. Handle name change
    let finalName = decodedName;
    if (updates.name && updates.name !== decodedName) {
      // Check if new name already exists
      if (config.mcpServers[updates.name]) {
        return res.status(409).json({
          success: false,
          error: 'Server name already exists'
        });
      }
      // Remove old key, will add with new name
      delete config.mcpServers[decodedName];
      finalName = updates.name;
    }

    // 7. Apply updates
    const updatedServer = { ...existingServer };
    const allowedFields = ['type', 'command', 'args', 'env', 'url', 'headers', 'enabled', 'timeout', 'retries'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updatedServer[field] = updates[field];
      }
    }

    // 8. Handle transport change - clear inapplicable fields
    if (updates.type && updates.type !== existingServer.type) {
      if (updates.type === 'stdio') {
        delete updatedServer.url;
        delete updatedServer.headers;
      } else { // http or sse
        delete updatedServer.command;
        delete updatedServer.args;
        delete updatedServer.env;
      }
    }

    // 9. Save
    config.mcpServers[finalName] = updatedServer;
    await writeMcpFile(mcpPath, config);

    // 10. Return success
    res.json({
      success: true,
      server: { name: finalName, ...updatedServer }
    });

  } catch (error) {
    console.error('Error updating MCP server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update MCP server',
      details: error.message
    });
  }
});

// User-level routes
const userRouter = express.Router();

/**
 * PUT /api/user/mcp/:serverName
 * Updates an MCP server configuration at user level
 * Note: User-level MCP servers are stored in ~/.claude.json (root-level mcpServers key),
 * NOT in ~/.claude/settings.json (which stores permissions and hooks)
 */
userRouter.put('/mcp/:serverName', async (req, res) => {
  try {
    const { serverName } = req.params;
    const updates = req.body;

    // 1. URL-decode serverName
    const decodedName = decodeURIComponent(serverName);

    // 2. User config path - MCP servers are in ~/.claude.json, not settings.json
    const homeDir = os.homedir();
    const claudeJsonPath = path.join(homeDir, '.claude.json');

    // 3. Read claude.json file
    const settings = await readSettingsFile(claudeJsonPath);

    // 4. Initialize mcpServers if not present
    if (!settings.mcpServers) {
      settings.mcpServers = {};
    }

    // 5. Find server
    if (!settings.mcpServers[decodedName]) {
      return res.status(404).json({ success: false, error: 'MCP server not found' });
    }

    const existingServer = settings.mcpServers[decodedName];

    // 6. Validate updates
    const validation = validateMcpUpdate(updates, existingServer);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // 7. Handle name change
    let finalName = decodedName;
    if (updates.name && updates.name !== decodedName) {
      // Check if new name already exists
      if (settings.mcpServers[updates.name]) {
        return res.status(409).json({
          success: false,
          error: 'Server name already exists'
        });
      }
      // Remove old key, will add with new name
      delete settings.mcpServers[decodedName];
      finalName = updates.name;
    }

    // 8. Apply updates
    const updatedServer = { ...existingServer };
    const allowedFields = ['type', 'command', 'args', 'env', 'url', 'headers', 'enabled', 'timeout', 'retries'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updatedServer[field] = updates[field];
      }
    }

    // 9. Handle transport change - clear inapplicable fields
    if (updates.type && updates.type !== existingServer.type) {
      if (updates.type === 'stdio') {
        delete updatedServer.url;
        delete updatedServer.headers;
      } else { // http or sse
        delete updatedServer.command;
        delete updatedServer.args;
        delete updatedServer.env;
      }
    }

    // 10. Save
    settings.mcpServers[finalName] = updatedServer;
    await writeSettingsFile(claudeJsonPath, settings);

    // 11. Return success
    res.json({
      success: true,
      server: { name: finalName, ...updatedServer }
    });

  } catch (error) {
    console.error('Error updating user MCP server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update MCP server',
      details: error.message
    });
  }
});

module.exports = { projectRouter: router, userRouter };
