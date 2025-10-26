# BUG-036: ProjectDetail.vue Still Using Inline Card Markup Instead of Reusable Components

**Type:** Bug / Technical Debt
**Priority:** High
**Phase:** Phase 2 Extension - Component Refactoring
**Status:** Not Started
**Epic:** EPIC-4 (Phase 2 Extension - Component Refactoring)

## Description

During Phase 2 Extension implementation, `UserGlobal.vue` was successfully refactored to use the new reusable `ConfigCard` and `ConfigItemList` components. However, `ProjectDetail.vue` was NOT refactored and still contains the full inline card markup for all 4 configuration types (agents, commands, hooks, MCP servers).

This creates inconsistency: the two pages that display the same configuration types are using completely different component patterns:
- **UserGlobal.vue**: Uses `ConfigCard` + `ConfigItemList` reusable components (refactored)
- **ProjectDetail.vue**: Contains 200+ lines of duplicated inline card markup (not refactored)

## Current State Analysis

**ProjectDetail.vue card markup (lines 50-239):**
- 4 inline card divs with `.config-card` class for agents, commands, hooks, MCP
- Each card has duplicate structure:
  - Header with icon and title
  - Conditional rendering for loading/empty/items states
  - Inline item rendering with click handlers
  - Expand/collapse button
  - Type-specific description formatting

**Code duplication impact:**
- ~190 lines of card markup that could be replaced with `<ConfigCard>` component
- ~80 lines of item rendering that could use `<ConfigItemList>` component
- Total potential reduction: ~270 lines in ProjectDetail.vue

## Impact

1. **Inconsistent patterns** - Two views handling the same data with different components
2. **Code duplication** - Same card logic repeated in ProjectDetail instead of reused
3. **Maintenance burden** - Bug fixes or changes need to be made in two places
4. **Regression risk** - If one page is updated, the other might not get the same fix

## Solution

Refactor `ProjectDetail.vue` to use the same component pattern as `UserGlobal.vue`:

1. **Import reusable components:**
   - `ConfigCard` - Main card wrapper
   - `ConfigItemList` - Item list rendering
   - `BreadcrumbNavigation` - Already imported, ensure consistency

2. **Replace 4 inline card sections with ConfigCard + ConfigItemList:**
   ```vue
   <!-- Before: ~50 lines of inline markup per card -->
   <div class="config-card agents-card">
     <div class="config-header">...</div>
     <div v-if="loadingAgents">...</div>
     <div v-else-if="agents.length === 0">...</div>
     <div v-else class="items-list">
       <div v-for="(agent, index) in displayedAgents">...</div>
     </div>
     <button v-if="...">...</button>
   </div>

   <!-- After: ~10 lines using component -->
   <ConfigCard
     card-type="agents"
     title="Subagents"
     :count="agents.length"
     icon="pi pi-users"
     color="var(--color-agents)"
     :loading="loadingAgents"
     :items="agents"
     :showing-all="showingAllAgents"
     :initial-display-count="initialDisplayCount"
     @toggle-show-all="showingAllAgents = !showingAllAgents"
   >
     <template #default="{ items }">
       <ConfigItemList
         :items="items"
         item-type="agents"
         @item-selected="(item) => showDetail(item, 'agents', agents)"
       />
     </template>
   </ConfigCard>
   ```

3. **Verify all functionality maintained:**
   - Loading states display correctly
   - Empty states display correctly
   - Item click events trigger sidebar
   - Expand/collapse functionality works
   - Type-specific descriptions render correctly
   - Card styling and colors match

## Acceptance Criteria

- [ ] ProjectDetail.vue imports ConfigCard and ConfigItemList components
- [ ] All 4 card sections replaced with ConfigCard + ConfigItemList pattern
- [ ] No inline card markup remaining in ProjectDetail.vue
- [ ] All existing tests pass (100% pass rate maintained)
- [ ] Visual appearance unchanged - no regressions
- [ ] Code duplication reduced by ~270 lines in ProjectDetail.vue
- [ ] Both ProjectDetail.vue and UserGlobal.vue use identical component patterns
- [ ] Sidebar functionality still works (clicking items opens sidebar)
- [ ] Show more/less toggle still works
- [ ] All 4 config types display correctly on ProjectDetail page

## Files to Modify

- `/home/claude/manager/src/components/ProjectDetail.vue` - Main refactoring target
  - Currently using Options API with custom setup function
  - Will continue using Options API pattern for consistency
  - Replace lines 50-239 (4 inline card sections)

## Files NOT Modified

- `/home/claude/manager/src/components/cards/ConfigCard.vue` - Already created
- `/home/claude/manager/src/components/cards/ConfigItemList.vue` - Already created
- `/home/claude/manager/src/components/UserGlobal.vue` - Already refactored

## Related Tickets

- EPIC-4: Phase 2 Extension - Component Refactoring
- STORY-2.1: Extract Core Card Components (COMPLETE)
- BUG-037: Sidebar Component Duplication (Related - sidebar is still duplicated)

## Testing Checklist

### Manual Testing
- [ ] ProjectDetail page loads for a valid project
- [ ] All 4 card types render on ProjectDetail page
- [ ] Loading state displays correctly
- [ ] Empty state displays correctly (if no configs)
- [ ] Items list displays correctly
- [ ] "Show more" button works
- [ ] "Show less" button works
- [ ] Item click opens detail sidebar
- [ ] Card colors match design (green/blue/orange/purple)
- [ ] Responsive layout maintained

### Automated Testing
- [ ] All existing Playwright tests pass
- [ ] No console errors or warnings
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)

## Notes

This is a critical technical debt issue from Phase 2 Extension. While UserGlobal.vue was successfully refactored during the component extraction work, ProjectDetail.vue was missed. This creates:

1. **Inconsistency problem** - Same patterns implemented twice
2. **Maintenance problem** - Changes need to be made in two places
3. **Testing problem** - Need to verify consistency across both pages

Priority should be HIGH because:
- Blocks consistency across the codebase
- Increases maintenance burden for future changes
- Sets bad precedent for Phase 3+ development
- Should have been completed during Phase 2 Extension

Estimated effort: 30-45 minutes
