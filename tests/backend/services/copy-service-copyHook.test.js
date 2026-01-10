/**
 * Tests for CopyService.copyHook() method
 *
 * This test suite verifies the intelligent merging of hooks into settings.json
 * including 3-level nested structure handling, deduplication, and edge cases.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const copyService = require('../../../src/backend/services/copy-service');
const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');

// Mock the projectDiscovery module
jest.mock('../../../src/backend/services/projectDiscovery');

describe('CopyService.copyHook()', () => {
  let tempDir;
  let testProjectPath;
  let testProjectId;
  let originalHome;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copy-service-hook-test-'));

    // Save and set HOME environment variable for config module
    originalHome = process.env.HOME;
    process.env.HOME = tempDir;

    testProjectPath = path.join(tempDir, 'test-project');
    testProjectId = 'testproject';

    // Create project directory structure
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
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    // Restore HOME environment variable
    process.env.HOME = originalHome;
    jest.clearAllMocks();
  });

  describe('Basic hook merging', () => {
    test('merges hook into empty settings.json (creates new file)', async () => {
      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);

      expect(result.success).toBe(true);
      expect(result.mergedInto).toBe(path.join(testProjectPath, '.claude', 'settings.json'));
      expect(result.hook).toEqual({
        event: 'PreToolUse',
        matcher: '*.ts',
        command: 'tsc --noEmit'
      });

      // Verify file was created with correct structure
      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.PreToolUse).toEqual([
        {
          matcher: '*.ts',
          hooks: [
            {
              type: 'command',
              command: 'tsc --noEmit',
              enabled: true,
              timeout: 60
            }
          ]
        }
      ]);
    });

    test('merges hook into existing settings.json with no hooks', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        mcpServers: {
          'test-server': {
            command: 'node',
            args: ['server.js']
          }
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.js',
          type: 'command',
          command: 'eslint --fix',
          enabled: true,
          timeout: 30
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);

      expect(result.success).toBe(true);

      // Verify mcpServers was preserved
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings.mcpServers).toEqual(existingSettings.mcpServers);

      // Verify hook was added
      expect(settings.hooks.PreToolUse).toEqual([
        {
          matcher: '*.js',
          hooks: [
            {
              type: 'command',
              command: 'eslint --fix',
              enabled: true,
              timeout: 30
            }
          ]
        }
      ]);
    });

    test('merges hook to user scope (~/.claude/settings.json)', async () => {
      const userClaudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(userClaudeDir, { recursive: true });

      // Mock os.homedir() to return our temp directory
      jest.spyOn(os, 'homedir').mockReturnValue(tempDir);

      const request = {
        sourceHook: {
          event: 'SessionStart',
          type: 'command',
          command: 'git fetch',
          enabled: true,
          timeout: 60
        },
        targetScope: 'user',
        targetProjectId: null
      };

      const result = await copyService.copyHook(request);

      expect(result.success).toBe(true);
      expect(result.mergedInto).toBe(path.join(userClaudeDir, 'settings.json'));

      // Verify file was created
      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.hooks.SessionStart).toEqual([
        {
          hooks: [
            {
              type: 'command',
              command: 'git fetch',
              enabled: true,
              timeout: 60
            }
          ]
        }
      ]);

      os.homedir.mockRestore();
    });
  });

  describe('3-Level merge algorithm', () => {
    test('Level 1: Adds new event to existing hooks object', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [{ type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }]
            }
          ]
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceHook: {
          event: 'PostToolUse',
          matcher: '*',
          type: 'command',
          command: 'npm test',
          enabled: true,
          timeout: 120
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));

      // PreToolUse should still exist
      expect(settings.hooks.PreToolUse).toEqual(existingSettings.hooks.PreToolUse);

      // PostToolUse should be added (matcher field MUST be present for matcher-supporting events)
      expect(settings.hooks.PostToolUse).toEqual([
        {
          matcher: '*', // MUST be present for matcher-supporting events
          hooks: [
            {
              type: 'command',
              command: 'npm test',
              enabled: true,
              timeout: 120
            }
          ]
        }
      ]);
    });

    test('Level 2: Adds new matcher to existing event', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [{ type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }]
            }
          ]
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.js',
          type: 'command',
          command: 'eslint --fix',
          enabled: true,
          timeout: 30
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));

      // Should have 2 matcher entries for PreToolUse
      expect(settings.hooks.PreToolUse).toHaveLength(2);

      // Original matcher should still exist
      expect(settings.hooks.PreToolUse[0]).toEqual(existingSettings.hooks.PreToolUse[0]);

      // New matcher should be added
      expect(settings.hooks.PreToolUse[1]).toEqual({
        matcher: '*.js',
        hooks: [
          {
            type: 'command',
            command: 'eslint --fix',
            enabled: true,
            timeout: 30
          }
        ]
      });
    });

    test('Level 3: Adds new hook command to existing event+matcher', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [
                { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }
              ]
            }
          ]
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'eslint --fix',
          enabled: true,
          timeout: 30
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));

      // Should still have 1 matcher entry
      expect(settings.hooks.PreToolUse).toHaveLength(1);

      // Should have 2 hooks in the matcher's hooks array
      expect(settings.hooks.PreToolUse[0].hooks).toHaveLength(2);
      expect(settings.hooks.PreToolUse[0].hooks[0]).toEqual(
        existingSettings.hooks.PreToolUse[0].hooks[0]
      );
      expect(settings.hooks.PreToolUse[0].hooks[1]).toEqual({
        type: 'command',
        command: 'eslint --fix',
        enabled: true,
        timeout: 30
      });
    });
  });

  describe('Deduplication', () => {
    test('skips duplicate hook (same event+matcher+command)', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [
                { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }
              ]
            }
          ]
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          enabled: false, // Different enabled value
          timeout: 120 // Different timeout
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));

      // Should still have only 1 hook (duplicate was skipped)
      expect(settings.hooks.PreToolUse[0].hooks).toHaveLength(1);

      // Original hook should be unchanged
      expect(settings.hooks.PreToolUse[0].hooks[0]).toEqual(
        existingSettings.hooks.PreToolUse[0].hooks[0]
      );
    });

    test('allows same command in different event', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [
                { type: 'command', command: 'npm test', enabled: true, timeout: 60 }
              ]
            }
          ]
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceHook: {
          event: 'PostToolUse',
          matcher: '*',
          type: 'command',
          command: 'npm test', // Same command, different event
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));

      // Should have both hooks (different events)
      expect(settings.hooks.PreToolUse).toBeDefined();
      expect(settings.hooks.PostToolUse).toBeDefined();
      expect(settings.hooks.PostToolUse[0].hooks[0].command).toBe('npm test');
    });

    test('allows same command in different matcher', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [
                { type: 'command', command: 'npm test', enabled: true, timeout: 60 }
              ]
            }
          ]
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.js',
          type: 'command',
          command: 'npm test', // Same command, different matcher
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));

      // Should have 2 matcher entries
      expect(settings.hooks.PreToolUse).toHaveLength(2);
      expect(settings.hooks.PreToolUse[0].matcher).toBe('*.ts');
      expect(settings.hooks.PreToolUse[1].matcher).toBe('*.js');
    });
  });

  describe('Matcher handling', () => {
    test('treats undefined matcher as "*"', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');

      // First hook: explicit "*" matcher
      await copyService.copyHook({
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*',
          type: 'command',
          command: 'first-command',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      });

      // Second hook: undefined matcher (should merge into same matcher entry)
      const result = await copyService.copyHook({
        sourceHook: {
          event: 'PreToolUse',
          matcher: undefined,
          type: 'command',
          command: 'second-command',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      });

      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));

      // Should have only 1 matcher entry (undefined treated as "*")
      expect(settings.hooks.PreToolUse).toHaveLength(1);
      expect(settings.hooks.PreToolUse[0].hooks).toHaveLength(2);
    });

    test('omits matcher field when value is "*"', async () => {
      const request = {
        sourceHook: {
          event: 'SessionStart',
          matcher: '*',
          type: 'command',
          command: 'git status',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));

      // Matcher field should not be present when value is "*"
      expect(settings.hooks.SessionStart[0]).toEqual({
        hooks: [
          {
            type: 'command',
            command: 'git status',
            enabled: true,
            timeout: 60
          }
        ]
      });
      expect(settings.hooks.SessionStart[0].matcher).toBeUndefined();
    });

    test('includes matcher field when value is not "*"', async () => {
      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));

      // Matcher field should be present when value is not "*"
      expect(settings.hooks.PreToolUse[0].matcher).toBe('*.ts');
    });

    test('adds matcher field to existing entry that lacks it (BUG-043)', async () => {
      // Regression test for BUG-043: When merging into an existing matcher entry
      // that doesn't have a matcher field (e.g., from old code), ensure the field is added

      // 1. Create settings with a malformed hook entry (no matcher field)
      const malformedSettings = {
        hooks: {
          PreToolUse: [
            {
              hooks: [
                {
                  type: 'command',
                  command: 'existing command',
                  enabled: true,
                  timeout: 60
                }
              ]
              // NOTE: Missing 'matcher' field - this should be fixed when adding new hook
            }
          ]
        }
      };

      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      await fs.mkdir(path.dirname(settingsPath), { recursive: true });
      await fs.writeFile(settingsPath, JSON.stringify(malformedSettings, null, 2));

      // 2. Copy a new hook with matcher='*' to the same event
      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*',
          type: 'command',
          command: 'new command',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      // 3. Verify the matcher field was added to the existing entry
      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));

      // Should have 1 matcher entry with 2 hooks (existing + new)
      expect(settings.hooks.PreToolUse).toHaveLength(1);
      expect(settings.hooks.PreToolUse[0].hooks).toHaveLength(2);

      // CRITICAL: Matcher field should now exist (BUG-043 fix)
      expect(settings.hooks.PreToolUse[0]).toHaveProperty('matcher');
      expect(settings.hooks.PreToolUse[0].matcher).toBe('*');

      // Both hooks should be present
      expect(settings.hooks.PreToolUse[0].hooks[0].command).toBe('existing command');
      expect(settings.hooks.PreToolUse[0].hooks[1].command).toBe('new command');
    });
  });

  describe('Default values', () => {
    test('applies default enabled=true when undefined', async () => {
      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          // enabled is undefined
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.hooks.PreToolUse[0].hooks[0].enabled).toBe(true);
    });

    test('applies default timeout=60 when undefined', async () => {
      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          enabled: true
          // timeout is undefined
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.hooks.PreToolUse[0].hooks[0].timeout).toBe(60);
    });

    test('applies default type="command" when undefined', async () => {
      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          // type is undefined
          command: 'tsc --noEmit',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.hooks.PreToolUse[0].hooks[0].type).toBe('command');
    });

    test('preserves explicit enabled=false', async () => {
      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          enabled: false, // Explicitly false
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      const settings = JSON.parse(await fs.readFile(result.mergedInto, 'utf8'));
      expect(settings.hooks.PreToolUse[0].hooks[0].enabled).toBe(false);
    });
  });

  describe('Error handling', () => {
    test('returns error when event is missing', async () => {
      const request = {
        sourceHook: {
          // event is missing
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('event is required');
    });

    test('returns error when command is missing', async () => {
      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          // command is missing
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('command is required');
    });

    test('returns error when project not found', async () => {
      discoverProjects.mockResolvedValue({
        projects: {} // Empty projects
      });

      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: 'nonexistent'
      };

      const result = await copyService.copyHook(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project not found');
    });

    test('handles malformed settings.json gracefully', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      await fs.writeFile(settingsPath, 'INVALID JSON{{{', 'utf8');

      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to read settings file');
    });

    test('cleans up temp file on JSON validation failure', async () => {
      // Mock JSON.stringify to produce invalid JSON (edge case)
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn()
        .mockReturnValueOnce('INVALID{{{') // First call (write temp file)
        .mockReturnValue(originalStringify({})); // Subsequent calls

      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);

      // Restore original
      JSON.stringify = originalStringify;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Generated invalid JSON');

      // Verify temp file was cleaned up
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const tempFile = settingsPath + '.tmp';
      await expect(fs.access(tempFile)).rejects.toThrow();
    });
  });

  describe('Atomic write safety', () => {
    test('uses temp file + rename pattern', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');

      const request = {
        sourceHook: {
          event: 'PreToolUse',
          matcher: '*.ts',
          type: 'command',
          command: 'tsc --noEmit',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);
      expect(result.success).toBe(true);

      // Temp file should not exist after successful operation
      const tempFile = settingsPath + '.tmp';
      await expect(fs.access(tempFile)).rejects.toThrow();

      // Final file should exist
      await expect(fs.access(settingsPath)).resolves.not.toThrow();
    });

    test('preserves existing settings on error', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');
      const originalSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [{ type: 'command', command: 'original', enabled: true, timeout: 60 }]
            }
          ]
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(originalSettings, null, 2), 'utf8');

      // Mock fs.rename to fail
      const originalRename = fs.rename;
      fs.rename = jest.fn().mockRejectedValue(new Error('Disk full'));

      const request = {
        sourceHook: {
          event: 'PostToolUse',
          matcher: '*',
          type: 'command',
          command: 'new-hook',
          enabled: true,
          timeout: 60
        },
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyHook(request);

      // Restore original
      fs.rename = originalRename;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update settings file');

      // Original file should still have original content
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
      expect(settings).toEqual(originalSettings);
    });
  });

  describe('Complex real-world scenarios', () => {
    test('merges multiple hooks from different sources into complex structure', async () => {
      const settingsPath = path.join(testProjectPath, '.claude', 'settings.json');

      // Start with some existing hooks
      const existingSettings = {
        mcpServers: {
          'existing-server': { command: 'node', args: ['server.js'] }
        },
        hooks: {
          PreToolUse: [
            {
              matcher: '*.ts',
              hooks: [
                { type: 'command', command: 'tsc --noEmit', enabled: true, timeout: 60 }
              ]
            }
          ]
        }
      };
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');

      // Add multiple hooks
      const hooks = [
        {
          event: 'PreToolUse',
          matcher: '*.ts',
          command: 'eslint --fix' // Same event+matcher, different command
        },
        {
          event: 'PreToolUse',
          matcher: '*.js',
          command: 'prettier --write' // Same event, different matcher
        },
        {
          event: 'PostToolUse',
          matcher: '*',
          command: 'npm test' // Different event
        },
        {
          event: 'SessionStart',
          command: 'git fetch' // No matcher support
        }
      ];

      for (const hook of hooks) {
        const result = await copyService.copyHook({
          sourceHook: {
            ...hook,
            type: 'command',
            enabled: true,
            timeout: 60
          },
          targetScope: 'project',
          targetProjectId: testProjectId
        });
        expect(result.success).toBe(true);
      }

      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));

      // Verify mcpServers preserved
      expect(settings.mcpServers).toEqual(existingSettings.mcpServers);

      // Verify PreToolUse has 2 matchers
      expect(settings.hooks.PreToolUse).toHaveLength(2);
      expect(settings.hooks.PreToolUse[0].matcher).toBe('*.ts');
      expect(settings.hooks.PreToolUse[0].hooks).toHaveLength(2); // tsc + eslint
      expect(settings.hooks.PreToolUse[1].matcher).toBe('*.js');
      expect(settings.hooks.PreToolUse[1].hooks).toHaveLength(1); // prettier

      // Verify PostToolUse added
      expect(settings.hooks.PostToolUse).toHaveLength(1);

      // Verify SessionStart added (no matcher field)
      expect(settings.hooks.SessionStart).toHaveLength(1);
      expect(settings.hooks.SessionStart[0].matcher).toBeUndefined();
    });
  });
});
