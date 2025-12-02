const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const {
  getUserAgents,
  getUserCommands,
  getUserHooks,
  getUserMCP,
  getUserSkills
} = require('../services/projectDiscovery');
const { updateYamlFrontmatter, updateFile } = require('../services/updateService');
const { deleteFile } = require('../services/deleteService');
const { findReferences } = require('../services/referenceChecker');
const { parseSubagent } = require('../parsers/subagentParser');

/**
 * Get user home directory path
 * @returns {string} User home directory
 */
function getUserHome() {
  return os.homedir();
}

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
 * GET /api/user/agents
 * Returns user-level subagents from ~/.claude/agents/
 */
router.get('/agents', async (req, res) => {
  try {
    const result = await getUserAgents();

    res.json({
      success: true,
      agents: result.agents,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/commands
 * Returns user-level slash commands from ~/.claude/commands/
 */
router.get('/commands', async (req, res) => {
  try {
    const result = await getUserCommands();

    res.json({
      success: true,
      commands: result.commands,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/hooks
 * Returns user-level hooks from ~/.claude/settings.json
 */
router.get('/hooks', async (req, res) => {
  try {
    const result = await getUserHooks();

    res.json({
      success: true,
      hooks: result.hooks,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/mcp
 * Returns user-level MCP servers from ~/.claude/settings.json
 */
router.get('/mcp', async (req, res) => {
  try {
    const result = await getUserMCP();

    res.json({
      success: true,
      mcp: result.mcp,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/skills
 * Returns user-level skills from ~/.claude/skills/
 */
router.get('/skills', async (req, res) => {
  try {
    const result = await getUserSkills();

    res.json({
      success: true,
      skills: result.skills,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/user/agents/:agentName
 * Update a user-level subagent's properties
 */
router.put('/agents/:agentName', validateAgentName, async (req, res) => {
  try {
    const { agentName } = req.params;
    const updates = req.body;

    // Get user home directory
    const userHome = getUserHome();
    const agentFilePath = path.join(userHome, '.claude', 'agents', `${agentName}.md`);

    // Check if agent file exists
    try {
      await fs.access(agentFilePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: `User agent not found: ${agentName}`
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
      delete updates.systemPrompt;
    }

    // If systemPrompt is being updated, handle it specially
    if (systemPromptUpdate !== null) {
      const content = await fs.readFile(agentFilePath, 'utf8');
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = content.match(frontmatterRegex);

      if (match) {
        const yaml = require('js-yaml');
        let frontmatter = yaml.load(match[1]) || {};
        frontmatter = { ...frontmatter, ...updates };

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
      if (Object.keys(updates).length > 0) {
        await updateYamlFrontmatter(agentFilePath, updates);
      }
    }

    // Handle rename if name changed
    if (updates.name && updates.name !== agentName) {
      const newFilePath = path.join(userHome, '.claude', 'agents', `${updates.name}.md`);

      try {
        await fs.access(newFilePath);
        return res.status(409).json({
          success: false,
          error: 'Agent name conflict',
          details: `A user agent named "${updates.name}" already exists`
        });
      } catch {
        // Good - new name doesn't exist
      }

      await fs.rename(agentFilePath, newFilePath);
    }

    // Re-read the updated agent to return
    const finalPath = updates.name && updates.name !== agentName
      ? path.join(userHome, '.claude', 'agents', `${updates.name}.md`)
      : agentFilePath;

    const updatedAgent = await parseSubagent(finalPath, 'user');

    res.json({
      success: true,
      message: 'User agent updated successfully',
      agent: updatedAgent
    });
  } catch (error) {
    console.error('Error updating user agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/user/agents/:agentName
 * Delete a user-level subagent
 */
router.delete('/agents/:agentName', validateAgentName, async (req, res) => {
  try {
    const { agentName } = req.params;

    const userHome = getUserHome();
    const agentFilePath = path.join(userHome, '.claude', 'agents', `${agentName}.md`);

    await deleteFile(agentFilePath);

    res.json({
      success: true,
      message: `User agent "${agentName}" deleted successfully`,
      deleted: agentFilePath
    });
  } catch (error) {
    if (error.message.includes('File not found')) {
      return res.status(404).json({
        success: false,
        error: `User agent not found: ${req.params.agentName}`
      });
    }

    console.error('Error deleting user agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/agents/:agentName/references
 * Check for references to a user-level agent
 */
router.get('/agents/:agentName/references', validateAgentName, async (req, res) => {
  try {
    const { agentName } = req.params;
    const userHome = getUserHome();

    // For user agents, we check references in the user's .claude directory
    const userClaudeDir = path.join(userHome, '.claude');

    // findReferences expects a project path, but for user-level, we pass the parent of .claude
    const references = await findReferences('agent', agentName, userHome);

    res.json({
      success: true,
      agentName,
      references,
      hasReferences: references.length > 0,
      referenceCount: references.length
    });
  } catch (error) {
    console.error('Error checking user agent references:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/user/commands/:commandPath
 * Update a user-level command's properties
 *
 * Request body can include:
 * - name: string
 * - description: string
 * - allowed-tools: string[] | string
 * - model: 'sonnet' | 'opus' | 'haiku' | 'inherit'
 * - argument-hint: string
 * - disable-model-invocation: boolean
 * - color: string
 * - content: string (body content)
 */
router.put('/commands/:commandPath(*)', async (req, res) => {
  try {
    const commandPath = decodeURIComponent(req.params.commandPath);
    const updates = req.body;

    // Get user home directory
    const userHome = getUserHome();
    const commandFilePath = path.join(userHome, '.claude', 'commands', `${commandPath}.md`);

    // Check if command file exists
    try {
      await fs.access(commandFilePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: `User command not found: ${commandPath}`
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

    // Validate name if provided
    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid name',
          details: 'Name must be a non-empty string'
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

    // Validate disable-model-invocation if provided
    if (updates['disable-model-invocation'] !== undefined && typeof updates['disable-model-invocation'] !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid disable-model-invocation',
        details: 'disable-model-invocation must be a boolean'
      });
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
      delete updates.content; // Remove from frontmatter updates
    }

    // If content is being updated, we need to handle it specially
    if (contentUpdate !== null) {
      // Read the current file
      const fileContent = await fs.readFile(commandFilePath, 'utf8');
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = fileContent.match(frontmatterRegex);

      if (match) {
        const yaml = require('js-yaml');
        let frontmatter = yaml.load(match[1]) || {};

        // Merge frontmatter updates
        frontmatter = { ...frontmatter, ...updates };

        // Remove undefined/null values
        Object.keys(frontmatter).forEach(key => {
          if (frontmatter[key] === undefined) delete frontmatter[key];
        });

        // Strip frontmatter from content if it contains it
        let cleanContent = contentUpdate;
        const contentMatch = contentUpdate.match(frontmatterRegex);
        if (contentMatch) {
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
      if (Object.keys(updates).length > 0) {
        await updateYamlFrontmatter(commandFilePath, updates);
      }
    }

    // Re-read the updated command to return
    const { parseCommand } = require('../parsers/commandParser');
    const baseDir = path.join(userHome, '.claude', 'commands');
    const updatedCommand = await parseCommand(commandFilePath, baseDir, 'user');

    res.json({
      success: true,
      message: 'User command updated successfully',
      command: updatedCommand
    });
  } catch (error) {
    console.error('Error updating user command:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
