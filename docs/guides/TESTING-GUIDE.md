# Testing Guide

## Overview

This project enforces an **automated quality gate** for all code changes. Every feature, bug fix, or refactoring must pass comprehensive automated tests before a pull request can be created. This ensures code quality, prevents regressions, and maintains the stability of the application.

## Testing Workflow (Automated Quality Gate)

All code changes must pass automated tests before PR creation:

1. **Developer implements feature** (backend-architect or frontend-developer)
2. **test-automation-engineer runs tests** (Jest for backend, Playwright for frontend)
   - ✅ If all tests pass → Proceed to step 3
   - ❌ If any tests fail → Return to developer to fix issues (loop until pass)
3. **git-workflow-specialist creates PR** (only after tests pass)
4. **Code review and merge**

## Test Types

### Backend (Jest + Supertest)
- API endpoint tests
- Parser unit tests
- Error handling
- Regression tests

### Frontend (Playwright)
- Component rendering
- User interactions
- API integration
- Visual verification

## Test File Naming Convention

All Playwright test files use numbered prefixes for easy identification:

- **Frontend Component Tests (01-99):** `tests/frontend/XX-test-name.spec.js`
- **E2E Integration Tests (100-199):** `tests/e2e/1XX-test-name.spec.js`
- **Responsive Tests (200-299):** `tests/responsive/2XX-test-name.spec.js`
- **Visual Regression Tests (300-399):** `tests/visual/3XX-test-name.spec.js`
- **Backend Jest Tests:** No number prefix (standard Jest convention)

## Test Reference Format

Use `[Test XXX]` format in commit messages and bug reports:

- `test: add [Test 06] new component rendering tests`
- `test: fix [Test 100] timeout in user flow navigation`
- `[Test 201] failing due to responsive layout issue`

## Test Organization

- See `docs/testing/TEST-FILE-INDEX.md` for complete index of all tests and available numbers
- See `.claude/templates/test-template.md` for detailed test creation guidelines

## Test Reports

All test results are saved to `docs/testing/test-reports/`

## Hard Block Policy

**PRs cannot be created if tests fail.** This prevents broken code from being merged.

If tests fail:
1. Review test output and error messages
2. Fix the code or update tests as appropriate
3. Re-run tests until all pass
4. Only then proceed to PR creation

## Running Tests

### Backend Tests (Jest)
```bash
npm run test:backend
```

### Frontend Tests (Playwright)
```bash
# All frontend tests
npm run test:frontend

# Specific test suites
npm run test:e2e          # E2E integration tests
npm run test:responsive   # Responsive design tests
npm run test:visual       # Visual regression tests
```

### All Tests
```bash
npm test
```

## Test Coverage

Current test coverage:
- **Backend Tests:** 270 Jest tests (100% pass rate)
- **Frontend Tests:** 313 Playwright tests (100% pass rate)
  - 90 E2E integration tests
  - 122 Component tests
  - 44 Responsive design tests
  - 57 Visual regression tests
- **Total:** 583 tests (100% pass rate)

## Best Practices

1. **Test Immediately:** Run tests after every task completion, not just at the end
2. **Fix Failing Tests:** Never commit code with failing tests
3. **Add Tests for Bugs:** When fixing bugs, add tests to prevent regression
4. **Reference Tests in Commits:** Use `[Test XXX]` format in commit messages
5. **Keep Tests Fast:** Optimize slow tests to maintain rapid feedback loops
6. **Use Descriptive Names:** Test names should clearly describe what they verify
7. **Document Test Purpose:** Add comments explaining complex test scenarios

## Troubleshooting

### Tests Pass Locally But Fail in CI
- Check for environment-specific issues (paths, ports, etc.)
- Verify all dependencies are installed
- Check for timing issues in async tests

### Flaky Tests
- Increase timeouts for network-dependent tests
- Use proper wait conditions instead of fixed delays
- Ensure proper test isolation (no shared state)

### Test Timeouts
- Review test complexity and break into smaller tests
- Check for infinite loops or unresolved promises
- Increase timeout only as last resort

## Additional Resources

- **Test File Index:** `docs/testing/TEST-FILE-INDEX.md`
- **Test Template:** `.claude/templates/test-template.md`
- **Test Reports:** `docs/testing/test-reports/`
- **Jest Documentation:** https://jestjs.io/
- **Playwright Documentation:** https://playwright.dev/
