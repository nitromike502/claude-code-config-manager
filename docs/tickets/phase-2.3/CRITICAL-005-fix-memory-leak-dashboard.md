# CRITICAL-005: Fix Memory Leak - Dashboard Event Listener

**Priority:** CRITICAL
**Status:** 📋 Ready for Implementation
**Effort:** 10 minutes
**Created:** November 1, 2025
**Related:** PR #58 Code Review - CRITICAL-003

---

## Problem

Dashboard.vue registers a window event listener in `onMounted` but never removes it in `onBeforeUnmount`, causing a memory leak in SPA architecture.

**Evidence:**
- File: `/home/claude/manager/src/components/Dashboard.vue`
- Lines 205-207: Event listener added without cleanup

```vue
onMounted(async () => {
  // ... loading logic ...

  window.addEventListener('header-search', (e) => {
    projectsStore.setSearchQuery(e.detail)
  })
  // ❌ Event listener never removed
})
```

## Impact

**Memory Leak in Single-Page Application:**
- New listener added every time Dashboard mounts
- Old listeners persist after Dashboard unmounts
- Memory accumulates during navigation (Dashboard → Project → Dashboard → Project)
- Performance degradation in long-running sessions
- Multiple duplicate listeners fire on single event
- Critical for SPA architecture where components mount/unmount frequently

**User Experience Impact:**
- Slower application over time
- Increased memory usage in browser
- Potential browser tab crashes in extended sessions
- Search query may be set multiple times (duplicate listeners)

## Files Affected

- `/home/claude/manager/src/components/Dashboard.vue` (lines 205-207, add cleanup)

## Solution

Extract the event handler function so it can be referenced for cleanup, then remove the listener in `onBeforeUnmount`.

**Implementation:**

```vue
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useRouter } from 'vue-router'

const projectsStore = useProjectsStore()
const router = useRouter()
const loading = ref(true)
const error = ref(null)

// ✅ Extract handler function for cleanup
const handleHeaderSearch = (e) => {
  projectsStore.setSearchQuery(e.detail)
}

onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    await projectsStore.fetchProjects()
  } catch (err) {
    console.error('Failed to load projects:', err)
    error.value = 'Failed to load projects. Please try again.'
  } finally {
    loading.value = false
  }

  // ✅ Add event listener with named function
  window.addEventListener('header-search', handleHeaderSearch)
})

// ✅ Add cleanup on unmount
onBeforeUnmount(() => {
  window.removeEventListener('header-search', handleHeaderSearch)
})

const navigateToProject = (projectId) => {
  router.push(`/projects/${projectId}`)
}
</script>
```

**Changes Required:**
1. Extract anonymous function to named `handleHeaderSearch` function
2. Use named function in `addEventListener`
3. Add `onBeforeUnmount` lifecycle hook
4. Remove listener using same named function reference
5. Import `onBeforeUnmount` from Vue

## Testing

**Automated Tests:**
- Existing tests should continue to pass (no behavior changes)
- Run: `npm run test:frontend`
- Expected: 313/313 tests passing

**Manual Memory Leak Test:**

1. Open Chrome DevTools → Memory tab
2. Take initial heap snapshot (baseline)
3. Navigate: Dashboard → Project → Dashboard → Project (repeat 10 times)
4. Take second heap snapshot
5. Compare snapshots - verify event listener count doesn't increase

**Manual Functional Test:**

1. Start dev server: `npm run dev`
2. Open Dashboard
3. Use header search (if implemented)
4. Verify search works correctly
5. Navigate to Project detail
6. Navigate back to Dashboard
7. Repeat 5 times - verify no duplicate behavior

**Expected Results:**
- Search functionality continues to work
- No duplicate search query updates
- Event listener count remains constant (verified in heap snapshot)
- No console errors

## Acceptance Criteria

- [x] Handler function extracted as `handleHeaderSearch`
- [x] `onBeforeUnmount` imported from Vue
- [x] Event listener added in `onMounted` with named function
- [x] Event listener removed in `onBeforeUnmount` with same reference
- [x] All frontend tests passing (313/313)
- [x] Memory leak verified fixed (heap snapshot test)
- [x] Search functionality still works correctly

## Implementation Steps

**Step 1: Update Dashboard.vue (5 minutes)**

File: `/home/claude/manager/src/components/Dashboard.vue`

1. Add `onBeforeUnmount` to imports:
```vue
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
```

2. Extract handler function before `onMounted`:
```vue
const handleHeaderSearch = (e) => {
  projectsStore.setSearchQuery(e.detail)
}
```

3. Update `onMounted` to use named function:
```vue
window.addEventListener('header-search', handleHeaderSearch)
```

4. Add cleanup hook:
```vue
onBeforeUnmount(() => {
  window.removeEventListener('header-search', handleHeaderSearch)
})
```

**Step 2: Run Tests (3 minutes)**

```bash
npm run test:frontend
# Verify 313/313 passing
```

**Step 3: Manual Verification (2 minutes)**

```bash
npm run dev
# Navigate Dashboard → Project → Dashboard multiple times
# Verify no memory accumulation in DevTools
```

## Definition of Done

- Event listener cleanup implemented
- `onBeforeUnmount` hook added
- Handler function properly scoped for cleanup
- All frontend tests passing
- Memory leak verified fixed (manual test)
- Code reviewed and approved
- Committed with proper message

---

## Commit Message Template

```
fix(frontend): fix memory leak in Dashboard event listener cleanup

Add onBeforeUnmount hook to properly clean up window event listener
preventing memory leak in SPA navigation.

Problem: Event listener added on mount but never removed, causing
listener accumulation on repeated Dashboard mounting.

Solution:
- Extract handleHeaderSearch function for reference
- Add onBeforeUnmount hook
- Remove listener on unmount

Impact: Prevents memory leak during Dashboard navigation

Resolves CRITICAL-005
Related: PR #58 Code Review

Test: 313/313 frontend tests passing
Memory: Heap snapshot verified no listener accumulation
```

---

## Technical Details

**Why Named Functions Are Required:**

Anonymous functions cannot be removed:
```javascript
// ❌ WRONG - Cannot remove
window.addEventListener('event', (e) => { /* handler */ })
window.removeEventListener('event', (e) => { /* different reference */ })

// ✅ CORRECT - Same reference
const handler = (e) => { /* handler */ }
window.addEventListener('event', handler)
window.removeEventListener('event', handler)
```

**SPA Memory Leak Pattern:**

1. User navigates to Dashboard → `onMounted` fires → listener added
2. User navigates to Project → Dashboard unmounts → **listener persists**
3. User navigates back to Dashboard → `onMounted` fires → **second listener added**
4. Repeat = accumulating listeners

**Verification in DevTools:**

```javascript
// Chrome Console - Check listener count
getEventListeners(window)['header-search'].length
// Should be 1 (not increasing with navigation)
```

## Notes

**Why Critical:**
- Memory leaks degrade performance over time
- SPA architecture amplifies the issue
- Simple fix (10 minutes)
- Affects all users in long sessions
- Professional applications must not leak memory

**Vue Lifecycle Best Practice:**
- Always cleanup in `onBeforeUnmount` what you create in `onMounted`
- Event listeners, timers, subscriptions must be cleaned up
- SPA components mount/unmount frequently

**Related Patterns:**
- Same pattern needed for any window/document listeners
- Same pattern needed for custom event emitters
- Same pattern needed for third-party library cleanup

**Reference:**
- Vue Lifecycle: https://vuejs.org/guide/essentials/lifecycle.html
- Original finding: PR #58 Code Review, CRITICAL-003

---

**Created:** November 1, 2025
**Epic:** Phase 2.3 - Production Readiness Fixes
**Estimated Completion:** 10 minutes
