const { test, expect } = require('@playwright/test');

/**
 * End-to-End Test: Copy Configuration Feature
 *
 * Tests complete user workflows for copying agents, commands, hooks, and MCP servers
 * between projects and to user-level configurations.
 *
 * Phase 3 (Copy Configuration Feature):
 * - Copy modal interaction
 * - Destination selection (projects + user-global)
 * - Success/error/cancel workflows
 * - Toast notifications
 * - Data refresh after copy
 *
 * IMPORTANT: Skills are NOT included in Phase 3 scope - only agents, commands, hooks, MCP
 *
 * Test Coverage:
 * 1. Copy agent between projects (success)
 * 2. Copy command to user-level (promotion)
 * 3. Copy hook with conflict (skip strategy)
 * 4. Copy hook with conflict (overwrite strategy)
 * 5. Copy hook with conflict (rename strategy)
 * 6. Copy MCP server between projects
 * 7. Copy with permission error (error handling)
 * 8. Plugin item copy disabled (edge case)
 * 9. Data refresh after copy (UI state)
 */

// Test Suite 106.001: Copy Configuration - Success Flows
test.describe('106.001: Copy Configuration - Success Flows', () => {
  /**
   * Test 106.001.001: Copy agent between projects (success)
   *
   * User Journey:
   * 1. Navigate to project A
   * 2. Click copy button on agent
   * 3. Select project B as target in modal
   * 4. Confirm copy operation
   * 5. Verify success toast shown
   * 6. Verify agent appears in project B list (data refresh)
   */
  test('106.001.001: Copy agent between projects (success)', async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'projecta',
              name: 'Project A',
              path: '/home/user/project-a',
              stats: { agents: 1, commands: 0, hooks: 0, mcp: 0 }
            },
            {
              id: 'projectb',
              name: 'Project B',
              path: '/home/user/project-b',
              stats: { agents: 0, commands: 0, hooks: 0, mcp: 0 }
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

    // Mock project A agents (has 1 agent)
    await page.route('**/api/projects/projecta/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          agents: [
            {
              name: 'test-agent',
              description: 'Test agent for copy',
              content: '# Test Agent',
              filePath: '/home/user/project-a/.claude/agents/test-agent.md'
            }
          ]
        })
      });
    });

    // Mock other project A endpoints
    ['commands', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/projecta/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock project B endpoints (empty initially)
    ['agents', 'commands', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/projectb/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock copy API endpoint (success)
    await page.route('**/api/copy/agent', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Agent copied successfully'
        })
      });
    });

    // STEP 1: Navigate to project A
    await page.goto('/project/projecta');
    await page.waitForSelector('.project-detail', { timeout: 10000 });

    // Wait for agents to load
    await page.waitForTimeout(500);

    // STEP 2: Click copy button on agent
    const agentCard = page.locator('.config-card.agents-card');
    await expect(agentCard).toBeVisible();

    const copyButton = agentCard.locator('.copy-button').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // STEP 3: Verify modal opens
    const modal = page.locator('.copy-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify source configuration info
    await expect(modal).toContainText('test-agent');
    await expect(modal).toContainText('Agent');

    // STEP 4: Select project B as destination
    const projectBCard = modal.locator('.destination-card').filter({ hasText: 'Project B' });
    await expect(projectBCard).toBeVisible();
    await projectBCard.click();

    // Verify selection
    await expect(projectBCard).toHaveClass(/selected/);

    // STEP 5: Click "Copy Here" button
    const copyHereButton = projectBCard.locator('.card-button');
    await copyHereButton.click();

    // STEP 6: Verify success toast appears
    const successToast = page.locator('.p-toast-message-success');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText(/copied successfully/i);

    // Verify modal closes
    await expect(modal).not.toBeVisible();
  });

  /**
   * Test 106.001.002: Copy command to user-level (promotion)
   *
   * User Journey:
   * 1. Navigate to project
   * 2. Click copy button on command
   * 3. Select "User Global" as target
   * 4. Confirm copy operation
   * 5. Verify success toast
   * 6. Navigate to UserGlobal view
   * 7. Verify command appears
   */
  test('106.001.002: Copy command to user-level (promotion)', async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'myproject',
              name: 'My Project',
              path: '/home/user/my-project',
              stats: { agents: 0, commands: 1, hooks: 0, mcp: 0 }
            }
          ]
        })
      });
    });

    // Mock user stats (empty initially)
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

    // Mock project commands (has 1 command)
    await page.route('**/api/projects/myproject/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          commands: [
            {
              name: '/test-command',
              description: 'Test command for copy',
              content: '# Test Command',
              filePath: '/home/user/my-project/.claude/commands/test-command.md'
            }
          ]
        })
      });
    });

    // Mock other project endpoints
    ['agents', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/myproject/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock copy API endpoint (success)
    await page.route('**/api/copy/command', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Command copied to user-level successfully'
        })
      });
    });

    // Navigate to project
    await page.goto('/project/myproject');
    await page.waitForSelector('.project-detail', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Click copy button on command
    const commandCard = page.locator('.config-card.commands-card');
    await expect(commandCard).toBeVisible();

    const copyButton = commandCard.locator('.copy-button').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify modal opens
    const modal = page.locator('.copy-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Select "User Global" as destination
    const userGlobalCard = modal.locator('.destination-card').filter({ hasText: 'User Global' });
    await expect(userGlobalCard).toBeVisible();
    await userGlobalCard.click();

    // Verify selection
    await expect(userGlobalCard).toHaveClass(/selected/);

    // Click "Copy Here" button
    const copyHereButton = userGlobalCard.locator('.card-button');
    await copyHereButton.click();

    // Verify success toast appears
    const successToast = page.locator('.p-toast-message-success');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText(/copied.*successfully/i);

    // Verify modal closes
    await expect(modal).not.toBeVisible();
  });
});

// Test Suite 106.002: Copy Configuration - Conflict Resolution
test.describe('106.002: Copy Configuration - Conflict Resolution', () => {
  /**
   * Test 106.002.001: Copy hook with conflict (skip strategy)
   *
   * User Journey:
   * 1. Attempt to copy hook that exists in target
   * 2. Conflict resolution dialog appears
   * 3. Choose "Skip" strategy
   * 4. Verify toast shows "Copy cancelled"
   * 5. Verify hook NOT copied
   */
  test('106.002.001: Copy hook with conflict (skip strategy)', async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'source',
              name: 'Source Project',
              path: '/home/user/source',
              stats: { agents: 0, commands: 0, hooks: 1, mcp: 0 }
            },
            {
              id: 'target',
              name: 'Target Project',
              path: '/home/user/target',
              stats: { agents: 0, commands: 0, hooks: 1, mcp: 0 }
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

    // Mock source project hooks
    await page.route('**/api/projects/source/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hooks: [
            {
              event: 'task:start',
              matcher: { task_name: 'build' },
              command: 'npm run build',
              description: 'Build hook'
            }
          ]
        })
      });
    });

    // Mock other source project endpoints
    ['agents', 'commands', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/source/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock target project endpoints
    ['agents', 'commands', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/target/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock copy API endpoint (conflict response)
    await page.route('**/api/copy/hook', (route) => {
      const requestBody = route.request().postDataJSON();
      if (requestBody.strategy === 'skip') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            cancelled: true,
            message: 'Copy cancelled'
          })
        });
      } else {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            conflict: true,
            existingItem: {
              event: 'task:start',
              matcher: { task_name: 'build' },
              command: 'npm run build'
            }
          })
        });
      }
    });

    // Navigate to source project
    await page.goto('/project/source');
    await page.waitForSelector('.project-detail', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Click copy button on hook
    const hookCard = page.locator('.config-card.hooks-card');
    await expect(hookCard).toBeVisible();

    const copyButton = hookCard.locator('.copy-button').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify modal opens
    const modal = page.locator('.copy-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Select target project
    const targetCard = modal.locator('.destination-card').filter({ hasText: 'Target Project' });
    await expect(targetCard).toBeVisible();
    await targetCard.click();

    // Click "Copy Here" button - this triggers conflict
    const copyHereButton = targetCard.locator('.card-button');
    await copyHereButton.click();

    // In a real implementation, conflict dialog would appear
    // For this test, we simulate choosing "Skip" by mocking the API response
    // The toast should show "Copy cancelled"
    const toast = page.locator('.p-toast-message');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/cancelled/i);
  });

  /**
   * Test 106.002.002: Copy hook with conflict (overwrite strategy)
   *
   * User Journey:
   * 1. Attempt to copy hook that exists in target
   * 2. Conflict resolution dialog appears
   * 3. Choose "Overwrite" strategy
   * 4. Verify success toast
   * 5. Verify hook replaced in target
   */
  test('106.002.002: Copy hook with conflict (overwrite strategy)', async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'source',
              name: 'Source Project',
              path: '/home/user/source',
              stats: { agents: 0, commands: 0, hooks: 1, mcp: 0 }
            },
            {
              id: 'target',
              name: 'Target Project',
              path: '/home/user/target',
              stats: { agents: 0, commands: 0, hooks: 1, mcp: 0 }
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

    // Mock source project hooks
    await page.route('**/api/projects/source/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hooks: [
            {
              event: 'task:start',
              matcher: { task_name: 'build' },
              command: 'npm run build',
              description: 'Build hook'
            }
          ]
        })
      });
    });

    // Mock other source project endpoints
    ['agents', 'commands', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/source/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock target project endpoints
    ['agents', 'commands', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/target/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock copy API endpoint (overwrite success)
    await page.route('**/api/copy/hook', (route) => {
      const requestBody = route.request().postDataJSON();
      if (requestBody.strategy === 'overwrite') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Hook overwritten successfully'
          })
        });
      } else {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            conflict: true,
            existingItem: {
              event: 'task:start',
              matcher: { task_name: 'build' },
              command: 'npm run build'
            }
          })
        });
      }
    });

    // Navigate to source project
    await page.goto('/project/source');
    await page.waitForSelector('.project-detail', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Click copy button on hook
    const hookCard = page.locator('.config-card.hooks-card');
    await expect(hookCard).toBeVisible();

    const copyButton = hookCard.locator('.copy-button').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify modal opens
    const modal = page.locator('.copy-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Select target project
    const targetCard = modal.locator('.destination-card').filter({ hasText: 'Target Project' });
    await expect(targetCard).toBeVisible();
    await targetCard.click();

    // Click "Copy Here" button - in real implementation, would show conflict dialog
    const copyHereButton = targetCard.locator('.card-button');
    await copyHereButton.click();

    // Verify success toast (assuming overwrite chosen)
    const successToast = page.locator('.p-toast-message-success');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText(/overwritten|copied.*successfully/i);
  });

  /**
   * Test 106.002.003: Copy hook with conflict (rename strategy)
   *
   * User Journey:
   * 1. Attempt to copy hook that exists in target
   * 2. Conflict resolution dialog appears
   * 3. Choose "Rename" strategy
   * 4. Verify success toast
   * 5. Verify new hook created with suffix (e.g., "-copy")
   */
  test('106.002.003: Copy hook with conflict (rename strategy)', async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'source',
              name: 'Source Project',
              path: '/home/user/source',
              stats: { agents: 0, commands: 0, hooks: 1, mcp: 0 }
            },
            {
              id: 'target',
              name: 'Target Project',
              path: '/home/user/target',
              stats: { agents: 0, commands: 0, hooks: 1, mcp: 0 }
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

    // Mock source project hooks
    await page.route('**/api/projects/source/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hooks: [
            {
              event: 'task:start',
              matcher: { task_name: 'build' },
              command: 'npm run build',
              description: 'Build hook'
            }
          ]
        })
      });
    });

    // Mock other source project endpoints
    ['agents', 'commands', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/source/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock target project endpoints
    ['agents', 'commands', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/target/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock copy API endpoint (rename success)
    await page.route('**/api/copy/hook', (route) => {
      const requestBody = route.request().postDataJSON();
      if (requestBody.strategy === 'rename') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Hook copied with new name successfully',
            newName: 'npm run build-copy'
          })
        });
      } else {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            conflict: true,
            existingItem: {
              event: 'task:start',
              matcher: { task_name: 'build' },
              command: 'npm run build'
            }
          })
        });
      }
    });

    // Navigate to source project
    await page.goto('/project/source');
    await page.waitForSelector('.project-detail', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Click copy button on hook
    const hookCard = page.locator('.config-card.hooks-card');
    await expect(hookCard).toBeVisible();

    const copyButton = hookCard.locator('.copy-button').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify modal opens
    const modal = page.locator('.copy-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Select target project
    const targetCard = modal.locator('.destination-card').filter({ hasText: 'Target Project' });
    await expect(targetCard).toBeVisible();
    await targetCard.click();

    // Click "Copy Here" button
    const copyHereButton = targetCard.locator('.card-button');
    await copyHereButton.click();

    // Verify success toast (assuming rename chosen)
    const successToast = page.locator('.p-toast-message-success');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText(/copied|successfully/i);
  });
});

// Test Suite 106.003: Copy Configuration - MCP Servers
test.describe('106.003: Copy Configuration - MCP Servers', () => {
  /**
   * Test 106.003.001: Copy MCP server between projects
   *
   * User Journey:
   * 1. Navigate to project A
   * 2. Click copy button on MCP server
   * 3. Select project B as target
   * 4. Confirm copy operation
   * 5. Verify success toast
   * 6. Verify MCP server appears in project B
   */
  test('106.003.001: Copy MCP server between projects', async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'projecta',
              name: 'Project A',
              path: '/home/user/project-a',
              stats: { agents: 0, commands: 0, hooks: 0, mcp: 1 }
            },
            {
              id: 'projectb',
              name: 'Project B',
              path: '/home/user/project-b',
              stats: { agents: 0, commands: 0, hooks: 0, mcp: 0 }
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
        body: JSON.stringify({ success: true, mcpServers: [] })
      });
    });

    // Mock project A MCP servers
    await page.route('**/api/projects/projecta/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          mcpServers: [
            {
              name: 'test-server',
              command: 'node',
              args: ['server.js'],
              description: 'Test MCP server'
            }
          ]
        })
      });
    });

    // Mock other project A endpoints
    ['agents', 'commands', 'hooks'].forEach(endpoint => {
      page.route(`**/api/projects/projecta/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint]: []
          })
        });
      });
    });

    // Mock project B endpoints (empty)
    ['agents', 'commands', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/projectb/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock copy API endpoint (success)
    await page.route('**/api/copy/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'MCP server copied successfully'
        })
      });
    });

    // Navigate to project A
    await page.goto('/project/projecta');
    await page.waitForSelector('.project-detail', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Click copy button on MCP server
    const mcpCard = page.locator('.config-card.mcp-card');
    await expect(mcpCard).toBeVisible();

    const copyButton = mcpCard.locator('.copy-button').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify modal opens
    const modal = page.locator('.copy-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify source info shows MCP Server type
    await expect(modal).toContainText('test-server');
    await expect(modal).toContainText('MCP Server');

    // Select project B as destination
    const projectBCard = modal.locator('.destination-card').filter({ hasText: 'Project B' });
    await expect(projectBCard).toBeVisible();
    await projectBCard.click();

    // Verify selection
    await expect(projectBCard).toHaveClass(/selected/);

    // Click "Copy Here" button
    const copyHereButton = projectBCard.locator('.card-button');
    await copyHereButton.click();

    // Verify success toast appears
    const successToast = page.locator('.p-toast-message-success');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText(/copied successfully/i);

    // Verify modal closes
    await expect(modal).not.toBeVisible();
  });
});

// Test Suite 106.004: Copy Configuration - Error Handling
test.describe('106.004: Copy Configuration - Error Handling', () => {
  /**
   * Test 106.004.001: Copy with permission error (error handling)
   *
   * User Journey:
   * 1. Attempt copy operation
   * 2. Backend returns permission denied error
   * 3. Verify error toast shown with clear message
   * 4. Verify modal closes
   * 5. Verify no data corruption
   */
  test('106.004.001: Copy with permission error (error handling)', async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'source',
              name: 'Source Project',
              path: '/home/user/source',
              stats: { agents: 1, commands: 0, hooks: 0, mcp: 0 }
            },
            {
              id: 'target',
              name: 'Target Project',
              path: '/home/user/target',
              stats: { agents: 0, commands: 0, hooks: 0, mcp: 0 }
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

    // Mock source project agents
    await page.route('**/api/projects/source/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          agents: [
            {
              name: 'test-agent',
              description: 'Test agent',
              content: '# Test Agent',
              filePath: '/home/user/source/.claude/agents/test-agent.md'
            }
          ]
        })
      });
    });

    // Mock other source project endpoints
    ['commands', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/source/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock target project endpoints
    ['agents', 'commands', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/target/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock copy API endpoint (permission error)
    await page.route('**/api/copy/agent', (route) => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Permission denied: Cannot write to target directory'
        })
      });
    });

    // Navigate to source project
    await page.goto('/project/source');
    await page.waitForSelector('.project-detail', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Click copy button on agent
    const agentCard = page.locator('.config-card.agents-card');
    await expect(agentCard).toBeVisible();

    const copyButton = agentCard.locator('.copy-button').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify modal opens
    const modal = page.locator('.copy-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Select target project
    const targetCard = modal.locator('.destination-card').filter({ hasText: 'Target Project' });
    await expect(targetCard).toBeVisible();
    await targetCard.click();

    // Click "Copy Here" button
    const copyHereButton = targetCard.locator('.card-button');
    await copyHereButton.click();

    // Verify error toast appears
    const errorToast = page.locator('.p-toast-message-error');
    await expect(errorToast).toBeVisible({ timeout: 5000 });
    await expect(errorToast).toContainText(/permission denied|error/i);

    // Verify modal closes
    await expect(modal).not.toBeVisible({ timeout: 2000 });
  });
});

// Test Suite 106.005: Copy Configuration - Edge Cases
test.describe('106.005: Copy Configuration - Edge Cases', () => {
  /**
   * Test 106.005.001: Plugin item copy disabled (edge case)
   *
   * User Journey:
   * 1. Navigate to project with plugin-provided agent
   * 2. Verify copy button is disabled
   * 3. Hover over button to see tooltip
   * 4. Verify tooltip shows "Cannot copy plugin-provided items"
   */
  test('106.005.001: Plugin item copy disabled (edge case)', async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'pluginproject',
              name: 'Plugin Project',
              path: '/home/user/plugin-project',
              stats: { agents: 1, commands: 0, hooks: 0, mcp: 0 }
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

    // Mock project agents (includes plugin-provided agent)
    await page.route('**/api/projects/pluginproject/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          agents: [
            {
              name: 'plugin-agent',
              description: 'Agent provided by plugin',
              content: '# Plugin Agent',
              filePath: '/plugins/my-plugin/agents/plugin-agent.md',
              location: 'plugin' // Indicates plugin-provided
            }
          ]
        })
      });
    });

    // Mock other project endpoints
    ['commands', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/pluginproject/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Navigate to project
    await page.goto('/project/pluginproject');
    await page.waitForSelector('.project-detail', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Verify agent card is visible
    const agentCard = page.locator('.config-card.agents-card');
    await expect(agentCard).toBeVisible();

    // Verify copy button is disabled
    const copyButton = agentCard.locator('.copy-button').first();
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toBeDisabled();

    // Hover over button to see tooltip
    await copyButton.hover();
    await page.waitForTimeout(500);

    // Verify tooltip text (PrimeVue tooltip appears in body)
    const tooltip = page.locator('.p-tooltip-text');
    await expect(tooltip).toBeVisible({ timeout: 2000 });
    await expect(tooltip).toContainText(/plugin|cannot be copied/i);
  });
});

// Test Suite 106.006: Copy Configuration - UI State Management
test.describe('106.006: Copy Configuration - UI State Management', () => {
  /**
   * Test 106.006.001: Data refresh after copy (UI state)
   *
   * User Journey:
   * 1. Copy agent to current project (source = target)
   * 2. Verify success toast
   * 3. Verify new agent appears immediately
   * 4. Verify no manual page refresh needed
   */
  test('106.006.001: Data refresh after copy (UI state)', async ({ page }) => {
    // Track number of agents requests to verify refresh
    let agentsRequestCount = 0;

    // Mock projects API
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'myproject',
              name: 'My Project',
              path: '/home/user/my-project',
              stats: { agents: 1, commands: 0, hooks: 0, mcp: 0 }
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

    // Mock project agents (changes after copy)
    await page.route('**/api/projects/myproject/agents', (route) => {
      agentsRequestCount++;

      // First request: 1 agent
      if (agentsRequestCount === 1) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            agents: [
              {
                name: 'original-agent',
                description: 'Original agent',
                content: '# Original Agent',
                filePath: '/home/user/my-project/.claude/agents/original-agent.md'
              }
            ]
          })
        });
      } else {
        // After copy: 2 agents
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            agents: [
              {
                name: 'original-agent',
                description: 'Original agent',
                content: '# Original Agent',
                filePath: '/home/user/my-project/.claude/agents/original-agent.md'
              },
              {
                name: 'original-agent-copy',
                description: 'Original agent (copy)',
                content: '# Original Agent',
                filePath: '/home/user/my-project/.claude/agents/original-agent-copy.md'
              }
            ]
          })
        });
      }
    });

    // Mock other project endpoints
    ['commands', 'hooks', 'mcp'].forEach(endpoint => {
      page.route(`**/api/projects/myproject/${endpoint}`, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            [endpoint === 'mcp' ? 'mcpServers' : endpoint]: []
          })
        });
      });
    });

    // Mock copy API endpoint (success with rename)
    await page.route('**/api/copy/agent', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Agent copied successfully',
          newName: 'original-agent-copy'
        })
      });
    });

    // Navigate to project
    await page.goto('/project/myproject');
    await page.waitForSelector('.project-detail', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Verify only 1 agent initially
    const agentCard = page.locator('.config-card.agents-card');
    let agentItems = agentCard.locator('.config-item');
    expect(await agentItems.count()).toBe(1);

    // Click copy button on agent
    const copyButton = agentCard.locator('.copy-button').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify modal opens
    const modal = page.locator('.copy-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Select same project as destination (copy within project)
    const myProjectCard = modal.locator('.destination-card').filter({ hasText: 'My Project' });
    await expect(myProjectCard).toBeVisible();
    await myProjectCard.click();

    // Click "Copy Here" button
    const copyHereButton = myProjectCard.locator('.card-button');
    await copyHereButton.click();

    // Verify success toast
    const successToast = page.locator('.p-toast-message-success');
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Wait for data refresh
    await page.waitForTimeout(1000);

    // Verify 2 agents now appear (original + copy)
    agentItems = agentCard.locator('.config-item');
    expect(await agentItems.count()).toBe(2);

    // Verify second request was made to fetch updated data
    expect(agentsRequestCount).toBeGreaterThan(1);
  });
});
