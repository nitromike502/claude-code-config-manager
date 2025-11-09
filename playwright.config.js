const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Claude Code Manager Frontend Tests
 *
 * Test Directories:
 * - tests/frontend: Component-level tests for UI elements
 * - tests/e2e: End-to-end user flow tests
 *
 * Phase 1: Chromium-only testing for initial infrastructure setup
 * Phase 2: Will expand to Firefox and WebKit for cross-browser coverage
 */
module.exports = defineConfig({
  // Test directories (searches recursively for *.spec.js files)
  testDir: './tests',
  testMatch: ['**/tests/{frontend,e2e,responsive}/**/*.spec.js'],

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests (Phase 2: Vite dev server on port 5173)
    baseURL: 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording on failure
    video: 'retain-on-failure',

    // Default timeout for actions (e.g., click, fill)
    actionTimeout: 10000,
  },

  // Visual regression testing settings
  expect: {
    // Timeout for expect assertions (including screenshot comparisons)
    timeout: 10000,

    // Screenshot comparison settings
    toHaveScreenshot: {
      // Maximum allowed difference in pixels
      maxDiffPixels: 100,

      // Maximum allowed difference ratio (0-1)
      maxDiffPixelRatio: 0.002,

      // Threshold for pixel color difference (0-1)
      threshold: 0.2,

      // CSS animations: 'allow' | 'disabled'
      animations: 'disabled',

      // CSS transitions: 'allow' | 'none'
      caret: 'hide',

      // Image comparison method: 'pixelmatch'
      // Using pixelmatch for consistent, reliable comparisons
    },
  },

  // Configure projects for major browsers (Phase 2: Multi-browser testing enabled)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev', // Phase 2: Use Vite dev server
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000, // 30 seconds
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
