/**
 * Unit tests for CopyService.resolveConflict()
 * Tests conflict resolution strategies: skip, overwrite, rename
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

describe('CopyService - resolveConflict()', () => {
  // Store original fs methods to restore after tests
  let accessSpy;

  beforeEach(() => {
    // Create spies on fs.promises methods instead of mocking the whole module
    accessSpy = jest.spyOn(fs, 'access');

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original implementations
    accessSpy.mockRestore();
  });

  describe('Skip Strategy', () => {
    test('should throw error when strategy is skip', async () => {
      const targetPath = '/target/agent.md';

      await expect(copyService.resolveConflict(targetPath, 'skip'))
        .rejects.toThrow('Copy cancelled by user');
    });
  });

  describe('Overwrite Strategy', () => {
    test('should return original path when strategy is overwrite', async () => {
      const targetPath = '/target/agent.md';

      const result = await copyService.resolveConflict(targetPath, 'overwrite');
      expect(result).toBe(targetPath);
    });
  });

  describe('Rename Strategy', () => {
    test('should call generateUniquePath when strategy is rename', async () => {
      const targetPath = '/target/agent.md';

      // Mock file system to simulate existing files
      // generateUniquePath checks agent-2.md (exists), then agent-3.md (doesn't exist)
      accessSpy
        .mockResolvedValueOnce(undefined)  // agent-2.md exists (first check in do...while)
        .mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })); // agent-3.md doesn't exist (second check)

      const result = await copyService.resolveConflict(targetPath, 'rename');

      expect(result).toBe('/target/agent-3.md');
      expect(accessSpy).toHaveBeenCalledTimes(2);
    });

    test('should preserve file extension in renamed path', async () => {
      const targetPath = '/target/my-command.md';

      // Mock file system - first check (my-command-2.md) doesn't exist
      accessSpy.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

      const result = await copyService.resolveConflict(targetPath, 'rename');

      expect(result).toBe('/target/my-command-2.md');
      expect(accessSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unknown Strategy', () => {
    test('should throw error for unknown strategy', async () => {
      const targetPath = '/target/agent.md';

      await expect(copyService.resolveConflict(targetPath, 'merge'))
        .rejects.toThrow('Unknown conflict strategy: merge');
    });

    test('should throw error for invalid strategy', async () => {
      const targetPath = '/target/agent.md';

      await expect(copyService.resolveConflict(targetPath, 'delete'))
        .rejects.toThrow('Unknown conflict strategy: delete');
    });
  });

  describe('No Strategy', () => {
    test('should return original path when no strategy provided', async () => {
      const targetPath = '/target/agent.md';

      const result = await copyService.resolveConflict(targetPath);
      expect(result).toBe(targetPath);
    });

    test('should return original path when strategy is null', async () => {
      const targetPath = '/target/agent.md';

      const result = await copyService.resolveConflict(targetPath, null);
      expect(result).toBe(targetPath);
    });

    test('should return original path when strategy is undefined', async () => {
      const targetPath = '/target/agent.md';

      const result = await copyService.resolveConflict(targetPath, undefined);
      expect(result).toBe(targetPath);
    });
  });
});
