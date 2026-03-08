# Rules Feature - Design Decision Notes

## Overview
Design decisions and rationale for integrating Rules as the 6th configuration type in the Claude Code Config Manager.

---

## Icon Choice

**Selected:** `pi pi-book` (PrimeIcons book icon)

**Rationale:**
- Rules provide instructions and guidelines — a "book" metaphor fits naturally
- Visually distinct from existing icons: `pi pi-users` (agents), `pi pi-bolt` (commands), `pi pi-star` (skills), `pi pi-link` (hooks), `pi pi-server` (MCP)
- Simple, recognizable at small sizes
- Available in PrimeIcons library (no custom SVG needed)

**Alternatives considered:**
- `pi pi-file` — too generic, could be confused with any file-based config
- `pi pi-list` — implies a simple list, not instructions
- `pi pi-pencil` — implies editing, not reading/instructions
- `pi pi-bookmark` — too similar to browser bookmarks conceptually
- `pi pi-align-left` — too abstract

---

## Color Choice

**Selected:** Red-orange `#E53E3E`

**Existing color assignments:**
| Config Type | Color | Hex |
|-------------|-------|-----|
| Agents | Green | `#4CAF50` |
| Commands | Blue | `#2196F3` |
| Skills | Teal | `#14B8A6` |
| Hooks | Orange | `#FF9800` |
| MCP Servers | Purple | `#9C27B0` |
| **Rules** | **Red-orange** | **`#E53E3E`** |

**Rationale:**
- Red-orange is distinct from all existing colors in both light and dark modes
- Warm tone is consistent with the "instructional" nature of rules
- Sufficient contrast against both dark (`#1e1e1e`) and light backgrounds
- WCAG AA compliant for text and icon usage

**Alternatives considered:**
- Pink (`#EC4899`) — could work but feels too playful for "rules/instructions"
- Yellow (`#EAB308`) — poor contrast on light backgrounds, conflicts with conditional badge amber
- Indigo (`#6366F1`) — too close to purple (MCP) and blue (commands)
- Rose (`#F43F5E`) — too close to error/danger states in PrimeVue

---

## Conditional Rules Visual Indicator

### Design Decision
Conditional rules (those with `paths` frontmatter) are visually distinguished from unconditional rules at the list level using two mechanisms:

1. **Badge:** A small diamond icon (`pi pi-filter`) + "Conditional" text, displayed as an outlined PrimeVue `Tag` in amber/gold (`#F59E0B`)
2. **Description line:** Shows "Loads when: [patterns]" for conditional, "Loads always" for unconditional

### Rationale
- Users need to understand loading behavior at a glance without opening the sidebar
- The badge provides a scannable visual marker when browsing a list of rules
- The description text provides the actual patterns for context
- Amber/gold is deliberately different from the Rules icon color (red-orange) to avoid confusion — it indicates a property of the rule, not the rule type itself

### Why Not Just Color the Name?
- Color-coding the name would reduce accessibility (color-only distinction)
- A badge is more explicit and works alongside screen readers
- The badge pattern is already used elsewhere in PrimeVue UIs

---

## Nested Path Display

### Design Decision
Rules display their full relative path as the name (e.g., `frontend/react` not just `react`).

### Rationale
- Rules support nested subdirectories for organization
- Two rules could have the same filename in different directories (e.g., `frontend/conventions.md` and `backend/conventions.md`)
- Showing only the filename would create ambiguity
- This is consistent with how Commands handle namespaced paths

### Truncation Strategy
- **Short paths (< 40 chars):** Display in full
- **Long paths (>= 40 chars):** Truncate with ellipsis, show full path in tooltip
- Example: `backend/services/database/...` with tooltip `backend/services/database/query-patterns`

### Sorting
- Rules are sorted alphabetically by full relative path
- This naturally groups rules in the same subdirectory together
- Example order: `backend/api`, `backend/database`, `coding-standards`, `frontend/react`, `frontend/vue`, `testing`

---

## Card Placement

### Design Decision
The Rules card is placed last (6th position) in the project detail view.

### Order
1. Subagents
2. Slash Commands
3. Skills
4. Hooks
5. MCP Servers
6. Rules (NEW)

### Rationale
- Preserves existing visual positions — users who already use the tool find their familiar cards unchanged
- Rules are a newer feature type that users may not have yet
- Bottom placement means the card is hidden below the fold for projects with many configs, reducing noise for users who don't use rules

### Alternative Considered
Placing Rules after Skills (position 4) since both are instruction/context-providing types. Rejected because it would push Hooks and MCP down, disrupting muscle memory for existing users.

---

## Unique UI Considerations for Rules

### 1. Path Patterns Section in Sidebar
Unlike agents (tools, model, color), commands (allowed-tools, arguments), or skills (file trees), rules have a unique **Path Patterns** section showing glob patterns. This section:
- Only appears for conditional rules
- Uses monospace code styling for pattern display
- Is editable (add/remove/modify patterns)
- Is positioned prominently above the content, since the paths define *when* the rule applies

### 2. No Complex Frontmatter
Rules have minimal frontmatter (only `paths`). Unlike agents with 5+ frontmatter fields, the YAML Frontmatter collapsible section will often be very small or empty. The sidebar design de-emphasizes this section and promotes the Path Patterns section and Markdown Content section instead.

### 3. No Execution Context
Rules are purely instructional — they don't execute, they don't take arguments, they don't have tools. The sidebar therefore has no "execution" or "capabilities" metadata section. The content section is the primary focus.

### 4. Copy Behavior
When copying rules between projects:
- Directory structure is preserved (a rule at `frontend/react.md` copies to `target/.claude/rules/frontend/react.md`)
- Conflict detection uses the full relative path (not just filename)
- Rename strategy appends suffix before extension: `frontend/react-copy.md`

---

## Dark Mode / Light Mode

### Dark Mode Colors
```
Card background:     #1e1e1e
Card border:         #3e3e3e
Card header bg:      #252525
Rules icon:          #E53E3E (red-orange)
Conditional badge:   #F59E0B (amber, outlined)
Name text:           #e0e0e0
Description text:    #a0a0a0
Glob pattern code:   #e0e0e0 on #1a1a1a
```

### Light Mode Colors
```
Card background:     #ffffff
Card border:         #e2e8f0
Card header bg:      #f8fafc
Rules icon:          #E53E3E (red-orange, same)
Conditional badge:   #D97706 (darker amber for light bg)
Name text:           #1a202c
Description text:    #718096
Glob pattern code:   #1a202c on #f1f5f9
```

---

## Summary

| Decision | Choice | Key Reason |
|----------|--------|------------|
| Icon | `pi pi-book` | "Instructions" metaphor, visually distinct |
| Color | `#E53E3E` (red-orange) | No conflicts, WCAG compliant |
| Conditional indicator | Amber badge + description text | Scannable, accessible, informative |
| Name display | Full relative path | Handles subdirectory collisions |
| Card position | 6th (last) | Preserves existing layout stability |
| Path patterns section | Prominent, above content | Unique to rules, defines loading behavior |
