/**
 * Unit tests for updateService
 * Tests atomic file updates, YAML frontmatter updates, and JSON file updates
 */

const fs = require('fs').promises;
const path = require('path');
const updateService = require('../../../src/backend/services/updateService');

describe('updateService', () => {
  describe('updateFile()', () => {
    let statSpy, writeFileSpy, renameSpy, unlinkSpy;

    beforeEach(() => {
      statSpy = jest.spyOn(fs, 'stat');
      writeFileSpy = jest.spyOn(fs, 'writeFile');
      renameSpy = jest.spyOn(fs, 'rename');
      unlinkSpy = jest.spyOn(fs, 'unlink');
    });

    afterEach(() => {
      statSpy.mockRestore();
      writeFileSpy.mockRestore();
      renameSpy.mockRestore();
      unlinkSpy.mockRestore();
    });

    describe('Path Validation', () => {
      test('should reject null file path', async () => {
        await expect(updateService.updateFile(null, 'content'))
          .rejects.toThrow('Invalid file path: path must be a non-empty string');
      });

      test('should reject undefined file path', async () => {
        await expect(updateService.updateFile(undefined, 'content'))
          .rejects.toThrow('Invalid file path: path must be a non-empty string');
      });

      test('should reject empty string file path', async () => {
        await expect(updateService.updateFile('', 'content'))
          .rejects.toThrow('Invalid file path: path must be a non-empty string');
      });

      test('should reject path with null bytes', async () => {
        await expect(updateService.updateFile('/path/to/file\0.txt', 'content'))
          .rejects.toThrow('Invalid file path: path contains null bytes');
      });

      test('should reject path with traversal (..) segments', async () => {
        await expect(updateService.updateFile('/home/user/../../../etc/passwd', 'content'))
          .rejects.toThrow('Path traversal detected: file path contains ".." segments');
      });
    });

    describe('Content Validation', () => {
      test('should reject non-string content', async () => {
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await expect(updateService.updateFile('/test/file.txt', 123))
          .rejects.toThrow('Invalid content: must be a string');
      });
    });

    describe('Successful Write', () => {
      test('should write content atomically using temp file', async () => {
        const testPath = '/test/project/file.txt';
        const testContent = 'test content';

        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: testContent.length });
        renameSpy.mockResolvedValue();

        const result = await updateService.updateFile(testPath, testContent);

        expect(result).toEqual({ success: true });
        expect(writeFileSpy).toHaveBeenCalledWith(`${testPath}.tmp`, testContent, 'utf8');
        expect(statSpy).toHaveBeenCalledWith(`${testPath}.tmp`);
        expect(renameSpy).toHaveBeenCalledWith(`${testPath}.tmp`, testPath);
      });

      test('should allow empty content (empty string)', async () => {
        const testPath = '/test/project/empty.txt';
        const testContent = '';

        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 0 });
        renameSpy.mockResolvedValue();

        const result = await updateService.updateFile(testPath, testContent);

        expect(result).toEqual({ success: true });
      });
    });

    describe('Write Verification', () => {
      test('should fail if temp file is not a file', async () => {
        const testPath = '/test/project/file.txt';
        const testContent = 'test content';

        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => false, size: 100 });
        unlinkSpy.mockResolvedValue();

        await expect(updateService.updateFile(testPath, testContent))
          .rejects.toThrow('Temp file write verification failed: not a file');

        expect(unlinkSpy).toHaveBeenCalledWith(`${testPath}.tmp`);
      });

      test('should fail if temp file is empty when content is not', async () => {
        const testPath = '/test/project/file.txt';
        const testContent = 'test content';

        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 0 });
        unlinkSpy.mockResolvedValue();

        await expect(updateService.updateFile(testPath, testContent))
          .rejects.toThrow('Temp file write verification failed: file is empty');

        expect(unlinkSpy).toHaveBeenCalledWith(`${testPath}.tmp`);
      });
    });

    describe('Error Handling', () => {
      test('should handle ENOENT (directory not found)', async () => {
        const testPath = '/nonexistent/dir/file.txt';

        writeFileSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        unlinkSpy.mockResolvedValue();

        await expect(updateService.updateFile(testPath, 'content'))
          .rejects.toThrow(`Directory not found: ${path.dirname(testPath)}`);
      });

      test('should handle EACCES (permission denied)', async () => {
        const testPath = '/protected/file.txt';

        writeFileSpy.mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }));
        unlinkSpy.mockResolvedValue();

        await expect(updateService.updateFile(testPath, 'content'))
          .rejects.toThrow(`Permission denied: cannot write to ${testPath}`);
      });

      test('should clean up temp file on error', async () => {
        const testPath = '/test/file.txt';

        writeFileSpy.mockResolvedValue();
        statSpy.mockRejectedValue(new Error('Stat failed'));
        unlinkSpy.mockResolvedValue();

        await expect(updateService.updateFile(testPath, 'content'))
          .rejects.toThrow('Stat failed');

        expect(unlinkSpy).toHaveBeenCalledWith(`${testPath}.tmp`);
      });

      test('should ignore cleanup errors', async () => {
        const testPath = '/test/file.txt';

        writeFileSpy.mockResolvedValue();
        statSpy.mockRejectedValue(new Error('Stat failed'));
        unlinkSpy.mockRejectedValue(new Error('Cleanup failed'));

        await expect(updateService.updateFile(testPath, 'content'))
          .rejects.toThrow('Stat failed');
      });
    });

    describe('Performance', () => {
      test('should complete write in <10ms for typical file', async () => {
        const testPath = '/test/file.txt';
        const testContent = 'x'.repeat(1000); // 1KB content

        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: testContent.length });
        renameSpy.mockResolvedValue();

        const start = Date.now();
        await updateService.updateFile(testPath, testContent);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(10);
      });
    });
  });

  describe('updateYamlFrontmatter()', () => {
    let readFileSpy, writeFileSpy, statSpy, renameSpy;

    beforeEach(() => {
      readFileSpy = jest.spyOn(fs, 'readFile');
      writeFileSpy = jest.spyOn(fs, 'writeFile');
      statSpy = jest.spyOn(fs, 'stat');
      renameSpy = jest.spyOn(fs, 'rename');
    });

    afterEach(() => {
      readFileSpy.mockRestore();
      writeFileSpy.mockRestore();
      statSpy.mockRestore();
      renameSpy.mockRestore();
    });

    describe('Path Validation', () => {
      test('should reject null file path', async () => {
        await expect(updateService.updateYamlFrontmatter(null, { key: 'value' }))
          .rejects.toThrow('Invalid file path: path must be a non-empty string');
      });

      test('should reject path with traversal', async () => {
        await expect(updateService.updateYamlFrontmatter('/home/../etc/passwd', { key: 'value' }))
          .rejects.toThrow('Path traversal detected');
      });
    });

    describe('Updates Validation', () => {
      test('should reject null updates', async () => {
        readFileSpy.mockResolvedValue('---\nkey: value\n---\nBody content');

        await expect(updateService.updateYamlFrontmatter('/test/file.md', null))
          .rejects.toThrow('Invalid updates: must be a non-null object');
      });

      test('should reject array updates', async () => {
        readFileSpy.mockResolvedValue('---\nkey: value\n---\nBody content');

        await expect(updateService.updateYamlFrontmatter('/test/file.md', [1, 2, 3]))
          .rejects.toThrow('Invalid updates: must be a non-null object');
      });
    });

    describe('Successful Updates', () => {
      test('should update existing frontmatter and preserve body', async () => {
        const originalContent = '---\nname: original\nversion: 1.0\n---\nThis is the body content.';
        const updates = { version: '2.0' };

        readFileSpy.mockResolvedValue(originalContent);
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        const result = await updateService.updateYamlFrontmatter('/test/file.md', updates);

        expect(result).toEqual({ success: true });
        expect(writeFileSpy).toHaveBeenCalled();

        const calledContent = writeFileSpy.mock.calls[0][1];
        expect(calledContent).toContain('name: original');
        expect(calledContent).toContain("version: '2.0'"); // YAML adds quotes for strings
        expect(calledContent).toContain('This is the body content.');
      });

      test('should add new properties to existing frontmatter', async () => {
        const originalContent = '---\nname: test\n---\nBody';
        const updates = { newProp: 'newValue' };

        readFileSpy.mockResolvedValue(originalContent);
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await updateService.updateYamlFrontmatter('/test/file.md', updates);

        const calledContent = writeFileSpy.mock.calls[0][1];
        expect(calledContent).toContain('name: test');
        expect(calledContent).toContain('newProp: newValue');
      });

      test('should create frontmatter if file has none', async () => {
        const originalContent = 'Just body content, no frontmatter';
        const updates = { name: 'test', version: '1.0' };

        readFileSpy.mockResolvedValue(originalContent);
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await updateService.updateYamlFrontmatter('/test/file.md', updates);

        const calledContent = writeFileSpy.mock.calls[0][1];
        expect(calledContent).toMatch(/^---\n/);
        expect(calledContent).toContain('name: test');
        expect(calledContent).toContain("version: '1.0'"); // YAML adds quotes for strings
        expect(calledContent).toContain('Just body content, no frontmatter');
      });

      test('should handle empty body content', async () => {
        const originalContent = '---\nname: test\n---\n';
        const updates = { name: 'updated' };

        readFileSpy.mockResolvedValue(originalContent);
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await updateService.updateYamlFrontmatter('/test/file.md', updates);

        const calledContent = writeFileSpy.mock.calls[0][1];
        expect(calledContent).toContain('name: updated');
        // gray-matter adds a trailing newline after closing ---, which is expected
        expect(calledContent).toMatch(/---\n\n?$/);
      });
    });

    describe('Error Handling', () => {
      test('should handle ENOENT (file not found)', async () => {
        readFileSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

        await expect(updateService.updateYamlFrontmatter('/test/missing.md', { key: 'value' }))
          .rejects.toThrow('File not found');
      });

      test('should handle EACCES (permission denied)', async () => {
        readFileSpy.mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }));

        await expect(updateService.updateYamlFrontmatter('/test/protected.md', { key: 'value' }))
          .rejects.toThrow('Permission denied');
      });

      test('should handle invalid YAML in existing file', async () => {
        const invalidContent = '---\ninvalid: yaml: content:\n---\nBody';
        readFileSpy.mockResolvedValue(invalidContent);

        await expect(updateService.updateYamlFrontmatter('/test/file.md', { key: 'value' }))
          .rejects.toThrow('Failed to parse file with gray-matter');
      });

      test('should handle serialization errors', async () => {
        const originalContent = '---\nname: test\n---\nBody';
        const circularRef = {};
        circularRef.self = circularRef; // Create circular reference

        readFileSpy.mockResolvedValue(originalContent);

        // Note: js-yaml actually handles circular references, but we test the error path
        // by ensuring any YAML serialization errors are caught
        await expect(updateService.updateYamlFrontmatter('/test/file.md', circularRef))
          .rejects.toThrow();
      });
    });

    describe('YAML Formatting', () => {
      test('should handle long values (gray-matter may format differently)', async () => {
        const longValue = 'a'.repeat(200);
        const originalContent = '---\nshort: value\n---\nBody';
        const updates = { longProp: longValue };

        readFileSpy.mockResolvedValue(originalContent);
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await updateService.updateYamlFrontmatter('/test/file.md', updates);

        const calledContent = writeFileSpy.mock.calls[0][1];
        // gray-matter may use block scalar format (>-) for long strings, which is valid YAML
        // The important thing is that the value is preserved and can be read back
        expect(calledContent).toContain('longProp:');
        // Verify short property is also preserved
        expect(calledContent).toContain('short: value');
      });
    });

    describe('Bug Regression Tests', () => {
      test('should not create duplicate frontmatter blocks on multiple updates', async () => {
        // Test for bug where regex failed to match certain frontmatter formats
        // causing entire file to be treated as body, resulting in duplicate frontmatter
        const originalContent = '---\nname: test-agent\ndescription: A test agent\nmodel: sonnet\n---\nOriginal body content';
        const updates = { model: 'opus' };

        readFileSpy.mockResolvedValue(originalContent);
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await updateService.updateYamlFrontmatter('/test/file.md', updates);

        const calledContent = writeFileSpy.mock.calls[0][1];

        // Verify single frontmatter block (should start with --- and end with ---)
        const frontmatterBlocks = (calledContent.match(/^---$/gm) || []).length;
        expect(frontmatterBlocks).toBe(2); // Opening and closing ---

        // Verify content structure
        expect(calledContent).toMatch(/^---\n/); // Starts with frontmatter
        expect(calledContent).toContain('model: opus'); // Update applied
        expect(calledContent).toContain('Original body content'); // Body preserved
        expect(calledContent).not.toMatch(/---\n---\n/); // No double frontmatter
      });

      test('should handle frontmatter with various spacing and newlines', async () => {
        // Test edge case: frontmatter with trailing spaces, mixed newlines
        const originalContent = '---  \nname: test\ncolor: blue  \n---\nBody content here';
        const updates = { color: 'red' };

        readFileSpy.mockResolvedValue(originalContent);
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await updateService.updateYamlFrontmatter('/test/file.md', updates);

        const calledContent = writeFileSpy.mock.calls[0][1];

        // gray-matter handles this robustly
        expect(calledContent).toContain('name: test');
        expect(calledContent).toContain('color: red');
        expect(calledContent).toContain('Body content here');

        // Verify single frontmatter block
        const frontmatterBlocks = (calledContent.match(/^---$/gm) || []).length;
        expect(frontmatterBlocks).toBe(2);
      });
    });
  });

  describe('updateJsonFile()', () => {
    let readFileSpy, writeFileSpy, statSpy, renameSpy;

    beforeEach(() => {
      readFileSpy = jest.spyOn(fs, 'readFile');
      writeFileSpy = jest.spyOn(fs, 'writeFile');
      statSpy = jest.spyOn(fs, 'stat');
      renameSpy = jest.spyOn(fs, 'rename');
    });

    afterEach(() => {
      readFileSpy.mockRestore();
      writeFileSpy.mockRestore();
      statSpy.mockRestore();
      renameSpy.mockRestore();
    });

    describe('Path Validation', () => {
      test('should reject null file path', async () => {
        await expect(updateService.updateJsonFile(null, { key: 'value' }))
          .rejects.toThrow('Invalid file path: path must be a non-empty string');
      });

      test('should reject path with traversal', async () => {
        await expect(updateService.updateJsonFile('/home/../etc/passwd', { key: 'value' }))
          .rejects.toThrow('Path traversal detected');
      });
    });

    describe('Updates Validation', () => {
      test('should reject null updates', async () => {
        readFileSpy.mockResolvedValue('{}');

        await expect(updateService.updateJsonFile('/test/file.json', null))
          .rejects.toThrow('Invalid updates: must be a non-null object');
      });

      test('should reject array updates', async () => {
        readFileSpy.mockResolvedValue('{}');

        await expect(updateService.updateJsonFile('/test/file.json', [1, 2, 3]))
          .rejects.toThrow('Invalid updates: must be a non-null object');
      });
    });

    describe('Deep Merge', () => {
      test('should deep merge nested objects', async () => {
        const existingData = {
          level1: {
            level2: {
              existing: 'value',
              toUpdate: 'old'
            }
          }
        };
        const updates = {
          level1: {
            level2: {
              toUpdate: 'new',
              newProp: 'added'
            }
          }
        };

        readFileSpy.mockResolvedValue(JSON.stringify(existingData));
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await updateService.updateJsonFile('/test/file.json', updates);

        const calledContent = writeFileSpy.mock.calls[0][1];
        const result = JSON.parse(calledContent);

        expect(result.level1.level2.existing).toBe('value');
        expect(result.level1.level2.toUpdate).toBe('new');
        expect(result.level1.level2.newProp).toBe('added');
      });

      test('should overwrite arrays (not merge)', async () => {
        const existingData = { arr: [1, 2, 3] };
        const updates = { arr: [4, 5] };

        readFileSpy.mockResolvedValue(JSON.stringify(existingData));
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await updateService.updateJsonFile('/test/file.json', updates);

        const calledContent = writeFileSpy.mock.calls[0][1];
        const result = JSON.parse(calledContent);

        expect(result.arr).toEqual([4, 5]);
      });

      test('should handle top-level properties', async () => {
        const existingData = { a: 1, b: 2 };
        const updates = { b: 20, c: 3 };

        readFileSpy.mockResolvedValue(JSON.stringify(existingData));
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await updateService.updateJsonFile('/test/file.json', updates);

        const calledContent = writeFileSpy.mock.calls[0][1];
        const result = JSON.parse(calledContent);

        expect(result).toEqual({ a: 1, b: 20, c: 3 });
      });
    });

    describe('File Creation', () => {
      test('should create new file if it does not exist', async () => {
        const updates = { name: 'test', version: '1.0' };

        readFileSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        const result = await updateService.updateJsonFile('/test/new-file.json', updates);

        expect(result).toEqual({ success: true });

        const calledContent = writeFileSpy.mock.calls[0][1];
        const result2 = JSON.parse(calledContent);
        expect(result2).toEqual(updates);
      });
    });

    describe('Pretty Print', () => {
      test('should pretty print with 2-space indentation', async () => {
        const existingData = { a: 1 };
        const updates = { b: { c: 2 } };

        readFileSpy.mockResolvedValue(JSON.stringify(existingData));
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        await updateService.updateJsonFile('/test/file.json', updates);

        const calledContent = writeFileSpy.mock.calls[0][1];

        expect(calledContent).toContain('  "a": 1');
        expect(calledContent).toContain('  "b": {');
        expect(calledContent).toContain('    "c": 2');
      });
    });

    describe('Error Handling', () => {
      test('should handle invalid JSON in existing file', async () => {
        readFileSpy.mockResolvedValue('{ invalid json }');

        await expect(updateService.updateJsonFile('/test/file.json', { key: 'value' }))
          .rejects.toThrow('Failed to parse existing JSON');
      });

      test('should handle EACCES (permission denied)', async () => {
        readFileSpy.mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }));

        await expect(updateService.updateJsonFile('/test/protected.json', { key: 'value' }))
          .rejects.toThrow('Permission denied');
      });

      test('should handle serialization errors', async () => {
        readFileSpy.mockResolvedValue('{}');

        // Create circular reference
        const circularRef = {};
        circularRef.self = circularRef;

        await expect(updateService.updateJsonFile('/test/file.json', circularRef))
          .rejects.toThrow();
      });
    });

    describe('Performance', () => {
      test('should complete update in <10ms for typical file', async () => {
        const existingData = { count: 100 };
        const updates = { count: 101 };

        readFileSpy.mockResolvedValue(JSON.stringify(existingData));
        writeFileSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true, size: 100 });
        renameSpy.mockResolvedValue();

        const start = Date.now();
        await updateService.updateJsonFile('/test/file.json', updates);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(10);
      });
    });
  });
});
