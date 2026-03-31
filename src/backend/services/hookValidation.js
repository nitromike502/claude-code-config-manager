/**
 * Hook Validation Service
 *
 * Validates hook configurations for Claude Code settings.json files.
 * Hooks are event handlers that execute commands, HTTP requests, prompts,
 * or agent actions when specific events occur during a Claude Code session.
 *
 * Hook Structure in settings.json:
 * {
 *   "hooks": {
 *     "PreToolUse": [{ "matcher": "Bash", "type": "command", "command": "...", ... }],
 *     "PostToolUse": [{ "matcher": "Read|Write", "type": "http", "url": "...", ... }],
 *     "Stop": [{ "type": "prompt", "prompt": "...", ... }],
 *     "SessionEnd": [{ "type": "agent", "prompt": "...", ... }]
 *   }
 * }
 */

// Import centralized hook events configuration
const { getValidEvents, getMatcherBasedEvents, getPromptSupportedEvents } = require('../config/hooks');

/**
 * Valid hook event types as defined by Claude Code specification
 */
const VALID_HOOK_EVENTS = getValidEvents();

/**
 * Events that require a matcher field
 * Matcher specifies which tool(s) or category the hook applies to
 */
const MATCHER_BASED_EVENTS = getMatcherBasedEvents();

/**
 * Events that support the 'prompt' type
 * When type is 'prompt', the hook returns a message to Claude instead of executing a command
 */
const PROMPT_SUPPORTED_EVENTS = getPromptSupportedEvents();

/**
 * Valid hook type values
 * - command: Execute a shell command (default)
 * - http: Make an HTTP request
 * - prompt: Return a message to Claude
 * - agent: Spawn an agent with a prompt
 */
const VALID_HOOK_TYPES = ['command', 'http', 'prompt', 'agent'];

/**
 * Default timeout values per hook type (in seconds)
 */
const DEFAULT_TIMEOUTS = {
  command: 600,
  http: 30,
  prompt: 30,
  agent: 60
};

/**
 * Valid shell values for command-type hooks
 */
const VALID_SHELLS = ['bash', 'powershell'];

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
 * Validate type-specific required fields
 *
 * @param {Object} hook - Hook object to validate
 * @param {string} hookType - The resolved hook type
 * @returns {string[]} Array of error messages
 */
function validateTypeSpecificFields(hook, hookType) {
  const errors = [];

  switch (hookType) {
    case 'command':
      if (!hook.command || typeof hook.command !== 'string' || hook.command.trim() === '') {
        errors.push('Command is required for command-type hooks');
      }
      break;
    case 'http':
      if (!hook.url || typeof hook.url !== 'string' || hook.url.trim() === '') {
        errors.push('URL is required for http-type hooks');
      }
      break;
    case 'prompt':
      if (!hook.prompt || typeof hook.prompt !== 'string' || hook.prompt.trim() === '') {
        errors.push('Prompt is required for prompt-type hooks');
      }
      break;
    case 'agent':
      if (!hook.prompt || typeof hook.prompt !== 'string' || hook.prompt.trim() === '') {
        errors.push('Prompt is required for agent-type hooks');
      }
      break;
  }

  return errors;
}

/**
 * Validate common optional fields
 *
 * @param {Object} hook - Hook object to validate
 * @returns {string[]} Array of error messages
 */
function validateCommonFields(hook) {
  const errors = [];

  // Validate 'if' field (conditional expression)
  if (hook.if !== undefined && typeof hook.if !== 'string') {
    errors.push('if must be a string');
  }

  // Validate statusMessage field
  if (hook.statusMessage !== undefined && typeof hook.statusMessage !== 'string') {
    errors.push('statusMessage must be a string');
  }

  // Validate once field
  if (hook.once !== undefined && typeof hook.once !== 'boolean') {
    errors.push('once must be a boolean value');
  }

  // Validate async field
  if (hook.async !== undefined && typeof hook.async !== 'boolean') {
    errors.push('async must be a boolean value');
  }

  // Validate shell field
  if (hook.shell !== undefined) {
    if (typeof hook.shell !== 'string' || !VALID_SHELLS.includes(hook.shell)) {
      errors.push(`shell must be one of: ${VALID_SHELLS.join(', ')}`);
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

  return errors;
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

    // Validate prompt/agent type constraint
    if ((hook.type === 'prompt' || hook.type === 'agent') && event && !supportsPromptType(event)) {
      errors.push(`Type "${hook.type}" is only supported for ${PROMPT_SUPPORTED_EVENTS.join(' and ')} events`);
    }
  }

  // Validate type-specific required fields
  const hookType = hook.type || 'command';
  if (VALID_HOOK_TYPES.includes(hookType)) {
    errors.push(...validateTypeSpecificFields(hook, hookType));
  }

  // Validate common optional fields
  errors.push(...validateCommonFields(hook));

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
      if (typeof updates.matcher !== 'string' || updates.matcher.trim() === '') {
        errors.push('Matcher cannot be empty for matcher-based events');
      }
    }
  }

  // Validate type update
  if (updates.type !== undefined) {
    if (!VALID_HOOK_TYPES.includes(updates.type)) {
      errors.push(`Invalid hook type: "${updates.type}". Valid types: ${VALID_HOOK_TYPES.join(', ')}`);
    }

    // Validate prompt/agent type constraint
    if ((updates.type === 'prompt' || updates.type === 'agent') && !supportsPromptType(event)) {
      errors.push(`Type "${updates.type}" is only supported for ${PROMPT_SUPPORTED_EVENTS.join(' and ')} events`);
    }
  }

  // Validate command update (for command-type hooks)
  if (updates.command !== undefined) {
    const effectiveType = updates.type || existingHook?.type || 'command';
    if (effectiveType === 'command') {
      if (typeof updates.command !== 'string' || updates.command.trim() === '') {
        errors.push('Command cannot be empty for command-type hooks');
      }
    }
  }

  // Validate url update (for http-type hooks)
  if (updates.url !== undefined) {
    const effectiveType = updates.type || existingHook?.type || 'command';
    if (effectiveType === 'http') {
      if (typeof updates.url !== 'string' || updates.url.trim() === '') {
        errors.push('URL cannot be empty for http-type hooks');
      }
    }
  }

  // Validate prompt update (for prompt/agent-type hooks)
  if (updates.prompt !== undefined) {
    const effectiveType = updates.type || existingHook?.type || 'command';
    if (effectiveType === 'prompt' || effectiveType === 'agent') {
      if (typeof updates.prompt !== 'string' || updates.prompt.trim() === '') {
        errors.push('Prompt cannot be empty for prompt/agent-type hooks');
      }
    }
  }

  // Validate common optional fields present in updates
  const commonErrors = validateCommonFields(updates);
  errors.push(...commonErrors);

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get default values for optional hook fields
 *
 * @param {string} type - Hook type (command, http, prompt, agent)
 * @returns {Object} Default hook field values
 */
function getHookDefaults(type = 'command') {
  return {
    type: type,
    enabled: true,
    suppressOutput: false,
    continue: true,
    timeout: (DEFAULT_TIMEOUTS[type] || 30) * 1000
  };
}

module.exports = {
  // Constants
  VALID_HOOK_EVENTS,
  MATCHER_BASED_EVENTS,
  PROMPT_SUPPORTED_EVENTS,
  VALID_HOOK_TYPES,
  DEFAULT_TIMEOUTS,
  VALID_SHELLS,

  // Functions
  isMatcherBasedEvent,
  supportsPromptType,
  validateHook,
  validateHookUpdate,
  validateTypeSpecificFields,
  validateCommonFields,
  getHookDefaults
};
