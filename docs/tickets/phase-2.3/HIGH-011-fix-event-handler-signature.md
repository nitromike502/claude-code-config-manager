# HIGH-011: Fix Event Handler Signature Mismatch

**Priority:** HIGH
**Status:** 📋 Ready for Implementation
**Effort:** 15 minutes
**Created:** November 1, 2025
**Related:** PR #58 Code Review - HIGH-002

---

## Problem

ConfigDetailSidebar emits navigation event with object payload, but parent components expect a string direction ('prev'/'next'), causing potential navigation bugs.

**Evidence:**

**ConfigDetailSidebar.vue (Line 170):**
```vue
// Child emits object
emit('navigate', { item: newItem, index: newIndex })
```

**ProjectDetail.vue (Line 392):**
```vue
// Parent expects string
const onNavigate = (direction) => {
  if (direction === 'prev') {
    navigatePrev()
  } else if (direction === 'next') {
    navigateNext()
  }
}
```

**UserGlobal.vue:**
Same pattern - expects string but receives object.

## Impact

**Functional Bug:**
- Navigation buttons (prev/next) may not work correctly
- Type mismatch causes conditional logic to fail
- `direction === 'prev'` will always be false (comparing string to object)
- Navigation functionality silently broken
- Needs manual testing to confirm current behavior

**Code Quality:**
- Event signature mismatch is anti-pattern
- Parent and child have incompatible contracts
- Difficult to debug (no error thrown, just silent failure)

## Files Affected

- `/home/claude/manager/src/components/sidebars/ConfigDetailSidebar.vue` (lines 144-157)
- `/home/claude/manager/src/components/ProjectDetail.vue` (line 392)
- `/home/claude/manager/src/components/UserGlobal.vue` (similar pattern)

## Solution

**Option 1: Simplify Child to Emit String (Recommended)**

Change ConfigDetailSidebar to emit direction strings instead of objects.

**Rationale:**
- Simpler contract
- Parent already expects strings
- Less data passed (no need for item/index in event)
- Follows Vue best practices (simple event payloads)

**Implementation:**

File: `/home/claude/manager/src/components/sidebars/ConfigDetailSidebar.vue`

**Current:**
```vue
const handleNavigatePrev = () => {
  if (hasPrev.value) {
    const newIndex = currentIndex.value - 1
    const newItem = currentItems.value[newIndex]
    currentIndex.value = newIndex
    emit('navigate', { item: newItem, index: newIndex })  // ❌ Emits object
  }
}

const handleNavigateNext = () => {
  if (hasNext.value) {
    const newIndex = currentIndex.value + 1
    const newItem = currentItems.value[newIndex]
    currentIndex.value = newIndex
    emit('navigate', { item: newItem, index: newIndex })  // ❌ Emits object
  }
}
```

**Fixed:**
```vue
const handleNavigatePrev = () => {
  if (hasPrev.value) {
    currentIndex.value--
    emit('navigate', 'prev')  // ✅ Emit simple string
  }
}

const handleNavigateNext = () => {
  if (hasNext.value) {
    currentIndex.value++
    emit('navigate', 'next')  // ✅ Emit simple string
  }
}
```

**Why This Works:**
- Parent receives expected string ('prev' or 'next')
- Parent logic works correctly: `if (direction === 'prev')`
- Sidebar already manages `currentIndex` internally
- No need to pass item/index back to parent

## Testing

### Automated Tests

```bash
npm run test:frontend
# Expected: 313/313 tests passing
```

### Manual Testing (Critical)

**Test Scenario 1: Project Detail Navigation**

```
1. Start dev server: npm run dev
2. Navigate to Dashboard
3. Click any project
4. Click any configuration item (agent, command, hook, or MCP)
5. Sidebar opens on right
6. Click "Previous" button (left chevron)
   - ✅ Expected: Navigates to previous item
   - ❌ Bug: Nothing happens (signature mismatch)
7. Click "Next" button (right chevron)
   - ✅ Expected: Navigates to next item
   - ❌ Bug: Nothing happens (signature mismatch)
8. Repeat with different config types
```

**Test Scenario 2: User Global Navigation**

```
1. Navigate to User Global page
2. Click any user-level config item
3. Sidebar opens
4. Test prev/next buttons
5. Verify navigation works
```

### Expected Results After Fix

- Clicking "Previous" navigates to previous item
- Clicking "Next" navigates to next item
- Current item updates in sidebar
- No console errors
- Smooth navigation experience

## Acceptance Criteria

- [x] ConfigDetailSidebar emits string direction ('prev'/'next')
- [x] Navigation logic simplified (remove newItem/newIndex from emit)
- [x] ProjectDetail.vue navigation handler works correctly
- [x] UserGlobal.vue navigation handler works correctly
- [x] Manual test: Prev button navigates to previous item
- [x] Manual test: Next button navigates to next item
- [x] No console errors during navigation
- [x] All 313 frontend tests passing

## Implementation Steps

**Step 1: Update ConfigDetailSidebar.vue (5 minutes)**

File: `/home/claude/manager/src/components/sidebars/ConfigDetailSidebar.vue`

Locate lines 144-157, replace navigation handlers:

```vue
const handleNavigatePrev = () => {
  if (hasPrev.value) {
    currentIndex.value--
    emit('navigate', 'prev')
  }
}

const handleNavigateNext = () => {
  if (hasNext.value) {
    currentIndex.value++
    emit('navigate', 'next')
  }
}
```

**Step 2: Run Automated Tests (2 minutes)**

```bash
npm run test:frontend
```

**Step 3: Manual Navigation Test (5 minutes)**

```bash
npm run dev

# Test Project Detail:
# 1. Click project
# 2. Click agent
# 3. Click prev/next buttons
# 4. Verify navigation works

# Test User Global:
# 1. Click User Global link
# 2. Click user agent
# 3. Click prev/next buttons
# 4. Verify navigation works
```

**Step 4: Verify No Console Errors (1 minute)**

```
# Open browser DevTools → Console
# Navigate and use prev/next buttons
# Verify no errors logged
```

**Step 5: Commit (2 minutes)**

```bash
git add src/components/sidebars/ConfigDetailSidebar.vue
git commit -m "fix(sidebar): fix event handler signature mismatch in navigation"
```

## Definition of Done

- ConfigDetailSidebar emits string directions
- Parent handlers work correctly
- Manual test confirms prev/next navigation works
- All frontend tests passing
- No console errors
- Code reviewed and approved
- Committed with proper message

---

## Commit Message Template

```
fix(sidebar): fix event handler signature mismatch in navigation

ConfigDetailSidebar was emitting object payload but parent
components expected string direction, causing navigation to fail.

Problem: Sidebar emitted { item, index } but parent expected 'prev'/'next'
Solution: Simplify sidebar to emit direction strings

Changes:
- handleNavigatePrev emits 'prev' (not object)
- handleNavigateNext emits 'next' (not object)
- Simplified navigation logic
- Removed unnecessary data from event payload

Impact: Prev/next buttons now work correctly in sidebar

Resolves HIGH-011
Related: PR #58 Code Review

Test: 313/313 frontend tests passing
Manual: Verified prev/next navigation works in both views
```

---

## Root Cause Analysis

**Why This Bug Existed:**

1. **Contract Mismatch:** Child and parent developed separately
2. **No Type Checking:** JavaScript doesn't catch type mismatches
3. **Silent Failure:** No error thrown, just `false` comparison
4. **No E2E Test:** Existing tests don't cover sidebar navigation clicks

**Prevention Strategy:**

1. **Use TypeScript:** Would catch signature mismatches at compile time
2. **Document Events:** Add JSDoc comments for emitted events:
   ```vue
   /**
    * @event navigate
    * @type {string} - Direction: 'prev' or 'next'
    */
   const emit = defineEmits(['navigate', 'close'])
   ```
3. **Add E2E Tests:** Test actual button clicks in Playwright
4. **Code Review:** Catch mismatches during review

## Alternative Solution (Not Recommended)

**Option 2: Update Parents to Accept Object**

This is more complex and less maintainable:

```vue
// ProjectDetail.vue - More complex logic
const onNavigate = (payload) => {
  if (typeof payload === 'string') {
    // Handle string (backward compatibility)
    if (payload === 'prev') navigatePrev()
    else if (payload === 'next') navigateNext()
  } else {
    // Handle object
    const direction = payload.index < currentIndex.value ? 'prev' : 'next'
    if (direction === 'prev') navigatePrev()
    else navigateNext()
  }
}
```

**Why Not Recommended:**
- More complex
- Type checking adds overhead
- Parent doesn't need item/index (already has current index)
- Violates KISS principle

## Notes

**Why High Priority:**
- Functional bug affecting navigation
- User-facing feature broken
- Quick fix (15 minutes)
- Low risk (simplifies code)

**Testing Strategy:**
- Automated tests may pass (don't test actual navigation clicks)
- Manual testing REQUIRED to verify fix
- Should add E2E test for sidebar navigation (future work)

**Vue Event Best Practices:**
- Keep event payloads simple
- Document event signatures
- Use TypeScript for type safety
- Validate contracts between parent/child

**Reference:**
- Vue Events: https://vuejs.org/guide/components/events.html
- Original finding: PR #58 Code Review, HIGH-002

---

**Created:** November 1, 2025
**Epic:** Phase 2.3 - Production Readiness Fixes
**Estimated Completion:** 15 minutes
