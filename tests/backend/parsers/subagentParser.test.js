/**
 * Unit tests for subagentParser
 * Tests parsing of subagent markdown files with YAML frontmatter
 */

const subagentParser = require('../../../src/backend/parsers/subagentParser');
const path = require('path');
const fs = require('fs').promises;

describe('subagentParser', () => {
  const fixturesPath = path.join(__dirname, '../../fixtures/samples/agents');

  describe('Valid Agent Parsing', () => {
    test('should parse agent with all fields present', async () => {
      const filePath = path.join(fixturesPath, 'valid-complete.md');
      const result = await subagentParser.parseSubagent(filePath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('complete-agent');
      expect(result.description).toBe('Agent with all fields present');
      expect(result.tools).toEqual(['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob']);
      expect(result.model).toBe('claude-sonnet-4');
      expect(result.color).toBe('green');
      expect(result.systemPrompt).toContain('Complete Agent');
      expect(result.filePath).toBe(filePath);
      expect(result.scope).toBe('project');
    });

    test('should parse agent with minimal required fields', async () => {
      const filePath = path.join(fixturesPath, 'valid-minimal.md');
      const result = await subagentParser.parseSubagent(filePath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('minimal-agent');
      expect(result.description).toBe('Agent with only required fields');
      expect(result.tools).toEqual([]);
      expect(result.model).toBe('inherit');
      expect(result.color).toBeNull();
      expect(result.systemPrompt).toContain('Minimal Agent');
      expect(result.filePath).toBe(filePath);
      expect(result.scope).toBe('project');
    });

    test('should parse agent with multiline YAML strings', async () => {
      const filePath = path.join(fixturesPath, 'multiline-yaml.md');
      const result = await subagentParser.parseSubagent(filePath);

      expect(result).not.toBeNull();
      expect(result.name).toBe('multiline-agent');
      expect(result.description).toContain('This is a multiline description');
      expect(result.description).toContain('that spans multiple lines');
      expect(result.tools).toEqual(['Read', 'Write', 'Edit']);
      expect(result.systemPrompt).toContain('Multiline YAML Agent');
    });

    test('should parse agent with special characters in YAML values', async () => {
      const filePath = path.join(fixturesPath, 'special-chars.md');
      const result = await subagentParser.parseSubagent(filePath);

      expect(result).not.toBeNull();
      expect(result.name).toBe('special-chars-agent');
      expect(result.description).toContain('special chars: @#$%^&*()[]{}|<>?/\\~`');
      expect(result.tools).toEqual(['Read', 'Write', 'Bash']);
      expect(result.color).toBe('#FF5733');
    });

    test('should parse agent with all official frontmatter fields', async () => {
      const filePath = path.join(fixturesPath, 'full-frontmatter.md');
      const result = await subagentParser.parseSubagent(filePath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('full-frontmatter-agent');
      expect(result.description).toBe('Agent with all official frontmatter fields');
      expect(result.tools).toEqual(['Read', 'Write', 'Edit']);
      expect(result.disallowedTools).toEqual(['Bash', 'WebSearch']);
      expect(result.model).toBe('claude-sonnet-4');
      expect(result.color).toBe('blue');
      expect(result.permissionMode).toBe('bypassPermissions');
      expect(result.maxTurns).toBe(25);
      expect(result.skills).toEqual(['code-review', 'testing']);
      expect(result.mcpServers).toEqual({
        playwright: {
          command: 'npx',
          args: ['@anthropic-ai/mcp-playwright']
        }
      });
      expect(result.hooks).toEqual({
        preToolUse: [{ matcher: 'Bash', command: 'echo "pre-hook"' }]
      });
      expect(result.memory).toBe('project');
      expect(result.background).toBe(true);
      expect(result.effort).toBe('high');
      expect(result.isolation).toBe('worktree');
      expect(result.initialPrompt).toBe('Start by reviewing the codebase');
      expect(result.systemPrompt).toContain('Full Frontmatter Agent');
      expect(result.hasError).toBe(false);
    });

    test('should default new fields correctly when not present', async () => {
      const filePath = path.join(fixturesPath, 'valid-minimal.md');
      const result = await subagentParser.parseSubagent(filePath, 'project');

      expect(result).not.toBeNull();
      expect(result.disallowedTools).toEqual([]);
      expect(result.permissionMode).toBeNull();
      expect(result.maxTurns).toBeNull();
      expect(result.skills).toEqual([]);
      expect(result.mcpServers).toBeNull();
      expect(result.hooks).toBeNull();
      expect(result.memory).toBeNull();
      expect(result.background).toBe(false);
      expect(result.effort).toBeNull();
      expect(result.isolation).toBeNull();
      expect(result.initialPrompt).toBeNull();
    });

    test('should parse disallowedTools as comma-separated string', async () => {
      // Create a temp file with string-format disallowedTools
      const tempDir = path.join(__dirname, '../../temp-agent-test');
      await fs.mkdir(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, 'string-disallowed.md');
      await fs.writeFile(tempFile, '---\nname: test\ndisallowedTools: Bash, WebSearch, Edit\n---\n\nTest');

      try {
        const result = await subagentParser.parseSubagent(tempFile, 'project');
        expect(result.disallowedTools).toEqual(['Bash', 'WebSearch', 'Edit']);
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    test('should handle extra unknown fields gracefully (ignore them)', async () => {
      const filePath = path.join(fixturesPath, 'extra-fields.md');
      const result = await subagentParser.parseSubagent(filePath);

      expect(result).not.toBeNull();
      expect(result.name).toBe('extra-fields-agent');
      expect(result.description).toBe('Agent with extra fields');
      expect(result.tools).toEqual(['Read', 'Write']);
      // Unknown fields should not appear in result
      expect(result.unknownField1).toBeUndefined();
      expect(result.customProp).toBeUndefined();
    });

    test('should handle tools as comma-separated string', async () => {
      const filePath = path.join(fixturesPath, 'special-chars.md');
      const result = await subagentParser.parseSubagent(filePath);

      expect(result).not.toBeNull();
      expect(result.tools).toEqual(['Read', 'Write', 'Bash']);
    });

    test('should handle tools as YAML array', async () => {
      const filePath = path.join(fixturesPath, 'multiline-yaml.md');
      const result = await subagentParser.parseSubagent(filePath);

      expect(result).not.toBeNull();
      expect(result.tools).toEqual(['Read', 'Write', 'Edit']);
    });

    test('should use filename as fallback when name field is missing', async () => {
      const filePath = path.join(fixturesPath, 'no-name.md');
      const result = await subagentParser.parseSubagent(filePath);

      expect(result).not.toBeNull();
      expect(result.name).toBe('no-name');
      expect(result.description).toBe('Agent without a name field');
    });

    test('should default to empty string when description is missing', async () => {
      const filePath = path.join(fixturesPath, 'no-description.md');
      const result = await subagentParser.parseSubagent(filePath);

      expect(result).not.toBeNull();
      expect(result.name).toBe('no-desc-agent');
      expect(result.description).toBe('');
    });

    test('should default scope to "project" when not specified', async () => {
      const filePath = path.join(fixturesPath, 'valid-minimal.md');
      const result = await subagentParser.parseSubagent(filePath);

      expect(result).not.toBeNull();
      expect(result.scope).toBe('project');
    });

    test('should respect scope parameter when provided', async () => {
      const filePath = path.join(fixturesPath, 'valid-minimal.md');
      const result = await subagentParser.parseSubagent(filePath, 'user');

      expect(result).not.toBeNull();
      expect(result.scope).toBe('user');
    });
  });

  describe('Error Handling', () => {
    test('should return null for malformed YAML frontmatter', async () => {
      const filePath = path.join(fixturesPath, 'invalid-yaml.md');

      // Spy on console.warn to verify warning is logged (YAML errors use warn, not error)
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await subagentParser.parseSubagent(filePath);

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

    test('should handle file with missing frontmatter', async () => {
      const filePath = path.join(fixturesPath, 'missing-frontmatter.md');
      const result = await subagentParser.parseSubagent(filePath);

      // gray-matter treats files without frontmatter as having empty data
      expect(result).not.toBeNull();
      expect(result.name).toBe('missing-frontmatter'); // Uses filename
      expect(result.description).toBe(''); // Default empty
      expect(result.systemPrompt).toContain('Agent Without Frontmatter');
    });

    test('should handle empty file', async () => {
      const filePath = path.join(fixturesPath, 'empty.md');
      const result = await subagentParser.parseSubagent(filePath);

      // Empty file should parse but with defaults
      expect(result).not.toBeNull();
      expect(result.name).toBe('empty'); // Uses filename
      expect(result.description).toBe('');
      expect(result.systemPrompt).toBe('');
      expect(result.tools).toEqual([]);
    });

    test('should handle file with only frontmatter (no markdown body)', async () => {
      const filePath = path.join(fixturesPath, 'only-frontmatter.md');
      const result = await subagentParser.parseSubagent(filePath);

      expect(result).not.toBeNull();
      expect(result.name).toBe('no-body-agent');
      expect(result.description).toBe('Agent with no markdown body');
      expect(result.systemPrompt).toBe(''); // Empty body
    });

    test('should return null for nonexistent file', async () => {
      const filePath = path.join(fixturesPath, 'nonexistent-file.md');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await subagentParser.parseSubagent(filePath);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('should return null for invalid file path', async () => {
      const filePath = '/invalid/path/to/agent.md';

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await subagentParser.parseSubagent(filePath);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('parseAllSubagents', () => {
    test('should parse all agents in a directory', async () => {
      const results = await subagentParser.parseAllSubagents(fixturesPath, 'project');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Should filter out null results (failed parses)
      results.forEach(agent => {
        expect(agent).not.toBeNull();
        expect(agent.name).toBeDefined();
        expect(agent.scope).toBe('project');
      });
    });

    test('should return empty array for nonexistent directory', async () => {
      const results = await subagentParser.parseAllSubagents('/nonexistent/directory', 'project');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('should filter out failed parses (null results)', async () => {
      const results = await subagentParser.parseAllSubagents(fixturesPath, 'project');

      // All results should be valid agent objects, no null values
      expect(results.every(agent => agent !== null)).toBe(true);
    });

    test('should only parse .md files', async () => {
      const results = await subagentParser.parseAllSubagents(fixturesPath, 'project');

      // Verify all results have .md file paths
      results.forEach(agent => {
        expect(agent.filePath).toMatch(/\.md$/);
      });
    });
  });

  describe('getAllSubagents', () => {
    let originalHome;

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

      const result = await subagentParser.getAllSubagents(projectPath, userHomePath);

      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('user');
      expect(Array.isArray(result.project)).toBe(true);
      expect(Array.isArray(result.user)).toBe(true);
    });

    test('should handle missing project and user directories', async () => {
      // Set HOME to nonexistent path for config module
      process.env.HOME = '/nonexistent/home';

      const result = await subagentParser.getAllSubagents('/nonexistent/project', '/nonexistent/home');

      expect(result.project).toEqual([]);
      expect(result.user).toEqual([]);
    });
  });
});
