# Claude Code Manager

A web-based tool for managing Claude Code projects, subagents, slash commands, hooks, and MCP servers.

## Project Overview

**Purpose:** Centralized interface to view and manage Claude Code configurations across all projects on a local machine.

**Deployment:** Local web server accessible at `http://localhost:5173`

**Current Phase:** Phase 2.3 - ✅ COMPLETE

**Phase 2.3 Focus:** Production readiness fixes including critical bug fixes, accessibility compliance, and documentation updates.

## Tech Stack

- **Backend:** Node.js + Express (port 8420)
- **Frontend:** Vite + Vue 3 + Vue Router + Pinia (SPA on port 5173 in dev)
- **Data Source:** Live file system reads (no database)

## Project Structure

```
manager/
├── docs/
│   ├── prd/                          # Phase Requirements Documents
│   ├── guides/                       # Development guides (see Quick Reference below)
│   ├── sessions/                     # Development history & lessons learned
│   └── testing/                      # Test reports and documentation
├── src/
│   ├── backend/                      # Express server & API
│   ├── main.js, App.vue              # Vue app entry points
│   ├── router/, stores/, components/ # Vue 3 SPA architecture
│   ├── api/client.js                 # Centralized API client
│   └── styles/                       # CSS variables & theming
├── tests/
│   ├── backend/                      # Jest tests (276 tests)
│   ├── frontend/, e2e/, responsive/  # Playwright tests (603 tests)
│   └── fixtures/                     # Mock data and test helpers
└── CLAUDE.md                          # This file
```

**Note on Legacy Code:**
- `/src/frontend/` (Phase 1 CDN-based code) has been removed
- All active code now uses Vite + Vue 3 SPA architecture

## Phase Summary

### Phase 1 MVP - ✅ COMPLETE
**Core Functionality:**
1. **Project Discovery** - Read from `~/.claude.json` to list all Claude Code projects
2. **Subagent Viewing** - Display subagents from `.claude/agents/*.md`
3. **Slash Command Viewing** - Display commands from `.claude/commands/**/*.md`
4. **Hooks Viewing** - Display hooks from `.claude/settings.json` files
5. **MCP Server Viewing** - Display MCP servers from `.mcp.json` and settings files

**Key Constraints:** Read-only, manual refresh, dark mode, no authentication

### Phase 2 - Vite Migration - ✅ COMPLETE
- Modern dev server with HMR (< 1s reload)
- Vue Router for SPA navigation
- Pinia state management
- 100% Phase 1 feature parity maintained
- **Testing:** 879 tests (100% pass rate)

**See:** `docs/guides/archives/PHASE1-SUCCESS-CRITERIA.md` and `docs/guides/archives/PHASE2-COMPLETION-SUMMARY.md` for complete details.

### Phase 2.1 - Component Refactoring - ✅ COMPLETE
**Completion Date:** October 26, 2025 (PR #45)

**Achievements:**
- Created 6 reusable components (ConfigCard, ConfigItemList, ConfigDetailSidebar, LoadingState, EmptyState, BreadcrumbNavigation)
- Reduced code duplication from 62% to <10% (83% reduction)
- ProjectDetail.vue: -52.3% LOC (1,191 → 568 lines)
- UserGlobal.vue: -61.1% LOC (984 → 383 lines)
- All 4 stories completed (2.1-2.4)
- 270/270 tests passing with full coverage

**See:** `docs/prd/PRD-Phase2-Extension-Component-Refactoring.md` for complete details.

### Phase 2.2 - Bug Fixes - ✅ COMPLETE
**Completion Date:** October 27, 2025

**Achievements:**
- Fixed agent color/model/tools display in sidebars (BUG-027, BUG-028, BUG-029)
- Fixed user configuration card persistence (BUG-035)
- Resolved event handler signature mismatch (HIGH-011)
- Fixed memory leak in Dashboard event listener (CRITICAL-005)
- All bugs resolved with comprehensive test coverage

### Phase 2.3 - Production Readiness - ✅ COMPLETE
**Completion Date:** November 1, 2025

**Achievements:**
- Added MIT LICENSE file for legal compliance
- Created favicon.svg for professional appearance
- Updated Vite to 7.1.12 (resolved security vulnerability)
- Added dist/ to NPM package for instant NPX startup
- Achieved WCAG 2.1 AA accessibility compliance
- Updated all documentation for test count consistency
- **Testing:** 879 tests (276 backend + 603 frontend) with 100% pass rate

### Future Phases
**See:** `docs/guides/ROADMAP.md` for Phase 2.1-7+ planning (Component Refactoring, Subagent CRUD, Command Management, Hooks, MCP Servers, Advanced Features)

## Data Sources

### Project List
- `~/.claude.json` - Contains all Claude Code project paths (paths are keys in `projects` object)

### Per-Project Configurations
- `.claude/agents/*.md` - Subagents (markdown with YAML frontmatter)
- `.claude/commands/**/*.md` - Slash commands (markdown, supports nested directories)
- `.claude/settings.json` - Project settings including hooks
- `.claude/settings.local.json` - Local project settings
- `.mcp.json` - Project MCP servers

### User-Level Configurations
- `~/.claude/agents/*.md` - User subagents
- `~/.claude/commands/**/*.md` - User commands
- `~/.claude/settings.json` - User settings including hooks and MCP servers

## API Endpoints

```
GET  /api/projects                   - List all projects from ~/.claude.json
GET  /api/projects/:projectId/agents - Get project subagents
GET  /api/projects/:projectId/commands - Get project commands
GET  /api/projects/:projectId/hooks  - Get project hooks
GET  /api/projects/:projectId/mcp    - Get project MCP servers
GET  /api/user/agents                - Get user subagents
GET  /api/user/commands              - Get user commands
GET  /api/user/hooks                 - Get user hooks
GET  /api/user/mcp                   - Get user MCP servers
POST /api/projects/scan              - Trigger project list refresh
```

**Note:** `projectId` = project path with slashes removed (e.g., `/home/user/projects/myapp` → `homeuserprojectsmyapp`)

## UI Design Principles

- Clean, minimal interface
- Card-based layout for config sections (all on one page)
- Fast navigation between projects
- Dark mode support
- Responsive design for laptop/desktop

**Wireframes:** ✅ Complete - See `docs/wireframes/` directory

## Implementation Approach

Building with **parallel subagent teams** using the SWARM method:

1. **Backend Team** - API endpoints, file parsing, project discovery (includes immediate testing)
2. **Frontend Team** - Vue components, SPA architecture, routing, state management (includes immediate testing)
3. **Quality Team** - Code review, cross-platform verification, documentation

**Note:** Testing is integrated into development, not a separate phase. Each developer tests their implementation immediately before code review.

See subagent proposals in project `.claude/agents/` directory.

## Current Status & Priorities

### Recent Bug Fixes (October 24, 2025)
- **BUG-027:** Agent color field now displays in sidebars ✅
- **BUG-028:** Agent model field now displays in sidebars ✅
- **BUG-029:** Agent tools field now displays in sidebars ✅
- **BUG-035:** User configuration card now persists after navigation ✅

All bugs were resolved with comprehensive test coverage.

## Quick Reference - Development Guides

**Read these documents when you need them:**

### 🚀 Starting Development
- **Choose your workflow:** `docs/guides/DEVELOPMENT-STRATEGIES.md`
  - When: Beginning a new session or task
  - Contains: Strategy selection (Approved/Rapid/Parallel), real-world evidence, decision criteria

### 📝 Git & Commits
- **Feature branch workflow:** `docs/guides/GIT-WORKFLOW.md`
  - When: Creating commits, PRs, or managing branches
  - Contains: Mandatory rules, commit format, branch naming, one-commit-per-task policy

### 📐 Implementation Patterns
- **Spec-based implementation:** `docs/guides/SPEC-IMPLEMENTATION-GUIDE.md`
  - When: Implementing from official specifications (Claude Code, Playwright, Vue, etc.)
  - Contains: 5-step pattern, BUG-030 case study, common pitfalls

### 🧪 Testing
- **Test workflow & conventions:** `docs/guides/TESTING-GUIDE.md`
  - When: Running tests, creating new tests, or debugging test failures
  - Contains: Automated quality gate, naming conventions, test types, troubleshooting

### ⚙️ Setup & Operations
- **First-time setup:** `docs/guides/SETUP-GUIDE.md`
  - When: Installing project, onboarding new developers
  - Contains: Prerequisites, installation steps, server restart protocol, troubleshooting

### 🗺️ Planning
- **Feature roadmap:** `docs/guides/ROADMAP.md`
  - When: Planning future features or understanding project direction
  - Contains: Phase 2.1-7+ plans, timelines, dependencies

### 📚 Historical Reference
- **Phase 1 achievements:** `docs/guides/archives/PHASE1-SUCCESS-CRITERIA.md`
- **Phase 2 completion:** `docs/guides/archives/PHASE2-COMPLETION-SUMMARY.md`
- **Development history:** `docs/sessions/INDEX.md` - Full session history, lessons learned, workflow best practices

## Development History

This project has undergone continuous improvement since Phase 1 MVP. Key sessions and workflow analyses provide critical insights into best practices:

**Session Summaries:**
- [October 24, 2025](docs/sessions/summaries/SESSION-SUMMARY-20251024.md) - Fixed 4 critical display bugs with 100% test coverage

**Workflow Analyses:**
- [October 7, 2025](docs/sessions/workflow-analyses/workflow-analysis-20251007.md) - Critical incident analysis: established mandatory workflow improvements
- [October 12, 2025](docs/sessions/workflow-analyses/workflow-analysis-20251012-session-c6d23edd.md) - Exemplary execution: 100% task completion, zero errors
- [October 22, 2025](docs/sessions/workflow-analyses/workflow-analysis-20251022.md) - Best-practice bug sprint: 16 bugs fixed systematically

**Complete Archive:** See [docs/sessions/INDEX.md](docs/sessions/INDEX.md) for full development history.

## Contributing

This project uses Claude Code with specialized subagents. See `.claude/agents/` for team structure.

**All contributions must follow the Git Workflow** - See `docs/guides/GIT-WORKFLOW.md` for complete details.
- Move files to delete to the `.deleted/` directory, so I can review and delete them manually