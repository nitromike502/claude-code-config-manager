/**
 * Tests for CopyService.copyRule() method
 *
 * This test suite verifies rule file copying including validation,
 * conflict detection, nested directory handling, and edge cases.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const copyService = require('../../../src/backend/services/copy-service');
const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');

// Mock the projectDiscovery module
jest.mock('../../../src/backend/services/projectDiscovery');

describe('CopyService.copyRule()', () => {
  let tempDir;
  let sourceRulePath;
  let testProjectPath;
  let testProjectId;
  let originalHome;

  // Valid rule content (rules may or may not have YAML frontmatter)
  const validRuleContent = `---
description: React Standards
globs:
  - "src/**/*.tsx"
---

# React Standards

Always use functional components with hooks.
`;

  // Valid rule content without frontmatter
  const plainRuleContent = `# General Rules

Always write tests for new features.
`;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copy-service-rule-test-'));

    // Save and set HOME environment variable for config module
    originalHome = process.env.HOME;
    process.env.HOME = tempDir;

    // Create source rule file
    const sourceDir = path.join(tempDir, 'source', '.claude', 'rules');
    await fs.mkdir(sourceDir, { recursive: true });
    sourceRulePath = path.join(sourceDir, 'react.md');
    await fs.writeFile(sourceRulePath, validRuleContent, 'utf8');

    // Create test project
    testProjectPath = path.join(tempDir, 'test-project');
    testProjectId = 'testproject';
    await fs.mkdir(path.join(testProjectPath, '.claude', 'rules'), { recursive: true });

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
    // Restore HOME environment variable
    process.env.HOME = originalHome;
    jest.clearAllMocks();
    os.homedir.mockRestore();
  });

  describe('Success cases', () => {
    test('copies rule to user scope successfully', async () => {
      const userRulesDir = path.join(tempDir, '.claude', 'rules');
      await fs.mkdir(userRulesDir, { recursive: true });

      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'user',
        targetProjectId: null
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(userRulesDir, 'react.md'));

      // Verify file was copied with correct content
      const copiedContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(copiedContent).toBe(validRuleContent);
    });

    test('copies rule to project scope successfully', async () => {
      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(testProjectPath, '.claude', 'rules', 'react.md'));

      // Verify file was copied
      const copiedContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(copiedContent).toBe(validRuleContent);
    });

    test('copies rule without YAML frontmatter', async () => {
      const plainRulePath = path.join(tempDir, 'source', '.claude', 'rules', 'general.md');
      await fs.writeFile(plainRulePath, plainRuleContent, 'utf8');

      const request = {
        sourcePath: plainRulePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      const copiedContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(copiedContent).toBe(plainRuleContent);
    });

    test('creates parent directory if it does not exist', async () => {
      // Remove the rules directory
      await fs.rm(path.join(testProjectPath, '.claude', 'rules'), { recursive: true, force: true });

      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);

      // Verify directory was created
      const targetDir = path.dirname(result.copiedPath);
      const stats = await fs.stat(targetDir);
      expect(stats.isDirectory()).toBe(true);
    });

    test('preserves nested directory structure when copying rule', async () => {
      // Create nested source rule
      const nestedSourceDir = path.join(tempDir, 'source', '.claude', 'rules', 'frontend');
      await fs.mkdir(nestedSourceDir, { recursive: true });
      const nestedSourcePath = path.join(nestedSourceDir, 'react.md');
      await fs.writeFile(nestedSourcePath, validRuleContent, 'utf8');

      const request = {
        sourcePath: nestedSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(
        path.join(testProjectPath, '.claude', 'rules', 'frontend', 'react.md')
      );

      // Verify file was copied
      await expect(fs.access(result.copiedPath)).resolves.not.toThrow();
    });
  });

  describe('Conflict cases', () => {
    test('returns conflict when target file exists and no strategy provided', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'rules', 'react.md');
      const existingContent = '# Existing React Rules\nDo not modify.';
      await fs.writeFile(targetPath, existingContent, 'utf8');

      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(false);
      expect(result.conflict).toBeDefined();
      expect(result.conflict.targetPath).toBe(targetPath);
      expect(result.conflict.sourceModified).toBeDefined();
      expect(result.conflict.targetModified).toBeDefined();

      // Verify original file was not modified
      const targetContent = await fs.readFile(targetPath, 'utf8');
      expect(targetContent).toBe(existingContent);
    });

    test('skips copy when conflict strategy is "skip"', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'rules', 'react.md');
      const existingContent = '# Existing React Rules';
      await fs.writeFile(targetPath, existingContent, 'utf8');

      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'skip'
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.message).toBe('Copy cancelled by user');

      // Verify original file was not modified
      const targetContent = await fs.readFile(targetPath, 'utf8');
      expect(targetContent).toBe(existingContent);
    });

    test('overwrites existing file when conflict strategy is "overwrite"', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'rules', 'react.md');
      const existingContent = '# Existing React Rules';
      await fs.writeFile(targetPath, existingContent, 'utf8');

      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'overwrite'
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(targetPath);

      // Verify file was overwritten with new content
      const targetContent = await fs.readFile(targetPath, 'utf8');
      expect(targetContent).toBe(validRuleContent);
    });

    test('creates unique filename when conflict strategy is "rename"', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'rules', 'react.md');
      await fs.writeFile(targetPath, '# Existing', 'utf8');

      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'rename'
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(testProjectPath, '.claude', 'rules', 'react-2.md'));

      // Verify new file was created
      const newContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(newContent).toBe(validRuleContent);

      // Verify original file still exists
      await expect(fs.access(targetPath)).resolves.not.toThrow();
    });
  });

  describe('Validation failures', () => {
    test('returns error when source path is missing', async () => {
      const request = {
        sourcePath: null,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid source path');
    });

    test('returns error when source file does not exist', async () => {
      const request = {
        sourcePath: path.join(tempDir, 'nonexistent.md'),
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Source file not found');
    });

    test('returns error when source file is empty', async () => {
      const emptyRulePath = path.join(tempDir, 'empty-rule.md');
      await fs.writeFile(emptyRulePath, '', 'utf8');

      const request = {
        sourcePath: emptyRulePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('file is empty');
    });

    test('returns error when project ID is invalid', async () => {
      discoverProjects.mockResolvedValue({
        projects: {} // No projects
      });

      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'project',
        targetProjectId: 'nonexistent'
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project not found');
    });

    test('returns error when source contains path traversal', async () => {
      const request = {
        sourcePath: '/path/to/../../../etc/passwd',
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });
  });

  describe('Nested directory handling', () => {
    test('preserves single-level nesting', async () => {
      const nestedSourceDir = path.join(tempDir, 'source', '.claude', 'rules', 'frontend');
      await fs.mkdir(nestedSourceDir, { recursive: true });
      const nestedSourcePath = path.join(nestedSourceDir, 'vue.md');
      await fs.writeFile(nestedSourcePath, validRuleContent, 'utf8');

      const request = {
        sourcePath: nestedSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toContain(path.join('rules', 'frontend', 'vue.md'));
    });

    test('preserves multi-level nesting', async () => {
      const deepSourceDir = path.join(tempDir, 'source', '.claude', 'rules', 'frontend', 'react', 'hooks');
      await fs.mkdir(deepSourceDir, { recursive: true });
      const deepSourcePath = path.join(deepSourceDir, 'use-effect.md');
      await fs.writeFile(deepSourcePath, validRuleContent, 'utf8');

      const request = {
        sourcePath: deepSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toContain(path.join('rules', 'frontend', 'react', 'hooks', 'use-effect.md'));
    });

    test('creates nested directories in target if they do not exist', async () => {
      const nestedSourceDir = path.join(tempDir, 'source', '.claude', 'rules', 'backend');
      await fs.mkdir(nestedSourceDir, { recursive: true });
      const nestedSourcePath = path.join(nestedSourceDir, 'api.md');
      await fs.writeFile(nestedSourcePath, validRuleContent, 'utf8');

      const request = {
        sourcePath: nestedSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);

      // Verify nested directory was created
      const nestedTargetDir = path.join(testProjectPath, '.claude', 'rules', 'backend');
      const stats = await fs.stat(nestedTargetDir);
      expect(stats.isDirectory()).toBe(true);
    });

    test('handles rule with no nesting (root level)', async () => {
      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(
        path.join(testProjectPath, '.claude', 'rules', 'react.md')
      );
    });

    test('handles conflict in nested directory with rename strategy', async () => {
      // Create nested target structure with existing file
      const nestedTargetDir = path.join(testProjectPath, '.claude', 'rules', 'frontend');
      await fs.mkdir(nestedTargetDir, { recursive: true });
      const existingPath = path.join(nestedTargetDir, 'react.md');
      await fs.writeFile(existingPath, 'existing', 'utf8');

      // Create nested source
      const nestedSourceDir = path.join(tempDir, 'source', '.claude', 'rules', 'frontend');
      await fs.mkdir(nestedSourceDir, { recursive: true });
      const nestedSourcePath = path.join(nestedSourceDir, 'react.md');
      await fs.writeFile(nestedSourcePath, validRuleContent, 'utf8');

      const request = {
        sourcePath: nestedSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'rename'
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(nestedTargetDir, 'react-2.md'));
    });
  });

  describe('Copy scopes', () => {
    test('copies from project to user scope', async () => {
      const userRulesDir = path.join(tempDir, '.claude', 'rules');
      await fs.mkdir(userRulesDir, { recursive: true });

      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'user',
        targetProjectId: null
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(userRulesDir, 'react.md'));
    });

    test('copies from user to project scope', async () => {
      // Create user-level source rule
      const userSourceDir = path.join(tempDir, '.claude', 'rules');
      await fs.mkdir(userSourceDir, { recursive: true });
      const userSourcePath = path.join(userSourceDir, 'global-rule.md');
      await fs.writeFile(userSourcePath, plainRuleContent, 'utf8');

      const request = {
        sourcePath: userSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(
        path.join(testProjectPath, '.claude', 'rules', 'global-rule.md')
      );
    });

    test('copies from project to project scope', async () => {
      // Create second test project
      const secondProjectPath = path.join(tempDir, 'second-project');
      const secondProjectId = 'secondproject';
      await fs.mkdir(path.join(secondProjectPath, '.claude', 'rules'), { recursive: true });

      discoverProjects.mockResolvedValue({
        projects: {
          [testProjectId]: { path: testProjectPath, exists: true },
          [secondProjectId]: { path: secondProjectPath, exists: true }
        }
      });

      const request = {
        sourcePath: sourceRulePath,
        targetScope: 'project',
        targetProjectId: secondProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(
        path.join(secondProjectPath, '.claude', 'rules', 'react.md')
      );
    });
  });

  describe('Edge cases', () => {
    test('preserves special characters in filename', async () => {
      const specialCharsPath = path.join(tempDir, 'source', '.claude', 'rules', 'rule-with-special_chars-123.md');
      await fs.writeFile(specialCharsPath, validRuleContent, 'utf8');

      const request = {
        sourcePath: specialCharsPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toContain('rule-with-special_chars-123.md');
    });

    test('handles rule path without "rules" directory in source', async () => {
      // Create rule file outside of rules directory
      const weirdPath = path.join(tempDir, 'weird-location', 'rule.md');
      await fs.mkdir(path.dirname(weirdPath), { recursive: true });
      await fs.writeFile(weirdPath, validRuleContent, 'utf8');

      const request = {
        sourcePath: weirdPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(true);
      // Should place at root of rules directory (no nesting)
      expect(result.copiedPath).toBe(
        path.join(testProjectPath, '.claude', 'rules', 'rule.md')
      );
    });

    test('handles whitespace-only file as empty', async () => {
      const whitespaceRulePath = path.join(tempDir, 'whitespace-rule.md');
      await fs.writeFile(whitespaceRulePath, '   \n  \n  ', 'utf8');

      const request = {
        sourcePath: whitespaceRulePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyRule(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('file is empty');
    });
  });
});

describe('CopyService.buildTargetPath() - Rule type', () => {
  let originalHome;

  beforeEach(() => {
    originalHome = process.env.HOME;
    process.env.HOME = os.homedir();

    discoverProjects.mockResolvedValue({
      projects: {
        'homeusermyproject': {
          id: 'homeusermyproject',
          path: '/home/user/myproject',
          name: 'myproject',
          exists: true,
          config: {}
        }
      },
      error: null
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.HOME = originalHome;
  });

  test('should build user rule path (root level)', async () => {
    const result = await copyService.buildTargetPath('rule', 'user', null, '/source/rules/my-rule.md');
    const expected = path.join(os.homedir(), '.claude', 'rules', 'my-rule.md');
    expect(result).toBe(expected);
  });

  test('should build project rule path (root level)', async () => {
    const result = await copyService.buildTargetPath('rule', 'project', 'homeusermyproject', '/source/rules/my-rule.md');
    const expected = path.join('/home/user/myproject', '.claude', 'rules', 'my-rule.md');
    expect(result).toBe(expected);
  });

  test('should preserve nested rule path (one level)', async () => {
    const sourcePath = '/home/user/project/.claude/rules/frontend/react.md';
    const result = await copyService.buildTargetPath('rule', 'user', null, sourcePath);
    const expected = path.join(os.homedir(), '.claude', 'rules', 'frontend', 'react.md');
    expect(result).toBe(expected);
  });

  test('should preserve nested rule path (multiple levels)', async () => {
    const sourcePath = '/home/user/project/.claude/rules/frontend/react/hooks.md';
    const result = await copyService.buildTargetPath('rule', 'user', null, sourcePath);
    const expected = path.join(os.homedir(), '.claude', 'rules', 'frontend', 'react', 'hooks.md');
    expect(result).toBe(expected);
  });

  test('should handle rule without nested path', async () => {
    const sourcePath = '/home/user/my-rule.md';
    const result = await copyService.buildTargetPath('rule', 'user', null, sourcePath);
    const expected = path.join(os.homedir(), '.claude', 'rules', 'my-rule.md');
    expect(result).toBe(expected);
  });

  test('should accept rule as valid config type', async () => {
    await expect(
      copyService.buildTargetPath('rule', 'user', null, '/source/rule.md')
    ).resolves.toBeDefined();
  });
});
