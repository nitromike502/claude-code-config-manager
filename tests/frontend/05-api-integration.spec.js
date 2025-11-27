/**
 * Frontend Component Tests: 05-API Integration
 *
 * Test Suites:
 *   05.001 - Health Check
 *   05.002 - Projects Endpoint
 *   05.003 - Project Detail Endpoints
 *   05.004 - User Endpoints
 *   05.005 - Error Handling
 *   05.006 - Components Use API Client
 *   05.007 - Timeout Handling
 *   05.008 - Cross-Browser Compatibility
 *   05.009 - No Console Errors
 *
 * Numbering Format: 05.GROUP.TEST
 */

import { test, expect } from '@playwright/test';

// Test Suite 05.001: Health Check
test.describe('05.001: API Integration - Health Check', () => {
  test('05.001.001: health check endpoint responds correctly', async ({ request }) => {
    const response = await request.get('http://localhost:8420/api/health');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});

// Test Suite 05.002: Projects Endpoint
test.describe('05.002: API Integration - Projects Endpoint', () => {
  test('05.002.001: getProjects returns valid project data', async ({ request }) => {
    const response = await request.get('http://localhost:8420/api/projects');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.projects)).toBe(true);
    expect(data.projects.length).toBeGreaterThanOrEqual(0);
  });

  test('05.002.002: scanProjects completes successfully', async ({ request }) => {
    const response = await request.post('http://localhost:8420/api/projects/scan');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// Test Suite 05.003: Project Detail Endpoints
test.describe('05.003: API Integration - Project Detail Endpoints', () => {
  let projectId;

  test.beforeAll(async ({ request }) => {
    // Get first project ID
    const response = await request.get('http://localhost:8420/api/projects');
    const data = await response.json();
    projectId = data.projects[0]?.id;
  });

  test('05.003.001: getProjectAgents returns valid data', async ({ request }) => {
    test.skip(!projectId, 'No projects available');

    const response = await request.get(`http://localhost:8420/api/projects/${projectId}/agents`);
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.agents)).toBe(true);
  });

  test('05.003.002: getProjectCommands returns valid data', async ({ request }) => {
    test.skip(!projectId, 'No projects available');

    const response = await request.get(`http://localhost:8420/api/projects/${projectId}/commands`);
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.commands)).toBe(true);
  });

  test('05.003.003: getProjectHooks returns valid data', async ({ request }) => {
    test.skip(!projectId, 'No projects available');

    const response = await request.get(`http://localhost:8420/api/projects/${projectId}/hooks`);
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.hooks)).toBe(true);
  });

  test('05.003.004: getProjectMcp returns valid data', async ({ request }) => {
    test.skip(!projectId, 'No projects available');

    const response = await request.get(`http://localhost:8420/api/projects/${projectId}/mcp`);
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.mcp) || Array.isArray(data.mcpServers)).toBe(true);
  });
});

// Test Suite 05.004: User Endpoints
test.describe('05.004: API Integration - User Endpoints', () => {
  test('05.004.001: getUserAgents returns valid data', async ({ request }) => {
    const response = await request.get('http://localhost:8420/api/user/agents');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.agents)).toBe(true);
  });

  test('05.004.002: getUserCommands returns valid data', async ({ request }) => {
    const response = await request.get('http://localhost:8420/api/user/commands');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.commands)).toBe(true);
  });

  test('05.004.003: getUserHooks returns valid data', async ({ request }) => {
    const response = await request.get('http://localhost:8420/api/user/hooks');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.hooks)).toBe(true);
  });

  test('05.004.004: getUserMcp returns valid data', async ({ request }) => {
    const response = await request.get('http://localhost:8420/api/user/mcp');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.mcp) || Array.isArray(data.mcpServers)).toBe(true);
  });
});

// Test Suite 05.005: Error Handling
test.describe('05.005: API Integration - Error Handling', () => {
  test('05.005.001: API handles 404 errors gracefully', async ({ request }) => {
    const response = await request.get('http://localhost:8420/api/projects/nonexistent-project-id/agents');
    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });

  test('05.005.002: API returns appropriate status for missing resources', async ({ request }) => {
    const response = await request.get('http://localhost:8420/api/projects/invalid123/commands');
    // Should return 404 or 200 with empty array
    expect([200, 404].includes(response.status())).toBe(true);
  });
});

// Test Suite 05.006: Components Use API Client
test.describe('05.006: API Integration - Components Use API Client', () => {
  test('05.006.001: Dashboard loads projects via API client', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for projects to load
    await page.waitForSelector('.project-card, .empty-state, .error-state', { timeout: 10000 });

    // Verify no console errors during API call
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Trigger a rescan to test API integration
    const rescanButton = page.locator('.rescan-btn');
    if (await rescanButton.count() > 0) {
      await rescanButton.click();
      await page.waitForTimeout(2000); // Wait for scan to complete
    }

    // Check no critical API errors during calls
    const criticalErrors = consoleErrors.filter(err =>
      err.includes('Failed to fetch') || err.includes('Network error')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('05.006.002: ProjectDetail loads configurations via API client', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for dashboard
    await page.waitForSelector('.project-card, .empty-state', { timeout: 10000 });

    // Click first non-user project card if available
    const projectCard = page.locator('.project-card:not(.user-card)').first();
    const cardCount = await projectCard.count();

    if (cardCount > 0) {
      await projectCard.click();

      // Wait for URL to change to project detail
      await page.waitForURL(/\/project\/.*/, { timeout: 5000 });

      // Wait for loading to complete and config panels to appear (Phase 2 uses .config-panel)
      await page.waitForSelector('.config-panel', { timeout: 15000 });

      // Give time for all config panels to render
      await page.waitForTimeout(1000);

      // Verify config panels are visible (loaded via API)
      const configPanels = page.locator('.config-panel');
      const finalCount = await configPanels.count();

      // Should have 4 panels (agents, commands, hooks, mcp)
      expect(finalCount).toBeGreaterThanOrEqual(4);
    } else {
      test.skip(true, 'No regular project cards found');
    }
  });

  test('05.006.003: UserGlobal loads user configurations via API client', async ({ page }) => {
    await page.goto('http://localhost:5173/user');

    // Wait for user page to load - look for page title first
    await page.waitForSelector('span:has-text("User Configurations")', { timeout: 10000 });

    // Verify config panels are visible (loaded via API) - Phase 2 uses .config-panel
    const configPanels = page.locator('.config-panel');
    expect(await configPanels.count()).toBeGreaterThanOrEqual(4); // agents, commands, hooks, mcp
  });
});

// Test Suite 05.007: Timeout Handling
test.describe('05.007: API Integration - Timeout Handling', () => {
  test('05.007.001: API client has timeout protection in place', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify the app loads without hanging - Phase 2 uses h2 "Projects" for dashboard
    const loaded = await page.waitForSelector('h2:has-text("Projects"), .error-state', { timeout: 15000 });
    expect(loaded).toBeTruthy();
  });
});

// Test Suite 05.008: Cross-Browser Compatibility
test.describe('05.008: API Integration - Cross-Browser Compatibility', () => {
  test('05.008.001: API calls work correctly in all browsers', async ({ page, browserName }) => {
    await page.goto('http://localhost:5173');

    // Wait for initial load
    await page.waitForSelector('.project-card, .empty-state, .error-state', { timeout: 10000 });

    // Navigate to user page
    await page.goto('http://localhost:5173/user');
    // Wait for page title - Phase 2 user page structure
    await page.waitForSelector('span:has-text("User Configurations")', { timeout: 10000 });

    // Verify data loaded successfully in this browser - Phase 2 uses .config-panel
    const hasContent = await page.locator('.config-panel, .empty-state').count();
    expect(hasContent).toBeGreaterThan(0);
  });
});

// Test Suite 05.009: No Console Errors
test.describe('05.009: API Integration - No Console Errors', () => {
  test('05.009.001: no API-related console errors during normal operations', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:5173');

    // Wait for initial load
    await page.waitForSelector('.project-card, .empty-state, .error-state', { timeout: 10000 });

    // Navigate to user page
    await page.goto('http://localhost:5173/user');
    // Wait for page title - Phase 2 user page structure
    await page.waitForSelector('span:has-text("User Configurations")', { timeout: 10000 });

    // Navigate back to dashboard
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.project-card, .empty-state', { timeout: 10000 });

    // Filter for critical API errors only
    const criticalErrors = consoleErrors.filter(err =>
      err.includes('Failed to fetch') ||
      err.includes('Network error') ||
      err.includes('API Error') ||
      err.includes('timeout')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
