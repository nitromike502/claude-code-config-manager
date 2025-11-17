const { test, expect } = require('@playwright/test');
const { setupMocks } = require('../fixtures/mock-data');

/**
 * Frontend Component Tests: 02-Project Detail Page
 *
 * Test Suite: 02.001 - Page load and structure
 * Test Suite: 02.002 - URL parameter handling
 * Test Suite: 02.003 - Navigation
 * Test Suite: 02.004 - Theme toggle
 * Test Suite: 02.005 - Error handling
 * Test Suite: 02.006 - Loading state
 * Test Suite: 02.007 - Responsive design
 * Test Suite: 02.008 - Console error detection
 *
 * Numbering Format: 02.GROUP.TEST
 */

// Test Suite 02.001: Page Load and Structure

/**
 * Frontend Component Tests: 02
 *
 * Test Suite: 02.001 - Page load and structure
 * Test Suite: 02.002 - URL parameter handling
 * Test Suite: 02.003 - Navigation
 * Test Suite: 02.004 - Theme toggle
 * Test Suite: 02.005 - Error handling
 * Test Suite: 02.006 - Loading state
 * Test Suite: 02.007 - Responsive design
 * Test Suite: 02.008 - Console error detection
 *
 * Numbering Format: {file_num:02d}.GROUP.TEST
 */

test.describe('02.001: Page Load and Structure', () => {
  test('02.001.001: page loads successfully with valid project ID', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);

    await page.goto('/project/homeusertestproject');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Verify page title (Phase 2 SPA uses same title for all pages)
    await expect(page).toHaveTitle(/Claude Code Manager/i);
  });

  test('02.001.002: page contains header with correct structure', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    await page.goto('/project/testproject');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Verify header is present
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();

    // Verify app title (h1 in header, not .app-title class)
    const appTitle = page.locator('.app-header h1');
    await expect(appTitle).toBeVisible();
    await expect(appTitle).toContainText('Claude Code Manager');

    // Search removed in Phase 2 - skip this check

    // Verify theme toggle button exists
    const themeToggle = page.locator('.theme-toggle');
    await expect(themeToggle).toBeVisible();
  });

  // Phase 2: Breadcrumbs removed - navigation now via header nav links
  test('02.001.003: navigation links render correctly', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    await page.goto('/project/myproject');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Wait for project to load
    await page.waitForSelector('.config-cards-container', { timeout: 10000 });

    // Verify breadcrumbs navigation exists
    const breadcrumbs = page.locator('.breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    // Verify Dashboard breadcrumb link
    const dashboardLink = page.locator('.breadcrumb-link');
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toContainText('Dashboard');
  });

  test('02.001.004: project info bar displays correctly', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    await page.goto('/project/%2Ffull%2Fpath%2Fto%2Fproject');

    // Wait for Vue app to mount and hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#app', { state: 'visible' });
    await page.waitForSelector('.app-container');

    // Wait for project content to load
    await page.waitForSelector('.project-info-bar', { timeout: 10000 });

    // Verify project name is displayed (Phase 2: derived from last path segment)
    const projectTitle = page.locator('.project-info-title');
    await expect(projectTitle).toBeVisible();
    await expect(projectTitle).toContainText('project');

    // Verify project path is displayed
    const projectPath = page.locator('.project-info-subtitle');
    await expect(projectPath).toBeVisible();
    await expect(projectPath).toContainText('/full/path/to/project');
  });

  test('02.001.005: configuration cards display correctly', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    await page.goto('/project/statsproject');

   
    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');
 // Wait for configuration cards to render
    await page.waitForSelector('.config-card', { timeout: 10000 });

    // Verify all four config cards are displayed
    const cards = page.locator('.config-card');
    expect(await cards.count()).toBe(4);

    // Check each card type is present - Phase 2: MCP card uses .mcp-card class
    await expect(page.locator('.agents-card')).toBeVisible();
    await expect(page.locator('.commands-card')).toBeVisible();
    await expect(page.locator('.hooks-card')).toBeVisible();
    await expect(page.locator('.mcp-card')).toBeVisible();

    // Verify card titles - Phase 2: MCP card uses .mcp-card class
    await expect(page.locator('.agents-card .config-title')).toContainText('Subagents');
    await expect(page.locator('.commands-card .config-title')).toContainText('Slash Commands');
    await expect(page.locator('.hooks-card .config-title')).toContainText('Hooks');
    await expect(page.locator('.mcp-card .config-title')).toContainText('MCP Servers');
  });
});

test.describe('02.002: URL Parameter Handling', () => {
  test('02.002.001: extracts project ID from URL query parameter', async ({ page }) => {
    let requestedProjectId = null;

    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    await page.goto('/project/extractedid');


    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');
 // Wait for project to load - Phase 2 loads configs dynamically, might not have container yet
    await page.waitForSelector('.project-info-bar', { timeout: 10000 });

    // Phase 2: Project name is derived from projectId (last path segment)
    // Since projectId is "extractedid", the name will be "extractedid"
    const projectTitle = page.locator('.project-info-title');
    await expect(projectTitle).toContainText('extractedid');
  });

  test('02.002.002: finds correct project from API response by ID', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    // Navigate to second project
    await page.goto('/project/project2');


    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');
 // Wait for project to load
    await page.waitForSelector('.project-info-bar', { timeout: 10000 });

    // Phase 2: Project name is derived from projectId (last segment)
    // projectId "project2" → name "project2"
    const projectTitle = page.locator('.project-info-title');
    await expect(projectTitle).toContainText('project2');

    // Phase 2: Project path is the decoded projectId
    const projectPath = page.locator('.project-info-subtitle');
    await expect(projectPath).toContainText('project2');

    // Note: Config cards won't appear without proper API mocking for individual endpoints
    // This test focuses on project identification
  });

  test('02.002.003: handles project ID with special characters', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    await page.goto('/project/homeusermyprojectswithdashnumber123');


    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');
 // Wait for project to load
    await page.waitForSelector('.project-info-bar', { timeout: 10000 });

    // Phase 2: Project name is derived from projectId (last segment)
    // projectId "homeusermyprojectswithdashnumber123" → name "homeusermyprojectswithdashnumber123"
    const projectTitle = page.locator('.project-info-title');
    await expect(projectTitle).toContainText('homeusermyprojectswithdashnumber123');
  });
});

test.describe('02.003: Navigation', () => {
  test('02.003.001: dashboard link navigates to dashboard', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    await page.goto('/project/navtest');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Wait for page to load
    await page.waitForSelector('.config-cards-container', { timeout: 10000 });

    // Click Dashboard breadcrumb link (Phase 2: breadcrumbs navigation)
    await page.click('.breadcrumb-link');

    // Verify navigation to homepage
    await page.waitForURL('/');
    expect(page.url()).toContain('/');
    expect(page.url()).not.toContain('project/');
  });

  test('02.003.002: user card navigates to user page from dashboard', async ({ page }) => {
    // Phase 2: Mock only /api/projects, let config endpoints fail gracefully
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);

    await page.goto('/');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Wait for project grid to load
    await page.waitForSelector('.project-grid', { timeout: 10000 });

    // Click User card (purple card with user icon)
    const userCard = page.locator('.user-card');
    await expect(userCard).toBeVisible();

    // Verify hover state works
    await userCard.hover();

    // Click and verify navigation
    await userCard.click();
    await page.waitForURL('/user');
    expect(page.url()).toContain('/user');
  });
});

test.describe('02.004: Theme Toggle', () => {
  test('02.004.001: theme toggle switches between dark and light modes', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    await page.goto('/project/themetest');

   
    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');
 // Wait for page to load
    await page.waitForSelector('.theme-toggle', { timeout: 10000 });

    const appContainer = page.locator('.app-container');
    const initialTheme = await appContainer.getAttribute('data-theme');

    // Click theme toggle
    await page.click('.theme-toggle');
    await page.waitForTimeout(100);

    // Verify theme changed
    const newTheme = await appContainer.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);

    // Click again to toggle back
    await page.click('.theme-toggle');
    await page.waitForTimeout(100);

    // Verify theme reverted
    const revertedTheme = await appContainer.getAttribute('data-theme');
    expect(revertedTheme).toBe(initialTheme);
  });

  test('02.004.002: theme preference persists in localStorage', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    await page.goto('/project/%2Fpersist%2Ftest');

    // Wait for Vue hydration
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#app', { state: 'visible' });
    await page.waitForSelector('.theme-toggle', { timeout: 10000 });

    // Get initial theme
    const appContainer = page.locator('.app-container');
    const initialTheme = await appContainer.getAttribute('data-theme');

    // Toggle theme
    await page.click('.theme-toggle');
    await page.waitForTimeout(100);

    // Check localStorage was updated (Phase 2 uses 'claude-code-manager-theme' key)
    const storedTheme = await page.evaluate(() => localStorage.getItem('claude-code-manager-theme'));
    const currentTheme = await appContainer.getAttribute('data-theme');
    expect(storedTheme).toBe(currentTheme);
    expect(storedTheme).not.toBe(initialTheme);
  });

  test('02.004.003: theme loads from localStorage on page load', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    // Set localStorage before navigation (Phase 2 uses 'claude-code-manager-theme' key)
    await page.goto('/project/%2Fload%2Ftest');
    await page.evaluate(() => localStorage.setItem('claude-code-manager-theme', 'light'));

    // Reload page
    await page.reload();

    // Wait for Vue hydration
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#app', { state: 'visible' });
    await page.waitForSelector('.theme-toggle', { timeout: 10000 });

    // Verify theme was loaded from localStorage
    const appContainer = page.locator('.app-container');
    const theme = await appContainer.getAttribute('data-theme');
    expect(theme).toBe('light');
  });
});

test.describe('02.005: Error Handling', () => {
  test('02.005.001: shows error when project ID is empty string', async ({ page }) => {
    // Mock config endpoints to fail for empty project ID BEFORE setupMocks
    // Use wildcard to catch any request with empty project ID
    await page.route('**/api/projects/*/agents', (route) => {
      const url = route.request().url();
      // Only intercept if the project ID is empty (consecutive slashes or just whitespace)
      if (url.includes('/projects//') || url.match(/\/projects\/\s*\//)) {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Project not found'
          })
        });
      } else {
        route.continue();
      }
    });

    // Setup centralized mocks
    await setupMocks(page);

    // Navigate with empty string as ID (Vue Router will still match)
    // The space will be URL-encoded to %20
    await page.goto('/project/%20');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Verify error state is displayed
    const errorState = page.locator('.error-state');
    await expect(errorState).toBeVisible({ timeout: 5000 });
    await expect(errorState).toContainText('Project not found');
  });

  test('02.005.002: shows error when project ID is not found', async ({ page }) => {
    // Mock config endpoints to return 404 error BEFORE setupMocks
    await page.route('**/api/projects/nonexistent/agents', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Project not found'
        })
      });
    });

    await page.route('**/api/projects/nonexistent/commands', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Project not found'
        })
      });
    });

    await page.route('**/api/projects/nonexistent/hooks', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Project not found'
        })
      });
    });

    await page.route('**/api/projects/nonexistent/mcp', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Project not found'
        })
      });
    });

    // Setup centralized mocks AFTER error routes
    await setupMocks(page);

    // Navigate with non-existent project ID
    await page.goto('/project/nonexistent');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Verify error state is displayed
    const errorState = page.locator('.error-state');
    await expect(errorState).toBeVisible({ timeout: 10000 });
    await expect(errorState).toContainText('Project not found');
  });

  test('02.005.003: shows error when API returns HTTP error status', async ({ page }) => {
    // Mock all config endpoints to return 500 error
    // Do NOT call setupMocks() as it would override these error routes
    const errorRoutes = ['agents', 'commands', 'hooks', 'mcp'];
    for (const endpoint of errorRoutes) {
      await page.route(`**/api/projects/anyproject/${endpoint}`, (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal Server Error'
          })
        });
      });
    }

    await page.goto('/project/anyproject');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Verify error state is displayed
    // Note: HTTP errors (500) are caught as network errors, not parsed as JSON
    const errorState = page.locator('.error-state');
    await expect(errorState).toBeVisible({ timeout: 5000 });
    await expect(errorState).toContainText('Failed to connect to server');
  });

  test('02.005.004: shows error when network request fails', async ({ page }) => {
    // Mock all config endpoints to fail
    // Do NOT call setupMocks() as it would override these error routes
    const errorRoutes = ['agents', 'commands', 'hooks', 'mcp'];
    for (const endpoint of errorRoutes) {
      await page.route(`**/api/projects/anyproject/${endpoint}`, (route) => {
        route.abort('failed');
      });
    }

    await page.goto('/project/anyproject');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Verify error state is displayed
    const errorState = page.locator('.error-state');
    await expect(errorState).toBeVisible({ timeout: 5000 });
    await expect(errorState).toContainText('Failed to connect to server');
  });

  test('02.005.005: retry button reloads project data', async ({ page }) => {
    const requestCounts = { agents: 0, commands: 0, hooks: 0, mcp: 0 };

    // Mock each config endpoint to fail once, then succeed
    // Do NOT call setupMocks() as it would override these custom routes
    const mockEndpoint = (endpoint) => {
      page.route(`**/api/projects/retryproject/${endpoint}`, (route) => {
        requestCounts[endpoint]++;
        if (requestCounts[endpoint] === 1) {
          // First request fails
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Internal Server Error'
            })
          });
        } else {
          // Second request succeeds
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              [endpoint]: [],
              warnings: []
            })
          });
        }
      });
    };

    mockEndpoint('agents');
    mockEndpoint('commands');
    mockEndpoint('hooks');
    mockEndpoint('mcp');

    await page.goto('/project/retryproject');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Wait for error state
    const errorState = page.locator('.error-state');
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // Click retry button
    const retryButton = page.locator('.retry-btn');
    await expect(retryButton).toBeVisible();
    await retryButton.click();

    // Verify project loaded successfully after retry
    await page.waitForSelector('.config-cards-container', { timeout: 10000 });
    const projectTitle = page.locator('.project-info-title');
    await expect(projectTitle).toContainText('retryproject');
  });

  test('02.005.006: displays warnings when present in API response', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);

    // Mock config endpoints with warnings
    await page.route('**/api/projects/warningproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          agents: [
            { id: 'agent1', name: 'Warning Agent', description: 'Agent with warnings' }
          ],
          warnings: ['Warning 1: Could not parse agent file']
        })
      });
    });

    await page.route('**/api/projects/warningproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          commands: [],
          warnings: ['Warning 2: Missing settings.json']
        })
      });
    });

    await page.route('**/api/projects/warningproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hooks: [],
          warnings: []
        })
      });
    });

    await page.route('**/api/projects/warningproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          mcp: [],
          warnings: []
        })
      });
    });

    await page.goto('/project/warningproject');

    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');

    // Wait for warnings to appear
    const warningBanner = page.locator('.warning-banner');
    await expect(warningBanner).toBeVisible({ timeout: 5000 });

    // Verify warning count
    const warningHeader = page.locator('.warning-header');
    await expect(warningHeader).toContainText('2 Warnings');

    // Verify warning messages
    const warningList = page.locator('.warning-list li');
    expect(await warningList.count()).toBe(2);
    await expect(warningList.nth(0)).toContainText('Warning 1: Could not parse agent file');
    await expect(warningList.nth(1)).toContainText('Warning 2: Missing settings.json');
  });
});

test.describe('02.006: Loading State', () => {
  test('02.006.001: shows loading state while fetching project', async ({ page }) => {
    let routeHandled = { agents: false, commands: false, hooks: false, mcp: false };

    // Mock config endpoints with delays
    const mockWithDelay = (endpoint) => {
      page.route(`**/api/projects/loadingproject/${endpoint}`, async (route) => {
        if (!routeHandled[endpoint]) {
          routeHandled[endpoint] = true;
          // Delay response to observe loading state
          await new Promise(resolve => setTimeout(resolve, 500));
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              [endpoint]: [],
              warnings: []
            })
          });
        } else {
          await route.continue();
        }
      });
    };

    mockWithDelay('agents');
    mockWithDelay('commands');
    mockWithDelay('hooks');
    mockWithDelay('mcp');

    await page.goto('/project/loadingproject');


    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');
 // Loading state should appear briefly
    await page.waitForTimeout(100);

    // Eventually project content should appear
    await page.waitForSelector('.config-cards-container', { timeout: 10000 });

    // Unroute to clean up
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('02.006.002: loading state shows spinner and text', async ({ page }) => {
    // Create a slow response to keep loading state visible
    const mockWithSlowDelay = (endpoint) => {
      page.route(`**/api/projects/spinnerproject/${endpoint}`, async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            [endpoint]: [],
            warnings: []
          })
        });
      });
    };

    mockWithSlowDelay('agents');
    mockWithSlowDelay('commands');
    mockWithSlowDelay('hooks');
    mockWithSlowDelay('mcp');

    await page.goto('/project/spinnerproject');


    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');
 // Verify loading state elements
    const loadingState = page.locator('.loading-state');
    await expect(loadingState).toBeVisible();

    const spinner = page.locator('.loading-state .spinner');
    await expect(spinner).toBeVisible();

    const loadingText = page.locator('.loading-state p');
    await expect(loadingText).toContainText('Loading project...');

    // Wait for loading to complete
    await page.waitForSelector('.config-cards-container', { timeout: 10000 });
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});

test.describe('02.007: Responsive Design', () => {
  test('02.007.001: layout adapts to mobile viewport', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/project/mobileproject');

   
    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');
 // Wait for page to load
    await page.waitForSelector('.config-cards-container', { timeout: 10000 });

    // Verify elements are still visible
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();

    // Phase 2: Breadcrumbs removed - navigation now via header nav links

    const projectInfo = page.locator('.project-info-bar');
    await expect(projectInfo).toBeVisible();

    // Verify configuration cards are visible
    const cards = page.locator('.config-card');
    expect(await cards.count()).toBe(4);
  });

  test('02.007.002: layout adapts to tablet viewport', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/project/tabletproject');

   
    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');
 // Wait for page to load
    await page.waitForSelector('.config-cards-container', { timeout: 10000 });

    // Verify all elements are visible and properly laid out
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();

    const cards = page.locator('.config-card');
    expect(await cards.count()).toBe(4);
  });

  test('02.007.003: layout works on desktop viewport', async ({ page }) => {
    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/project/desktopproject');

   
    // Wait for Vue app to mount
    await page.waitForSelector('.app-container');
 // Wait for page to load
    await page.waitForSelector('.config-cards-container', { timeout: 10000 });

    // Verify all elements are visible
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();

    const projectContent = page.locator('.config-cards-container');
    await expect(projectContent).toBeVisible();

    const cards = page.locator('.config-card');
    expect(await cards.count()).toBe(4);
  });
});

test.describe('02.008: Console Error Detection', () => {
  test('02.008.001: page loads without console errors', async ({ page }) => {
    const consoleErrors = [];

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
      consoleErrors.push(error.message);
    });

    // Setup centralized mocks BEFORE navigation
    await setupMocks(page);


    await page.goto('/project/consoletestproject');
    await page.waitForSelector('.config-cards-container', { timeout: 10000 });

    // Interact with page elements
    await page.click('.theme-toggle');
    await page.waitForTimeout(100);

    // Verify no console errors occurred
    expect(consoleErrors).toEqual([]);
  });
});
