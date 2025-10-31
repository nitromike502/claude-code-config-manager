const express = require('express');
const router = express.Router();
const {
  discoverProjects,
  getProjectAgents,
  getProjectCommands,
  getProjectHooks,
  getProjectMCP,
  getProjectCounts
} = require('../services/projectDiscovery');
const { projectIdToPath } = require('../utils/pathUtils');

// Cache for projects (refreshed on scan)
let projectsCache = null;

/**
 * Security middleware: Validate projectId parameter format
 * Prevents invalid characters and oversized parameters
 *
 * @see Security Review (October 29, 2025) - HIGH-005
 */
function validateProjectId(req, res, next) {
  const { projectId } = req.params;

  // Format validation: alphanumeric, dash, underscore only
  const validFormat = /^[a-zA-Z0-9_-]+$/;

  if (!projectId || !validFormat.test(projectId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID format',
      details: 'Project ID must contain only alphanumeric characters, dashes, and underscores'
    });
  }

  // Length limit (prevent DoS)
  if (projectId.length > 255) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID format',
      details: 'Project ID must be less than 255 characters'
    });
  }

  next();
}

// Apply validation middleware to all projectId routes (even non-matching ones)
// This catches both specific routes and malformed path requests
router.use('/:projectId/*', (req, res, next) => {
  const { projectId } = req.params;
  const wildcard = req.params[0] || '';

  // Check for path traversal in the projectId itself (encoded paths like %2F)
  if (projectId && (projectId.includes('/') || projectId.includes('\\') || projectId.includes('%'))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID format',
      details: 'Project ID must not contain path separators or URL-encoded characters'
    });
  }

  // Check for extra unmatched path segments (e.g., /project/with/slashes/agents)
  // The wildcard should be a simple resource name (agents, commands, hooks, mcp) without additional slashes
  if (wildcard && wildcard.includes('/')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID format',
      details: 'Project ID must not contain path traversal sequences'
    });
  }

  validateProjectId(req, res, next);
});

/**
 * GET /api/projects
 * Returns list of all Claude Code projects
 */
router.get('/', async (req, res) => {
  try {
    // Use cached projects if available
    if (!projectsCache) {
      const result = await discoverProjects();
      projectsCache = result;
    }

    // Add counts to each project and convert to array
    const projectsArray = [];

    for (const [projectId, projectData] of Object.entries(projectsCache.projects)) {
      if (projectData.exists) {
        const counts = await getProjectCounts(projectData.path);
        projectsArray.push({
          ...projectData,
          stats: counts  // Frontend expects 'stats' not 'counts'
        });
      } else {
        projectsArray.push({
          ...projectData,
          stats: { agents: 0, commands: 0, hooks: 0, mcp: 0 }
        });
      }
    }

    res.json({
      success: true,
      projects: projectsArray,
      error: projectsCache.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scan
 * Triggers a rescan of all projects (clears cache)
 */
router.post('/scan', async (req, res) => {
  try {
    // Clear cache and rescan
    projectsCache = null;
    const result = await discoverProjects();
    projectsCache = result;

    res.json({
      success: true,
      projectCount: Object.keys(result.projects).length,
      error: result.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/projects/:projectId/agents
 * Returns subagents for a specific project
 */
router.get('/:projectId/agents', validateProjectId, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Ensure projects are loaded
    if (!projectsCache) {
      const result = await discoverProjects();
      projectsCache = result;
    }

    // Find project path
    const projectData = projectsCache.projects[projectId];

    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: `Project not found: ${projectId}`
      });
    }

    if (!projectData.exists) {
      return res.status(404).json({
        success: false,
        error: `Project directory does not exist: ${projectData.path}`
      });
    }

    const result = await getProjectAgents(projectData.path);

    res.json({
      success: true,
      agents: result.agents,
      warnings: result.warnings,
      projectId,
      projectPath: projectData.path
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/projects/:projectId/commands
 * Returns slash commands for a specific project
 */
router.get('/:projectId/commands', validateProjectId, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Ensure projects are loaded
    if (!projectsCache) {
      const result = await discoverProjects();
      projectsCache = result;
    }

    // Find project path
    const projectData = projectsCache.projects[projectId];

    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: `Project not found: ${projectId}`
      });
    }

    if (!projectData.exists) {
      return res.status(404).json({
        success: false,
        error: `Project directory does not exist: ${projectData.path}`
      });
    }

    const result = await getProjectCommands(projectData.path);

    res.json({
      success: true,
      commands: result.commands,
      warnings: result.warnings,
      projectId,
      projectPath: projectData.path
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/projects/:projectId/hooks
 * Returns hooks for a specific project
 */
router.get('/:projectId/hooks', validateProjectId, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Ensure projects are loaded
    if (!projectsCache) {
      const result = await discoverProjects();
      projectsCache = result;
    }

    // Find project path
    const projectData = projectsCache.projects[projectId];

    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: `Project not found: ${projectId}`
      });
    }

    if (!projectData.exists) {
      return res.status(404).json({
        success: false,
        error: `Project directory does not exist: ${projectData.path}`
      });
    }

    const result = await getProjectHooks(projectData.path);

    res.json({
      success: true,
      hooks: result.hooks,
      warnings: result.warnings,
      projectId,
      projectPath: projectData.path
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/projects/:projectId/mcp
 * Returns MCP servers for a specific project
 */
router.get('/:projectId/mcp', validateProjectId, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Ensure projects are loaded
    if (!projectsCache) {
      const result = await discoverProjects();
      projectsCache = result;
    }

    // Find project path
    const projectData = projectsCache.projects[projectId];

    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: `Project not found: ${projectId}`
      });
    }

    if (!projectData.exists) {
      return res.status(404).json({
        success: false,
        error: `Project directory does not exist: ${projectData.path}`
      });
    }

    const result = await getProjectMCP(projectData.path);

    res.json({
      success: true,
      mcp: result.mcp,
      warnings: result.warnings,
      projectId,
      projectPath: projectData.path
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
