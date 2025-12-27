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
const { deleteFile, deleteDirectory } = require('../services/deleteService');
const { findReferences } = require('../services/referenceChecker');
const { parseSubagent } = require('../parsers/subagentParser');
const { parseSkill } = require('../parsers/skillParser');

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
 * PUT /api/user/hooks/:hookId
 * Update a user-level hook
 *
 * hookId format: event::matcher::index (URL-encoded)
 * Examples:
 * - "PreToolUse::Bash::0" - First hook for PreToolUse with Bash matcher
 * - "SessionEnd::::0" - First hook for SessionEnd (no matcher)
 */
router.put('/hooks/:hookId', async (req, res) => {
  try {
    const { hookId } = req.params;
    const updates = req.body;

    // Import validation and constants
    const { validateHookUpdate, VALID_HOOK_EVENTS, isMatcherBasedEvent } = require('../services/hookValidation');

    // Decode hookId (URL-encoded)
    const decodedHookId = decodeURIComponent(hookId);

    // Parse hookId: event::matcher::index
    const parts = decodedHookId.split('::');
    if (parts.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hookId format',
        details: 'hookId must be in format: event::matcher::index'
      });
    }

    const [event, matcher, indexStr] = parts;

    // Validate event
    if (!VALID_HOOK_EVENTS.includes(event)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type',
        details: `Event must be one of: ${VALID_HOOK_EVENTS.join(', ')}`
      });
    }

    // Validate index
    const index = parseInt(indexStr, 10);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hookId format',
        details: 'Index must be a non-negative integer'
      });
    }

    // Get user home directory
    const userHome = getUserHome();
    const settingsPath = path.join(userHome, '.claude', 'settings.json');

    // Read current settings
    let settings = { hooks: {} };
    try {
      const content = await fs.readFile(settingsPath, 'utf8');
      settings = JSON.parse(content);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist - no hooks to update
      return res.status(404).json({
        success: false,
        error: 'Hook not found',
        details: `No user hooks configured`
      });
    }

    // Find the hook in NESTED structure
    const hooks = settings.hooks || {};
    const eventEntries = hooks[event];
    if (!Array.isArray(eventEntries) || eventEntries.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hook not found',
        details: `No hooks found for event: ${event}`
      });
    }

    // Normalize matcher: treat '*' as equivalent to empty string
    // Frontend displays missing matcher as '*', but settings.json omits the matcher field
    const normalizedMatcher = (matcher === '*') ? '' : matcher;

    // Find the matcher entry that contains this hook
    let hookInfo = null;
    for (let matcherIdx = 0; matcherIdx < eventEntries.length; matcherIdx++) {
      const matcherEntry = eventEntries[matcherIdx];

      // Check if matcher matches (empty matcher in hookId = no matcher field in settings)
      const entryMatcher = matcherEntry.matcher || '';
      if (entryMatcher !== normalizedMatcher) {
        continue;
      }

      // Found the right matcher entry - check if hook exists at index
      if (!Array.isArray(matcherEntry.hooks)) {
        continue;
      }

      if (index >= matcherEntry.hooks.length) {
        return res.status(404).json({
          success: false,
          error: 'Hook not found',
          details: `No hook found at index ${index}`
        });
      }

      hookInfo = {
        hook: matcherEntry.hooks[index],
        matcherEntry: matcherEntry,
        matcherEntryIndex: matcherIdx,
        hookIndex: index
      };
      break;
    }

    if (!hookInfo) {
      return res.status(404).json({
        success: false,
        error: 'Hook not found',
        details: `No hook found for ${decodedHookId}`
      });
    }

    // Validate updates
    const validation = validateHookUpdate(updates, hookInfo.hook, event);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Apply updates to the hook in NESTED structure
    const { matcherEntry, hookIndex } = hookInfo;
    const updatedHook = { ...matcherEntry.hooks[hookIndex] };

    // Apply updates (excluding event which is readonly)
    const allowedFields = ['type', 'command', 'timeout', 'enabled', 'suppressOutput', 'continue'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updatedHook[field] = updates[field];
      }
    }

    // Check if matcher changed (only relevant for matcher-based events)
    const matcherChanged = isMatcherBasedEvent(event) &&
                           updates.matcher !== undefined &&
                           updates.matcher !== matcher;

    if (matcherChanged) {
      // Remove hook from current matcher entry
      matcherEntry.hooks.splice(hookIndex, 1);

      // If matcher entry now has no hooks, remove it
      if (matcherEntry.hooks.length === 0) {
        const matcherEntryIndex = eventEntries.indexOf(matcherEntry);
        if (matcherEntryIndex !== -1) {
          eventEntries.splice(matcherEntryIndex, 1);
        }
      }

      // Find or create matcher entry for new matcher
      const newMatcher = updates.matcher;
      let targetMatcherEntry = eventEntries.find(e => (e.matcher || '') === newMatcher);

      if (!targetMatcherEntry) {
        // Create new matcher entry
        targetMatcherEntry = {
          matcher: newMatcher,
          hooks: []
        };
        eventEntries.push(targetMatcherEntry);
      }

      // Add hook to new matcher entry
      targetMatcherEntry.hooks.push(updatedHook);
    } else {
      // Update in place within the nested structure
      matcherEntry.hooks[hookIndex] = updatedHook;
    }

    // Clean up empty event arrays
    if (eventEntries.length === 0) {
      delete hooks[event];
    } else {
      hooks[event] = eventEntries;
    }

    settings.hooks = hooks;

    // Write back atomically
    const tempPath = `${settingsPath}.tmp`;
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.writeFile(tempPath, JSON.stringify(settings, null, 2), 'utf8');
    await fs.rename(tempPath, settingsPath);

    // Calculate new hookId after update (may have changed if matcher changed)
    const finalMatcher = updates.matcher !== undefined ? updates.matcher : matcher;
    let newHookIndex = 0;

    // Find the matcher entry and hook index
    for (const entry of eventEntries) {
      if ((entry.matcher || '') === finalMatcher) {
        // Find hook in this matcher entry's hooks array
        newHookIndex = entry.hooks.indexOf(updatedHook);
        break;
      }
    }

    const newHookId = `${event}::${finalMatcher}::${newHookIndex}`;

    res.json({
      success: true,
      hook: {
        ...updatedHook,
        event,
        matcher: finalMatcher || '*',
        hookId: newHookId
      }
    });
  } catch (error) {
    console.error('Error updating user hook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update hook',
      details: error.message
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

  // URL decode the path
  const decodedPath = decodeURIComponent(commandPath);

  if (!decodedPath || !isValidCommandPath(decodedPath)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid command path format',
      details: 'Command path must end with .md and not contain path traversal sequences'
    });
  }

  // Store decoded path for handlers to use
  req.decodedCommandPath = decodedPath;

  next();
}

/**
 * PUT /api/user/commands/:commandPath
 * Update a user-level command's properties
 */
router.put('/commands/:commandPath', validateCommandPath, async (req, res) => {
  try {
    const commandPath = req.decodedCommandPath; // Use decoded path from middleware
    const updates = req.body;

    // Get user home directory
    const userHome = getUserHome();
    const commandFilePath = path.join(userHome, '.claude', 'commands', commandPath);

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

    // Validate description if provided (optional for commands)
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
      const fileContent = await fs.readFile(commandFilePath, 'utf8');
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = fileContent.match(frontmatterRegex);

      if (match) {
        const yaml = require('js-yaml');
        let frontmatter = yaml.load(match[1]) || {};
        frontmatter = { ...frontmatter, ...frontmatterUpdates };

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
      if (Object.keys(frontmatterUpdates).length > 0) {
        await updateYamlFrontmatter(commandFilePath, frontmatterUpdates);
      }
    }

    // Handle rename if name changed
    if (updates.name && updates.name !== commandPath) {
      const newFilePath = path.join(userHome, '.claude', 'commands', updates.name);
      const newDir = path.dirname(newFilePath);

      // Create directory if it doesn't exist (for nested paths)
      await fs.mkdir(newDir, { recursive: true });

      try {
        await fs.access(newFilePath);
        return res.status(409).json({
          success: false,
          error: 'Command name conflict',
          details: `A user command named "${updates.name}" already exists`
        });
      } catch {
        // Good - new name doesn't exist
      }

      await fs.rename(commandFilePath, newFilePath);
    }

    // Re-read the updated command to return
    const finalPath = updates.name && updates.name !== commandPath
      ? path.join(userHome, '.claude', 'commands', updates.name)
      : commandFilePath;

    const { parseCommand } = require('../parsers/commandParser');
    const baseDir = path.join(userHome, '.claude', 'commands');
    const updatedCommand = await parseCommand(finalPath, baseDir, 'user');

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

/**
 * DELETE /api/user/commands/:commandPath
 * Delete a user-level command
 */
router.delete('/commands/:commandPath', validateCommandPath, async (req, res) => {
  try {
    const commandPath = req.decodedCommandPath; // Use decoded path from middleware

    const userHome = getUserHome();
    const commandFilePath = path.join(userHome, '.claude', 'commands', commandPath);

    await deleteFile(commandFilePath);

    res.json({
      success: true,
      message: `User command "${commandPath}" deleted successfully`,
      deleted: commandFilePath
    });
  } catch (error) {
    if (error.message.includes('File not found')) {
      return res.status(404).json({
        success: false,
        error: `User command not found: ${req.decodedCommandPath}`
      });
    }

    console.error('Error deleting user command:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/commands/:commandPath/references
 * Check for references to a user-level command
 */
router.get('/commands/:commandPath/references', validateCommandPath, async (req, res) => {
  try {
    const commandPath = req.decodedCommandPath; // Use decoded path from middleware
    const userHome = getUserHome();

    // Extract command name (without .md extension) for reference checking
    const commandName = path.basename(commandPath, '.md');

    // For user commands, we check references in the user's .claude directory
    // findReferences expects a project path, but for user-level, we pass the parent of .claude
    const references = await findReferences('command', commandName, userHome);

    res.json({
      success: true,
      commandPath,
      commandName,
      references,
      hasReferences: references.length > 0,
      referenceCount: references.length
    });
  } catch (error) {
    console.error('Error checking user command references:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
 * PUT /api/user/skills/:skillName
 * Update a user-level skill's properties
 *
 * Request body can include:
 * - name: string (silently ignored - skill names cannot be changed as they are directory names)
 * - description: string (required field, min 10 chars)
 * - allowedTools: string[] | string (maps to 'allowed-tools' in frontmatter)
 * - content: string (body content of SKILL.md)
 *
 * Note: Supporting files in skill directory are READ-ONLY and not modified
 */
router.put('/skills/:skillName', validateSkillName, async (req, res) => {
  try {
    const { skillName } = req.params;
    const updates = req.body;

    // Get user home directory
    const userHome = getUserHome();

    // Construct SKILL.md file path
    const skillDirPath = path.join(userHome, '.claude', 'skills', skillName);
    const skillFilePath = path.join(skillDirPath, 'SKILL.md');

    // Check if SKILL.md exists
    try {
      await fs.access(skillFilePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: `User skill not found: ${skillName}`
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

    // Skill names are directory names and cannot be changed
    // Silently ignore any name updates
    if (updates.name !== undefined) {
      delete updates.name;
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

    // Note: name is already removed/ignored at validation stage
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
    const updatedSkill = await parseSkill(skillDirPath, 'user');

    // Create warnings array if external references exist
    const warnings = [];
    if (updatedSkill.externalReferences && updatedSkill.externalReferences.length > 0) {
      warnings.push(`Skill contains ${updatedSkill.externalReferences.length} external reference(s) that may affect portability`);
    }

    res.json({
      success: true,
      message: 'User skill updated successfully',
      skill: updatedSkill,
      warnings: warnings.length > 0 ? warnings : undefined
    });
  } catch (error) {
    console.error('Error updating user skill:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/user/skills/:skillName
 * Delete a user-level skill directory
 *
 * Note: Skills are DIRECTORIES (containing SKILL.md and supporting files),
 * not single files. This endpoint uses deleteDirectory() to recursively
 * remove the entire skill directory.
 */
router.delete('/skills/:skillName', validateSkillName, async (req, res) => {
  try {
    const { skillName } = req.params;

    const userHome = getUserHome();
    const skillDirPath = path.join(userHome, '.claude', 'skills', skillName);

    // Delete the directory (deleteDirectory will validate it exists and is a directory)
    await deleteDirectory(skillDirPath);

    res.json({
      success: true,
      message: `User skill "${skillName}" deleted successfully`,
      deleted: skillDirPath
    });
  } catch (error) {
    // Handle directory not found specifically
    if (error.message.includes('Directory not found')) {
      return res.status(404).json({
        success: false,
        error: `User skill not found: ${req.params.skillName}`
      });
    }

    console.error('Error deleting user skill:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
