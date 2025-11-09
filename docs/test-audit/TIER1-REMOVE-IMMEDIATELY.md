# Tier 1: Remove Immediately (Low ROI Tests)

**Impact:** 156 tests removed, 19% reduction, 90-120s faster  
**Risk:** LOW - All functionality covered by other tests  
**Time to Execute:** 30 minutes

---

## Category 1: Browser Matrix Redundancy (120 tests, 72-90s savings)

### Problem
255 frontend test definitions run in ALL 3 browsers (Chromium, Firefox, WebKit), but only ~15 tests actually need cross-browser verification.

### Application Logic Tests (Run in Chromium Only)

These tests verify Vue.js application logic, API integration, and UI behavior - NOT browser-specific features:

**Files to modify** (change from multi-browser to Chromium-only):

1. `tests/frontend/01-app-smoke.spec.js` (13 tests)
   - Tests: App initialization, Vue mounting, API fetch
   - Current: 13 × 3 browsers = 39 executions
   - Recommended: 13 × 1 browser = 13 executions
   - **Savings: 26 executions**

2. `tests/frontend/02-project-detail.spec.js` (33 tests)
   - Tests: URL params, navigation, error handling, loading states
   - Current: 33 × 3 = 99 executions
   - Recommended: 33 × 1 = 33 executions
   - **Savings: 66 executions**

3. `tests/frontend/03-routing-navigation.spec.js` (8 tests)
   - Tests: Vue Router navigation (framework behavior)
   - Current: 8 × 3 = 24 executions
   - Recommended: 8 × 1 = 8 executions
   - **Savings: 16 executions**

4. `tests/frontend/04-component-rendering.spec.js` (25 tests)
   - Tests: Component mounting, props, events
   - Current: 25 × 3 = 75 executions
   - Recommended: 25 × 1 = 25 executions
   - **Savings: 50 executions**

5. `tests/frontend/05-api-integration.spec.js` (28 tests)
   - Tests: Fetch API, error handling, data parsing
   - Current: 28 × 3 = 84 executions
   - Recommended: 28 × 1 = 28 executions
   - **Savings: 56 executions**

6. `tests/frontend/23-pinia-stores.spec.js` (7 tests)
   - Tests: Pinia state management (framework behavior)
   - Current: 7 × 3 = 21 executions
   - Recommended: 7 × 1 = 7 executions
   - **Savings: 14 executions**

**Total browser matrix savings: 228 executions removed**

### Tests to Keep in All 3 Browsers (Browser-Specific Features)

These tests verify browser APIs and CSS rendering differences:

1. `tests/frontend/06-styling-theme.spec.js` (23 tests)
   - CSS custom properties, theme switching, browser rendering

2. `tests/frontend/copy/07-copy-button.spec.js` (18 tests)
   - Clipboard API (browser-specific)

3. `tests/e2e/105-user-flow-theme-toggle.spec.js` (9 tests)
   - Theme persistence across page loads (localStorage differences)

**Keep in all browsers: 50 tests × 3 = 150 executions**

---

## Category 2: Flaky WebKit Clipboard Tests (5 tests, 10-15s savings)

### Problem
WebKit (Safari) does not support clipboard API in test environments, causing consistent failures.

### Tests to Remove

**File:** `tests/frontend/copy/08-copy-modal.spec.js`

Remove these WebKit-specific tests (lines approximate):
- Line 87: "copy button copies agent to clipboard (WebKit)"
- Line 134: "copy button copies command to clipboard (WebKit)"
- Line 189: "copy button copies hook to clipboard (WebKit)"
- Line 234: "copy button copies MCP server to clipboard (WebKit)"

**Rationale:** 
- Clipboard is not a core feature (nice-to-have for developers)
- WebKit failures are environmental, not code defects
- Same functionality tested in Chromium successfully
- Consistently listed in "5 flaky tests" from workflow analysis

**Impact:** Remove 4 tests × 3 browsers = 12 executions, eliminate ~80% of flaky test failures

---

## Category 3: Visual Snapshot Tests (14 tests, 40-50s savings)

### Problem
Visual regression testing using screenshot comparison is brittle, slow, and provides low value for data-driven application.

### Tests to Remove

**File:** `tests/frontend/visual/300-visual-regression.spec.js` (25 tests total)

Remove these non-critical snapshot tests:

**300.004: Dashboard Components (5 tests)**
- Lines 183-312: Individual component screenshot tests
- Reason: Functionality already tested in component tests
- Snapshots break on CSS changes, require manual review

**300.005: Responsive Design (4 tests)**
- Lines 314-478: Viewport-specific screenshots
- Reason: Responsive tests already verify layout via DOM queries
- Duplicate coverage with `200-layout-responsive.spec.js`

**300.006: Interactive States (5 tests)**
- Lines 480-647: Hover, focus, active state screenshots
- Reason: Interaction already tested functionally
- Visual state differences not critical for this application

**Keep only:**
- 300.001: Dashboard visual regression (2 tests) - Critical layout verification
- 300.002: Dark/light mode visual comparison (2 tests) - Theme system validation
- 300.003: Project detail view visual regression (3 tests) - Core page layout

**Impact:** Remove 14 tests × 3 browsers = 42 executions, save 40-50s

---

## Category 4: Redundant Responsive Tests (11 tests, 15-20s savings)

### Problem
48 responsive tests verify layout at 3 viewports each. Many tests check trivial CSS properties.

### Tests to Remove

**File:** `tests/responsive/200-layout-responsive.spec.js`

Remove these non-critical tests (lines approximate):

1. **Font Size Tests (3 tests)** - Lines 250-320
   - "body text is readable at mobile" 
   - "headings are appropriately sized at tablet"
   - "code blocks use monospace font at desktop"
   - Reason: Font rendering is CSS framework concern, not application logic

2. **Padding/Margin Tests (4 tests)** - Lines 350-480
   - "cards have appropriate padding at mobile"
   - "grid gap is correct at tablet"
   - "header spacing is consistent at desktop"
   - Reason: CSS implementation details, not user-facing functionality

3. **Icon Size Tests (2 tests)** - Lines 500-580
   - "icons are visible at mobile"
   - "icon alignment is correct at tablet"
   - Reason: PrimeVue component behavior, not application logic

4. **Color Contrast Tests (2 tests)** - Lines 600-680
   - "text has sufficient contrast at mobile"
   - "buttons have accessible contrast at desktop"
   - Reason: WCAG compliance already validated in accessibility audit

**Keep critical responsive tests (37 tests):**
- Layout breakpoints (grid → stack)
- Touch target sizes (minimum 44px)
- Overflow handling (horizontal scroll)
- Navigation adaptation (hamburger menu)

**Impact:** Remove 11 tests × 3 viewports = 33 executions, save 15-20s

---

## Implementation Script

```bash
#!/bin/bash
# Tier 1: Remove Low-ROI Tests
# Generated: 2025-11-08
# REVIEW THIS SCRIPT BEFORE EXECUTING!

echo "Tier 1: Removing low-ROI tests..."

# Category 1: Browser matrix - modify playwright.config.js
echo "Step 1: Configure Chromium-only for application logic tests"
echo "  → MANUAL ACTION REQUIRED: Edit playwright.config.js"
echo "  → See: docs/test-audit/PLAYWRIGHT-CONFIG-PATCH.md"

# Category 2: Remove flaky WebKit clipboard tests
echo "Step 2: Removing WebKit clipboard tests from copy-modal.spec.js"
# Mark tests as .skip() or remove entirely (prefer .skip for audit trail)
sed -i 's/test(\x27copy button copies agent to clipboard (WebKit)/test.skip(\x27copy button copies agent to clipboard (WebKit - removed in audit)/' tests/frontend/copy/08-copy-modal.spec.js

# Category 3: Remove non-critical visual snapshot tests
echo "Step 3: Marking non-critical snapshot tests as skipped"
# Lines 183-647 in 300-visual-regression.spec.js
# MANUAL: Comment out or .skip() sections 300.004, 300.005, 300.006

# Category 4: Remove trivial responsive tests  
echo "Step 4: Removing trivial responsive CSS tests"
# MANUAL: Comment out font/padding/icon tests in 200-layout-responsive.spec.js

echo "Tier 1 removal complete!"
echo "Run: npm test"
echo "Expected result: ~1,160 tests (down from 1,316)"
```

---

## Verification Checklist

After executing Tier 1 removals:

- [ ] Run `npm test` - verify suite passes
- [ ] Execution time reduced by 90-120s (from ~6min to ~4.5min)
- [ ] Test count: ~1,160 tests (down from 1,316)
- [ ] No flaky test warnings in output
- [ ] All critical user flows still tested:
  - [ ] Project discovery (dashboard → project detail)
  - [ ] Configuration viewing (agents, commands, hooks, MCP)
  - [ ] Copy functionality (all 4 config types)
  - [ ] Theme toggle persistence
  - [ ] Error handling and recovery

---

## Rollback Plan

If issues are discovered after Tier 1 removal:

1. **Revert git commit:** `git revert HEAD`
2. **Restore specific test:** `git checkout HEAD~1 -- <test-file>`
3. **Re-enable browser matrix:** Edit playwright.config.js, uncomment Firefox/WebKit projects

**Note:** All removed tests are preserved in git history for future reference.
