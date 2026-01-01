/**
 * Unit tests for CopyService.buildTargetPath()
 * Tests parameter validation, project scope validation, and target path building
 *
 * NOTE: This test file uses a different mocking strategy than typical Jest tests due to
 * complex module dependencies. We spy on fs.promises methods rather than mock the entire
 * fs module to avoid circular dependency issues with fileReader and projectDiscovery.
 */

const path = require('path');
const os = require('os');

// Mock only the projectDiscovery module to avoid loading the entire dependency chain
jest.mock('../../../src/backend/services/projectDiscovery', () => ({
  discoverProjects: jest.fn()
}));

const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');
const copyService = require('../../../src/backend/services/copy-service');

describe('CopyService - buildTargetPath()', () => {
  let originalHome;

  beforeEach(() => {
    // Save and mock HOME environment variable for config module
    originalHome = process.env.HOME;
    process.env.HOME = os.homedir();

    // Mock discoverProjects for project scope tests
    discoverProjects.mockResolvedValue({
      projects: {
        'homeusermyproject': {
          id: 'homeusermyproject',
          path: '/home/user/myproject',
          name: 'myproject',
          exists: true,
          config: {}
        },
        'homeusermissingproject': {
          id: 'homeusermissingproject',
          path: '/home/user/missing',
          name: 'missing',
          exists: false,
          config: {}
        }
      },
      error: null
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore HOME environment variable
    process.env.HOME = originalHome;
  });

  describe('Parameter Validation', () => {
    test('should reject null configType', async () => {
      await expect(copyService.buildTargetPath(null, 'user', null, '/path/to/file.md'))
        .rejects.toThrow('Invalid configType: must be a non-empty string');
    });

    test('should reject empty configType', async () => {
      await expect(copyService.buildTargetPath('', 'user', null, '/path/to/file.md'))
        .rejects.toThrow('Invalid configType: must be a non-empty string');
    });

    test('should reject invalid configType', async () => {
      await expect(copyService.buildTargetPath('invalid', 'user', null, '/path/to/file.md'))
        .rejects.toThrow('Invalid configType: must be one of agent, command, hook, mcp');
    });

    test('should reject null targetScope', async () => {
      await expect(copyService.buildTargetPath('agent', null, null, '/path/to/file.md'))
        .rejects.toThrow('Invalid targetScope: must be a non-empty string');
    });

    test('should reject invalid targetScope', async () => {
      await expect(copyService.buildTargetPath('agent', 'global', null, '/path/to/file.md'))
        .rejects.toThrow('Invalid targetScope: must be one of project, user');
    });

    test('should reject null sourcePath', async () => {
      await expect(copyService.buildTargetPath('agent', 'user', null, null))
        .rejects.toThrow('Invalid sourcePath: must be a non-empty string');
    });

    test('should reject project scope without projectId', async () => {
      await expect(copyService.buildTargetPath('agent', 'project', null, '/path/to/file.md'))
        .rejects.toThrow('targetProjectId is required when targetScope is "project"');
    });

    test('should reject project scope with empty projectId', async () => {
      await expect(copyService.buildTargetPath('agent', 'project', '', '/path/to/file.md'))
        .rejects.toThrow('targetProjectId is required when targetScope is "project"');
    });
  });

  describe('Project Scope Validation', () => {
    test('should reject nonexistent project', async () => {
      await expect(copyService.buildTargetPath('agent', 'project', 'nonexistent', '/path/agent.md'))
        .rejects.toThrow('Project not found: nonexistent');
    });

    test('should reject project that does not exist on filesystem', async () => {
      await expect(copyService.buildTargetPath('agent', 'project', 'homeusermissingproject', '/path/agent.md'))
        .rejects.toThrow('Project directory does not exist: /home/user/missing');
    });
  });

  describe('Agent Target Paths', () => {
    test('should build user agent path', async () => {
      const result = await copyService.buildTargetPath('agent', 'user', null, '/source/my-agent.md');
      const expected = path.join(os.homedir(), '.claude', 'agents', 'my-agent.md');
      expect(result).toBe(expected);
    });

    test('should build project agent path', async () => {
      const result = await copyService.buildTargetPath('agent', 'project', 'homeusermyproject', '/source/my-agent.md');
      const expected = path.join('/home/user/myproject', '.claude', 'agents', 'my-agent.md');
      expect(result).toBe(expected);
    });

    test('should preserve agent filename', async () => {
      const result = await copyService.buildTargetPath('agent', 'user', null, '/source/complex-name-123.md');
      expect(path.basename(result)).toBe('complex-name-123.md');
    });
  });

  describe('Command Target Paths', () => {
    test('should build user command path (root level)', async () => {
      const result = await copyService.buildTargetPath('command', 'user', null, '/source/commands/mycommand.md');
      const expected = path.join(os.homedir(), '.claude', 'commands', 'mycommand.md');
      expect(result).toBe(expected);
    });

    test('should build project command path (root level)', async () => {
      const result = await copyService.buildTargetPath('command', 'project', 'homeusermyproject', '/source/commands/mycommand.md');
      const expected = path.join('/home/user/myproject', '.claude', 'commands', 'mycommand.md');
      expect(result).toBe(expected);
    });

    test('should preserve nested command path (one level)', async () => {
      const sourcePath = `/home/user/project/.claude/commands/dev/build.md`;
      const result = await copyService.buildTargetPath('command', 'user', null, sourcePath);
      const expected = path.join(os.homedir(), '.claude', 'commands', 'dev', 'build.md');
      expect(result).toBe(expected);
    });

    test('should preserve nested command path (multiple levels)', async () => {
      const sourcePath = `/home/user/project/.claude/commands/dev/frontend/build.md`;
      const result = await copyService.buildTargetPath('command', 'user', null, sourcePath);
      const expected = path.join(os.homedir(), '.claude', 'commands', 'dev', 'frontend', 'build.md');
      expect(result).toBe(expected);
    });

    test('should handle command without nested path', async () => {
      const sourcePath = `/home/user/mycommand.md`;
      const result = await copyService.buildTargetPath('command', 'user', null, sourcePath);
      const expected = path.join(os.homedir(), '.claude', 'commands', 'mycommand.md');
      expect(result).toBe(expected);
    });
  });

  describe('Hook Target Paths', () => {
    test('should build user hook path (settings.json)', async () => {
      const result = await copyService.buildTargetPath('hook', 'user', null, '/source/hook-data.json');
      const expected = path.join(os.homedir(), '.claude', 'settings.json');
      expect(result).toBe(expected);
    });

    test('should build project hook path (settings.json)', async () => {
      const result = await copyService.buildTargetPath('hook', 'project', 'homeusermyproject', '/source/hook-data.json');
      const expected = path.join('/home/user/myproject', '.claude', 'settings.json');
      expect(result).toBe(expected);
    });
  });

  describe('MCP Server Target Paths', () => {
    test('should build user MCP path (~/.claude.json)', async () => {
      // User MCP servers are stored in ~/.claude.json, not ~/.claude/settings.json
      const result = await copyService.buildTargetPath('mcp', 'user', null, '/source/server-config.json');
      const expected = path.join(os.homedir(), '.claude.json');
      expect(result).toBe(expected);
    });

    test('should build project MCP path (.mcp.json)', async () => {
      const result = await copyService.buildTargetPath('mcp', 'project', 'homeusermyproject', '/source/server-config.json');
      const expected = path.join('/home/user/myproject', '.mcp.json');
      expect(result).toBe(expected);
    });
  });

  describe('Security Validation', () => {
    test('should normalize final target path', async () => {
      const result = await copyService.buildTargetPath('agent', 'user', null, '/source/./agent.md');
      expect(result).toBe(path.normalize(result));
    });

    test('should prevent path escaping base directory', async () => {
      // This test ensures defense-in-depth: even if a malicious filename somehow
      // gets through, the final security check should catch it
      const maliciousSource = '/source/agents/../../../../../etc/passwd';

      // This should be caught during target path construction
      const result = await copyService.buildTargetPath('agent', 'user', null, maliciousSource);

      // Result should still be within .claude directory
      const userHome = os.homedir();
      expect(result.startsWith(userHome)).toBe(true);
    });
  });
});
