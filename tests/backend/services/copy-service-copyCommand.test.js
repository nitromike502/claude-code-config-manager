/**
 * Tests for CopyService.copyCommand() method
 *
 * This test suite verifies command file copying including validation,
 * conflict detection, nested directory handling, and edge cases.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const copyService = require('../../../src/backend/services/copy-service');
const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');

// Mock the projectDiscovery module
jest.mock('../../../src/backend/services/projectDiscovery');

describe('CopyService.copyCommand()', () => {
  let tempDir;
  let sourceCommandPath;
  let testProjectPath;
  let testProjectId;

  // Valid command content
  const validCommandContent = `---
name: test-command
description: Test command for copy testing
---

# Test Command

This is a test command for copy service testing.
`;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copy-service-command-test-'));

    // Create source command file
    const sourceDir = path.join(tempDir, 'source', '.claude', 'commands');
    await fs.mkdir(sourceDir, { recursive: true });
    sourceCommandPath = path.join(sourceDir, 'test-command.md');
    await fs.writeFile(sourceCommandPath, validCommandContent, 'utf8');

    // Create test project
    testProjectPath = path.join(tempDir, 'test-project');
    testProjectId = 'testproject';
    await fs.mkdir(path.join(testProjectPath, '.claude', 'commands'), { recursive: true });

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
    test('copies command to user scope successfully', async () => {
      const userClaudeDir = path.join(tempDir, '.claude', 'commands');
      await fs.mkdir(userClaudeDir, { recursive: true });

      const request = {
        sourcePath: sourceCommandPath,
        targetScope: 'user',
        targetProjectId: null
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(userClaudeDir, 'test-command.md'));

      // Verify file was copied with correct content
      const copiedContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(copiedContent).toBe(validCommandContent);
    });

    test('copies command to project scope successfully', async () => {
      const request = {
        sourcePath: sourceCommandPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(testProjectPath, '.claude', 'commands', 'test-command.md'));

      // Verify file was copied
      const copiedContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(copiedContent).toBe(validCommandContent);
    });

    test('creates parent directory if it does not exist', async () => {
      // Remove the commands directory
      await fs.rm(path.join(testProjectPath, '.claude', 'commands'), { recursive: true, force: true });

      const request = {
        sourcePath: sourceCommandPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);

      // Verify directory was created
      const targetDir = path.dirname(result.copiedPath);
      const stats = await fs.stat(targetDir);
      expect(stats.isDirectory()).toBe(true);
    });

    test('preserves nested directory structure when copying command', async () => {
      // Create nested source command
      const nestedSourceDir = path.join(tempDir, 'source', '.claude', 'commands', 'git', 'hooks');
      await fs.mkdir(nestedSourceDir, { recursive: true });
      const nestedSourcePath = path.join(nestedSourceDir, 'pre-commit.md');
      await fs.writeFile(nestedSourcePath, validCommandContent, 'utf8');

      const request = {
        sourcePath: nestedSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(
        path.join(testProjectPath, '.claude', 'commands', 'git', 'hooks', 'pre-commit.md')
      );

      // Verify file was copied
      await expect(fs.access(result.copiedPath)).resolves.not.toThrow();
    });
  });

  describe('Conflict cases', () => {
    test('returns conflict when target file exists and no strategy provided', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'commands', 'test-command.md');
      const existingContent = '---\nname: existing\n---\nExisting command';
      await fs.writeFile(targetPath, existingContent, 'utf8');

      const request = {
        sourcePath: sourceCommandPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

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
      const targetPath = path.join(testProjectPath, '.claude', 'commands', 'test-command.md');
      const existingContent = '---\nname: existing\n---\nExisting command';
      await fs.writeFile(targetPath, existingContent, 'utf8');

      const request = {
        sourcePath: sourceCommandPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'skip'
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.message).toBe('Copy cancelled by user');

      // Verify original file was not modified
      const targetContent = await fs.readFile(targetPath, 'utf8');
      expect(targetContent).toBe(existingContent);
    });

    test('overwrites existing file when conflict strategy is "overwrite"', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'commands', 'test-command.md');
      const existingContent = '---\nname: existing\n---\nExisting command';
      await fs.writeFile(targetPath, existingContent, 'utf8');

      const request = {
        sourcePath: sourceCommandPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'overwrite'
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(targetPath);

      // Verify file was overwritten with new content
      const targetContent = await fs.readFile(targetPath, 'utf8');
      expect(targetContent).toBe(validCommandContent);
    });

    test('creates unique filename when conflict strategy is "rename"', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'commands', 'test-command.md');
      await fs.writeFile(targetPath, '---\nname: existing\n---\nExisting', 'utf8');

      const request = {
        sourcePath: sourceCommandPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'rename'
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(testProjectPath, '.claude', 'commands', 'test-command-2.md'));

      // Verify new file was created
      const newContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(newContent).toBe(validCommandContent);

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

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid source path');
    });

    test('returns error when source file does not exist', async () => {
      const request = {
        sourcePath: path.join(tempDir, 'nonexistent.md'),
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Source file not found');
    });

    test('returns error when source file has no YAML frontmatter', async () => {
      const invalidCommandPath = path.join(tempDir, 'invalid-command.md');
      await fs.writeFile(invalidCommandPath, 'No frontmatter here', 'utf8');

      const request = {
        sourcePath: invalidCommandPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing YAML frontmatter');
    });

    test('returns error when YAML frontmatter is malformed', async () => {
      const malformedCommandPath = path.join(tempDir, 'malformed-command.md');
      await fs.writeFile(malformedCommandPath, '---\nname: test\n\nNo closing delimiter', 'utf8');

      const request = {
        sourcePath: malformedCommandPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing YAML frontmatter');
    });

    test('returns error when project ID is invalid', async () => {
      discoverProjects.mockResolvedValue({
        projects: {} // No projects
      });

      const request = {
        sourcePath: sourceCommandPath,
        targetScope: 'project',
        targetProjectId: 'nonexistent'
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project not found');
    });

    test('returns error when source contains path traversal', async () => {
      const request = {
        sourcePath: '/path/to/../../../etc/passwd',
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });
  });

  describe('Nested directory handling', () => {
    test('preserves single-level nesting', async () => {
      const nestedSourceDir = path.join(tempDir, 'source', '.claude', 'commands', 'git');
      await fs.mkdir(nestedSourceDir, { recursive: true });
      const nestedSourcePath = path.join(nestedSourceDir, 'commit.md');
      await fs.writeFile(nestedSourcePath, validCommandContent, 'utf8');

      const request = {
        sourcePath: nestedSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toContain(path.join('commands', 'git', 'commit.md'));
    });

    test('preserves multi-level nesting', async () => {
      const deepSourceDir = path.join(tempDir, 'source', '.claude', 'commands', 'git', 'hooks', 'pre');
      await fs.mkdir(deepSourceDir, { recursive: true });
      const deepSourcePath = path.join(deepSourceDir, 'validate.md');
      await fs.writeFile(deepSourcePath, validCommandContent, 'utf8');

      const request = {
        sourcePath: deepSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toContain(path.join('commands', 'git', 'hooks', 'pre', 'validate.md'));
    });

    test('creates nested directories in target if they do not exist', async () => {
      const nestedSourceDir = path.join(tempDir, 'source', '.claude', 'commands', 'git');
      await fs.mkdir(nestedSourceDir, { recursive: true });
      const nestedSourcePath = path.join(nestedSourceDir, 'commit.md');
      await fs.writeFile(nestedSourcePath, validCommandContent, 'utf8');

      // Ensure nested target directory does not exist
      const nestedTargetDir = path.join(testProjectPath, '.claude', 'commands', 'git');
      await fs.rm(nestedTargetDir, { recursive: true, force: true });

      const request = {
        sourcePath: nestedSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);

      // Verify nested directory was created
      const stats = await fs.stat(nestedTargetDir);
      expect(stats.isDirectory()).toBe(true);
    });

    test('handles command with no nesting (root level)', async () => {
      const request = {
        sourcePath: sourceCommandPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(
        path.join(testProjectPath, '.claude', 'commands', 'test-command.md')
      );
    });

    test('handles conflict in nested directory with rename strategy', async () => {
      // Create nested target structure with existing file
      const nestedTargetDir = path.join(testProjectPath, '.claude', 'commands', 'git');
      await fs.mkdir(nestedTargetDir, { recursive: true });
      const existingPath = path.join(nestedTargetDir, 'commit.md');
      await fs.writeFile(existingPath, 'existing', 'utf8');

      // Create nested source
      const nestedSourceDir = path.join(tempDir, 'source', '.claude', 'commands', 'git');
      await fs.mkdir(nestedSourceDir, { recursive: true });
      const nestedSourcePath = path.join(nestedSourceDir, 'commit.md');
      await fs.writeFile(nestedSourcePath, validCommandContent, 'utf8');

      const request = {
        sourcePath: nestedSourcePath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'rename'
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(nestedTargetDir, 'commit-2.md'));
    });
  });

  describe('Edge cases', () => {
    test('handles command file with only frontmatter (no content)', async () => {
      const onlyFrontmatterPath = path.join(tempDir, 'only-frontmatter.md');
      await fs.writeFile(onlyFrontmatterPath, '---\nname: minimal\n---\n', 'utf8');

      const request = {
        sourcePath: onlyFrontmatterPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);

      // Verify file was copied correctly
      const copiedContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(copiedContent).toBe('---\nname: minimal\n---\n');
    });

    test('preserves special characters in filename', async () => {
      const specialCharsPath = path.join(tempDir, 'command-with-special-chars_123.md');
      await fs.writeFile(specialCharsPath, validCommandContent, 'utf8');

      const request = {
        sourcePath: specialCharsPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toContain('command-with-special-chars_123.md');
    });

    test('handles command path without "commands" directory in source', async () => {
      // Create command file outside of commands directory
      const weirdPath = path.join(tempDir, 'weird-location', 'command.md');
      await fs.mkdir(path.dirname(weirdPath), { recursive: true });
      await fs.writeFile(weirdPath, validCommandContent, 'utf8');

      const request = {
        sourcePath: weirdPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyCommand(request);

      expect(result.success).toBe(true);
      // Should place at root of commands directory (no nesting)
      expect(result.copiedPath).toBe(
        path.join(testProjectPath, '.claude', 'commands', 'command.md')
      );
    });
  });
});
