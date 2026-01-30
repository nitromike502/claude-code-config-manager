# Testing Strategy

## Overview

The Claude Code Config Manager project uses automated testing as a **mandatory quality gate**. All code changes must pass automated tests before Pull Requests can be created.

## Test Automation Agent

**Agent:** test-automation-engineer
**Purpose:** Build, maintain, and execute automated test suites
**Quality Gate:** Hard block - PRs cannot be created if tests fail

## Test Types

### Backend Testing (Jest + Supertest)

**Test Coverage:**
- API endpoint tests (all 11 endpoints)
- Parser unit tests (agents/commands/hooks/MCP)
- Error handling scenarios
- Regression tests for known bugs (BUG-001, BUG-002)
- Edge cases (malformed data, missing files, invalid paths)

**Location:** `/home/claude/manager/tests/backend/`

**Run Command:** `npm run test:backend`

### Frontend Testing (Playwright)

**Test Coverage:**
- Component rendering tests
- User interaction tests (clicks, forms, navigation)
- API integration tests (API calls → UI updates)
- Visual verification (screenshots on failure)
- Responsive design tests

**Location:** `/home/claude/manager/tests/frontend/`

**Run Command:** `npm run test:frontend`

## Workflow Integration

```
1. Developer implements feature (backend-architect or frontend-developer)
   ↓
2. test-automation-engineer runs automated tests
   ├─ PASS → Continue to step 3
   └─ FAIL → Return to developer (fix and re-test)
   ↓
3. documentation-engineer updates docs (if needed)
   ↓
4. code-reviewer reviews code
   ↓
5. git-workflow-specialist creates PR (only if tests passed)
   ↓
6. Merge after approval
```

## Test Reports

All test execution results are saved to:
`/home/claude/manager/docs/testing/test-reports/test-report-{YYYYMMDD}-{HHMMSS}.md`

Reports include:
- Summary statistics (total, passed, failed, duration)
- Detailed breakdown by test suite
- Failed test details with fix recommendations
- Coverage metrics

## NPM Scripts

```json
{
  "test": "jest",
  "test:backend": "jest tests/backend",
  "test:frontend": "playwright test",
  "test:watch": "jest --watch",
  "test:full": "npm run test:backend && npm run test:frontend"
}
```

## Test Fixtures

Mock data and test fixtures are stored in:
`/home/claude/manager/tests/fixtures/`

Includes:
- `mock-projects/` - Sample .claude.json data
- `malformed-yaml/` - Test parser resilience
- `malformed-json/` - Test error handling

## Quality Standards

### Coverage Targets
- Backend API: Aim for 80%+ code coverage
- Frontend: All key user flows must be tested

### Test Execution Time
- Keep total test suite under 2 minutes for fast feedback
- Unit tests should run in milliseconds
- E2E tests run in parallel when possible

### Test Quality
- Descriptive test names explain what is tested and expected outcome
- One assertion per test when possible (easier debugging)
- Test user-facing behavior, not implementation details
- Include both success and failure scenarios

## Regression Testing

When bugs are fixed:
1. Create regression test that reproduces the bug
2. Verify test fails before fix
3. Apply fix
4. Verify test passes after fix
5. Test remains in suite to prevent regression

Examples:
- BUG-001: YAML frontmatter parsing error
- BUG-002: User hooks type validation error

## Continuous Integration (Future)

The test-automation-engineer is designed to work with CI/CD:
- GitHub Actions can run tests automatically on PRs
- Test reports can be posted as PR comments
- Merge protection rules can enforce test passing

## Troubleshooting

### Tests Failing Locally
1. Ensure server is running: `npm start`
2. Check test report for specific failures
3. Run failing test in isolation to debug
4. Verify test fixtures are correct

### Test Timeout Errors
- Increase timeout in test config
- Check if server is responding
- Verify API endpoints are not blocked

### Playwright Browser Issues
- Run `npx playwright install chromium`
- Check if browser version matches test requirements
- Review browser console errors

## Best Practices

1. **Test immediately** after implementing features
2. **Write tests alongside code**, not after
3. **Keep tests focused** - one concept per test
4. **Mock external dependencies** for isolation
5. **Update tests** when behavior changes
6. **Delete obsolete tests** that no longer provide value
7. **Document complex test setup** with comments
8. **Run full suite** before creating PRs

## Invoking the Test Agent

```
# Run tests after backend changes
Invoke test-automation-engineer to run backend tests for [feature name]

# Run tests after frontend changes
Invoke test-automation-engineer to run frontend tests for [component name]

# Run full test suite before PR
Invoke test-automation-engineer to run full test suite before PR creation
```

The agent will:
1. Execute appropriate test suite
2. Generate test report
3. Block PR if tests fail
4. Provide actionable fix recommendations
