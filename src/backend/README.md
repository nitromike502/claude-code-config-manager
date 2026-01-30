# Claude Code Config Manager - Backend API

Phase 1 MVP backend server for the Claude Code Config Manager web application.

## Architecture

```
src/backend/
├── server.js              # Main Express server entry point
├── routes/
│   ├── projects.js        # Project-related API endpoints
│   └── user.js            # User-level config endpoints
├── services/
│   ├── projectDiscovery.js # Project scanning and config reading
│   └── fileReader.js      # File system utilities (JSON, Markdown, YAML)
└── utils/
    └── pathUtils.js       # Path handling and conversion utilities
```

## Installation

```bash
cd src/backend
npm install
```

## Running the Server

```bash
# Production mode
npm start

# Development mode (with auto-reload on Node 18+)
npm run dev
```

Server will start on `http://localhost:8420`

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server health status and version information.

### Projects

#### List All Projects
```
GET /api/projects
```
Returns all Claude Code projects discovered from `~/.claude.json` with counts of agents/commands/hooks/MCP servers.

**Response:**
```json
{
  "success": true,
  "projects": {
    "projectId": {
      "id": "projectId",
      "path": "/absolute/path/to/project",
      "name": "project-name",
      "exists": true,
      "config": {},
      "counts": {
        "agents": 5,
        "commands": 12,
        "hooks": 3,
        "mcp": 2
      }
    }
  },
  "error": null
}
```

#### Rescan Projects
```
POST /api/projects/scan
```
Triggers a rescan of `~/.claude.json` to refresh the project list.

**Note:** The endpoint is `/api/projects/scan` (not `/api/scan`).

**Response:**
```json
{
  "success": true,
  "projectCount": 10,
  "error": null
}
```

#### Get Project Agents
```
GET /api/projects/:projectId/agents
```
Returns all subagents for a specific project from `.claude/agents/*.md`.

**Response:**
```json
{
  "success": true,
  "agents": [
    {
      "name": "backend-architect",
      "file": "backend-architect.md",
      "path": "/absolute/path/to/.claude/agents/backend-architect.md",
      "frontmatter": {
        "description": "Expert backend architect"
      },
      "content": "# Backend Architect\n\nYou are...",
      "description": "Expert backend architect"
    }
  ],
  "warnings": [
    {
      "file": "/path/to/malformed.md",
      "error": "Invalid YAML frontmatter: ...",
      "skipped": true
    }
  ],
  "projectId": "projectId",
  "projectPath": "/absolute/path/to/project"
}
```

**Error Handling:**
- Malformed YAML files are skipped and reported in `warnings` array
- Valid files are parsed successfully even if some files fail
- Endpoint never crashes due to malformed files

#### Get Project Commands
```
GET /api/projects/:projectId/commands
```
Returns all slash commands for a project from `.claude/commands/**/*.md` (supports nested directories).

**Response:**
```json
{
  "success": true,
  "commands": [
    {
      "name": "git/commit",
      "file": "git/commit.md",
      "path": "/absolute/path/to/.claude/commands/git/commit.md",
      "frontmatter": {},
      "content": "Creates a git commit...",
      "description": ""
    }
  ],
  "projectId": "projectId",
  "projectPath": "/absolute/path/to/project"
}
```

#### Get Project Hooks
```
GET /api/projects/:projectId/hooks
```
Returns all hooks from `.claude/settings.json` and `.claude/settings.local.json`.

**Response:**
```json
{
  "success": true,
  "hooks": [
    {
      "event": "on_code_change",
      "matcher": "*.js",
      "source": "settings.json"
    }
  ],
  "projectId": "projectId",
  "projectPath": "/absolute/path/to/project"
}
```

#### Get Project MCP Servers
```
GET /api/projects/:projectId/mcp
```
Returns all MCP servers from `.mcp.json` at the project root.

**Response:**
```json
{
  "success": true,
  "mcp": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "source": ".mcp.json"
    }
  ],
  "projectId": "projectId",
  "projectPath": "/absolute/path/to/project"
}
```

### User-Level Configurations

#### Get User Agents
```
GET /api/user/agents
```
Returns user-level subagents from `~/.claude/agents/*.md`.

#### Get User Commands
```
GET /api/user/commands
```
Returns user-level slash commands from `~/.claude/commands/**/*.md`.

#### Get User Hooks
```
GET /api/user/hooks
```
Returns user-level hooks from `~/.claude/settings.json`.

#### Get User MCP Servers
```
GET /api/user/mcp
```
Returns user-level MCP servers from `~/.claude/settings.json`.

## Error Handling

### Resilient Parser Architecture (Phase 1 Complete)

All parser endpoints now implement **graceful degradation** with comprehensive error handling:

**Response Format:**
```json
{
  "success": true,
  "data": [ /* valid items */ ],
  "warnings": [
    {
      "file": "/path/to/malformed.md",
      "error": "Invalid YAML frontmatter: ...",
      "skipped": true
    }
  ]
}
```

**Error Handling Features:**
1. **Malformed Files**: Skipped and reported in `warnings` array
2. **Type Validation**: Handles unexpected data types (array vs object)
3. **Partial Success**: Returns valid data even if some files fail
4. **Never Crashes**: Endpoints always return 200 status with partial results

**Error Format:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common Error Scenarios:**
- **404 Not Found**: Project ID does not exist or project directory is missing
- **500 Internal Server Error**: Critical failures only (endpoint never crashes on malformed data)

**Graceful Handling:**
- Missing files return empty arrays (not errors)
- Malformed JSON/YAML files are skipped with warnings
- Invalid project paths are marked with `exists: false`
- Type validation errors handled gracefully (hooks as object vs array)

**Implementation:**
- All 4 parsers (agents, commands, hooks, MCP) use consistent error handling
- PRs #10, #11, #12, #13 added error handling to each parser
- BUG-001 and BUG-002 resolved with this pattern

## Data Sources

### Project Discovery
- `~/.claude.json` - Project list (paths are keys in `projects` object)

### Per-Project Configurations
- `.claude/agents/*.md` - Subagents (Markdown with YAML frontmatter)
- `.claude/commands/**/*.md` - Slash commands (supports nested directories)
- `.claude/settings.json` - Project settings including hooks
- `.claude/settings.local.json` - Local project settings (overrides)
- `.mcp.json` - Project MCP server configurations

### User-Level Configurations
- `~/.claude/agents/*.md` - User subagents
- `~/.claude/commands/**/*.md` - User slash commands
- `~/.claude/settings.json` - User settings (hooks and MCP servers)

## Project ID Format

Project IDs are derived from project paths by removing special characters:

```
/home/user/projects/myapp → homeuserprojectsmyapp
C:\Users\user\projects\myapp → Cusersuserprojectsmyapp
```

This ensures URL-safe identifiers for API routes.

## CORS Configuration

CORS is enabled for all origins to support local frontend development. In production, this should be restricted to specific origins.

## Static File Serving

The backend serves the frontend application from `src/frontend/`. All non-API routes return `index.html` to support client-side routing in the Vue SPA.

## Security Considerations

- **Path Traversal Prevention**: The `safePath()` utility ensures all file reads stay within allowed directories
- **No Authentication**: Phase 1 MVP is local-only with no authentication
- **Input Validation**: Project IDs are validated against the discovered project list

## Dependencies

- **express** (^4.18.2): Web server framework
- **cors** (^2.8.5): CORS middleware
- **gray-matter** (^4.0.3): Markdown parsing with YAML frontmatter extraction

## Development Notes

- Server uses in-memory caching for project list (refreshed on `/api/projects/scan`)
- All file operations are asynchronous using `fs.promises`
- Markdown parsing extracts YAML frontmatter between `---` delimiters
- Recursive directory scanning supports nested command structures

## Future Enhancements (Phase 2+)

- POST/PUT/DELETE endpoints for CRUD operations
- File watching for automatic updates
- Configuration validation
- Caching layer for improved performance
- WebSocket support for real-time updates
