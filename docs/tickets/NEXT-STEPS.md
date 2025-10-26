# Next Steps - Development Roadmap

## Recently Completed (October 25, 2025)

### ✅ Phase 2 Extension - Component Refactoring COMPLETE
- **Duration:** ~3.5 hours (estimated 3-4 hours)
- **Components Created:** 6 reusable components
- **Code Duplication:** Reduced from 62% to <10%
- **LOC Impact:** 188 lines eliminated from main pages, 1151 lines added in reusable components
- **Test Coverage:** 100% (583+ tests passing - 270 backend + 313+ frontend)
- **Status:** ✅ COMPLETE - All 4 stories, 16 tasks finished

**Components:**
- ConfigCard.vue (248 lines, 4.7KB)
- ConfigItemList.vue (182 lines, 4.0KB)
- ConfigDetailSidebar.vue (387 lines, 9.9KB)
- LoadingState.vue (85 lines, 1.3KB)
- EmptyState.vue (123 lines, 2.1KB)
- BreadcrumbNavigation.vue (126 lines, 2.5KB)

**Documentation:**
- Completion Report: `/home/claude/manager/docs/PHASE2-EXTENSION-COMPLETION-REPORT.md`
- PRD: `/home/claude/manager/docs/prd/PRD-Phase2-Extension-Component-Refactoring.md`
- Epic & Stories: `/home/claude/manager/docs/tickets/phase-2-extension/`

---

### ✅ Fixed Bugs (October 24, 2025)
- **BUG-027:** Agent color field display in sidebars ✅ FIXED
- **BUG-028:** Agent model field display in sidebars ✅ FIXED
- **BUG-029:** Agent tools field display in sidebars ✅ FIXED
- **BUG-035:** User configuration card missing after navigation ✅ FIXED

**Status:** All fixed bugs have comprehensive test coverage and are passing (19/19 tests).

**Commits:**
- `04a2c6f` - fix: display agent model in sidebars and fix user config card display [BUG-028, BUG-035]
- `060954b` - docs: update documentation with recent bug fixes and current status

---

## 📋 Documentation Checklists

**Important:** When completing work items (tasks, bugs, stories, phases), use the [Documentation Checklists](../DOCUMENTATION-CHECKLISTS.md) to keep all documentation consistent. Takes 2-10 minutes per item and prevents inconsistencies like those fixed on 2025-10-25.

**Which checklist do you need?**
- Completing a TASK → [Task Completion Checklist](../DOCUMENTATION-CHECKLISTS.md#task-completion-checklist)
- Completing a STORY → [Story Completion Checklist](../DOCUMENTATION-CHECKLISTS.md#story-completion-checklist)
- Fixing a BUG → [Bug Fix Completion Checklist](../DOCUMENTATION-CHECKLISTS.md#bug-fix-completion-checklist)
- Completing a PHASE → [Phase Completion Checklist](../DOCUMENTATION-CHECKLISTS.md#phase-completion-checklist)

---

## 🚀 CURRENT PRIORITIES

### Option A: Bug Fixes (Recommended - Quick Wins)
Continue pattern-based fixes for remaining display bugs (BUG-030 through BUG-033). These follow the same patterns established in the October 24 session and should be quick to complete (~30-45 minutes total).

**See:** [Current Open Bugs](#current-open-bugs---priority-order) section below.

### Option B: Phase 3 Planning (Strategic)
With Phase 2 Extension complete, begin planning Phase 3 (Subagent CRUD operations) to leverage the new component architecture.

**Benefits:**
- Component architecture now in place (ConfigCard, ConfigDetailSidebar ready for reuse)
- Clean foundation for CRUD operations
- Pattern established for future features

**See:** CLAUDE.md "Future Features" section for Phase 3 scope.

---

## Current Open Bugs - Priority Order

### 🔴 HIGH PRIORITY (Similar pattern to recently fixed issues)

#### BUG-030: Slash Command tools field not displaying ⚠️ NEXT UP
- **Status:** OPEN
- **Priority:** HIGH
- **Category:** Data Display
- **Affected Components:** ProjectDetail.vue, UserGlobal.vue (command sidebars)
- **Issue:** Command allowed tools field is parsed but not displayed in sidebar metadata
- **Similar to:** BUG-029 (agent tools) - Already fixed, can follow same pattern
- **Estimated Effort:** 15-20 minutes (similar to agent tools fix)
- **Expected Changes:**
  1. Add `tools` field display in command sidebar metadata sections
  2. Create tests 04.004.007 and 04.004.008 for command tools display
  3. Ensure graceful handling for missing tools

**See:** `docs/tickets/bugs/BUG-030-command-tools-display.md`

---

#### BUG-031: Command argument hint display ⚠️ PRIORITY 2
- **Status:** OPEN
- **Priority:** HIGH
- **Category:** Data Display
- **Affected Components:** ProjectDetail.vue, UserGlobal.vue (command sidebars)
- **Issue:** Command argument hint field is parsed but not displayed
- **Estimated Effort:** 15-20 minutes
- **Expected Changes:**
  1. Add `hint` or `argument_hint` field display in command sidebar
  2. Create tests for argument hint display
  3. Handle missing hints gracefully

**See:** `docs/tickets/bugs/BUG-031-command-argument-hint-display.md`

---

#### BUG-032: Hook command field not displaying ⚠️ PRIORITY 3
- **Status:** OPEN
- **Priority:** HIGH
- **Category:** Data Display
- **Affected Components:** ProjectDetail.vue, UserGlobal.vue (hooks sidebars)
- **Issue:** Hook command field is parsed but not displayed
- **Estimated Effort:** 15-20 minutes

**See:** `docs/tickets/bugs/BUG-032-hook-command-display.md`

---

#### BUG-033: Hook type field not displaying ⚠️ PRIORITY 4
- **Status:** OPEN
- **Priority:** HIGH
- **Category:** Data Display
- **Affected Components:** ProjectDetail.vue, UserGlobal.vue (hooks sidebars)
- **Issue:** Hook type field is parsed but not displayed
- **Estimated Effort:** 15-20 minutes

**See:** `docs/tickets/bugs/BUG-033-hook-type-display.md`

---

### 🟡 MEDIUM PRIORITY (Resolved previously but good for verification)

#### BUG-026: MCP servers not showing in project view
- **Status:** Likely resolved during Phase 2 refactoring
- **Priority:** MEDIUM
- **Action:** Verify if still an issue, add to testing if needed

---

### 🟢 LOW PRIORITY (Closed/Resolved)

#### BUG-001 through BUG-025
- **Status:** RESOLVED / CLOSED
- **Notes:** These were resolved during Phase 1 MVP and Phase 2 Vite migration
- **Documentation:** See individual ticket files in `docs/tickets/bugs/`

---

## Recommended Work Plan

### Next Session (BUG-030 Session)
**Duration:** ~30-45 minutes (4 bugs, similar pattern)

1. **BUG-030: Command tools display** (15-20 min)
   - Add `tools` field display to command sidebar metadata
   - Create tests 04.004.007 and 04.004.008
   - Expected pattern: Same as agent tools (BUG-029)

2. **BUG-031: Command argument hint** (15-20 min)
   - Add `hint` field display to command sidebar
   - Create tests
   - Similar implementation pattern

3. **BUG-032: Hook command field** (15-20 min)
   - Add `command` field display to hook sidebar
   - Create tests

4. **BUG-033: Hook type field** (15-20 min)
   - Add `type` field display to hook sidebar
   - Create tests

**Test Coverage:** Expect 4-8 new tests (similar scope to BUG-028)
**Final Status:** 321-325/313 total tests (all passing)

### Session 2 (Verification & Polish)
- Run full test suite (backend + frontend)
- Verify cross-browser compatibility
- Check responsive design
- Document any edge cases

### Session 3+ (Phase 3 - Subagent CRUD)
- After all display bugs are fixed and verified
- Begin implementation of create/edit/delete functionality
- See "Future Features" in CLAUDE.md

---

## Patterns Established (Leverage for speed)

### Frontend Sidebar Display Pattern (Used in BUG-027, BUG-028, BUG-029)
```vue
<!-- In ProjectDetail.vue and UserGlobal.vue agent/command/hook sidebars -->
<p><strong>Field Name:</strong> {{ selectedItem.fieldName || 'Not specified' }}</p>
```

**Apply this pattern to:**
- ✅ Agent color (BUG-027) - DONE
- ✅ Agent model (BUG-028) - DONE
- ✅ Agent tools (BUG-029) - DONE
- ⏳ Command tools (BUG-030) - NEXT
- ⏳ Command argument hint (BUG-031)
- ⏳ Hook command (BUG-032)
- ⏳ Hook type (BUG-033)

### Test Pattern (Used for BUG-028)
```javascript
test('04.004.XXX: [field] displays in [Component] sidebar [BUG-XXX]', async ({ page }) => {
  // Navigate to component
  // Click on configuration item
  // Verify field displays in sidebar
  // Check value is correct
})
```

---

## Current Metrics

- **Total Tests:** 313 (19 component tests + 90 E2E + 44 responsive + 57 visual + 270 backend)
- **Pass Rate:** 100%
- **Open Bugs:** 8 (BUG-030 through BUG-033, plus potential others)
- **Fixed in Oct 24 Session:** 4 bugs (BUG-027, BUG-028, BUG-029, BUG-035)
- **Est. Tests Added:** 2-3 new tests per bug × 4 bugs = 8-12 new tests expected

---

## Success Criteria for Next Session

- [ ] All 4 bugs (BUG-030 through BUG-033) show field displays
- [ ] New tests created and passing (04.004.007 through 04.004.010+)
- [ ] All 313+ tests passing (100% pass rate)
- [ ] Code follows established patterns
- [ ] Commit message references all fixed bugs

---

## Notes

- The recent fixes (BUG-027, BUG-028, BUG-029) established clear patterns for sidebar metadata display
- BUG-030 through BUG-033 follow the exact same pattern and should be quicker to fix
- All fixes are frontend-only (backend parsing already works)
- No API changes needed - data is already available in response
- Similar scope to today's work means similar time estimate (~30-45 min for 4 bugs)

---

## References

- **Session Archive:** `docs/sessions/INDEX.md` (Complete development history, workflow analyses)
- **Latest Session Summary:** `docs/sessions/summaries/SESSION-SUMMARY-20251024.md`
- **Main Docs:** `CLAUDE.md` (Success Criteria, Future Features, Development History)
- **Bug Tickets:** `docs/tickets/bugs/BUG-*.md`
- **Test Files:** `tests/frontend/04-component-rendering.spec.js`
