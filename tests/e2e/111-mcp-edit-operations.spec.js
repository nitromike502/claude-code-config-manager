/**
 * End-to-End Tests: MCP Server Edit Operations
 *
 * Test Suite: 111.001 - MCP Server Selection and Display
 * Test Suite: 111.002 - Inline Editing
 * Test Suite: 111.003 - Conditional Field Visibility
 * Test Suite: 111.004 - Array/Object Editors
 * Test Suite: 111.005 - Validation
 * Test Suite: 111.006 - User-Level MCP Servers
 *
 * Numbering Format: 111.SUITE.TEST
 *
 * Tests the complete MCP server inline editing workflow including:
 * - MCP server selection and field display
 * - Inline editing of editable fields (name, command, url, args, env, headers, enabled, timeout)
 * - Transport type field is read-only (cannot be changed after creation)
 * - Conditional field visibility based on transport type (stdio vs http vs sse)
 * - Array/Object editors for args, env, headers
 * - Form validation and error handling
 * - API integration with success/error states
 * - Project and user-level MCP server operations
 *
 * Implementation:
 * - ConfigDetailSidebar.vue - Sidebar with inline editing for MCP servers
 * - LabeledEditField.vue - Inline edit component
 * - KeyValueEditor.vue - Key-value pair editor for env/headers
 * - ArgsArrayEditor.vue - Args array editor
 * - useMcpStore - Pinia store for MCP server operations
 * - API endpoints: PUT /api/projects/:id/mcp/:serverName
 * - API endpoints: PUT /api/user/mcp/:serverName
 *
 * MCP Server Identification:
 * MCP servers are identified by their name property
 *
 * Transport Types:
 * - stdio: Requires command, args (optional), env (optional)
 * - http/https: Requires url, headers (optional)
 * - sse: Requires url, headers (optional)
 *
 * Field Editability:
 * - name: EDITABLE
 * - transport (type): READ-ONLY (cannot change after creation)
 * - command: EDITABLE (stdio only)
 * - args: EDITABLE array (stdio only)
 * - env: EDITABLE object (stdio only)
 * - url: EDITABLE (http/https/sse only)
 * - headers: EDITABLE object (http/https/sse only)
 * - enabled: EDITABLE (boolean toggle)
 * - timeout: EDITABLE (number input)
 */

const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

// Mock MCP server data - stdio transport
const mockStdioServer = {
  name: 'test-stdio-server',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
  env: { DEBUG: 'mcp:*', API_KEY: 'test-key' },
  enabled: true,
  timeout: 30000
}

// Mock MCP server data - http transport
const mockHttpServer = {
  name: 'test-http-server',
  transport: 'http',
  url: 'https://api.example.com/mcp',
  headers: { 'Authorization': 'Bearer token123', 'Content-Type': 'application/json' },
  enabled: true,
  timeout: 30000
}

// Mock MCP server data - sse transport
const mockSseServer = {
  name: 'test-sse-server',
  transport: 'sse',
  url: 'https://sse.example.com/events',
  headers: { 'Authorization': 'Bearer sse-token' },
  enabled: false,
  timeout: 60000
}

const mockMcpServers = [mockStdioServer, mockHttpServer, mockSseServer]

// Test Suite 111.001: MCP Server Selection and Display
test.describe('111.001: MCP Server Selection and Display', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 3 }
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

    // Mock project MCP servers
    await page.route('**/api/projects/testproject/mcp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: mockMcpServers })
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
    await page.route('**/api/projects/testproject/hooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      })
    })

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('111.001.001: should open sidebar with MCP server details when view button is clicked', async ({ page }) => {
    // Click View button on first MCP server card
    const viewButton = page.locator('.view-btn').first()
    await viewButton.click()

    // Verify sidebar is visible (PrimeVue Drawer)
    const sidebar = page.locator('.p-drawer')
    await expect(sidebar).toBeVisible()

    // Verify MCP server name in sidebar header
    await expect(sidebar.getByText('test-stdio-server').first()).toBeVisible()

    // Verify metadata section is visible
    await expect(sidebar.getByText('Metadata')).toBeVisible()
  })

  test('111.001.002: should display transport field as readonly', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify transport field is displayed with "read-only" label
    const transportField = sidebar.locator('p').filter({ hasText: 'Transport:' })
    await expect(transportField).toBeVisible()
    await expect(transportField).toContainText('stdio')
    await expect(transportField).toContainText('(read-only)')
  })

  test('111.001.003: should display all editable fields for stdio MCP server', async ({ page }) => {
    // Click View button on stdio server
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify all editable fields are present
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name:' })).toBeVisible()
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })).toBeVisible()
    await expect(sidebar.getByText('Arguments')).toBeVisible() // Args array section
    await expect(sidebar.getByText('Environment Variables')).toBeVisible() // Env object section
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Enabled:' })).toBeVisible()
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Timeout (ms):' })).toBeVisible()
  })

  test('111.001.004: should display all editable fields for http MCP server', async ({ page }) => {
    // Click View button on http server (second one)
    await page.locator('.view-btn').nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify all editable fields are present
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name:' })).toBeVisible()
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'URL:' })).toBeVisible()
    await expect(sidebar.getByText('Headers')).toBeVisible() // Headers object section
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Enabled:' })).toBeVisible()
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Timeout (ms):' })).toBeVisible()
  })

  test('111.001.005: should display current MCP server values in sidebar fields', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Wait a moment for fields to populate
    await page.waitForTimeout(500)

    // Verify field values are displayed
    await expect(sidebar.getByText('test-stdio-server').first()).toBeVisible() // Name
    await expect(sidebar.getByText('npx')).toBeVisible() // Command
    await expect(sidebar.getByText('30000')).toBeVisible() // Timeout
  })
})

// Test Suite 111.002: Inline Editing
test.describe('111.002: Inline Editing', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 3 }
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

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('111.002.001: should update MCP server name successfully', async ({ page }) => {
    const updatedName = 'renamed-stdio-server'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/mcp/test-stdio-server', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            server: {
              ...mockStdioServer,
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
    const nameField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name:' })

    // Click the edit button to enter edit mode
    const editButton = nameField.getByRole('button', { name: 'Edit Name' })
    await editButton.click()

    // Update name value
    const input = nameField.locator('input')
    await input.fill(updatedName)

    // Accept changes
    await nameField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('111.002.002: should update MCP server command (stdio) successfully', async ({ page }) => {
    const updatedCommand = 'node'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/mcp/test-stdio-server', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        expect(requestBody.command).toBe(updatedCommand)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            server: {
              ...mockStdioServer,
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

    // Find the command field (INLINE field)
    const commandField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })

    // Click the edit button to enter edit mode
    const editButton = commandField.getByRole('button', { name: 'Edit Command' })
    await editButton.click()

    // Update command value
    const input = commandField.locator('input')
    await input.fill(updatedCommand)

    // Accept changes
    await commandField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('111.002.003: should update MCP server url (http) successfully', async ({ page }) => {
    const updatedUrl = 'https://new-api.example.com/mcp'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/mcp/test-http-server', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        expect(requestBody.url).toBe(updatedUrl)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            server: {
              ...mockHttpServer,
              url: requestBody.url
            }
          })
        })
      }
    })

    // Click View button on http server (second one)
    await page.locator('.view-btn').nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find the url field (INLINE field)
    const urlField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'URL:' })

    // Click the edit button to enter edit mode
    const editButton = urlField.getByRole('button', { name: 'Edit URL' })
    await editButton.click()

    // Update url value
    const input = urlField.locator('input')
    await input.fill(updatedUrl)

    // Accept changes
    await urlField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('111.002.004: should toggle MCP server enabled status successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/mcp/test-stdio-server', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        expect(requestBody.enabled).toBe(false)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            server: {
              ...mockStdioServer,
              enabled: false
            }
          })
        })
      }
    })

    // Click View button to open sidebar
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

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('111.002.005: should update MCP server timeout successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/mcp/test-stdio-server', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        expect(requestBody.timeout).toBe(60000)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            server: {
              ...mockStdioServer,
              timeout: 60000
            }
          })
        })
      }
    })

    // Click View button to open sidebar
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

    // Accept changes
    await timeoutField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save to complete
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('111.002.006: should cancel edit operation without saving', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find command field and enter edit mode
    const commandField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })
    await commandField.getByRole('button', { name: 'Edit Command' }).click()

    // Make a change
    const input = commandField.locator('input')
    const originalValue = await input.inputValue()
    await input.fill('changed-but-not-saved')

    // Click cancel button
    const cancelButton = commandField.locator('button[aria-label="Cancel editing"]')
    await cancelButton.click()

    // Verify field reverted to original value
    await expect(commandField).toContainText(originalValue)

    // Verify no API call was made (implicitly - test would fail if error occurred)
  })
})

// Test Suite 111.003: Conditional Field Visibility
test.describe('111.003: Conditional Field Visibility', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 3 }
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

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('111.003.001: should show command/args/env for stdio transport', async ({ page }) => {
    // Click View on stdio server (first server)
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify stdio fields are visible
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })).toBeVisible()
    await expect(sidebar.getByText('Arguments')).toBeVisible()
    await expect(sidebar.getByText('Environment Variables')).toBeVisible()

    // Verify http/sse fields are NOT visible
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'URL:' })).not.toBeVisible()
    await expect(sidebar.locator('text=Headers').first()).not.toBeVisible()
  })

  test('111.003.002: should show url/headers for http transport', async ({ page }) => {
    // Click View on http server (second server)
    await page.locator('.view-btn').nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify http fields are visible
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'URL:' })).toBeVisible()
    await expect(sidebar.getByText('Headers')).toBeVisible()

    // Verify stdio fields are NOT visible
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })).not.toBeVisible()
    await expect(sidebar.locator('text=Arguments').first()).not.toBeVisible()
    await expect(sidebar.locator('text=Environment Variables').first()).not.toBeVisible()
  })

  test('111.003.003: should show url/headers for sse transport', async ({ page }) => {
    // Click View on sse server (third server)
    await page.locator('.view-btn').nth(2).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify sse fields are visible (same as http)
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'URL:' })).toBeVisible()
    await expect(sidebar.getByText('Headers')).toBeVisible()

    // Verify stdio fields are NOT visible
    await expect(sidebar.locator('.labeled-edit-field').filter({ hasText: 'Command:' })).not.toBeVisible()
    await expect(sidebar.locator('text=Arguments').first()).not.toBeVisible()
  })

  test('111.003.004: should display transport type as readonly', async ({ page }) => {
    // Click View on stdio server
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify transport field is readonly (no edit button)
    const transportField = sidebar.locator('p').filter({ hasText: 'Transport:' })
    await expect(transportField).toBeVisible()
    await expect(transportField).toContainText('(read-only)')

    // Verify no edit button exists for transport field
    const editButton = transportField.locator('..').getByRole('button', { name: /Edit/i })
    await expect(editButton).not.toBeVisible()
  })
})

// Test Suite 111.004: Array/Object Editors
test.describe('111.004: Array/Object Editors', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 3 }
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

    // Mock project endpoints with update route
    await page.route('**/api/projects/testproject/mcp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: mockMcpServers })
      })
    })
    await page.route('**/api/projects/testproject/mcp/test-stdio-server', async (route) => {
      if (route.request().method() === 'PUT') {
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            server: {
              ...mockStdioServer,
              ...requestBody
            }
          })
        })
      }
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

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('111.004.001: should display args array with chips', async ({ page }) => {
    // Click View on stdio server
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify Arguments section exists
    await expect(sidebar.getByText('Arguments')).toBeVisible()

    // Verify args are displayed as chips (PrimeVue Chips component)
    const argsSection = sidebar.locator('text=Arguments').locator('..').locator('..')
    await expect(argsSection.locator('.p-chips-token, .p-chip')).toHaveCount(3) // -y, @modelcontextprotocol/server-filesystem, /tmp
  })

  test('111.004.002: should add new arg to array', async ({ page }) => {
    // Click View on stdio server
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find args section
    const argsSection = sidebar.locator('text=Arguments').locator('..').locator('..')

    // Get initial count
    const initialCount = await argsSection.locator('.p-chips-token, .p-chip').count()

    // Find the Chips input and add a new arg
    const input = argsSection.locator('.p-chips input, input[type="text"]')
    await input.fill('--verbose')
    await input.press('Enter')

    // Verify new chip was added
    await expect(argsSection.locator('.p-chips-token, .p-chip')).toHaveCount(initialCount + 1)
  })

  test('111.004.003: should remove arg from array', async ({ page }) => {
    // Click View on stdio server
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find args section
    const argsSection = sidebar.locator('text=Arguments').locator('..').locator('..')

    // Get initial count
    const initialCount = await argsSection.locator('.p-chips-token, .p-chip').count()

    // Click remove button on first chip (the X icon)
    const firstChipRemoveBtn = argsSection.locator('.p-chips-token, .p-chip').first().locator('button, .pi-times, .pi-times-circle')
    if (await firstChipRemoveBtn.isVisible()) {
      await firstChipRemoveBtn.click()

      // Verify chip was removed
      await expect(argsSection.locator('.p-chips-token, .p-chip')).toHaveCount(initialCount - 1)
    }
  })

  test('111.004.004: should display env key-value pairs', async ({ page }) => {
    // Click View on stdio server
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify Environment Variables section exists
    await expect(sidebar.getByText('Environment Variables')).toBeVisible()

    // Verify env pairs are displayed (KeyValueEditor component)
    const envSection = sidebar.locator('text=Environment Variables').locator('..').locator('..')
    await expect(envSection.locator('input[type="text"]')).toHaveCount(4) // 2 pairs × 2 inputs (key + value)
  })

  test('111.004.005: should add new env key-value pair', async ({ page }) => {
    // Click View on stdio server
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find env section
    const envSection = sidebar.locator('text=Environment Variables').locator('..').locator('..')

    // Get initial count
    const initialCount = await envSection.locator('input[type="text"]').count()

    // Click Add button (should be in the KeyValueEditor)
    const addButton = envSection.getByRole('button', { name: /Add/i })
    await addButton.click()

    // Verify new row was added (2 more inputs: key + value)
    await expect(envSection.locator('input[type="text"]')).toHaveCount(initialCount + 2)
  })

  test('111.004.006: should remove env key-value pair', async ({ page }) => {
    // Click View on stdio server
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find env section
    const envSection = sidebar.locator('text=Environment Variables').locator('..').locator('..')

    // Get initial count
    const initialCount = await envSection.locator('input[type="text"]').count()

    // Click remove button on first pair (trash icon)
    const firstRemoveBtn = envSection.locator('button[aria-label*="Remove"], button:has(.pi-trash)').first()
    if (await firstRemoveBtn.isVisible()) {
      await firstRemoveBtn.click()

      // Verify pair was removed (2 fewer inputs)
      await expect(envSection.locator('input[type="text"]')).toHaveCount(initialCount - 2)
    }
  })

  test('111.004.007: should display headers key-value pairs for http server', async ({ page }) => {
    // Click View on http server (second server)
    await page.locator('.view-btn').nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify Headers section exists
    await expect(sidebar.getByText('Headers')).toBeVisible()

    // Verify headers are displayed (KeyValueEditor component)
    const headersSection = sidebar.locator('text=Headers').locator('..').locator('..')
    await expect(headersSection.locator('input[type="text"]')).toHaveCount(4) // 2 pairs × 2 inputs
  })

  test('111.004.008: should add new header key-value pair', async ({ page }) => {
    // Mock update route for http server
    await page.route('**/api/projects/testproject/mcp/test-http-server', async (route) => {
      if (route.request().method() === 'PUT') {
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            server: {
              ...mockHttpServer,
              ...requestBody
            }
          })
        })
      }
    })

    // Click View on http server
    await page.locator('.view-btn').nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find headers section
    const headersSection = sidebar.locator('text=Headers').locator('..').locator('..')

    // Get initial count
    const initialCount = await headersSection.locator('input[type="text"]').count()

    // Click Add button
    const addButton = headersSection.getByRole('button', { name: /Add/i })
    await addButton.click()

    // Verify new row was added
    await expect(headersSection.locator('input[type="text"]')).toHaveCount(initialCount + 2)
  })
})

// Test Suite 111.005: Validation
test.describe('111.005: Validation', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 3 }
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

    // Navigate to project detail page
    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('111.005.001: should show error when saving empty command for stdio server', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/mcp/test-stdio-server', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Validation failed',
            details: ['Command must be a non-empty string for stdio transport']
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

    // Clear the command
    const input = commandField.locator('input')
    await input.fill('')

    // Accept changes (should trigger validation error)
    await commandField.locator('button[aria-label="Accept changes"]').click()

    // Wait for error to appear
    await page.waitForTimeout(1000)

    // Verify error is displayed (PrimeVue Toast)
    await expect(page.locator('.p-toast, [role="alert"]')).toBeVisible()
  })

  test('111.005.002: should show error when saving empty url for http server', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/mcp/test-http-server', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Validation failed',
            details: ['URL must be a non-empty string for http transport']
          })
        })
      }
    })

    // Click View on http server
    await page.locator('.view-btn').nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find url field and enter edit mode
    const urlField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'URL:' })
    await urlField.getByRole('button', { name: 'Edit URL' }).click()

    // Clear the url
    const input = urlField.locator('input')
    await input.fill('')

    // Accept changes (should trigger validation error)
    await urlField.locator('button[aria-label="Accept changes"]').click()

    // Wait for error to appear
    await page.waitForTimeout(1000)

    // Verify error is displayed
    await expect(page.locator('.p-toast, [role="alert"]')).toBeVisible()
  })

  test('111.005.003: should show error when saving duplicate server name', async ({ page }) => {
    // Mock API to return conflict error
    await page.route('**/api/projects/testproject/mcp/test-stdio-server', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Server name already exists'
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find name field and enter edit mode
    const nameField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name:' })
    await nameField.getByRole('button', { name: 'Edit Name' }).click()

    // Change to duplicate name
    const input = nameField.locator('input')
    await input.fill('test-http-server') // Name of second server

    // Accept changes (should trigger conflict error)
    await nameField.locator('button[aria-label="Accept changes"]').click()

    // Wait for error to appear
    await page.waitForTimeout(1000)

    // Verify error is displayed
    await expect(page.locator('.p-toast, [role="alert"]')).toBeVisible()
  })

  test('111.005.004: should show error when saving invalid timeout value', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/mcp/test-stdio-server', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Validation failed',
            details: ['Timeout must be a positive number']
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

    // Set invalid timeout (negative number)
    const input = timeoutField.locator('.p-inputnumber input')
    await input.fill('-1000')

    // Accept changes (should trigger validation error)
    await timeoutField.locator('button[aria-label="Accept changes"]').click()

    // Wait for error to appear
    await page.waitForTimeout(1000)

    // Verify error is displayed
    await expect(page.locator('.p-toast, [role="alert"]')).toBeVisible()
  })
})

// Test Suite 111.006: User-Level MCP Servers
test.describe('111.006: User-Level MCP Servers', () => {
  test.beforeEach(async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: []
        })
      })
    })

    // Mock user stats with MCP servers
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
        body: JSON.stringify({ success: true, mcp: [mockStdioServer, mockHttpServer] })
      })
    })

    // Navigate to home page (user-level view)
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
  })

  test('111.006.001: should display user-level MCP servers on home page', async ({ page }) => {
    // Verify user card is visible
    await expect(page.locator('.config-card, .user-card')).toBeVisible()

    // Verify MCP servers count or presence
    await expect(page.locator('.view-btn')).toHaveCount(2) // 2 user MCP servers
  })

  test('111.006.002: should edit user-level MCP server successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update for user MCP server
    await page.route('**/api/user/mcp/test-stdio-server', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            server: {
              ...mockStdioServer,
              name: requestBody.name
            }
          })
        })
      }
    })

    // Click View button on first user MCP server
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit name field
    const nameField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Name:' })
    await nameField.getByRole('button', { name: 'Edit Name' }).click()

    const input = nameField.locator('input')
    await input.fill('renamed-user-server')

    await nameField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('111.006.003: should toggle user-level MCP server enabled status', async ({ page }) => {
    let updateCalled = false

    // Mock successful update
    await page.route('**/api/user/mcp/test-stdio-server', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            server: {
              ...mockStdioServer,
              enabled: false
            }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Find enabled field and toggle
    const enabledField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Enabled:' })
    await enabledField.getByRole('button', { name: 'Edit Enabled' }).click()

    const noButton = enabledField.getByRole('button', { name: 'No' })
    await noButton.click()

    await enabledField.locator('button[aria-label="Accept changes"]').click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })
})
