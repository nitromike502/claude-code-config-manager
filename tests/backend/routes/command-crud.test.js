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
 * - Test nested command paths and URL encoding
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
    rename: jest.fn()
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
      description: 'Updated command description for testing purposes'
    };

    beforeEach(() => {
      // Mock command file exists
      fs.access.mockResolvedValue();

      // Mock successful update
      updateService.updateYamlFrontmatter.mockResolvedValue({ success: true });

      // Mock parseCommand to return updated command
      parseCommand.mockResolvedValue({
        name: 'test-command',
        path: 'test-command.md',
        description: 'Updated command description for testing purposes',
        content: 'This is a test command.',
        filePath: '/home/user/testproject/.claude/commands/test-command.md',
        scope: 'project',
        model: 'sonnet',
        color: 'blue',
        parseError: null,
        hasError: false
      });
    });

    describe('Success cases', () => {
      test('should update command description successfully', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ description: 'Updated command description for testing purposes' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Command updated successfully');
        expect(response.body.command).toBeDefined();
        expect(response.body.command.description).toBe('Updated command description for testing purposes');
      });

      test('should update command name successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'new-name',
          path: 'test-command.md',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ name: 'new-name' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(updateService.updateYamlFrontmatter).toHaveBeenCalled();
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
          .put('/api/projects/testproject/commands/test-command')
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
          .put('/api/projects/testproject/commands/test-command')
          .send({ color: 'red' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update command argument-hint successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'test-command',
          'argument-hint': '<file-path>',
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ 'argument-hint': '<file-path>' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update command disable-model-invocation successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'test-command',
          'disable-model-invocation': true,
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ 'disable-model-invocation': true });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update command allowed-tools array successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'test-command',
          'allowed-tools': ['bash', 'read', 'write'],
          description: 'Test command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ 'allowed-tools': ['bash', 'read', 'write'] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update command content successfully', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-command\ndescription: Test\n---\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseCommand.mockResolvedValue({
          name: 'test-command',
          description: 'Test command',
          content: 'This is a new content body for testing the command update functionality',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ content: 'This is a new content body for testing the command update functionality' });

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
          content: 'This is the cleaned content body without frontmatter',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        // Send content with embedded frontmatter (simulating UI bug)
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({
            content: '---\nname: embedded\ndescription: Embedded frontmatter\n---\nThis is the cleaned content body without frontmatter'
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

      test('should update multiple fields simultaneously', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-command\n---\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseCommand.mockResolvedValue({
          name: 'test-command',
          description: 'Updated description for multiple fields test case',
          model: 'opus',
          color: 'green',
          'argument-hint': '<input>',
          content: 'New content body for multiple fields',
          filePath: '/home/user/testproject/.claude/commands/test-command.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({
            description: 'Updated description for multiple fields test case',
            model: 'opus',
            color: 'green',
            'argument-hint': '<input>',
            content: 'New content body for multiple fields'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update nested command successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'helper',
          path: 'utils/helper.md',
          description: 'Updated nested command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/utils/helper.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/utils/helper')
          .send({ description: 'Updated nested command' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle URL-encoded command path', async () => {
        parseCommand.mockResolvedValue({
          name: 'helper',
          path: 'utils/helper.md',
          description: 'Updated command',
          content: 'Test',
          filePath: '/home/user/testproject/.claude/commands/utils/helper.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/commands/utils%2Fhelper')
          .send({ description: 'Updated command' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject description less than 10 characters', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ description: 'Short' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid description');
        expect(response.body.details).toContain('at least 10 characters');
      });

      test('should reject invalid model value', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ model: 'invalid-model' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid model');
      });

      test('should reject invalid color value', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ color: 'rainbow' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid color');
      });

      test('should reject invalid disable-model-invocation value', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ 'disable-model-invocation': 'yes' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid disable-model-invocation');
      });

      test('should reject empty request body', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid request body');
      });

      test('should reject null request body', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send(null);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should reject invalid name value', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ name: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid name');
      });

      test('should reject non-string content value', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
          .send({ content: 12345 });

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
          .put('/api/projects/nonexistent/commands/test-command')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });

      test('should return 404 for non-existent command', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .put('/api/projects/testproject/commands/missing-command')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command not found');
      });

      test('should return 404 for non-existent nested command', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .put('/api/projects/testproject/commands/utils/missing')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        fs.access.mockResolvedValue();
        updateService.updateYamlFrontmatter.mockRejectedValue(new Error('Disk full'));

        const response = await request(app)
          .put('/api/projects/testproject/commands/test-command')
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
          .delete('/api/projects/testproject/commands/test-command');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
        expect(response.body.path).toBeDefined();
        expect(deleteService.deleteFile).toHaveBeenCalled();
      });

      test('should delete nested command successfully', async () => {
        deleteService.deleteFile.mockResolvedValue({
          success: true,
          deleted: '/home/user/testproject/.claude/commands/utils/helper.md'
        });

        const response = await request(app)
          .delete('/api/projects/testproject/commands/utils/helper');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
        expect(deleteService.deleteFile).toHaveBeenCalled();
      });

      test('should handle URL-encoded command path in delete', async () => {
        deleteService.deleteFile.mockResolvedValue({
          success: true,
          deleted: '/home/user/testproject/.claude/commands/utils/helper.md'
        });

        const response = await request(app)
          .delete('/api/projects/testproject/commands/utils%2Fhelper');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(deleteService.deleteFile).toHaveBeenCalled();
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        const response = await request(app)
          .delete('/api/projects/nonexistent/commands/test-command');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });

      test('should return 404 for non-existent command', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('File not found'));

        const response = await request(app)
          .delete('/api/projects/testproject/commands/missing-command');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command not found');
      });

      test('should return 404 for non-existent nested command', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('File not found'));

        const response = await request(app)
          .delete('/api/projects/testproject/commands/utils/missing');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('Permission denied'));

        const response = await request(app)
          .delete('/api/projects/testproject/commands/test-command');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/projects/:projectId/commands/:commandPath/references', () => {
    beforeEach(() => {
      // Mock command file exists
      fs.access.mockResolvedValue();
      referenceChecker.findReferences.mockResolvedValue([]);
    });

    describe('Success cases', () => {
      test('should return empty references array when no references exist', async () => {
        referenceChecker.findReferences.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/projects/testproject/commands/test-command/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.commandName).toBe('test-command');
        expect(response.body.references).toEqual([]);
        expect(response.body.hasReferences).toBe(false);
        expect(response.body.referenceCount).toBe(0);
      });

      test('should find references in agent files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'agent',
            name: 'orchestrator',
            location: '/home/user/testproject/.claude/agents/orchestrator.md',
            lines: [15, 23]
          }
        ]);

        const response = await request(app)
          .get('/api/projects/testproject/commands/test-command/references');

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
            name: 'deploy',
            location: '/home/user/testproject/.claude/commands/deploy.md',
            lines: [10]
          }
        ]);

        const response = await request(app)
          .get('/api/projects/testproject/commands/test-command/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(1);
        expect(response.body.references[0].type).toBe('command');
      });

      test('should find multiple references across different files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'agent',
            name: 'orchestrator',
            location: '/home/user/testproject/.claude/agents/orchestrator.md',
            lines: [15]
          },
          {
            type: 'command',
            name: 'deploy',
            location: '/home/user/testproject/.claude/commands/deploy.md',
            lines: [8, 12]
          },
          {
            type: 'settings',
            name: 'settings.json',
            location: '/home/user/testproject/.claude/settings.json',
            lines: [25]
          }
        ]);

        const response = await request(app)
          .get('/api/projects/testproject/commands/test-command/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(3);
        expect(response.body.hasReferences).toBe(true);
        expect(response.body.referenceCount).toBe(3);
      });

      test('should check references for nested command', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'agent',
            name: 'developer',
            location: '/home/user/testproject/.claude/agents/developer.md',
            lines: [20]
          }
        ]);

        const response = await request(app)
          .get('/api/projects/testproject/commands/utils/helper/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.commandName).toBe('helper');
        expect(response.body.references).toHaveLength(1);
      });

      test('should handle URL-encoded command path in references', async () => {
        referenceChecker.findReferences.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/projects/testproject/commands/utils%2Fhelper/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.commandName).toBe('helper');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        const response = await request(app)
          .get('/api/projects/nonexistent/commands/test-command/references');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });

      test('should return 404 for non-existent command', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .get('/api/projects/testproject/commands/missing-command/references');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command not found');
      });

      test('should return 404 for non-existent nested command', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .get('/api/projects/testproject/commands/utils/missing/references');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle reference checker errors gracefully', async () => {
        referenceChecker.findReferences.mockRejectedValue(new Error('Scan error'));

        const response = await request(app)
          .get('/api/projects/testproject/commands/test-command/references');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('PUT /api/user/commands/:commandPath', () => {
    const validUpdatePayload = {
      description: 'Updated user command description for testing'
    };

    beforeEach(() => {
      // Mock command file exists
      fs.access.mockResolvedValue();

      // Mock successful update
      updateService.updateYamlFrontmatter.mockResolvedValue({ success: true });

      // Mock parseCommand to return updated command
      parseCommand.mockResolvedValue({
        name: 'test-command',
        path: 'test-command.md',
        description: 'Updated user command description for testing',
        content: 'This is a test user command.',
        filePath: '/home/user/.claude/commands/test-command.md',
        scope: 'user',
        model: 'sonnet',
        color: 'blue',
        parseError: null,
        hasError: false
      });
    });

    describe('Success cases', () => {
      test('should update user command description successfully', async () => {
        const response = await request(app)
          .put('/api/user/commands/test-command')
          .send({ description: 'Updated user command description for testing' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('User command updated successfully');
        expect(response.body.command).toBeDefined();
        expect(response.body.command.description).toBe('Updated user command description for testing');
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
          .put('/api/user/commands/test-command')
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
          .put('/api/user/commands/test-command')
          .send({ color: 'purple' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update user command content successfully', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-command\ndescription: Test\n---\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseCommand.mockResolvedValue({
          name: 'test-command',
          description: 'Test command',
          content: 'New content for user command testing functionality',
          filePath: '/home/user/.claude/commands/test-command.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/commands/test-command')
          .send({ content: 'New content for user command testing functionality' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should strip frontmatter from user command content if it contains it', async () => {
        // Mock existing user command file
        fs.readFile.mockResolvedValue('---\nname: test-command\ndescription: Test\n---\nOld content');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseCommand.mockResolvedValue({
          name: 'test-command',
          description: 'Test command',
          content: 'This is the cleaned user command content',
          filePath: '/home/user/.claude/commands/test-command.md',
          scope: 'user'
        });

        // Send content with embedded frontmatter (simulating UI bug)
        const response = await request(app)
          .put('/api/user/commands/test-command')
          .send({
            content: '---\nname: embedded-user\ndescription: Embedded in user command\n---\nThis is the cleaned user command content'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify updateFile was called with cleaned content (without duplicate frontmatter)
        expect(updateService.updateFile).toHaveBeenCalled();
        const updateFileCall = updateService.updateFile.mock.calls[0][1];

        // Should only have 2 frontmatter delimiters, not 4
        const delimiterCount = (updateFileCall.match(/^---$/gm) || []).length;
        expect(delimiterCount).toBe(2);

        // Should not contain "embedded-user" in frontmatter
        expect(updateFileCall).not.toMatch(/name: embedded-user/);
      });

      test('should update nested user command successfully', async () => {
        parseCommand.mockResolvedValue({
          name: 'helper',
          path: 'utils/helper.md',
          description: 'Updated nested user command',
          content: 'Test',
          filePath: '/home/user/.claude/commands/utils/helper.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/commands/utils/helper')
          .send({ description: 'Updated nested user command' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject description less than 10 characters', async () => {
        const response = await request(app)
          .put('/api/user/commands/test-command')
          .send({ description: 'Short' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid description');
      });

      test('should reject invalid model value', async () => {
        const response = await request(app)
          .put('/api/user/commands/test-command')
          .send({ model: 'gpt-4' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid model');
      });

      test('should reject invalid color value', async () => {
        const response = await request(app)
          .put('/api/user/commands/test-command')
          .send({ color: 'neon' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid color');
      });

      test('should reject empty request body', async () => {
        const response = await request(app)
          .put('/api/user/commands/test-command')
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
          .put('/api/user/commands/missing-command')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('User command not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        fs.access.mockResolvedValue();
        updateService.updateYamlFrontmatter.mockRejectedValue(new Error('Disk full'));

        const response = await request(app)
          .put('/api/user/commands/test-command')
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
          .delete('/api/user/commands/test-command');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
        expect(response.body.path).toBeDefined();
        expect(deleteService.deleteFile).toHaveBeenCalled();
      });

      test('should delete nested user command successfully', async () => {
        deleteService.deleteFile.mockResolvedValue({
          success: true,
          deleted: '/home/user/.claude/commands/utils/helper.md'
        });

        const response = await request(app)
          .delete('/api/user/commands/utils/helper');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(deleteService.deleteFile).toHaveBeenCalled();
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent user command', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('File not found'));

        const response = await request(app)
          .delete('/api/user/commands/missing-command');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Command not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('Permission denied'));

        const response = await request(app)
          .delete('/api/user/commands/test-command');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/user/commands/:commandPath/references', () => {
    beforeEach(() => {
      // Mock command file exists
      fs.access.mockResolvedValue();
      referenceChecker.findReferences.mockResolvedValue([]);
    });

    describe('Success cases', () => {
      test('should return empty references array when no references exist', async () => {
        referenceChecker.findReferences.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/user/commands/test-command/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.commandName).toBe('test-command');
        expect(response.body.references).toEqual([]);
        expect(response.body.hasReferences).toBe(false);
        expect(response.body.referenceCount).toBe(0);
      });

      test('should find references in user-level agent files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'agent',
            name: 'user-orchestrator',
            location: '/home/user/.claude/agents/user-orchestrator.md',
            lines: [12]
          }
        ]);

        const response = await request(app)
          .get('/api/user/commands/test-command/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(1);
        expect(response.body.hasReferences).toBe(true);
      });

      test('should find references in user-level command files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'command',
            name: 'user-command',
            location: '/home/user/.claude/commands/user-command.md',
            lines: [5, 10]
          }
        ]);

        const response = await request(app)
          .get('/api/user/commands/test-command/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(1);
        expect(response.body.references[0].type).toBe('command');
      });

      test('should check references for nested user command', async () => {
        referenceChecker.findReferences.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/user/commands/utils/helper/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.commandName).toBe('helper');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent user command', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .get('/api/user/commands/missing-command/references');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('User command not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle reference checker errors gracefully', async () => {
        referenceChecker.findReferences.mockRejectedValue(new Error('Scan error'));

        const response = await request(app)
          .get('/api/user/commands/test-command/references');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
