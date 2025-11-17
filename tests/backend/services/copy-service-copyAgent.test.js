/**
 * Tests for CopyService.copyAgent() method
 *
 * This test suite verifies agent file copying including validation,
 * conflict detection, conflict resolution strategies, and edge cases.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const copyService = require('../../../src/backend/services/copy-service');
const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');

// Mock the projectDiscovery module
jest.mock('../../../src/backend/services/projectDiscovery');

describe('CopyService.copyAgent()', () => {
  let tempDir;
  let sourceAgentPath;
  let testProjectPath;
  let testProjectId;

  // Valid agent content
  const validAgentContent = `---
name: test-agent
description: Test agent for copy testing
tools: [Read, Write, Bash]
model: sonnet
color: blue
---

# Test Agent

This is a test agent for copy service testing.
`;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copy-service-agent-test-'));

    // Create source agent file
    const sourceDir = path.join(tempDir, 'source', '.claude', 'agents');
    await fs.mkdir(sourceDir, { recursive: true });
    sourceAgentPath = path.join(sourceDir, 'test-agent.md');
    await fs.writeFile(sourceAgentPath, validAgentContent, 'utf8');

    // Create test project
    testProjectPath = path.join(tempDir, 'test-project');
    testProjectId = 'testproject';
    await fs.mkdir(path.join(testProjectPath, '.claude', 'agents'), { recursive: true });

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
    test('copies agent to user scope successfully', async () => {
      const userClaudeDir = path.join(tempDir, '.claude', 'agents');
      await fs.mkdir(userClaudeDir, { recursive: true });

      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'user',
        targetProjectId: null
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(userClaudeDir, 'test-agent.md'));

      // Verify file was copied with correct content
      const copiedContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(copiedContent).toBe(validAgentContent);
    });

    test('copies agent to project scope successfully', async () => {
      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(testProjectPath, '.claude', 'agents', 'test-agent.md'));

      // Verify file was copied
      const copiedContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(copiedContent).toBe(validAgentContent);
    });

    test('creates parent directory if it does not exist', async () => {
      // Remove the agents directory
      await fs.rm(path.join(testProjectPath, '.claude', 'agents'), { recursive: true, force: true });

      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(true);

      // Verify directory was created
      const targetDir = path.dirname(result.copiedPath);
      const stats = await fs.stat(targetDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('Conflict cases', () => {
    test('returns conflict when target file exists and no strategy provided', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'agents', 'test-agent.md');
      const existingContent = '---\nname: existing\n---\nExisting agent';
      await fs.writeFile(targetPath, existingContent, 'utf8');

      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

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
      const targetPath = path.join(testProjectPath, '.claude', 'agents', 'test-agent.md');
      const existingContent = '---\nname: existing\n---\nExisting agent';
      await fs.writeFile(targetPath, existingContent, 'utf8');

      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'skip'
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.message).toBe('Copy cancelled by user');

      // Verify original file was not modified
      const targetContent = await fs.readFile(targetPath, 'utf8');
      expect(targetContent).toBe(existingContent);
    });

    test('overwrites existing file when conflict strategy is "overwrite"', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'agents', 'test-agent.md');
      const existingContent = '---\nname: existing\n---\nExisting agent';
      await fs.writeFile(targetPath, existingContent, 'utf8');

      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'overwrite'
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(targetPath);

      // Verify file was overwritten with new content
      const targetContent = await fs.readFile(targetPath, 'utf8');
      expect(targetContent).toBe(validAgentContent);
    });

    test('creates unique filename when conflict strategy is "rename"', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'agents', 'test-agent.md');
      await fs.writeFile(targetPath, '---\nname: existing\n---\nExisting', 'utf8');

      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'rename'
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(testProjectPath, '.claude', 'agents', 'test-agent-2.md'));

      // Verify new file was created
      const newContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(newContent).toBe(validAgentContent);

      // Verify original file still exists
      await expect(fs.access(targetPath)).resolves.not.toThrow();
    });

    test('generates unique filename with incremented counter', async () => {
      // Create multiple existing files
      const targetDir = path.join(testProjectPath, '.claude', 'agents');
      await fs.writeFile(path.join(targetDir, 'test-agent.md'), 'existing 1', 'utf8');
      await fs.writeFile(path.join(targetDir, 'test-agent-2.md'), 'existing 2', 'utf8');
      await fs.writeFile(path.join(targetDir, 'test-agent-3.md'), 'existing 3', 'utf8');

      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'rename'
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBe(path.join(targetDir, 'test-agent-4.md'));
    });
  });

  describe('Validation failures', () => {
    test('returns error when source path is missing', async () => {
      const request = {
        sourcePath: null,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid source path');
    });

    test('returns error when source file does not exist', async () => {
      const request = {
        sourcePath: path.join(tempDir, 'nonexistent.md'),
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Source file not found');
    });

    test('returns error when source file has no YAML frontmatter', async () => {
      const invalidAgentPath = path.join(tempDir, 'invalid-agent.md');
      await fs.writeFile(invalidAgentPath, 'No frontmatter here', 'utf8');

      const request = {
        sourcePath: invalidAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing YAML frontmatter');
    });

    test('returns error when YAML frontmatter is malformed', async () => {
      const malformedAgentPath = path.join(tempDir, 'malformed-agent.md');
      await fs.writeFile(malformedAgentPath, '---\nname: test\n\nNo closing delimiter', 'utf8');

      const request = {
        sourcePath: malformedAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing YAML frontmatter');
    });

    test('returns error when project ID is invalid', async () => {
      discoverProjects.mockResolvedValue({
        projects: {} // No projects
      });

      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'project',
        targetProjectId: 'nonexistent'
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project not found');
    });

    test('returns error when source contains path traversal', async () => {
      const request = {
        sourcePath: '/path/to/../../../etc/passwd',
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });
  });

  describe('Edge cases', () => {
    test('handles agent file with only frontmatter (no content)', async () => {
      const onlyFrontmatterPath = path.join(tempDir, 'only-frontmatter.md');
      await fs.writeFile(onlyFrontmatterPath, '---\nname: minimal\n---\n', 'utf8');

      const request = {
        sourcePath: onlyFrontmatterPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(true);

      // Verify file was copied correctly
      const copiedContent = await fs.readFile(result.copiedPath, 'utf8');
      expect(copiedContent).toBe('---\nname: minimal\n---\n');
    });

    test('preserves special characters in filename', async () => {
      const specialCharsPath = path.join(tempDir, 'agent-with-special-chars_123.md');
      await fs.writeFile(specialCharsPath, validAgentContent, 'utf8');

      const request = {
        sourcePath: specialCharsPath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toContain('agent-with-special-chars_123.md');
    });

    test('handles very large agent file', async () => {
      const largeContent = validAgentContent + '\n' + 'x'.repeat(1000000); // ~1MB
      const largePath = path.join(tempDir, 'large-agent.md');
      await fs.writeFile(largePath, largeContent, 'utf8');

      const request = {
        sourcePath: largePath,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(true);

      // Verify file size matches
      const sourceStat = await fs.stat(largePath);
      const targetStat = await fs.stat(result.copiedPath);
      expect(targetStat.size).toBe(sourceStat.size);
    });

    test('returns error when source equals target (same path)', async () => {
      // Create agent in project's .claude/agents directory
      const samePathAgent = path.join(testProjectPath, '.claude', 'agents', 'same.md');
      await fs.writeFile(samePathAgent, validAgentContent, 'utf8');

      const request = {
        sourcePath: samePathAgent,
        targetScope: 'project',
        targetProjectId: testProjectId
      };

      const result = await copyService.copyAgent(request);

      // Should detect conflict (file already exists)
      expect(result.success).toBe(false);
      expect(result.conflict).toBeDefined();
    });
  });

  describe('Conflict strategy edge cases', () => {
    test('returns error for unknown conflict strategy', async () => {
      // Create existing target file
      const targetPath = path.join(testProjectPath, '.claude', 'agents', 'test-agent.md');
      await fs.writeFile(targetPath, 'existing', 'utf8');

      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'unknown-strategy'
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown conflict strategy');
    });

    test('no conflict when target file does not exist (strategy ignored)', async () => {
      const request = {
        sourcePath: sourceAgentPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'overwrite' // Strategy should be ignored
      };

      const result = await copyService.copyAgent(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toBeDefined();
    });
  });
});
