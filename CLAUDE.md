# Claude Code Manager

A web-based tool for managing Claude Code projects, subagents, slash commands, hooks, and MCP servers.

## Project Overview

**Purpose:** Centralized interface to view and manage Claude Code configurations across all projects on a local machine.

**Deployment:** Local web server accessible at `http://localhost:5173`

**Current Phase:** Phase 3 - 🔄 IN PR REVIEW (Testing & Validation - STORY-3.7)

**Phase 3 Focus:** Complete copy configuration feature including backend service, API endpoints, and user interface for copying agents, commands, hooks, and MCP servers between projects.

**Phase 3 Progress:**
- ✅ Backend Service (Stories 3.1-3.2)
- ✅ API Endpoints (Story 3.3)
- ✅ Frontend Components (Story 3.4)
- ✅ State Management (Story 3.5)
- ✅ UI Integration (Story 3.6)
- 🔄 Testing & Validation (Story 3.7) - In PR review, pending manual testing

**Story 3.7 Status:**
- ✅ E2E tests created (Test 106 - 9 scenarios)
- ✅ Accessibility audit passed (WCAG 2.1 AA - 96%)
- ✅ Cross-platform validated (Linux baseline, code review)
- ✅ Performance verified (A+ grade, 200x-500x faster than targets)
- ⚠️ Test 106 debugging deferred to post-merge manual testing

**Next Phase:** Phase 4 - Subagent CRUD (after Phase 3 complete)

## Tech Stack

- **Backend:** Node.js + Express (port 8420)
- **Frontend:** Vite + Vue 3 + Vue Router + Pinia + PrimeVue (SPA on port 5173 in dev)
- **Data Source:** Live file system reads (no database)

## Project Structure

```
manager/
├── .claude/
│   ├── agents/                       # Project subagents
│   ├── commands/                     # Project slash commands
│   ├── templates/                    # Workflow templates (session tracking, testing, etc.)
│   └── settings.json                 # Project Claude Code settings
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
│   ├── backend/                      # Jest tests (511 tests)
│   ├── frontend/, e2e/, responsive/  # Playwright tests (644 tests)
│   └── fixtures/                     # Mock data and test helpers
└── CLAUDE.md                          # This file
```

**Templates Location:** `.claude/templates/`
- `session-tracking-template.md` - Template for SWARM workflow session tracking documents
- `test-template.md` - Template for creating new test files
- `test-creation-checklist.md` - Checklist for comprehensive test creation
- `spec-review-checklist.md` - Checklist for reviewing official specifications
- `development-strategies.md` - Guide for selecting development approaches

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
- **Testing:** 879 tests (276 backend + 603 frontend) with 100% pass rate at Phase 2 completion

### Phase 3 - Copy Configuration Feature - 🔄 IN PR REVIEW
**Started:** November 2, 2025
**Current Status:** STORY-3.7 (Testing) in PR review, awaiting manual testing

**Epic:** EPIC-003 contains 7 stories (3.1-3.7)

**Completed Work (Stories 3.1-3.6):**
- ✅ Backend copy service infrastructure (STORY-3.1)
- ✅ Configuration-specific copy logic (STORY-3.2)
- ✅ Copy API endpoints (STORY-3.3)
- ✅ Frontend copy UI components (STORY-3.4)
- ✅ State management and API integration (STORY-3.5)
- ✅ UI integration and accessibility (STORY-3.6)
- Implemented `copyAgent()`, `copyCommand()`, `copyHook()`, `copyMcp()` methods
- 3-level nested merge algorithm for hooks (event → matcher → command)
- Smart deduplication by command field (hooks) and server name (MCP)
- Robust conflict handling with skip/overwrite/rename strategies
- Security hardening with path traversal protection
- Atomic writes using temp file + rename pattern
- Complete copy UI with modal, conflict resolution, and single-click UX
- **Testing:** 511 backend tests + 644 frontend tests
  - Backend: 511/511 passing (100%)
  - Frontend: 514/644 passing (Test 106 deferred to manual testing)
  - Copy service: 111 tests (agents: 24, commands: 25, hooks: 45, MCP: 17)
  - Accessibility: 31 tests (WCAG 2.1 AA - 96% compliance)
  - Performance: 5 tests (A+ grade, 200x-500x faster than targets)
  - E2E copy workflows: 9 tests (Test 106 - requires debugging)

**In Progress (Story 3.7):**
- 🔄 Testing and cross-platform validation - In PR review, pending manual testing
  - E2E tests created (Test 106 - 9 scenarios)
  - Accessibility audit passed (WCAG 2.1 AA - 96%, 0 violations)
  - Cross-platform validated (Linux baseline, high confidence for Windows/macOS)
  - Performance verified (A+ grade)
  - Test 106 debugging deferred to post-merge manual testing phase

**See:** `docs/prd/features/copy-configuration/FEATURE-OVERVIEW.md` for complete feature documentation.

### Future Phases
**See:** `docs/guides/ROADMAP.md` for Phase 4+ planning (Subagent CRUD, Command Management, Advanced Features)

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

Building with **SWARM architecture** (Specialized Workflow with Autonomous Resource Management):

- **Main Agent Coordination:** Only main agent invokes subagents
- **Orchestrator Role:** Creates execution plans, recommends parallelization
- **Ticket Manager:** Acts as API for ticket operations (like Jira/Azure DevOps)
- **7-Phase Workflow:** Session Init → Git Setup → Implementation → Code Commit → Docs Commit → PR/Review → User Approval/Merge

**Architecture Principle:** Subagents cannot invoke other subagents. Main agent coordinates all work based on orchestrator's recommendations.

See `docs/guides/SWARM-WORKFLOW.md` for complete workflow documentation.

**Note:** Testing is integrated into development, not a separate phase. Each developer tests their implementation immediately before code review.

See subagent proposals in project `.claude/agents/` directory.

## Ticketing Workflow

**Agile Ticketing System:** `/home/tickets/claude/manager/`

The project uses a file-based Agile ticketing system managed by the `agile-ticket-manager` subagent. This system functions like enterprise tools (Jira, Azure DevOps, Linear) but uses a hierarchical directory structure.

### Ticket Hierarchy
```
Epics → Stories → Tasks
  ↓        ↓        ↓
EPIC-001  STORY-2.1  TASK-2.1.1
```

### Status Workflow
```
backlog → todo → in-progress → review → done
```

### Roles & Responsibilities

**Business Analyst (`/ba` command):**
- Creates PRDs and requirements documentation
- Designs UI/UX wireframes
- Provides implementation recommendations
- **Does NOT create tickets**

**Project Manager (`project-manager` subagent):**
- **Creates ALL tickets** (Epics, Stories, Tasks, Bugs)
- Writes ticket files with frontmatter
- Invokes `agile-ticket-manager` to organize tickets
- Sets priorities and dependencies

**Ticket Manager (`agile-ticket-manager` subagent):**
- Organizes ticket files into directory structure
- Provides ticket retrieval and querying
- Manages status transitions
- Maintains Epic/Story/Task relationships

**Orchestrator (`subagent-orchestrator` subagent):**
- Queries ticket manager for available work
- Assigns tickets to developers
- Requests status updates throughout workflow
- **Does NOT create tickets**

### Workflow Integration

1. **Feature Request** → User runs `/ba` command
2. **Analysis** → BA creates PRD in `docs/ba-sessions/`
3. **Planning** → User invokes `project-manager` to create tickets from PRD
4. **Organization** → Project manager invokes `agile-ticket-manager` to organize tickets
5. **Execution** → User runs `/swarm <ticket-id>`
   - See `docs/guides/SWARM-WORKFLOW.md` for complete execution workflow
   - Main agent coordinates all subagents (orchestrator creates plans only)
   - Session tracking document maintained at `docs/sessions/tracking/`
6. **Coordination** → Orchestrator queries ticket manager, assigns work, updates statuses
7. **Completion** → Tickets moved to `done` after PR merge

**See:** `docs/guides/TICKET-MANAGER-INTEGRATION.md` for complete integration patterns

## Current Status & Priorities

### Recent Bug Fixes (October 24, 2025)
- **BUG-027:** Agent color field now displays in sidebars ✅
- **BUG-028:** Agent model field now displays in sidebars ✅
- **BUG-029:** Agent tools field now displays in sidebars ✅
- **BUG-035:** User configuration card now persists after navigation ✅

All bugs were resolved with comprehensive test coverage.

## Quick Reference - Development Guides

**Read these documents when you need them:**

### 🎯 SWARM Workflow
- **Complete workflow guide:** `docs/guides/SWARM-WORKFLOW.md`
  - When: Implementing any ticket (Story/Task/Bug)
  - Contains: Complete 7-phase workflow from ticket selection through PR merge
  - Key commands: /project-status (ticket selection), /swarm <ticket-id> (execution)

- **Parallelization guide:** `docs/guides/PARALLEL-EXECUTION-GUIDE.md`
  - When: Orchestrator recommends parallel execution
  - Contains: Decision criteria, examples, troubleshooting
  - Performance: 40-62% time reduction demonstrated in real sessions

### 🚀 Starting Development
- **Choose your workflow:** `docs/guides/DEVELOPMENT-STRATEGIES.md`
  - When: Beginning a new session or task
  - Contains: Strategy selection (Approved/Rapid/Parallel/SWARM), real-world evidence, decision criteria

### 📝 Git & Commits
- **Feature branch workflow:** `docs/guides/GIT-WORKFLOW.md`
  - When: Creating commits, PRs, or managing branches
  - Contains: Mandatory rules, commit format, branch naming, one-commit-per-task policy

### 📐 Implementation Patterns
- **Spec-based implementation:** `docs/guides/SPEC-IMPLEMENTATION-GUIDE.md`
  - When: Implementing from official specifications (Claude Code, Playwright, Vue, etc.)
  - Contains: 5-step pattern, BUG-030 case study, common pitfalls

- **Coding standards:** `docs/guides/CODING-STANDARDS.md`
  - When: Writing code, creating tests, or updating documentation
  - Contains: Test data standards, import paths, documentation placement, CHANGELOG guidelines

### 🧪 Testing
- **Test workflow & conventions:** `docs/guides/TESTING-GUIDE.md`
  - When: Running tests, creating new tests, or debugging test failures
  - Contains: Automated quality gate, naming conventions, test types, test data standards, troubleshooting

### 🔧 Technical Specifications
- **Technical documentation index:** `docs/technical/README.md`
  - When: Understanding complex algorithms, data structures, or architecture
  - Contains: Hook structure specs, merge algorithms, edge case documentation

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