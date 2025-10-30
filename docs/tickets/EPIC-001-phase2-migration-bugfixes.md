---
id: EPIC-001
title: Phase 2 Migration Bug Fixes - Complete Build Review Resolution
type: epic
severity: high
category: quality/stabilization
status: open
created: 2025-10-21
---

## Epic Overview

This epic encompasses all 16 bugs discovered during Phase 2 (Vite Migration) build review. These bugs represent core functionality issues that must be resolved before Phase 2 is merged to main.

**Scope:** Complete stabilization of Phase 2 migration
**Timeline:** Execute in 4 sequential groups with parallel work within each group
**Expected Outcome:** All 16 bugs fixed with comprehensive test coverage

## Success Criteria

- [ ] All 16 bugs fixed and tested
- [ ] Each bug has corresponding Playwright/Jest test
- [ ] All tests pass (100% pass rate)
- [ ] Code properly committed to `phase-2` branch
- [ ] PR created with all fixes for review
- [ ] No regressions in existing functionality

## Child Stories/Tickets

### Group 1: UI/Styling Fixes (Parallel Execution)
**4 bugs - Execute in parallel - Est. 2-3 hours total**

1. [BUG-001](BUG-001-theme-toggle-button-text.md) - Theme toggle button text visibility
2. [BUG-002](BUG-002-sidebar-icons-dark-mode.md) - Sidebar icon colors in dark mode
3. [BUG-007](BUG-007-sidebar-minimum-width.md) - Sidebar minimum 75% width
4. [BUG-009](BUG-009-show-more-button-positioning.md) - Show More button centering

**Acceptance Criteria:**
- [ ] All 4 UI issues resolved
- [ ] All 4 Playwright tests created and passing
- [ ] Dark mode contrast meets WCAG AA standards
- [ ] Responsive design verified

**Dependencies:** None - can execute immediately

### Group 2: Navigation/Structure Changes (Sequential Execution)
**4 bugs - Some dependencies - Est. 3-4 hours total**

1. [BUG-003](BUG-003-remove-navigation.md) - Remove unwanted navigation
2. [BUG-004](BUG-004-add-breadcrumbs.md) - Add breadcrumbs below header
3. [BUG-005](BUG-005-user-config-first-card.md) - User config as first card
4. [BUG-008](BUG-008-sidebar-close-outside-click.md) - Sidebar close on outside click

**Acceptance Criteria:**
- [ ] Navigation properly removed
- [ ] Breadcrumbs display and navigate correctly
- [ ] User config card properly positioned and styled
- [ ] Sidebar outside-click close behavior works
- [ ] All 4 Playwright tests created and passing

**Dependencies:**
- BUG-003 → BUG-004 (breadcrumbs may reference removed navigation)
- BUG-005 → BUG-008 (structure changes affect click handling)

**Execution Note:** Execute sequentially to manage dependencies, but BUG-004 and BUG-003 can be parallel if carefully scoped

### Group 3: Parser & Data Loading Issues (Parallel Execution)
**4 bugs - Independent backend fixes - Est. 3-4 hours total**

1. [BUG-010](BUG-010-hooks-population.md) - Hooks not fully populating
2. [BUG-011](BUG-011-agent-parser-yaml-handling.md) - Agent parser YAML error handling
3. [BUG-012](BUG-012-parsers-yaml-consistency.md) - Other parsers YAML consistency
4. [BUG-015](BUG-015-mcp-servers-loading.md) - MCP servers not loading

**Acceptance Criteria:**
- [ ] Hooks fully populate in sidebar
- [ ] Agent parser handles invalid YAML gracefully
- [ ] Commands/Hooks/MCP parsers follow agent parser pattern
- [ ] MCP servers display on project page
- [ ] All 4 backend tests created and passing
- [ ] All 4 frontend tests created and passing

**Dependencies:**
- BUG-011 → BUG-012 (other parsers copy agent parser fixes)

**Execution Note:** BUG-011 must complete before BUG-012, but BUG-010 and BUG-015 can be parallel

### Group 4: Data Display Enhancements (Parallel Execution)
**4 bugs - Independent frontend features - Est. 2-3 hours total**

1. [BUG-006](BUG-006-remove-copy-button.md) - Remove Copy button
2. [BUG-013](BUG-013-agent-allowed-tools-display.md) - Allowed Tools for Agents
3. [BUG-014](BUG-014-command-allowed-tools-verify.md) - Allowed Tools for Commands
4. [BUG-016](BUG-016-agent-color-indicator.md) - Agent color indicator

**Acceptance Criteria:**
- [ ] Copy button removed from sidebar
- [ ] Allowed Tools display for agents
- [ ] Allowed Tools verified/added for commands
- [ ] Agent color indicators display
- [ ] All 4 Playwright tests created and passing

**Dependencies:** None - can execute in parallel

## Execution Plan

### Phase 1: UI/Styling (Immediate)
```
Start → Group 1 (parallel 4 bugs) → All tests pass? → YES → Commit & Continue
                                                    NO → Fix → Retest
```

### Phase 2: Navigation/Structure (After Group 1)
```
Group 1 Complete → Group 2 (sequential 4 bugs) → All tests pass? → YES → Commit & Continue
                                                              NO → Fix → Retest
```

### Phase 3: Parser/Data (After Group 2)
```
Group 2 Complete → Group 3 (parallel 4 bugs) → All tests pass? → YES → Commit & Continue
                                         NO → Fix → Retest
```

### Phase 4: Data Display (After Group 3)
```
Group 3 Complete → Group 4 (parallel 4 bugs) → All tests pass? → YES → Final commit
                                         NO → Fix → Retest
```

### Final: PR & Review
```
All 4 Groups Complete → Code Review → PR Approval → Merge to phase-2
```

## Testing Requirements

### Frontend Tests (Playwright)
- 13 test files covering all frontend-impacting bugs
- Location: `tests/frontend/04-*.spec.js`
- All tests must pass across Chromium, Firefox, WebKit

### Backend Tests (Jest)
- 4 test files covering parser improvements
- Location: `tests/backend/*-yaml-recovery.test.js`
- All tests must pass

### Total Test Coverage
- 311 existing tests (all must pass)
- 17 new tests (must pass)
- **Final count: 328/328 tests passing (100%)**

## Git Workflow

**Branch:** `phase-2` (already exists)

**Commits:** One commit per bug group (4 total commits)
```
1. feat: fix Phase 2 UI/Styling issues (BUG-001, 002, 007, 009)
2. feat: fix Phase 2 navigation structure (BUG-003, 004, 005, 008)
3. fix: improve parser robustness (BUG-010, 011, 012, 015)
4. feat: enhance data display for configuration details (BUG-006, 013, 014, 016)
```

**PR:** Single PR from `phase-2` → `main` with all 16 fixes

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Regressions in existing features | Medium | Run full test suite after each group |
| Parser changes affect data | Medium | Comprehensive backend tests for parsers |
| Navigation removal breaks UX | Medium | Test navigation flow thoroughly |
| Styling changes break responsive | Medium | Test at multiple viewports |
| **Overall Risk** | **Low** | Comprehensive test coverage + incremental approach |

## Estimated Timeline

| Group | Duration | Parallel? | Start After |
|-------|----------|-----------|------------|
| Group 1: UI/Styling | 2-3 hours | Yes | Immediate |
| Group 2: Navigation | 3-4 hours | Partial | Group 1 done |
| Group 3: Parser/Data | 3-4 hours | Partial | Group 2 done |
| Group 4: Data Display | 2-3 hours | Yes | Group 3 done |
| **Total** | **10-14 hours** | | |

## Deployment Checklist

- [ ] All 16 bugs fixed
- [ ] All 328 tests passing (311 existing + 17 new)
- [ ] Code reviewed and approved
- [ ] No console errors or warnings
- [ ] Responsive design verified
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Performance impact minimal
- [ ] Documentation updated (if needed)

## Notes

- These bugs represent blocking issues discovered during Phase 2 build review
- All bugs must be fixed before Phase 2 can be merged to main
- The 4-group structure enables efficient parallel work where possible
- Each group is independently testable and committable
- Test coverage is mandatory for all fixes

## Related Documents

- `.claude/tickets/README.md` - Ticket index and quick reference
- `docs/prd/PRD-Phase2-Vite-Migration.md` - Phase 2 requirements
- `CLAUDE.md` - Project documentation
