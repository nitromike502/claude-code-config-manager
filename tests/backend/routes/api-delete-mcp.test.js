/**
 * Integration tests for MCP Server DELETE API Routes
 *
 * Test Coverage:
 * - DELETE /api/projects/:projectId/mcp/:serverName - Delete project MCP server
 * - DELETE /api/user/mcp/:serverName - Delete user MCP server
 *
 * Testing Strategy:
 * - Mock deleteMcpService for deletion operations
 * - Mock projectDiscovery for project path resolution
 * - Test endpoint validation logic
 * - Verify HTTP status codes and response formats
 * - Test error handling (404, 400, 500)
 * - Test URL encoding/decoding of server names with special characters
 * - Test reference warnings in responses
 *
 * MCP Server Storage Locations:
 * - Project: .mcp.json, .claude/settings.json, .claude/settings.local.json
 * - User: ~/.claude.json (root mcpServers key)
 */

// Mock dependencies FIRST (before any imports)
jest.mock('../../../src/backend/services/deleteMcpService');
jest.mock('os');
jest.mock('../../../src/backend/services/projectDiscovery');

const request = require('supertest');
const app = require('../../../src/backend/server');
const { deleteProjectMcpServer, deleteUserMcpServer } = require('../../../src/backend/services/deleteMcpService');
const os = require('os');
const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');

// Test data
const TEST_PROJECT_PATH = '/home/user/testproject';
const TEST_PROJECT_ID = TEST_PROJECT_PATH.replace(/\//g, '');
const TEST_HOME_DIR = '/home/user';

// Mock project discovery cache
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

describe('MCP DELETE API Routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Default mock for os.homedir
    os.homedir.mockReturnValue(TEST_HOME_DIR);

    // Default mock for project discovery
    discoverProjects.mockResolvedValue(mockProjectsCache);

    // Reset projects cache
    await request(app).post('/api/projects/scan');

    // Default mock for successful deletion (no references)
    deleteProjectMcpServer.mockResolvedValue({
      success: true,
      message: 'MCP server "test-server" deleted successfully',
      filePath: `${TEST_PROJECT_PATH}/.mcp.json`
    });

    deleteUserMcpServer.mockResolvedValue({
      success: true,
      message: 'MCP server "test-server" deleted successfully'
    });
  });

  describe('DELETE /api/projects/:projectId/mcp/:serverName', () => {
    describe('Success Cases', () => {
      test('should delete MCP server from project successfully', async () => {
        deleteProjectMcpServer.mockResolvedValue({
          success: true,
          message: 'MCP server "my-server" deleted successfully',
          filePath: `${TEST_PROJECT_PATH}/.mcp.json`
        });

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'MCP server "my-server" deleted successfully'
        });
        expect(deleteProjectMcpServer).toHaveBeenCalledWith(TEST_PROJECT_PATH, 'my-server');
      });

      test('should include references in response when found', async () => {
        deleteProjectMcpServer.mockResolvedValue({
          success: true,
          message: 'MCP server "test-server" deleted successfully',
          filePath: `${TEST_PROJECT_PATH}/.mcp.json`,
          references: [
            'hooks.PreToolUse[0] (matcher "Bash", hook 0): Command may reference this server',
            'permissions.allow[0]: "mcp__test-server__tool1" references this server'
          ]
        });

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'MCP server "test-server" deleted successfully',
          references: [
            'hooks.PreToolUse[0] (matcher "Bash", hook 0): Command may reference this server',
            'permissions.allow[0]: "mcp__test-server__tool1" references this server'
          ]
        });
      });

      test('should handle server name with special characters (URL encoded)', async () => {
        const serverName = '@scope/my-server';
        const encodedName = encodeURIComponent(serverName);

        deleteProjectMcpServer.mockResolvedValue({
          success: true,
          message: `MCP server "${serverName}" deleted successfully`,
          filePath: `${TEST_PROJECT_PATH}/.mcp.json`
        });

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/${encodedName}`);

        expect(response.status).toBe(200);
        expect(deleteProjectMcpServer).toHaveBeenCalledWith(TEST_PROJECT_PATH, serverName);
      });

      test('should handle server name with spaces', async () => {
        const serverName = 'my server name';
        const encodedName = encodeURIComponent(serverName);

        deleteProjectMcpServer.mockResolvedValue({
          success: true,
          message: `MCP server "${serverName}" deleted successfully`,
          filePath: `${TEST_PROJECT_PATH}/.mcp.json`
        });

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/${encodedName}`);

        expect(response.status).toBe(200);
        expect(deleteProjectMcpServer).toHaveBeenCalledWith(TEST_PROJECT_PATH, serverName);
      });

      test('should handle server name with forward slashes', async () => {
        const serverName = 'org/team/server';
        const encodedName = encodeURIComponent(serverName);

        deleteProjectMcpServer.mockResolvedValue({
          success: true,
          message: `MCP server "${serverName}" deleted successfully`,
          filePath: `${TEST_PROJECT_PATH}/.mcp.json`
        });

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/${encodedName}`);

        expect(response.status).toBe(200);
        expect(deleteProjectMcpServer).toHaveBeenCalledWith(TEST_PROJECT_PATH, serverName);
      });
    });

    describe('Validation - Invalid Server Name', () => {
      test('should return 400 when server name is empty string', async () => {
        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/%20`); // URL-encoded space

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          success: false,
          error: 'Invalid server name: cannot be empty'
        });
        expect(deleteProjectMcpServer).not.toHaveBeenCalled();
      });

      test('should return 400 when server name is only whitespace', async () => {
        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/${encodeURIComponent('   ')}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          success: false,
          error: 'Invalid server name: cannot be empty'
        });
        expect(deleteProjectMcpServer).not.toHaveBeenCalled();
      });
    });

    describe('Validation - Invalid Project', () => {
      test('should return 404 when project not found', async () => {
        const invalidProjectId = 'nonexistentproject';

        const response = await request(app)
          .delete(`/api/projects/${invalidProjectId}/mcp/test-server`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not found');
        expect(deleteProjectMcpServer).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling - Server Not Found', () => {
      test('should return 404 when MCP server not found', async () => {
        deleteProjectMcpServer.mockRejectedValue(
          new Error('MCP server not found: nonexistent-server')
        );

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/nonexistent-server`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
          success: false,
          error: 'MCP server not found: nonexistent-server'
        });
      });

      test('should return 404 when server not found in any location', async () => {
        deleteProjectMcpServer.mockRejectedValue(
          new Error('MCP server not found: test-server')
        );

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('MCP server not found: test-server');
      });
    });

    describe('Error Handling - File System Errors', () => {
      test('should return 500 on permission denied', async () => {
        deleteProjectMcpServer.mockRejectedValue(
          new Error('EACCES: permission denied')
        );

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          success: false,
          error: 'Failed to delete MCP server',
          details: 'EACCES: permission denied'
        });
      });

      test('should return 500 on JSON parse error', async () => {
        deleteProjectMcpServer.mockRejectedValue(
          new Error('Unexpected token } in JSON')
        );

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Failed to delete MCP server');
      });

      test('should return 500 on write failure', async () => {
        deleteProjectMcpServer.mockRejectedValue(
          new Error('ENOSPC: no space left on device')
        );

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          success: false,
          error: 'Failed to delete MCP server',
          details: 'ENOSPC: no space left on device'
        });
      });
    });

    describe('Edge Cases', () => {
      test('should handle deletion from settings.json location', async () => {
        deleteProjectMcpServer.mockResolvedValue({
          success: true,
          message: 'MCP server "test-server" deleted successfully',
          filePath: `${TEST_PROJECT_PATH}/.claude/settings.json`
        });

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle deletion from settings.local.json location', async () => {
        deleteProjectMcpServer.mockResolvedValue({
          success: true,
          message: 'MCP server "local-server" deleted successfully',
          filePath: `${TEST_PROJECT_PATH}/.claude/settings.local.json`
        });

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/local-server`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should not include references in response when none found', async () => {
        deleteProjectMcpServer.mockResolvedValue({
          success: true,
          message: 'MCP server "clean-server" deleted successfully',
          filePath: `${TEST_PROJECT_PATH}/.mcp.json`
          // No references property
        });

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/clean-server`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'MCP server "clean-server" deleted successfully'
        });
        expect(response.body.references).toBeUndefined();
      });

      test('should include empty array when references is empty', async () => {
        deleteProjectMcpServer.mockResolvedValue({
          success: true,
          message: 'MCP server "test-server" deleted successfully',
          filePath: `${TEST_PROJECT_PATH}/.mcp.json`,
          references: [] // Empty array
        });

        const response = await request(app)
          .delete(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`);

        expect(response.status).toBe(200);
        expect(response.body.references).toBeUndefined(); // Empty array should not be included
      });
    });
  });

  describe('DELETE /api/user/mcp/:serverName', () => {
    describe('Success Cases', () => {
      test('should delete user MCP server successfully', async () => {
        deleteUserMcpServer.mockResolvedValue({
          success: true,
          message: 'MCP server "user-server" deleted successfully'
        });

        const response = await request(app)
          .delete('/api/user/mcp/user-server');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'MCP server "user-server" deleted successfully'
        });
        expect(deleteUserMcpServer).toHaveBeenCalledWith(TEST_HOME_DIR, 'user-server');
      });

      test('should include references in response when found', async () => {
        deleteUserMcpServer.mockResolvedValue({
          success: true,
          message: 'MCP server "my-server" deleted successfully',
          references: [
            'hooks.SessionStart[0] (all matchers, hook 0): Command may reference this server',
            'permissions.allow[2]: "mcp__my-server" references this server'
          ]
        });

        const response = await request(app)
          .delete('/api/user/mcp/my-server');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'MCP server "my-server" deleted successfully',
          references: [
            'hooks.SessionStart[0] (all matchers, hook 0): Command may reference this server',
            'permissions.allow[2]: "mcp__my-server" references this server'
          ]
        });
      });

      test('should handle server name with special characters (URL encoded)', async () => {
        const serverName = '@org/global-server';
        const encodedName = encodeURIComponent(serverName);

        deleteUserMcpServer.mockResolvedValue({
          success: true,
          message: `MCP server "${serverName}" deleted successfully`
        });

        const response = await request(app)
          .delete(`/api/user/mcp/${encodedName}`);

        expect(response.status).toBe(200);
        expect(deleteUserMcpServer).toHaveBeenCalledWith(TEST_HOME_DIR, serverName);
      });

      test('should handle server name with spaces', async () => {
        const serverName = 'global server';
        const encodedName = encodeURIComponent(serverName);

        deleteUserMcpServer.mockResolvedValue({
          success: true,
          message: `MCP server "${serverName}" deleted successfully`
        });

        const response = await request(app)
          .delete(`/api/user/mcp/${encodedName}`);

        expect(response.status).toBe(200);
        expect(deleteUserMcpServer).toHaveBeenCalledWith(TEST_HOME_DIR, serverName);
      });
    });

    describe('Validation - Invalid Server Name', () => {
      test('should return 400 when server name is empty string', async () => {
        const response = await request(app)
          .delete('/api/user/mcp/%20'); // URL-encoded space

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          success: false,
          error: 'Invalid server name: cannot be empty'
        });
        expect(deleteUserMcpServer).not.toHaveBeenCalled();
      });

      test('should return 400 when server name is only whitespace', async () => {
        const response = await request(app)
          .delete(`/api/user/mcp/${encodeURIComponent('   ')}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          success: false,
          error: 'Invalid server name: cannot be empty'
        });
        expect(deleteUserMcpServer).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling - Server Not Found', () => {
      test('should return 404 when MCP server not found', async () => {
        deleteUserMcpServer.mockRejectedValue(
          new Error('MCP server not found: nonexistent-server')
        );

        const response = await request(app)
          .delete('/api/user/mcp/nonexistent-server');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
          success: false,
          error: 'MCP server not found: nonexistent-server'
        });
      });

      test('should return 404 when .claude.json does not exist', async () => {
        deleteUserMcpServer.mockRejectedValue(
          new Error('MCP server not found: test-server (.claude.json does not exist)')
        );

        const response = await request(app)
          .delete('/api/user/mcp/test-server');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('MCP server not found');
      });
    });

    describe('Error Handling - File System Errors', () => {
      test('should return 500 on permission denied', async () => {
        deleteUserMcpServer.mockRejectedValue(
          new Error('EACCES: permission denied')
        );

        const response = await request(app)
          .delete('/api/user/mcp/test-server');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          success: false,
          error: 'Failed to delete MCP server',
          details: 'EACCES: permission denied'
        });
      });

      test('should return 500 on JSON parse error', async () => {
        deleteUserMcpServer.mockRejectedValue(
          new Error('Unexpected token } in JSON at position 123')
        );

        const response = await request(app)
          .delete('/api/user/mcp/test-server');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Failed to delete MCP server');
      });

      test('should return 500 on write failure', async () => {
        deleteUserMcpServer.mockRejectedValue(
          new Error('ENOSPC: no space left on device')
        );

        const response = await request(app)
          .delete('/api/user/mcp/test-server');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          success: false,
          error: 'Failed to delete MCP server',
          details: 'ENOSPC: no space left on device'
        });
      });
    });

    describe('Edge Cases', () => {
      test('should not include references in response when none found', async () => {
        deleteUserMcpServer.mockResolvedValue({
          success: true,
          message: 'MCP server "clean-server" deleted successfully'
          // No references property
        });

        const response = await request(app)
          .delete('/api/user/mcp/clean-server');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'MCP server "clean-server" deleted successfully'
        });
        expect(response.body.references).toBeUndefined();
      });

      test('should handle empty references array', async () => {
        deleteUserMcpServer.mockResolvedValue({
          success: true,
          message: 'MCP server "test-server" deleted successfully',
          references: [] // Empty array
        });

        const response = await request(app)
          .delete('/api/user/mcp/test-server');

        expect(response.status).toBe(200);
        expect(response.body.references).toBeUndefined(); // Empty array should not be included
      });
    });
  });
});
