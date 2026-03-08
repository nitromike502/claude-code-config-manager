/**
 * Unit tests for rulesParser
 * Tests parsing of rule markdown files with optional YAML frontmatter
 */

const rulesParser = require('../../../src/backend/parsers/rulesParser');
const path = require('path');

describe('rulesParser', () => {
  const fixturesPath = path.join(__dirname, '../../fixtures/projects/valid-project/.claude/rules');
  const malformedPath = path.join(__dirname, '../../fixtures/projects/malformed-project/.claude/rules');

  let originalHome;

  beforeEach(() => {
    originalHome = process.env.HOME;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
  });

  describe('extractDescription()', () => {
    test('should extract text from # heading', () => {
      const result = rulesParser.extractDescription('# My Rule\n\nSome content.');
      expect(result).toBe('My Rule');
    });

    test('should extract text from ## heading', () => {
      const result = rulesParser.extractDescription('## Sub Heading\n\nContent here.');
      expect(result).toBe('Sub Heading');
    });

    test('should fall back to first non-empty line when no heading', () => {
      const result = rulesParser.extractDescription('No heading here\n\nMore content.');
      expect(result).toBe('No heading here');
    });

    test('should return empty string for empty content', () => {
      expect(rulesParser.extractDescription('')).toBe('');
      expect(rulesParser.extractDescription(null)).toBe('');
      expect(rulesParser.extractDescription('   ')).toBe('');
    });

    test('should skip blank lines before first content', () => {
      const result = rulesParser.extractDescription('\n\n# My Rule\n\nContent.');
      expect(result).toBe('My Rule');
    });

    test('should strip multiple # markers from heading', () => {
      const result = rulesParser.extractDescription('### Deep Heading');
      expect(result).toBe('Deep Heading');
    });
  });

  describe('findMarkdownFiles()', () => {
    test('should find .md files in directory and subdirectories', async () => {
      const files = await rulesParser.findMarkdownFiles(fixturesPath);

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      files.forEach(f => expect(f).toMatch(/\.md$/));
    });

    test('should return empty array for missing directory', async () => {
      const files = await rulesParser.findMarkdownFiles('/nonexistent/path/to/rules');

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBe(0);
    });

    test('should find files in nested subdirectories', async () => {
      const files = await rulesParser.findMarkdownFiles(fixturesPath);

      const nestedFiles = files.filter(f => f.includes('frontend'));
      expect(nestedFiles.length).toBeGreaterThan(0);
    });

    test('should find all expected fixture files', async () => {
      const files = await rulesParser.findMarkdownFiles(fixturesPath);
      const basenames = files.map(f => path.basename(f));

      expect(basenames).toContain('coding-standards.md');
      expect(basenames).toContain('testing.md');
      expect(basenames).toContain('empty-paths.md');
      expect(basenames).toContain('react.md');
      expect(basenames).toContain('vue.md');
    });
  });

  describe('parseRule()', () => {
    test('should parse unconditional rule with no frontmatter', async () => {
      const filePath = path.join(fixturesPath, 'coding-standards.md');
      const result = await rulesParser.parseRule(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('coding-standards');
      expect(result.description).toBe('Coding Standards');
      expect(result.paths).toBeNull();
      expect(result.isConditional).toBe(false);
      expect(result.hasError).toBe(false);
      expect(result.parseError).toBeNull();
      expect(result.scope).toBe('project');
      expect(result.filePath).toBe(filePath);
    });

    test('should parse conditional rule with paths array', async () => {
      const filePath = path.join(fixturesPath, 'frontend/react.md');
      const result = await rulesParser.parseRule(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.paths).toEqual(['src/**/*.jsx', 'src/**/*.tsx']);
      expect(result.isConditional).toBe(true);
      expect(result.hasError).toBe(false);
    });

    test('should treat empty paths array as unconditional', async () => {
      const filePath = path.join(fixturesPath, 'empty-paths.md');
      const result = await rulesParser.parseRule(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.paths).toBeNull();
      expect(result.isConditional).toBe(false);
      expect(result.hasError).toBe(false);
    });

    test('should ignore non-paths frontmatter fields', async () => {
      const filePath = path.join(fixturesPath, 'testing.md');
      const result = await rulesParser.parseRule(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.paths).toBeNull();
      expect(result.isConditional).toBe(false);
      expect(result.description).toBe('Testing Standards');
    });

    test('should include subdirectory in name for nested rules', async () => {
      const filePath = path.join(fixturesPath, 'frontend/react.md');
      const result = await rulesParser.parseRule(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('frontend/react');
    });

    test('should handle invalid YAML with hasError=true', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const filePath = path.join(malformedPath, 'bad-yaml.md');
      const result = await rulesParser.parseRule(filePath, malformedPath, 'project');

      expect(result).not.toBeNull();
      expect(result.hasError).toBe(true);
      expect(result.parseError).toBeDefined();
      expect(result.parseError).not.toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('YAML parsing error'),
        expect.any(String)
      );

      consoleWarnSpy.mockRestore();
    });

    test('should handle empty file gracefully', async () => {
      const filePath = path.join(malformedPath, 'empty.md');
      const result = await rulesParser.parseRule(filePath, malformedPath, 'project');

      expect(result).not.toBeNull();
      expect(result.name).toBe('empty');
      expect(result.description).toBe('');
      expect(result.paths).toBeNull();
      expect(result.isConditional).toBe(false);
      expect(result.hasError).toBe(false);
    });

    test('should default scope to "project"', async () => {
      const filePath = path.join(fixturesPath, 'coding-standards.md');
      const result = await rulesParser.parseRule(filePath, fixturesPath);

      expect(result.scope).toBe('project');
    });

    test('should respect scope parameter when "user"', async () => {
      const filePath = path.join(fixturesPath, 'coding-standards.md');
      const result = await rulesParser.parseRule(filePath, fixturesPath, 'user');

      expect(result.scope).toBe('user');
    });

    test('should return error object for nonexistent file', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const filePath = path.join(fixturesPath, 'nonexistent.md');
      const result = await rulesParser.parseRule(filePath, fixturesPath, 'project');

      expect(result).not.toBeNull();
      expect(result.hasError).toBe(true);
      expect(result.parseError).toBeDefined();

      consoleErrorSpy.mockRestore();
    });

    test('should return complete rule object structure', async () => {
      const filePath = path.join(fixturesPath, 'coding-standards.md');
      const result = await rulesParser.parseRule(filePath, fixturesPath, 'project');

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('paths');
      expect(result).toHaveProperty('isConditional');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('scope');
      expect(result).toHaveProperty('hasError');
      expect(result).toHaveProperty('parseError');
    });

    test('should include content without frontmatter markers', async () => {
      const filePath = path.join(fixturesPath, 'frontend/vue.md');
      const result = await rulesParser.parseRule(filePath, fixturesPath, 'project');

      expect(result.content).toContain('Vue Guidelines');
      expect(result.content).not.toContain('---');
    });
  });

  describe('parseAllRules()', () => {
    test('should parse multiple rules and return { rules, warnings }', async () => {
      const result = await rulesParser.parseAllRules(fixturesPath, 'project');

      expect(result).toHaveProperty('rules');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.rules)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.rules.length).toBeGreaterThan(0);
    });

    test('should return { rules: [], warnings: [] } for missing directory', async () => {
      const result = await rulesParser.parseAllRules('/nonexistent/rules/path', 'project');

      expect(result.rules).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('should include rules from subdirectories', async () => {
      const result = await rulesParser.parseAllRules(fixturesPath, 'project');

      const nestedRule = result.rules.find(r => r.name.includes('/'));
      expect(nestedRule).toBeDefined();
    });

    test('should include all files from malformed directory including bad-yaml', async () => {
      // Note: gray-matter caches failed YAML parse results, so first call to
      // parseRule for a given bad file generates a warning, subsequent calls do not.
      // The parseRule() tests cover the warning/error behavior directly.
      // Here we verify parseAllRules includes all files without silently dropping them.
      const result = await rulesParser.parseAllRules(malformedPath, 'project');

      expect(result.rules.length).toBeGreaterThan(0);
      const badYamlRule = result.rules.find(r => r.name === 'bad-yaml');
      expect(badYamlRule).toBeDefined();
      const emptyRule = result.rules.find(r => r.name === 'empty');
      expect(emptyRule).toBeDefined();
    });

    test('should assign scope to all rules', async () => {
      const result = await rulesParser.parseAllRules(fixturesPath, 'user');

      result.rules.forEach(rule => {
        expect(rule.scope).toBe('user');
      });
    });
  });

  describe('getAllRules()', () => {
    test('should return object with project and user arrays', async () => {
      const projectPath = path.join(__dirname, '../../fixtures/projects/valid-project');
      process.env.HOME = path.join(__dirname, '../../fixtures/user');

      const result = await rulesParser.getAllRules(projectPath);

      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('user');
      expect(Array.isArray(result.project)).toBe(true);
      expect(Array.isArray(result.user)).toBe(true);
    });

    test('should handle missing project rules directory gracefully', async () => {
      process.env.HOME = '/nonexistent/home';

      const result = await rulesParser.getAllRules('/nonexistent/project');

      expect(result.project).toEqual([]);
      expect(result.user).toEqual([]);
    });

    test('should return project rules scoped as "project"', async () => {
      const projectPath = path.join(__dirname, '../../fixtures/projects/valid-project');
      process.env.HOME = '/nonexistent/home';

      const result = await rulesParser.getAllRules(projectPath);

      result.project.forEach(rule => {
        expect(rule.scope).toBe('project');
      });
    });
  });
});
