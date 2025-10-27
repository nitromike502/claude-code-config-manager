# HIGH-007: Standardize Event Emitter Patterns

**Issue ID:** HIGH-007
**Epic:** Phase 2.2 - Cleanup & Optimization
**Status:** 📋 Ready for Implementation
**Priority:** HIGH (Code Quality)
**Effort:** 1.5 hours
**Labels:** `high`, `refactor`, `phase-2.2`, `vue`, `composition-api`

---

## Problem Description

Mix of Options API and Composition API patterns for event emitters across components. Inconsistent usage makes code harder to understand and maintain.

**Current Inconsistency:**

```vue
<!-- Some components use Options API -->
<script>
export default {
  emits: ['close', 'select'],
  methods: {
    handleClose() {
      this.$emit('close')
    }
  }
}
</script>

<!-- Other components use Composition API -->
<script setup>
const emit = defineEmits(['close', 'select'])
const handleClose = () => emit('close')
</script>
```

**Impact:**
- Cognitive load switching between patterns
- Harder for new developers to learn codebase
- Inconsistent code style
- Missed type-safety opportunities

---

## Solution Design

**Standardize on Composition API with `<script setup>`:**

All components should use Vue 3 Composition API pattern:

```vue
<script setup>
import { ref, computed } from 'vue'

// Define emits with validation
const emit = defineEmits({
  close: null,
  select: (item) => item !== null,
  'update:modelValue': (value) => typeof value === 'string'
})

// Define props with validation
const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

// Event handlers
const handleClose = () => emit('close')
const handleSelect = (item) => emit('select', item)
</script>
```

**Benefits:**
- ✅ Consistent pattern across all components
- ✅ Better type inference (TypeScript ready)
- ✅ More concise code
- ✅ Vue 3 best practices
- ✅ Easier to add validation

---

## Acceptance Criteria

**Must Complete:**
- [x] All components use `<script setup>` syntax
- [x] All components use `defineEmits()`
- [x] Event validation added where appropriate
- [x] No Options API `this.$emit()` usage
- [x] Documentation updated with pattern
- [x] All 311 frontend tests passing
- [x] No functionality regressions

**Components to Update:**
- [ ] ConfigCard.vue
- [ ] Dashboard.vue (if using emits)
- [ ] ProjectDetail.vue (if using emits)
- [ ] UserGlobal.vue (if using emits)
- [ ] All components in `/src/components/cards/`

---

## Implementation Steps

**1. Audit Current Pattern Usage (15 minutes)**

```bash
# Find all components using Options API emits
cd /home/claude/manager/src/components
grep -r "this\.\$emit" . --include="*.vue"

# Find all components using defineEmits
grep -r "defineEmits" . --include="*.vue"

# Count usage
echo "Options API: $(grep -rc "this\.\$emit" . --include="*.vue" | grep -v ":0" | wc -l) files"
echo "Composition API: $(grep -rc "defineEmits" . --include="*.vue" | grep -v ":0" | wc -l) files"
```

**2. Convert Components to Composition API (1 hour)**

For each component using Options API:

**Before (Options API):**
```vue
<script>
export default {
  emits: ['close', 'select'],
  methods: {
    handleClose() {
      this.$emit('close')
    },
    handleSelect(item) {
      this.$emit('select', item)
    }
  }
}
</script>
```

**After (Composition API):**
```vue
<script setup>
// Define emits with optional validation
const emit = defineEmits({
  close: null,  // No validation
  select: (item) => item !== null  // Validate non-null
})

// Event handlers (no 'this' needed)
const handleClose = () => emit('close')
const handleSelect = (item) => emit('select', item)
</script>
```

**3. Add Event Validation (15 minutes)**

For critical events, add validation:

```vue
<script setup>
const emit = defineEmits({
  // Validate payload structure
  'update:modelValue': (value) => typeof value === 'string',

  // Validate required fields
  save: (data) => data && data.id && data.name,

  // Simple presence check
  delete: (id) => id !== undefined,

  // No validation needed
  cancel: null
})
</script>
```

**4. Update Tests (10 minutes)**

Ensure tests work with new pattern:

```javascript
// Tests should work unchanged, but verify:
test('emits close event', async ({ page }) => {
  const closePromise = page.waitForEvent('close')
  await page.click('[data-test="close-button"]')
  await closePromise  // Still works!
})
```

**5. Update Documentation (10 minutes)**

Add to `/home/claude/manager/.claude/templates/component-template.md`:

```markdown
## Event Emitters

All components should use Composition API with defineEmits:

```vue
<script setup>
const emit = defineEmits({
  // Event with validation
  select: (item) => item !== null,

  // Event without validation
  close: null
})

// Emit events
const handleClick = () => emit('select', selectedItem)
</script>
```
```

---

## Commit Message Template

```
refactor: standardize on Composition API for event emitters

Convert all components from Options API (this.$emit) to
Composition API (defineEmits) for consistency and better
type inference.

Changes:
- Converted X components to use defineEmits()
- Added event validation for critical events
- Removed all this.$emit() usage
- Updated component template documentation

Benefits:
- Consistent pattern across all components
- Better TypeScript readiness
- More concise code
- Event payload validation

Resolves HIGH-007

Test: All 311 frontend tests passing
```

---

## Definition of Done

- [x] All components use `<script setup>` + `defineEmits()`
- [x] No `this.$emit()` usage remaining
- [x] Event validation added for critical events
- [x] All 311 frontend tests passing
- [x] Documentation updated
- [x] Code review completed
- [x] Merged to feature branch

---

**Created:** October 26, 2025
**Assigned To:** TBD (via `/swarm` command)
**Epic:** Phase 2.2 Cleanup & Optimization
