/**
 * Tests for Schema API Routes
 *
 * Test Coverage:
 * - GET /api/schema/hooks - Hook events and types
 * - GET /api/schema/settings - Settings keys
 * - GET /api/schema/agents - Agent frontmatter fields
 * - GET /api/schema/skills - Skill frontmatter fields
 * - GET /api/schema/rules - Rule frontmatter fields
 * - POST /api/schema/refresh - Force re-fetch
 * - GET /api/schema/status - Cache status
 */

// Mock dependencies before imports
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn()
  }
}));
jest.mock('os');
jest.mock('../../../src/backend/services/projectDiscovery');
jest.mock('../../../src/backend/services/schemaService');

const request = require('supertest');
const app = require('../../../src/backend/server');
const schemaService = require('../../../src/backend/services/schemaService');

// Mock data
const MOCK_HOOK_SCHEMA = {
  events: [
    { name: 'PreToolUse', description: 'Hooks before tool calls' },
    { name: 'PostToolUse', description: 'Hooks after tool completion' },
    { name: 'Stop', description: 'Hooks when agents finish' }
  ],
  hookTypes: [
    { type: 'command', description: 'Bash command hook' },
    { type: 'prompt', description: 'LLM prompt hook' }
  ],
  hookFields: {
    command: [
      { name: 'command', type: 'string', description: 'Shell command', required: true },
      { name: 'timeout', type: 'number', description: 'Timeout', required: false }
    ],
    prompt: [
      { name: 'prompt', type: 'string', description: 'Prompt text', required: true }
    ]
  },
  matcherFields: [
    { name: 'matcher', type: 'string', description: 'Pattern to match', required: false }
  ]
};

const MOCK_SETTINGS_KEYS = [
  { key: 'model', type: 'string', description: 'Override the default model' },
  { key: 'effortLevel', type: 'string', description: 'Reasoning effort', enum: ['low', 'medium', 'high'] },
  { key: 'autoMemoryEnabled', type: 'boolean', description: 'Enable auto memory', default: true }
];

const MOCK_AGENT_FIELDS = [
  { name: 'name', type: 'string', description: 'Display name' },
  { name: 'model', type: 'string', description: 'Model override', enum: ['sonnet', 'opus', 'haiku'] },
  { name: 'tools', type: 'array', description: 'Allowed tools', items: { type: 'string' } }
];

const MOCK_AGENT_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Display name' },
    model: { type: 'string', enum: ['sonnet', 'opus', 'haiku'] }
  }
};

const MOCK_SKILL_FIELDS = [
  { name: 'name', type: 'string', description: 'Skill name' },
  { name: 'user-invocable', type: 'boolean', description: 'User invocable' }
];

const MOCK_RULE_FIELDS = [
  { name: 'paths', type: 'array', description: 'Glob patterns', items: { type: 'string' } }
];

describe('Schema API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/schema/hooks', () => {
    it('should return hook events, types, and fields', async () => {
      schemaService.getHookSchema.mockReturnValue(MOCK_HOOK_SCHEMA);

      const res = await request(app).get('/api/schema/hooks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.events).toHaveLength(3);
      expect(res.body.data.hookTypes).toHaveLength(2);
      expect(res.body.data.hookFields.command).toBeDefined();
      expect(res.body.data.matcherFields).toHaveLength(1);
    });

    it('should return empty data when schema not loaded', async () => {
      schemaService.getHookSchema.mockReturnValue({ events: [], hookTypes: [], hookFields: {} });

      const res = await request(app).get('/api/schema/hooks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.events).toHaveLength(0);
    });

    it('should return 500 on error', async () => {
      schemaService.getHookSchema.mockImplementation(() => {
        throw new Error('Service error');
      });

      const res = await request(app).get('/api/schema/hooks');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Failed to fetch hook schema');
    });
  });

  describe('GET /api/schema/settings', () => {
    it('should return settings keys with metadata', async () => {
      schemaService.getSettingsKeys.mockReturnValue(MOCK_SETTINGS_KEYS);

      const res = await request(app).get('/api/schema/settings');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);

      const effortKey = res.body.data.find(k => k.key === 'effortLevel');
      expect(effortKey.enum).toEqual(['low', 'medium', 'high']);

      const memoryKey = res.body.data.find(k => k.key === 'autoMemoryEnabled');
      expect(memoryKey.default).toBe(true);
    });

    it('should return empty array when schema not loaded', async () => {
      schemaService.getSettingsKeys.mockReturnValue([]);

      const res = await request(app).get('/api/schema/settings');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return 500 on error', async () => {
      schemaService.getSettingsKeys.mockImplementation(() => {
        throw new Error('Service error');
      });

      const res = await request(app).get('/api/schema/settings');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/schema/agents', () => {
    it('should return agent frontmatter fields and schema', async () => {
      schemaService.getFrontmatterFields.mockReturnValue(MOCK_AGENT_FIELDS);
      schemaService.getFrontmatterSchema.mockReturnValue(MOCK_AGENT_SCHEMA);

      const res = await request(app).get('/api/schema/agents');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fields).toHaveLength(3);
      expect(res.body.data.schema).toEqual(MOCK_AGENT_SCHEMA);

      const modelField = res.body.data.fields.find(f => f.name === 'model');
      expect(modelField.enum).toEqual(['sonnet', 'opus', 'haiku']);
    });

    it('should return 500 on error', async () => {
      schemaService.getFrontmatterFields.mockImplementation(() => {
        throw new Error('Service error');
      });

      const res = await request(app).get('/api/schema/agents');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/schema/skills', () => {
    it('should return skill frontmatter fields', async () => {
      schemaService.getFrontmatterFields.mockReturnValue(MOCK_SKILL_FIELDS);
      schemaService.getFrontmatterSchema.mockReturnValue({ type: 'object' });

      const res = await request(app).get('/api/schema/skills');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fields).toHaveLength(2);
    });

    it('should return 500 on error', async () => {
      schemaService.getFrontmatterFields.mockImplementation(() => {
        throw new Error('Service error');
      });

      const res = await request(app).get('/api/schema/skills');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/schema/rules', () => {
    it('should return rule frontmatter fields', async () => {
      schemaService.getFrontmatterFields.mockReturnValue(MOCK_RULE_FIELDS);
      schemaService.getFrontmatterSchema.mockReturnValue({ type: 'object' });

      const res = await request(app).get('/api/schema/rules');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fields).toHaveLength(1);
      expect(res.body.data.fields[0].name).toBe('paths');
    });

    it('should return 500 on error', async () => {
      schemaService.getFrontmatterFields.mockImplementation(() => {
        throw new Error('Service error');
      });

      const res = await request(app).get('/api/schema/rules');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/schema/refresh', () => {
    it('should refresh schema successfully', async () => {
      schemaService.refresh.mockResolvedValue({
        success: true,
        message: 'Schema refreshed successfully'
      });
      schemaService.getCacheStatus.mockReturnValue({
        loaded: true,
        lastFetchTime: new Date().toISOString(),
        isStale: false
      });

      const res = await request(app).post('/api/schema/refresh');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Schema refreshed successfully');
      expect(res.body.cacheStatus).toBeDefined();
    });

    it('should handle refresh failure', async () => {
      schemaService.refresh.mockResolvedValue({
        success: false,
        message: 'Failed to fetch schema from remote source'
      });
      schemaService.getCacheStatus.mockReturnValue({
        loaded: false,
        lastFetchTime: null,
        isStale: true
      });

      const res = await request(app).post('/api/schema/refresh');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Failed');
    });

    it('should return 500 on exception', async () => {
      schemaService.refresh.mockRejectedValue(new Error('Unexpected error'));

      const res = await request(app).post('/api/schema/refresh');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/schema/status', () => {
    it('should return cache status', async () => {
      schemaService.getCacheStatus.mockReturnValue({
        loaded: true,
        lastFetchTime: '2026-03-29T12:00:00.000Z',
        isStale: false,
        cacheFile: '/some/path/cache.json',
        frontmatterSchemasLoaded: ['agent', 'skill', 'rule']
      });

      const res = await request(app).get('/api/schema/status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loaded).toBe(true);
      expect(res.body.data.frontmatterSchemasLoaded).toEqual(['agent', 'skill', 'rule']);
    });

    it('should return 500 on error', async () => {
      schemaService.getCacheStatus.mockImplementation(() => {
        throw new Error('Service error');
      });

      const res = await request(app).get('/api/schema/status');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
