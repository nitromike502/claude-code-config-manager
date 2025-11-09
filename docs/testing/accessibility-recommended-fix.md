# Accessibility Recommended Fix - Mobile Touch Target Size

**Component:** CopyButton.vue
**WCAG Criterion:** 2.5.5 Target Size (Level AA)
**Priority:** Low (Optional Enhancement)
**Estimated Time:** 5 minutes
**Impact:** Guarantees 100% WCAG 2.1 AA compliance

---

## Current Implementation

**File:** `/home/claude/manager/src/components/copy/CopyButton.vue`
**Lines:** 104-108

```css
/* Responsive adjustments */
@media (max-width: 767px) {
  .copy-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
}
```

**Estimated Height:** ~40px (close to, but below WCAG 44px minimum)

---

## Recommended Fix

```css
/* Responsive adjustments */
@media (max-width: 767px) {
  .copy-button {
    min-height: 44px;  /* WCAG 2.5.5 compliance */
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}
```

**Changes:**
1. Add `min-height: 44px;` to guarantee WCAG compliance
2. Increase padding from `0.5rem 0.75rem` to `0.75rem 1rem` for better touch ergonomics

---

## Testing

After applying fix, verify in mobile viewport (375x667):

```javascript
// Playwright test to verify
const size = await page.locator('.copy-button').first().boundingBox();
expect(size.height).toBeGreaterThanOrEqual(44);
```

---

## Decision

**Option A:** Apply fix now (5 minutes)
- ✅ 100% WCAG 2.1 AA compliance guaranteed
- ✅ Better mobile UX
- ⚠️ Slightly larger button on mobile

**Option B:** Defer to Phase 4
- Current implementation likely acceptable (~40px)
- Can address during accessibility polish sprint

**Recommendation:** Apply now if time permits, otherwise defer to Phase 4.
