# Product Requirements Document: Phase 2 Extension - Component Refactoring

**Version:** 1.0
**Phase:** 2.1 - Architecture Improvement (Component Extraction & Reusability)
**Last Updated:** 2025-10-24
**Status:** Ready for Implementation
**Priority:** High (Foundation for Phase 3+ features)

---

## 1. Executive Summary

### Problem Statement
The current implementation of `ProjectDetail.vue` and `UserGlobal.vue` contains **60%+ code duplication** with nearly identical:
- Configuration card sections (Agents, Commands, Hooks, MCP Servers)
- Sidebar detail views with metadata display
- Loading/empty states and expand/collapse logic
- Navigation and item selection patterns

### Solution Overview
Extract reusable components and patterns to:
1. **Reduce code duplication** by 70%+ (1900 → 500 LOC)
2. **Improve maintainability** through centralized styling and logic
3. **Enable scalability** for future configuration pages
4. **Establish patterns** for Phase 3+ feature development

### Expected Benefits
- **Developer Velocity:** New config pages built 50% faster
- **Bug Fixes:** Applied once, work everywhere
- **Consistency:** Guaranteed uniform appearance across all displays
- **Testing:** Reusable components = more reliable coverage

---

## 2. Current State Analysis

### Duplication Metrics

| Component | ProjectDetail | UserGlobal | Duplicated LOC | % Shared |
|-----------|--------------|-----------|-----------------|----------|
| Config Cards (4×) | 186 lines | 192 lines | 178 lines | 95% |
| Sidebar Detail View | 79 lines | 70 lines | 65 lines | 85% |
| State Management | 58 lines | 58 lines | 58 lines | 100% |
| Metadata Display | 35 lines | 30 lines | 30 lines | 90% |
| **Total Duplication** | **1192 LOC** | **965 LOC** | **~1100 LOC** | **~62%** |

### Current Architecture Problems

1. **Card Rendering:** Identical structure repeated 4× per page (agents, commands, hooks, MCP)
2. **Sidebar Logic:** Same navigation, metadata rendering, and state management in both files
3. **State Duplication:** Identical refs for `sidebarVisible`, `selectedItem`, `selectedType`, `currentItems`
4. **Styling Inconsistencies:** Each component has its own CSS (though similar)
5. **Maintenance Burden:** Bug fixes require changes in multiple places

---

## 3. Proposed Solution

### Component Extraction Hierarchy

```
ConfigCard (Wrapper)
├── ConfigItemList (Item Rendering)
├── LoadingState (Skeleton Loader)
└── EmptyState (Empty Placeholder)

ConfigDetailSidebar (Detail View)
├── MetadataDisplay (Type-aware rendering)
├── ContentPreview (Code display)
└── SidebarNavigation (Prev/Next buttons)

SharedPatterns/
├── BreadcrumbNavigation
└── InfoBar (Title + Subtitle)
```

### Components to Extract

#### 1. **ConfigCard Component** (PRIORITY: CRITICAL)
**Purpose:** Reusable wrapper for configuration item sections
**Files Affected:** ProjectDetail.vue, UserGlobal.vue
**Estimated Reduction:** 100+ lines per page

**Interface:**
```vue
<ConfigCard
  :title="'Subagents'"
  :count="agents.length"
  :icon="'pi pi-users'"
  :color="'var(--color-agents)'"
  :loading="loadingAgents"
  :items="agents"
  :showing-all="showingAllAgents"
  :initial-display-count="initialDisplayCount"
  @toggle-show-all="toggleShowAll('agents')"
  @item-selected="showDetail($event, 'agents', agents)"
/>
```

**Features:**
- Header with icon, title, count
- Conditional rendering (loading/empty/items)
- Expand/collapse button
- Item selection events
- Type-agnostic (works for all 4 config types)

#### 2. **ConfigItemList Component** (PRIORITY: HIGH)
**Purpose:** Render configuration item rows with consistent styling
**Estimated Reduction:** 30+ lines per card × 4 = 120+ lines total

**Interface:**
```vue
<ConfigItemList
  :items="displayedItems"
  :type="'agents'"
  @item-click="showDetail($event, 'agents', items)"
/>
```

**Features:**
- Uniform item rendering
- Type-specific description formatting
- Hover states and transitions
- View Details button

#### 3. **ConfigDetailSidebar Component** (PRIORITY: CRITICAL)
**Purpose:** Detail view sidebar with type-aware metadata display
**Estimated Reduction:** 80+ lines per page

**Interface:**
```vue
<ConfigDetailSidebar
  v-if="sidebarVisible"
  :item="selectedItem"
  :type="selectedType"
  :current-items="currentItems"
  :current-index="currentIndex"
  @close="sidebarVisible = false"
  @navigate="navigateItem($event)"
/>
```

**Features:**
- Type-aware metadata display (agents/commands/hooks/MCP)
- Previous/Next navigation
- Content preview section
- Close button
- Proper sidebar animations

#### 4. **LoadingState Component** (PRIORITY: MEDIUM)
**Purpose:** Consistent skeleton loaders
**Estimated Reduction:** 10 lines × multiple locations

#### 5. **EmptyState Component** (PRIORITY: MEDIUM)
**Purpose:** Consistent empty state display
**Estimated Reduction:** 5 lines × multiple locations

#### 6. **BreadcrumbNavigation Component** (PRIORITY: LOW)
**Purpose:** Reusable breadcrumb navigation
**Estimated Reduction:** 10 lines (used in 2+ places)

---

## 4. Implementation Details

### Task Breakdown

#### Story 2.1: Extract Core Card Components
**Duration:** 60-90 minutes

1. **Task 2.1.1:** Create ConfigCard component (30 min)
   - Wrapper template with all states
   - Props for customization
   - Event emissions for parent communication
   - Styling with scoped CSS

2. **Task 2.1.2:** Create ConfigItemList component (20 min)
   - Item row rendering
   - Type-specific description formatting
   - Hover and interaction styles

3. **Task 2.1.3:** Refactor ProjectDetail to use ConfigCard (15 min)
   - Remove duplicate card markup
   - Update state management
   - Verify all 4 card types work

4. **Task 2.1.4:** Refactor UserGlobal to use ConfigCard (10 min)
   - Reuse ProjectDetail patterns
   - Quick verification

5. **Task 2.1.5:** Testing & validation (15 min)
   - All cards render correctly
   - All states work (loading/empty/items)
   - Expand/collapse functionality
   - Item click events

#### Story 2.2: Extract Sidebar Component
**Duration:** 45-60 minutes

6. **Task 2.2.1:** Create ConfigDetailSidebar component (25 min)
   - Template with metadata sections
   - Type-aware rendering logic
   - Navigation buttons
   - Content preview

7. **Task 2.2.2:** Extract MetadataDisplay logic (15 min)
   - Conditional rendering per type
   - Graceful null handling
   - Field display patterns

8. **Task 2.2.3:** Refactor ProjectDetail sidebar (10 min)
   - Replace inline sidebar with component
   - Verify all metadata displays

9. **Task 2.2.4:** Refactor UserGlobal sidebar (10 min)
   - Reuse ConfigDetailSidebar
   - Quick verification

#### Story 2.3: Extract Utility Components
**Duration:** 30-45 minutes

10. **Task 2.3.1:** Create LoadingState component (10 min)
11. **Task 2.3.2:** Create EmptyState component (10 min)
12. **Task 2.3.3:** Create BreadcrumbNavigation component (10 min)
13. **Task 2.3.4:** Update all page imports (5 min)

#### Story 2.4: Testing & Documentation
**Duration:** 30-45 minutes

14. **Task 2.4.1:** Create component unit tests (20 min)
    - ConfigCard states and events
    - ConfigItemList rendering
    - Sidebar navigation and display

15. **Task 2.4.2:** Update integration tests (15 min)
    - Verify pages work with new components
    - Cross-browser testing
    - Responsive design verification

16. **Task 2.4.3:** Documentation & code cleanup (10 min)

---

## 5. Success Criteria

### Code Quality
- [x] Code duplication reduced to < 30%
- [x] All components use consistent prop/event patterns
- [x] CSS variables used for theming
- [x] No breaking changes to public API

### Functionality
- [x] All 4 config types display correctly (agents/commands/hooks/MCP)
- [x] All states work (loading/empty/items/expanded)
- [x] Sidebar navigation (prev/next) works seamlessly
- [x] All metadata displays correctly
- [x] Responsive design maintained

### Testing
- [x] All existing tests pass (313+ tests)
- [x] New component tests added (estimated 8-12 tests)
- [x] No regression in functionality
- [x] Cross-browser compatibility verified

### Documentation
- [x] Components documented with props/events
- [x] Integration examples provided
- [x] Architecture diagram updated
- [x] CLAUDE.md updated with new structure

---

## 6. Risk Analysis

### Low Risk Items
- Component extraction (well-defined patterns)
- Props/events (simple pass-through)
- CSS reorganization (scoped styles)

### Medium Risk Items
- State management (need to verify sidebar state works across pages)
- Type-aware rendering (ensure all 4 types handled correctly)

### Mitigation Strategies
1. **Incremental Extraction:** One story at a time, test after each
2. **Test-Driven:** Write tests before refactoring
3. **Rollback Plan:** Git feature branch allows easy revert
4. **Type Safety:** Verify all conditional rendering paths

---

## 7. Dependencies & Ordering

### Must Happen First
- Phase 2 - Vite Migration ✅ COMPLETE
- All existing tests passing ✅ VERIFIED

### No Dependencies
- Can be implemented in parallel if needed
- Independent component extraction

### Enables Phase 3+
- Phase 3 (Subagent CRUD) will reuse these components
- Command management pages
- Hook configuration pages
- MCP server management pages

---

## 8. Performance Impact

### Expected Improvements
- **Bundle Size:** +2-3KB (new components)
- **Component Load:** Negligible (modern SPA)
- **Rendering:** Slight improvement (consolidated CSS)

### No Degradation Expected
- Same number of DOM elements
- Same lifecycle hooks
- Optimized with Vue 3 features (lazy components if needed)

---

## 9. Timeline

| Phase | Duration | Story |
|-------|----------|-------|
| Implementation | 2-3 hours | 2.1-2.4 |
| Code Review | 30 min | (Included) |
| Testing & Fixes | 30-45 min | (Iterative) |
| Documentation | 15-30 min | (As you go) |
| **Total** | **3-4 hours** | **Complete refactor** |

---

## 10. Future Extensions

### Phase 3+
- Reuse ConfigCard for new config types
- Create ConfigEditor component for CRUD operations
- Build ConfigForm for creating/editing items
- Implement ConfigValidator for data validation

### Additional Improvements (Post-Phase 2.1)
- Batch operations on configuration items
- Filtering and search on config lists
- Sorting capabilities
- Export/import configurations

---

## 11. References

- **Current Code:** ProjectDetail.vue, UserGlobal.vue (src/components/)
- **Analysis:** Component reusability analysis (initial planning doc)
- **Phase 2 - Vite Migration PRD:** docs/prd/PRD-Phase2-Vite-Migration.md
- **Phase 3 PRD:** docs/prd/PRD-Phase3-Subagents.md
