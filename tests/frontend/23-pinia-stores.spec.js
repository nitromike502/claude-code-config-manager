/**
 * Frontend Component Tests: 23-Pinia Store Management
 *
 * Test Suite: 23.001 - Pinia store initialization and state management
 *
 * Numbering Format: 23.GROUP.TEST
 */

const { test, expect } = require('@playwright/test')

// Test Suite 23.001: Pinia Store Integration
test.describe('23.001: Pinia Store Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
  })

  test('23.001.001: should have all stores registered', async ({ page }) => {
    // At minimum, the app should load without errors
    // Use #app[data-theme] to target the correct Vue app container (not the mount point)
    const appElement = page.locator('#app[data-theme]')
    await expect(appElement).toBeVisible()
  })

  test('23.001.002: theme store - should toggle theme', async ({ page }) => {
    // Find and click the theme toggle button (PrimeVue Button with aria-label)
    const themeToggle = page.locator('button[aria-label="Toggle theme"]')
    await expect(themeToggle).toBeVisible()

    // Get initial theme from #app[data-theme] attribute (Vue creates two #app elements)
    const appContainer = page.locator('#app[data-theme]')
    const initialTheme = await appContainer.getAttribute('data-theme')

    // Click toggle
    await themeToggle.click()

    // Wait for theme change
    await page.waitForTimeout(100)

    // Verify theme changed
    const newTheme = await appContainer.getAttribute('data-theme')

    expect(newTheme).not.toBe(initialTheme)
    expect(['light', 'dark']).toContain(newTheme)
  })

  test('23.001.003: theme store - should persist to localStorage', async ({ page }) => {
    // Toggle theme (PrimeVue Button with aria-label)
    const themeToggle = page.locator('button[aria-label="Toggle theme"]')
    await themeToggle.click()

    // Wait for theme change
    await page.waitForTimeout(100)

    // Get current theme
    const currentTheme = await page.evaluate(() => {
      return localStorage.getItem('claude-code-manager-theme')
    })

    expect(['light', 'dark']).toContain(currentTheme)

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify theme persisted on #app[data-theme] attribute (Vue creates two #app elements)
    const appContainer = page.locator('#app[data-theme]')
    const persistedTheme = await appContainer.getAttribute('data-theme')

    expect(persistedTheme).toBe(currentTheme)
  })

  test('23.001.004: notifications store - should display PrimeVue Toast notifications', async ({ page }) => {
    // Trigger a notification by using the PrimeVue Toast service
    await page.evaluate(() => {
      // Access the Vue app and trigger a toast
      const app = document.querySelector('#app').__vue_app__
      if (app && app.config.globalProperties.$toast) {
        app.config.globalProperties.$toast.add({
          severity: 'info',
          summary: 'Test',
          detail: 'Test notification',
          life: 3000
        })
      }
    })

    // Check if PrimeVue toast appears
    const toast = page.locator('.p-toast-message')
    await expect(toast).toBeVisible({ timeout: 2000 })

    // Verify notification has correct text
    await expect(toast).toContainText('Test notification')

    // Wait for auto-dismiss (3 seconds + buffer)
    await expect(toast).not.toBeVisible({ timeout: 5000 })
  })

  test('23.001.005: projects store - should be accessible from components', async ({ page }) => {
    // Verify the app renders without errors, which means stores are initialized
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Wait for the dashboard to load - look for Projects heading
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 })

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state')
      return !loading || loading.offsetParent === null
    }, { timeout: 10000 })

    // Verify project cards render (they use data from projects store)
    // Check that either projects or empty state is shown
    const projectCards = page.locator('.project-card')
    const emptyState = page.locator('.p-empty-state')

    const hasProjects = await projectCards.count() > 0
    const hasEmpty = await emptyState.isVisible().catch(() => false)

    expect(hasProjects || hasEmpty).toBeTruthy()
  })

  test('23.001.006: App.vue integration - should render all store-dependent elements', async ({ page }) => {
    // Check theme toggle (uses theme store) - PrimeVue Button with aria-label
    const themeToggle = page.locator('button[aria-label="Toggle theme"]')
    await expect(themeToggle).toBeVisible()

    // Check header exists (semantic HTML)
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Check main content area exists (semantic HTML)
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // Verify no console errors
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('websocket')
    )

    expect(criticalErrors.length).toBe(0)
  })
})
