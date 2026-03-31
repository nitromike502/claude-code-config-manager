/**
 * Tests for centralized hook events configuration module
 */

const {
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
} = require('../../../src/backend/config/hooks');

describe('Hook Events Configuration', () => {
  // All 27 events
  const ALL_EVENTS = [
    'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest',
    'Notification', 'SubagentStart', 'SubagentStop', 'SessionStart',
    'SessionEnd', 'InstructionsLoaded', 'StopFailure', 'ConfigChange',
    'FileChanged', 'PreCompact', 'PostCompact', 'Elicitation', 'ElicitationResult',
    'UserPromptSubmit', 'Stop', 'TaskCreated', 'TaskCompleted', 'TeammateIdle',
    'CwdChanged', 'WorktreeCreate', 'WorktreeRemove', 'Setup'
  ];

  // 17 matcher-based events
  const MATCHER_EVENTS = [
    'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest',
    'Notification', 'SubagentStart', 'SubagentStop', 'SessionStart',
    'SessionEnd', 'InstructionsLoaded', 'StopFailure', 'ConfigChange',
    'FileChanged', 'PreCompact', 'PostCompact', 'Elicitation', 'ElicitationResult'
  ];

  // 10 non-matcher events
  const NON_MATCHER_EVENTS = [
    'UserPromptSubmit', 'Stop', 'TaskCreated', 'TaskCompleted', 'TeammateIdle',
    'CwdChanged', 'WorktreeCreate', 'WorktreeRemove', 'Setup'
  ];

  // Events that support prompts
  const PROMPT_EVENTS = [
    'PreToolUse', 'PermissionRequest', 'SubagentStop',
    'UserPromptSubmit', 'Stop'
  ];

  // Events that can block
  const BLOCKING_EVENTS = [
    'PreToolUse', 'PermissionRequest', 'SubagentStop', 'ConfigChange',
    'Elicitation', 'ElicitationResult',
    'UserPromptSubmit', 'Stop', 'TaskCreated', 'TaskCompleted',
    'TeammateIdle', 'WorktreeCreate'
  ];

  describe('HOOK_EVENTS object', () => {
    it('should contain all 26 hook events', () => {
      const events = Object.keys(HOOK_EVENTS);
      expect(events).toHaveLength(26);
      ALL_EVENTS.forEach(event => {
        expect(events).toContain(event);
      });
    });

    it('should have hasMatcher, matcherValues, canBlock, and supportsPrompt for each event', () => {
      Object.entries(HOOK_EVENTS).forEach(([event, metadata]) => {
        expect(metadata).toHaveProperty('hasMatcher');
        expect(metadata).toHaveProperty('matcherValues');
        expect(metadata).toHaveProperty('canBlock');
        expect(metadata).toHaveProperty('supportsPrompt');
        expect(typeof metadata.hasMatcher).toBe('boolean');
        expect(Array.isArray(metadata.matcherValues)).toBe(true);
        expect(typeof metadata.canBlock).toBe('boolean');
        expect(typeof metadata.supportsPrompt).toBe('boolean');
      });
    });

    describe('matcher-based events', () => {
      it('PreToolUse should support matchers, blocking, and prompts', () => {
        expect(HOOK_EVENTS.PreToolUse.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.PreToolUse.canBlock).toBe(true);
        expect(HOOK_EVENTS.PreToolUse.supportsPrompt).toBe(true);
        expect(HOOK_EVENTS.PreToolUse.matcherValues).toContain('Bash');
      });

      it('PostToolUse should support matchers but not blocking or prompts', () => {
        expect(HOOK_EVENTS.PostToolUse.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.PostToolUse.canBlock).toBe(false);
        expect(HOOK_EVENTS.PostToolUse.supportsPrompt).toBe(false);
      });

      it('PostToolUseFailure should support matchers', () => {
        expect(HOOK_EVENTS.PostToolUseFailure.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.PostToolUseFailure.matcherValues).toContain('Bash');
      });

      it('PermissionRequest should support matchers, blocking, and prompts', () => {
        expect(HOOK_EVENTS.PermissionRequest.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.PermissionRequest.canBlock).toBe(true);
        expect(HOOK_EVENTS.PermissionRequest.supportsPrompt).toBe(true);
      });

      it('Notification should support matchers (fixed from no-matcher)', () => {
        expect(HOOK_EVENTS.Notification.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.Notification.matcherValues).toContain('permission_prompt');
        expect(HOOK_EVENTS.Notification.matcherValues).toContain('idle_prompt');
      });

      it('SubagentStart should support matchers', () => {
        expect(HOOK_EVENTS.SubagentStart.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.SubagentStart.matcherValues).toContain('general-purpose');
      });

      it('SubagentStop should support matchers (fixed from no-matcher)', () => {
        expect(HOOK_EVENTS.SubagentStop.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.SubagentStop.canBlock).toBe(true);
        expect(HOOK_EVENTS.SubagentStop.supportsPrompt).toBe(true);
      });

      it('SessionStart should support matchers (fixed from no-matcher)', () => {
        expect(HOOK_EVENTS.SessionStart.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.SessionStart.matcherValues).toContain('startup');
        expect(HOOK_EVENTS.SessionStart.matcherValues).toContain('resume');
      });

      it('SessionEnd should support matchers (fixed from no-matcher)', () => {
        expect(HOOK_EVENTS.SessionEnd.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.SessionEnd.matcherValues).toContain('clear');
        expect(HOOK_EVENTS.SessionEnd.matcherValues).toContain('logout');
      });

      it('PreCompact should support matchers (fixed from no-matcher)', () => {
        expect(HOOK_EVENTS.PreCompact.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.PreCompact.matcherValues).toEqual(['manual', 'auto']);
      });

      it('PostCompact should support matchers', () => {
        expect(HOOK_EVENTS.PostCompact.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.PostCompact.matcherValues).toEqual(['manual', 'auto']);
      });

      it('ConfigChange should support matchers and blocking', () => {
        expect(HOOK_EVENTS.ConfigChange.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.ConfigChange.canBlock).toBe(true);
        expect(HOOK_EVENTS.ConfigChange.matcherValues).toContain('user_settings');
      });

      it('Elicitation and ElicitationResult should support matchers and blocking', () => {
        expect(HOOK_EVENTS.Elicitation.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.Elicitation.canBlock).toBe(true);
        expect(HOOK_EVENTS.ElicitationResult.hasMatcher).toBe(true);
        expect(HOOK_EVENTS.ElicitationResult.canBlock).toBe(true);
      });
    });

    describe('non-matcher events', () => {
      it('UserPromptSubmit should support blocking and prompts but not matchers', () => {
        expect(HOOK_EVENTS.UserPromptSubmit.hasMatcher).toBe(false);
        expect(HOOK_EVENTS.UserPromptSubmit.canBlock).toBe(true);
        expect(HOOK_EVENTS.UserPromptSubmit.supportsPrompt).toBe(true);
        expect(HOOK_EVENTS.UserPromptSubmit.matcherValues).toEqual([]);
      });

      it('Stop should support blocking and prompts but not matchers', () => {
        expect(HOOK_EVENTS.Stop.hasMatcher).toBe(false);
        expect(HOOK_EVENTS.Stop.canBlock).toBe(true);
        expect(HOOK_EVENTS.Stop.supportsPrompt).toBe(true);
      });

      it('TaskCreated and TaskCompleted should support blocking', () => {
        expect(HOOK_EVENTS.TaskCreated.hasMatcher).toBe(false);
        expect(HOOK_EVENTS.TaskCreated.canBlock).toBe(true);
        expect(HOOK_EVENTS.TaskCompleted.hasMatcher).toBe(false);
        expect(HOOK_EVENTS.TaskCompleted.canBlock).toBe(true);
      });

      it('TeammateIdle should support blocking', () => {
        expect(HOOK_EVENTS.TeammateIdle.hasMatcher).toBe(false);
        expect(HOOK_EVENTS.TeammateIdle.canBlock).toBe(true);
      });

      it('CwdChanged should not support blocking', () => {
        expect(HOOK_EVENTS.CwdChanged.hasMatcher).toBe(false);
        expect(HOOK_EVENTS.CwdChanged.canBlock).toBe(false);
      });

      it('WorktreeCreate should support blocking, WorktreeRemove should not', () => {
        expect(HOOK_EVENTS.WorktreeCreate.canBlock).toBe(true);
        expect(HOOK_EVENTS.WorktreeRemove.canBlock).toBe(false);
      });

      it('Setup should not support blocking or prompts', () => {
        expect(HOOK_EVENTS.Setup.hasMatcher).toBe(false);
        expect(HOOK_EVENTS.Setup.canBlock).toBe(false);
        expect(HOOK_EVENTS.Setup.supportsPrompt).toBe(false);
      });
    });
  });

  describe('getValidEvents()', () => {
    it('should return array of all 26 event names', () => {
      const events = getValidEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(26);
    });

    it('should contain all expected events', () => {
      const events = getValidEvents();
      ALL_EVENTS.forEach(event => {
        expect(events).toContain(event);
      });
    });

    it('should return a new array each time (not cached)', () => {
      const events1 = getValidEvents();
      const events2 = getValidEvents();
      expect(events1).not.toBe(events2);
      expect(events1).toEqual(events2);
    });
  });

  describe('getMatcherBasedEvents()', () => {
    it('should return 17 matcher-based events', () => {
      const events = getMatcherBasedEvents();
      expect(events).toHaveLength(17);
    });

    it('should contain all matcher-based events', () => {
      const events = getMatcherBasedEvents();
      MATCHER_EVENTS.forEach(event => {
        expect(events).toContain(event);
      });
    });

    it('should not include non-matcher events', () => {
      const events = getMatcherBasedEvents();
      NON_MATCHER_EVENTS.forEach(event => {
        expect(events).not.toContain(event);
      });
    });
  });

  describe('getPromptSupportedEvents()', () => {
    it('should return 5 prompt-supported events', () => {
      const events = getPromptSupportedEvents();
      expect(events).toHaveLength(5);
    });

    it('should contain all prompt-supported events', () => {
      const events = getPromptSupportedEvents();
      PROMPT_EVENTS.forEach(event => {
        expect(events).toContain(event);
      });
    });

    it('should not include non-prompt events', () => {
      const events = getPromptSupportedEvents();
      expect(events).not.toContain('PostToolUse');
      expect(events).not.toContain('Notification');
      expect(events).not.toContain('SessionStart');
      expect(events).not.toContain('Setup');
    });
  });

  describe('getBlockingEvents()', () => {
    it('should return 12 blocking events', () => {
      const events = getBlockingEvents();
      expect(events).toHaveLength(12);
    });

    it('should contain all blocking events', () => {
      const events = getBlockingEvents();
      BLOCKING_EVENTS.forEach(event => {
        expect(events).toContain(event);
      });
    });

    it('should not include non-blocking events', () => {
      const events = getBlockingEvents();
      expect(events).not.toContain('PostToolUse');
      expect(events).not.toContain('CwdChanged');
      expect(events).not.toContain('Setup');
    });
  });

  describe('getHookEventOptions()', () => {
    it('should return array of 26 UI-friendly options', () => {
      const options = getHookEventOptions();
      expect(Array.isArray(options)).toBe(true);
      expect(options).toHaveLength(26);
    });

    it('should include value, label, and hasMatcher for each option', () => {
      const options = getHookEventOptions();
      options.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('hasMatcher');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
        expect(typeof option.hasMatcher).toBe('boolean');
      });
    });

    it('should have matching value and label', () => {
      const options = getHookEventOptions();
      options.forEach(option => {
        expect(option.value).toBe(option.label);
      });
    });

    it('should correctly set hasMatcher flag', () => {
      const options = getHookEventOptions();
      const preToolUse = options.find(opt => opt.value === 'PreToolUse');
      const userPromptSubmit = options.find(opt => opt.value === 'UserPromptSubmit');

      expect(preToolUse.hasMatcher).toBe(true);
      expect(userPromptSubmit.hasMatcher).toBe(false);
    });
  });

  describe('isValidEvent()', () => {
    it('should return true for valid events', () => {
      expect(isValidEvent('PreToolUse')).toBe(true);
      expect(isValidEvent('PostToolUseFailure')).toBe(true);
      expect(isValidEvent('ConfigChange')).toBe(true);
      expect(isValidEvent('Setup')).toBe(true);
    });

    it('should return false for invalid events', () => {
      expect(isValidEvent('InvalidEvent')).toBe(false);
      expect(isValidEvent('pretooluse')).toBe(false);
      expect(isValidEvent('')).toBe(false);
      expect(isValidEvent(null)).toBe(false);
      expect(isValidEvent(undefined)).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isValidEvent('PreToolUse')).toBe(true);
      expect(isValidEvent('pretooluse')).toBe(false);
      expect(isValidEvent('PRETOOLUSE')).toBe(false);
    });
  });

  describe('eventHasMatcher()', () => {
    it('should return true for matcher-based events', () => {
      MATCHER_EVENTS.forEach(event => {
        expect(eventHasMatcher(event)).toBe(true);
      });
    });

    it('should return false for non-matcher events', () => {
      NON_MATCHER_EVENTS.forEach(event => {
        expect(eventHasMatcher(event)).toBe(false);
      });
    });

    it('should return false for invalid events', () => {
      expect(eventHasMatcher('InvalidEvent')).toBe(false);
      expect(eventHasMatcher('')).toBe(false);
      expect(eventHasMatcher(null)).toBe(false);
      expect(eventHasMatcher(undefined)).toBe(false);
    });
  });

  describe('eventSupportsPrompt()', () => {
    it('should return true for prompt-supported events', () => {
      PROMPT_EVENTS.forEach(event => {
        expect(eventSupportsPrompt(event)).toBe(true);
      });
    });

    it('should return false for non-prompt events', () => {
      expect(eventSupportsPrompt('PostToolUse')).toBe(false);
      expect(eventSupportsPrompt('Notification')).toBe(false);
      expect(eventSupportsPrompt('SessionStart')).toBe(false);
      expect(eventSupportsPrompt('Setup')).toBe(false);
    });

    it('should return false for invalid events', () => {
      expect(eventSupportsPrompt('InvalidEvent')).toBe(false);
      expect(eventSupportsPrompt('')).toBe(false);
      expect(eventSupportsPrompt(null)).toBe(false);
      expect(eventSupportsPrompt(undefined)).toBe(false);
    });
  });

  describe('eventCanBlock()', () => {
    it('should return true for blocking events', () => {
      BLOCKING_EVENTS.forEach(event => {
        expect(eventCanBlock(event)).toBe(true);
      });
    });

    it('should return false for non-blocking events', () => {
      expect(eventCanBlock('PostToolUse')).toBe(false);
      expect(eventCanBlock('CwdChanged')).toBe(false);
      expect(eventCanBlock('Setup')).toBe(false);
    });

    it('should return false for invalid events', () => {
      expect(eventCanBlock('InvalidEvent')).toBe(false);
      expect(eventCanBlock(null)).toBe(false);
    });
  });

  describe('getEventMetadata()', () => {
    it('should return metadata object for valid events', () => {
      const metadata = getEventMetadata('PreToolUse');
      expect(metadata).toEqual({
        hasMatcher: true,
        matcherValues: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Agent'],
        canBlock: true,
        supportsPrompt: true
      });
    });

    it('should return correct metadata for new events', () => {
      const configChange = getEventMetadata('ConfigChange');
      expect(configChange.hasMatcher).toBe(true);
      expect(configChange.canBlock).toBe(true);
      expect(configChange.matcherValues).toContain('user_settings');

      const setup = getEventMetadata('Setup');
      expect(setup.hasMatcher).toBe(false);
      expect(setup.canBlock).toBe(false);
      expect(setup.matcherValues).toEqual([]);
    });

    it('should return null for invalid events', () => {
      expect(getEventMetadata('InvalidEvent')).toBeNull();
      expect(getEventMetadata('')).toBeNull();
      expect(getEventMetadata(null)).toBeNull();
      expect(getEventMetadata(undefined)).toBeNull();
    });

    it('should return a reference to the original object (not a copy)', () => {
      const metadata1 = getEventMetadata('PreToolUse');
      const metadata2 = getEventMetadata('PreToolUse');
      expect(metadata1).toBe(metadata2);
    });
  });

  describe('data consistency', () => {
    it('matcher-based events should match across all functions', () => {
      const matcherEvents = getMatcherBasedEvents();

      matcherEvents.forEach(event => {
        expect(eventHasMatcher(event)).toBe(true);
        expect(getEventMetadata(event).hasMatcher).toBe(true);
      });
    });

    it('prompt-supported events should match across all functions', () => {
      const promptEvents = getPromptSupportedEvents();

      promptEvents.forEach(event => {
        expect(eventSupportsPrompt(event)).toBe(true);
        expect(getEventMetadata(event).supportsPrompt).toBe(true);
      });
    });

    it('blocking events should match across all functions', () => {
      const blockingEvents = getBlockingEvents();

      blockingEvents.forEach(event => {
        expect(eventCanBlock(event)).toBe(true);
        expect(getEventMetadata(event).canBlock).toBe(true);
      });
    });

    it('valid events should match across all functions', () => {
      const validEvents = getValidEvents();

      validEvents.forEach(event => {
        expect(isValidEvent(event)).toBe(true);
        expect(getEventMetadata(event)).not.toBeNull();
      });
    });

    it('hook event options should match valid events', () => {
      const validEvents = getValidEvents();
      const options = getHookEventOptions();
      const optionValues = options.map(opt => opt.value);

      expect(optionValues).toEqual(validEvents);
    });

    it('hook event options hasMatcher should match eventHasMatcher()', () => {
      const options = getHookEventOptions();

      options.forEach(option => {
        expect(option.hasMatcher).toBe(eventHasMatcher(option.value));
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string gracefully', () => {
      expect(isValidEvent('')).toBe(false);
      expect(eventHasMatcher('')).toBe(false);
      expect(eventSupportsPrompt('')).toBe(false);
      expect(eventCanBlock('')).toBe(false);
      expect(getEventMetadata('')).toBeNull();
    });

    it('should handle null gracefully', () => {
      expect(isValidEvent(null)).toBe(false);
      expect(eventHasMatcher(null)).toBe(false);
      expect(eventSupportsPrompt(null)).toBe(false);
      expect(eventCanBlock(null)).toBe(false);
      expect(getEventMetadata(null)).toBeNull();
    });

    it('should handle undefined gracefully', () => {
      expect(isValidEvent(undefined)).toBe(false);
      expect(eventHasMatcher(undefined)).toBe(false);
      expect(eventSupportsPrompt(undefined)).toBe(false);
      expect(eventCanBlock(undefined)).toBe(false);
      expect(getEventMetadata(undefined)).toBeNull();
    });

    it('should handle non-string types gracefully', () => {
      expect(isValidEvent(123)).toBe(false);
      expect(isValidEvent({})).toBe(false);
      expect(isValidEvent([])).toBe(false);
      expect(eventHasMatcher(123)).toBe(false);
      expect(eventSupportsPrompt({})).toBe(false);
      expect(eventCanBlock([])).toBe(false);
      expect(getEventMetadata([])).toBeNull();
    });
  });

  describe('count verification', () => {
    it('should have exactly 17 matcher-based events', () => {
      expect(getMatcherBasedEvents()).toHaveLength(17);
    });

    it('should have exactly 9 non-matcher events', () => {
      const allEvents = getValidEvents();
      const matcherEvents = getMatcherBasedEvents();
      const nonMatcherEvents = allEvents.filter(e => !matcherEvents.includes(e));
      expect(nonMatcherEvents).toHaveLength(9);
    });

    it('should have exactly 5 prompt-supported events', () => {
      expect(getPromptSupportedEvents()).toHaveLength(5);
    });

    it('should have exactly 12 blocking events', () => {
      expect(getBlockingEvents()).toHaveLength(12);
    });

    it('should have exactly 26 total events', () => {
      expect(getValidEvents()).toHaveLength(26);
    });
  });
});
