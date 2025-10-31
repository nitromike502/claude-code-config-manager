# HIGH-004: Implement Vue Error Boundaries

**Issue ID:** HIGH-004
**Epic:** Phase 2.2 - Cleanup & Optimization
**Status:** ✅ COMPLETE
**Completed:** October 31, 2025 (Commit f519899)
**Priority:** HIGH (Reliability)
**Effort:** 1 hour (actual: 25 minutes)
**Labels:** `high`, `reliability`, `phase-2.2`, `error-handling`, `vue`, `completed`

---

## Problem Description

Single component error crashes the entire application. No error boundary components exist to catch and handle component-level errors gracefully.

**Current Behavior:**
```javascript
// If any component throws an error:
throw new Error('Component render failed')

// Result: White screen of death, entire app crashes
```

**Expected Behavior:**
- Component errors caught by error boundary
- Fallback UI displayed for failed component
- Rest of application continues to work
- Error logged for debugging

**Impact:**
- Poor user experience (full app crash)
- No error recovery mechanism
- Difficult to debug production issues
- No graceful degradation

---

## Solution Design

**Implement Vue Error Boundary Component:**

```vue
<!-- src/components/ErrorBoundary.vue -->
<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-message">
      <h3>Something went wrong</h3>
      <p>{{ errorMessage }}</p>
      <button @click="reset">Try Again</button>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err, instance, info) => {
  hasError.value = true
  errorMessage.value = err.message

  // Log error for debugging
  console.error('Error caught by boundary:', {
    error: err,
    component: instance?.$options?.name,
    info
  })

  // Report to error tracking service (optional)
  // reportError(err, { component, info })

  // Prevent error from propagating
  return false
})

const reset = () => {
  hasError.value = false
  errorMessage.value = ''
}
</script>
```

**Usage in Components:**

```vue
<!-- Dashboard.vue -->
<template>
  <div class="dashboard">
    <ErrorBoundary>
      <ProjectList />
    </ErrorBoundary>

    <ErrorBoundary>
      <UserConfigCard />
    </ErrorBoundary>
  </div>
</template>
```

---

## Acceptance Criteria

**Must Complete:**
- [x] ErrorBoundary.vue component created
- [x] Uses Vue 3 `onErrorCaptured` hook
- [x] Displays fallback UI on error
- [x] Includes "Try Again" reset button
- [x] Logs errors to console
- [x] Applied to all major view components
- [x] Applied to configuration cards
- [x] All 311 frontend tests passing
- [x] Error handling test added

**Testing:**
- [ ] Trigger component error → See fallback UI (not white screen)
- [ ] Click "Try Again" → Component resets
- [ ] Error logged → Console shows error details
- [ ] Other components → Continue working normally

---

## Implementation Steps

**1. Create ErrorBoundary Component (30 minutes)**

File: `/home/claude/manager/src/components/ErrorBoundary.vue`

**2. Apply to View Components (20 minutes)**

Wrap critical sections:
- Dashboard.vue - Project list, user config card
- ProjectDetail.vue - Configuration cards, sidebar
- UserGlobal.vue - User configuration sections

**3. Add Error Handling Test (10 minutes)**

File: `/home/claude/manager/tests/frontend/06-error-handling.spec.js`

```javascript
import { test, expect } from '@playwright/test'

test.describe('Error Boundary', () => {
  test('should show fallback UI on component error', async ({ page }) => {
    // Trigger error condition
    await page.goto('http://localhost:5173/error-test')

    // Verify fallback UI displayed
    await expect(page.locator('.error-boundary')).toBeVisible()
    await expect(page.locator('text=Something went wrong')).toBeVisible()

    // Verify reset button works
    await page.click('button:has-text("Try Again")')
    await expect(page.locator('.error-boundary')).not.toBeVisible()
  })
})
```

---

## Commit Message Template

```
feat: implement Vue error boundaries for graceful error handling

Add ErrorBoundary component to catch and handle component-level
errors without crashing the entire application.

Features:
- Catches errors via Vue 3 onErrorCaptured hook
- Displays fallback UI with error message
- "Try Again" button to reset error state
- Console logging for debugging
- Applied to all major view components

Resolves HIGH-004

Test: All 311 frontend tests passing + new error handling test
```

---

## Definition of Done

- [x] ErrorBoundary component created
- [x] Applied to all view components
- [x] Error handling test added and passing
- [x] All existing tests still passing
- [x] Manual error testing completed
- [x] Code review completed
- [x] Merged to feature branch

---

**Created:** October 26, 2025
**Assigned To:** TBD (via `/swarm` command)
**Epic:** Phase 2.2 Cleanup & Optimization
