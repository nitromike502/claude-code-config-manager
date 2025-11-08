import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCopyStore } from '@/stores/copy-store'

// Mock API client
vi.mock('@/api/client.js', () => ({
  default: {
    copyAgent: vi.fn(),
    copyCommand: vi.fn(),
    copySkill: vi.fn(),
    copyHook: vi.fn(),
    copyMcp: vi.fn()
  }
}))

import api from '@/api/client.js'

describe('Copy Store', () => {
  beforeEach(() => {
    // Create fresh Pinia instance before each test
    setActivePinia(createPinia())

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('State Initialization', () => {
    it('should initialize with copying = false', () => {
      const store = useCopyStore()
      expect(store.copying).toBe(false)
    })

    it('should initialize with lastCopyResult = null', () => {
      const store = useCopyStore()
      expect(store.lastCopyResult).toBe(null)
    })
  })

  describe('getEndpointForType()', () => {
    it('should map "agent" to "copyAgent"', () => {
      const store = useCopyStore()
      expect(store.getEndpointForType('agent')).toBe('copyAgent')
    })

    it('should map "command" to "copyCommand"', () => {
      const store = useCopyStore()
      expect(store.getEndpointForType('command')).toBe('copyCommand')
    })

    it('should map "skill" to "copySkill"', () => {
      const store = useCopyStore()
      expect(store.getEndpointForType('skill')).toBe('copySkill')
    })

    it('should map "hook" to "copyHook"', () => {
      const store = useCopyStore()
      expect(store.getEndpointForType('hook')).toBe('copyHook')
    })

    it('should map "mcp" to "copyMcp"', () => {
      const store = useCopyStore()
      expect(store.getEndpointForType('mcp')).toBe('copyMcp')
    })

    it('should throw error for unknown type', () => {
      const store = useCopyStore()
      expect(() => store.getEndpointForType('unknown')).toThrow('Unknown configuration type: unknown')
    })
  })

  describe('copyConfiguration() - Success Cases', () => {
    it('should handle successful agent copy operation', async () => {
      const store = useCopyStore()

      // Mock successful API response
      api.copyAgent.mockResolvedValue({
        success: true,
        message: 'Agent copied successfully',
        copiedPath: '/home/user/.claude/agents/test-agent.md'
      })

      // Prepare request
      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      // Execute
      const result = await store.copyConfiguration(request)

      // Verify API called correctly
      expect(api.copyAgent).toHaveBeenCalledWith({
        sourcePath: '/source/agent.md',
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      })

      // Verify result
      expect(result.success).toBe(true)
      expect(result.message).toBe('Agent copied successfully')
      expect(result.copiedPath).toBe('/home/user/.claude/agents/test-agent.md')

      // Verify state updates
      expect(store.copying).toBe(false)
      expect(store.lastCopyResult).toEqual(result)
    })

    it('should handle successful command copy with filePath property', async () => {
      const store = useCopyStore()

      api.copyCommand.mockResolvedValue({
        success: true,
        message: 'Command copied successfully',
        copiedPath: '/project/.claude/commands/test.md'
      })

      const request = {
        sourceConfig: { type: 'command', filePath: '/source/command.md' },
        targetScope: 'project',
        targetProjectId: 'homeuserprojectsmyapp',
        conflictStrategy: 'overwrite'
      }

      const result = await store.copyConfiguration(request)

      // Verify API called with filePath
      expect(api.copyCommand).toHaveBeenCalledWith({
        sourcePath: '/source/command.md',
        targetScope: 'project',
        targetProjectId: 'homeuserprojectsmyapp',
        conflictStrategy: 'overwrite'
      })

      expect(result.success).toBe(true)
      expect(store.copying).toBe(false)
      expect(store.lastCopyResult).toEqual(result)
    })

    it('should handle successful hook copy operation', async () => {
      const store = useCopyStore()

      api.copyHook.mockResolvedValue({
        success: true,
        message: 'Hook copied successfully',
        warnings: ['Some commands already exist']
      })

      const request = {
        sourceConfig: { type: 'hook', path: '/source/hook' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'rename'
      }

      const result = await store.copyConfiguration(request)

      expect(api.copyHook).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.warnings).toEqual(['Some commands already exist'])
      expect(store.copying).toBe(false)
    })

    it('should handle successful MCP copy operation', async () => {
      const store = useCopyStore()

      api.copyMcp.mockResolvedValue({
        success: true,
        message: 'MCP server copied successfully'
      })

      const request = {
        sourceConfig: { type: 'mcp', path: '/source/mcp' },
        targetScope: 'project',
        targetProjectId: 'projectid',
        conflictStrategy: 'skip'
      }

      const result = await store.copyConfiguration(request)

      expect(api.copyMcp).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(store.copying).toBe(false)
    })

    it('should set copying = true during operation', async () => {
      const store = useCopyStore()

      // Track copying state during API call
      let copyingDuringCall = false

      api.copyAgent.mockImplementation(async () => {
        copyingDuringCall = store.copying
        return {
          success: true,
          message: 'Agent copied successfully'
        }
      })

      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await store.copyConfiguration(request)

      // Verify copying was true during API call
      expect(copyingDuringCall).toBe(true)
      // And false after completion
      expect(store.copying).toBe(false)
    })
  })

  describe('copyConfiguration() - Conflict Cases (409)', () => {
    it('should handle conflict response without throwing', async () => {
      const store = useCopyStore()

      const conflictResponse = {
        success: false,
        conflict: true,
        message: 'File already exists',
        existingPath: '/target/agent.md',
        suggestedStrategies: ['skip', 'overwrite', 'rename']
      }

      api.copyAgent.mockResolvedValue(conflictResponse)

      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      // Should not throw
      const result = await store.copyConfiguration(request)

      // Verify conflict returned
      expect(result.conflict).toBe(true)
      expect(result.success).toBe(false)
      expect(result.message).toBe('File already exists')

      // Verify state updated with conflict
      expect(store.lastCopyResult).toEqual(conflictResponse)
      expect(store.copying).toBe(false)
    })

    it('should handle hook conflict with multiple matches', async () => {
      const store = useCopyStore()

      const conflictResponse = {
        success: false,
        conflict: true,
        message: 'Hook commands already exist',
        existingCommands: ['npm test', 'npm lint']
      }

      api.copyHook.mockResolvedValue(conflictResponse)

      const request = {
        sourceConfig: { type: 'hook', path: '/source/hook' },
        targetScope: 'project',
        targetProjectId: 'projectid',
        conflictStrategy: 'skip'
      }

      const result = await store.copyConfiguration(request)

      expect(result.conflict).toBe(true)
      expect(result.existingCommands).toEqual(['npm test', 'npm lint'])
      expect(store.copying).toBe(false)
    })
  })

  describe('copyConfiguration() - Error Cases', () => {
    it('should handle 403 Forbidden error', async () => {
      const store = useCopyStore()

      api.copyAgent.mockRejectedValue(new Error('403 Forbidden'))

      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await expect(store.copyConfiguration(request)).rejects.toThrow(
        'Permission denied - Check file permissions'
      )

      expect(store.copying).toBe(false)
    })

    it('should handle 404 Not Found error', async () => {
      const store = useCopyStore()

      api.copyCommand.mockRejectedValue(new Error('404 Not Found'))

      const request = {
        sourceConfig: { type: 'command', path: '/source/command.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await expect(store.copyConfiguration(request)).rejects.toThrow(
        'Source file not found'
      )

      expect(store.copying).toBe(false)
    })

    it('should handle 400 Bad Request error', async () => {
      const store = useCopyStore()

      api.copyHook.mockRejectedValue(new Error('400 Bad Request: Invalid targetScope'))

      const request = {
        sourceConfig: { type: 'hook', path: '/source/hook' },
        targetScope: 'invalid',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await expect(store.copyConfiguration(request)).rejects.toThrow(
        'Invalid request - 400 Bad Request: Invalid targetScope'
      )

      expect(store.copying).toBe(false)
    })

    it('should handle 500 Internal Server Error', async () => {
      const store = useCopyStore()

      api.copyMcp.mockRejectedValue(new Error('500 Internal Server Error'))

      const request = {
        sourceConfig: { type: 'mcp', path: '/source/mcp' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await expect(store.copyConfiguration(request)).rejects.toThrow(
        'An error occurred - Please try again'
      )

      expect(store.copying).toBe(false)
    })

    it('should handle network error', async () => {
      const store = useCopyStore()

      api.copyAgent.mockRejectedValue(new Error('fetch failed'))

      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await expect(store.copyConfiguration(request)).rejects.toThrow(
        'Network error - Check your connection'
      )

      expect(store.copying).toBe(false)
    })

    it('should handle unknown error', async () => {
      const store = useCopyStore()

      api.copyCommand.mockRejectedValue(new Error('Unknown error occurred'))

      const request = {
        sourceConfig: { type: 'command', path: '/source/command.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await expect(store.copyConfiguration(request)).rejects.toThrow(
        'Copy failed - Unknown error occurred'
      )

      expect(store.copying).toBe(false)
    })

    it('should set copying = false even after error', async () => {
      const store = useCopyStore()

      api.copyAgent.mockRejectedValue(new Error('Test error'))

      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      try {
        await store.copyConfiguration(request)
      } catch (error) {
        // Expected to throw
      }

      // Verify copying flag reset
      expect(store.copying).toBe(false)
    })
  })

  describe('copyConfiguration() - Validation Errors', () => {
    it('should throw error if sourceConfig.type is missing', async () => {
      const store = useCopyStore()

      const request = {
        sourceConfig: { path: '/source/agent.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await expect(store.copyConfiguration(request)).rejects.toThrow(
        'sourceConfig.type is required'
      )

      expect(store.copying).toBe(false)
    })

    it('should throw error if targetScope is missing', async () => {
      const store = useCopyStore()

      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await expect(store.copyConfiguration(request)).rejects.toThrow(
        'targetScope is required'
      )

      expect(store.copying).toBe(false)
    })

    it('should throw error if targetProjectId is missing when targetScope is "project"', async () => {
      const store = useCopyStore()

      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetScope: 'project',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await expect(store.copyConfiguration(request)).rejects.toThrow(
        'targetProjectId is required when targetScope is "project"'
      )

      expect(store.copying).toBe(false)
    })

    it('should throw error if sourceConfig has neither path nor filePath', async () => {
      const store = useCopyStore()

      const request = {
        sourceConfig: { type: 'agent' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      await expect(store.copyConfiguration(request)).rejects.toThrow(
        'sourceConfig must have either path or filePath property'
      )

      expect(store.copying).toBe(false)
    })
  })

  describe('Copying Flag Lifecycle', () => {
    it('should be true during operation, false after success', async () => {
      const store = useCopyStore()

      let copyingStates = []

      api.copyAgent.mockImplementation(async () => {
        copyingStates.push(store.copying) // Should be true
        return { success: true, message: 'Success' }
      })

      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      copyingStates.push(store.copying) // Should be false before
      await store.copyConfiguration(request)
      copyingStates.push(store.copying) // Should be false after

      expect(copyingStates).toEqual([false, true, false])
    })

    it('should be true during operation, false after error', async () => {
      const store = useCopyStore()

      let copyingStates = []

      api.copyAgent.mockImplementation(async () => {
        copyingStates.push(store.copying) // Should be true
        throw new Error('Test error')
      })

      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      copyingStates.push(store.copying) // Should be false before

      try {
        await store.copyConfiguration(request)
      } catch (error) {
        // Expected
      }

      copyingStates.push(store.copying) // Should be false after

      expect(copyingStates).toEqual([false, true, false])
    })

    it('should be true during operation, false after conflict', async () => {
      const store = useCopyStore()

      let copyingStates = []

      api.copyAgent.mockImplementation(async () => {
        copyingStates.push(store.copying) // Should be true
        return { success: false, conflict: true, message: 'Conflict' }
      })

      const request = {
        sourceConfig: { type: 'agent', path: '/source/agent.md' },
        targetScope: 'user',
        targetProjectId: null,
        conflictStrategy: 'skip'
      }

      copyingStates.push(store.copying) // Should be false before
      await store.copyConfiguration(request)
      copyingStates.push(store.copying) // Should be false after

      expect(copyingStates).toEqual([false, true, false])
    })
  })
})
