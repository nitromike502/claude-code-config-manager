# Product Requirements Document: Claude Code Manager - Phase 1 (MVP)

**Version:** 1.2
**Phase:** 1 - MVP (View-Only Navigation Interface)
**Last Updated:** 2025-10-25
**Status:** ✅ COMPLETE (100%)

---

## 1. Project Overview

**Project Name:** Claude Code Manager
**Phase 1 Goal:** Create a web-based interface to discover, navigate, and view Claude Code projects and their configurations (subagents, slash commands, hooks, and MCP servers).

**Deployment Model:**
- Local web server (Node.js + Express)
- Access via web browser at `http://localhost:8420`
- Runs on any machine with Node.js installed
- Cross-platform (Windows, Mac, Linux)

**Tech Stack:**
- Backend: Node.js + Express
- Frontend: Vue 3 + PrimeVue (CDN-hosted) for UI components
- Data Model: Live file system reads (no database)
- Authentication: None (local-only tool)

**Phase 1 Scope:** Read-only viewing interface. No editing, creation, or deletion capabilities.

---

## 2. Core Features (Phase 1 MVP)

### 2.1 Project Discovery

**Objective:** Automatically discover and list all Claude Code projects on the machine.

**Requirements:**
- Read project list from `~/.claude.json` (maintained by Claude Code)
- Parse JSON file to extract project paths from the `projects` object (paths are used as keys)
- Display discovered projects in a list/card view
- Show basic project information:
  - Project name (derived from directory name of the path)
  - Full file path
  - Count of agents/commands/hooks/MCP servers found (calculated by scanning each project)
- Manual rescan button to refresh project list (re-read `~/.claude.json`)
- Validate that project directories still exist
- Handle missing or invalid project paths gracefully

**UI Considerations:**
- Clean, simple project list
- Quick navigation to project details
- Visual indication of project status (valid/missing)
- Search/filter projects by name or path

**Status:** 📝 Ready for Review

---

### 2.2 Project Navigation

**Objective:** Navigate between projects and view their configurations.

**Requirements:**
- Click on a project to view its details
- Navigation structure:
  - Dashboard (project list)
  - Project detail view with cards for each section:
    - Subagents card
    - Slash Commands card
    - Hooks card
    - MCP Servers card
  - User/Global view (same card layout for user-level configs)

**UI Considerations:**
- Clear breadcrumb navigation
- Card-based layout for different config types (all visible on one page)
- Back button to return to dashboard
- Persistent navigation sidebar (optional)

**Note:** Wireframe mockup to be created before finalizing PRD to define element placement.

**Status:** 📝 Ready for Review

---

### 2.3 Subagent Viewing

**Objective:** View subagents configured at project and user levels.

#### Data to Display
**Project-Level:** Read from `.claude/agents/*.md`
**User-Level:** Read from `~/.claude/agents/*.md`

**Requirements:**
- Parse markdown files with YAML frontmatter
- Display basic list of subagents:
  - Name
  - Description
- Click to view full details (layout to be determined in wireframe)
- No editing capabilities

**UI Considerations:**
- Simple list within card
- Detail view/interaction to be defined in wireframe mockup

**Status:** 📝 Ready for Review

---

### 2.4 Slash Command Viewing

**Objective:** View slash commands at project and user levels.

#### Data to Display
**Project-Level:** Read from `.claude/commands/**/*.md`
**User-Level:** Read from `~/.claude/commands/**/*.md`

**Requirements:**
- Parse markdown files with optional YAML frontmatter
- Support nested directories (namespacing)
- Display basic list of commands:
  - Command name (derived from file path)
  - Description (from frontmatter or first line)
- Click to view full details (layout to be determined in wireframe)
- No editing capabilities

**UI Considerations:**
- Simple list within card
- Detail view/interaction to be defined in wireframe mockup

**Status:** 📝 Ready for Review

---

### 2.5 Hooks Viewing

**Objective:** View hook configurations at project and user levels.

#### Data to Display
**Project-Level:** Parse `.claude/settings.json` and `.claude/settings.local.json`
**User-Level:** Parse `~/.claude/settings.json`

**Requirements:**
- Extract `hooks` section from JSON settings files
- Display basic list of hooks:
  - Event type
  - Matcher pattern
- Click to view full details (layout to be determined in wireframe)
- No editing capabilities

**UI Considerations:**
- Simple list within card
- Detail view/interaction to be defined in wireframe mockup

**Status:** 📝 Ready for Review

---

### 2.6 MCP Server Viewing

**Objective:** View MCP server configurations at project and user levels.

#### Data to Display
**Project-Level:** Parse `.mcp.json` at project root
**User-Level:** Parse MCP servers from `~/.claude/settings.json`

**Requirements:**
- Parse `mcpServers` section from configuration files
- Display basic list of MCP servers:
  - Server name
  - Transport type (stdio / HTTP / SSE)
- Click to view full details (layout to be determined in wireframe)
- No editing capabilities

**UI Considerations:**
- Simple list within card
- Detail view/interaction to be defined in wireframe mockup

**Status:** 📝 Ready for Review

---

## 3. User Interface Design

**Key UI Principles:**
- Clean, minimal interface
- Fast navigation between projects
- Clear visual hierarchy
- Card-based layout for displaying config types
- Responsive design (works on laptop/desktop screens)

**UI Details:** To be defined in wireframe mockups before implementation.

**Status:** 📝 Ready for Review

---

## 4. Technical Architecture (Phase 1)

### 4.1 Backend Requirements

**Core Functionality:**
- Read project list from `~/.claude.json`
- Directory scanning within known projects for subagents/commands/hooks/MCP servers
- Markdown parser with YAML frontmatter support
- JSON parser for settings files
- REST API endpoints (read-only)

**API Endpoints:**
```
GET  /api/projects                              - List all projects
GET  /api/projects/:projectId/agents            - Get project subagents
GET  /api/projects/:projectId/commands          - Get project commands
GET  /api/projects/:projectId/hooks             - Get project hooks
GET  /api/projects/:projectId/mcp               - Get project MCP servers
GET  /api/user/agents                           - Get user subagents
GET  /api/user/commands                         - Get user commands
GET  /api/user/hooks                            - Get user hooks
GET  /api/user/mcp                              - Get user MCP servers
POST /api/projects/scan                         - Trigger project rescan
```

**Note:** projectId will be the project path with slashes removed (e.g., `/home/user/projects/myapp` becomes `homeuserprojectsmyapp`)

**Error Handling:**
- Graceful handling of missing files
- Parsing errors for malformed JSON/YAML
- Permission errors
- Return meaningful error messages to frontend

**Status:** 📝 Ready for Review

---

### 4.2 Frontend Requirements

**Core Functionality:**
- Single-page application (SPA) or multi-page app
- Routing between views
- API integration
- State management (simple, no complex state library needed for MVP)

**Key Features:**
- Responsive layout
- Loading states
- Error messages
- Search/filter functionality
- Syntax highlighting (using library like Prism.js or Highlight.js)
- Copy-to-clipboard functionality

**Technologies:**
- Vue 3 (CDN-hosted)
- PrimeVue (CDN-hosted) for UI components
- Fetch API for backend calls

**Status:** 📝 Ready for Review

---

## 5. Out of Scope (Phase 1)

**Explicitly NOT included in Phase 1:**
- ❌ Editing configurations
- ❌ Creating new agents/commands/hooks/MCP servers
- ❌ Deleting configurations
- ❌ Real-time file watching
- ❌ Configuration validation/linting
- ❌ Hook execution or testing
- ❌ MCP server health monitoring
- ❌ Export/import functionality
- ❌ Version control integration
- ❌ Authentication
- ❌ Multi-user support
- ❌ Database or caching

**These features will be considered for Phase 2 and beyond.**

---

## 6. Success Criteria (Phase 1)

Phase 1 MVP is successful when:

1. [ ] User can see all Claude Code projects on their machine
2. [ ] User can navigate to any project and see its configurations
3. [ ] User can view all subagents (project and user-level)
4. [ ] User can view all slash commands (project and user-level)
5. [ ] User can view all hooks (project, project-local, and user-level)
6. [ ] User can view all MCP servers (project, user, and enterprise-level)
7. [ ] User can search/filter within each configuration type
8. [ ] UI is clean, intuitive, and responsive
9. [ ] Application runs on Windows, Mac, and Linux
10. [ ] Application handles missing or malformed files gracefully

---

## 7. Decisions Made

- ✅ Manual rescan via button (no auto-refresh)
- ✅ Use PrimeVue built-in syntax highlighting
- ✅ Implement dark mode in Phase 1
- ✅ All files handled consistently regardless of size

---

## 8. Implementation Plan (Phase 1)

### Step 1: Project Setup
- Initialize Node.js project
- Set up Express server
- Create project directory structure
- Install dependencies (express, markdown parser, etc.)

### Step 2: Backend - File System & Parsing
- Implement project scanner (find `.claude/` directories)
- Create markdown parser with YAML frontmatter
- Create JSON parser for settings files
- Handle home directory expansion (`~`)
- Error handling for file operations

### Step 3: Backend - API Endpoints
- Implement all GET endpoints
- Implement POST /api/projects/scan endpoint
- Test with mock data
- Test with real Claude Code projects

### Step 4: Frontend - Basic Layout
- Create HTML/CSS layout
- Implement routing (client-side or server-side)
- Create dashboard view
- Create project detail view
- Create user/global view

### Step 5: Frontend - Integration
- Connect to backend API
- Implement loading states
- Implement error handling
- Add search/filter functionality
- Add syntax highlighting

### Step 6: Polish & Testing
- Responsive design tweaks
- Cross-browser testing
- Cross-platform testing (Windows/Mac/Linux)
- Handle edge cases
- User testing feedback

**Estimated Timeline:** 1-2 weeks

---

## 9. Next Steps

1. Review Phase 1 PRD section by section
2. Answer open questions
3. Finalize UI design approach
4. Begin implementation

---

## Review Status

| Section | Status | Notes |
|---------|--------|-------|
| 1. Project Overview | 📝 Draft | Ready for review |
| 2.1 Project Discovery | 📝 Draft | Ready for review |
| 2.2 Project Navigation | 📝 Draft | Ready for review |
| 2.3 Subagent Viewing | 📝 Draft | Ready for review |
| 2.4 Slash Command Viewing | 📝 Draft | Ready for review |
| 2.5 Hooks Viewing | 📝 Draft | Ready for review |
| 2.6 MCP Server Viewing | 📝 Draft | Ready for review |
| 3. User Interface Design | 📝 Draft | Ready for review |
| 4. Technical Architecture | 📝 Draft | Ready for review |
| 5. Out of Scope | 📝 Draft | Ready for review |
| 6. Success Criteria | 📝 Draft | Ready for review |
| 7. Open Questions | 📝 Draft | Ready for review |
| 8. Implementation Plan | 📝 Draft | Ready for review |
