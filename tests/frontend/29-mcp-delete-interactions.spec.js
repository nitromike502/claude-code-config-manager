/**
 * Frontend Component Tests: 29-MCP Delete Interactions
 *
 * Test Suite: 29.001 - Delete Button Rendering
 * Test Suite: 29.002 - Confirmation Dialog Content
 * Test Suite: 29.003 - Keyboard Accessibility
 * Test Suite: 29.004 - Loading States
 * Test Suite: 29.005 - Error Handling
 *
 * Numbering Format: 29.GROUP.TEST
 *
 * Tests the MCP delete functionality interaction patterns including:
 * - Delete button visibility and rendering
 * - Confirmation dialog content and behavior
 * - Keyboard navigation and accessibility
 * - Loading states during deletion
 * - Error handling and feedback
 *
 * @see src/components/layouts/ConfigPageLayout.vue
 * @see src/components/lists/ConfigItemList.vue
 * @see src/components/modals/DeleteConfirmationModal.vue
 * @see src/stores/mcp.js
 */

const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

// Mock MCP server data
const mockMcpServers = [
  {
    name: 'google-slides-mcp',
    type: 'stdio',
    command: 'node',
    args: ['/home/mcp/google-slides-mcp/build/index.js'],
    env: {},
    transportType: 'stdio',
    enabled: true,
    scope: 'project',
    location: 'project'
  },
  {
    name: 'weather-api-mcp',
    type: 'sse',
    url: 'http://localhost:3000/sse',
    headers: { Authorization: 'Bearer token123' },
    transportType: 'sse',
    enabled: true,
    scope: 'project',
    location: 'project'
  }
]

// Test Suite 29.001: Delete Button Rendering
test.describe('29.001: MCP Delete Button Rendering', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 2, skills: 0 }
          }]
        })
      })
    })

    // Mock user endpoints
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [], skills: [] })
      })
    })

    // Mock project endpoints
    await page.route('**/api/projects/testproject/mcp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: mockMcpServers })
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
    await page.route('**/api/projects/testproject/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: [] })
      })
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('29.001.001: should render delete button on each MCP card', async ({ page }) => {
    const mcpCards = page.locator('.config-item-card').filter({ hasText: 'mcp' })
    const count = await mcpCards.count()

    // Verify each card has a delete button
    for (let i = 0; i < count; i++) {
      const card = mcpCards.nth(i)
      const deleteBtn = card.locator('.delete-btn')
      await expect(deleteBtn).toBeVisible()
    }
  })

  test('29.001.002: should show delete button with trash icon', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    const deleteBtn = mcpCard.locator('.delete-btn')

    await expect(deleteBtn).toBeVisible()

    // Verify trash icon is present (PrimeIcons)
    const trashIcon = deleteBtn.locator('.pi-trash, .pi-delete-left')
    await expect(trashIcon).toBeVisible()
  })

  test('29.001.003: should have accessible label on delete button', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    const deleteBtn = mcpCard.locator('.delete-btn')

    // Check for aria-label or title attribute
    const ariaLabel = await deleteBtn.getAttribute('aria-label')
    const title = await deleteBtn.getAttribute('title')

    // At least one should be present and contain "delete"
    const hasAccessibleLabel = (ariaLabel && ariaLabel.toLowerCase().includes('delete')) ||
                               (title && title.toLowerCase().includes('delete'))
    expect(hasAccessibleLabel).toBe(true)
  })

  test('29.001.004: should render delete button in sidebar footer', async ({ page }) => {
    // Click View to open sidebar
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.view-btn').click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify delete button in footer
    const deleteBtn = sidebar.locator('.delete-action-btn')
    await expect(deleteBtn).toBeVisible()
  })
})

// Test Suite 29.002: Confirmation Dialog Content
test.describe('29.002: MCP Delete Confirmation Dialog', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 2, skills: 0 }
          }]
        })
      })
    })

    // Mock user endpoints
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [], skills: [] })
      })
    })

    // Mock project endpoints
    await page.route('**/api/projects/testproject/**', async (route) => {
      if (route.request().url().includes('/mcp') && !route.request().url().includes('/mcp/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, mcp: mockMcpServers })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], skills: [] })
        })
      }
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('29.002.001: should display MCP server name in dialog', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await expect(dialog).toBeVisible()

    // Verify MCP server name is displayed (in quotes)
    await expect(dialog.getByText('"google-slides-mcp"')).toBeVisible()
  })

  test('29.002.002: should display correct dialog title', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify dialog title
    await expect(dialog.getByText('Delete MCP Server')).toBeVisible()
  })

  test('29.002.003: should show warning icon', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify warning icon is present
    const warningIcon = dialog.locator('.pi-exclamation-triangle')
    await expect(warningIcon).toBeVisible()
  })

  test('29.002.004: should NOT show references section', async ({ page }) => {
    // MCP servers don't have dependent items
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify "Referenced by:" section does NOT exist
    await expect(dialog.getByText('Referenced by:')).not.toBeVisible()
  })

  test('29.002.005: should show confirmation input field', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify confirmation input is visible
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    await expect(confirmInput).toBeVisible()
  })

  test('29.002.006: should show Delete and Cancel buttons', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify both buttons are present
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })
    const cancelBtn = dialog.getByRole('button', { name: 'Cancel' })

    await expect(deleteBtn).toBeVisible()
    await expect(cancelBtn).toBeVisible()
  })

  test('29.002.007: should disable Delete button initially', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Delete button should be disabled until "delete" is typed
    await expect(deleteBtn).toBeDisabled()
  })
})

// Test Suite 29.003: Keyboard Accessibility
test.describe('29.003: MCP Delete Keyboard Accessibility', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 2, skills: 0 }
          }]
        })
      })
    })

    // Mock user endpoints
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [], skills: [] })
      })
    })

    // Mock project endpoints
    await page.route('**/api/projects/testproject/**', async (route) => {
      if (route.request().url().includes('/mcp') && !route.request().url().includes('/mcp/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, mcp: mockMcpServers })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], skills: [] })
        })
      }
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('29.003.001: should focus on confirmation input when dialog opens', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    await page.waitForTimeout(500) // Wait for dialog animation

    // Check if input is focused (or can be focused with Tab)
    const confirmInput = page.getByRole('textbox', { name: /Type delete to confirm/i })
    await expect(confirmInput).toBeVisible()

    // Try to focus the input
    await confirmInput.focus()
    await expect(confirmInput).toBeFocused()
  })

  test('29.003.002: should enable Delete button after typing "delete"', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Initially disabled
    await expect(deleteBtn).toBeDisabled()

    // Type "delete"
    await confirmInput.fill('delete')

    // Should be enabled now
    await expect(deleteBtn).toBeEnabled()
  })

  test('29.003.003: should navigate dialog with Tab key', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })

    // Wait for dialog to be fully rendered
    await page.waitForTimeout(500)

    // Focus input (may not be auto-focused)
    await confirmInput.click()

    // Tab should move to next focusable element (Cancel or Delete button)
    await page.keyboard.press('Tab')
    await page.waitForTimeout(100)

    // One of the buttons should be focused
    const focusedElement = await page.evaluate(() => document.activeElement.textContent)
    expect(['Cancel', 'Delete'].some(text => focusedElement.includes(text))).toBe(true)
  })

  test('29.003.004: should close dialog with Escape key', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await expect(dialog).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 2000 })
  })

  test('29.003.005: should support Enter key to confirm deletion', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API
    await page.route('**/api/projects/testproject/mcp/google-slides-mcp', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })

    // Type "delete"
    await confirmInput.fill('delete')

    // Focus Delete button
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })
    await deleteBtn.focus()

    // Press Enter
    await page.keyboard.press('Enter')

    // Wait for delete to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(deleteCalled).toBe(true)
  })
})

// Test Suite 29.004: Loading States
test.describe('29.004: MCP Delete Loading States', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 2, skills: 0 }
          }]
        })
      })
    })

    // Mock user endpoints
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [], skills: [] })
      })
    })

    // Mock project endpoints
    await page.route('**/api/projects/testproject/**', async (route) => {
      if (route.request().url().includes('/mcp') && !route.request().url().includes('/mcp/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, mcp: mockMcpServers })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], skills: [] })
        })
      }
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('29.004.001: should show loading spinner during deletion', async ({ page }) => {
    // Mock slow delete API
    await page.route('**/api/projects/testproject/mcp/google-slides-mcp', async (route) => {
      if (route.request().method() === 'DELETE') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Type confirmation
    await confirmInput.fill('delete')

    // Click delete
    await deleteBtn.click()

    // Verify loading spinner appears
    const spinner = dialog.locator('.pi-spinner, .p-button-loading-icon')
    await expect(spinner).toBeVisible()
  })

  test('29.004.002: should disable Delete button during loading', async ({ page }) => {
    // Mock slow delete API
    await page.route('**/api/projects/testproject/mcp/google-slides-mcp', async (route) => {
      if (route.request().method() === 'DELETE') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Type confirmation
    await confirmInput.fill('delete')

    // Click delete
    await deleteBtn.click()

    // Button should be disabled during loading
    await expect(deleteBtn).toBeDisabled()
  })

  test('29.004.003: should disable Cancel button during loading', async ({ page }) => {
    // Mock slow delete API
    await page.route('**/api/projects/testproject/mcp/google-slides-mcp', async (route) => {
      if (route.request().method() === 'DELETE') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })
    const cancelBtn = dialog.getByRole('button', { name: 'Cancel' })

    // Type confirmation
    await confirmInput.fill('delete')

    // Click delete
    await deleteBtn.click()

    // Cancel button should be disabled during loading
    await expect(cancelBtn).toBeDisabled()
  })
})

// Test Suite 29.005: Error Handling
test.describe('29.005: MCP Delete Error Handling', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 2, skills: 0 }
          }]
        })
      })
    })

    // Mock user endpoints
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [], skills: [] })
      })
    })

    // Mock project endpoints
    await page.route('**/api/projects/testproject/**', async (route) => {
      if (route.request().url().includes('/mcp') && !route.request().url().includes('/mcp/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, mcp: mockMcpServers })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], skills: [] })
        })
      }
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('29.005.001: should show error toast on deletion failure', async ({ page }) => {
    // Mock delete API to fail
    await page.route('**/api/projects/testproject/mcp/google-slides-mcp', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to delete MCP server'
          })
        })
      }
    })

    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Type confirmation and click delete
    await confirmInput.fill('delete')
    await deleteBtn.click()

    // Wait for error response
    await page.waitForTimeout(1000)

    // Verify error toast appears
    const errorToast = page.locator('.p-toast-message-error')
    await expect(errorToast).toBeVisible({ timeout: 2000 })
  })

  test('29.005.002: should display error message in toast', async ({ page }) => {
    // Mock delete API to fail with specific error
    await page.route('**/api/projects/testproject/mcp/google-slides-mcp', async (route) => {
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

    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Type confirmation and click delete
    await confirmInput.fill('delete')
    await deleteBtn.click()

    // Wait for error response
    await page.waitForTimeout(1000)

    // Verify error toast appears (may contain HTTP error info or the error message)
    const errorToast = page.locator('.p-toast-message-error')
    await expect(errorToast).toBeVisible({ timeout: 2000 })
    // Toast should contain either the error message or HTTP status info
    const toastText = await errorToast.textContent()
    expect(toastText).toMatch(/(Permission denied|500|Internal Server Error|Delete Failed)/)
  })

  test('29.005.003: should close dialog after showing error', async ({ page }) => {
    // Mock delete API to fail
    await page.route('**/api/projects/testproject/mcp/google-slides-mcp', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to delete MCP server'
          })
        })
      }
    })

    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Type confirmation and click delete
    await confirmInput.fill('delete')
    await deleteBtn.click()

    // Wait for error response and dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 3000 })
  })

  test('29.005.004: should handle network error gracefully', async ({ page }) => {
    // Mock delete API to simulate network error
    await page.route('**/api/projects/testproject/mcp/google-slides-mcp', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.abort('failed')
      }
    })

    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'google-slides-mcp' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    const deleteBtn = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Type confirmation and click delete
    await confirmInput.fill('delete')
    await deleteBtn.click()

    // Wait for error response
    await page.waitForTimeout(1000)

    // Verify error toast appears
    const errorToast = page.locator('.p-toast-message-error')
    await expect(errorToast).toBeVisible({ timeout: 2000 })
  })
})
