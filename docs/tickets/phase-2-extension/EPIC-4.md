# EPIC-4: Phase 2 Extension - Component Refactoring

**Phase:** 2.1 - Architecture Improvement
**Status:** Ready for Implementation
**Priority:** High (Foundation for Phase 3+ features)
**Estimated Duration:** 3-4 hours

## Executive Summary

Extract reusable Vue components from `ProjectDetail.vue` and `UserGlobal.vue` to eliminate 60%+ code duplication (~1100 LOC) and establish scalable patterns for Phase 3+ feature development.

## Problem Statement

The current implementation contains significant code duplication:
- Configuration card sections (Agents, Commands, Hooks, MCP) are repeated 4× per page
- Sidebar detail views have 85% identical code across both pages
- State management is 100% duplicated
- Maintenance burden: bug fixes require changes in multiple places

## Solution Overview

Extract 6 core reusable components:
1. **ConfigCard** - Configuration section wrapper with states
2. **ConfigItemList** - Uniform item row rendering
3. **ConfigDetailSidebar** - Detail view with type-aware metadata
4. **LoadingState** - Consistent skeleton loaders
5. **EmptyState** - Consistent empty state displays
6. **BreadcrumbNavigation** - Reusable breadcrumb component

## Expected Benefits

- **Code Reduction:** 1900 → 500 LOC (70%+ reduction)
- **Developer Velocity:** New config pages built 50% faster
- **Bug Fixes:** Applied once, work everywhere
- **Consistency:** Guaranteed uniform appearance
- **Testing:** More reliable test coverage

## Stories

### Story 2.1: Extract Core Card Components
**Duration:** 60-90 minutes | **Tasks:** 5

Extract ConfigCard and ConfigItemList components, refactor both pages to use them.

- TASK-2.1.1: Create ConfigCard component (30 min)
- TASK-2.1.2: Create ConfigItemList component (20 min)
- TASK-2.1.3: Refactor ProjectDetail to use ConfigCard (15 min)
- TASK-2.1.4: Refactor UserGlobal to use ConfigCard (10 min)
- TASK-2.1.5: Testing & validation (15 min)

### Story 2.2: Extract Sidebar Component
**Duration:** 45-60 minutes | **Tasks:** 4

Extract ConfigDetailSidebar with type-aware metadata display.

- TASK-2.2.1: Create ConfigDetailSidebar component (25 min)
- TASK-2.2.2: Extract MetadataDisplay logic (15 min)
- TASK-2.2.3: Refactor ProjectDetail sidebar (10 min)
- TASK-2.2.4: Refactor UserGlobal sidebar (10 min)

### Story 2.3: Extract Utility Components
**Duration:** 30-45 minutes | **Tasks:** 4

Extract LoadingState, EmptyState, and BreadcrumbNavigation components.

- TASK-2.3.1: Create LoadingState component (10 min)
- TASK-2.3.2: Create EmptyState component (10 min)
- TASK-2.3.3: Create BreadcrumbNavigation component (10 min)
- TASK-2.3.4: Update all page imports (5 min)

### Story 2.4: Testing & Documentation
**Duration:** 30-45 minutes | **Tasks:** 3

Add component tests, update integration tests, and document new architecture.

- TASK-2.4.1: Create component unit tests (20 min)
- TASK-2.4.2: Update integration tests (15 min)
- TASK-2.4.3: Documentation & code cleanup (10 min)

## Success Criteria

### Code Quality
- Code duplication reduced to < 30%
- All components use consistent prop/event patterns
- CSS variables used for theming
- No breaking changes to public API

### Functionality
- All 4 config types display correctly (agents/commands/hooks/MCP)
- All states work (loading/empty/items/expanded)
- Sidebar navigation (prev/next) works seamlessly
- All metadata displays correctly
- Responsive design maintained

### Testing
- All existing tests pass (313+ tests)
- New component tests added (estimated 8-12 tests)
- No regression in functionality
- Cross-browser compatibility verified

### Documentation
- Components documented with props/events
- Integration examples provided
- Architecture diagram updated
- CLAUDE.md updated with new structure

## Dependencies

**Prerequisites:**
- Phase 2 - Vite Migration ✅ COMPLETE
- All existing tests passing ✅ VERIFIED

**Enables:**
- Phase 3 (Subagent CRUD) - will reuse these components
- Command management pages
- Hook configuration pages
- MCP server management pages

## Risk Analysis

**Low Risk:**
- Component extraction (well-defined patterns)
- Props/events (simple pass-through)
- CSS reorganization (scoped styles)

**Medium Risk:**
- State management (verify sidebar state works across pages)
- Type-aware rendering (ensure all 4 types handled correctly)

**Mitigation:**
1. Incremental extraction - one story at a time
2. Test-driven - write tests before refactoring
3. Git feature branch - easy revert if needed
4. Type safety - verify all conditional rendering paths

## Timeline

| Phase | Duration |
|-------|----------|
| Implementation | 2-3 hours |
| Code Review | 30 min |
| Testing & Fixes | 30-45 min |
| Documentation | 15-30 min |
| **Total** | **3-4 hours** |

## Performance Impact

**Expected Improvements:**
- Bundle Size: +2-3KB (new components)
- Component Load: Negligible (modern SPA)
- Rendering: Slight improvement (consolidated CSS)

**No Degradation Expected:**
- Same number of DOM elements
- Same lifecycle hooks
- Optimized with Vue 3 features

## Future Extensions

### Phase 3+
- Reuse ConfigCard for new config types
- Create ConfigEditor component for CRUD operations
- Build ConfigForm for creating/editing items
- Implement ConfigValidator for data validation

### Additional Improvements
- Batch operations on configuration items
- Filtering and search on config lists
- Sorting capabilities
- Export/import configurations

## Related Documentation

- **PRD:** `/home/claude/manager/docs/prd/PRD-Phase2-Extension-Component-Refactoring.md`
- **Current Code:** `src/components/ProjectDetail.vue`, `src/components/UserGlobal.vue`
- **Phase 2 - Vite Migration PRD:** `docs/prd/PRD-Phase2-Vite-Migration.md`
- **Phase 3 PRD:** `docs/PRD-Phase3-Subagents.md`

## Task List Summary

Total Tasks: **16**

**Story 2.1 (5 tasks):**
- [TASK-2.1.1] Create ConfigCard component
- [TASK-2.1.2] Create ConfigItemList component
- [TASK-2.1.3] Refactor ProjectDetail to use ConfigCard
- [TASK-2.1.4] Refactor UserGlobal to use ConfigCard
- [TASK-2.1.5] Testing & validation

**Story 2.2 (4 tasks):**
- [TASK-2.2.1] Create ConfigDetailSidebar component
- [TASK-2.2.2] Extract MetadataDisplay logic
- [TASK-2.2.3] Refactor ProjectDetail sidebar
- [TASK-2.2.4] Refactor UserGlobal sidebar

**Story 2.3 (4 tasks):**
- [TASK-2.3.1] Create LoadingState component
- [TASK-2.3.2] Create EmptyState component
- [TASK-2.3.3] Create BreadcrumbNavigation component
- [TASK-2.3.4] Update all page imports

**Story 2.4 (3 tasks):**
- [TASK-2.4.1] Create component unit tests
- [TASK-2.4.2] Update integration tests
- [TASK-2.4.3] Documentation & code cleanup
