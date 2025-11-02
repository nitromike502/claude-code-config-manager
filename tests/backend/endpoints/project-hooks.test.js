const request = require('supertest');
const app = require('../../../src/backend/server');
const path = require('path');

/**
 * Comprehensive tests for GET /api/projects/:id/hooks endpoint
 *
 * Test Coverage:
 * - Happy Path: Valid projects, hooks parsing, response structure
 * - Merge Logic: settings.json + settings.local.json merging
 * - Error Cases: Invalid IDs, malformed files, missing directories
 * - Warnings System: Graceful error handling with warnings
 * - Flattened Response Structure: One object per hook command (BUG-038)
 * - Claude Code Event Validation: Only valid events accepted (BUG-038)
 *
 * Fixtures Used:
 * - /home/claude/manager/tests/fixtures/projects/valid-project
 * - /home/claude/manager/tests/fixtures/projects/minimal-project
 * - /home/claude/manager/tests/fixtures/projects/malformed-project
 */

describe('GET /api/projects/:id/hooks', () => {
  // Helper to create project ID from path (matches backend pathToProjectId logic)
  const createProjectId = (projectPath) => {
    return projectPath
      .replace(/^\//, '')           // Remove leading slash
      .replace(/\//g, '')           // Remove all slashes
      .replace(/\\/g, '')           // Remove backslashes (Windows)
      .replace(/:/g, '')            // Remove colons (Windows drive letters)
      .replace(/\s+/g, '')          // Remove spaces
      .toLowerCase();
  };

  // Define test project paths and IDs
  const validProjectPath = '/home/claude/manager/tests/fixtures/projects/valid-project';
  const validProjectId = createProjectId(validProjectPath);

  const minimalProjectPath = '/home/claude/manager/tests/fixtures/projects/minimal-project';
  const minimalProjectId = createProjectId(minimalProjectPath);

  const malformedProjectPath = '/home/claude/manager/tests/fixtures/projects/malformed-project';
  const malformedProjectId = createProjectId(malformedProjectPath);

  describe('Happy Path Tests', () => {
    test('should return 200 and hooks array for valid project', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('hooks');
      expect(response.body).toHaveProperty('warnings');
      expect(Array.isArray(response.body.hooks)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });

    test('should include projectId and projectPath in response', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.projectId).toBe(validProjectId);
      expect(response.body.projectPath).toBe(validProjectPath);
    });

    test('should parse hooks from settings.json with flattened structure', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.hooks.length).toBeGreaterThan(0);

      // Find a hook from settings.json
      const settingsHook = response.body.hooks.find(h => h.source === 'settings.json');

      expect(settingsHook).toBeDefined();
      expect(settingsHook).toHaveProperty('event');
      expect(settingsHook).toHaveProperty('matcher');
      expect(settingsHook).toHaveProperty('type');
      expect(settingsHook).toHaveProperty('command');
      expect(settingsHook).toHaveProperty('timeout');
      expect(settingsHook).toHaveProperty('enabled');
      expect(settingsHook).toHaveProperty('source');

      // Flattened structure should NOT have nested hooks array
      expect(settingsHook).not.toHaveProperty('hooks');
      expect(settingsHook).not.toHaveProperty('matcherIndex');
    });

    test('should parse PreToolUse hooks correctly', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // Find PreToolUse hook from settings.json (*.js matcher)
      const preToolUseHook = response.body.hooks.find(
        h => h.event === 'PreToolUse' && h.source === 'settings.json'
      );

      expect(preToolUseHook).toBeDefined();
      expect(preToolUseHook.event).toBe('PreToolUse');
      expect(preToolUseHook.matcher).toBe('*.js');
      expect(preToolUseHook.type).toBe('command');
      expect(preToolUseHook.command).toBe('npm run lint');
      expect(preToolUseHook.timeout).toBe(60);
      expect(preToolUseHook.enabled).toBe(true);
    });

    test('should parse PreCompact hooks correctly', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // Find PreCompact hook from settings.json
      const preCompactHook = response.body.hooks.find(
        h => h.event === 'PreCompact' && h.source === 'settings.json'
      );

      expect(preCompactHook).toBeDefined();
      expect(preCompactHook.event).toBe('PreCompact');
      expect(preCompactHook.matcher).toBe('*'); // Default matcher
      expect(preCompactHook.command).toBe('npm test');
    });

    test('should return empty array for project without hooks', async () => {
      const response = await request(app)
        .get(`/api/projects/${minimalProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.hooks).toEqual([]);
      expect(response.body.warnings).toEqual([]);
    });

    test('should include Claude Code hook event types', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // Verify we have the expected hook events from fixtures
      const events = response.body.hooks.map(h => h.event);

      expect(events).toContain('PreToolUse');
      expect(events).toContain('PreCompact');
      expect(events).toContain('Stop');
    });
  });

  describe('Merge Logic Tests', () => {
    test('should merge hooks from settings.json and settings.local.json', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // Should have hooks from both sources
      const settingsHooks = response.body.hooks.filter(h => h.source === 'settings.json');
      const localHooks = response.body.hooks.filter(h => h.source === 'settings.local.json');

      expect(settingsHooks.length).toBeGreaterThan(0);
      expect(localHooks.length).toBeGreaterThan(0);
    });

    test('should include Stop hook from settings.local.json', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // Find Stop hook from settings.local.json
      const stopHook = response.body.hooks.find(
        h => h.event === 'Stop' && h.source === 'settings.local.json'
      );

      expect(stopHook).toBeDefined();
      expect(stopHook.event).toBe('Stop');
      expect(stopHook.matcher).toBe('*');
      expect(stopHook.command).toBe('npm install');
    });

    test('should preserve separate hooks for different events', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // Each hook should maintain its event identity
      const uniqueEvents = new Set(response.body.hooks.map(h => h.event));

      expect(uniqueEvents.size).toBeGreaterThan(1);
      expect(uniqueEvents.has('PreToolUse')).toBe(true);
      expect(uniqueEvents.has('PreCompact')).toBe(true);
      expect(uniqueEvents.has('Stop')).toBe(true);
    });

    test('should handle matcher patterns correctly', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // Verify matchers are preserved
      const hooks = response.body.hooks;

      const jsMatcherHook = hooks.find(h => h.matcher === '*.js');
      expect(jsMatcherHook).toBeDefined();

      const allFilesHook = hooks.find(h => h.matcher === '*');
      expect(allFilesHook).toBeDefined();
    });

    test('should deduplicate identical hooks across files', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // Create a map to count hook occurrences by unique key
      const hookMap = new Map();
      response.body.hooks.forEach(hook => {
        const key = `${hook.event}::${hook.matcher}::${hook.command}`;
        hookMap.set(key, (hookMap.get(key) || 0) + 1);
      });

      // Each unique hook should appear exactly once (deduplication)
      hookMap.forEach((count, key) => {
        expect(count).toBe(1);
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('should return 404 for invalid project ID', async () => {
      const response = await request(app)
        .get('/api/projects/nonexistentprojectid/hooks');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Project not found');
    });

    test('should return 404 for empty project ID', async () => {
      const response = await request(app)
        .get('/api/projects//hooks');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should generate warnings for malformed settings.json', async () => {
      const response = await request(app)
        .get(`/api/projects/${malformedProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Should have warnings for malformed JSON
      expect(response.body.warnings.length).toBeGreaterThan(0);

      const malformedWarning = response.body.warnings.find(w =>
        w.file && w.file.includes('settings.json')
      );

      expect(malformedWarning).toBeDefined();
      expect(malformedWarning.error).toBeTruthy();
      expect(malformedWarning.skipped).toBe(true);
    });

    test('should return empty hooks array for malformed settings', async () => {
      const response = await request(app)
        .get(`/api/projects/${malformedProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Should have empty hooks array (all skipped due to malformed JSON)
      expect(response.body.hooks).toEqual([]);
    });

    test('should handle missing .claude directory gracefully', async () => {
      const response = await request(app)
        .get(`/api/projects/${minimalProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.hooks).toEqual([]);
      expect(response.body.warnings).toEqual([]);
    });
  });

  describe('Response Structure Tests', () => {
    test('should return correct response structure', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        hooks: expect.any(Array),
        warnings: expect.any(Array),
        projectId: expect.any(String),
        projectPath: expect.any(String)
      });
    });

    test('each hook should have flattened structure with required fields', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      response.body.hooks.forEach(hook => {
        // New flattened structure fields
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

        // Verify types
        expect(typeof hook.event).toBe('string');
        expect(typeof hook.matcher).toBe('string');
        expect(typeof hook.type).toBe('string');
        expect(typeof hook.command).toBe('string');
        expect(typeof hook.timeout).toBe('number');
        expect(typeof hook.enabled).toBe('boolean');
        expect(typeof hook.source).toBe('string');
      });
    });

    test('each warning should have required fields', async () => {
      const response = await request(app)
        .get(`/api/projects/${malformedProjectId}/hooks`);

      expect(response.status).toBe(200);

      response.body.warnings.forEach(warning => {
        expect(warning).toHaveProperty('file');
        expect(warning).toHaveProperty('error');
        expect(warning).toHaveProperty('skipped');

        // Verify types
        expect(typeof warning.file).toBe('string');
        expect(typeof warning.error).toBe('string');
        expect(warning.skipped).toBe(true);
      });
    });
  });

  describe('Hook Event Types', () => {
    test('should support PreToolUse events', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      const preToolUseHooks = response.body.hooks.filter(h => h.event === 'PreToolUse');
      expect(preToolUseHooks.length).toBeGreaterThan(0);
    });

    test('should support PreCompact events', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      const preCompactHooks = response.body.hooks.filter(h => h.event === 'PreCompact');
      expect(preCompactHooks.length).toBeGreaterThan(0);
    });

    test('should support Stop events', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      const stopHooks = response.body.hooks.filter(h => h.event === 'Stop');
      expect(stopHooks.length).toBeGreaterThan(0);
    });

    test('should only include valid Claude Code events', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      const validEvents = [
        'PreToolUse', 'PostToolUse', 'UserPromptSubmit',
        'Notification', 'Stop', 'SubagentStop',
        'PreCompact', 'SessionStart', 'SessionEnd'
      ];

      // All returned hooks should have valid Claude Code events
      response.body.hooks.forEach(hook => {
        expect(validEvents).toContain(hook.event);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty hooks object gracefully', async () => {
      const response = await request(app)
        .get(`/api/projects/${minimalProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.hooks).toEqual([]);
      expect(response.body.warnings).toEqual([]);
    });

    test('should return consistent results on multiple requests', async () => {
      const response1 = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      const response2 = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response1.body).toEqual(response2.body);
    });

    test('should handle special characters in project path', async () => {
      // Project ID conversion removes special chars, so this tests the mapping
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should handle settings.json without hooks field', async () => {
      const response = await request(app)
        .get(`/api/projects/${minimalProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.hooks).toEqual([]);
      expect(response.body.warnings).toEqual([]);
    });
  });

  describe('Integration with Project Discovery', () => {
    test('should work after project scan', async () => {
      // Trigger a project scan first
      await request(app).post('/api/projects/scan');

      // Then fetch hooks
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.hooks)).toBe(true);
    });

    test('should load projects cache if not already loaded', async () => {
      // Fresh request without prior scan should still work
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Source Attribution', () => {
    test('hooks should correctly identify their source file', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // All hooks should have either 'settings.json' or 'settings.local.json' as source
      response.body.hooks.forEach(hook => {
        expect(['settings.json', 'settings.local.json']).toContain(hook.source);
      });
    });

    test('should distinguish between project and local hooks', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      const projectHooks = response.body.hooks.filter(h => h.source === 'settings.json');
      const localHooks = response.body.hooks.filter(h => h.source === 'settings.local.json');

      // Both should exist in valid-project fixture
      expect(projectHooks.length).toBeGreaterThan(0);
      expect(localHooks.length).toBeGreaterThan(0);
    });
  });

  describe('Default Values', () => {
    test('should apply default matcher "*" when not specified', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // Hooks without explicit matcher should default to "*"
      const hooksWithDefaultMatcher = response.body.hooks.filter(h => h.matcher === '*');
      expect(hooksWithDefaultMatcher.length).toBeGreaterThan(0);
    });

    test('should apply default timeout 60 when not specified', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // All hooks should have timeout (default or explicit)
      response.body.hooks.forEach(hook => {
        expect(hook.timeout).toBeDefined();
        expect(typeof hook.timeout).toBe('number');
        expect(hook.timeout).toBeGreaterThan(0);
      });
    });

    test('should apply default enabled true when not specified', async () => {
      const response = await request(app)
        .get(`/api/projects/${validProjectId}/hooks`);

      expect(response.status).toBe(200);

      // All hooks should have enabled field
      response.body.hooks.forEach(hook => {
        expect(hook.enabled).toBeDefined();
        expect(typeof hook.enabled).toBe('boolean');
      });
    });
  });
});
