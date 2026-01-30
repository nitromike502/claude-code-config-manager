/**
 * End-to-End Tests: Skill Delete Operations
 *
 * Test Suite: 112.001 - Skill Delete Flow (Project-Level)
 * Test Suite: 112.002 - User-Level Skill Delete
 * Test Suite: 112.003 - Delete Error Handling
 *
 * Numbering Format: 112.SUITE.TEST
 *
 * Tests the complete skill delete workflow including:
 * - Delete button visibility based on edit permissions
 * - Confirmation dialog with skill name and directory warning
 * - Successful deletion with API integration
 * - Error handling and user feedback
 * - Project and user-level skill deletion
 *
 * Implementation:
 * - ConfigDetailSidebar.vue - Sidebar with delete button
 * - DeleteConfirmationModal.vue - Confirmation dialog
 * - ConfigItemList.vue - Skill listing
 * - useSkillsStore - Pinia store for skill operations
 * - API endpoints: DELETE /api/projects/:id/skills/:name
 * - API endpoints: DELETE /api/user/skills/:name
 *
 * NOTE: Skills use directory-based configuration (entire directory is deleted)
 */

const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

// Mock skill data
const mockSkill = {
  name: 'test-skill',
  description: 'A test skill for delete operations',
  content: '# Test Skill\n\nThis is a test skill for E2E testing.',
  directoryPath: '/home/user/testproject/.claude/skills/test-skill',
  scope: 'project',
  location: 'project',
  allowedTools: ['Bash', 'Read', 'Write'],
  externalReferences: [],
  hasError: false
}

const mockSkillWithRefs = {
  name: 'skill-with-refs',
  description: 'A skill with external references',
  content: '# Skill With Refs\n\nReferences external files.',
  directoryPath: '/home/user/testproject/.claude/skills/skill-with-refs',
  scope: 'project',
  location: 'project',
  allowedTools: ['Bash', 'Read'],
  externalReferences: [
    {
      line: 15,
      reference: '../../src/utils/helper.js',
      file: 'SKILL.md',
      type: 'relative-path',
      severity: 'warning'
    }
  ],
  hasError: false
}

const mockSkills = [mockSkill, mockSkillWithRefs]

// Test Suite 112.001: Skill Delete Flow (Project-Level)
test.describe('112.001: Skill Delete Flow (Project-Level)', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 0, skills: 2 }
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
    await page.route('**/api/projects/testproject/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: mockSkills })
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
    await page.route('**/api/projects/testproject/hooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
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

  test('112.001.001: should show delete button in sidebar footer for editable skills', async ({ page }) => {
    // Click View to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify delete button is in footer
    const deleteButton = sidebar.locator('.delete-action-btn')
    await expect(deleteButton).toBeVisible()
  })

  test('112.001.002: should open delete confirmation modal when delete button clicked', async ({ page }) => {
    // Note: Skills don't check references API (no dependent items for skills)

    // Click View to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Click delete button
    const deleteButton = sidebar.locator('.delete-action-btn')
    await deleteButton.click()

    // Wait for delete confirmation dialog to appear
    await page.waitForTimeout(500)

    // Verify modal is visible (use .p-dialog to distinguish from sidebar drawer)
    const dialog = page.locator('.p-dialog').last() // Get last dialog (the confirmation modal)
    await expect(dialog).toBeVisible()

    // Verify modal title contains "Delete"
    await expect(dialog.locator('.text-lg.font-semibold')).toContainText('Delete')
  })

  test('112.001.003: should display skill name in confirmation message', async ({ page }) => {
    // Click View and delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify skill name is in the warning message
    await expect(dialog.getByText('"test-skill"')).toBeVisible()
  })

  test('112.001.004: should display directory deletion warning', async ({ page }) => {
    // Click View and delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify directory deletion warning is present
    // Skills delete entire directory, not just a file
    await expect(dialog.getByText(/directory/i)).toBeVisible()
  })

  test('112.001.005: should require typing "delete" to enable confirmation', async ({ page }) => {

    // Open sidebar and click delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

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

  test('112.001.006: should delete skill successfully', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Open sidebar and click delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

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

    // Verify sidebar is closed
    const sidebar = page.locator('.p-drawer')
    await expect(sidebar).not.toBeVisible({ timeout: 2000 })
  })

  test('112.001.007: should show success toast after deletion', async ({ page }) => {
    // Mock delete API
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Open sidebar and delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Verify success toast appears (PrimeVue Toast component)
    const toast = page.locator('.p-toast-message-success')
    await expect(toast).toBeVisible({ timeout: 2000 })
  })

  test('112.001.008: should cancel deletion when cancel button is clicked', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API (should not be called)
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Open sidebar and click delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    const dialog = page.locator('.p-dialog')

    // Click cancel button
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible({ timeout: 2000 })

    // Verify delete was not called
    expect(deleteCalled).toBe(false)

    // Verify sidebar is still open
    const sidebar = page.locator('.p-drawer')
    await expect(sidebar).toBeVisible()
  })

  test('112.001.009: should show loading state during deletion', async ({ page }) => {
    // Mock slow delete API (1 second to ensure we can catch loading state)
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
      if (route.request().method() === 'DELETE') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Open sidebar and click delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

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

// Test Suite 112.002: User-Level Skill Delete
test.describe('112.002: User-Level Skill Delete', () => {
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

    // Mock user-level skills
    await page.route('**/api/user/skills', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            skills: [{
              ...mockSkill,
              scope: 'user',
              location: 'user',
              directoryPath: '/home/user/.claude/skills/test-skill'
            }]
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
    await page.route('**/api/user/hooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
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

  test('112.002.001: should show delete button for user-level skills', async ({ page }) => {
    // Click View to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify delete button is visible
    const deleteButton = sidebar.locator('.delete-action-btn')
    await expect(deleteButton).toBeVisible()
  })

  test('112.002.002: should delete user-level skill successfully', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API for user skill
    await page.route('**/api/user/skills/test-skill', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Open sidebar and delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for delete to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(deleteCalled).toBe(true)

    // Verify dialog and sidebar are closed
    await expect(dialog).not.toBeVisible({ timeout: 2000 })
    const sidebar = page.locator('.p-drawer')
    await expect(sidebar).not.toBeVisible({ timeout: 2000 })
  })
})

// Test Suite 112.003: Delete Error Handling
test.describe('112.003: Delete Error Handling', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 0, skills: 1 }
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
      if (route.request().url().includes('/skills') && !route.request().url().includes('/skills/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, skills: [mockSkill] })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [] })
        })
      }
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('112.003.001: should show error toast when deletion fails', async ({ page }) => {
    // Mock delete API to fail
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to delete skill directory'
          })
        })
      }
    })

    // Open sidebar and delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

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

  test('112.003.002: should close dialog on API error', async ({ page }) => {
    // Mock delete API to return 404
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Skill not found'
          })
        })
      }
    })

    // Open sidebar and delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

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

  test('112.003.003: should keep skill in list if deletion fails', async ({ page }) => {
    // Mock delete API to fail
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
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

    // Open sidebar and delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for error response and dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // Wait for error toast and dismiss it (it has life: 0 so it's persistent)
    const errorToast = page.locator('.p-toast-message-error')
    await expect(errorToast).toBeVisible({ timeout: 2000 })
    // Click the toast close button to dismiss it
    await errorToast.locator('.p-toast-close-button').click()
    await expect(errorToast).not.toBeVisible({ timeout: 2000 })

    // Close the sidebar first (it's still open after error)
    const sidebar = page.locator('.p-drawer')
    await expect(sidebar).toBeVisible()

    // Click the close button to close the sidebar
    const closeButton = sidebar.locator('[aria-label="Close"]')
    await closeButton.click()
    await expect(sidebar).not.toBeVisible({ timeout: 2000 })

    // Now verify skill is still in the list (we can click View again)
    const viewButton = page.locator('.view-btn').first()
    await expect(viewButton).toBeVisible()

    // Verify we can open the sidebar again
    await viewButton.click()
    await expect(sidebar).toBeVisible()
  })
})
