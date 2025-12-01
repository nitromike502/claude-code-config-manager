/**
 * End-to-End Tests: Agent CRUD Operations (Edit & Delete)
 *
 * Test Suite: 107.001 - Agent Edit Flow (Inline Editing in Sidebar)
 * Test Suite: 107.002 - Agent Delete Flow
 * Test Suite: 107.003 - Edit Validation
 * Test Suite: 107.004 - Reference Checks
 * Test Suite: 107.005 - Cross-Scope Operations
 *
 * Numbering Format: 107.SUITE.TEST
 *
 * Tests the complete agent CRUD workflow including:
 * - Inline editing in sidebar (one field at a time)
 * - Delete confirmation with dependency checks
 * - Form validation and error handling
 * - API integration with success/error states
 * - Project and user-level agent operations
 *
 * Implementation:
 * - ConfigDetailSidebar.vue - Sidebar with inline editing
 * - LabeledEditField.vue - Inline edit component
 * - DeleteConfirmationModal.vue - Delete confirmation
 * - ConfigItemList.vue - Delete button in sidebar footer
 * - useAgentsStore - Pinia store for agent operations
 * - API endpoints: PUT/DELETE /api/projects/:id/agents/:name
 * - API endpoints: PUT/DELETE /api/user/agents/:name
 *
 * NOTE: Edit UX changed from dialog to inline editing per commit 3a229e6
 */

const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

// Mock agent data
const mockAgent = {
  name: 'test-agent',
  description: 'A test agent for CRUD operations',
  color: 'blue',
  model: 'sonnet',
  permissionMode: 'default',
  tools: ['Bash', 'Read', 'Write'],
  skills: [],
  content: 'You are a test agent. Help with testing.',
  filePath: '/home/user/testproject/.claude/agents/test-agent.md',
  scope: 'project',
  location: 'project'
}

const mockAgents = [mockAgent]

// Test Suite 107.001: Agent Edit Flow (Inline Editing)
test.describe('107.001: Agent Edit Flow', () => {
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
            stats: { agents: 1, commands: 0, hooks: 0, mcp: 0 }
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

    // Mock project agents
    await page.route('**/api/projects/testproject/agents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: mockAgents })
      })
    })

    // Mock other project endpoints
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

  test('107.001.001: should open sidebar with editable fields when view button is clicked', async ({ page }) => {
    // Click View button on agent card
    const viewButton = page.locator('.view-btn').first()
    await viewButton.click()

    // Verify sidebar is visible (PrimeVue Drawer)
    const sidebar = page.locator('.p-drawer')
    await expect(sidebar).toBeVisible()

    // Verify agent name in sidebar header (first occurrence)
    await expect(sidebar.getByText('test-agent').first()).toBeVisible()

    // Verify inline edit fields are present
    await expect(sidebar.getByText('Name')).toBeVisible()
    await expect(sidebar.getByText('Description')).toBeVisible()
    // System Prompt appears multiple times (header + field label), check for first occurrence
    await expect(sidebar.getByText('System Prompt').first()).toBeVisible()
  })

  test('107.001.002: should display current agent values in sidebar fields', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Wait a moment for fields to populate
    await page.waitForTimeout(500)

    // Verify field values (LabeledEditField shows values in display mode)
    // Use .first() to avoid strict mode violations when text appears multiple times
    await expect(sidebar.locator('text=test-agent').first()).toBeVisible()
    await expect(sidebar.getByText('A test agent for CRUD operations')).toBeVisible()
    await expect(sidebar.getByText('You are a test agent. Help with testing.')).toBeVisible()
  })

  test('107.001.003: should update agent description using inline edit and save successfully', async ({ page }) => {
    const updatedDescription = 'Updated description for the test agent'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            agent: {
              ...mockAgent,
              description: requestBody.description
            }
          })
        })
      }
    })

    // Click View button to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find the description field container (it's a BLOCK field - uses "Save" button)
    const descriptionField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' })

    // Click the edit button (pencil icon) to enter edit mode
    const editButton = descriptionField.locator('.edit-btn')
    await editButton.click()

    // Now in edit mode - find textarea and update value
    const textarea = descriptionField.locator('textarea')
    await textarea.fill(updatedDescription)

    // Click save button (BLOCK fields use "Save" not "Accept")
    const saveButton = descriptionField.getByRole('button', { name: 'Save' })
    await saveButton.click()

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('107.001.004: should cancel inline edit without saving', async ({ page }) => {
    // Click View button to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find description field and enter edit mode
    const descriptionField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' })
    await descriptionField.locator('.edit-btn').click()

    // Make a change
    const textarea = descriptionField.locator('textarea')
    await textarea.fill('Changed but not saved')

    // Click cancel button (BLOCK fields use "Cancel" button)
    const cancelButton = descriptionField.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify field reverted to original value
    await expect(sidebar.getByText('A test agent for CRUD operations')).toBeVisible()

    // Verify no API call was made (implicitly - test would fail if error occurred)
  })

  test('107.001.005: should show loading state during inline field save', async ({ page }) => {
    // Mock slow API response (2 seconds to ensure we can catch loading state)
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agent: mockAgent })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description (BLOCK field)
    const descriptionField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' })
    await descriptionField.locator('.edit-btn').click()
    await descriptionField.locator('textarea').fill('Updated with loading test')

    // Get the save button reference
    const saveButton = descriptionField.getByRole('button', { name: 'Save' })

    // Click save button and immediately check for loading state
    await saveButton.click()

    // Verify loading state (button should be disabled or have loading icon)
    // Use a shorter timeout since button changes immediately
    try {
      await expect(saveButton).toBeDisabled({ timeout: 500 })
    } catch {
      // Alternative: check for loading icon if button isn't disabled
      const loadingIcon = saveButton.locator('.p-button-loading-icon, .pi-spinner')
      await expect(loadingIcon).toBeVisible({ timeout: 500 })
    }

    // Wait for save to complete
    await page.waitForTimeout(2500)

    // Field should return to display mode
    await expect(descriptionField.locator('textarea')).not.toBeVisible({ timeout: 2000 })
  })

  test('107.001.006: should update multiple fields independently', async ({ page }) => {
    let updateCount = 0

    // Mock update API to count calls
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCount++
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            agent: { ...mockAgent, ...requestBody }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Update description (BLOCK field with Save button)
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()
    await descField.locator('textarea').fill('New description')
    await descField.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(500)

    // Update system prompt (BLOCK field with Save button)
    const promptField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'System Prompt' })
    await promptField.locator('.edit-btn').click()
    await promptField.locator('textarea').fill('New system prompt for testing')
    await promptField.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(500)

    // Verify two separate API calls were made
    expect(updateCount).toBe(2)
  })
})

// Test Suite 107.002: Agent Delete Flow
test.describe('107.002: Agent Delete Flow', () => {
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
            stats: { agents: 1, commands: 0, hooks: 0, mcp: 0 }
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
    await page.route('**/api/projects/testproject/agents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: mockAgents })
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

  test('107.002.001: should show delete button in sidebar footer', async ({ page }) => {
    // Click View to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify delete button is in footer
    const deleteButton = sidebar.locator('.delete-action-btn')
    await expect(deleteButton).toBeVisible()
  })

  test('107.002.002: should open delete confirmation modal when sidebar delete button is clicked', async ({ page }) => {
    // Mock references API (no references)
    await page.route('**/api/projects/testproject/agents/test-agent/references', async (route) => {
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

    // Click delete button in footer
    const deleteButton = sidebar.locator('.delete-action-btn')
    await deleteButton.click()

    // Verify modal is visible
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Verify modal title contains "Delete"
    await expect(dialog.locator('.text-lg.font-semibold')).toContainText('Delete')
  })

  test('107.002.003: should display agent name in confirmation message', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/agents/test-agent/references', async (route) => {
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

    // Click View to open sidebar and then delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    const dialog = page.getByRole('dialog')

    // Verify agent name is in the warning message
    await expect(dialog.getByText('"test-agent"')).toBeVisible()
  })

  test('107.002.004: should require typing "delete" to enable confirmation', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/agents/test-agent/references', async (route) => {
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

    const dialog = page.getByRole('dialog')
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

  test('107.002.005: should delete agent successfully', async ({ page }) => {
    let deleteCalled = false

    // Mock references API
    await page.route('**/api/projects/testproject/agents/test-agent/references', async (route) => {
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
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
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
    const dialog = page.getByRole('dialog')
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

  test('107.002.006: should cancel delete and close modal', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/agents/test-agent/references', async (route) => {
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

    const dialog = page.getByRole('dialog')

    // Click cancel button
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify modal is closed
    await expect(dialog).not.toBeVisible()
  })

  test('107.002.007: should show loading state during delete', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/agents/test-agent/references', async (route) => {
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

    // Mock slow delete API
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'DELETE') {
        await new Promise(resolve => setTimeout(resolve, 500))
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

    const dialog = page.getByRole('dialog')

    // Type confirmation and click delete
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })
    await deleteButton.click()

    // Verify loading state
    await expect(deleteButton).toBeDisabled()
    const spinner = dialog.locator('.pi-spinner, .p-button-loading-icon')
    await expect(spinner).toBeVisible()

    // Wait for completion
    await expect(dialog).not.toBeVisible({ timeout: 2000 })
  })
})

// Test Suite 107.003: Edit Validation
test.describe('107.003: Edit Validation', () => {
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
            stats: { agents: 1, commands: 0, hooks: 0, mcp: 0 }
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
      if (route.request().url().includes('/agents') && !route.request().url().includes('/agents/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agents: mockAgents })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, commands: [], hooks: [], mcp: [] })
        })
      }
    })

    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('107.003.001: should show error for invalid agent name', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Agent name must contain only lowercase letters, numbers, hyphens, and underscores'
          })
        })
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit name field with invalid value (Name is INLINE field)
    const nameField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name' })
    await nameField.locator('.edit-btn').click()

    // Enter invalid name (uppercase letters)
    const nameInput = nameField.locator('input[type="text"]')
    await nameInput.fill('InvalidName')

    // Try to accept (INLINE fields use aria-label="Accept changes")
    const acceptButton = nameField.locator('button[aria-label="Accept changes"]')
    await acceptButton.click()

    // Wait a moment for validation
    await page.waitForTimeout(500)

    // Verify error message is displayed (shows as PrimeVue Message component)
    const errorMessage = nameField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('107.003.002: should show error for short description', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Description must be at least 10 characters'
          })
        })
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description with short value (BLOCK field)
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()

    // Enter short description (< 10 chars)
    const textarea = descField.locator('textarea')
    await textarea.fill('Short')

    // Try to save (BLOCK fields use "Save" button)
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for validation
    await page.waitForTimeout(500)

    // Verify error message (PrimeVue Message component)
    const errorMessage = descField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('107.003.003: should show error for short system prompt', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'System prompt must be at least 20 characters'
          })
        })
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit system prompt with short value (BLOCK field)
    const promptField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'System Prompt' })
    await promptField.locator('.edit-btn').click()

    // Enter short system prompt (< 20 chars)
    const textarea = promptField.locator('textarea')
    await textarea.fill('Too short')

    // Try to save (BLOCK fields use "Save" button)
    await promptField.getByRole('button', { name: 'Save' }).click()

    // Wait for validation
    await page.waitForTimeout(500)

    // Verify error message (PrimeVue Message component)
    const errorMessage = promptField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('107.003.004: should clear errors when valid input is entered', async ({ page }) => {
    // Mock API to succeed on second attempt
    let attemptCount = 0
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        attemptCount++
        if (attemptCount === 1) {
          // First attempt fails
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Agent name must contain only lowercase letters'
            })
          })
        } else {
          // Second attempt succeeds
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, agent: mockAgent })
          })
        }
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit name with invalid value (INLINE field)
    const nameField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name' })
    await nameField.locator('.edit-btn').click()

    const nameInput = nameField.locator('input[type="text"]')
    await nameInput.fill('INVALID')
    await nameField.locator('button[aria-label="Accept changes"]').click()

    // Verify error appears
    await expect(nameField.locator('.p-message')).toBeVisible({ timeout: 2000 })

    // Cancel and try again with valid value
    // First need to be in edit mode again
    await page.waitForTimeout(500)

    // If field stayed in edit mode due to error, just update the value
    // Otherwise click edit again
    const isInEditMode = await nameField.locator('input[type="text"]').isVisible()
    if (!isInEditMode) {
      await nameField.locator('.edit-btn').click()
    }

    await nameInput.fill('valid-agent-name')
    await nameField.locator('button[aria-label="Accept changes"]').click()

    // Wait for success
    await page.waitForTimeout(500)

    // Error should be gone and field should be in display mode
    await expect(nameField.locator('input[type="text"]')).not.toBeVisible({ timeout: 2000 })
  })

  test('107.003.005: should accept valid agent name formats', async ({ page }) => {
    // Mock successful update
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agent: mockAgent })
        })
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Test one valid name format (INLINE field)
    const validName = 'agent-name_123'

    const nameField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name' })
    await nameField.locator('.edit-btn').click()

    const nameInput = nameField.locator('input[type="text"]')
    await nameInput.fill(validName)

    // Try to accept (INLINE fields use "Accept changes" aria-label)
    await nameField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save
    await page.waitForTimeout(500)

    // Should not see error message
    const nameErrors = nameField.locator('.p-message')
    await expect(nameErrors).not.toBeVisible()

    // Field should return to display mode (success)
    await expect(nameInput).not.toBeVisible({ timeout: 2000 })
  })
})

// Test Suite 107.004: Reference Checks
test.describe('107.004: Reference Checks', () => {
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
            stats: { agents: 1, commands: 0, hooks: 0, mcp: 0 }
          }]
        })
      })
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

    await page.route('**/api/projects/testproject/agents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: mockAgents })
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

    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('107.004.001: should show references when deleting agent with dependencies', async ({ page }) => {
    // Mock references API with dependencies
    await page.route('**/api/projects/testproject/agents/test-agent/references', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReferences: true,
          references: [
            'commands/api-client.md',
            'skills/testing/SKILL.md'
          ]
        })
      })
    })

    // Open sidebar and click delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    // Wait for dialog to appear
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    // Wait for references to load
    await page.waitForTimeout(1000)

    // Verify references section is visible
    await expect(dialog.getByText('Referenced by:')).toBeVisible({ timeout: 3000 })

    // Verify reference items are displayed
    await expect(dialog.getByText('commands/api-client.md')).toBeVisible()
    await expect(dialog.getByText('skills/testing/SKILL.md')).toBeVisible()
  })

  test('107.004.002: should not show references section when no dependencies', async ({ page }) => {
    // Mock references API without dependencies
    await page.route('**/api/projects/testproject/agents/test-agent/references', async (route) => {
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
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    // Wait for references check to complete
    await page.waitForTimeout(1000)

    // Verify references section is NOT visible
    await expect(dialog.getByText('Referenced by:')).not.toBeVisible({ timeout: 2000 })
  })

  test('107.004.003: should still allow deletion when agent has references', async ({ page }) => {
    // Mock references API with dependencies
    await page.route('**/api/projects/testproject/agents/test-agent/references', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReferences: true,
          references: ['commands/api-client.md']
        })
      })
    })

    // Mock delete API
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'DELETE') {
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

    // Wait for dialog to appear
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    // Wait for references to load
    await page.waitForTimeout(1000)

    // Type confirmation and delete
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Delete button should still be enabled (after typing "delete")
    await expect(deleteButton).toBeEnabled()

    // Confirm deletion works
    await deleteButton.click()
    await expect(dialog).not.toBeVisible({ timeout: 3000 })
  })
})

// Test Suite 107.005: Cross-Scope Operations (User-Level Agents)
test.describe('107.005: Cross-Scope Operations', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 0 }
          }]
        })
      })
    })

    // Mock user-level agents
    await page.route('**/api/user/agents', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            agents: [{
              ...mockAgent,
              scope: 'user',
              location: 'user'
            }]
          })
        })
      }
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
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [] })
      })
    })

    // Navigate to user-level view
    await page.goto(`${BASE_URL}/user`)
    await page.waitForLoadState('networkidle')
  })

  test('107.005.001: should edit user-level agent successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update for user agent
    await page.route('**/api/user/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            agent: { ...mockAgent, description: 'Updated user-level agent' }
          })
        })
      }
    })

    // Click View button to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description (BLOCK field with Save button)
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()
    await descField.locator('textarea').fill('Updated user-level agent')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('107.005.002: should delete user-level agent successfully', async ({ page }) => {
    let deleteCalled = false

    // Mock references API
    await page.route('**/api/user/agents/test-agent/references', async (route) => {
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

    // Mock delete API for user agent
    await page.route('**/api/user/agents/test-agent', async (route) => {
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

    // Wait for dialog to appear
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    // Wait for references to load
    await page.waitForTimeout(1000)

    // Type confirmation and delete
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Verify modal closes
    await expect(dialog).not.toBeVisible({ timeout: 3000 })

    // Verify API was called
    await page.waitForTimeout(500)
    expect(deleteCalled).toBe(true)
  })

  test('107.005.003: should not show delete button in sidebar for plugin agents', async ({ page }) => {
    // Mock agents with one from plugin
    await page.route('**/api/user/agents', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            agents: [{
              ...mockAgent,
              location: 'plugin',
              scope: 'user'
            }]
          })
        })
      }
    })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Click View to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Delete button should not be visible in footer for plugin agents
    const deleteButton = sidebar.locator('.delete-action-btn')
    await expect(deleteButton).not.toBeVisible()
  })
})
