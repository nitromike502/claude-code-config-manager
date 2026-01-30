/**
 * Form Validation Composable
 *
 * Provides validation rules and validation function for form fields.
 * Used by InlineEditField and other form components.
 *
 * @see docs/ba-sessions/20251128-phase5-crud-discovery/component-specs/inline-edit-field.md
 */

/**
 * Validation rules
 */
const validators = {
  /**
   * Required field validation
   * @param {any} value - Value to validate
   * @returns {boolean} - True if value is not empty
   */
  required: (value) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  },

  /**
   * Minimum length validation
   * @param {string} value - Value to validate
   * @param {number} min - Minimum length
   * @returns {boolean} - True if value length >= min
   */
  minLength: (value, min) => {
    if (!value) return false
    return value.length >= min
  },

  /**
   * Maximum length validation
   * @param {string} value - Value to validate
   * @param {number} max - Maximum length
   * @returns {boolean} - True if value length <= max
   */
  maxLength: (value, max) => {
    if (!value) return true // Empty values are valid for maxLength
    return value.length <= max
  },

  /**
   * Pattern (regex) validation
   * @param {string} value - Value to validate
   * @param {RegExp} pattern - Regular expression pattern
   * @returns {boolean} - True if value matches pattern
   */
  pattern: (value, pattern) => {
    if (!value) return false
    return pattern.test(value)
  },

  /**
   * Agent name validation
   * Lowercase letters, numbers, hyphens, underscores, max 64 chars
   * @param {string} value - Value to validate
   * @returns {boolean} - True if valid agent name
   */
  agentName: (value) => {
    if (!value) return false
    const agentNamePattern = /^[a-z0-9_-]{1,64}$/
    return agentNamePattern.test(value)
  },

  /**
   * Email validation
   * @param {string} value - Value to validate
   * @returns {boolean} - True if valid email format
   */
  email: (value) => {
    if (!value) return false
    // Basic email pattern - covers most cases
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(value)
  },

  /**
   * URL validation
   * @param {string} value - Value to validate
   * @returns {boolean} - True if valid http/https URL
   */
  url: (value) => {
    if (!value) return false
    try {
      const url = new URL(value)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }
}

/**
 * Default error messages for validation rules
 */
const defaultMessages = {
  required: 'This field is required',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must be no more than ${max} characters`,
  pattern: 'Invalid format',
  agentName: 'Must be lowercase letters, numbers, hyphens, or underscores (max 64 chars)',
  email: 'Must be a valid email address',
  url: 'Must be a valid http/https URL'
}

/**
 * Validate a value against a set of rules
 *
 * @param {any} value - Value to validate
 * @param {Array} rules - Array of validation rules
 * @returns {Object} - { valid: boolean, error: string | null }
 *
 * @example
 * const rules = [
 *   { type: 'required' },
 *   { type: 'maxLength', param: 64, message: 'Name too long' }
 * ]
 * const result = validate(agentName, rules)
 * if (!result.valid) {
 *   console.error(result.error)
 * }
 */
export function validate(value, rules = []) {
  for (const rule of rules) {
    const { type, param, message } = rule
    const validator = validators[type]

    if (!validator) {
      console.warn(`Unknown validation rule: ${type}`)
      continue
    }

    // Run validator
    const isValid = param !== undefined
      ? validator(value, param)
      : validator(value)

    if (!isValid) {
      // Return custom message or default message
      const errorMessage = message ||
        (typeof defaultMessages[type] === 'function'
          ? defaultMessages[type](param)
          : defaultMessages[type])

      return {
        valid: false,
        error: errorMessage
      }
    }
  }

  return {
    valid: true,
    error: null
  }
}

/**
 * Form Validation Composable
 *
 * @returns {Object} - Validation utilities
 */
export function useFormValidation() {
  return {
    validate,
    validators
  }
}
