/**
 * Integration tests for Skill DELETE API Routes
 *
 * Test Coverage:
 * - DELETE /api/projects/:projectId/skills/:skillName - Delete project skill directory
 * - DELETE /api/user/skills/:skillName - Delete user-level skill directory
 *
 * Testing Strategy:
 * - Mock deleteService.deleteDirectory for directory deletion
 * - Test endpoint validation logic
 * - Verify HTTP status codes and response formats
 * - Test error handling and edge cases
 * - Skills are DIRECTORIES (containing SKILL.md + supporting files), not single files
 *
 * Fixtures Used:
 * - Mock deleteService responses (no actual file system operations)
 */

// Mock dependencies FIRST (before any imports)
jest.mock('../../../src/backend/services/deleteService');
jest.mock('../../../src/backend/services/projectDiscovery');

const request = require('supertest');
const app = require('../../../src/backend/server');
const deleteService = require('../../../src/backend/services/deleteService');
const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');

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

describe('Skill DELETE API Routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Default mock for project discovery
    discoverProjects.mockResolvedValue(mockProjectsCache);

    // Reset the projects cache by triggering a scan
    // This ensures the cache is cleared and will call our mocked discoverProjects
    await request(app).post('/api/projects/scan');
  });

  describe('DELETE /api/projects/:projectId/skills/:skillName', () => {
    beforeEach(() => {
      // Default mock: successful directory deletion
      deleteService.deleteDirectory.mockResolvedValue({
        success: true,
        deleted: '/home/user/testproject/.claude/skills/test-skill'
      });
    });

    describe('Success cases', () => {
      test('should delete skill directory successfully', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/skills/test-skill');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
        expect(response.body.deleted).toBeDefined();
        expect(deleteService.deleteDirectory).toHaveBeenCalled();
      });

      test('should call deleteDirectory with correct path', async () => {
        await request(app)
          .delete('/api/projects/testproject/skills/test-skill');

        expect(deleteService.deleteDirectory).toHaveBeenCalledWith(
          expect.stringContaining('.claude/skills/test-skill')
        );
      });

      test('should delete skill with supporting files', async () => {
        deleteService.deleteDirectory.mockResolvedValue({
          success: true,
          deleted: '/home/user/testproject/.claude/skills/complex-skill'
        });

        const response = await request(app)
          .delete('/api/projects/testproject/skills/complex-skill');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('complex-skill');
      });

      test('should delete skill with subdirectories', async () => {
        deleteService.deleteDirectory.mockResolvedValue({
          success: true,
          deleted: '/home/user/testproject/.claude/skills/nested-skill'
        });

        const response = await request(app)
          .delete('/api/projects/testproject/skills/nested-skill');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // deleteDirectory handles recursive deletion
        expect(deleteService.deleteDirectory).toHaveBeenCalledTimes(1);
      });

      test('should return deleted path in response', async () => {
        const expectedPath = '/home/user/testproject/.claude/skills/test-skill';
        deleteService.deleteDirectory.mockResolvedValue({
          success: true,
          deleted: expectedPath
        });

        const response = await request(app)
          .delete('/api/projects/testproject/skills/test-skill');

        expect(response.status).toBe(200);
        expect(response.body.deleted).toBe(expectedPath);
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid skill name format (uppercase)', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/skills/TestSkill');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid skill name format');
      });

      test('should reject skill name with special characters', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/skills/test_skill!');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid skill name format');
      });

      test('should reject skill name with spaces', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/skills/test skill');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid skill name format');
      });

      test('should reject skill name with path traversal', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/skills/../evil-skill');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        // Caught by validation middleware
      });

      test('should reject empty skill name', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/skills/');

        // Express routing doesn't match empty parameter
        expect(response.status).toBe(404);
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        // Trigger cache update
        await request(app).post('/api/projects/scan');

        const response = await request(app)
          .delete('/api/projects/nonexistent/skills/test-skill');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });

      test('should return 404 for non-existent skill', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('Directory not found: /home/user/testproject/.claude/skills/missing-skill')
        );

        const response = await request(app)
          .delete('/api/projects/testproject/skills/missing-skill');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Skill not found');
      });

      test('should return 404 when skill directory does not exist', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('Directory not found')
        );

        const response = await request(app)
          .delete('/api/projects/testproject/skills/nonexistent-skill');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Skill not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('Permission denied')
        );

        const response = await request(app)
          .delete('/api/projects/testproject/skills/test-skill');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      test('should handle disk full errors', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('ENOSPC: no space left on device')
        );

        const response = await request(app)
          .delete('/api/projects/testproject/skills/test-skill');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });

      test('should handle permission denied errors', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('EACCES: permission denied')
        );

        const response = await request(app)
          .delete('/api/projects/testproject/skills/test-skill');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });

      test('should handle unexpected errors', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('Unexpected file system error')
        );

        const response = await request(app)
          .delete('/api/projects/testproject/skills/test-skill');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('should handle skill with hyphens in name', async () => {
        deleteService.deleteDirectory.mockResolvedValue({
          success: true,
          deleted: '/home/user/testproject/.claude/skills/my-complex-skill'
        });

        const response = await request(app)
          .delete('/api/projects/testproject/skills/my-complex-skill');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle skill with numbers in name', async () => {
        deleteService.deleteDirectory.mockResolvedValue({
          success: true,
          deleted: '/home/user/testproject/.claude/skills/skill-123'
        });

        const response = await request(app)
          .delete('/api/projects/testproject/skills/skill-123');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should verify deleteDirectory is called (not deleteFile)', async () => {
        await request(app)
          .delete('/api/projects/testproject/skills/test-skill');

        // Should use deleteDirectory for skill directories, not deleteFile
        expect(deleteService.deleteDirectory).toHaveBeenCalled();
        expect(deleteService.deleteFile).not.toHaveBeenCalled();
      });
    });
  });

  describe('DELETE /api/user/skills/:skillName', () => {
    beforeEach(() => {
      // Default mock: successful directory deletion
      deleteService.deleteDirectory.mockResolvedValue({
        success: true,
        deleted: '/home/user/.claude/skills/test-skill'
      });
    });

    describe('Success cases', () => {
      test('should delete user skill directory successfully', async () => {
        const response = await request(app)
          .delete('/api/user/skills/test-skill');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
        expect(response.body.deleted).toBeDefined();
        expect(deleteService.deleteDirectory).toHaveBeenCalled();
      });

      test('should call deleteDirectory with correct user path', async () => {
        await request(app)
          .delete('/api/user/skills/test-skill');

        expect(deleteService.deleteDirectory).toHaveBeenCalledWith(
          expect.stringContaining('.claude/skills/test-skill')
        );
        // Should be user home directory, not project directory
        expect(deleteService.deleteDirectory).toHaveBeenCalledWith(
          expect.not.stringContaining('/testproject/')
        );
      });

      test('should delete user skill with supporting files', async () => {
        deleteService.deleteDirectory.mockResolvedValue({
          success: true,
          deleted: '/home/user/.claude/skills/global-skill'
        });

        const response = await request(app)
          .delete('/api/user/skills/global-skill');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('global-skill');
      });

      test('should return deleted path in response', async () => {
        // Use actual user home from response instead of hardcoded path
        const response = await request(app)
          .delete('/api/user/skills/test-skill');

        expect(response.status).toBe(200);
        expect(response.body.deleted).toBeDefined();
        expect(response.body.deleted).toContain('.claude/skills/test-skill');
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid skill name format (uppercase)', async () => {
        const response = await request(app)
          .delete('/api/user/skills/GlobalSkill');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid skill name format');
      });

      test('should reject skill name with special characters', async () => {
        const response = await request(app)
          .delete('/api/user/skills/skill@123');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid skill name format');
      });

      test('should reject skill name with spaces', async () => {
        const response = await request(app)
          .delete('/api/user/skills/user skill');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid skill name format');
      });

      test('should reject skill name with path traversal', async () => {
        const response = await request(app)
          .delete('/api/user/skills/../etc/passwd');

        // Express routing doesn't match path traversal, returns 404
        expect(response.status).toBe(404);
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent user skill', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('Directory not found: /home/user/.claude/skills/missing-skill')
        );

        const response = await request(app)
          .delete('/api/user/skills/missing-skill');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('User skill not found');
      });

      test('should return 404 when user skill directory does not exist', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('Directory not found')
        );

        const response = await request(app)
          .delete('/api/user/skills/nonexistent-skill');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('User skill not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('Permission denied')
        );

        const response = await request(app)
          .delete('/api/user/skills/test-skill');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      test('should handle permission denied errors', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('EACCES: permission denied')
        );

        const response = await request(app)
          .delete('/api/user/skills/test-skill');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });

      test('should handle unexpected errors', async () => {
        deleteService.deleteDirectory.mockRejectedValue(
          new Error('Unexpected error during deletion')
        );

        const response = await request(app)
          .delete('/api/user/skills/test-skill');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('should handle user skill with hyphens in name', async () => {
        deleteService.deleteDirectory.mockResolvedValue({
          success: true,
          deleted: '/home/user/.claude/skills/my-global-skill'
        });

        const response = await request(app)
          .delete('/api/user/skills/my-global-skill');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle user skill with numbers in name', async () => {
        deleteService.deleteDirectory.mockResolvedValue({
          success: true,
          deleted: '/home/user/.claude/skills/global-skill-v2'
        });

        const response = await request(app)
          .delete('/api/user/skills/global-skill-v2');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should verify deleteDirectory is called (not deleteFile)', async () => {
        await request(app)
          .delete('/api/user/skills/test-skill');

        // Should use deleteDirectory for skill directories, not deleteFile
        expect(deleteService.deleteDirectory).toHaveBeenCalled();
        expect(deleteService.deleteFile).not.toHaveBeenCalled();
      });
    });
  });
});
