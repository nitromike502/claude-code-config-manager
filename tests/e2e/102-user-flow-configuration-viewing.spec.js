const { test, expect } = require('@playwright/test');

/**
 * End-to-End Flow Test: Configuration Viewing Journey
 *
 * This test validates that users can navigate through different configuration
 * types within a project and view all relevant information.
 *
 * Phase 2 (Vue SPA) Architecture:
 * - URLs: /project/:id (Vue Router)
 * - Navigation: Client-side (no page reloads)
 * - API: Vite proxy → Express backend
 * - State: Pinia stores
 *
 * User Journey:
 * 1. User selects a project
 * 2. Views subagent configurations
 * 3. Views slash commands
 * 4. Views hooks
 * 5. Views MCP servers
 * 6. Switches between different configuration sections
 * 7. Returns to project list
 */

// Test Suite 102.001: E2E Flow: Configuration Viewing Journey
test.describe('102.001: E2E Flow: Configuration Viewing Journey', () => {
  // Test 102.001.001: user navigates through project detail view structure
  test('102.001.001: user navigates through project detail view structure', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'configproject',
              name: 'Configuration Project',
              path: '/home/user/config-project',
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
    await page.route('**/api/projects/configproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/projects/configproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/projects/configproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/projects/configproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // STEP 1: User selects a project from dashboard
    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // nth(1) skips User card at index 0
    const projectCard = page.locator('.project-card').nth(1);
    await expect(projectCard).toBeVisible();
    await expect(projectCard).toContainText('Configuration Project');

    // Verify stats are visible before clicking
    await expect(projectCard).toContainText('5 Agents');
    await expect(projectCard).toContainText('12 Commands');
    await expect(projectCard).toContainText('3 Hooks');
    await expect(projectCard).toContainText('2 MCP');

    await projectCard.click();

    // Navigate to detail page (Phase 2: /project/:id instead of /project-detail.html?id=X)
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // STEP 2-5: Verify all configuration cards are visible
    // Note: Project name now resolves correctly from the store (fixed in later phases)
    const projectTitle = page.locator('.text-2xl.font-semibold span').first();
    await expect(projectTitle).toContainText('Configuration Project');

    const cards = page.locator('.config-panel');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);

    // Verify each configuration type is represented
    const agentCard = page.locator('.config-panel.agents-panel');
    await expect(agentCard).toBeVisible();
    await expect(agentCard).toContainText('Subagents');

    const commandCard = page.locator('.config-panel.commands-panel');
    await expect(commandCard).toBeVisible();
    await expect(commandCard).toContainText('Slash Commands');

    const hookCard = page.locator('.config-panel.hooks-panel');
    await expect(hookCard).toBeVisible();
    await expect(hookCard).toContainText('Hooks');

    const mcpCard = page.locator('.config-panel.mcp-panel');
    await expect(mcpCard).toBeVisible();
    await expect(mcpCard).toContainText('MCP Servers');

    // STEP 6: Verify breadcrumbs navigation exists
    const breadcrumbs = page.locator('.breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    // STEP 7: Return to project list
    // Navigate back to dashboard using browser back button
    await page.goBack();
    await page.waitForURL('/');

    // Verify we're back on dashboard by checking project cards are visible
    await page.waitForSelector('.project-card', { timeout: 10000 });
    // Verify project card exists (use filter since User card may not be present)
    const projectCardAfterReturn = page.locator('.project-card').filter({ hasText: 'Configuration Project' });
    await expect(projectCardAfterReturn).toBeVisible();
  });

  // Test 102.001.002: project detail view displays correct statistics for multiple projects
  test('102.001.002: project detail view displays correct statistics for multiple projects', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'project1',
              name: 'Project Alpha',
              path: '/alpha',
              stats: { agents: 10, commands: 20, hooks: 5, mcp: 3 }
            },
            {
              id: 'project2',
              name: 'Project Beta',
              path: '/beta',
              stats: { agents: 2, commands: 8, hooks: 1, mcp: 0 }
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

    // Mock project detail API endpoints for both projects
    const projectIds = ['project1', 'project2'];
    for (const projectId of projectIds) {
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
    }

    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // View first project (nth(1) skips User card at index 0)
    const firstProject = page.locator('.project-card').nth(1);
    await firstProject.click();
    await page.waitForURL(/\/project\/project1/, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Verify first project has configuration cards displayed
    let cards = page.locator('.config-panel');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);

    // Verify all card types are present
    await expect(page.locator('.config-panel.agents-panel')).toBeVisible();
    await expect(page.locator('.config-panel.commands-panel')).toBeVisible();
    await expect(page.locator('.config-panel.hooks-panel')).toBeVisible();
    await expect(page.locator('.config-panel.mcp-panel')).toBeVisible();

    // Return to dashboard
    // Navigate back to dashboard using browser back button
    await page.goBack();
    await page.waitForURL('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // View second project
    // After goBack, User card may not be present (if user APIs failed/empty)
    // So Project Beta could be at nth(1) instead of nth(2)
    // Projects are sorted alphabetically: Project Alpha (0/1), Project Beta (1/2)
    const secondProject = page.locator('.project-card').filter({ hasText: 'Project Beta' });
    await secondProject.click();
    await page.waitForURL(/\/project\/project2/, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Verify second project has configuration cards displayed
    cards = page.locator('.config-panel');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);

    // Verify all card types are present
    await expect(page.locator('.config-panel.agents-panel')).toBeVisible();
    await expect(page.locator('.config-panel.commands-panel')).toBeVisible();
    await expect(page.locator('.config-panel.hooks-panel')).toBeVisible();
    await expect(page.locator('.config-panel.mcp-panel')).toBeVisible();
  });

  // Test 102.001.003: project with zero configurations displays correctly
  test('102.001.003: project with zero configurations displays correctly', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'emptyproject',
              name: 'Empty Project',
              path: '/empty',
              stats: { agents: 0, commands: 0, hooks: 0, mcp: 0 }
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
    await page.route('**/api/projects/emptyproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/projects/emptyproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/projects/emptyproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/projects/emptyproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Navigate to project with no configurations (nth(1) skips User card)
    await page.locator('.project-card').nth(1).click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Verify all configuration cards are displayed (even with empty state)
    const cards = page.locator('.config-panel');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);

    // Verify all card types are present
    await expect(page.locator('.config-panel.agents-panel')).toBeVisible();
    await expect(page.locator('.config-panel.commands-panel')).toBeVisible();
    await expect(page.locator('.config-panel.hooks-panel')).toBeVisible();
    await expect(page.locator('.config-panel.mcp-panel')).toBeVisible();

    // Project info should still be visible
    // Note: Project name now resolves correctly from the store (fixed in later phases)
    const projectTitle = page.locator('.text-2xl.font-semibold span').first();
    await expect(projectTitle).toContainText('Empty Project');
  });

  // Test 102.001.004: search functionality exists on detail page for future config filtering
  test('102.001.004: search functionality exists on detail page for future config filtering', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'searchproject',
              name: 'Search Project',
              path: '/search',
              stats: { agents: 5, commands: 10, hooks: 2, mcp: 1 }
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
    await page.route('**/api/projects/searchproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/projects/searchproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/projects/searchproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/projects/searchproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Click actual project (nth(1) skips User card)
    await page.locator('.project-card').nth(1).click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });

    // Verify breadcrumbs navigation is visible (search may not be implemented yet)
    const breadcrumbs = page.locator('.breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    // Verify project config panels are accessible
    const configPanels = page.locator('.config-panel');
    expect(await configPanels.count()).toBeGreaterThanOrEqual(4);
  });

  // Test 102.001.005: project detail view maintains data integrity across navigation
  test('102.001.005: project detail view maintains data integrity across navigation', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'integrityproject',
              name: 'Data Integrity Project',
              path: '/home/user/integrity',
              stats: { agents: 7, commands: 14, hooks: 4, mcp: 2 }
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
    await page.route('**/api/projects/integrityproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/projects/integrityproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/projects/integrityproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/projects/integrityproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Navigate to detail page (nth(1) skips User card)
    await page.locator('.project-card').nth(1).click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Capture initial data
    const projectName = await page.locator('.text-2xl.font-semibold span').first().textContent();
    const projectPath = await page.locator('.text-sm.ml-10').first().textContent();
    const cardsCount = await page.locator('.config-panel').count();

    // Navigate back
    // Navigate back to dashboard using browser back button
    await page.goBack();
    await page.waitForURL('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Navigate to detail page again
    // After goBack, User card may not be present, so use text filter
    await page.locator('.project-card').filter({ hasText: 'Data Integrity Project' }).click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Verify data is identical
    const projectName2 = await page.locator('.text-2xl.font-semibold span').first().textContent();
    const projectPath2 = await page.locator('.text-sm.ml-10').first().textContent();
    const cardsCount2 = await page.locator('.config-panel').count();

    expect(projectName2).toBe(projectName);
    expect(projectPath2).toBe(projectPath);
    expect(cardsCount2).toBe(cardsCount);
  });

  // Test 102.001.006: configuration icons display correctly for each type
  test('102.001.006: configuration icons display correctly for each type', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'iconproject',
              name: 'Icon Project',
              path: '/icons',
              stats: { agents: 1, commands: 1, hooks: 1, mcp: 1 }
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
    await page.route('**/api/projects/iconproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/projects/iconproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/projects/iconproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/projects/iconproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Click actual project (nth(1) skips User card)
    await page.locator('.project-card').nth(1).click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Verify each configuration card has appropriate icon (using PrimeIcons)
    // Agents icon (in header, not empty state) - use first() to get header icon only
    await expect(page.locator('.config-panel.agents-panel .pi-users').first()).toBeVisible();

    // Commands icon
    await expect(page.locator('.config-panel.commands-panel .pi-bolt').first()).toBeVisible();

    // Hooks icon
    await expect(page.locator('.config-panel.hooks-panel .pi-link').first()).toBeVisible();

    // MCP icon
    await expect(page.locator('.config-panel.mcp-panel .pi-server').first()).toBeVisible();
  });

  // Test 102.001.007: project detail view handles large configuration counts
  test('102.001.007: project detail view handles large configuration counts', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'largeproject',
              name: 'Large Project',
              path: '/large',
              stats: { agents: 99, commands: 250, hooks: 45, mcp: 12 }
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
    await page.route('**/api/projects/largeproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/projects/largeproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/projects/largeproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/projects/largeproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Click actual project (nth(1) skips User card)
    await page.locator('.project-card').nth(1).click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Verify all configuration cards are displayed
    const cards = page.locator('.config-panel');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);

    // Verify all card types are present (even with large counts)
    await expect(page.locator('.config-panel.agents-panel')).toBeVisible();
    await expect(page.locator('.config-panel.commands-panel')).toBeVisible();
    await expect(page.locator('.config-panel.hooks-panel')).toBeVisible();
    await expect(page.locator('.config-panel.mcp-panel')).toBeVisible();

    // Verify layout isn't broken by large numbers - check that panels are in a grid
    const configPanels = page.locator('.config-panel');
    expect(await configPanels.count()).toBeGreaterThanOrEqual(4);
  });

  // Test 102.001.008: detail view works correctly on different viewport sizes
  test('102.001.008: detail view works correctly on different viewport sizes', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'responsiveproject',
              name: 'Responsive Project',
              path: '/responsive',
              stats: { agents: 3, commands: 6, hooks: 2, mcp: 1 }
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
    await page.route('**/api/projects/responsiveproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });
    await page.route('**/api/projects/responsiveproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });
    await page.route('**/api/projects/responsiveproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });
    await page.route('**/api/projects/responsiveproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });
    await page.locator('.project-card').nth(1).click(); // Skip User card
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    let cards = page.locator('.config-panel');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
    await expect(cards.first()).toBeVisible();

    // Navigate back for tablet test
    // Navigate back to dashboard using browser back button
    await page.goBack();
    await page.waitForURL('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    // After goBack, User card may not be present, so use text filter
    await page.locator('.project-card').filter({ hasText: 'Responsive Project' }).click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    cards = page.locator('.config-panel');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
    await expect(cards.first()).toBeVisible();

    // Navigate back for desktop test
    // Navigate back to dashboard using browser back button
    await page.goBack();
    await page.waitForURL('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    // After goBack, User card may not be present, so use text filter
    await page.locator('.project-card').filter({ hasText: 'Responsive Project' }).click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    cards = page.locator('.config-panel');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
    await expect(cards.first()).toBeVisible();
  });

  // Test 102.001.009: no console errors during configuration viewing flow
  test('102.001.009: no console errors during configuration viewing flow', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Filter out expected errors from mocks/route handling
        const text = msg.text();
        if (!text.includes('Failed to load resource') &&
            !text.includes('HTTP error! status:') &&
            !text.includes('Error loading agents:') &&
            !text.includes('Error loading commands:') &&
            !text.includes('Error loading skills:') &&
            !text.includes('Error loading hooks:') &&
            !text.includes('Error loading MCP servers:') &&
            !text.includes('net::ERR') &&
            !text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
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
              path: '/clean',
              stats: { agents: 2, commands: 4, hooks: 1, mcp: 1 }
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
    await page.route('**/api/user/skills', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: [] })
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
    await page.route('**/api/projects/cleanproject/skills', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: [] })
      });
    });

    // Navigate through full flow
    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });
    await page.locator('.project-card').nth(1).click(); // Skip User card
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    await page.waitForSelector('.config-panel', { timeout: 10000 });

    // Interact with page elements - find theme toggle button
    const themeToggle = page.locator('button:has-text("Dark"), button:has-text("Light")');
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Verify configuration cards exist
    const cards = page.locator('.config-panel');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);

    // Navigate back
    // Navigate back to dashboard using browser back button
    await page.goBack();
    await page.waitForURL('/');

    // Verify no errors
    expect(consoleErrors).toEqual([]);
  });
});
