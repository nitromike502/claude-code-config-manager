/**
 * Hook Parser
 * Parses hooks from .claude/settings.json files
 * Supports project, project-local, and user-level hooks
 * Handles all 4 handler types: command, http, prompt, agent
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

/**
 * Parse a single hook entry, extracting type-specific and common fields
 * @param {Object} hook - Raw hook object from settings.json
 * @param {string} eventType - The event type this hook belongs to
 * @param {string} matcher - The matcher value
 * @param {string} scope - 'project', 'project-local', or 'user'
 * @param {string} filePath - Source file path
 * @returns {Object} Parsed hook object
 */
function parseHookEntry(hook, eventType, matcher, scope, filePath) {
  const type = hook.type || 'command';

  const parsed = {
    event: eventType,
    matcher: matcher,
    type: type,
    command: hook.command || '',
    enabled: hook.enabled !== false,
    scope: scope,
    filePath: filePath
  };

  // Type-specific fields
  if (type === 'http') {
    if (hook.url) parsed.url = hook.url;
    if (hook.headers) parsed.headers = hook.headers;
    if (hook.allowedEnvVars) parsed.allowedEnvVars = hook.allowedEnvVars;
  }

  if (type === 'prompt' || type === 'agent') {
    if (hook.prompt) parsed.prompt = hook.prompt;
    if (hook.model) parsed.model = hook.model;
  }

  // Common new fields
  if (hook.if !== undefined) parsed.if = hook.if;
  if (hook.statusMessage !== undefined) parsed.statusMessage = hook.statusMessage;
  if (hook.once !== undefined) parsed.once = hook.once;
  if (hook.async !== undefined) parsed.async = hook.async;
  if (hook.shell !== undefined) parsed.shell = hook.shell;
  if (hook.timeout !== undefined) parsed.timeout = hook.timeout;
  if (hook.suppressOutput !== undefined) parsed.suppressOutput = hook.suppressOutput;
  if (hook.continue !== undefined) parsed.continue = hook.continue;

  // Pass through unknown fields
  const knownFields = new Set([
    'type', 'command', 'enabled', 'matcher', 'url', 'headers',
    'allowedEnvVars', 'prompt', 'model', 'if', 'statusMessage',
    'once', 'async', 'shell', 'timeout', 'suppressOutput', 'continue',
    'hooks'
  ]);

  for (const [key, value] of Object.entries(hook)) {
    if (!knownFields.has(key) && !(key in parsed)) {
      parsed[key] = value;
    }
  }

  return parsed;
}

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
          hooks.push(parseHookEntry(hook, eventType, matcher, scope, filePath));
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
  parseHookEntry,
  parseHooksFromFile,
  parseProjectHooks,
  parseUserHooks,
  getAllHooks,
  groupHooksByEvent
};
