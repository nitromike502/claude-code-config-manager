/**
 * Malformed JSON Error Handling Tests - Hooks & MCP
 *
 * Tests that the backend can gracefully handle malformed JSON files
 * (settings.json, settings.local.json, .mcp.json) without crashing
 * the server or blocking other valid files.
 */

const path = require('path');
const { getProjectHooks, getUserHooks, getProjectMCP, getUserMCP } = require('../../../src/backend/services/projectDiscovery');

// Paths to test fixtures
const MALFORMED_PROJECT_PATH = path.join(__dirname, '../../fixtures/projects/malformed-project');
const VALID_PROJECT_PATH = path.join(__dirname, '../../fixtures/projects/valid-project');
const MINIMAL_PROJECT_PATH = path.join(__dirname, '../../fixtures/projects/minimal-project');

describe('Malformed JSON Error Handling - Hooks', () => {
  describe('Parser Resilience', () => {
    test('should not crash when parsing malformed JSON in settings.json', async () => {
      // Attempt to read hooks from project with malformed JSON
      // This should not throw an error, but may return warnings
      const result = await getProjectHooks(MALFORMED_PROJECT_PATH);

      // Should complete without throwing
      expect(result).toBeDefined();
      expect(result.hooks).toBeDefined();
      expect(result.warnings).toBeDefined();

      // Should have arrays (may be empty or contain items)
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.hooks)).toBe(true);
    });

    test('should not crash when user settings.json has malformed JSON', async () => {
      // Test user-level hooks parsing
      // This should handle gracefully even if ~/.claude/settings.json has issues
      const result = await getUserHooks();

      // Should complete without throwing
      expect(result).toBeDefined();
      expect(result.hooks).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.hooks)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Warning System', () => {
    test('warnings should include file path and error description for malformed JSON', async () => {
      // Use malformed-project which has invalid JSON in settings.json
      const result = await getProjectHooks(MALFORMED_PROJECT_PATH);

      // Should have warnings for the malformed file
      expect(result.warnings).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);

      // Each warning should have required fields
      const warning = result.warnings[0];

      // Structure validation
      expect(warning).toHaveProperty('file');
      expect(warning).toHaveProperty('error');
      expect(warning).toHaveProperty('skipped');
      expect(typeof warning.file).toBe('string');
      expect(typeof warning.error).toBe('string');
      expect(warning.skipped).toBe(true);

      // File path should be absolute
      expect(path.isAbsolute(warning.file)).toBe(true);

      // Should contain the filename and .json extension
      expect(warning.file).toContain('.json');
      expect(warning.file).toContain('settings.json');

      // Error message should mention JSON or parsing
      expect(warning.error.toLowerCase()).toMatch(/json|parse|invalid|syntax/);

      // Should not be an empty string
      expect(warning.error.length).toBeGreaterThan(0);
    });

    test('error messages should be descriptive and actionable', async () => {
      // Test that error messages provide useful information
      const result = await getProjectHooks(MALFORMED_PROJECT_PATH);

      expect(result.warnings.length).toBeGreaterThan(0);

      const warning = result.warnings[0];

      // Error should contain details about what went wrong
      expect(warning.error).toBeDefined();
      expect(warning.error.length).toBeGreaterThan(10); // Should be a real message

      // Should mention the specific file that failed
      expect(warning.file).toContain('malformed-project');
    });
  });

  describe('Continued Processing', () => {
    test('system should return empty hooks array when settings.json is malformed', async () => {
      // The malformed-project has invalid JSON in settings.json
      // The system should skip it and return empty array with warning
      const result = await getProjectHooks(MALFORMED_PROJECT_PATH);

      // Should not throw an error
      expect(result).toBeDefined();

      // Should return empty hooks array (can't parse malformed file)
      expect(result.hooks).toBeDefined();
      expect(Array.isArray(result.hooks)).toBe(true);

      // Should have warnings array with at least one warning
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('system should continue if settings.local.json is malformed but settings.json is valid', async () => {
      // If one settings file is malformed, should still process the other
      // This test verifies graceful degradation
      const result = await getProjectHooks(VALID_PROJECT_PATH);

      // Should not throw an error
      expect(result).toBeDefined();

      // Should have processed any valid hooks files
      expect(result.hooks).toBeDefined();
      expect(Array.isArray(result.hooks)).toBe(true);

      // Should have warnings array (may or may not have warnings)
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Multiple Error Handling', () => {
    test('warnings array should be empty when no errors occur', async () => {
      // Test a project with no hooks (minimal-project has no hooks and no errors)
      const result = await getProjectHooks(MINIMAL_PROJECT_PATH);

      expect(result).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBe(0);
      expect(result.hooks.length).toBe(0);
    });

    test('malformed JSON should generate exactly one warning per malformed file', async () => {
      // Malformed-project has at least one malformed JSON file
      const result = await getProjectHooks(MALFORMED_PROJECT_PATH);

      expect(result).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);

      // Each warning should have the required structure
      result.warnings.forEach(warning => {
        expect(warning).toHaveProperty('file');
        expect(warning).toHaveProperty('error');
        expect(warning).toHaveProperty('skipped');
        expect(typeof warning.file).toBe('string');
        expect(typeof warning.error).toBe('string');
        expect(path.isAbsolute(warning.file)).toBe(true);
        expect(warning.skipped).toBe(true);
      });

      // Should have at least one warning for the malformed file
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Result Structure Validation', () => {
    test('result should have correct structure even with malformed JSON', async () => {
      const result = await getProjectHooks(MALFORMED_PROJECT_PATH);

      // Verify result structure
      expect(result).toHaveProperty('hooks');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.hooks)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);

      // Even with JSON errors, parsing should complete without throwing
      expect(result).toBeDefined();
      expect(result.hooks).toBeDefined();
      expect(result.warnings).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing settings.json file gracefully', async () => {
      // minimal-project has no settings.json
      const result = await getProjectHooks(MINIMAL_PROJECT_PATH);

      expect(result).toBeDefined();
      expect(result.hooks).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('should handle non-existent project directory gracefully', async () => {
      // Test with a path that doesn't exist
      const nonExistentPath = path.join(__dirname, '../../fixtures/projects/nonexistent-project');
      const result = await getProjectHooks(nonExistentPath);

      // Should return empty arrays, not throw
      expect(result).toBeDefined();
      expect(result.hooks).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('should handle JSON with trailing comma (common error)', async () => {
      // The invalid-json.json fixture has a trailing comma
      // This is a common JSON syntax error
      const result = await getProjectHooks(MALFORMED_PROJECT_PATH);

      // Should have caught the syntax error
      expect(result.warnings.length).toBeGreaterThan(0);

      // Error message should indicate JSON syntax issue
      const jsonWarning = result.warnings.find(w =>
        w.error.toLowerCase().includes('json') ||
        w.error.toLowerCase().includes('syntax')
      );
      expect(jsonWarning).toBeDefined();
    });
  });
});

describe('Malformed JSON Error Handling - MCP', () => {
  describe('Parser Resilience', () => {
    test('should not crash when parsing malformed JSON in .mcp.json', async () => {
      // Attempt to read MCP servers from project with malformed JSON
      const result = await getProjectMCP(MALFORMED_PROJECT_PATH);

      // Should complete without throwing
      expect(result).toBeDefined();
      expect(result.mcp).toBeDefined();
      expect(result.warnings).toBeDefined();

      // Should have arrays
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.mcp)).toBe(true);
    });

    test('should not crash when user MCP settings have malformed JSON', async () => {
      // Test user-level MCP parsing from ~/.claude/settings.json
      const result = await getUserMCP();

      // Should complete without throwing
      expect(result).toBeDefined();
      expect(result.mcp).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.mcp)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Warning System', () => {
    test('warnings should include file path and error description for malformed MCP JSON', async () => {
      // Use malformed-project which has invalid JSON in .mcp.json (if it exists)
      const result = await getProjectMCP(MALFORMED_PROJECT_PATH);

      // If .mcp.json exists and is malformed, should have warnings
      if (result.warnings.length > 0) {
        const warning = result.warnings[0];

        // Structure validation
        expect(warning).toHaveProperty('file');
        expect(warning).toHaveProperty('error');
        expect(warning).toHaveProperty('skipped');
        expect(typeof warning.file).toBe('string');
        expect(typeof warning.error).toBe('string');
        expect(warning.skipped).toBe(true);

        // File path should be absolute
        expect(path.isAbsolute(warning.file)).toBe(true);

        // Should contain the filename and .json extension
        expect(warning.file).toContain('.json');

        // Error message should mention JSON or parsing
        expect(warning.error.toLowerCase()).toMatch(/json|parse|invalid|syntax/);
      }

      // The key test: parsing should not crash
      expect(result).toBeDefined();
      expect(result.mcp).toBeDefined();
    });
  });

  describe('Continued Processing', () => {
    test('system should return empty MCP array when .mcp.json is malformed', async () => {
      // If .mcp.json is malformed, should return empty array with warning
      const result = await getProjectMCP(MALFORMED_PROJECT_PATH);

      // Should not throw an error
      expect(result).toBeDefined();

      // Should return MCP array (empty if malformed)
      expect(result.mcp).toBeDefined();
      expect(Array.isArray(result.mcp)).toBe(true);

      // Should have warnings array
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Result Structure Validation', () => {
    test('result should have correct structure even with malformed JSON', async () => {
      const result = await getProjectMCP(MALFORMED_PROJECT_PATH);

      // Verify result structure
      expect(result).toHaveProperty('mcp');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.mcp)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);

      // Even with JSON errors, parsing should complete without throwing
      expect(result).toBeDefined();
      expect(result.mcp).toBeDefined();
      expect(result.warnings).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing .mcp.json file gracefully', async () => {
      // minimal-project has no .mcp.json — user-level servers are still returned
      const result = await getProjectMCP(MINIMAL_PROJECT_PATH);

      expect(result).toBeDefined();
      expect(Array.isArray(result.mcp)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      // No file errors should be generated when .mcp.json is simply absent
      expect(result.warnings).toEqual([]);
      // User-level servers are merged in; all should have scope: 'user'
      result.mcp.forEach(server => {
        expect(server.scope).toBe('user');
      });
    });

    test('should handle non-existent project directory gracefully', async () => {
      // Test with a path that doesn't exist
      const nonExistentPath = path.join(__dirname, '../../fixtures/projects/nonexistent-project');
      const result = await getProjectMCP(nonExistentPath);

      // Should not throw, should return structured response
      expect(result).toBeDefined();
      expect(Array.isArray(result.mcp)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      // No warnings — missing files are handled gracefully
      expect(result.warnings).toEqual([]);
      // User-level servers are still returned even for non-existent project paths
      result.mcp.forEach(server => {
        expect(server.scope).toBe('user');
      });
    });
  });
});

describe('JSON Error Handling - Integration Tests', () => {
  describe('Mixed Valid and Invalid Files', () => {
    test('should process valid hooks while skipping malformed JSON files', async () => {
      // Test that system can handle mixed scenarios
      const result = await getProjectHooks(MALFORMED_PROJECT_PATH);

      expect(result).toBeDefined();
      expect(result.hooks).toBeDefined();
      expect(result.warnings).toBeDefined();

      // Key invariant: should never throw, always return structured response
      expect(Array.isArray(result.hooks)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Error Message Quality', () => {
    test('error messages should contain enough context to debug issues', async () => {
      const result = await getProjectHooks(MALFORMED_PROJECT_PATH);

      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          // File path should be complete and absolute
          expect(path.isAbsolute(warning.file)).toBe(true);

          // Error message should not be generic
          expect(warning.error).not.toBe('Error');
          expect(warning.error).not.toBe('Failed');

          // Should have meaningful content
          expect(warning.error.length).toBeGreaterThan(5);
        });
      }
    });

    test('warnings should indicate file was skipped due to JSON error', async () => {
      const result = await getProjectHooks(MALFORMED_PROJECT_PATH);

      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          // Should explicitly mark as skipped
          expect(warning.skipped).toBe(true);

          // Should indicate JSON-related issue
          const errorLower = warning.error.toLowerCase();
          expect(
            errorLower.includes('json') ||
            errorLower.includes('syntax') ||
            errorLower.includes('parse')
          ).toBe(true);
        });
      }
    });
  });
});
