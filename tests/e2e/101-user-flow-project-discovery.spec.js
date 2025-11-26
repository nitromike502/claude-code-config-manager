const { test, expect } = require('@playwright/test');

/**
 * End-to-End Flow Test: First-Time User - Project Discovery
 *
 * This test simulates a complete user journey from opening the application
 * for the first time through discovering projects and viewing their details.
 *
 * User Journey:
 * 1. User opens the application (may see empty state or project list)
 * 2. Application loads projects from ~/.claude.json
 * 3. User sees project cards with statistics
 * 4. User clicks on a project card
 * 5. Detail view loads with all configuration information
 * 6. User navigates back to the dashboard
 *
 * Phase 2 (Vue SPA) Architecture:
 * - URLs: /project/:id (Vue Router)
 * - Navigation: Client-side (no page reloads)
 * - API: Vite proxy → Express backend
 * - State: Pinia stores
 */

// Test Suite 101.001: E2E Flow: First-Time User - Project Discovery
test.describe('101.001: E2E Flow: First-Time User - Project Discovery', () => {
  // Test 101.001.001: complete project discovery journey from dashboard to detail and back
  test('101.001.001: complete project discovery journey from dashboard to detail and back', async ({ page }) => {
    // Setup API mocks for consistent test data
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'homeuserprojectsmyapp',
              name: 'My App',
              path: '/home/user/projects/my-app',
              stats: {
                agents: 3,
                commands: 8,
                hooks: 2,
                mcp: 1
              }
            },
            {
              id: 'homeuserprojectsanotherapp',
              name: 'Another App',
              path: '/home/user/projects/another-app',
              stats: {
                agents: 1,
                commands: 4,
                hooks: 0,
                mcp: 0
              }
            }
          ]
        })
      });
    });

    // Mock user stats for User card
    await page.route('**/api/user/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/user/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/user/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/user/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Mock project detail API endpoints
    await page.route('**/api/projects/homeuserprojectsmyapp/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/projects/homeuserprojectsmyapp/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/projects/homeuserprojectsmyapp/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/projects/homeuserprojectsmyapp/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // STEP 1: User opens application
    await page.goto('/');

    // Verify page loaded successfully
    await expect(page).toHaveTitle(/Claude Code Manager/i);
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // STEP 2: Verify projects loaded from API
    // Wait for loading state to complete (grid uses Tailwind classes)
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // STEP 3: User sees project cards with statistics
    // Note: Dashboard shows User card (index 0) + project cards (index 1+)
    // Projects are sorted alphabetically by default (A-Z)
    const projectCards = page.locator('.project-card');
    expect(await projectCards.count()).toBe(3); // User card + 2 projects

    // Verify first PROJECT card displays correctly (skip User card at index 0)
    // Projects are sorted: "Another App" comes before "My App"
    const firstProject = projectCards.nth(1);
    await expect(firstProject.locator('.project-name')).toContainText('Another App');
    await expect(firstProject.locator('.project-path')).toContainText('/home/user/projects/another-app');

    // Verify second project card is "My App"
    const secondProject = projectCards.nth(2);
    await expect(secondProject.locator('.project-name')).toContainText('My App');
    await expect(secondProject.locator('.project-path')).toContainText('/home/user/projects/my-app');

    // Verify statistics are displayed on My App card
    await expect(secondProject.locator('.stat-agents')).toContainText('3 Agents');
    await expect(secondProject.locator('.stat-commands')).toContainText('8 Commands');
    await expect(secondProject.locator('.stat-hooks')).toContainText('2 Hooks');
    await expect(secondProject.locator('.stat-mcp')).toContainText('1 MCP');

    // STEP 4: User clicks on "My App" project
    await secondProject.click();

    // STEP 5: Detail view loads with configuration information
    // Phase 2: Vue Router uses /project/:id pattern
    await page.waitForURL(/\/project\/homeuserprojectsmyapp/, { timeout: 10000 });

    // Verify we're on the detail page
    await expect(page).toHaveTitle(/Claude Code Manager/i);

    // Verify project information loaded (ConfigPageLayout renders config-panel elements)
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Verify project name is displayed in the page title
    const pageTitle = page.locator('span:has-text("My App")').first();
    await expect(pageTitle).toBeVisible();

    // Verify breadcrumbs navigation is present
    const breadcrumbs = page.locator('.breadcrumbs');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs.locator('.breadcrumb-link')).toContainText('Dashboard');

    // Verify configuration panels are visible (ConfigPanel uses .config-panel class)
    const panels = page.locator('.config-panel');
    expect(await panels.count()).toBeGreaterThanOrEqual(4);

    // Verify all panel types are present
    await expect(page.locator('.config-panel.agents-panel')).toBeVisible();
    await expect(page.locator('.config-panel.commands-panel')).toBeVisible();
    await expect(page.locator('.config-panel.hooks-panel')).toBeVisible();
    await expect(page.locator('.config-panel.mcp-panel')).toBeVisible();

    // STEP 6: User navigates back to dashboard via breadcrumb link
    const dashboardLink = page.locator('.breadcrumb-link');
    await dashboardLink.click();

    // Verify we're back on the dashboard
    await page.waitForURL('/');
    await expect(page).toHaveTitle(/Claude Code Manager/i);

    // Verify project cards are still visible (User card + project cards)
    await page.waitForSelector('.project-card', { timeout: 10000 });
    const projectCardsAfterReturn = page.locator('.project-card');
    // May have 2 cards (if user config load failed/timed out) or 3 cards (if user config loaded)
    const cardCount = await projectCardsAfterReturn.count();
    expect(cardCount).toBeGreaterThanOrEqual(2); // At minimum: 2 project cards
    expect(cardCount).toBeLessThanOrEqual(3); // At maximum: User card + 2 projects
  });

  // Test 101.001.002: project discovery with empty state
  test('101.001.002: project discovery with empty state', async ({ page }) => {
    // Mock empty projects response
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: []
        })
      });
    });

    // Mock user stats to fail - this ensures empty state is shown
    // If user stats load successfully, the User card will show and empty state won't appear
    await page.route('**/api/user/agents', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Mock error' })
      });
    });
    await page.route('**/api/user/commands', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Mock error' })
      });
    });
    await page.route('**/api/user/hooks', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Mock error' })
      });
    });
    await page.route('**/api/user/mcp', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Mock error' })
      });
    });

    await page.goto('/');

    // Verify empty state is displayed
    const emptyState = page.locator('.empty-state');
    await expect(emptyState).toBeVisible({ timeout: 10000 });
    await expect(emptyState).toContainText('No Projects Found');
    // Note: EmptyState component uses straight quotes in the message prop
    await expect(emptyState).toContainText("Add projects in Claude Code and click 'Rescan' to see them here.");
  });

  // Test 101.001.003: project discovery with API errors shows helpful message
  test('101.001.003: project discovery with API errors shows helpful message', async ({ page }) => {
    // Mock API error
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Failed to read ~/.claude.json'
        })
      });
    });

    await page.goto('/');

    // Verify error state is displayed
    const errorState = page.locator('.error-state');
    await expect(errorState).toBeVisible({ timeout: 10000 });
    await expect(errorState).toContainText('Error Loading Projects');

    // Verify retry button is available
    const retryButton = page.locator('.retry-btn');
    await expect(retryButton).toBeVisible();
  });

  // Test 101.001.004: loading state displays while fetching projects
  test('101.001.004: loading state displays while fetching projects', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/projects', async (route) => {
      requestCount++;
      // Add delay to observe loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'testproject',
              name: 'Test Project',
              path: '/test/project',
              stats: { agents: 1, commands: 1, hooks: 1, mcp: 1 }
            }
          ]
        })
      });
    });

    // Mock user stats
    await page.route('**/api/user/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/user/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/user/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/user/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    await page.goto('/');

    // Loading state should appear briefly - LoadingState component uses .loading-state class
    const loadingState = page.locator('.loading-state');
    await expect(loadingState).toBeVisible({ timeout: 500 });
    await expect(loadingState).toContainText('Loading projects...');

    // Eventually projects should load
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Loading state should be hidden
    await expect(loadingState).not.toBeVisible();

    // Clean up
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  // Test 101.001.005: performance: dashboard loads in under 2 seconds
  test('101.001.005: performance: dashboard loads in under 2 seconds', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: Array.from({ length: 10 }, (_, i) => ({
            id: `project${i}`,
            name: `Project ${i}`,
            path: `/path/to/project${i}`,
            stats: { agents: i, commands: i * 2, hooks: i % 3, mcp: i % 2 }
          }))
        })
      });
    });

    // Mock user stats for the User card
    await page.route('**/api/user/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/user/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/user/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/user/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    const startTime = Date.now();
    await page.goto('/');

    // Wait for content to be fully loaded (project cards use Tailwind grid)
    await page.waitForSelector('.project-card', { timeout: 10000 });

    const loadTime = Date.now() - startTime;

    // Assert load time is under 2 seconds (2000ms)
    expect(loadTime).toBeLessThan(2000);

    // Verify all projects rendered (User card + 10 projects = 11 total)
    const projectCards = page.locator('.project-card');
    expect(await projectCards.count()).toBe(11);
  });

  // Test 101.001.006: no console errors during project discovery flow
  test('101.001.006: no console errors during project discovery flow', async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Filter out expected errors from mocks/route handling
        const text = msg.text();
        if (!text.includes('Failed to load resource') &&
            !text.includes('HTTP error! status:') &&
            !text.includes('Error loading agents:') &&
            !text.includes('Error loading commands:') &&
            !text.includes('Error loading hooks:') &&
            !text.includes('Error loading MCP servers:') &&
            !text.includes('net::ERR') &&
            !text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'cleanproject',
              name: 'Clean Project',
              path: '/clean/project',
              stats: { agents: 1, commands: 1, hooks: 1, mcp: 1 }
            }
          ]
        })
      });
    });

    // Mock user stats
    await page.route('**/api/user/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/user/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/user/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/user/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Mock project detail API endpoints
    await page.route('**/api/projects/cleanproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/projects/cleanproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/projects/cleanproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/projects/cleanproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Execute full flow
    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Click actual project card (not User card at index 0)
    const projectCard = page.locator('.project-card').nth(1);
    await projectCard.click();

    // Phase 2: Wait for Vue Router navigation
    await page.waitForURL(/\/project\/cleanproject/, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Navigate back via breadcrumb link
    const dashboardLink = page.locator('.breadcrumb-link');
    await dashboardLink.click();
    await page.waitForURL('/');

    // Verify no errors occurred
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
