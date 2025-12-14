/**
 * Tests for Hook CRUD Operations
 *
 * Test Coverage:
 * - PUT /api/projects/:projectId/hooks/:hookId - Update project hook
 * - PUT /api/user/hooks/:hookId - Update user hook
 *
 * Testing Strategy:
 * - Mock file system operations (fs.promises)
 * - Mock os.homedir for user-level tests
 * - Test endpoint validation logic
 * - Verify HTTP status codes and response formats
 * - Test error handling and edge cases
 *
 * Hook ID Format: event::matcher::index (URL-encoded)
 * - "PreToolUse::Bash::0" - First hook for PreToolUse with Bash matcher
 * - "SessionEnd::::0" - First hook for SessionEnd (no matcher)
 */

// Mock dependencies FIRST (before any imports)
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

// Test data
const TEST_PROJECT_PATH = '/home/user/testproject';
const TEST_PROJECT_ID = TEST_PROJECT_PATH.replace(/\//g, '');
const TEST_HOME_DIR = '/home/user';

// Mock ~/.claude.json content
const mockClaudeJson = {
  projects: {
    [TEST_PROJECT_PATH]: { name: 'Test Project' }
  }
};

// Mock project discovery to return test project
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

describe('Hook CRUD API Routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Default mock for os.homedir
    os.homedir.mockReturnValue(TEST_HOME_DIR);

    // Default mock for project discovery
    discoverProjects.mockResolvedValue(mockProjectsCache);

    // Reset projects cache
    await request(app).post('/api/projects/scan');

    // Default mock for reading ~/.claude.json
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
        return Promise.resolve(JSON.stringify(mockClaudeJson));
      }
      return Promise.reject(new Error(`File not found: ${filePath}`));
    });

    // Default mock for mkdir
    fs.mkdir.mockResolvedValue();

    // Default mock for rename (atomic write)
    fs.rename.mockResolvedValue();

    // Default mock for writeFile
    fs.writeFile.mockResolvedValue();
  });

  describe('PUT /api/projects/:projectId/hooks/:hookId', () => {
    describe('Basic Operations', () => {
      it('should update a simple hook command', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo done' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ command: 'echo completed' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.hook.command).toBe('echo completed');
      });

      it('should update a matcher-based hook', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [{ type: 'command', command: 'echo pre' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Bash::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ command: 'echo before tool' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.hook.command).toBe('echo before tool');
        expect(res.body.hook.matcher).toBe('Bash');
      });

      it('should update multiple hook properties at once', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Read',
                hooks: [{
                  type: 'command',
                  command: 'echo read',
                  enabled: true,
                  timeout: 30000
                }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Read::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({
            command: 'echo reading',
            timeout: 60000,
            enabled: false
          });

        expect(res.status).toBe(200);
        expect(res.body.hook.command).toBe('echo reading');
        expect(res.body.hook.timeout).toBe(60000);
        expect(res.body.hook.enabled).toBe(false);
      });

      it('should handle hooks with pipe-joined matchers', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Read|Write',
                hooks: [{ type: 'command', command: 'echo io' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Read|Write::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ command: 'echo file-io' });

        expect(res.status).toBe(200);
        expect(res.body.hook.matcher).toBe('Read|Write');
      });
    });

    describe('Matcher Changes', () => {
      it('should move hook when matcher changes', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [
                  { type: 'command', command: 'echo bash1' },
                  { type: 'command', command: 'echo bash2' }
                ]
              },
              {
                matcher: 'Read',
                hooks: [{ type: 'command', command: 'echo read' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Bash::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ matcher: 'Write' });

        expect(res.status).toBe(200);
        expect(res.body.hook.matcher).toBe('Write');
        // Hook should be moved to end (new matcher group)
        expect(res.body.hook.hookId).toContain('Write::0');
      });

      it('should update index when matcher changes to existing group', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [{ type: 'command', command: 'echo bash' }]
              },
              {
                matcher: 'Read',
                hooks: [
                  { type: 'command', command: 'echo read1' },
                  { type: 'command', command: 'echo read2' }
                ]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Bash::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ matcher: 'Read' });

        expect(res.status).toBe(200);
        expect(res.body.hook.matcher).toBe('Read');
      });
    });

    describe('Event Type Protection', () => {
      it('should reject attempts to change event type', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ event: 'SessionStart' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toEqual(expect.arrayContaining([
          expect.stringContaining('cannot be changed')
        ]));
      });
    });

    describe('Type Constraints', () => {
      it('should allow prompt type for Stop event', async () => {
        const mockSettings = {
          hooks: {
            Stop: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo stop' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('Stop::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ type: 'prompt' });

        expect(res.status).toBe(200);
        expect(res.body.hook.type).toBe('prompt');
      });

      it('should allow prompt type for SubagentStop event', async () => {
        const mockSettings = {
          hooks: {
            SubagentStop: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo subagent' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SubagentStop::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ type: 'prompt' });

        expect(res.status).toBe(200);
        expect(res.body.hook.type).toBe('prompt');
      });

      it('should reject prompt type for PreToolUse event', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [{ type: 'command', command: 'echo pre' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Bash::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ type: 'prompt' });

        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(expect.arrayContaining([
          expect.stringContaining('prompt')
        ]));
      });

      it('should reject prompt type for SessionEnd event', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ type: 'prompt' });

        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(expect.arrayContaining([
          expect.stringContaining('prompt')
        ]));
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent project', async () => {
        discoverProjects.mockResolvedValue({
          projects: {},
          error: null
        });

        await request(app).post('/api/projects/scan');

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/nonexistentproject/hooks/${hookId}`)
          .send({ command: 'echo test' });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });

      it('should return 404 for non-existent hook event', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionStart::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ command: 'echo test' });

        expect(res.status).toBe(404);
      });

      it('should return 400 for invalid hookId format', async () => {
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/invalid-hookid`)
          .send({ command: 'echo test' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid hookId');
      });

      it('should return 400 for invalid event type in hookId', async () => {
        const hookId = encodeURIComponent('InvalidEvent::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ command: 'echo test' });

        expect(res.status).toBe(400);
      });

      it('should return 404 for out-of-range index', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::5');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ command: 'echo test' });

        expect(res.status).toBe(404);
      });

      it('should return 404 for non-existent matcher group', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [{ type: 'command', command: 'echo bash' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Read::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ command: 'echo test' });

        expect(res.status).toBe(404);
      });
    });

    describe('Validation', () => {
      it('should reject empty command for command-type hooks', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ command: '' });

        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(expect.arrayContaining([
          expect.stringContaining('empty')
        ]));
      });

      it('should reject invalid timeout (negative)', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ timeout: -1 });

        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(expect.arrayContaining([
          expect.stringContaining('positive integer')
        ]));
      });

      it('should reject invalid timeout (non-integer)', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ timeout: 30.5 });

        expect(res.status).toBe(400);
      });

      it('should reject non-boolean enabled value', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ enabled: 'true' });

        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(expect.arrayContaining([
          expect.stringContaining('boolean')
        ]));
      });

      it('should reject empty matcher for matcher-based events', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [{ type: 'command', command: 'echo pre' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Bash::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ matcher: '' });

        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(expect.arrayContaining([
          expect.stringContaining('empty')
        ]));
      });

      it('should reject non-boolean suppressOutput value', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ suppressOutput: 'yes' });

        expect(res.status).toBe(400);
      });

      it('should reject non-boolean continue value', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ continue: 1 });

        expect(res.status).toBe(400);
      });
    });

    describe('Boolean Field Updates', () => {
      it('should update enabled field', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end', enabled: true }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ enabled: false });

        expect(res.status).toBe(200);
        expect(res.body.hook.enabled).toBe(false);
      });

      it('should update suppressOutput field', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end', suppressOutput: false }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ suppressOutput: true });

        expect(res.status).toBe(200);
        expect(res.body.hook.suppressOutput).toBe(true);
      });

      it('should update continue field', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end', continue: true }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/projects/${TEST_PROJECT_ID}/hooks/${hookId}`)
          .send({ continue: false });

        expect(res.status).toBe(200);
        expect(res.body.hook.continue).toBe(false);
      });
    });
  });

  describe('PUT /api/user/hooks/:hookId', () => {
    describe('Basic Operations', () => {
      it('should update a user-level hook command', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo user done' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/user/hooks/${hookId}`)
          .send({ command: 'echo user completed' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.hook.command).toBe('echo user completed');
      });

      it('should update a user-level matcher-based hook', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Write',
                hooks: [{ type: 'command', command: 'echo write' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('.claude.json') && !filePath.includes('/settings.json')) {
            return Promise.resolve(JSON.stringify(mockClaudeJson));
          }
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Write::0');
        const res = await request(app)
          .put(`/api/user/hooks/${hookId}`)
          .send({ command: 'echo writing file' });

        expect(res.status).toBe(200);
        expect(res.body.hook.command).toBe('echo writing file');
        expect(res.body.hook.matcher).toBe('Write');
      });

      it('should update multiple user-level hook properties', async () => {
        const mockSettings = {
          hooks: {
            PostToolUse: [
              {
                matcher: 'Bash',
                hooks: [{
                  type: 'command',
                  command: 'echo post',
                  enabled: true,
                  timeout: 20000
                }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PostToolUse::Bash::0');
        const res = await request(app)
          .put(`/api/user/hooks/${hookId}`)
          .send({
            command: 'echo post-execution',
            timeout: 45000,
            suppressOutput: true
          });

        expect(res.status).toBe(200);
        expect(res.body.hook.command).toBe('echo post-execution');
        expect(res.body.hook.timeout).toBe(45000);
        expect(res.body.hook.suppressOutput).toBe(true);
      });
    });

    describe('Matcher Changes', () => {
      it('should handle user-level hook matcher changes', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Read',
                hooks: [{ type: 'command', command: 'echo read' }]
              },
              {
                matcher: 'Write',
                hooks: [{ type: 'command', command: 'echo write' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Read::0');
        const res = await request(app)
          .put(`/api/user/hooks/${hookId}`)
          .send({ matcher: 'Bash' });

        expect(res.status).toBe(200);
        expect(res.body.hook.matcher).toBe('Bash');
      });
    });

    describe('Error Handling', () => {
      it('should return 404 when no user hooks configured', async () => {
        const error = new Error('File not found');
        error.code = 'ENOENT';
        fs.readFile.mockRejectedValue(error);

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/user/hooks/${hookId}`)
          .send({ command: 'echo test' });

        expect(res.status).toBe(404);
        expect(res.body.details).toContain('No user hooks');
      });

      it('should return 404 for non-existent hook', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionStart::::0');
        const res = await request(app)
          .put(`/api/user/hooks/${hookId}`)
          .send({ command: 'echo test' });

        expect(res.status).toBe(404);
      });

      it('should return 400 for invalid hookId format', async () => {
        const res = await request(app)
          .put(`/api/user/hooks/bad-format`)
          .send({ command: 'echo test' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid hookId');
      });

      it('should return 400 for negative index', async () => {
        const hookId = encodeURIComponent('SessionEnd::::-1');
        const res = await request(app)
          .put(`/api/user/hooks/${hookId}`)
          .send({ command: 'echo test' });

        expect(res.status).toBe(400);
        expect(res.body.details).toContain('non-negative integer');
      });
    });

    describe('Validation', () => {
      it('should apply same validation rules as project hooks', async () => {
        const mockSettings = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [{ type: 'command', command: 'echo pre' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('PreToolUse::Bash::0');
        const res = await request(app)
          .put(`/api/user/hooks/${hookId}`)
          .send({ type: 'prompt' });

        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(expect.arrayContaining([
          expect.stringContaining('prompt')
        ]));
      });

      it('should reject empty command', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/user/hooks/${hookId}`)
          .send({ command: '   ' });

        expect(res.status).toBe(400);
      });

      it('should reject invalid timeout', async () => {
        const mockSettings = {
          hooks: {
            SessionEnd: [
              {
                matcher: '',
                hooks: [{ type: 'command', command: 'echo end' }]
              }
            ]
          }
        };

        fs.readFile.mockImplementation((filePath) => {
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify(mockSettings));
          }
          return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        const hookId = encodeURIComponent('SessionEnd::::0');
        const res = await request(app)
          .put(`/api/user/hooks/${hookId}`)
          .send({ timeout: 0 });

        expect(res.status).toBe(400);
      });
    });
  });
});
