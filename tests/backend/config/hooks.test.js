/**
 * Tests for centralized hook events configuration module
 */

const {
  HOOK_EVENTS,
  getValidEvents,
  getMatcherBasedEvents,
  getPromptSupportedEvents,
  getHookEventOptions,
  isValidEvent,
  eventHasMatcher,
  eventSupportsPrompt,
  getEventMetadata
} = require('../../../src/backend/config/hooks');

describe('Hook Events Configuration', () => {
  describe('HOOK_EVENTS object', () => {
    it('should contain all 10 hook events', () => {
      const events = Object.keys(HOOK_EVENTS);
      expect(events).toHaveLength(10);
      expect(events).toContain('PreToolUse');
      expect(events).toContain('PostToolUse');
      expect(events).toContain('PermissionRequest');
      expect(events).toContain('Notification');
      expect(events).toContain('UserPromptSubmit');
      expect(events).toContain('Stop');
      expect(events).toContain('SubagentStop');
      expect(events).toContain('PreCompact');
      expect(events).toContain('SessionStart');
      expect(events).toContain('SessionEnd');
    });

    it('should have hasMatcher and supportsPrompt for each event', () => {
      Object.entries(HOOK_EVENTS).forEach(([event, metadata]) => {
        expect(metadata).toHaveProperty('hasMatcher');
        expect(metadata).toHaveProperty('supportsPrompt');
        expect(typeof metadata.hasMatcher).toBe('boolean');
        expect(typeof metadata.supportsPrompt).toBe('boolean');
      });
    });

    describe('matcher-based events', () => {
      it('PreToolUse should support matchers and prompts', () => {
        expect(HOOK_EVENTS.PreToolUse).toEqual({
          hasMatcher: true,
          supportsPrompt: true
        });
      });

      it('PostToolUse should support matchers but not prompts', () => {
        expect(HOOK_EVENTS.PostToolUse).toEqual({
          hasMatcher: true,
          supportsPrompt: false
        });
      });

      it('PermissionRequest should support matchers and prompts', () => {
        expect(HOOK_EVENTS.PermissionRequest).toEqual({
          hasMatcher: true,
          supportsPrompt: true
        });
      });

      it('Notification should support matchers but not prompts', () => {
        expect(HOOK_EVENTS.Notification).toEqual({
          hasMatcher: true,
          supportsPrompt: false
        });
      });
    });

    describe('non-matcher events', () => {
      it('UserPromptSubmit should support prompts but not matchers', () => {
        expect(HOOK_EVENTS.UserPromptSubmit).toEqual({
          hasMatcher: false,
          supportsPrompt: true
        });
      });

      it('Stop should support prompts but not matchers', () => {
        expect(HOOK_EVENTS.Stop).toEqual({
          hasMatcher: false,
          supportsPrompt: true
        });
      });

      it('SubagentStop should support prompts but not matchers', () => {
        expect(HOOK_EVENTS.SubagentStop).toEqual({
          hasMatcher: false,
          supportsPrompt: true
        });
      });

      it('PreCompact should support neither matchers nor prompts', () => {
        expect(HOOK_EVENTS.PreCompact).toEqual({
          hasMatcher: false,
          supportsPrompt: false
        });
      });

      it('SessionStart should support neither matchers nor prompts', () => {
        expect(HOOK_EVENTS.SessionStart).toEqual({
          hasMatcher: false,
          supportsPrompt: false
        });
      });

      it('SessionEnd should support neither matchers nor prompts', () => {
        expect(HOOK_EVENTS.SessionEnd).toEqual({
          hasMatcher: false,
          supportsPrompt: false
        });
      });
    });
  });

  describe('getValidEvents()', () => {
    it('should return array of all event names', () => {
      const events = getValidEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(10);
    });

    it('should return all 10 event names', () => {
      const events = getValidEvents();
      expect(events).toEqual([
        'PreToolUse',
        'PostToolUse',
        'PermissionRequest',
        'Notification',
        'UserPromptSubmit',
        'Stop',
        'SubagentStop',
        'PreCompact',
        'SessionStart',
        'SessionEnd'
      ]);
    });

    it('should return a new array each time (not cached)', () => {
      const events1 = getValidEvents();
      const events2 = getValidEvents();
      expect(events1).not.toBe(events2);
      expect(events1).toEqual(events2);
    });
  });

  describe('getMatcherBasedEvents()', () => {
    it('should return array of events that support matchers', () => {
      const events = getMatcherBasedEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(4);
    });

    it('should return only matcher-based events', () => {
      const events = getMatcherBasedEvents();
      expect(events).toEqual([
        'PreToolUse',
        'PostToolUse',
        'PermissionRequest',
        'Notification'
      ]);
    });

    it('should not include non-matcher events', () => {
      const events = getMatcherBasedEvents();
      expect(events).not.toContain('UserPromptSubmit');
      expect(events).not.toContain('Stop');
      expect(events).not.toContain('SubagentStop');
      expect(events).not.toContain('PreCompact');
      expect(events).not.toContain('SessionStart');
      expect(events).not.toContain('SessionEnd');
    });
  });

  describe('getPromptSupportedEvents()', () => {
    it('should return array of events that support prompts', () => {
      const events = getPromptSupportedEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(5);
    });

    it('should return only prompt-supported events', () => {
      const events = getPromptSupportedEvents();
      expect(events).toEqual([
        'PreToolUse',
        'PermissionRequest',
        'UserPromptSubmit',
        'Stop',
        'SubagentStop'
      ]);
    });

    it('should not include non-prompt events', () => {
      const events = getPromptSupportedEvents();
      expect(events).not.toContain('PostToolUse');
      expect(events).not.toContain('Notification');
      expect(events).not.toContain('PreCompact');
      expect(events).not.toContain('SessionStart');
      expect(events).not.toContain('SessionEnd');
    });
  });

  describe('getHookEventOptions()', () => {
    it('should return array of UI-friendly options', () => {
      const options = getHookEventOptions();
      expect(Array.isArray(options)).toBe(true);
      expect(options).toHaveLength(10);
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

    it('should include all 10 events', () => {
      const options = getHookEventOptions();
      const values = options.map(opt => opt.value);

      expect(values).toContain('PreToolUse');
      expect(values).toContain('PostToolUse');
      expect(values).toContain('PermissionRequest');
      expect(values).toContain('Notification');
      expect(values).toContain('UserPromptSubmit');
      expect(values).toContain('Stop');
      expect(values).toContain('SubagentStop');
      expect(values).toContain('PreCompact');
      expect(values).toContain('SessionStart');
      expect(values).toContain('SessionEnd');
    });
  });

  describe('isValidEvent()', () => {
    it('should return true for valid events', () => {
      expect(isValidEvent('PreToolUse')).toBe(true);
      expect(isValidEvent('PostToolUse')).toBe(true);
      expect(isValidEvent('UserPromptSubmit')).toBe(true);
      expect(isValidEvent('SessionStart')).toBe(true);
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
      expect(eventHasMatcher('PreToolUse')).toBe(true);
      expect(eventHasMatcher('PostToolUse')).toBe(true);
      expect(eventHasMatcher('PermissionRequest')).toBe(true);
      expect(eventHasMatcher('Notification')).toBe(true);
    });

    it('should return false for non-matcher events', () => {
      expect(eventHasMatcher('UserPromptSubmit')).toBe(false);
      expect(eventHasMatcher('Stop')).toBe(false);
      expect(eventHasMatcher('SubagentStop')).toBe(false);
      expect(eventHasMatcher('PreCompact')).toBe(false);
      expect(eventHasMatcher('SessionStart')).toBe(false);
      expect(eventHasMatcher('SessionEnd')).toBe(false);
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
      expect(eventSupportsPrompt('PreToolUse')).toBe(true);
      expect(eventSupportsPrompt('PermissionRequest')).toBe(true);
      expect(eventSupportsPrompt('UserPromptSubmit')).toBe(true);
      expect(eventSupportsPrompt('Stop')).toBe(true);
      expect(eventSupportsPrompt('SubagentStop')).toBe(true);
    });

    it('should return false for non-prompt events', () => {
      expect(eventSupportsPrompt('PostToolUse')).toBe(false);
      expect(eventSupportsPrompt('Notification')).toBe(false);
      expect(eventSupportsPrompt('PreCompact')).toBe(false);
      expect(eventSupportsPrompt('SessionStart')).toBe(false);
      expect(eventSupportsPrompt('SessionEnd')).toBe(false);
    });

    it('should return false for invalid events', () => {
      expect(eventSupportsPrompt('InvalidEvent')).toBe(false);
      expect(eventSupportsPrompt('')).toBe(false);
      expect(eventSupportsPrompt(null)).toBe(false);
      expect(eventSupportsPrompt(undefined)).toBe(false);
    });
  });

  describe('getEventMetadata()', () => {
    it('should return metadata object for valid events', () => {
      const metadata = getEventMetadata('PreToolUse');
      expect(metadata).toEqual({
        hasMatcher: true,
        supportsPrompt: true
      });
    });

    it('should return correct metadata for all events', () => {
      expect(getEventMetadata('PreToolUse')).toEqual({
        hasMatcher: true,
        supportsPrompt: true
      });
      expect(getEventMetadata('PostToolUse')).toEqual({
        hasMatcher: true,
        supportsPrompt: false
      });
      expect(getEventMetadata('UserPromptSubmit')).toEqual({
        hasMatcher: false,
        supportsPrompt: true
      });
      expect(getEventMetadata('PreCompact')).toEqual({
        hasMatcher: false,
        supportsPrompt: false
      });
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
      expect(getEventMetadata('')).toBeNull();
    });

    it('should handle null gracefully', () => {
      expect(isValidEvent(null)).toBe(false);
      expect(eventHasMatcher(null)).toBe(false);
      expect(eventSupportsPrompt(null)).toBe(false);
      expect(getEventMetadata(null)).toBeNull();
    });

    it('should handle undefined gracefully', () => {
      expect(isValidEvent(undefined)).toBe(false);
      expect(eventHasMatcher(undefined)).toBe(false);
      expect(eventSupportsPrompt(undefined)).toBe(false);
      expect(getEventMetadata(undefined)).toBeNull();
    });

    it('should handle non-string types gracefully', () => {
      expect(isValidEvent(123)).toBe(false);
      expect(isValidEvent({})).toBe(false);
      expect(isValidEvent([])).toBe(false);
      expect(eventHasMatcher(123)).toBe(false);
      expect(eventSupportsPrompt({})).toBe(false);
      expect(getEventMetadata([])).toBeNull();
    });
  });

  describe('count verification', () => {
    it('should have exactly 4 matcher-based events', () => {
      expect(getMatcherBasedEvents()).toHaveLength(4);
    });

    it('should have exactly 5 prompt-supported events', () => {
      expect(getPromptSupportedEvents()).toHaveLength(5);
    });

    it('should have exactly 6 non-matcher events', () => {
      const allEvents = getValidEvents();
      const matcherEvents = getMatcherBasedEvents();
      const nonMatcherEvents = allEvents.filter(e => !matcherEvents.includes(e));
      expect(nonMatcherEvents).toHaveLength(6);
    });

    it('should have exactly 5 non-prompt events', () => {
      const allEvents = getValidEvents();
      const promptEvents = getPromptSupportedEvents();
      const nonPromptEvents = allEvents.filter(e => !promptEvents.includes(e));
      expect(nonPromptEvents).toHaveLength(5);
    });
  });
});
