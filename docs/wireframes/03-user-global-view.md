# User/Global View Wireframe

## Overview
The User/Global View displays user-level configurations that apply across all Claude Code projects. This view mirrors the Project Detail View structure but shows configurations from the user's home directory (`~/.claude/`) instead of a specific project. Users access this view via the "User" button in the header.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [← Back]  Dashboard / User Configurations        [🔍 Search]  [•User]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ USER INFO BAR                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 👤 User Configurations                                                  │ │
│ │ ~/.claude/ • Applies to all projects                                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ CONTENT AREA (Scrollable)                                                   │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ 🤖 User Subagents (5)                                    [Expand All]    ││
│ ├──────────────────────────────────────────────────────────────────────────┤│
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ project-manager                                      [View Details]│  ││
│ │  │ Oversees project planning and coordination                        │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ code-reviewer                                        [View Details]│  ││
│ │  │ Reviews code for quality and best practices                       │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ documentation-writer                                 [View Details]│  ││
│ │  │ Creates comprehensive documentation                               │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  [Show 2 more...]                                                        ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ ⚡ User Slash Commands (8)                               [Expand All]    ││
│ ├──────────────────────────────────────────────────────────────────────────┤│
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ /summarize                                           [View Details]│  ││
│ │  │ Create a summary of the current conversation                      │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ /explain                                             [View Details]│  ││
│ │  │ Provide detailed explanations of code or concepts                 │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  [Show 6 more...]                                                        ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ 🪝 User Hooks (3)                                        [Expand All]    ││
│ ├──────────────────────────────────────────────────────────────────────────┤│
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ global-lint                                          [View Details]│  ││
│ │  │ Event: beforeWrite • Pattern: **/*.{js,ts,vue}                    │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ auto-format                                          [View Details]│  ││
│ │  │ Event: afterWrite • Pattern: **/*                                 │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  [Show 1 more...]                                                        ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ 🔌 User MCP Servers (2)                                  [Expand All]    ││
│ ├──────────────────────────────────────────────────────────────────────────┤│
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ brave-search                                         [View Details]│  ││
│ │  │ Transport: stdio • Command: npx @modelcontextprotocol/server-...  │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  ┌───────────────────────────────────────────────────────────────────┐  ││
│ │  │ github                                               [View Details]│  ││
│ │  │ Transport: stdio • Command: npx @modelcontextprotocol/server-...  │  ││
│ │  └───────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### Header (Breadcrumb Navigation)
- **Component:** PrimeVue `Toolbar`
- **Left:**
  - Back button (returns to Dashboard)
  - Breadcrumb: "Dashboard / User Configurations"
- **Right:**
  - Global search
  - User button (HIGHLIGHTED/ACTIVE state)

### User Info Bar
- **Component:** PrimeVue `Card` (compact)
- **Content:**
  - User icon + "User Configurations" title
  - Path: "~/.claude/"
  - Subtitle: "Applies to all projects"
  - Optional: Visual indicator (badge/chip) that distinguishes this from project view

### Configuration Cards (Identical Structure to Project View)
- Same six cards: Subagents, Commands, Skills, Hooks, MCP, Rules
- Same layout and interaction patterns
- Same PrimeVue components

## Data Flow

### API Endpoints Used
- `GET /api/user/agents` - Fetch user subagents
- `GET /api/user/commands` - Fetch user commands
- `GET /api/user/hooks` - Fetch user hooks
- `GET /api/user/mcp` - Fetch user MCP servers
- `GET /api/user/rules` - Fetch user rules

### Data Structure Expected
Same structure as project-level endpoints, but sourced from `~/.claude/` directory.

## Interactions

### User Actions

1. **Click "Back" Button:**
   - Return to Dashboard View
   - Preserve dashboard state

2. **Click "View Details":**
   - Open detail modal/sidebar (same as project view)
   - Display full configuration content
   - Syntax highlighting

3. **All Other Interactions:**
   - Identical to Project Detail View (wireframe 02)
   - Expand/collapse
   - Search
   - Show more
   - Copy to clipboard

### Loading States
- Same as Project Detail View
- Show skeleton cards during initial load

### Error States
- Missing ~/.claude/ directory: Show helpful message
- API errors: Display error with retry
- Empty configs: "No user [type] configured"

## Responsive Behavior
- Identical to Project Detail View (wireframe 02)
- Same breakpoints and adaptations

## Dark Mode Colors
- Identical color scheme to Project Detail View
- Use same color palette for consistency

### Visual Differentiation
To distinguish User view from Project view:
- **Info Bar Background:** `#2a1a4a` (subtle purple tint)
- **Info Bar Border:** `#4a3a6a` (purple accent)
- **User Icon Color:** `#9C27B0` (purple - matches MCP icon color)
- **Breadcrumb "User Configurations":** `#9C27B0` (purple text)

## Accessibility Notes
- Same accessibility standards as Project Detail View
- Clear indication in breadcrumb that user is in "User" context
- Screen reader announces "User configurations view" on page load

## Notes

### Design Decisions

1. **Mirror Project View Structure:**
   - Users already familiar with project view layout
   - Consistent navigation patterns
   - Same card structure reduces learning curve

2. **Visual Differentiation:**
   - Purple accent color distinguishes user view from project view
   - Info bar clearly states "Applies to all projects"
   - Active state on User button in header

3. **Same Interaction Patterns:**
   - No need to learn new interactions
   - Same expand/collapse, search, detail view behaviors
   - Consistency is key to good UX

4. **Prominent Access:**
   - User button always visible in header
   - One click from any view (Dashboard or Project Detail)
   - Encourages users to explore user-level configs

### Comparison: User View vs Project View

| Aspect | Project View | User View |
|--------|--------------|-----------|
| **Data Source** | `.claude/` in project dir | `~/.claude/` |
| **Scope** | Single project | All projects |
| **Visual Accent** | Blue (default) | Purple |
| **Info Bar Title** | Project name | "User Configurations" |
| **Breadcrumb** | Dashboard / Project Name | Dashboard / User Configurations |
| **Layout** | Same 6 cards | Same 6 cards |
| **Interactions** | Identical | Identical |

### Open Questions for Project Manager

1. Should we add an indicator showing which user configs are "active" for the currently selected project?
2. Should we provide a way to compare user configs vs project configs side-by-side?
3. Should we show inheritance/override information (e.g., "This project overrides user config X")?
4. Should we add a quick link to switch between User view and most recently viewed Project view?

### Implementation Notes for Frontend Developer

- Reuse `ConfigCard.vue` component from Project Detail View
- Create separate route `/user` or `/global`
- Use same API service functions with different endpoints
- Apply purple theme via scoped CSS or component prop
- Consider creating `BaseDetailView.vue` that both Project and User views extend
- Maintain same state management patterns
- Ensure User button in header shows active/highlighted state when on User view
