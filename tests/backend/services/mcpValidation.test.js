/**
 * MCP Validation Service Tests
 * Tests for MCP server update validation logic
 *
 * Test Coverage:
 * - Transport type validation (stdio, http, sse)
 * - Transport-specific field validation
 * - Name validation
 * - Common field validation (enabled, timeout, retries)
 * - Edge cases and invalid inputs
 */

const { validateMcpUpdate, VALID_TRANSPORT_TYPES } = require('../../../src/backend/services/mcpValidation');

describe('MCP Validation Service', () => {
  describe('validateMcpUpdate', () => {
    const stdioServer = {
      type: 'stdio',
      command: 'npx',
      args: ['-y', 'test'],
      enabled: true
    };

    const httpServer = {
      type: 'http',
      url: 'https://example.com',
      enabled: true
    };

    const sseServer = {
      type: 'sse',
      url: 'https://sse.example.com',
      enabled: true
    };

    describe('transport type validation', () => {
      it('should accept valid transport types', () => {
        VALID_TRANSPORT_TYPES.forEach(type => {
          const result = validateMcpUpdate({ type }, stdioServer);
          const transportErrors = result.errors.filter(e => e.includes('Invalid transport type'));
          expect(transportErrors).toHaveLength(0);
        });
      });

      it('should export correct valid transport types', () => {
        expect(VALID_TRANSPORT_TYPES).toEqual(['stdio', 'http', 'sse']);
      });

      it('should reject invalid transport type', () => {
        const result = validateMcpUpdate({ type: 'invalid' }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Invalid transport type'))).toBe(true);
      });

      it('should reject empty transport type', () => {
        const result = validateMcpUpdate({ type: '' }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Invalid transport type'))).toBe(true);
      });

      it('should reject null transport type', () => {
        const result = validateMcpUpdate({ type: null }, stdioServer);
        expect(result.valid).toBe(false);
      });
    });

    describe('stdio transport validation', () => {
      it('should require command for stdio', () => {
        const result = validateMcpUpdate({ command: '' }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Command must be a non-empty string'))).toBe(true);
      });

      it('should accept valid command', () => {
        const result = validateMcpUpdate({ command: 'node' }, stdioServer);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject non-string command', () => {
        const result = validateMcpUpdate({ command: 123 }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should reject command with only whitespace', () => {
        const result = validateMcpUpdate({ command: '   ' }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should accept valid args array', () => {
        const result = validateMcpUpdate({ args: ['--flag', 'value'] }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should accept empty args array', () => {
        const result = validateMcpUpdate({ args: [] }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should reject non-array args', () => {
        const result = validateMcpUpdate({ args: 'not-an-array' }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Args must be an array'))).toBe(true);
      });

      it('should reject args with non-string elements', () => {
        const result = validateMcpUpdate({ args: ['valid', 123, 'string'] }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('All args must be strings'))).toBe(true);
      });

      it('should accept valid env object', () => {
        const result = validateMcpUpdate({ env: { KEY: 'value', TOKEN: '${SECRET}' } }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should accept empty env object', () => {
        const result = validateMcpUpdate({ env: {} }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should reject non-object env', () => {
        const result = validateMcpUpdate({ env: 'not-an-object' }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Env must be an object'))).toBe(true);
      });

      it('should reject array env', () => {
        const result = validateMcpUpdate({ env: ['array'] }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Env must be an object'))).toBe(true);
      });

      it('should reject null env', () => {
        const result = validateMcpUpdate({ env: null }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should reject env with non-string values', () => {
        const result = validateMcpUpdate({ env: { KEY: 'value', NUM: 123 } }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('All env values must be strings'))).toBe(true);
      });

      it('should reject url for stdio', () => {
        const result = validateMcpUpdate({ url: 'https://example.com' }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('URL is not valid for stdio transport'))).toBe(true);
      });

      it('should reject headers for stdio', () => {
        const result = validateMcpUpdate({ headers: { 'X-Key': 'value' } }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Headers is not valid for stdio transport'))).toBe(true);
      });

      it('should require command when changing to stdio', () => {
        const httpToStdio = { type: 'stdio' };
        const result = validateMcpUpdate(httpToStdio, httpServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Command is required for stdio transport'))).toBe(true);
      });
    });

    describe('http/sse transport validation', () => {
      it('should require url for http', () => {
        const result = validateMcpUpdate({ url: '' }, httpServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('URL must be a non-empty string'))).toBe(true);
      });

      it('should require url for sse', () => {
        const result = validateMcpUpdate({ url: '' }, sseServer);
        expect(result.valid).toBe(false);
      });

      it('should accept valid url', () => {
        const result = validateMcpUpdate({ url: 'https://api.example.com/mcp' }, httpServer);
        expect(result.valid).toBe(true);
      });

      it('should reject non-string url', () => {
        const result = validateMcpUpdate({ url: 12345 }, httpServer);
        expect(result.valid).toBe(false);
      });

      it('should reject url with only whitespace', () => {
        const result = validateMcpUpdate({ url: '   ' }, httpServer);
        expect(result.valid).toBe(false);
      });

      it('should accept valid headers object', () => {
        const result = validateMcpUpdate({ headers: { 'Authorization': 'Bearer token', 'X-Key': 'value' } }, httpServer);
        expect(result.valid).toBe(true);
      });

      it('should accept empty headers object', () => {
        const result = validateMcpUpdate({ headers: {} }, httpServer);
        expect(result.valid).toBe(true);
      });

      it('should reject non-object headers', () => {
        const result = validateMcpUpdate({ headers: 'not-an-object' }, httpServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Headers must be an object'))).toBe(true);
      });

      it('should reject array headers', () => {
        const result = validateMcpUpdate({ headers: ['header'] }, httpServer);
        expect(result.valid).toBe(false);
      });

      it('should reject null headers', () => {
        const result = validateMcpUpdate({ headers: null }, httpServer);
        expect(result.valid).toBe(false);
      });

      it('should reject headers with non-string values', () => {
        const result = validateMcpUpdate({ headers: { 'Valid': 'string', 'Invalid': 123 } }, httpServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('All header values must be strings'))).toBe(true);
      });

      it('should reject command for http', () => {
        const result = validateMcpUpdate({ command: 'npx' }, httpServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Command is not valid for http/sse transport'))).toBe(true);
      });

      it('should reject command for sse', () => {
        const result = validateMcpUpdate({ command: 'node' }, sseServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Command is not valid for http/sse transport'))).toBe(true);
      });

      it('should reject args for http', () => {
        const result = validateMcpUpdate({ args: ['--flag'] }, httpServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Args is not valid for http/sse transport'))).toBe(true);
      });

      it('should reject env for http', () => {
        const result = validateMcpUpdate({ env: { KEY: 'value' } }, httpServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Env is not valid for http/sse transport'))).toBe(true);
      });

      it('should require url when changing to http', () => {
        const stdioToHttp = { type: 'http' };
        const result = validateMcpUpdate(stdioToHttp, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('URL is required for http/sse transport'))).toBe(true);
      });

      it('should require url when changing to sse', () => {
        const stdioToSse = { type: 'sse' };
        const result = validateMcpUpdate(stdioToSse, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('URL is required for http/sse transport'))).toBe(true);
      });
    });

    describe('name validation', () => {
      it('should accept valid name', () => {
        const result = validateMcpUpdate({ name: 'valid-name_123' }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should accept name with hyphens', () => {
        const result = validateMcpUpdate({ name: 'test-server-name' }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should accept name with underscores', () => {
        const result = validateMcpUpdate({ name: 'test_server_name' }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should accept name with numbers', () => {
        const result = validateMcpUpdate({ name: 'server123' }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should accept mixed valid characters', () => {
        const result = validateMcpUpdate({ name: 'Test-Server_2024' }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should reject empty name', () => {
        const result = validateMcpUpdate({ name: '' }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Name must be a non-empty string'))).toBe(true);
      });

      it('should reject name with only whitespace', () => {
        const result = validateMcpUpdate({ name: '   ' }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should reject name with spaces', () => {
        const result = validateMcpUpdate({ name: 'invalid name' }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('can only contain letters, numbers, hyphens, and underscores'))).toBe(true);
      });

      it('should reject name with special characters', () => {
        const result = validateMcpUpdate({ name: 'invalid@name!' }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should reject name with dots', () => {
        const result = validateMcpUpdate({ name: 'invalid.name' }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should reject name with slashes', () => {
        const result = validateMcpUpdate({ name: 'invalid/name' }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should reject non-string name', () => {
        const result = validateMcpUpdate({ name: 123 }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should reject null name', () => {
        const result = validateMcpUpdate({ name: null }, stdioServer);
        expect(result.valid).toBe(false);
      });
    });

    describe('common field validation', () => {
      it('should accept boolean true for enabled', () => {
        const result = validateMcpUpdate({ enabled: true }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should accept boolean false for enabled', () => {
        const result = validateMcpUpdate({ enabled: false }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should reject string enabled', () => {
        const result = validateMcpUpdate({ enabled: 'true' }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Enabled must be a boolean'))).toBe(true);
      });

      it('should reject number enabled', () => {
        const result = validateMcpUpdate({ enabled: 1 }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should accept positive timeout', () => {
        const result = validateMcpUpdate({ timeout: 30000 }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should reject zero timeout', () => {
        const result = validateMcpUpdate({ timeout: 0 }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Timeout must be a positive integer'))).toBe(true);
      });

      it('should reject negative timeout', () => {
        const result = validateMcpUpdate({ timeout: -1 }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should reject float timeout', () => {
        const result = validateMcpUpdate({ timeout: 30.5 }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should reject string timeout', () => {
        const result = validateMcpUpdate({ timeout: '30000' }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should accept zero retries', () => {
        const result = validateMcpUpdate({ retries: 0 }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should accept positive retries', () => {
        const result = validateMcpUpdate({ retries: 3 }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should reject negative retries', () => {
        const result = validateMcpUpdate({ retries: -1 }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Retries must be a non-negative integer'))).toBe(true);
      });

      it('should reject float retries', () => {
        const result = validateMcpUpdate({ retries: 2.5 }, stdioServer);
        expect(result.valid).toBe(false);
      });

      it('should reject string retries', () => {
        const result = validateMcpUpdate({ retries: '3' }, stdioServer);
        expect(result.valid).toBe(false);
      });
    });

    describe('multiple validation errors', () => {
      it('should collect all validation errors', () => {
        const result = validateMcpUpdate(
          {
            type: 'invalid-type',
            name: 'invalid name!',
            enabled: 'not-boolean',
            timeout: -5
          },
          stdioServer
        );

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
        expect(result.errors.some(e => e.includes('Invalid transport type'))).toBe(true);
        expect(result.errors.some(e => e.includes('can only contain'))).toBe(true);
        expect(result.errors.some(e => e.includes('Enabled must be a boolean'))).toBe(true);
        expect(result.errors.some(e => e.includes('Timeout must be a positive integer'))).toBe(true);
      });

      it('should report transport-specific violations', () => {
        const result = validateMcpUpdate(
          {
            url: 'https://example.com',
            headers: { 'X-Key': 'value' }
          },
          stdioServer
        );

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors.some(e => e.includes('URL is not valid for stdio'))).toBe(true);
        expect(result.errors.some(e => e.includes('Headers is not valid for stdio'))).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle empty updates object', () => {
        const result = validateMcpUpdate({}, stdioServer);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle updates with undefined values', () => {
        const result = validateMcpUpdate({ command: undefined }, stdioServer);
        expect(result.valid).toBe(true);
      });

      it('should validate transport change with all new fields', () => {
        const result = validateMcpUpdate(
          {
            type: 'http',
            url: 'https://new-api.example.com',
            headers: { 'X-Key': 'value' }
          },
          stdioServer
        );

        expect(result.valid).toBe(true);
      });

      it('should handle transport change from http to stdio', () => {
        const result = validateMcpUpdate(
          {
            type: 'stdio',
            command: 'node',
            args: ['server.js']
          },
          httpServer
        );

        expect(result.valid).toBe(true);
      });

      it('should preserve existing valid fields', () => {
        // Only updating enabled, other fields remain valid
        const result = validateMcpUpdate({ enabled: false }, stdioServer);
        expect(result.valid).toBe(true);
      });
    });

    describe('return format', () => {
      it('should return object with valid and errors properties', () => {
        const result = validateMcpUpdate({ enabled: true }, stdioServer);
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('errors');
        expect(typeof result.valid).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
      });

      it('should return empty errors array when valid', () => {
        const result = validateMcpUpdate({ timeout: 5000 }, stdioServer);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should return errors array when invalid', () => {
        const result = validateMcpUpdate({ timeout: -1 }, stdioServer);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(typeof result.errors[0]).toBe('string');
      });
    });
  });

  describe('VALID_TRANSPORT_TYPES constant', () => {
    it('should export array of valid types', () => {
      expect(Array.isArray(VALID_TRANSPORT_TYPES)).toBe(true);
      expect(VALID_TRANSPORT_TYPES).toHaveLength(3);
    });

    it('should include stdio, http, and sse', () => {
      expect(VALID_TRANSPORT_TYPES).toContain('stdio');
      expect(VALID_TRANSPORT_TYPES).toContain('http');
      expect(VALID_TRANSPORT_TYPES).toContain('sse');
    });

    it('should not contain invalid types', () => {
      // Verify only valid transport types are included
      const validTypes = ['stdio', 'http', 'sse'];
      expect(VALID_TRANSPORT_TYPES.every(type => validTypes.includes(type))).toBe(true);

      // Verify no duplicates
      const uniqueTypes = [...new Set(VALID_TRANSPORT_TYPES)];
      expect(uniqueTypes).toHaveLength(VALID_TRANSPORT_TYPES.length);
    });
  });
});
