/**
 * Unit tests for commandParser
 * Tests parsing of command markdown files with optional YAML frontmatter
 */

const commandParser = require('../../../src/backend/parsers/commandParser');
const path = require('path');
const fs = require('fs').promises;

describe('commandParser', () => {
  const fixturesPath = path.join(__dirname, '../../fixtures/samples/commands');

  // Store original HOME for cleanup
  let originalHome;

  describe('Valid Command Parsing', () => {
    test('should parse command with complete frontmatter', async () => {
      const filePath = path.join(fixturesPath, 'valid-complete.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('complete-command');
      expect(result.description).toBe('Command with all fields present');
      expect(result.namespace).toBeNull(); // Root directory
      expect(result.content).toContain('Complete Command');
      expect(result.filePath).toBe(filePath);
      expect(result.scope).toBe('project');
    });

    test('should parse command with minimal frontmatter', async () => {
      const filePath = path.join(fixturesPath, 'valid-minimal.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('minimal-command');
      expect(result.description).toBe('Minimal Command'); // Extracted from first line
      expect(result.namespace).toBeNull();
      expect(result.content).toContain('Minimal Command');
      expect(result.filePath).toBe(filePath);
      expect(result.scope).toBe('project');
    });

    test('should parse command without frontmatter (extract from content)', async () => {
      const filePath = path.join(fixturesPath, 'no-frontmatter.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('no-frontmatter'); // Derived from filename
      expect(result.description).toBe('Command Without Frontmatter'); // Extracted from first line
      expect(result.namespace).toBeNull();
      expect(result.content).toContain('This command has no YAML frontmatter');
      expect(result.filePath).toBe(filePath);
      expect(result.scope).toBe('project');
    });

    test('should derive command name from file path when not in frontmatter', async () => {
      const filePath = path.join(fixturesPath, 'no-frontmatter.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('no-frontmatter'); // Filename without .md
    });

    test('should handle special characters in command names', async () => {
      const filePath = path.join(fixturesPath, 'special-chars.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('special-chars-cmd');
      expect(result.description).toContain('special chars: @#$%^&*()[]{}|<>?/\\~`');
    });

    test('should extract description from frontmatter when present', async () => {
      const filePath = path.join(fixturesPath, 'valid-complete.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.description).toBe('Command with all fields present');
    });

    test('should extract description from first line when frontmatter missing', async () => {
      const filePath = path.join(fixturesPath, 'no-frontmatter.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.description).toBe('Command Without Frontmatter');
    });

    test('should handle multiline descriptions', async () => {
      const filePath = path.join(fixturesPath, 'multiline-description.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('multiline-cmd');
      expect(result.description).toContain('This is a multiline description');
      expect(result.description).toContain('that spans multiple lines');
      expect(result.description).toContain('for testing purposes');
    });

    test('should calculate namespace from nested directory structure', async () => {
      const filePath = path.join(fixturesPath, 'nested/nested-command.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('nested-cmd');
      expect(result.namespace).toBe('nested');
      expect(result.description).toBe('Command in nested directory');
    });

    test('should calculate namespace from deeply nested directories', async () => {
      const filePath = path.join(fixturesPath, 'nested/deep/deep-command.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('deep-cmd');
      expect(result.namespace).toBe('nested/deep');
      expect(result.description).toBe('Command in deeply nested directory');
    });

    test('should default scope to "project" when not specified', async () => {
      const filePath = path.join(fixturesPath, 'valid-minimal.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath);

      expect(result).not.toBeNull();
      expect(result.scope).toBe('project');
    });

    test('should respect scope parameter when provided as "user"', async () => {
      const filePath = path.join(fixturesPath, 'valid-minimal.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'user');

      expect(result).not.toBeNull();
      expect(result.scope).toBe('user');
    });

    test('should remove markdown heading markers from description', async () => {
      const filePath = path.join(fixturesPath, 'no-frontmatter.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      // First line is "# Command Without Frontmatter", should be stripped to just text
      expect(result.description).toBe('Command Without Frontmatter');
      expect(result.description).not.toContain('#');
    });
  });

  describe('Error Handling', () => {
    test('should return null for malformed YAML frontmatter', async () => {
      const filePath = path.join(fixturesPath, 'invalid-yaml.md');

      // Spy on console.warn to verify warning is logged (YAML errors use warn, not error)
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      // After error handling improvements, malformed files return partial objects with hasError=true
      // rather than null, allowing graceful display even for malformed content
      expect(result).not.toBeNull();
      expect(result.hasError).toBe(true);
      expect(result.parseError).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('YAML parsing error'),
        expect.any(String)
      );

      consoleWarnSpy.mockRestore();
    });

    test('should handle empty file gracefully', async () => {
      const filePath = path.join(fixturesPath, 'empty.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      // Empty file should parse but with minimal data
      expect(result).not.toBeNull();
      expect(result.name).toBe('empty'); // Uses filename
      expect(result.description).toBe('');
      expect(result.content).toBe('');
      expect(result.namespace).toBeNull();
    });

    test('should validate command structure is complete', async () => {
      const filePath = path.join(fixturesPath, 'valid-complete.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('namespace');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('scope');
    });

    test('should return null for nonexistent file', async () => {
      const filePath = path.join(fixturesPath, 'nonexistent-file.md');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('should return null for invalid file path', async () => {
      const filePath = '/invalid/path/to/command.md';

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('commands without frontmatter should still work', async () => {
      const filePath = path.join(fixturesPath, 'no-frontmatter.md');
      const result = await commandParser.parseCommand(filePath, fixturesPath, 'project');

      // Should parse successfully even without frontmatter
      expect(result).not.toBeNull();
      expect(result.name).toBe('no-frontmatter');
      expect(result.description).toBeTruthy(); // Should extract from content
      expect(result.content).toBeTruthy();
    });
  });

  describe('parseAllCommands', () => {
    test('should parse all commands in a directory including nested', async () => {
      const results = await commandParser.parseAllCommands(fixturesPath, 'project');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Should filter out null results (failed parses)
      results.forEach(command => {
        expect(command).not.toBeNull();
        expect(command.name).toBeDefined();
        expect(command.scope).toBe('project');
      });
    });

    test('should return empty array for nonexistent directory', async () => {
      const results = await commandParser.parseAllCommands('/nonexistent/directory', 'project');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('should filter out failed parses (null results)', async () => {
      const results = await commandParser.parseAllCommands(fixturesPath, 'project');

      // All results should be valid command objects, no null values
      expect(results.every(command => command !== null)).toBe(true);
    });

    test('should only parse .md files', async () => {
      const results = await commandParser.parseAllCommands(fixturesPath, 'project');

      // Verify all results have .md file paths
      results.forEach(command => {
        expect(command.filePath).toMatch(/\.md$/);
      });
    });

    test('should recursively find commands in nested directories', async () => {
      const results = await commandParser.parseAllCommands(fixturesPath, 'project');

      // Should include commands from nested directories
      const nestedCommands = results.filter(cmd => cmd.namespace !== null);
      expect(nestedCommands.length).toBeGreaterThan(0);

      // Check specific nested commands exist
      const nestedCmd = results.find(cmd => cmd.namespace === 'nested');
      expect(nestedCmd).toBeDefined();

      const deepCmd = results.find(cmd => cmd.namespace === 'nested/deep');
      expect(deepCmd).toBeDefined();
    });
  });

  describe('getAllCommands', () => {
    beforeEach(() => {
      originalHome = process.env.HOME;
    });

    afterEach(() => {
      process.env.HOME = originalHome;
    });

    test('should return object with project and user arrays', async () => {
      // Use fixtures path as mock project path
      const projectPath = path.join(__dirname, '../../fixtures/mock-project');
      const userHomePath = path.join(__dirname, '../../fixtures/mock-home');

      // Set HOME to test fixture path for config module
      process.env.HOME = userHomePath;

      const result = await commandParser.getAllCommands(projectPath, userHomePath);

      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('user');
      expect(Array.isArray(result.project)).toBe(true);
      expect(Array.isArray(result.user)).toBe(true);
    });

    test('should handle missing project and user directories', async () => {
      // Set HOME to nonexistent path for config module
      process.env.HOME = '/nonexistent/home';

      const result = await commandParser.getAllCommands('/nonexistent/project', '/nonexistent/home');

      expect(result.project).toEqual([]);
      expect(result.user).toEqual([]);
    });
  });
});
