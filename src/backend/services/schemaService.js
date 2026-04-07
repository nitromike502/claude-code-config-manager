/**
 * Schema Service
 *
 * Fetches, caches, and serves configuration schema data.
 * - Fetches official Claude Code JSON schema from schemastore.org
 * - Caches to data/schemas/claude-code-settings.schema.json
 * - Refreshes daily or on-demand
 * - Falls back to cached/embedded copy if fetch fails
 * - Parses schema to extract hook events, handler types, field definitions
 * - Serves frontmatter schemas from local JSON files
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

// Schema URL
const SCHEMA_URL = config.urls.SCHEMA_SETTINGS;

// Cache paths
const CACHE_DIR = path.join(__dirname, '../../../data/schemas');
const CACHE_FILE = path.join(CACHE_DIR, 'claude-code-settings.schema.json');

// Frontmatter schema paths
const SCHEMAS_DIR = path.join(__dirname, '../schemas');

// Refresh interval: 24 hours
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

// In-memory cache
let cachedSchema = null;
let lastFetchTime = null;
let frontmatterSchemas = {};

/**
 * Fetch the official schema from schemastore.org
 * Follows redirects (301 from json.schemastore.org to www.schemastore.org)
 *
 * @returns {Object|null} Parsed schema or null on failure
 */
async function fetchOfficialSchema() {
  try {
    // Use dynamic import for fetch (available in Node 18+)
    const response = await fetch(SCHEMA_URL, {
      headers: { 'Accept': 'application/json' },
      redirect: 'follow',
      signal: AbortSignal.timeout(config.timeouts.DEFAULT_API_TIMEOUT)
    });

    if (!response.ok) {
      console.error(`Schema fetch failed: HTTP ${response.status}`);
      return null;
    }

    const schema = await response.json();
    return schema;
  } catch (error) {
    console.error('Failed to fetch official schema:', error.message);
    return null;
  }
}

/**
 * Save schema to cache file
 *
 * @param {Object} schema - Schema object to cache
 */
async function saveCachedSchema(schema) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(schema, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save cached schema:', error.message);
  }
}

/**
 * Load schema from cache file
 *
 * @returns {Object|null} Cached schema or null if not found
 */
async function loadCachedSchema() {
  try {
    const content = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to load cached schema:', error.message);
    }
    return null;
  }
}

/**
 * Check if the cache is stale (older than REFRESH_INTERVAL_MS)
 *
 * @returns {boolean} True if cache needs refresh
 */
function isCacheStale() {
  if (!lastFetchTime) return true;
  return (Date.now() - lastFetchTime) > REFRESH_INTERVAL_MS;
}

/**
 * Initialize the schema service
 * Fetches the official schema or falls back to cache
 */
async function initialize() {
  // Try loading from cache first for fast startup
  const cached = await loadCachedSchema();
  if (cached) {
    cachedSchema = cached;
    // Check file modification time for staleness
    try {
      const stat = await fs.stat(CACHE_FILE);
      lastFetchTime = stat.mtimeMs;
    } catch {
      lastFetchTime = 0;
    }
  }

  // Fetch fresh copy if stale or no cache
  if (isCacheStale()) {
    const fresh = await fetchOfficialSchema();
    if (fresh) {
      cachedSchema = fresh;
      lastFetchTime = Date.now();
      await saveCachedSchema(fresh);
    }
  }

  // Load frontmatter schemas
  await loadFrontmatterSchemas();
}

/**
 * Force refresh the official schema
 *
 * @returns {{ success: boolean, message: string }} Result of the refresh
 */
async function refresh() {
  const fresh = await fetchOfficialSchema();
  if (fresh) {
    cachedSchema = fresh;
    lastFetchTime = Date.now();
    await saveCachedSchema(fresh);
    return { success: true, message: 'Schema refreshed successfully' };
  }
  return { success: false, message: 'Failed to fetch schema from remote source' };
}

/**
 * Load all frontmatter schemas from the schemas directory
 */
async function loadFrontmatterSchemas() {
  const schemaFiles = {
    agent: 'agent-frontmatter.schema.json',
    skill: 'skill-frontmatter.schema.json',
    rule: 'rule-frontmatter.schema.json'
  };

  for (const [key, filename] of Object.entries(schemaFiles)) {
    try {
      const filePath = path.join(SCHEMAS_DIR, filename);
      const content = await fs.readFile(filePath, 'utf8');
      frontmatterSchemas[key] = JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load ${key} frontmatter schema:`, error.message);
      frontmatterSchemas[key] = null;
    }
  }
}

/**
 * Get the official settings schema
 *
 * @returns {Object|null} The full settings schema
 */
function getSettingsSchema() {
  return cachedSchema;
}

/**
 * Extract all settings keys and their metadata from the official schema
 *
 * @returns {Object[]} Array of { key, type, description, enum, default } objects
 */
function getSettingsKeys() {
  if (!cachedSchema || !cachedSchema.properties) {
    return [];
  }

  return Object.entries(cachedSchema.properties)
    .filter(([key]) => key !== '$schema')
    .map(([key, def]) => ({
      key,
      type: def.type || 'unknown',
      description: def.description || '',
      ...(def.enum && { enum: def.enum }),
      ...(def.default !== undefined && { default: def.default }),
      ...(def.examples && { examples: def.examples })
    }));
}

/**
 * Extract hook events, types, and field definitions from the official schema
 *
 * @returns {Object} { events, hookTypes, hookFields }
 */
function getHookSchema() {
  if (!cachedSchema || !cachedSchema.properties || !cachedSchema.properties.hooks) {
    return { events: [], hookTypes: [], hookFields: {} };
  }

  const hooksSchema = cachedSchema.properties.hooks;
  const defs = cachedSchema.$defs || {};

  // Extract events from hooks.properties
  const events = [];
  if (hooksSchema.properties) {
    for (const [event, eventDef] of Object.entries(hooksSchema.properties)) {
      events.push({
        name: event,
        description: eventDef.description || ''
      });
    }
  }

  // Extract hook types from $defs.hookCommand.anyOf
  const hookTypes = [];
  const hookFields = {};
  const hookCommandDef = defs.hookCommand;
  if (hookCommandDef && hookCommandDef.anyOf) {
    for (const typeDef of hookCommandDef.anyOf) {
      const typeConst = typeDef.properties?.type?.const;
      if (typeConst) {
        hookTypes.push({
          type: typeConst,
          description: typeDef.description || ''
        });

        // Extract fields for this type
        hookFields[typeConst] = Object.entries(typeDef.properties || {})
          .filter(([fieldName]) => fieldName !== 'type')
          .map(([fieldName, fieldDef]) => ({
            name: fieldName,
            type: fieldDef.type || 'unknown',
            description: fieldDef.description || '',
            required: (typeDef.required || []).includes(fieldName),
            ...(fieldDef.const !== undefined && { const: fieldDef.const }),
            ...(fieldDef.enum && { enum: fieldDef.enum })
          }));
      }
    }
  }

  // Extract matcher schema from $defs.hookMatcher
  const matcherDef = defs.hookMatcher;
  const matcherFields = [];
  if (matcherDef && matcherDef.properties) {
    for (const [fieldName, fieldDef] of Object.entries(matcherDef.properties)) {
      if (fieldName !== 'hooks') {
        matcherFields.push({
          name: fieldName,
          type: fieldDef.type || 'unknown',
          description: fieldDef.description || '',
          required: (matcherDef.required || []).includes(fieldName)
        });
      }
    }
  }

  return { events, hookTypes, hookFields, matcherFields };
}

/**
 * Get a frontmatter schema by type
 *
 * @param {string} type - Schema type: 'agent', 'skill', or 'rule'
 * @returns {Object|null} The frontmatter schema
 */
function getFrontmatterSchema(type) {
  return frontmatterSchemas[type] || null;
}

/**
 * Get frontmatter fields for a given type
 *
 * @param {string} type - Schema type: 'agent', 'skill', or 'rule'
 * @returns {Object[]} Array of field definitions
 */
function getFrontmatterFields(type) {
  const schema = frontmatterSchemas[type];
  if (!schema || !schema.properties) {
    return [];
  }

  return Object.entries(schema.properties).map(([name, def]) => ({
    name,
    type: def.type || 'unknown',
    description: def.description || '',
    ...(def.enum && { enum: def.enum }),
    ...(def.items && { items: def.items }),
    ...(def.minimum !== undefined && { minimum: def.minimum }),
    ...(def.default !== undefined && { default: def.default })
  }));
}

/**
 * Get schema cache status information
 *
 * @returns {Object} Cache status
 */
function getCacheStatus() {
  return {
    loaded: cachedSchema !== null,
    lastFetchTime: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    isStale: isCacheStale(),
    cacheFile: CACHE_FILE,
    frontmatterSchemasLoaded: Object.keys(frontmatterSchemas).filter(k => frontmatterSchemas[k] !== null)
  };
}

// Export for testing
const _internal = {
  fetchOfficialSchema,
  saveCachedSchema,
  loadCachedSchema,
  isCacheStale,
  loadFrontmatterSchemas,
  CACHE_DIR,
  CACHE_FILE,
  SCHEMAS_DIR,
  REFRESH_INTERVAL_MS,
  // Allow tests to manipulate internal state
  get cachedSchema() { return cachedSchema; },
  set cachedSchema(val) { cachedSchema = val; },
  get lastFetchTime() { return lastFetchTime; },
  set lastFetchTime(val) { lastFetchTime = val; },
  get frontmatterSchemas() { return frontmatterSchemas; },
  set frontmatterSchemas(val) { frontmatterSchemas = val; }
};

module.exports = {
  initialize,
  refresh,
  getSettingsSchema,
  getSettingsKeys,
  getHookSchema,
  getFrontmatterSchema,
  getFrontmatterFields,
  getCacheStatus,
  _internal
};
