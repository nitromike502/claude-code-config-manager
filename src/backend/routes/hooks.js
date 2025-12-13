/**
 * Hook CRUD Routes
 *
 * Handles update operations for hooks stored in settings.json files.
 *
 * Hook Identification Scheme:
 * hookId = encodeURIComponent(`${event}::${matcher || ''}::${index}`)
 *
 * Examples:
 * - "PreToolUse::Bash::0"       → First hook for PreToolUse with Bash matcher
 * - "PreToolUse::Read|Write::1" → Second hook with pipe-joined matcher
 * - "SessionEnd::::0"           → First hook for SessionEnd (no matcher)
 *
 * Settings.json Hook Structure (3-level nesting):
 * {
 *   "hooks": {
 *     "PreToolUse": [
 *       { "matcher": "Bash", "command": "...", ... },
 *       { "matcher": "Read|Write", "command": "...", ... }
 *     ],
 *     "PostToolUse": [...],
 *     "Stop": [{ "type": "prompt", ... }]
 *   }
 * }
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { validateHookUpdate, VALID_HOOK_EVENTS, isMatcherBasedEvent } = require('../services/hookValidation');

/**
 * Parse hookId into its components
 * Format: event::matcher::index
 *
 * @param {string} hookId - URL-decoded hook identifier
 * @returns {{ event: string, matcher: string, index: number } | null} Parsed components or null if invalid
 */
function parseHookId(hookId) {
  if (!hookId || typeof hookId !== 'string') {
    return null;
  }

  // Split by :: delimiter (matcher may contain colons, so limit to 3 parts)
  const parts = hookId.split('::');
  if (parts.length !== 3) {
    return null;
  }

  const [event, matcher, indexStr] = parts;

  // Validate event
  if (!VALID_HOOK_EVENTS.includes(event)) {
    return null;
  }

  // Validate index
  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 0) {
    return null;
  }

  return {
    event,
    matcher: matcher || '', // Empty string for non-matcher events
    index
  };
}

/**
 * Build hookId from components
 *
 * @param {string} event - Event type
 * @param {string} matcher - Matcher string (may be empty)
 * @param {number} index - Array index
 * @returns {string} hookId in format event::matcher::index
 */
function buildHookId(event, matcher, index) {
  return `${event}::${matcher || ''}::${index}`;
}

/**
 * Convert projectId to project path
 * ProjectId format: path with slashes removed (e.g., homeuserprojectsmyapp)
 * We need to look this up from the stored projects
 *
 * @param {string} projectId - Project identifier
 * @returns {Promise<string|null>} Project path or null if not found
 */
async function resolveProjectPath(projectId) {
  const homeDir = os.homedir();
  const claudeJsonPath = path.join(homeDir, '.claude.json');

  try {
    const content = await fs.readFile(claudeJsonPath, 'utf8');
    const claudeConfig = JSON.parse(content);

    // Find project by matching projectId (path with slashes removed)
    for (const projectPath of Object.keys(claudeConfig.projects || {})) {
      const pathId = projectPath.replace(/\//g, '');
      if (pathId === projectId) {
        return projectPath;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Read settings.json file safely
 * Returns empty hooks object if file doesn't exist
 *
 * @param {string} settingsPath - Absolute path to settings.json
 * @returns {Promise<Object>} Settings object with hooks
 */
async function readSettingsFile(settingsPath) {
  try {
    const content = await fs.readFile(settingsPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty settings
      return { hooks: {} };
    }
    throw error;
  }
}

/**
 * Write settings.json file atomically
 * Uses temp file pattern for safety
 *
 * @param {string} settingsPath - Absolute path to settings.json
 * @param {Object} settings - Settings object to write
 */
async function writeSettingsFile(settingsPath, settings) {
  const tempPath = `${settingsPath}.tmp`;

  try {
    // Ensure directory exists
    const dir = path.dirname(settingsPath);
    await fs.mkdir(dir, { recursive: true });

    // Write to temp file
    await fs.writeFile(tempPath, JSON.stringify(settings, null, 2), 'utf8');

    // Atomic rename
    await fs.rename(tempPath, settingsPath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Find hook in settings by parsed hookId components
 *
 * @param {Object} hooks - Hooks object from settings
 * @param {Object} parsed - Parsed hookId { event, matcher, index }
 * @returns {{ hook: Object, eventArray: Array, arrayIndex: number } | null} Hook info or null
 */
function findHookInSettings(hooks, parsed) {
  const { event, matcher, index } = parsed;

  // Get event array
  const eventHooks = hooks[event];
  if (!Array.isArray(eventHooks) || eventHooks.length === 0) {
    return null;
  }

  // For matcher-based events, filter by matcher
  if (isMatcherBasedEvent(event)) {
    // Find all hooks with matching matcher
    const matchingHooks = eventHooks.filter(h => (h.matcher || '') === matcher);
    if (index >= matchingHooks.length) {
      return null;
    }

    // Find the actual array index of this hook
    let matchCount = 0;
    for (let i = 0; i < eventHooks.length; i++) {
      if ((eventHooks[i].matcher || '') === matcher) {
        if (matchCount === index) {
          return {
            hook: eventHooks[i],
            eventArray: eventHooks,
            arrayIndex: i
          };
        }
        matchCount++;
      }
    }
    return null;
  }

  // For non-matcher events, index directly into array
  if (index >= eventHooks.length) {
    return null;
  }

  return {
    hook: eventHooks[index],
    eventArray: eventHooks,
    arrayIndex: index
  };
}

/**
 * Update hook and handle matcher changes
 * When matcher changes, the hook effectively moves to a different "group"
 *
 * @param {Object} settings - Full settings object
 * @param {Object} parsed - Parsed hookId
 * @param {Object} updates - Update payload
 * @returns {Object} Updated hook
 */
function applyHookUpdates(settings, parsed, hookInfo, updates) {
  const { event, matcher } = parsed;
  const { arrayIndex } = hookInfo;
  const hooks = settings.hooks || {};
  const eventHooks = hooks[event] || [];

  // Get the hook to update
  const hook = { ...eventHooks[arrayIndex] };

  // Apply updates (excluding event which is readonly)
  const allowedFields = ['matcher', 'type', 'command', 'timeout', 'enabled', 'suppressOutput', 'continue'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      hook[field] = updates[field];
    }
  }

  // Check if matcher changed (for matcher-based events)
  const matcherChanged = isMatcherBasedEvent(event) &&
                         updates.matcher !== undefined &&
                         updates.matcher !== matcher;

  if (matcherChanged) {
    // Remove from current position
    eventHooks.splice(arrayIndex, 1);
    // Add to end (new matcher group)
    eventHooks.push(hook);
  } else {
    // Update in place
    eventHooks[arrayIndex] = hook;
  }

  // Clean up empty arrays
  if (eventHooks.length === 0) {
    delete hooks[event];
  } else {
    hooks[event] = eventHooks;
  }

  settings.hooks = hooks;
  return hook;
}

/**
 * PUT /api/projects/:projectId/hooks/:hookId
 * Update a project-level hook
 */
router.put('/:projectId/hooks/:hookId', async (req, res) => {
  try {
    const { projectId, hookId } = req.params;
    const updates = req.body;

    // Decode hookId (URL-encoded)
    const decodedHookId = decodeURIComponent(hookId);

    // Parse hookId
    const parsed = parseHookId(decodedHookId);
    if (!parsed) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hookId format',
        details: 'hookId must be in format: event::matcher::index'
      });
    }

    // Resolve project path
    const projectPath = await resolveProjectPath(projectId);
    if (!projectPath) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Build settings path
    const settingsPath = path.join(projectPath, '.claude', 'settings.json');

    // Read current settings
    const settings = await readSettingsFile(settingsPath);

    // Find the hook
    const hookInfo = findHookInSettings(settings.hooks || {}, parsed);
    if (!hookInfo) {
      return res.status(404).json({
        success: false,
        error: 'Hook not found',
        details: `No hook found for ${decodedHookId}`
      });
    }

    // Validate updates
    const validation = validateHookUpdate(updates, hookInfo.hook, parsed.event);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Apply updates
    const updatedHook = applyHookUpdates(settings, parsed, hookInfo, updates);

    // Write back to file
    await writeSettingsFile(settingsPath, settings);

    // Return success with updated hook
    res.json({
      success: true,
      hook: {
        ...updatedHook,
        event: parsed.event,
        hookId: buildHookId(parsed.event, updatedHook.matcher || '',
          isMatcherBasedEvent(parsed.event) ?
            // Find new index after potential move
            (settings.hooks[parsed.event] || [])
              .filter(h => (h.matcher || '') === (updatedHook.matcher || ''))
              .indexOf(updatedHook) :
            (settings.hooks[parsed.event] || []).indexOf(updatedHook)
        )
      }
    });

  } catch (error) {
    console.error('Error updating hook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update hook',
      details: error.message
    });
  }
});

module.exports = router;
