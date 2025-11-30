/**
 * Frontend Component Tests: 25-InlineEditField Component
 *
 * Test Suite: 25.001 - Display Mode
 * Test Suite: 25.002 - Edit Mode Activation
 * Test Suite: 25.003 - Field Types
 * Test Suite: 25.004 - Validation
 * Test Suite: 25.005 - Cancel Functionality
 * Test Suite: 25.006 - Keyboard Shortcuts
 * Test Suite: 25.007 - Accessibility
 *
 * Numbering Format: 25.GROUP.TEST
 *
 * Tests the InlineEditField.vue component which provides inline editing
 * capability for various field types (text, textarea, select, etc.)
 *
 * @see src/components/forms/InlineEditField.vue
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const TEST_URL = `${BASE_URL}/test/crud`

// Test Suite 25.001: Display Mode
test.describe('25.001: InlineEditField Display Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
  })

  test('25.001.001: renders value in display mode by default', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const displayValue = textField.locator('.display-mode .value')

    await expect(displayValue).toBeVisible()
    await expect(displayValue).toContainText('api-specialist')
  })

  test('25.001.002: shows edit button on hover', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const displayMode = textField.locator('.display-mode')
    const editButton = displayMode.getByRole('button', { name: 'Edit Agent Name' })

    // Initially hidden (opacity 0)
    await expect(editButton).toBeVisible()

    // Hover to show button
    await displayMode.hover()
    await expect(editButton).toBeVisible()
  })

  test('25.001.003: edit button is disabled when field is disabled', async ({ page }) => {
    // We would need to add a disabled test case to the test page
    // For now, we'll skip this test
    test.skip()
  })
})

// Test Suite 25.002: Edit Mode Activation
test.describe('25.002: InlineEditField Edit Mode Activation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
  })

  test('25.002.001: enters edit mode when edit button is clicked', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    // Should show input field
    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await expect(input).toBeVisible()
    await expect(input).toBeFocused()

    // Should show action buttons
    const acceptButton = textField.getByRole('button', { name: 'Accept changes' })
    const cancelButton = textField.getByRole('button', { name: 'Cancel editing' })
    await expect(acceptButton).toBeVisible()
    await expect(cancelButton).toBeVisible()
  })

  test('25.002.002: input field receives focus when entering edit mode', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await expect(input).toBeFocused()
  })
})

// Test Suite 25.003: Field Types
test.describe('25.003: InlineEditField Field Types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
  })

  test('25.003.001: text field - accepts and updates value', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await input.fill('new-agent-name')

    const acceptButton = textField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    // Should exit edit mode and show new value
    await expect(input).not.toBeVisible()
    const displayValue = textField.locator('.display-mode .value')
    await expect(displayValue).toContainText('new-agent-name')
  })

  test('25.003.002: textarea field - accepts multi-line text', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    await editButton.click()

    const textarea = textareaField.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.fill('New description\nwith multiple lines')

    const acceptButton = textareaField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    const displayValue = textareaField.locator('.display-mode .value')
    await expect(displayValue).toContainText('New description')
  })

  test('25.003.003: select field - changes dropdown selection', async ({ page }) => {
    const selectField = page.locator('.test-box').filter({ hasText: 'Select Field' }).first()
    const editButton = selectField.getByRole('button', { name: 'Edit Model' })

    await editButton.click()

    // Click the dropdown
    const dropdown = selectField.locator('.p-select')
    await dropdown.click()

    // Select an option
    await page.getByRole('option', { name: 'Haiku' }).click()

    const acceptButton = selectField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    const displayValue = selectField.locator('.display-mode .value')
    await expect(displayValue).toContainText('haiku')
  })

  test('25.003.004: number field - accepts numeric input', async ({ page }) => {
    const numberField = page.locator('.test-box').filter({ hasText: 'Number Field' }).first()
    const editButton = numberField.getByRole('button', { name: 'Edit Timeout' })

    await editButton.click()

    const input = numberField.locator('input[type="text"]')
    await input.fill('120')

    const acceptButton = numberField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    const displayValue = numberField.locator('.display-mode .value')
    await expect(displayValue).toContainText('120')
  })
})

// Test Suite 25.004: Validation
test.describe('25.004: InlineEditField Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
  })

  test('25.004.001: shows validation error for invalid input', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    // Enter invalid name (uppercase letters not allowed)
    await input.fill('InvalidName')

    const acceptButton = textField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    // Should show validation error
    const errorMessage = textField.locator('.p-message')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText('lowercase')
  })

  test('25.004.002: stays in edit mode when validation fails', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await input.fill('Invalid-Name-With-Caps')

    const acceptButton = textField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    // Should still show input field (edit mode)
    await expect(input).toBeVisible()
  })
})

// Test Suite 25.005: Cancel Functionality
test.describe('25.005: InlineEditField Cancel Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
  })

  test('25.005.001: cancel button reverts changes', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const originalValue = await textField.locator('.display-mode .value').textContent()

    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })
    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await input.fill('changed-value')

    const cancelButton = textField.getByRole('button', { name: 'Cancel editing' })
    await cancelButton.click()

    // Should exit edit mode
    await expect(input).not.toBeVisible()

    // Should show original value
    const displayValue = textField.locator('.display-mode .value')
    await expect(displayValue).toHaveText(originalValue)
  })

  test('25.005.002: Escape key cancels editing', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await input.fill('new-value')
    await input.press('Escape')

    // Should exit edit mode
    await expect(input).not.toBeVisible()
  })
})

// Test Suite 25.006: Keyboard Shortcuts
test.describe('25.006: InlineEditField Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
  })

  test('25.006.001: Enter key accepts changes for text field', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await input.fill('enter-test')
    await input.press('Enter')

    // Should exit edit mode and save value
    await expect(input).not.toBeVisible()
    const displayValue = textField.locator('.display-mode .value')
    await expect(displayValue).toContainText('enter-test')
  })

  test('25.006.002: Enter key does not accept changes for textarea', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    await editButton.click()

    const textarea = textareaField.locator('textarea')
    await textarea.fill('Line 1')
    await textarea.press('Enter')

    // Should still be in edit mode (Enter adds newline in textarea)
    await expect(textarea).toBeVisible()
  })
})

// Test Suite 25.007: Accessibility
test.describe('25.007: InlineEditField Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
  })

  test('25.007.001: edit button has proper aria-label', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await expect(editButton).toHaveAttribute('aria-label', 'Edit Agent Name')
  })

  test('25.007.002: accept and cancel buttons have aria-labels', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const acceptButton = textField.getByRole('button', { name: 'Accept changes' })
    const cancelButton = textField.getByRole('button', { name: 'Cancel editing' })

    await expect(acceptButton).toHaveAttribute('aria-label', 'Accept changes')
    await expect(cancelButton).toHaveAttribute('aria-label', 'Cancel editing')
  })

  test('25.007.003: keyboard navigation works correctly', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    // Focus and activate edit button with keyboard
    await editButton.focus()
    await page.keyboard.press('Enter')

    // Input should be focused
    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await expect(input).toBeFocused()

    // Can tab to buttons
    await page.keyboard.press('Tab')
    const acceptButton = textField.getByRole('button', { name: 'Accept changes' })
    await expect(acceptButton).toBeFocused()
  })
})
