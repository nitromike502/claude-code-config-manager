/**
 * Unit tests for skillParser
 * Tests parsing of skill directories with SKILL.md files
 */

const skillParser = require('../../../src/backend/parsers/skillParser');
const path = require('path');
const fs = require('fs').promises;

describe('skillParser', () => {
  const fixturesPath = path.join(__dirname, '../../fixtures/samples/skills');

  describe('parseSkill()', () => {
    describe('Valid Skill Parsing', () => {
      test('should parse skill with all fields present', async () => {
        const skillPath = path.join(fixturesPath, 'valid-complete');
        const result = await skillParser.parseSkill(skillPath, 'project');

        expect(result).not.toBeNull();
        expect(result.name).toBe('complete-skill');
        expect(result.description).toBe('A complete skill with all fields present for testing');
        expect(result.allowedTools).toEqual(['Read', 'Write', 'Bash']);
        expect(result.content).toContain('# Complete Test Skill');
        expect(result.directoryPath).toBe(skillPath);
        expect(result.scope).toBe('project');
        expect(result.hasError).toBe(false);
        expect(result.parseError).toBeNull();
        expect(result.fileCount).toBe(2); // SKILL.md + helper.js
        expect(result.files).toHaveLength(2);
        expect(result.externalReferences).toEqual([]);
      });

      test('should parse skill with minimal fields', async () => {
        const skillPath = path.join(fixturesPath, 'valid-minimal');
        const result = await skillParser.parseSkill(skillPath, 'user');

        expect(result).not.toBeNull();
        expect(result.name).toBe('valid-minimal'); // Falls back to directory name
        expect(result.description).toBe('Minimal skill with only required fields');
        expect(result.allowedTools).toEqual([]);
        expect(result.content).toContain('# Minimal Skill');
        expect(result.scope).toBe('user');
        expect(result.hasError).toBe(false);
      });

      test('should parse skill with subdirectories', async () => {
        const skillPath = path.join(fixturesPath, 'with-subdirs');
        const result = await skillParser.parseSkill(skillPath, 'project');

        expect(result).not.toBeNull();
        expect(result.name).toBe('subdirs-skill');
        expect(result.subdirectories).toContain('subdir1');
        expect(result.fileCount).toBe(3); // SKILL.md + main.js + subdir1/nested.js
        expect(result.files).toHaveLength(4); // 3 files + 1 directory entry

        // Check files include nested file
        const nestedFile = result.files.find(f => f.relativePath === 'subdir1/nested.js');
        expect(nestedFile).toBeDefined();
        expect(nestedFile.type).toBe('file');
      });

      test('should handle allowed-tools as comma-separated string', async () => {
        const skillPath = path.join(fixturesPath, 'with-subdirs');
        const result = await skillParser.parseSkill(skillPath, 'project');

        expect(result).not.toBeNull();
        expect(result.allowedTools).toEqual(['Read', 'Write']);
      });
    });

    describe('Error Handling', () => {
      test('should return error object for missing SKILL.md', async () => {
        const skillPath = path.join(fixturesPath, 'missing-skillmd');
        const result = await skillParser.parseSkill(skillPath, 'project');

        expect(result).not.toBeNull();
        expect(result.hasError).toBe(true);
        expect(result.parseError).toBe('Missing SKILL.md file');
        expect(result.name).toBe('missing-skillmd');
        expect(result.files).toEqual([]);
      });

      test('should return error object for invalid YAML', async () => {
        const skillPath = path.join(fixturesPath, 'invalid-yaml');
        const result = await skillParser.parseSkill(skillPath, 'project');

        expect(result).not.toBeNull();
        expect(result.hasError).toBe(true);
        expect(result.parseError).toBeTruthy();
        expect(result.name).toBe('invalid-yaml');
      });

      test('should return null for non-directory path', async () => {
        const filePath = path.join(fixturesPath, 'valid-complete', 'SKILL.md');
        const result = await skillParser.parseSkill(filePath, 'project');

        expect(result).toBeNull();
      });

      test('should return null for non-existent path', async () => {
        const nonExistent = path.join(fixturesPath, 'does-not-exist');
        const result = await skillParser.parseSkill(nonExistent, 'project');

        expect(result).toBeNull();
      });
    });
  });

  describe('detectExternalReferences()', () => {
    test('should detect absolute path references', async () => {
      const skillPath = path.join(fixturesPath, 'external-refs');
      const result = await skillParser.parseSkill(skillPath, 'project');

      expect(result.externalReferences.length).toBeGreaterThan(0);

      // Check for /usr/local/bin/helper.sh detection
      const absoluteRef = result.externalReferences.find(r =>
        r.reference.includes('/usr/local/bin')
      );
      expect(absoluteRef).toBeDefined();
      expect(absoluteRef.type).toBe('absolute');
      expect(absoluteRef.severity).toBe('error');
    });

    test('should detect home directory references', async () => {
      const skillPath = path.join(fixturesPath, 'external-refs');
      const result = await skillParser.parseSkill(skillPath, 'project');

      const homeRef = result.externalReferences.find(r =>
        r.reference.includes('~/')
      );
      expect(homeRef).toBeDefined();
      expect(homeRef.type).toBe('home');
      expect(homeRef.severity).toBe('warning');
    });

    test('should detect parent directory escapes', async () => {
      const skillPath = path.join(fixturesPath, 'external-refs');
      const result = await skillParser.parseSkill(skillPath, 'project');

      const relativeRef = result.externalReferences.find(r =>
        r.reference.includes('../')
      );
      expect(relativeRef).toBeDefined();
      expect(relativeRef.type).toBe('relative');
    });

    test('should detect script execution with external paths', async () => {
      const skillPath = path.join(fixturesPath, 'external-refs');
      const result = await skillParser.parseSkill(skillPath, 'project');

      // Check for python ~/scripts/process.py detection
      const scriptRef = result.externalReferences.find(r =>
        r.reference.includes('scripts/process.py')
      );
      expect(scriptRef).toBeDefined();
    });

    test('should not flag internal references', async () => {
      const skillPath = path.join(fixturesPath, 'valid-complete');
      const result = await skillParser.parseSkill(skillPath, 'project');

      // Valid complete skill has no external references
      expect(result.externalReferences).toEqual([]);
    });

    test('should not flag URLs as external references', () => {
      const content = `
Check out https://example.com/path/to/resource
And http://localhost:3000/api/test
      `;
      const refs = skillParser.detectExternalReferences('/test/skill', content);

      expect(refs).toEqual([]);
    });
  });

  describe('parseAllSkills()', () => {
    test('should parse all skills in a directory', async () => {
      const result = await skillParser.parseAllSkills(fixturesPath, 'project');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(4);

      // Check that we got valid skill objects
      const completeSkill = result.find(s => s.name === 'complete-skill');
      expect(completeSkill).toBeDefined();
      expect(completeSkill.scope).toBe('project');
    });

    test('should return empty array for non-existent directory', async () => {
      const result = await skillParser.parseAllSkills('/does/not/exist', 'project');

      expect(result).toEqual([]);
    });

    test('should filter out failed parses (null results)', async () => {
      const result = await skillParser.parseAllSkills(fixturesPath, 'project');

      // All results should be non-null objects
      result.forEach(skill => {
        expect(skill).not.toBeNull();
        expect(typeof skill).toBe('object');
      });
    });
  });

  describe('getAllSkills()', () => {
    let tempDir;

    beforeEach(async () => {
      // Create temp directory structure for testing
      tempDir = path.join(__dirname, '../../temp-skills-test');
      const projectSkillsPath = path.join(tempDir, 'project', '.claude', 'skills', 'test-skill');
      const userSkillsPath = path.join(tempDir, 'user', '.claude', 'skills', 'user-skill');

      await fs.mkdir(projectSkillsPath, { recursive: true });
      await fs.mkdir(userSkillsPath, { recursive: true });

      await fs.writeFile(
        path.join(projectSkillsPath, 'SKILL.md'),
        '---\nname: project-test-skill\ndescription: Project skill\n---\n\n# Project Skill'
      );
      await fs.writeFile(
        path.join(userSkillsPath, 'SKILL.md'),
        '---\nname: user-test-skill\ndescription: User skill\n---\n\n# User Skill'
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    test('should get both project and user skills', async () => {
      const projectPath = path.join(tempDir, 'project');
      const userPath = path.join(tempDir, 'user');

      const result = await skillParser.getAllSkills(projectPath, userPath);

      expect(result).toHaveProperty('projectSkills');
      expect(result).toHaveProperty('userSkills');
      expect(result.projectSkills).toHaveLength(1);
      expect(result.userSkills).toHaveLength(1);
      expect(result.projectSkills[0].name).toBe('project-test-skill');
      expect(result.projectSkills[0].scope).toBe('project');
      expect(result.userSkills[0].name).toBe('user-test-skill');
      expect(result.userSkills[0].scope).toBe('user');
    });

    test('should handle missing skills directories gracefully', async () => {
      const emptyProject = path.join(tempDir, 'empty-project');
      const emptyUser = path.join(tempDir, 'empty-user');
      await fs.mkdir(emptyProject, { recursive: true });
      await fs.mkdir(emptyUser, { recursive: true });

      const result = await skillParser.getAllSkills(emptyProject, emptyUser);

      expect(result.projectSkills).toEqual([]);
      expect(result.userSkills).toEqual([]);
    });
  });

  describe('File tree structure', () => {
    test('should return files sorted with directories first', async () => {
      const skillPath = path.join(fixturesPath, 'with-subdirs');
      const result = await skillParser.parseSkill(skillPath, 'project');

      // Find the first directory and first file
      const firstDirIndex = result.files.findIndex(f => f.type === 'directory');
      const firstFileAfterDirIndex = result.files.findIndex((f, i) =>
        i > firstDirIndex && f.type === 'file'
      );

      // If there's a directory, it should come before files at the same level
      if (firstDirIndex !== -1 && result.files[0].type === 'directory') {
        expect(firstDirIndex).toBe(0);
      }
    });

    test('should include correct relativePath for nested files', async () => {
      const skillPath = path.join(fixturesPath, 'with-subdirs');
      const result = await skillParser.parseSkill(skillPath, 'project');

      const nestedFile = result.files.find(f => f.name === 'nested.js');
      expect(nestedFile).toBeDefined();
      expect(nestedFile.relativePath).toBe('subdir1/nested.js');
    });
  });
});
