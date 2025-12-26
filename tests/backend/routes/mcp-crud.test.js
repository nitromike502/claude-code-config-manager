/**
 * MCP Server CRUD Tests
 * Tests for PUT /api/projects/:projectId/mcp/:serverName
 * Tests for PUT /api/user/mcp/:serverName
 *
 * Test Coverage:
 * - Basic property updates (command, args, env, url, headers, enabled, timeout)
 * - Name changes (rename server)
 * - Transport-specific validation (stdio vs http/sse)
 * - Transport type changes (clearing inapplicable fields)
 * - Error cases (404, 400, 409)
 * - Both project and user scopes
 */

// Mock dependencies FIRST
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn()
  }
}));
jest.mock('os');
jest.mock('../../../src/backend/services/projectDiscovery');

const request = require('supertest');
const app = require('../../../src/backend/server');
const fs = require('fs').promises;
const os = require('os');
const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');

// Test constants
const TEST_PROJECT_PATH = '/home/user/testproject';
const TEST_PROJECT_ID = TEST_PROJECT_PATH.replace(/\//g, '');
const TEST_HOME_DIR = '/home/user';

// Mock data
// Note: User-level MCP servers are stored in ~/.claude.json (root-level mcpServers key)
const mockClaudeJson = {
  projects: {
    [TEST_PROJECT_PATH]: { name: 'Test Project' }
  },
  // User-level MCP servers (in ~/.claude.json)
  mcpServers: {
    'user-stdio-server': {
      type: 'stdio',
      command: 'node',
      args: ['server.js'],
      enabled: true
    },
    'user-http-server': {
      type: 'http',
      url: 'https://user-api.example.com',
      enabled: true
    }
  }
};

const mockMcpJson = {
  mcpServers: {
    'test-server': {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@mcp/test-server'],
      env: { API_KEY: 'test-key' },
      enabled: true
    },
    'http-server': {
      type: 'http',
      url: 'https://api.example.com/mcp',
      headers: { 'Authorization': 'Bearer token' },
      enabled: true
    },
    'sse-server': {
      type: 'sse',
      url: 'https://sse.example.com/stream',
      enabled: false
    }
  }
};

// User settings (in ~/.claude/settings.json) - contains permissions, hooks, etc.
// Note: MCP servers are NOT stored here; they're in ~/.claude.json
const mockUserSettings = {
  permissions: {
    allow: [],
    deny: []
  }
};

describe('MCP Server Update API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    os.homedir.mockReturnValue(TEST_HOME_DIR);

    // Mock projectDiscovery
    discoverProjects.mockResolvedValue({
      projects: {
        [TEST_PROJECT_ID]: {
          id: TEST_PROJECT_ID,
          path: TEST_PROJECT_PATH,
          name: 'Test Project',
          exists: true
        }
      },
      error: null
    });

    // Mock file reads
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.includes('.claude.json') && !filePath.includes('/settings')) {
        return Promise.resolve(JSON.stringify(mockClaudeJson));
      }
      if (filePath.includes('.mcp.json')) {
        return Promise.resolve(JSON.stringify(mockMcpJson));
      }
      if (filePath.includes('settings.json')) {
        return Promise.resolve(JSON.stringify(mockUserSettings));
      }
      return Promise.reject(new Error(`File not found: ${filePath}`));
    });

    fs.mkdir.mockResolvedValue();
    fs.rename.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
  });

  describe('PUT /api/projects/:projectId/mcp/:serverName', () => {
    describe('Basic property updates', () => {
      it('should update stdio server command property', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ command: 'node' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.command).toBe('node');
        expect(res.body.server.name).toBe('test-server');
      });

      it('should update stdio server args array', async () => {
        const newArgs = ['--experimental', 'server.js'];
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ args: newArgs });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.args).toEqual(newArgs);
      });

      it('should update stdio server env object', async () => {
        const newEnv = { DEBUG: 'true', TOKEN: '${SECRET}' };
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ env: newEnv });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.env).toEqual(newEnv);
      });

      it('should update http server url property', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/http-server`)
          .send({ url: 'https://new-api.example.com/mcp' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.url).toBe('https://new-api.example.com/mcp');
      });

      it('should update http server headers object', async () => {
        const newHeaders = { 'X-API-Key': 'new-key' };
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/http-server`)
          .send({ headers: newHeaders });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.headers).toEqual(newHeaders);
      });

      it('should update enabled property', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ enabled: false });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.enabled).toBe(false);
      });

      it('should update timeout property', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ timeout: 60000 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.timeout).toBe(60000);
      });

      it('should update retries property', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ retries: 3 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.retries).toBe(3);
      });

      it('should update multiple properties simultaneously', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({
            command: 'node',
            args: ['--version'],
            enabled: false,
            timeout: 30000
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.command).toBe('node');
        expect(res.body.server.args).toEqual(['--version']);
        expect(res.body.server.enabled).toBe(false);
        expect(res.body.server.timeout).toBe(30000);
      });
    });

    describe('Name changes', () => {
      it('should handle name change (rename server)', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ name: 'renamed-server' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.name).toBe('renamed-server');

        // Verify the write was called with correct structure
        expect(fs.writeFile).toHaveBeenCalled();
        const writeCall = fs.writeFile.mock.calls[0];
        const writtenData = JSON.parse(writeCall[1]);
        expect(writtenData.mcpServers['renamed-server']).toBeDefined();
        expect(writtenData.mcpServers['test-server']).toBeUndefined();
      });

      it('should reject name change to existing name (409)', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ name: 'http-server' }); // Already exists

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('already exists');
      });

      it('should allow name change with other property updates', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({
            name: 'updated-server',
            enabled: false
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.name).toBe('updated-server');
        expect(res.body.server.enabled).toBe(false);
      });
    });

    describe('Transport-specific validation', () => {
      it('should validate command required for stdio', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ command: '' }); // Empty command

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Command must be a non-empty string for stdio transport');
      });

      it('should validate url required for http', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/http-server`)
          .send({ url: '' }); // Empty URL

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('URL must be a non-empty string for http/sse transport');
      });

      it('should reject url field for stdio transport', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ url: 'https://example.com' }); // stdio doesn't use URL

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('URL is not valid for stdio transport');
      });

      it('should reject command field for http transport', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/http-server`)
          .send({ command: 'npx' }); // http doesn't use command

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Command is not valid for http/sse transport');
      });

      it('should reject args field for http transport', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/http-server`)
          .send({ args: ['--flag'] });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Args is not valid for http/sse transport');
      });

      it('should reject env field for http transport', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/http-server`)
          .send({ env: { KEY: 'value' } });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Env is not valid for http/sse transport');
      });

      it('should reject headers field for stdio transport', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ headers: { 'X-Key': 'value' } });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Headers is not valid for stdio transport');
      });

      it('should validate args must be array', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ args: 'not-an-array' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Args must be an array');
      });

      it('should validate env must be object', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ env: 'not-an-object' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Env must be an object');
      });

      it('should validate headers must be object', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/http-server`)
          .send({ headers: 'not-an-object' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Headers must be an object');
      });
    });

    describe('Transport type changes', () => {
      it('should clear stdio fields when changing to http', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ type: 'http', url: 'https://example.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.type).toBe('http');
        expect(res.body.server.url).toBe('https://example.com');
        // stdio fields should be removed
        expect(res.body.server.command).toBeUndefined();
        expect(res.body.server.args).toBeUndefined();
        expect(res.body.server.env).toBeUndefined();
      });

      it('should clear http fields when changing to stdio', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/http-server`)
          .send({ type: 'stdio', command: 'node' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.type).toBe('stdio');
        expect(res.body.server.command).toBe('node');
        // http fields should be removed
        expect(res.body.server.url).toBeUndefined();
        expect(res.body.server.headers).toBeUndefined();
      });

      it('should preserve common fields when changing transport', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ type: 'http', url: 'https://example.com' });

        expect(res.status).toBe(200);
        expect(res.body.server.enabled).toBe(true); // Preserved from original
      });

      it('should change from http to sse', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/http-server`)
          .send({ type: 'sse' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.type).toBe('sse');
        expect(res.body.server.url).toBe('https://api.example.com/mcp'); // URL preserved
      });

      it('should validate required field when changing transport', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ type: 'http' }); // Missing url

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('URL is required for http/sse transport');
      });
    });

    describe('Error cases', () => {
      it('should return 404 for non-existent server', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/nonexistent-server`)
          .send({ enabled: false });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('not found');
      });

      it('should return 404 for non-existent project', async () => {
        const res = await request(app)
          .put('/api/projects/nonexistentproject/mcp/test-server')
          .send({ enabled: false });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });

      it('should return 400 for invalid server name', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ name: 'invalid name with spaces' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Name can only contain letters, numbers, hyphens, and underscores');
      });

      it('should return 400 for invalid transport type', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ type: 'invalid-type' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Invalid transport type. Must be one of: stdio, http, sse');
      });

      it('should return 400 for non-boolean enabled', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ enabled: 'true' }); // String instead of boolean

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Enabled must be a boolean');
      });

      it('should return 400 for negative timeout', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ timeout: -1 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Timeout must be a positive integer');
      });

      it('should return 400 for negative retries', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ retries: -1 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('Retries must be a non-negative integer');
      });

      it('should handle file system errors gracefully', async () => {
        fs.readFile.mockRejectedValueOnce(new Error('Disk read error'));

        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ enabled: false });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Failed to update MCP server');
      });
    });

    describe('URL encoding', () => {
      it('should handle URL-encoded server names', async () => {
        // Mock a server with special characters
        const encodedName = encodeURIComponent('test-server-2.0');

        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/${encodedName}`)
          .send({ enabled: false });

        // Will return 404 since server doesn't exist, but tests URL decoding
        expect(res.status).toBe(404);
      });
    });

    describe('Atomic writes', () => {
      it('should use atomic write (temp + rename)', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/mcp/test-server`)
          .send({ enabled: false });

        expect(res.status).toBe(200);

        // Verify atomic write pattern
        expect(fs.writeFile).toHaveBeenCalled();
        expect(fs.rename).toHaveBeenCalled();

        const writeCall = fs.writeFile.mock.calls[0];
        expect(writeCall[0]).toContain('.mcp.json.tmp'); // Temp file

        const renameCall = fs.rename.mock.calls[0];
        expect(renameCall[0]).toContain('.mcp.json.tmp'); // From temp
        expect(renameCall[1]).toContain('.mcp.json'); // To actual file
        expect(renameCall[1]).not.toContain('.tmp'); // Final file not temp
      });
    });
  });

  describe('PUT /api/user/mcp/:serverName', () => {
    describe('Basic operations', () => {
      it('should update user-level MCP server', async () => {
        const res = await request(app)
          .put('/api/user/mcp/user-stdio-server')
          .send({ enabled: false });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.enabled).toBe(false);
        expect(res.body.server.name).toBe('user-stdio-server');
      });

      it('should update command for user stdio server', async () => {
        const res = await request(app)
          .put('/api/user/mcp/user-stdio-server')
          .send({ command: 'bun' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.command).toBe('bun');
      });

      it('should update url for user http server', async () => {
        const res = await request(app)
          .put('/api/user/mcp/user-http-server')
          .send({ url: 'https://new-url.example.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.url).toBe('https://new-url.example.com');
      });
    });

    describe('Name changes', () => {
      it('should handle name change for user server', async () => {
        const res = await request(app)
          .put('/api/user/mcp/user-stdio-server')
          .send({ name: 'renamed-user-server' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.name).toBe('renamed-user-server');
      });

      it('should reject name change to existing user server name', async () => {
        const res = await request(app)
          .put('/api/user/mcp/user-stdio-server')
          .send({ name: 'user-http-server' }); // Already exists

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('already exists');
      });
    });

    describe('Validation', () => {
      it('should validate transport-specific fields for user servers', async () => {
        const res = await request(app)
          .put('/api/user/mcp/user-stdio-server')
          .send({ url: 'https://example.com' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toContain('URL is not valid for stdio transport');
      });

      it('should validate name format for user servers', async () => {
        const res = await request(app)
          .put('/api/user/mcp/user-stdio-server')
          .send({ name: 'invalid@name!' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('Error cases', () => {
      it('should return 404 for non-existent user server', async () => {
        const res = await request(app)
          .put('/api/user/mcp/nonexistent')
          .send({ enabled: false });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('not found');
      });

      it('should handle file system errors for user scope', async () => {
        fs.readFile.mockRejectedValueOnce(new Error('Permission denied'));

        const res = await request(app)
          .put('/api/user/mcp/user-stdio-server')
          .send({ enabled: false });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
      });
    });

    describe('Transport changes', () => {
      it('should handle transport change for user server', async () => {
        const res = await request(app)
          .put('/api/user/mcp/user-stdio-server')
          .send({ type: 'http', url: 'https://converted.example.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.server.type).toBe('http');
        expect(res.body.server.url).toBe('https://converted.example.com');
        expect(res.body.server.command).toBeUndefined();
      });
    });

    describe('Atomic writes', () => {
      it('should use atomic write for user config (claude.json)', async () => {
        const res = await request(app)
          .put('/api/user/mcp/user-stdio-server')
          .send({ enabled: false });

        expect(res.status).toBe(200);

        // Verify atomic write pattern
        expect(fs.writeFile).toHaveBeenCalled();
        expect(fs.rename).toHaveBeenCalled();

        // User MCP servers are stored in ~/.claude.json, not settings.json
        const writeCall = fs.writeFile.mock.calls[0];
        expect(writeCall[0]).toContain('.claude.json.tmp');

        const renameCall = fs.rename.mock.calls[0];
        expect(renameCall[0]).toContain('.claude.json.tmp');
        expect(renameCall[1]).toContain('.claude.json');
        expect(renameCall[1]).not.toContain('.tmp');
      });
    });
  });
});
