const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const {
  discoverProjects,
  getProjectAgents,
  getProjectCommands,
  getProjectHooks,
  getProjectMCP,
  getProjectSkills,
  getProjectCounts
} = require('../services/projectDiscovery');
const { projectIdToPath } = require('../utils/pathUtils');
const { updateYamlFrontmatter, updateFile } = require('../services/updateService');
const { deleteFile } = require('../services/deleteService');
const { findReferences } = require('../services/referenceChecker');
const { parseSubagent } = require('../parsers/subagentParser');
const { parseSkill } = require('../parsers/skillParser');

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

  // Check if wildcard starts with a valid resource name
  // Valid patterns: agents, agents/:name, commands, commands/:name, hooks, mcp, skills, skills/:name
  // Invalid patterns: with/slashes/agents (path traversal attempt)
  const validResourcePrefixes = ['agents', 'commands', 'hooks', 'mcp', 'skills'];
  const wildcardFirstSegment = wildcard.split('/')[0];

  if (wildcard && !validResourcePrefixes.includes(wildcardFirstSegment)) {
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

/**
 * GET /api/projects/:projectId/skills
 * Returns skills for a specific project
 */
router.get('/:projectId/skills', validateProjectId, async (req, res) => {
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

    const result = await getProjectSkills(projectData.path);

    res.json({
      success: true,
      skills: result.skills,
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
 * PUT /api/projects/:projectId/skills/:skillName
 * Update a skill's properties
 *
 * Request body can include:
 * - name: string (new name - NOTE: directory rename not supported in this story)
 * - description: string (required field, min 10 chars)
 * - allowedTools: string[] | string (maps to 'allowed-tools' in frontmatter)
 * - content: string (body content of SKILL.md)
 *
 * Note: Supporting files in skill directory are READ-ONLY and not modified
 */
router.put('/:projectId/skills/:skillName', validateProjectId, validateSkillName, async (req, res) => {
  try {
    const { projectId, skillName } = req.params;
    const updates = req.body;

    // Get project path
    const { path: projectPath, error: projectError } = await getProjectPath(projectId);
    if (projectError) {
      return res.status(404).json({ success: false, error: projectError });
    }

    // Construct SKILL.md file path
    const skillDirPath = path.join(projectPath, '.claude', 'skills', skillName);
    const skillFilePath = path.join(skillDirPath, 'SKILL.md');

    // Check if SKILL.md exists
    try {
      await fs.access(skillFilePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: `Skill not found: ${skillName}`
      });
    }

    // Validate updates
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: 'Request body must be a JSON object with skill properties'
      });
    }

    // Check if request body is empty
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: 'Request body must contain at least one property to update'
      });
    }

    // Validate name if being updated
    if (updates.name !== undefined && updates.name !== skillName) {
      if (!isValidSkillName(updates.name)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid skill name format',
          details: 'Skill name must be lowercase letters, numbers, hyphens, or underscores (max 64 chars)'
        });
      }
      // NOTE: Directory rename is out of scope for this story
      return res.status(400).json({
        success: false,
        error: 'Skill directory rename not supported',
        details: 'Renaming skill directories is not yet implemented. Please use the name field only to update the frontmatter.'
      });
    }

    // Validate description if provided
    if (updates.description !== undefined) {
      if (typeof updates.description !== 'string' || updates.description.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Invalid description',
          details: 'Description must be at least 10 characters'
        });
      }
    }

    // Validate allowedTools if provided (accepts array or comma-separated string)
    if (updates.allowedTools !== undefined) {
      if (typeof updates.allowedTools === 'string') {
        // Convert comma-separated string to array
        updates.allowedTools = updates.allowedTools.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (!Array.isArray(updates.allowedTools)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid allowedTools',
          details: 'allowedTools must be an array of strings or comma-separated string'
        });
      }
    }

    // Map frontend field names to frontmatter field names
    const frontmatterUpdates = {};

    if (updates.name !== undefined) frontmatterUpdates.name = updates.name;
    if (updates.description !== undefined) frontmatterUpdates.description = updates.description;

    // Handle allowedTools (maps to 'allowed-tools' in frontmatter)
    if (updates.allowedTools !== undefined) {
      frontmatterUpdates['allowed-tools'] = updates.allowedTools;
    }

    // Handle content update separately (it's the body content, not frontmatter)
    let contentUpdate = null;
    if (updates.content !== undefined) {
      if (typeof updates.content !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid content',
          details: 'Content must be a string'
        });
      }
      contentUpdate = updates.content;
    }

    // If content is being updated, handle it specially
    if (contentUpdate !== null) {
      // Read the current file
      const fileContent = await fs.readFile(skillFilePath, 'utf8');
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = fileContent.match(frontmatterRegex);

      if (match) {
        const yaml = require('js-yaml');
        let frontmatter = yaml.load(match[1]) || {};

        // Merge frontmatter updates
        frontmatter = { ...frontmatter, ...frontmatterUpdates };

        // Remove undefined/null values
        Object.keys(frontmatter).forEach(key => {
          if (frontmatter[key] === undefined) delete frontmatter[key];
        });

        // Strip frontmatter from content if it contains it
        let cleanContent = contentUpdate;
        const contentMatch = contentUpdate.match(frontmatterRegex);
        if (contentMatch) {
          // Content contains frontmatter, extract only the body
          cleanContent = contentMatch[2];
        }

        // Normalize: trim leading newlines, then add blank line separator
        cleanContent = '\n\n' + cleanContent.replace(/^\n+/, '');

        // Serialize and write
        const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
        const newContent = `---\n${yamlStr}---${cleanContent}`;

        await updateFile(skillFilePath, newContent);
      }
    } else {
      // Only frontmatter updates
      if (Object.keys(frontmatterUpdates).length > 0) {
        await updateYamlFrontmatter(skillFilePath, frontmatterUpdates);
      }
    }

    // Re-read the updated skill to return (with external reference detection)
    const updatedSkill = await parseSkill(skillDirPath, 'project');

    // Create warnings array if external references exist
    const warnings = [];
    if (updatedSkill.externalReferences && updatedSkill.externalReferences.length > 0) {
      warnings.push(`Skill contains ${updatedSkill.externalReferences.length} external reference(s) that may affect portability`);
    }

    res.json({
      success: true,
      message: 'Skill updated successfully',
      skill: updatedSkill,
      warnings: warnings.length > 0 ? warnings : undefined
    });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate agent name format
 * Must be lowercase letters, numbers, hyphens, underscores, max 64 chars
 * @param {string} name - Agent name to validate
 * @returns {boolean} True if valid
 */
function isValidAgentName(name) {
  if (!name || typeof name !== 'string') return false;
  return /^[a-z0-9_-]{1,64}$/.test(name);
}

/**
 * Validate agent name parameter middleware
 */
function validateAgentName(req, res, next) {
  const { agentName } = req.params;

  if (!agentName || !isValidAgentName(agentName)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid agent name format',
      details: 'Agent name must be lowercase letters, numbers, hyphens, or underscores (max 64 chars)'
    });
  }

  next();
}

/**
 * Validate skill name format
 * Must be lowercase letters, numbers, hyphens, underscores, max 64 chars
 * @param {string} name - Skill name to validate
 * @returns {boolean} True if valid
 */
function isValidSkillName(name) {
  if (!name || typeof name !== 'string') return false;
  return /^[a-z0-9_-]{1,64}$/.test(name);
}

/**
 * Validate skill name parameter middleware
 */
function validateSkillName(req, res, next) {
  const { skillName } = req.params;

  if (!skillName || !isValidSkillName(skillName)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid skill name format',
      details: 'Skill name must be lowercase letters, numbers, hyphens, or underscores (max 64 chars)'
    });
  }

  next();
}

/**
 * Helper to get project path from projectId
 * @param {string} projectId - Project identifier
 * @returns {Promise<{path: string, error: string|null}>} Project path or error
 */
async function getProjectPath(projectId) {
  // Ensure projects are loaded
  if (!projectsCache) {
    const result = await discoverProjects();
    projectsCache = result;
  }

  const projectData = projectsCache.projects[projectId];

  if (!projectData) {
    return { path: null, error: `Project not found: ${projectId}` };
  }

  if (!projectData.exists) {
    return { path: null, error: `Project directory does not exist: ${projectData.path}` };
  }

  return { path: projectData.path, error: null };
}

/**
 * PUT /api/projects/:projectId/agents/:agentName
 * Update a subagent's properties
 *
 * Request body can include:
 * - name: string (new name, triggers rename)
 * - description: string
 * - tools: string[] | string
 * - model: 'sonnet' | 'opus' | 'haiku' | 'inherit'
 * - color: string (one of the valid colors)
 * - permissionMode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'ignore'
 * - skills: string[] | string
 * - systemPrompt: string (body content)
 */
router.put('/:projectId/agents/:agentName', validateProjectId, validateAgentName, async (req, res) => {
  try {
    const { projectId, agentName } = req.params;
    const updates = req.body;

    // Get project path
    const { path: projectPath, error: projectError } = await getProjectPath(projectId);
    if (projectError) {
      return res.status(404).json({ success: false, error: projectError });
    }

    // Construct agent file path
    const agentFilePath = path.join(projectPath, '.claude', 'agents', `${agentName}.md`);

    // Check if agent file exists
    try {
      await fs.access(agentFilePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentName}`
      });
    }

    // Validate updates
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: 'Request body must be a JSON object with agent properties'
      });
    }

    // Check if request body is empty
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: 'Request body must contain at least one property to update'
      });
    }

    // Validate name if being updated
    if (updates.name !== undefined && updates.name !== agentName) {
      if (!isValidAgentName(updates.name)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid agent name format',
          details: 'Agent name must be lowercase letters, numbers, hyphens, or underscores (max 64 chars)'
        });
      }
    }

    // Validate description if provided
    if (updates.description !== undefined) {
      if (typeof updates.description !== 'string' || updates.description.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Invalid description',
          details: 'Description must be at least 10 characters'
        });
      }
    }

    // Validate model if provided
    const validModels = ['sonnet', 'opus', 'haiku', 'inherit'];
    if (updates.model !== undefined && !validModels.includes(updates.model)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid model',
        details: `Model must be one of: ${validModels.join(', ')}`
      });
    }

    // Validate color if provided
    const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'yellow', 'pink', 'indigo', 'teal'];
    if (updates.color !== undefined && updates.color !== null && !validColors.includes(updates.color)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid color',
        details: `Color must be one of: ${validColors.join(', ')}`
      });
    }

    // Validate permissionMode if provided
    const validPermissionModes = ['default', 'acceptEdits', 'bypassPermissions', 'plan', 'ignore'];
    if (updates.permissionMode !== undefined && !validPermissionModes.includes(updates.permissionMode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid permissionMode',
        details: `permissionMode must be one of: ${validPermissionModes.join(', ')}`
      });
    }

    // Handle systemPrompt update separately (it's the body content, not frontmatter)
    let systemPromptUpdate = null;
    if (updates.systemPrompt !== undefined) {
      if (typeof updates.systemPrompt !== 'string' || updates.systemPrompt.trim().length < 20) {
        return res.status(400).json({
          success: false,
          error: 'Invalid systemPrompt',
          details: 'System prompt must be at least 20 characters'
        });
      }
      systemPromptUpdate = updates.systemPrompt;
      delete updates.systemPrompt; // Remove from frontmatter updates
    }

    // If systemPrompt is being updated, we need to handle it specially
    if (systemPromptUpdate !== null) {
      // Read the current file
      const content = await fs.readFile(agentFilePath, 'utf8');
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = content.match(frontmatterRegex);

      if (match) {
        const yaml = require('js-yaml');
        let frontmatter = yaml.load(match[1]) || {};

        // Merge frontmatter updates
        frontmatter = { ...frontmatter, ...updates };

        // Remove undefined/null values
        Object.keys(frontmatter).forEach(key => {
          if (frontmatter[key] === undefined) delete frontmatter[key];
        });

        // Strip frontmatter from systemPrompt if it contains it
        // This can happen if the UI accidentally sends the full file content
        let cleanSystemPrompt = systemPromptUpdate;
        const systemPromptMatch = systemPromptUpdate.match(frontmatterRegex);
        if (systemPromptMatch) {
          // systemPrompt contains frontmatter, extract only the body
          cleanSystemPrompt = systemPromptMatch[2];
        }

        // Normalize: trim leading newlines, then add blank line separator
        // Result: ---\n\nBody (blank line between frontmatter and content)
        cleanSystemPrompt = '\n\n' + cleanSystemPrompt.replace(/^\n+/, '');

        // Serialize and write
        const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
        const newContent = `---\n${yamlStr}---${cleanSystemPrompt}`;

        await updateFile(agentFilePath, newContent);
      }
    } else {
      // Only frontmatter updates
      if (Object.keys(updates).length > 0) {
        await updateYamlFrontmatter(agentFilePath, updates);
      }
    }

    // Handle rename if name changed
    if (updates.name && updates.name !== agentName) {
      const newFilePath = path.join(projectPath, '.claude', 'agents', `${updates.name}.md`);

      // Check if new name already exists
      try {
        await fs.access(newFilePath);
        return res.status(409).json({
          success: false,
          error: 'Agent name conflict',
          details: `An agent named "${updates.name}" already exists`
        });
      } catch {
        // Good - new name doesn't exist
      }

      await fs.rename(agentFilePath, newFilePath);
    }

    // Re-read the updated agent to return
    const finalPath = updates.name && updates.name !== agentName
      ? path.join(projectPath, '.claude', 'agents', `${updates.name}.md`)
      : agentFilePath;

    const updatedAgent = await parseSubagent(finalPath, 'project');

    res.json({
      success: true,
      message: 'Agent updated successfully',
      agent: updatedAgent
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/projects/:projectId/agents/:agentName
 * Delete a subagent
 */
router.delete('/:projectId/agents/:agentName', validateProjectId, validateAgentName, async (req, res) => {
  try {
    const { projectId, agentName } = req.params;

    // Get project path
    const { path: projectPath, error: projectError } = await getProjectPath(projectId);
    if (projectError) {
      return res.status(404).json({ success: false, error: projectError });
    }

    // Construct agent file path
    const agentFilePath = path.join(projectPath, '.claude', 'agents', `${agentName}.md`);

    // Delete the file
    await deleteFile(agentFilePath);

    res.json({
      success: true,
      message: `Agent "${agentName}" deleted successfully`,
      deleted: agentFilePath
    });
  } catch (error) {
    // Handle file not found specifically
    if (error.message.includes('File not found')) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${req.params.agentName}`
      });
    }

    console.error('Error deleting agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/projects/:projectId/agents/:agentName/references
 * Check for references to an agent in other configurations
 */
router.get('/:projectId/agents/:agentName/references', validateProjectId, validateAgentName, async (req, res) => {
  try {
    const { projectId, agentName } = req.params;

    // Get project path
    const { path: projectPath, error: projectError } = await getProjectPath(projectId);
    if (projectError) {
      return res.status(404).json({ success: false, error: projectError });
    }

    // Find references using the referenceChecker service
    const references = await findReferences('agent', agentName, projectPath);

    res.json({
      success: true,
      agentName,
      references,
      hasReferences: references.length > 0,
      referenceCount: references.length
    });
  } catch (error) {
    console.error('Error checking agent references:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate command path format
 * Must end with .md, no path traversal, no absolute paths
 * @param {string} commandPath - Command path to validate (may include nested directories)
 * @returns {boolean} True if valid
 */
function isValidCommandPath(commandPath) {
  if (!commandPath || typeof commandPath !== 'string') return false;

  // Must end with .md
  if (!commandPath.endsWith('.md')) return false;

  // No path traversal
  if (commandPath.includes('..') || commandPath.startsWith('/')) return false;

  // No backslashes (Windows path separators)
  if (commandPath.includes('\\')) return false;

  return true;
}

/**
 * Validate command path parameter middleware
 */
function validateCommandPath(req, res, next) {
  const { commandPath } = req.params;

  // Express automatically URL-decodes route parameters, so no need to decode again
  // The route pattern :commandPath(.*) captures the full path including nested slashes

  if (!commandPath || !isValidCommandPath(commandPath)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid command path format',
      details: 'Command path must end with .md and not contain path traversal sequences'
    });
  }

  // Store decoded path for handlers to use
  req.decodedCommandPath = commandPath;

  next();
}

/**
 * PUT /api/projects/:projectId/commands/:commandPath(.*)
 * Update a command's properties
 *
 * Request body can include:
 * - name: string (new path/name, triggers rename)
 * - description: string (optional)
 * - allowedTools: string[] | string (maps to 'allowed-tools' in frontmatter)
 * - model: 'sonnet' | 'opus' | 'haiku' | 'inherit'
 * - color: string (one of the valid colors)
 * - argumentHint: string (maps to 'argument-hint')
 * - disableModelInvocation: boolean (maps to 'disable-model-invocation')
 * - content: string (body content)
 */
router.put('/:projectId/commands/:commandPath(.*)', validateProjectId, validateCommandPath, async (req, res) => {
  try {
    const { projectId } = req.params;
    const commandPath = req.decodedCommandPath; // Use decoded path from middleware
    const updates = req.body;

    // Get project path
    const { path: projectPath, error: projectError } = await getProjectPath(projectId);
    if (projectError) {
      return res.status(404).json({ success: false, error: projectError });
    }

    // Construct command file path
    const commandFilePath = path.join(projectPath, '.claude', 'commands', commandPath);

    // Check if command file exists
    try {
      await fs.access(commandFilePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: `Command not found: ${commandPath}`
      });
    }

    // Validate updates
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: 'Request body must be a JSON object with command properties'
      });
    }

    // Check if request body is empty
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: 'Request body must contain at least one property to update'
      });
    }

    // Validate name (new path) if being updated
    if (updates.name !== undefined && updates.name !== commandPath) {
      if (!isValidCommandPath(updates.name)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid command path format',
          details: 'Command path must end with .md and not contain path traversal sequences'
        });
      }
    }

    // Validate description if provided (optional for commands, unlike agents)
    if (updates.description !== undefined) {
      if (typeof updates.description !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid description',
          details: 'Description must be a string'
        });
      }
    }

    // Validate model if provided
    const validModels = ['sonnet', 'opus', 'haiku', 'inherit'];
    if (updates.model !== undefined && !validModels.includes(updates.model)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid model',
        details: `Model must be one of: ${validModels.join(', ')}`
      });
    }

    // Validate color if provided
    const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'yellow', 'pink', 'indigo', 'teal'];
    if (updates.color !== undefined && updates.color !== null && !validColors.includes(updates.color)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid color',
        details: `Color must be one of: ${validColors.join(', ')}`
      });
    }

    // Validate argumentHint if provided
    if (updates.argumentHint !== undefined && typeof updates.argumentHint !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid argumentHint',
        details: 'argumentHint must be a string'
      });
    }

    // Validate disableModelInvocation if provided
    if (updates.disableModelInvocation !== undefined && typeof updates.disableModelInvocation !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid disableModelInvocation',
        details: 'disableModelInvocation must be a boolean'
      });
    }

    // Map frontend field names to frontmatter field names
    const frontmatterUpdates = {};

    if (updates.name !== undefined) frontmatterUpdates.name = path.basename(updates.name, '.md');
    if (updates.description !== undefined) frontmatterUpdates.description = updates.description;
    if (updates.model !== undefined) frontmatterUpdates.model = updates.model;
    if (updates.color !== undefined) frontmatterUpdates.color = updates.color;
    if (updates.argumentHint !== undefined) frontmatterUpdates['argument-hint'] = updates.argumentHint;
    if (updates.disableModelInvocation !== undefined) frontmatterUpdates['disable-model-invocation'] = updates.disableModelInvocation;

    // Handle allowedTools (maps to 'allowed-tools' in frontmatter)
    if (updates.allowedTools !== undefined) {
      frontmatterUpdates['allowed-tools'] = updates.allowedTools;
    }

    // Handle content update separately (it's the body content, not frontmatter)
    let contentUpdate = null;
    if (updates.content !== undefined) {
      if (typeof updates.content !== 'string' || updates.content.trim().length < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid content',
          details: 'Content must be a non-empty string'
        });
      }
      contentUpdate = updates.content;
    }

    // If content is being updated, handle it specially
    if (contentUpdate !== null) {
      // Read the current file
      const fileContent = await fs.readFile(commandFilePath, 'utf8');
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = fileContent.match(frontmatterRegex);

      if (match) {
        const yaml = require('js-yaml');
        let frontmatter = yaml.load(match[1]) || {};

        // Merge frontmatter updates
        frontmatter = { ...frontmatter, ...frontmatterUpdates };

        // Remove undefined/null values
        Object.keys(frontmatter).forEach(key => {
          if (frontmatter[key] === undefined) delete frontmatter[key];
        });

        // Strip frontmatter from content if it contains it
        let cleanContent = contentUpdate;
        const contentMatch = contentUpdate.match(frontmatterRegex);
        if (contentMatch) {
          // Content contains frontmatter, extract only the body
          cleanContent = contentMatch[2];
        }

        // Normalize: trim leading newlines, then add blank line separator
        cleanContent = '\n\n' + cleanContent.replace(/^\n+/, '');

        // Serialize and write
        const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
        const newContent = `---\n${yamlStr}---${cleanContent}`;

        await updateFile(commandFilePath, newContent);
      }
    } else {
      // Only frontmatter updates
      if (Object.keys(frontmatterUpdates).length > 0) {
        await updateYamlFrontmatter(commandFilePath, frontmatterUpdates);
      }
    }

    // Handle rename if name changed
    if (updates.name && updates.name !== commandPath) {
      const newFilePath = path.join(projectPath, '.claude', 'commands', updates.name);
      const newDir = path.dirname(newFilePath);

      // Create directory if it doesn't exist (for nested paths)
      await fs.mkdir(newDir, { recursive: true });

      // Check if new name already exists
      try {
        await fs.access(newFilePath);
        return res.status(409).json({
          success: false,
          error: 'Command name conflict',
          details: `A command named "${updates.name}" already exists`
        });
      } catch {
        // Good - new name doesn't exist
      }

      await fs.rename(commandFilePath, newFilePath);
    }

    // Re-read the updated command to return
    const finalPath = updates.name && updates.name !== commandPath
      ? path.join(projectPath, '.claude', 'commands', updates.name)
      : commandFilePath;

    const { parseCommand } = require('../parsers/commandParser');
    const baseDir = path.join(projectPath, '.claude', 'commands');
    const updatedCommand = await parseCommand(finalPath, baseDir, 'project');

    res.json({
      success: true,
      message: 'Command updated successfully',
      command: updatedCommand
    });
  } catch (error) {
    console.error('Error updating command:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/projects/:projectId/commands/:commandPath(.*)
 * Delete a command
 */
router.delete('/:projectId/commands/:commandPath(.*)', validateProjectId, validateCommandPath, async (req, res) => {
  try {
    const { projectId } = req.params;
    const commandPath = req.decodedCommandPath; // Use decoded path from middleware

    // Get project path
    const { path: projectPath, error: projectError } = await getProjectPath(projectId);
    if (projectError) {
      return res.status(404).json({ success: false, error: projectError });
    }

    // Construct command file path
    const commandFilePath = path.join(projectPath, '.claude', 'commands', commandPath);

    // Delete the file
    await deleteFile(commandFilePath);

    res.json({
      success: true,
      message: `Command "${commandPath}" deleted successfully`,
      deleted: commandFilePath
    });
  } catch (error) {
    // Handle file not found specifically
    if (error.message.includes('File not found')) {
      return res.status(404).json({
        success: false,
        error: `Command not found: ${req.decodedCommandPath}`
      });
    }

    console.error('Error deleting command:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/projects/:projectId/commands/:commandPath(.*)/references
 * Check for references to a command in other configurations
 */
router.get('/:projectId/commands/:commandPath(.*)/references', validateProjectId, validateCommandPath, async (req, res) => {
  try {
    const { projectId } = req.params;
    const commandPath = req.decodedCommandPath; // Use decoded path from middleware

    // Get project path
    const { path: projectPath, error: projectError } = await getProjectPath(projectId);
    if (projectError) {
      return res.status(404).json({ success: false, error: projectError });
    }

    // Extract command name (without .md extension) for reference checking
    const commandName = path.basename(commandPath, '.md');

    // Find references using the referenceChecker service
    const references = await findReferences('command', commandName, projectPath);

    res.json({
      success: true,
      commandPath,
      commandName,
      references,
      hasReferences: references.length > 0,
      referenceCount: references.length
    });
  } catch (error) {
    console.error('Error checking command references:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
