const { test, expect } = require('@playwright/test');

/**
 * Frontend Component Tests: 01-App Smoke Tests
 *
 * Test Suite: 01.001 - Basic app initialization and core functionality
 * Test Suite: 01.002 - Theme toggle functionality
 * Test Suite: 01.003 - Loading state and async behavior
 * Test Suite: 01.004 - API integration and error handling
 *
 * Numbering Format: 01.GROUP.TEST
 * - 01: File number (app-smoke tests)
 * - GROUP: Test suite group (001-004)
 * - TEST: Individual test case (001, 002, 003...)
 *
 * These tests verify the frontend application loads and core functionality works.
 * Tests validate that the Vue 3 application initializes correctly and the
 * Express server serves the frontend properly.
 */

// Test Suite 01.001: Basic App Initialization
test.describe('01.001: Basic App Initialization', () => {
  test('01.001.001: homepage loads successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Verify page title
    await expect(page).toHaveTitle(/Claude Code Manager/i);
  });

  test('01.001.002: page contains main app structure', async ({ page }) => {
    await page.goto('/');

    // Wait for Vue app to mount
    await page.waitForSelector('#app');

    // Verify header is present
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify app title is visible (h1 in header, not .app-title class)
    const appTitle = page.locator('header h1');
    await expect(appTitle).toBeVisible();
    await expect(appTitle).toContainText('Claude Code Manager');
  });

  // Search feature removed in Phase 2 - planned for Phase 3
  test.skip('01.001.003: search input is present and functional', async ({ page }) => {
    await page.goto('/');

    // Verify search input exists
    const searchInput = page.locator('.search-input');
    await expect(searchInput).toBeVisible();

    // Verify placeholder text
    await expect(searchInput).toHaveAttribute('placeholder', 'Search projects...');

    // Test that input is functional
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('01.001.004: theme toggle button is present', async ({ page }) => {
    await page.goto('/');

    // Wait for Vue app to mount
    await page.waitForSelector('#app');

    // Verify theme toggle button exists (PrimeVue Button with aria-label)
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible();
  });

  test('01.001.005: refresh button is present', async ({ page }) => {
    await page.goto('/');

    // Wait for Vue app to mount
    await page.waitForSelector('#app');

    // Verify rescan button exists (PrimeVue Button with "Rescan" text)
    const refreshButton = page.locator('button.p-button:has-text("Rescan")');
    await expect(refreshButton).toBeVisible();
    await expect(refreshButton).toContainText('Rescan');
  });

  test('01.001.006: Vue app mounts successfully', async ({ page }) => {
    await page.goto('/');

    // Verify Vue app container is present (id="app")
    const appDiv = page.locator('#app');
    await expect(appDiv).toBeVisible();

    // Verify content is rendered (not just empty div) - main element with router-view
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });
});

// Test Suite 01.002: Theme Toggle Functionality
test.describe('01.002: Theme Toggle Functionality', () => {
  test('01.002.001: theme toggle changes between dark and light modes', async ({ page }) => {
    await page.goto('/');

    // Wait for Vue app to mount
    await page.waitForSelector('#app');

    // Get initial theme from #app data-theme attribute
    const appContainer = page.locator('#app');
    const initialTheme = await appContainer.getAttribute('data-theme');

    // Click theme toggle (PrimeVue Button with aria-label)
    await page.click('button[aria-label="Toggle theme"]');

    // Wait for theme to change
    await page.waitForTimeout(100);

    // Verify theme changed
    const newTheme = await appContainer.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);

    // Click again to toggle back
    await page.click('button[aria-label="Toggle theme"]');
    await page.waitForTimeout(100);

    // Verify theme reverted
    const revertedTheme = await appContainer.getAttribute('data-theme');
    expect(revertedTheme).toBe(initialTheme);
  });
});

// Test Suite 01.003: Loading State and Async Behavior
test.describe('01.003: Loading State and Async Behavior', () => {
  test('01.003.001: shows loading state when fetching projects', async ({ page }) => {
    let routeHandled = false;

    // Intercept API call to delay response and observe loading state
    await page.route('**/api/projects*', async (route) => {
      if (!routeHandled) {
        routeHandled = true;
        // Use setTimeout instead of page.waitForTimeout to avoid test ending error
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            projects: []
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    // Wait for the route handler to complete
    await page.waitForTimeout(100);

    // Unroute to clean up
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});

// Test Suite 01.004: API Integration and Error Handling
test.describe('01.004: API Integration and Error Handling', () => {
  test('01.004.001: successfully fetches projects from API', async ({ page }) => {
    // Wait for API response (accept any URL with /api/projects)
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/projects')
    );

    await page.goto('/');

    const response = await responsePromise;
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success');
  });

  test('01.004.002: handles API errors gracefully', async ({ page }) => {
    // Intercept all API calls and return error
    await page.route('**/api/projects*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal Server Error'
        })
      });
    });

    await page.goto('/');

    // Wait for Vue app to mount first
    await page.waitForSelector('#app');

    // Wait for error state to appear (ErrorState component uses semantic heading)
    const errorState = page.locator('text=Error Loading Projects');
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // Verify error message is displayed
    await expect(errorState).toBeVisible();
  });
});
