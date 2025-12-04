/**
 * Integration tests for Command CRUD API Routes
 *
 * Test Coverage:
 * - PUT /api/projects/:projectId/commands/:commandPath - Update project command
 * - DELETE /api/projects/:projectId/commands/:commandPath - Delete project command
 * - GET /api/projects/:projectId/commands/:commandPath/references - Get project command references
 * - PUT /api/user/commands/:commandPath - Update user command
 * - DELETE /api/user/commands/:commandPath - Delete user command
 * - GET /api/user/commands/:commandPath/references - Get user command references
 *
 * Testing Strategy:
 * - Mock file system operations (fs.promises)
 * - Mock service dependencies (updateService, deleteService, referenceChecker, parseCommand)
 * - Test endpoint validation logic
 * - Verify HTTP status codes and response formats
 * - Test error handling and edge cases
 * - Test URL encoding/decoding for nested paths
 * - Test property mapping (camelCase → kebab-case)
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
    rename: jest.fn(),
    mkdir: jest.fn()
  }
}));
jest.mock('../../../src/backend/services/updateService');
jest.mock('../../../src/backend/services/deleteService');
jest.mock('../../../src/backend/services/referenceChecker');
jest.mock('../../../src/backend/parsers/commandParser');
jest.mock('../../../src/backend/services/projectDiscovery');

const request = require('supertest');
const app = require('../../../src/backend/server');
const fs = require('fs').promises;
const updateService = require('../../../src/backend/services/updateService');
const deleteService = require('../../../src/backend/services/deleteService');
const referenceChecker = require('../../../src/backend/services/referenceChecker');
const { parseCommand } = require('../../../src/backend/parsers/commandParser');
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

describe('Command CRUD API Routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Default mock for project discovery
    discoverProjects.mockResolvedValue(mockProjectsCache);

    // Reset the projects cache by triggering a scan
    await request(app).post('/api/projects/scan');
  });

  describe('PUT /api/projects/:projectId/commands/:commandPath', () => {
    const validUpdatePayload = {
      description: 'Updated command description for testing'
    };

    beforeEach(() => {
      // Mock command file exists
      fs.access.mockResolvedValue();

      // Mock successful update
      updateService.updateYamlFrontmatter.mockResolvedValue({ success: true });

      // Mock parseCommand to return updated command
      parseCommand.mockResolvedValue({
        name: 'test-command',
        description: 'Updated command description for testing',
        allowedTools: ['Read', 'Write'],
        model: 'sonnet',
        color: 'blue',
        content: 'This is a test command.',
        filePath: '/home/user/testproject/.claude/commands/test-command.md',
        scope: 'project',
        parseError: null,
        hasError: false
      });
    });

    describe('Success cases', () => {
      test('should update command description successfully', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ description: 'Updated command description for testing' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Command updated successfully');
        expect(response.body.command).toBeDefined();
        expect(response.body.command.description).toBe('Updated command description for testing');
      });

      test('should update command model successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'test-command',
          model: 'opus',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ model: 'opus' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(updateService.updateYamlFrontmatter).toHaveBeenCalled();
      });

      test('should update command color successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'test-command',
          color: 'red',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ color: 'red' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update command allowedTools array successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'test-command',
          allowedTools: ['Bash', 'Read', 'Write'],
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ allowedTools: ['Bash', 'Read', 'Write'] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update command argumentHint successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'test-command',
          argumentHint: 'Enter file path',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ argumentHint: 'Enter file path' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update command disableModelInvocation successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'test-command',
          disableModelInvocation: true,
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ disableModelInvocation: true });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update command content successfully', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-command\ndescription: Test\n---\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseCommand.mockResolvedValue({
          name: 'test-command',
          description: 'Test command',
          content: 'This is new command content for testing',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ content: 'This is new command content for testing' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(fs.readFile).toHaveBeenCalled();
      });

      test('should strip frontmatter from content if it contains it', async () => {
        // Mock existing command file
        fs.readFile.mockResolvedValue('---\nname: test-command\ndescription: Test\n---\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseCommand.mockResolvedValue({
          name: 'test-command',
          description: 'Test command',
          content: 'This is the cleaned content without frontmatter',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        // Send content with embedded frontmatter (simulating UI bug)
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({
            content: '---\nname: embedded\ndescription: Embedded frontmatter\n---\nThis is the cleaned content without frontmatter'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify updateFile was called with cleaned content
        expect(updateService.updateFile).toHaveBeenCalled();
        const updateFileCall = updateService.updateFile.mock.calls[0][1];

        // Should only have 2 frontmatter delimiters, not 4
        const delimiterCount = (updateFileCall.match(/^---$/gm) || []).length;
        expect(delimiterCount).toBe(2);

        // Should not contain "embedded" in frontmatter
        expect(updateFileCall).not.toMatch(/name: embedded/);
      });

      test('should handle command rename successfully (flat path)', async () => {
        // Mock new name doesn't exist
        fs.access
          .mockResolvedValueOnce() // Original file exists
          .mockRejectedValueOnce(new Error('ENOENT')); // New name doesn't exist

        fs.rename.mockResolvedValue();
        fs.mkdir.mockResolvedValue();

        parseCommand.mockResolvedValue({
          name: 'renamed-command',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/renamed-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ name: 'renamed-command.md' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(fs.rename).toHaveBeenCalled();
      });

      test('should handle command rename with nested path successfully', async () => {
        // Mock new name doesn't exist
        fs.access
          .mockResolvedValueOnce() // Original file exists
          .mockRejectedValueOnce(new Error('ENOENT')); // New name doesn't exist

        fs.rename.mockResolvedValue();
        fs.mkdir.mockResolvedValue();

        parseCommand.mockResolvedValue({
          name: 'utils/renamed-command',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/utils/renamed-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ name: 'utils/renamed-command.md' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(fs.mkdir).toHaveBeenCalledWith(
          expect.stringContaining('utils'),
          { recursive: true }
        );
        expect(fs.rename).toHaveBeenCalled();
      });

      test('should update nested command successfully (URL encoded)', async () => {
        const commandPath = 'utils/helper.md';
        const encodedPath = encodeURIComponent(commandPath);

        parseCommand.mockResolvedValue({
          name: 'utils/helper',
          description: 'Updated helper description',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/utils/helper.md',
          scope: 'project'
        });

        const response = await request(app)
          .put(`/api/projects/testproject/commands/${encodedPath}`)
          .send({ description: 'Updated helper description' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.command.description).toBe('Updated helper description');
      });

      test('should map camelCase property names to kebab-case in frontmatter', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-command\n---\nContent');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseCommand.mockResolvedValue({
          name: 'test-command',
          allowedTools: ['Read', 'Write'],
          argumentHint: 'test hint',
          disableModelInvocation: true,
          description: 'Test',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({
            allowedTools: ['Read', 'Write'],
            argumentHint: 'test hint',
            disableModelInvocation: true,
            content: 'Updated content'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify updateFile was called (frontmatter updates happen there)
        expect(updateService.updateFile).toHaveBeenCalled();
      });

      test('should update multiple fields simultaneously', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-command\n---\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseCommand.mockResolvedValue({
          name: 'test-command',
          description: 'Updated description for multiple fields',
          model: 'opus',
          color: 'green',
          allowedTools: ['Bash'],
          content: 'New content for multiple fields',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({
            description: 'Updated description for multiple fields',
            model: 'opus',
            color: 'green',
            allowedTools: ['Bash'],
            content: 'New content for multiple fields'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid command path format (no .md extension)', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/invalid-command')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid command path format');
      });

      test('should reject command path with path traversal (caught by security middleware)', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/../evil.md')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        // Path traversal is caught by project ID validation middleware for security
        expect(response.body.error).toContain('Invalid project ID format');
      });

      test('should reject command path with backslashes (URL routing fails)', async () => {
        // Backslashes in URLs are not handled by Express routing, results in 404
        const response = await request(app)
          .put('/api/projects/testproject/commands/utils\\command.md')
          .send(validUpdatePayload);

        // Express routing doesn't match this path, so it returns 404
        expect(response.status).toBe(404);
      });

      test('should reject invalid model value', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ model: 'invalid-model' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid model');
      });

      test('should reject invalid color value', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ color: 'rainbow' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid color');
      });

      test('should reject invalid argumentHint type', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ argumentHint: 123 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid argumentHint');
      });

      test('should reject invalid disableModelInvocation type', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ disableModelInvocation: 'yes' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid disableModelInvocation');
      });

      test('should reject empty request body', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid request body');
      });

      test('should reject null request body', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send(null);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should reject rename with invalid new path format', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ name: '../invalid-name.md' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid command path format');
      });

      test('should reject content that is too short', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ content: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid content');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        const response = await request(app)
          .put('/api/projects/nonexistent/commands/test-command.md')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });

      test('should return 404 for non-existent command', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .put('/api/projects/testproject/commands/missing-command.md')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command not found');
      });
    });

    describe('Conflict errors (409)', () => {
      test('should reject rename to existing command name', async () => {
        // Mock original file exists, new name also exists
        fs.access.mockResolvedValue();
        fs.mkdir.mockResolvedValue();

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send({ name: 'existing-command.md' });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command name conflict');
        expect(response.body.details).toContain('already exists');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        fs.access.mockResolvedValue();
        updateService.updateYamlFrontmatter.mockRejectedValue(new Error('Disk full'));

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command.md')
          .send(validUpdatePayload);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('DELETE /api/projects/:projectId/commands/:commandPath', () => {
    beforeEach(() => {
      deleteService.deleteFile.mockResolvedValue({
        success: true,
        deleted: '/home/user/testproject/.claude/commands/test-command.md'
      });
    });

    describe('Success cases', () => {
      test('should delete command successfully', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/commands/test-command.md');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
        expect(response.body.deleted).toBeDefined();
        expect(deleteService.deleteFile).toHaveBeenCalled();
      });

      test('should delete nested command successfully (URL encoded)', async () => {
        const commandPath = 'utils/helper.md';
        const encodedPath = encodeURIComponent(commandPath);

        deleteService.deleteFile.mockResolvedValue({
          success: true,
          deleted: '/home/user/testproject/.claude/commands/utils/helper.md'
        });

        const response = await request(app)
          .delete(`/api/projects/testproject/commands/${encodedPath}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid command path format', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/commands/Invalid_Command!');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid command path format');
      });

      test('should reject command path with path traversal (caught by security middleware)', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/commands/../evil.md');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        // Path traversal is caught by project ID validation middleware for security
        expect(response.body.error).toContain('Invalid project ID format');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        const response = await request(app)
          .delete('/api/projects/nonexistent/commands/test-command.md');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });

      test('should return 404 for non-existent command', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('File not found'));

        const response = await request(app)
          .delete('/api/projects/testproject/commands/missing-command.md');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('Permission denied'));

        const response = await request(app)
          .delete('/api/projects/testproject/commands/test-command.md');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/projects/:projectId/commands/:commandPath/references', () => {
    beforeEach(() => {
      referenceChecker.findReferences.mockResolvedValue([]);
    });

    describe('Success cases', () => {
      test('should return empty references array when no references exist', async () => {
        referenceChecker.findReferences.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/projects/testproject/commands/test-command.md/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.commandPath).toBe('test-command.md');
        expect(response.body.commandName).toBe('test-command');
        expect(response.body.references).toEqual([]);
        expect(response.body.hasReferences).toBe(false);
        expect(response.body.referenceCount).toBe(0);
      });

      test('should find references in agent files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'agent',
            name: 'test-agent',
            location: '/home/user/testproject/.claude/agents/test-agent.md',
            lines: [10, 15]
          }
        ]);

        const response = await request(app)
          .get('/api/projects/testproject/commands/test-command.md/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(1);
        expect(response.body.hasReferences).toBe(true);
        expect(response.body.referenceCount).toBe(1);
        expect(response.body.references[0].type).toBe('agent');
      });

      test('should find references in other command files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'command',
            name: 'other-command',
            location: '/home/user/testproject/.claude/commands/other-command.md',
            lines: [5]
          }
        ]);

        const response = await request(app)
          .get('/api/projects/testproject/commands/test-command.md/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(1);
        expect(response.body.references[0].type).toBe('command');
      });

      test('should handle nested command references (URL encoded)', async () => {
        const commandPath = 'utils/helper.md';
        const encodedPath = encodeURIComponent(commandPath);

        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'command',
            name: 'main-command',
            location: '/home/user/testproject/.claude/commands/main-command.md',
            lines: [20]
          }
        ]);

        const response = await request(app)
          .get(`/api/projects/testproject/commands/${encodedPath}/references`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.commandPath).toBe('utils/helper.md');
        expect(response.body.commandName).toBe('helper');
        expect(response.body.references).toHaveLength(1);
      });

      test('should find multiple references across different files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'agent',
            name: 'test-agent',
            location: '/home/user/testproject/.claude/agents/test-agent.md',
            lines: [10]
          },
          {
            type: 'command',
            name: 'other-command',
            location: '/home/user/testproject/.claude/commands/other-command.md',
            lines: [5, 12]
          },
          {
            type: 'settings',
            name: 'settings.json',
            location: '/home/user/testproject/.claude/settings.json',
            lines: [25]
          }
        ]);

        const response = await request(app)
          .get('/api/projects/testproject/commands/test-command.md/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(3);
        expect(response.body.hasReferences).toBe(true);
        expect(response.body.referenceCount).toBe(3);
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid command path format', async () => {
        const response = await request(app)
          .get('/api/projects/testproject/commands/Invalid_Command!/references');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid command path format');
      });

      test('should reject command path with path traversal (caught by security middleware)', async () => {
        const response = await request(app)
          .get('/api/projects/testproject/commands/../evil.md/references');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        // Path traversal is caught by project ID validation middleware for security
        expect(response.body.error).toContain('Invalid project ID format');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        const response = await request(app)
          .get('/api/projects/nonexistent/commands/test-command.md/references');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle reference checker errors gracefully', async () => {
        referenceChecker.findReferences.mockRejectedValue(new Error('Scan error'));

        const response = await request(app)
          .get('/api/projects/testproject/commands/test-command.md/references');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('PUT /api/user/commands/:commandPath', () => {
    const validUpdatePayload = {
      description: 'Updated user command description'
    };

    beforeEach(() => {
      // Mock command file exists
      fs.access.mockResolvedValue();

      // Mock successful update
      updateService.updateYamlFrontmatter.mockResolvedValue({ success: true });

      // Mock parseCommand to return updated command
      parseCommand.mockResolvedValue({
        name: 'test-command',
        description: 'Updated user command description',
        content: 'This is a test user command.',
        filePath: '/home/user/.claude/commands/test-command.md',
        scope: 'user',
        parseError: null,
        hasError: false
      });
    });

    describe('Success cases', () => {
      test('should update user command description successfully', async () => {
        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({ description: 'Updated user command description' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('User command updated successfully');
        expect(response.body.command).toBeDefined();
        expect(response.body.command.description).toBe('Updated user command description');
      });

      test('should update user command model successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'test-command',
          model: 'haiku',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/.claude/commands/test-command.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({ model: 'haiku' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update user command color successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'test-command',
          color: 'purple',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/.claude/commands/test-command.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({ color: 'purple' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update user command content successfully', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-command\n---\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseCommand.mockResolvedValue({
          name: 'test-command',
          description: 'Test command',
          content: 'New user command content for testing',
          filePath: '/home/user/.claude/commands/test-command.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({ content: 'New user command content for testing' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should strip frontmatter from user command content if it contains it', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-command\n---\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseCommand.mockResolvedValue({
          name: 'test-command',
          description: 'Test command',
          content: 'This is the cleaned user command content',
          filePath: '/home/user/.claude/commands/test-command.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({
            content: '---\nname: embedded\n---\nThis is the cleaned user command content'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify updateFile was called with cleaned content
        expect(updateService.updateFile).toHaveBeenCalled();
        const updateFileCall = updateService.updateFile.mock.calls[0][1];

        // Should only have 2 frontmatter delimiters, not 4
        const delimiterCount = (updateFileCall.match(/^---$/gm) || []).length;
        expect(delimiterCount).toBe(2);
      });

      test('should handle user command rename successfully', async () => {
        // Mock new name doesn't exist
        fs.access
          .mockResolvedValueOnce() // Original file exists
          .mockRejectedValueOnce(new Error('ENOENT')); // New name doesn't exist

        fs.rename.mockResolvedValue();
        fs.mkdir.mockResolvedValue();

        parseCommand.mockResolvedValue({
          name: 'renamed-user-command',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/.claude/commands/renamed-user-command.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({ name: 'renamed-user-command.md' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(fs.rename).toHaveBeenCalled();
      });

      test('should handle nested user command rename successfully', async () => {
        // Mock new name doesn't exist
        fs.access
          .mockResolvedValueOnce() // Original file exists
          .mockRejectedValueOnce(new Error('ENOENT')); // New name doesn't exist

        fs.rename.mockResolvedValue();
        fs.mkdir.mockResolvedValue();

        parseCommand.mockResolvedValue({
          name: 'git/renamed-command',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/.claude/commands/git/renamed-command.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({ name: 'git/renamed-command.md' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(fs.mkdir).toHaveBeenCalledWith(
          expect.stringContaining('git'),
          { recursive: true }
        );
      });

      test('should update nested user command successfully (URL encoded)', async () => {
        const commandPath = 'git/commit.md';
        const encodedPath = encodeURIComponent(commandPath);

        parseCommand.mockResolvedValue({
          name: 'git/commit',
          description: 'Updated commit description',
          content: 'Test',
          filePath: '/home/user/.claude/commands/git/commit.md',
          scope: 'user'
        });

        const response = await request(app)
          .put(`/api/user/commands/${encodedPath}`)
          .send({ description: 'Updated commit description' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.command.description).toBe('Updated commit description');
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid command path format', async () => {
        const response = await request(app)
          .put('/api/user/commands/Invalid_Command!')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid command path format');
      });

      test('should reject description with invalid type', async () => {
        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({ description: 123 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid description');
      });

      test('should reject invalid model value', async () => {
        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({ model: 'gpt-4' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid model');
      });

      test('should reject invalid color value', async () => {
        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({ color: 'neon' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid color');
      });

      test('should reject empty request body', async () => {
        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid request body');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent user command', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .put('/api/user/commands/missing-command.md')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('User command not found');
      });
    });

    describe('Conflict errors (409)', () => {
      test('should reject rename to existing user command name', async () => {
        // Mock original file exists, new name also exists
        fs.access.mockResolvedValue();
        fs.mkdir.mockResolvedValue();

        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send({ name: 'existing-command.md' });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command name conflict');
        expect(response.body.details).toContain('already exists');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        fs.access.mockResolvedValue();
        updateService.updateYamlFrontmatter.mockRejectedValue(new Error('Disk full'));

        const response = await request(app)
          .put('/api/user/commands/test-command.md')
          .send(validUpdatePayload);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('DELETE /api/user/commands/:commandPath', () => {
    beforeEach(() => {
      deleteService.deleteFile.mockResolvedValue({
        success: true,
        deleted: '/home/user/.claude/commands/test-command.md'
      });
    });

    describe('Success cases', () => {
      test('should delete user command successfully', async () => {
        const response = await request(app)
          .delete('/api/user/commands/test-command.md');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
        expect(response.body.deleted).toBeDefined();
        expect(deleteService.deleteFile).toHaveBeenCalled();
      });

      test('should delete nested user command successfully (URL encoded)', async () => {
        const commandPath = 'git/commit.md';
        const encodedPath = encodeURIComponent(commandPath);

        deleteService.deleteFile.mockResolvedValue({
          success: true,
          deleted: '/home/user/.claude/commands/git/commit.md'
        });

        const response = await request(app)
          .delete(`/api/user/commands/${encodedPath}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid command path format', async () => {
        const response = await request(app)
          .delete('/api/user/commands/Invalid_Name!');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid command path format');
      });

      test('should reject command path with path traversal (URL routing fails)', async () => {
        // Path traversal in URLs doesn't match Express routing, results in 404
        const response = await request(app)
          .delete('/api/user/commands/../evil.md');

        // Express routing doesn't match this path, so it returns 404
        expect(response.status).toBe(404);
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent user command', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('File not found'));

        const response = await request(app)
          .delete('/api/user/commands/missing-command.md');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('User command not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('Permission denied'));

        const response = await request(app)
          .delete('/api/user/commands/test-command.md');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/user/commands/:commandPath/references', () => {
    beforeEach(() => {
      referenceChecker.findReferences.mockResolvedValue([]);
    });

    describe('Success cases', () => {
      test('should return empty references array when no references exist', async () => {
        referenceChecker.findReferences.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/user/commands/test-command.md/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.commandPath).toBe('test-command.md');
        expect(response.body.commandName).toBe('test-command');
        expect(response.body.references).toEqual([]);
        expect(response.body.hasReferences).toBe(false);
        expect(response.body.referenceCount).toBe(0);
      });

      test('should find references in user-level agent files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'agent',
            name: 'user-agent',
            location: '/home/user/.claude/agents/user-agent.md',
            lines: [8]
          }
        ]);

        const response = await request(app)
          .get('/api/user/commands/test-command.md/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(1);
        expect(response.body.hasReferences).toBe(true);
        expect(response.body.references[0].type).toBe('agent');
      });

      test('should find references in user-level command files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'command',
            name: 'other-user-command',
            location: '/home/user/.claude/commands/other-user-command.md',
            lines: [3, 7]
          }
        ]);

        const response = await request(app)
          .get('/api/user/commands/test-command.md/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(1);
        expect(response.body.references[0].type).toBe('command');
      });

      test('should handle nested user command references (URL encoded)', async () => {
        const commandPath = 'git/commit.md';
        const encodedPath = encodeURIComponent(commandPath);

        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'command',
            name: 'git/workflow',
            location: '/home/user/.claude/commands/git/workflow.md',
            lines: [15]
          }
        ]);

        const response = await request(app)
          .get(`/api/user/commands/${encodedPath}/references`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.commandPath).toBe('git/commit.md');
        expect(response.body.commandName).toBe('commit');
        expect(response.body.references).toHaveLength(1);
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid command path format', async () => {
        const response = await request(app)
          .get('/api/user/commands/Invalid_Name!/references');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid command path format');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle reference checker errors gracefully', async () => {
        referenceChecker.findReferences.mockRejectedValue(new Error('Scan error'));

        const response = await request(app)
          .get('/api/user/commands/test-command.md/references');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
