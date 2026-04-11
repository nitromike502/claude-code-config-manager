/**
 * MCP Server Toggle Endpoint Tests
 * Tests for POST /api/projects/:projectId/mcp/:serverName/toggle
 *
 * The toggle endpoint enables or disables an MCP server by updating the
 * disabledMcpServers array in the project entry of ~/.claude.json.
 *
 * Test Coverage:
 * - Disable a server (enabled: false) → adds name to disabledMcpServers
 * - Enable a server (enabled: true) → removes name from disabledMcpServers
 * - Enable a server not in disabledMcpServers (no-op, succeeds cleanly)
 * - Disable a server already in disabledMcpServers (no duplicate added)
 * - Missing project entry in ~/.claude.json → created on write
 * - Invalid request (missing or non-boolean enabled) → 400
 * - Non-existent project → 404
 * - Response shape: { success, serverName, enabled, status }
 * - URL-encoded server names
 * - Atomic write (temp file + rename)
 * - File system error → 500
 */

// Mock dependencies FIRST before any requires
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

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const TEST_HOME_DIR = '/home/user';
const TEST_PROJECT_PATH = '/home/user/testproject';
const TEST_PROJECT_ID = TEST_PROJECT_PATH.replace(/\//g, ''); // homeuserteestproject
const CLAUDE_JSON_PATH = `${TEST_HOME_DIR}/.claude.json`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a basic claudeJson with no disabled servers */
function buildClaudeJson(disabledMcpServers = []) {
  return {
    projects: {
      [TEST_PROJECT_PATH]: {
        disabledMcpServers
      }
    }
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  os.homedir.mockReturnValue(TEST_HOME_DIR);
  delete process.env.USE_DEV_PATHS;

  // Project discovery: always return our test project
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

  // Default file system mocks
  fs.writeFile.mockResolvedValue(undefined);
  fs.rename.mockResolvedValue(undefined);
  fs.mkdir.mockResolvedValue(undefined);
});

afterEach(() => {
  delete process.env.USE_DEV_PATHS;
});

// ---------------------------------------------------------------------------
// POST /api/projects/:projectId/mcp/:serverName/toggle
// ---------------------------------------------------------------------------

describe('POST /api/projects/:projectId/mcp/:serverName/toggle', () => {

  // -------------------------------------------------------------------------
  // Disable a server
  // -------------------------------------------------------------------------

  describe('disabling a server (enabled: false)', () => {
    it('adds the server name to disabledMcpServers', async () => {
      // Start with no disabled servers
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(200);

      // Verify the written data includes the server in disabledMcpServers
      const writtenJson = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenJson.projects[TEST_PROJECT_PATH].disabledMcpServers).toContain('my-server');
    });

    it('does not duplicate an already-disabled server', async () => {
      // Server is already in the disabled list
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson(['my-server'])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(200);

      // Should still only appear once
      const writtenJson = JSON.parse(fs.writeFile.mock.calls[0][1]);
      const disabled = writtenJson.projects[TEST_PROJECT_PATH].disabledMcpServers;
      const occurrences = disabled.filter(name => name === 'my-server').length;
      expect(occurrences).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Enable a server
  // -------------------------------------------------------------------------

  describe('enabling a server (enabled: true)', () => {
    it('removes the server name from disabledMcpServers', async () => {
      // Server starts as disabled
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson(['my-server', 'other-server'])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: true });

      expect(res.status).toBe(200);

      const writtenJson = JSON.parse(fs.writeFile.mock.calls[0][1]);
      const disabled = writtenJson.projects[TEST_PROJECT_PATH].disabledMcpServers;
      expect(disabled).not.toContain('my-server');
      // Other servers remain untouched
      expect(disabled).toContain('other-server');
    });

    it('succeeds without error when server is not in disabledMcpServers (no-op)', async () => {
      // Server is not disabled — enabling is a no-op
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson(['other-server'])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Disabled list remains unchanged (my-server was never there)
      const writtenJson = JSON.parse(fs.writeFile.mock.calls[0][1]);
      const disabled = writtenJson.projects[TEST_PROJECT_PATH].disabledMcpServers;
      expect(disabled).not.toContain('my-server');
      expect(disabled).toContain('other-server');
    });
  });

  // -------------------------------------------------------------------------
  // Missing project entry in ~/.claude.json
  // -------------------------------------------------------------------------

  describe('missing project entry', () => {
    it('creates projects object and project entry when ~/.claude.json has no projects', async () => {
      // ~/.claude.json exists but has no projects key
      fs.readFile.mockResolvedValue(JSON.stringify({ mcpServers: {} }));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(200);

      const writtenJson = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenJson.projects).toBeDefined();
      expect(writtenJson.projects[TEST_PROJECT_PATH]).toBeDefined();
      expect(writtenJson.projects[TEST_PROJECT_PATH].disabledMcpServers).toContain('my-server');
    });

    it('creates project entry when project path is not yet in projects object', async () => {
      // projects exists but this project is not registered
      fs.readFile.mockResolvedValue(JSON.stringify({
        projects: {
          '/home/user/other-project': { disabledMcpServers: [] }
        }
      }));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(200);

      const writtenJson = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenJson.projects[TEST_PROJECT_PATH]).toBeDefined();
      expect(writtenJson.projects[TEST_PROJECT_PATH].disabledMcpServers).toContain('my-server');
    });

    it('creates disabledMcpServers array when project entry exists but has none', async () => {
      // Project entry exists but no disabledMcpServers key
      fs.readFile.mockResolvedValue(JSON.stringify({
        projects: {
          [TEST_PROJECT_PATH]: { name: 'Test Project' }
        }
      }));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(200);

      const writtenJson = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(Array.isArray(writtenJson.projects[TEST_PROJECT_PATH].disabledMcpServers)).toBe(true);
      expect(writtenJson.projects[TEST_PROJECT_PATH].disabledMcpServers).toContain('my-server');
    });

    it('handles completely missing ~/.claude.json (ENOENT) and writes new file', async () => {
      const enoentError = new Error('ENOENT: no such file or directory');
      enoentError.code = 'ENOENT';
      fs.readFile.mockRejectedValue(enoentError);

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(200);

      const writtenJson = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenJson.projects[TEST_PROJECT_PATH].disabledMcpServers).toContain('my-server');
    });
  });

  // -------------------------------------------------------------------------
  // Response shape
  // -------------------------------------------------------------------------

  describe('response format', () => {
    it('returns { success, serverName, enabled, status } on disable', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        serverName: 'my-server',
        enabled: false,
        status: 'disabled'
      });
    });

    it('returns { success, serverName, enabled, status } on enable', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson(['my-server'])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: true });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        serverName: 'my-server',
        enabled: true,
        status: 'enabled'
      });
    });

    it('status field is "disabled" when enabled is false', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/any-server/toggle`)
        .send({ enabled: false });

      expect(res.body.status).toBe('disabled');
    });

    it('status field is "enabled" when enabled is true', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson(['any-server'])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/any-server/toggle`)
        .send({ enabled: true });

      expect(res.body.status).toBe('enabled');
    });
  });

  // -------------------------------------------------------------------------
  // Validation errors (400)
  // -------------------------------------------------------------------------

  describe('invalid requests (400)', () => {
    it('returns 400 when enabled field is missing', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/enabled/i);
    });

    it('returns 400 when enabled is a string instead of boolean', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: 'true' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when enabled is a number instead of boolean', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when enabled is null', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: null });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 404 — project not found
  // -------------------------------------------------------------------------

  describe('project not found (404)', () => {
    it('returns 404 when projectId does not match any known project', async () => {
      discoverProjects.mockResolvedValue({
        projects: {},
        error: null
      });

      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post('/api/projects/nonexistentproject/mcp/my-server/toggle')
        .send({ enabled: false });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/project not found/i);
    });

    it('returns 404 when projectId is not found in the discovered projects map', async () => {
      // Use a project ID that is different from TEST_PROJECT_ID to avoid the
      // module-level projectsCache (populated by earlier tests) masking the mock.
      // The cache is keyed by projectId, so an unseen ID forces a fresh discovery call.
      const unknownProjectId = 'completelydifferentunknownproject99';

      discoverProjects.mockResolvedValue({
        projects: {
          [unknownProjectId]: {
            id: unknownProjectId,
            path: '/home/user/unknown',
            name: 'Unknown Project',
            exists: false // Marks as non-existent
          }
        },
        error: null
      });

      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post(`/api/projects/${unknownProjectId}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // URL-encoded server names
  // -------------------------------------------------------------------------

  describe('URL-encoded server names', () => {
    it('decodes URL-encoded server name before writing', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const encodedName = encodeURIComponent('my-server-2.0');

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/${encodedName}/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(200);
      expect(res.body.serverName).toBe('my-server-2.0');

      const writtenJson = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenJson.projects[TEST_PROJECT_PATH].disabledMcpServers).toContain('my-server-2.0');
    });
  });

  // -------------------------------------------------------------------------
  // Atomic writes
  // -------------------------------------------------------------------------

  describe('atomic write (temp file + rename)', () => {
    it('writes to a .tmp file first, then renames to final path', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(200);

      expect(fs.writeFile).toHaveBeenCalled();
      expect(fs.rename).toHaveBeenCalled();

      const writeCall = fs.writeFile.mock.calls[0];
      expect(writeCall[0]).toContain('.claude.json.tmp');

      const renameCall = fs.rename.mock.calls[0];
      expect(renameCall[0]).toContain('.claude.json.tmp');
      expect(renameCall[1]).toContain('.claude.json');
      expect(renameCall[1]).not.toContain('.tmp');
    });

    it('does not write the file on a 400 error (validation fails before I/O)', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: 'not-a-boolean' });

      expect(res.status).toBe(400);
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // File system errors (500)
  // -------------------------------------------------------------------------

  describe('file system errors (500)', () => {
    it('returns 500 when ~/.claude.json cannot be read (non-ENOENT)', async () => {
      const permissionError = new Error('EACCES: permission denied');
      permissionError.code = 'EACCES';
      fs.readFile.mockRejectedValue(permissionError);

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/failed to toggle/i);
    });

    it('returns 500 when writing ~/.claude.json fails', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(buildClaudeJson([])));
      fs.writeFile.mockRejectedValue(new Error('Disk full'));

      const res = await request(app)
        .post(`/api/projects/${TEST_PROJECT_ID}/mcp/my-server/toggle`)
        .send({ enabled: false });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
