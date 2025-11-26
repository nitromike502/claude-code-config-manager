/**
 * Tests for copy validation functions
 * Specifically tests the same-project copy prevention logic
 */

const {
  validateNotSameProject,
  extractProjectIdFromPath
} = require('../../../src/backend/routes/copy/validation');

describe('Copy Validation - Same Project Prevention', () => {
  // Save original HOME and restore after tests
  const originalHome = process.env.HOME;

  beforeAll(() => {
    process.env.HOME = '/home/testuser';
  });

  afterAll(() => {
    process.env.HOME = originalHome;
  });

  describe('extractProjectIdFromPath', () => {
    test('should extract project ID from project-scope path', () => {
      const path = '/home/testuser/myproject/.claude/agents/test.md';
      const result = extractProjectIdFromPath(path);
      expect(result).toBe('hometestusermyproject');
    });

    test('should return null for user-scope path', () => {
      const path = '/home/testuser/.claude/agents/test.md';
      const result = extractProjectIdFromPath(path);
      expect(result).toBeNull();
    });

    test('should return null if path does not contain /.claude/', () => {
      const path = '/some/random/path/test.md';
      const result = extractProjectIdFromPath(path);
      expect(result).toBeNull();
    });

    test('should return null for empty path', () => {
      expect(extractProjectIdFromPath('')).toBeNull();
      expect(extractProjectIdFromPath(null)).toBeNull();
      expect(extractProjectIdFromPath(undefined)).toBeNull();
    });

    test('should handle nested project paths', () => {
      const path = '/home/testuser/projects/myapp/.claude/commands/utils/helper.md';
      const result = extractProjectIdFromPath(path);
      expect(result).toBe('hometestuserprojectsmyapp');
    });
  });

  describe('validateNotSameProject', () => {
    describe('User-to-User copy prevention', () => {
      test('should reject copying from user scope to user scope', () => {
        const body = {
          sourcePath: '/home/testuser/.claude/agents/test.md',
          targetScope: 'user',
          targetProjectId: null
        };

        const result = validateNotSameProject(body);
        expect(result).toEqual({
          error: 'Cannot copy configuration to the same location (User Global to User Global)'
        });
      });

      test('should allow copying from user scope to project scope', () => {
        const body = {
          sourcePath: '/home/testuser/.claude/agents/test.md',
          targetScope: 'project',
          targetProjectId: 'hometestusermyproject'
        };

        const result = validateNotSameProject(body);
        expect(result).toBeNull();
      });
    });

    describe('Same-project copy prevention', () => {
      test('should reject copying to same project', () => {
        const body = {
          sourcePath: '/home/testuser/myproject/.claude/agents/test.md',
          targetScope: 'project',
          targetProjectId: 'hometestusermyproject'
        };

        const result = validateNotSameProject(body);
        expect(result).toEqual({
          error: 'Cannot copy configuration to the same project'
        });
      });

      test('should allow copying to different project', () => {
        const body = {
          sourcePath: '/home/testuser/project-a/.claude/agents/test.md',
          targetScope: 'project',
          targetProjectId: 'hometestuserprojectb'
        };

        const result = validateNotSameProject(body);
        expect(result).toBeNull();
      });

      test('should allow copying from project to user scope', () => {
        const body = {
          sourcePath: '/home/testuser/myproject/.claude/agents/test.md',
          targetScope: 'user',
          targetProjectId: null
        };

        const result = validateNotSameProject(body);
        expect(result).toBeNull();
      });
    });

    describe('Backwards compatibility', () => {
      test('should allow paths without .claude/ for backwards compatibility', () => {
        const body = {
          sourcePath: '/source/agents/test.md',
          targetScope: 'user',
          targetProjectId: null
        };

        const result = validateNotSameProject(body);
        expect(result).toBeNull();
      });

      test('should handle missing sourcePath gracefully', () => {
        const body = {
          sourcePath: null,
          targetScope: 'user',
          targetProjectId: null
        };

        const result = validateNotSameProject(body);
        expect(result).toBeNull();
      });
    });
  });
});
