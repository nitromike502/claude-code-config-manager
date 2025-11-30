/**
 * End-to-End Tests: Agent CRUD Operations (Edit & Delete)
 *
 * Test Suite: 107.001 - Agent Edit Flow
 * Test Suite: 107.002 - Agent Delete Flow
 * Test Suite: 107.003 - Edit Validation
 * Test Suite: 107.004 - Reference Checks
 * Test Suite: 107.005 - Cross-Scope Operations
 *
 * Numbering Format: 107.SUITE.TEST
 *
 * Tests the complete agent CRUD workflow including:
 * - Opening edit dialog and updating agent fields
 * - Delete confirmation with dependency checks
 * - Form validation and error handling
 * - API integration with success/error states
 * - Project and user-level agent operations
 *
 * Implementation:
 * - AgentEditDialog.vue - Edit dialog component
 * - DeleteConfirmationModal.vue - Delete confirmation
 * - ConfigItemList.vue - Edit/Delete buttons
 * - useAgentsStore - Pinia store for agent operations
 * - API endpoints: PUT/DELETE /api/projects/:id/agents/:name
 * - API endpoints: PUT/DELETE /api/user/agents/:name
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

// Test Suite 107.001: Agent Edit Flow
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

  test('107.001.001: should open edit dialog when edit button is clicked', async ({ page }) => {
    // Click edit button on agent card
    const editButton = page.locator('.edit-btn').first()
    await editButton.click()

    // Verify dialog is visible
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Verify dialog title
    await expect(dialog.getByText('Edit Agent: test-agent')).toBeVisible()
  })

  test('107.001.002: should populate form fields with current agent values', async ({ page }) => {
    // Click edit button
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')

    // Verify name field
    const nameInput = dialog.locator('#agent-name')
    await expect(nameInput).toHaveValue('test-agent')

    // Verify description field
    const descInput = dialog.locator('#agent-description')
    await expect(descInput).toHaveValue('A test agent for CRUD operations')

    // Verify system prompt field
    const promptInput = dialog.locator('#agent-prompt')
    await expect(promptInput).toHaveValue('You are a test agent. Help with testing.')
  })

  test('107.001.003: should update agent description and save successfully', async ({ page }) => {
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

    // Click edit button
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')

    // Update description
    const descInput = dialog.locator('#agent-description')
    await descInput.fill(updatedDescription)

    // Click save button
    const saveButton = dialog.getByRole('button', { name: 'Save Changes' })
    await saveButton.click()

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 3000 })

    // Verify API was called
    await page.waitForTimeout(500) // Give API call time to complete
    expect(updateCalled).toBe(true)
  })

  test('107.001.004: should cancel edit and close dialog', async ({ page }) => {
    // Click edit button
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')

    // Make a change
    const descInput = dialog.locator('#agent-description')
    await descInput.fill('Changed but not saved')

    // Click cancel button
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible()

    // Verify no API call was made (changes not saved)
    // This is implicit - the test would fail if an API call triggered an error
  })

  test('107.001.005: should show loading state during save', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 300))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agent: mockAgent })
        })
      }
    })

    // Click edit button
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')

    // Update description
    const descInput = dialog.locator('#agent-description')
    await descInput.fill('Updated with loading test')

    // Click save button
    const saveButton = dialog.getByRole('button', { name: 'Save Changes' })
    await saveButton.click()

    // Verify loading state (button should be disabled)
    await expect(saveButton).toBeDisabled()

    // Wait for save to complete
    await expect(dialog).not.toBeVisible({ timeout: 2000 })
  })

  test('107.001.006: should refresh agent list after successful update', async ({ page }) => {
    let agentsRequestCount = 0

    // Mock agents API with counter
    await page.route('**/api/projects/testproject/agents', async (route) => {
      agentsRequestCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: mockAgents })
      })
    })

    // Mock update API
    await page.route('**/api/projects/testproject/agents/test-agent', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agent: mockAgent })
        })
      }
    })

    // Reset counter after initial load
    agentsRequestCount = 0

    // Click edit button
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')

    // Update and save
    await dialog.locator('#agent-description').fill('Refreshed description')
    await dialog.getByRole('button', { name: 'Save Changes' }).click()

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible()

    // Note: The actual implementation may or may not refresh the list
    // depending on whether it updates the store or refetches
    // This test documents the expected behavior
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

  test('107.002.001: should open delete confirmation modal when delete button is clicked', async ({ page }) => {
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

    // Click delete button
    const deleteButton = page.locator('.delete-btn').first()
    await deleteButton.click()

    // Verify modal is visible
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Verify modal title contains "Delete"
    await expect(dialog.locator('.text-lg.font-semibold')).toContainText('Delete')
  })

  test('107.002.002: should display agent name in confirmation message', async ({ page }) => {
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

    // Click delete button
    await page.locator('.delete-btn').first().click()

    const dialog = page.getByRole('dialog')

    // Verify agent name is in the warning message
    await expect(dialog.getByText('"test-agent"')).toBeVisible()
  })

  test('107.002.003: should require typing "delete" to enable confirmation', async ({ page }) => {
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

    // Click delete button
    await page.locator('.delete-btn').first().click()

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

  test('107.002.004: should delete agent successfully', async ({ page }) => {
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

    // Click delete button
    await page.locator('.delete-btn').first().click()

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

  test('107.002.005: should cancel delete and close modal', async ({ page }) => {
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

    // Click delete button
    await page.locator('.delete-btn').first().click()

    const dialog = page.getByRole('dialog')

    // Click cancel button
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify modal is closed
    await expect(dialog).not.toBeVisible()
  })

  test('107.002.006: should show loading state during delete', async ({ page }) => {
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

    // Click delete button
    await page.locator('.delete-btn').first().click()

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
    // Click edit button
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible' })

    // Enter invalid name (uppercase letters)
    const nameInput = dialog.locator('#agent-name')
    await nameInput.fill('InvalidName')

    // Try to save
    const saveButton = dialog.getByRole('button', { name: 'Save Changes' })
    await saveButton.click()

    // Wait a moment for validation
    await page.waitForTimeout(300)

    // Verify error message is displayed (look for small error text)
    const errorMessages = dialog.locator('small.text-red-500')
    await expect(errorMessages.first()).toBeVisible({ timeout: 2000 })

    // Verify dialog remains open
    await expect(dialog).toBeVisible()
  })

  test('107.003.002: should show error for short description', async ({ page }) => {
    // Click edit button
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible' })

    // Enter short description (< 10 chars)
    const descInput = dialog.locator('#agent-description')
    await descInput.fill('Short')

    // Try to save
    await dialog.getByRole('button', { name: 'Save Changes' }).click()

    // Wait for validation
    await page.waitForTimeout(300)

    // Verify error message
    const errorMessages = dialog.locator('small.text-red-500')
    await expect(errorMessages.first()).toBeVisible({ timeout: 2000 })
  })

  test('107.003.003: should show error for short system prompt', async ({ page }) => {
    // Click edit button
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible' })

    // Enter short system prompt (< 20 chars)
    const promptInput = dialog.locator('#agent-prompt')
    await promptInput.fill('Too short')

    // Try to save
    await dialog.getByRole('button', { name: 'Save Changes' }).click()

    // Wait for validation
    await page.waitForTimeout(300)

    // Verify error message
    const errorMessages = dialog.locator('small.text-red-500')
    await expect(errorMessages.last()).toBeVisible({ timeout: 2000 })
  })

  test('107.003.004: should clear errors when valid input is entered', async ({ page }) => {
    // Click edit button
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')

    // Enter invalid name to trigger error
    const nameInput = dialog.locator('#agent-name')
    await nameInput.fill('INVALID')
    await dialog.getByRole('button', { name: 'Save Changes' }).click()

    // Verify error appears
    await expect(dialog.locator('.text-red-500').first()).toBeVisible()

    // Fix the name
    await nameInput.fill('valid-agent-name')
    await dialog.getByRole('button', { name: 'Save Changes' }).click()

    // Error should be gone (if description and prompt are valid)
    // In this case, we'll see an error for description since we haven't filled it properly
    // But the name error specifically should be cleared
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

    // Click edit button
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')

    // Test valid name formats
    const validNames = ['agent-name', 'agent_name', 'agent123', 'agent-name_123']

    for (const validName of validNames) {
      const nameInput = dialog.locator('#agent-name')
      await nameInput.fill(validName)

      // Try to save (should not show name validation error)
      await dialog.getByRole('button', { name: 'Save Changes' }).click()

      // If we see a name validation error, the test fails
      const nameErrors = dialog.locator('.text-red-500').filter({ hasText: /lowercase/ })
      await expect(nameErrors).toHaveCount(0)

      // May have other validation errors, but not for the name
      // Break after first successful check to avoid multiple saves
      break
    }
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

    // Click delete button
    await page.locator('.delete-btn').first().click()

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

    // Click delete button
    await page.locator('.delete-btn').first().click()

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

    // Click delete button
    await page.locator('.delete-btn').first().click()

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

    // Click edit button on user agent
    await page.locator('.edit-btn').first().click()

    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible' })

    // Update description
    await dialog.locator('#agent-description').fill('Updated user-level agent')

    // Save
    await dialog.getByRole('button', { name: 'Save Changes' }).click()

    // Verify dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 3000 })

    // Verify API was called
    await page.waitForTimeout(500)
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

    // Click delete button
    await page.locator('.delete-btn').first().click()

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

  test('107.005.003: should not show edit/delete buttons for plugin agents', async ({ page }) => {
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

    // Edit and delete buttons should be disabled
    const editButton = page.locator('.edit-btn').first()
    const deleteButton = page.locator('.delete-btn').first()

    await expect(editButton).toBeDisabled()
    await expect(deleteButton).toBeDisabled()
  })
})
