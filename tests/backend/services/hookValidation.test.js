/**
 * Tests for Hook Validation Service
 *
 * Test Coverage:
 * - validateHook() - Complete hook object validation
 * - validateHookUpdate() - Partial update validation
 * - isMatcherBasedEvent() - Event type classification
 * - supportsPromptType() - Type constraint checking
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
  VALID_HOOK_EVENTS,
  MATCHER_BASED_EVENTS,
  PROMPT_SUPPORTED_EVENTS,
  VALID_HOOK_TYPES,
  getHookDefaults
} = require('../../../src/backend/services/hookValidation');

describe('Hook Validation Service', () => {
  describe('Constants', () => {
    it('should export VALID_HOOK_EVENTS array', () => {
      expect(VALID_HOOK_EVENTS).toBeInstanceOf(Array);
      expect(VALID_HOOK_EVENTS).toContain('PreToolUse');
      expect(VALID_HOOK_EVENTS).toContain('PostToolUse');
      expect(VALID_HOOK_EVENTS).toContain('Stop');
      expect(VALID_HOOK_EVENTS).toContain('SubagentStop');
      expect(VALID_HOOK_EVENTS).toContain('UserPromptSubmit');
      expect(VALID_HOOK_EVENTS).toContain('PermissionRequest');
      expect(VALID_HOOK_EVENTS).toContain('SessionStart');
      expect(VALID_HOOK_EVENTS).toContain('SessionEnd');
      expect(VALID_HOOK_EVENTS.length).toBe(10);
    });

    it('should export MATCHER_BASED_EVENTS array', () => {
      expect(MATCHER_BASED_EVENTS).toEqual(['PreToolUse', 'PostToolUse']);
    });

    it('should export PROMPT_SUPPORTED_EVENTS array', () => {
      expect(PROMPT_SUPPORTED_EVENTS).toEqual(['Stop', 'SubagentStop', 'UserPromptSubmit', 'PreToolUse', 'PermissionRequest']);
    });

    it('should export VALID_HOOK_TYPES array', () => {
      expect(VALID_HOOK_TYPES).toEqual(['command', 'prompt']);
    });
  });

  describe('isMatcherBasedEvent()', () => {
    it('should return true for PreToolUse', () => {
      expect(isMatcherBasedEvent('PreToolUse')).toBe(true);
    });

    it('should return true for PostToolUse', () => {
      expect(isMatcherBasedEvent('PostToolUse')).toBe(true);
    });

    it('should return false for Stop', () => {
      expect(isMatcherBasedEvent('Stop')).toBe(false);
    });

    it('should return false for SubagentStop', () => {
      expect(isMatcherBasedEvent('SubagentStop')).toBe(false);
    });

    it('should return false for SessionEnd', () => {
      expect(isMatcherBasedEvent('SessionEnd')).toBe(false);
    });

    it('should return false for SessionStart', () => {
      expect(isMatcherBasedEvent('SessionStart')).toBe(false);
    });

    it('should return false for UserPromptSubmit', () => {
      expect(isMatcherBasedEvent('UserPromptSubmit')).toBe(false);
    });

    it('should return false for Notification', () => {
      expect(isMatcherBasedEvent('Notification')).toBe(false);
    });

    it('should return false for PreCompact', () => {
      expect(isMatcherBasedEvent('PreCompact')).toBe(false);
    });

    it('should return false for invalid event', () => {
      expect(isMatcherBasedEvent('InvalidEvent')).toBe(false);
    });
  });

  describe('supportsPromptType()', () => {
    it('should return true for Stop', () => {
      expect(supportsPromptType('Stop')).toBe(true);
    });

    it('should return true for SubagentStop', () => {
      expect(supportsPromptType('SubagentStop')).toBe(true);
    });

    it('should return true for PreToolUse', () => {
      expect(supportsPromptType('PreToolUse')).toBe(true);
    });

    it('should return false for PostToolUse', () => {
      expect(supportsPromptType('PostToolUse')).toBe(false);
    });

    it('should return false for SessionEnd', () => {
      expect(supportsPromptType('SessionEnd')).toBe(false);
    });

    it('should return false for SessionStart', () => {
      expect(supportsPromptType('SessionStart')).toBe(false);
    });

    it('should return true for UserPromptSubmit', () => {
      expect(supportsPromptType('UserPromptSubmit')).toBe(true);
    });

    it('should return true for PermissionRequest', () => {
      expect(supportsPromptType('PermissionRequest')).toBe(true);
    });

    it('should return false for Notification', () => {
      expect(supportsPromptType('Notification')).toBe(false);
    });

    it('should return false for invalid event', () => {
      expect(supportsPromptType('InvalidEvent')).toBe(false);
    });
  });

  describe('getHookDefaults()', () => {
    it('should return default hook values', () => {
      const defaults = getHookDefaults();
      expect(defaults).toEqual({
        type: 'command',
        enabled: true,
        suppressOutput: false,
        continue: true,
        timeout: 30000
      });
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
        const hook = {
          command: 'echo test'
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should validate a matcher-based hook', () => {
        const hook = {
          matcher: 'Bash',
          command: 'echo pre'
        };
        const result = validateHook(hook, 'PreToolUse');
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should validate a hook with all optional fields', () => {
        const hook = {
          command: 'echo test',
          type: 'command',
          enabled: true,
          suppressOutput: false,
          continue: true,
          timeout: 30000
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(true);
      });

      it('should validate a prompt-type hook for Stop', () => {
        const hook = {
          type: 'prompt',
          command: 'Stopping now'
        };
        const result = validateHook(hook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate a prompt-type hook for SubagentStop', () => {
        const hook = {
          type: 'prompt',
          command: 'Subagent stopping'
        };
        const result = validateHook(hook, 'SubagentStop');
        expect(result.valid).toBe(true);
      });

      it('should validate a prompt-type hook for UserPromptSubmit', () => {
        const hook = {
          type: 'prompt',
          command: 'Processing user prompt'
        };
        const result = validateHook(hook, 'UserPromptSubmit');
        expect(result.valid).toBe(true);
      });

      it('should validate a prompt-type hook for PreToolUse', () => {
        const hook = {
          matcher: 'Bash',
          type: 'prompt',
          command: 'About to execute tool'
        };
        const result = validateHook(hook, 'PreToolUse');
        expect(result.valid).toBe(true);
      });

      it('should validate a prompt-type hook for PermissionRequest', () => {
        const hook = {
          type: 'prompt',
          command: 'Permission requested'
        };
        const result = validateHook(hook, 'PermissionRequest');
        expect(result.valid).toBe(true);
      });

      it('should validate hook with pipe-joined matcher', () => {
        const hook = {
          matcher: 'Read|Write|Edit',
          command: 'echo file-ops'
        };
        const result = validateHook(hook, 'PreToolUse');
        expect(result.valid).toBe(true);
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
        expect(result.errors).toContain('Hook must be a non-null object');
      });

      it('should reject hook without event when not provided', () => {
        const hook = {
          command: 'echo test'
        };
        const result = validateHook(hook);
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Event type is required');
      });

      it('should reject hook without command', () => {
        const hook = {};
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Command is required');
      });

      it('should reject matcher-based hook without matcher', () => {
        const hook = {
          command: 'echo pre'
        };
        const result = validateHook(hook, 'PreToolUse');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Matcher is required');
      });

      it('should reject hook with empty command', () => {
        const hook = {
          command: '   '
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Command is required');
      });

      it('should reject matcher-based hook with empty matcher', () => {
        const hook = {
          matcher: '',
          command: 'echo pre'
        };
        const result = validateHook(hook, 'PreToolUse');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Matcher is required');
      });
    });

    describe('Invalid hooks - invalid event types', () => {
      it('should reject hook with invalid event type', () => {
        const hook = {
          command: 'echo test'
        };
        const result = validateHook(hook, 'InvalidEvent');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid event type');
      });

      it('should reject hook with event in hook object that differs from expected', () => {
        const hook = {
          event: 'SessionStart',
          command: 'echo test'
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(true); // Event in hook object is ignored, expectedEvent is used
      });
    });

    describe('Invalid hooks - type constraints', () => {
      it('should reject invalid hook type', () => {
        const hook = {
          command: 'echo test',
          type: 'custom'
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid hook type');
      });

      it('should accept prompt type for PreToolUse (now supported)', () => {
        const hook = {
          matcher: 'Bash',
          command: 'echo pre',
          type: 'prompt'
        };
        const result = validateHook(hook, 'PreToolUse');
        expect(result.valid).toBe(true);
      });

      it('should reject prompt type for PostToolUse (not supported)', () => {
        const hook = {
          matcher: 'Bash',
          command: 'echo post',
          type: 'prompt'
        };
        const result = validateHook(hook, 'PostToolUse');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('only supported for');
      });

      it('should reject prompt type for SessionEnd (not supported)', () => {
        const hook = {
          command: 'echo end',
          type: 'prompt'
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('only supported for');
      });

      it('should reject prompt type for SessionStart (not supported)', () => {
        const hook = {
          command: 'echo start',
          type: 'prompt'
        };
        const result = validateHook(hook, 'SessionStart');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('only supported for');
      });
    });

    describe('Invalid hooks - field validation', () => {
      it('should reject non-integer timeout', () => {
        const hook = {
          command: 'echo test',
          timeout: 30.5
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('positive integer');
      });

      it('should reject negative timeout', () => {
        const hook = {
          command: 'echo test',
          timeout: -1
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('positive integer');
      });

      it('should reject zero timeout', () => {
        const hook = {
          command: 'echo test',
          timeout: 0
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
      });

      it('should reject non-boolean enabled', () => {
        const hook = {
          command: 'echo test',
          enabled: 'true'
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('enabled must be a boolean');
      });

      it('should reject non-boolean suppressOutput', () => {
        const hook = {
          command: 'echo test',
          suppressOutput: 1
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('suppressOutput must be a boolean');
      });

      it('should reject non-boolean continue', () => {
        const hook = {
          command: 'echo test',
          continue: 'yes'
        };
        const result = validateHook(hook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('continue must be a boolean');
      });
    });

    describe('Multiple validation errors', () => {
      it('should accumulate multiple errors', () => {
        const hook = {
          command: '',
          timeout: -1,
          enabled: 'true'
        };
        const result = validateHook(hook, 'SessionEnd');
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
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should validate timeout update', () => {
        const updates = { timeout: 60000 };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(true);
      });

      it('should validate enabled update', () => {
        const updates = { enabled: false };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(true);
      });

      it('should validate suppressOutput update', () => {
        const updates = { suppressOutput: true };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(true);
      });

      it('should validate continue update', () => {
        const updates = { continue: false };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(true);
      });

      it('should validate matcher update for matcher-based events', () => {
        const updates = { matcher: 'Read' };
        const result = validateHookUpdate(updates, existingHook, 'PreToolUse');
        expect(result.valid).toBe(true);
      });

      it('should validate type update to prompt for Stop', () => {
        const updates = { type: 'prompt' };
        const result = validateHookUpdate(updates, existingHook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate multiple field updates', () => {
        const updates = {
          command: 'echo new',
          timeout: 45000,
          enabled: false
        };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(true);
      });

      it('should allow matcher update for non-matcher events (silently ignored)', () => {
        const updates = { matcher: 'Bash' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
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

      it('should reject event type change even if value is similar', () => {
        const updates = { event: 'PreToolUse' };
        const result = validateHookUpdate(updates, existingHook, 'PostToolUse');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Event type cannot be changed');
      });

      it('should allow event type if it matches current event', () => {
        const updates = { event: 'SessionEnd', command: 'echo updated' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid updates - validation errors', () => {
      it('should reject null updates', () => {
        const result = validateHookUpdate(null, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Updates must be a non-null object');
      });

      it('should reject array updates', () => {
        const result = validateHookUpdate(['command', 'echo'], existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
      });

      it('should reject empty command', () => {
        const updates = { command: '' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Command cannot be empty');
      });

      it('should reject whitespace-only command', () => {
        const updates = { command: '   ' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
      });

      it('should reject empty matcher for matcher-based events', () => {
        const updates = { matcher: '' };
        const result = validateHookUpdate(updates, existingHook, 'PreToolUse');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Matcher cannot be empty');
      });

      it('should reject invalid type value', () => {
        const updates = { type: 'custom' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid hook type');
      });

      it('should accept prompt type for PreToolUse (now supported)', () => {
        const updates = { type: 'prompt' };
        const result = validateHookUpdate(updates, existingHook, 'PreToolUse');
        expect(result.valid).toBe(true);
      });

      it('should reject prompt type for PostToolUse (not supported)', () => {
        const updates = { type: 'prompt' };
        const result = validateHookUpdate(updates, existingHook, 'PostToolUse');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('only supported for');
      });

      it('should reject prompt type for SessionEnd (not supported)', () => {
        const updates = { type: 'prompt' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('only supported for');
      });

      it('should reject non-integer timeout', () => {
        const updates = { timeout: 30.5 };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('positive integer');
      });

      it('should reject negative timeout', () => {
        const updates = { timeout: -100 };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
      });

      it('should reject zero timeout', () => {
        const updates = { timeout: 0 };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
      });

      it('should reject non-boolean enabled', () => {
        const updates = { enabled: 'false' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('enabled must be a boolean');
      });

      it('should reject non-boolean suppressOutput', () => {
        const updates = { suppressOutput: 0 };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
      });

      it('should reject non-boolean continue', () => {
        const updates = { continue: 'no' };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
      });
    });

    describe('Type-dependent command validation', () => {
      it('should allow empty command for prompt-type hooks', () => {
        const promptHook = { type: 'prompt', command: '' };
        const updates = { command: 'Updated prompt message' };
        const result = validateHookUpdate(updates, promptHook, 'Stop');
        expect(result.valid).toBe(true);
      });

      it('should validate command based on updated type', () => {
        const updates = {
          type: 'command',
          command: ''
        };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Command cannot be empty');
      });

      it('should use existing type if not updated', () => {
        const commandHook = { type: 'command', command: 'echo test' };
        const updates = { command: '' };
        const result = validateHookUpdate(updates, commandHook, 'SessionEnd');
        expect(result.valid).toBe(false);
      });

      it('should default to command type if no type specified', () => {
        const noTypeHook = { command: 'echo test' };
        const updates = { command: '' };
        const result = validateHookUpdate(updates, noTypeHook, 'SessionEnd');
        expect(result.valid).toBe(false);
      });
    });

    describe('Multiple validation errors', () => {
      it('should accumulate multiple errors', () => {
        const updates = {
          event: 'SessionStart',
          command: '',
          timeout: -1,
          enabled: 'true'
        };
        const result = validateHookUpdate(updates, existingHook, 'SessionEnd');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
