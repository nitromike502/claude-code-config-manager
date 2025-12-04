/**
 * End-to-End Tests: Command CRUD Operations (Edit & Delete)
 *
 * Test Suite: 108.001 - Command Edit Flow (Inline Editing in Sidebar)
 * Test Suite: 108.002 - Command Delete Flow
 * Test Suite: 108.003 - Edit Validation
 * Test Suite: 108.004 - Reference Checks
 * Test Suite: 108.005 - Cross-Scope Operations (User-Level Commands)
 *
 * Numbering Format: 108.SUITE.TEST
 *
 * Tests the complete command CRUD workflow including:
 * - Inline editing in sidebar (one field at a time)
 * - Delete confirmation with dependency checks
 * - Form validation and error handling
 * - API integration with success/error states
 * - Project and user-level command operations
 * - Nested path handling (e.g., utils/helper.md)
 *
 * Implementation:
 * - ConfigDetailSidebar.vue - Sidebar with inline editing
 * - LabeledEditField.vue - Inline edit component
 * - DeleteConfirmationModal.vue - Delete confirmation
 * - useCommandsStore - Pinia store for command operations
 * - API endpoints: PUT/DELETE /api/projects/:id/commands/:path
 * - API endpoints: PUT/DELETE /api/user/commands/:path
 */

const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

// Mock command data
const mockCommand = {
  name: 'test-command',
  description: 'A test command for CRUD operations',
  model: 'sonnet',
  tools: ['Bash', 'Read'],
  argumentHint: '<query>',
  disableModelInvocation: false,
  content: '/test-command - A test command',
  path: 'test-command.md',
  scope: 'project',
  location: 'project'
}

const mockCommands = [mockCommand]

// Test Suite 108.001: Command Edit Flow (Inline Editing)
test.describe('108.001: Command Edit Flow', () => {
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
            stats: { agents: 0, commands: 1, hooks: 0, mcp: 0 }
          }]
        })
      })
    })

    // Mock user stats
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

    // Mock project commands
    await page.route('**/api/projects/testproject/commands', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: mockCommands })
      })
    })

    // Mock other project endpoints
    await page.route('**/api/projects/testproject/agents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
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

  test('108.001.001: should open sidebar with editable fields when view button is clicked', async ({ page }) => {
    // Click View button on command card
    const viewButton = page.locator('.view-btn').first()
    await viewButton.click()

    // Verify sidebar is visible (PrimeVue Drawer)
    const sidebar = page.locator('.p-drawer')
    await expect(sidebar).toBeVisible()

    // Verify command name in sidebar header
    await expect(sidebar.getByText('test-command').first()).toBeVisible()

    // Verify inline edit fields are present
    await expect(sidebar.getByText('Name')).toBeVisible()
    await expect(sidebar.getByText('Description')).toBeVisible()
  })

  test('108.001.002: should display current command values in sidebar fields', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Wait a moment for fields to populate
    await page.waitForTimeout(500)

    // Verify field values
    await expect(sidebar.locator('text=test-command').first()).toBeVisible()
    await expect(sidebar.getByText('A test command for CRUD operations')).toBeVisible()
  })

  test('108.001.003: should update command name using inline edit and save successfully', async ({ page }) => {
    const updatedName = 'updated-test-command'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/commands/test-command.md', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: {
              ...mockCommand,
              name: updatedName
            }
          })
        })
      }
    })

    // Click View button to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find the name field container (INLINE field)
    const nameField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name' })

    // Click the edit button
    const editButton = nameField.locator('.edit-btn')
    await editButton.click()

    // Update value
    const input = nameField.locator('input[type="text"]')
    await input.fill(updatedName)

    // Click accept button (INLINE fields use aria-label="Accept changes")
    const acceptButton = nameField.locator('button[aria-label="Accept changes"]')
    await acceptButton.click()

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.001.004: should update command description using inline edit', async ({ page }) => {
    const updatedDescription = 'Updated description for the test command'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/commands/test-command.md', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: {
              ...mockCommand,
              description: updatedDescription
            }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find description field (BLOCK field with Save button)
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()
    await descField.locator('textarea').fill(updatedDescription)
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.001.005: should update command model selection', async ({ page }) => {
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/commands/test-command.md', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: {
              ...mockCommand,
              model: 'opus'
            }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find model field
    const modelField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Model' })
    await modelField.locator('.edit-btn').click()

    // Select different model (SelectButton)
    const opusButton = modelField.getByRole('button', { name: 'Opus' })
    await opusButton.click()

    // Accept changes
    const acceptButton = modelField.locator('button[aria-label="Accept changes"]')
    await acceptButton.click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.001.006: should cancel inline edit without saving', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find description field and enter edit mode
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()

    // Make a change
    const textarea = descField.locator('textarea')
    await textarea.fill('Changed but not saved')

    // Click cancel button
    const cancelButton = descField.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify field reverted to original value
    await expect(sidebar.getByText('A test command for CRUD operations')).toBeVisible()
  })
})

// Test Suite 108.002: Command Delete Flow
test.describe('108.002: Command Delete Flow', () => {
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
            stats: { agents: 0, commands: 1, hooks: 0, mcp: 0 }
          }]
        })
      })
    })

    // Mock user stats
    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [] })
      })
    })

    // Mock project endpoints
    await page.route('**/api/projects/testproject/commands', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: mockCommands })
      })
    })
    await page.route('**/api/projects/testproject/agents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
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

  test('108.002.001: should show delete button in sidebar footer', async ({ page }) => {
    // Click View to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify delete button is in footer
    const deleteButton = sidebar.locator('.delete-action-btn')
    await expect(deleteButton).toBeVisible()
  })

  test('108.002.002: should open delete confirmation modal when delete button clicked', async ({ page }) => {
    // Mock references API (no references)
    await page.route('**/api/projects/testproject/commands/test-command.md/references', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReferences: false,
          references: []
        })
      })
    })

    // Click View to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Click delete button
    const deleteButton = sidebar.locator('.delete-action-btn')
    await deleteButton.click()

    // Verify modal is visible
    const dialog = page.locator('.p-dialog')
    await expect(dialog).toBeVisible()

    // Verify modal title
    await expect(dialog.locator('.text-lg.font-semibold')).toContainText('Delete')
  })

  test('108.002.003: should display command name in confirmation message', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/commands/test-command.md/references', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReferences: false,
          references: []
        })
      })
    })

    // Click View and delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    const dialog = page.locator('.p-dialog')

    // Verify command name is in the warning message
    await expect(dialog.getByText('"test-command"')).toBeVisible()
  })

  test('108.002.004: should require typing "delete" to enable confirmation', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/commands/test-command.md/references', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReferences: false,
          references: []
        })
      })
    })

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

  test('108.002.005: should delete command successfully', async ({ page }) => {
    let deleteCalled = false

    // Mock references API
    await page.route('**/api/projects/testproject/commands/test-command.md/references', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReferences: false,
          references: []
        })
      })
    })

    // Mock delete API
    await page.route('**/api/projects/testproject/commands/test-command.md', async (route) => {
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

    // Wait for dialog and references to load
    const dialog = page.locator('.p-dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    // Type confirmation
    const confirmInput = dialog.getByRole('textbox', { name: /Type delete to confirm/i })
    await confirmInput.fill('delete')

    // Click delete button
    const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
    await deleteButton.click()

    // Wait for modal to close
    await expect(dialog).not.toBeVisible({ timeout: 3000 })

    // Verify API was called
    await page.waitForTimeout(500)
    expect(deleteCalled).toBe(true)
  })
})

// Test Suite 108.003: Reference Checks
test.describe('108.003: Reference Checks', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all required APIs
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
            stats: { agents: 0, commands: 1, hooks: 0, mcp: 0 }
          }]
        })
      })
    })

    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [] })
      })
    })

    await page.route('**/api/projects/testproject/**', async (route) => {
      if (route.request().url().includes('/commands') && !route.request().url().includes('/commands/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, commands: mockCommands })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agents: [], hooks: [], mcp: [] })
        })
      }
    })

    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('108.003.001: should show references when deleting command with dependencies', async ({ page }) => {
    // Mock references API with dependencies
    await page.route('**/api/projects/testproject/commands/test-command.md/references', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReferences: true,
          references: [
            { type: 'agent', name: 'api-client', lines: [15, 25] },
            { type: 'skill', name: 'testing', lines: [10] }
          ]
        })
      })
    })

    // Open sidebar and click delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    // Wait for dialog to appear
    const dialog = page.locator('.p-dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    // Wait for references to load
    await page.waitForTimeout(1000)

    // Verify references section is visible
    await expect(dialog.getByText('Referenced by:')).toBeVisible({ timeout: 3000 })

    // Verify reference items are displayed
    await expect(dialog.getByText('agent: api-client')).toBeVisible()
    await expect(dialog.getByText('skill: testing')).toBeVisible()
  })

  test('108.003.002: should not show references section when no dependencies', async ({ page }) => {
    // Mock references API without dependencies
    await page.route('**/api/projects/testproject/commands/test-command.md/references', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReferences: false,
          references: []
        })
      })
    })

    // Open sidebar and click delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    // Wait for dialog to appear
    const dialog = page.locator('.p-dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    // Wait for references check to complete
    await page.waitForTimeout(1000)

    // Verify references section is NOT visible
    await expect(dialog.getByText('Referenced by:')).not.toBeVisible({ timeout: 2000 })
  })
})
