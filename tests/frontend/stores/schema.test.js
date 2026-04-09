import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSchemaStore } from '@/stores/schema'

// Mock the API client
vi.mock('@/api/client', () => ({
  BASE_URL: 'http://localhost:8420',
  fetchWithTimeout: vi.fn()
}))

// Mock form-options constants
vi.mock('@/constants/form-options', () => ({
  HOOK_EVENT_OPTIONS: [
    { label: 'PreToolUse', value: 'PreToolUse', hasMatcher: true },
    { label: 'Stop', value: 'Stop', hasMatcher: false }
  ],
  HOOK_TYPE_OPTIONS: [
    { label: 'Command', value: 'command' },
    { label: 'HTTP', value: 'http' },
    { label: 'Prompt', value: 'prompt' },
    { label: 'Agent', value: 'agent' }
  ],
  BUILT_IN_TOOLS: ['Bash', 'Read'],
  PERMISSION_MODE_OPTIONS: [],
  TRANSPORT_OPTIONS: []
}))

import { fetchWithTimeout } from '@/api/client'
import { HOOK_EVENT_OPTIONS, HOOK_TYPE_OPTIONS } from '@/constants/form-options'

function mockFetchResponse(data) {
  return Promise.resolve({ json: () => Promise.resolve(data) })
}

function mockFetchError() {
  return Promise.reject(new Error('Network error'))
}

describe('Schema Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSchemaStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have empty initial state', () => {
      expect(store.hookEvents).toEqual([])
      expect(store.hookHandlerTypes).toEqual([])
      expect(store.agentFields).toBeNull()
      expect(store.skillFields).toBeNull()
      expect(store.ruleFields).toBeNull()
      expect(store.loaded).toBe(false)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.lastFetched).toBeNull()
    })

    it('should report not loaded via getter', () => {
      expect(store.isLoaded).toBe(false)
    })
  })

  describe('fetchSchemas()', () => {
    it('should fetch all schema endpoints and populate state', async () => {
      // API events use { name, description } shape; store maps them to { value, label, hasMatcher }
      const apiEvents = [
        { name: 'PreToolUse', description: 'Before tool use' },
        { name: 'Stop', description: 'On stop' }
      ]
      // hookTypes from the hooks endpoint use { type } objects
      const apiHookTypes = [
        { type: 'command' },
        { type: 'http' },
        { type: 'prompt' },
        { type: 'agent' }
      ]
      const mockAgentFields = { name: { type: 'string', required: true } }
      const mockSkillFields = { name: { type: 'string', required: true } }
      const mockRuleFields = { description: { type: 'string' } }

      fetchWithTimeout
        // hooks endpoint: { success, data: { events, hookTypes } }
        .mockImplementationOnce(() => mockFetchResponse({
          success: true,
          data: { events: apiEvents, hookTypes: apiHookTypes }
        }))
        // agents endpoint
        .mockImplementationOnce(() => mockFetchResponse({
          success: true,
          data: { fields: mockAgentFields }
        }))
        // skills endpoint
        .mockImplementationOnce(() => mockFetchResponse({
          success: true,
          data: { fields: mockSkillFields }
        }))
        // rules endpoint
        .mockImplementationOnce(() => mockFetchResponse({
          success: true,
          data: { fields: mockRuleFields }
        }))

      await store.fetchSchemas()

      // Events are mapped: name→value/label, hasMatcher looked up from HOOK_EVENT_OPTIONS
      expect(store.hookEvents).toEqual([
        { value: 'PreToolUse', label: 'PreToolUse', description: 'Before tool use', hasMatcher: true },
        { value: 'Stop', label: 'Stop', description: 'On stop', hasMatcher: false }
      ])
      // hookHandlerTypes stores raw type strings extracted from { type } objects
      expect(store.hookHandlerTypes).toEqual(['command', 'http', 'prompt', 'agent'])
      expect(store.agentFields).toEqual(mockAgentFields)
      expect(store.skillFields).toEqual(mockSkillFields)
      expect(store.ruleFields).toEqual(mockRuleFields)
      expect(store.loaded).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.lastFetched).toBeGreaterThan(0)
    })

    it('should fall back to constants when API returns null data', async () => {
      // 4 endpoints: hooks, agents, skills, rules
      fetchWithTimeout
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))

      await store.fetchSchemas()

      expect(store.hookEvents).toEqual(HOOK_EVENT_OPTIONS)
      expect(store.hookHandlerTypes).toEqual([]) // empty - getter falls back
      expect(store.hookTypeOptions).toEqual(HOOK_TYPE_OPTIONS) // getter fallback
      expect(store.agentFields).toBeNull()
      expect(store.loaded).toBe(true)
    })

    it('should fall back to constants on complete API failure', async () => {
      fetchWithTimeout.mockImplementation(() => mockFetchError())

      await store.fetchSchemas()

      // fetchEndpoint catches errors internally, so events fall back via null check
      expect(store.hookEvents).toEqual(HOOK_EVENT_OPTIONS)
      expect(store.hookHandlerTypes).toEqual([]) // empty - getter falls back
      expect(store.hookTypeOptions).toEqual(HOOK_TYPE_OPTIONS) // getter fallback
      expect(store.loaded).toBe(true)
    })

    it('should use cache if within TTL', async () => {
      // First fetch
      fetchWithTimeout.mockImplementation(() => mockFetchResponse({ events: [{ label: 'Test', value: 'Test', hasMatcher: false }] }))
      await store.fetchSchemas()

      vi.clearAllMocks()

      // Second fetch should use cache
      await store.fetchSchemas()

      expect(fetchWithTimeout).not.toHaveBeenCalled()
    })

    it('should set loading state during fetch', async () => {
      const resolvers = []
      fetchWithTimeout.mockImplementation(() => new Promise(resolve => {
        resolvers.push(() => resolve({ json: () => Promise.resolve({}) }))
      }))

      const fetchPromise = store.fetchSchemas()
      expect(store.loading).toBe(true)

      // Resolve all 4 endpoint calls: hooks, agents, skills, rules
      resolvers.forEach(r => r())
      await fetchPromise

      expect(store.loading).toBe(false)
    })

    it('should handle partial API responses gracefully', async () => {
      // hooks endpoint returns valid events data
      const apiEvents = [{ name: 'PreToolUse', description: '' }]

      fetchWithTimeout
        // hooks endpoint: success with events only (no hookTypes)
        .mockImplementationOnce(() => mockFetchResponse({
          success: true,
          data: { events: apiEvents, hookTypes: [] }
        }))
        // agents endpoint: success with fields
        .mockImplementationOnce(() => mockFetchResponse({
          success: true,
          data: { fields: { name: { type: 'string' } } }
        }))
        .mockImplementationOnce(() => mockFetchError()) // skills fails - fetchEndpoint returns null
        .mockImplementationOnce(() => mockFetchError()) // rules fails - fetchEndpoint returns null

      await store.fetchSchemas()

      // Events mapped from API: hasMatcher looked up from HOOK_EVENT_OPTIONS constants
      expect(store.hookEvents).toEqual([
        { value: 'PreToolUse', label: 'PreToolUse', description: '', hasMatcher: true }
      ])
      expect(store.hookHandlerTypes).toEqual([]) // no API data, getter falls back
      expect(store.agentFields).toEqual({ name: { type: 'string' } })
      expect(store.skillFields).toBeNull()
      expect(store.ruleFields).toBeNull()
      expect(store.loaded).toBe(true)
    })
  })

  describe('refreshSchemas()', () => {
    it('should bypass cache and re-fetch', async () => {
      // First fetch - all endpoints return empty/null data
      fetchWithTimeout.mockImplementation(() => mockFetchResponse({}))
      await store.fetchSchemas()

      vi.clearAllMocks()

      // Refresh should fetch again despite valid cache; use correct API shape for hooks
      fetchWithTimeout.mockImplementation(() => mockFetchResponse({
        success: true,
        data: { events: [{ name: 'New', description: '' }], hookTypes: [] }
      }))
      await store.refreshSchemas()

      expect(fetchWithTimeout).toHaveBeenCalled()
      // Event mapped from API: hasMatcher not found in HOOK_EVENT_OPTIONS → false
      expect(store.hookEvents).toEqual([{ value: 'New', label: 'New', description: '', hasMatcher: false }])
    })
  })

  describe('getters', () => {
    it('matcherBasedEvents should filter events with hasMatcher: true', async () => {
      // API events use { name, description } shape; hasMatcher is looked up from constants.
      // The mock HOOK_EVENT_OPTIONS only contains PreToolUse (hasMatcher: true) and Stop (hasMatcher: false),
      // so we use those two events to verify filtering works correctly.
      const apiEvents = [
        { name: 'PreToolUse', description: '' },
        { name: 'Stop', description: '' }
      ]
      fetchWithTimeout
        // hooks endpoint — 4 total calls: hooks, agents, skills, rules
        .mockImplementationOnce(() => mockFetchResponse({
          success: true,
          data: { events: apiEvents, hookTypes: [] }
        }))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))

      await store.fetchSchemas()

      // Only PreToolUse has hasMatcher: true in the mocked constants
      expect(store.matcherBasedEvents).toEqual([
        { value: 'PreToolUse', label: 'PreToolUse', description: '', hasMatcher: true }
      ])
    })

    it('blockingEvents should filter events with isBlocking: true', async () => {
      // The store sets hookEvents directly (bypassing fetchEndpoint) when hooksData is falsy,
      // so to test isBlocking filtering we set hookEvents directly via the fallback path.
      // The HOOK_EVENT_OPTIONS mock only has PreToolUse and Stop (no isBlocking field),
      // so we trigger the fallback and then manually verify blockingEvents filters correctly.
      // Use a complete success response with events that include isBlocking in source data.
      // NOTE: The store's event mapping does NOT carry isBlocking through from the API —
      // it only maps { value, label, description, hasMatcher }. blockingEvents filters on
      // isBlocking, which would only be present if stored directly (e.g., via fallback constants).
      // Set up via the fallback: all endpoints fail so hookEvents = HOOK_EVENT_OPTIONS mock.
      fetchWithTimeout.mockImplementation(() => mockFetchError())

      await store.fetchSchemas()

      // HOOK_EVENT_OPTIONS mock has no isBlocking fields, so blockingEvents is empty
      expect(store.blockingEvents).toEqual([])
    })

    it('hookTypeOptions should use API types when available', async () => {
      // hookTypes come from the hooks endpoint as { type } objects, not a separate types endpoint
      fetchWithTimeout
        .mockImplementationOnce(() => mockFetchResponse({
          success: true,
          data: {
            events: [],
            hookTypes: [{ type: 'command' }, { type: 'http' }, { type: 'agent' }]
          }
        }))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))

      await store.fetchSchemas()

      // hookTypeOptions maps raw type strings using t.charAt(0).toUpperCase() + t.slice(1)
      expect(store.hookTypeOptions).toEqual([
        { label: 'Command', value: 'command' },
        { label: 'Http', value: 'http' },
        { label: 'Agent', value: 'agent' }
      ])
    })

    it('hookTypeOptions should fall back to constants when no API types', async () => {
      // 4 endpoints return empty data — hookHandlerTypes stays empty, getter falls back to constant
      fetchWithTimeout.mockImplementation(() => mockFetchResponse({}))
      await store.fetchSchemas()

      expect(store.hookTypeOptions).toEqual(HOOK_TYPE_OPTIONS)
    })
  })
})
