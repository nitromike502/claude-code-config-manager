# Rules Dashboard Integration Wireframe

## Overview
This wireframe shows how Rules count integrates into the existing dashboard project cards and the User/Global view. Rules are added as a 6th configuration type alongside Agents, Commands, Skills, Hooks, and MCP.

---

## ProjectCard Stats Update

### Current Layout (Before Rules)

```
┌──────────────────────────────────────────────────────┐
│ 📁 My Project                                        │
│ /home/user/projects/my-project                       │
│                                                      │
│  🤖 3 Agents    ⚡ 5 Commands    🎯 2 Skills         │
│  🪝 2 Hooks     🔌 1 MCP                             │
│                                                      │
│                                         [View →]     │
└──────────────────────────────────────────────────────┘
```

### Updated Layout (With Rules)

```
┌──────────────────────────────────────────────────────┐
│ 📁 My Project                                        │
│ /home/user/projects/my-project                       │
│                                                      │
│  🤖 3 Agents    ⚡ 5 Commands    🎯 2 Skills         │
│  🪝 2 Hooks     🔌 1 MCP        📋 4 Rules           │
│                                                      │
│                                         [View →]     │
└──────────────────────────────────────────────────────┘
```

### Stats Grid Layout

The stats area uses a responsive grid:
- **Desktop (3 columns):** 3 stats per row, 2 rows
- **Tablet (2 columns):** 2 stats per row, 3 rows
- **Mobile (1 column):** 1 stat per row, 6 rows

```
Desktop (1200px+):
┌─────────────┬─────────────┬─────────────┐
│ 🤖 3 Agents │ ⚡ 5 Commands│ 🎯 2 Skills │
├─────────────┼─────────────┼─────────────┤
│ 🪝 2 Hooks  │ 🔌 1 MCP    │ 📋 4 Rules  │
└─────────────┴─────────────┴─────────────┘

Tablet (768px - 1199px):
┌─────────────┬─────────────┐
│ 🤖 3 Agents │ ⚡ 5 Commands│
├─────────────┼─────────────┤
│ 🎯 2 Skills │ 🪝 2 Hooks  │
├─────────────┼─────────────┤
│ 🔌 1 MCP    │ 📋 4 Rules  │
└─────────────┴─────────────┘
```

### Zero Rules Display

When a project has no rules, the stat still appears but with count 0:

```
│  🪝 2 Hooks     🔌 1 MCP        📋 0 Rules           │
```

The "0 Rules" text uses `var(--text-muted)` to de-emphasize empty types.

---

## User/Global View Integration

### Card Order in User/Global View

```
Page (scrollable)
├── User Info Bar
│   ┌─────────────────────────────────────────────┐
│   │ 👤 User Configurations                       │
│   │ ~/.claude/                                   │
│   └─────────────────────────────────────────────┘
│
├── Subagents card         (~/.claude/agents/)
├── Slash Commands card    (~/.claude/commands/)
├── Skills card            (~/.claude/skills/)
├── Hooks card             (~/.claude/settings.json → hooks)
├── MCP Servers card       (~/.claude/settings.json → mcpServers)
└── Rules card             (~/.claude/rules/)       ← NEW
```

### User-Level Rules Card

Same layout as project-level Rules Config Card:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📋 Rules (3)                                                  [Expand All]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ personal-preferences                                [View Details]   │    │
│  │ Loads always • No path restrictions                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ code-quality                                        [View Details]   │    │
│  │ Loads always • No path restrictions                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ typescript-strict               ◆ Conditional       [View Details]   │    │
│  │ Loads when: **/*.ts, **/*.tsx                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## API Data Flow

### ProjectCard Stats

The dashboard fetches project config counts. Rules count needs to be added:

**Current response:**
```json
{
  "stats": {
    "agents": 3,
    "commands": 5,
    "skills": 2,
    "hooks": 2,
    "mcp": 1
  }
}
```

**Updated response:**
```json
{
  "stats": {
    "agents": 3,
    "commands": 5,
    "skills": 2,
    "hooks": 2,
    "mcp": 1,
    "rules": 4
  }
}
```

### User-Level Rules

**Endpoint:** `GET /api/user/rules`

**Response:**
```json
{
  "success": true,
  "rules": [
    {
      "name": "personal-preferences",
      "description": "Personal Preferences",
      "paths": null,
      "isConditional": false,
      "content": "# Personal Preferences\n...",
      "filePath": "/home/user/.claude/rules/personal-preferences.md",
      "scope": "user"
    }
  ],
  "warnings": []
}
```

---

## Sort Options Update

The dashboard sort dropdown should include Rules:

```
Sort by:
  Name (A-Z)
  Name (Z-A)
  Most Agents
  Most Commands
  Most Skills
  Most Hooks
  Most MCP Servers
  Most Rules          ← NEW
```

---

## Implementation Notes

### ProjectCard Component Changes
- Add `rules` to the stats interface
- Add Rules stat row with `pi pi-book` icon and `var(--color-rules)` color
- Update `getProjectConfigCounts()` in discovery service to include rules count

### Dashboard Store Changes
- Add rules count to project stats model
- Add "Most Rules" sort option

### Router Changes
- No route changes needed (Rules card is on existing project detail and user views)

### API Client Changes
- Add `fetchProjectRules(projectId)` method
- Add `fetchUserRules()` method
- Add rules to `fetchProjectConfigCounts()` response handling
