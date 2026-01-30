/**
 * End-to-End Tests: MCP Server Delete Operations
 *
 * Test Suite: 114.001 - MCP Delete Flow (Project-Level)
 * Test Suite: 114.002 - User-Level MCP Delete
 * Test Suite: 114.003 - Delete Error Handling
 * Test Suite: 114.004 - MCP Transport Type Variations
 *
 * Numbering Format: 114.SUITE.TEST
 *
 * Tests the complete MCP server delete workflow including:
 * - Delete button visibility on MCP cards
 * - Confirmation dialog with MCP server name
 * - Successful deletion with API integration
 * - Error handling and user feedback
 * - Project and user-level MCP deletion
 * - Different transport types (stdio, sse, websocket)
 *
 * Implementation:
 * - ConfigItemList.vue - MCP listing with delete button
 * - DeleteConfirmationModal.vue - Confirmation dialog
 * - useMcpStore - Pinia store for MCP operations
 * - API endpoints: DELETE /api/projects/:id/mcp/:serverName
 * - API endpoints: DELETE /api/user/mcp/:serverName
 *
 * MCP Server Identification:
 * MCP servers are identified by their server name (unique within project/user scope)
 *
 * NOTE: MCP servers do NOT have dependent items/references like agents/commands/skills
 */

const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

// Mock MCP server data - stdio transport
const mockStdioMcp = {
  name: 'test-mcp-stdio',
  type: 'stdio',
  command: 'node',
  args: ['/path/to/server.js'],
  env: { NODE_ENV: 'development' },
  transportType: 'stdio',
  enabled: true,
  scope: 'project',
  location: 'project'
}

// Mock MCP server data - SSE transport
const mockSseMcp = {
  name: 'test-mcp-sse',
  type: 'sse',
  url: 'http://localhost:3000/sse',
  headers: { Authorization: 'Bearer token123' },
  transportType: 'sse',
  enabled: true,
  scope: 'project',
  location: 'project'
}

// Mock MCP server data - WebSocket transport
const mockWebSocketMcp = {
  name: 'test-mcp-websocket',
  type: 'websocket',
  url: 'ws://localhost:3000/ws',
  transportType: 'websocket',
  enabled: true,
  scope: 'project',
  location: 'project'
}

const mockMcpServers = [mockStdioMcp, mockSseMcp, mockWebSocketMcp]

// Test Suite 114.001: MCP Delete Flow (Project-Level)
test.describe('114.001: MCP Delete Flow (Project-Level)', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 3, skills: 0 }
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

  test('114.001.001: should show delete button on MCP cards', async ({ page }) => {
    // Find an MCP card
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await expect(mcpCard).toBeVisible()

    // Verify delete button is visible
    const deleteButton = mcpCard.locator('.delete-btn')
    await expect(deleteButton).toBeVisible()
  })

  test('114.001.002: should open delete confirmation modal when delete button clicked', async ({ page }) => {
    // Click delete button on first MCP
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

    // Wait for modal to appear
    await page.waitForTimeout(300)

    // Verify modal is visible
    const dialog = page.locator('.p-dialog')
    await expect(dialog).toBeVisible()

    // Verify modal title contains "Delete MCP"
    await expect(dialog.getByText('Delete MCP Server')).toBeVisible()
  })

  test('114.001.003: should display MCP server name in confirmation message', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify MCP server name is in the warning message
    await expect(dialog.getByText('"test-mcp-stdio"')).toBeVisible()
  })

  test('114.001.004: should NOT display references section', async ({ page }) => {
    // MCP servers do not have dependent items
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify "Referenced by:" section does NOT exist
    await expect(dialog.getByText('Referenced by:')).not.toBeVisible()
  })

  test('114.001.005: should require typing "delete" to enable confirmation', async ({ page }) => {
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

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

  test('114.001.006: should delete MCP server successfully', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API
    await page.route('**/api/projects/testproject/mcp/test-mcp-stdio', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Click delete on stdio MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

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

  test('114.001.007: should show success toast after deletion', async ({ page }) => {
    // Mock delete API
    await page.route('**/api/projects/testproject/mcp/test-mcp-stdio', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Mock MCP list after deletion (stdio removed)
    await page.route('**/api/projects/testproject/mcp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [mockSseMcp, mockWebSocketMcp] })
      })
    })

    // Delete MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Verify success toast appears (PrimeVue Toast component)
    const toast = page.locator('.p-toast-message-success')
    await expect(toast).toBeVisible({ timeout: 3000 })
  })

  test('114.001.008: should cancel deletion when cancel button is clicked', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API (should not be called)
    await page.route('**/api/projects/testproject/mcp/**', async (route) => {
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
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')

    // Click cancel button
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible({ timeout: 2000 })

    // Verify delete was not called
    expect(deleteCalled).toBe(false)
  })

  test('114.001.009: should show loading state during deletion', async ({ page }) => {
    // Mock slow delete API (1 second to ensure we can catch loading state)
    await page.route('**/api/projects/testproject/mcp/test-mcp-stdio', async (route) => {
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
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

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

    // Wait for completion (longer timeout for slow deletion)
    await expect(dialog).not.toBeVisible({ timeout: 3000 })
  })

  test('114.001.010: should delete MCP from sidebar', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API
    await page.route('**/api/projects/testproject/mcp/test-mcp-stdio', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Click View to open sidebar
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.view-btn').click()

    // Wait for sidebar to appear
    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Click delete button in sidebar footer
    const deleteButton = sidebar.locator('.delete-action-btn')
    await deleteButton.click()

    // Confirm deletion
    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for delete to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(deleteCalled).toBe(true)

    // Verify sidebar is closed
    await expect(sidebar).not.toBeVisible({ timeout: 2000 })
  })
})

// Test Suite 114.002: User-Level MCP Delete
test.describe('114.002: User-Level MCP Delete', () => {
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

    // Mock user-level MCP servers
    await page.route('**/api/user/mcp', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            mcp: [
              { ...mockStdioMcp, scope: 'user', location: 'user' },
              { ...mockSseMcp, scope: 'user', location: 'user' }
            ]
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
    await page.route('**/api/user/hooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
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

  test('114.002.001: should show delete button for user-level MCP servers', async ({ page }) => {
    // Find a user MCP card
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await expect(mcpCard).toBeVisible()

    // Verify delete button is visible
    const deleteButton = mcpCard.locator('.delete-btn')
    await expect(deleteButton).toBeVisible()
  })

  test('114.002.002: should delete user-level MCP server successfully', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API for user MCP
    await page.route('**/api/user/mcp/test-mcp-stdio', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

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

  test('114.002.003: should show success toast for user MCP deletion', async ({ page }) => {
    // Mock delete API
    await page.route('**/api/user/mcp/test-mcp-stdio', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Verify success toast
    const toast = page.locator('.p-toast-message-success')
    await expect(toast).toBeVisible({ timeout: 2000 })
  })

  test('114.002.004: should delete user MCP from sidebar', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API
    await page.route('**/api/user/mcp/test-mcp-stdio', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Click View to open sidebar
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.view-btn').click()

    // Wait for sidebar to appear
    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Click delete button in sidebar footer
    const deleteButton = sidebar.locator('.delete-action-btn')
    await deleteButton.click()

    // Confirm deletion
    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for delete to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(deleteCalled).toBe(true)

    // Verify sidebar is closed
    await expect(sidebar).not.toBeVisible({ timeout: 2000 })
  })
})

// Test Suite 114.003: Delete Error Handling
test.describe('114.003: Delete Error Handling', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 1, skills: 0 }
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
      if (route.request().url().includes('/mcp') && !route.request().url().includes('/mcp/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, mcp: [mockStdioMcp] })
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

  test('114.003.001: should show error toast when deletion fails', async ({ page }) => {
    // Mock delete API to fail
    await page.route('**/api/projects/testproject/mcp/test-mcp-stdio', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to delete MCP server from .mcp.json'
          })
        })
      }
    })

    // Delete MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

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

  test('114.003.002: should close dialog on API error', async ({ page }) => {
    // Mock delete API to return 404
    await page.route('**/api/projects/testproject/mcp/test-mcp-stdio', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'MCP server not found'
          })
        })
      }
    })

    // Delete MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

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

  test('114.003.003: should keep MCP in list if deletion fails', async ({ page }) => {
    // Mock delete API to fail
    await page.route('**/api/projects/testproject/mcp/test-mcp-stdio', async (route) => {
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

    // Delete MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

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

    // Verify MCP is still in the list
    const mcpCardAfter = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await expect(mcpCardAfter).toBeVisible()

    // Verify delete button is still present
    await expect(mcpCardAfter.locator('.delete-btn')).toBeVisible()
  })

  test('114.003.004: should handle network error gracefully', async ({ page }) => {
    // Mock delete API to simulate network error
    await page.route('**/api/projects/testproject/mcp/test-mcp-stdio', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.abort('failed')
      }
    })

    // Delete MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for error response
    await page.waitForTimeout(1000)

    // Verify error toast appears
    const errorToast = page.locator('.p-toast-message-error')
    await expect(errorToast).toBeVisible({ timeout: 2000 })
  })
})

// Test Suite 114.004: MCP Transport Type Variations
test.describe('114.004: MCP Transport Type Variations', () => {
  test.beforeEach(async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [{
            id: 'testproject2',
            name: 'Test Project 2',
            path: '/home/user/testproject2',
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 3, skills: 0 }
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
    await page.route('**/api/projects/testproject2/mcp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: mockMcpServers })
      })
    })
    await page.route('**/api/projects/testproject2/agents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      })
    })
    await page.route('**/api/projects/testproject2/commands', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      })
    })
    await page.route('**/api/projects/testproject2/hooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      })
    })
    await page.route('**/api/projects/testproject2/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: [] })
      })
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject2`)
    await page.waitForLoadState('networkidle')
  })

  test('114.004.001: should delete stdio MCP server', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API
    await page.route('**/api/projects/testproject2/mcp/test-mcp-stdio', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete stdio MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-stdio' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    await page.waitForTimeout(1000)
    expect(deleteCalled).toBe(true)
  })

  test('114.004.002: should delete SSE MCP server', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API
    await page.route('**/api/projects/testproject2/mcp/test-mcp-sse', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete SSE MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-sse' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    await page.waitForTimeout(1000)
    expect(deleteCalled).toBe(true)
  })

  test('114.004.003: should delete WebSocket MCP server', async ({ page }) => {
    let deleteCalled = false

    // Mock delete API
    await page.route('**/api/projects/testproject2/mcp/test-mcp-websocket', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Delete WebSocket MCP server
    const mcpCard = page.locator('.config-item-card').filter({ hasText: 'test-mcp-websocket' }).first()
    await mcpCard.locator('.delete-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    await page.waitForTimeout(1000)
    expect(deleteCalled).toBe(true)
  })

  test('114.004.004: should handle multiple MCP servers of different types', async ({ page }) => {
    // Verify all three MCP servers are displayed
    const mcpCards = page.locator('.config-item-card').filter({ hasText: 'test-mcp' })
    await expect(mcpCards).toHaveCount(3)

    // Each should have a delete button
    for (let i = 0; i < 3; i++) {
      const card = mcpCards.nth(i)
      await expect(card.locator('.delete-btn')).toBeVisible()
    }
  })
})
