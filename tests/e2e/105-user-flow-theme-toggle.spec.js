const { test, expect } = require('@playwright/test');

/**
 * End-to-End Flow Test: Theme Toggle & Persistence
 *
 * This test validates that theme switching works across the entire application
 * and persists through navigation and page reloads.
 *
 * User Journey:
 * 1. User opens application (default theme loads)
 * 2. User toggles theme
 * 3. Theme persists across navigation to detail page
 * 4. Theme persists on page reload
 * 5. Theme preference saved in localStorage
 */

test.describe('E2E Flow: Theme Toggle & Persistence', () => {
  test('theme toggle persists across navigation and page reload', async ({ page }) => {
    // Setup API mocks
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'themeproject',
              name: 'Theme Project',
              path: '/theme/project',
              stats: { agents: 1, commands: 1, hooks: 1, mcp: 1 }
            }
          ]
        })
      });
    });

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
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    await page.route('**/api/projects/themeproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });

    await page.route('**/api/projects/themeproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });

    await page.route('**/api/projects/themeproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });

    await page.route('**/api/projects/themeproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    // STEP 1: User opens application
    await page.goto('/');

    // Get initial theme (default is dark)
    const appContainer = page.locator('#app[data-theme]');
    const initialTheme = await appContainer.getAttribute('data-theme');
    expect(initialTheme).toBe('dark');

    // Verify theme button is visible
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible();

    // STEP 2: User toggles theme
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Verify theme changed to light
    const newTheme = await appContainer.getAttribute('data-theme');
    expect(newTheme).toBe('light');

    // Verify localStorage was updated
    const storedTheme = await page.evaluate(() => localStorage.getItem('claude-code-manager-theme'));
    expect(storedTheme).toBe('light');

    // STEP 3: Navigate to project detail page (nth(1) skips User card)
    await page.waitForSelector('.project-card', { timeout: 10000 });
    await page.locator('.project-card').nth(1).click();
    await page.waitForURL(/\/project\/[^/]+$/);

    // Verify theme persisted across navigation
    const detailPageTheme = await appContainer.getAttribute('data-theme');
    expect(detailPageTheme).toBe('light');

    // Verify theme toggle button is still visible
    await expect(themeToggle).toBeVisible();

    // STEP 4: Reload page
    await page.reload();
    await page.waitForSelector('.config-card', { timeout: 10000 });

    // Verify theme persisted after reload
    const reloadedTheme = await appContainer.getAttribute('data-theme');
    expect(reloadedTheme).toBe('light');

    // STEP 5: Toggle back to dark mode
    await themeToggle.click();
    await page.waitForTimeout(100);

    const finalTheme = await appContainer.getAttribute('data-theme');
    expect(finalTheme).toBe('dark');

    // Navigate back to dashboard using breadcrumb link
    await page.click('.breadcrumb-link');
    await page.waitForURL('/');

    // Verify theme still dark on dashboard
    const dashboardTheme = await appContainer.getAttribute('data-theme');
    expect(dashboardTheme).toBe('dark');
  });

  test('theme toggle works independently on dashboard and detail pages', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'testproject',
              name: 'Test Project',
              path: '/test',
              stats: { agents: 0, commands: 0, hooks: 0, mcp: 0 }
            }
          ]
        })
      });
    });

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
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    await page.route('**/api/projects/testproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });

    await page.route('**/api/projects/testproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: [] })
      });
    });

    await page.route('**/api/projects/testproject/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });

    await page.route('**/api/projects/testproject/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    const appContainer = page.locator('#app[data-theme]');
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');

    // Start on dashboard
    await page.goto('/');
    await page.waitForSelector('.project-card', { timeout: 10000 });

    // Set to light mode
    await themeToggle.click();
    await page.waitForTimeout(100);
    expect(await appContainer.getAttribute('data-theme')).toBe('light');

    // Navigate to detail page (nth(1) skips User card)
    await page.locator('.project-card').nth(1).click();
    await page.waitForURL(/\/project\/[^/]+$/);
    await page.waitForSelector('.config-card', { timeout: 10000 });

    // Verify light mode persisted
    expect(await appContainer.getAttribute('data-theme')).toBe('light');

    // Toggle on detail page
    await themeToggle.click();
    await page.waitForTimeout(100);
    expect(await appContainer.getAttribute('data-theme')).toBe('dark');

    // Return to dashboard using breadcrumb link
    await page.click('.breadcrumb-link');
    await page.waitForURL('/');

    // Verify dark mode persisted
    expect(await appContainer.getAttribute('data-theme')).toBe('dark');
  });

  test('theme preference loads from localStorage on first visit', async ({ page }) => {
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
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    // Pre-set theme in localStorage before page load
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('claude-code-manager-theme', 'light'));

    // Navigate to a new page (simulating fresh visit)
    await page.goto('/');
    await page.waitForSelector('header', { timeout: 10000 });

    // Verify light theme was loaded from localStorage
    const appContainer = page.locator('#app[data-theme]');
    const theme = await appContainer.getAttribute('data-theme');
    expect(theme).toBe('light');

    // Verify theme toggle button is visible
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible();
  });

  test('multiple theme toggles work correctly', async ({ page }) => {
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
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    await page.goto('/');
    const appContainer = page.locator('#app[data-theme]');
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');

    // Record initial theme
    const themes = [];
    themes.push(await appContainer.getAttribute('data-theme'));

    // Toggle 5 times
    for (let i = 0; i < 5; i++) {
      await themeToggle.click();
      await page.waitForTimeout(100);
      themes.push(await appContainer.getAttribute('data-theme'));
    }

    // Verify alternating pattern: dark -> light -> dark -> light -> dark -> light
    expect(themes).toEqual(['dark', 'light', 'dark', 'light', 'dark', 'light']);

    // Verify localStorage matches final state
    const storedTheme = await page.evaluate(() => localStorage.getItem('claude-code-manager-theme'));
    expect(storedTheme).toBe('light');
  });

  test('theme toggle has smooth visual transition', async ({ page }) => {
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
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    await page.goto('/');
    const appContainer = page.locator('#app[data-theme]');
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');

    // Get initial background color
    const initialBgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Toggle theme
    await themeToggle.click();
    await page.waitForTimeout(200); // Allow transition to complete

    // Get new background color
    const newBgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Verify colors changed
    expect(initialBgColor).not.toBe(newBgColor);

    // Verify theme attribute changed
    const newTheme = await appContainer.getAttribute('data-theme');
    expect(newTheme).toBe('light');
  });

  test('theme toggle button has accessible title attribute', async ({ page }) => {
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
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    await page.goto('/');

    // Check aria-label in dark mode
    const themeButton = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeButton).toHaveAttribute('aria-label', 'Toggle theme');

    // Toggle to light mode
    await themeButton.click();
    await page.waitForTimeout(100);

    // Verify button still has aria-label
    await expect(themeButton).toHaveAttribute('aria-label', 'Toggle theme');

    // Toggle back to dark
    await themeButton.click();
    await page.waitForTimeout(100);

    // Verify button still has aria-label
    await expect(themeButton).toHaveAttribute('aria-label', 'Toggle theme');
  });

  test('theme works correctly in different viewports', async ({ page }) => {
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
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    const appContainer = page.locator('#app[data-theme]');
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await themeToggle.click();
    await page.waitForTimeout(100);
    expect(await appContainer.getAttribute('data-theme')).toBe('light');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await themeToggle.click();
    await page.waitForTimeout(100);
    expect(await appContainer.getAttribute('data-theme')).toBe('dark');

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await themeToggle.click();
    await page.waitForTimeout(100);
    expect(await appContainer.getAttribute('data-theme')).toBe('light');

    // Verify localStorage reflects latest state
    const storedTheme = await page.evaluate(() => localStorage.getItem('claude-code-manager-theme'));
    expect(storedTheme).toBe('light');
  });

  test('theme toggle animation completes without errors', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

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
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    await page.goto('/');

    const themeToggle = page.locator('button[aria-label="Toggle theme"]');

    // Rapidly toggle theme multiple times
    for (let i = 0; i < 3; i++) {
      await themeToggle.click();
      await page.waitForTimeout(50);
    }

    // Wait for animations to settle
    await page.waitForTimeout(500);

    // Verify no console errors
    expect(consoleErrors).toEqual([]);
  });
});
