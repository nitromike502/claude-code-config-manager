/**
 * Integration tests for Agent CRUD API Routes
 *
 * Test Coverage:
 * - PUT /api/projects/:projectId/agents/:agentName - Update project agent
 * - DELETE /api/projects/:projectId/agents/:agentName - Delete project agent
 * - GET /api/projects/:projectId/agents/:agentName/references - Get project agent references
 * - PUT /api/user/agents/:agentName - Update user agent
 * - DELETE /api/user/agents/:agentName - Delete user agent
 * - GET /api/user/agents/:agentName/references - Get user agent references
 *
 * Testing Strategy:
 * - Mock file system operations (fs.promises)
 * - Mock service dependencies (updateService, deleteService, referenceChecker, parseSubagent)
 * - Test endpoint validation logic
 * - Verify HTTP status codes and response formats
 * - Test error handling and edge cases
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
jest.mock('../../../src/backend/parsers/subagentParser');
jest.mock('../../../src/backend/services/projectDiscovery');

const request = require('supertest');
const app = require('../../../src/backend/server');
const fs = require('fs').promises;
const updateService = require('../../../src/backend/services/updateService');
const deleteService = require('../../../src/backend/services/deleteService');
const referenceChecker = require('../../../src/backend/services/referenceChecker');
const { parseSubagent } = require('../../../src/backend/parsers/subagentParser');
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

describe('Agent CRUD API Routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Default mock for project discovery
    discoverProjects.mockResolvedValue(mockProjectsCache);

    // Reset the projects cache by triggering a scan
    // This ensures the cache is cleared and will call our mocked discoverProjects
    await request(app).post('/api/projects/scan');
  });

  describe('PUT /api/projects/:projectId/agents/:agentName', () => {
    const validUpdatePayload = {
      description: 'Updated agent description for testing purposes'
    };

    beforeEach(() => {
      // Mock agent file exists
      fs.access.mockResolvedValue();

      // Mock successful update
      updateService.updateYamlFrontmatter.mockResolvedValue({ success: true });

      // Mock parseSubagent to return updated agent
      parseSubagent.mockResolvedValue({
        name: 'test-agent',
        description: 'Updated agent description for testing purposes',
        tools: ['bash', 'read'],
        model: 'sonnet',
        color: 'blue',
        systemPrompt: 'This is a test agent.',
        filePath: '/home/user/testproject/.claude/agents/test-agent.md',
        scope: 'project',
        parseError: null,
        hasError: false
      });
    });

    describe('Success cases', () => {
      test('should update agent description successfully', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ description: 'Updated agent description for testing purposes' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Agent updated successfully');
        expect(response.body.agent).toBeDefined();
        expect(response.body.agent.description).toBe('Updated agent description for testing purposes');
      });

      test('should update agent model successfully', async () => {
        parseSubagent.mockResolvedValue({
          name: 'test-agent',
          model: 'opus',
          description: 'Test agent',
          tools: [],
          systemPrompt: 'Test',
          filePath: '/home/user/testproject/.claude/agents/test-agent.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ model: 'opus' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(updateService.updateYamlFrontmatter).toHaveBeenCalled();
      });

      test('should update agent color successfully', async () => {
        parseSubagent.mockResolvedValue({
          name: 'test-agent',
          color: 'red',
          description: 'Test agent',
          tools: [],
          systemPrompt: 'Test',
          filePath: '/home/user/testproject/.claude/agents/test-agent.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ color: 'red' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update agent permissionMode successfully', async () => {
        parseSubagent.mockResolvedValue({
          name: 'test-agent',
          permissionMode: 'acceptEdits',
          description: 'Test agent',
          tools: [],
          systemPrompt: 'Test',
          filePath: '/home/user/testproject/.claude/agents/test-agent.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ permissionMode: 'acceptEdits' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update agent tools array successfully', async () => {
        parseSubagent.mockResolvedValue({
          name: 'test-agent',
          tools: ['bash', 'read', 'write'],
          description: 'Test agent',
          systemPrompt: 'Test',
          filePath: '/home/user/testproject/.claude/agents/test-agent.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ tools: ['bash', 'read', 'write'] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update agent systemPrompt successfully', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-agent\ndescription: Test\n---\nOld prompt');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseSubagent.mockResolvedValue({
          name: 'test-agent',
          description: 'Test agent',
          tools: [],
          systemPrompt: 'This is a new system prompt for testing the agent update functionality',
          filePath: '/home/user/testproject/.claude/agents/test-agent.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ systemPrompt: 'This is a new system prompt for testing the agent update functionality' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(fs.readFile).toHaveBeenCalled();
      });

      test('should handle agent rename successfully', async () => {
        // Mock new name doesn't exist
        fs.access
          .mockResolvedValueOnce() // Original file exists
          .mockRejectedValueOnce(new Error('ENOENT')); // New name doesn't exist

        fs.rename.mockResolvedValue();

        parseSubagent.mockResolvedValue({
          name: 'renamed-agent',
          description: 'Test agent',
          tools: [],
          systemPrompt: 'Test',
          filePath: '/home/user/testproject/.claude/agents/renamed-agent.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ name: 'renamed-agent' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(fs.rename).toHaveBeenCalled();
      });

      test('should update multiple fields simultaneously', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-agent\n---\nOld prompt');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseSubagent.mockResolvedValue({
          name: 'test-agent',
          description: 'Updated description for multiple fields test case',
          model: 'opus',
          color: 'green',
          tools: ['bash'],
          systemPrompt: 'New system prompt for multiple fields',
          filePath: '/home/user/testproject/.claude/agents/test-agent.md',
          scope: 'project'
        });

        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({
            description: 'Updated description for multiple fields test case',
            model: 'opus',
            color: 'green',
            tools: ['bash'],
            systemPrompt: 'New system prompt for multiple fields'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid agent name format', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/Invalid_Agent_123!')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid agent name format');
      });

      test('should reject agent name with uppercase letters', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/TestAgent')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid agent name format');
      });

      test('should reject agent name with spaces', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/test agent')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should reject description less than 10 characters', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ description: 'Short' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid description');
        expect(response.body.details).toContain('at least 10 characters');
      });

      test('should reject systemPrompt less than 20 characters', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ systemPrompt: 'Too short' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid systemPrompt');
        expect(response.body.details).toContain('at least 20 characters');
      });

      test('should reject invalid model value', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ model: 'invalid-model' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid model');
      });

      test('should reject invalid color value', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ color: 'rainbow' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid color');
      });

      test('should reject invalid permissionMode value', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ permissionMode: 'invalid-mode' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid permissionMode');
      });

      test('should reject empty request body', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid request body');
      });

      test('should reject null request body', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send(null);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should reject rename with invalid new name format', async () => {
        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ name: 'Invalid-Name!' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid agent name format');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        const response = await request(app)
          .put('/api/projects/nonexistent/agents/test-agent')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });

      test('should return 404 for non-existent agent', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .put('/api/projects/testproject/agents/missing-agent')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Agent not found');
      });
    });

    describe('Conflict errors (409)', () => {
      test('should reject rename to existing agent name', async () => {
        // Mock original file exists, new name also exists
        fs.access.mockResolvedValue();

        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send({ name: 'existing-agent' });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Agent name conflict');
        expect(response.body.details).toContain('already exists');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        fs.access.mockResolvedValue();
        updateService.updateYamlFrontmatter.mockRejectedValue(new Error('Disk full'));

        const response = await request(app)
          .put('/api/projects/testproject/agents/test-agent')
          .send(validUpdatePayload);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('DELETE /api/projects/:projectId/agents/:agentName', () => {
    beforeEach(() => {
      deleteService.deleteFile.mockResolvedValue({
        success: true,
        deleted: '/home/user/testproject/.claude/agents/test-agent.md'
      });
    });

    describe('Success cases', () => {
      test('should delete agent successfully', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/agents/test-agent');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
        expect(response.body.deleted).toBeDefined();
        expect(deleteService.deleteFile).toHaveBeenCalled();
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid agent name format', async () => {
        const response = await request(app)
          .delete('/api/projects/testproject/agents/Invalid_Name!');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid agent name format');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        const response = await request(app)
          .delete('/api/projects/nonexistent/agents/test-agent');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });

      test('should return 404 for non-existent agent', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('File not found'));

        const response = await request(app)
          .delete('/api/projects/testproject/agents/missing-agent');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Agent not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('Permission denied'));

        const response = await request(app)
          .delete('/api/projects/testproject/agents/test-agent');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/projects/:projectId/agents/:agentName/references', () => {
    beforeEach(() => {
      referenceChecker.findReferences.mockResolvedValue([]);
    });

    describe('Success cases', () => {
      test('should return empty references array when no references exist', async () => {
        referenceChecker.findReferences.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/projects/testproject/agents/test-agent/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.agentName).toBe('test-agent');
        expect(response.body.references).toEqual([]);
        expect(response.body.hasReferences).toBe(false);
        expect(response.body.referenceCount).toBe(0);
      });

      test('should find references in other agent files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'agent',
            name: 'orchestrator',
            location: '/home/user/testproject/.claude/agents/orchestrator.md',
            lines: [15, 23]
          }
        ]);

        const response = await request(app)
          .get('/api/projects/testproject/agents/test-agent/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(1);
        expect(response.body.hasReferences).toBe(true);
        expect(response.body.referenceCount).toBe(1);
        expect(response.body.references[0].type).toBe('agent');
      });

      test('should find references in command files', async () => {
        referenceChecker.findReferences.mockResolvedValue([
          {
            type: 'command',
            name: 'test-command',
            location: '/home/user/testproject/.claude/commands/test-command.md',
            lines: [10]
          }
        ]);

        const response = await request(app)
          .get('/api/projects/testproject/agents/test-agent/references');

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
          .get('/api/projects/testproject/agents/test-agent/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(3);
        expect(response.body.hasReferences).toBe(true);
        expect(response.body.referenceCount).toBe(3);
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid agent name format', async () => {
        const response = await request(app)
          .get('/api/projects/testproject/agents/Invalid_Name!/references');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid agent name format');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        const response = await request(app)
          .get('/api/projects/nonexistent/agents/test-agent/references');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Project not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle reference checker errors gracefully', async () => {
        referenceChecker.findReferences.mockRejectedValue(new Error('Scan error'));

        const response = await request(app)
          .get('/api/projects/testproject/agents/test-agent/references');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('PUT /api/user/agents/:agentName', () => {
    const validUpdatePayload = {
      description: 'Updated user agent description for testing'
    };

    beforeEach(() => {
      // Mock agent file exists
      fs.access.mockResolvedValue();

      // Mock successful update
      updateService.updateYamlFrontmatter.mockResolvedValue({ success: true });

      // Mock parseSubagent to return updated agent
      parseSubagent.mockResolvedValue({
        name: 'test-agent',
        description: 'Updated user agent description for testing',
        tools: ['bash', 'read'],
        model: 'sonnet',
        color: 'blue',
        systemPrompt: 'This is a test user agent.',
        filePath: '/home/user/.claude/agents/test-agent.md',
        scope: 'user',
        parseError: null,
        hasError: false
      });
    });

    describe('Success cases', () => {
      test('should update user agent description successfully', async () => {
        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ description: 'Updated user agent description for testing' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('User agent updated successfully');
        expect(response.body.agent).toBeDefined();
        expect(response.body.agent.description).toBe('Updated user agent description for testing');
      });

      test('should update user agent model successfully', async () => {
        parseSubagent.mockResolvedValue({
          name: 'test-agent',
          model: 'haiku',
          description: 'Test agent',
          tools: [],
          systemPrompt: 'Test',
          filePath: '/home/user/.claude/agents/test-agent.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ model: 'haiku' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update user agent color successfully', async () => {
        parseSubagent.mockResolvedValue({
          name: 'test-agent',
          color: 'purple',
          description: 'Test agent',
          tools: [],
          systemPrompt: 'Test',
          filePath: '/home/user/.claude/agents/test-agent.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ color: 'purple' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should update user agent systemPrompt successfully', async () => {
        fs.readFile.mockResolvedValue('---\nname: test-agent\ndescription: Test\n---\nOld prompt');
        updateService.updateFile.mockResolvedValue({ success: true });

        parseSubagent.mockResolvedValue({
          name: 'test-agent',
          description: 'Test agent',
          tools: [],
          systemPrompt: 'New system prompt for user agent testing functionality',
          filePath: '/home/user/.claude/agents/test-agent.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ systemPrompt: 'New system prompt for user agent testing functionality' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle user agent rename successfully', async () => {
        // Mock new name doesn't exist
        fs.access
          .mockResolvedValueOnce() // Original file exists
          .mockRejectedValueOnce(new Error('ENOENT')); // New name doesn't exist

        fs.rename.mockResolvedValue();

        parseSubagent.mockResolvedValue({
          name: 'renamed-user-agent',
          description: 'Test agent',
          tools: [],
          systemPrompt: 'Test',
          filePath: '/home/user/.claude/agents/renamed-user-agent.md',
          scope: 'user'
        });

        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ name: 'renamed-user-agent' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(fs.rename).toHaveBeenCalled();
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid agent name format', async () => {
        const response = await request(app)
          .put('/api/user/agents/Invalid_Agent!')
          .send(validUpdatePayload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid agent name format');
      });

      test('should reject description less than 10 characters', async () => {
        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ description: 'Short' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid description');
      });

      test('should reject systemPrompt less than 20 characters', async () => {
        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ systemPrompt: 'Too short' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid systemPrompt');
      });

      test('should reject invalid model value', async () => {
        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ model: 'gpt-4' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid model');
      });

      test('should reject invalid color value', async () => {
        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ color: 'neon' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid color');
      });

      test('should reject invalid permissionMode value', async () => {
        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ permissionMode: 'superuser' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid permissionMode');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent user agent', async () => {
        fs.access.mockRejectedValue(new Error('ENOENT'));

        const response = await request(app)
          .put('/api/user/agents/missing-agent')
          .send(validUpdatePayload);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('User agent not found');
      });
    });

    describe('Conflict errors (409)', () => {
      test('should reject rename to existing user agent name', async () => {
        // Mock original file exists, new name also exists
        fs.access.mockResolvedValue();

        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send({ name: 'existing-user-agent' });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Agent name conflict');
        expect(response.body.details).toContain('already exists');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        fs.access.mockResolvedValue();
        updateService.updateYamlFrontmatter.mockRejectedValue(new Error('Disk full'));

        const response = await request(app)
          .put('/api/user/agents/test-agent')
          .send(validUpdatePayload);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('DELETE /api/user/agents/:agentName', () => {
    beforeEach(() => {
      deleteService.deleteFile.mockResolvedValue({
        success: true,
        deleted: '/home/user/.claude/agents/test-agent.md'
      });
    });

    describe('Success cases', () => {
      test('should delete user agent successfully', async () => {
        const response = await request(app)
          .delete('/api/user/agents/test-agent');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
        expect(response.body.deleted).toBeDefined();
        expect(deleteService.deleteFile).toHaveBeenCalled();
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid agent name format', async () => {
        const response = await request(app)
          .delete('/api/user/agents/Invalid_Name!');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid agent name format');
      });
    });

    describe('Not found errors (404)', () => {
      test('should return 404 for non-existent user agent', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('File not found'));

        const response = await request(app)
          .delete('/api/user/agents/missing-agent');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('User agent not found');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle file system errors gracefully', async () => {
        deleteService.deleteFile.mockRejectedValue(new Error('Permission denied'));

        const response = await request(app)
          .delete('/api/user/agents/test-agent');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/user/agents/:agentName/references', () => {
    beforeEach(() => {
      referenceChecker.findReferences.mockResolvedValue([]);
    });

    describe('Success cases', () => {
      test('should return empty references array when no references exist', async () => {
        referenceChecker.findReferences.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/user/agents/test-agent/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.agentName).toBe('test-agent');
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
          .get('/api/user/agents/test-agent/references');

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
          .get('/api/user/agents/test-agent/references');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.references).toHaveLength(1);
        expect(response.body.references[0].type).toBe('command');
      });
    });

    describe('Validation errors (400)', () => {
      test('should reject invalid agent name format', async () => {
        const response = await request(app)
          .get('/api/user/agents/Invalid_Name!/references');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid agent name format');
      });
    });

    describe('Server errors (500)', () => {
      test('should handle reference checker errors gracefully', async () => {
        referenceChecker.findReferences.mockRejectedValue(new Error('Scan error'));

        const response = await request(app)
          .get('/api/user/agents/test-agent/references');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
