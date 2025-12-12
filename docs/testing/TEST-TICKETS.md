# Backend Test Development Tickets

**Document Version:** 1.0
**Created:** 2025-10-12
**Status:** Ready for Development
**Reference:** See `TESTING-STRUCTURE.md` for detailed structure

---

## Overview

This document contains all test development tickets for the Claude Code Config Manager backend. Tickets are organized by priority and feature group.

**Total Estimated Tests:** 160-235 tests across all feature groups
**Testing Framework:** Jest + Supertest
**Test Location:** `/home/claude/manager/tests/backend/`
**Fixtures Location:** `/home/claude/manager/tests/fixtures/`

---

## Priority Levels

- **P0 (Critical):** Must be completed before any other testing work
- **P1 (High):** Core feature testing - highest priority after fixtures
- **P2 (Medium):** Infrastructure and supporting features
- **P3 (Low):** Integration tests - complete after all other tests pass

---

# P0 (Critical) - Foundation

---

## Ticket 0: Test Fixtures Setup

**Priority:** P0 (Critical - MUST BE COMPLETED FIRST)
**Estimated Time:** 2-3 hours
**Estimated Test Count:** N/A (creates test data, not tests)
**Dependencies:** None

### Overview

Create all test fixtures (mock data files) required for backend testing. All other test tickets depend on these fixtures being created first. This establishes the single source of truth for test data across all test suites.

### Fixture Directories to Create

#### 1. Project Fixtures (`tests/fixtures/projects/`)

**`valid-project/`** - Complete valid project with all config types
```
tests/fixtures/projects/valid-project/
├── .claude/
│   ├── agents/
│   │   ├── valid-agent.md              # Complete agent with all fields
│   │   └── malformed-agent.md          # Agent with broken YAML
│   ├── commands/
│   │   ├── simple-command.md           # Top-level command
│   │   └── nested/
│   │       └── nested-command.md       # Nested command (namespacing)
│   ├── settings.json                   # Project settings with hooks
│   └── settings.local.json             # Local settings
└── .mcp.json                           # Project MCP servers
```

**`minimal-project/`** - Minimal valid project (bare minimum)
```
tests/fixtures/projects/minimal-project/
└── .claude/
    └── settings.json                   # Only required file
```

**`malformed-project/`** - Project with intentional errors
```
tests/fixtures/projects/malformed-project/
├── .claude/
│   ├── agents/
│   │   └── invalid.md                  # Completely broken YAML
│   └── settings.json                   # Invalid JSON syntax
└── .mcp.json                           # Invalid JSON syntax
```

#### 2. User Fixtures (`tests/fixtures/user/`)

**User-level configurations**
```
tests/fixtures/user/
├── .claude/
│   ├── agents/
│   │   └── user-agent.md               # User-level agent
│   ├── commands/
│   │   └── user-command.md             # User-level command
│   └── settings.json                   # User settings with hooks and MCP
└── claude.json                         # Mock project list (points to fixture projects)
```

#### 3. Sample Fixtures (`tests/fixtures/samples/`)

**Individual files for parser unit tests**

**`samples/agents/`**
- `valid-complete.md` - All YAML fields present
- `valid-minimal.md` - Only required fields (name, description)
- `invalid-yaml.md` - Malformed YAML frontmatter
- `missing-frontmatter.md` - No YAML frontmatter
- `empty.md` - Empty file

**`samples/commands/`**
- `valid-complete.md` - All fields present
- `valid-minimal.md` - Only required fields
- `invalid-yaml.md` - Malformed YAML
- `empty.md` - Empty file

**`samples/settings/`**
- `valid-complete.json` - All optional fields
- `valid-minimal.json` - Only required fields
- `invalid-json.json` - Malformed JSON
- `valid-hooks.json` - Settings with hooks configured
- `valid-mcp.json` - Settings with MCP servers

**`samples/mcp/`**
- `valid-complete.json` - Complete .mcp.json file
- `valid-minimal.json` - Minimal .mcp.json file
- `invalid.json` - Malformed JSON

### Fixture Content Guidelines

1. **Realistic Data:** Fixtures should mirror real Claude Code project structures
2. **Minimal but Complete:** Include only necessary fields for testing
3. **Documented:** Each fixture should have inline comments explaining its purpose
4. **Consistent:** Use consistent naming and structure across fixtures
5. **Error Cases:** Malformed fixtures should be obviously broken (not subtle errors)

### Example Fixture Content

**`valid-agent.md`** (sample):
```markdown
---
name: example-agent
description: Example subagent for testing
instructions: |
  This is a test agent.
  It demonstrates valid YAML frontmatter.
---

# Example Agent

This agent is used for testing.
```

**`claude.json`** (user fixture):
```json
{
  "projects": {
    "/home/claude/manager/tests/fixtures/projects/valid-project": {
      "lastAccessed": "2025-10-12T00:00:00.000Z"
    },
    "/home/claude/manager/tests/fixtures/projects/minimal-project": {
      "lastAccessed": "2025-10-12T00:00:00.000Z"
    }
  }
}
```

### Acceptance Criteria

- [ ] All project fixture directories created
- [ ] All user fixture directories created
- [ ] All sample fixture files created
- [ ] Fixtures follow documented structure in TESTING-STRUCTURE.md
- [ ] README.md created in fixtures/ directory documenting all fixtures
- [ ] Fixtures are referenced correctly in test ticket descriptions
- [ ] Valid fixtures parse correctly with existing backend code
- [ ] Malformed fixtures intentionally fail parsing as expected

### Deliverables

1. Complete fixture directory structure under `tests/fixtures/`
2. `tests/fixtures/README.md` documenting all fixtures and their purposes
3. Verification that fixtures work with existing backend parsers

---

# P1 (High) - Core Features

---

## Ticket 1: Test Suite - Agents Feature

**Priority:** P1 (High)
**Estimated Test Count:** 40-50 tests
**Estimated Time:** 3-4 hours (split across multiple 30-60 min tasks)
**Dependencies:** Ticket 0 (Fixtures) must be complete

### Overview

The Agents feature allows viewing subagents at both project and user levels. This includes parsing agent markdown files with YAML frontmatter, handling malformed files gracefully, and returning warnings when files cannot be parsed.

### Test Files to Create

#### 1. `tests/backend/endpoints/project-agents.test.js`
**Purpose:** Test GET /api/projects/:id/agents endpoint

**Test Coverage:**
- ✅ Valid project returns agents array
- ✅ Response structure includes `{data: [], warnings: []}`
- ✅ Valid agents are parsed correctly (all fields)
- ✅ Valid agents are parsed correctly (minimal fields)
- ✅ Malformed agents generate warnings (not errors)
- ✅ Invalid project ID returns 404
- ✅ Missing .claude/agents/ directory returns empty array
- ✅ Empty agents directory returns empty array
- ✅ Nested subdirectories are ignored (agents must be top-level)
- ✅ Non-.md files are ignored

**Estimated Tests:** 10-12 tests

#### 2. `tests/backend/endpoints/user-agents.test.js`
**Purpose:** Test GET /api/user/agents endpoint

**Test Coverage:**
- ✅ Returns user-level agents from ~/.claude/agents/
- ✅ Response structure includes `{data: [], warnings: []}`
- ✅ Valid agents are parsed correctly
- ✅ Malformed agents generate warnings
- ✅ Missing user agents directory returns empty array
- ✅ Handles missing ~/.claude/ gracefully

**Estimated Tests:** 6-8 tests

#### 3. `tests/backend/parsers/subagentParser.test.js`
**Purpose:** Unit test agent parser in isolation

**Test Coverage:**
- ✅ Parse valid agent with all fields
- ✅ Parse valid agent with minimal fields (name, description)
- ✅ Parse agent with missing frontmatter (returns null with warning)
- ✅ Parse agent with malformed YAML (returns null with warning)
- ✅ Parse empty file (returns null with warning)
- ✅ Parse file with only frontmatter (no markdown body)
- ✅ Parse file with special characters in YAML values
- ✅ Parse file with multiline YAML strings
- ✅ Handle extra fields gracefully (ignore unknown fields)
- ✅ Validate required fields (name, description)

**Estimated Tests:** 12-15 tests

#### 4. `tests/backend/errors/malformed-yaml.test.js` (agent-specific tests)
**Purpose:** Test resilient error handling for YAML parsing

**Test Coverage:**
- ✅ Malformed YAML frontmatter does not crash server
- ✅ Warning message includes file path
- ✅ Warning message includes error description
- ✅ System continues processing other agents
- ✅ Multiple malformed files generate multiple warnings
- ✅ Warnings array is returned in response

**Estimated Tests:** 6-8 tests

#### 5. `tests/backend/regression/bug-001-yaml.test.js`
**Purpose:** Regression test for BUG-001 (malformed YAML frontmatter)

**Bug Details:**
- **Bug ID:** BUG-001
- **Discovered:** 2025-10-10
- **Fixed:** PR #11 (2025-10-10)
- **Symptom:** Server crashed when parsing agent with malformed YAML frontmatter
- **Fix:** Wrapped YAML parsing in try-catch, return null with warning instead of throwing

**Test Coverage:**
- ✅ Reproduce original bug scenario (malformed YAML)
- ✅ Verify fix still works (no crash)
- ✅ Verify warning is generated
- ✅ Verify other agents in directory still parse correctly
- ✅ Test multiple types of YAML syntax errors

**Estimated Tests:** 5-7 tests

### Fixtures Required

From `tests/fixtures/`:
- `projects/valid-project/.claude/agents/valid-agent.md`
- `projects/valid-project/.claude/agents/malformed-agent.md`
- `projects/minimal-project/` (no agents)
- `projects/malformed-project/.claude/agents/invalid.md`
- `user/.claude/agents/user-agent.md`
- `samples/agents/valid-complete.md`
- `samples/agents/valid-minimal.md`
- `samples/agents/invalid-yaml.md`
- `samples/agents/missing-frontmatter.md`
- `samples/agents/empty.md`

### Test Development Tasks (30-60 min each)

**Task 1.1:** Create `project-agents.test.js` with happy path tests (30 min)
**Task 1.2:** Add error cases to `project-agents.test.js` (30 min)
**Task 1.3:** Create `user-agents.test.js` (30 min)
**Task 1.4:** Create `subagentParser.test.js` - valid cases (45 min)
**Task 1.5:** Add error cases to `subagentParser.test.js` (45 min)
**Task 1.6:** Create `malformed-yaml.test.js` (agent tests) (30 min)
**Task 1.7:** Create `bug-001-yaml.test.js` (30 min)

### Acceptance Criteria

- [ ] All 5 test files created
- [ ] 40-50 tests passing
- [ ] All fixtures exist and are used correctly
- [ ] Coverage includes happy path and error cases
- [ ] BUG-001 regression test validates fix
- [ ] Tests follow structure in TESTING-STRUCTURE.md
- [ ] All tests pass locally with `npm test`
- [ ] No tests are skipped or marked as `.todo`

---

## Ticket 2: Test Suite - Commands Feature

**Priority:** P1 (High)
**Estimated Test Count:** 40-50 tests
**Estimated Time:** 3-4 hours (split across multiple 30-60 min tasks)
**Dependencies:** Ticket 0 (Fixtures) must be complete

### Overview

The Commands feature allows viewing slash commands at both project and user levels. Commands support nested directory structures (namespacing) and have optional YAML frontmatter.

### Test Files to Create

#### 1. `tests/backend/endpoints/project-commands.test.js`
**Purpose:** Test GET /api/projects/:id/commands endpoint

**Test Coverage:**
- ✅ Valid project returns commands array
- ✅ Response structure includes `{data: [], warnings: []}`
- ✅ Commands are parsed correctly (with frontmatter)
- ✅ Commands are parsed correctly (without frontmatter)
- ✅ Nested commands are discovered (recursive directory scan)
- ✅ Command names include namespace (e.g., "nested/command")
- ✅ Malformed commands generate warnings
- ✅ Invalid project ID returns 404
- ✅ Missing .claude/commands/ directory returns empty array
- ✅ Empty commands directory returns empty array
- ✅ Non-.md files are ignored

**Estimated Tests:** 12-15 tests

#### 2. `tests/backend/endpoints/user-commands.test.js`
**Purpose:** Test GET /api/user/commands endpoint

**Test Coverage:**
- ✅ Returns user-level commands from ~/.claude/commands/
- ✅ Response structure includes `{data: [], warnings: []}`
- ✅ Valid commands are parsed correctly
- ✅ Nested commands are discovered
- ✅ Malformed commands generate warnings
- ✅ Missing user commands directory returns empty array

**Estimated Tests:** 6-8 tests

#### 3. `tests/backend/parsers/commandParser.test.js`
**Purpose:** Unit test command parser in isolation

**Test Coverage:**
- ✅ Parse command with complete frontmatter
- ✅ Parse command with minimal frontmatter
- ✅ Parse command without frontmatter (extract from content)
- ✅ Parse command with malformed YAML (returns warning)
- ✅ Parse empty file (returns warning)
- ✅ Derive command name from file path
- ✅ Handle special characters in command names
- ✅ Extract description from frontmatter or first line
- ✅ Handle multiline descriptions
- ✅ Validate command structure

**Estimated Tests:** 12-15 tests

#### 4. `tests/backend/errors/malformed-yaml.test.js` (command-specific tests)
**Purpose:** Test resilient error handling for command YAML parsing

**Test Coverage:**
- ✅ Malformed YAML in command does not crash server
- ✅ Warning message includes file path
- ✅ Warning message includes error description
- ✅ System continues processing other commands
- ✅ Multiple malformed files generate multiple warnings
- ✅ Commands without frontmatter are still processed

**Estimated Tests:** 6-8 tests

### Fixtures Required

From `tests/fixtures/`:
- `projects/valid-project/.claude/commands/simple-command.md`
- `projects/valid-project/.claude/commands/nested/nested-command.md`
- `user/.claude/commands/user-command.md`
- `samples/commands/valid-complete.md`
- `samples/commands/valid-minimal.md`
- `samples/commands/invalid-yaml.md`
- `samples/commands/empty.md`

### Test Development Tasks (30-60 min each)

**Task 2.1:** Create `project-commands.test.js` with happy path tests (30 min)
**Task 2.2:** Add nested directory and error cases to `project-commands.test.js` (45 min)
**Task 2.3:** Create `user-commands.test.js` (30 min)
**Task 2.4:** Create `commandParser.test.js` - valid cases (45 min)
**Task 2.5:** Add error cases to `commandParser.test.js` (45 min)
**Task 2.6:** Add command-specific tests to `malformed-yaml.test.js` (30 min)

### Acceptance Criteria

- [ ] All 4 test files created (1 shared with agents)
- [ ] 40-50 tests passing
- [ ] All fixtures exist and are used correctly
- [ ] Nested directory handling tested thoroughly
- [ ] Commands without frontmatter handled gracefully
- [ ] Tests follow structure in TESTING-STRUCTURE.md
- [ ] All tests pass locally with `npm test`
- [ ] No tests are skipped or marked as `.todo`

---

## Ticket 3: Test Suite - Hooks Feature

**Priority:** P1 (High)
**Estimated Test Count:** 35-45 tests
**Estimated Time:** 3-4 hours (split across multiple 30-60 min tasks)
**Dependencies:** Ticket 0 (Fixtures) must be complete

### Overview

The Hooks feature allows viewing hook configurations at project, project-local, and user levels. Hooks are stored in JSON settings files and include event types and matcher patterns.

### Test Files to Create

#### 1. `tests/backend/endpoints/project-hooks.test.js`
**Purpose:** Test GET /api/projects/:id/hooks endpoint

**Test Coverage:**
- ✅ Valid project returns hooks array
- ✅ Response structure includes `{data: [], warnings: []}`
- ✅ Hooks from settings.json are parsed correctly
- ✅ Hooks from settings.local.json are merged
- ✅ Local hooks override project hooks (same event)
- ✅ Hook structure includes event, matcher, pattern
- ✅ Malformed JSON generates warnings
- ✅ Invalid project ID returns 404
- ✅ Missing settings.json returns empty array
- ✅ Empty hooks section returns empty array

**Estimated Tests:** 10-12 tests

#### 2. `tests/backend/endpoints/user-hooks.test.js`
**Purpose:** Test GET /api/user/hooks endpoint

**Test Coverage:**
- ✅ Returns user-level hooks from ~/.claude/settings.json
- ✅ Response structure includes `{data: [], warnings: []}`
- ✅ Valid hooks are parsed correctly
- ✅ Malformed JSON generates warnings
- ✅ Missing user settings returns empty array
- ✅ Empty hooks section returns empty array

**Estimated Tests:** 6-8 tests

#### 3. `tests/backend/parsers/hookParser.test.js`
**Purpose:** Unit test hook parser in isolation

**Test Coverage:**
- ✅ Parse hooks from valid settings.json
- ✅ Parse hooks with all optional fields
- ✅ Parse hooks with minimal fields (event only)
- ✅ Handle missing hooks section (return empty array)
- ✅ Handle malformed JSON (return empty with warning)
- ✅ Merge project and local hooks
- ✅ Validate hook structure (event, matcher, pattern)
- ✅ Handle various event types
- ✅ Handle various matcher patterns

**Estimated Tests:** 10-12 tests

#### 4. `tests/backend/errors/malformed-json.test.js` (hooks-specific tests)
**Purpose:** Test resilient error handling for JSON parsing

**Test Coverage:**
- ✅ Malformed JSON does not crash server
- ✅ Warning message includes file path
- ✅ Warning message includes error description
- ✅ System continues processing (returns empty array)
- ✅ Multiple malformed files generate multiple warnings

**Estimated Tests:** 5-7 tests

#### 5. `tests/backend/regression/bug-002-hooks.test.js`
**Purpose:** Regression test for BUG-002 (hooks parser error handling)

**Bug Details:**
- **Bug ID:** BUG-002
- **Discovered:** 2025-10-11
- **Fixed:** PR #12 (2025-10-11)
- **Symptom:** Server crashed when settings.json had malformed JSON
- **Fix:** Added try-catch to JSON parsing, return empty array with warning

**Test Coverage:**
- ✅ Reproduce original bug scenario (malformed JSON)
- ✅ Verify fix still works (no crash)
- ✅ Verify warning is generated
- ✅ Verify empty array is returned
- ✅ Test multiple types of JSON syntax errors

**Estimated Tests:** 5-7 tests

### Fixtures Required

From `tests/fixtures/`:
- `projects/valid-project/.claude/settings.json` (with hooks)
- `projects/valid-project/.claude/settings.local.json` (with hooks)
- `projects/malformed-project/.claude/settings.json` (invalid JSON)
- `user/.claude/settings.json` (with hooks)
- `samples/settings/valid-complete.json`
- `samples/settings/valid-minimal.json`
- `samples/settings/invalid-json.json`
- `samples/settings/valid-hooks.json`

### Test Development Tasks (30-60 min each)

**Task 3.1:** Create `project-hooks.test.js` with happy path tests (30 min)
**Task 3.2:** Add merge logic and error cases to `project-hooks.test.js` (45 min)
**Task 3.3:** Create `user-hooks.test.js` (30 min)
**Task 3.4:** Create `hookParser.test.js` - valid cases (45 min)
**Task 3.5:** Add error cases to `hookParser.test.js` (45 min)
**Task 3.6:** Create `malformed-json.test.js` (hooks tests) (30 min)
**Task 3.7:** Create `bug-002-hooks.test.js` (30 min)

### Acceptance Criteria

- [ ] All 5 test files created
- [ ] 35-45 tests passing
- [ ] All fixtures exist and are used correctly
- [ ] Merge logic for project/local hooks tested
- [ ] BUG-002 regression test validates fix
- [ ] Tests follow structure in TESTING-STRUCTURE.md
- [ ] All tests pass locally with `npm test`
- [ ] No tests are skipped or marked as `.todo`

---

## Ticket 4: Test Suite - MCP Feature

**Priority:** P1 (High)
**Estimated Test Count:** 35-45 tests
**Estimated Time:** 3-4 hours (split across multiple 30-60 min tasks)
**Dependencies:** Ticket 0 (Fixtures) must be complete

### Overview

The MCP feature allows viewing MCP (Model Context Protocol) server configurations at project and user levels. MCP servers are configured in `.mcp.json` (project-level) and `~/.claude/settings.json` (user-level).

### Test Files to Create

#### 1. `tests/backend/endpoints/project-mcp.test.js`
**Purpose:** Test GET /api/projects/:id/mcp endpoint

**Test Coverage:**
- ✅ Valid project returns MCP servers array
- ✅ Response structure includes `{data: [], warnings: []}`
- ✅ MCP servers from .mcp.json are parsed correctly
- ✅ Server structure includes name, transport, command/url
- ✅ stdio transport servers parsed correctly
- ✅ HTTP/SSE transport servers parsed correctly
- ✅ Malformed JSON generates warnings
- ✅ Invalid project ID returns 404
- ✅ Missing .mcp.json returns empty array
- ✅ Empty mcpServers section returns empty array

**Estimated Tests:** 10-12 tests

#### 2. `tests/backend/endpoints/user-mcp.test.js`
**Purpose:** Test GET /api/user/mcp endpoint

**Test Coverage:**
- ✅ Returns user-level MCP servers from ~/.claude/settings.json
- ✅ Response structure includes `{data: [], warnings: []}`
- ✅ Valid MCP servers are parsed correctly
- ✅ Malformed JSON generates warnings
- ✅ Missing user settings returns empty array
- ✅ Empty mcpServers section returns empty array

**Estimated Tests:** 6-8 tests

#### 3. `tests/backend/parsers/mcpParser.test.js`
**Purpose:** Unit test MCP parser in isolation

**Test Coverage:**
- ✅ Parse MCP servers from valid .mcp.json
- ✅ Parse stdio transport server (command, args, env)
- ✅ Parse HTTP transport server (url, headers)
- ✅ Parse SSE transport server (url, headers)
- ✅ Handle missing mcpServers section (return empty array)
- ✅ Handle malformed JSON (return empty with warning)
- ✅ Validate server structure
- ✅ Handle various transport types
- ✅ Handle optional fields (env, headers)
- ✅ Handle server-specific configurations

**Estimated Tests:** 12-15 tests

#### 4. `tests/backend/errors/malformed-json.test.js` (MCP-specific tests)
**Purpose:** Test resilient error handling for MCP JSON parsing

**Test Coverage:**
- ✅ Malformed .mcp.json does not crash server
- ✅ Warning message includes file path
- ✅ Warning message includes error description
- ✅ System continues processing (returns empty array)
- ✅ Multiple malformed files generate multiple warnings

**Estimated Tests:** 5-7 tests

### Fixtures Required

From `tests/fixtures/`:
- `projects/valid-project/.mcp.json`
- `projects/malformed-project/.mcp.json` (invalid JSON)
- `user/.claude/settings.json` (with mcpServers)
- `samples/mcp/valid-complete.json`
- `samples/mcp/valid-minimal.json`
- `samples/mcp/invalid.json`
- `samples/settings/valid-mcp.json`

### Test Development Tasks (30-60 min each)

**Task 4.1:** Create `project-mcp.test.js` with happy path tests (30 min)
**Task 4.2:** Add transport types and error cases to `project-mcp.test.js` (45 min)
**Task 4.3:** Create `user-mcp.test.js` (30 min)
**Task 4.4:** Create `mcpParser.test.js` - valid cases (45 min)
**Task 4.5:** Add error cases to `mcpParser.test.js` (45 min)
**Task 4.6:** Add MCP-specific tests to `malformed-json.test.js` (30 min)

### Acceptance Criteria

- [ ] All 4 test files created (1 shared with hooks)
- [ ] 35-45 tests passing
- [ ] All fixtures exist and are used correctly
- [ ] All transport types tested (stdio, HTTP, SSE)
- [ ] Server configuration edge cases covered
- [ ] Tests follow structure in TESTING-STRUCTURE.md
- [ ] All tests pass locally with `npm test`
- [ ] No tests are skipped or marked as `.todo`

---

# P2 (Medium) - Infrastructure

---

## Ticket 5: Test Suite - Project Discovery Feature

**Priority:** P2 (Medium)
**Estimated Test Count:** 25-30 tests
**Estimated Time:** 2-3 hours (split across multiple 30-60 min tasks)
**Dependencies:** Ticket 0 (Fixtures) must be complete

### Overview

The Project Discovery feature reads the list of Claude Code projects from `~/.claude.json` and provides endpoints to list projects and trigger rescans.

### Test Files to Create

#### 1. `tests/backend/endpoints/projects.test.js`
**Purpose:** Test GET /api/projects and POST /api/projects/scan endpoints

**Test Coverage:**
- ✅ GET /api/projects returns project list
- ✅ Response structure includes project metadata
- ✅ Project name is derived from directory name
- ✅ Project path is included in response
- ✅ Project counts calculated correctly (agents, commands, hooks, MCP)
- ✅ Invalid/missing projects are filtered out
- ✅ Empty project list handled gracefully
- ✅ POST /api/projects/scan triggers rescan
- ✅ Rescan updates project list
- ✅ Malformed ~/.claude.json generates warning

**Estimated Tests:** 10-12 tests

#### 2. `tests/backend/services/projectDiscovery.test.js`
**Purpose:** Unit test project discovery service

**Test Coverage:**
- ✅ Read projects from ~/.claude.json
- ✅ Parse projects object (paths are keys)
- ✅ Validate project directories exist
- ✅ Derive project names from paths
- ✅ Calculate config counts for each project
- ✅ Handle missing ~/.claude.json
- ✅ Handle malformed JSON
- ✅ Handle invalid project paths
- ✅ Handle permission errors
- ✅ Cross-platform path handling

**Estimated Tests:** 12-15 tests

### Fixtures Required

From `tests/fixtures/`:
- `user/claude.json` (mock project list)
- `projects/valid-project/` (for count calculations)
- `projects/minimal-project/` (for count calculations)

### Test Development Tasks (30-60 min each)

**Task 5.1:** Create `projects.test.js` with GET endpoint tests (30 min)
**Task 5.2:** Add POST /scan endpoint tests (30 min)
**Task 5.3:** Create `projectDiscovery.test.js` - valid cases (45 min)
**Task 5.4:** Add error cases to `projectDiscovery.test.js` (45 min)

### Acceptance Criteria

- [ ] All 2 test files created
- [ ] 25-30 tests passing
- [ ] All fixtures exist and are used correctly
- [ ] Project discovery logic thoroughly tested
- [ ] Count calculations verified
- [ ] Tests follow structure in TESTING-STRUCTURE.md
- [ ] All tests pass locally with `npm test`
- [ ] No tests are skipped or marked as `.todo`

---

## Ticket 6: Test Suite - Core Infrastructure

**Priority:** P2 (Medium)
**Estimated Test Count:** 30-40 tests
**Estimated Time:** 2-3 hours (split across multiple 30-60 min tasks)
**Dependencies:** Ticket 0 (Fixtures) must be complete

### Overview

Core infrastructure includes health checks, file reading utilities, path handling utilities, and the warnings system. These are foundational components used across all features.

### Test Files to Create

#### 1. `tests/backend/endpoints/health.test.js`
**Purpose:** Test GET /api/health endpoint (expand existing smoke test)

**Test Coverage:**
- ✅ Returns 200 status
- ✅ Response includes status: "ok"
- ✅ Response includes server version
- ✅ Response includes uptime
- ✅ Response includes system information
- ✅ Fast response time (< 100ms)

**Estimated Tests:** 5-7 tests

#### 2. `tests/backend/services/fileReader.test.js`
**Purpose:** Unit test file reader service

**Test Coverage:**
- ✅ Read valid file successfully
- ✅ Read markdown file with frontmatter
- ✅ Read JSON file
- ✅ Handle missing file gracefully
- ✅ Handle permission errors
- ✅ Handle large files
- ✅ Handle binary files (skip/warning)
- ✅ Cross-platform path handling
- ✅ Handle special characters in paths

**Estimated Tests:** 10-12 tests

#### 3. `tests/backend/utils/pathUtils.test.js`
**Purpose:** Unit test path utility functions

**Test Coverage:**
- ✅ Expand home directory (~)
- ✅ Normalize paths (cross-platform)
- ✅ Convert project path to ID
- ✅ Convert project ID to path
- ✅ Handle Windows paths (C:\Users\...)
- ✅ Handle Unix paths (/home/user/...)
- ✅ Handle paths with spaces
- ✅ Handle paths with special characters
- ✅ Handle relative paths
- ✅ Validate path security (no directory traversal)

**Estimated Tests:** 10-12 tests

#### 4. `tests/backend/errors/missing-files.test.js`
**Purpose:** Test handling of missing files and directories

**Test Coverage:**
- ✅ Missing agent directory returns empty array
- ✅ Missing command directory returns empty array
- ✅ Missing settings.json returns empty array
- ✅ Missing .mcp.json returns empty array
- ✅ Missing project directory returns 404
- ✅ No warnings generated for expected missing files

**Estimated Tests:** 6-8 tests

#### 5. `tests/backend/errors/warnings.test.js`
**Purpose:** Test warnings system validation

**Test Coverage:**
- ✅ Warnings are returned in response structure
- ✅ Warning includes file path
- ✅ Warning includes error description
- ✅ Warning includes error type
- ✅ Multiple warnings are aggregated
- ✅ Warnings do not affect valid data
- ✅ Warning format is consistent

**Estimated Tests:** 7-9 tests

### Fixtures Required

From `tests/fixtures/`:
- All project fixtures (for missing file tests)
- All malformed fixtures (for warning tests)
- `samples/` files (for file reader tests)

### Test Development Tasks (30-60 min each)

**Task 6.1:** Expand `health.test.js` with additional checks (30 min)
**Task 6.2:** Create `fileReader.test.js` (45 min)
**Task 6.3:** Create `pathUtils.test.js` (45 min)
**Task 6.4:** Create `missing-files.test.js` (30 min)
**Task 6.5:** Create `warnings.test.js` (30 min)

### Acceptance Criteria

- [ ] All 5 test files created
- [ ] 30-40 tests passing
- [ ] All fixtures exist and are used correctly
- [ ] Cross-platform compatibility tested
- [ ] Warnings system thoroughly validated
- [ ] Tests follow structure in TESTING-STRUCTURE.md
- [ ] All tests pass locally with `npm test`
- [ ] No tests are skipped or marked as `.todo`

---

# P3 (Low) - Integration

---

## Ticket 7: Test Suite - Integration Tests

**Priority:** P3 (Low - complete after all other tests pass)
**Estimated Test Count:** 15-20 tests
**Estimated Time:** 2-3 hours (split across multiple 30-60 min tasks)
**Dependencies:** All P0, P1, and P2 tickets must be complete

### Overview

Integration tests validate that all components work together correctly in realistic end-to-end scenarios. These tests should only be created after all unit and endpoint tests pass.

### Test Files to Create

#### 1. `tests/backend/integration/full-workflow.test.js`
**Purpose:** Test complete project discovery → data retrieval workflow

**Test Coverage:**
- ✅ Discover projects from ~/.claude.json
- ✅ Retrieve all agents for a project
- ✅ Retrieve all commands for a project
- ✅ Retrieve all hooks for a project
- ✅ Retrieve all MCP servers for a project
- ✅ Retrieve all user-level configs
- ✅ End-to-end workflow completes successfully
- ✅ Data integrity maintained across requests
- ✅ Warnings propagate correctly

**Estimated Tests:** 8-10 tests

#### 2. `tests/backend/integration/multi-project.test.js`
**Purpose:** Test multiple projects with various configurations

**Test Coverage:**
- ✅ Multiple projects discovered correctly
- ✅ Each project's data is isolated
- ✅ Mixed valid/invalid projects handled correctly
- ✅ Large number of projects handled efficiently
- ✅ Projects with different config types
- ✅ Projects with overlapping names

**Estimated Tests:** 6-8 tests

### Fixtures Required

From `tests/fixtures/`:
- All project fixtures
- All user fixtures
- Mock ~/.claude.json with multiple projects

### Test Development Tasks (30-60 min each)

**Task 7.1:** Create `full-workflow.test.js` - happy path (45 min)
**Task 7.2:** Add error scenarios to `full-workflow.test.js` (45 min)
**Task 7.3:** Create `multi-project.test.js` (60 min)

### Acceptance Criteria

- [ ] All 2 test files created
- [ ] 15-20 tests passing
- [ ] All fixtures exist and are used correctly
- [ ] End-to-end workflows tested thoroughly
- [ ] Tests follow structure in TESTING-STRUCTURE.md
- [ ] All tests pass locally with `npm test`
- [ ] No tests are skipped or marked as `.todo`
- [ ] Integration tests complete without errors

---

# Test Report Summary

## Total Test Coverage

| Priority | Tickets | Estimated Tests | Estimated Time |
|----------|---------|----------------|----------------|
| P0 | 1 ticket | N/A (fixtures) | 2-3 hours |
| P1 | 4 tickets | 150-190 tests | 12-16 hours |
| P2 | 2 tickets | 55-70 tests | 4-6 hours |
| P3 | 1 ticket | 15-20 tests | 2-3 hours |
| **Total** | **8 tickets** | **220-280 tests** | **20-28 hours** |

## Development Sequence

1. **Week 1, Day 1-2:** Ticket 0 (Fixtures) - Foundation for all testing
2. **Week 1, Day 3-5:** Tickets 1-4 (P1 features) - Core feature testing
3. **Week 2, Day 1-2:** Tickets 5-6 (P2 infrastructure) - Supporting systems
4. **Week 2, Day 3:** Ticket 7 (P3 integration) - End-to-end validation

## Success Metrics

- ✅ All 220-280 tests passing
- ✅ 100% of backend code paths tested
- ✅ All error scenarios validated
- ✅ All regression bugs prevented
- ✅ Cross-platform compatibility verified
- ✅ Test execution time < 30 seconds total
- ✅ Zero flaky tests
- ✅ Clear, maintainable test code

---

**Document Owner:** Claude Code Config Manager Team
**Review Schedule:** Daily during test development
**Next Review:** After Ticket 0 (Fixtures) completion

