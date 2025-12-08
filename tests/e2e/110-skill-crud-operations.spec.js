/**
 * End-to-End Tests: Skill CRUD Operations (Edit)
 *
 * Test Suite: 110.001 - Skill Edit Flow (Inline Editing in Sidebar)
 * Test Suite: 110.002 - External Reference Warnings
 * Test Suite: 110.003 - Edit Validation
 * Test Suite: 110.004 - Cross-Scope Operations
 *
 * Numbering Format: 110.SUITE.TEST
 *
 * Tests the complete skill CRUD workflow including:
 * - Inline editing in sidebar (one field at a time)
 * - External reference warnings and display
 * - Form validation and error handling
 * - API integration with success/error states
 * - Project and user-level skill operations
 *
 * Implementation:
 * - ConfigDetailSidebar.vue - Sidebar with inline editing
 * - LabeledEditField.vue - Inline edit component
 * - ConfigItemList.vue - Skill listing
 * - useSkillsStore - Pinia store for skill operations
 * - API endpoints: PUT /api/projects/:id/skills/:name
 * - API endpoints: PUT /api/user/skills/:name
 *
 * NOTE: Skills use the same inline editing pattern as agents (commit 3a229e6)
 * NOTE: Skills do NOT have delete operations (directory-based configuration)
 */

const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

// Mock skill data
const mockSkill = {
  name: 'test-skill',
  description: 'A test skill for CRUD operations',
  content: '# Test Skill\n\nThis is a test skill for E2E testing.',
  filePath: '/home/user/testproject/.claude/skills/test-skill/SKILL.md',
  scope: 'project',
  location: 'project',
  allowedTools: ['Bash', 'Read', 'Write'],
  externalReferences: []
}

const mockSkillWithExternalRefs = {
  name: 'skill-with-refs',
  description: 'A skill with external references',
  content: '# Skill With Refs\n\nReferences external files.',
  filePath: '/home/user/testproject/.claude/skills/skill-with-refs/SKILL.md',
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
    },
    {
      line: 23,
      reference: '../../../docs/guide.md',
      file: 'SKILL.md',
      type: 'relative-path',
      severity: 'error'
    }
  ]
}

const mockSkills = [mockSkill, mockSkillWithExternalRefs]

// Test Suite 110.001: Skill Edit Flow (Inline Editing)
test.describe('110.001: Skill Edit Flow', () => {
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
    await page.route('**/api/user/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: [] })
      })
    })

    // Mock project skills
    await page.route('**/api/projects/testproject/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: mockSkills })
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

  test('110.001.001: should open sidebar with editable fields when view button is clicked', async ({ page }) => {
    // Click View button on skill card
    const viewButton = page.locator('.view-btn').first()
    await viewButton.click()

    // Verify sidebar is visible (PrimeVue Drawer)
    const sidebar = page.locator('.p-drawer')
    await expect(sidebar).toBeVisible()

    // Verify skill name in sidebar header
    await expect(sidebar.getByText('test-skill').first()).toBeVisible()

    // Verify inline edit fields are present
    await expect(sidebar.getByText('Name')).toBeVisible()
    await expect(sidebar.getByText('Description')).toBeVisible()
    // Content field label appears multiple times
    await expect(sidebar.getByText('Content').first()).toBeVisible()
  })

  test('110.001.002: should display current skill values in sidebar fields', async ({ page }) => {
    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Wait a moment for fields to populate
    await page.waitForTimeout(500)

    // Verify field values (LabeledEditField shows values in display mode)
    await expect(sidebar.locator('text=test-skill').first()).toBeVisible()
    await expect(sidebar.getByText('A test skill for CRUD operations')).toBeVisible()
    await expect(sidebar.getByText('# Test Skill')).toBeVisible()
  })

  test('110.001.003: should update skill description using inline edit and save successfully', async ({ page }) => {
    const updatedDescription = 'Updated description for the test skill'
    let updateCalled = false

    // Mock successful update API call
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            skill: {
              ...mockSkill,
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

  test('110.001.004: should cancel inline edit without saving', async ({ page }) => {
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
    await expect(sidebar.getByText('A test skill for CRUD operations')).toBeVisible()

    // Verify no API call was made (implicitly - test would fail if error occurred)
  })

  test('110.001.005: should show loading state during inline field save', async ({ page }) => {
    // Mock slow API response (3 seconds to ensure we can catch loading state)
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 3000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, skill: mockSkill })
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

    // Get the save button reference before clicking
    const saveButton = descriptionField.getByRole('button', { name: 'Save' })

    // Click save button and immediately check for loading state
    await saveButton.click()

    // Verify loading state (button should be disabled or have loading icon)
    try {
      await expect(saveButton).toBeDisabled({ timeout: 1000 })
    } catch {
      // Alternative: check for loading icon if button isn't disabled
      const loadingIcon = saveButton.locator('.p-button-loading-icon, .pi-spinner')
      await expect(loadingIcon).toBeVisible({ timeout: 1000 })
    }

    // Wait for save to complete
    await page.waitForTimeout(3500)

    // Field should return to display mode
    await expect(descriptionField.locator('textarea')).not.toBeVisible({ timeout: 2000 })
  })

  test('110.001.006: should update content field successfully', async ({ page }) => {
    const updatedContent = '# Updated Test Skill\n\nThis content has been updated.'
    let updateCalled = false

    // Mock update API
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        const requestBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            skill: { ...mockSkill, content: requestBody.content }
          })
        })
      }
    })

    // Click View button
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Update content (BLOCK field with Save button)
    const contentField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Content' })
    await contentField.locator('.edit-btn').click()
    await contentField.locator('textarea').fill(updatedContent)
    await contentField.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(500)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })
})

// Test Suite 110.002: External Reference Warnings
test.describe('110.002: External Reference Warnings', () => {
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
    await page.route('**/api/user/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: [] })
      })
    })

    // Mock project skills with external references
    await page.route('**/api/projects/testproject/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: mockSkills })
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

  test('110.002.001: should show warning banner for skills with external references', async ({ page }) => {
    // Click on the second skill (skill-with-refs) view button
    const viewButtons = page.locator('.view-btn')
    await viewButtons.nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify warning banner is visible
    const warningBanner = sidebar.locator('.bg-color-warning-bg')
    await expect(warningBanner).toBeVisible()

    // Verify warning title
    await expect(warningBanner.getByText('External References Detected')).toBeVisible()
  })

  test('110.002.002: should display reference count in warning', async ({ page }) => {
    // Click on the second skill (skill-with-refs) view button
    const viewButtons = page.locator('.view-btn')
    await viewButtons.nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify reference count is displayed
    const warningBanner = sidebar.locator('.bg-color-warning-bg')
    await expect(warningBanner.getByText('2 reference')).toBeVisible()
  })

  test('110.002.003: should show line numbers and paths for each reference', async ({ page }) => {
    // Click on the second skill (skill-with-refs) view button
    const viewButtons = page.locator('.view-btn')
    await viewButtons.nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    const warningBanner = sidebar.locator('.bg-color-warning-bg')

    // Verify first reference (line 15)
    await expect(warningBanner.getByText('Line 15:')).toBeVisible()
    // Path is in a <code> block
    const firstPath = warningBanner.locator('code').filter({ hasText: '../../src/utils/helper.js' })
    await expect(firstPath).toBeVisible()

    // Verify second reference (line 23)
    await expect(warningBanner.getByText('Line 23:')).toBeVisible()
    // Path is in a <code> block
    const secondPath = warningBanner.locator('code').filter({ hasText: '../../../docs/guide.md' })
    await expect(secondPath).toBeVisible()
  })

  test('110.002.004: should show severity tags for references', async ({ page }) => {
    // Click on the second skill (skill-with-refs) view button
    const viewButtons = page.locator('.view-btn')
    await viewButtons.nth(1).click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    const warningBanner = sidebar.locator('.bg-color-warning-bg')

    // Verify severity tags are displayed (PrimeVue Tag component)
    // Tags show the type (e.g., "RELATIVE-PATH") with warning/danger severity styling
    const tags = warningBanner.locator('.p-tag')
    await expect(tags.first()).toBeVisible()

    // Verify at least 2 tags are visible (one for each reference)
    await expect(tags).toHaveCount(2)
  })

  test('110.002.005: should not show warning banner for skills without external references', async ({ page }) => {
    // Click view button for skill without external references (first skill)
    const viewButton = page.locator('.view-btn').first()
    await viewButton.click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Verify warning banner is NOT visible
    const warningBanner = sidebar.locator('.bg-color-warning-bg')
    await expect(warningBanner).not.toBeVisible()
  })
})

// Test Suite 110.003: Edit Validation
test.describe('110.003: Edit Validation', () => {
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
            stats: { agents: 0, commands: 0, hooks: 0, mcp: 0, skills: 1 }
          }]
        })
      })
    })

    await page.route('**/api/user/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [], commands: [], hooks: [], mcp: [], skills: [] })
      })
    })

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

    await page.goto(`${BASE_URL}/project/testproject`)
    await page.waitForLoadState('networkidle')
  })

  test('110.003.001: should show error for short description', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
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

  test('110.003.002: should show error for short content', async ({ page }) => {
    // Mock API to return validation error
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Content must be at least 20 characters'
          })
        })
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit content with short value (BLOCK field)
    const contentField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Content' })
    await contentField.locator('.edit-btn').click()

    // Enter short content (< 20 chars)
    const textarea = contentField.locator('textarea')
    await textarea.fill('Too short')

    // Try to save (BLOCK fields use "Save" button)
    await contentField.getByRole('button', { name: 'Save' }).click()

    // Wait for validation
    await page.waitForTimeout(500)

    // Verify error message (PrimeVue Message component)
    const errorMessage = contentField.locator('.p-message-error, .p-message')
    await expect(errorMessage).toBeVisible({ timeout: 2000 })
  })

  test('110.003.003: should clear errors when valid input is entered', async ({ page }) => {
    // Mock API to succeed on second attempt
    let attemptCount = 0
    await page.route('**/api/projects/testproject/skills/test-skill', async (route) => {
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
            body: JSON.stringify({ success: true, skill: mockSkill })
          })
        }
      }
    })

    // Open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Edit description with invalid value (BLOCK field)
    const descField = sidebar.locator('.labeled-edit-field').filter({ hasText: 'Description' }).first()
    await descField.locator('.edit-btn').click()

    const textarea = descField.locator('textarea')
    await textarea.fill('Short')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Verify error appears
    await expect(descField.locator('.p-message')).toBeVisible({ timeout: 2000 })

    // Cancel and try again with valid value
    await page.waitForTimeout(500)

    // If field stayed in edit mode due to error, just update the value
    const isInEditMode = await descField.locator('textarea').isVisible()
    if (!isInEditMode) {
      await descField.locator('.edit-btn').click()
    }

    await textarea.fill('This is a valid description with enough characters')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for success
    await page.waitForTimeout(500)

    // Error should be gone and field should be in display mode
    await expect(descField.locator('textarea')).not.toBeVisible({ timeout: 2000 })
  })
})

// Test Suite 110.004: Cross-Scope Operations (User-Level Skills)
test.describe('110.004: Cross-Scope Operations', () => {
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
              location: 'user'
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

  test('110.004.001: should edit user-level skill successfully', async ({ page }) => {
    let updateCalled = false

    // Mock successful update for user skill
    await page.route('**/api/user/skills/test-skill', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            skill: { ...mockSkill, description: 'Updated user-level skill' }
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
    await descField.locator('textarea').fill('Updated user-level skill')
    await descField.getByRole('button', { name: 'Save' }).click()

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify API was called
    expect(updateCalled).toBe(true)
  })

  test('110.004.002: should display allowed tools as read-only chips', async ({ page }) => {
    // Click View button to open sidebar
    await page.locator('.view-btn').first().click()

    const sidebar = page.locator('.p-drawer')
    await sidebar.waitFor({ state: 'visible' })

    // Wait for content to load
    await page.waitForTimeout(500)

    // Verify Allowed Tools section is visible
    await expect(sidebar.getByText('Allowed Tools')).toBeVisible()

    // Verify tools are displayed as chips (PrimeVue Chip component or similar)
    await expect(sidebar.getByText('Bash')).toBeVisible()
    await expect(sidebar.getByText('Read')).toBeVisible()
    await expect(sidebar.getByText('Write')).toBeVisible()
  })
})
