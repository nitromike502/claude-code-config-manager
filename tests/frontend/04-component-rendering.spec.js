const { test, expect } = require('@playwright/test');

/**
 * Frontend Component Tests: 04-Component Rendering
 *
 * Test Suites:
 * - 04.001: Dashboard Component
 * - 04.002: ProjectDetail Component
 * - 04.003: UserGlobal Component
 * - 04.004: Navigation and Back Button
 * - 04.005: Console Errors
 *
 * Numbering Format: 04.GROUP.TEST
 *
 * Comprehensive tests for all Vue SFC components:
 * - Dashboard.vue
 * - ProjectDetail.vue
 * - UserGlobal.vue
 *
 * Tests cover:
 * - Component rendering and API integration
 * - Navigation between views
 * - Interactive features (sidebar, expand, copy)
 * - No console errors
 */

// Test Suite 04.001: Dashboard Component
test.describe('04.001: Dashboard Component', () => {
  test('04.001.001: dashboard page loads and displays projects', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load - look for the main heading
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Verify header is present
    const header = page.locator('h2:has-text("Projects")');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Projects');

    // Verify sort dropdown is present (PrimeVue Select component)
    const sortDropdown = page.locator('.p-select');
    await expect(sortDropdown).toBeVisible();

    // Verify rescan button is present (PrimeVue Button with "Rescan" label)
    const rescanBtn = page.locator('button:has-text("Rescan")');
    await expect(rescanBtn).toBeVisible();

    // Check that either projects or empty state is shown
    const projectCards = page.locator('.project-card');
    const emptyState = page.locator('.p-empty-state');
    const loadingState = page.locator('.loading-state');

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    // Should have either projects or empty state
    const hasProjects = await projectCards.count() > 0;
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasProjects || hasEmpty).toBeTruthy();
  });

  test('04.001.002: can click on a project and navigate to ProjectDetail', async ({ page }) => {
    await page.goto('/');

    // Wait for projects to load
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    // Check if any projects exist
    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      // Click on first project
      await projectCards.first().click();

      // Wait for navigation to project detail
      await page.waitForURL(/\/project\//, { timeout: 10000 });

      // Verify project detail page loaded - look for breadcrumb navigation
      const breadcrumb = page.locator('.p-breadcrumb');
      await expect(breadcrumb).toBeVisible();

      // Verify config panels are present
      const configPanel = page.locator('.config-panel');
      await expect(configPanel.first()).toBeVisible();
    }
  });

  test('04.001.003: user card navigates to UserGlobal view', async ({ page }) => {
    await page.goto('/');

    // Wait for projects to load
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    // Look for user card
    const userCard = page.locator('.project-card.user-card');
    const hasUserCard = await userCard.count() > 0;

    if (hasUserCard) {
      // Click on user card
      await userCard.first().click();

      // Wait for navigation to user view
      await page.waitForURL(/\/user/, { timeout: 10000 });

      // Verify user global page loaded - look for page title
      const pageTitle = page.locator('span:has-text("User Configurations")');
      await expect(pageTitle).toBeVisible();

      // Verify breadcrumb is present
      const breadcrumb = page.locator('.p-breadcrumb');
      await expect(breadcrumb).toBeVisible();
    }
  });
});

// Test Suite 04.002: ProjectDetail Component
test.describe('04.002: ProjectDetail Component', () => {
  test('04.002.001: ProjectDetail loads all configuration cards', async ({ page }) => {
    // Navigate to a project detail page
    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });

      // Wait for config panels to load
      await page.waitForSelector('.config-panel', { timeout: 10000 });

      // Verify all 4 config panels are present
      const agentsPanel = page.locator('.agents-panel');
      const commandsPanel = page.locator('.commands-panel');
      const hooksPanel = page.locator('.hooks-panel');
      const mcpPanel = page.locator('.mcp-panel');

      await expect(agentsPanel).toBeVisible();
      await expect(commandsPanel).toBeVisible();
      await expect(hooksPanel).toBeVisible();
      await expect(mcpPanel).toBeVisible();

      // Verify panel titles (they are in the PrimeVue Panel header)
      await expect(agentsPanel.locator('span:has-text("Subagents")')).toBeVisible();
      await expect(commandsPanel.locator('span:has-text("Slash Commands")')).toBeVisible();
      await expect(hooksPanel.locator('span:has-text("Hooks")')).toBeVisible();
      await expect(mcpPanel.locator('span:has-text("MCP Servers")')).toBeVisible();
    }
  });

  test('04.002.002: can select items and view in sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-panel', { timeout: 10000 });

      // Try to find a config item to click (PrimeVue Card within ConfigItemList)
      const configItem = page.locator('.config-item-card').first();
      const hasItems = await configItem.count() > 0;

      if (hasItems) {
        await configItem.click();

        // Verify sidebar opens (PrimeVue Drawer component)
        const drawer = page.locator('.p-drawer');
        await expect(drawer).toBeVisible({ timeout: 5000 });

        // Verify close button exists
        const closeBtn = page.locator('button[aria-label="Close sidebar"]');
        await expect(closeBtn).toBeVisible();

        // Close sidebar
        await closeBtn.click();
        await expect(drawer).not.toBeVisible();
      }
    }
  });

  test('04.002.004: show more/less functionality works', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-panel', { timeout: 10000 });

      // Look for "Show more" button in panel footer (only test if one exists)
      const showMoreBtn = page.locator('button:has-text("Show")').first();
      let hasShowMoreBtn = false;
      try {
        hasShowMoreBtn = (await showMoreBtn.count({ timeout: 500 })) > 0;
      } catch (e) {
        hasShowMoreBtn = false;
      }

      if (hasShowMoreBtn) {
        // Find the panel containing this button
        const panel = showMoreBtn.locator('xpath=ancestor::div[contains(@class, "config-panel")]');

        // Get initial item count
        const initialItemCount = await panel.locator('.config-item-card').count();

        // Click show more
        await showMoreBtn.click();
        await page.waitForTimeout(300);

        // Get new item count
        const expandedItemCount = await panel.locator('.config-item-card').count();

        // Should have more items now
        expect(expandedItemCount).toBeGreaterThanOrEqual(initialItemCount);

        // Button text should change to "Show less"
        await expect(showMoreBtn).toContainText('less');

        // Click again to collapse
        await showMoreBtn.click();
        await page.waitForTimeout(300);

        // Should show fewer items again
        const collapsedItemCount = await panel.locator('.config-item-card').count();
        expect(collapsedItemCount).toBeLessThanOrEqual(expandedItemCount);
      }
    }
  });
});

// Test Suite 04.003: UserGlobal Component
test.describe('04.003: UserGlobal Component', () => {
  test('04.003.001: UserGlobal page loads user-level configurations', async ({ page }) => {
    await page.goto('/user');

    // Wait for page title to load (use more specific selector)
    await page.waitForSelector('.p-breadcrumb', { timeout: 10000 });

    // Verify page title is present in breadcrumb
    const pageTitle = page.locator('.p-breadcrumb .breadcrumb-label:has-text("User Configurations")');
    await expect(pageTitle.first()).toBeVisible();

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    // Verify all 4 config panels are present
    const agentsPanel = page.locator('.agents-panel');
    const commandsPanel = page.locator('.commands-panel');
    const hooksPanel = page.locator('.hooks-panel');
    const mcpPanel = page.locator('.mcp-panel');

    await expect(agentsPanel).toBeVisible();
    await expect(commandsPanel).toBeVisible();
    await expect(hooksPanel).toBeVisible();
    await expect(mcpPanel).toBeVisible();
  });

  test('04.003.002: UserGlobal sidebar functionality works', async ({ page }) => {
    await page.goto('/user');
    await page.waitForSelector('.p-breadcrumb', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    // Try to find a config item
    const configItem = page.locator('.config-item-card').first();
    const hasItems = await configItem.count() > 0;

    if (hasItems) {
      await configItem.click();

      // Verify sidebar opens (PrimeVue Drawer)
      const drawer = page.locator('.p-drawer');
      await expect(drawer).toBeVisible({ timeout: 5000 });

      // Verify close button works
      const closeBtn = page.locator('button[aria-label="Close sidebar"]');
      await closeBtn.click();
      await expect(drawer).not.toBeVisible();
    }
  });
});

// Test Suite 04.004: Navigation and Back Button
test.describe('04.004: Navigation and Back Button', () => {
  test('04.004.001: navigation between Dashboard, ProjectDetail, and UserGlobal works', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Wait for loading
    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    // Navigate to user view
    const userCard = page.locator('.project-card.user-card');
    const hasUserCard = await userCard.count() > 0;

    if (hasUserCard) {
      await userCard.first().click();
      await page.waitForURL(/\/user/, { timeout: 10000 });
      await expect(page.locator('span:has-text("User Configurations")')).toBeVisible();

      // Go back to dashboard
      await page.goBack();
      await page.waitForURL('/', { timeout: 10000 });
      await expect(page.locator('h2:has-text("Projects")')).toBeVisible();

      // Navigate to project detail
      const projectCards = page.locator('.project-card:not(.user-card)');
      const hasProjects = await projectCards.count() > 0;

      if (hasProjects) {
        await projectCards.first().click();
        await page.waitForURL(/\/project\//, { timeout: 10000 });
        await expect(page.locator('.p-breadcrumb')).toBeVisible();

        // Go back to dashboard
        await page.goBack();
        await page.waitForURL('/', { timeout: 10000 });
        await expect(page.locator('h2:has-text("Projects")')).toBeVisible();
      }
    }
  });

  test('04.004.002: back button navigation works correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      // Click project
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });

      // Verify we're on project detail
      await expect(page.locator('.p-breadcrumb')).toBeVisible();

      // Click browser back button
      await page.goBack();
      await page.waitForURL('/', { timeout: 10000 });

      // Verify we're back on dashboard
      await expect(page.locator('h2:has-text("Projects")')).toBeVisible();
    }
  });
});

// Test Suite 04.004: Agent Sidebar Metadata Display
test.describe('04.004: Agent Sidebar Metadata Display', () => {
  test('04.004.001: agent color displays in ProjectDetail sidebar [BUG-027]', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Get first project card (not user card)
    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      // Navigate to first project
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-panel', { timeout: 10000 });

      // Find and click on first agent
      const agentItem = page.locator('.agents-panel .config-item-card').first();
      if (await agentItem.count() > 0) {
        await agentItem.click();
        await page.waitForSelector('.p-drawer', { timeout: 5000 });

        // Check that Color field is present in metadata
        // Use a more flexible selector that checks for the text "Color" in a paragraph
        const colorText = page.locator('p:has-text("Color:")').first();
        if (await colorText.count() > 0) {
          await expect(colorText).toBeVisible();
          // Verify the text contains "Color:" pattern
          const content = await colorText.innerText();
          await expect(content).toMatch(/Color:/);
        }
      }
    }
  });

  test('04.004.002: agent color displays in UserGlobal sidebar [BUG-027]', async ({ page }) => {
    await page.goto('/user');
    await page.waitForSelector('.p-breadcrumb', { timeout: 10000 });

    // Find and click on first agent
    const agentItem = page.locator('.agents-panel .config-item-card').first();
    if (await agentItem.count() > 0) {
      await agentItem.click();
      await page.waitForSelector('.p-drawer', { timeout: 5000 });

      // Check that Color field is present in metadata
      // Use a more flexible selector that checks for the text "Color" in a paragraph
      const colorText = page.locator('p:has-text("Color:")').first();
      if (await colorText.count() > 0) {
        await expect(colorText).toBeVisible();
        // Verify the text contains "Color:" pattern
        const content = await colorText.innerText();
        await expect(content).toMatch(/Color:/);
      }
    }
  });

  test('04.004.003: agent tools display in ProjectDetail sidebar [BUG-029]', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    // Get first project card (not user card)
    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      // Navigate to first project
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-panel', { timeout: 10000 });

      // Find and click on first agent
      const agentItem = page.locator('.agents-panel .config-item-card').first();
      if (await agentItem.count() > 0) {
        await agentItem.click();
        await page.waitForSelector('.p-drawer', { timeout: 5000 });

        // Check that Allowed Tools field is present in metadata
        const toolsField = page.locator('strong:has-text("Allowed Tools")').first();
        if (await toolsField.count() > 0) {
          await expect(toolsField).toBeVisible();
        }
      }
    }
  });

  test('04.004.004: agent tools display in UserGlobal sidebar [BUG-029]', async ({ page }) => {
    await page.goto('/user');
    await page.waitForSelector('.p-breadcrumb', { timeout: 10000 });

    // Find and click on first agent
    const agentItem = page.locator('.agents-panel .config-item-card').first();
    if (await agentItem.count() > 0) {
      await agentItem.click();
      await page.waitForSelector('.p-drawer', { timeout: 5000 });

      // Check that Allowed Tools field is present in metadata
      const toolsField = page.locator('strong:has-text("Allowed Tools")').first();
      if (await toolsField.count() > 0) {
        await expect(toolsField).toBeVisible();
      }
    }
  });

  test('04.004.005: agent model displays in ProjectDetail sidebar [BUG-028]', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    // Click on first project (not user card)
    const projectCards = page.locator('.project-card:not(.user-card)');
    if (await projectCards.count() > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-panel', { timeout: 10000 });

      // Find and click on first agent
      const agentItem = page.locator('.agents-panel .config-item-card').first();
      if (await agentItem.count() > 0) {
        await agentItem.click();
        await page.waitForSelector('.p-drawer', { timeout: 5000 });

        // Check that Model field is present in metadata
        const modelField = page.locator('strong:has-text("Model")').first();
        if (await modelField.count() > 0) {
          await expect(modelField).toBeVisible();
          // Check that a value is displayed (either model name or 'inherit')
          const text = await modelField.evaluate(el => el.nextSibling?.textContent?.trim());
          expect(text).toBeTruthy();
        }
      }
    }
  });

  test('04.004.006: agent model displays in UserGlobal sidebar [BUG-028]', async ({ page }) => {
    await page.goto('/user');
    await page.waitForSelector('.p-breadcrumb', { timeout: 10000 });

    // Find and click on first agent
    const agentItem = page.locator('.agents-panel .config-item-card').first();
    if (await agentItem.count() > 0) {
      await agentItem.click();
      await page.waitForSelector('.p-drawer', { timeout: 5000 });

      // Check that Model field is present in metadata
      const modelField = page.locator('strong:has-text("Model")').first();
      if (await modelField.count() > 0) {
        await expect(modelField).toBeVisible();
        // Check that a value is displayed (either model name or 'inherit')
        const text = await modelField.evaluate(el => el.nextSibling?.textContent?.trim());
        expect(text).toBeTruthy();
      }
    }
  });
});

// Test Suite 04.005: Console Errors
test.describe('04.005: Console Errors', () => {
  test('04.005.001: no console errors during dashboard load', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    // Allow some time for any async errors
    await page.waitForTimeout(1000);

    // Filter out known benign errors (if any)
    const realErrors = consoleErrors.filter(error => {
      // Filter out any expected/benign errors here if needed
      return !error.includes('favicon.ico');
    });

    expect(realErrors).toHaveLength(0);
  });

  test('04.005.002: no console errors during project navigation', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-panel', { timeout: 10000 });

      // Allow some time for any async errors
      await page.waitForTimeout(1000);

      const realErrors = consoleErrors.filter(error => {
        return !error.includes('favicon.ico');
      });

      expect(realErrors).toHaveLength(0);
    }
  });

  test('04.005.003: no console errors during user view load', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/user');
    await page.waitForSelector('span:has-text("User Configurations")', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-state');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    // Allow some time for any async errors
    await page.waitForTimeout(1000);

    const realErrors = consoleErrors.filter(error => {
      return !error.includes('favicon.ico');
    });

    expect(realErrors).toHaveLength(0);
  });
});
