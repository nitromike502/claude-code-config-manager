/**
 * Tests for CopyService helper methods used by copyHook
 *
 * Tests the internal helper functions:
 * - isDuplicateHook()
 * - mergeHookIntoSettings()
 */

const copyService = require('../../../src/backend/services/copy-service');

describe('CopyService.isDuplicateHook()', () => {
  test('returns false for empty hooks array', () => {
    const result = copyService.isDuplicateHook([], {
      type: 'command',
      command: 'npm test',
      enabled: true,
      timeout: 60
    });

    expect(result).toBe(false);
  });

  test('returns false when hooks array is not an array', () => {
    const result = copyService.isDuplicateHook(null, {
      type: 'command',
      command: 'npm test',
      enabled: true,
      timeout: 60
    });

    expect(result).toBe(false);
  });

  test('returns true when command exists in hooks array', () => {
    const existingHooks = [
      { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 },
      { type: 'command', command: 'npm test', enabled: true, timeout: 60 }
    ];

    const result = copyService.isDuplicateHook(existingHooks, {
      type: 'command',
      command: 'npm test',
      enabled: false, // Different enabled
      timeout: 120 // Different timeout
    });

    expect(result).toBe(true);
  });

  test('returns false when command does not exist in hooks array', () => {
    const existingHooks = [
      { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 },
      { type: 'command', command: 'eslint --fix', enabled: true, timeout: 60 }
    ];

    const result = copyService.isDuplicateHook(existingHooks, {
      type: 'command',
      command: 'prettier --write',
      enabled: true,
      timeout: 60
    });

    expect(result).toBe(false);
  });

  test('comparison is case-sensitive', () => {
    const existingHooks = [
      { type: 'command', command: 'npm test', enabled: true, timeout: 60 }
    ];

    const result = copyService.isDuplicateHook(existingHooks, {
      type: 'command',
      command: 'NPM TEST', // Different case
      enabled: true,
      timeout: 60
    });

    expect(result).toBe(false);
  });

  test('comparison includes whitespace differences', () => {
    const existingHooks = [
      { type: 'command', command: 'npm test', enabled: true, timeout: 60 }
    ];

    const result = copyService.isDuplicateHook(existingHooks, {
      type: 'command',
      command: 'npm  test', // Extra space
      enabled: true,
      timeout: 60
    });

    expect(result).toBe(false);
  });
});

describe('CopyService.mergeHookIntoSettings()', () => {
  describe('Level 0: Hooks object creation', () => {
    test('creates hooks object if missing', () => {
      const settings = {};

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }
      );

      expect(result.hooks).toBeDefined();
      expect(typeof result.hooks).toBe('object');
    });

    test('preserves existing hooks object', () => {
      const settings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.js',
              hooks: [{ type: 'command', command: 'eslint', enabled: true, timeout: 60 }]
            }
          ]
        }
      };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PostToolUse',
        '*',
        { type: 'command', command: 'npm test', enabled: true, timeout: 60 }
      );

      // Original PreToolUse should still exist
      expect(result.hooks.PreToolUse).toEqual(settings.hooks.PreToolUse);
    });
  });

  describe('Level 1: Event creation', () => {
    test('creates new event array if event does not exist', () => {
      const settings = { hooks: {} };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }
      );

      expect(result.hooks.PreToolUse).toBeDefined();
      expect(Array.isArray(result.hooks.PreToolUse)).toBe(true);
    });

    test('preserves existing event array', () => {
      const settings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.js',
              hooks: [{ type: 'command', command: 'eslint', enabled: true, timeout: 60 }]
            }
          ]
        }
      };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }
      );

      // Original matcher entry should still exist
      expect(result.hooks.PreToolUse[0].matcher).toBe('*.js');
    });
  });

  describe('Level 2: Matcher entry creation', () => {
    test('creates new matcher entry if matcher does not exist', () => {
      const settings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.js',
              hooks: [{ type: 'command', command: 'eslint', enabled: true, timeout: 60 }]
            }
          ]
        }
      };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }
      );

      // Should have 2 matcher entries now
      expect(result.hooks.PreToolUse).toHaveLength(2);
      expect(result.hooks.PreToolUse[1].matcher).toBe('*.ts');
    });

    test('finds existing matcher entry with exact match', () => {
      const settings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [{ type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }]
            }
          ]
        }
      };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        { type: 'command', command: 'eslint --fix', enabled: true, timeout: 30 }
      );

      // Should still have 1 matcher entry
      expect(result.hooks.PreToolUse).toHaveLength(1);
      // Should have 2 hooks in the entry
      expect(result.hooks.PreToolUse[0].hooks).toHaveLength(2);
    });

    test('treats undefined matcher as "*" when finding entry', () => {
      const settings = {
        hooks: {
          PreToolUse: [
            {
              // No matcher field (implicit "*")
              hooks: [{ type: 'command', command: 'first', enabled: true, timeout: 60 }]
            }
          ]
        }
      };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        undefined, // Undefined matcher
        { type: 'command', command: 'second', enabled: true, timeout: 60 }
      );

      // Should find the existing entry and add to it
      expect(result.hooks.PreToolUse).toHaveLength(1);
      expect(result.hooks.PreToolUse[0].hooks).toHaveLength(2);
    });

    test('treats undefined matcher as "*" when matching with explicit "*"', () => {
      const settings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*',
              hooks: [{ type: 'command', command: 'first', enabled: true, timeout: 60 }]
            }
          ]
        }
      };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        undefined, // Undefined matcher should match "*"
        { type: 'command', command: 'second', enabled: true, timeout: 60 }
      );

      // Should find the existing entry and add to it
      expect(result.hooks.PreToolUse).toHaveLength(1);
      expect(result.hooks.PreToolUse[0].hooks).toHaveLength(2);
    });

    test('omits matcher field when matcher is "*"', () => {
      const settings = { hooks: {} };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'SessionStart',
        '*',
        { type: 'command', command: 'git status', enabled: true, timeout: 60 }
      );

      // Matcher field should not be present
      expect(result.hooks.SessionStart[0].matcher).toBeUndefined();
      expect(result.hooks.SessionStart[0].hooks).toBeDefined();
    });

    test('includes matcher field when matcher is not "*"', () => {
      const settings = { hooks: {} };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }
      );

      // Matcher field should be present
      expect(result.hooks.PreToolUse[0].matcher).toBe('*.ts');
    });
  });

  describe('Level 3: Hook command addition', () => {
    test('adds hook command to matcher hooks array', () => {
      const settings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [{ type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }]
            }
          ]
        }
      };

      const newHook = { type: 'command', command: 'eslint --fix', enabled: true, timeout: 30 };
      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        newHook
      );

      expect(result.hooks.PreToolUse[0].hooks).toHaveLength(2);
      expect(result.hooks.PreToolUse[0].hooks[1]).toEqual(newHook);
    });

    test('skips duplicate hook command', () => {
      const existingHook = { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 };
      const settings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [existingHook]
            }
          ]
        }
      };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        { type: 'command', command: 'tsc --noEmit', enabled: false, timeout: 120 } // Same command
      );

      // Should still have only 1 hook (duplicate skipped)
      expect(result.hooks.PreToolUse[0].hooks).toHaveLength(1);
      // Original hook should be unchanged
      expect(result.hooks.PreToolUse[0].hooks[0]).toEqual(existingHook);
    });
  });

  describe('Preserving other settings', () => {
    test('preserves mcpServers configuration', () => {
      const settings = {
        mcpServers: {
          'test-server': {
            command: 'node',
            args: ['server.js'],
            env: { NODE_ENV: 'production' }
          }
        },
        hooks: {}
      };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }
      );

      // mcpServers should be unchanged
      expect(result.mcpServers).toEqual(settings.mcpServers);
    });

    test('preserves custom settings keys', () => {
      const settings = {
        hooks: {},
        customSetting1: 'value1',
        customSetting2: { nested: 'value2' }
      };

      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }
      );

      // Custom settings should be unchanged
      expect(result.customSetting1).toBe('value1');
      expect(result.customSetting2).toEqual({ nested: 'value2' });
    });
  });

  describe('Complex scenarios', () => {
    test('handles multiple events, matchers, and hooks', () => {
      const settings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [{ type: 'command', command: 'tsc', enabled: true, timeout: 60 }]
            },
            {
              matcher: '*.js',
              hooks: [{ type: 'command', command: 'eslint', enabled: true, timeout: 30 }]
            }
          ],
          PostToolUse: [
            {
              hooks: [{ type: 'command', command: 'npm test', enabled: true, timeout: 120 }]
            }
          ]
        }
      };

      // Add to existing PreToolUse *.ts matcher
      const result = copyService.mergeHookIntoSettings(
        settings,
        'PreToolUse',
        '*.ts',
        { type: 'command', command: 'prettier', enabled: true, timeout: 15 }
      );

      // Verify structure is correct
      expect(result.hooks.PreToolUse).toHaveLength(2);
      expect(result.hooks.PreToolUse[0].hooks).toHaveLength(2); // tsc + prettier
      expect(result.hooks.PreToolUse[1].hooks).toHaveLength(1); // eslint
      expect(result.hooks.PostToolUse[0].hooks).toHaveLength(1); // npm test
    });
  });
});
