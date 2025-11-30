/**
 * useFormValidation Composable Tests
 *
 * Unit tests for the form validation composable.
 *
 * @see src/composables/useFormValidation.js
 */

import { describe, it, expect, vi } from 'vitest'
import { validate, useFormValidation } from '../../src/composables/useFormValidation.js'

describe('useFormValidation', () => {
  describe('validate function', () => {
    describe('required validation', () => {
      it('passes for non-empty string', () => {
        const result = validate('test', [{ type: 'required' }])
        expect(result.valid).toBe(true)
        expect(result.error).toBeNull()
      })

      it('fails for empty string', () => {
        const result = validate('', [{ type: 'required' }])
        expect(result.valid).toBe(false)
        expect(result.error).toBe('This field is required')
      })

      it('fails for whitespace-only string', () => {
        const result = validate('   ', [{ type: 'required' }])
        expect(result.valid).toBe(false)
        expect(result.error).toBe('This field is required')
      })

      it('fails for null', () => {
        const result = validate(null, [{ type: 'required' }])
        expect(result.valid).toBe(false)
      })

      it('fails for undefined', () => {
        const result = validate(undefined, [{ type: 'required' }])
        expect(result.valid).toBe(false)
      })

      it('passes for non-empty array', () => {
        const result = validate(['item'], [{ type: 'required' }])
        expect(result.valid).toBe(true)
      })

      it('fails for empty array', () => {
        const result = validate([], [{ type: 'required' }])
        expect(result.valid).toBe(false)
      })
    })

    describe('minLength validation', () => {
      it('passes when length meets minimum', () => {
        const result = validate('test', [{ type: 'minLength', param: 4 }])
        expect(result.valid).toBe(true)
      })

      it('passes when length exceeds minimum', () => {
        const result = validate('testing', [{ type: 'minLength', param: 4 }])
        expect(result.valid).toBe(true)
      })

      it('fails when length is below minimum', () => {
        const result = validate('hi', [{ type: 'minLength', param: 4 }])
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Must be at least 4 characters')
      })

      it('fails for empty string', () => {
        const result = validate('', [{ type: 'minLength', param: 1 }])
        expect(result.valid).toBe(false)
      })

      it('uses custom error message', () => {
        const result = validate('hi', [
          { type: 'minLength', param: 4, message: 'Too short!' }
        ])
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Too short!')
      })
    })

    describe('maxLength validation', () => {
      it('passes when length is below maximum', () => {
        const result = validate('test', [{ type: 'maxLength', param: 10 }])
        expect(result.valid).toBe(true)
      })

      it('passes when length equals maximum', () => {
        const result = validate('test', [{ type: 'maxLength', param: 4 }])
        expect(result.valid).toBe(true)
      })

      it('fails when length exceeds maximum', () => {
        const result = validate('testing', [{ type: 'maxLength', param: 4 }])
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Must be no more than 4 characters')
      })

      it('passes for empty string', () => {
        const result = validate('', [{ type: 'maxLength', param: 4 }])
        expect(result.valid).toBe(true)
      })
    })

    describe('pattern validation', () => {
      it('passes when value matches pattern', () => {
        const result = validate('abc123', [
          { type: 'pattern', param: /^[a-z0-9]+$/ }
        ])
        expect(result.valid).toBe(true)
      })

      it('fails when value does not match pattern', () => {
        const result = validate('abc-123', [
          { type: 'pattern', param: /^[a-z0-9]+$/ }
        ])
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Invalid format')
      })

      it('fails for empty string', () => {
        const result = validate('', [
          { type: 'pattern', param: /^[a-z]+$/ }
        ])
        expect(result.valid).toBe(false)
      })
    })

    describe('agentName validation', () => {
      it('passes for valid lowercase name', () => {
        const result = validate('api-specialist', [{ type: 'agentName' }])
        expect(result.valid).toBe(true)
      })

      it('passes for name with numbers', () => {
        const result = validate('agent123', [{ type: 'agentName' }])
        expect(result.valid).toBe(true)
      })

      it('passes for name with underscores', () => {
        const result = validate('api_specialist', [{ type: 'agentName' }])
        expect(result.valid).toBe(true)
      })

      it('passes for name with hyphens', () => {
        const result = validate('api-specialist', [{ type: 'agentName' }])
        expect(result.valid).toBe(true)
      })

      it('passes for 64 character name', () => {
        const name = 'a'.repeat(64)
        const result = validate(name, [{ type: 'agentName' }])
        expect(result.valid).toBe(true)
      })

      it('fails for name with uppercase letters', () => {
        const result = validate('ApiSpecialist', [{ type: 'agentName' }])
        expect(result.valid).toBe(false)
      })

      it('fails for name with spaces', () => {
        const result = validate('api specialist', [{ type: 'agentName' }])
        expect(result.valid).toBe(false)
      })

      it('fails for name over 64 characters', () => {
        const name = 'a'.repeat(65)
        const result = validate(name, [{ type: 'agentName' }])
        expect(result.valid).toBe(false)
      })

      it('fails for empty string', () => {
        const result = validate('', [{ type: 'agentName' }])
        expect(result.valid).toBe(false)
      })
    })

    describe('email validation', () => {
      it('passes for valid email', () => {
        const result = validate('user@example.com', [{ type: 'email' }])
        expect(result.valid).toBe(true)
      })

      it('passes for email with plus addressing', () => {
        const result = validate('user+tag@example.com', [{ type: 'email' }])
        expect(result.valid).toBe(true)
      })

      it('passes for email with subdomain', () => {
        const result = validate('user@mail.example.com', [{ type: 'email' }])
        expect(result.valid).toBe(true)
      })

      it('fails for email without @', () => {
        const result = validate('userexample.com', [{ type: 'email' }])
        expect(result.valid).toBe(false)
      })

      it('fails for email without domain', () => {
        const result = validate('user@', [{ type: 'email' }])
        expect(result.valid).toBe(false)
      })

      it('fails for email without TLD', () => {
        const result = validate('user@example', [{ type: 'email' }])
        expect(result.valid).toBe(false)
      })

      it('fails for empty string', () => {
        const result = validate('', [{ type: 'email' }])
        expect(result.valid).toBe(false)
      })
    })

    describe('url validation', () => {
      it('passes for valid http URL', () => {
        const result = validate('http://example.com', [{ type: 'url' }])
        expect(result.valid).toBe(true)
      })

      it('passes for valid https URL', () => {
        const result = validate('https://example.com', [{ type: 'url' }])
        expect(result.valid).toBe(true)
      })

      it('passes for URL with path', () => {
        const result = validate('https://example.com/path/to/page', [{ type: 'url' }])
        expect(result.valid).toBe(true)
      })

      it('passes for URL with query params', () => {
        const result = validate('https://example.com?key=value', [{ type: 'url' }])
        expect(result.valid).toBe(true)
      })

      it('fails for URL without protocol', () => {
        const result = validate('example.com', [{ type: 'url' }])
        expect(result.valid).toBe(false)
      })

      it('fails for ftp URL', () => {
        const result = validate('ftp://example.com', [{ type: 'url' }])
        expect(result.valid).toBe(false)
      })

      it('fails for invalid URL', () => {
        const result = validate('not a url', [{ type: 'url' }])
        expect(result.valid).toBe(false)
      })

      it('fails for empty string', () => {
        const result = validate('', [{ type: 'url' }])
        expect(result.valid).toBe(false)
      })
    })

    describe('multiple rules', () => {
      it('passes all validations', () => {
        const rules = [
          { type: 'required' },
          { type: 'minLength', param: 3 },
          { type: 'maxLength', param: 64 },
          { type: 'agentName' }
        ]
        const result = validate('api-specialist', rules)
        expect(result.valid).toBe(true)
      })

      it('fails on first invalid rule', () => {
        const rules = [
          { type: 'required' },
          { type: 'minLength', param: 3 },
          { type: 'maxLength', param: 5 }, // This will fail
          { type: 'agentName' }
        ]
        const result = validate('api-specialist', rules)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Must be no more than 5 characters')
      })

      it('returns first error encountered', () => {
        const rules = [
          { type: 'required' }, // Will pass
          { type: 'minLength', param: 20 }, // Will fail first
          { type: 'agentName' } // Would also fail but not checked
        ]
        const result = validate('short', rules)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Must be at least 20 characters')
      })
    })

    describe('custom error messages', () => {
      it('uses custom message for required', () => {
        const result = validate('', [
          { type: 'required', message: 'You must provide a value' }
        ])
        expect(result.error).toBe('You must provide a value')
      })

      it('uses custom message for pattern', () => {
        const result = validate('ABC', [
          { type: 'pattern', param: /^[a-z]+$/, message: 'Only lowercase letters allowed' }
        ])
        expect(result.error).toBe('Only lowercase letters allowed')
      })
    })

    describe('unknown validation type', () => {
      it('logs warning and continues validation', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const result = validate('test', [
          { type: 'unknown' },
          { type: 'required' }
        ])

        expect(consoleSpy).toHaveBeenCalledWith('Unknown validation rule: unknown')
        expect(result.valid).toBe(true) // Should pass remaining validations

        consoleSpy.mockRestore()
      })
    })
  })

  describe('useFormValidation composable', () => {
    it('returns validate function', () => {
      const { validate: validateFn } = useFormValidation()
      expect(typeof validateFn).toBe('function')
    })

    it('returns validators object', () => {
      const { validators } = useFormValidation()
      expect(typeof validators).toBe('object')
      expect(typeof validators.required).toBe('function')
      expect(typeof validators.email).toBe('function')
      expect(typeof validators.url).toBe('function')
    })

    it('validate function works same as standalone', () => {
      const { validate: validateFn } = useFormValidation()
      const result = validateFn('test', [{ type: 'required' }])
      expect(result.valid).toBe(true)
    })
  })
})
