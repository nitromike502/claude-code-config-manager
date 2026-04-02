import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BASE_URL, fetchWithTimeout } from '@/api/client'
import {
  HOOK_EVENT_OPTIONS,
  HOOK_TYPE_OPTIONS,
  BUILT_IN_TOOLS,
  PERMISSION_MODE_OPTIONS,
  TRANSPORT_OPTIONS
} from '@/constants/form-options'

const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Pinia store for schema data fetched from the backend.
 * Falls back to hardcoded form-options.js constants if the API is unavailable.
 */
export const useSchemaStore = defineStore('schema', () => {
  // State
  const hookEvents = ref([])
  const hookHandlerTypes = ref([])
  const agentFields = ref(null)
  const skillFields = ref(null)
  const ruleFields = ref(null)
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref(null)
  const lastFetched = ref(null)

  // Getters
  const matcherBasedEvents = computed(() =>
    hookEvents.value.filter(e => e.hasMatcher)
  )

  const blockingEvents = computed(() =>
    hookEvents.value.filter(e => e.isBlocking)
  )

  const hookTypeOptions = computed(() =>
    hookHandlerTypes.value.length > 0
      ? hookHandlerTypes.value.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))
      : HOOK_TYPE_OPTIONS
  )

  const isLoaded = computed(() => loaded.value)

  /**
   * Check if cache is still valid
   */
  function isCacheValid() {
    if (!lastFetched.value) return false
    return (Date.now() - lastFetched.value) < CACHE_TTL
  }

  /**
   * Fetch a single schema endpoint, returning null on failure
   */
  async function fetchEndpoint(path) {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/api/schema/${path}`)
      return await response.json()
    } catch {
      return null
    }
  }

  /**
   * Fetch all schema data from backend API.
   * Uses cache if available and not expired.
   * Falls back to form-options.js constants on failure.
   */
  async function fetchSchemas() {
    if (isCacheValid() && loaded.value) return

    loading.value = true
    error.value = null

    try {
      const [hooksData, agentsData, skillsData, rulesData] = await Promise.all([
        fetchEndpoint('hooks'),
        fetchEndpoint('agents'),
        fetchEndpoint('skills'),
        fetchEndpoint('rules')
      ])

      // Hook data from official schema - contains events, hookTypes, hookFields
      if (hooksData?.success && hooksData.data) {
        const { events, hookTypes: types } = hooksData.data

        // Map schema events to the format components expect
        if (events?.length > 0) {
          hookEvents.value = events.map(e => ({
            value: e.name,
            label: e.name,
            description: e.description || '',
            hasMatcher: true // default; enriched by backend /api/hooks/events
          }))
        } else {
          hookEvents.value = HOOK_EVENT_OPTIONS
        }

        // Handler types from schema
        if (types?.length > 0) {
          hookHandlerTypes.value = types.map(t => t.type)
        }
      } else {
        hookEvents.value = HOOK_EVENT_OPTIONS
      }

      // Frontmatter field schemas
      if (agentsData?.success && agentsData.data?.fields) {
        agentFields.value = agentsData.data.fields
      }
      if (skillsData?.success && skillsData.data?.fields) {
        skillFields.value = skillsData.data.fields
      }
      if (rulesData?.success && rulesData.data?.fields) {
        ruleFields.value = rulesData.data.fields
      }

      loaded.value = true
      lastFetched.value = Date.now()
    } catch (err) {
      error.value = err.message

      // Fall back to hardcoded constants for events; getter handles type fallback
      hookEvents.value = HOOK_EVENT_OPTIONS
      loaded.value = true
      lastFetched.value = Date.now()
    } finally {
      loading.value = false
    }
  }

  /**
   * Force refresh schemas, bypassing cache
   */
  async function refreshSchemas() {
    lastFetched.value = null
    await fetchSchemas()
  }

  return {
    // State
    hookEvents,
    hookHandlerTypes,
    agentFields,
    skillFields,
    ruleFields,
    loaded,
    loading,
    error,
    lastFetched,

    // Getters
    matcherBasedEvents,
    blockingEvents,
    hookTypeOptions,
    isLoaded,

    // Actions
    fetchSchemas,
    refreshSchemas
  }
})
