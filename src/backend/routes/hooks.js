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
const config = require('../config/config.js');
const { validateHookUpdate, VALID_HOOK_EVENTS, isMatcherBasedEvent } = require('../services/hookValidation');
const {
  getValidEvents,
  getMatcherBasedEvents,
  getPromptSupportedEvents,
  getHookEventOptions
} = require('../config/hooks');

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
  const claudeJsonPath = config.paths.getUserClaudeJsonPath();

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
 * Find hook in NESTED settings structure by parsed hookId components
 * Settings.json uses nested structure: event -> matcher entry -> hooks array -> hook object
 *
 * @param {Object} hooks - Hooks object from settings (nested structure)
 * @param {Object} parsed - Parsed hookId { event, matcher, index }
 * @returns {{ hook: Object, matcherEntry: Object, matcherEntryIndex: number, hookIndex: number } | null} Hook info or null
 */
function findHookInSettings(hooks, parsed) {
  const { event, matcher, index } = parsed;

  // Get event array (array of matcher entries)
  const eventEntries = hooks[event];
  if (!Array.isArray(eventEntries) || eventEntries.length === 0) {
    return null;
  }

  // Normalize matcher: treat '*' as equivalent to empty string
  // Frontend displays missing matcher as '*', but settings.json omits the matcher field
  const normalizedMatcher = (matcher === '*') ? '' : matcher;

  // Find the matcher entry that contains this hook
  // Each matcher entry has: { matcher: "...", hooks: [...] }
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
      return null;
    }

    return {
      hook: matcherEntry.hooks[index],
      matcherEntry: matcherEntry,
      matcherEntryIndex: matcherIdx,
      hookIndex: index
    };
  }

  return null;
}

/**
 * Update hook in NESTED settings structure
 * Handles matcher changes by moving hook to different matcher entry
 *
 * @param {Object} settings - Full settings object
 * @param {Object} parsed - Parsed hookId
 * @param {Object} hookInfo - Hook location info from findHookInSettings
 * @param {Object} updates - Update payload
 * @returns {Object} Updated hook object
 */
function applyHookUpdates(settings, parsed, hookInfo, updates) {
  const { event, matcher } = parsed;
  const { matcherEntry, hookIndex } = hookInfo;
  const hooks = settings.hooks || {};
  const eventEntries = hooks[event] || [];

  // Get the hook to update from the nested structure
  const hook = { ...matcherEntry.hooks[hookIndex] };

  // Apply updates (excluding event which is readonly, and matcher which is special)
  const allowedFields = ['type', 'command', 'timeout', 'enabled', 'suppressOutput', 'continue'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      hook[field] = updates[field];
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
    targetMatcherEntry.hooks.push(hook);
  } else {
    // Update in place within the nested structure
    matcherEntry.hooks[hookIndex] = hook;
  }

  // Clean up empty event arrays
  if (eventEntries.length === 0) {
    delete hooks[event];
  } else {
    hooks[event] = eventEntries;
  }

  settings.hooks = hooks;
  return hook;
}

/**
 * GET /api/hooks/events
 * Get hook event metadata for all valid events
 *
 * Returns:
 * - validEvents: Array of all valid event names
 * - matcherBasedEvents: Events that support matchers
 * - promptSupportedEvents: Events that support custom prompts
 * - eventOptions: UI-friendly array for dropdowns with metadata
 */
router.get('/events', async (req, res) => {
  try {
    res.json({
      validEvents: getValidEvents(),
      matcherBasedEvents: getMatcherBasedEvents(),
      promptSupportedEvents: getPromptSupportedEvents(),
      eventOptions: getHookEventOptions()
    });
  } catch (error) {
    console.error('Error fetching hook event metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hook event metadata',
      details: error.message
    });
  }
});

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
    const settingsPath = config.paths.getProjectSettingsPath(projectPath);

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

    // Calculate new hookId after update (may have changed if matcher changed)
    // Need to find the hook in the nested structure to get its new index
    const finalMatcher = updates.matcher !== undefined ? updates.matcher : parsed.matcher;
    const eventEntries = settings.hooks[parsed.event] || [];
    let newHookIndex = 0;

    // Find the matcher entry and hook index
    for (const entry of eventEntries) {
      if ((entry.matcher || '') === finalMatcher) {
        // Find hook in this matcher entry's hooks array
        newHookIndex = entry.hooks.indexOf(updatedHook);
        break;
      }
    }

    // Return success with updated hook
    res.json({
      success: true,
      hook: {
        ...updatedHook,
        event: parsed.event,
        matcher: finalMatcher || '*',
        hookId: buildHookId(parsed.event, finalMatcher, newHookIndex)
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
