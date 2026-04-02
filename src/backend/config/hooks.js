/**
 * Centralized Hook Events Configuration
 *
 * Dynamically loads hook event metadata from the schema service when available,
 * falling back to a minimal embedded set for startup/offline scenarios.
 *
 * The schema service fetches the official Claude Code JSON schema from
 * https://json.schemastore.org/claude-code-settings.json and extracts
 * hook events, handler types, and field definitions. This module wraps
 * that data with the getter API that consumers expect.
 *
 * Used by:
 * - Hook validation (hookValidation.js)
 * - Hook routes (routes/hooks.js)
 * - Copy service (services/copy-service.js)
 */

let schemaService = null;

/**
 * Lazy-load schema service to avoid circular dependencies.
 * The schema service initializes asynchronously at startup; this module
 * may be required before initialization completes, so we lazy-load.
 */
function getSchemaService() {
  if (!schemaService) {
    schemaService = require('../services/schemaService');
  }
  return schemaService;
}

/**
 * Get the hook events object — from schema service if loaded, fallback otherwise.
 *
 * When schema service is loaded, events are derived from the official JSON schema.
 * The schema only gives us event names; matcher/block/prompt metadata is enriched
 * from what the schema encodes (presence of matcher field in the hookMatcher def)
 * and from our own knowledge of the spec for canBlock/supportsPrompt.
 *
 * @returns {Object.<string, {hasMatcher: boolean, canBlock: boolean, supportsPrompt: boolean}>}
 */
function getHookEvents() {
  try {
    const svc = getSchemaService();
    const hookSchema = svc.getHookSchema();

    if (hookSchema && hookSchema.events && hookSchema.events.length > 0) {
      // Build events object from schema service data.
      // The schema tells us which events exist; enrichment adds metadata
      // the schema doesn't encode (canBlock, supportsPrompt, hasMatcher).
      // New events not in the enrichment table get safe defaults.
      const events = {};
      for (const event of hookSchema.events) {
        const enrichment = HOOK_EVENT_ENRICHMENT[event.name];
        events[event.name] = {
          hasMatcher: enrichment?.hasMatcher ?? true,
          canBlock: enrichment?.canBlock ?? false,
          supportsPrompt: enrichment?.supportsPrompt ?? false,
          description: event.description || ''
        };
      }
      return events;
    }
  } catch {
    // Schema service not available yet
  }

  // Fallback: use the enrichment table directly. This contains all known
  // events with correct metadata, so the system is fully functional even
  // without the remote schema (e.g., during tests or offline startup).
  return HOOK_EVENT_ENRICHMENT;
}

/**
 * Enrichment data for hook events that the JSON schema doesn't encode.
 * The official schema tells us which events exist and what handler fields look like,
 * but it doesn't encode canBlock or supportsPrompt per event.
 * hasMatcher is partially derivable (events with matcher in their array items)
 * but we maintain it here for accuracy.
 *
 * When Claude Code adds a NEW event, it will appear from the schema automatically.
 * If it's not in this enrichment table, it gets safe defaults (hasMatcher:true,
 * canBlock:false, supportsPrompt:false). We can update this table to add
 * correct metadata for new events.
 */
const HOOK_EVENT_ENRICHMENT = {
  // Events WITH matchers
  PreToolUse:         { hasMatcher: true,  canBlock: true,  supportsPrompt: true },
  PostToolUse:        { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  PostToolUseFailure: { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  PermissionRequest:  { hasMatcher: true,  canBlock: true,  supportsPrompt: true },
  Notification:       { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  SubagentStart:      { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  SubagentStop:       { hasMatcher: true,  canBlock: true,  supportsPrompt: true },
  SessionStart:       { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  SessionEnd:         { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  InstructionsLoaded: { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  StopFailure:        { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  ConfigChange:       { hasMatcher: true,  canBlock: true,  supportsPrompt: false },
  FileChanged:        { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  PreCompact:         { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  PostCompact:        { hasMatcher: true,  canBlock: false, supportsPrompt: false },
  Elicitation:        { hasMatcher: true,  canBlock: true,  supportsPrompt: false },
  ElicitationResult:  { hasMatcher: true,  canBlock: true,  supportsPrompt: false },
  // Events WITHOUT matchers
  UserPromptSubmit:   { hasMatcher: false, canBlock: true,  supportsPrompt: true },
  Stop:               { hasMatcher: false, canBlock: true,  supportsPrompt: true },
  TaskCreated:        { hasMatcher: false, canBlock: true,  supportsPrompt: false },
  TaskCompleted:      { hasMatcher: false, canBlock: true,  supportsPrompt: false },
  TeammateIdle:       { hasMatcher: false, canBlock: true,  supportsPrompt: false },
  CwdChanged:         { hasMatcher: false, canBlock: false, supportsPrompt: false },
  WorktreeCreate:     { hasMatcher: false, canBlock: true,  supportsPrompt: false },
  WorktreeRemove:     { hasMatcher: false, canBlock: false, supportsPrompt: false },
  Setup:              { hasMatcher: false, canBlock: false, supportsPrompt: false }
};

// ─── Public API (same interface as before) ───────────────────────────

/**
 * Get the HOOK_EVENTS object. Dynamic — reads from schema service when available.
 * @type {Object}
 */
const HOOK_EVENTS = new Proxy({}, {
  get(_, prop) {
    const events = getHookEvents();
    if (prop === Symbol.toPrimitive || prop === Symbol.iterator) return undefined;
    return events[prop];
  },
  ownKeys() {
    return Object.keys(getHookEvents());
  },
  has(_, prop) {
    return prop in getHookEvents();
  },
  getOwnPropertyDescriptor(_, prop) {
    const events = getHookEvents();
    if (prop in events) {
      return { configurable: true, enumerable: true, value: events[prop] };
    }
    return undefined;
  }
});

function getValidEvents() {
  return Object.keys(getHookEvents());
}

function getMatcherBasedEvents() {
  const events = getHookEvents();
  return Object.entries(events)
    .filter(([, m]) => m.hasMatcher)
    .map(([e]) => e);
}

function getPromptSupportedEvents() {
  const events = getHookEvents();
  return Object.entries(events)
    .filter(([, m]) => m.supportsPrompt)
    .map(([e]) => e);
}

function getBlockingEvents() {
  const events = getHookEvents();
  return Object.entries(events)
    .filter(([, m]) => m.canBlock)
    .map(([e]) => e);
}

function getHookEventOptions() {
  const events = getHookEvents();
  return Object.entries(events).map(([event, metadata]) => ({
    value: event,
    label: event,
    hasMatcher: metadata.hasMatcher
  }));
}

function isValidEvent(event) {
  return event in getHookEvents();
}

function eventHasMatcher(event) {
  return getHookEvents()[event]?.hasMatcher || false;
}

function eventSupportsPrompt(event) {
  return getHookEvents()[event]?.supportsPrompt || false;
}

function eventCanBlock(event) {
  return getHookEvents()[event]?.canBlock || false;
}

function getEventMetadata(event) {
  return getHookEvents()[event] || null;
}

/**
 * Get handler types from the schema service.
 * Falls back to ['command', 'http', 'prompt', 'agent'].
 * @returns {string[]}
 */
function getValidHandlerTypes() {
  try {
    const svc = getSchemaService();
    const hookSchema = svc.getHookSchema();
    if (hookSchema?.hookTypes?.length > 0) {
      return hookSchema.hookTypes.map(t => t.type);
    }
  } catch { /* fallback */ }
  return ['command', 'http', 'prompt', 'agent'];
}

module.exports = {
  HOOK_EVENTS,
  getValidEvents,
  getMatcherBasedEvents,
  getPromptSupportedEvents,
  getBlockingEvents,
  getHookEventOptions,
  isValidEvent,
  eventHasMatcher,
  eventSupportsPrompt,
  eventCanBlock,
  getEventMetadata,
  getValidHandlerTypes
};
