# Schema Service

## Overview

The Schema Service (`src/backend/services/schemaService.js`) is the central source of truth for Claude Code configuration schemas introduced in EPIC-010. It provides dynamic, up-to-date hook event definitions, settings keys, and frontmatter field specifications by fetching the official Claude Code JSON schema from schemastore.org and serving it to the frontend via the Schema API.

**Last Updated:** 2026-03-30
**Related Code:**
- `/src/backend/services/schemaService.js` - Service implementation
- `/src/backend/routes/schema.js` - HTTP route handlers
- `/src/backend/config/hooks.js` - Hook event metadata (consumes schema service)
- `/src/backend/schemas/` - Local JSON schemas for frontmatter
- `/src/stores/schema.js` - Frontend Pinia store

---

## Architecture

The schema system operates in two layers:

### Layer 1 - Official Claude Code Schema (Remote)

Fetched from `https://json.schemastore.org/claude-code-settings.json` at startup and cached locally to `data/schemas/claude-code-settings.schema.json`. Refreshed every 24 hours.

Provides:
- All supported hook event names
- Hook handler type definitions (command, http, prompt, agent)
- All Claude Code settings keys with types and descriptions

### Layer 2 - Local Frontmatter Schemas (Static)

JSON Schema files in `src/backend/schemas/` that define valid frontmatter fields for each configuration type:

| File | Type | Source |
|------|------|--------|
| `agent-frontmatter.schema.json` | Agents | Claude Code sub-agents documentation |
| `skill-frontmatter.schema.json` | Skills | Claude Code skills documentation |
| `rule-frontmatter.schema.json` | Rules | Claude Code rules documentation |

These files are maintained manually and referenced in source comments with documentation URLs.

---

## Initialization and Caching

The service initializes at server startup via `schemaService.initialize()`, called non-blocking in `server.js`:

```javascript
Promise.resolve(schemaService.initialize()).catch(err => {
  console.error('Schema service initialization failed (using fallback):', err.message);
});
```

**Initialization sequence:**
1. Attempt to load cached schema from `data/schemas/claude-code-settings.schema.json`
2. If cache is missing or stale (older than 24 hours), fetch from schemastore.org
3. Parse and store the schema in memory
4. Load local frontmatter schemas from `src/backend/schemas/`
5. Fall back gracefully at each step if any operation fails

**Offline / startup behavior:** If the remote fetch fails and no cache exists, all schema queries return empty results or safe defaults. The hook system in `hooks.js` maintains a full fallback enrichment table so the application remains fully functional without the schema service.

---

## Public API

### `initialize()`

Async. Called once at startup. Loads cached schema, fetches fresh schema if stale, loads frontmatter schemas.

### `refresh()`

Async. Forces a re-fetch from schemastore.org regardless of cache staleness. Called by `POST /api/schema/refresh`.

### `getHookSchema()`

Returns hook event definitions and handler type metadata extracted from the official schema:

```javascript
{
  events: [
    { name: 'PreToolUse', description: '...' },
    { name: 'PostToolUse', description: '...' },
    // ... up to 27 events
  ],
  hookTypes: [
    { type: 'command', description: '...' },
    { type: 'http', description: '...' },
    { type: 'prompt', description: '...' },
    { type: 'agent', description: '...' }
  ],
  fields: { /* field definitions from schema */ }
}
```

### `getSettingsKeys()`

Returns all top-level Claude Code settings keys with their type, description, and default value derived from the official schema.

### `getFrontmatterSchema(type)`

Returns the full JSON Schema object for the given configuration type. Valid types: `'agent'`, `'skill'`, `'rule'`.

### `getFrontmatterFields(type)`

Returns a simplified array of field descriptors for UI rendering:

```javascript
[
  { name: 'description', type: 'string', description: '...', required: false },
  { name: 'tools', type: 'array', description: '...', required: false },
  // ...
]
```

### `getCacheStatus()`

Returns cache metadata for diagnostics:

```javascript
{
  loaded: true,
  lastFetchTime: '2026-03-30T10:00:00.000Z',
  isStale: false,
  cacheFile: '/absolute/path/to/data/schemas/claude-code-settings.schema.json',
  frontmatterSchemasLoaded: ['agent', 'skill', 'rule']
}
```

---

## Schema API Routes

All routes are mounted at `/api/schema` in `server.js`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/schema/hooks` | Hook events and handler types from official schema |
| GET | `/api/schema/settings` | All Claude Code settings keys with metadata |
| GET | `/api/schema/agents` | Agent frontmatter field definitions |
| GET | `/api/schema/skills` | Skill frontmatter field definitions |
| GET | `/api/schema/rules` | Rule frontmatter field definitions |
| POST | `/api/schema/refresh` | Force schema re-fetch from schemastore.org |
| GET | `/api/schema/status` | Cache status and health information |

All GET endpoints return:
```json
{ "success": true, "data": { ... } }
```

---

## Frontend Schema Store

The frontend Pinia store at `src/stores/schema.js` fetches schema data at application startup and provides it to components:

```javascript
import { useSchemaStore } from '@/stores/schema'

const schemaStore = useSchemaStore()
await schemaStore.fetchHookSchema()

// Available after fetch:
schemaStore.hookEvents          // array of event names
schemaStore.hookHandlerTypes    // array of handler type names
schemaStore.agentFields         // array of field descriptors
```

The store caches results in memory for the lifetime of the page session. The backend handles 24-hour disk caching independently.

---

## Hook Event Enrichment

The official schema provides event names and handler type definitions but does not encode per-event metadata such as whether the event supports matchers, can block execution, or supports custom prompts. This metadata is maintained in the `HOOK_EVENT_ENRICHMENT` table inside `src/backend/config/hooks.js`.

When the schema service returns a new event not present in the enrichment table, safe defaults are applied:
- `hasMatcher: true`
- `canBlock: false`
- `supportsPrompt: false`

To add correct metadata for a newly discovered event, update the enrichment table in `hooks.js`.

---

## Adding New Frontmatter Fields

When Claude Code adds new frontmatter fields to agents, skills, or rules:

1. Update the appropriate JSON Schema file in `src/backend/schemas/`
2. Update the corresponding parser in `src/backend/parsers/` to extract the new field
3. Update the frontend detail sidebar component to display the new field
4. Update the `$comment` field in the schema JSON with the documentation URL and date reviewed

---

## References

- Official schema source: `https://json.schemastore.org/claude-code-settings.json`
- Config URL constant: `config.urls.SCHEMA_SETTINGS` in `src/backend/config/config.js`
- Cache directory: `data/schemas/` (gitignored except for `.gitkeep`)
- Implementation task: EPIC-010 (Dynamic Schema System)
- Related technical docs: `docs/technical/hook-structure.md`
