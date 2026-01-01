/**
 * Tests for CopyService.copySkill() method
 *
 * This test suite verifies skill directory copying including validation,
 * external reference detection, conflict resolution, and edge cases.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const copyService = require('../../../src/backend/services/copy-service');
const { discoverProjects } = require('../../../src/backend/services/projectDiscovery');

// Mock the projectDiscovery module
jest.mock('../../../src/backend/services/projectDiscovery');

describe('CopyService.copySkill()', () => {
  let tempDir;
  let sourceSkillPath;
  let testProjectPath;
  let testProjectId;
  let originalHome;

  // Valid skill content
  const validSkillContent = `---
name: test-skill
description: Test skill for copy testing
allowed-tools:
  - Read
  - Write
  - Bash
---

# Test Skill

This is a test skill for copy service testing.

## Usage

Run the skill with Claude Code.
`;

  // Skill content with external references
  const externalRefsContent = `---
name: external-skill
description: Skill with external references
---

# External Skill

Run external script:
\`\`\`bash
node ../shared/common.js
python ~/scripts/helper.py
\`\`\`
`;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copy-service-skill-test-'));

    // Save and set HOME environment variable for config module
    originalHome = process.env.HOME;
    process.env.HOME = tempDir;

    // Create source skill directory
    const sourceDir = path.join(tempDir, 'source', '.claude', 'skills', 'test-skill');
    await fs.mkdir(sourceDir, { recursive: true });
    sourceSkillPath = sourceDir;
    await fs.writeFile(path.join(sourceDir, 'SKILL.md'), validSkillContent, 'utf8');
    await fs.writeFile(path.join(sourceDir, 'helper.js'), '// Helper script', 'utf8');

    // Create test project
    testProjectPath = path.join(tempDir, 'test-project');
    testProjectId = 'testproject';
    await fs.mkdir(path.join(testProjectPath, '.claude', 'skills'), { recursive: true });

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
    test('copies skill to user scope successfully', async () => {
      const userSkillsDir = path.join(tempDir, '.claude', 'skills');
      await fs.mkdir(userSkillsDir, { recursive: true });

      const request = {
        sourceSkillPath: sourceSkillPath,
        targetScope: 'user',
        conflictStrategy: 'skip'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toContain('.claude/skills/test-skill');
      expect(result.fileCount).toBe(2); // SKILL.md + helper.js

      // Verify files were copied
      const copiedSkillMd = await fs.readFile(
        path.join(result.copiedPath, 'SKILL.md'),
        'utf8'
      );
      expect(copiedSkillMd).toContain('test-skill');
    });

    test('copies skill to project scope successfully', async () => {
      const request = {
        sourceSkillPath: sourceSkillPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'skip'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toContain(testProjectPath);
      expect(result.copiedPath).toContain('.claude/skills/test-skill');
      expect(result.fileCount).toBe(2);

      // Verify directory structure
      const targetSkillMd = path.join(result.copiedPath, 'SKILL.md');
      const exists = await fs.access(targetSkillMd).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('copies skill with subdirectories', async () => {
      // Create skill with subdirectory
      const subDir = path.join(sourceSkillPath, 'lib');
      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(path.join(subDir, 'utils.js'), '// Utils', 'utf8');

      const userSkillsDir = path.join(tempDir, '.claude', 'skills');
      await fs.mkdir(userSkillsDir, { recursive: true });

      const request = {
        sourceSkillPath: sourceSkillPath,
        targetScope: 'user',
        conflictStrategy: 'skip'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(true);
      expect(result.fileCount).toBe(3); // SKILL.md + helper.js + lib/utils.js
      expect(result.dirCount).toBeGreaterThanOrEqual(1); // lib/ (may include parent)

      // Verify nested file was copied
      const copiedUtils = path.join(result.copiedPath, 'lib', 'utils.js');
      const exists = await fs.access(copiedUtils).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('External reference detection', () => {
    test('returns warnings for skills with external references', async () => {
      // Create skill with external references
      const externalSkillPath = path.join(tempDir, 'source', '.claude', 'skills', 'external-skill');
      await fs.mkdir(externalSkillPath, { recursive: true });
      await fs.writeFile(path.join(externalSkillPath, 'SKILL.md'), externalRefsContent, 'utf8');

      const request = {
        sourceSkillPath: externalSkillPath,
        targetScope: 'user',
        acknowledgedWarnings: false // Not acknowledged
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(false);
      expect(result.warnings).toBeDefined();
      expect(result.warnings.externalReferences).toBeDefined();
      expect(result.warnings.externalReferences.length).toBeGreaterThan(0);
      expect(result.requiresAcknowledgement).toBe(true);
    });

    test('copies skill with external references when acknowledged', async () => {
      // Create skill with external references
      const externalSkillPath = path.join(tempDir, 'source', '.claude', 'skills', 'external-skill');
      await fs.mkdir(externalSkillPath, { recursive: true });
      await fs.writeFile(path.join(externalSkillPath, 'SKILL.md'), externalRefsContent, 'utf8');

      const userSkillsDir = path.join(tempDir, '.claude', 'skills');
      await fs.mkdir(userSkillsDir, { recursive: true });

      const request = {
        sourceSkillPath: externalSkillPath,
        targetScope: 'user',
        acknowledgedWarnings: true, // Acknowledged
        conflictStrategy: 'skip'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).toContain('external-skill');
    });
  });

  describe('Conflict handling', () => {
    test('returns conflict when target exists and no strategy provided', async () => {
      // Create existing skill at target
      const existingSkillPath = path.join(testProjectPath, '.claude', 'skills', 'test-skill');
      await fs.mkdir(existingSkillPath, { recursive: true });
      await fs.writeFile(path.join(existingSkillPath, 'SKILL.md'), '---\nname: existing\n---\n# Existing', 'utf8');

      const request = {
        sourceSkillPath: sourceSkillPath,
        targetScope: 'project',
        targetProjectId: testProjectId
        // No conflictStrategy
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(false);
      expect(result.conflict).toBeDefined();
      expect(result.conflict.targetPath).toContain('test-skill');
    });

    test('skips copy when skip strategy is used', async () => {
      // Create existing skill at target
      const existingSkillPath = path.join(testProjectPath, '.claude', 'skills', 'test-skill');
      await fs.mkdir(existingSkillPath, { recursive: true });
      await fs.writeFile(path.join(existingSkillPath, 'SKILL.md'), '---\nname: existing\n---\n# Existing', 'utf8');

      const request = {
        sourceSkillPath: sourceSkillPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'skip'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.message).toBe('Copy cancelled by user');
    });

    test('overwrites existing skill with overwrite strategy', async () => {
      // Create existing skill at target with different content
      const existingSkillPath = path.join(testProjectPath, '.claude', 'skills', 'test-skill');
      await fs.mkdir(existingSkillPath, { recursive: true });
      await fs.writeFile(path.join(existingSkillPath, 'SKILL.md'), '---\nname: old-name\n---\n# Old Skill', 'utf8');

      const request = {
        sourceSkillPath: sourceSkillPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'overwrite'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(true);

      // Verify content was overwritten
      const copiedContent = await fs.readFile(
        path.join(result.copiedPath, 'SKILL.md'),
        'utf8'
      );
      expect(copiedContent).toContain('test-skill');
      expect(copiedContent).not.toContain('old-name');
    });

    test('renames skill with rename strategy', async () => {
      // Create existing skill at target
      const existingSkillPath = path.join(testProjectPath, '.claude', 'skills', 'test-skill');
      await fs.mkdir(existingSkillPath, { recursive: true });
      await fs.writeFile(path.join(existingSkillPath, 'SKILL.md'), '---\nname: existing\n---\n# Existing', 'utf8');

      const request = {
        sourceSkillPath: sourceSkillPath,
        targetScope: 'project',
        targetProjectId: testProjectId,
        conflictStrategy: 'rename'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(true);
      expect(result.copiedPath).not.toBe(existingSkillPath);
      // New path should contain a suffix like -1 or (1)
      expect(result.copiedPath).toMatch(/test-skill[-_(]\d+\)?$/);
    });
  });

  describe('Error handling', () => {
    test('fails for non-existent source skill', async () => {
      const request = {
        sourceSkillPath: '/does/not/exist',
        targetScope: 'user'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('fails for source without SKILL.md', async () => {
      // Create directory without SKILL.md
      const emptySkillPath = path.join(tempDir, 'source', '.claude', 'skills', 'empty-skill');
      await fs.mkdir(emptySkillPath, { recursive: true });
      await fs.writeFile(path.join(emptySkillPath, 'other.js'), '// Not SKILL.md', 'utf8');

      const request = {
        sourceSkillPath: emptySkillPath,
        targetScope: 'user'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('fails for SKILL.md without frontmatter', async () => {
      // Create skill without YAML frontmatter
      const noFrontmatterPath = path.join(tempDir, 'source', '.claude', 'skills', 'no-frontmatter');
      await fs.mkdir(noFrontmatterPath, { recursive: true });
      await fs.writeFile(path.join(noFrontmatterPath, 'SKILL.md'), '# No Frontmatter\n\nJust content.', 'utf8');

      const request = {
        sourceSkillPath: noFrontmatterPath,
        targetScope: 'user'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('YAML frontmatter');
    });

    test('fails for invalid project ID', async () => {
      // Mock discoverProjects to not find the project
      discoverProjects.mockResolvedValue({
        projects: {}
      });

      const request = {
        sourceSkillPath: sourceSkillPath,
        targetScope: 'project',
        targetProjectId: 'nonexistent'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Path security', () => {
    test('rejects path traversal attempts', async () => {
      const request = {
        sourceSkillPath: path.join(tempDir, '..', '..', 'etc', 'passwd'),
        targetScope: 'user'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('rejects paths with null bytes', async () => {
      const request = {
        sourceSkillPath: path.join(tempDir, 'test\0skill'),
        targetScope: 'user'
      };

      const result = await copyService.copySkill(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('null bytes');
    });
  });
});

describe('CopyService.detectSkillExternalReferences()', () => {
  test('detects absolute paths', () => {
    const content = 'Run /usr/local/bin/script.sh for processing';
    const refs = copyService.detectSkillExternalReferences('/test/skill', content);

    expect(refs.length).toBeGreaterThan(0);
    expect(refs[0].type).toBe('absolute');
    expect(refs[0].severity).toBe('error');
  });

  test('detects home directory references', () => {
    const content = 'Load config from ~/config/settings.json';
    const refs = copyService.detectSkillExternalReferences('/test/skill', content);

    expect(refs.length).toBeGreaterThan(0);
    expect(refs[0].type).toBe('home');
    expect(refs[0].severity).toBe('warning');
  });

  test('detects parent directory escapes', () => {
    const content = 'node ../shared/utils.js';
    const refs = copyService.detectSkillExternalReferences('/test/skill', content);

    expect(refs.length).toBeGreaterThan(0);
    expect(refs.some(r => r.type === 'relative' || r.type === 'script')).toBe(true);
  });

  test('ignores URLs', () => {
    const content = 'Fetch from https://api.example.com/data and http://localhost:3000';
    const refs = copyService.detectSkillExternalReferences('/test/skill', content);

    expect(refs).toEqual([]);
  });

  test('includes line numbers in references', () => {
    const content = 'Line 1\nLine 2\n/absolute/path on line 3';
    const refs = copyService.detectSkillExternalReferences('/test/skill', content);

    expect(refs.length).toBeGreaterThan(0);
    expect(refs[0].line).toBe(3);
  });
});
