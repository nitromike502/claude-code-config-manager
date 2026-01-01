/**
 * Hook Parser
 * Parses hooks from .claude/settings.json files
 * Supports project, project-local, and user-level hooks
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

/**
 * Parse hooks from a settings.json file
 * @param {string} filePath - Absolute path to settings.json
 * @param {string} scope - 'project', 'project-local', or 'user'
 * @returns {Promise<Array>} Array of hook objects
 */
async function parseHooksFromFile(filePath, scope) {
  try {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return []; // File doesn't exist, return empty array
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const settings = JSON.parse(content);

    // Extract hooks section
    if (!settings.hooks || typeof settings.hooks !== 'object') {
      return []; // No hooks section
    }

    const hooks = [];

    // Iterate through each hook event type
    for (const [eventType, matchers] of Object.entries(settings.hooks)) {
      if (!Array.isArray(matchers)) continue;

      // Each event type has an array of matchers
      for (const matcherEntry of matchers) {
        const matcher = matcherEntry.matcher || '*';
        const hooksList = matcherEntry.hooks || [];

        // Each matcher can have multiple hooks
        for (const hook of hooksList) {
          hooks.push({
            event: eventType,
            matcher: matcher,
            type: hook.type || 'command',
            command: hook.command || '',
            enabled: hook.enabled !== false, // Default to true if not specified
            scope: scope,
            filePath: filePath
          });
        }
      }
    }

    return hooks;
  } catch (error) {
    console.error(`Error parsing hooks from ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Parse all hooks for a project (project + project-local)
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Array>} Array of hook objects
 */
async function parseProjectHooks(projectPath) {
  const settingsPath = config.paths.getProjectSettingsPath(projectPath);
  const localSettingsPath = config.paths.getProjectLocalSettingsPath(projectPath);

  const [projectHooks, localHooks] = await Promise.all([
    parseHooksFromFile(settingsPath, 'project'),
    parseHooksFromFile(localSettingsPath, 'project-local')
  ]);

  return [...projectHooks, ...localHooks];
}

/**
 * Parse user-level hooks
 * @param {string} userHomePath - Absolute path to user home directory
 * @returns {Promise<Array>} Array of hook objects
 */
async function parseUserHooks(userHomePath) {
  const settingsPath = config.paths.getUserSettingsPath();
  return parseHooksFromFile(settingsPath, 'user');
}

/**
 * Get all hooks (project + user)
 * @param {string} projectPath - Absolute path to project root
 * @param {string} userHomePath - Absolute path to user home directory
 * @returns {Promise<Object>} Object with project and user hook arrays
 */
async function getAllHooks(projectPath, userHomePath) {
  const [projectHooks, userHooks] = await Promise.all([
    parseProjectHooks(projectPath),
    parseUserHooks(userHomePath)
  ]);

  return {
    project: projectHooks,
    user: userHooks
  };
}

/**
 * Parse hooks and group by event type
 * @param {Array} hooks - Array of hook objects
 * @returns {Object} Hooks grouped by event type
 */
function groupHooksByEvent(hooks) {
  const grouped = {};

  for (const hook of hooks) {
    if (!grouped[hook.event]) {
      grouped[hook.event] = [];
    }
    grouped[hook.event].push(hook);
  }

  return grouped;
}

module.exports = {
  parseHooksFromFile,
  parseProjectHooks,
  parseUserHooks,
  getAllHooks,
  groupHooksByEvent
};
