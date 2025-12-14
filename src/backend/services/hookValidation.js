/**
 * Hook Validation Service
 *
 * Validates hook configurations for Claude Code settings.json files.
 * Hooks are event handlers that execute commands or prompts when specific
 * events occur during a Claude Code session.
 *
 * Hook Structure in settings.json:
 * {
 *   "hooks": {
 *     "PreToolUse": [{ "matcher": "Bash", "command": "...", ... }],
 *     "PostToolUse": [{ "matcher": "Read|Write", ... }],
 *     "Stop": [{ "type": "prompt", ... }],
 *     "SessionEnd": [{ "command": "...", ... }]
 *   }
 * }
 */

/**
 * Valid hook event types as defined by Claude Code specification
 *
 * Matcher-based events (require matcher field):
 * - PreToolUse: Before a tool is executed (supports prompt type)
 * - PostToolUse: After a tool completes
 *
 * Simple events (no matcher needed):
 * - Stop: When agent stops (supports prompt type)
 * - SubagentStop: When a subagent stops (supports prompt type)
 * - UserPromptSubmit: When user submits a prompt (supports prompt type)
 * - PermissionRequest: When permission is requested (supports prompt type)
 * - Notification: When a notification occurs
 * - PreCompact: Before context compaction
 * - SessionStart: When session begins
 * - SessionEnd: When session ends
 */
const VALID_HOOK_EVENTS = [
  'PreToolUse',
  'PostToolUse',
  'Stop',
  'SubagentStop',
  'UserPromptSubmit',
  'PermissionRequest',
  'Notification',
  'PreCompact',
  'SessionStart',
  'SessionEnd'
];

/**
 * Events that require a matcher field
 * Matcher specifies which tool(s) the hook applies to using pipe-separated values
 * Example: "Bash|Read|Write" or "*" for all tools
 */
const MATCHER_BASED_EVENTS = ['PreToolUse', 'PostToolUse'];

/**
 * Events that support the 'prompt' type
 * When type is 'prompt', the hook returns a message to Claude instead of executing a command
 * Official Claude Code specification supports prompt type for:
 * - Stop, SubagentStop, UserPromptSubmit, PreToolUse, PermissionRequest
 */
const PROMPT_SUPPORTED_EVENTS = ['Stop', 'SubagentStop', 'UserPromptSubmit', 'PreToolUse', 'PermissionRequest'];

/**
 * Valid hook type values
 * - command: Execute a shell command (default)
 * - prompt: Return a message to Claude (only for Stop/SubagentStop)
 */
const VALID_HOOK_TYPES = ['command', 'prompt'];

/**
 * Check if an event type requires a matcher field
 *
 * @param {string} event - Event type to check
 * @returns {boolean} True if event requires matcher
 */
function isMatcherBasedEvent(event) {
  return MATCHER_BASED_EVENTS.includes(event);
}

/**
 * Check if an event type supports 'prompt' type
 *
 * @param {string} event - Event type to check
 * @returns {boolean} True if event supports prompt type
 */
function supportsPromptType(event) {
  return PROMPT_SUPPORTED_EVENTS.includes(event);
}

/**
 * Validate a complete hook object
 * Used when creating new hooks or validating existing ones
 *
 * @param {Object} hook - Hook object to validate
 * @param {string} expectedEvent - Expected event type (for consistency checking)
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
function validateHook(hook, expectedEvent = null) {
  const errors = [];

  // Check if hook is an object
  if (!hook || typeof hook !== 'object' || Array.isArray(hook)) {
    return { valid: false, errors: ['Hook must be a non-null object'] };
  }

  // Validate event (if provided in hook or expected)
  const event = hook.event || expectedEvent;
  if (!event) {
    errors.push('Event type is required');
  } else if (!VALID_HOOK_EVENTS.includes(event)) {
    errors.push(`Invalid event type: "${event}". Valid events: ${VALID_HOOK_EVENTS.join(', ')}`);
  }

  // Validate matcher for matcher-based events
  if (event && isMatcherBasedEvent(event)) {
    if (!hook.matcher || typeof hook.matcher !== 'string' || hook.matcher.trim() === '') {
      errors.push(`Matcher is required for ${event} event`);
    }
  }

  // Validate type if provided
  if (hook.type !== undefined) {
    if (!VALID_HOOK_TYPES.includes(hook.type)) {
      errors.push(`Invalid hook type: "${hook.type}". Valid types: ${VALID_HOOK_TYPES.join(', ')}`);
    }

    // Validate prompt type constraint
    if (hook.type === 'prompt' && event && !supportsPromptType(event)) {
      errors.push(`Type "prompt" is only supported for ${PROMPT_SUPPORTED_EVENTS.join(' and ')} events`);
    }
  }

  // Validate command (required for all hooks with type 'command' or no type)
  const hookType = hook.type || 'command';
  if (hookType === 'command') {
    if (!hook.command || typeof hook.command !== 'string' || hook.command.trim() === '') {
      errors.push('Command is required for command-type hooks');
    }
  }

  // Validate timeout if provided (must be positive integer)
  if (hook.timeout !== undefined) {
    if (typeof hook.timeout !== 'number' || !Number.isInteger(hook.timeout) || hook.timeout <= 0) {
      errors.push('Timeout must be a positive integer (milliseconds)');
    }
  }

  // Validate boolean fields
  const booleanFields = ['enabled', 'suppressOutput', 'continue'];
  for (const field of booleanFields) {
    if (hook[field] !== undefined && typeof hook[field] !== 'boolean') {
      errors.push(`${field} must be a boolean value`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate hook update payload
 * Used when updating existing hooks - allows partial updates
 * Does NOT allow changing event type (readonly after creation)
 *
 * @param {Object} updates - Update payload to validate
 * @param {Object} existingHook - Current hook state
 * @param {string} event - Event type of the hook
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
function validateHookUpdate(updates, existingHook, event) {
  const errors = [];

  // Check if updates is an object
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return { valid: false, errors: ['Updates must be a non-null object'] };
  }

  // CRITICAL: Event type is READONLY - cannot be changed
  if (updates.event !== undefined && updates.event !== event) {
    errors.push('Event type cannot be changed after hook creation');
  }

  // Validate matcher update
  if (updates.matcher !== undefined) {
    if (isMatcherBasedEvent(event)) {
      // Matcher is required for matcher-based events - can be changed but not removed
      if (typeof updates.matcher !== 'string' || updates.matcher.trim() === '') {
        errors.push('Matcher cannot be empty for matcher-based events');
      }
    } else {
      // For non-matcher events, warn but allow (it will be ignored)
      // This is not an error, just silently ignore
    }
  }

  // Validate type update
  if (updates.type !== undefined) {
    if (!VALID_HOOK_TYPES.includes(updates.type)) {
      errors.push(`Invalid hook type: "${updates.type}". Valid types: ${VALID_HOOK_TYPES.join(', ')}`);
    }

    // Validate prompt type constraint
    if (updates.type === 'prompt' && !supportsPromptType(event)) {
      errors.push(`Type "prompt" is only supported for ${PROMPT_SUPPORTED_EVENTS.join(' and ')} events`);
    }
  }

  // Validate command update
  if (updates.command !== undefined) {
    const effectiveType = updates.type || existingHook?.type || 'command';
    if (effectiveType === 'command') {
      if (typeof updates.command !== 'string' || updates.command.trim() === '') {
        errors.push('Command cannot be empty for command-type hooks');
      }
    }
  }

  // Validate timeout update
  if (updates.timeout !== undefined) {
    if (typeof updates.timeout !== 'number' || !Number.isInteger(updates.timeout) || updates.timeout <= 0) {
      errors.push('Timeout must be a positive integer (milliseconds)');
    }
  }

  // Validate boolean field updates
  const booleanFields = ['enabled', 'suppressOutput', 'continue'];
  for (const field of booleanFields) {
    if (updates[field] !== undefined && typeof updates[field] !== 'boolean') {
      errors.push(`${field} must be a boolean value`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get default values for optional hook fields
 *
 * @returns {Object} Default hook field values
 */
function getHookDefaults() {
  return {
    type: 'command',
    enabled: true,
    suppressOutput: false,
    continue: true,
    timeout: 30000
  };
}

module.exports = {
  // Constants
  VALID_HOOK_EVENTS,
  MATCHER_BASED_EVENTS,
  PROMPT_SUPPORTED_EVENTS,
  VALID_HOOK_TYPES,

  // Functions
  isMatcherBasedEvent,
  supportsPromptType,
  validateHook,
  validateHookUpdate,
  getHookDefaults
};
