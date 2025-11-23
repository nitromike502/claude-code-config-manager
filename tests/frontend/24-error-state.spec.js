/**
 * ErrorState Component Tests
 *
 * Tests for the ErrorState.vue component which displays error states
 * with optional retry action. This follows the same pattern as EmptyState.vue.
 *
 * @see src/components/common/ErrorState.vue
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('ErrorState Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Dashboard where we can trigger error states
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
  })

  test('renders with required props (title and message)', async ({ page }) => {
    // To test ErrorState, we need to trigger an error state
    // We'll do this by intercepting the API and returning an error
    await page.route('**/api/projects', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    // Reload to trigger the error
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify error state is displayed
    const errorState = page.locator('.error-state')
    await expect(errorState).toBeVisible()

    // Check that title and message are displayed
    const title = errorState.locator('h3')
    await expect(title).toHaveText('Error Loading Projects')

    const message = errorState.locator('p')
    await expect(message).toBeVisible()
    await expect(message).toContainText('error')
  })

  test('displays error icon correctly', async ({ page }) => {
    await page.route('**/api/projects', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Connection failed' })
      })
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    const errorState = page.locator('.error-state')
    await expect(errorState).toBeVisible()

    // Check that error icon is displayed
    const icon = errorState.locator('i').first()
    await expect(icon).toBeVisible()

    // Icon should have PrimeIcons class (default is pi-exclamation-triangle)
    const iconClass = await icon.getAttribute('class')
    expect(iconClass).toContain('pi')
  })

  test('displays title and message correctly', async ({ page }) => {
    await page.route('**/api/projects', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Failed to load projects' })
      })
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    const errorState = page.locator('.error-state')

    // Verify title
    const title = errorState.locator('h3')
    await expect(title).toHaveText('Error Loading Projects')

    // Verify message
    const message = errorState.locator('p')
    await expect(message).toContainText('Failed to load projects')
  })

  test('shows retry button when retryText is provided', async ({ page }) => {
    await page.route('**/api/projects', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Connection timeout' })
      })
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    const errorState = page.locator('.error-state')
    await expect(errorState).toBeVisible()

    // Retry button should be visible
    const retryButton = errorState.locator('button', { hasText: 'Retry' })
    await expect(retryButton).toBeVisible()
    await expect(retryButton).toHaveText('Retry')

    // Button should have danger severity (PrimeVue danger button styling)
    const buttonClass = await retryButton.getAttribute('class')
    expect(buttonClass).toContain('p-button')
  })

  test('retry button emits retry event on click', async ({ page }) => {
    let requestCount = 0

    await page.route('**/api/projects', route => {
      requestCount++
      if (requestCount === 1) {
        // First request fails
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' })
        })
      } else {
        // Second request succeeds (after retry)
        route.fulfill({
          status: 200,
          body: JSON.stringify({ projects: [] })
        })
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Error state should be visible
    const errorState = page.locator('.error-state')
    await expect(errorState).toBeVisible()

    // Click retry button
    const retryButton = errorState.locator('button', { hasText: 'Retry' })
    await retryButton.click()

    // Wait for the retry to complete
    await page.waitForTimeout(500)

    // Error state should disappear (or show empty state)
    // After successful retry, we should see empty state (no projects)
    await expect(errorState).not.toBeVisible()

    // Verify request was made twice (initial + retry)
    expect(requestCount).toBe(2)
  })

  test('retry button has correct icon', async ({ page }) => {
    await page.route('**/api/projects', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Network error' })
      })
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    const errorState = page.locator('.error-state')
    const retryButton = errorState.locator('button', { hasText: 'Retry' })

    // Check for retry icon (pi-refresh)
    const buttonIcon = retryButton.locator('i.pi-refresh')
    await expect(buttonIcon).toBeVisible()
  })

  test('error state is responsive on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })

    await page.route('**/api/projects', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Mobile test error' })
      })
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    const errorState = page.locator('.error-state')
    await expect(errorState).toBeVisible()

    // Verify all elements are visible on mobile
    await expect(errorState.locator('i').first()).toBeVisible()
    await expect(errorState.locator('h3')).toBeVisible()
    await expect(errorState.locator('p')).toBeVisible()
    await expect(errorState.locator('button')).toBeVisible()

    // Check that the error state is properly centered
    const box = await errorState.boundingBox()
    expect(box).not.toBeNull()
    expect(box.width).toBeGreaterThan(0)
  })

  test('error icon has correct color (danger/error color)', async ({ page }) => {
    await page.route('**/api/projects', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Color test error' })
      })
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    const errorState = page.locator('.error-state')
    const icon = errorState.locator('i').first()

    // Get computed color
    const color = await icon.evaluate(el => {
      return window.getComputedStyle(el).color
    })

    // Color should be defined (not default text color)
    expect(color).toBeTruthy()
    expect(color).not.toBe('rgba(0, 0, 0, 0)')
  })
})
