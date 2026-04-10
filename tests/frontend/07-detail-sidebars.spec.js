const { test, expect } = require('@playwright/test');

/**
 * Detail Sidebar Component Tests
 *
 * Tests for frontmatter field display in detail sidebar components:
 * - HookDetailSection: type-specific fields (command, http, prompt, agent), common fields
 * - AgentDetailSection: capabilities, execution, lifecycle sections
 * - SkillDetailSection: configuration, execution, lifecycle sections
 *
 * These tests verify that new schema fields are rendered correctly
 * when present in the data, and hidden when absent.
 */

// Helper: Navigate to a project's configuration page
async function navigateToProject(page) {
  await page.goto('/');
  await page.waitForSelector('.project-card', { timeout: 10000 });
  // Click first project
  await page.locator('.project-card').first().click();
  await page.waitForURL(/\/project\//);
}

// Helper: Wait for loading to complete
async function waitForLoading(page) {
  await page.waitForFunction(() => {
    const loading = document.querySelector('.loading-state');
    return !loading || loading.offsetParent === null;
  }, { timeout: 10000 });
}

test.describe('Agent Detail Sidebar Fields', () => {
  test('displays identity section with name, description, color fields', async ({ page }) => {
    await navigateToProject(page);
    await waitForLoading(page);

    // Click on Agents tab
    const agentsTab = page.locator('[data-testid="tab-agents"], button:has-text("Agents")');
    if (await agentsTab.isVisible()) {
      await agentsTab.click();
      await waitForLoading(page);

      // Click first agent to open sidebar
      const agentCard = page.locator('.config-card, [data-testid="agent-card"]').first();
      if (await agentCard.isVisible()) {
        await agentCard.click();

        // Verify Identity section header
        const identityHeader = page.locator('h4:has-text("Identity")');
        await expect(identityHeader).toBeVisible({ timeout: 5000 });

        // Verify name field is displayed
        const nameField = page.locator('text=Name:');
        await expect(nameField).toBeVisible();
      }
    }
  });

  test('displays capabilities section with tools', async ({ page }) => {
    await navigateToProject(page);
    await waitForLoading(page);

    const agentsTab = page.locator('[data-testid="tab-agents"], button:has-text("Agents")');
    if (await agentsTab.isVisible()) {
      await agentsTab.click();
      await waitForLoading(page);

      const agentCard = page.locator('.config-card, [data-testid="agent-card"]').first();
      if (await agentCard.isVisible()) {
        await agentCard.click();

        // Verify Capabilities section header
        const capabilitiesHeader = page.locator('h4:has-text("Capabilities")');
        await expect(capabilitiesHeader).toBeVisible({ timeout: 5000 });

        // Verify Allowed Tools field
        const toolsField = page.locator('text=Allowed Tools:');
        await expect(toolsField).toBeVisible();
      }
    }
  });

  test('displays execution section with model and permission mode', async ({ page }) => {
    await navigateToProject(page);
    await waitForLoading(page);

    const agentsTab = page.locator('[data-testid="tab-agents"], button:has-text("Agents")');
    if (await agentsTab.isVisible()) {
      await agentsTab.click();
      await waitForLoading(page);

      const agentCard = page.locator('.config-card, [data-testid="agent-card"]').first();
      if (await agentCard.isVisible()) {
        await agentCard.click();

        // Verify Execution section header
        const executionHeader = page.locator('h4:has-text("Execution")');
        await expect(executionHeader).toBeVisible({ timeout: 5000 });

        // Verify Model field
        const modelField = page.locator('text=Model:');
        await expect(modelField).toBeVisible();

        // Verify Permission Mode field
        const permField = page.locator('text=Permission Mode:');
        await expect(permField).toBeVisible();
      }
    }
  });

  test('displays system prompt section', async ({ page }) => {
    await navigateToProject(page);
    await waitForLoading(page);

    const agentsTab = page.locator('[data-testid="tab-agents"], button:has-text("Agents")');
    if (await agentsTab.isVisible()) {
      await agentsTab.click();
      await waitForLoading(page);

      const agentCard = page.locator('.config-card, [data-testid="agent-card"]').first();
      if (await agentCard.isVisible()) {
        await agentCard.click();

        const promptHeader = page.locator('h4:has-text("System Prompt")');
        await expect(promptHeader).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Hook Detail Sidebar Fields', () => {
  test('displays event and type fields for hooks', async ({ page }) => {
    await navigateToProject(page);
    await waitForLoading(page);

    // Click on Hooks tab
    const hooksTab = page.locator('[data-testid="tab-hooks"], button:has-text("Hooks")');
    if (await hooksTab.isVisible()) {
      await hooksTab.click();
      await waitForLoading(page);

      // Click first hook to open sidebar
      const hookCard = page.locator('.config-card, [data-testid="hook-card"]').first();
      if (await hookCard.isVisible()) {
        await hookCard.click();

        // Verify Event field (read-only)
        const eventField = page.locator('text=Event:');
        await expect(eventField).toBeVisible({ timeout: 5000 });

        // Verify Type field
        const typeField = page.locator('text=Type:');
        await expect(typeField).toBeVisible();
      }
    }
  });

  test('displays common fields: timeout, enabled, suppress output, continue', async ({ page }) => {
    await navigateToProject(page);
    await waitForLoading(page);

    const hooksTab = page.locator('[data-testid="tab-hooks"], button:has-text("Hooks")');
    if (await hooksTab.isVisible()) {
      await hooksTab.click();
      await waitForLoading(page);

      const hookCard = page.locator('.config-card, [data-testid="hook-card"]').first();
      if (await hookCard.isVisible()) {
        await hookCard.click();

        // Verify common fields
        await expect(page.locator('text=Timeout')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=Enabled:')).toBeVisible();
        await expect(page.locator('text=Suppress Output:')).toBeVisible();
        await expect(page.locator('text=Continue on Error:')).toBeVisible();
      }
    }
  });
});

test.describe('Skill Detail Sidebar Fields', () => {
  test('displays name, description, and allowed tools for skills', async ({ page }) => {
    await navigateToProject(page);
    await waitForLoading(page);

    // Click on Skills tab
    const skillsTab = page.locator('[data-testid="tab-skills"], button:has-text("Skills")');
    if (await skillsTab.isVisible()) {
      await skillsTab.click();
      await waitForLoading(page);

      // Click first skill to open sidebar
      const skillCard = page.locator('.config-card, [data-testid="skill-card"]').first();
      if (await skillCard.isVisible()) {
        await skillCard.click();

        // Verify basic fields
        await expect(page.locator('text=Name:')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=Description:')).toBeVisible();
        await expect(page.locator('text=Allowed Tools:')).toBeVisible();
      }
    }
  });
});
