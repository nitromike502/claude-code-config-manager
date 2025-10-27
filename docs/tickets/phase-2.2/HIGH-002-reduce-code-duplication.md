# HIGH-002: Reduce Code Duplication (Phase 2.1 Preparation)

**Issue ID:** HIGH-002
**Epic:** Phase 2.2 - Cleanup & Optimization
**Status:** 📋 Ready for Implementation
**Priority:** HIGH (Code Quality)
**Effort:** 3-4 hours (Phase 2.1 scope)
**Labels:** `high`, `refactor`, `phase-2.1`, `phase-2.2`, `technical-debt`

---

## Problem Description

Dashboard.vue, ProjectDetail.vue, and UserGlobal.vue have **62% code duplication** (~1900 LOC vs 500 with components). Identical patterns are copy-pasted across all three view components.

**Duplicated Patterns:**
- Loading state spinners (3 identical copies)
- Empty state displays (3 identical copies)
- Sidebar overlay logic (3 identical copies)
- Breadcrumb navigation (2 identical copies)
- ConfigCard integration (identical usage)
- Error handling (similar patterns)

**Impact:**
- **Bug Fixes:** Must be applied 3 times
- **New Features:** Must be implemented 3 times
- **Maintenance:** 3x effort for changes
- **Consistency Risk:** Versions drift over time

---

## Solution Design

**This is Phase 2.1 Component Refactoring work.**

Extract 7 reusable components per PRD-Phase2-Extension-Component-Refactoring.md:

1. **ConfigCard** - Reusable wrapper for configuration sections
2. **ConfigItemList** - Uniform item rendering
3. **ConfigDetailSidebar** - Detail view sidebar
4. **LoadingState** - Consistent skeleton loaders
5. **EmptyState** - Consistent empty state placeholders
6. **BreadcrumbNavigation** - Reusable breadcrumb navigation
7. **InfoBar** - Title + subtitle display pattern

**Expected Results:**
- 70% reduction in code duplication (1900 → 500 LOC)
- 50% faster development of new configuration pages
- Bug fixes applied once work everywhere
- Guaranteed visual consistency

---

## Acceptance Criteria

**Must Complete:**
- [x] All 7 components extracted per Phase 2.1 PRD
- [x] Dashboard.vue refactored to use components
- [x] ProjectDetail.vue refactored to use components
- [x] UserGlobal.vue refactored to use components
- [x] Zero functionality regressions
- [x] All 581 tests passing (270 backend + 311 frontend)
- [x] Visual consistency maintained
- [x] Code duplication < 10%

**See Full Implementation Plan:**
`/home/claude/manager/docs/prd/PRD-Phase2-Extension-Component-Refactoring.md`

---

## Implementation Steps

**This is a full Phase 2.1 Epic - See PRD for detailed breakdown.**

**Summary:**
1. Extract LoadingState component (30 min)
2. Extract EmptyState component (30 min)
3. Extract BreadcrumbNavigation component (45 min)
4. Extract InfoBar component (30 min)
5. Extract ConfigCard component (45 min)
6. Extract ConfigItemList component (1 hour)
7. Extract ConfigDetailSidebar component (1 hour)
8. Refactor Dashboard.vue (30 min)
9. Refactor ProjectDetail.vue (30 min)
10. Refactor UserGlobal.vue (30 min)
11. Testing and validation (30 min)

**Total:** 3-4 hours

---

## Dependencies

**Blocking:**
- None (can start immediately)

**Blocked By This Issue:**
- Future configuration pages (hooks, MCP, etc)
- Phase 3+ CRUD operations
- New dashboard features

**Related Issues:**
- HIGH-001 (CSS standardization - share variables)
- HIGH-003 (path aliases - cleaner imports)

---

## Notes

**Why This Matters:**
- **Maintenance:** Single source of truth for UI patterns
- **Velocity:** 50% faster new feature development
- **Quality:** Bugs fixed once apply everywhere
- **Consistency:** Guaranteed identical UX across views

**This is Phase 2.1 Work:**
This ticket is a placeholder for Phase 2.1 Component Refactoring. Full implementation details are in the PRD.

**Reference:**
- Full PRD: `/home/claude/manager/docs/prd/PRD-Phase2-Extension-Component-Refactoring.md`
- Original discovery: Cleanup Review (October 26, 2025)
- Review report: `/home/claude/manager/CLEANUP-AND-OPTIMIZATION-REPORT-2025-10-26.md`

---

**Created:** October 26, 2025
**Assigned To:** TBD (Phase 2.1 Epic - separate from Phase 2.2)
**Epic:** Phase 2.2 Cleanup & Optimization (planning), Phase 2.1 Component Refactoring (implementation)
