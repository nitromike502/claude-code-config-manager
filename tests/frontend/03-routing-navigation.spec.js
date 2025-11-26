const { test, expect } = require('@playwright/test');

/**
 * Frontend Component Tests: 03-Router Navigation
 *
 * Test Suite: 03.001 - Router navigation and SPA functionality
 *
 * Numbering Format: 03.GROUP.TEST
 */

// Test Suite 03.001: Router Navigation and SPA Functionality
test.describe('03.001: Router Navigation and SPA Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Start dev server if not running, then navigate to app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  });

  test('03.001.001: should load Dashboard on root path', async ({ page }) => {
    await expect(page).toHaveTitle(/Claude|Dashboard/);
    // Phase 2: Dashboard uses h2 "Projects", not h1 "Dashboard"
    await expect(page.locator('h2:has-text("Projects")')).toBeVisible();
  });

  test('03.001.002: should navigate to Dashboard without full page reload', async ({ page }) => {
    // Check initial load - Phase 2: Dashboard uses h2 "Projects"
    await expect(page.locator('h2:has-text("Projects")')).toBeVisible();

    // Listen for page load events - router-link should NOT trigger page reload
    let pageLoadCount = 0;
    page.on('load', () => pageLoadCount++);

    // Click User Config link first - Uses PrimeVue Card with user-card class
    await page.click('.user-card');
    // Wait for User Configurations page title to appear (rendered in ConfigPageLayout)
    await page.waitForSelector('span:has-text("User Configurations")');

    // Click back to Dashboard via breadcrumb - should NOT cause page reload
    const initialPageLoads = pageLoadCount;
    await page.click('.breadcrumb-link');
    await page.waitForSelector('h2:has-text("Projects")');

    // Verify no additional page loads occurred
    expect(pageLoadCount).toBe(initialPageLoads);
  });

  test('03.001.003: should navigate to UserGlobal view', async ({ page }) => {
    await page.click('.user-card');
    // Wait for User Configurations page title to appear (rendered in ConfigPageLayout)
    await page.waitForSelector('span:has-text("User Configurations")');
    await expect(page).toHaveURL(/\/user/);
  });

  test('03.001.004: should navigate to ProjectDetail with route params', async ({ page }) => {
    // Navigate directly to project detail
    await page.goto('http://localhost:5173/project/test-project-123');
    // Wait for page to load - ConfigPageLayout renders page title
    await page.waitForLoadState('networkidle');
    // Project name is derived from ID, so we expect to see "test-project-123" in the page title
    // ConfigPageLayout renders title in a div with font-semibold and flex items-center
    // Look for the page title section specifically (not breadcrumb)
    await expect(page.locator('.flex.items-center.gap-3 span:has-text("test-project-123")')).toBeVisible();
  });

  test('03.001.005: should update URL when navigating via router-link', async ({ page }) => {
    // Start at dashboard
    expect(page.url()).toContain('/');

    // Click User Config link
    await page.click('.user-card');
    // Wait for User Configurations page title to appear
    await page.waitForSelector('span:has-text("User Configurations")');
    expect(page.url()).toContain('/user');

    // Click back to Dashboard via breadcrumb link
    await page.click('.breadcrumb-link');
    // Phase 2: Dashboard uses h2 "Projects"
    await page.waitForSelector('h2:has-text("Projects")');
    expect(page.url()).not.toContain('/user');
  });

  test('03.001.006: should support browser back button', async ({ page }) => {
    // Navigate through multiple routes
    await page.click('.user-card');
    // Wait for User Configurations page title to appear
    await page.waitForSelector('span:has-text("User Configurations")');

    // Use browser back button
    await page.goBack();
    // Phase 2: Dashboard uses h2 "Projects"
    await page.waitForSelector('h2:has-text("Projects")');

    // Verify URL reflects back navigation
    expect(page.url()).not.toContain('/user');
  });

  test('03.001.007: should not have console errors during navigation', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate multiple times
    await page.click('.user-card');
    // Wait for User Configurations page title to appear
    await page.waitForSelector('span:has-text("User Configurations")');

    await page.click('.breadcrumb-link');
    // Phase 2: Dashboard uses h2 "Projects"
    await page.waitForSelector('h2:has-text("Projects")');

    // Verify no errors were logged
    expect(consoleErrors).toHaveLength(0);
  });
});
