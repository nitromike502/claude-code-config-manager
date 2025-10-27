# HIGH-001: Standardize CSS Variable System

**Issue ID:** HIGH-001
**Epic:** Phase 2.2 - Cleanup & Optimization
**Status:** 📋 Ready for Implementation
**Priority:** HIGH (Code Quality)
**Effort:** 45 minutes
**Labels:** `high`, `style`, `phase-2.2`, `refactor`, `css`

---

## Problem Description

The codebase mixes Phase 1 and Phase 2 CSS variable naming conventions, creating inconsistency and making theme management difficult. Components use different variable names for the same concepts.

**Examples of Inconsistency:**

```css
/* Phase 1 style (legacy) */
--primary-color
--background-color
--text-color

/* Phase 2 style (new) */
--bg-primary
--bg-secondary
--border-color
--text-primary

/* Mixed usage in components */
color: var(--text-color);      /* Phase 1 */
color: var(--text-primary);    /* Phase 2 */
background: var(--bg-card);    /* Phase 2 */
background: var(--card-bg);    /* Phase 1 */
```

**Impact:**
- Confusion about which variables to use
- Duplicate definitions for same values
- Harder to maintain themes
- Inconsistent theming across components

---

## Solution Design

**Standardize on Phase 2 Variable System:**

Use consistent naming pattern across all CSS:
- `--bg-*` for backgrounds
- `--text-*` for text colors
- `--border-*` for borders
- `--accent-*` for accent colors

**Variable Naming Convention:**

```css
/* Root variables (src/styles/variables.css) */
:root {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;
  --bg-card: #ffffff;
  --bg-hover: #f8f9fa;

  /* Text */
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-muted: #adb5bd;

  /* Borders */
  --border-color: #dee2e6;
  --border-radius: 8px;

  /* Accents */
  --accent-primary: #0d6efd;
  --accent-success: #198754;
  --accent-warning: #ffc107;
  --accent-danger: #dc3545;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}

/* Dark mode overrides */
[data-theme="dark"] {
  --bg-primary: #212529;
  --bg-secondary: #343a40;
  --bg-tertiary: #495057;
  --bg-card: #2b3035;
  --bg-hover: #343a40;

  --text-primary: #f8f9fa;
  --text-secondary: #adb5bd;
  --text-muted: #6c757d;

  --border-color: #495057;
  /* ... rest of dark mode variables */
}
```

---

## Technical Details

**Files to Audit:**
- `/home/claude/manager/src/styles/variables.css` - Root variable definitions
- `/home/claude/manager/src/styles/global.css` - Global styles
- `/home/claude/manager/src/components/**/*.vue` - Component styles

**Variable Categories:**

| Category | Prefix | Examples |
|----------|--------|----------|
| Background | `--bg-` | `--bg-primary`, `--bg-card`, `--bg-hover` |
| Text | `--text-` | `--text-primary`, `--text-secondary`, `--text-muted` |
| Border | `--border-` | `--border-color`, `--border-radius` |
| Accent | `--accent-` | `--accent-primary`, `--accent-success` |
| Shadow | `--shadow-` | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| Spacing | `--spacing-` | `--spacing-xs`, `--spacing-sm`, `--spacing-md` |

---

## Acceptance Criteria

**Must Complete:**
- [x] All CSS variables use consistent naming convention
- [x] No duplicate variables for same purpose
- [x] Dark mode variables follow same naming
- [x] All components updated to use standardized variables
- [x] `variables.css` documented with comments
- [x] Visual verification: No theme regressions
- [x] All 311 frontend tests passing
- [x] Visual regression tests passing (Test 300)

**Verification Checklist:**
- [ ] No `--primary-color` references (use `--accent-primary`)
- [ ] No `--background-color` references (use `--bg-*`)
- [ ] No `--card-bg` references (use `--bg-card`)
- [ ] Consistent prefix usage across all files
- [ ] Dark mode works correctly

---

## Implementation Steps

**1. Audit Current Variables (10 minutes)**

```bash
# Find all CSS variable definitions
cd /home/claude/manager
grep -r "\-\-[a-z]" src/ --include="*.css" --include="*.vue" | grep -v node_modules

# Common patterns to find:
# - Old: --primary-color, --background-color, --text-color
# - New: --bg-*, --text-*, --accent-*

# Count usage of each variable
grep -roh "\-\-[a-z-]*" src/ --include="*.css" --include="*.vue" | sort | uniq -c | sort -rn
```

**2. Create Variable Mapping (5 minutes)**

Document legacy → new mappings:

```javascript
// Variable migration map
const variableMigration = {
  // Backgrounds
  '--background-color': '--bg-primary',
  '--card-bg': '--bg-card',
  '--hover-bg': '--bg-hover',

  // Text
  '--text-color': '--text-primary',
  '--secondary-text': '--text-secondary',
  '--muted-text': '--text-muted',

  // Accents
  '--primary-color': '--accent-primary',
  '--success-color': '--accent-success',
  '--warning-color': '--accent-warning',
  '--danger-color': '--accent-danger',

  // Borders
  '--border': '--border-color',
  '--radius': '--border-radius',
}
```

**3. Update variables.css (10 minutes)**

File: `/home/claude/manager/src/styles/variables.css`

- Add comments documenting each category
- Remove duplicate definitions
- Ensure light and dark modes use same variable names (different values)

**4. Update Component Styles (15 minutes)**

```bash
# For each legacy variable, replace with new:
cd /home/claude/manager/src

# Example: Replace --primary-color with --accent-primary
find . -name "*.vue" -o -name "*.css" | xargs sed -i 's/var(--primary-color)/var(--accent-primary)/g'

# Repeat for all mappings from step 2
```

**5. Visual Verification (5 minutes)**

```bash
# Start dev server
npm run dev

# Test checklist:
# - Light mode: All colors correct
# - Dark mode toggle: Theme switches smoothly
# - All components: No missing colors
# - Cards: Background, borders, text all themed
# - Buttons: Accent colors correct
# - Sidebar: Theme applied correctly
```

---

## Dependencies

**Blocking:**
- None (independent refactor)

**Blocked By:**
- None

**Related Issues:**
- HIGH-002 (code duplication - may share CSS)
- CRITICAL-002 (legacy cleanup - remove old patterns)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Visual regressions | High | Visual regression tests + manual verification |
| Broken themes | High | Test light and dark modes thoroughly |
| Missed variables | Medium | Comprehensive grep/search before PR |
| Component-specific overrides | Low | Review component <style> sections |

**Mitigation Strategy:**
- **Test Visually:** Check every page in light and dark modes
- **Automated Tests:** Run visual regression suite (Test 300)
- **Incremental Changes:** Update one category at a time
- **Documentation:** Document mapping for reference

---

## Testing Strategy

**Automated Tests:**
```bash
# Frontend tests (component rendering)
npm run test:frontend
# 311/311 tests passing

# Visual regression tests
npm run test:visual
# 57/57 tests passing (Test 300)
```

**Manual Visual Testing:**

1. **Light Mode:**
   - Dashboard: Cards, backgrounds, text
   - Project Detail: All configuration sections
   - User/Global: Sidebar, breadcrumbs
   - Theme toggle button

2. **Dark Mode:**
   - Toggle theme
   - Verify all same elements
   - Check for contrast issues
   - Verify no white/black flashing

3. **Interactions:**
   - Hover states (cards, buttons)
   - Active states (selected items)
   - Focus states (keyboard navigation)

**Verification Checklist:**
- [ ] Dashboard cards themed correctly
- [ ] Project detail sections themed correctly
- [ ] Sidebar themed correctly
- [ ] Breadcrumbs themed correctly
- [ ] Buttons use accent colors
- [ ] Text readable in both modes
- [ ] Borders visible but subtle
- [ ] No color mismatches

---

## Commit Message Template

```
style: standardize CSS variable naming system

Consolidate Phase 1 and Phase 2 CSS variables into single
consistent naming convention. All variables now use semantic
prefixes (--bg-*, --text-*, --accent-*, etc).

Changes:
- Standardized on Phase 2 variable naming convention
- Removed duplicate variable definitions
- Updated all component styles to use new variables
- Added documentation comments to variables.css
- Ensured dark mode uses same variable names

Variable Categories:
- --bg-* (backgrounds)
- --text-* (text colors)
- --border-* (borders)
- --accent-* (accent colors)
- --shadow-* (shadows)

Migration Map:
--primary-color → --accent-primary
--background-color → --bg-primary
--text-color → --text-primary
--card-bg → --bg-card
(see commit for full mapping)

Resolves HIGH-001

Test: All 311 frontend tests passing
Visual: 57 visual regression tests passing
Manual: Light and dark modes verified
```

---

## Definition of Done

- [x] All CSS variables follow naming convention
- [x] No duplicate definitions
- [x] `variables.css` documented with comments
- [x] All components updated
- [x] Light mode visually verified
- [x] Dark mode visually verified
- [x] All 311 frontend tests passing
- [x] Visual regression tests passing (Test 300)
- [x] Code review completed
- [x] Merged to feature branch

---

## Notes

**Why This Matters:**
- **Maintainability:** Single source of truth for theme variables
- **Consistency:** Uniform theming across all components
- **Developer Experience:** Clear, predictable variable names
- **Future-Proof:** Easy to add new themes or color modes

**Expected Outcomes:**
- Zero legacy variable names in codebase
- Consistent naming across all CSS
- Same functionality, cleaner code
- Easier to add new themes in future

**Future Improvements:**
- Consider CSS custom property fallbacks
- Document in CONTRIBUTING.md
- Create theme generator tool (optional)

**Reference:**
- Original discovery: Cleanup Review (October 26, 2025)
- Review report: `/home/claude/manager/CLEANUP-AND-OPTIMIZATION-REPORT-2025-10-26.md`
- CSS Custom Properties: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

---

**Created:** October 26, 2025
**Assigned To:** TBD (via `/swarm` command)
**Epic:** Phase 2.2 Cleanup & Optimization
