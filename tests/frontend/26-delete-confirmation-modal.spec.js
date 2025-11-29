/**
 * DeleteConfirmationModal Component Tests
 *
 * Tests for the DeleteConfirmationModal.vue component which provides
 * a confirmation dialog for deleting configuration items.
 *
 * @see src/components/modals/DeleteConfirmationModal.vue
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const TEST_URL = `${BASE_URL}/test/crud`

test.describe('DeleteConfirmationModal Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
  })

  test.describe('Modal Opening', () => {
    test('opens modal when delete button is clicked', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: 'Delete Agent' })
      await deleteButton.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
    })

    test('displays correct title based on item type', async ({ page }) => {
      // Test agent
      await page.getByRole('button', { name: 'Delete Agent' }).click()
      await expect(page.getByText('Delete Subagent')).toBeVisible()
      await page.getByRole('button', { name: 'Cancel' }).click()

      // Test command
      await page.getByRole('button', { name: 'Delete Command' }).click()
      await expect(page.getByText('Delete Slash Command')).toBeVisible()
      await page.getByRole('button', { name: 'Cancel' }).click()

      // Test skill
      await page.getByRole('button', { name: 'Delete Skill' }).click()
      await expect(page.getByText('Delete Skill')).toBeVisible()
    })

    test('displays item name in warning message', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('"api-specialist"')).toBeVisible()
    })

    test('shows warning icon', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const warningIcon = dialog.locator('.pi-exclamation-triangle')
      await expect(warningIcon).toBeVisible()
    })
  })

  test.describe('Dependent Items', () => {
    test('shows dependent items warning when present', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Command' }).click()

      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('Referenced by:')).toBeVisible()
      await expect(dialog.getByText('agents/api-specialist.md')).toBeVisible()
      await expect(dialog.getByText('commands/tools/validate.md')).toBeVisible()
      await expect(dialog.getByText('skills/test-runner/SKILL.md')).toBeVisible()
    })

    test('does not show dependent items section when empty', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('Referenced by:')).not.toBeVisible()
    })

    test('displays dependent items in a list', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Command' }).click()

      const dialog = page.getByRole('dialog')
      const list = dialog.getByRole('list')
      const listItems = list.getByRole('listitem')

      await expect(listItems).toHaveCount(3)
    })
  })

  test.describe('Confirmation Input', () => {
    test('shows confirmation input field', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await expect(input).toBeVisible()
      await expect(input).toHaveAttribute('placeholder', "Type 'delete' here")
    })

    test('confirmation input receives focus on modal open', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const input = page.getByRole('textbox', { name: /Type delete to confirm/i })
      await expect(input).toBeFocused()
    })

    test('delete button is disabled until correct text is entered', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })

      // Initially disabled
      await expect(deleteButton).toBeDisabled()

      // Type incorrect text
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('wrong')
      await expect(deleteButton).toBeDisabled()

      // Type correct text (case-insensitive)
      await input.fill('DELETE')
      await expect(deleteButton).toBeEnabled()
    })

    test('accepts "delete" in lowercase', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('delete')

      const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
      await expect(deleteButton).toBeEnabled()
    })

    test('accepts "delete" in uppercase', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('DELETE')

      const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
      await expect(deleteButton).toBeEnabled()
    })

    test('accepts "delete" in mixed case', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('DeLeTe')

      const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
      await expect(deleteButton).toBeEnabled()
    })

    test('rejects partial match', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('delet')

      const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
      await expect(deleteButton).toBeDisabled()
    })
  })

  test.describe('Delete Confirmation', () => {
    test('clicking delete button triggers confirmation', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('delete')

      const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
      await deleteButton.click()

      // Check action log for confirmation
      await page.waitForTimeout(100)
      await expect(page.getByText(/Delete confirmed for agent/)).toBeVisible()
    })

    test('shows loading state during delete operation', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('delete')

      const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
      await deleteButton.click()

      // Delete button should be disabled during loading
      await expect(deleteButton).toBeDisabled()

      // Should show loading spinner
      const spinner = dialog.locator('.pi-spinner, .p-button-loading-icon')
      await expect(spinner).toBeVisible()
    })

    test('modal closes after successful delete', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('delete')

      const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
      await deleteButton.click()

      // Wait for operation to complete
      await page.waitForTimeout(1600)

      // Modal should be closed
      await expect(dialog).not.toBeVisible()
    })

    test('Enter key confirms delete when valid', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('delete')
      await input.press('Enter')

      // Should trigger confirmation
      await page.waitForTimeout(100)
      await expect(page.getByText(/Delete confirmed for agent/)).toBeVisible()
    })

    test('Enter key does nothing when invalid', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('wrong')
      await input.press('Enter')

      // Modal should still be visible
      await expect(dialog).toBeVisible()

      // No confirmation in action log
      await expect(page.getByText(/Delete confirmed/)).not.toBeVisible()
    })
  })

  test.describe('Cancel Functionality', () => {
    test('clicking cancel button closes modal', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const cancelButton = dialog.getByRole('button', { name: 'Cancel' })
      await cancelButton.click()

      await expect(dialog).not.toBeVisible()
    })

    test('clicking X button closes modal', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const closeButton = dialog.getByRole('button', { name: 'Close' })
      await closeButton.click()

      await expect(dialog).not.toBeVisible()
    })

    test('Escape key closes modal', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      await page.keyboard.press('Escape')

      await expect(dialog).not.toBeVisible()
    })

    test('confirmation text is reset when modal reopens', async ({ page }) => {
      // Open modal and type text
      await page.getByRole('button', { name: 'Delete Agent' }).click()
      let dialog = page.getByRole('dialog')
      let input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('delete')
      await page.getByRole('button', { name: 'Cancel' }).click()

      // Reopen modal
      await page.getByRole('button', { name: 'Delete Agent' }).click()
      dialog = page.getByRole('dialog')
      input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })

      // Input should be empty
      await expect(input).toHaveValue('')
    })
  })

  test.describe('Loading State', () => {
    test('disables all interactions during loading', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('delete')

      const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
      await deleteButton.click()

      // All buttons and input should be disabled
      await expect(deleteButton).toBeDisabled()
      await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      await expect(input).toBeDisabled()
    })

    test('close button is hidden during loading', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      await input.fill('delete')

      const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
      await deleteButton.click()

      // Close button should not be visible or should be disabled
      const closeButton = dialog.getByRole('button', { name: 'Close' })
      await expect(closeButton).not.toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('modal traps focus', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })

      // Input should be focused initially
      await expect(input).toBeFocused()

      // Tab through elements
      await page.keyboard.press('Tab')
      await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(dialog.getByRole('button', { name: 'Delete', exact: true })).toBeFocused()
    })

    test('modal has proper ARIA attributes', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
    })

    test('warning icon has aria-hidden', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const warningIcon = dialog.locator('.pi-exclamation-triangle')
      await expect(warningIcon).toHaveAttribute('aria-hidden', 'true')
    })

    test('confirmation input has associated label', async ({ page }) => {
      await page.getByRole('button', { name: 'Delete Agent' }).click()

      const dialog = page.getByRole('dialog')
      const input = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
      const label = dialog.locator('label[for="delete-confirm"]')

      await expect(label).toBeVisible()
      await expect(input).toHaveAttribute('id', 'delete-confirm')
    })
  })
})
