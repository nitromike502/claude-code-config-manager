/**
 * Tests for CopyService.copyMcp() method
 *
 * This test suite verifies MCP server configuration merging including
 * JSON structure handling, conflict detection, dual file location support, and edge cases.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const copyService = require('../../../src/backend/services/copy-service');
const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');

// Mock the projectDiscovery module
jest.mock('../../../src/backend/services/projectDiscovery');

describe('CopyService.copyMcp()', () => {
  let tempDir;
  let testProjectPath;
  let testProjectId;

  // Valid MCP server configuration
  const validMcpConfig = {
    command: 'node',
    args: ['server.js'],
    env: {
      NODE_ENV: 'production'
    }
  };

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copy-service-mcp-test-'));

    // Create test project
    testProjectPath = path.join(tempDir, 'test-project');
    testProjectId = 'testproject';
    await fs.mkdir(path.join(testProjectPath, '.claude'), { recursive: true });

    // Mock discoverProjects to return our test project
    discoverProjects.mockResolvedValue({
      projects: {
        [testProjectId]: {
          path: testProjectPath,
          exists: true
        }
      }
    });

    // Mock os.homedir() for user scope tests
    jest.spyOn(os, 'homedir').mockReturnValue(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    jest.clearAllMocks();
    os.homedir.mockRestore();
  });

  describe('Success cases', () => {
    test('merges MCP server to user scope (settings.json)', async () => {
      const userClaudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(userClaudeDir, { recursive: true });

      const request = {
        sourceServerName: 'github',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'user',
        targetProjectId: null
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);
      expect(result.mergedInto).toBe(path.join(userClaudeDir, 'settings.json'));
      expect(result.serverName).toBe('github');

      // Verify file was created with correct structure
      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.mcpServers).toBeDefined();
      expect(settings.mcpServers.github).toEqual(validMcpConfig);
    });

    test('merges MCP server to project scope (.mcp.json preferred)', async () => {
      // Create .mcp.json file to indicate preference
      const mcpJsonPath = path.join(testProjectPath, '.mcp.json');
      await fs.writeFile(mcpJsonPath, JSON.stringify({ mcpServers: {} }, null, 2), 'utf8');

      const request = {
        sourceServerName: 'gitlab',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);
      expect(result.mergedInto).toBe(mcpJsonPath);
      expect(result.serverName).toBe('gitlab');

      // Verify server was added
      const config = JSON.parse(await fs.readFile(mcpJsonPath, 'utf8'));
      expect(config.mcpServers.gitlab).toEqual(validMcpConfig);
    });

    test('merges MCP server to project scope (settings.json fallback)', async () => {
      // No .mcp.json exists, should use settings.json
      const request = {
        sourceServerName: 'bitbucket',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);
      expect(result.mergedInto).toBe(path.join(testProjectPath, '.claude', 'settings.json'));
      expect(result.serverName).toBe('bitbucket');

      // Verify server was added
      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.mcpServers.bitbucket).toEqual(validMcpConfig);
    });

    test('creates new file if target does not exist', async () => {
      const userClaudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(userClaudeDir, { recursive: true });

      const request = {
        sourceServerName: 'new-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'user',
        targetProjectId: null
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);

      // Verify file was created
      const settingsPath = path.join(userClaudeDir, 'settings.json');
      await expect(fs.access(settingsPath)).resolves.not.toThrow();

      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings.mcpServers['new-server']).toEqual(validMcpConfig);
    });

    test('preserves other MCP servers in target file', async () => {
      const userClaudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(userClaudeDir, { recursive: true });
      const settingsPath = path.join(userClaudeDir, 'settings.json');

      const existingSettings = {
        mcpServers: {
          'existing-server': {
            command: 'python',
            args: ['existing.py']
          }
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceServerName: 'new-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'user',
        targetProjectId: null
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);

      // Verify both servers exist
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings.mcpServers['existing-server']).toEqual(existingSettings.mcpServers['existing-server']);
      expect(settings.mcpServers['new-server']).toEqual(validMcpConfig);
    });

    test('preserves other settings (hooks, etc.) when merging MCP server', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [{ type: 'command', command: 'tsc', enabled: true, timeout: 60 }]
            }
          ]
        },
        mcpServers: {}
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceServerName: 'test-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);

      // Verify hooks were preserved
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings.hooks).toEqual(existingSettings.hooks);
      expect(settings.mcpServers['test-server']).toEqual(validMcpConfig);
    });
  });

  describe('Conflict cases', () => {
    test('returns conflict when server name exists and no strategy provided', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        mcpServers: {
          'github': {
            command: 'existing',
            args: ['old.js']
          }
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceServerName: 'github',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(false);
      expect(result.conflict).toBeDefined();
      expect(result.conflict.serverName).toBe('github');
      expect(result.conflict.targetPath).toBe(settingsPath);
      expect(result.conflict.existingConfig).toEqual(existingSettings.mcpServers.github);

      // Verify original config was not modified
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings.mcpServers.github).toEqual(existingSettings.mcpServers.github);
    });

    test('skips merge when conflict strategy is "skip"', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        mcpServers: {
          'github': {
            command: 'existing',
            args: ['old.js']
          }
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceServerName: 'github',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'skip'
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.message).toBe('Copy cancelled by user');

      // Verify original config was not modified
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings.mcpServers.github).toEqual(existingSettings.mcpServers.github);
    });

    test('overwrites existing server when conflict strategy is "overwrite"', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        mcpServers: {
          'github': {
            command: 'old-command',
            args: ['old.js']
          }
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceServerName: 'github',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'overwrite'
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);
      expect(result.serverName).toBe('github');

      // Verify config was replaced with new one
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings.mcpServers.github).toEqual(validMcpConfig);
    });

    test('returns error for unknown conflict strategy', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        mcpServers: {
          'github': {
            command: 'existing',
            args: ['old.js']
          }
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceServerName: 'github',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'unknown-strategy'
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown conflict strategy');
    });
  });

  describe('Validation failures', () => {
    test('returns error when sourceServerName is missing', async () => {
      const request = {
        sourceServerName: null,
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('sourceServerName is required');
    });

    test('returns error when sourceMcpConfig is missing', async () => {
      const request = {
        sourceServerName: 'test-server',
        sourceMcpConfig: null,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('sourceMcpConfig is required');
    });

    test('returns error when command field is missing in config', async () => {
      const request = {
        sourceServerName: 'test-server',
        sourceMcpConfig: {
          args: ['server.js']
          // command is missing
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('command is required');
    });

    test('returns error when targetScope is invalid', async () => {
      const request = {
        sourceServerName: 'test-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'invalid-scope',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid targetScope');
    });

    test('returns error when project ID is missing for project scope', async () => {
      const request = {
        sourceServerName: 'test-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: null
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('targetProjectId is required');
    });

    test('returns error when project not found', async () => {
      discoverProjects.mockResolvedValue({
        projects: {} // Empty projects
      });

      const request = {
        sourceServerName: 'test-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: 'nonexistent'
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project not found');
    });

    test('handles malformed target JSON gracefully', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      await fs.writeFile(settingsPath, 'INVALID JSON{{{', 'utf8');

      const request = {
        sourceServerName: 'test-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to read target file');
    });
  });

  describe('Dual file location (project scope)', () => {
    test('prefers .mcp.json when it exists', async () => {
      // Create both files
      const mcpJsonPath = path.join(testProjectPath, '.mcp.json');
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');

      await fs.writeFile(mcpJsonPath, JSON.stringify({ mcpServers: {} }, null, 2), 'utf8');
      await fs.writeFile(settingsPath, JSON.stringify({ mcpServers: {} }, null, 2), 'utf8');

      const request = {
        sourceServerName: 'test-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);
      expect(result.mergedInto).toBe(mcpJsonPath);

      // Verify server was added to .mcp.json
      const mcpConfig = JSON.parse(await fs.readFile(mcpJsonPath, 'utf8'));
      expect(mcpConfig.mcpServers['test-server']).toEqual(validMcpConfig);

      // Verify settings.json was not modified
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings.mcpServers['test-server']).toBeUndefined();
    });

    test('uses settings.json when .mcp.json does not exist', async () => {
      // Only create settings.json
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      await fs.writeFile(settingsPath, JSON.stringify({ mcpServers: {} }, null, 2), 'utf8');

      const request = {
        sourceServerName: 'test-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);
      expect(result.mergedInto).toBe(settingsPath);

      // Verify .mcp.json was not created
      const mcpJsonPath = path.join(testProjectPath, '.mcp.json');
      await expect(fs.access(mcpJsonPath)).rejects.toThrow();
    });

    test('creates settings.json when neither file exists', async () => {
      const request = {
        sourceServerName: 'test-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);
      expect(result.mergedInto).toBe(path.join(testProjectPath, '.claude', 'settings.json'));

      // Verify file was created
      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.mcpServers['test-server']).toEqual(validMcpConfig);
    });
  });

  describe('Edge cases', () => {
    test('handles MCP config with minimal fields', async () => {
      const minimalConfig = {
        command: 'npx',
        args: ['-y', 'server']
      };

      const request = {
        sourceServerName: 'minimal-server',
        sourceMcpConfig: minimalConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.mcpServers['minimal-server']).toEqual(minimalConfig);
    });

    test('handles MCP config with complex env variables', async () => {
      const complexConfig = {
        command: 'node',
        args: ['server.js'],
        env: {
          NODE_ENV: 'production',
          API_KEY: 'secret-key-123',
          DATABASE_URL: 'postgresql://user:pass@host:5432/db',
          NESTED_OBJECT: JSON.stringify({ key: 'value' })
        }
      };

      const request = {
        sourceServerName: 'complex-server',
        sourceMcpConfig: complexConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.mcpServers['complex-server']).toEqual(complexConfig);
    });

    test('preserves multiple existing MCP servers when adding new one', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        mcpServers: {
          'server1': { command: 'cmd1', args: ['arg1'] },
          'server2': { command: 'cmd2', args: ['arg2'] },
          'server3': { command: 'cmd3', args: ['arg3'] }
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceServerName: 'server4',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(Object.keys(settings.mcpServers)).toHaveLength(4);
      expect(settings.mcpServers.server1).toEqual(existingSettings.mcpServers.server1);
      expect(settings.mcpServers.server2).toEqual(existingSettings.mcpServers.server2);
      expect(settings.mcpServers.server3).toEqual(existingSettings.mcpServers.server3);
      expect(settings.mcpServers.server4).toEqual(validMcpConfig);
    });

    test('atomic write prevents corruption on failure', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const originalSettings = {
        mcpServers: {
          'existing': { command: 'existing', args: [] }
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(originalSettings, null, 2), 'utf8');

      // Mock fs.rename to fail
      const originalRename = fs.rename;
      fs.rename = jest.fn().mockRejectedValue(new Error('Disk full'));

      const request = {
        sourceServerName: 'new-server',
        sourceMcpConfig: validMcpConfig,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyMcp(request);

      // Restore original
      fs.rename = originalRename;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update target file');

      // Verify original file is unchanged
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings).toEqual(originalSettings);

      // Verify temp file was cleaned up
      const tempFile = settingsPath + '.tmp';
      await expect(fs.access(tempFile)).rejects.toThrow();
    });
  });
});
