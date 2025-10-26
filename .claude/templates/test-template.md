---
category: testing
description: Template and guidelines for creating new Playwright tests with numbered file convention
---

# Creating a New Playwright Test

This guide explains the numbered test file convention and how to create new tests following the established pattern.

## Test File Numbering Convention

All Playwright test files use numbered prefixes for easy identification and organization:

### Frontend Component Tests (001-099)
- **Location:** `tests/frontend/`
- **Format:** `XX-test-name.spec.js`
- **Number Range:** 01-99
- **Purpose:** Component-specific tests, UI element rendering, basic interactions

**Examples:**
```
tests/frontend/01-dashboard-rendering.spec.js
tests/frontend/02-project-detail.spec.js
tests/frontend/03-sidebar-interactions.spec.js
tests/frontend/04-theme-toggle.spec.js
tests/frontend/05-search-functionality.spec.js
```

### E2E Integration Tests (100-199)
- **Location:** `tests/e2e/`
- **Format:** `1XX-test-name.spec.js`
- **Number Range:** 100-199
- **Purpose:** Complete user workflows, multi-step interactions, cross-component tests

**Examples:**
```
tests/e2e/100-complete-user-flows-integration.spec.js
tests/e2e/101-project-discovery-flow.spec.js
tests/e2e/102-configuration-viewing-flow.spec.js
tests/e2e/103-search-filter-workflow.spec.js
tests/e2e/104-theme-persistence-flow.spec.js
```

### Responsive Tests (200-299)
- **Location:** `tests/responsive/`
- **Format:** `2XX-test-name.spec.js`
- **Number Range:** 200-299
- **Purpose:** Viewport-specific tests, mobile/tablet/desktop layouts

**Examples:**
```
tests/responsive/201-layout-responsive.spec.js
tests/responsive/202-mobile-navigation.spec.js
tests/responsive/203-tablet-sidebar.spec.js
tests/responsive/204-desktop-full-view.spec.js
```

### Visual Regression Tests (300-399)
- **Location:** `tests/visual/`
- **Format:** `3XX-test-name.spec.js`
- **Number Range:** 300-399
- **Purpose:** Screenshot comparison, visual consistency checks

**Examples:**
```
tests/visual/301-visual-regression.spec.js
tests/visual/302-theme-visual-consistency.spec.js
tests/visual/303-component-snapshots.spec.js
```

## Creating a New Test File

### Step 1: Determine Test Category

Choose the appropriate category based on what you're testing:
- **Component test?** Use 01-99 range in `tests/frontend/`
- **E2E workflow?** Use 100-199 range in `tests/e2e/`
- **Responsive layout?** Use 200-299 range in `tests/responsive/`
- **Visual regression?** Use 300-399 range in `tests/visual/`

### Step 2: Find Next Available Number

**IMPORTANT:** Check the Test File Index first to find available numbers:

📋 **See [TEST-FILE-INDEX.md](../../docs/testing/TEST-FILE-INDEX.md)** for a complete list of existing tests and available numbers.

Alternatively, list existing tests in your chosen category:

```bash
# For frontend component tests
ls tests/frontend/*.spec.js

# For E2E integration tests
ls tests/e2e/*.spec.js

# For responsive tests
ls tests/responsive/*.spec.js

# For visual regression tests
ls tests/visual/*.spec.js
```

Use the next sequential number in the appropriate range.

### Step 3: Create Test File

Create your test file with the proper number prefix:

```bash
# Example: Creating the 6th frontend component test
touch tests/frontend/06-new-component-test.spec.js

# Example: Creating the 5th E2E test
touch tests/e2e/104-new-user-workflow.spec.js
```

### Step 4: Write Test Content

Follow Playwright best practices:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
    await page.goto('http://localhost:8420');
  });

  test('should do something specific', async ({ page }) => {
    // Arrange
    const element = page.locator('.some-selector');

    // Act
    await element.click();

    // Assert
    await expect(element).toHaveClass('active');
  });

  test('should handle error state', async ({ page }) => {
    // Test error scenarios
  });
});
```

## Test Reference Format

### In Commit Messages

Use the `[Test XXX]` format to reference tests in commit messages:

```bash
# Adding a new test
git commit -m "test: add [Test 06] new component rendering tests"

# Fixing a test
git commit -m "test: fix [Test 100] timeout in user flow navigation"

# Removing a test
git commit -m "test: remove [Test 03] obsolete sidebar test"
```

### In Bug Reports

Reference tests when reporting bugs:

```
[Test 201] responsive layout not rendering correctly on tablet

Steps to reproduce:
1. Run: npx playwright test tests/responsive/201-layout-responsive.spec.js
2. Test fails at viewport 768px
3. Expected: Sidebar should collapse
4. Actual: Sidebar overlaps content
```

### In Documentation

Reference tests when documenting features:

```
The theme toggle functionality is verified by:
- [Test 04] Frontend theme toggle interactions
- [Test 104] E2E theme persistence across sessions
- [Test 302] Visual regression for theme consistency
```

## Backend Test Naming (No Numbers)

Backend Jest tests do NOT use numbered prefixes. They follow standard Jest naming conventions:

```
tests/backend/api-endpoints.test.js
tests/backend/project-discovery.test.js
tests/backend/parsers.test.js
tests/backend/error-handling.test.js
```

## Best Practices

**BEFORE creating a new test:**

1. **Check the Test File Index** → [TEST-FILE-INDEX.md](../../docs/testing/TEST-FILE-INDEX.md)
   - Find available test numbers
   - Review similar existing tests
   - Understand current test coverage

2. **Review existing tests** in the same category to understand patterns and conventions

**Core Best Practices:**

1. **Sequential Numbering:** Use the next available number in sequence (run `ls tests/{category}/*.spec.js` first)
2. **Descriptive Names:** Test name should clearly indicate what is being tested
3. **One Feature Per Test:** Keep tests focused on a single feature or workflow
4. **Commit with Test:** Commit the test file with the feature it tests
5. **Reference in Commits:** Always include `[Test XXX]` in test-related commits
6. **Update on Refactor:** If renaming/removing tests, update all references
7. **Review Existing Tests:** Read 2 existing tests in same category before implementing
8. **Search for Patterns:** Use `grep -r "pattern" tests/` to find existing implementations

## Quick Reference

| Category | Location | Range | Format |
|----------|----------|-------|--------|
| Frontend Components | `tests/frontend/` | 01-99 | `XX-test-name.spec.js` |
| E2E Integration | `tests/e2e/` | 100-199 | `1XX-test-name.spec.js` |
| Responsive | `tests/responsive/` | 200-299 | `2XX-test-name.spec.js` |
| Visual Regression | `tests/visual/` | 300-399 | `3XX-test-name.spec.js` |
| Backend (Jest) | `tests/backend/` | N/A | `{feature}.test.js` |

## Examples

### Example 1: Adding a Frontend Component Test

```bash
# Check existing tests
ls tests/frontend/*.spec.js
# Output shows: 01-dashboard-rendering.spec.js, 02-project-detail.spec.js

# Create new test with next number
touch tests/frontend/03-sidebar-interactions.spec.js

# Commit with reference
git add tests/frontend/03-sidebar-interactions.spec.js
git commit -m "test: add [Test 03] sidebar interaction tests"
```

### Example 2: Adding an E2E Test

```bash
# Check existing tests
ls tests/e2e/*.spec.js
# Output shows: 100-complete-user-flows-integration.spec.js

# Create new test with next number
touch tests/e2e/101-project-discovery-flow.spec.js

# Commit with reference
git add tests/e2e/101-project-discovery-flow.spec.js
git commit -m "test: add [Test 101] project discovery workflow"
```

### Example 3: Fixing a Test

```bash
# Fix failing test
vim tests/responsive/201-layout-responsive.spec.js

# Commit fix with reference
git add tests/responsive/201-layout-responsive.spec.js
git commit -m "test: fix [Test 201] timeout waiting for sidebar collapse"
```

## Related Documentation

- [TEST-FILE-INDEX.md](../../docs/testing/TEST-FILE-INDEX.md) - Complete index of all test files and available numbers
- [Test Reports](../../docs/testing/test-reports/) - Generated test execution reports
- [CLAUDE.md](../../CLAUDE.md) - Main project documentation with testing workflow

## Need Help?

If you're unsure which category to use or what number to assign:

1. **Check [TEST-FILE-INDEX.md](../../docs/testing/TEST-FILE-INDEX.md)** for existing tests and available numbers
2. Review existing tests in each category
3. Consult with `@test-automation-engineer` agent
4. Check test reports in `/home/claude/manager/docs/testing/test-reports/`
5. Review this template again for examples
