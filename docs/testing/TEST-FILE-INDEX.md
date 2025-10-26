# Test File Index

**Version:** 1.0
**Last Updated:** October 26, 2025
**Status:** Active

## Purpose

This document provides a comprehensive index of all test files in the Claude Code Manager project, organized by category with suite-level detail (XXX and XXX.YYY). Use this as a quick reference to:

- Find existing tests before creating new ones
- Identify available test numbers for new test files
- Understand test organization and coverage
- Locate similar tests for reference

## How to Use

1. **Before creating a new test:** Check this index to find the next available number in the appropriate category
2. **Looking for similar tests:** Browse the suite descriptions to find tests covering similar functionality
3. **Understanding test coverage:** Review the category summaries to see what areas are tested
4. **For individual test details:** See the actual test files (XXX.YYY.ZZZ level details are in the files themselves)

## How to Add New Tests

1. Review this index to find the next available test number in your category
2. Create your test file following the naming convention: `XXX-descriptive-name.spec.js`
3. Update this index with your new test file and its test suites (XXX.YYY level)
4. See [test-creation-checklist.md](test-creation-checklist.md) for full test creation guidelines

---

## Frontend Component Tests (01-99)

**Location:** `tests/frontend/`
**Purpose:** Individual UI components, element rendering, and basic interactions
**Format:** `XX-test-name.spec.js`
**Current Count:** 8 test files
**Available Numbers:** 07-22, 24-99

### Current Tests

**01 - App Smoke Tests** (`01-app-smoke.spec.js`)
- 01.001: Basic app initialization
- 01.002: Theme toggle functionality
- 01.003: Loading state and async behavior
- 01.004: API integration and error handling

**02 - Project Detail Page** (`02-project-detail.spec.js`)
- 02.001: Page load and structure
- 02.002: URL parameter handling
- 02.003: Navigation
- 02.004: Theme toggle
- 02.005: Error handling
- 02.006: Loading state
- 02.007: Responsive design
- 02.008: Console error detection

**03 - Routing and Navigation** (`03-routing-navigation.spec.js`)
- 03.001: Vue Router configuration
- 03.002: Route transitions
- 03.003: Navigation guards
- 03.004: History mode navigation
- 03.005: 404 handling
- 03.006: Browser back/forward navigation

**04 - Component Rendering** (`04-component-rendering.spec.js`)
- 04.001: Dashboard component
- 04.002: ProjectDetail component
- 04.003: UserGlobal component
- 04.004: Agent sidebar metadata display (includes BUG-027, BUG-028, BUG-029 fixes)
- 04.005: Console errors

**05 - API Integration** (`05-api-integration.spec.js`)
- 05.001: Projects API endpoint
- 05.002: User configuration endpoints
- 05.003: Project-specific endpoints
- 05.004: Error handling and retry logic
- 05.005: API timeout handling
- 05.006: API response validation

**06 - Styling and Theme** (`06-styling-theme.spec.js`)
- 06.001: CSS variables
- 06.002: Dark mode styles
- 06.003: Light mode styles
- 06.004: Theme persistence
- 06.005: Component-specific styles
- 06.006: Responsive breakpoints

**23 - Pinia Stores** (`23-pinia-stores.spec.js`)
- 23.001: Theme store
- 23.002: Projects store
- 23.003: Notifications store
- 23.004: Store persistence
- 23.005: Store reactivity
- 23.006: Store actions and mutations

**300 - Visual Regression** (`visual/300-visual-regression.spec.js`)
- See Visual Regression Tests section below

---

## E2E Integration Tests (100-199)

**Location:** `tests/e2e/`
**Purpose:** Complete user workflows and multi-step interactions across components
**Format:** `1XX-descriptive-name.spec.js`
**Current Count:** 5 test files
**Available Numbers:** 103, 106-199

### Current Tests

**100 - Complete User Flows Integration** (`100-complete-user-flows-integration.spec.js`)
- 100.001: Complete user flows (Dashboard → Project → Sidebar → Back)
- 100.002: Interactive features integration (Sidebar, Theme Toggle, Copy)
- 100.003: API integration points (All endpoints, warnings, error states)
- 100.004: Error handling and recovery (Network failures, invalid data)

**101 - User Flow: Project Discovery** (`101-user-flow-project-discovery.spec.js`)
- 101.001: First-time user project discovery journey
- 101.002: Project list loading and rendering
- 101.003: Project filtering and sorting
- 101.004: Empty state and error handling

**102 - User Flow: Configuration Viewing** (`102-user-flow-configuration-viewing.spec.js`)
- 102.001: Agent viewing and interaction
- 102.002: Command viewing and interaction
- 102.003: Hook viewing
- 102.004: MCP server viewing
- 102.005: Multi-configuration workflows

**104 - Command Metadata Display** (`104-command-metadata-display.spec.js`)
- 104.001: Command metadata display in sidebar
  - Tests command name, description, allowed-tools, argument-hint
  - Validates BUG-030 fix (allowed-tools extraction from YAML frontmatter)
  - Tests commands with/without tools
  - Tests optional vs required metadata fields

**105 - User Flow: Theme Toggle** (`105-user-flow-theme-toggle.spec.js`)
- 105.001: Light/dark theme switching
- 105.002: Theme persistence across navigation
- 105.003: Theme sync between components
- 105.004: Theme toggle accessibility

---

## Responsive Design Tests (200-299)

**Location:** `tests/responsive/`
**Purpose:** Viewport-specific testing for mobile, tablet, and desktop layouts
**Format:** `2XX-descriptive-name.spec.js`
**Current Count:** 1 test file
**Available Numbers:** 201-299

### Current Tests

**200 - Layout Responsive Design** (`200-layout-responsive.spec.js`)
- 200.001: Mobile viewport (375×667) - 14 tests
  - Dashboard layout, project cards, navigation, sidebar, touch targets
- 200.002: Tablet viewport (768×1024) - 14 tests
  - Dashboard layout, project cards, navigation, sidebar, text readability
- 200.003: Desktop viewport (1920×1080) - 14 tests
  - Dashboard layout, project cards, navigation, sidebar, hover states
- 200.004: Cross-viewport tests - 2 tests
  - Layout transitions, content accessibility during viewport changes

**Note:** Test 200 includes Phase 2 partial compatibility warnings for navigation tests.

---

## Visual Regression Tests (300-399)

**Location:** `tests/frontend/visual/`
**Purpose:** Screenshot comparison and visual consistency checks
**Format:** `3XX-descriptive-name.spec.js`
**Current Count:** 1 test file
**Available Numbers:** 301-399

### Current Tests

**300 - Visual Regression Testing** (`300-visual-regression.spec.js`)
- 300.001: Dashboard visual regression (4 tests)
  - With projects, loading state, error state, empty state
- 300.002: Dashboard dark/light mode (2 tests)
  - Dark mode, light mode
- 300.003: Project detail view visual regression (4 tests)
  - Normal render, with warnings, loading state, error state
- 300.004: Dashboard components (3 tests)
  - Project card, header, breadcrumbs navigation
- 300.005: Responsive design (3 tests)
  - Mobile viewport, tablet viewport, project detail mobile
- 300.006: Interactive states (3 tests)
  - Project card hover, theme toggle hover, navigation link hover

**Total Visual Tests:** 19 screenshot comparisons
**Baseline Location:** `tests/frontend/visual/*.spec.js-snapshots/`
**Update Command:** `npx playwright test --update-snapshots visual-regression.spec.js`

---

## Backend Tests (Jest)

**Location:** `tests/backend/`
**Purpose:** API endpoint tests, parser unit tests, error handling
**Format:** No numbered prefix - uses descriptive names
**Current Count:** 14 test files
**Test Framework:** Jest + Supertest

### Test Files

**API & Endpoints:**
- `api-smoke.test.js` - Basic health checks and smoke tests
- `endpoints/project-agents.test.js` - Project agents API endpoint
- `endpoints/project-commands.test.js` - Project commands API endpoint
- `endpoints/project-hooks.test.js` - Project hooks API endpoint
- `endpoints/user-agents.test.js` - User agents API endpoint
- `endpoints/user-commands.test.js` - User commands API endpoint
- `endpoints/user-hooks.test.js` - User hooks API endpoint

**Parsers:**
- `parsers/commandParser.test.js` - Command markdown file parsing
- `parsers/hookParser.test.js` - Hook JSON parsing
- `parsers/subagentParser.test.js` - Subagent YAML frontmatter parsing

**Error Handling:**
- `errors/malformed-json.test.js` - Malformed JSON file handling
- `errors/malformed-yaml.test.js` - Malformed YAML frontmatter handling

**Regression:**
- `regression/bug-001-yaml.test.js` - BUG-001 YAML parsing regression test
- `regression/bug-002-hooks.test.js` - BUG-002 hooks parsing regression test

**Total Backend Tests:** 270 Jest tests (100% pass rate)

---

## Quick Reference Table

| Category | Location | Range | Format | Current | Available |
|----------|----------|-------|--------|---------|-----------|
| Frontend Component | `tests/frontend/` | 01-99 | `XX-name.spec.js` | 8 | 07-22, 24-99 |
| E2E Integration | `tests/e2e/` | 100-199 | `1XX-name.spec.js` | 5 | 103, 106-199 |
| Responsive | `tests/responsive/` | 200-299 | `2XX-name.spec.js` | 1 | 201-299 |
| Visual Regression | `tests/frontend/visual/` | 300-399 | `3XX-name.spec.js` | 1 | 301-399 |
| Backend (Jest) | `tests/backend/` | N/A | `name.test.js` | 14 | N/A |

---

## Usage Examples

### Example 1: Creating a New E2E Test

**Scenario:** You need to create a new E2E test for sidebar navigation.

**Steps:**
1. Check Section "E2E Integration Tests (100-199)"
2. See available numbers: 103, 106-199
3. Choose 103 as next sequential number
4. Create file: `tests/e2e/103-user-flow-sidebar-navigation.spec.js`
5. Add test suites (e.g., 103.001, 103.002, 103.003)
6. Update this index with your new test file and suites

**Index Update:**
```markdown
**103 - User Flow: Sidebar Navigation** (`103-user-flow-sidebar-navigation.spec.js`)
- 103.001: Opening sidebar from different contexts
- 103.002: Sidebar navigation between items
- 103.003: Sidebar keyboard shortcuts
```

### Example 2: Finding Similar Test for Reference

**Scenario:** You need to test theme switching behavior.

**Steps:**
1. Search this index for "theme"
2. Find:
   - Test 01.002: Theme toggle functionality (basic)
   - Test 06 (Styling and Theme): Comprehensive theme tests
   - Test 105: Theme toggle user flow (E2E)
3. Review Test 105 for E2E flow patterns
4. Review Test 06 for detailed theme state testing
5. Use as reference for your new test

### Example 3: Checking Test Coverage Gaps

**Scenario:** Planning new features for agent metadata.

**Steps:**
1. Check Section "Frontend Component Tests"
2. Find Test 04.004: Agent sidebar metadata display
3. See existing coverage: color, model, tools fields
4. Identify gaps: No tests for description field, file path display
5. Plan new tests in Test 04.004 or create Test 07 if needed

---

## Test Numbering Reference

### Frontend Component Tests (01-99)
- **File Level (XX):** Two-digit number for the test file
- **Suite Level (XX.YYY):** Three-digit suite number within file
- **Test Level (XX.YYY.ZZZ):** Individual test case (see test files for details)

**Example:**
- `04-component-rendering.spec.js` → File 04
- `04.002: ProjectDetail Component` → Suite 04.002
- `04.002.001: ProjectDetail loads all configuration cards` → Test 04.002.001

### E2E Integration Tests (100-199)
- **File Level (1XX):** Three-digit number starting with 1
- **Suite Level (1XX.YYY):** Three-digit suite number
- **Test Level (1XX.YYY.ZZZ):** Individual test case

**Example:**
- `100-complete-user-flows-integration.spec.js` → File 100
- `100.001: Complete User Flows` → Suite 100.001
- `100.001.001: user can navigate from dashboard to project...` → Test 100.001.001

### Responsive Design Tests (200-299)
- **File Level (2XX):** Three-digit number starting with 2
- Same suite/test structure as above

### Visual Regression Tests (300-399)
- **File Level (3XX):** Three-digit number starting with 3
- Same suite/test structure as above

---

## Updating This Index

**When to Update:**
- After creating a new test file
- After adding new test suites to existing files
- After removing or renaming test files
- During major test refactoring

**What to Include:**
- File number and descriptive name
- All test suites (XXX.YYY level) with brief descriptions
- Update "Current Count" and "Available Numbers" for the category

**What NOT to Include:**
- Individual test cases (XXX.YYY.ZZZ level) - these belong in test files
- Implementation details - keep descriptions brief
- Test data or mock configurations

**Format Consistency:**
```markdown
**XXX - Descriptive Name** (`XXX-file-name.spec.js`)
- XXX.001: Suite description
- XXX.002: Another suite description
- XXX.003: Yet another suite description
```

---

## Related Documentation

- [Test Creation Checklist](test-creation-checklist.md) - Step-by-step guide for creating new tests
- [Test Template](../../.claude/templates/test-template.md) - Template for new test files
- [CLAUDE.md](../../CLAUDE.md) - Main project documentation with testing workflow
- [Test Reports](test-reports/) - Generated test execution reports

---

## Notes

- **Test Organization:** Tests are organized by category (frontend, e2e, responsive, visual, backend) to make them easy to find and maintain
- **Numbering Gaps:** Some numbers may be intentionally skipped (e.g., 07-22) for future expansion or logical grouping
- **Suite Descriptions:** This index shows suite-level organization (XXX.YYY). For individual test details (XXX.YYY.ZZZ), refer to the actual test files
- **Backend Tests:** Backend tests don't use numbered prefixes, following standard Jest naming conventions
- **Phase 2 Compatibility:** Some Phase 1 tests have Phase 2 compatibility notes - see individual files for details

---

**Last Review:** October 26, 2025
**Next Review:** After Phase 2.1 component refactoring completion
