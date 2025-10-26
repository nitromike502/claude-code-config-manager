---
category: testing
description: Pre-flight checklist to prevent test numbering confusion and API misuse when creating new Playwright tests
created: 2025-10-26
last_updated: 2025-10-26
---

# Test Creation Pre-Flight Checklist

**Purpose:** Prevent common mistakes when creating new Playwright tests, including test numbering confusion, deprecated API usage, and pattern duplication. This checklist addresses issues identified in session workflow analyses where developers wasted 10-15 minutes on preventable mistakes.

**When to use:** Before creating any new Playwright test file in `tests/frontend/`, `tests/e2e/`, `tests/responsive/`, or `tests/visual/`.

---

## ✅ Pre-Flight Checklist

### Step 1: Test Category Selection

**Choose the correct test category based on what you're testing:**

| Category | Range | Location | Purpose |
|----------|-------|----------|---------|
| **Frontend Component** | 01-99 | `tests/frontend/` | Component rendering, UI elements, basic interactions |
| **E2E Integration** | 100-199 | `tests/e2e/` | Complete user workflows, multi-step interactions, cross-component tests |
| **Responsive** | 200-299 | `tests/responsive/` | Viewport-specific tests, mobile/tablet/desktop layouts |
| **Visual Regression** | 300-399 | `tests/visual/` | Screenshot comparison, visual consistency checks |

**Examples from codebase:**
- ✅ Component test: `01-dashboard-rendering.spec.js` - Tests dashboard component renders correctly
- ✅ E2E test: `100-complete-user-flows-integration.spec.js` - Tests full navigation flow from dashboard → project → sidebar
- ✅ Responsive test: `200-layout-responsive.spec.js` - Tests layout adapts to different screen sizes
- ✅ Visual test: `300-visual-regression.spec.js` - Tests UI matches expected screenshots

**Decision Tree:**
- Does it test a single component in isolation? → **Frontend (01-99)**
- Does it test a complete user journey across multiple views? → **E2E (100-199)**
- Does it test responsive behavior at different viewports? → **Responsive (200-299)**
- Does it compare visual appearance via screenshots? → **Visual (300-399)**

**Reference:** See `.claude/templates/test-template.md` for detailed category descriptions

---

### Step 2: Find Next Available Number

**CRITICAL:** Always check existing test numbers BEFORE creating your test file.

**Command:**
```bash
# List all test files in your chosen category
ls tests/{category}/*.spec.js | sort

# Examples:
ls tests/frontend/*.spec.js | sort
ls tests/e2e/*.spec.js | sort
ls tests/responsive/*.spec.js | sort
ls tests/visual/*.spec.js | sort
```

**Example output for E2E tests:**
```
tests/e2e/100-complete-user-flows-integration.spec.js
tests/e2e/101-user-flow-project-discovery.spec.js
tests/e2e/102-user-flow-configuration-viewing.spec.js
tests/e2e/104-command-metadata-display.spec.js
tests/e2e/105-user-flow-theme-toggle.spec.js
```

**Identify next available number:**
- In above example, notice **103** is missing (gap between 102 and 104)
- Next test should be **103** to fill the gap
- If all sequential (100, 101, 102), next is **103**
- If no gaps exist up to 105, next is **106**

**⚠️ WARNING - October 26 Session Issue:**
In a recent session, a developer created Test 104 without checking existing numbers, causing confusion when Test 103 was later created. This wasted 10 minutes backtracking and renumbering.

**Best Practice:** Use the LOWEST available number in the sequence to avoid gaps.

---

### Step 3: Read Documentation

**Before writing any code, read these documents:**

1. **Test Template (MANDATORY):**
   ```bash
   cat /home/claude/manager/.claude/templates/test-template.md
   ```
   Pay special attention to:
   - Test numbering format (XXX.YYY.ZZZ structure)
   - Commit message format (`test: add [Test XXX] description`)
   - File naming conventions

2. **CLAUDE.md Testing Section (RECOMMENDED):**
   ```bash
   grep -A 50 "### Testing Workflow" /home/claude/manager/CLAUDE.md
   ```

3. **Playwright Config (OPTIONAL):**
   ```bash
   cat /home/claude/manager/playwright.config.js
   ```

---

### Step 4: Review Existing Tests

**Learn from existing patterns before implementing:**

**REQUIRED:** Review at least 2 existing test files in the same category.

**Recommended reference tests:**

| Category | Must-Read Examples |
|----------|-------------------|
| Frontend | `tests/frontend/01-dashboard-rendering.spec.js`<br>`tests/frontend/04-theme-toggle.spec.js` |
| E2E | `tests/e2e/100-complete-user-flows-integration.spec.js`<br>`tests/e2e/101-user-flow-project-discovery.spec.js` |
| Responsive | `tests/responsive/200-layout-responsive.spec.js` |
| Visual | `tests/visual/300-visual-regression.spec.js` |

**What to look for:**
- ✅ How test suites are structured (`test.describe()` organization)
- ✅ How mocks/fixtures are set up (`page.route()` patterns)
- ✅ What selectors are used (`.project-card`, `.sidebar`, `.close-btn`)
- ✅ What Playwright APIs are used (`page.locator()`, `expect()`, etc.)
- ✅ How tests are numbered (XXX.YYY.ZZZ format)

**Example - Test 100 numbering structure:**
```javascript
// Test Suite 100.001: E2E Integration: Complete User Flows
test.describe('100.001: E2E Integration: Complete User Flows', () => {

  // Test 100.001.001: user can navigate from dashboard to project
  test('100.001.001: user can navigate from dashboard to project', async ({ page }) => {
    // Test implementation
  });

  // Test 100.001.002: user can access user configurations
  test('100.001.002: user can access user configurations', async ({ page }) => {
    // Test implementation
  });
});

// Test Suite 100.002: E2E Integration: Interactive Features
test.describe('100.002: E2E Integration: Interactive Features', () => {
  // More tests...
});
```

**Numbering Format:**
- **XXX** = File number (100)
- **YYY** = Suite number (001, 002, 003...)
- **ZZZ** = Individual test (001, 002, 003...)

---

### Step 5: Verify Numbering Structure

**All tests MUST follow the 3-tier numbering structure:**

**Format:** `XXX.YYY.ZZZ`

**Example from Test 104:**
```javascript
// File: tests/e2e/104-command-metadata-display.spec.js

// Test Suite 104.001: First suite in this file
test.describe('104.001: Command Metadata Display in Sidebar', () => {

  // Test 104.001.001: First test in first suite
  test('104.001.001: sidebar displays command metadata correctly', async ({ page }) => {
    // ...
  });

  // Test 104.001.002: Second test in first suite
  test('104.001.002: sidebar handles missing metadata gracefully', async ({ page }) => {
    // ...
  });
});

// Test Suite 104.002: Second suite in this file
test.describe('104.002: Command Content Rendering', () => {

  // Test 104.002.001: First test in second suite
  test('104.002.001: markdown content renders correctly', async ({ page }) => {
    // ...
  });
});
```

**Checklist:**
- [ ] File number matches filename (104 = `104-command-metadata-display.spec.js`)
- [ ] All test suites start with file number (104.001, 104.002)
- [ ] Suite numbers are sequential (001, 002, 003...)
- [ ] All individual tests include suite number (104.001.001, 104.001.002)
- [ ] Test numbers within suite are sequential (001, 002, 003...)

**❌ WRONG:**
```javascript
test.describe('Command Metadata Display', () => {  // Missing number
  test('should display metadata', async ({ page }) => {  // Missing number
```

**✅ CORRECT:**
```javascript
test.describe('104.001: Command Metadata Display', () => {
  test('104.001.001: sidebar displays command metadata correctly', async ({ page }) => {
```

---

### Step 6: Verify Playwright API Usage

**⚠️ CRITICAL:** Avoid deprecated Playwright APIs that were identified in October 26 session analysis.

**Common Issues from Session 2:**

| ❌ DEPRECATED | ✅ CORRECT |
|--------------|-----------|
| `page.waitForLoadState('networkidle')` | `page.waitForSelector('.element')` |
| `page.$('.selector')` | `page.locator('.selector')` |
| `page.$$('.selector')` | `page.locator('.selector').all()` |
| `page.waitForTimeout(5000)` (long waits) | `await expect(element).toBeVisible({ timeout: 5000 })` |

**Best Practices:**
- ✅ Use `page.locator()` for all element selection
- ✅ Use `expect()` assertions with explicit timeouts
- ✅ Use `page.waitForSelector()` instead of arbitrary waits
- ✅ Use `page.route()` for mocking API calls (Phase 2 Vite: `**/api/*` pattern)
- ✅ Use `await expect(element).toBeVisible()` instead of polling

**API Mock Pattern (Phase 2 - Vite Proxy):**
```javascript
// ✅ CORRECT - Uses **/api/* pattern for Vite proxy
await page.route('**/api/projects', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, projects: [] })
  });
});

// ❌ WRONG - Missing ** glob pattern
await page.route('/api/projects', (route) => {  // Won't match
```

**Reference:** See existing tests like `100-complete-user-flows-integration.spec.js` for correct API patterns.

---

### Step 7: Pattern Search

**Before implementing, search the codebase for similar patterns:**

**Common patterns to search:**

| Need | Search Command | Purpose |
|------|----------------|---------|
| Sidebar interactions | `grep -r "close-btn" tests/` | Find how to close sidebars |
| API mocking | `grep -r "page.route" tests/e2e/` | Find API mock patterns |
| Navigation patterns | `grep -r "waitForURL" tests/` | Find navigation assertions |
| Theme toggle | `grep -r "theme-toggle" tests/` | Find theme interaction tests |
| Error states | `grep -r "error-state" tests/` | Find error handling patterns |

**Example - Finding sidebar close patterns:**
```bash
cd /home/claude/manager
grep -r "close-btn" tests/ -A 3 -B 3
```

**Output shows:**
```javascript
const closeButton = page.locator('.close-btn');
await expect(closeButton).toBeVisible();
await closeButton.click();
await expect(sidebar).not.toBeVisible();
```

**Reuse this pattern instead of inventing new selectors!**

**Why this matters:**
- ✅ Ensures consistency across test suite
- ✅ Prevents duplicating existing patterns
- ✅ Reduces debugging time when tests fail
- ✅ Makes tests easier to maintain

---

### Step 8: Pre-Commit Test Run

**MANDATORY:** Run your test successfully BEFORE committing.

**Commands:**
```bash
# Run your specific test file
cd /home/claude/manager
npx playwright test tests/{category}/{your-test-file}.spec.js

# Example:
npx playwright test tests/e2e/104-command-metadata-display.spec.js

# Run in headed mode to see browser (debugging)
npx playwright test tests/e2e/104-command-metadata-display.spec.js --headed

# Run with debug mode
npx playwright test tests/e2e/104-command-metadata-display.spec.js --debug
```

**Verify:**
- [ ] All tests pass (green checkmarks)
- [ ] No warnings or deprecation messages
- [ ] Test runs in reasonable time (< 30 seconds per test typically)
- [ ] Screenshots are captured on failure (if test fails)

**If test fails:**
1. Read error message carefully
2. Check selector matches actual HTML (use browser dev tools)
3. Verify API mocks are correct (`**/api/*` pattern)
4. Check timing issues (add explicit `waitForSelector` if needed)
5. Review reference tests for similar patterns

**Do NOT commit until test passes!**

---

### Step 9: Commit Message Format

**REQUIRED:** All test commits MUST include `[Test XXX]` reference.

**Format:**
```
test: <action> [Test XXX] <description>
```

**Actions:**
- `add` - Creating new test
- `fix` - Fixing failing test
- `remove` - Deleting obsolete test
- `update` - Modifying existing test

**Examples:**

✅ **CORRECT:**
```bash
git commit -m "test: add [Test 104] command metadata display in sidebar"

git commit -m "test: fix [Test 100] timeout in user flow navigation"

git commit -m "test: remove [Test 03] obsolete sidebar test"

git commit -m "test: update [Test 201] responsive layout to check mobile menu"
```

❌ **WRONG:**
```bash
git commit -m "add test for sidebar"  # Missing [Test XXX]

git commit -m "test: Test 104 added"  # Wrong format (Test XXX outside brackets)

git commit -m "test: added new tests"  # Too vague, no test reference
```

**Multi-line commit (when adding multiple tests in one file):**
```bash
git commit -m "test: add [Test 104] command metadata display in sidebar

Test Suites:
- 104.001: Command metadata display
- 104.002: Command content rendering
- 104.003: Command error handling

All tests passing (8/8 tests)"
```

**Reference:** See CLAUDE.md "Test Reference Format" section for full details.

---

## Real Examples from October 26 Session

### Issue 1: Test Numbering Confusion

**What happened:**
- Developer created Test 104 without checking existing numbers
- Later discovered Test 103 should be created first
- Had to decide: Keep 104 and backfill 103, or renumber?
- Wasted 10 minutes discussing and deciding

**How this checklist prevents it:**
- ✅ Step 2 forces running `ls tests/e2e/*.spec.js` FIRST
- ✅ Developer sees 100, 101, 102, 105 exist
- ✅ Next test is clearly 103 (fill gap) or 104 (if no gap to 103)
- ✅ No confusion, no wasted time

### Issue 2: Deprecated API Usage

**What happened:**
- Developer used `page.waitForLoadState('networkidle')`
- Tests were flaky and slow
- Code reviewer caught it: "Use explicit selectors instead"
- Had to refactor entire test file

**How this checklist prevents it:**
- ✅ Step 4 requires reading existing tests FIRST
- ✅ Developer sees all tests use `page.waitForSelector()`
- ✅ Step 6 explicitly lists deprecated APIs to avoid
- ✅ Correct pattern used from the start

### Issue 3: Pattern Duplication

**What happened:**
- Developer implemented custom sidebar close logic
- Code reviewer: "We already have `.close-btn` pattern in 5 other tests"
- Had to refactor to use consistent selector

**How this checklist prevents it:**
- ✅ Step 7 forces searching for existing patterns
- ✅ `grep -r "close-btn" tests/` shows existing usage
- ✅ Developer reuses proven pattern
- ✅ No refactoring needed in review

---

## Integration with Other Documents

**This checklist is referenced by:**
- `.claude/templates/test-template.md` - Links to this in "Best Practices" section
- `CLAUDE.md` - References this in testing workflow section
- Slash commands for test creation (if implemented)

**This checklist links to:**
- `.claude/templates/test-template.md` - Detailed test file format guidelines
- `CLAUDE.md` - Project testing standards and workflow
- `docs/sessions/workflow-analyses/workflow-analysis-20251022.md` - Exemplary test workflow
- Existing test files - Reference implementations

---

## Quick Reference

**Before creating a new test:**

1. **Choose category** → Frontend (01-99) | E2E (100-199) | Responsive (200-299) | Visual (300-399)
2. **Find next number** → `ls tests/{category}/*.spec.js | sort`
3. **Read docs** → `cat .claude/templates/test-template.md`
4. **Review examples** → Read 2 existing tests in same category
5. **Verify numbering** → XXX.YYY.ZZZ format for all suites and tests
6. **Check APIs** → Use `page.locator()`, avoid deprecated patterns
7. **Search patterns** → `grep -r "pattern" tests/` before implementing
8. **Run test** → `npx playwright test tests/{category}/{file}.spec.js`
9. **Commit with reference** → `test: add [Test XXX] description`

**Estimated time savings:** 10-15 minutes per test creation (prevents backtracking, renumbering, and API issues)

---

## Success Criteria

**This checklist is successful if:**
- ✅ Zero test numbering conflicts in next 10 test creations
- ✅ Zero deprecated API usage in new tests
- ✅ Zero pattern duplication requiring refactoring
- ✅ All new tests pass on first commit attempt
- ✅ All commit messages include proper `[Test XXX]` references

**Metrics to track:**
- Time from "create test" decision to first passing commit (target: < 30 min)
- Number of refactoring requests in code review (target: 0)
- Test pass rate on first run (target: 100%)

---

**Document Version:** 1.0
**Created:** October 26, 2025
**Last Updated:** October 26, 2025
**Owner:** test-automation-engineer
**Review Cycle:** After every 5 new tests created
