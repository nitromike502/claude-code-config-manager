import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSkillsStore } from '@/stores/skills'
import { useNotificationsStore } from '@/stores/notifications'

// Mock API client
vi.mock('@/api/client.js', () => ({
  deleteProjectSkill: vi.fn(),
  deleteUserSkill: vi.fn()
}))

import * as api from '@/api/client.js'

describe('Skills Store - deleteSkill()', () => {
  let store
  let notifications

  beforeEach(() => {
    // Create fresh Pinia instance before each test
    setActivePinia(createPinia())

    // Initialize stores
    store = useSkillsStore()
    notifications = useNotificationsStore()

    // Mock notification methods
    vi.spyOn(notifications, 'success')
    vi.spyOn(notifications, 'error')

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('Project Scope Deletion', () => {
    it('should successfully delete a project skill', async () => {
      // Pre-populate store with project skills
      store.projectSkills.set('project123', [
        { name: 'skill-1', directoryPath: '/path/to/skill-1', description: 'Skill 1' },
        { name: 'skill-2', directoryPath: '/path/to/skill-2', description: 'Skill 2' },
        { name: 'skill-3', directoryPath: '/path/to/skill-3', description: 'Skill 3' }
      ])

      // Mock successful API response
      api.deleteProjectSkill.mockResolvedValue({
        success: true,
        message: 'Skill deleted successfully'
      })

      // Execute deletion
      const result = await store.deleteSkill('project123', 'skill-2', 'project')

      // Verify API called correctly
      expect(api.deleteProjectSkill).toHaveBeenCalledWith('project123', 'skill-2')
      expect(api.deleteProjectSkill).toHaveBeenCalledTimes(1)

      // Verify result
      expect(result.success).toBe(true)

      // Verify skill removed from store
      const projectSkills = store.projectSkills.get('project123')
      expect(projectSkills).toHaveLength(2)
      expect(projectSkills.find(s => s.name === 'skill-2')).toBeUndefined()
      expect(projectSkills.find(s => s.name === 'skill-1')).toBeDefined()
      expect(projectSkills.find(s => s.name === 'skill-3')).toBeDefined()

      // Verify success notification
      expect(notifications.success).toHaveBeenCalledWith('Skill "skill-2" deleted successfully')
    })

    it('should handle skill deletion using directoryPath for identification', async () => {
      // Pre-populate store with skills that use directoryPath for identification
      store.projectSkills.set('project456', [
        { directoryPath: '/home/user/.claude/skills/my-skill', description: 'My Skill' },
        { directoryPath: '/home/user/.claude/skills/other-skill', description: 'Other Skill' }
      ])

      // Mock successful API response
      api.deleteProjectSkill.mockResolvedValue({
        success: true,
        message: 'Skill deleted successfully'
      })

      // Execute deletion (using directory name from path)
      const result = await store.deleteSkill('project456', 'my-skill', 'project')

      // Verify skill removed from store
      const projectSkills = store.projectSkills.get('project456')
      expect(projectSkills).toHaveLength(1)
      expect(projectSkills[0].directoryPath).toBe('/home/user/.claude/skills/other-skill')

      // Verify success
      expect(result.success).toBe(true)
      expect(notifications.success).toHaveBeenCalledWith('Skill "my-skill" deleted successfully')
    })

    it('should call deleteProjectSkill and not deleteUserSkill for project scope', async () => {
      store.projectSkills.set('project789', [
        { name: 'test-skill', directoryPath: '/path/to/test-skill' }
      ])

      api.deleteProjectSkill.mockResolvedValue({ success: true })

      await store.deleteSkill('project789', 'test-skill', 'project')

      // Verify correct API method called
      expect(api.deleteProjectSkill).toHaveBeenCalled()
      expect(api.deleteUserSkill).not.toHaveBeenCalled()
    })
  })

  describe('User Scope Deletion', () => {
    it('should successfully delete a user skill', async () => {
      // Pre-populate store with user skills
      store.userSkills = [
        { name: 'user-skill-1', directoryPath: '/home/.claude/skills/user-skill-1', description: 'User Skill 1' },
        { name: 'user-skill-2', directoryPath: '/home/.claude/skills/user-skill-2', description: 'User Skill 2' },
        { name: 'user-skill-3', directoryPath: '/home/.claude/skills/user-skill-3', description: 'User Skill 3' }
      ]

      // Mock successful API response
      api.deleteUserSkill.mockResolvedValue({
        success: true,
        message: 'User skill deleted successfully'
      })

      // Execute deletion
      const result = await store.deleteSkill(null, 'user-skill-2', 'user')

      // Verify API called correctly
      expect(api.deleteUserSkill).toHaveBeenCalledWith('user-skill-2')
      expect(api.deleteUserSkill).toHaveBeenCalledTimes(1)

      // Verify result
      expect(result.success).toBe(true)

      // Verify skill removed from store
      expect(store.userSkills).toHaveLength(2)
      expect(store.userSkills.find(s => s.name === 'user-skill-2')).toBeUndefined()
      expect(store.userSkills.find(s => s.name === 'user-skill-1')).toBeDefined()
      expect(store.userSkills.find(s => s.name === 'user-skill-3')).toBeDefined()

      // Verify success notification
      expect(notifications.success).toHaveBeenCalledWith('Skill "user-skill-2" deleted successfully')
    })

    it('should handle user skill deletion using directoryPath for identification', async () => {
      // Pre-populate store with user skills that use directoryPath
      store.userSkills = [
        { directoryPath: '/home/.claude/skills/global-skill', description: 'Global Skill' },
        { directoryPath: '/home/.claude/skills/helper-skill', description: 'Helper Skill' }
      ]

      api.deleteUserSkill.mockResolvedValue({ success: true })

      // Execute deletion
      const result = await store.deleteSkill(null, 'global-skill', 'user')

      // Verify skill removed from store
      expect(store.userSkills).toHaveLength(1)
      expect(store.userSkills[0].directoryPath).toBe('/home/.claude/skills/helper-skill')

      // Verify success
      expect(result.success).toBe(true)
      expect(notifications.success).toHaveBeenCalledWith('Skill "global-skill" deleted successfully')
    })

    it('should call deleteUserSkill and not deleteProjectSkill for user scope', async () => {
      store.userSkills = [
        { name: 'test-user-skill', directoryPath: '/home/.claude/skills/test-user-skill' }
      ]

      api.deleteUserSkill.mockResolvedValue({ success: true })

      await store.deleteSkill(null, 'test-user-skill', 'user')

      // Verify correct API method called
      expect(api.deleteUserSkill).toHaveBeenCalled()
      expect(api.deleteProjectSkill).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle API error during project skill deletion', async () => {
      store.projectSkills.set('project999', [
        { name: 'failing-skill', directoryPath: '/path/to/failing-skill' }
      ])

      // Mock API error
      api.deleteProjectSkill.mockResolvedValue({
        success: false,
        message: 'Permission denied'
      })

      // Execute deletion
      const result = await store.deleteSkill('project999', 'failing-skill', 'project')

      // Verify result indicates failure
      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission denied')

      // Verify skill remains in store (not removed)
      const projectSkills = store.projectSkills.get('project999')
      expect(projectSkills).toHaveLength(1)
      expect(projectSkills[0].name).toBe('failing-skill')

      // Verify error notification
      expect(notifications.error).toHaveBeenCalledWith('Failed to delete skill: Permission denied')
    })

    it('should handle API error during user skill deletion', async () => {
      store.userSkills = [
        { name: 'failing-user-skill', directoryPath: '/home/.claude/skills/failing-user-skill' }
      ]

      // Mock API error
      api.deleteUserSkill.mockResolvedValue({
        success: false,
        message: 'File not found'
      })

      // Execute deletion
      const result = await store.deleteSkill(null, 'failing-user-skill', 'user')

      // Verify result indicates failure
      expect(result.success).toBe(false)
      expect(result.error).toBe('File not found')

      // Verify skill remains in store
      expect(store.userSkills).toHaveLength(1)
      expect(store.userSkills[0].name).toBe('failing-user-skill')

      // Verify error notification
      expect(notifications.error).toHaveBeenCalledWith('Failed to delete skill: File not found')
    })

    it('should handle API exception during deletion', async () => {
      store.projectSkills.set('project-exception', [
        { name: 'exception-skill', directoryPath: '/path/to/exception-skill' }
      ])

      // Mock API exception
      const error = new Error('Network failure')
      error.isExpected = false
      api.deleteProjectSkill.mockRejectedValue(error)

      // Spy on console.error to verify unexpected errors are logged
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Execute deletion
      const result = await store.deleteSkill('project-exception', 'exception-skill', 'project')

      // Verify result indicates failure
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network failure')

      // Verify skill remains in store
      const projectSkills = store.projectSkills.get('project-exception')
      expect(projectSkills).toHaveLength(1)

      // Verify error notification
      expect(notifications.error).toHaveBeenCalledWith('Failed to delete skill: Network failure')

      // Verify console.error was called for unexpected error
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should not log expected errors to console', async () => {
      store.userSkills = [
        { name: 'expected-error-skill', directoryPath: '/path/to/expected-error-skill' }
      ]

      // Mock expected error
      const error = new Error('Expected error')
      error.isExpected = true
      api.deleteUserSkill.mockRejectedValue(error)

      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Execute deletion
      await store.deleteSkill(null, 'expected-error-skill', 'user')

      // Verify console.error was NOT called
      expect(consoleErrorSpy).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Validation', () => {
    it('should return error for invalid scope', async () => {
      // Execute deletion with invalid scope
      const result = await store.deleteSkill('project123', 'skill-name', 'invalid')

      // Verify validation error
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid scope: must be "project" or "user"')

      // Verify error notification
      expect(notifications.error).toHaveBeenCalledWith('Failed to delete skill: Invalid scope: must be "project" or "user"')

      // Verify API not called
      expect(api.deleteProjectSkill).not.toHaveBeenCalled()
      expect(api.deleteUserSkill).not.toHaveBeenCalled()
    })

    it('should return error when projectId is missing for project scope', async () => {
      // Execute deletion without projectId for project scope
      const result = await store.deleteSkill(null, 'skill-name', 'project')

      // Verify validation error
      expect(result.success).toBe(false)
      expect(result.error).toBe('projectId is required for project scope')

      // Verify error notification
      expect(notifications.error).toHaveBeenCalledWith('Failed to delete skill: projectId is required for project scope')

      // Verify API not called
      expect(api.deleteProjectSkill).not.toHaveBeenCalled()
    })

    it('should allow null projectId for user scope', async () => {
      store.userSkills = [
        { name: 'user-skill', directoryPath: '/home/.claude/skills/user-skill' }
      ]

      api.deleteUserSkill.mockResolvedValue({ success: true })

      // Execute deletion with null projectId (valid for user scope)
      const result = await store.deleteSkill(null, 'user-skill', 'user')

      // Verify success
      expect(result.success).toBe(true)

      // Verify API called
      expect(api.deleteUserSkill).toHaveBeenCalled()
    })
  })

  describe('Loading State Management', () => {
    it('should set isLoading to true during deletion', async () => {
      let loadingDuringDeletion = false

      store.projectSkills.set('project-loading', [
        { name: 'loading-skill', directoryPath: '/path/to/loading-skill' }
      ])

      api.deleteProjectSkill.mockImplementation(async () => {
        loadingDuringDeletion = store.isLoading
        return { success: true }
      })

      await store.deleteSkill('project-loading', 'loading-skill', 'project')

      // Verify isLoading was true during API call
      expect(loadingDuringDeletion).toBe(true)

      // Verify isLoading is false after completion
      expect(store.isLoading).toBe(false)
    })

    it('should set isLoading to false after successful deletion', async () => {
      store.userSkills = [
        { name: 'success-skill', directoryPath: '/path/to/success-skill' }
      ]

      api.deleteUserSkill.mockResolvedValue({ success: true })

      expect(store.isLoading).toBe(false)

      await store.deleteSkill(null, 'success-skill', 'user')

      // Verify isLoading reset to false
      expect(store.isLoading).toBe(false)
    })

    it('should set isLoading to false after failed deletion', async () => {
      store.projectSkills.set('project-fail', [
        { name: 'fail-skill', directoryPath: '/path/to/fail-skill' }
      ])

      api.deleteProjectSkill.mockResolvedValue({
        success: false,
        message: 'Deletion failed'
      })

      await store.deleteSkill('project-fail', 'fail-skill', 'project')

      // Verify isLoading reset to false even after failure
      expect(store.isLoading).toBe(false)
    })

    it('should set isLoading to false after exception', async () => {
      store.userSkills = [
        { name: 'exception-skill', directoryPath: '/path/to/exception-skill' }
      ]

      api.deleteUserSkill.mockRejectedValue(new Error('Network error'))

      await store.deleteSkill(null, 'exception-skill', 'user')

      // Verify isLoading reset to false even after exception
      expect(store.isLoading).toBe(false)
    })
  })

  describe('Error State Management', () => {
    it('should set error state when deletion fails', async () => {
      store.projectSkills.set('project-error', [
        { name: 'error-skill', directoryPath: '/path/to/error-skill' }
      ])

      api.deleteProjectSkill.mockResolvedValue({
        success: false,
        message: 'Deletion failed'
      })

      // Ensure error is null initially
      expect(store.error).toBeNull()

      await store.deleteSkill('project-error', 'error-skill', 'project')

      // Verify error state updated
      expect(store.error).toBe('Deletion failed')
    })

    it('should clear error state at start of deletion', async () => {
      // Set initial error state
      store.error = 'Previous error'

      store.userSkills = [
        { name: 'clear-error-skill', directoryPath: '/path/to/clear-error-skill' }
      ]

      api.deleteUserSkill.mockResolvedValue({ success: true })

      await store.deleteSkill(null, 'clear-error-skill', 'user')

      // Verify error cleared (successful deletion)
      expect(store.error).toBeNull()
    })
  })

  describe('State Integrity', () => {
    it('should not affect other projects when deleting project skill', async () => {
      // Pre-populate multiple projects
      store.projectSkills.set('project-a', [
        { name: 'skill-a1', directoryPath: '/path/to/skill-a1' },
        { name: 'skill-a2', directoryPath: '/path/to/skill-a2' }
      ])
      store.projectSkills.set('project-b', [
        { name: 'skill-b1', directoryPath: '/path/to/skill-b1' },
        { name: 'skill-b2', directoryPath: '/path/to/skill-b2' }
      ])

      api.deleteProjectSkill.mockResolvedValue({ success: true })

      // Delete from project-a
      await store.deleteSkill('project-a', 'skill-a1', 'project')

      // Verify project-a updated
      const projectASkills = store.projectSkills.get('project-a')
      expect(projectASkills).toHaveLength(1)
      expect(projectASkills[0].name).toBe('skill-a2')

      // Verify project-b unchanged
      const projectBSkills = store.projectSkills.get('project-b')
      expect(projectBSkills).toHaveLength(2)
      expect(projectBSkills.find(s => s.name === 'skill-b1')).toBeDefined()
      expect(projectBSkills.find(s => s.name === 'skill-b2')).toBeDefined()
    })

    it('should handle deletion from non-existent project gracefully', async () => {
      api.deleteProjectSkill.mockResolvedValue({ success: true })

      // Attempt to delete from project that doesn't exist in store
      const result = await store.deleteSkill('non-existent-project', 'skill-name', 'project')

      // Should succeed (API handled it)
      expect(result.success).toBe(true)

      // Verify store remains empty for this project
      const skills = store.projectSkills.get('non-existent-project')
      expect(skills).toEqual([])
    })

    it('should handle deletion of non-existent skill gracefully', async () => {
      store.projectSkills.set('project-safe', [
        { name: 'existing-skill', directoryPath: '/path/to/existing-skill' }
      ])

      api.deleteProjectSkill.mockResolvedValue({ success: true })

      // Attempt to delete skill that doesn't exist in store
      const result = await store.deleteSkill('project-safe', 'non-existent-skill', 'project')

      // Should succeed (API handled it)
      expect(result.success).toBe(true)

      // Verify existing skill still present
      const skills = store.projectSkills.get('project-safe')
      expect(skills).toHaveLength(1)
      expect(skills[0].name).toBe('existing-skill')
    })
  })

  describe('Toast Notifications', () => {
    it('should show success toast after successful project skill deletion', async () => {
      store.projectSkills.set('project-toast', [
        { name: 'toast-skill', directoryPath: '/path/to/toast-skill' }
      ])

      api.deleteProjectSkill.mockResolvedValue({ success: true })

      await store.deleteSkill('project-toast', 'toast-skill', 'project')

      // Verify success notification called
      expect(notifications.success).toHaveBeenCalledWith('Skill "toast-skill" deleted successfully')
      expect(notifications.success).toHaveBeenCalledTimes(1)
    })

    it('should show success toast after successful user skill deletion', async () => {
      store.userSkills = [
        { name: 'user-toast-skill', directoryPath: '/path/to/user-toast-skill' }
      ]

      api.deleteUserSkill.mockResolvedValue({ success: true })

      await store.deleteSkill(null, 'user-toast-skill', 'user')

      // Verify success notification called
      expect(notifications.success).toHaveBeenCalledWith('Skill "user-toast-skill" deleted successfully')
      expect(notifications.success).toHaveBeenCalledTimes(1)
    })

    it('should show error toast when deletion fails', async () => {
      store.projectSkills.set('project-error-toast', [
        { name: 'error-toast-skill', directoryPath: '/path/to/error-toast-skill' }
      ])

      api.deleteProjectSkill.mockResolvedValue({
        success: false,
        message: 'Deletion failed'
      })

      await store.deleteSkill('project-error-toast', 'error-toast-skill', 'project')

      // Verify error notification called
      expect(notifications.error).toHaveBeenCalledWith('Failed to delete skill: Deletion failed')
      expect(notifications.error).toHaveBeenCalledTimes(1)

      // Verify success notification NOT called
      expect(notifications.success).not.toHaveBeenCalled()
    })

    it('should show error toast with validation message', async () => {
      await store.deleteSkill('project123', 'skill-name', 'invalid-scope')

      // Verify error notification called with validation message
      expect(notifications.error).toHaveBeenCalledWith('Failed to delete skill: Invalid scope: must be "project" or "user"')
      expect(notifications.error).toHaveBeenCalledTimes(1)
    })
  })
})
