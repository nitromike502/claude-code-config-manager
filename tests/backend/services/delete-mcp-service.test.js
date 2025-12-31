/**
 * Unit tests for deleteMcpService
 * Tests MCP server deletion from project and user-level configurations
 *
 * Test Coverage:
 * - deleteProjectMcpServer() - Delete from .mcp.json, settings.json, settings.local.json
 * - deleteUserMcpServer() - Delete from ~/.claude.json
 * - Reference checking in hooks and permissions
 * - Edge cases (special characters, multiple servers, missing files)
 * - Error handling (not found, file system errors)
 *
 * MCP Server Storage Locations:
 * - Project: .mcp.json, .claude/settings.json, .claude/settings.local.json
 * - User: ~/.claude.json (root mcpServers key)
 *
 * Note: Internal functions findMcpServerReferences and findAllMcpServerReferences
 * are not exported, so they are tested indirectly through deleteProjectMcpServer
 * and deleteUserMcpServer which call them.
 */

const fs = require('fs').promises;
const path = require('path');
const {
  deleteProjectMcpServer,
  deleteUserMcpServer
} = require('../../../src/backend/services/deleteMcpService');

describe('deleteMcpService', () => {
  let accessSpy, readFileSpy, writeFileSpy, renameSpy;

  beforeEach(() => {
    accessSpy = jest.spyOn(fs, 'access');
    readFileSpy = jest.spyOn(fs, 'readFile');
    writeFileSpy = jest.spyOn(fs, 'writeFile');
    renameSpy = jest.spyOn(fs, 'rename');
  });

  afterEach(() => {
    accessSpy.mockRestore();
    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
    renameSpy.mockRestore();
  });

  describe('deleteProjectMcpServer()', () => {
    const projectPath = '/home/user/project';
    const mcpJsonPath = '/home/user/project/.mcp.json';
    const settingsJsonPath = '/home/user/project/.claude/settings.json';
    const settingsLocalJsonPath = '/home/user/project/.claude/settings.local.json';

    describe('Success Cases - Delete from .mcp.json', () => {
      test('should delete MCP server from .mcp.json', async () => {
        const mcpConfig = {
          mcpServers: {
            'test-server': {
              command: 'node',
              args: ['server.js']
            },
            'other-server': {
              command: 'python',
              args: ['server.py']
            }
          }
        };

        // .mcp.json exists with server
        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteProjectMcpServer(projectPath, 'test-server');

        expect(result.success).toBe(true);
        expect(result.message).toBe('MCP server "test-server" deleted successfully');
        expect(result.filePath).toBe(mcpJsonPath);

        // Verify server was deleted but other-server remains
        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenConfig = JSON.parse(writtenContent);
        expect(writtenConfig.mcpServers['test-server']).toBeUndefined();
        expect(writtenConfig.mcpServers['other-server']).toBeDefined();
      });

      test('should remove empty mcpServers object after deleting last server', async () => {
        const mcpConfig = {
          mcpServers: {
            'only-server': {
              command: 'node',
              args: ['server.js']
            }
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteProjectMcpServer(projectPath, 'only-server');

        expect(result.success).toBe(true);

        // Verify mcpServers object was removed
        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenConfig = JSON.parse(writtenContent);
        expect(writtenConfig.mcpServers).toBeUndefined();
      });

      test('should use atomic write (temp file + rename)', async () => {
        const mcpConfig = {
          mcpServers: {
            'test-server': { command: 'node' }
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        await deleteProjectMcpServer(projectPath, 'test-server');

        // Verify atomic write pattern
        expect(writeFileSpy).toHaveBeenCalledWith(
          `${mcpJsonPath}.tmp`,
          expect.any(String),
          'utf8'
        );
        expect(renameSpy).toHaveBeenCalledWith(`${mcpJsonPath}.tmp`, mcpJsonPath);
      });

      test('should pretty-print JSON output', async () => {
        const mcpConfig = {
          mcpServers: {
            'test-server': { command: 'node', args: ['server.js'] },
            'keep-server': { command: 'python', args: ['keep.py'] }
          },
          otherProperty: 'value'
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        await deleteProjectMcpServer(projectPath, 'test-server');

        const writtenContent = writeFileSpy.mock.calls[0][1];
        expect(writtenContent).toContain('\n');
        expect(writtenContent).toContain('  '); // 2-space indentation
        // Verify keep-server is still there
        expect(writtenContent).toContain('keep-server');
      });
    });

    describe('Success Cases - Delete from .claude/settings.json', () => {
      test('should delete MCP server from settings.json when not in .mcp.json', async () => {
        const settingsConfig = {
          mcpServers: {
            'test-server': {
              command: 'node',
              args: ['server.js']
            },
            'other-server': {
              command: 'python'
            }
          }
        };

        // .mcp.json doesn't exist, settings.json exists
        accessSpy.mockImplementation((filePath) => {
          if (filePath === settingsJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === settingsJsonPath) return Promise.resolve(JSON.stringify(settingsConfig));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteProjectMcpServer(projectPath, 'test-server');

        expect(result.success).toBe(true);
        expect(result.filePath).toBe(settingsJsonPath);

        // Verify deletion from settings.json
        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenConfig = JSON.parse(writtenContent);
        expect(writtenConfig.mcpServers['test-server']).toBeUndefined();
        expect(writtenConfig.mcpServers['other-server']).toBeDefined();
      });
    });

    describe('Success Cases - Delete from .claude/settings.local.json', () => {
      test('should delete MCP server from settings.local.json as fallback', async () => {
        const localSettingsConfig = {
          mcpServers: {
            'local-server': {
              command: 'node',
              args: ['local.js']
            }
          }
        };

        // Neither .mcp.json nor settings.json exist, settings.local.json exists
        accessSpy.mockImplementation((filePath) => {
          if (filePath === settingsLocalJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === settingsLocalJsonPath) return Promise.resolve(JSON.stringify(localSettingsConfig));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteProjectMcpServer(projectPath, 'local-server');

        expect(result.success).toBe(true);
        expect(result.filePath).toBe(settingsLocalJsonPath);
      });
    });

    describe('Reference Detection', () => {
      test('should detect MCP server references in hooks', async () => {
        const mcpConfig = {
          mcpServers: {
            'test-server': { command: 'node' }
          }
        };

        const settingsWithRefs = {
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [
                  {
                    type: 'command',
                    command: 'mcp use test-server' // References test-server
                  }
                ]
              }
            ]
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          if (filePath === settingsJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.resolve(JSON.stringify(settingsWithRefs));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteProjectMcpServer(projectPath, 'test-server');

        expect(result.success).toBe(true);
        expect(result.references).toBeDefined();
        expect(result.references.length).toBeGreaterThan(0);
        expect(result.references[0]).toContain('hooks.PreToolUse');
      });

      test('should detect MCP server references in permissions.allow', async () => {
        const mcpConfig = {
          mcpServers: {
            'my-server': { command: 'node' }
          }
        };

        const settingsWithPermissions = {
          permissions: {
            allow: [
              'mcp__my-server__tool1',
              'mcp__my-server__tool2',
              'mcp__my-server'
            ]
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          if (filePath === settingsJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.resolve(JSON.stringify(settingsWithPermissions));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteProjectMcpServer(projectPath, 'my-server');

        expect(result.success).toBe(true);
        expect(result.references).toBeDefined();
        expect(result.references.length).toBe(3); // All 3 permissions reference the server
      });

      test('should detect MCP server references in permissions.deny', async () => {
        const mcpConfig = {
          mcpServers: {
            'blocked-server': { command: 'node' }
          }
        };

        const settingsWithPermissions = {
          permissions: {
            deny: [
              'mcp__blocked-server__dangerous-tool'
            ]
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          if (filePath === settingsJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.resolve(JSON.stringify(settingsWithPermissions));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteProjectMcpServer(projectPath, 'blocked-server');

        expect(result.success).toBe(true);
        expect(result.references).toBeDefined();
        expect(result.references[0]).toContain('permissions.deny');
      });

      test('should not include references when none found', async () => {
        const mcpConfig = {
          mcpServers: {
            'clean-server': { command: 'node' }
          }
        };

        const settingsNoRefs = {
          permissions: {
            allow: ['bash__ls']
          },
          hooks: {}
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          if (filePath === settingsJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.resolve(JSON.stringify(settingsNoRefs));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteProjectMcpServer(projectPath, 'clean-server');

        expect(result.success).toBe(true);
        expect(result.references).toBeUndefined();
      });

      test('should handle missing settings files gracefully when checking references', async () => {
        const mcpConfig = {
          mcpServers: {
            'test-server': { command: 'node' }
          }
        };

        // .mcp.json exists, but settings files don't exist (no references to check)
        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteProjectMcpServer(projectPath, 'test-server');

        expect(result.success).toBe(true);
        expect(result.references).toBeUndefined(); // No references found
      });
    });

    describe('Edge Cases', () => {
      test('should handle server name with special characters', async () => {
        const mcpConfig = {
          mcpServers: {
            '@scope/my-server': { command: 'node' },
            'other-server': { command: 'python' }
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteProjectMcpServer(projectPath, '@scope/my-server');

        expect(result.success).toBe(true);

        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenConfig = JSON.parse(writtenContent);
        expect(writtenConfig.mcpServers['@scope/my-server']).toBeUndefined();
        expect(writtenConfig.mcpServers['other-server']).toBeDefined();
      });

      test('should preserve other config properties when deleting server', async () => {
        const mcpConfig = {
          mcpServers: {
            'test-server': { command: 'node' }
          },
          otherProperty: 'should remain',
          nested: {
            value: 123
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        await deleteProjectMcpServer(projectPath, 'test-server');

        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenConfig = JSON.parse(writtenContent);
        expect(writtenConfig.otherProperty).toBe('should remain');
        expect(writtenConfig.nested).toEqual({ value: 123 });
      });
    });

    describe('Error Handling', () => {
      test('should throw error when server not found in any location', async () => {
        // All files either don't exist or don't contain the server
        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify({ mcpServers: {} }));
          if (filePath === settingsJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        await expect(deleteProjectMcpServer(projectPath, 'nonexistent-server'))
          .rejects.toThrow('MCP server not found: nonexistent-server');
      });

      test('should throw error when all config files are missing', async () => {
        // All files don't exist
        accessSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        readFileSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

        await expect(deleteProjectMcpServer(projectPath, 'test-server'))
          .rejects.toThrow('MCP server not found: test-server');
      });

      test('should throw error on JSON parse failure', async () => {
        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve('{ invalid json }');
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        await expect(deleteProjectMcpServer(projectPath, 'test-server'))
          .rejects.toThrow(); // JSON parse error
      });

      test('should propagate file system errors (not ENOENT)', async () => {
        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('EACCES'), { code: 'EACCES' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) {
            return Promise.reject(Object.assign(new Error('Permission denied'), { code: 'EACCES' }));
          }
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        await expect(deleteProjectMcpServer(projectPath, 'test-server'))
          .rejects.toThrow('Permission denied');
      });

      test('should handle write errors gracefully', async () => {
        const mcpConfig = {
          mcpServers: {
            'test-server': { command: 'node' }
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockRejectedValue(new Error('Disk full'));

        await expect(deleteProjectMcpServer(projectPath, 'test-server'))
          .rejects.toThrow('Disk full');
      });
    });

    describe('Performance', () => {
      test('should complete deletion in <10ms', async () => {
        const mcpConfig = {
          mcpServers: {
            'test-server': { command: 'node' }
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === mcpJsonPath) return Promise.resolve(JSON.stringify(mcpConfig));
          if (filePath === settingsJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          if (filePath === settingsLocalJsonPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const start = Date.now();
        await deleteProjectMcpServer(projectPath, 'test-server');
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(10);
      });
    });
  });

  describe('deleteUserMcpServer()', () => {
    const userHome = '/home/user';
    const claudeJsonPath = '/home/user/.claude.json';
    const userSettingsPath = '/home/user/.claude/settings.json';

    describe('Success Cases', () => {
      test('should delete MCP server from ~/.claude.json', async () => {
        const claudeConfig = {
          mcpServers: {
            'user-server': {
              command: 'node',
              args: ['server.js']
            },
            'other-server': {
              command: 'python'
            }
          },
          projects: {}
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve(JSON.stringify(claudeConfig));
          if (filePath === userSettingsPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteUserMcpServer(userHome, 'user-server');

        expect(result.success).toBe(true);
        expect(result.message).toBe('MCP server "user-server" deleted successfully');

        // Verify server was deleted but other-server remains
        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenConfig = JSON.parse(writtenContent);
        expect(writtenConfig.mcpServers['user-server']).toBeUndefined();
        expect(writtenConfig.mcpServers['other-server']).toBeDefined();
        expect(writtenConfig.projects).toEqual({}); // Other properties preserved
      });

      test('should remove empty mcpServers object after deleting last server', async () => {
        const claudeConfig = {
          mcpServers: {
            'only-server': { command: 'node' }
          },
          projects: {}
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve(JSON.stringify(claudeConfig));
          if (filePath === userSettingsPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        await deleteUserMcpServer(userHome, 'only-server');

        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenConfig = JSON.parse(writtenContent);
        expect(writtenConfig.mcpServers).toBeUndefined();
      });

      test('should use atomic write (temp file + rename)', async () => {
        const claudeConfig = {
          mcpServers: {
            'test-server': { command: 'node' }
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve(JSON.stringify(claudeConfig));
          if (filePath === userSettingsPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        await deleteUserMcpServer(userHome, 'test-server');

        // Verify atomic write pattern
        expect(writeFileSpy).toHaveBeenCalledWith(
          `${claudeJsonPath}.tmp`,
          expect.any(String),
          'utf8'
        );
        expect(renameSpy).toHaveBeenCalledWith(`${claudeJsonPath}.tmp`, claudeJsonPath);
      });
    });

    describe('Reference Detection', () => {
      test('should detect references in user settings hooks', async () => {
        const claudeConfig = {
          mcpServers: {
            'my-server': { command: 'node' }
          }
        };

        const userSettings = {
          hooks: {
            SessionStart: [
              {
                hooks: [
                  {
                    type: 'command',
                    command: 'use my-server tools'
                  }
                ]
              }
            ]
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve();
          if (filePath === userSettingsPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve(JSON.stringify(claudeConfig));
          if (filePath === userSettingsPath) return Promise.resolve(JSON.stringify(userSettings));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteUserMcpServer(userHome, 'my-server');

        expect(result.success).toBe(true);
        expect(result.references).toBeDefined();
        expect(result.references.length).toBeGreaterThan(0);
      });

      test('should detect references in user permissions', async () => {
        const claudeConfig = {
          mcpServers: {
            'secure-server': { command: 'node' }
          }
        };

        const userSettings = {
          permissions: {
            allow: ['mcp__secure-server__read'],
            deny: ['mcp__secure-server__write']
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve();
          if (filePath === userSettingsPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve(JSON.stringify(claudeConfig));
          if (filePath === userSettingsPath) return Promise.resolve(JSON.stringify(userSettings));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteUserMcpServer(userHome, 'secure-server');

        expect(result.success).toBe(true);
        expect(result.references).toBeDefined();
        expect(result.references.length).toBe(2); // One in allow, one in deny
      });
    });

    describe('Error Handling', () => {
      test('should throw error when .claude.json does not exist', async () => {
        accessSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

        await expect(deleteUserMcpServer(userHome, 'test-server'))
          .rejects.toThrow('MCP server not found: test-server (.claude.json does not exist)');
      });

      test('should throw error when server not found in .claude.json', async () => {
        const claudeConfig = {
          mcpServers: {
            'other-server': { command: 'node' }
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve(JSON.stringify(claudeConfig));
          if (filePath === userSettingsPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        await expect(deleteUserMcpServer(userHome, 'nonexistent-server'))
          .rejects.toThrow('MCP server not found: nonexistent-server');
      });

      test('should throw error when mcpServers object is missing', async () => {
        const claudeConfig = {
          projects: {} // No mcpServers
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve(JSON.stringify(claudeConfig));
          if (filePath === userSettingsPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        await expect(deleteUserMcpServer(userHome, 'test-server'))
          .rejects.toThrow('MCP server not found: test-server');
      });

      test('should propagate file system errors', async () => {
        accessSpy.mockRejectedValue(Object.assign(new Error('Permission denied'), { code: 'EACCES' }));

        await expect(deleteUserMcpServer(userHome, 'test-server'))
          .rejects.toThrow('Permission denied');
      });

      test('should handle JSON parse errors', async () => {
        accessSpy.mockResolvedValue();
        readFileSpy.mockResolvedValue('{ invalid json }');

        await expect(deleteUserMcpServer(userHome, 'test-server'))
          .rejects.toThrow(); // JSON parse error
      });
    });

    describe('Edge Cases', () => {
      test('should handle server name with special characters', async () => {
        const claudeConfig = {
          mcpServers: {
            '@org/special-server': { command: 'node' }
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve(JSON.stringify(claudeConfig));
          if (filePath === userSettingsPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const result = await deleteUserMcpServer(userHome, '@org/special-server');

        expect(result.success).toBe(true);
      });

      test('should preserve other properties in .claude.json', async () => {
        const claudeConfig = {
          mcpServers: {
            'test-server': { command: 'node' }
          },
          projects: {
            '/home/user/project': { name: 'Project' }
          },
          customProperty: 'should remain'
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve(JSON.stringify(claudeConfig));
          if (filePath === userSettingsPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        await deleteUserMcpServer(userHome, 'test-server');

        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenConfig = JSON.parse(writtenContent);
        expect(writtenConfig.projects).toEqual({ '/home/user/project': { name: 'Project' } });
        expect(writtenConfig.customProperty).toBe('should remain');
      });
    });

    describe('Performance', () => {
      test('should complete deletion in <10ms', async () => {
        const claudeConfig = {
          mcpServers: {
            'test-server': { command: 'node' }
          }
        };

        accessSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve();
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath === claudeJsonPath) return Promise.resolve(JSON.stringify(claudeConfig));
          if (filePath === userSettingsPath) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
          return Promise.reject(new Error(`Unexpected read: ${filePath}`));
        });

        writeFileSpy.mockResolvedValue();
        renameSpy.mockResolvedValue();

        const start = Date.now();
        await deleteUserMcpServer(userHome, 'test-server');
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(10);
      });
    });
  });
});
