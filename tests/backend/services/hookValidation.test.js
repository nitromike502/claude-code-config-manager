/**
 * Tests for Hook Validation Service
 *
 * Test Coverage:
 * - validateHook() - Complete hook object validation
 * - validateHookUpdate() - Partial update validation
 * - isMatcherBasedEvent() - Event type classification
 * - supportsPromptType() - Type constraint checking
 * - validateTypeSpecificFields() - Type-specific field validation
 * - validateCommonFields() - Common field validation
 * - getHookDefaults() - Default values per type
 *
 * Testing Strategy:
 * - Unit tests for validation logic
 * - No mocking needed (pure functions)
 * - Test all valid/invalid input combinations
 * - Verify error messages are actionable
 */

const {
  validateHook,
  validateHookUpdate,
  isMatcherBasedEvent,
  supportsPromptType,
  validateTypeSpecificFields,
  validateCommonFields,
  VALID_HOOK_EVENTS,
  MATCHER_BASED_EVENTS,
  PROMPT_SUPPORTED_EVENTS,
  VALID_HOOK_TYPES,
  DEFAULT_TIMEOUTS,
  VALID_SHELLS,
  getHookDefaults
} = require('../../../src/backend/services/hookValidation');

describe('Hook Validation Service', () => {
  describe('Constants', () => {
    it('should export VALID_HOOK_EVENTS with 26 events', () => {
      expect(VALID_HOOK_EVENTS).toBeInstanceOf(Array);
      expect(VALID_HOOK_EVENTS.length).toBe(26);
      expect(VALID_HOOK_EVENTS).toContain('PreToolUse');
      expect(VALID_HOOK_EVENTS).toContain('PostToolUse');
      expect(VALID_HOOK_EVENTS).toContain('PostToolUseFailure');
      expect(VALID_HOOK_EVENTS).toContain('Stop');
      expect(VALID_HOOK_EVENTS).toContain('SubagentStop');
      expect(VALID_HOOK_EVENTS).toContain('SubagentStart');
      expect(VALID_HOOK_EVENTS).toContain('UserPromptSubmit');
      expect(VALID_HOOK_EVENTS).toContain('PermissionRequest');
      expect(VALID_HOOK_EVENTS).toContain('SessionStart');
      expect(VALID_HOOK_EVENTS).toContain('SessionEnd');
      expect(VALID_HOOK_EVENTS).toContain('InstructionsLoaded');
      expect(VALID_HOOK_EVENTS).toContain('StopFailure');
      expect(VALID_HOOK_EVENTS).toContain('ConfigChange');
      expect(VALID_HOOK_EVENTS).toContain('FileChanged');
      expect(VALID_HOOK_EVENTS).toContain('PostCompact');
      expect(VALID_HOOK_EVENTS).toContain('Elicitation');
      expect(VALID_HOOK_EVENTS).toContain('ElicitationResult');
      expect(VALID_HOOK_EVENTS).toContain('TaskCreated');
      expect(VALID_HOOK_EVENTS).toContain('TaskCompleted');
      expect(VALID_HOOK_EVENTS).toContain('TeammateIdle');
      expect(VALID_HOOK_EVENTS).toContain('CwdChanged');
      expect(VALID_HOOK_EVENTS).toContain('WorktreeCreate');
      expect(VALID_HOOK_EVENTS).toContain('WorktreeRemove');
      expect(VALID_HOOK_EVENTS).toContain('Setup');
    });

    it('should export MATCHER_BASED_EVENTS with 17 events', () => {
      expect(MATCHER_BASED_EVENTS).toBeInstanceOf(Array);
      expect(MATCHER_BASED_EVENTS).toHaveLength(17);
      expect(MATCHER_BASED_EVENTS).toContain('Notification');
      expect(MATCHER_BASED_EVENTS).toContain('SubagentStop');
      expect(MATCHER_BASED_EVENTS).toContain('SessionStart');
      expect(MATCHER_BASED_EVENTS).toContain('SessionEnd');
      expect(MATCHER_BASED_EVENTS).toContain('PreCompact');
    });

    it('should export PROMPT_SUPPORTED_EVENTS array', () => {
      expect(PROMPT_SUPPORTED_EVENTS).toContain('PreToolUse');
      expect(PROMPT_SUPPORTED_EVENTS).toContain('PermissionRequest');
      expect(PROMPT_SUPPORTED_EVENTS).toContain('UserPromptSubmit');
      expect(PROMPT_SUPPORTED_EVENTS).toContain('Stop');
      expect(PROMPT_SUPPORTED_EVENTS).toContain('SubagentStop');
    });

    it('should export VALID_HOOK_TYPES with 4 types', () => {
      expect(VALID_HOOK_TYPES).toEqual(['command', 'http', 'prompt', 'agent']);
    });

    it('should export DEFAULT_TIMEOUTS per type', () => {
      expect(DEFAULT_TIMEOUTS).toEqual({
        command: 600,
        http: 30,
        prompt: 30,
        agent: 60
      });
    });

    it('should export VALID_SHELLS', () => {
      expect(VALID_SHELLS).toEqual(['bash', 'powershell']);
    });
  });

  describe('isMatcherBasedEvent()', () => {
    it('should return true for matcher-based events', () => {
      expect(isMatcherBasedEvent('PreToolUse')).toBe(true);
      expect(isMatcherBasedEvent('PostToolUse')).toBe(true);
      expect(isMatcherBasedEvent('Notification')).toBe(true);
      expect(isMatcherBasedEvent('SubagentStop')).toBe(true);
      expect(isMatcherBasedEvent('SessionStart')).toBe(true);
      expect(isMatcherBasedEvent('SessionEnd')).toBe(true);
      expect(isMatcherBasedEvent('PreCompact')).toBe(true);
      expect(isMatcherBasedEvent('ConfigChange')).toBe(true);
    });

    it('should return false for non-matcher events', () => {
      expect(isMatcherBasedEvent('Stop')).toBe(false);
      expect(isMatcherBasedEvent('UserPromptSubmit')).toBe(false);
      expect(isMatcherBasedEvent('CwdChanged')).toBe(false);
      expect(isMatcherBasedEvent('Setup')).toBe(false);
    });

    it('should return false for invalid event', () => {
      expect(isMatcherBasedEvent('InvalidEvent')).toBe(false);
    });
  });

  describe('supportsPromptType()', () => {
    it('should return true for prompt-supported events', () => {
      expect(supportsPromptType('Stop')).toBe(true);
      expect(supportsPromptType('SubagentStop')).toBe(true);
      expect(supportsPromptType('PreToolUse')).toBe(true);
      expect(supportsPromptType('UserPromptSubmit')).toBe(true);
      expect(supportsPromptType('PermissionRequest')).toBe(true);
    });

    it('should return false for non-prompt events', () => {
      expect(supportsPromptType('PostToolUse')).toBe(false);
      expect(supportsPromptType('SessionEnd')).toBe(false);
      expect(supportsPromptType('SessionStart')).toBe(false);
      expect(supportsPromptType('Notification')).toBe(false);
      expect(supportsPromptType('Setup')).toBe(false);
    });

    it('should return false for invalid event', () => {
      expect(supportsPromptType('InvalidEvent')).toBe(false);
    });
  });

  describe('validateTypeSpecificFields()', () => {
    it('should require command for command type', () => {
      const errors = validateTypeSpecificFields({}, 'command');
      expect(errors).toContain('Command is required for command-type hooks');
    });

    it('should accept valid command', () => {
      const errors = validateTypeSpecificFields({ command: 'echo test' }, 'command');
      expect(errors).toEqual([]);
    });

    it('should require url for http type', () => {
      const errors = validateTypeSpecificFields({}, 'http');
      expect(errors).toContain('URL is required for http-type hooks');
    });

    it('should accept valid url', () => {
      const errors = validateTypeSpecificFields({ url: 'https://example.com/hook' }, 'http');
      expect(errors).toEqual([]);
    });

    it('should require prompt for prompt type', () => {
      const errors = validateTypeSpecificFields({}, 'prompt');
      expect(errors).toContain('Prompt is required for prompt-type hooks');
    });

    it('should accept valid prompt', () => {
      const errors = validateTypeSpecificFields({ prompt: 'Check this code' }, 'prompt');
      expect(errors).toEqual([]);
    });

    it('should require prompt for agent type', () => {
      const errors = validateTypeSpecificFields({}, 'agent');
      expect(errors).toContain('Prompt is required for agent-type hooks');
    });

    it('should accept valid agent prompt', () => {
      const errors = validateTypeSpecificFields({ prompt: 'Review the changes' }, 'agent');
      expect(errors).toEqual([]);
    });
  });

  describe('validateCommonFields()', () => {
    it('should accept valid common fields', () => {
      const errors = validateCommonFields({
        if: 'git diff --cached',
        statusMessage: 'Running checks...',
        once: true,
        async: false,
        shell: 'bash'
      });
      expect(errors).toEqual([]);
    });

    it('should reject non-string if field', () => {
      const errors = validateCommonFields({ if: 123 });
      expect(errors).toContain('if must be a string');
    });

    it('should reject non-string statusMessage', () => {
      const errors = validateCommonFields({ statusMessage: true });
      expect(errors).toContain('statusMessage must be a string');
    });

    it('should reject non-boolean once', () => {
      const errors = validateCommonFields({ once: 'yes' });
      expect(errors).toContain('once must be a boolean value');
    });

    it('should reject non-boolean async', () => {
      const errors = validateCommonFields({ async: 1 });
      expect(errors).toContain('async must be a boolean value');
    });

    it('should reject invalid shell value', () => {
      const errors = validateCommonFields({ shell: 'zsh' });
      expect(errors[0]).toContain('shell must be one of');
    });

    it('should reject non-string shell', () => {
      const errors = validateCommonFields({ shell: 123 });
      expect(errors[0]).toContain('shell must be one of');
    });
  });

  describe('getHookDefaults()', () => {
    it('should return default command hook values', () => {
      const defaults = getHookDefaults();
      expect(defaults).toEqual({
        type: 'command',
        enabled: true,
        suppressOutput: false,
        continue: true,
        timeout: 600000
      });
    });

    it('should return correct timeout for http type', () => {
      const defaults = getHookDefaults('http');
      expect(defaults.type).toBe('http');
      expect(defaults.timeout).toBe(30000);
    });

    it('should return correct timeout for prompt type', () => {
      const defaults = getHookDefaults('prompt');
      expect(defaults.type).toBe('prompt');
      expect(defaults.timeout).toBe(30000);
    });

    it('should return correct timeout for agent type', () => {
      const defaults = getHookDefaults('agent');
      expect(defaults.type).toBe('agent');
      expect(defaults.timeout).toBe(60000);
    });

    it('should return a new object each time', () => {
      const defaults1 = getHookDefaults();
      const defaults2 = getHookDefaults();
      expect(defaults1).not.toBe(defaults2);
      expect(defaults1).toEqual(defaults2);
    });
  });

  describe('validateHook()', () => {
    describe('Valid hooks', () => {
      it('should validate a minimal command hook', () => {
        const hook = { command: 'echo test' };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should validate a matcher-based hook', () => {
        const hook = { matcher: 'Bash', command: 'echo pre' };
        const result = validateHook(hook, 'PreToolUse');
        expect(result.valid).toBe(true);
      });

      it('should validate an http-type hook', () => {
        const hook = { type: 'http', url: 'https://example.com/hook' };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate a prompt-type hook', () => {
        const hook = { type: 'prompt', prompt: 'Check this code' };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate an agent-type hook', () => {
        const hook = { type: 'agent', prompt: 'Review changes' };
        const result = validateHook(hook, 'UserPromptSubmit');
        expect(result.valid).toBe(true);
      });

      it('should validate a hook with all common fields', () => {
        const hook = {
          command: 'echo test',
          if: 'git diff --cached',
          statusMessage: 'Running...',
          once: true,
          async: false,
          shell: 'bash',
          timeout: 5000
        };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate a prompt-type hook for SubagentStop', () => {
        const hook = { matcher: 'general-purpose', type: 'prompt', prompt: 'Subagent stopping' };
        const result = validateHook(hook, 'SubagentStop');
        expect(result.valid).toBe(true);
      });

      it('should validate a hook with pipe-joined matcher', () => {
        const hook = { matcher: 'Read|Write|Edit', command: 'echo file-ops' };
        const result = validateHook(hook, 'PreToolUse');
        expect(result.valid).toBe(true);
      });

      it('should validate hooks for new events', () => {
        expect(validateHook({ command: 'echo' }, 'TaskCreated').valid).toBe(true);
        expect(validateHook({ command: 'echo' }, 'CwdChanged').valid).toBe(true);
        expect(validateHook({ command: 'echo' }, 'Setup').valid).toBe(true);
        expect(validateHook({ matcher: 'manual', command: 'echo' }, 'PostCompact').valid).toBe(true);
        expect(validateHook({ matcher: 'rate_limit', command: 'echo' }, 'StopFailure').valid).toBe(true);
      });
    });

    describe('Invalid hooks - missing fields', () => {
      it('should reject null hook', () => {
        const result = validateHook(null, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Hook must be a non-null object');
      });

      it('should reject array instead of object', () => {
        const result = validateHook(['command', 'echo test'], 'SessionEnd');
        expect(result.valid).toBe(false);
      });

      it('should reject hook without event when not provided', () => {
        const hook = { command: 'echo test' };
        const result = validateHook(hook);
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Event type is required');
      });

      it('should reject command hook without command', () => {
        const hook = {};
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Command is required for command-type hooks');
      });

      it('should reject http hook without url', () => {
        const hook = { type: 'http' };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('URL is required for http-type hooks');
      });

      it('should reject prompt hook without prompt', () => {
        const hook = { type: 'prompt' };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Prompt is required for prompt-type hooks');
      });

      it('should reject agent hook without prompt', () => {
        const hook = { type: 'agent' };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Prompt is required for agent-type hooks');
      });

      it('should reject matcher-based hook without matcher', () => {
        const hook = { command: 'echo pre' };
        const result = validateHook(hook, 'PreToolUse');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Matcher is required');
      });
    });

    describe('Invalid hooks - type constraints', () => {
      it('should reject invalid hook type', () => {
        const hook = { command: 'echo test', type: 'custom' };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid hook type');
      });

      it('should reject prompt type for PostToolUse (not supported)', () => {
        const hook = { matcher: 'Bash', prompt: 'check', type: 'prompt' };
        const result = validateHook(hook, 'PostToolUse');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('only supported for');
      });

      it('should reject agent type for SessionEnd (not supported)', () => {
        const hook = { matcher: 'clear', prompt: 'cleanup', type: 'agent' };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('only supported for');
      });
    });

    describe('Invalid hooks - common field validation', () => {
      it('should reject non-integer timeout', () => {
        const hook = { command: 'echo test', timeout: 30.5 };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Timeout must be a positive integer (milliseconds)');
      });

      it('should reject negative timeout', () => {
        const hook = { command: 'echo test', timeout: -1 };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
      });

      it('should reject non-boolean enabled', () => {
        const hook = { command: 'echo test', enabled: 'true' };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('enabled must be a boolean value');
      });

      it('should reject non-boolean suppressOutput', () => {
        const hook = { command: 'echo test', suppressOutput: 1 };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('suppressOutput must be a boolean value');
      });

      it('should reject invalid shell', () => {
        const hook = { command: 'echo test', shell: 'zsh' };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
      });
    });

    describe('Multiple validation errors', () => {
      it('should accumulate multiple errors', () => {
        const hook = { command: '', timeout: -1, enabled: 'true' };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
      });
    });
  });

  describe('validateHookUpdate()', () => {
    const existingHook = {
      command: 'echo test',
      enabled: true,
      timeout: 30000
    };

    describe('Valid updates', () => {
      it('should validate command update', () => {
        const updates = { command: 'echo updated' };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate timeout update', () => {
        const updates = { timeout: 60000 };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate type update to http', () => {
        const updates = { type: 'http' };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate type update to prompt for Stop', () => {
        const updates = { type: 'prompt' };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate type update to agent for SubagentStop', () => {
        const updates = { type: 'agent' };
        const result = validateHookUpdate(updates, existingHook, 'SubagentStop');
        expect(result.valid).toBe(true);
      });

      it('should validate common field updates', () => {
        const updates = { if: 'git status', statusMessage: 'Checking...', once: true };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate multiple field updates', () => {
        const updates = { command: 'echo new', timeout: 45000, enabled: false };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should allow matcher update for non-matcher events (silently ignored)', () => {
        const updates = { matcher: 'Bash' };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid updates - readonly fields', () => {
      it('should reject event type change', () => {
        const updates = { event: 'SessionStart' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Event type cannot be changed');
      });

      it('should allow event type if it matches current event', () => {
        const updates = { event: 'Stop', command: 'echo updated' };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid updates - validation errors', () => {
      it('should reject null updates', () => {
        const result = validateHookUpdate(null, existingHook, 'Stop');
        expect(result.valid).toBe(false);
      });

      it('should reject empty command', () => {
        const updates = { command: '' };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Command cannot be empty');
      });

      it('should reject empty url for http-type hooks', () => {
        const httpHook = { type: 'http', url: 'https://example.com' };
        const updates = { url: '' };
        const result = validateHookUpdate(updates, httpHook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('URL cannot be empty');
      });

      it('should reject empty prompt for prompt-type hooks', () => {
        const promptHook = { type: 'prompt', prompt: 'Check this' };
        const updates = { prompt: '' };
        const result = validateHookUpdate(updates, promptHook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Prompt cannot be empty');
      });

      it('should reject empty matcher for matcher-based events', () => {
        const updates = { matcher: '' };
        const result = validateHookUpdate(updates, existingHook, 'PreToolUse');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Matcher cannot be empty');
      });

      it('should reject invalid type value', () => {
        const updates = { type: 'custom' };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid hook type');
      });

      it('should reject prompt type for PostToolUse', () => {
        const updates = { type: 'prompt' };
        const result = validateHookUpdate(updates, existingHook, 'PostToolUse');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('only supported for');
      });

      it('should reject agent type for SessionEnd', () => {
        const updates = { type: 'agent' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('only supported for');
      });

      it('should reject non-integer timeout', () => {
        const updates = { timeout: 30.5 };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(false);
      });

      it('should reject invalid common fields in updates', () => {
        const updates = { shell: 'zsh' };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(false);
      });
    });

    describe('Type-dependent command validation', () => {
      it('should validate command based on updated type', () => {
        const updates = { type: 'command', command: '' };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Command cannot be empty');
      });

      it('should use existing type if not updated', () => {
        const commandHook = { type: 'command', command: 'echo test' };
        const updates = { command: '' };
        const result = validateHookUpdate(updates, commandHook, 'Stop');
        expect(result.valid).toBe(false);
      });

      it('should default to command type if no type specified', () => {
        const noTypeHook = { command: 'echo test' };
        const updates = { command: '' };
        const result = validateHookUpdate(updates, noTypeHook, 'Stop');
        expect(result.valid).toBe(false);
      });
    });

    describe('Multiple validation errors', () => {
      it('should accumulate multiple errors', () => {
        const updates = { event: 'SessionStart', command: '', timeout: -1, enabled: 'true' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
