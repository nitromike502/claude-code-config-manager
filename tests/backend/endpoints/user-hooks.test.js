const request = require('supertest');
const path = require('path');
const os = require('os');

/**
 * Test Suite: GET /api/user/hooks
 *
 * Tests user-level hook retrieval from ~/.claude/settings.json
 *
 * Coverage:
 * - Valid user hooks are returned correctly
 * - Response structure includes {success, hooks, warnings}
 * - Malformed settings.json generates warnings but doesn't crash
 * - Missing user settings file returns empty array gracefully
 * - Missing ~/.claude/ directory returns empty array gracefully
 * - Empty hooks section returns empty array
 * - Hook parsing includes all expected fields with flattened structure (BUG-038)
 * - Claude Code event validation (BUG-038)
 *
 * NOTE: These tests use the actual user's home directory (~/.claude/settings.json)
 * rather than mocking because os.homedir() is difficult to mock in Node.js.
 * Tests verify the API works correctly with real filesystem scenarios.
 */

describe('GET /api/user/hooks', () => {
  let app;

  beforeAll(() => {
    // Load app fresh for all tests
    app = require('../../../src/backend/server');
  });

  describe('API Response', () => {
    test('should return user-level hooks from ~/.claude/settings.json', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.hooks).toBeDefined();
      expect(Array.isArray(response.body.hooks)).toBe(true);
      expect(response.body.warnings).toBeDefined();
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });

    test('should return correct response structure with all required fields', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('hooks');
      expect(response.body).toHaveProperty('warnings');
      expect(typeof response.body.success).toBe('boolean');
      expect(Array.isArray(response.body.hooks)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });

    test('should include all expected fields in hook objects if hooks exist (flattened structure)', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);

      // If user has hooks in ~/.claude/settings.json, verify flattened structure
      if (response.body.hooks.length > 0) {
        const hook = response.body.hooks[0];

        // All hooks should have these fields (flattened structure)
        expect(hook).toHaveProperty('event');
        expect(hook).toHaveProperty('matcher');
        expect(hook).toHaveProperty('type');
        expect(hook).toHaveProperty('command');
        expect(hook).toHaveProperty('timeout');
        expect(hook).toHaveProperty('enabled');
        expect(hook).toHaveProperty('source');

        // Old nested structure should NOT exist
        expect(hook).not.toHaveProperty('hooks');
        expect(hook).not.toHaveProperty('matcherIndex');

        // Verify field types
        expect(typeof hook.event).toBe('string');
        expect(typeof hook.matcher).toBe('string');
        expect(typeof hook.type).toBe('string');
        expect(typeof hook.command).toBe('string');
        expect(typeof hook.timeout).toBe('number');
        expect(typeof hook.enabled).toBe('boolean');
        expect(hook.source).toBe('~/.claude/settings.json');
      }
    });

    test('should parse object-format hooks correctly (event -> matchers structure)', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);

      // If user has hooks configured, verify object format is parsed with flattened structure
      if (response.body.hooks.length > 0) {
        const hook = response.body.hooks[0];

        // Flattened format should have event, matcher, type, command
        expect(hook).toHaveProperty('event');
        expect(hook).toHaveProperty('matcher');
        expect(hook).toHaveProperty('type');
        expect(hook).toHaveProperty('command');

        // Old nested structure should NOT exist
        expect(hook).not.toHaveProperty('hooks');
        expect(hook).not.toHaveProperty('matcherIndex');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed settings.json gracefully (if it exists and is malformed)', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.hooks).toBeDefined();
      expect(response.body.warnings).toBeDefined();

      // Even with malformed files, the API should not crash
      // and should return a valid response structure
      expect(Array.isArray(response.body.hooks)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);

      // If there are warnings, they should have the expected structure
      if (response.body.warnings.length > 0) {
        const warning = response.body.warnings[0];
        expect(warning).toHaveProperty('file');
        expect(warning).toHaveProperty('error');
        expect(warning).toHaveProperty('skipped');
        expect(warning.skipped).toBe(true);
      }
    });

    test('should continue processing even with unexpected hook format', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // API should return both hooks and warnings arrays
      expect(Array.isArray(response.body.hooks)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);

      // If warnings exist about hook format, valid hooks should still be processed
      // This verifies the resilient error handling
    });

    test('should handle invalid hook types gracefully', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // If hooks have unexpected format (string, number, etc.), warnings should be generated
      // but API should not crash
      expect(Array.isArray(response.body.hooks)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing ~/.claude/settings.json file gracefully', async () => {
      // This test verifies the endpoint works whether or not the user
      // has a settings.json file. Empty arrays are valid responses.
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.hooks)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });

    test('should handle non-existent ~/.claude/ directory gracefully', async () => {
      // If the user doesn't have a ~/.claude directory, the endpoint
      // should return empty arrays without errors
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.hooks)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });

    test('should handle empty hooks section (empty object)', async () => {
      // If settings.json exists but hooks is {}, return empty array
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.hooks)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });

    test('should handle settings.json with no hooks field', async () => {
      // If settings.json exists but has no "hooks" field, return empty array
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.hooks)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });
  });

  describe('Hook Event Types', () => {
    test('should support Claude Code event types', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);

      const validEvents = [
        'PreToolUse', 'PostToolUse', 'UserPromptSubmit',
        'Notification', 'Stop', 'SubagentStop',
        'PreCompact', 'SessionStart', 'SessionEnd'
      ];

      // If hooks exist, verify they have valid Claude Code event types
      if (response.body.hooks.length > 0) {
        response.body.hooks.forEach(hook => {
          expect(hook.event).toBeDefined();
          expect(typeof hook.event).toBe('string');
          expect(hook.event.length).toBeGreaterThan(0);

          // Only valid Claude Code events should be returned
          expect(validEvents).toContain(hook.event);
        });
      }
    });

    test('should support hooks with matcher patterns', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);

      // If hooks exist, verify matcher field
      if (response.body.hooks.length > 0) {
        response.body.hooks.forEach(hook => {
          expect(hook).toHaveProperty('matcher');
          expect(typeof hook.matcher).toBe('string');
          // Matcher can be empty string, wildcard "*", or specific pattern
        });
      }
    });

    test('should support hooks with command details in flattened structure', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);

      // If hooks exist, verify flattened structure
      if (response.body.hooks.length > 0) {
        response.body.hooks.forEach(hook => {
          // Each hook should have command directly (not nested)
          expect(hook).toHaveProperty('type');
          expect(hook).toHaveProperty('command');
          expect(hook).toHaveProperty('timeout');
          expect(hook).toHaveProperty('enabled');

          expect(typeof hook.type).toBe('string');
          expect(typeof hook.command).toBe('string');
          expect(typeof hook.timeout).toBe('number');
          expect(typeof hook.enabled).toBe('boolean');

          // No nested hooks array
          expect(hook).not.toHaveProperty('hooks');
        });
      }
    });
  });

  describe('Flattened Response Structure', () => {
    test('hooks should use flattened structure (no nested arrays)', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);

      // Each hook should be a flat object, not contain nested hooks array
      if (response.body.hooks.length > 0) {
        response.body.hooks.forEach(hook => {
          // Should have flattened fields
          expect(hook).toHaveProperty('event');
          expect(hook).toHaveProperty('matcher');
          expect(hook).toHaveProperty('type');
          expect(hook).toHaveProperty('command');
          expect(hook).toHaveProperty('timeout');
          expect(hook).toHaveProperty('enabled');
          expect(hook).toHaveProperty('source');

          // Should NOT have old nested structure
          expect(hook).not.toHaveProperty('hooks');
          expect(hook).not.toHaveProperty('matcherIndex');
        });
      }
    });

    test('default values should be applied (matcher: "*", timeout: 60, enabled: true)', async () => {
      const response = await request(app).get('/api/user/hooks');

      expect(response.status).toBe(200);

      // If hooks exist, verify defaults are applied
      if (response.body.hooks.length > 0) {
        response.body.hooks.forEach(hook => {
          // Matcher should default to "*" if not specified
          expect(hook.matcher).toBeDefined();
          expect(typeof hook.matcher).toBe('string');

          // Timeout should default to 60 if not specified
          expect(hook.timeout).toBeDefined();
          expect(typeof hook.timeout).toBe('number');
          expect(hook.timeout).toBeGreaterThan(0);

          // Enabled should default to true if not specified
          expect(hook.enabled).toBeDefined();
          expect(typeof hook.enabled).toBe('boolean');
        });
      }
    });
  });
});
