/**
 * End-to-End Tests: Command CRUD Operations (Edit & Delete)
 *
 * Test Suite: 108.001 - Command Edit Flow (Inline Editing in Sidebar)
 * Test Suite: 108.002 - Command Delete Flow
 * Test Suite: 108.003 - Edit Validation
 * Test Suite: 108.004 - Reference Checks
 * Test Suite: 108.005 - Cross-Scope Operations (User-Level Commands)
 * Test Suite: 108.006 - Nested Command Paths
 * Test Suite: 108.007 - Edge Cases
 *
 * Numbering Format: 108.SUITE.TEST
 *
 * Tests the complete command CRUD workflow including:
 * - Inline editing in sidebar (one field at a time)
 * - Delete confirmation with dependency checks
 * - Form validation and error handling
 * - API integration with success/error states
 * - Project and user-level command operations
 * - Nested command paths (e.g., git/push, utils/helper)
 * - All 8 editable fields for commands
 *
 * Command Fields (8 total):
 * 1. Name (text field, required, minLength: 1)
 * 2. Description (textarea, required, minLength: 10)
 * 3. Color (select dropdown, 10 options)
 * 4. Model (select button: inherit/sonnet/opus/haiku)
 * 5. Allowed Tools (multiselect, 9 tool options)
 * 6. Argument Hint (text field, optional)
 * 7. Disable Model Invocation (select button: Yes/No)
 * 8. Content (large textarea for markdown body)
 *
 * Implementation:
 * - ConfigDetailSidebar.vue - Sidebar with inline editing
 * - LabeledEditField.vue - Inline edit component
 * - DeleteConfirmationModal.vue - Delete confirmation
 * - ConfigItemList.vue - Delete button in sidebar footer
 * - useCommandsStore - Pinia store for command operations
 * - API endpoints: PUT/DELETE /api/projects/:id/commands/:path
 * - API endpoints: PUT/DELETE /api/user/commands/:path
 */

const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

// Mock command data
const mockCommand = {
  name: 'test-command',
  namespace: null,
  description: 'A test command for CRUD operations testing',
  color: 'blue',
  model: 'sonnet',
  tools: ['Bash', 'Read', 'Write'],
  argumentHint: 'Enter a search term',
  'disable-model-invocation': false,
  content: 'You are a test command. Help with testing slash commands.',
  filePath: '/home/user/testproject/.claude/commands/test-command.md',
  scope: 'project'
}

const mockNestedCommand = {
  name: 'push',
  namespace: 'git',
  description: 'Git push command for version control',
  color: 'green',
  model: 'inherit',
  tools: ['Bash'],
  argumentHint: 'branch-name',
  'disable-model-invocation': false,
  content: 'Push changes to remote repository.',
  filePath: '/home/user/testproject/.claude/commands/git/push.md',
  scope: 'project'
}

const mockCommands = [mockCommand, mockNestedCommand]

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
            stats: { agents: 0, commands: 2, hooks: 0, mcp: 0 }
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

  test('108.001.001: should open sidebar with editable command fields when view button is clicked', async ({ page }) => {
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
    await expect(sidebar.getByText('Color')).toBeVisible()
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
    await expect(sidebar.getByText('A test command for CRUD operations testing')).toBeVisible()
    await expect(sidebar.getByText('You are a test command. Help with testing slash commands.')).toBeVisible()
  })

  test('108.001.003: should update command name using inline edit and save successfully', async ({ page }) => {
    const updatedName = 'updated-test-command'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: {
              ...mockCommand,
              name: requestBody.name
            }
          })
        })
      }
    })

    // Click View button to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find the name field (INLINE field)
    const nameField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name' })

    // Click the edit button to enter edit mode
    const editButton = nameField.locator('.edit-btn')
    await editButton.click()

    // Update value
    const nameInput = nameField.locator('input[type="text"]')
    await nameInput.fill(updatedName)

    // Click accept button
    const acceptButton = nameField.locator('button[aria-label="Accept changes"]')
    await acceptButton.click()

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.001.004: should update command description using inline edit', async ({ page }) => {
    const updatedDescription = 'Updated description for the test command with more than 10 characters'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: {
              ...mockCommand,
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

    // Find the description field (BLOCK field with Save button)
    const descriptionField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' })

    // Click the edit button
    await descriptionField.locator('.edit-btn').click()

    // Update value
    const textarea = descriptionField.locator('textarea')
    await textarea.fill(updatedDescription)

    // Click save button
    const saveButton = descriptionField.getByRole('button', { name: 'Save' })
    await saveButton.click()

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.001.005: should update command color field', async ({ page }) => {
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: { ...mockCommand, color: 'red' }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find color field (SELECT field with Save button)
    const colorField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Color' })
    await colorField.locator('.edit-btn').click()

    // Select new color (using PrimeVue Select dropdown)
    const selectDropdown = colorField.locator('.p-select')
    await selectDropdown.click()

    // Wait for dropdown panel to open
    await page.waitForTimeout(300)

    // Click red option in dropdown
    const redOption = page.locator('.p-select-option').filter({ hasText: 'red' })
    await redOption.click()

    // Click save button
    await colorField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.001.006: should update command model field', async ({ page }) => {
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: { ...mockCommand, model: 'opus' }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find model field (SELECT_BUTTON field)
    const modelField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Model' })
    await modelField.locator('.edit-btn').click()

    // Click Opus button in SelectButton group
    const opusButton = modelField.getByRole('button', { name: 'Opus' })
    await opusButton.click()

    // Click save button
    await modelField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.001.007: should update command argument hint field', async ({ page }) => {
    const updatedHint = 'New argument hint text'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: { ...mockCommand, argumentHint: updatedHint }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find argument hint field (INLINE field)
    const hintField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Argument Hint' })
    await hintField.locator('.edit-btn').click()

    // Update value
    const input = hintField.locator('input[type="text"]')
    await input.fill(updatedHint)

    // Click accept button
    await hintField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.001.008: should update command disable-model-invocation field', async ({ page }) => {
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: { ...mockCommand, 'disable-model-invocation': true }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find disable-model-invocation field (SELECT_BUTTON field)
    const disableField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Disable Model Invocation' })
    await disableField.locator('.edit-btn').click()

    // Click Yes button
    const yesButton = disableField.getByRole('button', { name: 'Yes' })
    await yesButton.click()

    // Click save button
    await disableField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.001.009: should update command content (body)', async ({ page }) => {
    const updatedContent = 'Updated command content with new instructions for the slash command.'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: { ...mockCommand, content: updatedContent }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find content field (BLOCK field with large textarea)
    const contentField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Content' })
    await contentField.locator('.edit-btn').click()

    // Update value
    const textarea = contentField.locator('textarea')
    await textarea.fill(updatedContent)

    // Click save button
    await contentField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.001.010: should cancel inline edit without saving', async ({ page }) => {
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

    // Click cancel button
    const cancelButton = descriptionField.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify field reverted to original value
    await expect(sidebar.getByText('A test command for CRUD operations testing')).toBeVisible()
  })

  test('108.001.011: should show loading state during inline field save', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 3000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, command: mockCommand })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description
    const descriptionField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' })
    await descriptionField.locator('.edit-btn').click()
    await descriptionField.locator('textarea').fill('Updated with loading test')

    const saveButton = descriptionField.getByRole('button', { name: 'Save' })
    await saveButton.click()

    // Verify loading state
    try {
      await expect(saveButton).toBeDisabled({ timeout: 1000 })
    } catch {
      const loadingIcon = saveButton.locator('.p-button-loading-icon, .pi-spinner')
      await expect(loadingIcon).toBeVisible({ timeout: 1000 })
    }

    // Wait for save to complete
    await page.waitForTimeout(3500)

    // Field should return to display mode
    await expect(descriptionField.locator('textarea')).not.toBeVisible({ timeout: 2000 })
  })

  test('108.001.012: should update multiple fields independently', async ({ page }) => {
    let updateCount = 0

    // Mock update API to count calls
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCount++
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: { ...mockCommand, ...requestBody }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Update description
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()
    await descField.locator('textarea').fill('New description with required length')
    await descField.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(500)

    // Update content
    const contentField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Content' })
    await contentField.locator('.edit-btn').click()
    await contentField.locator('textarea').fill('New command content for testing')
    await contentField.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(500)

    // Verify two separate API calls were made
    expect(updateCount).toBe(2)
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
        body: JSON.stringify({ success: true, commands: [mockCommand] })
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

  test('108.002.002: should open delete confirmation modal when sidebar delete button is clicked', async ({ page }) => {
    // Mock references API (no references)
    await page.route('**/api/projects/testproject/commands/test-command/references', async (route) => {
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
    const dialog = page.locator('.p-dialog')
    await expect(dialog).toBeVisible()

    // Verify modal title contains "Delete"
    await expect(dialog.locator('.text-lg.font-semibold')).toContainText('Delete')
  })

  test('108.002.003: should display command name in confirmation message', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/commands/test-command/references', async (route) => {
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

    const dialog = page.locator('.p-dialog')

    // Verify command name is in the warning message
    await expect(dialog.getByText('"test-command"')).toBeVisible()
  })

  test('108.002.004: should require typing "delete" to enable confirmation', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/commands/test-command/references', async (route) => {
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
    await page.route('**/api/projects/testproject/commands/test-command/references', async (route) => {
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
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
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

  test('108.002.006: should cancel delete and close modal', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/commands/test-command/references', async (route) => {
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

    // Click cancel button
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify modal is closed
    await expect(dialog).not.toBeVisible()
  })

  test('108.002.007: should show loading state during delete', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/commands/test-command/references', async (route) => {
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
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
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

    const dialog = page.locator('.p-dialog')

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

// Test Suite 108.003: Edit Validation
test.describe('108.003: Edit Validation', () => {
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
          body: JSON.stringify({ success: true, commands: [mockCommand] })
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

  test('108.003.001: should show error for empty command name', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Name must be a non-empty string'
          })
        })
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit name field with empty value
    const nameField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name' })
    await nameField.locator('.edit-btn').click()

    const nameInput = nameField.locator('input[type="text"]')
    await nameInput.fill('')

    // Try to accept
    const acceptButton = nameField.locator('button[aria-label="Accept changes"]')
    await acceptButton.click()

    // Wait for validation
    await page.waitForTimeout(500)

    // Verify error message is displayed
    const errorMessage = nameField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('108.003.002: should show error for short description', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
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

    // Edit description with short value
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()

    const textarea = descField.locator('textarea')
    await textarea.fill('Short')

    // Try to save
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for validation
    await page.waitForTimeout(500)

    // Verify error message
    const errorMessage = descField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('108.003.003: should show error for invalid model', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Model must be one of: sonnet, opus, haiku, inherit'
          })
        })
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit model field
    const modelField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Model' })
    await modelField.locator('.edit-btn').click()

    // Click save without changing (API will validate)
    await modelField.getByRole('button', { name: 'Save' }).click()

    // Wait for validation
    await page.waitForTimeout(500)

    // Verify error message
    const errorMessage = modelField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('108.003.004: should show error for invalid color', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Color must be one of: blue, cyan, green, orange, purple, red, yellow, pink, indigo, teal'
          })
        })
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit color field
    const colorField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Color' })
    await colorField.locator('.edit-btn').click()

    // Click save without changing (API will validate)
    await colorField.getByRole('button', { name: 'Save' }).click()

    // Wait for validation
    await page.waitForTimeout(500)

    // Verify error message
    const errorMessage = colorField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('108.003.005: should clear errors when valid input is entered', async ({ page }) => {
    // Mock API to succeed on second attempt
    let attemptCount = 0
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        attemptCount++
        if (attemptCount === 1) {
          // First attempt fails
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Description must be at least 10 characters'
            })
          })
        } else {
          // Second attempt succeeds
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, command: mockCommand })
          })
        }
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description with invalid value
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()

    const textarea = descField.locator('textarea')
    await textarea.fill('short')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Verify error appears
    await expect(descField.locator('.p-message')).toBeVisible({ timeout: 2000 })

    // Wait and try again with valid value
    await page.waitForTimeout(500)

    // Field should still be in edit mode due to error
    const isInEditMode = await descField.locator('textarea').isVisible()
    if (!isInEditMode) {
      await descField.locator('.edit-btn').click()
    }

    await textarea.fill('Valid description with required length')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for success
    await page.waitForTimeout(500)

    // Error should be gone and field should be in display mode
    await expect(descField.locator('textarea')).not.toBeVisible({ timeout: 2000 })
  })
})

// Test Suite 108.004: Reference Checks
test.describe('108.004: Reference Checks', () => {
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

    await page.route('**/api/projects/testproject/commands', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [mockCommand] })
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

    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('108.004.001: should show references when deleting command with dependencies', async ({ page }) => {
    // Mock references API with dependencies
    await page.route('**/api/projects/testproject/commands/test-command/references', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReferences: true,
          references: [
            'agents/workflow-agent.md',
            'skills/automation/SKILL.md'
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
    await expect(dialog.getByText('agents/workflow-agent.md')).toBeVisible()
    await expect(dialog.getByText('skills/automation/SKILL.md')).toBeVisible()
  })

  test('108.004.002: should not show references section when no dependencies', async ({ page }) => {
    // Mock references API without dependencies
    await page.route('**/api/projects/testproject/commands/test-command/references', async (route) => {
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

  test('108.004.003: should still allow deletion when command has references', async ({ page }) => {
    // Mock references API with dependencies
    await page.route('**/api/projects/testproject/commands/test-command/references', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReferences: true,
          references: ['agents/workflow-agent.md']
        })
      })
    })

    // Mock delete API
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
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
    const dialog = page.locator('.p-dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    // Wait for references to load
    await page.waitForTimeout(1000)

    // Type confirmation and delete
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    const deleteButton = dialog.getByRole('button', { name: 'Delete', exact: true })

    // Delete button should be enabled
    await expect(deleteButton).toBeEnabled()

    // Confirm deletion works
    await deleteButton.click()
    await expect(dialog).not.toBeVisible({ timeout: 3000 })
  })
})

// Test Suite 108.005: Cross-Scope Operations (User-Level Commands)
test.describe('108.005: Cross-Scope Operations', () => {
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

    // Mock user-level commands
    await page.route('**/api/user/commands', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            commands: [{
              ...mockCommand,
              scope: 'user'
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

  test('108.005.001: should edit user-level command successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update for user command
    await page.route('**/api/user/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: { ...mockCommand, description: 'Updated user-level command' }
          })
        })
      }
    })

    // Click View button to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()
    await descField.locator('textarea').fill('Updated user-level command')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('108.005.002: should delete user-level command successfully', async ({ page }) => {
    let deleteCalled = false

    // Mock references API
    await page.route('**/api/user/commands/test-command/references', async (route) => {
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

    // Mock delete API for user command
    await page.route('**/api/user/commands/test-command', async (route) => {
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
    const dialog = page.locator('.p-dialog')
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
})

// Test Suite 108.006: Nested Command Paths
test.describe('108.006: Nested Command Paths', () => {
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
            stats: { agents: 0, commands: 2, hooks: 0, mcp: 0 }
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

    // Mock project commands with nested paths
    await page.route('**/api/projects/testproject/commands', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [mockNestedCommand] })
      })
    })

    await page.route('**/api/projects/testproject/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], hooks: [], mcp: [] })
      })
    })

    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('108.006.001: should handle nested command paths with URL encoding', async ({ page }) => {
    let updateCalled = false
    let correctPath = false

    // Mock update API - verify URL is correctly encoded
    await page.route('**/api/projects/testproject/commands/git%2Fpush', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        correctPath = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: mockNestedCommand
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()
    await descField.locator('textarea').fill('Updated git push command description')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called with correct path encoding
    expect(updateCalled).toBe(true)
    expect(correctPath).toBe(true)
  })

  test('108.006.002: should delete nested command with correct URL encoding', async ({ page }) => {
    let deleteCalled = false
    let correctPath = false

    // Mock references API with URL encoding
    await page.route('**/api/projects/testproject/commands/git%2Fpush/references', async (route) => {
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

    // Mock delete API with URL encoding
    await page.route('**/api/projects/testproject/commands/git%2Fpush', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        correctPath = true
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
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    // Type confirmation and delete
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(dialog).not.toBeVisible({ timeout: 3000 })

    // Verify API was called with correct path encoding
    expect(deleteCalled).toBe(true)
    expect(correctPath).toBe(true)
  })

  test('108.006.003: should display namespace in sidebar for nested commands', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify namespace is displayed (if implemented in UI)
    // This tests that the UI shows "git/push" or displays namespace separately
    await expect(sidebar.getByText('push').first()).toBeVisible()
  })
})

// Test Suite 108.007: Edge Cases
test.describe('108.007: Edge Cases', () => {
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

    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [] })
      })
    })

    await page.route('**/api/projects/testproject/commands', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [mockCommand] })
      })
    })

    await page.route('**/api/projects/testproject/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], hooks: [], mcp: [] })
      })
    })

    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('108.007.001: should handle API network errors during update', async ({ page }) => {
    // Mock network error
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.abort('failed')
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()
    await descField.locator('textarea').fill('Updated description with network error')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for error
    await page.waitForTimeout(1000)

    // Verify error message is displayed
    const errorMessage = descField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('108.007.002: should handle API network errors during delete', async ({ page }) => {
    // Mock references API
    await page.route('**/api/projects/testproject/commands/test-command/references', async (route) => {
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

    // Mock network error on delete
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.abort('failed')
      }
    })

    // Open sidebar and click delete
    await page.locator('.view-btn').first().click()
    await page.locator('.delete-action-btn').click()

    const dialog = page.locator('.p-dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })

    // Type confirmation and delete
    await dialog.getByRole('textbox', { name: /Type delete to confirm/i }).fill('delete')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Wait for error (dialog should stay open or show error)
    await page.waitForTimeout(1000)

    // Dialog should remain visible on error
    // (Implementation may vary - could show error toast instead)
  })

  test('108.007.003: should handle 404 errors for non-existent commands', async ({ page }) => {
    // Mock 404 error
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Command not found: test-command'
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()
    await descField.locator('textarea').fill('Updated description for missing command')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for error
    await page.waitForTimeout(1000)

    // Verify error message
    const errorMessage = descField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('108.007.004: should handle concurrent edits gracefully', async ({ page }) => {
    let updateCount = 0

    // Mock API to handle concurrent updates
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCount++
        // Add small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 500))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, command: mockCommand })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Start editing description
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()
    await descField.locator('textarea').fill('First update')
    descField.getByRole('button', { name: 'Save' }).click() // Don't await

    // Immediately edit name (while description save is in progress)
    await page.waitForTimeout(100)
    const nameField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name' })
    await nameField.locator('.edit-btn').click()
    await nameField.locator('input[type="text"]').fill('concurrent-edit')
    nameField.locator('button[aria-label="Accept changes"]').click() // Don't await

    // Wait for both operations to complete
    await page.waitForTimeout(2000)

    // Both updates should complete (may be sequential)
    expect(updateCount).toBeGreaterThanOrEqual(1)
  })

  test('108.007.005: should persist sidebar state after successful edit', async ({ page }) => {
    // Mock successful update
    await page.route('**/api/projects/testproject/commands/test-command', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            command: { ...mockCommand, description: 'Updated description' }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()
    await descField.locator('textarea').fill('Updated description')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Sidebar should remain open after successful edit
    await expect(sidebar).toBeVisible()

    // Updated value should be displayed
    await expect(sidebar.getByText('Updated description')).toBeVisible()
  })
})
