/**
 * Centralized Hook Events Configuration
 *
 * This module provides a single source of truth for all hook event metadata,
 * including which events support matchers, custom prompts, and blocking.
 *
 * Used by:
 * - Hook validation (hookValidation.js)
 * - Project discovery (projectDiscovery.js)
 * - Form options (form-options.js)
 * - UI components (ConfigDetailSidebar.vue)
 */

/**
 * Complete hook events configuration with all metadata
 * @type {Object.<string, {hasMatcher: boolean, matcherValues: string[], canBlock: boolean, supportsPrompt: boolean}>}
 */
const HOOK_EVENTS = {
  // === Events WITH matchers (17) ===
  PreToolUse: {
    hasMatcher: true,
    matcherValues: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Agent'],
    canBlock: true,
    supportsPrompt: true
  },
  PostToolUse: {
    hasMatcher: true,
    matcherValues: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Agent'],
    canBlock: false,
    supportsPrompt: false
  },
  PostToolUseFailure: {
    hasMatcher: true,
    matcherValues: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Agent'],
    canBlock: false,
    supportsPrompt: false
  },
  PermissionRequest: {
    hasMatcher: true,
    matcherValues: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Agent'],
    canBlock: true,
    supportsPrompt: true
  },
  Notification: {
    hasMatcher: true,
    matcherValues: ['permission_prompt', 'idle_prompt', 'auth_success', 'elicitation_dialog'],
    canBlock: false,
    supportsPrompt: false
  },
  SubagentStart: {
    hasMatcher: true,
    matcherValues: ['general-purpose', 'Explore', 'Plan'],
    canBlock: false,
    supportsPrompt: false
  },
  SubagentStop: {
    hasMatcher: true,
    matcherValues: ['general-purpose', 'Explore', 'Plan'],
    canBlock: true,
    supportsPrompt: true
  },
  SessionStart: {
    hasMatcher: true,
    matcherValues: ['startup', 'resume', 'clear', 'compact'],
    canBlock: false,
    supportsPrompt: false
  },
  SessionEnd: {
    hasMatcher: true,
    matcherValues: ['clear', 'resume', 'logout', 'prompt_input_exit', 'bypass_permissions_disabled', 'other'],
    canBlock: false,
    supportsPrompt: false
  },
  InstructionsLoaded: {
    hasMatcher: true,
    matcherValues: ['session_start', 'nested_traversal', 'path_glob_match', 'include', 'compact'],
    canBlock: false,
    supportsPrompt: false
  },
  StopFailure: {
    hasMatcher: true,
    matcherValues: ['rate_limit', 'authentication_failed', 'billing_error', 'invalid_request', 'server_error', 'max_output_tokens', 'unknown'],
    canBlock: false,
    supportsPrompt: false
  },
  ConfigChange: {
    hasMatcher: true,
    matcherValues: ['user_settings', 'project_settings', 'local_settings', 'policy_settings', 'skills'],
    canBlock: true,
    supportsPrompt: false
  },
  FileChanged: {
    hasMatcher: true,
    matcherValues: ['package.json', 'tsconfig.json'],
    canBlock: false,
    supportsPrompt: false
  },
  PreCompact: {
    hasMatcher: true,
    matcherValues: ['manual', 'auto'],
    canBlock: false,
    supportsPrompt: false
  },
  PostCompact: {
    hasMatcher: true,
    matcherValues: ['manual', 'auto'],
    canBlock: false,
    supportsPrompt: false
  },
  Elicitation: {
    hasMatcher: true,
    matcherValues: ['mcp-server-name'],
    canBlock: true,
    supportsPrompt: false
  },
  ElicitationResult: {
    hasMatcher: true,
    matcherValues: ['mcp-server-name'],
    canBlock: true,
    supportsPrompt: false
  },

  // === Events WITHOUT matchers (10) ===
  UserPromptSubmit: {
    hasMatcher: false,
    matcherValues: [],
    canBlock: true,
    supportsPrompt: true
  },
  Stop: {
    hasMatcher: false,
    matcherValues: [],
    canBlock: true,
    supportsPrompt: true
  },
  TaskCreated: {
    hasMatcher: false,
    matcherValues: [],
    canBlock: true,
    supportsPrompt: false
  },
  TaskCompleted: {
    hasMatcher: false,
    matcherValues: [],
    canBlock: true,
    supportsPrompt: false
  },
  TeammateIdle: {
    hasMatcher: false,
    matcherValues: [],
    canBlock: true,
    supportsPrompt: false
  },
  CwdChanged: {
    hasMatcher: false,
    matcherValues: [],
    canBlock: false,
    supportsPrompt: false
  },
  WorktreeCreate: {
    hasMatcher: false,
    matcherValues: [],
    canBlock: true,
    supportsPrompt: false
  },
  WorktreeRemove: {
    hasMatcher: false,
    matcherValues: [],
    canBlock: false,
    supportsPrompt: false
  },
  Setup: {
    hasMatcher: false,
    matcherValues: [],
    canBlock: false,
    supportsPrompt: false
  }
};

/**
 * Get array of all valid hook event names
 * @returns {string[]} Array of event names
 */
function getValidEvents() {
  return Object.keys(HOOK_EVENTS);
}

/**
 * Get array of events that support matchers
 * @returns {string[]} Array of matcher-based event names
 */
function getMatcherBasedEvents() {
  return Object.entries(HOOK_EVENTS)
    .filter(([, metadata]) => metadata.hasMatcher)
    .map(([event]) => event);
}

/**
 * Get array of events that support custom prompts
 * @returns {string[]} Array of prompt-supported event names
 */
function getPromptSupportedEvents() {
  return Object.entries(HOOK_EVENTS)
    .filter(([, metadata]) => metadata.supportsPrompt)
    .map(([event]) => event);
}

/**
 * Get array of events that can block execution
 * @returns {string[]} Array of blocking event names
 */
function getBlockingEvents() {
  return Object.entries(HOOK_EVENTS)
    .filter(([, metadata]) => metadata.canBlock)
    .map(([event]) => event);
}

/**
 * Get UI-friendly array of hook event options for dropdowns
 * @returns {Array<{value: string, label: string, hasMatcher: boolean}>}
 */
function getHookEventOptions() {
  return Object.entries(HOOK_EVENTS).map(([event, metadata]) => ({
    value: event,
    label: event,
    hasMatcher: metadata.hasMatcher
  }));
}

/**
 * Check if an event is valid
 * @param {string} event - Event name to validate
 * @returns {boolean} True if event is valid
 */
function isValidEvent(event) {
  return event in HOOK_EVENTS;
}

/**
 * Check if an event supports matchers
 * @param {string} event - Event name to check
 * @returns {boolean} True if event supports matchers
 */
function eventHasMatcher(event) {
  return HOOK_EVENTS[event]?.hasMatcher || false;
}

/**
 * Check if an event supports custom prompts
 * @param {string} event - Event name to check
 * @returns {boolean} True if event supports prompts
 */
function eventSupportsPrompt(event) {
  return HOOK_EVENTS[event]?.supportsPrompt || false;
}

/**
 * Check if an event can block execution
 * @param {string} event - Event name to check
 * @returns {boolean} True if event can block
 */
function eventCanBlock(event) {
  return HOOK_EVENTS[event]?.canBlock || false;
}

/**
 * Get metadata for a specific event
 * @param {string} event - Event name
 * @returns {{hasMatcher: boolean, matcherValues: string[], canBlock: boolean, supportsPrompt: boolean}|null} Event metadata or null if not found
 */
function getEventMetadata(event) {
  return HOOK_EVENTS[event] || null;
}

module.exports = {
  HOOK_EVENTS,
  getValidEvents,
  getMatcherBasedEvents,
  getPromptSupportedEvents,
  getBlockingEvents,
  getHookEventOptions,
  isValidEvent,
  eventHasMatcher,
  eventSupportsPrompt,
  eventCanBlock,
  getEventMetadata
};
