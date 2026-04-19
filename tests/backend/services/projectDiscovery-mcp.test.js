/**
 * Tests for getProjectMCP() and getUserMCP() in projectDiscovery.js
 *
 * These functions were modified in STORY-11.1 to:
 * - getProjectMCP: merge project-scoped (.mcp.json) and user-scoped (~/.claude.json)
 *   servers with scope and status fields
 * - getUserMCP: add scope:'user' to each returned server
 *
 * Updated in STORY-11.2: Status resolution simplified to use only disabledMcpServers
 * from ~/.claude.json projects[path] as the universal per-project disable list.
 * All servers (project and user scoped) are enabled by default unless their name
 * appears in disabledMcpServers.
 *
 * Test Coverage:
 * - scope field tagging (project vs user)
 * - Ordering: project servers first, then user servers
 * - Deduplication: project server name takes precedence over same-named user server
 * - Status resolution using disabledMcpServers from ~/.claude.json project entry
 * - Servers enabled by default unless in disabledMcpServers
 * - disabledMcpServers applies to both project-scoped and user-scoped servers
 * - Graceful handling of missing files
 * - Stale/unknown entries in disabledMcpServers silently ignored
 */

// Mock dependencies FIRST before any requires
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
    unlink: jest.fn()
  }
}));

jest.mock('os');

const fs = require('fs').promises;
const os = require('os');
const { getProjectMCP, getUserMCP } = require('../../../src/backend/services/projectDiscovery');

// Fixed test paths — no HOME dependency in path assertions
const TEST_HOME = '/home/testuser';
const PROJECT_PATH = '/home/testuser/myproject';

// Computed paths (mirror config.js logic, no dev mode)
const MCP_JSON_PATH = `${PROJECT_PATH}/.mcp.json`;
const SETTINGS_LOCAL_PATH = `${PROJECT_PATH}/.claude/settings.local.json`;
const SETTINGS_JSON_PATH = `${PROJECT_PATH}/.claude/settings.json`;
const CLAUDE_JSON_PATH = `${TEST_HOME}/.claude.json`;

/** Helper: create an ENOENT error */
const enoent = (filePath) => {
  const err = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
  err.code = 'ENOENT';
  return err;
};

/** Helper: build a readFile mock that returns JSON strings for known paths */
function buildReadFileMock(fileMap) {
  return jest.fn((filePath) => {
    if (Object.prototype.hasOwnProperty.call(fileMap, filePath)) {
      const value = fileMap[filePath];
      if (value === null) {
        return Promise.reject(enoent(filePath));
      }
      return Promise.resolve(JSON.stringify(value));
    }
    // Default: file not found
    return Promise.reject(enoent(filePath));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  os.homedir.mockReturnValue(TEST_HOME);
  process.env.HOME = TEST_HOME;
  // Unset dev mode so paths use production names
  delete process.env.USE_DEV_PATHS;
});

afterEach(() => {
  delete process.env.USE_DEV_PATHS;
});

// ---------------------------------------------------------------------------
// getUserMCP tests
// ---------------------------------------------------------------------------

describe('getUserMCP()', () => {
  test('returns servers with scope:"user"', async () => {
    fs.readFile = buildReadFileMock({
      [CLAUDE_JSON_PATH]: {
        mcpServers: {
          'ticket-system': { command: 'node', args: ['ticket.js'] },
          'github': { command: 'node', args: ['github.js'] }
        }
      }
    });

    const { mcp } = await getUserMCP();

    expect(mcp).toHaveLength(2);
    mcp.forEach(server => {
      expect(server.scope).toBe('user');
    });
  });

  test('preserves existing fields alongside scope', async () => {
    fs.readFile = buildReadFileMock({
      [CLAUDE_JSON_PATH]: {
        mcpServers: {
          'playwright': {
            command: 'npx',
            args: ['-y', '@playwright/mcp@latest'],
            env: { NODE_ENV: 'test' }
          }
        }
      }
    });

    const { mcp } = await getUserMCP();

    expect(mcp).toHaveLength(1);
    const server = mcp[0];
    expect(server.name).toBe('playwright');
    expect(server.command).toBe('npx');
    expect(server.args).toEqual(['-y', '@playwright/mcp@latest']);
    expect(server.env).toEqual({ NODE_ENV: 'test' });
    expect(server.source).toBe('~/.claude.json');
    expect(server.scope).toBe('user');
  });

  test('returns empty mcp array when ~/.claude.json has no mcpServers', async () => {
    fs.readFile = buildReadFileMock({
      [CLAUDE_JSON_PATH]: { projects: {} }
    });

    const { mcp, warnings } = await getUserMCP();

    expect(mcp).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  test('returns empty array and no crash when ~/.claude.json is missing', async () => {
    fs.readFile = buildReadFileMock({});

    const { mcp, warnings } = await getUserMCP();

    expect(mcp).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getProjectMCP tests
// ---------------------------------------------------------------------------

describe('getProjectMCP()', () => {
  // Minimal "all files missing" scenario used as a base
  const noFiles = {
    [MCP_JSON_PATH]: null,
    [SETTINGS_LOCAL_PATH]: null,
    [SETTINGS_JSON_PATH]: null,
    [CLAUDE_JSON_PATH]: null
  };

  // -------------------------------------------------------------------------
  // Scope tagging
  // -------------------------------------------------------------------------

  describe('scope tagging', () => {
    test('project servers from .mcp.json get scope:"project"', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'local-db': { command: 'node', args: ['db.js'] },
            'local-api': { command: 'python', args: ['api.py'] }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const projectServers = mcp.filter(s => s.scope === 'project');
      expect(projectServers).toHaveLength(2);
      projectServers.forEach(s => expect(s.scope).toBe('project'));
    });

    test('user servers from ~/.claude.json get scope:"user"', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [CLAUDE_JSON_PATH]: {
          mcpServers: {
            'ticket-system': { command: 'node', args: ['ticket.js'] }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const userServers = mcp.filter(s => s.scope === 'user');
      expect(userServers).toHaveLength(1);
      expect(userServers[0].name).toBe('ticket-system');
      expect(userServers[0].scope).toBe('user');
    });
  });

  // -------------------------------------------------------------------------
  // Ordering
  // -------------------------------------------------------------------------

  describe('ordering', () => {
    test('project servers appear before user servers in merged array', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'proj-server': { command: 'node', args: ['proj.js'] }
          }
        },
        [CLAUDE_JSON_PATH]: {
          mcpServers: {
            'user-server': { command: 'node', args: ['user.js'] }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      expect(mcp.length).toBeGreaterThanOrEqual(2);
      const projIdx = mcp.findIndex(s => s.name === 'proj-server');
      const userIdx = mcp.findIndex(s => s.name === 'user-server');
      expect(projIdx).toBeLessThan(userIdx);
    });
  });

  // -------------------------------------------------------------------------
  // Deduplication
  // -------------------------------------------------------------------------

  describe('deduplication', () => {
    test('project server overrides user server with same name', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'playwright': { command: 'npx', args: ['-y', '@playwright/mcp@latest'] }
          }
        },
        [CLAUDE_JSON_PATH]: {
          mcpServers: {
            'playwright': { command: 'node', args: ['user-playwright.js'] }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const playwrightServers = mcp.filter(s => s.name === 'playwright');
      expect(playwrightServers).toHaveLength(1);
      expect(playwrightServers[0].scope).toBe('project');
      expect(playwrightServers[0].source).toBe('.mcp.json');
    });

    test('unique servers from both scopes are all included', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'project-only': { command: 'node', args: ['p.js'] }
          }
        },
        [CLAUDE_JSON_PATH]: {
          mcpServers: {
            'user-only': { command: 'node', args: ['u.js'] }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      expect(mcp.some(s => s.name === 'project-only')).toBe(true);
      expect(mcp.some(s => s.name === 'user-only')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Status resolution — project servers
  // -------------------------------------------------------------------------

  describe('status resolution — project servers', () => {
    test('enableAllProjectMcpServers:true in settings.local.json enables all project servers', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'alpha': { command: 'node', args: ['a.js'] },
            'beta': { command: 'node', args: ['b.js'] }
          }
        },
        [SETTINGS_LOCAL_PATH]: {
          enableAllProjectMcpServers: true
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const projectServers = mcp.filter(s => s.scope === 'project');
      expect(projectServers).toHaveLength(2);
      projectServers.forEach(s => expect(s.status).toBe('enabled'));
    });

    test('project server enabled by default when not in disabledMcpServers', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'alpha': { command: 'node', args: ['a.js'] },
            'beta': { command: 'node', args: ['b.js'] },
            'gamma': { command: 'node', args: ['g.js'] }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const alpha = mcp.find(s => s.name === 'alpha');
      const beta = mcp.find(s => s.name === 'beta');
      const gamma = mcp.find(s => s.name === 'gamma');

      // All enabled by default — not in disabledMcpServers
      expect(alpha.status).toBe('enabled');
      expect(beta.status).toBe('enabled');
      expect(gamma.status).toBe('enabled');
    });

    test('disabledMcpServers disables specific project servers', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'alpha': { command: 'node', args: ['a.js'] },
            'beta': { command: 'node', args: ['b.js'] }
          }
        },
        [CLAUDE_JSON_PATH]: {
          projects: {
            [PROJECT_PATH]: {
              disabledMcpServers: ['alpha']
            }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const alpha = mcp.find(s => s.name === 'alpha');
      const beta = mcp.find(s => s.name === 'beta');

      expect(alpha.status).toBe('disabled');
      // beta not in disabledMcpServers → enabled
      expect(beta.status).toBe('enabled');
    });

    test('project server not in disabledMcpServers gets status:"enabled"', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'any-server': { command: 'node', args: ['s.js'] }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const server = mcp.find(s => s.name === 'any-server');
      // Not in disabledMcpServers → enabled by default
      expect(server.status).toBe('enabled');
    });
  });

  // -------------------------------------------------------------------------
  // Status resolution — user servers
  // -------------------------------------------------------------------------

  describe('status resolution — user servers', () => {
    test('user server disabled via disabledMcpServers in ~/.claude.json project entry', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [CLAUDE_JSON_PATH]: {
          mcpServers: {
            'ticket-system': { command: 'node', args: ['ticket.js'] },
            'github': { command: 'node', args: ['github.js'] }
          },
          projects: {
            [PROJECT_PATH]: {
              disabledMcpServers: ['ticket-system']
            }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const ticketServer = mcp.find(s => s.name === 'ticket-system');
      const githubServer = mcp.find(s => s.name === 'github');

      expect(ticketServer.status).toBe('disabled');
      expect(githubServer.status).toBe('enabled');
    });

    test('user server enabled by default when not in disabledMcpServers', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [CLAUDE_JSON_PATH]: {
          mcpServers: {
            'always-on': { command: 'node', args: ['on.js'] }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const server = mcp.find(s => s.name === 'always-on');
      expect(server).toBeDefined();
      expect(server.status).toBe('enabled');
    });

    test('stale disabledMcpServers entries do not cause errors or warnings', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [CLAUDE_JSON_PATH]: {
          mcpServers: {
            'real-server': { command: 'node', args: ['real.js'] }
          },
          projects: {
            [PROJECT_PATH]: {
              // 'ghost-server' doesn't exist in mcpServers
              disabledMcpServers: ['ghost-server']
            }
          }
        }
      });

      const { mcp, warnings } = await getProjectMCP(PROJECT_PATH);

      // Should not throw; real-server should still be included and enabled
      const realServer = mcp.find(s => s.name === 'real-server');
      expect(realServer).toBeDefined();
      expect(realServer.status).toBe('enabled');
      // No warning about the stale entry
      const staleWarning = warnings.find(w =>
        w.error && w.error.toLowerCase().includes('ghost-server')
      );
      expect(staleWarning).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Settings precedence
  // -------------------------------------------------------------------------

  describe('status resolution — disabledMcpServers applies to all scopes', () => {
    test('disabledMcpServers disables both project and user servers', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'proj-server': { command: 'node', args: ['p.js'] }
          }
        },
        [CLAUDE_JSON_PATH]: {
          mcpServers: {
            'user-server': { command: 'node', args: ['u.js'] }
          },
          projects: {
            [PROJECT_PATH]: {
              disabledMcpServers: ['proj-server', 'user-server']
            }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const projServer = mcp.find(s => s.name === 'proj-server');
      const userServer = mcp.find(s => s.name === 'user-server');

      // Both disabled via disabledMcpServers
      expect(projServer.status).toBe('disabled');
      expect(userServer.status).toBe('disabled');
    });

    test('servers not in disabledMcpServers are enabled regardless of scope', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'proj-server': { command: 'node', args: ['p.js'] }
          }
        },
        [CLAUDE_JSON_PATH]: {
          mcpServers: {
            'user-server': { command: 'node', args: ['u.js'] }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const projServer = mcp.find(s => s.name === 'proj-server');
      const userServer = mcp.find(s => s.name === 'user-server');

      expect(projServer.status).toBe('enabled');
      expect(userServer.status).toBe('enabled');
    });

    test('disabledMcpServers from ~/.claude.json project entry is the single source of truth', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'server-a': { command: 'node', args: ['a.js'] },
            'server-b': { command: 'node', args: ['b.js'] },
            'server-c': { command: 'node', args: ['c.js'] }
          }
        },
        [CLAUDE_JSON_PATH]: {
          projects: {
            [PROJECT_PATH]: {
              disabledMcpServers: ['server-a']
            }
          }
        }
      });

      const { mcp } = await getProjectMCP(PROJECT_PATH);

      expect(mcp.find(s => s.name === 'server-a').status).toBe('disabled');
      expect(mcp.find(s => s.name === 'server-b').status).toBe('enabled');
      expect(mcp.find(s => s.name === 'server-c').status).toBe('enabled');
    });
  });

  // -------------------------------------------------------------------------
  // Missing files / edge cases
  // -------------------------------------------------------------------------

  describe('missing files and edge cases', () => {
    test('handles missing .mcp.json gracefully — returns only user servers', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [CLAUDE_JSON_PATH]: {
          mcpServers: {
            'user-only': { command: 'node', args: ['u.js'] }
          }
        }
      });

      const { mcp, warnings } = await getProjectMCP(PROJECT_PATH);

      expect(mcp.some(s => s.name === 'user-only')).toBe(true);
      // No error warnings for a simply missing file
      const errorWarnings = warnings.filter(w => w.error && !w.error.includes('ENOENT'));
      expect(errorWarnings).toHaveLength(0);
    });

    test('handles all files missing — returns empty array without crashing', async () => {
      fs.readFile = buildReadFileMock({});

      const { mcp, warnings } = await getProjectMCP(PROJECT_PATH);

      expect(Array.isArray(mcp)).toBe(true);
      expect(Array.isArray(warnings)).toBe(true);
      expect(mcp).toHaveLength(0);
    });

    test('handles missing settings files — server enabled by default', async () => {
      fs.readFile = buildReadFileMock({
        ...noFiles,
        [MCP_JSON_PATH]: {
          mcpServers: {
            'proj': { command: 'node', args: ['p.js'] }
          }
        }
      });

      // No settings files present — should not throw
      const { mcp } = await getProjectMCP(PROJECT_PATH);

      const proj = mcp.find(s => s.name === 'proj');
      expect(proj).toBeDefined();
      expect(proj.scope).toBe('project');
      // Not in disabledMcpServers (no ~/.claude.json) → enabled by default
      expect(proj.status).toBe('enabled');
    });
  });
});
