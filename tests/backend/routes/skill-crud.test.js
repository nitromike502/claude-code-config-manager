/**
 * Integration tests for Skill CRUD API Routes
 *
 * Test Coverage:
 * - PUT /api/projects/:projectId/skills/:skillName - Update project skill
 * - PUT /api/user/skills/:skillName - Update user-level skill
 *
 * Testing Strategy:
 * - Mock file system operations (fs.promises)
 * - Mock service dependencies (updateService, parseSkill)
 * - Test endpoint validation logic
 * - Verify HTTP status codes and response formats
 * - Test error handling and edge cases
 * - Test external reference detection
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
jest.mock('../../../src/backend/services/updateService');
jest.mock('../../../src/backend/parsers/skillParser');
jest.mock('../../../src/backend/services/projectDiscovery');

const request = require('supertest');
const app = require('../../../src/backend/server');
const fs = require('fs').promises;
const updateService = require('../../../src/backend/services/updateService');
const { parseSkill } = require('../../../src/backend/parsers/skillParser');
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

describe('Skill CRUD API Routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Default mock for project discovery
    discoverProjects.mockResolvedValue(mockProjectsCache);

    // Reset the projects cache by triggering a scan
    // This ensures the cache is cleared and will call our mocked discoverProjects
    await request(app).post('/api/projects/scan');
  });

  describe('PUT /api/projects/:projectId/skills/:skillName', () => {
    const validUpdatePayload = {
      description: 'Updated skill description for testing purposes'
    };

    beforeEach(() => {
      // Mock SKILL.md exists
      fs.access.mockResolvedValue();

      // Mock successful update
      updateService.updateYamlFrontmatter.mockResolvedValue({ success: true });

      // Mock parseSkill to return updated skill
      parseSkill.mockResolvedValue({
        name: 'test-skill',
        description: 'Updated skill description for testing purposes',
        allowedTools: ['bash', 'read'],
        content: 'This is a test skill with basic content.',
        directoryPath: '/home/user/testproject/.claude/skills/test-skill',
        scope: 'project',
        hasError: false,
        parseError: null,
        subdirectories: [],
        fileCount: 1,
        files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
        externalReferences: []
      });
    });

    describe('Success cases', () => {
      test('should update skill description successfully', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated skill description for testing purposes' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Skill updated successfully');
        expect(response.body.skill).toBeDefined();
        expect(response.body.skill.description).toBe('Updated skill description for testing purposes');
      });

      test('should update skill content successfully', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-skill\ndescription: Test\n---\n\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'This is updated content for the skill.',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ content: 'This is updated content for the skill.' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(fs.readFile).toHaveBeenCalled();
      });

      test('should update skill allowedTools successfully', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: ['bash', 'read', 'write'],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ allowedTools: ['bash', 'read', 'write'] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle allowedTools as comma-separated string', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: ['bash', 'read', 'write'],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ allowedTools: 'bash, read, write' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update multiple fields simultaneously', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-skill\n---\n\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Updated description for multiple fields test',
          allowedTools: ['bash'],
          content: 'New content for multiple fields',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({
            description: 'Updated description for multiple fields test',
            allowedTools: ['bash'],
            content: 'New content for multiple fields'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should strip frontmatter from content if it contains it', async () => {
        // Mock existing skill file
        fs.readFile.mockResolvedValue('---\nname: test-skill\ndescription: Test\n---\n\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'This is the cleaned content without frontmatter',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        // Send content with embedded frontmatter (simulating UI bug)
        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({
            content: '---\nname: embedded\ndescription: Embedded frontmatter\n---\nThis is the cleaned content without frontmatter'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify updateFile was called with cleaned content (without duplicate frontmatter)
        expect(updateService.updateFile).toHaveBeenCalled();
        const updateFileCall = updateService.updateFile.mock.calls[0][1];

        // Should only have 2 frontmatter delimiters, not 4
        const delimiterCount = (updateFileCall.match(/^---$/gm) || []).length;
        expect(delimiterCount).toBe(2);

        // Should not contain "embedded" in frontmatter
        expect(updateFileCall).not.toMatch(/name: embedded/);
      });

      test('should preserve fields not included in update', async () => {
        // Only update description, other fields should be preserved
        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Only description updated' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(updateService.updateYamlFrontmatter).toHaveBeenCalled();
      });
    });

    describe('External Reference Detection', () => {
      test('should return externalReferences array in response', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'Test content with refs',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: [
            { file: 'SKILL.md', line: 5, reference: '/home/user/external/file.txt', type: 'absolute', severity: 'error' }
          ]
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated with refs' });

        expect(response.status).toBe(200);
        expect(response.body.skill.externalReferences).toBeDefined();
        expect(response.body.skill.externalReferences).toHaveLength(1);
      });

      test('should return warnings array when external refs exist', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: [
            { file: 'SKILL.md', line: 5, reference: '/home/user/external/file.txt', type: 'absolute', severity: 'error' },
            { file: 'SKILL.md', line: 6, reference: '~/shared/script.py', type: 'home', severity: 'warning' }
          ]
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated skill' });

        expect(response.status).toBe(200);
        expect(response.body.warnings).toBeDefined();
        expect(response.body.warnings).toHaveLength(1);
        expect(response.body.warnings[0]).toContain('2 external reference');
      });

      test('should return empty externalReferences for clean skills', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated clean skill' });

        expect(response.status).toBe(200);
        expect(response.body.skill.externalReferences).toEqual([]);
        expect(response.body.warnings).toBeUndefined();
      });

      test('should detect absolute path references', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: [
            { file: 'SKILL.md', line: 1, reference: '/etc/config.txt', type: 'absolute', severity: 'error' }
          ]
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated skill' });

        expect(response.status).toBe(200);
        expect(response.body.skill.externalReferences[0].type).toBe('absolute');
      });

      test('should detect home directory references', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: [
            { file: 'SKILL.md', line: 2, reference: '~/shared/utils.js', type: 'home', severity: 'warning' }
          ]
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated skill' });

        expect(response.status).toBe(200);
        expect(response.body.skill.externalReferences[0].type).toBe('home');
      });

      test('should detect parent directory escapes', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: [
            { file: 'SKILL.md', line: 3, reference: '../../shared/data.json', type: 'relative', severity: 'warning' }
          ]
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated skill' });

        expect(response.status).toBe(200);
        expect(response.body.skill.externalReferences[0].type).toBe('relative');
      });
    });

    describe('File Integrity', () => {
      test('should only modify SKILL.md (not supporting files)', async () => {
        // Mock skill with supporting files
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Updated skill',
          allowedTools: [],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: ['data'],
          fileCount: 3,
          files: [
            { name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' },
            { name: 'helper.js', relativePath: 'helper.js', type: 'file' },
            { name: 'data', relativePath: 'data', type: 'directory' },
            { name: 'config.json', relativePath: 'data/config.json', type: 'file' }
          ],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated skill with supporting files' });

        expect(response.status).toBe(200);
        // Verify we only called updateYamlFrontmatter once (for SKILL.md)
        expect(updateService.updateYamlFrontmatter).toHaveBeenCalledTimes(1);
      });

      test('should preserve file tree structure', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Updated skill',
          allowedTools: [],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: ['data', 'utils'],
          fileCount: 4,
          files: [
            { name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' },
            { name: 'data', relativePath: 'data', type: 'directory' },
            { name: 'utils', relativePath: 'utils', type: 'directory' }
          ],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated skill' });

        expect(response.status).toBe(200);
        expect(response.body.skill.subdirectories).toEqual(['data', 'utils']);
      });

      test('should preserve subdirectory contents', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Updated skill',
          allowedTools: [],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: ['data'],
          fileCount: 3,
          files: [
            { name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' },
            { name: 'data', relativePath: 'data', type: 'directory' },
            { name: 'config.json', relativePath: 'data/config.json', type: 'file' }
          ],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated skill' });

        expect(response.status).toBe(200);
        // Verify subdirectory files are still present in response
        const dataFiles = response.body.skill.files.filter(f => f.relativePath.startsWith('data/'));
        expect(dataFiles.length).toBeGreaterThan(0);
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid skill name format', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/Invalid_Skill_123!')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid skill name format');
      });

      test('should reject skill name with uppercase letters', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/TestSkill')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid skill name format');
      });

      test('should reject skill name with spaces', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/test skill')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should reject description less than 10 characters', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Short' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid description');
        expect(response.body.details).toContain('at least 10 characters');
      });

      test('should reject empty request body', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid request body');
      });

      test('should reject null request body', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send(null);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should reject array request body', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send(['invalid']);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should reject invalid allowedTools format', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ allowedTools: 123 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid allowedTools');
      });

      test('should reject non-string content', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ content: 123 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid content');
      });

      test('should silently ignore skill rename attempt', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ name: 'renamed-skill', description: 'Valid description for testing' });

        // Name field should be silently ignored, update should succeed
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Skill updated successfully');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        const response = await request(app)
          .put('/api/projects/nonexistent/skills/test-skill')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });

      test('should return 404 for non-existent skill', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .put('/api/projects/testproject/skills/missing-skill')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Skill not found');
      });

      test('should return 404 for project that exists but skill does not', async () => {
        // First access check passes (project exists), second fails (skill doesn't)
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .put('/api/projects/testproject/skills/nonexistent-skill')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Skill not found');
      });
    });

    describe('Edge cases', () => {
      test('should handle skill with no frontmatter', async () => {
        fs.readFile.mockResolvedValue('No frontmatter content');

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Adding description' });

        // Should handle gracefully (updateYamlFrontmatter will add frontmatter)
        expect(response.status).toBe(200);
      });

      test('should handle skill with malformed YAML', async () => {
        fs.readFile.mockResolvedValue('---\ninvalid: yaml: content: bad\n---\nContent');
        updateService.updateYamlFrontmatter.mockRejectedValue(new Error('YAML parsing error'));

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: 'Updated description' });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });

      test('should handle very long description', async () => {
        const longDescription = 'A'.repeat(1000);

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ description: longDescription });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle empty allowedTools array', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'Test content',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ allowedTools: [] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle content with special characters', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-skill\n---\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'Special chars: @#$%^&*(){}[]|\\:;"<>?,./~`',
          directoryPath: '/home/user/testproject/.claude/skills/test-skill',
          scope: 'project',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send({ content: 'Special chars: @#$%^&*(){}[]|\\:;"<>?,./~`' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        fs.access.mockResolvedValue();
        updateService.updateYamlFrontmatter.mockRejectedValue(new Error('Disk full'));

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send(validUpdatePayload);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });

      test('should handle parseSkill errors gracefully', async () => {
        fs.access.mockResolvedValue();
        updateService.updateYamlFrontmatter.mockResolvedValue({ success: true });
        parseSkill.mockRejectedValue(new Error('Parser error'));

        const response = await request(app)
          .put('/api/projects/testproject/skills/test-skill')
          .send(validUpdatePayload);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('PUT /api/user/skills/:skillName', () => {
    const validUpdatePayload = {
      description: 'Updated user skill description for testing'
    };

    beforeEach(() => {
      // Mock SKILL.md exists
      fs.access.mockResolvedValue();

      // Mock successful update
      updateService.updateYamlFrontmatter.mockResolvedValue({ success: true });

      // Mock parseSkill to return updated user skill
      parseSkill.mockResolvedValue({
        name: 'test-skill',
        description: 'Updated user skill description for testing',
        allowedTools: ['bash', 'read'],
        content: 'This is a test user skill.',
        directoryPath: '/home/user/.claude/skills/test-skill',
        scope: 'user',
        hasError: false,
        parseError: null,
        subdirectories: [],
        fileCount: 1,
        files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
        externalReferences: []
      });
    });

    describe('Success cases', () => {
      test('should update user skill description successfully', async () => {
        const response = await request(app)
          .put('/api/user/skills/test-skill')
          .send({ description: 'Updated user skill description for testing' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('User skill updated successfully');
        expect(response.body.skill).toBeDefined();
        expect(response.body.skill.description).toBe('Updated user skill description for testing');
        expect(response.body.skill.scope).toBe('user');
      });

      test('should update user skill content successfully', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-skill\ndescription: Test\n---\n\nOld user content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'Updated user skill content for testing',
          directoryPath: '/home/user/.claude/skills/test-skill',
          scope: 'user',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/user/skills/test-skill')
          .send({ content: 'Updated user skill content for testing' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update user skill allowedTools successfully', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: ['bash', 'read', 'write', 'glob'],
          content: 'Test content',
          directoryPath: '/home/user/.claude/skills/test-skill',
          scope: 'user',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/user/skills/test-skill')
          .send({ allowedTools: ['bash', 'read', 'write', 'glob'] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should strip frontmatter from user skill content if it contains it', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-skill\ndescription: Test\n---\n\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'This is the cleaned user skill content',
          directoryPath: '/home/user/.claude/skills/test-skill',
          scope: 'user',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: []
        });

        const response = await request(app)
          .put('/api/user/skills/test-skill')
          .send({
            content: '---\nname: embedded-user\ndescription: Embedded\n---\nThis is the cleaned user skill content'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(updateService.updateFile).toHaveBeenCalled();
        const updateFileCall = updateService.updateFile.mock.calls[0][1];

        const delimiterCount = (updateFileCall.match(/^---$/gm) || []).length;
        expect(delimiterCount).toBe(2);

        expect(updateFileCall).not.toMatch(/name: embedded-user/);
      });
    });

    describe('External Reference Detection (User Skills)', () => {
      test('should return external references for user skills', async () => {
        parseSkill.mockResolvedValue({
          name: 'test-skill',
          description: 'Test skill',
          allowedTools: [],
          content: 'Test content',
          directoryPath: '/home/user/.claude/skills/test-skill',
          scope: 'user',
          hasError: false,
          parseError: null,
          subdirectories: [],
          fileCount: 1,
          files: [{ name: 'SKILL.md', relativePath: 'SKILL.md', type: 'file' }],
          externalReferences: [
            { file: 'SKILL.md', line: 10, reference: '~/global/shared.py', type: 'home', severity: 'warning' }
          ]
        });

        const response = await request(app)
          .put('/api/user/skills/test-skill')
          .send({ description: 'Updated user skill' });

        expect(response.status).toBe(200);
        expect(response.body.skill.externalReferences).toHaveLength(1);
        expect(response.body.warnings).toBeDefined();
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid skill name format', async () => {
        const response = await request(app)
          .put('/api/user/skills/Invalid_Skill!')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid skill name format');
      });

      test('should reject description less than 10 characters', async () => {
        const response = await request(app)
          .put('/api/user/skills/test-skill')
          .send({ description: 'Short' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid description');
      });

      test('should reject empty request body', async () => {
        const response = await request(app)
          .put('/api/user/skills/test-skill')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should silently ignore skill rename attempt', async () => {
        const response = await request(app)
          .put('/api/user/skills/test-skill')
          .send({ name: 'renamed-user-skill', description: 'Valid description for testing user skills' });

        // Name field should be silently ignored, update should succeed
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('User skill updated successfully');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent user skill', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .put('/api/user/skills/missing-skill')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('User skill not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        fs.access.mockResolvedValue();
        updateService.updateYamlFrontmatter.mockRejectedValue(new Error('Permission denied'));

        const response = await request(app)
          .put('/api/user/skills/test-skill')
          .send(validUpdatePayload);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
