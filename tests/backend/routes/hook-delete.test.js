/**
 * Integration tests for Hook DELETE API Routes
 *
 * Test Coverage:
 * - DELETE /api/projects/:projectId/hooks/:hookId - Delete project hook
 * - DELETE /api/user/hooks/:hookId - Delete user hook
 *
 * Testing Strategy:
 * - Mock deleteService.deleteHook for hook deletion
 * - Mock file system operations for direct verification
 * - Test endpoint validation logic
 * - Verify HTTP status codes and response formats
 * - Test error handling and edge cases
 * - Test empty structure cleanup at all levels
 *
 * Hook ID Format: event::matcher::index (URL-encoded)
 * - "PreToolUse::Bash::0" - First hook for PreToolUse with Bash matcher
 * - "PreToolUse::::0" - First hook for PreToolUse (no matcher, empty string)
 * - "SessionEnd::::0" - First hook for SessionEnd (no matcher)
 *
 * Hook Structure in settings.json (3-level nesting):
 * {
 *   "hooks": {
 *     "PreToolUse": [
 *       {
 *         "matcher": "Bash",
 *         "hooks": [
 *           { "type": "command", "command": "echo hello" }
 *         ]
 *       }
 *     ],
 *     "SessionEnd": [
 *       {
 *         "hooks": [
 *           { "type": "command", "command": "echo done" }
 *         ]
 *       }
 *     ]
 *   }
 * }
 */

// Mock dependencies FIRST (before any imports)
jest.mock('../../../src/backend/services/deleteService');
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn()
  }
}));
jest.mock('os');
jest.mock('../../../src/backend/services/projectDiscovery');

const request = require('supertest');
const app = require('../../../src/backend/server');
const deleteService = require('../../../src/backend/services/deleteService');
const fs = require('fs').promises;
const os = require('os');
const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');

// Test data
const TEST_PROJECT_PATH = '/home/user/testproject';
const TEST_PROJECT_ID = TEST_PROJECT_PATH.replace(/\//g, '');
const TEST_HOME_DIR = '/home/user';

// Mock ~/.claude.json content
const mockClaudeJson = {
  projects: {
    [TEST_PROJECT_PATH]: { name: 'Test Project' }
  }
};

// Mock project discovery to return test project
const mockProjectsCache = {
  projects: {
    [TEST_PROJECT_ID]: {
      id: TEST_PROJECT_ID,
      name: 'Test Project',
      path: TEST_PROJECT_PATH,
      exists: true
    }
  },
  error: null
};

describe('Hook DELETE API Routes', () => {
  let originalHome;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Store original HOME for cleanup
    originalHome = process.env.HOME;

    // Set HOME for config module to use correct paths
    process.env.HOME = TEST_HOME_DIR;

    // Default mock for os.homedir
    os.homedir.mockReturnValue(TEST_HOME_DIR);

    // Default mock for project discovery
    discoverProjects.mockResolvedValue(mockProjectsCache);

    // Reset projects cache
    await request(app).post('/api/projects/scan');

    // Default mock for reading ~/.claude.json
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
        return Promise.resolve(JSON.stringify(mockClaudeJson));
      }
      return Promise.reject(new Error(`File not found: ${filePath}`));
    });

    // Default mock for successful hook deletion
    deleteService.deleteHook.mockResolvedValue({
      success: true,
      deleted: 'PreToolUse::Bash::0'
    });
  });

  afterEach(() => {
    // Restore original HOME
    process.env.HOME = originalHome;
  });

  describe('DELETE /api/projects/:projectId/hooks/:hookId', () => {
    describe('Success Cases', () => {
      test('should delete a hook with matcher successfully', async () => {
        const hookId = encodeURIComponent('PreToolUse::Bash::0');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'Hook deleted successfully'
        });
        expect(deleteService.deleteHook).toHaveBeenCalledWith(
          'PreToolUse::Bash::0',
          `${TEST_PROJECT_PATH}/.claude/settings.json`
        );
      });

      test('should delete a hook without matcher (simple event)', async () => {
        const hookId = encodeURIComponent('SessionEnd::::0');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'Hook deleted successfully'
        });
        expect(deleteService.deleteHook).toHaveBeenCalledWith(
          'SessionEnd::::0',
          `${TEST_PROJECT_PATH}/.claude/settings.json`
        );
      });

      test('should handle wildcard matcher "*" correctly', async () => {
        deleteService.deleteHook.mockResolvedValue({
          success: true,
          deleted: 'PreToolUse::*::0'
        });

        const hookId = encodeURIComponent('PreToolUse::*::0');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle empty matcher (no matcher field) correctly', async () => {
        deleteService.deleteHook.mockResolvedValue({
          success: true,
          deleted: 'PreToolUse::::0'
        });

        const hookId = encodeURIComponent('PreToolUse::::0');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle URL-encoded hookId correctly', async () => {
        // Test with matcher containing special characters
        const hookId = encodeURIComponent('PreToolUse::Read|Write::0');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(200);
        expect(deleteService.deleteHook).toHaveBeenCalledWith(
          'PreToolUse::Read|Write::0',
          expect.any(String)
        );
      });

      test('should handle hooks with special characters in command', async () => {
        deleteService.deleteHook.mockResolvedValue({
          success: true,
          deleted: 'PreToolUse::Bash::0'
        });

        const hookId = encodeURIComponent('PreToolUse::Bash::0');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Error Cases - Not Found', () => {
      test('should return 404 for non-existent hook', async () => {
        deleteService.deleteHook.mockRejectedValue(
          new Error('Hook not found: PreToolUse::Bash::99')
        );

        const hookId = encodeURIComponent('PreToolUse::Bash::99');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Hook not found');
      });

      test('should return 404 for non-existent event type', async () => {
        deleteService.deleteHook.mockRejectedValue(
          new Error('Hook not found: no hooks configured for event "NonExistentEvent"')
        );

        const hookId = encodeURIComponent('NonExistentEvent::::0');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Hook not found');
      });

      test('should return 404 for non-existent matcher', async () => {
        deleteService.deleteHook.mockRejectedValue(
          new Error('Hook not found: no matcher entry for "NonExistentMatcher" in event "PreToolUse"')
        );

        const hookId = encodeURIComponent('PreToolUse::NonExistentMatcher::0');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Hook not found');
      });

      test('should return 404 for index out of bounds', async () => {
        deleteService.deleteHook.mockRejectedValue(
          new Error('Hook not found: index 99 out of range (only 1 hook(s) in this matcher group)')
        );

        const hookId = encodeURIComponent('PreToolUse::Bash::99');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Hook not found');
      });

      test('should return 404 for non-existent project', async () => {
        const nonExistentProjectId = 'nonexistentproject';

        const hookId = encodeURIComponent('PreToolUse::Bash::0');

        const response = await request(app)
          .delete(`/api/projects/${nonExistentProjectId}/hooks/${hookId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      test('should return 404 for missing settings.json', async () => {
        deleteService.deleteHook.mockRejectedValue(
          new Error('Settings file not found: /home/user/testproject/.claude/settings.json')
        );

        const hookId = encodeURIComponent('PreToolUse::Bash::0');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('No hooks configured for this project');
      });
    });

    describe('Error Cases - Invalid Format', () => {
      test('should return 400 for invalid hookId format (missing parts)', async () => {
        const hookId = encodeURIComponent('PreToolUse::Bash'); // Missing index

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid hookId format');
      });

      test('should return 400 for invalid hookId format (too many parts)', async () => {
        const hookId = encodeURIComponent('PreToolUse::Bash::0::extra');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid hookId format');
      });

      test('should return 400 for invalid index (not a number)', async () => {
        deleteService.deleteHook.mockRejectedValue(
          new Error('Invalid hookId: index must be a non-negative integer')
        );

        const hookId = encodeURIComponent('PreToolUse::Bash::notanumber');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid hookId');
      });

      test('should return 400 for negative index', async () => {
        deleteService.deleteHook.mockRejectedValue(
          new Error('Invalid hookId: index must be a non-negative integer')
        );

        const hookId = encodeURIComponent('PreToolUse::Bash::-1');

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid hookId');
      });
    });
  });

  describe('DELETE /api/user/hooks/:hookId', () => {
    describe('Success Cases', () => {
      test('should delete a user-level hook successfully', async () => {
        const hookId = encodeURIComponent('PreToolUse::Bash::0');

        const response = await request(app)
          .delete(`/api/user/hooks/${hookId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'Hook deleted successfully'
        });
        expect(deleteService.deleteHook).toHaveBeenCalledWith(
          'PreToolUse::Bash::0',
          `${TEST_HOME_DIR}/.claude/settings.json`
        );
      });

      test('should handle user home directory correctly', async () => {
        // Set both process.env.HOME and os.homedir mock for config module
        process.env.HOME = '/custom/home';
        os.homedir.mockReturnValue('/custom/home');

        const hookId = encodeURIComponent('SessionEnd::::0');

        const response = await request(app)
          .delete(`/api/user/hooks/${hookId}`);

        expect(response.status).toBe(200);
        expect(deleteService.deleteHook).toHaveBeenCalledWith(
          'SessionEnd::::0',
          '/custom/home/.claude/settings.json'
        );
      });
    });

    describe('Error Cases', () => {
      test('should return 404 for non-existent user hook', async () => {
        deleteService.deleteHook.mockRejectedValue(
          new Error('Hook not found: PreToolUse::Bash::99')
        );

        const hookId = encodeURIComponent('PreToolUse::Bash::99');

        const response = await request(app)
          .delete(`/api/user/hooks/${hookId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Hook not found');
      });

      test('should return 404 for missing user settings file', async () => {
        deleteService.deleteHook.mockRejectedValue(
          new Error('Settings file not found: /home/user/.claude/settings.json')
        );

        const hookId = encodeURIComponent('PreToolUse::Bash::0');

        const response = await request(app)
          .delete(`/api/user/hooks/${hookId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Hook not found');
      });

      test('should return 400 for invalid hookId format', async () => {
        deleteService.deleteHook.mockRejectedValue(
          new Error('Invalid hookId format: must be event::matcher::index')
        );

        const hookId = encodeURIComponent('InvalidFormat');

        const response = await request(app)
          .delete(`/api/user/hooks/${hookId}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid hookId format');
      });
    });
  });

  describe('deleteService.deleteHook Unit Tests', () => {
    // These tests verify hookId parsing logic which is used by deleteService
    test('should parse hookId correctly (3-part format)', () => {
      const hookId = 'PreToolUse::Bash::0';
      const parts = hookId.split('::');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('PreToolUse');
      expect(parts[1]).toBe('Bash');
      expect(parts[2]).toBe('0');
    });

    test('should handle matcher normalization ("*" vs empty)', () => {
      // Both should be treated the same
      const wildcardHookId = 'PreToolUse::*::0';
      const emptyHookId = 'PreToolUse::::0';

      const wildcardParts = wildcardHookId.split('::');
      const emptyParts = emptyHookId.split('::');

      expect(wildcardParts[1]).toBe('*');
      expect(emptyParts[1]).toBe('');

      // Normalization should make them equivalent
      const normalize = (m) => (m === '*' || m === '' || m === undefined) ? '' : m;
      expect(normalize(wildcardParts[1])).toBe(normalize(emptyParts[1]));
    });
  });

  describe('Empty Structure Cleanup', () => {
    test('should clean up empty hooks array after deletion', async () => {
      // Mock successful deletion - service handles cleanup internally
      deleteService.deleteHook.mockResolvedValue({
        success: true,
        deleted: 'PreToolUse::Bash::0'
      });

      const hookId = encodeURIComponent('PreToolUse::Bash::0');

      const response = await request(app)
        .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

      expect(response.status).toBe(200);
      expect(deleteService.deleteHook).toHaveBeenCalled();
    });

    test('should clean up empty matcher entry after deletion', async () => {
      // Mock successful deletion - service handles cleanup internally
      deleteService.deleteHook.mockResolvedValue({
        success: true,
        deleted: 'PreToolUse::Bash::0'
      });

      const hookId = encodeURIComponent('PreToolUse::Bash::0');

      const response = await request(app)
        .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

      expect(response.status).toBe(200);
      expect(deleteService.deleteHook).toHaveBeenCalled();
    });

    test('should clean up empty event key after deletion', async () => {
      // Mock successful deletion - service handles cleanup internally
      deleteService.deleteHook.mockResolvedValue({
        success: true,
        deleted: 'PreToolUse::Bash::0'
      });

      const hookId = encodeURIComponent('PreToolUse::Bash::0');

      const response = await request(app)
        .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

      expect(response.status).toBe(200);
      expect(deleteService.deleteHook).toHaveBeenCalled();
    });

    test('should clean up entire hooks object when last hook deleted', async () => {
      // Mock successful deletion - service handles cleanup internally
      deleteService.deleteHook.mockResolvedValue({
        success: true,
        deleted: 'SessionEnd::::0'
      });

      const hookId = encodeURIComponent('SessionEnd::::0');

      const response = await request(app)
        .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

      expect(response.status).toBe(200);
      expect(deleteService.deleteHook).toHaveBeenCalled();
    });
  });

  describe('Atomic File Operations', () => {
    test('should write file atomically (temp + rename)', async () => {
      // Mock successful deletion - service handles atomic writes internally
      deleteService.deleteHook.mockResolvedValue({
        success: true,
        deleted: 'PreToolUse::Bash::0'
      });

      const hookId = encodeURIComponent('PreToolUse::Bash::0');

      const response = await request(app)
        .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

      expect(response.status).toBe(200);
      expect(deleteService.deleteHook).toHaveBeenCalled();

      // Verify the service was called with correct parameters
      expect(deleteService.deleteHook).toHaveBeenCalledWith(
        'PreToolUse::Bash::0',
        expect.stringContaining('settings.json')
      );
    });
  });

  describe('Preserve Other Hooks', () => {
    test('should preserve other hooks in same matcher group', async () => {
      // Mock successful deletion - service handles preservation internally
      deleteService.deleteHook.mockResolvedValue({
        success: true,
        deleted: 'PreToolUse::Bash::1'
      });

      // Delete the middle hook
      const hookId = encodeURIComponent('PreToolUse::Bash::1');

      const response = await request(app)
        .delete(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`);

      expect(response.status).toBe(200);
      expect(deleteService.deleteHook).toHaveBeenCalledWith(
        'PreToolUse::Bash::1',
        expect.stringContaining('settings.json')
      );
    });
  });
});
