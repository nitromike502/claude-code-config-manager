/**
 * Unit tests for CopyService.detectConflict()
 * Tests conflict detection when target file already exists
 *
 * NOTE: This test file uses a different mocking strategy than typical Jest tests due to
 * complex module dependencies. We spy on fs.promises methods rather than mock the entire
 * fs module to avoid circular dependency issues with fileReader and projectDiscovery.
 */

const fs = require('fs').promises;

// Mock only the projectDiscovery module to avoid loading the entire dependency chain
jest.mock('../../../src/backend/services/projectDiscovery', () => ({
  discoverProjects: jest.fn()
}));

const copyService = require('../../../src/backend/services/copy-service');

describe('CopyService - detectConflict()', () => {
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

  describe('No Conflict Cases', () => {
    test('should return null when target does not exist', async () => {
      const sourcePath = '/source/agent.md';
      const targetPath = '/target/agent.md';

      accessSpy.mockRejectedValue(new Error('ENOENT'));

      const result = await copyService.detectConflict(sourcePath, targetPath);
      expect(result).toBeNull();
    });
  });

  describe('Conflict Detection', () => {
    test('should return conflict object when target exists', async () => {
      const sourcePath = '/source/agent.md';
      const targetPath = '/target/agent.md';

      const sourceDate = new Date('2025-01-01T10:00:00Z');
      const targetDate = new Date('2025-01-02T12:00:00Z');

      accessSpy.mockResolvedValue(undefined);
      statSpy
        .mockResolvedValueOnce({ mtime: sourceDate })
        .mockResolvedValueOnce({ mtime: targetDate });

      const result = await copyService.detectConflict(sourcePath, targetPath);

      expect(result).not.toBeNull();
      expect(result.targetPath).toBe(targetPath);
      expect(result.sourceModified).toBe(sourceDate.toISOString());
      expect(result.targetModified).toBe(targetDate.toISOString());
    });

    test('should include ISO formatted timestamps', async () => {
      const sourcePath = '/source/agent.md';
      const targetPath = '/target/agent.md';

      const sourceDate = new Date('2025-11-01T14:30:00Z');
      const targetDate = new Date('2025-11-02T09:15:00Z');

      accessSpy.mockResolvedValue(undefined);
      statSpy
        .mockResolvedValueOnce({ mtime: sourceDate })
        .mockResolvedValueOnce({ mtime: targetDate });

      const result = await copyService.detectConflict(sourcePath, targetPath);

      expect(result.sourceModified).toBe('2025-11-01T14:30:00.000Z');
      expect(result.targetModified).toBe('2025-11-02T09:15:00.000Z');
    });
  });

  describe('Error Handling', () => {
    test('should return null on stat error (graceful degradation)', async () => {
      const sourcePath = '/source/agent.md';
      const targetPath = '/target/agent.md';

      accessSpy.mockResolvedValue(undefined);
      statSpy.mockRejectedValue(new Error('Permission denied'));

      const result = await copyService.detectConflict(sourcePath, targetPath);
      expect(result).toBeNull();
    });

    test('should return null on access error', async () => {
      const sourcePath = '/source/agent.md';
      const targetPath = '/target/agent.md';

      accessSpy.mockRejectedValue(new Error('Access denied'));

      const result = await copyService.detectConflict(sourcePath, targetPath);
      expect(result).toBeNull();
    });
  });
});
