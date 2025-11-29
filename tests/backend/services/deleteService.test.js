/**
 * Unit tests for deleteService
 * Tests file deletion, directory deletion, and JSON property deletion
 */

const fs = require('fs').promises;
const deleteService = require('../../../src/backend/services/deleteService');

describe('deleteService', () => {
  describe('deleteFile()', () => {
    let accessSpy, statSpy, unlinkSpy;

    beforeEach(() => {
      accessSpy = jest.spyOn(fs, 'access');
      statSpy = jest.spyOn(fs, 'stat');
      unlinkSpy = jest.spyOn(fs, 'unlink');
    });

    afterEach(() => {
      accessSpy.mockRestore();
      statSpy.mockRestore();
      unlinkSpy.mockRestore();
    });

    describe('Path Validation', () => {
      test('should reject null file path', async () => {
        await expect(deleteService.deleteFile(null))
          .rejects.toThrow('Invalid file path: path must be a non-empty string');
      });

      test('should reject undefined file path', async () => {
        await expect(deleteService.deleteFile(undefined))
          .rejects.toThrow('Invalid file path: path must be a non-empty string');
      });

      test('should reject empty string file path', async () => {
        await expect(deleteService.deleteFile(''))
          .rejects.toThrow('Invalid file path: path must be a non-empty string');
      });

      test('should reject path with null bytes', async () => {
        await expect(deleteService.deleteFile('/path/to/file\0.txt'))
          .rejects.toThrow('Invalid file path: path contains null bytes');
      });

      test('should reject path with traversal (..) segments', async () => {
        await expect(deleteService.deleteFile('/home/user/../../../etc/passwd'))
          .rejects.toThrow('Path traversal detected: file path contains ".." segments');
      });
    });

    describe('Successful Deletion', () => {
      test('should delete an existing file', async () => {
        const testPath = '/test/project/file.txt';

        accessSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true });
        unlinkSpy.mockResolvedValue();

        const result = await deleteService.deleteFile(testPath);

        expect(result).toEqual({ success: true, deleted: testPath });
        expect(accessSpy).toHaveBeenCalledWith(testPath, fs.constants.F_OK);
        expect(statSpy).toHaveBeenCalledWith(testPath);
        expect(unlinkSpy).toHaveBeenCalledWith(testPath);
      });
    });

    describe('Error Handling', () => {
      test('should fail if file does not exist', async () => {
        const testPath = '/test/missing.txt';

        accessSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

        await expect(deleteService.deleteFile(testPath))
          .rejects.toThrow(`File not found: ${testPath}`);

        expect(unlinkSpy).not.toHaveBeenCalled();
      });

      test('should fail if path is a directory', async () => {
        const testPath = '/test/directory';

        accessSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => false });

        await expect(deleteService.deleteFile(testPath))
          .rejects.toThrow('Cannot delete: /test/directory is not a file (use deleteDirectory for directories)');

        expect(unlinkSpy).not.toHaveBeenCalled();
      });

      test('should fail on permission denied', async () => {
        const testPath = '/protected/file.txt';

        accessSpy.mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }));

        await expect(deleteService.deleteFile(testPath))
          .rejects.toThrow(`Permission denied: cannot delete ${testPath}`);
      });
    });

    describe('Performance', () => {
      test('should complete deletion in <5ms', async () => {
        const testPath = '/test/file.txt';

        accessSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isFile: () => true });
        unlinkSpy.mockResolvedValue();

        const start = Date.now();
        await deleteService.deleteFile(testPath);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(5);
      });
    });
  });

  describe('deleteDirectory()', () => {
    let accessSpy, statSpy, rmSpy;

    beforeEach(() => {
      accessSpy = jest.spyOn(fs, 'access');
      statSpy = jest.spyOn(fs, 'stat');
      rmSpy = jest.spyOn(fs, 'rm');
    });

    afterEach(() => {
      accessSpy.mockRestore();
      statSpy.mockRestore();
      rmSpy.mockRestore();
    });

    describe('Path Validation', () => {
      test('should reject null directory path', async () => {
        await expect(deleteService.deleteDirectory(null))
          .rejects.toThrow('Invalid file path: path must be a non-empty string');
      });

      test('should reject path with traversal', async () => {
        await expect(deleteService.deleteDirectory('/home/../etc'))
          .rejects.toThrow('Path traversal detected');
      });
    });

    describe('Successful Deletion', () => {
      test('should delete an existing directory recursively', async () => {
        const testPath = '/test/project/directory';

        accessSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isDirectory: () => true });
        rmSpy.mockResolvedValue();

        const result = await deleteService.deleteDirectory(testPath);

        expect(result).toEqual({ success: true, deleted: testPath });
        expect(rmSpy).toHaveBeenCalledWith(testPath, { recursive: true, force: true });
      });
    });

    describe('Error Handling', () => {
      test('should fail if directory does not exist', async () => {
        const testPath = '/test/missing';

        accessSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

        await expect(deleteService.deleteDirectory(testPath))
          .rejects.toThrow(`Directory not found: ${testPath}`);

        expect(rmSpy).not.toHaveBeenCalled();
      });

      test('should fail if path is a file', async () => {
        const testPath = '/test/file.txt';

        accessSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isDirectory: () => false });

        await expect(deleteService.deleteDirectory(testPath))
          .rejects.toThrow('Cannot delete: /test/file.txt is not a directory (use deleteFile for files)');

        expect(rmSpy).not.toHaveBeenCalled();
      });

      test('should fail on permission denied', async () => {
        const testPath = '/protected/directory';

        accessSpy.mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }));

        await expect(deleteService.deleteDirectory(testPath))
          .rejects.toThrow(`Permission denied: cannot delete ${testPath}`);
      });
    });

    describe('Performance', () => {
      test('should complete deletion in <5ms', async () => {
        const testPath = '/test/dir';

        accessSpy.mockResolvedValue();
        statSpy.mockResolvedValue({ isDirectory: () => true });
        rmSpy.mockResolvedValue();

        const start = Date.now();
        await deleteService.deleteDirectory(testPath);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(5);
      });
    });
  });

  describe('deleteJsonProperty()', () => {
    let readFileSpy, writeFileSpy;

    beforeEach(() => {
      readFileSpy = jest.spyOn(fs, 'readFile');
      writeFileSpy = jest.spyOn(fs, 'writeFile');
    });

    afterEach(() => {
      readFileSpy.mockRestore();
      writeFileSpy.mockRestore();
    });

    describe('Path Validation', () => {
      test('should reject null file path', async () => {
        await expect(deleteService.deleteJsonProperty(null, 'property'))
          .rejects.toThrow('Invalid file path: path must be a non-empty string');
      });

      test('should reject path with traversal', async () => {
        await expect(deleteService.deleteJsonProperty('/home/../etc/file.json', 'property'))
          .rejects.toThrow('Path traversal detected');
      });
    });

    describe('Property Path Validation', () => {
      test('should reject null property path', async () => {
        readFileSpy.mockResolvedValue('{}');

        await expect(deleteService.deleteJsonProperty('/test/file.json', null))
          .rejects.toThrow('Invalid property path: must be a non-empty string');
      });

      test('should reject empty property path', async () => {
        readFileSpy.mockResolvedValue('{}');

        await expect(deleteService.deleteJsonProperty('/test/file.json', ''))
          .rejects.toThrow('Invalid property path: must be a non-empty string');
      });
    });

    describe('Successful Deletion', () => {
      test('should delete top-level property', async () => {
        const jsonData = { prop1: 'value1', prop2: 'value2', prop3: 'value3' };

        readFileSpy.mockResolvedValue(JSON.stringify(jsonData));
        writeFileSpy.mockResolvedValue();

        const result = await deleteService.deleteJsonProperty('/test/file.json', 'prop2');

        expect(result).toEqual({ success: true, deleted: 'prop2' });

        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenData = JSON.parse(writtenContent);

        expect(writtenData).toEqual({ prop1: 'value1', prop3: 'value3' });
        expect(writtenData.prop2).toBeUndefined();
      });

      test('should delete nested property using dot notation', async () => {
        const jsonData = {
          hooks: {
            PreToolUse: { command: 'test' },
            PostToolUse: { command: 'test2' }
          }
        };

        readFileSpy.mockResolvedValue(JSON.stringify(jsonData));
        writeFileSpy.mockResolvedValue();

        const result = await deleteService.deleteJsonProperty('/test/file.json', 'hooks.PreToolUse');

        expect(result).toEqual({ success: true, deleted: 'hooks.PreToolUse' });

        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenData = JSON.parse(writtenContent);

        expect(writtenData.hooks.PreToolUse).toBeUndefined();
        expect(writtenData.hooks.PostToolUse).toBeDefined();
      });

      test('should delete deeply nested property', async () => {
        const jsonData = {
          level1: {
            level2: {
              level3: {
                target: 'delete me',
                keep: 'keep me'
              }
            }
          }
        };

        readFileSpy.mockResolvedValue(JSON.stringify(jsonData));
        writeFileSpy.mockResolvedValue();

        const result = await deleteService.deleteJsonProperty('/test/file.json', 'level1.level2.level3.target');

        expect(result).toEqual({ success: true, deleted: 'level1.level2.level3.target' });

        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenData = JSON.parse(writtenContent);

        expect(writtenData.level1.level2.level3.target).toBeUndefined();
        expect(writtenData.level1.level2.level3.keep).toBe('keep me');
      });

      test('should pretty print resulting JSON', async () => {
        const jsonData = { a: 1, b: { c: 2 } };

        readFileSpy.mockResolvedValue(JSON.stringify(jsonData));
        writeFileSpy.mockResolvedValue();

        await deleteService.deleteJsonProperty('/test/file.json', 'a');

        const writtenContent = writeFileSpy.mock.calls[0][1];

        expect(writtenContent).toContain('  "b": {');
        expect(writtenContent).toContain('    "c": 2');
      });
    });

    describe('Error Handling', () => {
      test('should fail if file does not exist', async () => {
        readFileSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

        await expect(deleteService.deleteJsonProperty('/test/missing.json', 'property'))
          .rejects.toThrow('File not found: /test/missing.json');
      });

      test('should fail if JSON is invalid', async () => {
        readFileSpy.mockResolvedValue('{ invalid json }');

        await expect(deleteService.deleteJsonProperty('/test/file.json', 'property'))
          .rejects.toThrow('Failed to parse JSON');
      });

      test('should fail if property path not found (missing parent)', async () => {
        const jsonData = { hooks: {} };

        readFileSpy.mockResolvedValue(JSON.stringify(jsonData));

        await expect(deleteService.deleteJsonProperty('/test/file.json', 'hooks.PreToolUse.command'))
          .rejects.toThrow('Property path not found: hooks.PreToolUse.command');
      });

      test('should fail if property does not exist', async () => {
        const jsonData = { prop1: 'value1' };

        readFileSpy.mockResolvedValue(JSON.stringify(jsonData));

        await expect(deleteService.deleteJsonProperty('/test/file.json', 'nonexistent'))
          .rejects.toThrow('Property not found: nonexistent');
      });

      test('should fail if parent is not an object', async () => {
        const jsonData = { prop: 'string value' };

        readFileSpy.mockResolvedValue(JSON.stringify(jsonData));

        await expect(deleteService.deleteJsonProperty('/test/file.json', 'prop.nested'))
          .rejects.toThrow('Property path not found: prop.nested (parent is not an object)');
      });

      test('should fail on permission denied', async () => {
        readFileSpy.mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }));

        await expect(deleteService.deleteJsonProperty('/protected/file.json', 'property'))
          .rejects.toThrow('Permission denied: cannot access /protected/file.json');
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty object after deletion', async () => {
        const jsonData = { onlyProp: 'value' };

        readFileSpy.mockResolvedValue(JSON.stringify(jsonData));
        writeFileSpy.mockResolvedValue();

        await deleteService.deleteJsonProperty('/test/file.json', 'onlyProp');

        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenData = JSON.parse(writtenContent);

        expect(writtenData).toEqual({});
      });

      test('should handle deleting from nested empty parent', async () => {
        const jsonData = {
          parent: {
            child: 'value'
          }
        };

        readFileSpy.mockResolvedValue(JSON.stringify(jsonData));
        writeFileSpy.mockResolvedValue();

        await deleteService.deleteJsonProperty('/test/file.json', 'parent.child');

        const writtenContent = writeFileSpy.mock.calls[0][1];
        const writtenData = JSON.parse(writtenContent);

        expect(writtenData.parent).toEqual({});
      });
    });

    describe('Performance', () => {
      test('should complete deletion in <5ms', async () => {
        const jsonData = { prop1: 'value1', prop2: 'value2' };

        readFileSpy.mockResolvedValue(JSON.stringify(jsonData));
        writeFileSpy.mockResolvedValue();

        const start = Date.now();
        await deleteService.deleteJsonProperty('/test/file.json', 'prop1');
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(5);
      });
    });
  });
});
