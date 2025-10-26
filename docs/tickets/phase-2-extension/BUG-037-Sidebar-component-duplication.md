# BUG-037: Detail Sidebar Component Duplicated Across ProjectDetail and UserGlobal

**Type:** Bug / Technical Debt
**Priority:** High
**Phase:** Phase 2 Extension - Component Refactoring
**Status:** Not Started
**Epic:** EPIC-4 (Phase 2 Extension - Component Refactoring)

## Description

The detail sidebar implementation is **duplicated identically** in both `ProjectDetail.vue` and `UserGlobal.vue`. Both pages contain 75+ lines of nearly identical sidebar markup and logic for displaying item details.

The `ConfigDetailSidebar.vue` component was created during Phase 2 Extension but **is NOT currently being used** in either page. Instead, both pages have inline sidebar implementations with:
- Sidebar overlay
- Header with navigation buttons
- Type-aware metadata display (agents/commands/hooks/MCP)
- Content preview section
- Navigation (prev/next buttons)
- Close button

This creates significant code duplication and maintenance burden.

## Current State Analysis

**ProjectDetail.vue sidebar (lines 242-320):**
```vue
<!-- Sidebar Overlay -->
<div v-if="sidebarVisible" class="sidebar-overlay" @click="sidebarVisible = false"></div>

<!-- Detail Sidebar -->
<div v-if="sidebarVisible" class="sidebar" @click.stop>
  <div class="sidebar-header">...</div>
  <div class="sidebar-content">
    <!-- Type-aware metadata display -->
    <div v-if="selectedType === 'agents'">...</div>
    <div v-else-if="selectedType === 'commands'">...</div>
    <div v-else-if="selectedType === 'hooks'">...</div>
    <div v-else-if="selectedType === 'mcp'">...</div>

    <!-- Content preview -->
    <div v-if="selectedItem?.content">...</div>
  </div>
  <div class="sidebar-footer">...</div>
</div>
```

**UserGlobal.vue sidebar (lines 118-220):**
```vue
<!-- Identical sidebar implementation -->
<div v-if="sidebarVisible" class="sidebar-overlay" @click="sidebarVisible = false"></div>
<div v-if="sidebarVisible" class="sidebar" @click.stop>
  <!-- Nearly identical content -->
</div>
```

**ConfigDetailSidebar.vue (EXISTING but UNUSED):**
- Component created: 387 lines, 9.9KB
- Includes all sidebar functionality
- Supports type-aware metadata display
- Includes navigation buttons
- Currently NOT imported in either page

## Code Duplication Analysis

| Component | Sidebar LOC | Status |
|-----------|------------|--------|
| ProjectDetail.vue | ~79 lines | Inline (duplicate) |
| UserGlobal.vue | ~80 lines | Inline (duplicate) |
| ConfigDetailSidebar.vue | ~200 lines | Created but UNUSED |
| **Total Duplication** | **~160 lines** | **Can be eliminated** |

## Impact

1. **Code duplication** - 160+ lines of identical sidebar code in two files
2. **Maintenance burden** - Any sidebar bug fix must be made in TWO places
3. **Regression risk** - Changes in one sidebar might not propagate to the other
4. **Component waste** - ConfigDetailSidebar was created but never used
5. **Testing duplication** - Same sidebar functionality tested separately in each page

## Root Cause

During Phase 2 Extension refactoring:
1. ✅ ConfigCard and ConfigItemList components were created
2. ✅ ConfigDetailSidebar component was created
3. ✅ UserGlobal.vue was refactored to use ConfigCard
4. ❌ ConfigDetailSidebar was NOT integrated into UserGlobal.vue
5. ❌ ProjectDetail.vue was NOT refactored to use new components
6. ❌ Both pages still have inline sidebar implementations

The sidebar extraction work was incomplete.

## Solution

**Integrate ConfigDetailSidebar component into both pages:**

1. **Remove inline sidebar markup** from ProjectDetail.vue (lines 242-320)
2. **Remove inline sidebar markup** from UserGlobal.vue (lines 118-220)
3. **Import ConfigDetailSidebar** in both pages
4. **Replace with component usage:**
   ```vue
   <!-- Sidebar Overlay -->
   <div v-if="sidebarVisible" class="sidebar-overlay" @click="sidebarVisible = false"></div>

   <!-- Detail Sidebar Component -->
   <ConfigDetailSidebar
     v-if="sidebarVisible"
     :visible="sidebarVisible"
     :item="selectedItem"
     :type="selectedType"
     :current-items="currentItems"
     :selected-index="currentIndex"
     @close="sidebarVisible = false"
     @navigate="onNavigate"
   />
   ```

5. **Move sidebar-related logic** to use component events:
   - Navigation handlers (prev/next)
   - Close handler
   - Type icon/color getters

6. **Test consistently** across both pages

## Acceptance Criteria

- [ ] ConfigDetailSidebar imported in ProjectDetail.vue
- [ ] ConfigDetailSidebar imported in UserGlobal.vue
- [ ] All inline sidebar markup removed from ProjectDetail.vue (lines 242-320)
- [ ] All inline sidebar markup removed from UserGlobal.vue (lines 118-220)
- [ ] Sidebar renders correctly on ProjectDetail page
- [ ] Sidebar renders correctly on UserGlobal page
- [ ] Item metadata displays correctly for all 4 types (agents/commands/hooks/MCP)
- [ ] Content preview displays correctly when available
- [ ] Navigation buttons work (prev/next items)
- [ ] Close button works (ESC key support optional)
- [ ] All existing tests pass (100% pass rate maintained)
- [ ] No visual regressions - sidebar appearance unchanged
- [ ] Sidebar overlay click closes sidebar
- [ ] Sidebar animations work smoothly

## Files to Modify

- `/home/claude/manager/src/components/ProjectDetail.vue`
  - Remove sidebar markup (lines 242-320)
  - Import ConfigDetailSidebar
  - Add ConfigDetailSidebar component usage
  - Keep navigation logic methods (can be simplified with component events)

- `/home/claude/manager/src/components/UserGlobal.vue`
  - Remove sidebar markup (lines 118-220)
  - Import ConfigDetailSidebar
  - Add ConfigDetailSidebar component usage
  - Keep navigation logic methods

## Files NOT Modified

- `/home/claude/manager/src/components/cards/ConfigDetailSidebar.vue` - Already created, ready to use

## Related Tickets

- EPIC-4: Phase 2 Extension - Component Refactoring
- STORY-2.2: Extract Sidebar Component (INCOMPLETE - component created but not integrated)
- BUG-036: ProjectDetail Not Using Reusable Components (Related)

## Testing Checklist

### Manual Testing
- [ ] Click an item on ProjectDetail page - sidebar opens
- [ ] Click an item on UserGlobal page - sidebar opens
- [ ] Sidebar displays correct metadata for agent items
- [ ] Sidebar displays correct metadata for command items
- [ ] Sidebar displays correct metadata for hook items
- [ ] Sidebar displays correct metadata for MCP items
- [ ] Content preview displays when available
- [ ] Previous button navigates to previous item (when available)
- [ ] Next button navigates to next item (when available)
- [ ] Close button closes sidebar
- [ ] Clicking overlay closes sidebar
- [ ] Sidebar animations smooth
- [ ] Theme toggle works (dark/light mode in sidebar)
- [ ] Responsive design works (sidebar on mobile/tablet)

### Automated Testing
- [ ] All existing Playwright tests pass
- [ ] Sidebar rendering tests pass
- [ ] Navigation tests pass
- [ ] No console errors or warnings
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)

## Dependencies

**Blocks:** Nothing (Bug fix)
**Requires:**
- ConfigDetailSidebar.vue already created ✅
- Phase 2 Vite migration complete ✅

## Notes

This is critical technical debt from Phase 2 Extension. The sidebar component extraction work was partially completed:

1. **Completed:** ConfigDetailSidebar component created (387 lines)
2. **Incomplete:** Component never integrated into either page
3. **Problem:** Both pages still have inline sidebar implementations

The sidebar duplication is particularly problematic because:
- It's 160+ lines of duplicate code
- It's in a critical UI component (detail view)
- Any sidebar bug fix must be made twice
- Any sidebar enhancement must be made twice

This should be prioritized HIGH because it:
- Eliminates wasted component code
- Reduces maintenance burden
- Prevents future inconsistencies
- Uses ConfigDetailSidebar as designed

Estimated effort: 45-60 minutes

## Sidebar Component Integration Pattern

The ConfigDetailSidebar component is designed to be integrated as:

```vue
<template>
  <div class="page">
    <!-- Page content -->

    <!-- Sidebar container -->
    <div v-if="sidebarVisible" class="sidebar-overlay" @click="sidebarVisible = false"></div>

    <ConfigDetailSidebar
      :visible="sidebarVisible"
      :item="selectedItem"
      :type="selectedType"
      :current-items="currentItems"
      :selected-index="currentIndex"
      @close="sidebarVisible = false"
      @navigate="onNavigate"
    />
  </div>
</template>

<script>
import ConfigDetailSidebar from './cards/ConfigDetailSidebar.vue'

export default {
  components: { ConfigDetailSidebar },
  setup() {
    const sidebarVisible = ref(false)
    const selectedItem = ref(null)
    const selectedType = ref(null)
    const currentItems = ref([])
    const currentIndex = ref(-1)

    const onNavigate = (direction) => {
      // Handle prev/next navigation
      if (direction === 'prev' && currentIndex.value > 0) {
        currentIndex.value--
        selectedItem.value = currentItems.value[currentIndex.value]
      } else if (direction === 'next' && currentIndex.value < currentItems.value.length - 1) {
        currentIndex.value++
        selectedItem.value = currentItems.value[currentIndex.value]
      }
    }

    return { sidebarVisible, selectedItem, selectedType, currentItems, currentIndex, onNavigate }
  }
}
</script>
```

This pattern eliminates the duplicate sidebar implementations while keeping all functionality.
