const { test, expect } = require('@playwright/test');

/**
 * Frontend Visual Tests: 300-Visual Regression Testing
 *
 * Test Suites:
 *   300.001 - Dashboard visual regression
 *   300.002 - Dashboard dark/light mode
 *   300.003 - Project detail view visual regression
 *   300.004 - Dashboard components
 *   300.005 - Responsive design
 *   300.006 - Interactive states
 *
 * Numbering Format: 300.SUITE.TEST
 *
 * Phase 2 (Vue SPA) Architecture:
 * - URLs: /project/:id (Vue Router, not /project-detail.html?id=X)
 * - API: Vite proxy → Express backend
 * - Selectors: .breadcrumbs (on detail pages), .project-grid, .config-card
 * - Navigation: Client-side (no page reloads), breadcrumbs for back navigation
 * - State: Pinia stores
 *
 * Uses Playwright's built-in screenshot comparison to detect unintended visual changes.
 * Baseline screenshots are stored in tests/frontend/visual/*.spec.js-snapshots/
 *
 * To update baselines after intentional UI changes:
 *   npx playwright test --update-snapshots visual-regression.spec.js
 */

// Test Suite 300.001: Dashboard Visual Regression
test.describe('300.001: Visual Regression - Dashboard', () => {
  test('300.001.001: dashboard renders correctly with projects', async ({ page }) => {
    // Mock API response with project data
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'homeuserprojectsa',
              name: 'Project A',
              path: '/home/user/projects/a',
              stats: {
                agents: 3,
                commands: 5,
                hooks: 2,
                mcp: 1
              }
            },
            {
              id: 'homeuserprojectsb',
              name: 'Project B',
              path: '/home/user/projects/b',
              stats: {
                agents: 1,
                commands: 8,
                hooks: 0,
                mcp: 2
              }
            }
          ]
        })
      });
    });

    // Mock user API endpoints
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

    // Wait for projects to load (Dashboard h2 heading)
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Take full page screenshot
    await expect(page).toHaveScreenshot('dashboard-with-projects.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('300.001.002: dashboard loading state', async ({ page }) => {
    // Delay API response to capture loading state
    await page.route('**/api/projects', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: []
        })
      });
    });

    // Mock user endpoints for loading state
    await page.route('**/api/user/agents', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/user/commands', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/user/hooks', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/user/mcp', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    await page.goto('/');

    // Wait for loading state to appear
    await page.waitForSelector('.loading-spinner', { timeout: 2000 }).catch(() => {
      // Loading state may be very brief, that's okay
    });

    // Capture loading state screenshot
    await expect(page).toHaveScreenshot('dashboard-loading-state.png', {
      fullPage: true,
      maxDiffPixels: 50
    });

    // Clean up route
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('300.001.003: dashboard error state', async ({ page }) => {
    // Mock API error
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal Server Error'
        })
      });
    });

    // Mock user endpoints
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

    // Wait for error state (may be displayed as a notification or alert)
    await page.waitForSelector('.error-notification', { timeout: 10000 }).catch(() => {
      // Error may be displayed differently, that's okay
    });

    // Capture error state screenshot
    await expect(page).toHaveScreenshot('dashboard-error-state.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('300.001.004: dashboard empty state', async ({ page }) => {
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

    // Mock user endpoints
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

    // Wait for page to load (Dashboard h2 heading)
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Capture empty state screenshot
    await expect(page).toHaveScreenshot('dashboard-empty-state.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
});

// Test Suite 300.002: Dashboard Dark/Light Mode
test.describe('300.002: Visual Regression - Dashboard Dark/Light Mode', () => {
  test('300.002.001: dashboard in dark mode', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'homeuserprojectsdark',
              name: 'Dark Mode Project',
              path: '/home/user/projects/dark-project',
              stats: { agents: 2, commands: 3, hooks: 1, mcp: 0 }
            }
          ]
        })
      });
    });

    // Mock user endpoints
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
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Ensure dark mode is active
    const appContainer = page.locator('#app[data-theme]');
    const theme = await appContainer.getAttribute('data-theme');
    if (theme !== 'dark') {
      await page.click('button[aria-label="Toggle theme"]');
      await page.waitForTimeout(200);
    }

    // Capture dark mode screenshot
    await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('300.002.002: dashboard in light mode', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'homeuserprojectslight',
              name: 'Light Mode Project',
              path: '/home/user/projects/light-project',
              stats: { agents: 2, commands: 3, hooks: 1, mcp: 0 }
            }
          ]
        })
      });
    });

    // Mock user endpoints
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
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Switch to light mode
    const appContainer = page.locator('#app[data-theme]');
    const theme = await appContainer.getAttribute('data-theme');
    if (theme !== 'light') {
      await page.click('button[aria-label="Toggle theme"]');
      await page.waitForTimeout(200);
    }

    // Capture light mode screenshot
    await expect(page).toHaveScreenshot('dashboard-light-mode.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
});

// Test Suite 300.003: Project Detail View Visual Regression
test.describe('300.003: Visual Regression - Project Detail View', () => {
  test('300.003.001: project detail view renders correctly', async ({ page }) => {
    const projectId = 'homeuserprojectdetail';

    // Mock projects list
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: projectId,
              name: 'Detail View Project',
              path: '/home/user/projects/detail-project',
              stats: {
                agents: 5,
                commands: 12,
                hooks: 3,
                mcp: 2
              }
            }
          ]
        })
      });
    });

    // Mock project detail endpoints
    await page.route(`**/api/projects/${projectId}/agents`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/commands`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/hooks`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/mcp`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Navigate to project detail using Vue Router path
    await page.goto(`/project/${projectId}`);
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Capture full project detail page
    await expect(page).toHaveScreenshot('project-detail-view.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('300.003.002: project detail view with warnings', async ({ page }) => {
    const projectId = 'homeuserprojectwarning';

    // Mock projects list with warnings
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: projectId,
              name: 'Warning Project',
              path: '/home/user/projects/warning-project',
              stats: { agents: 2, commands: 3, hooks: 1, mcp: 0 }
            }
          ],
          warnings: [
            'Warning 1: Could not parse agent file',
            'Warning 2: Missing settings.json',
            'Warning 3: Malformed MCP configuration'
          ]
        })
      });
    });

    // Mock project detail endpoints
    await page.route(`**/api/projects/${projectId}/agents`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/commands`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/hooks`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/mcp`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Navigate using Vue Router path
    await page.goto(`/project/${projectId}`);

    // Wait for warnings to be displayed (if warning banner exists)
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Capture project detail with warnings
    await expect(page).toHaveScreenshot('project-detail-with-warnings.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('300.003.003: project detail loading state', async ({ page }) => {
    const projectId = 'homeuserprojectloading';

    // Delay all project endpoints
    await page.route('**/api/projects', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: projectId,
              name: 'Loading Project',
              path: '/home/user/projects/loading',
              stats: { agents: 0, commands: 0, hooks: 0, mcp: 0 }
            }
          ]
        })
      });
    });

    // Delay detail endpoints
    await page.route(`**/api/projects/${projectId}/agents`, async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/commands`, async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/hooks`, async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/mcp`, async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Navigate using Vue Router path
    await page.goto(`/project/${projectId}`);

    // Wait for loading state
    await page.waitForSelector('.loading-spinner', { timeout: 2000 }).catch(() => {
      // Loading state may be very brief
    });

    // Capture loading state
    await expect(page).toHaveScreenshot('project-detail-loading.png', {
      fullPage: true,
      maxDiffPixels: 50
    });

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('300.003.004: project detail error state', async ({ page }) => {
    const projectId = 'homeuserprojectexisting';
    const nonexistentId = 'nonexistent';

    // Mock projects list with one valid project
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: projectId,
              name: 'Existing Project',
              path: '/home/user/projects/existing',
              stats: { agents: 0, commands: 0, hooks: 0, mcp: 0 }
            }
          ]
        })
      });
    });

    // Mock error responses for non-existent project detail endpoints
    await page.route(`**/api/projects/${nonexistentId}/agents`, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Project not found' })
      });
    });
    await page.route(`**/api/projects/${nonexistentId}/commands`, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Project not found' })
      });
    });
    await page.route(`**/api/projects/${nonexistentId}/hooks`, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Project not found' })
      });
    });
    await page.route(`**/api/projects/${nonexistentId}/mcp`, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Project not found' })
      });
    });

    // Navigate to non-existent project using Vue Router
    await page.goto('/project/nonexistent');

    // Wait for error state to appear (project not found shows error, not config panels)
    await page.waitForSelector('.pi-exclamation-triangle', { timeout: 10000 });

    // Wait a bit for all async content to render
    await page.waitForTimeout(500);

    // Capture error state (page will show error state for project not found)
    await expect(page).toHaveScreenshot('project-detail-error.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
});

// Test Suite 300.004: Dashboard Components
test.describe('300.004: Visual Regression - Dashboard Components', () => {
  test('300.004.001: project card component', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'homeuserprojectcard',
              name: 'Card Component Test',
              path: '/home/user/projects/card-test',
              stats: {
                agents: 7,
                commands: 14,
                hooks: 5,
                mcp: 3
              }
            }
          ]
        })
      });
    });

    // Mock user endpoints
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
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Capture a project card (skip User card at index 0, get first project card)
    const projectCards = page.locator('.project-card');
    const projectCard = projectCards.nth(1);
    await expect(projectCard).toHaveScreenshot('project-card-component.png', {
      maxDiffPixels: 50
    });
  });

  test('300.004.002: header component', async ({ page }) => {
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

    // Mock user endpoints
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
    await page.waitForSelector('header', { timeout: 10000 });

    // Capture header component
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header-component.png', {
      maxDiffPixels: 50
    });
  });

  test('300.004.003: navigation component on detail page', async ({ page }) => {
    const projectId = 'homeuserprojectbread';

    // Mock projects list
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: projectId,
              name: 'Breadcrumb Test Project',
              path: '/home/user/projects/breadcrumb-test',
              stats: { agents: 1, commands: 1, hooks: 1, mcp: 1 }
            }
          ]
        })
      });
    });

    // Mock project detail endpoints
    await page.route(`**/api/projects/${projectId}/agents`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/commands`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/hooks`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/mcp`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Navigate to detail page using Vue Router
    await page.goto(`/project/${projectId}`);
    await page.waitForSelector('.p-breadcrumb', { timeout: 10000 });

    // Capture breadcrumbs component (Phase 2 navigation - PrimeVue component)
    const breadcrumbs = page.locator('.p-breadcrumb');
    await expect(breadcrumbs).toHaveScreenshot('breadcrumbs-component.png', {
      maxDiffPixels: 50
    });
  });
});

// Test Suite 300.005: Responsive Design
test.describe('300.005: Visual Regression - Responsive Design', () => {
  test('300.005.001: dashboard mobile viewport', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'homeuserprojectmobile',
              name: 'Mobile Test',
              path: '/home/user/projects/mobile',
              stats: { agents: 2, commands: 3, hooks: 1, mcp: 0 }
            }
          ]
        })
      });
    });

    // Mock user endpoints
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

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Capture mobile view
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('300.005.002: dashboard tablet viewport', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'homeuserprojecttablet',
              name: 'Tablet Test',
              path: '/home/user/projects/tablet',
              stats: { agents: 3, commands: 5, hooks: 2, mcp: 1 }
            }
          ]
        })
      });
    });

    // Mock user endpoints
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

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Capture tablet view
    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('300.005.003: project detail mobile viewport', async ({ page }) => {
    const projectId = 'homeuserprojectdetailmobile';

    // Mock projects list
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: projectId,
              name: 'Detail Mobile Test',
              path: '/home/user/projects/detail-mobile',
              stats: { agents: 4, commands: 6, hooks: 2, mcp: 1 }
            }
          ]
        })
      });
    });

    // Mock project detail endpoints
    await page.route(`**/api/projects/${projectId}/agents`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/commands`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/hooks`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/mcp`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate using Vue Router
    await page.goto(`/project/${projectId}`);
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Capture mobile detail view
    await expect(page).toHaveScreenshot('project-detail-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
});

// Test Suite 300.006: Interactive States
test.describe('300.006: Visual Regression - Interactive States', () => {
  test('300.006.001: project card hover state', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'homeuserprojecthover',
              name: 'Hover Test Project',
              path: '/home/user/projects/hover-test',
              stats: { agents: 2, commands: 3, hooks: 1, mcp: 0 }
            }
          ]
        })
      });
    });

    // Mock user endpoints
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
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Hover over a project card (skip User card at index 0)
    const projectCards = page.locator('.project-card');
    const projectCard = projectCards.nth(1);
    await projectCard.hover();
    await page.waitForTimeout(200); // Wait for hover transition

    // Capture hover state
    await expect(projectCard).toHaveScreenshot('project-card-hover.png', {
      maxDiffPixels: 50
    });
  });

  test('300.006.002: theme toggle button hover state', async ({ page }) => {
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

    // Mock user endpoints
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
    await page.waitForSelector('button[aria-label="Toggle theme"]', { timeout: 10000 });

    // Hover over theme toggle
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    await themeToggle.hover();
    await page.waitForTimeout(200);

    // Capture hover state
    await expect(themeToggle).toHaveScreenshot('theme-toggle-hover.png', {
      maxDiffPixels: 30
    });
  });

  test('300.006.003: navigation link hover state', async ({ page }) => {
    const projectId = 'homeuserprojectnav';

    // Mock projects list
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: projectId,
              name: 'Navigation Hover Test',
              path: '/home/user/projects/nav-hover',
              stats: { agents: 1, commands: 1, hooks: 1, mcp: 1 }
            }
          ]
        })
      });
    });

    // Mock project detail endpoints
    await page.route(`**/api/projects/${projectId}/agents`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/commands`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/hooks`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route(`**/api/projects/${projectId}/mcp`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Navigate to detail page using Vue Router
    await page.goto(`/project/${projectId}`);
    await page.waitForSelector('.p-breadcrumb', { timeout: 10000 });

    // Hover over Dashboard breadcrumb link (PrimeVue breadcrumb uses anchor tags)
    const breadcrumbLink = page.locator('.p-breadcrumb a');
    await breadcrumbLink.hover();
    await page.waitForTimeout(200);

    // Capture hover state
    await expect(breadcrumbLink).toHaveScreenshot('breadcrumb-link-hover.png', {
      maxDiffPixels: 30
    });
  });
});
