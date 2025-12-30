/**
 * End-to-End Tests: Hook Delete Operations
 *
 * Test Suite: 113.001 - Hook Delete Flow (Project-Level)
 * Test Suite: 113.002 - User-Level Hook Delete
 * Test Suite: 113.003 - Delete Error Handling
 * Test Suite: 113.004 - Hook Type Variations
 *
 * Numbering Format: 113.SUITE.TEST
 *
 * Tests the complete hook delete workflow including:
 * - Delete button visibility on hook cards
 * - Confirmation dialog with hook event and matcher
 * - Successful deletion with API integration
 * - Error handling and user feedback
 * - Project and user-level hook deletion
 * - Different hook types (PreToolUse, PostToolUse, Stop, SessionEnd)
 *
 * Implementation:
 * - ConfigItemList.vue - Hook listing with delete button
 * - DeleteConfirmationModal.vue - Confirmation dialog
 * - useHooksStore - Pinia store for hook operations
 * - API endpoints: DELETE /api/projects/:id/hooks/:hookId
 * - API endpoints: DELETE /api/user/hooks/:hookId
 *
 * Hook Identification:
 * Hooks are identified by composite ID: event::matcher::index
 * - event: Hook event type (PreToolUse, PostToolUse, Stop, SessionEnd, etc.)
 * - matcher: Tool matcher for PreToolUse/PostToolUse (e.g., "Bash", "Read|Write", "*")
 * - index: Position in array of hooks with same event+matcher (0-based)
 *
 * NOTE: Hooks do NOT have dependent items/references like agents/commands/skills
 */

const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

// Mock hook data - PreToolUse hook with matcher
const mockPreToolUseHook = {
  event: 'PreToolUse',
  matcher: 'Bash',
  type: 'command',
  command: 'echo "Running Bash command"',
  timeout: 30000,
  enabled: true,
  suppressOutput: false,
  continue: true,
  index: 0
}

// Mock hook data - SessionEnd hook (no matcher)
const mockSessionEndHook = {
  event: 'SessionEnd',
  type: 'command',
  command: 'echo "Session ending"',
  timeout: 30000,
  enabled: true,
  suppressOutput: false,
  continue: true,
  index: 0
}

// Mock hook data - Stop hook (supports prompt type)
const mockStopHook = {
  event: 'Stop',
  type: 'command',
  command: 'echo "Stop triggered"',
  timeout: 30000,
  enabled: true,
  suppressOutput: false,
  continue: true,
  index: 0
}

// Mock hook data - PostToolUse with wildcard matcher
const mockPostToolUseHook = {
  event: 'PostToolUse',
  matcher: '*',
  type: 'command',
  command: 'echo "After any tool"',
  timeout: 30000,
  enabled: true,
  suppressOutput: false,
  continue: true,
  index: 0
}

const mockHooks = [mockPreToolUseHook, mockSessionEndHook, mockStopHook, mockPostToolUseHook]

// Test Suite 113.001: Hook Delete Flow (Project-Level)
test.describe('113.001: Hook Delete Flow (Project-Level)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [{
            id: 'testproject',
            name: 'Test Project',
            path: '/home/user/testproject',
            stats: { agents: 0, commands: 0, hooks: 4, mcp: 0, skills: 0 }
          }]
        })
      })
    })

    // Mock user stats
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [], skills: [] })
      })
    })

    // Mock project endpoints
    await page.route('**/api/projects/testproject/hooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: mockHooks })
      })
    })
    await page.route('**/api/projects/testproject/agents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      })
    })
    await page.route('**/api/projects/testproject/commands', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      })
    })
    await page.route('**/api/projects/testproject/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: [] })
      })
    })
    await page.route('**/api/projects/testproject/mcp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      })
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('113.001.001: should show delete button on hook cards', async ({ page }) => {
    // Find a hook card
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await expect(hookCard).toBeVisible()

    // Verify delete button is visible
    const deleteButton = hookCard.locator('.delete-btn')
    await expect(deleteButton).toBeVisible()
  })

  test('113.001.002: should open delete confirmation modal when delete button clicked', async ({ page }) => {
    // Click delete button on first hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    // Wait for modal to appear
    await page.waitForTimeout(300)

    // Verify modal is visible
    const dialog = page.locator('.p-dialog')
    await expect(dialog).toBeVisible()

    // Verify modal title contains "Delete Hook"
    await expect(dialog.getByText('Delete Hook')).toBeVisible()
  })

  test('113.001.003: should display hook event name in confirmation message', async ({ page }) => {
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify hook event is in the warning message
    // Display format: "PreToolUse (Bash)" or "PreToolUse - Bash"
    await expect(dialog).toContainText('PreToolUse')
  })

  test('113.001.004: should NOT display references section', async ({ page }) => {
    // Hooks do not have dependent items
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify "Referenced by:" section does NOT exist
    await expect(dialog.getByText('Referenced by:')).not.toBeVisible()
  })

  test('113.001.005: should require typing "delete" to enable confirmation', async ({ page }) => {
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Initially disabled
    await expect(deleteButton).toBeDisabled()

    // Type incorrect text
    await confirmInput.fill('wrong')
    await expect(deleteButton).toBeDisabled()

    // Type correct text
    await confirmInput.fill('delete')
    await expect(deleteButton).toBeEnabled()
  })

  test('113.001.006: should delete hook successfully', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Click delete on PreToolUse hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Type confirmation and click delete
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for delete to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(deleteCalled).toBe(true)

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible({ timeout: 2000 })
  })

  test('113.001.007: should show success toast after deletion', async ({ page }) => {
    // Mock delete API
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Mock hooks list after deletion (PreToolUse removed)
    await page.route('**/api/projects/testproject/hooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [mockSessionEndHook, mockStopHook, mockPostToolUseHook] })
      })
    })

    // Delete hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Verify success toast appears (PrimeVue Toast component)
    const toast = page.locator('.p-toast-message-success')
    await expect(toast).toBeVisible({ timeout: 3000 })
  })

  test('113.001.008: should cancel deletion when cancel button is clicked', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API (should not be called)
    await page.route('**/api/projects/testproject/hooks/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Click delete
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Click cancel button
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible({ timeout: 2000 })

    // Verify delete was not called
    expect(deleteCalled).toBe(false)
  })

  test('113.001.009: should show loading state during deletion', async ({ page }) => {
    // Mock slow delete API (1 second to ensure we can catch loading state)
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Click delete
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Type confirmation and click delete
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
    await deleteButton.click()

    // Verify loading state (button should be disabled)
    await expect(deleteButton).toBeDisabled()

    // Check for loading icon (PrimeVue Button loading state)
    const spinner = dialog.locator('.pi-spinner, .p-button-loading-icon')
    await expect(spinner).toBeVisible()

    // Wait for completion
    await expect(dialog).not.toBeVisible({ timeout: 2000 })
  })
})

// Test Suite 113.002: User-Level Hook Delete
test.describe('113.002: User-Level Hook Delete', () => {
  test.beforeEach(async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [{
            id: 'testproject',
            name: 'Test Project',
            path: '/home/user/testproject',
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 0, skills: 0 }
          }]
        })
      })
    })

    // Mock user-level hooks
    await page.route('**/api/user/hooks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            hooks: [mockSessionEndHook, mockStopHook]
          })
        })
      }
    })

    await page.route('**/api/user/agents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      })
    })
    await page.route('**/api/user/commands', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      })
    })
    await page.route('**/api/user/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: [] })
      })
    })
    await page.route('**/api/user/mcp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      })
    })

    await page.route('**/api/projects/testproject/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [], skills: [] })
      })
    })

    // Navigate to user-level view
    await page.goto(`${BASE_URL}/user`)
    await page.waitForLoadState('networkidle')
  })

  test('113.002.001: should show delete button for user-level hooks', async ({ page }) => {
    // Find a user hook card
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'SessionEnd' }).first()
    await expect(hookCard).toBeVisible()

    // Verify delete button is visible
    const deleteButton = hookCard.locator('.delete-btn')
    await expect(deleteButton).toBeVisible()
  })

  test('113.002.002: should delete user-level hook successfully', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API for user hook
    await page.route('**/api/user/hooks/SessionEnd%3A%3A%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'SessionEnd' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for delete to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(deleteCalled).toBe(true)

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible({ timeout: 2000 })
  })

  test('113.002.003: should show success toast for user hook deletion', async ({ page }) => {
    // Mock delete API
    await page.route('**/api/user/hooks/SessionEnd%3A%3A%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'SessionEnd' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Verify success toast
    const toast = page.locator('.p-toast-message-success')
    await expect(toast).toBeVisible({ timeout: 2000 })
  })
})

// Test Suite 113.003: Delete Error Handling
test.describe('113.003: Delete Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [{
            id: 'testproject',
            name: 'Test Project',
            path: '/home/user/testproject',
            stats: { agents: 0, commands: 0, hooks: 1, mcp: 0, skills: 0 }
          }]
        })
      })
    })

    // Mock user stats
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [], skills: [] })
      })
    })

    // Mock project endpoints
    await page.route('**/api/projects/testproject/**', async (route) => {
      if (route.request().url().includes('/hooks') && !route.request().url().includes('/hooks/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, hooks: [mockPreToolUseHook] })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agents: [], commands: [], mcp: [], skills: [] })
        })
      }
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('113.003.001: should show error toast when deletion fails', async ({ page }) => {
    // Mock delete API to fail
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to delete hook from settings'
          })
        })
      }
    })

    // Delete hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for error response
    await page.waitForTimeout(1000)

    // Verify error toast appears
    const errorToast = page.locator('.p-toast-message-error')
    await expect(errorToast).toBeVisible({ timeout: 2000 })

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible({ timeout: 2000 })
  })

  test('113.003.002: should close dialog on API error', async ({ page }) => {
    // Mock delete API to return 404
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Hook not found'
          })
        })
      }
    })

    // Delete hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for error response
    await page.waitForTimeout(1000)

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible({ timeout: 2000 })

    // Verify error toast is shown
    const errorToast = page.locator('.p-toast-message-error')
    await expect(errorToast).toBeVisible({ timeout: 2000 })
  })

  test('113.003.003: should keep hook in list if deletion fails', async ({ page }) => {
    // Mock delete API to fail
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Permission denied'
          })
        })
      }
    })

    // Delete hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for error response and dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // Wait for error toast and dismiss it
    const errorToast = page.locator('.p-toast-message-error')
    await expect(errorToast).toBeVisible({ timeout: 2000 })
    await errorToast.locator('.p-toast-close-button').click()
    await expect(errorToast).not.toBeVisible({ timeout: 2000 })

    // Verify hook is still in the list
    const hookCardAfter = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await expect(hookCardAfter).toBeVisible()

    // Verify delete button is still present
    await expect(hookCardAfter.locator('.delete-btn')).toBeVisible()
  })
})

// Test Suite 113.004: Hook Type Variations
test.describe('113.004: Hook Type Variations', () => {
  test.beforeEach(async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [{
            id: 'testproject',
            name: 'Test Project',
            path: '/home/user/testproject',
            stats: { agents: 0, commands: 0, hooks: 4, mcp: 0, skills: 0 }
          }]
        })
      })
    })

    // Mock user stats
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [], skills: [] })
      })
    })

    // Mock project endpoints
    await page.route('**/api/projects/testproject/hooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: mockHooks })
      })
    })
    await page.route('**/api/projects/testproject/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], mcp: [], skills: [] })
      })
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('113.004.001: should delete PreToolUse hook with matcher', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete PreToolUse hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    await page.waitForTimeout(1000)
    expect(deleteCalled).toBe(true)
  })

  test('113.004.002: should delete SessionEnd hook without matcher', async ({ page }) => {
    let deleteCalled = false

    // SessionEnd has no matcher, hookId format: SessionEnd::::0
    await page.route('**/api/projects/testproject/hooks/SessionEnd%3A%3A%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete SessionEnd hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'SessionEnd' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    await page.waitForTimeout(1000)
    expect(deleteCalled).toBe(true)
  })

  test('113.004.003: should delete Stop hook', async ({ page }) => {
    let deleteCalled = false

    // Stop hook can have prompt type
    await page.route('**/api/projects/testproject/hooks/Stop%3A%3A%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete Stop hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'Stop' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    await page.waitForTimeout(1000)
    expect(deleteCalled).toBe(true)
  })

  test('113.004.004: should delete PostToolUse hook with wildcard matcher', async ({ page }) => {
    let deleteCalled = false

    // PostToolUse with * matcher
    await page.route('**/api/projects/testproject/hooks/PostToolUse%3A%3A*%3A%3A0', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete PostToolUse hook
    const hookCard = page.locator('.config-item-card').filter({ hasText: 'PostToolUse' }).first()
    await hookCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    await page.waitForTimeout(1000)
    expect(deleteCalled).toBe(true)
  })

  test('113.004.005: should handle multiple hooks of same event type', async ({ page }) => {
    // Mock multiple PreToolUse hooks
    const multiplePreToolUse = [
      { ...mockPreToolUseHook, matcher: 'Bash', index: 0 },
      { ...mockPreToolUseHook, matcher: 'Read', index: 0 },
      { ...mockPreToolUseHook, matcher: 'Write', index: 0 }
    ]

    await page.route('**/api/projects/testproject/hooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: multiplePreToolUse })
      })
    })

    // Reload page to get new hooks
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify all three hooks are displayed
    const hookCards = page.locator('.config-item-card').filter({ hasText: 'PreToolUse' })
    await expect(hookCards).toHaveCount(3)

    // Each should have a delete button
    for (let i = 0; i < 3; i++) {
      const card = hookCards.nth(i)
      await expect(card.locator('.delete-btn')).toBeVisible()
    }
  })
})
