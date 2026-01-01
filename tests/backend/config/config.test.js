/**
 * Unit tests for config module
 * Tests server configuration, path resolution, and environment variable handling
 */

const config = require('../../../src/backend/config/config');
const path = require('path');
const os = require('os');

describe('Config Module', () => {
  // Store original environment variables to restore after each test
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment to prevent test pollution
    process.env = originalEnv;
  });

  describe('Server Configuration', () => {
    describe('getBackendPort()', () => {
      test('should return 8420 by default', () => {
        delete process.env.PORT;
        expect(config.server.getBackendPort()).toBe(8420);
      });

      test('should respect PORT environment variable', () => {
        process.env.PORT = '9000';
        expect(config.server.getBackendPort()).toBe(9000);
      });

      test('should parse PORT as integer', () => {
        process.env.PORT = '3000';
        const port = config.server.getBackendPort();
        expect(typeof port).toBe('number');
        expect(port).toBe(3000);
      });
    });

    describe('getFrontendPort()', () => {
      test('should return 5173 by default', () => {
        delete process.env.VITE_PORT;
        expect(config.server.getFrontendPort()).toBe(5173);
      });

      test('should respect VITE_PORT environment variable', () => {
        process.env.VITE_PORT = '3000';
        expect(config.server.getFrontendPort()).toBe(3000);
      });

      test('should parse VITE_PORT as integer', () => {
        process.env.VITE_PORT = '8080';
        const port = config.server.getFrontendPort();
        expect(typeof port).toBe('number');
        expect(port).toBe(8080);
      });
    });

    describe('getBackendHost()', () => {
      test('should return localhost by default', () => {
        delete process.env.HOST;
        expect(config.server.getBackendHost()).toBe('localhost');
      });

      test('should respect HOST environment variable', () => {
        process.env.HOST = '0.0.0.0';
        expect(config.server.getBackendHost()).toBe('0.0.0.0');
      });

      test('should handle IP address hosts', () => {
        process.env.HOST = '192.168.1.100';
        expect(config.server.getBackendHost()).toBe('192.168.1.100');
      });
    });

    describe('getProtocol()', () => {
      test('should return http by default', () => {
        delete process.env.PROTOCOL;
        expect(config.server.getProtocol()).toBe('http');
      });

      test('should respect PROTOCOL environment variable', () => {
        process.env.PROTOCOL = 'https';
        expect(config.server.getProtocol()).toBe('https');
      });
    });

    describe('getBackendUrl()', () => {
      test('should compose URL correctly with defaults', () => {
        delete process.env.PROTOCOL;
        delete process.env.HOST;
        delete process.env.PORT;
        expect(config.server.getBackendUrl()).toBe('http://localhost:8420');
      });

      test('should compose URL with custom protocol', () => {
        process.env.PROTOCOL = 'https';
        delete process.env.HOST;
        delete process.env.PORT;
        expect(config.server.getBackendUrl()).toBe('https://localhost:8420');
      });

      test('should compose URL with custom host', () => {
        delete process.env.PROTOCOL;
        process.env.HOST = '0.0.0.0';
        delete process.env.PORT;
        expect(config.server.getBackendUrl()).toBe('http://0.0.0.0:8420');
      });

      test('should compose URL with custom port', () => {
        delete process.env.PROTOCOL;
        delete process.env.HOST;
        process.env.PORT = '9000';
        expect(config.server.getBackendUrl()).toBe('http://localhost:9000');
      });

      test('should compose URL with all custom values', () => {
        process.env.PROTOCOL = 'https';
        process.env.HOST = '192.168.1.100';
        process.env.PORT = '443';
        expect(config.server.getBackendUrl()).toBe('https://192.168.1.100:443');
      });
    });
  });

  describe('Path Configuration - Production Mode', () => {
    beforeEach(() => {
      // Ensure production mode
      delete process.env.USE_DEV_PATHS;
    });

    describe('isDevelopmentMode()', () => {
      test('should return false by default', () => {
        delete process.env.USE_DEV_PATHS;
        expect(config.paths.isDevelopmentMode()).toBe(false);
      });

      test('should return false when USE_DEV_PATHS is not "true"', () => {
        process.env.USE_DEV_PATHS = 'false';
        expect(config.paths.isDevelopmentMode()).toBe(false);

        process.env.USE_DEV_PATHS = '1';
        expect(config.paths.isDevelopmentMode()).toBe(false);

        process.env.USE_DEV_PATHS = 'yes';
        expect(config.paths.isDevelopmentMode()).toBe(false);
      });
    });

    describe('User-level paths', () => {
      test('getUserClaudeJsonPath() should return ~/.claude.json', () => {
        const result = config.paths.getUserClaudeJsonPath();
        expect(result).toContain('.claude.json');
        expect(result).not.toContain('.claude-dev');
      });

      test('getUserClaudeDir() should return ~/.claude', () => {
        const result = config.paths.getUserClaudeDir();
        expect(result).toMatch(/[/\\]\.claude$/);
        expect(result).not.toContain('.claude-dev');
      });

      test('getUserSettingsPath() should return ~/.claude/settings.json', () => {
        const result = config.paths.getUserSettingsPath();
        expect(result).toMatch(/[/\\]\.claude[/\\]settings\.json$/);
        expect(result).not.toContain('.claude-dev');
      });

      test('getUserAgentsDir() should return ~/.claude/agents', () => {
        const result = config.paths.getUserAgentsDir();
        expect(result).toMatch(/[/\\]\.claude[/\\]agents$/);
        expect(result).not.toContain('.claude-dev');
      });

      test('getUserCommandsDir() should return ~/.claude/commands', () => {
        const result = config.paths.getUserCommandsDir();
        expect(result).toMatch(/[/\\]\.claude[/\\]commands$/);
        expect(result).not.toContain('.claude-dev');
      });

      test('getUserSkillsDir() should return ~/.claude/skills', () => {
        const result = config.paths.getUserSkillsDir();
        expect(result).toMatch(/[/\\]\.claude[/\\]skills$/);
        expect(result).not.toContain('.claude-dev');
      });
    });

    describe('Project-level paths', () => {
      const testProject = '/home/user/projects/test-app';

      test('getProjectClaudeDir() should return {project}/.claude', () => {
        const result = config.paths.getProjectClaudeDir(testProject);
        expect(result).toBe(path.join(testProject, '.claude'));
        expect(result).not.toContain('.claude-dev');
      });

      test('getProjectSettingsPath() should return {project}/.claude/settings.json', () => {
        const result = config.paths.getProjectSettingsPath(testProject);
        expect(result).toBe(path.join(testProject, '.claude', 'settings.json'));
        expect(result).not.toContain('.claude-dev');
      });

      test('getProjectLocalSettingsPath() should return {project}/.claude/settings.local.json', () => {
        const result = config.paths.getProjectLocalSettingsPath(testProject);
        expect(result).toBe(path.join(testProject, '.claude', 'settings.local.json'));
        expect(result).not.toContain('.claude-dev');
      });

      test('getProjectAgentsDir() should return {project}/.claude/agents', () => {
        const result = config.paths.getProjectAgentsDir(testProject);
        expect(result).toBe(path.join(testProject, '.claude', 'agents'));
        expect(result).not.toContain('.claude-dev');
      });

      test('getProjectCommandsDir() should return {project}/.claude/commands', () => {
        const result = config.paths.getProjectCommandsDir(testProject);
        expect(result).toBe(path.join(testProject, '.claude', 'commands'));
        expect(result).not.toContain('.claude-dev');
      });

      test('getProjectSkillsDir() should return {project}/.claude/skills', () => {
        const result = config.paths.getProjectSkillsDir(testProject);
        expect(result).toBe(path.join(testProject, '.claude', 'skills'));
        expect(result).not.toContain('.claude-dev');
      });

      test('getProjectMcpPath() should return {project}/.mcp.json', () => {
        const result = config.paths.getProjectMcpPath(testProject);
        expect(result).toBe(path.join(testProject, '.mcp.json'));
        expect(result).not.toContain('.mcp-dev');
      });
    });
  });

  describe('Path Configuration - Development Mode', () => {
    beforeEach(() => {
      // Enable development mode
      process.env.USE_DEV_PATHS = 'true';
    });

    describe('isDevelopmentMode()', () => {
      test('should return true when USE_DEV_PATHS is "true"', () => {
        process.env.USE_DEV_PATHS = 'true';
        expect(config.paths.isDevelopmentMode()).toBe(true);
      });
    });

    describe('User-level paths', () => {
      test('getUserClaudeJsonPath() should return ~/.claude-dev.json', () => {
        const result = config.paths.getUserClaudeJsonPath();
        expect(result).toContain('.claude-dev.json');
        expect(result).not.toMatch(/\.claude\.json$/);
      });

      test('getUserClaudeDir() should return ~/.claude-dev', () => {
        const result = config.paths.getUserClaudeDir();
        expect(result).toMatch(/[/\\]\.claude-dev$/);
      });

      test('getUserSettingsPath() should return ~/.claude-dev/settings.json', () => {
        const result = config.paths.getUserSettingsPath();
        expect(result).toMatch(/[/\\]\.claude-dev[/\\]settings\.json$/);
      });

      test('getUserAgentsDir() should return ~/.claude-dev/agents', () => {
        const result = config.paths.getUserAgentsDir();
        expect(result).toMatch(/[/\\]\.claude-dev[/\\]agents$/);
      });

      test('getUserCommandsDir() should return ~/.claude-dev/commands', () => {
        const result = config.paths.getUserCommandsDir();
        expect(result).toMatch(/[/\\]\.claude-dev[/\\]commands$/);
      });

      test('getUserSkillsDir() should return ~/.claude-dev/skills', () => {
        const result = config.paths.getUserSkillsDir();
        expect(result).toMatch(/[/\\]\.claude-dev[/\\]skills$/);
      });
    });

    describe('Project-level paths', () => {
      const testProject = '/home/user/projects/test-app';

      test('getProjectClaudeDir() should return {project}/.claude-dev', () => {
        const result = config.paths.getProjectClaudeDir(testProject);
        expect(result).toBe(path.join(testProject, '.claude-dev'));
      });

      test('getProjectSettingsPath() should return {project}/.claude-dev/settings.json', () => {
        const result = config.paths.getProjectSettingsPath(testProject);
        expect(result).toBe(path.join(testProject, '.claude-dev', 'settings.json'));
      });

      test('getProjectLocalSettingsPath() should return {project}/.claude-dev/settings.local.json', () => {
        const result = config.paths.getProjectLocalSettingsPath(testProject);
        expect(result).toBe(path.join(testProject, '.claude-dev', 'settings.local.json'));
      });

      test('getProjectAgentsDir() should return {project}/.claude-dev/agents', () => {
        const result = config.paths.getProjectAgentsDir(testProject);
        expect(result).toBe(path.join(testProject, '.claude-dev', 'agents'));
      });

      test('getProjectCommandsDir() should return {project}/.claude-dev/commands', () => {
        const result = config.paths.getProjectCommandsDir(testProject);
        expect(result).toBe(path.join(testProject, '.claude-dev', 'commands'));
      });

      test('getProjectSkillsDir() should return {project}/.claude-dev/skills', () => {
        const result = config.paths.getProjectSkillsDir(testProject);
        expect(result).toBe(path.join(testProject, '.claude-dev', 'skills'));
      });

      test('getProjectMcpPath() should return {project}/.mcp-dev.json', () => {
        const result = config.paths.getProjectMcpPath(testProject);
        expect(result).toBe(path.join(testProject, '.mcp-dev.json'));
      });
    });
  });

  describe('Utility Functions', () => {
    describe('expandHome()', () => {
      test('should expand ~ correctly', () => {
        const homeDir = process.env.HOME || os.homedir();
        const result = config.paths.expandHome('~/test/path');
        expect(result).toBe(path.join(homeDir, 'test/path'));
      });

      test('should expand single ~ correctly', () => {
        const homeDir = process.env.HOME || os.homedir();
        const result = config.paths.expandHome('~');
        expect(result).toBe(homeDir);
      });

      test('should handle absolute paths without modification', () => {
        const absolutePath = '/absolute/path/to/file';
        const result = config.paths.expandHome(absolutePath);
        expect(result).toBe(absolutePath);
      });

      test('should handle relative paths without ~', () => {
        const relativePath = 'relative/path/to/file';
        const result = config.paths.expandHome(relativePath);
        expect(result).toBe(relativePath);
      });

      test('should handle null values', () => {
        const result = config.paths.expandHome(null);
        expect(result).toBeNull();
      });

      test('should handle undefined values', () => {
        const result = config.paths.expandHome(undefined);
        expect(result).toBeUndefined();
      });

      test('should respect process.env.HOME for testing', () => {
        const testHome = '/test/home/directory';
        process.env.HOME = testHome;
        const result = config.paths.expandHome('~/test');
        expect(result).toBe(path.join(testHome, 'test'));
      });

      test('should not expand ~ in the middle of path', () => {
        const pathWithTilde = '/some/path/~/file';
        const result = config.paths.expandHome(pathWithTilde);
        expect(result).toBe(pathWithTilde);
      });

      test('should handle empty string', () => {
        const result = config.paths.expandHome('');
        expect(result).toBe('');
      });
    });
  });

  describe('Timeout Configuration', () => {
    test('DEFAULT_API_TIMEOUT should be defined and positive', () => {
      expect(config.timeouts.DEFAULT_API_TIMEOUT).toBeDefined();
      expect(typeof config.timeouts.DEFAULT_API_TIMEOUT).toBe('number');
      expect(config.timeouts.DEFAULT_API_TIMEOUT).toBeGreaterThan(0);
      expect(config.timeouts.DEFAULT_API_TIMEOUT).toBe(30000);
    });

    test('REFERENCE_CHECK_TIMEOUT should be defined and positive', () => {
      expect(config.timeouts.REFERENCE_CHECK_TIMEOUT).toBeDefined();
      expect(typeof config.timeouts.REFERENCE_CHECK_TIMEOUT).toBe('number');
      expect(config.timeouts.REFERENCE_CHECK_TIMEOUT).toBeGreaterThan(0);
      expect(config.timeouts.REFERENCE_CHECK_TIMEOUT).toBe(5000);
    });

    test('DEFAULT_HOOK_TIMEOUT should be defined and positive', () => {
      expect(config.timeouts.DEFAULT_HOOK_TIMEOUT).toBeDefined();
      expect(typeof config.timeouts.DEFAULT_HOOK_TIMEOUT).toBe('number');
      expect(config.timeouts.DEFAULT_HOOK_TIMEOUT).toBeGreaterThan(0);
      expect(config.timeouts.DEFAULT_HOOK_TIMEOUT).toBe(60000);
    });

    test('NOTIFICATION_DURATION should be defined and positive', () => {
      expect(config.timeouts.NOTIFICATION_DURATION).toBeDefined();
      expect(typeof config.timeouts.NOTIFICATION_DURATION).toBe('number');
      expect(config.timeouts.NOTIFICATION_DURATION).toBeGreaterThan(0);
      expect(config.timeouts.NOTIFICATION_DURATION).toBe(5000);
    });

    test('all timeout values should be numbers', () => {
      const timeoutKeys = Object.keys(config.timeouts);
      timeoutKeys.forEach(key => {
        expect(typeof config.timeouts[key]).toBe('number');
      });
    });
  });

  describe('URL Configuration', () => {
    test('DOCS_HOOKS should be defined and valid URL', () => {
      expect(config.urls.DOCS_HOOKS).toBeDefined();
      expect(typeof config.urls.DOCS_HOOKS).toBe('string');
      expect(config.urls.DOCS_HOOKS).toMatch(/^https?:\/\//);
      expect(config.urls.DOCS_HOOKS).toBe('https://docs.claude.com/en/docs/claude-code/hooks');
    });

    test('SCHEMA_SETTINGS should be defined and valid URL', () => {
      expect(config.urls.SCHEMA_SETTINGS).toBeDefined();
      expect(typeof config.urls.SCHEMA_SETTINGS).toBe('string');
      expect(config.urls.SCHEMA_SETTINGS).toMatch(/^https?:\/\//);
      expect(config.urls.SCHEMA_SETTINGS).toBe('https://json.schemastore.org/claude-code-settings.json');
    });

    test('GITHUB_ISSUES should be defined and valid URL', () => {
      expect(config.urls.GITHUB_ISSUES).toBeDefined();
      expect(typeof config.urls.GITHUB_ISSUES).toBe('string');
      expect(config.urls.GITHUB_ISSUES).toMatch(/^https?:\/\//);
      expect(config.urls.GITHUB_ISSUES).toBe('https://github.com/nitromike502/claude-code-web-manager/issues/new');
    });

    test('all URL values should be strings', () => {
      const urlKeys = Object.keys(config.urls);
      urlKeys.forEach(key => {
        expect(typeof config.urls[key]).toBe('string');
      });
    });

    test('all URL values should start with http:// or https://', () => {
      const urlKeys = Object.keys(config.urls);
      urlKeys.forEach(key => {
        expect(config.urls[key]).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('Module Exports', () => {
    test('should export server object', () => {
      expect(config.server).toBeDefined();
      expect(typeof config.server).toBe('object');
    });

    test('should export paths object', () => {
      expect(config.paths).toBeDefined();
      expect(typeof config.paths).toBe('object');
    });

    test('should export timeouts object', () => {
      expect(config.timeouts).toBeDefined();
      expect(typeof config.timeouts).toBe('object');
    });

    test('should export urls object', () => {
      expect(config.urls).toBeDefined();
      expect(typeof config.urls).toBe('object');
    });

    test('should export all expected server methods', () => {
      expect(typeof config.server.getBackendPort).toBe('function');
      expect(typeof config.server.getFrontendPort).toBe('function');
      expect(typeof config.server.getBackendHost).toBe('function');
      expect(typeof config.server.getProtocol).toBe('function');
      expect(typeof config.server.getBackendUrl).toBe('function');
    });

    test('should export all expected path methods', () => {
      expect(typeof config.paths.isDevelopmentMode).toBe('function');
      expect(typeof config.paths.getUserClaudeJsonPath).toBe('function');
      expect(typeof config.paths.getUserClaudeDir).toBe('function');
      expect(typeof config.paths.getUserSettingsPath).toBe('function');
      expect(typeof config.paths.getUserAgentsDir).toBe('function');
      expect(typeof config.paths.getUserCommandsDir).toBe('function');
      expect(typeof config.paths.getUserSkillsDir).toBe('function');
      expect(typeof config.paths.getProjectClaudeDir).toBe('function');
      expect(typeof config.paths.getProjectSettingsPath).toBe('function');
      expect(typeof config.paths.getProjectLocalSettingsPath).toBe('function');
      expect(typeof config.paths.getProjectAgentsDir).toBe('function');
      expect(typeof config.paths.getProjectCommandsDir).toBe('function');
      expect(typeof config.paths.getProjectSkillsDir).toBe('function');
      expect(typeof config.paths.getProjectMcpPath).toBe('function');
      expect(typeof config.paths.expandHome).toBe('function');
    });
  });
});
