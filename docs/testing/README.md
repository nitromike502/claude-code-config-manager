# Testing Documentation

This directory contains all testing infrastructure and documentation for the Claude Code Config Manager project.

## Quick Start

### Run Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run tests in watch mode (development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Testing Infrastructure

### Backend Testing (Jest + Supertest)

**Framework:** Jest 30.2.0 + Supertest 7.1.4
**Status:** ✅ COMPLETE - 270 tests passing (100%)
**Test Location:** `/home/claude/manager/tests/backend/`

**Current Test Coverage:**
- 270 comprehensive backend tests
- API endpoint tests for all routes
- Parser unit tests (agents, commands, hooks, MCP)
- Error handling and edge cases
- Regression tests for resolved bugs
- Cross-platform path handling

### Frontend Testing (Playwright)

**Framework:** Playwright 1.56.0
**Status:** ✅ COMPLETE - 311/311 tests passing (100%)
**Test Location:** `/home/claude/manager/tests/`
**Phase 2 Complete:** All tests updated for Vite+Vue3 SPA architecture

**Current Test Coverage:**
- **90 E2E Integration Tests** (Tests 100, 101, 102, 105)
  - Complete user workflows
  - Project discovery and navigation
  - Configuration viewing and interactions
  - Theme toggle and persistence
  - All 90 tests passing ✅
- **120 Component Tests** (Tests 01-06, 23)
  - App smoke tests, routing, project detail
  - Component rendering and interactions
  - API integration, Pinia stores
  - Styling and theming
  - All 120 tests passing ✅
- **44 Responsive Design Tests** (Test 200)
  - Mobile (iPhone SE), tablet (iPad), desktop (Full HD) viewports
  - Layout adaptation verification
  - Touch target and readability tests
  - All 44 tests passing ✅
- **57 Visual Regression Tests** (Test 300)
  - Dashboard states, theme switching
  - Component rendering, responsive layouts
  - Interactive states, cross-browser baselines
  - Cross-browser: Chromium, Firefox, WebKit
  - All 57 tests passing ✅
- Hierarchical numbering: `[Test XX.YYY.ZZZ]`
- Centralized mock fixtures with proper route ordering

**Key Documentation:**
- [`FRONTEND_TEST_INFRASTRUCTURE.md`](../FRONTEND_TEST_INFRASTRUCTURE.md) - Complete reference guide
- [`MOCK_FIXTURES_GUIDE.md`](../tests/MOCK_FIXTURES_GUIDE.md) - Mock fixtures usage
- [`E2E-FRONTEND-TEST-COMPLETION-SUMMARY-2025-10-20.md`](./E2E-FRONTEND-TEST-COMPLETION-SUMMARY-2025-10-20.md) - This session's completion summary

## Test Reports

All test execution reports are saved in `/home/claude/manager/docs/testing/test-reports/`

**Latest Report:** `jest-setup-report-20251012-000422.md`

## Configuration Files

- `/home/claude/manager/jest.config.js` - Jest configuration
- `/home/claude/manager/tests/setup.js` - Jest setup file (sets NODE_ENV=test)
- `/home/claude/manager/playwright.config.js` - Playwright configuration (future)

## Test Suite Status

### Phase 1 MVP (✅ COMPLETE)
**Backend (Jest) - 270 tests**
- [x] Jest infrastructure set up
- [x] Supertest integrated for API testing
- [x] Test directory structure created
- [x] Server modified for testability
- [x] 270 tests passing (API, parsers, error handling)
- [x] Test scripts added to package.json
- [x] Documentation complete

### Phase 2 Vite Migration (✅ COMPLETE - October 2025)

**Frontend Test Modernization - 311 tests**
- [x] E2E integration tests updated for SPA (90 tests, Tests 100-102, 105) - 100% passing
- [x] Component tests migrated to Phase 2 (120 tests, Tests 01-06, 23) - 100% passing
- [x] Responsive design tests (44 tests, Test 200) - 100% passing
- [x] Visual regression tests created (57 tests, Test 300) - 100% passing
- [x] Hierarchical numbering applied (100%)
- [x] Centralized mock fixtures created
- [x] Complete Phase 2 documentation written

**Test Infrastructure Updates**
- [x] API route patterns updated (`/api/*` → `**/api/*` for Vite proxy)
- [x] URL patterns updated (query params → Vue Router paths)
- [x] Component selectors updated for Phase 2 architecture
- [x] Mock data enhanced for SPA testing
- [x] Visual baselines captured for all browsers (Chromium, Firefox, WebKit)

### Current Status (✅ 100% PASSING)
- **Backend Tests:** 270/270 passing (100%)
- **Frontend Tests:** 311/311 passing (100%)
- **Total Test Coverage:** 581/581 tests passing (100%)

## Phase 3 Roadmap (Next Steps)

### High Priority
1. Migrate frontend tests to use centralized fixtures
2. Set up CI/CD integration with test reporting
3. Add test status dashboard to manager UI

### Medium Priority
4. Expand visual regression coverage
5. Add performance benchmarking tests
6. Create test failure debugging guide

### Low Priority
7. Implement test flakiness detection
8. Add test coverage metrics reporting
9. Create test optimization recommendations

## Test Development Guidelines

### Backend Tests (Jest)

**File naming:** `{feature}.test.js`
**Location:** `/home/claude/manager/tests/backend/`

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

**File naming:** `{feature}.spec.js`
**Location:** `/home/claude/manager/tests/frontend/` (future)

**Status:** Not yet implemented

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

## Test Fixtures

**Location:** `/home/claude/manager/tests/fixtures/`
**Status:** Directory created, no fixtures yet (Phase 2)

**Planned Fixtures:**
- Sample project directory structures
- Valid/invalid agent markdown files
- Valid/invalid command files
- Sample settings.json files
- Sample .mcp.json files

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

If you see "EADDRINUSE" errors, ensure:
1. No other server is running on port 8420
2. `NODE_ENV=test` is set in tests (handled by setup.js)

### Test Hangs

Jest has `forceExit: true` in config to prevent hanging. If tests still hang:
```bash
npx jest --detectOpenHandles
```

## Contributing

When adding new tests:
1. Follow existing test structure and naming conventions
2. Write descriptive test names that explain what's being tested
3. Use Arrange-Act-Assert pattern
4. One assertion per test when possible
5. Update this README if adding new test categories

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Playwright Documentation](https://playwright.dev/) (for future frontend tests)

---

**Last Updated:** 2025-10-20
**Status:** Phase 2 Complete - 581/581 tests passing (100%)
