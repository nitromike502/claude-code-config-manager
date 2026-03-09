import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRulesStore } from '@/stores/rules'
import { useNotificationsStore } from '@/stores/notifications'

// Mock API client
vi.mock('@/api', () => ({
  BASE_URL: 'http://localhost:8420',
  getProjectRules: vi.fn(),
  getUserRules: vi.fn(),
  copyRule: vi.fn(),
  deleteProjectRule: vi.fn(),
  deleteUserRule: vi.fn()
}))

import * as api from '@/api'

describe('Rules Store', () => {
  let store
  let notifications

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useRulesStore()
    notifications = useNotificationsStore()
    vi.spyOn(notifications, 'success')
    vi.spyOn(notifications, 'error')
    vi.clearAllMocks()
  })

  describe('loadProjectRules()', () => {
    it('should load and cache project rules', async () => {
      const mockRules = [
        { name: 'frontend/react', description: 'React Standards', isConditional: true },
        { name: 'code-style', description: 'Code Style', isConditional: false }
      ]
      api.getProjectRules.mockResolvedValue({ rules: mockRules })

      const result = await store.loadProjectRules('project123')

      expect(api.getProjectRules).toHaveBeenCalledWith('project123')
      expect(result.success).toBe(true)
      expect(result.rules).toEqual(mockRules)
      expect(store.projectRules.get('project123')).toEqual(mockRules)
    })

    it('should handle missing rules data in response', async () => {
      api.getProjectRules.mockResolvedValue({})

      const result = await store.loadProjectRules('project123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('No rules data in response')
    })

    it('should handle API error', async () => {
      const error = new Error('Network error')
      error.isExpected = false
      api.getProjectRules.mockRejectedValue(error)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await store.loadProjectRules('project123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
      expect(store.error).toBe('Network error')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should manage loading state', async () => {
      let loadingDuringCall = false
      api.getProjectRules.mockImplementation(async () => {
        loadingDuringCall = store.isLoading
        return { rules: [] }
      })

      expect(store.isLoading).toBe(false)
      await store.loadProjectRules('project123')
      expect(loadingDuringCall).toBe(true)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('loadUserRules()', () => {
    it('should load and store user rules', async () => {
      const mockRules = [{ name: 'global-style', description: 'Global Style' }]
      api.getUserRules.mockResolvedValue({ rules: mockRules })

      const result = await store.loadUserRules()

      expect(api.getUserRules).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.rules).toEqual(mockRules)
      expect(store.userRules).toEqual(mockRules)
    })

    it('should handle missing rules data in response', async () => {
      api.getUserRules.mockResolvedValue({})

      const result = await store.loadUserRules()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No rules data in response')
    })

    it('should handle API error', async () => {
      api.getUserRules.mockRejectedValue(new Error('Server error'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await store.loadUserRules()

      expect(result.success).toBe(false)
      expect(store.isLoading).toBe(false)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('deleteRule() - Project Scope', () => {
    it('should successfully delete a project rule', async () => {
      store.projectRules.set('project123', [
        { name: 'rule-1', description: 'Rule 1' },
        { name: 'rule-2', description: 'Rule 2' },
        { name: 'rule-3', description: 'Rule 3' }
      ])

      api.deleteProjectRule.mockResolvedValue({ success: true, message: 'Deleted' })

      const result = await store.deleteRule('project', 'project123', 'rule-2')

      expect(api.deleteProjectRule).toHaveBeenCalledWith('project123', 'rule-2')
      expect(result.success).toBe(true)

      const rules = store.projectRules.get('project123')
      expect(rules).toHaveLength(2)
      expect(rules.find(r => r.name === 'rule-2')).toBeUndefined()
      expect(rules.find(r => r.name === 'rule-1')).toBeDefined()
      expect(rules.find(r => r.name === 'rule-3')).toBeDefined()

      expect(notifications.success).toHaveBeenCalledWith('Rule "rule-2" deleted successfully')
    })

    it('should call deleteProjectRule and not deleteUserRule', async () => {
      store.projectRules.set('proj1', [{ name: 'test-rule' }])
      api.deleteProjectRule.mockResolvedValue({ success: true })

      await store.deleteRule('project', 'proj1', 'test-rule')

      expect(api.deleteProjectRule).toHaveBeenCalled()
      expect(api.deleteUserRule).not.toHaveBeenCalled()
    })
  })

  describe('deleteRule() - User Scope', () => {
    it('should successfully delete a user rule', async () => {
      store.userRules = [
        { name: 'user-rule-1', description: 'User Rule 1' },
        { name: 'user-rule-2', description: 'User Rule 2' }
      ]

      api.deleteUserRule.mockResolvedValue({ success: true })

      const result = await store.deleteRule('user', null, 'user-rule-1')

      expect(api.deleteUserRule).toHaveBeenCalledWith('user-rule-1')
      expect(result.success).toBe(true)
      expect(store.userRules).toHaveLength(1)
      expect(store.userRules[0].name).toBe('user-rule-2')

      expect(notifications.success).toHaveBeenCalledWith('Rule "user-rule-1" deleted successfully')
    })

    it('should call deleteUserRule and not deleteProjectRule', async () => {
      store.userRules = [{ name: 'test-rule' }]
      api.deleteUserRule.mockResolvedValue({ success: true })

      await store.deleteRule('user', null, 'test-rule')

      expect(api.deleteUserRule).toHaveBeenCalled()
      expect(api.deleteProjectRule).not.toHaveBeenCalled()
    })
  })

  describe('deleteRule() - Error Handling', () => {
    it('should handle API failure response', async () => {
      store.projectRules.set('proj1', [{ name: 'fail-rule' }])

      api.deleteProjectRule.mockResolvedValue({ success: false, message: 'Permission denied' })

      const result = await store.deleteRule('project', 'proj1', 'fail-rule')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission denied')

      // Rule should remain in store
      expect(store.projectRules.get('proj1')).toHaveLength(1)
      expect(notifications.error).toHaveBeenCalledWith('Failed to delete rule: Permission denied')
    })

    it('should handle API exception', async () => {
      store.userRules = [{ name: 'exception-rule' }]

      const error = new Error('Network failure')
      error.isExpected = false
      api.deleteUserRule.mockRejectedValue(error)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await store.deleteRule('user', null, 'exception-rule')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network failure')
      expect(store.userRules).toHaveLength(1)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should not log expected errors to console', async () => {
      store.userRules = [{ name: 'expected-error-rule' }]

      const error = new Error('Expected error')
      error.isExpected = true
      api.deleteUserRule.mockRejectedValue(error)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await store.deleteRule('user', null, 'expected-error-rule')

      expect(consoleErrorSpy).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('deleteRule() - Validation', () => {
    it('should return error for invalid scope', async () => {
      const result = await store.deleteRule('invalid', 'proj1', 'rule-name')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid scope: must be "project" or "user"')
      expect(api.deleteProjectRule).not.toHaveBeenCalled()
      expect(api.deleteUserRule).not.toHaveBeenCalled()
    })

    it('should return error when projectId missing for project scope', async () => {
      const result = await store.deleteRule('project', null, 'rule-name')

      expect(result.success).toBe(false)
      expect(result.error).toBe('projectId is required for project scope')
      expect(api.deleteProjectRule).not.toHaveBeenCalled()
    })

    it('should allow null projectId for user scope', async () => {
      store.userRules = [{ name: 'user-rule' }]
      api.deleteUserRule.mockResolvedValue({ success: true })

      const result = await store.deleteRule('user', null, 'user-rule')

      expect(result.success).toBe(true)
      expect(api.deleteUserRule).toHaveBeenCalled()
    })
  })

  describe('deleteRule() - Loading State', () => {
    it('should set isLoading during deletion', async () => {
      let loadingDuringCall = false
      store.projectRules.set('proj1', [{ name: 'loading-rule' }])

      api.deleteProjectRule.mockImplementation(async () => {
        loadingDuringCall = store.isLoading
        return { success: true }
      })

      await store.deleteRule('project', 'proj1', 'loading-rule')

      expect(loadingDuringCall).toBe(true)
      expect(store.isLoading).toBe(false)
    })

    it('should reset isLoading after failure', async () => {
      store.projectRules.set('proj1', [{ name: 'fail-rule' }])
      api.deleteProjectRule.mockResolvedValue({ success: false, message: 'Failed' })

      await store.deleteRule('project', 'proj1', 'fail-rule')

      expect(store.isLoading).toBe(false)
    })

    it('should reset isLoading after exception', async () => {
      store.userRules = [{ name: 'exception-rule' }]
      api.deleteUserRule.mockRejectedValue(new Error('Error'))

      await store.deleteRule('user', null, 'exception-rule')

      expect(store.isLoading).toBe(false)
    })
  })

  describe('copyRule()', () => {
    it('should copy a rule successfully', async () => {
      const payload = {
        sourcePath: '/path/to/rule.md',
        targetScope: 'project',
        targetProjectId: 'project456'
      }

      api.copyRule.mockResolvedValue({ success: true, message: 'Copied', createdPath: '/new/path' })

      const result = await store.copyRule(payload)

      expect(api.copyRule).toHaveBeenCalledWith(payload)
      expect(result.success).toBe(true)
      expect(notifications.success).toHaveBeenCalledWith('Rule copied successfully')
    })

    it('should handle copy failure', async () => {
      api.copyRule.mockResolvedValue({ success: false, message: 'Conflict detected' })

      const result = await store.copyRule({ sourcePath: '/path' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Conflict detected')
      expect(notifications.error).toHaveBeenCalledWith('Failed to copy rule: Conflict detected')
    })

    it('should handle copy exception', async () => {
      api.copyRule.mockRejectedValue(new Error('Network error'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await store.copyRule({ sourcePath: '/path' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')

      consoleErrorSpy.mockRestore()
    })

    it('should manage loading state during copy', async () => {
      let loadingDuringCall = false
      api.copyRule.mockImplementation(async () => {
        loadingDuringCall = store.isLoading
        return { success: true }
      })

      await store.copyRule({ sourcePath: '/path' })

      expect(loadingDuringCall).toBe(true)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('getProjectRulesCache()', () => {
    it('should return cached rules for a project', () => {
      const mockRules = [{ name: 'cached-rule' }]
      store.projectRules.set('proj1', mockRules)

      expect(store.getProjectRulesCache('proj1')).toEqual(mockRules)
    })

    it('should return empty array for uncached project', () => {
      expect(store.getProjectRulesCache('nonexistent')).toEqual([])
    })
  })

  describe('clearCache()', () => {
    it('should clear all cached rules', () => {
      store.projectRules.set('proj1', [{ name: 'rule-1' }])
      store.projectRules.set('proj2', [{ name: 'rule-2' }])
      store.userRules = [{ name: 'user-rule' }]
      store.error = 'some error'

      store.clearCache()

      expect(store.projectRules.size).toBe(0)
      expect(store.userRules).toEqual([])
      expect(store.error).toBeNull()
    })
  })

  describe('State Integrity', () => {
    it('should not affect other projects when deleting', async () => {
      store.projectRules.set('proj-a', [
        { name: 'rule-a1' },
        { name: 'rule-a2' }
      ])
      store.projectRules.set('proj-b', [
        { name: 'rule-b1' },
        { name: 'rule-b2' }
      ])

      api.deleteProjectRule.mockResolvedValue({ success: true })

      await store.deleteRule('project', 'proj-a', 'rule-a1')

      expect(store.projectRules.get('proj-a')).toHaveLength(1)
      expect(store.projectRules.get('proj-b')).toHaveLength(2)
    })
  })
})
