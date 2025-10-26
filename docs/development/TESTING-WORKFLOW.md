# Testing Workflow Development Guide

**Purpose:** Reduce test feedback loop from 8+ minutes to 30-60 seconds during active development

**Last Updated:** October 26, 2025

---

## Overview

This document provides a clear development workflow using targeted test execution. Instead of running the full test suite (8-10 minutes) after every code change, developers can run specific tests (30-60 seconds) for immediate feedback, then expand to category tests (2-3 minutes), and finally run the full suite (8-10 minutes) before committing.

**Key Benefit:** For 5 development iterations, this reduces testing time from 40+ minutes to 2.5-3 minutes (87% faster).

---

## Three-Phase Testing Strategy

### Phase 1: Feature Development (30-60 seconds)

**When to use:** During active development, after every code change

**Command:**
```bash
npx playwright test tests/e2e/104-command-metadata-display.spec.js
```

**Purpose:** Immediate feedback on code changes

**Benefit:** Can iterate quickly (change → test → fix loop)

**Example:**
```bash
# You're working on command metadata display
# Make a code change in src/components/ProjectDetail.vue
# Run the specific test immediately

npx playwright test tests/e2e/104-command-metadata-display.spec.js

# See results in 30-60 seconds
# If pass: Continue development or move to Phase 2
# If fail: Fix code and repeat Phase 1
```

---

### Phase 2: Feature Complete (2-3 minutes)

**When to use:** After a feature is complete, before committing

**Command:**
```bash
# For E2E tests
npx playwright test tests/e2e/

# For frontend component tests
npx playwright test tests/frontend/

# For responsive tests
npx playwright test tests/responsive/
```

**Purpose:** Verify no regressions in related tests

**Benefit:** Catches bugs in neighboring functionality without waiting for full suite

**Example:**
```bash
# Your E2E test passes, now verify all E2E tests still work
npx playwright test tests/e2e/

# See results in 2-3 minutes
# If pass: Move to Phase 3
# If fail: Fix regressions and repeat Phase 2
```

---

### Phase 3: Pre-Commit (8-10 minutes)

**When to use:** Final verification before committing code

**Command:**
```bash
# Run full frontend test suite
npm run test:frontend

# Or run both backend and frontend
npm run test:full
```

**Purpose:** Final verification before committing

**Benefit:** Ensures nothing broke anywhere else in the application

**Example:**
```bash
# All category tests pass, now run full suite
npm run test:frontend

# See results in 8-10 minutes
# If pass: Commit and push
# If fail: Fix issues and repeat Phase 3
```

---

## Recommended Workflow

Follow this step-by-step process for maximum efficiency:

### Step 1: Make Code Change (5-15 minutes)

Edit your component, fix a bug, or implement a new feature.

```bash
# Example: Editing ProjectDetail.vue to fix command display
vim src/components/ProjectDetail.vue
```

---

### Step 2: Run Targeted Test (30-60 seconds)

Run the specific test file that covers your changes:

```bash
npx playwright test tests/e2e/104-command-metadata-display.spec.js
```

**What to expect:**
- Console shows real-time test progress (list reporter)
- Tests run in all 3 browsers (Chromium, Firefox, WebKit)
- Results appear in 30-60 seconds

**Interpreting results:**
- ✅ **All pass:** Move to Step 4
- ❌ **Some fail:** Move to Step 3

---

### Step 3: Fix if Needed

If the targeted test fails:

1. **Read the error message** - Console shows exact failure point
2. **Fix the code** - Address the specific issue
3. **Repeat Step 2** - Run targeted test again

**Goal:** Get the targeted test passing before expanding scope

**Example:**
```bash
# Test output shows:
# ❌ Expected "Commands (5)" but got "Commands (0)"

# Fix: Check API endpoint is returning data correctly
# Edit: src/api/client.js

# Re-run targeted test
npx playwright test tests/e2e/104-command-metadata-display.spec.js
```

---

### Step 4: Run Category Tests (2-3 minutes)

Once the targeted test passes, verify no regressions in related tests:

```bash
# If working on E2E feature
npx playwright test tests/e2e/

# If working on component
npx playwright test tests/frontend/

# If working on responsive layout
npx playwright test tests/responsive/
```

**What to expect:**
- All tests in the category run (e.g., all E2E tests)
- Results appear in 2-3 minutes
- Catches regressions you might have introduced

**Interpreting results:**
- ✅ **All pass:** Move to Step 6
- ❌ **Some fail:** Move to Step 5

---

### Step 5: Fix Regressions if Needed

If category tests fail:

1. **Identify which tests failed** - Console lists failed test names
2. **Run specific failing test** - Use targeted execution for faster debugging
3. **Fix the regression** - Update code to handle all scenarios
4. **Repeat Step 4** - Run category tests again

**Goal:** Get all category tests passing

**Example:**
```bash
# Category tests show:
# ❌ [Test 102] Configuration viewing flow - failed

# Debug with targeted test
npx playwright test tests/e2e/102-user-flow-configuration-viewing.spec.js

# Fix code based on error message
# Re-run category tests
npx playwright test tests/e2e/
```

---

### Step 6: Run Full Suite (8-10 minutes)

Final check before committing:

```bash
npm run test:frontend
```

**What to expect:**
- All frontend tests run (component, E2E, responsive, visual)
- All 3 browsers tested
- Results in 8-10 minutes
- HTML report generated automatically

**Interpreting results:**
- ✅ **All pass:** Move to Step 7
- ❌ **Some fail:** Fix and repeat Step 6

---

### Step 7: Commit if All Pass

Once the full suite passes:

```bash
git add .
git commit -m "feat: improve command metadata display"
git push
```

**Best practice:** Include test reference in commit message when working on tests:
```bash
git commit -m "test: fix [Test 104] command metadata timeout"
```

---

## Time Comparison

### Without Targeted Tests (Old Approach)

Every iteration requires full suite run:

| Iteration | Action | Time | Cumulative |
|-----------|--------|------|------------|
| 1 | Code change + full suite | 8 min | 8 min |
| 2 | Code change + full suite | 8 min | 16 min |
| 3 | Code change + full suite | 8 min | 24 min |
| 4 | Code change + full suite | 8 min | 32 min |
| 5 | Code change + full suite | 8 min | 40 min |

**Total time for 5 iterations:** 40+ minutes

---

### With Targeted Tests (New Approach)

Phase 1 for iterations, Phase 2 once, Phase 3 once:

| Iteration | Action | Time | Cumulative |
|-----------|--------|------|------------|
| 1 | Code change + targeted test | 1 min | 1 min |
| 2 | Code change + targeted test | 1 min | 2 min |
| 3 | Code change + targeted test | 1 min | 3 min |
| 4 | Code change + targeted test | 1 min | 4 min |
| 5 | Code change + targeted test | 1 min | 5 min |
| - | Category tests | 2 min | 7 min |
| - | Full suite (pre-commit) | 8 min | 15 min |

**Total time for 5 iterations:** 15 minutes (62.5% faster)

**Even better:** If first 4 iterations find issues early, you might only need 1-2 full suite runs instead of 5.

---

## Command Reference

Quick reference table for common testing scenarios:

| Task | Command | Time | When to Use |
|------|---------|------|-------------|
| **Dev feedback** | `npx playwright test tests/e2e/104-...` | 30-60s | During active coding |
| **Single test within file** | `npx playwright test tests/e2e/104-...spec.js -g "test name"` | 30s | Debug specific failure |
| **Category check (E2E)** | `npx playwright test tests/e2e/` | 2-3m | After E2E feature complete |
| **Category check (Frontend)** | `npx playwright test tests/frontend/` | 2-3m | After component complete |
| **Category check (Responsive)** | `npx playwright test tests/responsive/` | 2-3m | After responsive work |
| **Full frontend validation** | `npm run test:frontend` | 8-10m | Before committing |
| **Full backend validation** | `npm run test:backend` | 1-2m | Before committing backend changes |
| **Complete validation** | `npm run test:full` | 10-12m | Before PR creation |
| **View HTML report** | `npm run test:visual:report` | - | After full run |
| **Backend watch mode** | `npm run test:watch` | - | During backend development |
| **Update visual snapshots** | `npm run test:visual:update` | 2-3m | After intentional UI changes |

---

## Advanced Commands

### Run Single Test by Name

Use the `-g` (grep) flag to run a specific test within a file:

```bash
# Run only tests matching "should display command count"
npx playwright test tests/e2e/104-command-metadata-display.spec.js -g "should display command count"
```

**When to use:**
- Debugging a specific test failure
- Verifying a specific behavior after code change
- Faster than running entire test file (20-30 seconds)

---

### Run Tests in Specific Browser

Use the `--project` flag to test in only one browser:

```bash
# Run in Chromium only (fastest)
npx playwright test tests/e2e/104-command-metadata-display.spec.js --project=chromium

# Run in Firefox only
npx playwright test tests/e2e/104-command-metadata-display.spec.js --project=firefox

# Run in WebKit only
npx playwright test tests/e2e/104-command-metadata-display.spec.js --project=webkit
```

**When to use:**
- Even faster feedback during development (10-20 seconds)
- Debugging browser-specific issues
- Running quick smoke tests

**Time savings:**
- All browsers: 30-60 seconds
- Single browser: 10-20 seconds (66% faster)

---

### Run Tests with UI Mode

Use Playwright's UI mode for interactive debugging:

```bash
npx playwright test tests/e2e/104-command-metadata-display.spec.js --ui
```

**Benefits:**
- Visual test runner with browser preview
- Step-through test execution
- Inspect elements during test
- View screenshots and traces

**When to use:**
- Debugging complex test failures
- Understanding test behavior
- Writing new tests

---

### Run Tests in Debug Mode

Use debug mode to pause test execution:

```bash
npx playwright test tests/e2e/104-command-metadata-display.spec.js --debug
```

**Benefits:**
- Opens Playwright Inspector
- Step through test line by line
- Inspect page state at each step
- Useful for troubleshooting

---

## Tips & Best Practices

### 1. Target the Specific Test File

**Do this:**
```bash
npx playwright test tests/e2e/104-command-metadata-display.spec.js
```

**Not this:**
```bash
npm run test:frontend  # Too slow for development feedback
```

**Why:** Targeted tests provide 30-60 second feedback vs 8-10 minute full suite.

---

### 2. Use List Reporter for Real-Time Console Output

The project is already configured with list reporter (see `playwright.config.js`), so you get real-time output:

```bash
npx playwright test tests/e2e/104-command-metadata-display.spec.js

# Output:
# [chromium] › tests/e2e/104-command-metadata-display.spec.js:10:1 › should display command count
# ✓ [chromium] › tests/e2e/104-command-metadata-display.spec.js:10:1 (1.2s)
```

**What you see:**
- Test name as it runs
- Browser being tested
- Pass/fail status
- Execution time

---

### 3. Clear Browser Cache When Needed

If tests show old behavior after code changes:

**Chrome/Chromium:**
- `Ctrl+Shift+R` (Linux/Windows)
- `Cmd+Shift+R` (Mac)

**Or restart the dev server:**
```bash
# In terminal running Vite
Ctrl+C  # Stop server
npm run dev  # Restart
```

---

### 4. Restart Server for Backend Changes

If Playwright tests don't reflect backend API changes:

```bash
# Terminal 1: Stop backend server
Ctrl+C

# Restart backend
npm run dev:backend
```

**Or use nodemon for automatic restarts:**
```bash
npm run dev:backend  # Already uses --watch flag
```

---

### 5. Run Backend Tests Before Frontend

If you changed backend code, run backend tests first:

```bash
# Fast: Backend tests complete in 1-2 minutes
npm run test:backend

# Then run frontend tests
npm run test:frontend
```

**Why:** Backend failures often cause frontend test failures. Fix backend first.

---

### 6. Use Watch Mode for Backend Development

When actively developing backend features:

```bash
npm run test:watch
```

**Benefits:**
- Tests re-run automatically on file save
- Immediate feedback
- No need to manually run tests
- Only runs tests related to changed files

---

### 7. Update Visual Snapshots After UI Changes

If you intentionally changed UI and visual tests fail:

```bash
# Update all visual regression snapshots
npm run test:visual:update

# Or update specific test snapshots
npx playwright test tests/frontend/visual/300-visual-regression.spec.js --update-snapshots
```

**Important:** Only update snapshots if the visual changes are intentional. Review diff carefully first.

---

### 8. View HTML Report for Detailed Analysis

After running full suite:

```bash
npm run test:visual:report
```

**Opens:** Browser with interactive HTML report

**Features:**
- Test results grouped by file
- Screenshots of failures
- Trace viewer for debugging
- Execution timeline
- Error messages and stack traces

---

### 9. Combine Commands for Clean Testing

Restart server and run tests in one command:

```bash
# Kill old processes, start fresh, run tests
pkill -f "vite|node.*server.js" ; npm run dev:backend & sleep 2 && npx playwright test tests/e2e/104-command-metadata-display.spec.js
```

**Breakdown:**
1. `pkill -f "vite|node.*server.js"` - Kill old servers
2. `npm run dev:backend &` - Start backend in background
3. `sleep 2` - Wait for server to start
4. `npx playwright test ...` - Run targeted test

**When to use:** When you suspect stale server state is causing issues.

---

### 10. Use Git to Track Test Changes

When creating or modifying tests:

```bash
# Check which tests changed
git status

# View test changes
git diff tests/e2e/104-command-metadata-display.spec.js

# Commit with test reference
git add tests/e2e/104-command-metadata-display.spec.js
git commit -m "test: add [Test 104] command metadata display verification"
```

---

## Integration with Multiple Reporters (Option B)

The project uses **Option B** configuration with multiple reporters:

```javascript
// playwright.config.js
reporter: [
  ['html', { outputFolder: 'playwright-report' }],
  ['list']
],
```

**What this means:**

### During Test Execution

You see real-time progress in the console (list reporter):

```bash
npx playwright test tests/e2e/104-command-metadata-display.spec.js

# Console output:
# Running 3 tests using 3 workers
#
# [chromium] › tests/e2e/104-command-metadata-display.spec.js:10:1 › Command Metadata Display › should display command count
# ✓ [chromium] › tests/e2e/104-command-metadata-display.spec.js:10:1 (1.2s)
#
# [firefox] › tests/e2e/104-command-metadata-display.spec.js:10:1 › Command Metadata Display › should display command count
# ✓ [firefox] › tests/e2e/104-command-metadata-display.spec.js:10:1 (1.5s)
```

### After Test Execution

HTML report is automatically generated:

```bash
# View the HTML report
npm run test:visual:report

# Or manually
npx playwright show-report
```

**Benefits of Option B:**
- Real-time console feedback (no waiting for HTML report)
- Detailed HTML report for analysis
- Best of both worlds
- No performance impact (reporters run in parallel)

---

## Troubleshooting

### Tests Still Show Old Behavior

**Symptom:** Tests pass/fail based on old code, not your recent changes

**Solutions:**

1. **Clear browser cache:**
   ```bash
   Ctrl+Shift+R  # Hard reload
   ```

2. **Restart Vite dev server:**
   ```bash
   # Terminal running "npm run dev"
   Ctrl+C
   npm run dev
   ```

3. **Restart backend server:**
   ```bash
   # Terminal running "npm run dev:backend"
   Ctrl+C
   npm run dev:backend
   ```

4. **Kill all node processes and restart:**
   ```bash
   pkill -f "vite|node.*server.js"
   # Wait 2 seconds
   npm run dev:backend &
   npm run dev
   ```

---

### Test Takes Longer Than Expected

**Symptom:** Targeted test takes 2-3 minutes instead of 30-60 seconds

**Solutions:**

1. **Use -g flag for single test:**
   ```bash
   # Instead of running entire file
   npx playwright test tests/e2e/104-command-metadata-display.spec.js -g "should display command count"
   ```

2. **Run in single browser:**
   ```bash
   # Chromium only (fastest)
   npx playwright test tests/e2e/104-command-metadata-display.spec.js --project=chromium
   ```

3. **Check for beforeEach slowness:**
   - Review test file for slow setup operations
   - Move expensive operations to beforeAll if possible

---

### HTML Report Not Generated

**Symptom:** `npm run test:visual:report` shows error or empty report

**Solutions:**

1. **Run full suite first:**
   ```bash
   npm run test:frontend
   # Then view report
   npm run test:visual:report
   ```

2. **Check playwright-report directory exists:**
   ```bash
   ls playwright-report/
   ```

3. **Manually generate report:**
   ```bash
   npx playwright show-report
   ```

---

### Tests Fail But Code Seems Correct

**Symptom:** Your code looks correct but tests fail

**Solutions:**

1. **Check test expectations:**
   - Read test file to understand what it's checking
   - Verify your code meets those expectations

2. **Run in UI mode:**
   ```bash
   npx playwright test tests/e2e/104-command-metadata-display.spec.js --ui
   ```
   - Visual inspection of what test sees
   - Step through test execution

3. **Run in debug mode:**
   ```bash
   npx playwright test tests/e2e/104-command-metadata-display.spec.js --debug
   ```
   - Pause at each step
   - Inspect page state

4. **Check console errors:**
   - Open browser DevTools during test
   - Look for JavaScript errors
   - Check network tab for failed API calls

---

### Backend Tests Fail After Frontend Changes

**Symptom:** Backend tests fail even though you only changed frontend code

**Solutions:**

1. **Run backend tests in isolation:**
   ```bash
   npm run test:backend
   ```

2. **Check for shared files:**
   - Did you modify API client?
   - Did you change API endpoint contracts?

3. **Verify backend server is running:**
   ```bash
   curl http://localhost:8420/api/projects
   ```

---

### Visual Regression Tests Fail After UI Change

**Symptom:** Test 300 (visual regression) fails after you changed styling

**Solutions:**

1. **Review the diff:**
   ```bash
   npm run test:frontend
   # Check HTML report for screenshot comparison
   npm run test:visual:report
   ```

2. **If changes are intentional:**
   ```bash
   npm run test:visual:update
   ```

3. **If changes are unintentional:**
   - Revert CSS changes
   - Fix styling to match original

---

## Example Workflows

### Scenario 1: Fixing a Bug in Command Display

**Problem:** Commands not showing count correctly

**Workflow:**

```bash
# Step 1: Identify the test
ls tests/e2e/*command*.spec.js
# Found: tests/e2e/104-command-metadata-display.spec.js

# Step 2: Run targeted test to confirm failure
npx playwright test tests/e2e/104-command-metadata-display.spec.js
# Result: ❌ Expected "Commands (5)" but got "Commands (0)"

# Step 3: Fix the code
vim src/components/ProjectDetail.vue
# Fix: Update command count calculation

# Step 4: Re-run targeted test
npx playwright test tests/e2e/104-command-metadata-display.spec.js
# Result: ✓ All tests pass (45 seconds)

# Step 5: Run category tests
npx playwright test tests/e2e/
# Result: ✓ All E2E tests pass (2.5 minutes)

# Step 6: Run full suite
npm run test:frontend
# Result: ✓ All tests pass (8 minutes)

# Step 7: Commit
git add src/components/ProjectDetail.vue
git commit -m "fix: correct command count display in sidebar"
git push
```

**Total time:** ~12 minutes (vs 40+ minutes running full suite each time)

---

### Scenario 2: Implementing New Feature with TDD

**Feature:** Add filter to command list

**Workflow:**

```bash
# Step 1: Write failing test first
vim tests/e2e/106-command-filtering.spec.js
# Write test for filter functionality

# Step 2: Run test (should fail - feature not implemented)
npx playwright test tests/e2e/106-command-filtering.spec.js
# Result: ❌ Filter input not found (30 seconds)

# Step 3: Implement minimum code to pass test
vim src/components/CommandCard.vue
# Add filter input element

# Step 4: Re-run test
npx playwright test tests/e2e/106-command-filtering.spec.js
# Result: ❌ Filter doesn't actually filter (30 seconds)

# Step 5: Implement filter logic
vim src/components/CommandCard.vue
# Add filtering logic

# Step 6: Re-run test
npx playwright test tests/e2e/106-command-filtering.spec.js
# Result: ✓ All tests pass (30 seconds)

# Step 7: Refine implementation
vim src/components/CommandCard.vue
# Improve UI, add clear button

# Step 8: Re-run test
npx playwright test tests/e2e/106-command-filtering.spec.js
# Result: ✓ All tests pass (30 seconds)

# Step 9: Category tests
npx playwright test tests/e2e/
# Result: ✓ All E2E tests pass (2.5 minutes)

# Step 10: Full suite
npm run test:frontend
# Result: ✓ All tests pass (8 minutes)

# Step 11: Commit
git add tests/e2e/106-command-filtering.spec.js src/components/CommandCard.vue
git commit -m "feat: add command filtering functionality"
git push
```

**Total time:** ~13 minutes (5 iterations × 30s + category + full)

---

### Scenario 3: Debugging Flaky Test

**Problem:** Test 102 fails intermittently

**Workflow:**

```bash
# Step 1: Run the specific test multiple times
for i in {1..5}; do
  echo "Run $i:"
  npx playwright test tests/e2e/102-user-flow-configuration-viewing.spec.js
done
# Results show: 3 pass, 2 fail - confirms flakiness

# Step 2: Run in UI mode to observe
npx playwright test tests/e2e/102-user-flow-configuration-viewing.spec.js --ui
# Watch test execution visually
# Notice: Sometimes API response is slow

# Step 3: Run in debug mode
npx playwright test tests/e2e/102-user-flow-configuration-viewing.spec.js --debug
# Step through test
# Confirm: Test doesn't wait for API response

# Step 4: Fix test - add proper wait
vim tests/e2e/102-user-flow-configuration-viewing.spec.js
# Add: await page.waitForResponse(/\/api\/projects/)

# Step 5: Re-run multiple times
for i in {1..10}; do
  echo "Run $i:"
  npx playwright test tests/e2e/102-user-flow-configuration-viewing.spec.js
done
# Results: 10 pass, 0 fail - flakiness resolved

# Step 6: Full suite to verify
npm run test:frontend

# Step 7: Commit fix
git add tests/e2e/102-user-flow-configuration-viewing.spec.js
git commit -m "test: fix [Test 102] flaky test by adding API response wait"
git push
```

**Total time:** ~15 minutes (debugging + verification)

---

## Quick Start Checklist

When starting development on a new feature:

- [ ] **Identify target test file** - Which test covers this feature?
- [ ] **Run targeted test first** - Establish baseline (30-60s)
- [ ] **Make code change** - Implement feature/fix
- [ ] **Re-run targeted test** - Verify change works (30-60s)
- [ ] **Fix if needed** - Iterate until targeted test passes
- [ ] **Run category tests** - Check for regressions (2-3m)
- [ ] **Fix regressions if needed** - Ensure all category tests pass
- [ ] **Run full suite** - Final verification (8-10m)
- [ ] **View HTML report** - Review any unexpected failures
- [ ] **Commit if all pass** - Use conventional commit format

---

## Additional Resources

### Documentation Links

- [Test Template (test-template.md)](/home/claude/manager/.claude/templates/test-template.md) - Test file naming convention and creation guide
- [CLAUDE.md Testing Section](/home/claude/manager/CLAUDE.md) - Project testing overview
- [Test Progress Monitoring](/home/claude/manager/docs/development/TEST-PROGRESS-MONITORING.md) - Real-time test progress visibility
- [Option B Explanation](/home/claude/manager/docs/development/OPTION-B-EXPLANATION.md) - Multiple reporter configuration details

### Test Reports

All test execution results are saved to:
```
/home/claude/manager/docs/testing/test-reports/
```

View recent reports:
```bash
ls -lt /home/claude/manager/docs/testing/test-reports/ | head -10
```

### Playwright Documentation

- [Playwright Official Docs](https://playwright.dev/docs/intro)
- [Playwright Test Runner](https://playwright.dev/docs/test-runners)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)

---

## Summary

**Key Takeaways:**

1. **Use targeted tests during development** - 30-60s feedback vs 8-10m full suite
2. **Run category tests before full suite** - Catch regressions early (2-3m vs 8-10m)
3. **Only run full suite before committing** - Final verification step
4. **Use -g flag for single tests** - Even faster debugging (20-30s)
5. **Use --project flag for single browser** - Ultra-fast during development (10-20s)
6. **Option B reporters give best of both worlds** - Real-time console + HTML report
7. **Restart servers when needed** - Clear caches and stale state
8. **View HTML report for detailed analysis** - Screenshots, traces, timeline

**Time Savings:**

| Approach | 5 Iterations | Savings |
|----------|--------------|---------|
| Full suite each time | 40+ min | Baseline |
| Targeted → Category → Full | 15 min | 62.5% faster |
| Targeted only (risky) | 2.5 min | 93.75% faster |

**Recommended:** Targeted → Category → Full (balances speed with safety)

---

**Questions or Issues?**

If you encounter problems with this workflow:
1. Review the Troubleshooting section above
2. Check test reports in `/home/claude/manager/docs/testing/test-reports/`
3. Consult with `@test-automation-engineer` agent
4. Review Playwright documentation

---

**Last Updated:** October 26, 2025
**Version:** 1.0
**Maintained By:** Test Automation Team
