/**
 * Integration tests for Rules CRUD API Routes
 *
 * Test Coverage:
 * - GET /api/projects/:projectId/rules - Get project rules
 * - GET /api/user/rules - Get user rules
 * - DELETE /api/projects/:projectId/rules/* - Delete project rule
 * - DELETE /api/user/rules/* - Delete user rule
 *
 * Testing Strategy:
 * - Mock file system operations (fs.promises)
 * - Mock service dependencies (deleteService, projectDiscovery, rulesParser)
 * - Test endpoint validation logic
 * - Verify HTTP status codes and response formats
 * - Test error handling and edge cases
 * - Test nested rule paths (e.g., frontend/react)
 *
 * Fixtures Used:
 * - Mock file system responses (no actual file operations)
 */

// Mock dependencies FIRST (before any imports)
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn()
  }
}));
jest.mock('../../../src/backend/services/deleteService');
jest.mock('../../../src/backend/services/projectDiscovery');
jest.mock('../../../src/backend/parsers/rulesParser');

const request = require('supertest');
const app = require('../../../src/backend/server');
const deleteService = require('../../../src/backend/services/deleteService');
const { discoverProjects, getProjectRules, getUserRules } = require('../../../src/backend/services/projectDiscovery');
const rulesParser = require('../../../src/backend/parsers/rulesParser');

// Mock project discovery to return test project
const mockProjectsCache = {
  projects: {
    'testproject': {
      id: 'testproject',
      name: 'Test Project',
      path: '/home/user/testproject',
      exists: true
    }
  },
  error: null
};

const mockRules = [
  {
    name: 'coding-standards',
    description: 'Coding Standards',
    paths: null,
    isConditional: false,
    content: '# Coding Standards\nFollow these rules.',
    filePath: '/home/user/testproject/.claude/rules/coding-standards.md',
    scope: 'project',
    hasError: false,
    parseError: null
  },
  {
    name: 'frontend/react',
    description: 'React Standards',
    paths: ['src/**/*.tsx', 'src/**/*.jsx'],
    isConditional: true,
    content: '# React Standards\nUse hooks.',
    filePath: '/home/user/testproject/.claude/rules/frontend/react.md',
    scope: 'project',
    hasError: false,
    parseError: null
  }
];

const mockUserRules = [
  {
    name: 'global-style',
    description: 'Global Style Guide',
    paths: null,
    isConditional: false,
    content: '# Global Style Guide\nConsistency matters.',
    filePath: '/home/user/.claude/rules/global-style.md',
    scope: 'user',
    hasError: false,
    parseError: null
  }
];

describe('Rules CRUD API Routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Default mock for project discovery
    discoverProjects.mockResolvedValue(mockProjectsCache);

    // Default mocks for rules functions
    getProjectRules.mockResolvedValue({ rules: mockRules, warnings: [] });
    getUserRules.mockResolvedValue({ rules: mockUserRules, warnings: [] });

    // Reset the projects cache by triggering a scan
    await request(app).post('/api/projects/scan');
  });

  describe('GET /api/projects/:projectId/rules', () => {
    test('should return rules for a valid project', async () => {
      const response = await request(app)
        .get('/api/projects/testproject/rules');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.rules).toEqual(mockRules);
      expect(response.body.warnings).toEqual([]);
      expect(response.body.projectId).toBe('testproject');
      expect(response.body.projectPath).toBe('/home/user/testproject');
    });

    test('should return empty rules array when no rules exist', async () => {
      getProjectRules.mockResolvedValue({ rules: [], warnings: [] });

      const response = await request(app)
        .get('/api/projects/testproject/rules');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.rules).toEqual([]);
    });

    test('should return warnings when present', async () => {
      getProjectRules.mockResolvedValue({
        rules: mockRules,
        warnings: ['Warning: could not fully parse /some/file.md: YAML error']
      });

      const response = await request(app)
        .get('/api/projects/testproject/rules');

      expect(response.status).toBe(200);
      expect(response.body.warnings).toHaveLength(1);
      expect(response.body.warnings[0]).toContain('YAML error');
    });

    test('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/nonexistent/rules');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Project not found');
    });

    test('should return 404 for project with non-existent directory', async () => {
      discoverProjects.mockResolvedValue({
        projects: {
          'missingdir': {
            id: 'missingdir',
            name: 'Missing Dir',
            path: '/home/user/missingdir',
            exists: false
          }
        },
        error: null
      });
      await request(app).post('/api/projects/scan');

      const response = await request(app)
        .get('/api/projects/missingdir/rules');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('does not exist');
    });

    test('should return 400 for invalid project ID format', async () => {
      const response = await request(app)
        .get('/api/projects/invalid..id/rules');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle service errors gracefully', async () => {
      getProjectRules.mockRejectedValue(new Error('File system error'));

      const response = await request(app)
        .get('/api/projects/testproject/rules');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('File system error');
    });
  });

  describe('GET /api/user/rules', () => {
    test('should return user rules', async () => {
      const response = await request(app)
        .get('/api/user/rules');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.rules).toEqual(mockUserRules);
      expect(response.body.warnings).toEqual([]);
    });

    test('should return empty rules when no user rules exist', async () => {
      getUserRules.mockResolvedValue({ rules: [], warnings: [] });

      const response = await request(app)
        .get('/api/user/rules');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.rules).toEqual([]);
    });

    test('should handle service errors gracefully', async () => {
      getUserRules.mockRejectedValue(new Error('Permission denied'));

      const response = await request(app)
        .get('/api/user/rules');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Permission denied');
    });
  });

  describe('DELETE /api/projects/:projectId/rules/*', () => {
    beforeEach(() => {
      deleteService.deleteFile.mockResolvedValue();
    });

    test('should delete a simple rule successfully', async () => {
      const response = await request(app)
        .delete('/api/projects/testproject/rules/coding-standards');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('coding-standards');
      expect(response.body.deleted).toContain('coding-standards.md');
    });

    test('should delete a nested rule path successfully', async () => {
      const response = await request(app)
        .delete('/api/projects/testproject/rules/frontend/react');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('frontend/react');
      expect(response.body.deleted).toContain('frontend/react.md');
    });

    test('should handle rule path with .md extension', async () => {
      const response = await request(app)
        .delete('/api/projects/testproject/rules/coding-standards.md');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should not double-add .md
      expect(response.body.deleted).toMatch(/coding-standards\.md$/);
      expect(response.body.deleted).not.toContain('.md.md');
    });

    test('should return 404 for non-existent rule', async () => {
      deleteService.deleteFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .delete('/api/projects/testproject/rules/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Rule not found');
    });

    test('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete('/api/projects/nonexistent/rules/some-rule');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 for invalid project ID format', async () => {
      const response = await request(app)
        .delete('/api/projects/invalid..id/rules/some-rule');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle file system errors gracefully', async () => {
      deleteService.deleteFile.mockRejectedValue(new Error('Permission denied'));

      const response = await request(app)
        .delete('/api/projects/testproject/rules/coding-standards');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Permission denied');
    });
  });

  describe('DELETE /api/user/rules/*', () => {
    beforeEach(() => {
      deleteService.deleteFile.mockResolvedValue();
    });

    test('should delete a user rule successfully', async () => {
      const response = await request(app)
        .delete('/api/user/rules/global-style');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('global-style');
      expect(response.body.deleted).toContain('global-style.md');
    });

    test('should delete a nested user rule successfully', async () => {
      const response = await request(app)
        .delete('/api/user/rules/frontend/vue');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('frontend/vue');
    });

    test('should return 404 for non-existent user rule', async () => {
      deleteService.deleteFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .delete('/api/user/rules/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User rule not found');
    });

    test('should handle file system errors gracefully', async () => {
      deleteService.deleteFile.mockRejectedValue(new Error('Disk error'));

      const response = await request(app)
        .delete('/api/user/rules/some-rule');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Disk error');
    });
  });
});
