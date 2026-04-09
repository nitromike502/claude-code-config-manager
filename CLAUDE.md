# Claude Code Config Manager

A web-based tool for managing Claude Code projects, subagents, slash commands, hooks, MCP servers, and rules.

## Project Overview

**Purpose:** Centralized interface to view and manage Claude Code configurations across all projects on a local machine.  
**Deployment:** Local web server at `http://localhost:5173` (dev) / `http://localhost:8420` (backend)  
**Current Release:** v3.1.0 — Released March 14, 2026

## IMPORTANT: Rules

These rules apply to all development work on this project:

- **Test projects only:** Use `/home/training/test-1` and `/home/training/test-2` for testing. NEVER test on this project.
- **Subagent debugging:** Do not give subagents explicit files to review. Instruct them to review recent commits and investigate.
- **Production file safety:** Always create a backup before testing on a production file.
- **Deleting files:** Move files to the `.deleted/` directory (e.g., `git mv docs/old.md .deleted/docs/old.md`). Do NOT use `rm` or `git rm`. This allows manual review before permanent deletion.

## Commands

```bash
# Development
npm run dev              # Start Vite frontend (port 5173)
npm run dev:backend      # Start backend with hot-reload (port 8420)
npm start                # Start backend (production)
npm run build            # Build frontend for production

# Testing
npm test                 # Run all backend tests (Jest)
npm run test:backend     # Backend tests only
npm run test:frontend    # All Playwright tests
npm run test:frontend:unit       # Vitest unit tests
npm run test:frontend:e2e        # E2E tests only
npm run test:frontend:component  # Component tests only
npm run test:full        # Backend + unit + Playwright (full suite)
npm run test:coverage    # Jest with coverage report

# Server management
npm run server:check     # Check if server is running
npm run server:restart   # Restart server
```

**Prerequisites:** Node.js 18+ and npm. See `docs/guides/SETUP-GUIDE.md` for first-time setup.

## Tech Stack

- **Backend:** Node.js + Express (port 8420)
- **Frontend:** Vite + Vue 3 + Vue Router + Pinia + PrimeVue + Tailwind CSS v4 (SPA on port 5173 in dev)
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
├── data/
│   └── schemas/                      # Cached official Claude Code JSON schema (auto-populated)
├── docs/
│   ├── prd/                          # Phase Requirements Documents
│   ├── guides/                       # Development guides
│   ├── sessions/                     # Development history & lessons learned
│   └── testing/                      # Test reports and documentation
├── src/
│   ├── backend/
│   │   ├── config/config.js          # Centralized configuration module
│   │   ├── config/hooks.js           # Hook event metadata (dynamic, schema-driven)
│   │   ├── parsers/                  # File parsers (agents, commands, skills, rules, etc.)
│   │   ├── routes/                   # API route handlers (includes schema.js)
│   │   ├── schemas/                  # Local JSON schemas for agent/skill/rule frontmatter
│   │   ├── services/                 # Business logic services (includes schemaService.js)
│   │   └── server.js                 # Express server entry point
│   ├── main.js, App.vue              # Vue app entry points
│   ├── router/, stores/, components/ # Vue 3 SPA architecture
│   ├── api/client.js                 # Centralized API client
│   └── styles/                       # CSS variables & theming
├── tests/
│   ├── backend/                      # Jest tests (1,548 tests across 52 suites)
│   ├── frontend/, e2e/, responsive/  # Playwright tests
│   └── fixtures/                     # Mock data and test helpers
└── CLAUDE.md                          # This file
```

## Gotchas

- **`projectId` encoding:** Project path with all slashes removed. `/home/user/projects/myapp` → `homeuserprojectsmyapp`
- **Safe development:** Always set `USE_DEV_PATHS=true` when running locally. This remaps `.claude` → `.claude-dev`, `.claude.json` → `.claude-dev.json`, `.mcp.json` → `.mcp-dev.json` to prevent modifying production Claude Code config.
- **Ports:** Backend runs on 8420; Vite dev server on 5173. API calls from the frontend proxy to the backend.
- **File deletion:** Never use `rm`. Use `git mv <file> .deleted/<file>` to preserve git history.
- **Test projects:** `/home/training/test-1` and `/home/training/test-2` — use these for all manual testing.
- **Hook delete ID format:** `event::matcher::index` (e.g., `PreToolUse::Bash::0`)

## Data Sources

### Project List
- `~/.claude.json` — All Claude Code project paths (paths are keys in `projects` object)

### Per-Project Configurations
- `.claude/agents/*.md` — Subagents (markdown with YAML frontmatter)
- `.claude/commands/**/*.md` — Slash commands (supports nested directories)
- `.claude/skills/*/SKILL.md` — Skills (directory-based configurations)
- `.claude/rules/**/*.md` — Rules (markdown with optional YAML frontmatter, `paths` field for conditional loading)
- `.claude/settings.json` / `.claude/settings.local.json` — Project settings including hooks
- `.mcp.json` — Project MCP servers (also merged with user-level servers via GET /api/projects/:projectId/mcp; status resolved from settings.local.json, settings.json, and ~/.claude.json)

### User-Level Configurations
- `~/.claude/agents/*.md`, `~/.claude/commands/**/*.md`, `~/.claude/skills/*/SKILL.md`
- `~/.claude/rules/**/*.md`, `~/.claude/settings.json` (includes hooks and MCP servers)

## Backend Configuration Module

Centralized config at `src/backend/config/config.js`:

- **`config.server`** — Server settings (port, host, protocol, URL)
- **`config.paths`** — File path getters for user and project configurations
- **`config.timeouts`** — Timeout values (API requests, reference checks, hooks)
- **`config.urls`** — External URLs; `config.urls.SCHEMA_SETTINGS` is the schemastore.org URL used by Schema Service

### Path Getter Functions

```javascript
const { paths } = require('./config/config');

// User-level paths
paths.getUserClaudeJsonPath()     // ~/.claude.json or ~/.claude-dev.json
paths.getUserSettingsPath()        // ~/.claude/settings.json
paths.getUserAgentsDir()           // ~/.claude/agents
paths.getUserCommandsDir()         // ~/.claude/commands
paths.getUserSkillsDir()           // ~/.claude/skills
paths.getUserRulesDir()            // ~/.claude/rules

// Project-level paths (require projectPath argument)
paths.getProjectClaudeDir(projectPath)         // {project}/.claude
paths.getProjectSettingsPath(projectPath)      // {project}/.claude/settings.json
paths.getProjectLocalSettingsPath(projectPath) // {project}/.claude/settings.local.json
paths.getProjectMcpPath(projectPath)           // {project}/.mcp.json
paths.getProjectAgentsDir(projectPath)         // {project}/.claude/agents
paths.getProjectCommandsDir(projectPath)       // {project}/.claude/commands
paths.getProjectSkillsDir(projectPath)         // {project}/.claude/skills
paths.getProjectRulesDir(projectPath)          // {project}/.claude/rules

// Utility
paths.expandHome('~/path')         // Expands ~ to home directory
paths.isDevelopmentMode()          // Returns true if USE_DEV_PATHS=true
```

## API Endpoints

```
GET    /api/projects                              - List all projects
GET    /api/projects/:projectId/agents            - Get project subagents
GET    /api/projects/:projectId/commands          - Get project commands
GET    /api/projects/:projectId/skills            - Get project skills
GET    /api/projects/:projectId/hooks             - Get project hooks
GET    /api/projects/:projectId/mcp               - Get merged project + user MCP servers (each has scope: 'project'|'user', status: 'enabled'|'disabled')
GET    /api/projects/:projectId/rules             - Get project rules
GET    /api/user/agents                           - Get user subagents
GET    /api/user/commands                         - Get user commands
GET    /api/user/skills                           - Get user skills
GET    /api/user/hooks                            - Get user hooks
GET    /api/user/mcp                              - Get user MCP servers
GET    /api/user/rules                            - Get user rules
POST   /api/projects/scan                         - Trigger project list refresh
POST   /api/copy/agent                            - Copy agent between projects
POST   /api/copy/command                          - Copy command between projects
POST   /api/copy/skill                            - Copy skill directory between projects
POST   /api/copy/hook                             - Copy hook between projects
POST   /api/copy/mcp                              - Copy MCP server between projects
POST   /api/copy/rule                             - Copy rule between projects
DELETE /api/projects/:projectId/agents/:name      - Delete project agent
DELETE /api/projects/:projectId/commands/:path    - Delete project command
DELETE /api/projects/:projectId/skills/:name      - Delete project skill
DELETE /api/projects/:projectId/hooks/:id         - Delete project hook (id: event::matcher::index)
DELETE /api/user/agents/:name                     - Delete user agent
DELETE /api/user/commands/:path                   - Delete user command
DELETE /api/user/skills/:name                     - Delete user skill
DELETE /api/user/hooks/:id                        - Delete user hook (id: event::matcher::index)
DELETE /api/projects/:projectId/rules/:path       - Delete project rule
DELETE /api/user/rules/:path                      - Delete user rule
PUT    /api/projects/:projectId/rules/:path       - Update project rule
PUT    /api/user/rules/:path                      - Update user rule

# Schema API
GET    /api/schema/hooks                          - Hook events, handler types, and field definitions
GET    /api/schema/settings                       - All Claude Code settings keys with metadata
GET    /api/schema/agents                         - Agent frontmatter field definitions
GET    /api/schema/skills                         - Skill frontmatter field definitions
GET    /api/schema/rules                          - Rule frontmatter field definitions
POST   /api/schema/refresh                        - Force re-fetch of official schema from schemastore.org
GET    /api/schema/status                         - Schema cache status (loaded, last fetch time, staleness)
```

**Note:** `projectId` = project path with slashes removed (e.g., `/home/user/projects/myapp` → `homeuserprojectsmyapp`)

## Implementation Approach

Built with **SWARM architecture** (Specialized Workflow with Autonomous Resource Management):

- Only the main agent invokes subagents — subagents cannot invoke other subagents
- Orchestrator creates execution plans and recommends parallelization
- 7-Phase Workflow: Session Init → Git Setup → Implementation → Code Commit → Docs Commit → PR/Review → User Approval/Merge
- Testing is integrated into development (Phase 3), not a separate phase

**Full workflow:** `docs/guides/SWARM-WORKFLOW.md`  
**Subagents:** `.claude/agents/` directory

## Ticketing Workflow

SQLite database at `/home/tickets/databases/claude-manager.db`. Tickets follow an Epic → Story → Task hierarchy with statuses: `backlog → todo → in-progress → review → done`.

- `/ba` command — Business Analyst creates PRDs (does NOT create tickets)
- `project-manager` subagent — Creates all tickets from PRDs
- `agile-ticket-manager` subagent — Executes all database operations (API interface to the ticket system)
- `/swarm <ticket-id>` — Executes a ticket via the full SWARM workflow

**Full integration guide:** `docs/guides/TICKET-MANAGER-INTEGRATION.md`

## Development Guides

All guides are indexed at `docs/guides/DOCUMENTATION-INDEX.md`. Key references:

| Need | Guide |
|------|-------|
| First-time setup | `docs/guides/SETUP-GUIDE.md` |
| Running a ticket | `docs/guides/SWARM-WORKFLOW.md` |
| Git / commits / PRs | `docs/guides/GIT-WORKFLOW.md` |
| Testing | `docs/guides/TESTING-GUIDE.md` |
| Coding standards | `docs/guides/CODING-STANDARDS.md` |
| Feature parity work | `docs/guides/FEATURE-PARITY-IMPLEMENTATION-GUIDE.md` |
| Spec-based implementation | `docs/guides/SPEC-IMPLEMENTATION-GUIDE.md` |
| Roadmap | `docs/guides/ROADMAP.md` |
| Technical specs | `docs/technical/README.md` |

**Development history:** `docs/sessions/INDEX.md`

## Future Enhancements

- MCP Server Management — Enable/disable MCP servers from UI
- Team Builder — Create groups of agents, commands, and configurations to copy as a unit
- Subagent CRUD — Create, edit, and delete subagent definitions
- Command Management — Create, edit, and delete slash commands
- Hooks Configuration — Visual editor for configuring hooks

**See:** `docs/guides/ROADMAP.md` for detailed planning and timelines

## Contributing

This project uses Claude Code with specialized subagents. See `.claude/agents/` for team structure.  
All contributions must follow the Git Workflow — see `docs/guides/GIT-WORKFLOW.md` for complete details.
