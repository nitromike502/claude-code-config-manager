# Rules Config Card Wireframe

## Overview
The Rules Config Card appears in both the Project Detail View and the User/Global View. It follows the identical layout pattern as all other config cards (Agents, Commands, Skills, Hooks, MCP) and is stacked vertically with those cards on one page. Rules are markdown files with optional YAML frontmatter stored in `.claude/rules/`.

Rules have one unique display concern: nested paths must be shown as full relative paths (e.g., `frontend/react` not just `react`) because rules can live in subdirectories and name collisions are possible. A second display concern is that some rules load conditionally (they have a `paths` frontmatter field) while others load unconditionally. This distinction should be visible at the list level without requiring the user to open the detail sidebar.

---

## Layout Structure

### Standard State (Several Rules Present)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📋 Rules (5)                                                  [Expand All]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ coding-standards                                      [View Details] │    │
│  │ Loads always • No path restrictions                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ frontend/react                              ◆ Conditional [View Details]  │
│  │ Loads when: src/**/*.tsx, src/**/*.jsx                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ frontend/vue                                ◆ Conditional [View Details]  │
│  │ Loads when: src/**/*.vue                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ backend/api-conventions                     ◆ Conditional [View Details]  │
│  │ Loads when: src/api/**/*.ts, tests/api/**   (2 patterns)             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ testing                                               [View Details] │    │
│  │ Loads always • No path restrictions                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  [Show 0 more...]  (hidden — all 5 shown)                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Truncation Example (Many Rules, Initial Collapsed View)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📋 Rules (9)                                                  [Expand All]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ coding-standards                                      [View Details] │    │
│  │ Loads always • No path restrictions                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ frontend/react                              ◆ Conditional [View Details]  │
│  │ Loads when: src/**/*.tsx, src/**/*.jsx                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ frontend/vue                                ◆ Conditional [View Details]  │
│  │ Loads when: src/**/*.vue                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ backend/api-conventions                     ◆ Conditional [View Details]  │
│  │ Loads when: src/api/**/*.ts  (+1 more)                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ testing                                               [View Details] │    │
│  │ Loads always • No path restrictions                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  [Show 4 more...]                                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📋 Rules (0)                                                  [Expand All]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          📋                                                  │
│                   No rules configured                                        │
│       Add .md files to .claude/rules/ to define project rules                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📋 Rules                                                      [Expand All]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ████████████████████████████████████████████████████████████  (skeleton)   │
│  ██████████████████████████████████████████████████████        (skeleton)   │
│                                                                              │
│  ████████████████████████████████████████████████████████████  (skeleton)   │
│  ██████████████████████████████████████████████████████        (skeleton)   │
│                                                                              │
│  ████████████████████████████████████████████████████████████  (skeleton)   │
│  ██████████████████████████████████████████████████████        (skeleton)   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## ConfigItem Row Anatomy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [name line]                          [conditional badge]  [View Details]│
│  [description line]                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Unconditional Rule (no `paths` frontmatter field)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ coding-standards                                          [View Details] │
│ Loads always • No path restrictions                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

- Name line: relative path used as name (bold, `var(--text-emphasis)`)
- Description line: "Loads always • No path restrictions" (muted, `var(--text-muted)`)
- No conditional badge
- "View Details" button right-aligned, ghost style

### Conditional Rule (has `paths` frontmatter field)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ frontend/react                          ◆ Conditional      [View Details]│
│ Loads when: src/**/*.tsx, src/**/*.jsx                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

- Name line: relative path (bold)
- Conditional badge: small diamond icon (`pi pi-filter`) + "Conditional" label
  - Badge color: `var(--color-rules-conditional)` — amber/gold `#F59E0B`
  - Badge style: compact Tag component (outlined, no fill)
  - Position: between name and "View Details" button
- Description line: "Loads when: [first pattern], [second pattern]" in muted text
  - If more than 2 patterns: "Loads when: [first pattern]  (+N more)"
  - If 1 pattern only: "Loads when: [pattern]"
- All patterns use monospace font to visually distinguish glob syntax

### Nested Path Display

Rules in subdirectories display their full relative path as the name:

```
  frontend/react          ← root-level rule in frontend/ subdir
  frontend/vue            ← root-level rule in frontend/ subdir
  backend/api-conventions ← root-level rule in backend/ subdir
  coding-standards        ← rule at the root rules/ directory
```

If the path is very long (> 40 characters), truncate with ellipsis and show full path in a tooltip:

```
  backend/services/database/... ◆ Conditional      [View Details]
  ↑ tooltip: "backend/services/database/query-patterns"
```

---

## Components

### Card Header
- **Component:** PrimeVue `Card` header slot
- **Left:** `pi pi-book` icon in `var(--color-rules)` (red-orange `#E53E3E`) + "Rules" text + count badge
- **Right:** "Expand All" / "Collapse All" toggle button (PrimeVue `Button`, text style, small)

### Card Body
- **Component:** Custom list div inside PrimeVue `Card` content slot
- **Items:** Iterated `RulesConfigItem` components (extends `ConfigItem` pattern)
- **Separator:** `1px solid var(--border-secondary)` between items
- **Show more:** PrimeVue `Button` text style, centered, below last visible item

### Conditional Badge
- **Component:** PrimeVue `Tag`
- **Props:** `severity="warn"`, `outlined`, custom icon via slot or value prefix
- **Alternative:** Custom `<span>` with `pi pi-filter` icon + "Conditional" text, styled as an inline chip
- **Size:** Small, inline with name text line (not on a separate line)

### Empty State
- **Component:** Custom centered div
- **Icon:** Large `pi pi-book` (3rem, `var(--color-rules)` at 30% opacity)
- **Heading:** "No rules configured" (`var(--text-muted)`)
- **Help text:** "Add .md files to .claude/rules/ to define project rules" (smaller, `var(--text-disabled)`)

### Loading State
- **Component:** PrimeVue `Skeleton` (3 instances, height 60px, with 8px margin between)

---

## Placement in Project Detail View

The Rules card is inserted as the 6th card (after Skills, which was the 5th type added after the original 4):

```
Page (scrollable)
├── Subagents card
├── Slash Commands card
├── Skills card
├── Hooks card
├── MCP Servers card
└── Rules card        ← NEW, appended at bottom
```

Rationale for placement at bottom: Rules are a newer, less-frequently accessed config type compared to Agents and Commands. Appending at the bottom maintains backwards visual compatibility — existing users scanning the page find their familiar cards in the same positions.

**Alternative considered:** Placing Rules after Commands (since both are instruction-providing types). Rejected because it breaks positional familiarity for existing users.

---

## Responsive Behavior

### Desktop (1200px+)
- Card spans full content width (max 960px centered)
- Conditional badge and "View Details" both visible inline
- Full glob patterns shown in description line (up to 2 patterns before truncation)

### Laptop (768px - 1199px)
- Same layout as desktop
- Glob patterns may truncate earlier due to narrower card width
- Single pattern truncates at ~50 chars; tooltip shows full value

### Tablet (600px - 767px)
- "Conditional" badge text may be hidden; retain icon only (`pi pi-filter`)
- Glob pattern description truncates aggressively
- "View Details" button text hidden; icon only (`pi pi-eye`)

---

## Accessibility Notes

- Rule name used as accessible `aria-label` for each list item row
- Conditional badge includes `aria-label="Conditional rule — loads based on file paths"`
- Glob pattern text in description is not interactive; screen reader reads it as plain text
- "Show X more..." button includes `aria-expanded` attribute
- Empty state heading uses `role="status"` for screen reader announcement on load
- All keyboard navigation follows existing ConfigCard patterns (Tab, Enter/Space for View Details)

---

## Notes

### Design Decisions

1. **Relative path as name:** Rules do not have a `name` frontmatter field. The name is derived from the file path relative to the `rules/` directory (without the `.md` extension). This is consistent with how nested commands display namespaced paths. The full relative path is always shown — never just the filename — to prevent confusion when multiple rules share the same filename in different subdirectories.

2. **Conditional badge vs unconditional:** Rather than showing a badge only on conditional rules and nothing on unconditional ones, the description line always communicates loading behavior. Unconditional rules say "Loads always" explicitly. This makes the loading behavior comprehensible without requiring users to know what the absence of a badge means.

3. **Amber/gold for conditional indicator:** The existing color assignments are green (agents), blue (commands), teal (skills), orange (hooks), purple (MCP), red-orange (rules). Amber (`#F59E0B`) was chosen for the conditional indicator because it reads as "caution/qualifier" — it does not belong to any config type, and it is close enough to yellow to feel informational rather than alarming.

4. **Glob patterns in description:** Up to 2 patterns are shown in the description line before truncating with "(+N more)". Showing zero would be unhelpful. Showing all could make the description line wrap to multiple lines and break the clean list layout. The 2-pattern limit balances informativeness with visual compactness.

### Open Questions

1. Should rules be sorted alphabetically by name, or grouped by directory (all `frontend/*` together)?
2. Should we display a folder tree grouping (collapsible `frontend/` header with nested items)?
3. If a rule file has a `description` frontmatter field, should we show that instead of the loading-behavior text?
