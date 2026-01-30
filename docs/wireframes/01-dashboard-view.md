# Dashboard View Wireframe

## Overview
The Dashboard View is the entry point of the application. It displays all discovered Claude Code projects and provides access to user/global configurations. Users can search, filter, and select projects to view their detailed configurations.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Claude Icon] Claude Code Config Manager          [🔍 Search]  [Rescan] [User] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CONTENT AREA                                                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │ Projects                                        [Filter ▼] [⟳]  │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────────┐            │
│  │ 📁 Project Name            │  │ 📁 Another Project         │            │
│  │                            │  │                            │            │
│  │ /home/user/projects/name   │  │ /home/user/projects/other  │            │
│  │                            │  │                            │            │
│  │ 🤖 3 Agents  ⚡ 5 Commands │  │ 🤖 1 Agent   ⚡ 8 Commands │            │
│  │ 🪝 2 Hooks   🔌 1 MCP      │  │ 🪝 0 Hooks   🔌 0 MCP      │            │
│  │                            │  │                            │            │
│  │            [View →]        │  │            [View →]        │            │
│  └────────────────────────────┘  └────────────────────────────┘            │
│                                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────────┐            │
│  │ 📁 Third Project           │  │ 📁 Fourth Project          │            │
│  │                            │  │                            │            │
│  │ /home/user/code/project3   │  │ /opt/projects/app          │            │
│  │                            │  │                            │            │
│  │ 🤖 0 Agents  ⚡ 2 Commands │  │ 🤖 5 Agents  ⚡ 12 Commands│            │
│  │ 🪝 1 Hook    🔌 2 MCP      │  │ 🪝 3 Hooks   🔌 1 MCP      │            │
│  │                            │  │                            │            │
│  │            [View →]        │  │            [View →]        │            │
│  └────────────────────────────┘  └────────────────────────────┘            │
│                                                                              │
│  [Load More...]                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### Header (Toolbar Component)
- **Component:** PrimeVue `Toolbar`
- **Content:**
  - Left: Application logo/icon + "Claude Code Config Manager" title
  - Center: Global search bar (PrimeVue `InputText` with icon)
  - Right:
    - Rescan button (PrimeVue `Button` - icon only with tooltip)
    - User/Global config button (PrimeVue `Button` - icon only with tooltip)

### Project Grid
- **Component:** PrimeVue `DataView` in grid mode
- **Layout:** Responsive grid (2-4 columns depending on screen width)
- **Card Component:** PrimeVue `Card` for each project

### Project Card Structure
Each card displays:
- **Header:** Project name (directory name)
- **Subheader:** Full file path (smaller, muted text)
- **Body:**
  - Statistics in 2x2 grid:
    - Agents count with icon
    - Commands count with icon
    - Hooks count with icon
    - MCP servers count with icon
- **Footer:** "View →" button (PrimeVue `Button`)

### Filter/Sort Controls
- **Component:** PrimeVue `Dropdown` for sorting/filtering
- **Options:**
  - Sort by name (A-Z)
  - Sort by name (Z-A)
  - Sort by most agents
  - Sort by most commands
  - Filter: Show only projects with agents
  - Filter: Show only projects with commands

## Data Flow

### API Endpoints Used
- `GET /api/projects` - Fetch all discovered projects
- `POST /api/projects/scan` - Trigger rescan of projects

### Data Structure Expected
```json
{
  "projects": [
    {
      "id": "homeuserprojectsname",
      "name": "Project Name",
      "path": "/home/user/projects/name",
      "exists": true,
      "stats": {
        "agents": 3,
        "commands": 5,
        "hooks": 2,
        "mcp": 1
      }
    }
  ]
}
```

## Interactions

### User Actions
1. **Click Project Card:** Navigate to Project Detail View
2. **Click Rescan Button:**
   - Show loading indicator
   - POST to `/api/projects/scan`
   - Reload project list
   - Show toast notification "Projects rescanned"
3. **Click User/Global Button:** Navigate to User/Global View
4. **Search in Header:** Filter projects by name/path in real-time (client-side)
5. **Change Sort/Filter:** Reorder/filter project cards
6. **Hover Project Card:** Subtle elevation change (shadow increase)

### Loading States
- Initial page load: Show skeleton cards (PrimeVue `Skeleton`)
- Rescan operation: Show progress spinner on rescan button
- Empty state: Show message "No projects found. Add projects in Claude Code and rescan."

### Error States
- API error: Show error message with retry button
- Missing ~/.claude.json: Show help message with instructions

## Responsive Behavior

### Desktop (1200px+)
- 3-4 project cards per row
- Full header with all buttons visible
- Generous spacing between cards

### Laptop (768px - 1199px)
- 2-3 project cards per row
- Condensed header
- Moderate spacing

### Tablet (600px - 767px)
- 2 project cards per row
- Compact header
- Reduced spacing

### Mobile (< 600px) [Low priority for Phase 1]
- 1 project card per row
- Hamburger menu for header actions
- Minimal spacing

## Color Specifications

**Reference:** See `/docs/wireframes/06-dark-mode-palette.md` and `/docs/wireframes/06-light-mode-palette.md` for complete color definitions.

### Project Cards
- **Background:** `var(--bg-secondary)`
- **Border:** `var(--border-primary)`
- **Hover Background:** `var(--bg-hover)`
- **Shadow:** `var(--shadow-card)` / `var(--shadow-card-hover)` on hover

### Header
- **Background:** `var(--bg-header)`
- **Border Bottom:** `var(--border-primary)`

### Text
- **Primary Text:** `var(--text-primary)` - project names
- **Secondary Text:** `var(--text-secondary)` - file paths and labels
- **Muted Text:** `var(--text-muted)` - less important info

### Statistics Icons
- **Agents:** `var(--color-agents)` - green
- **Commands:** `var(--color-commands)` - blue
- **Hooks:** `var(--color-hooks)` - orange
- **MCP:** `var(--color-mcp)` - purple

### Buttons
- **Primary Button:** `var(--color-primary)` / `var(--color-primary-hover)` on hover
- **Icon Buttons:** `var(--text-secondary)` with `var(--text-primary)` on hover

### Accents
- **Link Color:** `var(--color-link)`
- **Success:** `var(--color-success)`
- **Warning:** `var(--color-warning)`
- **Error:** `var(--color-error)`

### CSS Implementation Example
```css
.project-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
  transition: all 200ms ease;
}

.project-card:hover {
  background-color: var(--bg-hover);
  box-shadow: var(--shadow-card-hover);
}

.project-name {
  color: var(--text-emphasis);
  font-weight: 600;
}

.project-path {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.stat-agents .icon {
  color: var(--color-agents);
}

.stat-commands .icon {
  color: var(--color-commands);
}

.stat-hooks .icon {
  color: var(--color-hooks);
}

.stat-mcp .icon {
  color: var(--color-mcp);
}
```

## Accessibility Notes

- All interactive elements keyboard accessible
- Focus indicators clearly visible: `var(--border-focus)` outline
- ARIA labels for icon-only buttons
- Screen reader announcements for rescan completion
- Sufficient color contrast (WCAG AA minimum)
- Skip to main content link

## Notes

### Design Decisions
- **Grid Layout:** Chose DataView over manual grid for built-in responsiveness and loading states
- **Card-Based:** Each project is a distinct, clickable card for clear visual hierarchy
- **Statistics Upfront:** Show counts on dashboard to help users decide which project to explore
- **Minimal Actions:** Only "View" action per project - keeps interface clean

### Open Questions for Project Manager
1. Should we show last modified date for projects?
2. Should we support multi-select for batch operations in future?
3. Should we persist sort/filter preferences in localStorage?
4. Should we show project status indicators (e.g., "git repo", "active", etc.)?

### Implementation Notes for Frontend Developer
- Use PrimeVue's built-in dark theme ("lara-dark-blue") or light theme ("lara-light-blue")
- Implement CSS custom properties from palette documents for easy theme switching
- Implement client-side search/filter for instant feedback
- Cache project list in component state to avoid repeated API calls
- Consider virtual scrolling if user has 50+ projects
- Add debouncing to search input (300ms)
