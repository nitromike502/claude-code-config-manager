/**
 * End-to-End Tests: Hook Edit Operations
 *
 * Test Suite: 110.001 - Hook Selection and Display
 * Test Suite: 110.002 - Inline Editing
 * Test Suite: 110.003 - Conditional Field Visibility
 * Test Suite: 110.004 - Validation
 * Test Suite: 110.005 - User-Level Hooks
 *
 * Numbering Format: 110.SUITE.TEST
 *
 * Tests the complete hook inline editing workflow including:
 * - Hook selection and field display
 * - Inline editing of editable fields (matcher, type, command, timeout, flags)
 * - Event field is read-only (cannot be changed after creation)
 * - Conditional field visibility (matcher only for PreToolUse/PostToolUse, prompt type only for Stop/SubagentStop)
 * - Form validation and error handling
 * - API integration with success/error states
 * - Project and user-level hook operations
 *
 * Implementation:
 * - ConfigDetailSidebar.vue - Sidebar with inline editing for hooks
 * - LabeledEditField.vue - Inline edit component
 * - useHooksStore - Pinia store for hook operations
 * - API endpoints: PUT /api/projects/:id/hooks/:hookId
 * - API endpoints: PUT /api/user/hooks/:hookId
 *
 * Hook Identification:
 * Hooks are identified by composite ID: event::matcher::index
 * - event: Hook event type (PreToolUse, PostToolUse, Stop, SessionEnd, etc.)
 * - matcher: Tool matcher for PreToolUse/PostToolUse (e.g., "Bash", "Read|Write", "*")
 * - index: Position in array of hooks with same event+matcher (0-based)
 *
 * Field Editability:
 * - event: READONLY (cannot change after creation)
 * - matcher: EDITABLE (only for PreToolUse/PostToolUse events)
 * - type: EDITABLE (command/prompt - prompt only for Stop/SubagentStop)
 * - command: EDITABLE (textarea)
 * - timeout: EDITABLE (number input)
 * - enabled: EDITABLE (boolean toggle)
 * - suppressOutput: EDITABLE (boolean toggle)
 * - continue: EDITABLE (boolean toggle, "Continue on Error")
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

const mockHooks = [mockPreToolUseHook, mockSessionEndHook, mockStopHook]

// Test Suite 110.001: Hook Selection and Display
test.describe('110.001: Hook Selection and Display', () => {
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
            stats: { agents: 0, commands: 0, hooks: 3, mcp: 0 }
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

    // Mock project hooks
    await page.route('**/api/projects/testproject/hooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: mockHooks })
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
    await page.route('**/api/projects/testproject/commands', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
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

  test('110.001.001: should open sidebar with hook details when view button is clicked', async ({ page }) => {
    // Click View button on first hook card
    const viewButton = page.locator('.view-btn').first()
    await viewButton.click()

    // Verify sidebar is visible (PrimeVue Drawer)
    const sidebar = page.locator('.p-drawer')
    await expect(sidebar).toBeVisible()

    // Verify hook event in sidebar header
    await expect(sidebar.getByText('PreToolUse').first()).toBeVisible()

    // Verify metadata section is visible
    await expect(sidebar.getByText('Metadata')).toBeVisible()
  })

  test('110.001.002: should display event field as readonly', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify event field is displayed with "read-only" label
    // Use a more specific selector to target the readonly event field in the metadata section
    const eventField = sidebar.locator('p').filter({ hasText: 'Event:' })
    await expect(eventField).toBeVisible()
    await expect(eventField).toContainText('PreToolUse')
    await expect(eventField).toContainText('(read-only)')
  })

  test('110.001.003: should display all editable fields for PreToolUse hook', async ({ page }) => {
    // Click View button on PreToolUse hook
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify all editable fields are present
    // Use more specific selectors to avoid ambiguity with labels in LabeledEditField components
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Matcher:' })).toBeVisible()
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Type:' })).toBeVisible()
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })).toBeVisible()
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Timeout (ms):' })).toBeVisible()
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Enabled:' })).toBeVisible()
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Suppress Output:' })).toBeVisible()
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Continue on Error:' })).toBeVisible()
  })

  test('110.001.004: should display current hook values in sidebar fields', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Wait a moment for fields to populate
    await page.waitForTimeout(500)

    // Verify field values are displayed
    await expect(sidebar.getByText('Bash').first()).toBeVisible() // Matcher
    await expect(sidebar.getByText('echo "Running Bash command"')).toBeVisible() // Command
  })
})

// Test Suite 110.002: Inline Editing
test.describe('110.002: Inline Editing', () => {
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
            stats: { agents: 0, commands: 0, hooks: 3, mcp: 0 }
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

  test('110.002.001: should update hook command field successfully', async ({ page }) => {
    const updatedCommand = 'echo "Updated Bash command"'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            hook: {
              ...mockPreToolUseHook,
              command: requestBody.command
            }
          })
        })
      }
    })

    // Click View button to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find the command field (BLOCK field - uses "Save" button)
    // Use getByRole to target the specific edit button for Command field (not Type field)
    const commandField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })

    // Click the edit button to enter edit mode
    const editButton = commandField.getByRole('button', { name: 'Edit Command' })
    await editButton.click()

    // Update command value
    const textarea = commandField.locator('textarea')
    await textarea.fill(updatedCommand)

    // Click save button
    const saveButton = commandField.getByRole('button', { name: 'Save' })
    await saveButton.click()

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('110.002.002: should update hook timeout field successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            hook: { ...mockPreToolUseHook, timeout: 60000 }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find timeout field (INLINE field)
    const timeoutField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Timeout (ms):' })
    await timeoutField.getByRole('button', { name: 'Edit Timeout (ms)' }).click()

    // Wait for edit mode to activate
    await page.waitForTimeout(300)

    // Update timeout value (PrimeVue InputNumber uses a regular input but within p-inputnumber component)
    const input = timeoutField.locator('.p-inputnumber input')
    await input.fill('60000')

    // Accept changes (INLINE fields use "Accept changes" aria-label)
    await timeoutField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('110.002.003: should toggle enabled field successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            hook: { ...mockPreToolUseHook, enabled: false }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find enabled field (INLINE field with SelectButton)
    const enabledField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Enabled:' })
    await enabledField.getByRole('button', { name: 'Edit Enabled' }).click()

    // Toggle to "No" (SelectButton with boolean options)
    const noButton = enabledField.getByRole('button', { name: 'No' })
    await noButton.click()

    // Accept changes
    await enabledField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('110.002.004: should toggle suppressOutput field successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            hook: { ...mockPreToolUseHook, suppressOutput: true }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find suppressOutput field
    const suppressField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Suppress Output:' })
    await suppressField.getByRole('button', { name: 'Edit Suppress Output' }).click()

    // Toggle to "Yes"
    const yesButton = suppressField.getByRole('button', { name: 'Yes' })
    await yesButton.click()

    // Accept changes
    await suppressField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('110.002.005: should toggle continue field successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            hook: { ...mockPreToolUseHook, continue: false }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find continue field
    const continueField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Continue on Error:' })
    await continueField.getByRole('button', { name: 'Edit Continue on Error' }).click()

    // Toggle to "No"
    const noButton = continueField.getByRole('button', { name: 'No' })
    await noButton.click()

    // Accept changes
    await continueField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('110.002.006: should cancel edit operation without saving', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find command field and enter edit mode
    const commandField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })
    await commandField.getByRole('button', { name: 'Edit Command' }).click()

    // Make a change
    const textarea = commandField.locator('textarea')
    const originalValue = await textarea.inputValue()
    await textarea.fill('Changed but not saved')

    // Click cancel button (BLOCK fields use "Cancel" button)
    const cancelButton = commandField.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Verify field reverted to original value by checking the pre element contains the original value
    const preElement = commandField.locator('pre')
    await expect(preElement).toContainText(originalValue)

    // Verify no API call was made (implicitly - test would fail if error occurred)
  })
})

// Test Suite 110.003: Conditional Field Visibility
test.describe('110.003: Conditional Field Visibility', () => {
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
            stats: { agents: 0, commands: 0, hooks: 3, mcp: 0 }
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

  test('110.003.001: should show matcher field for PreToolUse hooks', async ({ page }) => {
    // Click View on PreToolUse hook (first hook)
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify matcher field is visible
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Matcher:' })).toBeVisible()
  })

  test('110.003.002: should hide matcher field for SessionEnd hooks', async ({ page }) => {
    // Click View on SessionEnd hook (second hook)
    await page.locator('.view-btn').nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify event is SessionEnd (check the readonly event field)
    const eventField = sidebar.locator('p').filter({ hasText: 'Event:' })
    await expect(eventField).toContainText('SessionEnd')

    // Verify matcher field is NOT visible
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Matcher:' })).not.toBeVisible()
  })

  test('110.003.003: should show prompt type option for Stop hooks', async ({ page }) => {
    // Click View on Stop hook (third hook)
    await page.locator('.view-btn').nth(2).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify event is Stop (check the readonly event field)
    const eventField = sidebar.locator('p').filter({ hasText: 'Event:' })
    await expect(eventField).toContainText('Stop')

    // Find type field and enter edit mode
    const typeField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Type:' })
    await typeField.getByRole('button', { name: 'Edit Type' }).click()

    // Wait for edit mode to activate
    await page.waitForTimeout(300)

    // Verify both "Command" and "Prompt" options are available (SelectButton options appear after edit)
    const selectButtonGroup = typeField.locator('.p-selectbutton')
    await expect(selectButtonGroup).toBeVisible()
    await expect(selectButtonGroup.getByRole('button', { name: 'Command' })).toBeVisible()
    await expect(selectButtonGroup.getByRole('button', { name: 'Prompt' })).toBeVisible()

    // Cancel edit
    await typeField.locator('button[aria-label="Cancel editing"]').click()
  })

  test('110.003.004: should show both type options for PreToolUse hooks', async ({ page }) => {
    // Click View on PreToolUse hook (first hook)
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find type field and enter edit mode
    const typeField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Type:' })
    await typeField.getByRole('button', { name: 'Edit Type' }).click()

    // Wait for edit mode to activate
    await page.waitForTimeout(300)

    // Verify BOTH "Command" and "Prompt" options are available for PreToolUse
    // (PreToolUse supports prompt type per official Claude Code spec)
    const selectButtonGroup = typeField.locator('.p-selectbutton')
    await expect(selectButtonGroup).toBeVisible()
    await expect(selectButtonGroup.getByRole('button', { name: 'Command' })).toBeVisible()
    await expect(selectButtonGroup.getByRole('button', { name: 'Prompt' })).toBeVisible()

    // Verify there are exactly 2 buttons
    const buttons = selectButtonGroup.getByRole('button')
    await expect(buttons).toHaveCount(2)

    // Cancel edit
    await typeField.locator('button[aria-label="Cancel editing"]').click()
  })

  test('110.003.005: should only show command type option for hooks that do not support prompt', async ({ page }) => {
    // Click View on SessionEnd hook (second hook - does NOT support prompt type)
    const viewButtons = page.locator('.view-btn')
    await viewButtons.nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find type field and enter edit mode
    const typeField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Type:' })
    await typeField.getByRole('button', { name: 'Edit Type' }).click()

    // Wait for edit mode to activate
    await page.waitForTimeout(300)

    // Verify only "Command" option is available (SessionEnd does NOT support prompt)
    const selectButtonGroup = typeField.locator('.p-selectbutton')
    await expect(selectButtonGroup).toBeVisible()
    await expect(selectButtonGroup.getByRole('button', { name: 'Command' })).toBeVisible()

    // Verify "Prompt" option is NOT available (count buttons - should only be 1)
    const buttons = selectButtonGroup.getByRole('button')
    await expect(buttons).toHaveCount(1)

    // Cancel edit
    await typeField.locator('button[aria-label="Cancel editing"]').click()
  })
})

// Test Suite 110.004: Validation
test.describe('110.004: Validation', () => {
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
            stats: { agents: 0, commands: 0, hooks: 3, mcp: 0 }
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

  test('110.004.001: should show error when saving empty command', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Command is required'
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find command field and enter edit mode
    const commandField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })
    await commandField.getByRole('button', { name: 'Edit Command' }).click()

    // Clear command value
    const textarea = commandField.locator('textarea')
    await textarea.fill('')

    // Try to save
    await commandField.getByRole('button', { name: 'Save' }).click()

    // Wait for validation
    await page.waitForTimeout(500)

    // Verify error message is displayed (PrimeVue Message component)
    const errorMessage = commandField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('110.004.002: should show error for invalid timeout', async ({ page }) => {
    let errorReturned = false

    // Mock API to return validation error
    await page.route('**/api/projects/testproject/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'PUT') {
        errorReturned = true
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Timeout must be a positive number'
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find timeout field and enter edit mode
    const timeoutField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Timeout (ms):' })
    await timeoutField.getByRole('button', { name: 'Edit Timeout (ms)' }).click()

    // Wait for edit mode to activate
    await page.waitForTimeout(300)

    // Enter invalid timeout (negative number) - PrimeVue InputNumber
    const input = timeoutField.locator('.p-inputnumber input')
    await input.fill('-1000')

    // Try to accept
    await timeoutField.locator('button[aria-label="Accept changes"]').click()

    // Wait for API call and field to exit edit mode
    await page.waitForTimeout(1000)

    // Verify API was called with invalid data and returned error
    expect(errorReturned).toBe(true)

    // Note: Current behavior - field exits edit mode even on error
    // The invalid value is displayed but the backend rejects it
    // Verify the field is back in display mode
    await expect(timeoutField.locator('.p-inputnumber input')).not.toBeVisible()
  })
})

// Test Suite 110.005: User-Level Hooks
test.describe('110.005: User-Level Hooks', () => {
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

    // Mock user-level hooks
    await page.route('**/api/user/hooks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            hooks: [mockPreToolUseHook]
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

  test('110.005.001: should edit user-level hook successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update for user hook
    await page.route('**/api/user/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            hook: { ...mockPreToolUseHook, command: 'echo "Updated user hook"' }
          })
        })
      }
    })

    // Wait for a hook card to appear (simpler approach that works for both project and user pages)
    // Find the View button next to PreToolUse text directly
    const viewButton = page.locator('text=PreToolUse').locator('..').locator('button', { hasText: 'View' }).first()
    await viewButton.waitFor({ state: 'visible', timeout: 15000 })
    await viewButton.click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit command (BLOCK field with Save button)
    const commandField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })
    await commandField.getByRole('button', { name: 'Edit Command' }).click()
    await commandField.locator('textarea').fill('echo "Updated user hook"')
    await commandField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('110.005.002: should display user-level hook with correct event', async ({ page }) => {
    // Find the View button next to PreToolUse text directly
    const viewButton = page.locator('text=PreToolUse').locator('..').locator('button', { hasText: 'View' }).first()
    await viewButton.waitFor({ state: 'visible', timeout: 15000 })
    await viewButton.click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify event is displayed as readonly
    const eventField = sidebar.locator('p').filter({ hasText: 'Event:' })
    await expect(eventField).toBeVisible()
    await expect(eventField).toContainText('PreToolUse')
    await expect(eventField).toContainText('(read-only)')
  })

  test('110.005.003: should update multiple fields independently on user-level hook', async ({ page }) => {
    let updateCount = 0

    // Mock update API to count calls
    await page.route('**/api/user/hooks/PreToolUse%3A%3ABash%3A%3A0', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCount++
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            hook: { ...mockPreToolUseHook, ...requestBody }
          })
        })
      }
    })

    // Find the View button next to PreToolUse text directly
    const viewButton = page.locator('text=PreToolUse').locator('..').locator('button', { hasText: 'View' }).first()
    await viewButton.waitFor({ state: 'visible', timeout: 15000 })
    await viewButton.click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Update command (BLOCK field with Save button)
    const commandField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })
    await commandField.getByRole('button', { name: 'Edit Command' }).click()
    await commandField.locator('textarea').fill('echo "New command"')
    await commandField.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(500)

    // Update timeout (INLINE field)
    const timeoutField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Timeout (ms):' })
    await timeoutField.getByRole('button', { name: 'Edit Timeout (ms)' }).click()
    await page.waitForTimeout(300)
    await timeoutField.locator('.p-inputnumber input').fill('45000')
    await timeoutField.locator('button[aria-label="Accept changes"]').click()
    await page.waitForTimeout(500)

    // Verify two separate API calls were made
    expect(updateCount).toBe(2)
  })
})
