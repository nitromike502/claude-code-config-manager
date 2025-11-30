/**
 * Unit tests for referenceChecker
 * Tests finding references to configuration items across project files
 */

const fs = require('fs').promises;
const path = require('path');
const referenceChecker = require('../../../src/backend/services/referenceChecker');

describe('referenceChecker', () => {
  describe('findReferences()', () => {
    let readFileSpy, accessSpy, statSpy, readdirSpy;

    beforeEach(() => {
      readFileSpy = jest.spyOn(fs, 'readFile');
      accessSpy = jest.spyOn(fs, 'access');
      statSpy = jest.spyOn(fs, 'stat');
      readdirSpy = jest.spyOn(fs, 'readdir');
    });

    afterEach(() => {
      readFileSpy.mockRestore();
      accessSpy.mockRestore();
      statSpy.mockRestore();
      readdirSpy.mockRestore();
    });

    describe('Parameter Validation', () => {
      test('should reject null itemType', async () => {
        await expect(referenceChecker.findReferences(null, 'test', '/test/project'))
          .rejects.toThrow('Invalid itemType: must be a non-empty string');
      });

      test('should reject null itemName', async () => {
        await expect(referenceChecker.findReferences('agent', null, '/test/project'))
          .rejects.toThrow('Invalid itemName: must be a non-empty string');
      });

      test('should reject null projectPath', async () => {
        await expect(referenceChecker.findReferences('agent', 'test', null))
          .rejects.toThrow('Invalid projectPath: must be a non-empty string');
      });

      test('should reject invalid itemType', async () => {
        await expect(referenceChecker.findReferences('invalid', 'test', '/test/project'))
          .rejects.toThrow('Invalid itemType: must be one of agent, command, skill, hook, mcp');
      });

      test('should accept valid itemTypes', async () => {
        const validTypes = ['agent', 'command', 'skill', 'hook', 'mcp'];

        // Mock file system to prevent actual file operations
        accessSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isDirectory: () => true });
        readdirSpy.mockResolvedValue([]);

        for (const type of validTypes) {
          await expect(referenceChecker.findReferences(type, 'test', '/test/project'))
            .resolves.toBeDefined();
        }
      });
    });

    describe('Finding References', () => {
      test('should find references in agent files', async () => {
        const projectPath = '/test/project';
        const agentDir = path.join(projectPath, '.claude', 'agents');

        // Mock directory structure
        accessSpy.mockImplementation((path) => Promise.resolve());
        statSpy.mockImplementation((path) => {
          if (path.endsWith('agents')) {
            return Promise.resolve({ isDirectory: () => true });
          }
          return Promise.resolve({ isDirectory: () => false });
        });

        readdirSpy.mockImplementation((dirPath) => {
          if (dirPath === agentDir) {
            return Promise.resolve([
              { name: 'frontend-dev.md', isFile: () => true, isDirectory: () => false },
              { name: 'backend-dev.md', isFile: () => true, isDirectory: () => false }
            ]);
          }
          return Promise.resolve([]);
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath.includes('frontend-dev.md')) {
            return Promise.resolve('This agent uses the api-specialist for backend work.\nLine 2: api-specialist is great!');
          }
          if (filePath.includes('backend-dev.md')) {
            return Promise.resolve('This is a backend agent.');
          }
          return Promise.resolve('{}');
        });

        const references = await referenceChecker.findReferences('agent', 'api-specialist', projectPath);

        expect(references).toHaveLength(1);
        expect(references[0]).toMatchObject({
          type: 'agent',
          name: 'frontend-dev',
          lines: [1, 2]
        });
        expect(references[0].location).toContain('frontend-dev.md');
      });

      test('should find references in command files', async () => {
        const projectPath = '/test/project';
        const commandDir = path.join(projectPath, '.claude', 'commands');

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation((path) => {
          if (path.includes('commands')) {
            return Promise.resolve({ isDirectory: () => true });
          }
          return Promise.resolve({ isDirectory: () => false });
        });

        readdirSpy.mockImplementation((dirPath) => {
          if (dirPath === commandDir) {
            return Promise.resolve([
              { name: 'deploy.md', isFile: () => true, isDirectory: () => false }
            ]);
          }
          return Promise.resolve([]);
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath.includes('deploy.md')) {
            return Promise.resolve('Uses build-tool on line 1');
          }
          return Promise.resolve('{}');
        });

        const references = await referenceChecker.findReferences('command', 'build-tool', projectPath);

        expect(references).toHaveLength(1);
        expect(references[0]).toMatchObject({
          type: 'command',
          name: 'deploy',
          lines: [1]
        });
      });

      test('should find references in skill files', async () => {
        const projectPath = '/test/project';
        const skillsDir = path.join(projectPath, '.claude', 'skills');

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation((dirPath) => {
          if (dirPath.includes('skills')) {
            return Promise.resolve({ isDirectory: () => true });
          }
          return Promise.resolve({ isDirectory: () => false });
        });

        readdirSpy.mockImplementation((dirPath) => {
          if (dirPath === skillsDir) {
            return Promise.resolve([
              { name: 'test-skill', isDirectory: () => true, isFile: () => false }
            ]);
          }
          return Promise.resolve([]);
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath.includes('SKILL.md')) {
            return Promise.resolve('References other-skill in implementation');
          }
          return Promise.resolve('{}');
        });

        const references = await referenceChecker.findReferences('skill', 'other-skill', projectPath);

        expect(references).toHaveLength(1);
        expect(references[0]).toMatchObject({
          type: 'skill',
          name: 'test-skill',
          lines: [1]
        });
      });

      test('should find references in settings.json', async () => {
        const projectPath = '/test/project';

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation(() => Promise.resolve({ isDirectory: () => true }));
        readdirSpy.mockResolvedValue([]);

        readFileSpy.mockImplementation((filePath) => {
          if (filePath.includes('settings.json')) {
            return Promise.resolve(JSON.stringify({
              hooks: {
                PreToolUse: 'my-hook-command'
              }
            }));
          }
          return Promise.resolve('{}');
        });

        const references = await referenceChecker.findReferences('hook', 'my-hook-command', projectPath);

        expect(references).toHaveLength(1);
        expect(references[0]).toMatchObject({
          type: 'settings',
          name: 'settings.json',
          lines: [1]
        });
      });

      test('should find references in .mcp.json', async () => {
        const projectPath = '/test/project';

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation(() => Promise.resolve({ isDirectory: () => true }));
        readdirSpy.mockResolvedValue([]);

        readFileSpy.mockImplementation((filePath) => {
          if (filePath.includes('.mcp.json')) {
            return Promise.resolve(JSON.stringify({
              servers: {
                'my-mcp-server': { command: 'node', args: ['server.js'] }
              }
            }));
          }
          return Promise.resolve('{}');
        });

        const references = await referenceChecker.findReferences('mcp', 'my-mcp-server', projectPath);

        expect(references).toHaveLength(1);
        expect(references[0]).toMatchObject({
          type: 'mcp',
          name: '.mcp.json',
          lines: [1]
        });
      });

      test('should find no references when item is not used', async () => {
        const projectPath = '/test/project';

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation(() => Promise.resolve({ isDirectory: () => true }));
        readdirSpy.mockResolvedValue([]);
        readFileSpy.mockResolvedValue('{}');

        const references = await referenceChecker.findReferences('agent', 'unused-agent', projectPath);

        expect(references).toEqual([]);
      });

      test('should find multiple references in same file', async () => {
        const projectPath = '/test/project';
        const agentDir = path.join(projectPath, '.claude', 'agents');

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation(() => Promise.resolve({ isDirectory: () => true }));

        readdirSpy.mockImplementation((dirPath) => {
          if (dirPath === agentDir) {
            return Promise.resolve([
              { name: 'multi-ref.md', isFile: () => true, isDirectory: () => false }
            ]);
          }
          return Promise.resolve([]);
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath.includes('multi-ref.md')) {
            return Promise.resolve('Line 1: use api-specialist\nLine 2: normal\nLine 3: api-specialist again\nLine 4: and api-specialist once more');
          }
          return Promise.resolve('{}');
        });

        const references = await referenceChecker.findReferences('agent', 'api-specialist', projectPath);

        expect(references).toHaveLength(1);
        expect(references[0].lines).toEqual([1, 3, 4]);
      });

      test('should scan nested command directories', async () => {
        const projectPath = '/test/project';
        const commandDir = path.join(projectPath, '.claude', 'commands');
        const subDir = path.join(commandDir, 'subdir');

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation((dirPath) => {
          return Promise.resolve({ isDirectory: () => dirPath.includes('commands') || dirPath.includes('subdir') });
        });

        readdirSpy.mockImplementation((dirPath) => {
          if (dirPath === commandDir) {
            return Promise.resolve([
              { name: 'subdir', isDirectory: () => true, isFile: () => false }
            ]);
          }
          if (dirPath === subDir) {
            return Promise.resolve([
              { name: 'nested.md', isFile: () => true, isDirectory: () => false }
            ]);
          }
          return Promise.resolve([]);
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath.includes('nested.md')) {
            return Promise.resolve('References special-tool');
          }
          return Promise.resolve('{}');
        });

        const references = await referenceChecker.findReferences('command', 'special-tool', projectPath);

        expect(references).toHaveLength(1);
        expect(references[0].name).toBe('nested');
      });
    });

    describe('Error Handling', () => {
      test('should handle missing .claude directory gracefully', async () => {
        const projectPath = '/test/project';

        accessSpy.mockRejectedValue(new Error('ENOENT'));
        statSpy.mockRejectedValue(new Error('ENOENT'));

        const references = await referenceChecker.findReferences('agent', 'test', projectPath);

        expect(references).toEqual([]);
      });

      test('should handle unreadable files gracefully', async () => {
        const projectPath = '/test/project';
        const agentDir = path.join(projectPath, '.claude', 'agents');

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation(() => Promise.resolve({ isDirectory: () => true }));

        readdirSpy.mockImplementation((dirPath) => {
          if (dirPath === agentDir) {
            return Promise.resolve([
              { name: 'readable.md', isFile: () => true, isDirectory: () => false },
              { name: 'unreadable.md', isFile: () => true, isDirectory: () => false }
            ]);
          }
          return Promise.resolve([]);
        });

        readFileSpy.mockImplementation((filePath) => {
          const fileName = filePath.split('/').pop();
          if (fileName === 'readable.md') {
            return Promise.resolve('Contains target-item');
          }
          if (fileName === 'unreadable.md') {
            // Return rejected promise to simulate unreadable file - error is caught and returns []
            const error = new Error('Permission denied');
            error.code = 'EACCES';
            return Promise.reject(error);
          }
          // Default: return empty JSON (no target-item)
          return Promise.resolve('{}');
        });

        const references = await referenceChecker.findReferences('agent', 'target-item', projectPath);

        // Should still find reference in readable file despite unreadable file error
        // The unreadable file's error is caught and returns empty array, so only readable file is found
        expect(references).toHaveLength(1);
        expect(references[0].name).toBe('readable');
      });

      test('should return partial results on general error', async () => {
        const projectPath = '/test/project';

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation(() => Promise.resolve({ isDirectory: () => true }));
        readdirSpy.mockRejectedValue(new Error('Unexpected error'));

        const references = await referenceChecker.findReferences('agent', 'test', projectPath);

        // Should return empty array rather than throwing
        expect(references).toEqual([]);
      });
    });

    describe('Performance', () => {
      test('should complete scan in <50ms for 50 mocked files', async () => {
        const projectPath = '/test/project';
        const agentDir = path.join(projectPath, '.claude', 'agents');

        // Create 50 mock files
        const mockFiles = [];
        for (let i = 0; i < 50; i++) {
          mockFiles.push({
            name: `agent-${i}.md`,
            isFile: () => true,
            isDirectory: () => false
          });
        }

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation(() => Promise.resolve({ isDirectory: () => true }));
        readdirSpy.mockImplementation((dirPath) => {
          if (dirPath === agentDir) {
            return Promise.resolve(mockFiles);
          }
          return Promise.resolve([]);
        });

        readFileSpy.mockImplementation(() => {
          // Simulate fast file read
          return Promise.resolve('Some content without target');
        });

        const start = Date.now();
        await referenceChecker.findReferences('agent', 'target', projectPath);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(50);
      });

      test('should timeout after 5 seconds and return partial results', async () => {
        const projectPath = '/test/project';

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation(() => Promise.resolve({ isDirectory: () => true }));
        readdirSpy.mockResolvedValue([]);

        // Mock a very slow file read (simulate hanging)
        readFileSpy.mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(() => resolve('content'), 10000); // 10 seconds
          });
        });

        const start = Date.now();
        const references = await referenceChecker.findReferences('agent', 'test', projectPath);
        const duration = Date.now() - start;

        // Should timeout before 10 seconds
        expect(duration).toBeLessThan(6000);
        expect(references).toBeDefined();
      }, 7000); // Increase test timeout to 7 seconds
    });

    describe('Line Number Accuracy', () => {
      test('should report accurate line numbers (1-indexed)', async () => {
        const projectPath = '/test/project';
        const agentDir = path.join(projectPath, '.claude', 'agents');

        accessSpy.mockImplementation(() => Promise.resolve());
        statSpy.mockImplementation(() => Promise.resolve({ isDirectory: () => true }));
        readdirSpy.mockImplementation((dirPath) => {
          if (dirPath === agentDir) {
            return Promise.resolve([
              { name: 'test.md', isFile: () => true, isDirectory: () => false }
            ]);
          }
          return Promise.resolve([]);
        });

        readFileSpy.mockImplementation((filePath) => {
          if (filePath.includes('test.md')) {
            // Line 1: no match
            // Line 2: match
            // Line 3: no match
            // Line 4: match
            return Promise.resolve('First line\nSecond line with target\nThird line\nFourth line with target');
          }
          return Promise.resolve('{}');
        });

        const references = await referenceChecker.findReferences('agent', 'target', projectPath);

        expect(references).toHaveLength(1);
        expect(references[0].lines).toEqual([2, 4]);
      });
    });
  });
});
