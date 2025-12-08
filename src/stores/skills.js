import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/client'
import { useNotificationsStore } from './notifications'

/**
 * Pinia store for managing skill CRUD operations
 * Provides centralized state management for skills across project and user scopes
 */
export const useSkillsStore = defineStore('skills', () => {
  // State
  const projectSkills = ref(new Map()) // projectId -> skills array
  const userSkills = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get notifications store for toast messages
  const notifications = useNotificationsStore()

  /**
   * Update a skill (project or user scope)
   * @param {string} projectId - Project identifier (required for project scope, null for user scope)
   * @param {string} skillName - Current skill name (directory name)
   * @param {Object} updates - Properties to update (description, allowedTools, content)
   * @param {string} scope - 'project' or 'user'
   * @returns {Promise<Object>} - { success: boolean, skill?: Object, error?: string }
   */
  async function updateSkill(projectId, skillName, updates, scope) {
    isLoading.value = true
    error.value = null

    try {
      // Validate scope
      if (!['project', 'user'].includes(scope)) {
        throw new Error('Invalid scope: must be "project" or "user"')
      }

      // Validate projectId for project scope
      if (scope === 'project' && !projectId) {
        throw new Error('projectId is required for project scope')
      }

      // Call appropriate API method based on scope
      const result = scope === 'project'
        ? await api.updateProjectSkill(projectId, skillName, updates)
        : await api.updateUserSkill(skillName, updates)

      if (result.success) {
        // Update local state
        if (scope === 'project') {
          const skills = projectSkills.value.get(projectId) || []
          const index = skills.findIndex(s => s.name === skillName)
          if (index !== -1) {
            // Replace with updated skill
            skills[index] = result.skill
            projectSkills.value.set(projectId, [...skills])
          }
        } else {
          // User scope
          const index = userSkills.value.findIndex(s => s.name === skillName)
          if (index !== -1) {
            userSkills.value[index] = result.skill
          }
        }

        // Show success notification
        notifications.success(`Skill "${skillName}" updated successfully`)

        // Show warning notification if external references detected
        if (result.warnings && result.warnings.length > 0) {
          notifications.warn(result.warnings[0])
        }

        return { success: true, skill: result.skill }
      } else {
        throw new Error(result.message || 'Failed to update skill')
      }
    } catch (err) {
      error.value = err.message
      notifications.error(`Failed to update skill: ${err.message}`)

      // Only log unexpected errors to console
      if (!err.isExpected) {
        console.error('Error updating skill:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load project skills into store cache
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} - { success: boolean, skills?: Array, error?: string }
   */
  async function loadProjectSkills(projectId) {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getProjectSkills(projectId)

      if (result.skills) {
        projectSkills.value.set(projectId, result.skills)
        return { success: true, skills: result.skills }
      } else {
        throw new Error('No skills data in response')
      }
    } catch (err) {
      error.value = err.message

      if (!err.isExpected) {
        console.error('Error loading project skills:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load user skills into store cache
   * @returns {Promise<Object>} - { success: boolean, skills?: Array, error?: string }
   */
  async function loadUserSkills() {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.getUserSkills()

      if (result.skills) {
        userSkills.value = result.skills
        return { success: true, skills: result.skills }
      } else {
        throw new Error('No skills data in response')
      }
    } catch (err) {
      error.value = err.message

      if (!err.isExpected) {
        console.error('Error loading user skills:', err)
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get cached project skills
   * @param {string} projectId - Project identifier
   * @returns {Array} - Skills array (empty if not loaded)
   */
  function getProjectSkillsCache(projectId) {
    return projectSkills.value.get(projectId) || []
  }

  /**
   * Clear all cached skills
   */
  function clearCache() {
    projectSkills.value.clear()
    userSkills.value = []
    error.value = null
  }

  return {
    // State
    projectSkills,
    userSkills,
    isLoading,
    error,

    // Actions
    updateSkill,
    loadProjectSkills,
    loadUserSkills,
    getProjectSkillsCache,
    clearCache
  }
})
