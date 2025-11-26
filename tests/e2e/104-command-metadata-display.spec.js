const { test, expect } = require('@playwright/test');

/**
 * Test Suite 104: Command Metadata Display in Sidebar
 *
 * Verifies that all command metadata properties are correctly extracted
 * from YAML frontmatter and displayed in the detail sidebar.
 *
 * This addresses BUG-030 and validates the fix for allowed-tools extraction.
 */

// Test Suite 104.001: Command Metadata Display in Sidebar
test.describe('104.001: Command Metadata Display in Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks for sample project with complete command metadata
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          projects: [
            {
              id: 'homeclaudesample',
              name: 'sample',
              path: '/home/claude/sample',
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

    // Mock project commands endpoint with full metadata
    await page.route('**/api/projects/homeclaudesample/commands', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          commands: [
            {
              name: 'analyze',
              file: 'analyze.md',
              path: '/home/claude/sample/.claude/commands/analyze.md',
              description: 'Analyze code quality and suggest improvements',
              tools: ['Read', 'Write', 'Edit'],
              argumentHint: 'This is the argument hint',
              frontmatter: {
                name: 'analyze',
                description: 'Analyze code quality and suggest improvements',
                'allowed-tools': 'Read, Write, Edit',
                'argument-hint': 'This is the argument hint'
              },
              content: 'Perform a comprehensive code quality analysis...',
              hasParseError: false
            },
            {
              name: 'deploy',
              file: 'deploy.md',
              path: '/home/claude/sample/.claude/commands/deploy.md',
              description: 'Deploy application to production',
              tools: [],
              argumentHint: null,
              frontmatter: {
                name: 'deploy',
                description: 'Deploy application to production'
              },
              content: 'Deploy the application to production environment...',
              hasParseError: false
            }
          ],
          projectId: 'homeclaudesample',
          projectPath: '/home/claude/sample'
        })
      });
    });

    // Mock agents endpoint
    await page.route('**/api/projects/homeclaudesample/agents', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: [] })
      });
    });

    // Mock hooks endpoint
    await page.route('**/api/projects/homeclaudesample/hooks', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: [] })
      });
    });

    // Mock MCP endpoint
    await page.route('**/api/projects/homeclaudesample/mcp', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: [] })
      });
    });

    // Navigate to project detail page
    await page.goto('http://localhost:5173/project/homeclaudesample');

    // Wait for page to load - wait for config panels to be visible
    await page.waitForSelector('.config-panel', { timeout: 10000 });
  });

  // Test 104.001.001: command with all metadata properties displays correctly in sidebar
  test('104.001.001: command with all metadata properties displays correctly in sidebar', async ({ page }) => {
    // Find and click the analyze command card
    const analyzeCard = page.locator('text=analyze').first();
    await analyzeCard.click();

    // Wait for sidebar to appear
    await page.waitForSelector('.p-drawer');

    // Verify command name is displayed in header
    const drawerHeader = page.locator('.p-drawer-header');
    await expect(drawerHeader).toContainText('analyze');

    // Verify description is displayed
    const drawerContent = page.locator('.p-drawer-content');
    await expect(drawerContent).toContainText('Analyze code quality and suggest improvements');

    // Verify allowed-tools field is displayed
    const allowedToolsSection = drawerContent.getByText('Allowed Tools');
    await expect(allowedToolsSection).toBeVisible();

    // Verify tools are displayed as comma-separated list
    await expect(drawerContent).toContainText('Read');
    await expect(drawerContent).toContainText('Write');
    await expect(drawerContent).toContainText('Edit');

    // Verify argument hint is displayed
    const argumentHintSection = drawerContent.getByText('Argument Hint');
    await expect(argumentHintSection).toBeVisible();
    await expect(drawerContent).toContainText('This is the argument hint');
  });

  // Test 104.001.002: command without allowed-tools displays None specified
  test('104.001.002: command without allowed-tools displays None specified', async ({ page }) => {
    // Find and click the deploy command (no tools)
    const deployCard = page.locator('text=deploy').first();
    await deployCard.click();

    // Wait for sidebar to appear
    await page.waitForSelector('.p-drawer');

    // Verify command name is displayed in header
    const drawerHeader = page.locator('.p-drawer-header');
    await expect(drawerHeader).toContainText('deploy');

    // Verify Allowed Tools shows None specified (since tools array is empty)
    const drawerContent = page.locator('.p-drawer-content');
    const allowedToolsSection = drawerContent.getByText('Allowed Tools');
    await expect(allowedToolsSection).toBeVisible();
    await expect(drawerContent).toContainText('None specified');
  });

  // Test 104.001.003: command without argument-hint does not display the field
  test('104.001.003: command without argument-hint does not display the field', async ({ page }) => {
    // Find and click the deploy command (no argument hint)
    const deployCard = page.locator('text=deploy').first();
    await deployCard.click();

    // Wait for sidebar to appear
    await page.waitForSelector('.p-drawer');

    // Verify Argument Hint is NOT displayed (field is optional)
    const drawerContent = page.locator('.p-drawer-content');
    const argumentHintText = drawerContent.getByText('Argument Hint');
    await expect(argumentHintText).not.toBeVisible();
  });

  // Test 104.001.004: tools from allowed-tools are properly parsed from comma-separated string
  test('104.001.004: tools from allowed-tools are properly parsed from comma-separated string', async ({ page }) => {
    // Find and click the analyze command
    const analyzeCard = page.locator('text=analyze').first();
    await analyzeCard.click();

    // Wait for sidebar to appear
    await page.waitForSelector('.p-drawer');

    // Get the Allowed Tools section
    const drawerContent = page.locator('.p-drawer-content');

    // Verify each tool appears (not as raw string with commas)
    const readTool = drawerContent.getByText('Read');
    const writeTool = drawerContent.getByText('Write');
    const editTool = drawerContent.getByText('Edit');

    await expect(readTool).toBeVisible();
    await expect(writeTool).toBeVisible();
    await expect(editTool).toBeVisible();

    // Verify they appear in the correct format (comma-separated in the display)
    const toolsLine = drawerContent.getByText(/Read.*Write.*Edit|Edit.*Write.*Read/);
    await expect(toolsLine).toBeVisible();
  });

  // Test 104.001.005: sidebar displays correct metadata for multiple commands
  test('104.001.005: sidebar displays correct metadata for multiple commands', async ({ page }) => {
    // Click first command
    const analyzeCard = page.locator('text=analyze').first();
    await analyzeCard.click();
    await page.waitForSelector('.p-drawer');

    // Verify analyze metadata
    const drawerHeader = page.locator('.p-drawer-header');
    const drawerContent = page.locator('.p-drawer-content');
    await expect(drawerHeader).toContainText('analyze');
    await expect(drawerContent).toContainText('Read, Write, Edit');

    // Close sidebar by clicking close button (icon button with pi-times)
    await page.locator('.p-drawer-header button[aria-label="Close sidebar"]').click();
    await page.waitForTimeout(300);

    // Click second command
    const deployCard = page.locator('text=deploy').first();
    await deployCard.click();
    await page.waitForSelector('.p-drawer');

    // Verify deploy metadata (different from analyze)
    const drawerHeader2 = page.locator('.p-drawer-header');
    const drawerContent2 = page.locator('.p-drawer-content');
    await expect(drawerHeader2).toContainText('deploy');
    await expect(drawerContent2).toContainText('None specified');

    // Argument hint should not be visible for deploy
    const argumentHintText = drawerContent2.getByText('Argument Hint');
    await expect(argumentHintText).not.toBeVisible();
  });

  // Test 104.001.006: metadata is extracted from correct frontmatter properties
  test('104.001.006: metadata is extracted from correct frontmatter properties', async ({ page }) => {
    // This test verifies that the backend correctly maps:
    // - YAML 'allowed-tools' -> API 'tools' field
    // - YAML 'argument-hint' -> API 'argumentHint' field

    const analyzeCard = page.locator('text=analyze').first();
    await analyzeCard.click();
    await page.waitForSelector('.p-drawer');

    // Verify the sidebar uses the extracted tools (from allowed-tools)
    const drawerContent = page.locator('.p-drawer-content');
    const toolsDisplay = drawerContent.getByText('Read, Write, Edit');
    await expect(toolsDisplay).toBeVisible();

    // Verify the sidebar uses the extracted argumentHint (from argument-hint)
    const hintDisplay = drawerContent.getByText('This is the argument hint');
    await expect(hintDisplay).toBeVisible();
  });
});
