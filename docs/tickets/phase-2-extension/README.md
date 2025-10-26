# Phase 2 Extension - Component Refactoring Tickets

**Epic:** EPIC-4
**Phase:** 2.1 - Architecture Improvement
**Status:** Ready for Implementation
**Created:** 2025-10-24

## Overview

This directory contains all task tickets for the Phase 2 Extension Component Refactoring effort, which extracts reusable Vue components from duplicated code in ProjectDetail.vue and UserGlobal.vue.

## Goals

- Reduce code duplication by 70%+ (1900 → 500 LOC)
- Improve maintainability through centralized components
- Enable scalability for Phase 3+ features
- Establish patterns for future development

## Epic & Story Structure

```
EPIC-4: Phase 2 Extension - Component Refactoring (3-4 hours)
├── STORY-2.1: Extract Core Card Components (60-90 min)
│   ├── TASK-2.1.1: Create ConfigCard component (30 min)
│   ├── TASK-2.1.2: Create ConfigItemList component (20 min)
│   ├── TASK-2.1.3: Refactor ProjectDetail to use ConfigCard (15 min)
│   ├── TASK-2.1.4: Refactor UserGlobal to use ConfigCard (10 min)
│   └── TASK-2.1.5: Testing & validation (15 min)
│
├── STORY-2.2: Extract Sidebar Component (45-60 min)
│   ├── TASK-2.2.1: Create ConfigDetailSidebar component (25 min)
│   ├── TASK-2.2.2: Extract MetadataDisplay logic (15 min)
│   ├── TASK-2.2.3: Refactor ProjectDetail sidebar (10 min)
│   └── TASK-2.2.4: Refactor UserGlobal sidebar (10 min)
│
├── STORY-2.3: Extract Utility Components (30-45 min)
│   ├── TASK-2.3.1: Create LoadingState component (10 min)
│   ├── TASK-2.3.2: Create EmptyState component (10 min)
│   ├── TASK-2.3.3: Create BreadcrumbNavigation component (10 min)
│   └── TASK-2.3.4: Update all page imports (5 min)
│
└── STORY-2.4: Testing & Documentation (30-45 min)
    ├── TASK-2.4.1: Create component unit tests (20 min)
    ├── TASK-2.4.2: Update integration tests (15 min)
    └── TASK-2.4.3: Documentation & code cleanup (10 min)
```

## File Inventory

### Epic & Story Summaries (5 files)
- `EPIC-4.md` - Overall epic summary with goals and timeline
- `STORY-2.1.md` - Card components extraction story
- `STORY-2.2.md` - Sidebar component extraction story
- `STORY-2.3.md` - Utility components extraction story
- `STORY-2.4.md` - Testing & documentation story

### Task Tickets (16 files)
- `TASK-2.1.1.md` - Create ConfigCard component
- `TASK-2.1.2.md` - Create ConfigItemList component
- `TASK-2.1.3.md` - Refactor ProjectDetail to use ConfigCard
- `TASK-2.1.4.md` - Refactor UserGlobal to use ConfigCard
- `TASK-2.1.5.md` - Testing & validation (Story 2.1)
- `TASK-2.2.1.md` - Create ConfigDetailSidebar component
- `TASK-2.2.2.md` - Extract MetadataDisplay logic
- `TASK-2.2.3.md` - Refactor ProjectDetail sidebar
- `TASK-2.2.4.md` - Refactor UserGlobal sidebar
- `TASK-2.3.1.md` - Create LoadingState component
- `TASK-2.3.2.md` - Create EmptyState component
- `TASK-2.3.3.md` - Create BreadcrumbNavigation component
- `TASK-2.3.4.md` - Update all page imports
- `TASK-2.4.1.md` - Create component unit tests
- `TASK-2.4.2.md` - Update integration tests
- `TASK-2.4.3.md` - Documentation & code cleanup

### Documentation (1 file)
- `README.md` - This file

**Total Files:** 22 (1 epic + 4 stories + 16 tasks + 1 readme)

## Implementation Order

### Recommended Sequential Order

1. **Story 2.1 (Core Cards)** - MUST complete first
   - TASK-2.1.1 → TASK-2.1.2 → TASK-2.1.3 → TASK-2.1.4 → TASK-2.1.5

2. **Story 2.2 (Sidebar)** - After Story 2.1
   - TASK-2.2.1 → TASK-2.2.2 → TASK-2.2.3 → TASK-2.2.4

3. **Story 2.3 (Utilities)** - Can run parallel with 2.1/2.2
   - TASK-2.3.1 → TASK-2.3.2 → TASK-2.3.3 → TASK-2.3.4

4. **Story 2.4 (Testing)** - MUST be last
   - TASK-2.4.1 → TASK-2.4.2 → TASK-2.4.3

### Parallel Execution Option

Stories 2.1, 2.2, and 2.3 can be worked on in parallel if multiple developers available:
- **Dev 1:** Story 2.1 (Core Cards)
- **Dev 2:** Story 2.2 (Sidebar)
- **Dev 3:** Story 2.3 (Utilities)
- **All Devs:** Story 2.4 (Testing & Docs)

## Success Criteria

### Code Quality
- [ ] Code duplication reduced to < 30%
- [ ] All components use consistent prop/event patterns
- [ ] CSS variables used for theming
- [ ] No breaking changes to public API

### Functionality
- [ ] All 4 config types display correctly
- [ ] All states work (loading/empty/items/expanded)
- [ ] Sidebar navigation works seamlessly
- [ ] All metadata displays correctly
- [ ] Responsive design maintained

### Testing
- [ ] All existing tests pass (313+ tests)
- [ ] New component tests added (8-12 tests)
- [ ] No regression in functionality
- [ ] Cross-browser compatibility verified

### Documentation
- [ ] Components documented with props/events
- [ ] Integration examples provided
- [ ] Architecture diagram updated
- [ ] CLAUDE.md updated with new structure

## Expected Outcomes

**Before Refactoring:**
- ProjectDetail.vue: 1192 LOC
- UserGlobal.vue: 965 LOC
- Total: 2157 LOC
- Duplication: ~62%

**After Refactoring:**
- ProjectDetail.vue: ~450 LOC
- UserGlobal.vue: ~380 LOC
- New components: ~350 LOC
- Total: 1180 LOC
- Duplication: <10%
- **Net Reduction: 977 LOC (45% overall)**

## Dependencies

**Prerequisites:**
- Phase 2 - Vite Migration ✅ COMPLETE
- All existing tests passing ✅ VERIFIED

**Enables:**
- Phase 3 (Subagent CRUD)
- Command management pages
- Hook configuration pages
- MCP server management pages

## Risk Mitigation

**Low Risk:**
- Component extraction (well-defined patterns)
- Props/events (simple pass-through)
- CSS reorganization (scoped styles)

**Medium Risk:**
- State management (verify sidebar state works)
- Type-aware rendering (ensure all 4 types handled)

**Mitigation Strategies:**
1. Incremental extraction - one story at a time
2. Test-driven - write tests before refactoring
3. Git feature branch - easy revert if needed
4. Type safety - verify all conditional rendering paths

## Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Story 2.1 | 60-90 min | 1.5 hours |
| Story 2.2 | 45-60 min | 2.5 hours |
| Story 2.3 | 30-45 min | 3.25 hours |
| Story 2.4 | 30-45 min | 4 hours |
| **Total** | **3-4 hours** | **Complete** |

## References

- **PRD:** `/home/claude/manager/docs/prd/PRD-Phase2-Extension-Component-Refactoring.md`
- **Current Code:** `src/components/ProjectDetail.vue`, `src/components/UserGlobal.vue`
- **Phase 2 - Vite Migration PRD:** `docs/prd/PRD-Phase2-Vite-Migration.md`
- **CLAUDE.md:** `/home/claude/manager/CLAUDE.md`

## Next Steps

1. Review PRD at `/home/claude/manager/docs/prd/PRD-Phase2-Extension-Component-Refactoring.md`
2. Read EPIC-4.md for overall context
3. Start with STORY-2.1.md
4. Execute tasks in order (TASK-2.1.1 → TASK-2.1.2 → ...)
5. Test after each story completion
6. Complete STORY-2.4 to finish epic

## Notes

### Task Sizing

All tasks follow the **30-60 minute maximum** guideline:
- Smallest task: 5 minutes (TASK-2.3.4)
- Largest task: 30 minutes (TASK-2.1.1)
- Average task: 15 minutes
- All tasks independently committable

### Commit Strategy

**One commit per task:**
- Complete task → Test → Commit → Push
- Incremental commits every 15-30 minutes
- Feature branch workflow enforced
- No commits to main directly

### Quality Gates

**After each story:**
1. All story tests pass
2. No console errors
3. No visual regressions
4. Code review complete

**After epic:**
1. All 583+ tests passing
2. Documentation complete
3. Code cleanup done
4. Ready for Phase 3
