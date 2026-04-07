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
    { label: 'HTTP', value: 'http' }
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
      const mockEvents = [
        { label: 'PreToolUse', value: 'PreToolUse', hasMatcher: true, isBlocking: true },
        { label: 'Stop', value: 'Stop', hasMatcher: false, isBlocking: false }
      ]
      const mockTypes = ['command', 'http', 'prompt', 'agent']
      const mockAgentFields = { name: { type: 'string', required: true } }
      const mockSkillFields = { name: { type: 'string', required: true } }
      const mockRuleFields = { description: { type: 'string' } }

      fetchWithTimeout
        .mockImplementationOnce(() => mockFetchResponse({ events: mockEvents }))
        .mockImplementationOnce(() => mockFetchResponse({ types: mockTypes }))
        .mockImplementationOnce(() => mockFetchResponse({ fields: mockAgentFields }))
        .mockImplementationOnce(() => mockFetchResponse({ fields: mockSkillFields }))
        .mockImplementationOnce(() => mockFetchResponse({ fields: mockRuleFields }))

      await store.fetchSchemas()

      expect(store.hookEvents).toEqual(mockEvents)
      expect(store.hookHandlerTypes).toEqual(mockTypes)
      expect(store.agentFields).toEqual(mockAgentFields)
      expect(store.skillFields).toEqual(mockSkillFields)
      expect(store.ruleFields).toEqual(mockRuleFields)
      expect(store.loaded).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.lastFetched).toBeGreaterThan(0)
    })

    it('should fall back to constants when API returns null data', async () => {
      fetchWithTimeout
        .mockImplementationOnce(() => mockFetchResponse({}))
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

      // Resolve all 5 endpoint calls
      resolvers.forEach(r => r())
      await fetchPromise

      expect(store.loading).toBe(false)
    })

    it('should handle partial API responses gracefully', async () => {
      const mockEvents = [{ label: 'PreToolUse', value: 'PreToolUse', hasMatcher: true }]

      fetchWithTimeout
        .mockImplementationOnce(() => mockFetchResponse({ events: mockEvents }))
        .mockImplementationOnce(() => mockFetchError()) // types fails - fetchEndpoint returns null
        .mockImplementationOnce(() => mockFetchResponse({ fields: { name: { type: 'string' } } }))
        .mockImplementationOnce(() => mockFetchError()) // skills fails
        .mockImplementationOnce(() => mockFetchError()) // rules fails

      await store.fetchSchemas()

      expect(store.hookEvents).toEqual(mockEvents)
      expect(store.hookHandlerTypes).toEqual([]) // no API data, getter falls back
      expect(store.agentFields).toEqual({ name: { type: 'string' } })
      expect(store.skillFields).toBeNull()
      expect(store.ruleFields).toBeNull()
      expect(store.loaded).toBe(true)
    })
  })

  describe('refreshSchemas()', () => {
    it('should bypass cache and re-fetch', async () => {
      // First fetch
      fetchWithTimeout.mockImplementation(() => mockFetchResponse({}))
      await store.fetchSchemas()

      vi.clearAllMocks()

      // Refresh should fetch again despite valid cache
      fetchWithTimeout.mockImplementation(() => mockFetchResponse({ events: [{ label: 'New', value: 'New', hasMatcher: true }] }))
      await store.refreshSchemas()

      expect(fetchWithTimeout).toHaveBeenCalled()
      expect(store.hookEvents).toEqual([{ label: 'New', value: 'New', hasMatcher: true }])
    })
  })

  describe('getters', () => {
    it('matcherBasedEvents should filter events with hasMatcher: true', async () => {
      const events = [
        { label: 'PreToolUse', value: 'PreToolUse', hasMatcher: true },
        { label: 'Stop', value: 'Stop', hasMatcher: false },
        { label: 'PostToolUse', value: 'PostToolUse', hasMatcher: true }
      ]
      fetchWithTimeout
        .mockImplementationOnce(() => mockFetchResponse({ events }))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))

      await store.fetchSchemas()

      expect(store.matcherBasedEvents).toEqual([
        { label: 'PreToolUse', value: 'PreToolUse', hasMatcher: true },
        { label: 'PostToolUse', value: 'PostToolUse', hasMatcher: true }
      ])
    })

    it('blockingEvents should filter events with isBlocking: true', async () => {
      const events = [
        { label: 'PreToolUse', value: 'PreToolUse', hasMatcher: true, isBlocking: true },
        { label: 'Stop', value: 'Stop', hasMatcher: false, isBlocking: false },
        { label: 'PermissionRequest', value: 'PermissionRequest', hasMatcher: true, isBlocking: true }
      ]
      fetchWithTimeout
        .mockImplementationOnce(() => mockFetchResponse({ events }))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))

      await store.fetchSchemas()

      expect(store.blockingEvents).toEqual([
        { label: 'PreToolUse', value: 'PreToolUse', hasMatcher: true, isBlocking: true },
        { label: 'PermissionRequest', value: 'PermissionRequest', hasMatcher: true, isBlocking: true }
      ])
    })

    it('hookTypeOptions should use API types when available', async () => {
      fetchWithTimeout
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({ types: ['command', 'http', 'agent'] }))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))
        .mockImplementationOnce(() => mockFetchResponse({}))

      await store.fetchSchemas()

      expect(store.hookTypeOptions).toEqual([
        { label: 'Command', value: 'command' },
        { label: 'Http', value: 'http' },
        { label: 'Agent', value: 'agent' }
      ])
    })

    it('hookTypeOptions should fall back to constants when no API types', async () => {
      fetchWithTimeout.mockImplementation(() => mockFetchResponse({}))
      await store.fetchSchemas()

      expect(store.hookTypeOptions).toEqual(HOOK_TYPE_OPTIONS)
    })
  })
})
