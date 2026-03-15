import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the client module
vi.mock('@/api/client', () => ({
  BASE_URL: 'http://localhost:8420',
  fetchWithTimeout: vi.fn()
}))

import { fetchWithTimeout, BASE_URL } from '@/api/client'
import {
  getProjectRules,
  getUserRules,
  copyRule,
  deleteProjectRule,
  deleteUserRule
} from '@/api/rules'

describe('Rules API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProjectRules()', () => {
    it('should fetch project rules with correct URL', async () => {
      const mockResponse = { json: vi.fn().mockResolvedValue({ rules: [{ name: 'rule-1' }] }) }
      fetchWithTimeout.mockResolvedValue(mockResponse)

      const result = await getProjectRules('project123')

      expect(fetchWithTimeout).toHaveBeenCalledWith(`${BASE_URL}/api/projects/project123/rules`)
      expect(result).toEqual({ rules: [{ name: 'rule-1' }] })
    })

    it('should pass through the project ID correctly', async () => {
      const mockResponse = { json: vi.fn().mockResolvedValue({ rules: [] }) }
      fetchWithTimeout.mockResolvedValue(mockResponse)

      await getProjectRules('homeuserprojectsmyapp')

      expect(fetchWithTimeout).toHaveBeenCalledWith(`${BASE_URL}/api/projects/homeuserprojectsmyapp/rules`)
    })
  })

  describe('getUserRules()', () => {
    it('should fetch user rules with correct URL', async () => {
      const mockResponse = { json: vi.fn().mockResolvedValue({ rules: [{ name: 'user-rule' }] }) }
      fetchWithTimeout.mockResolvedValue(mockResponse)

      const result = await getUserRules()

      expect(fetchWithTimeout).toHaveBeenCalledWith(`${BASE_URL}/api/user/rules`)
      expect(result).toEqual({ rules: [{ name: 'user-rule' }] })
    })
  })

  describe('copyRule()', () => {
    it('should send POST request with payload', async () => {
      const payload = {
        sourcePath: '/path/to/rule.md',
        targetScope: 'project',
        targetProjectId: 'project456',
        conflictStrategy: 'overwrite'
      }
      const mockResponse = { json: vi.fn().mockResolvedValue({ success: true, message: 'Copied' }) }
      fetchWithTimeout.mockResolvedValue(mockResponse)

      const result = await copyRule(payload)

      expect(fetchWithTimeout).toHaveBeenCalledWith(`${BASE_URL}/api/copy/rule`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      expect(result).toEqual({ success: true, message: 'Copied' })
    })
  })

  describe('deleteProjectRule()', () => {
    it('should send DELETE request with encoded rule name', async () => {
      const mockResponse = { json: vi.fn().mockResolvedValue({ success: true }) }
      fetchWithTimeout.mockResolvedValue(mockResponse)

      const result = await deleteProjectRule('project123', 'frontend/react')

      expect(fetchWithTimeout).toHaveBeenCalledWith(
        `${BASE_URL}/api/projects/project123/rules/${encodeURIComponent('frontend/react')}`,
        { method: 'DELETE' }
      )
      expect(result).toEqual({ success: true })
    })

    it('should encode special characters in rule name', async () => {
      const mockResponse = { json: vi.fn().mockResolvedValue({ success: true }) }
      fetchWithTimeout.mockResolvedValue(mockResponse)

      await deleteProjectRule('proj1', 'path/with spaces')

      expect(fetchWithTimeout).toHaveBeenCalledWith(
        `${BASE_URL}/api/projects/proj1/rules/${encodeURIComponent('path/with spaces')}`,
        { method: 'DELETE' }
      )
    })

    it('should handle simple rule names', async () => {
      const mockResponse = { json: vi.fn().mockResolvedValue({ success: true }) }
      fetchWithTimeout.mockResolvedValue(mockResponse)

      await deleteProjectRule('proj1', 'simple-rule')

      expect(fetchWithTimeout).toHaveBeenCalledWith(
        `${BASE_URL}/api/projects/proj1/rules/simple-rule`,
        { method: 'DELETE' }
      )
    })
  })

  describe('deleteUserRule()', () => {
    it('should send DELETE request with encoded rule name', async () => {
      const mockResponse = { json: vi.fn().mockResolvedValue({ success: true }) }
      fetchWithTimeout.mockResolvedValue(mockResponse)

      const result = await deleteUserRule('frontend/react')

      expect(fetchWithTimeout).toHaveBeenCalledWith(
        `${BASE_URL}/api/user/rules/${encodeURIComponent('frontend/react')}`,
        { method: 'DELETE' }
      )
      expect(result).toEqual({ success: true })
    })

    it('should handle simple rule names without encoding', async () => {
      const mockResponse = { json: vi.fn().mockResolvedValue({ success: true }) }
      fetchWithTimeout.mockResolvedValue(mockResponse)

      await deleteUserRule('my-rule')

      expect(fetchWithTimeout).toHaveBeenCalledWith(
        `${BASE_URL}/api/user/rules/my-rule`,
        { method: 'DELETE' }
      )
    })
  })
})
