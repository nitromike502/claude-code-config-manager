# Rules Detail Sidebar Wireframe

## Overview
The Rules Detail Sidebar appears when a user clicks "View Details" on any rule in the Rules Config Card. It follows the same PrimeVue `Sidebar` pattern as all other config types but includes a unique **Paths Section** showing glob patterns for conditional rules.

---

## Layout Structure

### Unconditional Rule (No `paths` frontmatter)

```
┌────────────────────────────────────┬────────────────────────────────────────┐
│                                    │ SIDE PANEL (40% width)                 │
│  PROJECT/USER VIEW                 │                                        │
│  (60% width, dimmed overlay)       │ ┌────────────────────────────────────┐ │
│                                    │ │ [x Close]              [< Prev Next>]│ │
│                                    │ └────────────────────────────────────┘ │
│                                    │                                        │
│  ┌──────────────────────────────┐ │ HEADER                                 │
│  │ 📋 Rules (5)                 │ │ ┌────────────────────────────────────┐ │
│  ├──────────────────────────────┤ │ │ 📋 coding-standards                │ │
│  │                              │ │ │                                    │ │
│  │  ┌────────────────────────┐  │ │ │ [Rule]  Unconditional              │ │
│  │  │ coding-standards   [→] │ ← ACTIVE                                  │ │
│  │  │ Loads always           │  │ │ │ File: .claude/rules/coding-...     │ │
│  │  └────────────────────────┘  │ │ └────────────────────────────────────┘ │
│  │                              │ │                                        │
│  │  ┌────────────────────────┐  │ │ LOADING BEHAVIOR                       │
│  │  │ frontend/react     [→] │  │ │ ┌────────────────────────────────────┐ │
│  │  │ Loads when: src/...    │  │ │ │ Loads: Always (unconditional)      │ │
│  │  └────────────────────────┘  │ │ └────────────────────────────────────┘ │
│  │                              │ │                                        │
│  └──────────────────────────────┘ │ CONTENT (Scrollable)                   │
│                                    │ ┌────────────────────────────────────┐ │
│                                    │ │ Markdown Content (Rendered)         │ │
│                                    │ │ ┌────────────────────────────────┐ │ │
│                                    │ │ │ # Coding Standards             │ │ │
│                                    │ │ │                                │ │ │
│                                    │ │ │ - Use 2-space indentation      │ │ │
│                                    │ │ │ - Prefer const over let        │ │ │
│                                    │ │ │ - Use single quotes            │ │ │
│                                    │ │ │ - Include trailing commas      │ │ │
│                                    │ │ └────────────────────────────────┘ │ │
│                                    │ └────────────────────────────────────┘ │
│                                    │                                        │
│                                    │ ACTIONS                                │
│                                    │ ┌────────────────────────────────────┐ │
│                                    │ │ [Delete]  [Copy To]  [Close]      │ │
│                                    │ └────────────────────────────────────┘ │
└────────────────────────────────────┴────────────────────────────────────────┘
```

### Conditional Rule (Has `paths` frontmatter)

```
┌────────────────────────────────────────┐
│ SIDE PANEL                             │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ [x Close]              [< Prev Next>]│ │
│ └────────────────────────────────────┘ │
│                                        │
│ HEADER                                 │
│ ┌────────────────────────────────────┐ │
│ │ 📋 frontend/react                  │ │
│ │                                    │ │
│ │ [Rule]  ◆ Conditional              │ │
│ │ File: .claude/rules/frontend/react │ │
│ └────────────────────────────────────┘ │
│                                        │
│ PATH PATTERNS (unique to rules)        │
│ ┌────────────────────────────────────┐ │
│ │ Loads when files match:            │ │
│ │                                    │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │ src/**/*.tsx                 │  │ │
│ │  └──────────────────────────────┘  │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │ src/**/*.jsx                 │  │ │
│ │  └──────────────────────────────┘  │ │
│ │                                    │ │
│ │                         [Edit Paths]│ │
│ └────────────────────────────────────┘ │
│                                        │
│ YAML FRONTMATTER (Collapsible)         │
│ ┌────────────────────────────────────┐ │
│ │ [▶ YAML Frontmatter]    [Copy YAML]│ │
│ ├────────────────────────────────────┤ │
│ │ ---                                │ │
│ │ paths:                             │ │
│ │   - "src/**/*.tsx"                 │ │
│ │   - "src/**/*.jsx"                 │ │
│ │ ---                                │ │
│ └────────────────────────────────────┘ │
│                                        │
│ MARKDOWN CONTENT (Rendered)            │
│ ┌────────────────────────────────────┐ │
│ │ # React Component Rules            │ │
│ │                                    │ │
│ │ - Use functional components with   │ │
│ │   hooks                            │ │
│ │ - Prefer composition over          │ │
│ │   inheritance                      │ │
│ │ - Extract reusable logic into      │ │
│ │   custom hooks                     │ │
│ │                                    │ │
│ │                     [Edit Content]  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ACTIONS                                │
│ ┌────────────────────────────────────┐ │
│ │ [Delete]  [Copy To]  [Close]       │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## Sidebar Components

### Panel Container
- **Component:** PrimeVue `Sidebar`
- **Position:** Right
- **Width:** 40% of viewport (min 400px, max 600px)
- **Behavior:** Same as existing DetailSidebar (slides in, overlay dims left, Escape to close)

### Panel Header
- **Icon:** `pi pi-book` in `var(--color-rules)` (red-orange `#E53E3E`)
- **Name:** Rule's relative path (bold, e.g., `frontend/react`)
- **Badges:**
  - Type badge: PrimeVue `Tag` with value "Rule"
  - Conditional indicator: "Unconditional" or diamond icon + "Conditional" (amber `#F59E0B`)
- **File path:** Full path in muted text, truncated with tooltip if long

### Path Patterns Section (Rules-Specific)
- **Visibility:** Only shown when `isConditional === true`
- **Header:** "Loads when files match:" label
- **Content:** Each glob pattern displayed in a styled `Code` block (monospace, inline chips)
- **Component:** PrimeVue `Chip` or styled `<code>` elements inside a vertical list
- **Edit button:** "Edit Paths" button (PrimeVue `Button`, text style, small)
- **Edit mode:** Converts to a textarea where each pattern is on its own line; save/cancel buttons

### YAML Frontmatter Section
- **Component:** PrimeVue `Panel` (collapsible, collapsed by default)
- **Content:** Syntax-highlighted YAML
- **Copy button:** "Copy YAML" (PrimeVue `Button`, text, small)
- **Note:** For rules, this section will often be minimal (just the `paths` array or empty)

### Markdown Content Section
- **Component:** Rendered markdown with PrimeVue styling
- **Features:** Full markdown rendering (headings, lists, code blocks)
- **Edit button:** "Edit Content" (PrimeVue `Button`, text, small)
- **Edit mode:** Full textarea editor with save/cancel, same as agents/commands

### Panel Footer (Actions)
- **Component:** Fixed footer with inline icon buttons (matches existing `ConfigDetailSidebar` pattern)
- **Actions (icon-only outlined buttons, left-to-right):**
  - **Delete:** `pi pi-trash` icon, danger severity, opens confirmation dialog
  - **Copy To:** `pi pi-copy` icon, opens copy dialog to copy rule to another project
  - **Close:** `pi pi-times` icon, closes the sidebar

---

## Content Display for Rules

```
Header:
  📋 frontend/react
  Type: Rule
  Loading: Conditional
  File: .claude/rules/frontend/react.md

Path Patterns (if conditional):
  src/**/*.tsx
  src/**/*.jsx

YAML Frontmatter (Collapsible):
  ---
  paths:
    - "src/**/*.tsx"
    - "src/**/*.jsx"
  ---

Markdown Content (Rendered):
  # React Component Rules

  - Use functional components with hooks
  - Prefer composition over inheritance
  ...
```

---

## Edit Mode Interactions

### Edit Paths (Conditional Rules Only)
1. User clicks "Edit Paths" button
2. Path chips transform into a textarea (one pattern per line)
3. Save/Cancel buttons appear
4. On Save: validate glob patterns, update frontmatter, save file
5. On Cancel: revert to display mode

### Edit Content
1. User clicks "Edit Content" button
2. Rendered markdown transforms into a textarea with raw markdown
3. Save/Cancel buttons appear
4. On Save: write content back to file (preserving frontmatter)
5. On Cancel: revert to rendered display

### Add Paths (Unconditional Rules)
1. When viewing an unconditional rule, the Path Patterns section shows "No path restrictions"
2. A small "Add Paths" button allows converting to conditional
3. Clicking opens a textarea for entering patterns
4. On Save: adds `paths` frontmatter, rule becomes conditional

---

## Navigation
- **Prev/Next:** Navigate through rules in same scope
- **Keyboard:** Ctrl+Left/Right for prev/next; Escape to close
- **Scroll to top** when navigating between rules

---

## Responsive Behavior

### Desktop (1200px+)
- Panel width: 40% (min 400px, max 600px)
- Path patterns shown as inline chips
- All actions visible

### Tablet (600px - 767px)
- Panel width: 60%
- Path patterns stack vertically
- Action buttons may wrap to second row

### Mobile (< 600px)
- Panel width: 90%
- Compact layout, vertically stacked actions

---

## Accessibility Notes

- Path pattern chips have `aria-label` describing the glob pattern
- Conditional/unconditional status announced via `aria-live` on navigation
- Edit mode transitions announced to screen readers
- All existing sidebar accessibility patterns apply (focus trap, Escape to close, keyboard navigation)
