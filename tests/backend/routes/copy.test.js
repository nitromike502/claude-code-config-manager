/**
 * Integration tests for Copy API Routes
 *
 * Test Coverage:
 * - POST /api/copy/agent - Success cases, validation errors, conflicts, error mapping
 * - POST /api/copy/command - Success cases, validation errors, conflicts, error mapping
 * - POST /api/copy/hook - Success cases, validation errors, error mapping (no conflicts)
 * - POST /api/copy/mcp - Success cases, validation errors, conflicts, error mapping
 *
 * Testing Strategy:
 * - Mock copy-service methods to return standardized responses
 * - Test endpoint validation logic
 * - Verify HTTP status codes and response formats
 * - Test error code mapping (EACCES→403, ENOENT→404, etc.)
 *
 * Fixtures Used:
 * - Mock copy service responses (no file system operations)
 */

const request = require('supertest');
const app = require('../../../src/backend/server');
const copyService = require('../../../src/backend/services/copy-service');

// Mock copy service
jest.mock('../../../src/backend/services/copy-service');

describe('Copy API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/copy/agent', () => {
    describe('Success cases', () => {
      test('should copy agent successfully with valid request', async () => {
        // Mock successful copy
        copyService.copyAgent.mockResolvedValue({
          success: true,
          copiedPath: '/home/user/.claude/agents/test-agent.md'
        });

        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/source/project/.claude/agents/test-agent.md',
            targetScope: 'user',
            conflictStrategy: 'skip'
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'Agent copied successfully',
          copiedPath: '/home/user/.claude/agents/test-agent.md'
        });
        expect(copyService.copyAgent).toHaveBeenCalledWith({
          sourcePath: '/source/project/.claude/agents/test-agent.md',
          targetScope: 'user',
          targetProjectId: undefined,
          conflictStrategy: 'skip'
        });
      });

      test('should copy agent to project scope successfully', async () => {
        copyService.copyAgent.mockResolvedValue({
          success: true,
          copiedPath: '/home/user/project/.claude/agents/test-agent.md'
        });

        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/source/.claude/agents/test-agent.md',
            targetScope: 'project',
            targetProjectId: 'myproject',
            conflictStrategy: 'overwrite'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Agent copied successfully');
      });

      test('should handle skipped copy (user cancelled)', async () => {
        copyService.copyAgent.mockResolvedValue({
          skipped: true,
          message: 'Copy operation skipped by user'
        });

        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/source/agent.md',
            targetScope: 'user',
            conflictStrategy: 'skip'
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: false,
          skipped: true,
          message: 'Copy operation skipped by user'
        });
      });
    });

    describe('Validation errors (400)', () => {
      test('should return 400 for missing sourcePath', async () => {
        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('sourcePath');
      });

      test('should return 400 for invalid targetScope', async () => {
        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/source/agent.md',
            targetScope: 'invalid'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('targetScope');
      });

      test('should return 400 for missing targetProjectId when scope is project', async () => {
        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/source/agent.md',
            targetScope: 'project'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('targetProjectId');
      });

      test('should return 400 for path traversal attempt in result error', async () => {
        copyService.copyAgent.mockResolvedValue({
          error: 'Path traversal detected'
        });

        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/source/agent.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Path traversal');
      });
    });

    describe('Conflict cases (409)', () => {
      test('should return 409 for existing agent conflict', async () => {
        copyService.copyAgent.mockResolvedValue({
          conflict: {
            targetPath: '/home/user/.claude/agents/test-agent.md',
            sourceModified: '2025-11-06T10:00:00Z',
            targetModified: '2025-11-06T09:00:00Z'
          }
        });

        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/source/agent.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
          success: false,
          conflict: {
            targetPath: '/home/user/.claude/agents/test-agent.md',
            sourceModified: '2025-11-06T10:00:00Z',
            targetModified: '2025-11-06T09:00:00Z'
          }
        });
      });
    });

    describe('Error code mapping', () => {
      test('should map ENOENT to 404', async () => {
        const error = new Error('Source file not found');
        error.code = 'ENOENT';
        copyService.copyAgent.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/nonexistent/agent.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not found');
      });

      test('should map EACCES to 403', async () => {
        const error = new Error('Permission denied');
        error.code = 'EACCES';
        copyService.copyAgent.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/restricted/agent.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      test('should map ENOSPC to 507', async () => {
        const error = new Error('No space left on device');
        error.code = 'ENOSPC';
        copyService.copyAgent.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/source/agent.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(507);
        expect(response.body.success).toBe(false);
      });

      test('should map unknown errors to 500', async () => {
        copyService.copyAgent.mockRejectedValue(new Error('Unknown error'));

        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/source/agent.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });

      test('should map ENOENT in error message to 404', async () => {
        copyService.copyAgent.mockResolvedValue({
          error: 'File not found: ENOENT'
        });

        const response = await request(app)
          .post('/api/copy/agent')
          .send({
            sourcePath: '/source/agent.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('POST /api/copy/command', () => {
    describe('Success cases', () => {
      test('should copy command successfully with valid request', async () => {
        copyService.copyCommand.mockResolvedValue({
          success: true,
          copiedPath: '/home/user/.claude/commands/test-command.md'
        });

        const response = await request(app)
          .post('/api/copy/command')
          .send({
            sourcePath: '/source/.claude/commands/test-command.md',
            targetScope: 'user',
            conflictStrategy: 'skip'
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'Command copied successfully',
          copiedPath: '/home/user/.claude/commands/test-command.md'
        });
      });

      test('should copy nested command successfully', async () => {
        copyService.copyCommand.mockResolvedValue({
          success: true,
          copiedPath: '/home/user/.claude/commands/utils/helper-command.md'
        });

        const response = await request(app)
          .post('/api/copy/command')
          .send({
            sourcePath: '/source/commands/utils/helper-command.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle skipped command copy', async () => {
        copyService.copyCommand.mockResolvedValue({
          skipped: true,
          message: 'Command copy skipped'
        });

        const response = await request(app)
          .post('/api/copy/command')
          .send({
            sourcePath: '/source/command.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(false);
        expect(response.body.skipped).toBe(true);
      });
    });

    describe('Validation errors (400)', () => {
      test('should return 400 for missing sourcePath', async () => {
        const response = await request(app)
          .post('/api/copy/command')
          .send({
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should return 400 for invalid targetScope', async () => {
        const response = await request(app)
          .post('/api/copy/command')
          .send({
            sourcePath: '/source/command.md',
            targetScope: 'global'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Conflict cases (409)', () => {
      test('should return 409 for existing command conflict', async () => {
        copyService.copyCommand.mockResolvedValue({
          conflict: {
            targetPath: '/home/user/.claude/commands/test-command.md',
            sourceModified: '2025-11-06T10:00:00Z',
            targetModified: '2025-11-06T09:00:00Z'
          }
        });

        const response = await request(app)
          .post('/api/copy/command')
          .send({
            sourcePath: '/source/command.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.conflict).toBeDefined();
      });
    });

    describe('Error code mapping', () => {
      test('should map ENOENT to 404', async () => {
        const error = new Error('Command file not found');
        error.code = 'ENOENT';
        copyService.copyCommand.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/command')
          .send({
            sourcePath: '/nonexistent/command.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });

      test('should map EACCES to 403', async () => {
        const error = new Error('Permission denied');
        error.code = 'EACCES';
        copyService.copyCommand.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/command')
          .send({
            sourcePath: '/restricted/command.md',
            targetScope: 'user'
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      test('should map path traversal to 400', async () => {
        copyService.copyCommand.mockResolvedValue({
          success: false,
          error: 'Path traversal detected'
        });

        const response = await request(app)
          .post('/api/copy/command')
          .send({
            sourcePath: '/source/../../../etc/passwd',
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('POST /api/copy/hook', () => {
    describe('Success cases', () => {
      test('should copy hook successfully with valid request', async () => {
        copyService.copyHook.mockResolvedValue({
          success: true,
          mergedInto: '/home/user/.claude/settings.json',
          hook: {
            event: 'PreToolUse',
            matcher: '*.ts',
            command: 'tsc --noEmit'
          }
        });

        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: {
              event: 'PreToolUse',
              matcher: '*.ts',
              type: 'command',
              command: 'tsc --noEmit',
              enabled: true,
              timeout: 60
            },
            targetScope: 'user'
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'Hook copied successfully',
          copiedPath: '/home/user/.claude/settings.json',
          hook: {
            event: 'PreToolUse',
            matcher: '*.ts',
            command: 'tsc --noEmit'
          }
        });
      });

      test('should copy hook to project scope successfully', async () => {
        copyService.copyHook.mockResolvedValue({
          success: true,
          mergedInto: '/home/user/project/.claude/settings.json',
          hook: {
            event: 'PostToolUse',
            command: 'npm test'
          }
        });

        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: {
              event: 'PostToolUse',
              command: 'npm test'
            },
            targetScope: 'project',
            targetProjectId: 'myproject'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.hook).toBeDefined();
      });
    });

    describe('Validation errors (400)', () => {
      test('should return 400 for missing sourceHook', async () => {
        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('sourceHook');
      });

      test('should return 400 for sourceHook not being an object', async () => {
        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: 'invalid',
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('sourceHook');
      });

      test('should return 400 for missing sourceHook.event', async () => {
        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: {
              command: 'npm test'
            },
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('event');
      });

      test('should return 400 for missing sourceHook.command', async () => {
        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: {
              event: 'PreToolUse'
            },
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('command');
      });

      test('should return 400 for invalid targetScope', async () => {
        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: {
              event: 'PreToolUse',
              command: 'echo test'
            },
            targetScope: 'invalid'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('targetScope');
      });

      test('should return 400 for missing targetProjectId when scope is project', async () => {
        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: {
              event: 'PreToolUse',
              command: 'echo test'
            },
            targetScope: 'project'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('targetProjectId');
      });

      test('should return 400 for empty targetProjectId', async () => {
        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: {
              event: 'PreToolUse',
              command: 'echo test'
            },
            targetScope: 'project',
            targetProjectId: '   '
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('empty');
      });
    });

    describe('Error code mapping', () => {
      test('should map ENOENT to 404', async () => {
        const error = new Error('Settings file not found');
        error.code = 'ENOENT';
        copyService.copyHook.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: {
              event: 'PreToolUse',
              command: 'echo test'
            },
            targetScope: 'user'
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });

      test('should map EACCES to 403', async () => {
        const error = new Error('Permission denied');
        error.code = 'EACCES';
        copyService.copyHook.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: {
              event: 'PreToolUse',
              command: 'echo test'
            },
            targetScope: 'user'
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      test('should map ENOSPC to 507', async () => {
        const error = new Error('No space left on device');
        error.code = 'ENOSPC';
        copyService.copyHook.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/hook')
          .send({
            sourceHook: {
              event: 'PreToolUse',
              command: 'echo test'
            },
            targetScope: 'user'
          });

        expect(response.status).toBe(507);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('POST /api/copy/mcp', () => {
    describe('Success cases', () => {
      test('should copy MCP server successfully with valid request', async () => {
        copyService.copyMcp.mockResolvedValue({
          success: true,
          mergedInto: '/home/user/.claude/settings.json',
          serverName: 'github'
        });

        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: {
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-github']
            },
            targetScope: 'user',
            conflictStrategy: 'skip'
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'MCP server copied successfully',
          copiedPath: '/home/user/.claude/settings.json',
          serverName: 'github'
        });
      });

      test('should copy MCP server to project scope successfully', async () => {
        copyService.copyMcp.mockResolvedValue({
          success: true,
          mergedInto: '/home/user/project/.mcp.json',
          serverName: 'filesystem'
        });

        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'filesystem',
            sourceMcpConfig: {
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-filesystem']
            },
            targetScope: 'project',
            targetProjectId: 'myproject'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.serverName).toBe('filesystem');
      });

      test('should handle skipped MCP copy', async () => {
        copyService.copyMcp.mockResolvedValue({
          skipped: true,
          message: 'MCP server already exists'
        });

        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: { command: 'test' },
            targetScope: 'user'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(false);
        expect(response.body.skipped).toBe(true);
      });
    });

    describe('Validation errors (400)', () => {
      test('should return 400 for missing sourceServerName', async () => {
        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceMcpConfig: { command: 'test' },
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('sourceServerName');
      });

      test('should return 400 for missing sourceMcpConfig', async () => {
        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('sourceMcpConfig');
      });

      test('should return 400 for invalid targetScope', async () => {
        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: { command: 'test' },
            targetScope: 'global'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('targetScope');
      });

      test('should return 400 for missing targetProjectId when scope is project', async () => {
        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: { command: 'test' },
            targetScope: 'project'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('targetProjectId');
      });

      test('should return 400 for invalid conflictStrategy', async () => {
        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: { command: 'test' },
            targetScope: 'user',
            conflictStrategy: 'rename'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('conflictStrategy');
      });
    });

    describe('Conflict cases (409)', () => {
      test('should return 409 for existing MCP server conflict', async () => {
        copyService.copyMcp.mockResolvedValue({
          conflict: {
            serverName: 'github',
            targetPath: '/home/user/.claude/settings.json',
            existingConfig: {
              command: 'old-command'
            }
          }
        });

        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: { command: 'new-command' },
            targetScope: 'user'
          });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.conflict).toBeDefined();
        expect(response.body.conflict.serverName).toBe('github');
      });
    });

    describe('Error code mapping', () => {
      test('should map ENOENT to 404', async () => {
        const error = new Error('Config file not found');
        error.code = 'ENOENT';
        copyService.copyMcp.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: { command: 'test' },
            targetScope: 'user'
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });

      test('should map EACCES to 403', async () => {
        const error = new Error('Permission denied');
        error.code = 'EACCES';
        copyService.copyMcp.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: { command: 'test' },
            targetScope: 'user'
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      test('should map ENOSPC to 507', async () => {
        const error = new Error('No space left on device');
        error.code = 'ENOSPC';
        copyService.copyMcp.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: { command: 'test' },
            targetScope: 'user'
          });

        expect(response.status).toBe(507);
        expect(response.body.success).toBe(false);
      });

      test('should map path traversal to 400', async () => {
        const error = new Error('Path traversal detected');
        copyService.copyMcp.mockResolvedValue({
          error: 'Path traversal detected'
        });

        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: { command: 'test' },
            targetScope: 'user'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should map unknown errors to 500', async () => {
        copyService.copyMcp.mockRejectedValue(new Error('Unexpected error'));

        const response = await request(app)
          .post('/api/copy/mcp')
          .send({
            sourceServerName: 'github',
            sourceMcpConfig: { command: 'test' },
            targetScope: 'user'
          });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
