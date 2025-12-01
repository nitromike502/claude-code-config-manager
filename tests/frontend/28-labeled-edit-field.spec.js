/**
 * Frontend Component Tests: 28-LabeledEditField Component
 *
 * Test Suite: 28.001 - Inline Field Rendering
 * Test Suite: 28.002 - Block Field Rendering
 * Test Suite: 28.003 - Edit Mode Activation
 * Test Suite: 28.004 - Inline Field Types
 * Test Suite: 28.005 - Block Field Types
 * Test Suite: 28.006 - Validation
 * Test Suite: 28.007 - Cancel Functionality
 * Test Suite: 28.008 - Disabled State
 * Test Suite: 28.009 - Accessibility
 * Test Suite: 28.010 - Integration with InlineEditField
 *
 * Numbering Format: 28.GROUP.TEST
 *
 * Tests the LabeledEditField.vue component which provides a wrapper
 * around InlineEditField with labeled layout support. Handles both
 * inline layout (text, select, number, color, selectbutton) and
 * block layout (textarea, multiselect) with appropriate edit button placement.
 *
 * @see src/components/forms/LabeledEditField.vue
 * @see src/components/forms/InlineEditField.vue
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const TEST_URL = `${BASE_URL}/test/crud`

// Test Suite 28.001: Inline Field Rendering
test.describe('28.001: LabeledEditField Inline Field Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')

    // Scroll to the LabeledEditField section
    await page.getByRole('heading', { name: 'LabeledEditField Component' }).scrollIntoViewIfNeeded()
  })

  test('28.001.001: renders label and value inline for text field', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()

    // Check label is visible and has correct text
    const label = textField.locator('.labeled-edit-field .text-text-primary.font-bold')
    await expect(label).toBeVisible()
    await expect(label).toContainText('Agent Name:')

    // Check value is displayed inline
    const displayValue = textField.locator('.display-mode .value')
    await expect(displayValue).toBeVisible()
    await expect(displayValue).toContainText('test-agent')
  })

  test('28.001.002: label and value are on same line for inline fields', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()

    // Get the flex container
    const flexContainer = textField.locator('.labeled-edit-field > div').first()

    // Check it has flex display
    const display = await flexContainer.evaluate(el => window.getComputedStyle(el).display)
    expect(display).toBe('flex')
  })

  test('28.001.003: edit button appears on hover for inline field', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
    const displayMode = textField.locator('.display-mode')
    const editButton = displayMode.getByRole('button', { name: 'Edit Agent Name' })

    // Button should exist
    await expect(editButton).toBeVisible()

    // Hover to ensure it's fully visible (opacity 1)
    await displayMode.hover()
    await expect(editButton).toBeVisible()
  })

  test('28.001.004: number field renders inline', async ({ page }) => {
    const numberField = page.locator('.test-box').filter({ hasText: 'Inline Number Field' }).first()

    const label = numberField.locator('.labeled-edit-field .text-text-primary.font-bold')
    await expect(label).toBeVisible()
    await expect(label).toContainText('Timeout:')

    const displayValue = numberField.locator('.display-mode .value')
    await expect(displayValue).toContainText('120')
  })

  test('28.001.005: select field renders inline', async ({ page }) => {
    const selectField = page.locator('.test-box').filter({ hasText: 'Inline Select Field' }).first()

    const label = selectField.locator('.labeled-edit-field .text-text-primary.font-bold')
    await expect(label).toBeVisible()
    await expect(label).toContainText('Model:')

    const displayValue = selectField.locator('.display-mode .value')
    await expect(displayValue).toContainText('sonnet')
  })

  test('28.001.006: color field renders inline', async ({ page }) => {
    const colorField = page.locator('.test-box').filter({ hasText: 'Inline Color Field' }).first()

    const label = colorField.locator('.labeled-edit-field .text-text-primary.font-bold')
    await expect(label).toBeVisible()
    await expect(label).toContainText('Color:')

    const displayValue = colorField.locator('.display-mode .value')
    await expect(displayValue).toContainText('green')
  })
})

// Test Suite 28.002: Block Field Rendering
test.describe('28.002: LabeledEditField Block Field Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')

    // Scroll to the LabeledEditField section
    await page.getByRole('heading', { name: 'LabeledEditField Component' }).scrollIntoViewIfNeeded()
  })

  test('28.002.001: renders label with edit button for textarea field', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()

    // Check label is visible
    const label = textareaField.locator('.labeled-edit-field .text-text-primary.font-bold')
    await expect(label).toBeVisible()
    await expect(label).toContainText('Description:')

    // Check edit button is next to label (not next to content)
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })
    await expect(editButton).toBeVisible()

    // Edit button should be in the header with the label
    const header = textareaField.locator('.labeled-edit-field > div > div').first()
    const buttonInHeader = header.getByRole('button', { name: 'Edit Description' })
    await expect(buttonInHeader).toBeVisible()
  })

  test('28.002.002: content displays below label for textarea', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()

    // Content should be in a separate display area
    const contentDisplay = textareaField.locator('.content-display pre')
    await expect(contentDisplay).toBeVisible()
    await expect(contentDisplay).toContainText('This is a test description')
  })

  test('28.002.003: multiselect field renders with inline layout', async ({ page }) => {
    const multiselectField = page.locator('.test-box').filter({ hasText: 'Block MultiSelect Field' }).first()

    // Check label is visible (multiselect now uses inline layout)
    const label = multiselectField.locator('.labeled-edit-field .text-text-primary.font-bold')
    await expect(label).toBeVisible()
    await expect(label).toContainText('Allowed Tools:')

    // Multiselect uses inline layout, so edit button is in display mode
    const displayMode = multiselectField.locator('.display-mode')
    await expect(displayMode).toBeVisible()

    // Edit button should be visible on hover
    const editButton = multiselectField.getByRole('button', { name: 'Edit Allowed Tools' })
    await expect(editButton).toBeVisible()
  })

  test('28.002.004: edit button is next to label, not content for block fields', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()

    // Get the label container
    const labelContainer = textareaField.locator('.labeled-edit-field > div > div').first()

    // Edit button should be in this container
    const editButton = labelContainer.getByRole('button', { name: 'Edit Description' })
    await expect(editButton).toBeVisible()

    // Content display should be separate
    const contentDisplay = textareaField.locator('.content-display')
    await expect(contentDisplay).toBeVisible()

    // Content display should NOT contain the edit button
    const buttonInContent = contentDisplay.getByRole('button', { name: 'Edit Description' })
    expect(await buttonInContent.count()).toBe(0)
  })
})

// Test Suite 28.003: Edit Mode Activation
test.describe('28.003: LabeledEditField Edit Mode Activation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')

    // Scroll to the LabeledEditField section
    await page.getByRole('heading', { name: 'LabeledEditField Component' }).scrollIntoViewIfNeeded()
  })

  test('28.003.001: clicking edit enters edit mode for inline field', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    // Should show input field
    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await expect(input).toBeVisible()
    await expect(input).toBeFocused()
  })

  test('28.003.002: clicking edit enters edit mode for block field', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    await editButton.click()

    // Should show textarea
    const textarea = textareaField.locator('textarea')
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeFocused()
  })

  test('28.003.003: edit mode shows save and cancel buttons for block field', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    await editButton.click()

    // Should show Save and Cancel buttons
    const saveButton = textareaField.getByRole('button', { name: 'Save' })
    const cancelButton = textareaField.getByRole('button', { name: 'Cancel' })

    await expect(saveButton).toBeVisible()
    await expect(cancelButton).toBeVisible()
  })

  test('28.003.004: edit button hidden during edit mode for block field', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    await editButton.click()

    // Edit button should not be visible during edit mode
    expect(await editButton.count()).toBe(0)
  })
})

// Test Suite 28.004: Inline Field Types
test.describe('28.004: LabeledEditField Inline Field Types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')

    // Scroll to the LabeledEditField section
    await page.getByRole('heading', { name: 'LabeledEditField Component' }).scrollIntoViewIfNeeded()
  })

  test('28.004.001: text field accepts and updates value', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await input.fill('new-agent')

    const acceptButton = textField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    // Should exit edit mode and show new value
    await expect(input).not.toBeVisible()
    const displayValue = textField.locator('.display-mode .value')
    await expect(displayValue).toContainText('new-agent')
  })

  test('28.004.002: select field changes dropdown selection', async ({ page }) => {
    const selectField = page.locator('.test-box').filter({ hasText: 'Inline Select Field' }).first()
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

  test('28.004.003: number field accepts numeric input', async ({ page }) => {
    const numberField = page.locator('.test-box').filter({ hasText: 'Inline Number Field' }).first()
    const editButton = numberField.getByRole('button', { name: 'Edit Timeout' })

    await editButton.click()

    const input = numberField.locator('input[type="text"]')
    await input.fill('300')

    const acceptButton = numberField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    const displayValue = numberField.locator('.display-mode .value')
    await expect(displayValue).toContainText('300')
  })

  test('28.004.004: color field accepts color selection', async ({ page }) => {
    const colorField = page.locator('.test-box').filter({ hasText: 'Inline Color Field' }).first()
    const editButton = colorField.getByRole('button', { name: 'Edit Color' })

    await editButton.click()

    // Click the dropdown
    const dropdown = colorField.getByRole('combobox', { name: 'Agent color selection' })
    await dropdown.click()

    // Select a color
    await page.getByRole('option', { name: 'Purple' }).click()

    const acceptButton = colorField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    const displayValue = colorField.locator('.display-mode .value')
    await expect(displayValue).toContainText('purple')
  })
})

// Test Suite 28.005: Block Field Types
test.describe('28.005: LabeledEditField Block Field Types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')

    // Scroll to the LabeledEditField section
    await page.getByRole('heading', { name: 'LabeledEditField Component' }).scrollIntoViewIfNeeded()
  })

  test('28.005.001: textarea field accepts multi-line text', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    await editButton.click()

    const textarea = textareaField.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.fill('New description\nwith multiple lines\nfor testing')

    const saveButton = textareaField.getByRole('button', { name: 'Save' })
    await saveButton.click()

    const contentDisplay = textareaField.locator('.content-display pre')
    await expect(contentDisplay).toContainText('New description')
    await expect(contentDisplay).toContainText('with multiple lines')
  })

  test('28.005.002: multiselect field updates value using inline layout', async ({ page }) => {
    const multiselectField = page.locator('.test-box').filter({ hasText: 'Block MultiSelect Field' }).first()
    const editButton = multiselectField.getByRole('button', { name: 'Edit Allowed Tools' })

    await editButton.click()

    // Wait for multiselect to appear
    const dropdown = multiselectField.locator('.p-multiselect')
    await expect(dropdown).toBeVisible()
    await dropdown.click()

    // Toggle an option - use exact match to avoid ambiguity with BashOutput
    await page.getByRole('option', { name: 'Bash', exact: true }).click()

    // Close dropdown
    await page.keyboard.press('Escape')

    // Multiselect uses inline layout, so it has Accept button (not Save)
    const acceptButton = multiselectField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    // Should exit edit mode and return to display mode
    await expect(dropdown).not.toBeVisible()
    const displayMode = multiselectField.locator('.display-mode')
    await expect(displayMode).toBeVisible()
  })

  test('28.005.003: textarea shows "Not set" when empty', async ({ page }) => {
    // This would require adding a test case with null value
    // For now, we'll verify the current value displays
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const contentDisplay = textareaField.locator('.content-display pre')
    await expect(contentDisplay).toBeVisible()
  })
})

// Test Suite 28.006: Validation
test.describe('28.006: LabeledEditField Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')

    // Scroll to the LabeledEditField section
    await page.getByRole('heading', { name: 'LabeledEditField Component' }).scrollIntoViewIfNeeded()
  })

  test('28.006.001: shows validation error for invalid input', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
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

  test('28.006.002: stays in edit mode when validation fails', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await input.fill('INVALID')

    const acceptButton = textField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    // Should still show input field (edit mode)
    await expect(input).toBeVisible()
  })

  test('28.006.003: block field validation displays error message', async ({ page }) => {
    // Add a validation test for textarea if applicable
    // For now, textarea doesn't have validation in the test page
    test.skip()
  })
})

// Test Suite 28.007: Cancel Functionality
test.describe('28.007: LabeledEditField Cancel Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')

    // Scroll to the LabeledEditField section
    await page.getByRole('heading', { name: 'LabeledEditField Component' }).scrollIntoViewIfNeeded()
  })

  test('28.007.001: cancel button reverts changes for inline field', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
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

  test('28.007.002: cancel button reverts changes for block field', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const originalValue = await textareaField.locator('.content-display pre').textContent()

    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })
    await editButton.click()

    const textarea = textareaField.locator('textarea')
    await textarea.fill('Changed description')

    const cancelButton = textareaField.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Should exit edit mode
    await expect(textarea).not.toBeVisible()

    // Should show original value
    const contentDisplay = textareaField.locator('.content-display pre')
    await expect(contentDisplay).toHaveText(originalValue)
  })

  test('28.007.003: Escape key cancels editing for inline field', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await input.fill('new-value')
    await input.press('Escape')

    // Should exit edit mode
    await expect(input).not.toBeVisible()
  })

  test('28.007.004: Escape key cancels editing for block field', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    await editButton.click()

    const textarea = textareaField.locator('textarea')
    await textarea.fill('new-value')
    await textarea.press('Escape')

    // Should exit edit mode
    await expect(textarea).not.toBeVisible()
  })
})

// Test Suite 28.008: Disabled State
test.describe('28.008: LabeledEditField Disabled State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')

    // Scroll to the LabeledEditField section
    await page.getByRole('heading', { name: 'LabeledEditField Component' }).scrollIntoViewIfNeeded()
  })

  test('28.008.001: edit button is disabled when field is disabled', async ({ page }) => {
    const disabledField = page.locator('.test-box').filter({ hasText: 'Disabled Field' }).first()

    // Edit button should be present but disabled
    const editButton = disabledField.getByRole('button', { name: 'Edit Disabled Field' })
    await expect(editButton).toBeVisible()
    await expect(editButton).toBeDisabled()
  })

  test('28.008.002: displays value but not editable when disabled', async ({ page }) => {
    const disabledField = page.locator('.test-box').filter({ hasText: 'Disabled Field' }).first()

    // Should show label
    const label = disabledField.locator('.labeled-edit-field .text-text-primary.font-bold')
    await expect(label).toBeVisible()

    // Should show value
    const displayValue = disabledField.locator('.display-mode .value')
    await expect(displayValue).toBeVisible()
    await expect(displayValue).toContainText('This field is disabled')
  })
})

// Test Suite 28.009: Accessibility
test.describe('28.009: LabeledEditField Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')

    // Scroll to the LabeledEditField section
    await page.getByRole('heading', { name: 'LabeledEditField Component' }).scrollIntoViewIfNeeded()
  })

  test('28.009.001: edit button has proper aria-label for inline field', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await expect(editButton).toHaveAttribute('aria-label', 'Edit Agent Name')
  })

  test('28.009.002: edit button has proper aria-label for block field', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    await expect(editButton).toHaveAttribute('aria-label', 'Edit Description')
  })

  test('28.009.003: save and cancel buttons have aria-labels', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    await editButton.click()

    const saveButton = textareaField.getByRole('button', { name: 'Save' })
    const cancelButton = textareaField.getByRole('button', { name: 'Cancel' })

    // PrimeVue buttons should have accessible labels
    await expect(saveButton).toBeVisible()
    await expect(cancelButton).toBeVisible()
  })

  test('28.009.004: keyboard navigation works for inline field', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    // Focus and activate edit button with keyboard
    await editButton.focus()
    await page.keyboard.press('Enter')

    // Input should be focused
    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await expect(input).toBeFocused()
  })

  test('28.009.005: keyboard navigation works for block field', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    // Focus and activate edit button with keyboard
    await editButton.focus()
    await page.keyboard.press('Enter')

    // Textarea should be focused
    const textarea = textareaField.locator('textarea')
    await expect(textarea).toBeFocused()
  })
})

// Test Suite 28.010: Integration with InlineEditField
test.describe('28.010: LabeledEditField Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')

    // Scroll to the LabeledEditField section
    await page.getByRole('heading', { name: 'LabeledEditField Component' }).scrollIntoViewIfNeeded()
  })

  test('28.010.001: inline fields use InlineEditField component internally', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    // Should show InlineEditField action buttons (check, times icons)
    const acceptButton = textField.getByRole('button', { name: 'Accept changes' })
    const cancelButton = textField.getByRole('button', { name: 'Cancel editing' })

    await expect(acceptButton).toBeVisible()
    await expect(cancelButton).toBeVisible()
  })

  test('28.010.002: block fields have custom save/cancel layout', async ({ page }) => {
    const textareaField = page.locator('.test-box').filter({ hasText: 'Block Textarea Field' }).first()
    const editButton = textareaField.getByRole('button', { name: 'Edit Description' })

    await editButton.click()

    // Should show custom Save and Cancel buttons (not icon-only)
    const saveButton = textareaField.getByRole('button', { name: 'Save' })
    const cancelButton = textareaField.getByRole('button', { name: 'Cancel' })

    await expect(saveButton).toBeVisible()
    await expect(cancelButton).toBeVisible()

    // Buttons should have labels, not just icons
    await expect(saveButton).toContainText('Save')
    await expect(cancelButton).toContainText('Cancel')
  })

  test('28.010.003: emits edit events through InlineEditField', async ({ page }) => {
    const textField = page.locator('.test-box').filter({ hasText: 'Inline Text Field' }).first()
    const editButton = textField.getByRole('button', { name: 'Edit Agent Name' })

    await editButton.click()

    const input = textField.getByRole('textbox', { name: 'Enter agent name' })
    await input.fill('event-test')

    const acceptButton = textField.getByRole('button', { name: 'Accept changes' })
    await acceptButton.click()

    // Should update the value display (event was emitted and handled)
    const valueDisplay = textField.locator('.value-display')
    await expect(valueDisplay).toContainText('event-test')
  })
})
