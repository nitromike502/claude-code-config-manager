/**
 * Centralized Hook Events Configuration
 *
 * This module provides a single source of truth for all hook event metadata,
 * including which events support matchers and custom prompts.
 *
 * Used by:
 * - Hook validation (hookValidation.js)
 * - Project discovery (projectDiscovery.js)
 * - Form options (form-options.js)
 * - UI components (ConfigDetailSidebar.vue)
 */

/**
 * Complete hook events configuration with all metadata
 * @type {Object.<string, {hasMatcher: boolean, supportsPrompt: boolean}>}
 */
const HOOK_EVENTS = {
  PreToolUse: {
    hasMatcher: true,
    supportsPrompt: true
  },
  PostToolUse: {
    hasMatcher: true,
    supportsPrompt: false
  },
  PermissionRequest: {
    hasMatcher: true,
    supportsPrompt: true
  },
  Notification: {
    hasMatcher: true,
    supportsPrompt: false
  },
  UserPromptSubmit: {
    hasMatcher: false,
    supportsPrompt: true
  },
  Stop: {
    hasMatcher: false,
    supportsPrompt: true
  },
  SubagentStop: {
    hasMatcher: false,
    supportsPrompt: true
  },
  PreCompact: {
    hasMatcher: false,
    supportsPrompt: false
  },
  SessionStart: {
    hasMatcher: false,
    supportsPrompt: false
  },
  SessionEnd: {
    hasMatcher: false,
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
 * Get metadata for a specific event
 * @param {string} event - Event name
 * @returns {{hasMatcher: boolean, supportsPrompt: boolean}|null} Event metadata or null if not found
 */
function getEventMetadata(event) {
  return HOOK_EVENTS[event] || null;
}

module.exports = {
  HOOK_EVENTS,
  getValidEvents,
  getMatcherBasedEvents,
  getPromptSupportedEvents,
  getHookEventOptions,
  isValidEvent,
  eventHasMatcher,
  eventSupportsPrompt,
  getEventMetadata
};
