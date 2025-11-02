# Copy Configuration Feature - Wireframes

**Session:** BA-20251101-230906-copy-configuration
**Date:** November 1, 2025
**Status:** Ready for Review

---

## Overview

This directory contains comprehensive UI/UX wireframes and design specifications for the Copy Configuration feature in Claude Code Manager. The wireframes define all visual elements, interactions, and user flows required for frontend implementation.

---

## Documents in This Directory

### 1. **design-notes.md** (Master Design Specification)
**Purpose:** Complete technical design specification document

**Contents:**
- Component architecture and hierarchy
- PrimeVue component mappings
- Detailed CSS specifications for all components
- Color palette and theming (dark mode)
- Interaction states (default, hover, active, disabled, loading)
- Responsive design breakpoints and adaptations
- Accessibility compliance (WCAG 2.1 AA)
- Animation and transition specifications
- Integration patterns with existing components
- State management (Pinia store)

**Use This For:** Complete technical reference during implementation

---

### 2. **01-copy-modal-main.md**
**Purpose:** Main copy modal dialog design

**Contents:**
- Full modal layout with dimensions (600px width, 80vh max height)
- Source section design (displays config being copied)
- Destination section design (scrollable project list with cards)
- Destination card specifications (hover states, click targets)
- Button designs (Copy Here, Cancel, Close)
- Scrolling behavior and indicators
- Modal overlay and positioning
- Opening/closing animations

**Key Decisions:**
- Card-based destination selection (not dropdown)
- User Global always shown first in destination list
- Scrollable area shows 5-6 projects before scrolling
- "Copy Here" button on each destination card (not clicking entire card)

---

### 3. **02-conflict-resolution-dialog.md**
**Purpose:** Conflict resolution dialog (nested over copy modal)

**Contents:**
- Conflict dialog layout (550px width, 70vh max height)
- Warning header styling (orange background)
- Source and target file comparison cards
- Radio button group for action selection (Skip, Overwrite, Rename)
- Default selection (Rename - safest option)
- Overwrite option styled as warning (orange text, warning icon)
- Confirm button color changes based on selected action
- Edge case handling (long filenames, long paths)

**Key Decisions:**
- Always prompt user on conflict (no automatic resolution in V1)
- Default to "Rename" strategy (safest, prevents data loss)
- Show metadata only (name, path, modified date), not file contents
- Overwrite option has warning color to indicate destructive action

---

### 4. **03-success-error-notifications.md**
**Purpose:** Toast notifications for feedback

**Contents:**
- Success toast design (green, checkmark icon)
- Error toast design (red, error icon)
- Toast positioning (top-right corner)
- Animation sequences (slide in from right)
- Auto-dismiss behavior (success: 5s, error: manual)
- Optional action link ("View in Target Project")
- Error message templates for all error types (EACCES, ENOSPC, ENOENT, etc.)
- Multiple toast stacking behavior
- Responsive positioning (desktop, tablet, mobile)

**Key Decisions:**
- Success auto-dismisses after 5 seconds (can dismiss manually)
- Errors require manual dismissal (no auto-dismiss)
- Include link to navigate to target project in success toast
- Clear, actionable error messages with advice

---

### 5. **04-copy-button-integration.md**
**Purpose:** Copy button integration into existing config item lists

**Contents:**
- Copy button placement in item rows
- Button variants (icon-only, icon+text, menu item)
- Integration with ConfigItemList.vue
- Item actions section design (View + Copy buttons)
- Hover behavior (actions appear on hover for desktop)
- Always-visible variant for mobile/tablet
- Plugin item restriction (disabled copy button with tooltip)
- Plugin badge design
- Responsive behavior (desktop, tablet, mobile)

**Key Decisions:**
- Inline actions pattern (buttons in item row, not dropdown menu)
- Hover-reveal on desktop, always-visible on mobile
- Icon-only buttons on small screens to save space
- Plugin items show disabled copy button with explanatory tooltip

---

### 6. **05-complete-user-flow.md**
**Purpose:** End-to-end user journey visualization

**Contents:**
- Complete flow diagram from trigger to completion
- Step-by-step breakdown of each stage
- Decision points and branching (no conflict vs conflict detected)
- Alternative flows (cancellation at various points)
- Edge cases (plugin items, network errors, source deleted)
- Timing specifications for all animations and operations
- Success criteria for UX, performance, and accessibility

**Key Insights:**
- User can complete copy in <5 clicks (no conflict)
- User can complete copy in <7 clicks (with conflict)
- User can cancel at any point (modal, conflict dialog, overlay click)
- All operations are non-blocking (async with loading indicators)

---

## Quick Reference

### Component Files to Create

**New Components:**
1. `src/components/copy/CopyButton.vue` - Trigger button for copy action
2. `src/components/copy/CopyModal.vue` - Main modal dialog
3. `src/components/copy/ConflictDialog.vue` - Conflict resolution dialog

**Modified Components:**
4. `src/components/cards/ConfigItemList.vue` - Add copy button to item actions
5. `src/App.vue` - Add Toast component for notifications

**New Store:**
6. `src/stores/copyConfig.js` - Pinia store for copy state management

**New API Methods:**
7. `src/api/client.js` - Add copy endpoint methods

---

## Design System Compliance

### Colors Used (Dark Mode)

| Purpose | Variable | Hex Value | Usage |
|---------|----------|-----------|-------|
| Primary Action | `--color-primary` | #007ad9 | Copy Here buttons |
| Success | `--color-success` | #4CAF50 | Success toasts |
| Error | `--color-error` | #EF5350 | Error toasts |
| Warning | `--color-warning` | #FFA726 | Conflict dialog, overwrite action |
| Background Secondary | `--bg-secondary` | #1e1e1e | Modal background |
| Background Tertiary | `--bg-tertiary` | #252525 | Cards, headers |
| Background Hover | `--bg-hover` | #2a2a2a | Interactive element hover |
| Border Primary | `--border-primary` | #3e3e3e | Card borders |
| Text Primary | `--text-primary` | #e0e0e0 | Main text |
| Text Secondary | `--text-secondary` | #a0a0a0 | Subtitles, descriptions |

All colors meet WCAG 2.1 AA contrast requirements (4.5:1 minimum).

---

## Key PrimeVue Components

| Component | Usage |
|-----------|-------|
| Dialog Pattern | Copy Modal, Conflict Dialog |
| Toast Service | Success and error notifications |
| Button | Copy Here, Cancel, Confirm, Close buttons |
| Icon (PrimeIcons) | pi-copy, pi-check-circle, pi-times-circle, pi-ban |
| Tooltip Directive | Disabled copy button explanation |
| Overlay | Modal background dimming |

**Note:** Using PrimeVue design patterns, not direct PrimeVue components (custom implementation for full control).

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop | 1920px+ | Full layout, hover-reveal actions, 600px modal |
| Laptop | 1440px | Full layout, 600px modal |
| Tablet | 768-1439px | Always-visible actions, icon-only buttons, 90vw modal |
| Mobile | <768px | Full-screen modal, stacked layout, simplified UI |

---

## Accessibility Features

**Keyboard Navigation:**
- Tab order: Copy button → Modal elements → Destination cards → Buttons
- Escape: Close modal/dialog
- Enter: Activate focused button or destination card
- Arrow keys: Navigate radio options in conflict dialog

**Screen Reader Support:**
- ARIA role="dialog" on modals
- ARIA role="status" for success toast
- ARIA role="alert" for error toast
- ARIA-live regions for status announcements
- Descriptive aria-labels on all interactive elements

**Focus Management:**
- Clear focus indicators (2px outline, --border-focus color)
- Focus trapped within open modal/dialog
- Focus returns to trigger button after modal closes

**Color Contrast:**
- All text meets 4.5:1 ratio minimum (WCAG AA)
- Large text meets 3:1 ratio minimum
- Interactive elements have clear visual states

---

## Animation Specifications

| Animation | Duration | Easing | Description |
|-----------|----------|--------|-------------|
| Modal Open | 300ms | ease-out | Slide up + fade in |
| Modal Close | 200ms | ease-in | Slide down + fade out |
| Conflict Dialog Open | 300ms | ease-out | Scale up + fade in |
| Conflict Dialog Close | 200ms | ease-in | Scale down + fade out |
| Toast Slide In | 300ms | ease-out | Slide in from right |
| Toast Slide Out | 300ms | ease-in | Slide out to right |
| Button Hover | 200ms | ease | Scale + background change |
| Card Hover | 200ms | ease | Background + border + shadow |

---

## Design Decisions Summary

### 1. Modal-Based Flow (not clipboard or drag-drop)
**Why:** Simplest to implement for V1, works in all contexts, no state management complexity.

### 2. Card Destination Selection (not dropdown)
**Why:** More visual and scannable than dropdown, consistent with existing card-based UI.

### 3. Always Prompt on Conflict (not automatic resolution)
**Why:** Safety-first approach for V1, user has full control, prevents accidental data loss.

### 4. Default to Rename Strategy (not skip or overwrite)
**Why:** Safest option, preserves both files, prevents data loss.

### 5. Subtle Visual Indicators (optional additive layer)
**Why:** Provides clarity without clutter, easy to remove if not helpful.

### 6. No Undo (rely on git)
**Why:** Keeps V1 simple, users are developers familiar with version control.

### 7. Single-Item Copy Only (no batch in V1)
**Why:** Focus on getting core feature right, faster time-to-market, learn from usage.

### 8. Plugin Items Disabled (cannot copy)
**Why:** Respect plugin architecture, plugins should be installed not file-copied.

---

## Implementation Workflow

### Phase 1: Component Creation (8-10 hours)
1. Create CopyButton.vue (1 hour)
2. Create CopyModal.vue (2-3 hours)
3. Create ConflictDialog.vue (1.5 hours)
4. Create copyConfig store (1 hour)
5. Add API methods (1 hour)
6. Integrate Toast service (0.5 hours)
7. Write component tests (2 hours)

### Phase 2: Integration (4-6 hours)
1. Add copy buttons to ConfigItemList.vue (1 hour)
2. Add copy buttons to all config card types (2 hours)
3. Test integration in ProjectDetail view (1 hour)
4. Test integration in UserGlobal view (1 hour)
5. Write integration tests (2 hours)

### Phase 3: Polish & Testing (2-4 hours)
1. Refine animations and transitions (1 hour)
2. Test responsive behavior (1 hour)
3. Accessibility audit (1 hour)
4. Cross-browser testing (1 hour)
5. Write E2E tests (2 hours)

**Total Estimated Frontend Time:** 14-20 hours

---

## Questions for Review

### Design Questions

1. **Copy Button Visibility:** Should copy buttons be hover-only (desktop) or always visible?
   - **Recommendation:** Hover-only for desktop (cleaner), always visible for mobile/tablet (better discoverability)

2. **Conflict Preview Content:** Should conflict dialog show file content preview or just metadata?
   - **Decision:** Metadata only (name, path, modified date) - keeps dialog compact and fast

3. **Success Toast Action:** Should success toast include "View in Target Project" link?
   - **Recommendation:** Yes - provides natural next step, enhances user confidence

4. **Destination Card Interaction:** Should clicking entire card trigger copy, or only the button?
   - **Decision:** Button only for V1 - safer, more explicit confirmation

5. **Loading Indicators:** Should large skill copies show progress percentage?
   - **Recommendation:** Defer to V2 if adds >2 hours work. Simple spinner sufficient for V1.

### Technical Questions

1. **State Management:** Should copy state be in Pinia store or component-local?
   - **Recommendation:** Pinia store - allows for future features (copy history, undo)

2. **API Structure:** One `/api/copy` endpoint or separate per type (`/api/copy/agent`, etc.)?
   - **Recommendation:** Separate endpoints - clearer validation, easier to test

3. **Conflict Strategy Storage:** Should user's last conflict choice be remembered?
   - **Decision:** Not in V1 - defer to V2 preferences feature

---

## Next Steps

1. **Review wireframes with project-manager** - Get approval on all design decisions
2. **Validate with stakeholders** - Confirm user flow meets requirements
3. **Create visual mockups (optional)** - High-fidelity designs if needed
4. **Begin frontend implementation** - Create components based on these specs
5. **Conduct usability testing** - Test with real users after implementation

---

## Related Documents

**BA Session Documents:**
- `../decisions.md` - All architectural decisions
- `../decision-matrix.md` - Quick reference of decisions
- `../TODO.md` - Outstanding questions and tasks

**PRD Documents:**
- `docs/prd/features/copy-configuration/FEATURE-OVERVIEW.md` - Original feature requirements

**Project Documentation:**
- `CLAUDE.md` - Project overview and tech stack
- `docs/guides/TESTING-GUIDE.md` - Testing requirements
- `docs/guides/GIT-WORKFLOW.md` - Git and commit standards

---

**Wireframes Version:** 1.0
**Created:** November 1, 2025
**Status:** Ready for Review
**Review Deadline:** TBD
**Implementation Start:** After approval
