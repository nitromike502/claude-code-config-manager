# Tailwind CSS Integration Guide

**Story:** STORY-3.12 - Migrate from Custom CSS to Tailwind CSS + PrimeFlex
**Status:** Phase 1 Complete | Phase 2 In Progress
**Last Updated:** November 22, 2025

---

## Overview

This guide documents the migration from custom CSS utility classes to Tailwind CSS v4 with tailwindcss-primeui integration. The migration follows a phased approach to minimize risk and maintain PrimeVue component styling.

**Target:** 85% reduction in custom CSS (from ~1,900 lines to ~285 lines)
**Approach:** Incremental migration with backward compatibility

---

## Phase 1 Complete: Cleanup & Organization

**Completed:** November 22, 2025

### Accomplishments

#### 1. CSS File Organization

**components.css** - Reorganized into 17 logical sections:
1. Domain-Specific Styling (Configuration Type Colors)
2. App Header & Navigation
3. Layout Containers
4. Project Cards & Grid
5. Configuration Cards
6. Info Bars (Project & User)
7. Detail Sidebar (Overlay & Content)
8. Domain-Specific: Agents
9. Domain-Specific: Commands
10. Domain-Specific: Hooks
11. Domain-Specific: MCP Servers
12. Markdown & Content Rendering
13. Structured Content (Metadata, Environment Variables)
14. State Components (Loading, Empty, Error)
15. Toast Notifications
16. PrimeVue Component Overrides
17. Responsive Breakpoints & Utilities

Each section includes:
- Clear section headers with separators
- Explanatory comments describing purpose and justification
- Subsection organization for related styles
- Documentation of which styles must remain custom

#### 2. Utility Class Preparation

**global.css** - Commented out 18 duplicate utility classes:
- 4 text color utilities (`.text-primary`, `.text-secondary`, `.text-muted`, `.text-emphasis`)
- 12 margin utilities (`.mt-*`, `.mb-*`, `.ml-*`, `.mr-*`)
- 4 padding utilities (`.p-*`)

All commented utilities marked with `/* TAILWIND PHASE 2 */` for easy identification.

#### 3. PrimeVue Component Integration

- Migrated `ConfigCard` wrapper from custom card to PrimeVue Card component
- Migrated `LoadingState` component to PrimeVue Skeleton component
- Maintained existing styling through CSS overrides in components.css

#### 4. Documentation Improvements

Added comprehensive inline documentation:
- Section-level comments explaining purpose and scope
- Class-level comments for complex or domain-specific styles
- Justification comments for styles that cannot be replaced by Tailwind
- Migration notes for Phase 2 planning

### Metrics

**Before Phase 1:**
```
components.css:  1,652 lines (unorganized)
global.css:      252 lines (mixed utility/base styles)
variables.css:   325 lines (unchanged)
Total:           2,229 lines
```

**After Phase 1:**
```
components.css:  1,734 lines (organized + documented)
global.css:      255 lines (18 utilities commented out)
variables.css:   325 lines (unchanged - required for theming)
Total:           2,314 lines (includes extensive documentation)
```

**Functional CSS Reduction:**
- 18 utility classes commented out (ready for Phase 2 deletion)
- 0 component styles removed yet (Phase 2 target)
- Documentation overhead: +85 lines (comment headers and explanations)

**Ready for Phase 2:**
- 18 utility classes marked for deletion
- All custom component styles documented and categorized
- Clear migration path established for each section

---

## Phase 1.5: Layout Migration to Tailwind (STORY-5.2)

**Status:** ✅ Complete
**Completed:** November 23, 2025

### Accomplishments

**Layout Components Migrated:**
- **Dashboard.vue** - Migrated all layout utilities to Tailwind (157 lines CSS reduced)
- **ProjectDetail.vue** - Migrated all layout utilities to Tailwind (155 lines CSS reduced)
- **BreadcrumbNavigation.vue** - Replaced custom breadcrumbs with PrimeVue Breadcrumb component

**Reusable Components Created:**
- **ErrorState.vue** - Consistent error state component with retry action support
- Used in Dashboard.vue and ProjectDetail.vue for unified error handling

**Cleanup:**
- Removed 38 lines of commented utility classes from global.css
- Removed all "TAILWIND PHASE 2" migration markers from App.vue
- Zero "PHASE 2" markers remaining in codebase

**Total CSS Reduction:** ~350 lines across Dashboard, ProjectDetail, global.css

### Lessons Learned

1. **Tailwind Migration Strategy:**
   - Migrate layout utilities first (flex, grid, spacing, borders)
   - Keep domain-specific styles custom (configuration type colors)
   - Use PrimeVue components where possible (Breadcrumb, Card, Button)

2. **Component Consolidation:**
   - EmptyState and ErrorState components reduce duplication
   - Consistent props API (icon, title, message, actions)
   - Easy to maintain and extend

3. **Testing Approach:**
   - Visual regression testing critical for layout changes
   - Browser testing after each component confirms no functional regressions
   - Automated Playwright tests validate end-to-end workflows

---

## Phase 2: Tailwind Installation & Configuration

**Status:** Not Started
**Target Start:** After STORY-5.2 PR merge

### Installation Steps

#### 1. Install Tailwind CSS v4 and tailwindcss-primeui

```bash
npm install -D tailwindcss@next @tailwindcss/postcss@next
npm install -D tailwindcss-primeui
```

**Note:** Tailwind v4 uses `@next` tag during beta period. Check [Tailwind v4 docs](https://tailwindcss.com/docs/v4-beta) for stable release.

#### 2. Create PostCSS Configuration

Create `postcss.config.js` in project root:

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

#### 3. Create Tailwind Configuration

Create `tailwind.config.js` in project root:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'], // Match existing theme selector
  theme: {
    extend: {
      // Map CSS variables to Tailwind utilities
      colors: {
        // Background colors
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-header': 'var(--bg-header)',
        'bg-code': 'var(--bg-code)',
        'bg-hover': 'var(--bg-hover)',

        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-emphasis': 'var(--text-emphasis)',
        'text-disabled': 'var(--text-disabled)',

        // Semantic colors
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          disabled: 'var(--color-primary-disabled)',
        },

        // Status colors
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',

        // Category colors (domain-specific)
        agents: 'var(--color-agents)',
        commands: 'var(--color-commands)',
        hooks: 'var(--color-hooks)',
        mcp: 'var(--color-mcp)',
      },

      borderColor: {
        primary: 'var(--border-primary)',
        secondary: 'var(--border-secondary)',
        focus: 'var(--border-focus)',
      },

      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'card-active': 'var(--shadow-card-active)',
        sidebar: 'var(--shadow-sidebar)',
      },

      spacing: {
        // Maintain existing spacing scale (0.5rem increments)
        // Tailwind's default scale is sufficient
      },
    },
  },
  plugins: [
    require('tailwindcss-primeui'),
  ],
}
```

#### 4. Update CSS Import Order

Modify `src/main.js`:

```javascript
// Tailwind base and utilities (MUST come first)
import 'tailwindcss/tailwind.css'

// CSS Variables (theme system - required for Tailwind color mappings)
import './styles/variables.css'

// PrimeVue styles
import 'primevue/resources/themes/aura-dark-green/theme.css'
import 'primeicons/primeicons.css'

// Custom component styles (reduced to ~285 lines after migration)
import './styles/components.css'
import './styles/global.css'
```

**Critical Import Order:**
1. Tailwind CSS (provides utility classes)
2. CSS Variables (defines theme tokens)
3. PrimeVue styles (styled components)
4. Custom styles (domain-specific overrides)

#### 5. Update Vite Configuration

Ensure PostCSS plugin is loaded in `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  css: {
    postcss: './postcss.config.js', // Auto-loaded by default
  },
})
```

### Configuration Testing

After installation, verify Tailwind is working:

1. Run development server: `npm run dev`
2. Add test utility class to any component: `<div class="bg-blue-500 text-white p-4">Test</div>`
3. Verify class applies correctly in browser DevTools
4. Check CSS variables are resolved: `bg-bg-primary` should use `var(--bg-primary)`

---

## Phase 3: Component Migration Strategy

**Status:** Planned
**Estimated Effort:** 2-3 sessions

### Migration Approach

**Incremental Replacement:**
1. Migrate one component section at a time
2. Test functionality after each section
3. Remove obsolete custom CSS rules
4. Document any styles that must remain custom

### Migration Priority Order

#### Priority 1: Layout & Containers (Low Risk)
- `.main-content` → Tailwind flex utilities
- `.project-grid` → Tailwind grid utilities
- `.config-cards-container` → Tailwind flex/width utilities

**Target Reduction:** ~50 lines

#### Priority 2: Card Components (Medium Risk)
- `.project-card` → Tailwind card utilities + PrimeVue Card
- `.config-card` → Already using PrimeVue Card, simplify CSS
- Card headers, footers → Tailwind spacing/borders

**Target Reduction:** ~150 lines

#### Priority 3: List Items (Medium Risk)
- `.config-item`, `.agent-item`, `.command-item`, etc.
- Replace with Tailwind flex utilities
- Maintain hover states with Tailwind hover: variants

**Target Reduction:** ~200 lines

#### Priority 4: State Components (Low Risk)
- `.loading-container`, `.empty-state`, `.error-state`
- Simple utility replacements

**Target Reduction:** ~75 lines

#### Priority 5: Responsive Utilities (Low Risk)
- Media queries → Tailwind responsive variants (sm:, md:, lg:)
- Responsive typography → Tailwind text size variants

**Target Reduction:** ~100 lines

### Styles That MUST Remain Custom

These styles cannot be replaced by Tailwind and will remain in `components.css`:

#### 1. Domain-Specific Configuration Type Colors
```css
/* Lines 50-196 in components.css */
.agent-card .card-icon { color: var(--color-agents); }
.command-card .count-badge { background-color: var(--color-commands); }
/* etc. */
```

**Reason:** Semantic color coding specific to Claude Code configuration types (agents=green, commands=blue, hooks=orange, mcp=purple). Cannot be replaced by generic utility classes without losing domain meaning.

**Estimated:** ~150 lines

#### 2. PrimeVue Component Overrides
```css
/* Lines 1540-1734 in components.css */
.p-dialog { /* custom positioning */ }
.p-toast-message { /* custom styling */ }
/* etc. */
```

**Reason:** PrimeVue components require specific overrides that tailwindcss-primeui doesn't cover. These maintain consistency with our theme system.

**Estimated:** ~195 lines

#### 3. Complex Animations
```css
@keyframes fadeIn { /* ... */ }
@keyframes slideIn { /* ... */ }
@keyframes skeleton-loading { /* ... */ }
```

**Reason:** Custom keyframe animations for sidebar transitions and skeleton loading effects.

**Estimated:** ~40 lines

#### 4. Markdown Content Rendering
```css
/* Lines 620-748 in components.css */
.markdown-content h1 { /* ... */ }
.markdown-content pre code { /* ... */ }
/* etc. */
```

**Reason:** Complex nested selectors for markdown rendering cannot be easily replaced by Tailwind prose plugin without extensive configuration.

**Estimated:** ~130 lines (could potentially use @tailwindcss/typography plugin to reduce)

**Total Custom CSS After Migration:** ~515 lines (could reduce to ~385 with typography plugin)

### Component-by-Component Migration Plan

#### Example: ProjectCard.vue Migration

**Before (Custom CSS):**
```vue
<template>
  <div class="project-card" @click="selectProject">
    <div class="project-header">
      <i class="pi pi-folder"></i>
      <h3 class="project-name">{{ project.name }}</h3>
    </div>
    <div class="project-path">{{ project.path }}</div>
  </div>
</template>

<style scoped>
.project-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-card);
  transition: all 200ms ease;
  cursor: pointer;
}
</style>
```

**After (Tailwind):**
```vue
<template>
  <div
    class="bg-bg-secondary border border-border-primary rounded-lg shadow-card transition-all duration-200 cursor-pointer hover:bg-bg-hover hover:shadow-card-hover hover:-translate-y-0.5"
    @click="selectProject"
  >
    <div class="flex items-center gap-3 p-4 border-b border-border-secondary">
      <i class="pi pi-folder text-xl text-primary"></i>
      <h3 class="text-lg font-semibold text-text-emphasis">{{ project.name }}</h3>
    </div>
    <div class="text-text-secondary text-sm p-2 px-4 break-all">{{ project.path }}</div>
  </div>
</template>

<style scoped>
/* No custom CSS needed! */
</style>
```

**Benefits:**
- No custom CSS classes to maintain
- Tailwind utilities are self-documenting
- Responsive variants easy to add (sm:, md:, lg:)
- Consistent spacing/sizing across application

### Testing Strategy

For each migrated component:

1. **Visual Regression Test**
   - Capture screenshots before migration
   - Compare after migration in both light/dark modes
   - Verify hover/focus/active states

2. **Functional Test**
   - Run existing Playwright E2E tests
   - Verify all interactions still work
   - Check responsive behavior at mobile/tablet/desktop sizes

3. **Accessibility Test**
   - Run axe-core accessibility scanner
   - Verify keyboard navigation
   - Check screen reader announcements

4. **Performance Test**
   - Measure CSS bundle size reduction
   - Verify no layout shifts or flashing

### Rollback Plan

If issues arise during migration:

1. **Git Workflow:** Each component section migrated in separate commit
2. **Feature Flag:** Optionally use environment variable to toggle Tailwind
3. **Gradual Rollout:** Deploy behind feature flag, monitor for issues
4. **Quick Revert:** `git revert <commit>` if critical bugs found

---

## Appendix: CSS Variable to Tailwind Mapping

### Background Colors

| CSS Variable | Tailwind Class | Usage |
|--------------|----------------|-------|
| `var(--bg-primary)` | `bg-bg-primary` | Page background |
| `var(--bg-secondary)` | `bg-bg-secondary` | Card backgrounds |
| `var(--bg-tertiary)` | `bg-bg-tertiary` | Subtle backgrounds |
| `var(--bg-hover)` | `bg-bg-hover` | Hover states |
| `var(--bg-code)` | `bg-bg-code` | Code blocks |
| `var(--bg-header)` | `bg-bg-header` | App header |

### Text Colors

| CSS Variable | Tailwind Class | Usage |
|--------------|----------------|-------|
| `var(--text-primary)` | `text-text-primary` | Body text |
| `var(--text-secondary)` | `text-text-secondary` | Labels, captions |
| `var(--text-muted)` | `text-text-muted` | Subtle hints |
| `var(--text-emphasis)` | `text-text-emphasis` | Headings, emphasis |
| `var(--text-disabled)` | `text-text-disabled` | Disabled elements |

### Border Colors

| CSS Variable | Tailwind Class | Usage |
|--------------|----------------|-------|
| `var(--border-primary)` | `border-border-primary` | Default borders |
| `var(--border-secondary)` | `border-border-secondary` | Subtle dividers |
| `var(--border-focus)` | `border-border-focus` | Focus indicators |

### Semantic Colors

| CSS Variable | Tailwind Class | Usage |
|--------------|----------------|-------|
| `var(--color-primary)` | `bg-primary` or `text-primary` | Primary actions |
| `var(--color-success)` | `bg-success` or `text-success` | Success states |
| `var(--color-warning)` | `bg-warning` or `text-warning` | Warning states |
| `var(--color-error)` | `bg-error` or `text-error` | Error states |
| `var(--color-info)` | `bg-info` or `text-info` | Info states |

### Shadows

| CSS Variable | Tailwind Class | Usage |
|--------------|----------------|-------|
| `var(--shadow-card)` | `shadow-card` | Default card shadow |
| `var(--shadow-card-hover)` | `shadow-card-hover` | Lifted card shadow |
| `var(--shadow-sidebar)` | `shadow-sidebar` | Sidebar shadow |

### Spacing

Tailwind's default spacing scale matches our CSS:
- `p-1` = `0.25rem` (0.25rem)
- `p-2` = `0.5rem` (0.5rem)
- `p-4` = `1rem` (1rem)
- `p-6` = `1.5rem` (1.5rem)
- `p-8` = `2rem` (2rem)

**Note:** Tailwind uses 4-unit scale increments (4, 8, 12, 16) which map to our 0.5rem increments.

### Common Utility Replacements

| Custom Class | Tailwind Equivalent | Notes |
|--------------|---------------------|-------|
| `.text-primary` | `text-text-primary` | |
| `.mt-2` | `mt-4` | Tailwind uses 4-unit scale |
| `.mb-2` | `mb-4` | |
| `.p-2` | `p-4` | |
| `.flex-center` | `flex items-center justify-center` | |
| `.rounded` | `rounded-lg` | 8px radius |
| `.border` | `border border-border-primary` | |

---

## Resources

### Official Documentation
- [Tailwind CSS v4 Beta](https://tailwindcss.com/docs/v4-beta)
- [tailwindcss-primeui Plugin](https://github.com/primefaces/tailwindcss-primeui)
- [PrimeVue Documentation](https://primevue.org/)

### Internal Documentation
- [CSS Variables Guide](./CSS-VARIABLES.md) - Complete CSS variable reference
- [Coding Standards](./CODING-STANDARDS.md) - Project coding conventions
- [Component Architecture](../technical/COMPONENT-ARCHITECTURE.md) - Component design patterns

### Migration Examples
- [Tailwind v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Vue 3 + Tailwind Best Practices](https://tailwindcss.com/docs/guides/vue-3-vite)

---

## Questions & Troubleshooting

### Why Tailwind v4 instead of v3?

Tailwind v4 offers:
- Native CSS variable support (better theme integration)
- Improved tree-shaking (smaller bundle sizes)
- Better PostCSS integration
- Future-proofing for long-term maintenance

### Will this break PrimeVue components?

No. PrimeVue components use their own CSS and are unaffected. The `tailwindcss-primeui` plugin ensures Tailwind utilities work alongside PrimeVue styles without conflicts.

### What about CSS variable performance?

CSS variables add negligible overhead (<1ms) and provide critical benefits:
- Dynamic theming (dark/light mode)
- Runtime theme switching
- Consistent color palette
- Single source of truth

### Can we use Tailwind JIT in development?

Yes! Tailwind v4 uses JIT by default. Only utility classes actually used in templates are generated, resulting in fast builds and small bundles.

### How do we handle custom animations?

Tailwind supports custom animations in config. We can move our keyframes to `tailwind.config.js`:

```javascript
theme: {
  extend: {
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
    },
    animation: {
      'fade-in': 'fadeIn 0.2s ease',
    },
  },
}
```

Then use: `<div class="animate-fade-in">...</div>`

---

## Status & Next Steps

**Phase 1:** ✅ Complete (November 22, 2025)
- CSS organized and documented
- Utility classes commented out
- PrimeVue components integrated

**Phase 2:** 🔄 In Progress
- [ ] Install Tailwind CSS v4
- [ ] Configure PostCSS
- [ ] Create Tailwind config with CSS variable mappings
- [ ] Update CSS import order in main.js
- [ ] Test Tailwind utilities in development

**Phase 3:** ⏳ Planned
- [ ] Migrate layout containers
- [ ] Migrate card components
- [ ] Migrate list items
- [ ] Migrate state components
- [ ] Migrate responsive utilities
- [ ] Remove obsolete custom CSS
- [ ] Update component tests
- [ ] Visual regression testing

**Target Completion:** December 2025

---

**Maintained by:** Documentation Engineer
**Last Review:** November 22, 2025
**Next Review:** After Phase 2 completion
