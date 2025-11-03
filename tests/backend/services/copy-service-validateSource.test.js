/**
 * Unit tests for CopyService.validateSource()
 * Tests security validation, file existence, and file type validation
 *
 * NOTE: This test file uses a different mocking strategy than typical Jest tests due to
 * complex module dependencies. We spy on fs.promises methods rather than mock the entire
 * fs module to avoid circular dependency issues with fileReader and projectDiscovery.
 */

const path = require('path');
const fs = require('fs').promises;

// Mock only the projectDiscovery module to avoid loading the entire dependency chain
jest.mock('../../../src/backend/services/projectDiscovery', () => ({
  discoverProjects: jest.fn()
}));

const copyService = require('../../../src/backend/services/copy-service');

describe('CopyService - validateSource()', () => {
  // Store original fs methods to restore after tests
  let accessSpy;
  let statSpy;

  beforeEach(() => {
    // Create spies on fs.promises methods instead of mocking the whole module
    accessSpy = jest.spyOn(fs, 'access');
    statSpy = jest.spyOn(fs, 'stat');

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original implementations
    accessSpy.mockRestore();
    statSpy.mockRestore();
  });

  describe('Security Validation', () => {
    test('should reject null source path', async () => {
      await expect(copyService.validateSource(null))
        .rejects.toThrow('Invalid source path: path must be a non-empty string');
    });

    test('should reject undefined source path', async () => {
      await expect(copyService.validateSource(undefined))
        .rejects.toThrow('Invalid source path: path must be a non-empty string');
    });

    test('should reject empty string source path', async () => {
      await expect(copyService.validateSource(''))
        .rejects.toThrow('Invalid source path: path must be a non-empty string');
    });

    test('should reject non-string source path', async () => {
      await expect(copyService.validateSource(123))
        .rejects.toThrow('Invalid source path: path must be a non-empty string');
    });

    test('should reject path with null bytes', async () => {
      await expect(copyService.validateSource('/path/to/file\0.md'))
        .rejects.toThrow('Invalid source path: path contains null bytes');
    });

    test('should reject path traversal with .. segments', async () => {
      await expect(copyService.validateSource('/home/user/../../../etc/passwd'))
        .rejects.toThrow('Path traversal detected: source path contains ".." segments');
    });

    test('should reject relative path traversal', async () => {
      await expect(copyService.validateSource('../../etc/passwd'))
        .rejects.toThrow('Path traversal detected: source path contains ".." segments');
    });

    test('should reject path with .. in middle', async () => {
      await expect(copyService.validateSource('/home/user/project/../../../etc/passwd'))
        .rejects.toThrow('Path traversal detected: source path contains ".." segments');
    });
  });

  describe('File Existence Validation', () => {
    test('should throw error when file does not exist (ENOENT)', async () => {
      const testPath = '/home/user/nonexistent.md';

      accessSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

      await expect(copyService.validateSource(testPath))
        .rejects.toThrow(`Source file not found: ${path.resolve(testPath)}`);
    });

    test('should throw error when permission denied (EACCES)', async () => {
      const testPath = '/home/user/noperm.md';

      accessSpy.mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }));

      await expect(copyService.validateSource(testPath))
        .rejects.toThrow(`Permission denied: cannot read ${path.resolve(testPath)}`);
    });

    test('should throw error for other access errors', async () => {
      const testPath = '/home/user/error.md';

      accessSpy.mockRejectedValue(new Error('Unknown error'));

      await expect(copyService.validateSource(testPath))
        .rejects.toThrow('Cannot access source file: Unknown error');
    });
  });

  describe('File Type Validation', () => {
    test('should accept regular file', async () => {
      const testPath = '/home/user/agent.md';
      const resolvedPath = path.resolve(testPath);

      accessSpy.mockResolvedValue(undefined);
      statSpy.mockResolvedValue({
        isFile: () => true
      });

      const result = await copyService.validateSource(testPath);
      expect(result).toBe(resolvedPath);
    });

    test('should reject directory', async () => {
      const testPath = '/home/user/agents';

      accessSpy.mockResolvedValue(undefined);
      statSpy.mockResolvedValue({
        isFile: () => false
      });

      await expect(copyService.validateSource(testPath))
        .rejects.toThrow(`Invalid source: ${path.resolve(testPath)} is not a regular file`);
    });

    test('should handle stat errors gracefully', async () => {
      const testPath = '/home/user/agent.md';

      accessSpy.mockResolvedValue(undefined);
      statSpy.mockRejectedValue(new Error('Stat failed'));

      await expect(copyService.validateSource(testPath))
        .rejects.toThrow('Cannot stat source file: Stat failed');
    });
  });

  describe('Path Normalization', () => {
    test('should normalize and resolve valid path', async () => {
      const testPath = '/home/user/./agents/test.md';
      const expectedPath = path.resolve('/home/user/agents/test.md');

      accessSpy.mockResolvedValue(undefined);
      statSpy.mockResolvedValue({
        isFile: () => true
      });

      const result = await copyService.validateSource(testPath);
      expect(result).toBe(expectedPath);
    });
  });
});
