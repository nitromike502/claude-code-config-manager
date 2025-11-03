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

## Running Backend Tests Efficiently

### Optimal Execution Strategy

Backend tests run **significantly faster** when executed individually in parallel rather than as a single Jest suite. This approach avoids Jest memory issues common in WSL2 environments.

**Key Metrics:**
- Individual test files complete in **<0.2 seconds**
- Running all tests together can cause memory issues (>4GB, timeouts)
- Parallel execution with timeout provides optimal performance

### Recommended Approach: Parallel Execution with Timeout

**Timeout Recommendation:** 5 seconds per individual test file

**Rationale:**
- Well-behaved tests finish in <0.2s
- Timeouts indicate infrastructure problems, not slow tests
- Provides early detection of Jest memory issues
- Prevents hanging test processes

**Example Pattern:**
```bash
# Run multiple test files in parallel with 5s timeout each
timeout 5s npm test -- tests/backend/services/copyService.test.js &
timeout 5s npm test -- tests/backend/services/pathValidator.test.js &
timeout 5s npm test -- tests/backend/services/conflictDetector.test.js &
timeout 5s npm test -- tests/backend/services/conflictResolver.test.js &
timeout 5s npm test -- tests/backend/services/uniquePathGenerator.test.js &

# Wait for all background processes to complete
wait

# Check exit codes
echo "All tests completed"
```

### Exit Code Meanings

Understanding exit codes helps diagnose issues quickly:

- **Exit code 0:** All tests passed ✅
- **Exit code 1:** Test failures (assertion errors) ❌
- **Exit code 124:** Timeout exceeded (infrastructure issue) ⏱️

**Example with Exit Code Handling:**
```bash
# Run test with timeout and capture exit code
timeout 5s npm test -- tests/backend/services/copyService.test.js
exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo "✅ Tests passed"
elif [ $exit_code -eq 124 ]; then
  echo "⏱️ Timeout - Jest infrastructure issue detected"
elif [ $exit_code -eq 1 ]; then
  echo "❌ Test failures - check assertions"
fi
```

### When to Use Parallel vs. Sequential

**Use Parallel Execution (Recommended):**
- Running multiple test files during development
- Full test suite execution in CI/CD
- When experiencing Jest memory issues
- For fastest overall test execution

**Use Sequential Execution:**
- Debugging specific test failures
- Investigating test interdependencies
- When you need complete Jest output logs
- Running a single test file

**Example: Full Parallel Test Run**
```bash
# Create array of all backend test files
test_files=(
  tests/backend/services/copyService.test.js
  tests/backend/services/pathValidator.test.js
  tests/backend/services/conflictDetector.test.js
  tests/backend/services/conflictResolver.test.js
  tests/backend/services/uniquePathGenerator.test.js
)

# Run all tests in parallel with timeout
for test_file in "${test_files[@]}"; do
  timeout 5s npm test -- "$test_file" &
done

# Wait for all to complete
wait
echo "All backend tests completed"
```

### Troubleshooting Jest Memory Issues in WSL2

**Symptoms:**
- Tests hang or timeout when running together
- Memory usage exceeds 4GB
- Tests pass individually but fail in suites
- Jest process becomes unresponsive

**Solutions:**

1. **Use Parallel Execution** (see above)
   - Isolates each test file in its own Jest process
   - Prevents memory accumulation across tests

2. **Increase WSL2 Memory Limit** (`.wslconfig`)
   ```ini
   [wsl2]
   memory=8GB
   ```

3. **Clear Jest Cache**
   ```bash
   npm test -- --clearCache
   ```

4. **Use --runInBand for Debugging**
   ```bash
   # Run tests sequentially in same process
   npm test -- --runInBand tests/backend/services/
   ```

5. **Monitor Memory Usage**
   ```bash
   # Run test with memory monitoring
   /usr/bin/time -v npm test -- tests/backend/services/copyService.test.js
   ```

### Best Practices Summary

1. **Default to parallel execution** with 5s timeout for all backend test runs
2. **Investigate timeouts immediately** - they indicate infrastructure issues
3. **Use exit codes** to distinguish between test failures and infrastructure problems
4. **Run tests individually** when debugging specific failures
5. **Monitor memory usage** in WSL2 environments
6. **Clear Jest cache** if experiencing unexplained failures

## Test Coverage

Current test coverage:
- **Backend Tests:** 276 Jest tests (100% pass rate)
- **Frontend Tests:** 603 Playwright tests (100% pass rate)
  - E2E integration tests
  - Component tests
  - Responsive design tests
  - Visual regression tests
- **Total:** 879 tests (100% pass rate)

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
