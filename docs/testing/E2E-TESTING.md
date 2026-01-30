# End-to-End Testing Guide

## Overview

This document describes the end-to-end (e2e) test suite for the Claude Code Config Manager application. These tests validate complete user workflows from start to finish, ensuring all parts of the application work together correctly.

## Test Organization

```
tests/
├── e2e/                                                 # End-to-end flow tests
│   ├── 100-complete-user-flows-integration.spec.js     # Complete user flows
│   ├── 101-user-flow-project-discovery.spec.js         # First-time user project discovery
│   ├── 102-user-flow-configuration-viewing.spec.js     # Configuration browsing
│   ├── 103-user-flow-search-filter.spec.js             # Search/filter functionality
│   ├── 104-user-flow-error-handling.spec.js            # Error recovery
│   └── 105-user-flow-theme-toggle.spec.js              # Theme persistence
├── frontend/                                            # Component-level tests
│   ├── 01-app-smoke.spec.js                            # Basic app functionality
│   ├── 02-project-detail.spec.js                       # Project detail components
│   └── visual/
│       └── 300-visual-regression.spec.js                # Visual regression tests
├── responsive/
│   └── 200-layout-responsive.spec.js                    # Responsive layout tests
└── helpers/                                             # Test utilities
    └── page-objects.js                                  # Page object models
```

## Critical User Flows

### Flow 1: First-Time User - Project Discovery

**Test File:** `101-user-flow-project-discovery.spec.js`

**Journey:**
1. User opens app (empty state or project list)
2. App loads projects from `~/.claude.json`
3. User sees project cards with statistics
4. User clicks a project
5. Detail view loads with all configuration information
6. User navigates back to dashboard

**Key Tests:**
- Complete project discovery journey
- Project discovery with empty state
- Loading state displays correctly
- Performance: Dashboard loads in under 2 seconds
- No console errors during flow

### Flow 2: Configuration Viewing Journey

**Test File:** `102-user-flow-configuration-viewing.spec.js`

**Journey:**
1. User selects a project
2. Views subagent configurations
3. Views slash commands
4. Views hooks
5. Views MCP servers
6. Switches between sections
7. Returns to project list

**Key Tests:**
- Navigate through project detail view structure
- Display correct statistics for multiple projects
- Handle projects with zero configurations
- Configuration icons display correctly
- Responsive design works on all viewports

**Note:** This flow is partially forward-looking. Configuration cards (Story 3.2) are not yet implemented, so tests validate the foundation structure.

### Flow 3: Theme Toggle & Persistence

**Test File:** `105-user-flow-theme-toggle.spec.js`

**Journey:**
1. User opens application (default theme loads)
2. User toggles theme
3. Theme persists across navigation
4. Theme persists on page reload
5. Theme preference saved in localStorage

**Key Tests:**
- Theme persists across navigation and reload
- Theme works independently on dashboard and detail pages
- Theme preference loads from localStorage
- Multiple toggles work correctly
- Smooth visual transitions
- Accessible title attributes
- Works correctly on different viewports

### Flow 4: Error Handling

**Test File:** `104-user-flow-error-handling.spec.js`

**Journey:**
1. User encounters API errors
2. Application shows clear error messages
3. User can retry failed operations
4. Application handles missing directories
5. Application shows warnings for malformed configs
6. User can continue working despite warnings

**Key Tests:**
- User recovers from API failure using retry
- Navigate through app with warnings present
- Missing project ID shows helpful error
- Non-existent project ID shows not found error
- Network failure shows connection error
- Malformed JSON shows error
- Multiple consecutive errors can be retried
- Error state doesn't break theme toggle

### Flow 5: Search & Filter

**Test File:** `103-user-flow-search-filter.spec.js`

**Journey:**
1. User sees full project list
2. User types in search field
3. Results filter in real-time
4. User clears search
5. Full list returns
6. Search persists appropriate state

**Key Tests:**
- Search by project name filters correctly
- Search by project path filters correctly
- Search is case-insensitive
- Empty search shows all projects
- No results shows empty state
- Search works after navigation
- Rapid search input updates correctly
- Search works on mobile viewport

## Page Object Models

Located in `tests/helpers/page-objects.js`, these provide reusable methods for interacting with pages:

### DashboardPage

```javascript
const { DashboardPage } = require('../helpers/page-objects');

test('example', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await dashboard.waitForProjectsToLoad();
  await dashboard.searchProjects('My App');
  await dashboard.selectProject(0);
});
```

**Methods:**
- `goto()` - Navigate to dashboard
- `waitForProjectsToLoad()` - Wait for projects to render
- `searchProjects(query)` - Search for projects
- `clearSearch()` - Clear search field
- `selectProject(index)` - Click project by index
- `selectProjectById(projectId)` - Click project by ID/name
- `toggleTheme()` - Switch theme
- `refreshProjects()` - Click refresh button
- `expectProjectCount(count)` - Assert project count
- `expectLoadingState()` - Assert loading state visible
- `expectErrorState()` - Assert error state visible
- `expectEmptyState()` - Assert empty state visible

### ProjectDetailPage

```javascript
const { ProjectDetailPage } = require('../helpers/page-objects');

test('example', async ({ page }) => {
  const detailPage = new ProjectDetailPage(page);
  await detailPage.goto('myproject');
  await detailPage.waitForContentToLoad();
  await detailPage.expectProjectName('My Project');
  await detailPage.expectStatCount('agents', 5);
});
```

**Methods:**
- `goto(projectId)` - Navigate to project detail
- `waitForContentToLoad()` - Wait for content to render
- `goToDashboard()` - Click dashboard breadcrumb
- `toggleTheme()` - Switch theme
- `searchConfigurations(query)` - Search configs
- `retry()` - Click retry button
- `expectProjectName(name)` - Assert project name
- `expectStatCount(type, count)` - Assert stat count
- `expectWarningCount(count)` - Assert warning count

### ApiMock

Helper for mocking API responses:

```javascript
const { ApiMock } = require('../helpers/page-objects');

test('example', async ({ page }) => {
  const api = new ApiMock(page);

  // Mock successful response
  const projects = api.createProjects(5);
  await api.mockProjects(projects);

  // Or mock error
  await api.mockProjectsError('Database error');

  // Or mock network failure
  await api.mockNetworkFailure();
});
```

### ThemeHelper

Helper for theme testing:

```javascript
const { ThemeHelper } = require('../helpers/page-objects');

test('example', async ({ page }) => {
  const theme = new ThemeHelper(page);
  await theme.expectTheme('dark');
  await theme.setStoredTheme('light');
  await page.reload();
  await theme.expectTheme('light');
});
```

### ConsoleErrorTracker

Tracks console errors during tests:

```javascript
const { ConsoleErrorTracker } = require('../helpers/page-objects');

test('example', async ({ page }) => {
  const errorTracker = new ConsoleErrorTracker(page);

  // Perform actions...

  errorTracker.expectNoErrors();
  // Or check manually
  expect(errorTracker.getErrors()).toEqual([]);
});
```

## Running E2E Tests

### Run all tests (backend + frontend + e2e)
```bash
npm run test:full
```

### Run only frontend tests (component + e2e)
```bash
npm run test:frontend
```

### Run only e2e tests
```bash
npm run test:frontend:e2e
```

### Run only component tests
```bash
npm run test:frontend:component
```

### Run specific test file
```bash
npx playwright test tests/e2e/101-user-flow-project-discovery.spec.js
```

### Run tests in headed mode (see browser)
```bash
npx playwright test tests/e2e --headed
```

### Run tests in debug mode
```bash
npx playwright test tests/e2e --debug
```

### View test report
```bash
npx playwright show-report
```

## Writing New E2E Tests

### Best Practices

1. **Test User Behavior, Not Implementation**
   ```javascript
   // Good: Test what user sees/does
   await page.click('.project-card');
   await expect(page.locator('.project-info-title')).toContainText('My Project');

   // Bad: Test implementation details
   await expect(page.locator('#project-data-loaded')).toBe(true);
   ```

2. **Use Page Objects for Maintainability**
   ```javascript
   // Good: Use page object
   const dashboard = new DashboardPage(page);
   await dashboard.selectProject(0);

   // Bad: Direct selectors everywhere
   await page.click('.project-card:first-child');
   ```

3. **Test Complete Flows, Not Isolated Steps**
   ```javascript
   // Good: Test complete journey
   test('user discovers and views project', async ({ page }) => {
     // 1. Open app
     // 2. See projects
     // 3. Click project
     // 4. View details
     // 5. Navigate back
   });

   // Bad: Test single action
   test('user clicks project', async ({ page }) => {
     await page.click('.project-card');
   });
   ```

4. **Mock API Responses for Consistency**
   ```javascript
   // Good: Mock for predictable data
   await page.route('/api/projects', (route) => {
     route.fulfill({ body: JSON.stringify({ success: true, projects: [...] }) });
   });

   // Bad: Rely on real data (flaky)
   await page.goto('/');
   // Hope projects exist...
   ```

5. **Assert on User-Visible Elements**
   ```javascript
   // Good: Assert user sees something
   await expect(page.locator('.project-name')).toContainText('My Project');

   // Bad: Assert on data attributes
   await expect(page.locator('[data-project-id="123"]')).toBeVisible();
   ```

6. **Handle Async Operations Properly**
   ```javascript
   // Good: Wait for elements
   await page.waitForSelector('.project-grid', { timeout: 10000 });

   // Bad: Arbitrary waits
   await page.waitForTimeout(5000);
   ```

7. **Test Error Scenarios**
   ```javascript
   // Always test both success and failure paths
   test('success case', ...);
   test('error case', ...);
   test('edge case', ...);
   ```

### Test Template

```javascript
const { test, expect } = require('@playwright/test');
const { DashboardPage, ApiMock } = require('../helpers/page-objects');

test.describe('E2E Flow: [Flow Name]', () => {
  test('[main happy path]', async ({ page }) => {
    // Setup
    const api = new ApiMock(page);
    await api.mockProjects(api.createProjects(3));

    const dashboard = new DashboardPage(page);

    // STEP 1: [Description]
    await dashboard.goto();
    await dashboard.waitForProjectsToLoad();

    // STEP 2: [Description]
    await dashboard.selectProject(0);

    // STEP 3: [Description]
    // ... assertions ...
  });

  test('[error scenario]', async ({ page }) => {
    // Test error handling
  });

  test('[edge case]', async ({ page }) => {
    // Test edge cases
  });
});
```

## Performance Testing

E2E tests include basic performance assertions:

```javascript
test('performance: dashboard loads in under 2 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForSelector('.project-grid');
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(2000);
});
```

**Performance Targets:**
- Dashboard initial load: < 2 seconds
- Project detail load: < 1 second
- Search filter response: < 200ms
- Theme toggle: < 100ms

## Console Error Detection

All e2e tests include console error tracking:

```javascript
test('no console errors during flow', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // Perform actions...

  expect(consoleErrors).toEqual([]);
});
```

This ensures the application runs cleanly without JavaScript errors.

## CI/CD Integration

E2E tests are designed to run in CI environments:

- Playwright automatically starts the dev server
- Tests run in headless mode
- Screenshots/videos captured on failure
- HTML report generated
- Exit code 0 = all tests pass, non-zero = failures

## Maintenance

### When to Update E2E Tests

1. **User flows change** - Update affected flow tests
2. **New features added** - Create new flow tests
3. **UI elements change** - Update page object selectors
4. **API responses change** - Update mock data
5. **Bugs fixed** - Add regression test to e2e suite

### Keeping Tests Fast

- Mock API responses (don't hit real backend)
- Run tests in parallel (Playwright does this by default)
- Use page objects to avoid duplication
- Focus on critical paths (don't test every permutation)
- Keep test data minimal

### Avoiding Flaky Tests

- Always wait for elements explicitly
- Use `waitForSelector` with timeouts
- Avoid `page.waitForTimeout()` unless necessary
- Mock time-sensitive operations
- Use stable selectors (classes, not nth-child)

## Troubleshooting

### Tests fail locally but pass in CI
- Check Node version matches CI
- Clear node_modules and reinstall
- Check for local state (localStorage, etc.)

### Tests are slow
- Check if real API is being hit (should be mocked)
- Reduce timeout values if safe
- Run specific test files, not full suite

### Tests are flaky
- Add explicit waits for dynamic content
- Increase timeout values
- Check for race conditions
- Verify API mocks are working

### Screenshots/videos not captured
- Check Playwright config
- Ensure tests are actually failing
- Check disk space

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Pattern](https://playwright.dev/docs/pom)
- [CI/CD Guide](https://playwright.dev/docs/ci)
