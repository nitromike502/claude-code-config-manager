/**
 * Unit tests for hookParser
 * Tests parsing of hooks from settings.json files
 * Updated to test all 4 handler types and new common fields
 */

const hookParser = require('../../../src/backend/parsers/hookParser');
const path = require('path');
const fs = require('fs').promises;

describe('hookParser', () => {
  const fixturesPath = path.join(__dirname, '../../fixtures/samples/settings');

  describe('parseHookEntry()', () => {
    it('should parse a basic command hook', () => {
      const hook = { type: 'command', command: 'echo test' };
      const result = hookParser.parseHookEntry(hook, 'PreToolUse', 'Bash', 'project', '/path/settings.json');

      expect(result.event).toBe('PreToolUse');
      expect(result.matcher).toBe('Bash');
      expect(result.type).toBe('command');
      expect(result.command).toBe('echo test');
      expect(result.enabled).toBe(true);
      expect(result.scope).toBe('project');
      expect(result.filePath).toBe('/path/settings.json');
    });

    it('should parse an http hook with type-specific fields', () => {
      const hook = {
        type: 'http',
        url: 'https://example.com/hook',
        headers: { 'Authorization': 'Bearer token' },
        allowedEnvVars: ['API_KEY']
      };
      const result = hookParser.parseHookEntry(hook, 'PostToolUse', 'Bash', 'project', '/path/settings.json');

      expect(result.type).toBe('http');
      expect(result.url).toBe('https://example.com/hook');
      expect(result.headers).toEqual({ 'Authorization': 'Bearer token' });
      expect(result.allowedEnvVars).toEqual(['API_KEY']);
    });

    it('should parse a prompt hook with type-specific fields', () => {
      const hook = {
        type: 'prompt',
        prompt: 'Review this code for security issues',
        model: 'claude-sonnet-4-6'
      };
      const result = hookParser.parseHookEntry(hook, 'Stop', '*', 'user', '/path/settings.json');

      expect(result.type).toBe('prompt');
      expect(result.prompt).toBe('Review this code for security issues');
      expect(result.model).toBe('claude-sonnet-4-6');
    });

    it('should parse an agent hook with type-specific fields', () => {
      const hook = {
        type: 'agent',
        prompt: 'Analyze the changes',
        model: 'claude-opus-4-6'
      };
      const result = hookParser.parseHookEntry(hook, 'UserPromptSubmit', '*', 'project', '/path/settings.json');

      expect(result.type).toBe('agent');
      expect(result.prompt).toBe('Analyze the changes');
      expect(result.model).toBe('claude-opus-4-6');
    });

    it('should parse common new fields', () => {
      const hook = {
        command: 'echo test',
        if: 'git diff --cached',
        statusMessage: 'Running checks...',
        once: true,
        async: false,
        shell: 'bash',
        timeout: 5000
      };
      const result = hookParser.parseHookEntry(hook, 'PreToolUse', 'Bash', 'project', '/path/settings.json');

      expect(result.if).toBe('git diff --cached');
      expect(result.statusMessage).toBe('Running checks...');
      expect(result.once).toBe(true);
      expect(result.async).toBe(false);
      expect(result.shell).toBe('bash');
      expect(result.timeout).toBe(5000);
    });

    it('should pass through unknown fields', () => {
      const hook = {
        command: 'echo test',
        customField: 'custom-value',
        anotherField: 42
      };
      const result = hookParser.parseHookEntry(hook, 'Stop', '*', 'project', '/path/settings.json');

      expect(result.customField).toBe('custom-value');
      expect(result.anotherField).toBe(42);
    });

    it('should default type to command when not specified', () => {
      const hook = { command: 'echo test' };
      const result = hookParser.parseHookEntry(hook, 'Stop', '*', 'project', '/path/settings.json');

      expect(result.type).toBe('command');
    });

    it('should default enabled to true when not specified', () => {
      const hook = { command: 'echo test' };
      const result = hookParser.parseHookEntry(hook, 'Stop', '*', 'project', '/path/settings.json');

      expect(result.enabled).toBe(true);
    });

    it('should respect enabled: false', () => {
      const hook = { command: 'echo test', enabled: false };
      const result = hookParser.parseHookEntry(hook, 'Stop', '*', 'project', '/path/settings.json');

      expect(result.enabled).toBe(false);
    });
  });

  describe('Valid Hooks Parsing (Task 3.4)', () => {
    test('should parse hooks from valid settings.json with complete structure', async () => {
      const filePath = path.join(fixturesPath, 'valid-complete.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Verify hook structure
      result.forEach(hook => {
        expect(hook).toHaveProperty('event');
        expect(hook).toHaveProperty('matcher');
        expect(hook).toHaveProperty('type');
        expect(hook).toHaveProperty('command');
        expect(hook).toHaveProperty('enabled');
        expect(hook).toHaveProperty('scope');
        expect(hook).toHaveProperty('filePath');
        expect(hook.scope).toBe('project');
        expect(hook.filePath).toBe(filePath);
      });
    });

    test('should parse hooks with all optional fields present', async () => {
      const filePath = path.join(fixturesPath, 'valid-hooks.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const hook = result[0];
      expect(hook.event).toBeDefined();
      expect(hook.matcher).toBeDefined();
      expect(hook.type).toBe('command');
      expect(hook.command).toBeDefined();
      expect(hook.enabled).toBe(true);
      expect(hook.scope).toBe('project');
    });

    test('should parse hooks with minimal fields (defaults)', async () => {
      const filePath = path.join(fixturesPath, 'valid-hooks.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);

      result.forEach(hook => {
        expect(hook.type).toBe('command');
        expect(hook.enabled).toBe(true);
      });
    });

    test('should handle missing hooks section (return empty array)', async () => {
      const filePath = path.join(fixturesPath, 'valid-minimal.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should handle various event types', async () => {
      const filePath = path.join(fixturesPath, 'valid-multiple-events.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const eventTypes = [...new Set(result.map(h => h.event))];
      expect(eventTypes.length).toBeGreaterThan(1);
      expect(eventTypes).toContain('pre-commit');
      expect(eventTypes).toContain('post-merge');
    });

    test('should handle various matcher patterns', async () => {
      const filePath = path.join(fixturesPath, 'valid-hooks.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);

      const matchers = result.map(h => h.matcher);
      expect(matchers.some(m => m === '*.ts')).toBe(true);
    });

    test('should handle multiple hooks per matcher', async () => {
      const filePath = path.join(fixturesPath, 'valid-multiple-hooks-per-matcher.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);

      const events = [...new Set(result.map(h => h.event))];
      const matchers = [...new Set(result.map(h => h.matcher))];
      expect(events.length).toBe(1);
      expect(matchers.length).toBe(1);

      const commands = result.map(h => h.command);
      expect(commands).toContain('tsc --noEmit');
      expect(commands).toContain('eslint --fix');
      expect(commands).toContain('prettier --write');
    });

    test('should validate hook structure (event, matcher, command)', async () => {
      const filePath = path.join(fixturesPath, 'valid-hooks.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);

      result.forEach(hook => {
        expect(typeof hook.event).toBe('string');
        expect(typeof hook.matcher).toBe('string');
        expect(typeof hook.command).toBe('string');
        expect(typeof hook.type).toBe('string');
        expect(typeof hook.enabled).toBe('boolean');
      });
    });

    test('should default matcher to "*" if not provided', async () => {
      const filePath = path.join(fixturesPath, 'valid-complete.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      result.forEach(hook => {
        expect(hook.matcher).toBeDefined();
        expect(typeof hook.matcher).toBe('string');
      });
    });

    test('should respect scope parameter (project, project-local, user)', async () => {
      const filePath = path.join(fixturesPath, 'valid-hooks.json');

      const projectResult = await hookParser.parseHooksFromFile(filePath, 'project');
      expect(projectResult[0].scope).toBe('project');

      const localResult = await hookParser.parseHooksFromFile(filePath, 'project-local');
      expect(localResult[0].scope).toBe('project-local');

      const userResult = await hookParser.parseHooksFromFile(filePath, 'user');
      expect(userResult[0].scope).toBe('user');
    });

    test('should handle enabled field correctly (default to true)', async () => {
      const filePath = path.join(fixturesPath, 'valid-hooks.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);

      result.forEach(hook => {
        expect(hook).toHaveProperty('enabled');
        expect(typeof hook.enabled).toBe('boolean');
      });
    });
  });

  describe('Multi-type hook parsing', () => {
    test('should parse settings with mixed handler types', async () => {
      const tempPath = path.join(fixturesPath, 'temp-multi-type-hooks.json');
      await fs.writeFile(tempPath, JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                { type: 'command', command: 'echo pre-check' },
                { type: 'http', url: 'https://api.example.com/hook', headers: { 'X-Key': 'val' } },
                { type: 'prompt', prompt: 'Verify this tool use' }
              ]
            }
          ],
          Stop: [
            {
              matcher: '*',
              hooks: [
                { type: 'agent', prompt: 'Summarize session', model: 'claude-sonnet-4-6' }
              ]
            }
          ]
        }
      }));

      const result = await hookParser.parseHooksFromFile(tempPath, 'project');

      expect(result).toHaveLength(4);

      const commandHook = result.find(h => h.type === 'command');
      expect(commandHook.command).toBe('echo pre-check');

      const httpHook = result.find(h => h.type === 'http');
      expect(httpHook.url).toBe('https://api.example.com/hook');
      expect(httpHook.headers).toEqual({ 'X-Key': 'val' });

      const promptHook = result.find(h => h.type === 'prompt');
      expect(promptHook.prompt).toBe('Verify this tool use');

      const agentHook = result.find(h => h.type === 'agent');
      expect(agentHook.prompt).toBe('Summarize session');
      expect(agentHook.model).toBe('claude-sonnet-4-6');

      await fs.unlink(tempPath);
    });

    test('should parse hooks with common new fields', async () => {
      const tempPath = path.join(fixturesPath, 'temp-common-fields-hooks.json');
      await fs.writeFile(tempPath, JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                {
                  command: 'echo check',
                  if: 'git diff --cached --name-only',
                  statusMessage: 'Running pre-check...',
                  once: true,
                  async: true,
                  shell: 'bash',
                  timeout: 10000
                }
              ]
            }
          ]
        }
      }));

      const result = await hookParser.parseHooksFromFile(tempPath, 'project');

      expect(result).toHaveLength(1);
      const hook = result[0];
      expect(hook.if).toBe('git diff --cached --name-only');
      expect(hook.statusMessage).toBe('Running pre-check...');
      expect(hook.once).toBe(true);
      expect(hook.async).toBe(true);
      expect(hook.shell).toBe('bash');
      expect(hook.timeout).toBe(10000);

      await fs.unlink(tempPath);
    });
  });

  describe('Error Handling (Task 3.5)', () => {
    test('should return empty array for malformed JSON', async () => {
      const filePath = path.join(fixturesPath, 'invalid-json.json');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('should return empty array for missing file', async () => {
      const filePath = path.join(fixturesPath, 'nonexistent-file.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should handle invalid file path gracefully', async () => {
      const filePath = '/invalid/path/to/settings.json';
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should handle file with no hooks section', async () => {
      const filePath = path.join(fixturesPath, 'valid-mcp.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should handle invalid hook structure (missing command)', async () => {
      const filePath = path.join(fixturesPath, 'invalid-hook-structure.json');
      const result = await hookParser.parseHooksFromFile(filePath, 'project');

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        result.forEach(hook => {
          expect(hook).toHaveProperty('command');
          expect(hook.command).toBe('');
        });
      }
    });

    test('should handle hooks section that is not an object', async () => {
      const tempPath = path.join(fixturesPath, 'temp-invalid-hooks-type.json');
      await fs.writeFile(tempPath, JSON.stringify({ hooks: "not an object" }));

      const result = await hookParser.parseHooksFromFile(tempPath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);

      await fs.unlink(tempPath);
    });

    test('should handle hooks with non-array matchers', async () => {
      const tempPath = path.join(fixturesPath, 'temp-invalid-matchers.json');
      await fs.writeFile(tempPath, JSON.stringify({
        hooks: {
          "pre-commit": "not an array"
        }
      }));

      const result = await hookParser.parseHooksFromFile(tempPath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);

      await fs.unlink(tempPath);
    });
  });

  describe('Merge Logic (parseProjectHooks)', () => {
    test('should merge project and local hooks', async () => {
      const tempProjectPath = path.join(__dirname, '../../fixtures/temp-project-merge');
      const claudePath = path.join(tempProjectPath, '.claude');

      await fs.mkdir(claudePath, { recursive: true });

      await fs.writeFile(
        path.join(claudePath, 'settings.json'),
        JSON.stringify({
          hooks: {
            "pre-commit": [
              {
                "matcher": "*.js",
                "hooks": [
                  { "type": "command", "command": "npm run lint", "enabled": true }
                ]
              }
            ]
          }
        })
      );

      await fs.writeFile(
        path.join(claudePath, 'settings.local.json'),
        JSON.stringify({
          hooks: {
            "pre-push": [
              {
                "matcher": "*",
                "hooks": [
                  { "type": "command", "command": "npm test", "enabled": true }
                ]
              }
            ]
          }
        })
      );

      const result = await hookParser.parseProjectHooks(tempProjectPath);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      const projectHooks = result.filter(h => h.scope === 'project');
      const localHooks = result.filter(h => h.scope === 'project-local');

      expect(projectHooks.length).toBe(1);
      expect(localHooks.length).toBe(1);

      await fs.rm(tempProjectPath, { recursive: true, force: true });
    });

    test('should handle missing project settings file', async () => {
      const result = await hookParser.parseProjectHooks('/nonexistent/project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should handle missing local settings file (project settings exist)', async () => {
      const tempProjectPath = path.join(__dirname, '../../fixtures/temp-project-no-local');
      const claudePath = path.join(tempProjectPath, '.claude');

      await fs.mkdir(claudePath, { recursive: true });

      await fs.writeFile(
        path.join(claudePath, 'settings.json'),
        JSON.stringify({
          hooks: {
            "pre-commit": [
              {
                "matcher": "*.js",
                "hooks": [
                  { "type": "command", "command": "eslint", "enabled": true }
                ]
              }
            ]
          }
        })
      );

      const result = await hookParser.parseProjectHooks(tempProjectPath);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].scope).toBe('project');

      await fs.rm(tempProjectPath, { recursive: true, force: true });
    });

    test('merge logic handles errors in one file gracefully', async () => {
      const tempProjectPath = path.join(__dirname, '../../fixtures/temp-project-error');
      const claudePath = path.join(tempProjectPath, '.claude');

      await fs.mkdir(claudePath, { recursive: true });

      await fs.writeFile(
        path.join(claudePath, 'settings.json'),
        JSON.stringify({
          hooks: {
            "pre-commit": [
              {
                "matcher": "*.js",
                "hooks": [
                  { "type": "command", "command": "eslint", "enabled": true }
                ]
              }
            ]
          }
        })
      );

      await fs.writeFile(
        path.join(claudePath, 'settings.local.json'),
        '{ invalid json'
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await hookParser.parseProjectHooks(tempProjectPath);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].scope).toBe('project');

      consoleErrorSpy.mockRestore();

      await fs.rm(tempProjectPath, { recursive: true, force: true });
    });
  });

  describe('parseUserHooks', () => {
    let originalHome;

    beforeEach(() => {
      originalHome = process.env.HOME;
    });

    afterEach(() => {
      process.env.HOME = originalHome;
    });

    test('should parse user-level hooks from ~/.claude/settings.json', async () => {
      const tempUserPath = path.join(__dirname, '../../fixtures/temp-user-home');
      const claudePath = path.join(tempUserPath, '.claude');

      process.env.HOME = tempUserPath;

      await fs.mkdir(claudePath, { recursive: true });

      await fs.writeFile(
        path.join(claudePath, 'settings.json'),
        JSON.stringify({
          hooks: {
            "pre-commit": [
              {
                "matcher": "*",
                "hooks": [
                  { "type": "command", "command": "echo 'user hook'", "enabled": true }
                ]
              }
            ]
          }
        })
      );

      const result = await hookParser.parseUserHooks(tempUserPath);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].scope).toBe('user');
      expect(result[0].command).toBe("echo 'user hook'");

      await fs.rm(tempUserPath, { recursive: true, force: true });
    });

    test('should return empty array if user hooks do not exist', async () => {
      process.env.HOME = '/nonexistent/user/home';

      const result = await hookParser.parseUserHooks('/nonexistent/user/home');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getAllHooks', () => {
    let originalHome;

    beforeEach(() => {
      originalHome = process.env.HOME;
    });

    afterEach(() => {
      process.env.HOME = originalHome;
    });

    test('should return object with project and user hook arrays', async () => {
      const tempProjectPath = path.join(__dirname, '../../fixtures/temp-all-project');
      const tempUserPath = path.join(__dirname, '../../fixtures/temp-all-user');

      const projectClaudePath = path.join(tempProjectPath, '.claude');
      const userClaudePath = path.join(tempUserPath, '.claude');

      await fs.mkdir(projectClaudePath, { recursive: true });
      await fs.mkdir(userClaudePath, { recursive: true });

      await fs.writeFile(
        path.join(projectClaudePath, 'settings.json'),
        JSON.stringify({
          hooks: {
            "pre-commit": [
              {
                "matcher": "*.js",
                "hooks": [
                  { "type": "command", "command": "project hook", "enabled": true }
                ]
              }
            ]
          }
        })
      );

      await fs.writeFile(
        path.join(userClaudePath, 'settings.json'),
        JSON.stringify({
          hooks: {
            "pre-push": [
              {
                "matcher": "*",
                "hooks": [
                  { "type": "command", "command": "user hook", "enabled": true }
                ]
              }
            ]
          }
        })
      );

      process.env.HOME = tempUserPath;

      const result = await hookParser.getAllHooks(tempProjectPath, tempUserPath);

      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('user');
      expect(Array.isArray(result.project)).toBe(true);
      expect(Array.isArray(result.user)).toBe(true);
      expect(result.project.length).toBe(1);
      expect(result.user.length).toBe(1);

      await fs.rm(tempProjectPath, { recursive: true, force: true });
      await fs.rm(tempUserPath, { recursive: true, force: true });
    });

    test('should handle missing project and user directories', async () => {
      process.env.HOME = '/nonexistent/home';

      const result = await hookParser.getAllHooks('/nonexistent/project', '/nonexistent/home');

      expect(result.project).toEqual([]);
      expect(result.user).toEqual([]);
    });
  });

  describe('groupHooksByEvent', () => {
    test('should group hooks by event type', async () => {
      const filePath = path.join(fixturesPath, 'valid-multiple-events.json');
      const hooks = await hookParser.parseHooksFromFile(filePath, 'project');

      const grouped = hookParser.groupHooksByEvent(hooks);

      expect(typeof grouped).toBe('object');
      expect(grouped).toHaveProperty('pre-commit');
      expect(grouped).toHaveProperty('post-merge');
      expect(Array.isArray(grouped['pre-commit'])).toBe(true);
      expect(Array.isArray(grouped['post-merge'])).toBe(true);
    });

    test('should handle empty hooks array', () => {
      const grouped = hookParser.groupHooksByEvent([]);

      expect(typeof grouped).toBe('object');
      expect(Object.keys(grouped).length).toBe(0);
    });

    test('should group multiple hooks under same event', async () => {
      const filePath = path.join(fixturesPath, 'valid-multiple-hooks-per-matcher.json');
      const hooks = await hookParser.parseHooksFromFile(filePath, 'project');

      const grouped = hookParser.groupHooksByEvent(hooks);

      expect(grouped['pre-commit']).toBeDefined();
      expect(grouped['pre-commit'].length).toBe(3);
    });
  });
});
