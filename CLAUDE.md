# Claude Code Config Manager

A web-based tool for managing Claude Code projects, subagents, slash commands, hooks, and MCP servers.

## Project Overview

**Purpose:** Centralized interface to view and manage Claude Code configurations across all projects on a local machine.

**Deployment:** Local web server accessible at `http://localhost:5173`

**Current Release:** v2.3.0 - Released November 28, 2025

**Key Features:**
- Copy configuration between projects (agents, commands, skills, hooks, MCP servers)
- Smart conflict resolution with skip/overwrite/rename strategies
- Modern PrimeVue UI components with Aura theme
- Tailwind CSS v4 integration for responsive design
- WCAG 2.1 AA accessibility compliance

## Tech Stack

- **Backend:** Node.js + Express (port 8420)
- **Frontend:** Vite + Vue 3 + Vue Router + Pinia + PrimeVue + Tailwind CSS (SPA on port 5173 in dev)
- **Styling:** Tailwind CSS v4 with tailwindcss-primeui plugin
- **Data Source:** Live file system reads (no database)

## Project Structure

```
manager/
├── .claude/
│   ├── agents/                       # Project subagents
│   ├── commands/                     # Project slash commands
│   ├── skills/                       # Project skills (directory-based configs)
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
│   ├── backend/                      # Jest tests (582 tests)
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
- `/src/frontend/` (CDN-based code) has been removed
- All active code now uses Vite + Vue 3 SPA architecture

## Current Features

### Configuration Viewing
- **Project Discovery** - Automatically discovers all Claude Code projects from `~/.claude.json`
- **Subagent Viewing** - Browse and view project and user-level subagents with full frontmatter specs
- **Slash Command Viewing** - View all custom slash commands across projects
- **Skills Viewing** - Browse and view skills (directory-based configurations with SKILL.md)
- **Hooks Viewing** - Display configured hooks from settings files
- **MCP Server Viewing** - View MCP server configurations
- **Search & Filter** - Quickly find specific configurations
- **Detail Sidebar** - View full content with markdown rendering and file tree for skills

### Configuration Management
- **Copy Configuration** - Copy agents, commands, skills, hooks, and MCP servers between projects
- **Delete Configuration** - Delete agents, commands, skills, and hooks from projects or user-level
- **Conflict Resolution** - Smart conflict detection with skip/overwrite/rename strategies
- **Cross-Scope Copy** - Copy between user-level and project-level configurations
- **Smart Merging** - Intelligent merge for hooks and MCP configurations
- **External Reference Detection** - Warns when skills reference files outside their directory

### User Experience
- **SPA Navigation** - Client-side routing with no page reloads
- **Dark/Light Mode** - Toggle between themes
- **Responsive Design** - Works on desktop, tablet, and mobile
- **WCAG 2.1 AA Accessibility** - Keyboard navigation, screen reader support
- **Toast Notifications** - Success/error feedback

## Future Enhancements

**Upcoming Features:**
- **MCP Server Management** - Enable/disable MCP servers from UI
- **Team Builder** - Create groups of agents, commands, and configurations to copy as a unit
- **Subagent CRUD** - Create, edit, and delete subagent definitions
- **Command Management** - Create, edit, and delete slash commands
- **Hooks Configuration** - Visual editor for configuring hooks

**See:** `docs/guides/ROADMAP.md` for detailed planning and timelines

## Data Sources

### Project List
- `~/.claude.json` - Contains all Claude Code project paths (paths are keys in `projects` object)

### Per-Project Configurations
- `.claude/agents/*.md` - Subagents (markdown with YAML frontmatter)
- `.claude/commands/**/*.md` - Slash commands (markdown, supports nested directories)
- `.claude/skills/*/SKILL.md` - Skills (directory-based configurations with SKILL.md and supporting files)
- `.claude/settings.json` - Project settings including hooks
- `.claude/settings.local.json` - Local project settings
- `.mcp.json` - Project MCP servers

### User-Level Configurations
- `~/.claude/agents/*.md` - User subagents
- `~/.claude/commands/**/*.md` - User commands
- `~/.claude/skills/*/SKILL.md` - User skills
- `~/.claude/settings.json` - User settings including hooks and MCP servers

## API Endpoints

```
GET    /api/projects                         - List all projects from ~/.claude.json
GET    /api/projects/:projectId/agents       - Get project subagents
GET    /api/projects/:projectId/commands     - Get project commands
GET    /api/projects/:projectId/skills       - Get project skills
GET    /api/projects/:projectId/hooks        - Get project hooks
GET    /api/projects/:projectId/mcp          - Get project MCP servers
GET    /api/user/agents                      - Get user subagents
GET    /api/user/commands                    - Get user commands
GET    /api/user/skills                      - Get user skills
GET    /api/user/hooks                       - Get user hooks
GET    /api/user/mcp                         - Get user MCP servers
POST   /api/projects/scan                    - Trigger project list refresh
POST   /api/copy/agent                       - Copy agent between projects
POST   /api/copy/command                     - Copy command between projects
POST   /api/copy/skill                       - Copy skill directory between projects
POST   /api/copy/hook                        - Copy hook between projects
POST   /api/copy/mcp                         - Copy MCP server between projects
DELETE /api/projects/:projectId/agents/:name - Delete project agent
DELETE /api/projects/:projectId/commands/:path - Delete project command
DELETE /api/projects/:projectId/skills/:name - Delete project skill
DELETE /api/projects/:projectId/hooks/:id   - Delete project hook (id: event::matcher::index)
DELETE /api/user/agents/:name               - Delete user agent
DELETE /api/user/commands/:path             - Delete user command
DELETE /api/user/skills/:name               - Delete user skill
DELETE /api/user/hooks/:id                  - Delete user hook (id: event::matcher::index)
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

**Agile Ticketing System:** SQLite Database at `/home/tickets/databases/claude-manager.db`

The project uses a SQLite-based Agile ticketing system managed by the `agile-ticket-manager` subagent. This system functions like enterprise tools (Jira, Azure DevOps, Linear) but stores tickets in a relational database accessed through the `ticket-system` user-level skill.

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
- Uses `agile-ticket-manager` to add tickets to the database
- Sets priorities and dependencies
- Defines ticket relationships and metadata

**Ticket Manager (`agile-ticket-manager` subagent):**
- Executes database operations via `ticket-system` skill scripts
- Provides ticket retrieval and querying from SQLite database
- Manages status transitions in the database
- Maintains Epic/Story/Task relationships
- Acts as API interface to the ticketing system

**Orchestrator (`subagent-orchestrator` subagent):**
- Queries ticket manager for available work
- Assigns tickets to developers
- Requests status updates throughout workflow
- **Does NOT create tickets**

### Workflow Integration

1. **Feature Request** → User runs `/ba` command
2. **Analysis** → BA creates PRD in `docs/ba-sessions/`
3. **Planning** → User invokes `project-manager` to create tickets from PRD
4. **Database Storage** → Project manager invokes `agile-ticket-manager` to add tickets to SQLite database
5. **Execution** → User runs `/swarm <ticket-id>`
   - See `docs/guides/SWARM-WORKFLOW.md` for complete execution workflow
   - Main agent coordinates all subagents (orchestrator creates plans only)
   - Session tracking document maintained at `docs/sessions/tracking/`
6. **Coordination** → Orchestrator queries ticket manager (via database scripts), assigns work, updates statuses
7. **Completion** → Tickets marked as `done` in database after PR merge

**See:** `docs/guides/TICKET-MANAGER-INTEGRATION.md` for complete integration patterns

## Current Status

**Release:** v2.1.0 (November 13, 2025)

**Latest Updates:**
- Agent Skills support added (EPIC-006)
- Copy configuration feature released
- WCAG 2.1 AA accessibility compliance achieved
- PrimeVue UI components integrated
- 1,226 tests across backend and frontend

**Quality Metrics:**
- 582 backend tests (100% pass rate)
- 644 frontend tests (80% pass rate, 20% deferred for manual testing)
- WCAG 2.1 AA compliant (96%, 0 critical violations)
- Performance: Grade A+

## Quick Reference - Development Guides

**Read these documents when you need them:**

### 📚 Documentation Navigation
- **Documentation index:** `docs/guides/DOCUMENTATION-INDEX.md`
  - When: Starting any task, need to find the right guide quickly
  - Contains: Decision tree, guide quick reference, common scenarios, context efficiency strategy
  - Key benefit: Helps you find exactly the right documentation for your current task

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

- **Code review best practices:** `docs/guides/CODE-REVIEW-BEST-PRACTICES.md`
  - When: Reviewing pull requests, especially feature parity work
  - Contains: UX consistency verification, review checklists, response templates
  - Critical for: Preventing bugs when implementing features across entity types

### 📐 Implementation Patterns
- **Implementation outlining:** `docs/guides/IMPLEMENTATION-OUTLINE-GUIDE.md`
  - When: End of Phase 1, before Phase 3 implementation (complex features, feature parity work)
  - Contains: Outline template, comparative analysis for feature parity, real-world case studies
  - Key benefit: 15 minutes of outlining prevents 2+ hours of debugging

- **Feature parity implementation:** `docs/guides/FEATURE-PARITY-IMPLEMENTATION-GUIDE.md`
  - When: Implementing features that already work for another entity type (e.g., Commands after Agents)
  - Contains: Comparative analysis workflow, structural difference detection, 16:1 ROI demonstrated

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

---

## Developer Documentation

This section contains detailed development workflow information for contributors.

### Development History

**Completed Development Phases:**
- **Phase 1 (MVP):** Core viewing functionality (October 2025)
- **Phase 2 (Vite Migration):** Modern Vue 3 + Vite architecture (October 2025)
- **Phase 2.1 (Component Refactoring):** Created reusable components, reduced duplication by 83% (October 26, 2025)
- **Phase 2.2 (Bug Fixes):** Fixed agent display and memory leak issues (October 27, 2025)
- **Phase 2.3 (Production Readiness):** Added LICENSE, favicon, security updates (November 1, 2025)
- **Phase 3 (Copy Configuration):** Complete copy feature with conflict resolution (November 2-13, 2025)
- **Phase 3.1 (UI Modernization):** PrimeVue migration and Tailwind CSS integration (November 13-26, 2025)

**Phase Documentation:**
- `docs/guides/archives/PHASE1-SUCCESS-CRITERIA.md` - Phase 1 complete requirements
- `docs/guides/archives/PHASE2-COMPLETION-SUMMARY.md` - Phase 2 achievements
- `docs/prd/` - Phase Requirements Documents for historical reference

### Test Coverage Details

**Backend Tests (582 tests, 100% pass rate):**
- API endpoints: 276 tests
- Parsers: Skills parser with 29 tests (YAML parsing, external reference detection)
- Copy service: 182 tests (agents: 24, commands: 25, skills: 71, hooks: 45, MCP: 17)
- Performance: 5 tests (Grade A+, 200x-500x faster than targets)

**Frontend Tests (644 tests, 80% pass rate):**
- 514 passing tests (E2E workflows, component tests, responsive design)
- 130 deferred for post-release manual testing (Test 106 E2E workflows)
- 31 accessibility tests (WCAG 2.1 AA compliance verified)

### Future Phase Planning

**Next Phases (Not Yet Started):**
- Subagent CRUD operations
- Command management features
- Visual hooks configuration
- Advanced MCP server management

**See:** `docs/guides/ROADMAP.md` for complete future feature planning
- For testing, use projects `/home/training/test-1` and `/home/training/test-2`. NEVER test on this project
- When invoking subagents to debug, don't give them explicit files to review, instead instruct them to review recent commits and investigate.
- Always create a backup if testing on a production file