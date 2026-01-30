# Testing Documentation

This directory contains all testing documentation for the Claude Code Config Manager project.

## Quick Start

### Run Tests

```bash
# Run all backend tests
npm test

# Run backend tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Generate coverage report
npm run test:coverage
```

## Test Infrastructure

### Backend Testing (Jest + Supertest)

**Framework:** Jest + Supertest
**Test Location:** `tests/backend/`

**Test Categories:**
- API endpoint tests for all routes
- Parser unit tests (agents, commands, skills, hooks, MCP)
- Service tests (copy, update, delete, validation)
- Error handling and edge cases

### Frontend Testing (Playwright)

**Framework:** Playwright
**Test Location:** `tests/frontend/`, `tests/e2e/`

**Test Categories:**
- E2E integration tests (user workflows)
- Component tests (rendering, interactions)
- Responsive design tests (mobile, tablet, desktop)
- Visual regression tests (cross-browser baselines)

**Naming Convention:** Hierarchical numbering `XX.YYY.ZZZ`

## Test Documentation Index

| Document | Purpose |
|----------|---------|
| [TEST-FILE-INDEX.md](TEST-FILE-INDEX.md) | Complete index of all tests |
| [TEST-FILE-MAPPING.md](TEST-FILE-MAPPING.md) | Test file organization |
| [TEST-PATTERNS-REFERENCE.md](TEST-PATTERNS-REFERENCE.md) | Common test patterns |
| [E2E-TESTING.md](E2E-TESTING.md) | E2E testing patterns |
| [TESTING-STRUCTURE.md](TESTING-STRUCTURE.md) | Test organization |
| [VISUAL-REGRESSION-TESTING.md](VISUAL-REGRESSION-TESTING.md) | Visual regression testing |
| [VISUAL-REGRESSION-QUICK-START.md](VISUAL-REGRESSION-QUICK-START.md) | Visual testing quick start |
| [NPX-TESTING-GUIDE.md](NPX-TESTING-GUIDE.md) | NPX test execution |

## Configuration Files

- `jest.config.js` - Jest configuration
- `tests/setup.js` - Jest setup file (sets NODE_ENV=test)
- `playwright.config.js` - Playwright configuration

## Test Fixtures

**Location:** `tests/fixtures/`

Contains:
- Sample project directory structures
- Valid/invalid agent, command, skill markdown files
- Sample settings.json and .mcp.json files
- Mock data for API testing

## Automated Quality Gate

Per the project workflow, **all tests must pass before creating Pull Requests**.

**Workflow:**
1. Developer implements feature
2. test-automation-engineer runs tests
   - If pass → Proceed to PR creation
   - If fail → Return to developer to fix
3. git-workflow-specialist creates PR (only after tests pass)
4. Code review and merge

**Hard Block:** PRs cannot be created if tests fail.

## Test Development Guidelines

### Backend Tests (Jest)

**File naming:** `{feature}.test.js`
**Location:** `tests/backend/`

**Example:**
```javascript
const request = require('supertest');
const app = require('../../src/backend/server');

describe('Feature Name', () => {
  test('should do something', async () => {
    const response = await request(app).get('/api/endpoint');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

### Frontend Tests (Playwright)

**File naming:** `XX-{feature}.spec.js`
**Location:** `tests/frontend/` or `tests/e2e/`

**Example:**
```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('XX.YYY.ZZZ: should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.element')).toBeVisible();
  });
});
```

## Troubleshooting

### Tests Won't Run

```bash
# Check Jest is installed
npx jest --version

# List all test files
npx jest --listTests

# Run with verbose output
npx jest --verbose
```

### Port Conflicts

If you see "EADDRINUSE" errors:
1. Ensure no other server is running on port 8420
2. `NODE_ENV=test` is set in tests (handled by setup.js)

### Test Hangs

```bash
# Detect open handles preventing exit
npx jest --detectOpenHandles
```

## Contributing

When adding new tests:
1. Follow existing test structure and naming conventions
2. Write descriptive test names that explain what's being tested
3. Use Arrange-Act-Assert pattern
4. One assertion per test when possible
5. Update TEST-FILE-INDEX.md when adding new test files

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Playwright Documentation](https://playwright.dev/)
