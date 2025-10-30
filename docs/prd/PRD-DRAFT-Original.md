# Product Requirements Document: Claude Code Manager

**Version:** 1.0 (MVP)
**Last Updated:** 2025-10-06
**Status:** Draft - Section by Section Review

---

## 1. Project Overview

**Project Name:** Claude Code Manager
**Purpose:** Web-based management interface for Claude Code projects, providing centralized visibility and management of subagents, slash commands, hooks, and MCP servers across all projects on the local machine.

**Tech Stack:**
- Backend: Node.js + Express
- Frontend: HTML/CSS/JavaScript (vanilla or lightweight framework)
- Data Model: Live file system reads (no database)
- Authentication: None (local-only tool)

**Target Users:** Developers using Claude Code who manage multiple projects and want centralized visibility into their configurations.

---

## 2. Core Requirements

### 2.1 Project Discovery

**Objective:** Automatically discover and list all Claude Code projects on the machine.

**Requirements:**
- Scan file system for directories containing `.claude/` folder
- Support configurable scan paths (default: `~/`, `~/projects/`, `~/Documents/`, `~/workspace/`)
- Display discovered projects with metadata:
  - Project name (derived from directory name)
  - Full file path
  - Last modified date
  - Count of agents/commands/hooks/MCP servers
- Manual rescan capability via UI button
- Handle symbolic links appropriately
- Exclude common non-project directories (node_modules, .git, etc.)

**Status:** 📝 Ready for Review

---

### 2.2 Subagent Management

**Objective:** View and browse all subagents configured at project and user levels.

#### 2.2.1 Project-Level Subagents
**Location:** `.claude/agents/` directory within each project

**Requirements:**
- Read and parse all `.md` files in the directory
- Parse YAML frontmatter with fields:
  - `name` (required)
  - `description` (required)
  - `tools` (optional array)
  - `model` (optional string)
- Display markdown content as system prompt
- Support nested subdirectories

#### 2.2.2 User-Level Subagents
**Location:** `~/.claude/agents/` directory

**Requirements:**
- Same parsing logic as project-level
- Clearly indicate "User/Global" scope in UI
- Show which subagents are available globally

#### 2.2.3 Display Features
- List view showing all subagents with:
  - Name
  - Description
  - Scope indicator (Project vs User)
  - Tools list
  - Model (if specified)
- Detail view showing:
  - Full YAML frontmatter
  - Complete system prompt
  - File path
- Search/filter by name or description
- Sort by name, scope, or modification date

**Status:** 📝 Ready for Review

---

### 2.3 Slash Command Management

**Objective:** View and browse all custom slash commands at project and user levels.

#### 2.3.1 Project-Level Commands
**Location:** `.claude/commands/` directory within each project

**Requirements:**
- Read all `.md` files in the directory
- Parse optional YAML frontmatter
- Support nested directories for namespacing (e.g., `git/status.md` → `/git/status`)
- Detect argument placeholders:
  - `$ARGUMENTS` (all arguments)
  - `$1`, `$2`, `$3`, etc. (positional arguments)
- Support markdown content as command body

#### 2.3.2 User-Level Commands
**Location:** `~/.claude/commands/` directory

**Requirements:**
- Same parsing logic as project-level
- Clearly indicate "User/Global" scope in UI
- Show which commands are available globally

#### 2.3.3 Display Features
- List view showing:
  - Command name (derived from filename/path)
  - Description (from frontmatter or first line)
  - Scope indicator (Project vs User)
  - Argument indicators
- Detail view showing:
  - Full command content
  - Frontmatter (if present)
  - File path
  - Usage example
- Search/filter by command name
- Support for namespace display

**Status:** 📝 Ready for Review

---

### 2.4 Hooks Management

**Objective:** View and manage hook configurations at project and user levels.

#### 2.4.1 Configuration Locations
**Project-Level:**
- `.claude/settings.json` (shared/team settings)
- `.claude/settings.local.json` (personal project settings)

**User-Level:**
- `~/.claude/settings.json` (global user settings)

#### 2.4.2 Hook Event Types
Display hooks for all event types:
1. `PreToolUse` - Before tool execution
2. `PostToolUse` - After tool completes
3. `UserPromptSubmit` - When user submits prompt
4. `Notification` - System notifications
5. `Stop` - When processing stops
6. `SubagentStop` - When subagent stops
7. `PreCompact` - Before context compaction
8. `SessionStart` - Session beginning
9. `SessionEnd` - Session conclusion

#### 2.4.3 Hook Configuration Structure
Parse JSON structure:
```json
{
  "hooks": {
    "EventType": [
      {
        "matcher": "Tool or Event Pattern",
        "hooks": [
          {
            "type": "command",
            "command": "shell-command"
          }
        ]
      }
    ]
  }
}
```

#### 2.4.4 Display Features
- List view showing:
  - Event type
  - Matcher pattern
  - Command/script
  - Scope (Project/Project-Local/User)
  - Source file
- Detail view showing:
  - Complete hook configuration
  - JSON formatted output
- Group by event type
- Search/filter by event type or matcher
- Visual indicator for security-sensitive hooks

**Status:** 📝 Ready for Review

---

### 2.5 MCP Server Management

**Objective:** View and manage MCP (Model Context Protocol) server configurations.

#### 2.5.1 Configuration Locations
**Project-Level:**
- `.mcp.json` at project root (team-shareable)

**User-Level:**
- `~/.claude/settings.json` (global MCP servers)
- User-specific MCP configuration file location (to be determined from docs)

**Enterprise-Level (Read-Only):**
- System-managed configuration directories:
  - macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`
  - Linux/WSL: `/etc/claude-code/managed-settings.json`
  - Windows: `C:\ProgramData\ClaudeCode\managed-settings.json`

#### 2.5.2 MCP Server Configuration Structure
Parse JSON structure:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "/path/to/server",
      "args": ["--flag", "value"],
      "env": {
        "VAR": "value"
      },
      "type": "stdio|http|sse"
    }
  }
}
```

#### 2.5.3 Transport Types
- **stdio** - Local standard I/O server
- **http** - Remote HTTP server
- **sse** - Remote Server-Sent Events server

#### 2.5.4 Display Features
- List view showing:
  - Server name
  - Transport type (stdio/HTTP/SSE)
  - Scope (Project/User/Enterprise)
  - Status indicator (if detectable)
  - Command/URL
- Detail view showing:
  - Complete configuration
  - Command and arguments
  - Environment variables
  - JSON formatted output
  - File path source
- Search/filter by server name or type
- Group by scope
- Visual indicator for enterprise-managed servers
- Environment variable expansion preview

**Status:** 📝 Ready for Review

---

## 3. Technical Architecture

### 3.1 Backend (Node.js/Express)

#### API Endpoints
```
GET  /api/projects                              - List all discovered projects
GET  /api/projects/:projectId/agents            - Get project subagents
GET  /api/projects/:projectId/commands          - Get project slash commands
GET  /api/projects/:projectId/hooks             - Get project hooks
GET  /api/projects/:projectId/mcp               - Get project MCP servers
GET  /api/user/agents                           - Get user-level subagents
GET  /api/user/commands                         - Get user-level slash commands
GET  /api/user/hooks                            - Get user-level hooks
GET  /api/user/mcp                              - Get user-level MCP servers
GET  /api/enterprise/mcp                        - Get enterprise MCP servers (read-only)
POST /api/projects/scan                         - Trigger project rescan
GET  /api/config                                - Get app configuration (scan paths)
```

#### File System Operations
- Markdown file reader with YAML frontmatter parser
- JSON parser for settings and MCP configuration files
- Directory traversal with pattern matching
- Real-time file reading (no caching for MVP)
- Error handling for missing/malformed files
- Path resolution and normalization
- Home directory expansion (`~`)

#### Data Models
```typescript
interface Project {
  id: string;
  name: string;
  path: string;
  lastModified: Date;
  counts: {
    agents: number;
    commands: number;
    hooks: number;
    mcpServers: number;
  };
}

interface Subagent {
  name: string;
  description: string;
  tools?: string[];
  model?: string;
  systemPrompt: string;
  filePath: string;
  scope: 'project' | 'user';
}

interface SlashCommand {
  name: string;
  namespace?: string;
  description?: string;
  content: string;
  arguments: string[];
  filePath: string;
  scope: 'project' | 'user';
}

interface Hook {
  eventType: string;
  matcher: string;
  command: string;
  type: string;
  scope: 'project' | 'project-local' | 'user';
  sourceFile: string;
}

interface MCPServer {
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  type: 'stdio' | 'http' | 'sse';
  url?: string;
  scope: 'project' | 'user' | 'enterprise';
  sourceFile: string;
}
```

**Status:** 📝 Ready for Review

---

### 3.2 Frontend (Web Interface)

#### Pages/Views
1. **Dashboard** - Overview of all projects
   - Project cards/list with counts
   - Search bar
   - Rescan button

2. **Project Detail View** - Selected project with tabs
   - Tabs: Subagents | Commands | Hooks | MCP Servers
   - Each tab shows project-specific items

3. **User/Global View** - User-level configurations
   - Same tabs as project view
   - Shows global configurations

4. **Detail Modals/Panels** - Full content display
   - Syntax highlighting for code
   - Formatted JSON display
   - Copy-to-clipboard functionality

#### UI Components
- Project list/cards with metadata
- Navigation tabs (Subagents, Commands, Hooks, MCP Servers)
- List views with search/filter
- Detail view panels
- Split view: Projects vs User/Global
- Collapsible sections
- Code syntax highlighting
- Loading states
- Error messages

#### Navigation Structure
```
/                           - Dashboard (project list)
/project/:id                - Project detail (default: agents tab)
/project/:id/agents         - Project subagents
/project/:id/commands       - Project slash commands
/project/:id/hooks          - Project hooks
/project/:id/mcp            - Project MCP servers
/user                       - User/global view (default: agents)
/user/agents                - User subagents
/user/commands              - User slash commands
/user/hooks                 - User hooks
/user/mcp                   - User MCP servers
```

**Status:** 📝 Ready for Review

---

## 4. Implementation Plan

### Phase 1: Backend Setup
1. Initialize Node.js/Express project structure
2. Implement file system scanner for Claude Code projects
3. Create parsers:
   - Markdown with YAML frontmatter parser
   - JSON settings parser
   - MCP configuration parser
4. Build REST API endpoints
5. Add error handling and validation
6. Create data models/interfaces

**Estimated Effort:** 3-5 days

---

### Phase 2: Frontend Development
1. Set up basic HTML/CSS layout and routing
2. Implement project list/dashboard view
3. Build project detail view with tabs
4. Create user/global view
5. Implement search and filter functionality
6. Add detail view modals/panels
7. Add syntax highlighting for code/JSON
8. Implement loading states and error handling

**Estimated Effort:** 4-6 days

---

### Phase 3: Integration & Testing
1. Connect frontend to backend APIs
2. Test with real Claude Code projects
3. Handle edge cases:
   - Missing files
   - Invalid/malformed configurations
   - Empty directories
   - Permission issues
4. Add loading states and error messages
5. Performance testing with many projects
6. Cross-platform testing (Windows/Mac/Linux)

**Estimated Effort:** 2-3 days

---

## 5. Non-Requirements (Out of Scope for MVP)

The following features are explicitly **NOT** included in the MVP:

- ❌ Authentication/Authorization
- ❌ Database or persistent storage
- ❌ File editing capabilities (read-only interface)
- ❌ Creation of new agents/commands/hooks/MCP servers
- ❌ Deletion or modification of existing items
- ❌ Real-time file watching/automatic updates
- ❌ Multi-user support
- ❌ Enterprise-level settings management/editing
- ❌ MCP server status/health monitoring
- ❌ Hook execution or testing
- ❌ Version control integration
- ❌ Export/import functionality
- ❌ Configuration validation/linting
- ❌ Diff/comparison tools
- ❌ Remote project access

---

## 6. Success Criteria

The MVP will be considered successful when:

1. ✅ All Claude Code projects on the machine are discovered and listed
2. ✅ All subagents (project and user-level) are visible and browsable
3. ✅ All slash commands (project and user-level) are visible and browsable
4. ✅ All hooks (project, project-local, and user-level) are visible and browsable
5. ✅ All MCP servers (project, user, and enterprise-level) are visible and browsable
6. ✅ UI is intuitive and responsive
7. ✅ Search/filter functionality works across all item types
8. ✅ Application runs on Windows, Mac, and Linux
9. ✅ No errors with malformed or missing configuration files

---

## 7. Future Enhancements (Post-MVP)

Potential features for future versions:

- 🔮 Edit/create/delete functionality for agents/commands/hooks
- 🔮 Real-time file watching and auto-refresh
- 🔮 MCP server health monitoring and testing
- 🔮 Hook execution and testing interface
- 🔮 Configuration validation and linting
- 🔮 Export/import configurations
- 🔮 Templates library for common patterns
- 🔮 Visual hook editor
- 🔮 Diff tool for comparing configurations
- 🔮 Integration with version control (git)
- 🔮 Multi-machine sync capability
- 🔮 Analytics and usage tracking

---

## 8. Open Questions

- [ ] Should we support custom scan paths via UI configuration?
- [ ] What should the default port be for the local server?
- [ ] Should we detect and warn about duplicate agent/command names across scopes?
- [ ] How should we handle very large projects (1000+ agents/commands)?
- [ ] Should we support export to markdown/JSON for documentation purposes?

---

## Review Status

| Section | Status | Reviewed By | Date | Notes |
|---------|--------|-------------|------|-------|
| 1. Project Overview | 📝 Draft | - | - | Ready for review |
| 2.1 Project Discovery | 📝 Draft | - | - | Ready for review |
| 2.2 Subagent Management | 📝 Draft | - | - | Ready for review |
| 2.3 Slash Command Management | 📝 Draft | - | - | Ready for review |
| 2.4 Hooks Management | 📝 Draft | - | - | Ready for review |
| 2.5 MCP Server Management | 📝 Draft | - | - | Ready for review |
| 3.1 Backend Architecture | 📝 Draft | - | - | Ready for review |
| 3.2 Frontend Architecture | 📝 Draft | - | - | Ready for review |
| 4. Implementation Plan | 📝 Draft | - | - | Ready for review |
| 5. Non-Requirements | 📝 Draft | - | - | Ready for review |

---

**Next Steps:**
1. Review each section sequentially
2. Update status to ✅ Approved or 🔄 Needs Changes
3. Address any changes or open questions
4. Finalize PRD before implementation begins
