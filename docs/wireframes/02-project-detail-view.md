# Project Detail View Wireframe

## Overview
The Project Detail View displays all configurations for a single Claude Code project. This is the core view of the application where users can see subagents, slash commands, skills, hooks, MCP servers, and rules for a specific project. **Critical:** All six config types are displayed on ONE page using cards - NO tabs.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [← Back]  Dashboard / Project Name               [🔍 Search]  [User]   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PROJECT INFO BAR                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📁 Project Name                                                         │ │
│ │ /home/user/projects/name                                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ CONTENT AREA (Scrollable)                                                   │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ 🤖 Subagents (3)                                         [Expand All]    ││
│ ├──────────────────────────────────────────────────────────────────────────┤│
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ backend-developer                                    [View Details]│  ││
│ │  │ Backend API development specialist                                │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ frontend-developer                                   [View Details]│  ││
│ │  │ Vue.js frontend development specialist                            │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ tester                                               [View Details]│  ││
│ │  │ Testing and quality assurance specialist                          │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ ⚡ Slash Commands (5)                                    [Expand All]    ││
│ ├──────────────────────────────────────────────────────────────────────────┤│
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ /api-spec                                            [View Details]│  ││
│ │  │ Generate API endpoint specifications                              │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ /test                                                [View Details]│  ││
│ │  │ Generate test cases for components                                │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  [Show 3 more...]                                                        ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ 🪝 Hooks (2)                                             [Expand All]    ││
│ ├──────────────────────────────────────────────────────────────────────────┤│
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ pre-commit                                           [View Details]│  ││
│ │  │ Event: beforeWrite • Pattern: **/*.js                             │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ post-test                                            [View Details]│  ││
│ │  │ Event: afterCommand • Pattern: /test                              │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ 🔌 MCP Servers (1)                                       [Expand All]    ││
│ ├──────────────────────────────────────────────────────────────────────────┤│
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ filesystem                                           [View Details]│  ││
│ │  │ Transport: stdio • Command: npx @modelcontextprotocol/server-...  │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ 📋 Rules (5)                                                [Expand All]││
│ ├──────────────────────────────────────────────────────────────────────────┤│
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ coding-standards                                    [View Details]│  ││
│ │  │ Loads always • No path restrictions                              │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ frontend/react                          ◆ Conditional [View Details] ││
│ │  │ Loads when: src/**/*.tsx, src/**/*.jsx                           │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  [Show 3 more...]                                                       ││
│ │                                                                          ││
│ │  Empty state: "No rules configured"                                     ││
│ │  Help text: "Add .md files to .claude/rules/ to define project rules"   ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ [Empty state if no configs found: "No configurations found"]                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### Header (Breadcrumb Navigation)
- **Component:** PrimeVue `Toolbar`
- **Left:**
  - Back button (PrimeVue `Button` - icon with text)
  - Breadcrumb navigation (PrimeVue `Breadcrumb`)
    - "Dashboard" (clickable)
    - "/" separator
    - "Project Name" (current, not clickable)
- **Right:**
  - Global search (PrimeVue `InputText`)
  - User/Global config button (PrimeVue `Button`)

### Project Info Bar
- **Component:** PrimeVue `Card` (compact, no padding)
- **Content:**
  - Project name (large text)
  - Full file path (smaller, muted)
  - Optional: Quick stats summary

### Configuration Cards (All 6 on One Page)
- **Container:** Stacked vertically with spacing
- **Component:** PrimeVue `Card` for each config type
- **Order:** Subagents, Slash Commands, Skills, Hooks, MCP Servers, Rules

#### Card Structure (Same for All Types)
- **Header:**
  - Icon + Config Type Name + Count
  - "Expand All" button (right-aligned)
- **Body:**
  - List of items (PrimeVue `DataView` in list mode)
  - Each item shows:
    - Name/Title (bold)
    - Description/Summary (one line)
    - "View Details" button (right-aligned)
  - Initially show 3-5 items
  - "Show X more..." button if more items exist
- **Footer:** Optional - depends on item count

### Item List Row
- **Component:** Custom div styled as a list item
- **Layout:**
  - Left: Name + description stacked
  - Right: "View Details" button
  - Hover state: Subtle background change

## Data Flow

### API Endpoints Used
- `GET /api/projects/:projectId/agents` - Fetch project subagents
- `GET /api/projects/:projectId/commands` - Fetch project commands
- `GET /api/projects/:projectId/hooks` - Fetch project hooks
- `GET /api/projects/:projectId/mcp` - Fetch project MCP servers
- `GET /api/projects/:projectId/rules` - Fetch project rules

### Data Structure Expected

#### Subagents
```json
{
  "agents": [
    {
      "name": "backend-developer",
      "description": "Backend API development specialist",
      "filePath": ".claude/agents/backend-developer.md",
      "frontmatter": { /* YAML data */ },
      "content": "Full markdown content..."
    }
  ]
}
```

#### Commands
```json
{
  "commands": [
    {
      "name": "/api-spec",
      "description": "Generate API endpoint specifications",
      "filePath": ".claude/commands/api-spec.md",
      "namespace": null,
      "content": "Full markdown content..."
    }
  ]
}
```

#### Hooks
```json
{
  "hooks": [
    {
      "name": "pre-commit",
      "event": "beforeWrite",
      "pattern": "**/*.js",
      "command": "/lint",
      "source": "settings.json"
    }
  ]
}
```

#### MCP Servers
```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/path"],
      "source": ".mcp.json"
    }
  ]
}
```

#### Rules
```json
{
  "rules": [
    {
      "name": "frontend/react",
      "description": "React Component Rules",
      "paths": ["src/**/*.tsx", "src/**/*.jsx"],
      "isConditional": true,
      "content": "Full markdown content...",
      "filePath": ".claude/rules/frontend/react.md",
      "scope": "project"
    }
  ]
}
```

## Interactions

### User Actions

1. **Click "Back" Button:**
   - Navigate to Dashboard View
   - Preserve any search/filter state on dashboard

2. **Click "View Details" on Item:**
   - Open detail modal/sidebar (see wireframe 04)
   - Display full content (YAML frontmatter + markdown body)
   - Provide syntax highlighting
   - Allow copy-to-clipboard

3. **Click "Expand All":**
   - Toggle all items in that card between collapsed/expanded
   - Button text changes to "Collapse All"
   - Smoothly animate expansion

4. **Click "Show X more...":**
   - Expand card to show all items
   - Button disappears after expansion
   - Scroll to newly revealed items

5. **Search in Header:**
   - Filter items across all cards
   - Highlight matching text
   - Show count of matches per card
   - Clear search with X button

6. **Hover Item Row:**
   - Background color subtle change
   - Cursor changes to pointer
   - "View Details" button becomes more prominent

### Loading States
- Initial load: Show skeleton for each card
- Individual card loading: Show spinner in card header
- Empty cards: Show message "No [type] configured"

### Error States
- API error: Show error message in card body with retry button
- Missing files: Show warning icon with tooltip
- Parse errors: Show error indicator with details

## Responsive Behavior

### Desktop (1200px+)
- Full-width cards with max-width constraint (960px centered)
- Comfortable padding and spacing
- All actions visible

### Laptop (768px - 1199px)
- Cards span full width minus margins
- Condensed padding
- All features remain accessible

### Tablet (600px - 767px)
- Cards span full width
- Item descriptions may truncate
- "View Details" button remains visible

### Mobile (< 600px) [Low priority]
- Single column layout
- Compact cards
- Item descriptions truncate earlier
- Consider accordion-style collapse for cards

## Dark Mode Colors

### Cards
- **Background:** `#1e1e1e` (dark gray)
- **Border:** `#3e3e3e` (medium gray)
- **Header Background:** `#252525` (slightly lighter than body)

### Item Rows
- **Background:** `#1e1e1e` (same as card)
- **Hover Background:** `#2a2a2a` (lighter)
- **Border Between Items:** `#2e2e2e` (subtle divider)

### Text
- **Item Name:** `#e0e0e0` (light gray - primary)
- **Item Description:** `#a0a0a0` (medium gray - secondary)
- **Section Headers:** `#ffffff` (white - emphasis)
- **Counts:** `#64B5F6` (light blue - accent)

### Buttons
- **"View Details":** Ghost button style with `#007ad9` text
- **"View Details" Hover:** Filled with `#007ad9` background
- **"Expand All":** Text button with `#a0a0a0` color

### Icons
- Use same colors as Dashboard (green, blue, orange, purple)

### Empty States
- **Text:** `#707070` (darker gray - muted)
- **Icon:** `#505050` (even darker - subtle)

## Accessibility Notes

- Keyboard navigation through all items
- Arrow keys to navigate between items
- Enter/Space to activate "View Details"
- Skip links to jump between card sections
- ARIA labels for all interactive elements
- Focus trap in detail modal/sidebar when open
- Screen reader announces item count in each section

## Notes

### Design Decisions

1. **All Cards on One Page:**
   - NO tabs - requirement explicitly states card-based single-page layout
   - Users can see everything at a glance
   - Scroll is preferable to tab-switching for this use case
   - Faster to scan all config types simultaneously

2. **Collapsed by Default:**
   - Show only 3-5 items per card initially
   - Keeps page manageable for projects with many configs
   - "Expand All" and "Show more" provide access to full lists

3. **Consistent Card Structure:**
   - All four card types use same layout pattern
   - Reduces cognitive load
   - Easier to implement and maintain

4. **Rules Card Placement:**
   - Rules card placed 6th (last) to preserve existing layout stability
   - Existing users find their familiar cards in the same positions
   - Rules items show full relative path as name (e.g., `frontend/react`) to handle subdirectory collisions
   - Conditional rules display an amber "Conditional" badge with glob patterns

5. **"View Details" Button:**
   - Explicit call-to-action for each item
   - Clearer than implicit "click anywhere" interaction
   - Better for accessibility and mobile

### Open Questions for Project Manager

1. Should we show file paths for each config item?
2. Should we add "Quick Actions" menu for future phases (edit, delete, duplicate)?
3. Should we persist expanded/collapsed state in localStorage?
4. Should we show indicators for "user-level" vs "project-level" configs when both exist?
5. Should we add tags or categories to filter within each card?

### Implementation Notes for Frontend Developer

- Use Vue 3 Composition API for cleaner state management
- Create reusable `ConfigCard.vue` component that accepts:
  - Title, icon, data array, item template slot
- Implement virtual scrolling for cards with 50+ items
- Debounce search input (300ms)
- Cache API responses in component state
- Consider using Vue Router query params for deep linking to specific cards
- Use PrimeVue's `ScrollTop` component for long pages
- Implement smooth scroll when "Show more" is clicked
