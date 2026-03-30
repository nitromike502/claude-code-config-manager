/**
 * Tests for Schema Service
 *
 * Test Coverage:
 * - Schema fetching and caching
 * - Cache staleness detection
 * - Frontmatter schema loading
 * - Hook schema extraction
 * - Settings keys extraction
 * - Frontmatter field extraction
 * - Error handling and fallbacks
 */

// Mock fs before any imports
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    stat: jest.fn()
  }
}));

const fs = require('fs').promises;
const path = require('path');

// Mock global fetch
global.fetch = jest.fn();

const schemaService = require('../../../src/backend/services/schemaService');
const { _internal } = schemaService;

// Sample official schema for testing
const MOCK_OFFICIAL_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $defs: {
    hookCommand: {
      anyOf: [
        {
          type: 'object',
          description: 'Bash command hook',
          required: ['type', 'command'],
          properties: {
            type: { type: 'string', const: 'command' },
            command: { type: 'string', description: 'Shell command to execute' },
            timeout: { type: 'number', description: 'Optional timeout in seconds' }
          }
        },
        {
          type: 'object',
          description: 'LLM prompt hook',
          required: ['type', 'prompt'],
          properties: {
            type: { type: 'string', const: 'prompt' },
            prompt: { type: 'string', description: 'Prompt to evaluate' },
            model: { type: 'string', description: 'Model to use' }
          }
        }
      ]
    },
    hookMatcher: {
      type: 'object',
      required: ['hooks'],
      properties: {
        matcher: { type: 'string', description: 'Pattern to match' },
        hooks: { type: 'array', items: { $ref: '#/$defs/hookCommand' } }
      }
    }
  },
  properties: {
    $schema: { type: 'string' },
    hooks: {
      type: 'object',
      properties: {
        PreToolUse: { type: 'array', description: 'Hooks before tool calls' },
        PostToolUse: { type: 'array', description: 'Hooks after tool completion' },
        Stop: { type: 'array', description: 'Hooks when agents finish' }
      }
    },
    model: {
      type: 'string',
      description: 'Override the default model'
    },
    effortLevel: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Reasoning effort level',
      default: 'medium'
    },
    autoMemoryEnabled: {
      type: 'boolean',
      description: 'Enable auto memory',
      default: true,
      examples: [true, false]
    }
  }
};

// Sample frontmatter schema
const MOCK_AGENT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Agent Frontmatter Schema',
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Display name for the agent' },
    model: { type: 'string', description: 'Model override', enum: ['sonnet', 'opus', 'haiku'] },
    tools: { type: 'array', items: { type: 'string' }, description: 'Allowed tools' },
    maxTurns: { type: 'integer', description: 'Max turns', minimum: 1 }
  }
};

const MOCK_SKILL_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Skill name' },
    'user-invocable': { type: 'boolean', description: 'User invocable flag' }
  }
};

const MOCK_RULE_SCHEMA = {
  type: 'object',
  properties: {
    paths: { type: 'array', items: { type: 'string' }, description: 'Glob patterns' }
  }
};

describe('SchemaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset internal state
    _internal.cachedSchema = null;
    _internal.lastFetchTime = null;
    _internal.frontmatterSchemas = {};
  });

  describe('isCacheStale', () => {
    it('should return true when lastFetchTime is null', () => {
      _internal.lastFetchTime = null;
      expect(_internal.isCacheStale()).toBe(true);
    });

    it('should return true when cache is older than 24 hours', () => {
      _internal.lastFetchTime = Date.now() - (25 * 60 * 60 * 1000);
      expect(_internal.isCacheStale()).toBe(true);
    });

    it('should return false when cache is fresh', () => {
      _internal.lastFetchTime = Date.now() - (1 * 60 * 60 * 1000);
      expect(_internal.isCacheStale()).toBe(false);
    });
  });

  describe('loadCachedSchema', () => {
    it('should load and parse cached schema file', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(MOCK_OFFICIAL_SCHEMA));
      const result = await _internal.loadCachedSchema();
      expect(result).toEqual(MOCK_OFFICIAL_SCHEMA);
      expect(fs.readFile).toHaveBeenCalledWith(_internal.CACHE_FILE, 'utf8');
    });

    it('should return null if cache file does not exist', async () => {
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      fs.readFile.mockRejectedValue(error);
      const result = await _internal.loadCachedSchema();
      expect(result).toBeNull();
    });

    it('should return null and log error for non-ENOENT errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      fs.readFile.mockRejectedValue(new Error('Permission denied'));
      const result = await _internal.loadCachedSchema();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load cached schema:',
        'Permission denied'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('saveCachedSchema', () => {
    it('should create directory and write file', async () => {
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      await _internal.saveCachedSchema(MOCK_OFFICIAL_SCHEMA);

      expect(fs.mkdir).toHaveBeenCalledWith(_internal.CACHE_DIR, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        _internal.CACHE_FILE,
        JSON.stringify(MOCK_OFFICIAL_SCHEMA, null, 2),
        'utf8'
      );
    });

    it('should handle write errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockRejectedValue(new Error('Disk full'));

      await _internal.saveCachedSchema(MOCK_OFFICIAL_SCHEMA);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save cached schema:',
        'Disk full'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('fetchOfficialSchema', () => {
    it('should fetch and parse schema from URL', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => MOCK_OFFICIAL_SCHEMA
      });

      const result = await _internal.fetchOfficialSchema();
      expect(result).toEqual(MOCK_OFFICIAL_SCHEMA);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should return null on HTTP error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await _internal.fetchOfficialSchema();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should return null on network error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await _internal.fetchOfficialSchema();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('initialize', () => {
    it('should load from cache and skip fetch if fresh', async () => {
      // Cache is fresh (1 hour old)
      const freshTime = Date.now() - (1 * 60 * 60 * 1000);
      fs.readFile.mockImplementation((filePath) => {
        if (filePath === _internal.CACHE_FILE) {
          return Promise.resolve(JSON.stringify(MOCK_OFFICIAL_SCHEMA));
        }
        // Frontmatter schema files
        if (filePath.endsWith('agent-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_AGENT_SCHEMA));
        }
        if (filePath.endsWith('skill-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_SKILL_SCHEMA));
        }
        if (filePath.endsWith('rule-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_RULE_SCHEMA));
        }
        return Promise.reject(new Error('Unknown file'));
      });
      fs.stat.mockResolvedValue({ mtimeMs: freshTime });

      await schemaService.initialize();

      expect(_internal.cachedSchema).toEqual(MOCK_OFFICIAL_SCHEMA);
      // Should not fetch since cache is fresh
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch from remote when cache is stale', async () => {
      // Cache is stale (25 hours old)
      const staleTime = Date.now() - (25 * 60 * 60 * 1000);
      fs.readFile.mockImplementation((filePath) => {
        if (filePath === _internal.CACHE_FILE) {
          return Promise.resolve(JSON.stringify(MOCK_OFFICIAL_SCHEMA));
        }
        if (filePath.endsWith('agent-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_AGENT_SCHEMA));
        }
        if (filePath.endsWith('skill-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_SKILL_SCHEMA));
        }
        if (filePath.endsWith('rule-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_RULE_SCHEMA));
        }
        return Promise.reject(new Error('Unknown file'));
      });
      fs.stat.mockResolvedValue({ mtimeMs: staleTime });
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => MOCK_OFFICIAL_SCHEMA
      });

      await schemaService.initialize();

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should fall back to cache when fetch fails', async () => {
      const staleTime = Date.now() - (25 * 60 * 60 * 1000);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      fs.readFile.mockImplementation((filePath) => {
        if (filePath === _internal.CACHE_FILE) {
          return Promise.resolve(JSON.stringify(MOCK_OFFICIAL_SCHEMA));
        }
        if (filePath.endsWith('agent-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_AGENT_SCHEMA));
        }
        if (filePath.endsWith('skill-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_SKILL_SCHEMA));
        }
        if (filePath.endsWith('rule-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_RULE_SCHEMA));
        }
        return Promise.reject(new Error('Unknown file'));
      });
      fs.stat.mockResolvedValue({ mtimeMs: staleTime });
      global.fetch.mockRejectedValue(new Error('Network error'));

      await schemaService.initialize();

      // Should still have the cached schema
      expect(_internal.cachedSchema).toEqual(MOCK_OFFICIAL_SCHEMA);
      consoleSpy.mockRestore();
    });
  });

  describe('refresh', () => {
    it('should fetch fresh schema and update cache', async () => {
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => MOCK_OFFICIAL_SCHEMA
      });

      const result = await schemaService.refresh();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Schema refreshed successfully');
      expect(_internal.cachedSchema).toEqual(MOCK_OFFICIAL_SCHEMA);
    });

    it('should return failure when fetch fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await schemaService.refresh();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed');
      consoleSpy.mockRestore();
    });
  });

  describe('getSettingsKeys', () => {
    it('should extract settings keys from schema', () => {
      _internal.cachedSchema = MOCK_OFFICIAL_SCHEMA;

      const keys = schemaService.getSettingsKeys();

      expect(keys.length).toBeGreaterThan(0);
      // Should exclude $schema
      expect(keys.find(k => k.key === '$schema')).toBeUndefined();

      const modelKey = keys.find(k => k.key === 'model');
      expect(modelKey).toBeDefined();
      expect(modelKey.type).toBe('string');

      const effortKey = keys.find(k => k.key === 'effortLevel');
      expect(effortKey).toBeDefined();
      expect(effortKey.enum).toEqual(['low', 'medium', 'high']);
      expect(effortKey.default).toBe('medium');

      const memoryKey = keys.find(k => k.key === 'autoMemoryEnabled');
      expect(memoryKey).toBeDefined();
      expect(memoryKey.default).toBe(true);
      expect(memoryKey.examples).toEqual([true, false]);
    });

    it('should return empty array when schema is not loaded', () => {
      _internal.cachedSchema = null;
      expect(schemaService.getSettingsKeys()).toEqual([]);
    });
  });

  describe('getHookSchema', () => {
    it('should extract hook events from schema', () => {
      _internal.cachedSchema = MOCK_OFFICIAL_SCHEMA;

      const { events } = schemaService.getHookSchema();

      expect(events).toHaveLength(3);
      expect(events.map(e => e.name)).toEqual(['PreToolUse', 'PostToolUse', 'Stop']);
      expect(events[0].description).toBe('Hooks before tool calls');
    });

    it('should extract hook types from schema', () => {
      _internal.cachedSchema = MOCK_OFFICIAL_SCHEMA;

      const { hookTypes } = schemaService.getHookSchema();

      expect(hookTypes).toHaveLength(2);
      expect(hookTypes.map(t => t.type)).toEqual(['command', 'prompt']);
    });

    it('should extract hook fields per type', () => {
      _internal.cachedSchema = MOCK_OFFICIAL_SCHEMA;

      const { hookFields } = schemaService.getHookSchema();

      expect(hookFields.command).toBeDefined();
      expect(hookFields.command.find(f => f.name === 'command')).toBeDefined();
      expect(hookFields.command.find(f => f.name === 'command').required).toBe(true);

      expect(hookFields.prompt).toBeDefined();
      expect(hookFields.prompt.find(f => f.name === 'prompt')).toBeDefined();
    });

    it('should extract matcher fields', () => {
      _internal.cachedSchema = MOCK_OFFICIAL_SCHEMA;

      const { matcherFields } = schemaService.getHookSchema();

      expect(matcherFields).toHaveLength(1);
      expect(matcherFields[0].name).toBe('matcher');
    });

    it('should return empty data when schema is not loaded', () => {
      _internal.cachedSchema = null;

      const result = schemaService.getHookSchema();

      expect(result.events).toEqual([]);
      expect(result.hookTypes).toEqual([]);
      expect(result.hookFields).toEqual({});
    });
  });

  describe('getFrontmatterSchema', () => {
    beforeEach(() => {
      _internal.frontmatterSchemas = {
        agent: MOCK_AGENT_SCHEMA,
        skill: MOCK_SKILL_SCHEMA,
        rule: MOCK_RULE_SCHEMA
      };
    });

    it('should return agent frontmatter schema', () => {
      const schema = schemaService.getFrontmatterSchema('agent');
      expect(schema).toEqual(MOCK_AGENT_SCHEMA);
    });

    it('should return skill frontmatter schema', () => {
      const schema = schemaService.getFrontmatterSchema('skill');
      expect(schema).toEqual(MOCK_SKILL_SCHEMA);
    });

    it('should return rule frontmatter schema', () => {
      const schema = schemaService.getFrontmatterSchema('rule');
      expect(schema).toEqual(MOCK_RULE_SCHEMA);
    });

    it('should return null for unknown type', () => {
      expect(schemaService.getFrontmatterSchema('unknown')).toBeNull();
    });
  });

  describe('getFrontmatterFields', () => {
    beforeEach(() => {
      _internal.frontmatterSchemas = {
        agent: MOCK_AGENT_SCHEMA,
        skill: MOCK_SKILL_SCHEMA,
        rule: MOCK_RULE_SCHEMA
      };
    });

    it('should extract agent fields with metadata', () => {
      const fields = schemaService.getFrontmatterFields('agent');

      expect(fields.length).toBe(4);

      const nameField = fields.find(f => f.name === 'name');
      expect(nameField.type).toBe('string');
      expect(nameField.description).toBe('Display name for the agent');

      const modelField = fields.find(f => f.name === 'model');
      expect(modelField.enum).toEqual(['sonnet', 'opus', 'haiku']);

      const toolsField = fields.find(f => f.name === 'tools');
      expect(toolsField.type).toBe('array');
      expect(toolsField.items).toEqual({ type: 'string' });

      const maxTurnsField = fields.find(f => f.name === 'maxTurns');
      expect(maxTurnsField.minimum).toBe(1);
    });

    it('should extract skill fields', () => {
      const fields = schemaService.getFrontmatterFields('skill');
      expect(fields.length).toBe(2);
      expect(fields.find(f => f.name === 'name')).toBeDefined();
      expect(fields.find(f => f.name === 'user-invocable')).toBeDefined();
    });

    it('should extract rule fields', () => {
      const fields = schemaService.getFrontmatterFields('rule');
      expect(fields.length).toBe(1);
      expect(fields[0].name).toBe('paths');
    });

    it('should return empty array for unknown type', () => {
      expect(schemaService.getFrontmatterFields('unknown')).toEqual([]);
    });

    it('should return empty array when schema has no properties', () => {
      _internal.frontmatterSchemas = { agent: { type: 'object' } };
      expect(schemaService.getFrontmatterFields('agent')).toEqual([]);
    });
  });

  describe('getCacheStatus', () => {
    it('should return loaded state', () => {
      _internal.cachedSchema = MOCK_OFFICIAL_SCHEMA;
      _internal.lastFetchTime = Date.now();
      _internal.frontmatterSchemas = {
        agent: MOCK_AGENT_SCHEMA,
        skill: MOCK_SKILL_SCHEMA,
        rule: null
      };

      const status = schemaService.getCacheStatus();

      expect(status.loaded).toBe(true);
      expect(status.lastFetchTime).toBeDefined();
      expect(status.isStale).toBe(false);
      expect(status.frontmatterSchemasLoaded).toEqual(['agent', 'skill']);
    });

    it('should report unloaded state', () => {
      const status = schemaService.getCacheStatus();

      expect(status.loaded).toBe(false);
      expect(status.lastFetchTime).toBeNull();
      expect(status.isStale).toBe(true);
    });
  });

  describe('loadFrontmatterSchemas', () => {
    it('should load all three schema files', async () => {
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.endsWith('agent-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_AGENT_SCHEMA));
        }
        if (filePath.endsWith('skill-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_SKILL_SCHEMA));
        }
        if (filePath.endsWith('rule-frontmatter.schema.json')) {
          return Promise.resolve(JSON.stringify(MOCK_RULE_SCHEMA));
        }
        return Promise.reject(new Error('Unknown file'));
      });

      await _internal.loadFrontmatterSchemas();

      expect(_internal.frontmatterSchemas.agent).toEqual(MOCK_AGENT_SCHEMA);
      expect(_internal.frontmatterSchemas.skill).toEqual(MOCK_SKILL_SCHEMA);
      expect(_internal.frontmatterSchemas.rule).toEqual(MOCK_RULE_SCHEMA);
    });

    it('should handle missing schema files gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      fs.readFile.mockRejectedValue(new Error('File not found'));

      await _internal.loadFrontmatterSchemas();

      expect(_internal.frontmatterSchemas.agent).toBeNull();
      expect(_internal.frontmatterSchemas.skill).toBeNull();
      expect(_internal.frontmatterSchemas.rule).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('getSettingsSchema', () => {
    it('should return the full cached schema', () => {
      _internal.cachedSchema = MOCK_OFFICIAL_SCHEMA;
      expect(schemaService.getSettingsSchema()).toEqual(MOCK_OFFICIAL_SCHEMA);
    });

    it('should return null when not loaded', () => {
      expect(schemaService.getSettingsSchema()).toBeNull();
    });
  });
});
