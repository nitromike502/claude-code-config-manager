/**
 * Unit tests for CopyService.generateUniquePath()
 * Tests unique path generation with counter-based naming
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

describe('CopyService - generateUniquePath()', () => {
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

  describe('Basic Functionality', () => {
    test('should start counter at 2', async () => {
      const originalPath = '/target/agent.md';

      accessSpy.mockResolvedValue(undefined); // File doesn't exist

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/target/agent-2.md');
    });

    test('should increment counter until unique path found', async () => {
      const originalPath = '/target/agent.md';

      // Simulate: agent-2.md exists, agent-3.md exists, agent-4.md doesn't
      accessSpy
        .mockRejectedValueOnce(new Error('exists')) // -2 exists
        .mockRejectedValueOnce(new Error('exists')) // -3 exists
        .mockResolvedValueOnce(undefined);          // -4 doesn't exist

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/target/agent-4.md');
    });

    test('should handle many existing files (stress test)', async () => {
      const originalPath = '/target/popular.md';

      // Simulate 10 existing files
      for (let i = 0; i < 10; i++) {
        accessSpy.mockRejectedValueOnce(new Error('exists'));
      }
      accessSpy.mockResolvedValueOnce(undefined); // Finally doesn't exist

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/target/popular-11.md');
    });
  });

  describe('Extension Preservation', () => {
    test('should preserve .md extension', async () => {
      const originalPath = '/target/agent.md';

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toMatch(/\.md$/);
    });

    test('should preserve .json extension', async () => {
      const originalPath = '/target/config.json';

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toMatch(/\.json$/);
    });

    test('should handle files with no extension', async () => {
      const originalPath = '/target/README';

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/target/README-2');
    });

    test('should handle files with multiple dots', async () => {
      const originalPath = '/target/agent.config.md';

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/target/agent.config-2.md');
    });
  });

  describe('Path Components', () => {
    test('should preserve directory path', async () => {
      const originalPath = '/home/user/.claude/agents/my-agent.md';

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/home/user/.claude/agents/my-agent-2.md');
    });

    test('should handle nested directories', async () => {
      const originalPath = '/home/user/.claude/commands/dev/build/deploy.md';

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/home/user/.claude/commands/dev/build/deploy-2.md');
    });

    test('should preserve basename with hyphens', async () => {
      const originalPath = '/target/my-complex-agent-name.md';

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/target/my-complex-agent-name-2.md');
    });

    test('should preserve basename with numbers', async () => {
      const originalPath = '/target/agent-v2.md';

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/target/agent-v2-2.md');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long filenames', async () => {
      const longName = 'a'.repeat(200);
      const originalPath = `/target/${longName}.md`;

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe(`/target/${longName}-2.md`);
    });

    test('should handle paths with spaces', async () => {
      const originalPath = '/target/my agent file.md';

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/target/my agent file-2.md');
    });

    test('should handle paths with special characters', async () => {
      const originalPath = '/target/agent_test@v1.md';

      accessSpy.mockResolvedValue(undefined);

      const result = await copyService.generateUniquePath(originalPath);
      expect(result).toBe('/target/agent_test@v1-2.md');
    });
  });
});
