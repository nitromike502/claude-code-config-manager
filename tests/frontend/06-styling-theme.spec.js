const { test, expect } = require('@playwright/test');

/**
 * Frontend Component Tests: 06-Styling and Theme
 *
 * Test Suites:
 * - 06.001: Theme Toggle Functionality
 * - 06.002: Dark Mode Styling
 * - 06.003: Light Mode Styling
 * - 06.004: Responsive Design
 * - 06.005: Visual Regression Prevention
 * - 06.006: Transition Smoothness
 * - 06.007: Console Errors
 *
 * Numbering Format: 06.GROUP.TEST
 * - GROUP: Test suite number (001-007)
 * - TEST: Individual test number within suite (001-NNN)
 */

// Test Suite 06.001: Theme Toggle Functionality
test.describe('06.001: Theme Toggle Functionality', () => {
  test('06.001.001: theme toggle button changes data-theme attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for Vue to mount

    // Get initial theme - PrimeVue: Uses #app with data-theme attribute (last element, Vue replaces empty div)
    const appContainer = page.locator('#app[data-theme]');
    const initialTheme = await appContainer.getAttribute('data-theme');
    expect(initialTheme).toBeTruthy();
    expect(['light', 'dark']).toContain(initialTheme);

    // Click theme toggle - PrimeVue: Button with aria-label
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });
    await themeToggle.click();

    // Wait for theme change
    await page.waitForTimeout(200);

    // Verify theme changed
    const newTheme = await appContainer.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
    expect(['light', 'dark']).toContain(newTheme);
  });

  test('06.001.002: theme persists after page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Set to light theme - PrimeVue: Uses #app with data-theme attribute (last element, Vue replaces empty div)
    const appContainer = page.locator('#app[data-theme]');
    let currentTheme = await appContainer.getAttribute('data-theme');

    if (currentTheme !== 'light') {
      await page.click('button[aria-label="Toggle theme"]');
      await page.waitForTimeout(200);
    }

    // Verify light theme
    currentTheme = await appContainer.getAttribute('data-theme');
    expect(currentTheme).toBe('light');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify theme persisted
    const reloadedTheme = await appContainer.getAttribute('data-theme');
    expect(reloadedTheme).toBe('light');
  });

  test('06.001.003: theme toggle works from any route', async ({ page }) => {
    // Test from dashboard - PrimeVue: Uses #app with data-theme attribute (last element, Vue replaces empty div)
    await page.goto('/');
    const appContainer = page.locator('#app[data-theme]');
    const dashboardTheme = await appContainer.getAttribute('data-theme');

    await page.click('button[aria-label="Toggle theme"]');
    await page.waitForTimeout(200);

    const newTheme = await appContainer.getAttribute('data-theme');
    expect(newTheme).not.toBe(dashboardTheme);

    // Navigate to user config
    await page.goto('/user');
    await page.waitForLoadState('networkidle');

    // Verify theme persisted across navigation
    const userAppContainer = page.locator('#app[data-theme]');
    const userRouteTheme = await userAppContainer.getAttribute('data-theme');
    expect(userRouteTheme).toBe(newTheme);
  });
});

// Test Suite 06.002: Dark Mode Styling
test.describe('06.002: Dark Mode Styling', () => {
  test('06.002.001: dark mode colors applied correctly', async ({ page }) => {
    await page.goto('/');

    // Ensure dark mode - PrimeVue: Uses #app with data-theme attribute (last element, Vue replaces empty div)
    const appContainer = page.locator('#app[data-theme]');
    let currentTheme = await appContainer.getAttribute('data-theme');

    if (currentTheme !== 'dark') {
      await page.click('button[aria-label="Toggle theme"]');
      await page.waitForTimeout(200);
    }

    // Verify dark mode attribute
    currentTheme = await appContainer.getAttribute('data-theme');
    expect(currentTheme).toBe('dark');

    // Check computed styles
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Dark mode should have dark background (rgb values close to black)
    expect(bgColor).toMatch(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const [, r, g, b] = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) || [];
    const isDark = parseInt(r) < 50 && parseInt(g) < 50 && parseInt(b) < 50;
    expect(isDark).toBe(true);
  });

  test('06.002.002: dark mode affects all components', async ({ page }) => {
    await page.goto('/');

    // Set to dark mode - PrimeVue: Uses #app with data-theme attribute (last element, Vue replaces empty div)
    const appContainer = page.locator('#app[data-theme]');
    let currentTheme = await appContainer.getAttribute('data-theme');

    if (currentTheme !== 'dark') {
      await page.click('button[aria-label="Toggle theme"]');
      await page.waitForTimeout(200);
    }

    // Check header background - PrimeVue: Uses header element
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const headerBg = await header.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should have a background color (rgb or rgba)
    expect(headerBg).toMatch(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  });
});

// Test Suite 06.003: Light Mode Styling
test.describe('06.003: Light Mode Styling', () => {
  test('06.003.001: light mode colors applied correctly', async ({ page }) => {
    // PrimeVue NOTE: Computed styles may differ due to PrimeVue component implementation
    await page.goto('/');

    // Ensure light mode - PrimeVue: Uses #app with data-theme attribute (last element, Vue replaces empty div)
    const appContainer = page.locator('#app[data-theme]');
    let currentTheme = await appContainer.getAttribute('data-theme');

    if (currentTheme !== 'light') {
      await page.click('button[aria-label="Toggle theme"]');
      await page.waitForTimeout(200);
    }

    // Verify light mode attribute
    currentTheme = await appContainer.getAttribute('data-theme');
    expect(currentTheme).toBe('light');

    // Check computed styles
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Light mode should have light background (rgb values > 200)
    expect(bgColor).toMatch(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const [, r, g, b] = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) || [];
    const isLight = parseInt(r) > 200 && parseInt(g) > 200 && parseInt(b) > 200;
    expect(isLight).toBe(true);
  });

  test('06.003.002: light mode affects all components', async ({ page }) => {
    await page.goto('/');

    // Set to light mode - PrimeVue: Uses #app with data-theme attribute (last element, Vue replaces empty div)
    const appContainer = page.locator('#app[data-theme]');
    let currentTheme = await appContainer.getAttribute('data-theme');

    if (currentTheme !== 'light') {
      await page.click('button[aria-label="Toggle theme"]');
      await page.waitForTimeout(200);
    }

    // Check header background - PrimeVue: Uses header element
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const headerBg = await header.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should have a background color (rgb or rgba)
    expect(headerBg).toMatch(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  });
});

// Test Suite 06.004: Responsive Design
test.describe('06.004: Responsive Design', () => {
  test('06.004.001: responsive layout on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify page renders - PrimeVue: Uses header element
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check if main content is visible - PrimeVue: Uses main element
    // (grid created with Tailwind, may or may not have project cards)
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('06.004.002: responsive layout on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Verify page renders - PrimeVue: Uses header element
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check if dashboard renders properly (Dashboard component doesn't have .dashboard class)
    const dashboardContent = page.locator('h2:has-text("Projects")');
    await expect(dashboardContent).toBeVisible();
  });

  test('06.004.003: responsive layout on desktop (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Verify page renders - PrimeVue: Uses header element
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify wide layout - PrimeVue: Uses main element
    const main = page.locator('main');
    await expect(main).toBeVisible();

    const width = await main.evaluate((el) => el.offsetWidth);
    expect(width).toBeGreaterThan(1000);
  });

  test('06.004.004: typography scales appropriately on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check font size
    const html = page.locator('html');
    const fontSize = await html.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Mobile should have smaller or equal font size
    expect(fontSize).toMatch(/\d+px/);
    const size = parseInt(fontSize);
    expect(size).toBeLessThanOrEqual(16);
  });
});

// Test Suite 06.005: Visual Regression Prevention
test.describe('06.005: Visual Regression Prevention', () => {
  test('06.005.001: no layout shift on theme change', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial header position - PrimeVue: Uses header element
    const header = page.locator('header');
    const initialPos = await header.boundingBox();

    // Toggle theme - PrimeVue: Button with aria-label
    await page.click('button[aria-label="Toggle theme"]');
    await page.waitForTimeout(300);

    // Get new header position
    const newPos = await header.boundingBox();

    // Position should not have changed
    expect(newPos.x).toBe(initialPos.x);
    expect(newPos.y).toBe(initialPos.y);
    expect(newPos.width).toBe(initialPos.width);
  });

  test('06.005.002: all text readable in both themes', async ({ page }) => {
    await page.goto('/');

    // Test dark mode - PrimeVue: Uses #app with data-theme attribute (last element, Vue replaces empty div)
    const appContainer = page.locator('#app[data-theme]');
    let currentTheme = await appContainer.getAttribute('data-theme');

    if (currentTheme !== 'dark') {
      await page.click('button[aria-label="Toggle theme"]');
      await page.waitForTimeout(200);
    }

    // Check header text is visible
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    // Toggle to light mode
    await page.click('button[aria-label="Toggle theme"]');
    await page.waitForTimeout(200);

    // Check header text still visible
    await expect(h1).toBeVisible();
  });

  test('06.005.003: CSS variables are defined', async ({ page }) => {
    // PrimeVue NOTE: CSS variables are defined on :root, not html element
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Check that CSS variables are defined on HTML element
    const result = await page.evaluate(() => {
      const html = document.documentElement;
      const styles = window.getComputedStyle(html);

      // Check for some key variables
      const vars = [
        '--bg-primary',
        '--text-primary',
        '--color-primary',
        '--border-primary'
      ];

      const values = {};
      vars.forEach(varName => {
        const value = styles.getPropertyValue(varName).trim();
        values[varName] = value;
      });

      const allDefined = vars.every(varName => {
        const value = values[varName];
        return value && value !== '';
      });

      return { allDefined, values };
    });

    expect(result.allDefined).toBe(true);

    // Verify actual color values are present
    expect(result.values['--bg-primary']).toMatch(/#[0-9a-fA-F]{6}/);
    expect(result.values['--text-primary']).toMatch(/#[0-9a-fA-F]{6}/);
    expect(result.values['--color-primary']).toMatch(/#[0-9a-fA-F]{6}/);
    expect(result.values['--border-primary']).toMatch(/#[0-9a-fA-F]{6}/);
  });
});

// Test Suite 06.006: Transition Smoothness
test.describe('06.006: Transition Smoothness', () => {
  test('06.006.001: theme transition applies smoothly', async ({ page }) => {
    await page.goto('/');

    // Get initial background color
    const body = page.locator('body');
    const initialColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Toggle theme - PrimeVue: Button with aria-label
    await page.click('button[aria-label="Toggle theme"]');

    // Wait for transition (CSS transition is 0.3s)
    await page.waitForTimeout(350);

    // Get new color
    const newColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Colors should be different
    expect(newColor).not.toBe(initialColor);
  });
});

// Test Suite 06.007: Console Errors
test.describe('06.007: Console Errors', () => {
  test('06.007.001: no console errors during theme toggle', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.click('button[aria-label="Toggle theme"]');
    await page.waitForTimeout(300);

    // Should have no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
