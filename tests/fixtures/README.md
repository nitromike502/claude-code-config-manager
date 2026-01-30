# Test Fixtures

This directory contains all test fixtures (mock data) for the Claude Code Config Manager backend test suite.

**Purpose:** Provide realistic, reusable test data for comprehensive backend testing.

**Created:** 2025-10-12
**Version:** 1.0

---

## Directory Structure

```
fixtures/
├── projects/          # Mock project directories (full structure)
│   ├── valid-project/
│   ├── minimal-project/
│   └── malformed-project/
├── user/              # Mock user-level configurations
├── samples/           # Individual sample files for parser unit tests
│   ├── agents/
│   ├── commands/
│   ├── settings/
│   └── mcp/
└── README.md          # This file
```

---

## Project Fixtures

### `projects/valid-project/`

**Purpose:** Complete, realistic Claude Code project with all configuration types.

**Contents:**
- `.claude/agents/valid-agent.md` - Valid agent with all YAML fields
- `.claude/agents/malformed-agent.md` - Agent with broken YAML (tests error handling)
- `.claude/commands/simple-command.md` - Top-level command
- `.claude/commands/nested/nested-command.md` - Nested command (tests namespacing)
- `.claude/settings.json` - Project settings with hooks and MCP servers
- `.claude/settings.local.json` - Local settings with additional hooks
- `.mcp.json` - Project MCP servers configuration

**Use Cases:**
- Integration tests requiring full project structure
- Testing multiple config types together
- Verifying file discovery across directories
- Testing merge logic (settings + settings.local)

---

### `projects/minimal-project/`

**Purpose:** Bare minimum valid Claude Code project.

**Contents:**
- `.claude/settings.json` - Empty settings file (minimal requirement)

**Use Cases:**
- Testing projects with no agents, commands, or MCP servers
- Verifying empty directory handling
- Testing default values and fallbacks

---

### `projects/malformed-project/`

**Purpose:** Project with intentional errors for error handling tests.

**Contents:**
- `.claude/agents/invalid.md` - Completely broken YAML
- `.claude/settings.json` - Invalid JSON syntax (missing commas)
- `.mcp.json` - Invalid JSON syntax (trailing comma, missing commas)

**Use Cases:**
- Testing resilient error handling
- Verifying warnings system
- Ensuring server doesn't crash on malformed files
- Testing BUG-001 and BUG-002 regression scenarios

---

## User Fixtures

### `user/.claude/`

**Purpose:** Mock user-level configurations.

**Contents:**
- `agents/user-agent.md` - User-level agent (code-reviewer)
- `commands/user-command.md` - User-level command (review-pr)
- `settings.json` - User settings with hooks and MCP servers

**Use Cases:**
- Testing user-level config endpoints
- Verifying separation of user vs project configs
- Testing combined project + user workflows

---

### `user/claude.json`

**Purpose:** Mock project list pointing to fixture projects.

**Contents:**
```json
{
  "projects": {
    "/home/claude/manager/tests/fixtures/projects/valid-project": {...},
    "/home/claude/manager/tests/fixtures/projects/minimal-project": {...},
    "/home/claude/manager/tests/fixtures/projects/malformed-project": {...}
  }
}
```

**Use Cases:**
- Testing project discovery service
- Mocking `~/.claude.json` in tests
- Integration tests requiring project lists

---

## Sample Fixtures

### `samples/agents/`

**Purpose:** Individual agent files for parser unit tests.

**Files:**
- `valid-complete.md` - Agent with all YAML fields present
- `valid-minimal.md` - Agent with only required fields (name, description)
- `invalid-yaml.md` - Malformed YAML frontmatter
- `missing-frontmatter.md` - No YAML frontmatter (markdown only)
- `empty.md` - Empty file

**Use Cases:**
- Unit testing `subagentParser.js` in isolation
- Testing YAML parsing edge cases
- Verifying field extraction and defaults
- Testing error handling without full project setup

---

### `samples/commands/`

**Purpose:** Individual command files for parser unit tests.

**Files:**
- `valid-complete.md` - Command with all YAML fields
- `valid-minimal.md` - Command with only name field
- `invalid-yaml.md` - Malformed YAML frontmatter
- `empty.md` - Empty file

**Use Cases:**
- Unit testing `commandParser.js` in isolation
- Testing command field extraction
- Verifying fallback descriptions (from first line)
- Testing error handling

---

### `samples/settings/`

**Purpose:** Settings JSON files for hooks and MCP parser unit tests.

**Files:**
- `valid-complete.json` - Settings with both hooks and MCP servers
- `valid-minimal.json` - Empty settings object `{}`
- `invalid-json.json` - Malformed JSON syntax
- `valid-hooks.json` - Settings with multiple hook types
- `valid-mcp.json` - Settings with multiple MCP servers

**Use Cases:**
- Unit testing `hookParser.js` in isolation
- Unit testing `mcpParser.js` with settings.json format
- Testing JSON parsing error handling
- Verifying hook and MCP server structure validation

---

### `samples/mcp/`

**Purpose:** MCP JSON files for MCP parser unit tests.

**Files:**
- `valid-complete.json` - Complete .mcp.json with multiple servers
- `valid-minimal.json` - Minimal .mcp.json (one server)
- `invalid.json` - Malformed JSON syntax

**Use Cases:**
- Unit testing `mcpParser.js` with .mcp.json format
- Testing MCP server configuration validation
- Testing transport type detection (stdio, http, sse)
- Verifying environment variable handling

---

## Usage Guidelines

### In Tests

Import fixtures using absolute paths:

```javascript
const validProjectPath = '/home/claude/manager/tests/fixtures/projects/valid-project';
const userFixturePath = '/home/claude/manager/tests/fixtures/user';
const agentSamplePath = '/home/claude/manager/tests/fixtures/samples/agents/valid-complete.md';
```

### Mocking User Home

For tests that read `~/.claude.json`, mock the home directory:

```javascript
process.env.HOME = '/home/claude/manager/tests/fixtures/user';
```

### Parsing Sample Files

Use parsers directly with sample file paths:

```javascript
const { parseSubagent } = require('../../src/backend/parsers/subagentParser');
const agent = await parseSubagent('/home/claude/manager/tests/fixtures/samples/agents/valid-complete.md');
```

---

## Maintenance

### Adding New Fixtures

1. Create fixture file in appropriate directory
2. Document in this README
3. Update relevant test files to use new fixture
4. Commit with descriptive message: `test(fixtures): add [description]`

### Updating Fixtures

When data structures change:
1. Update affected fixture files
2. Update this README if structure changes
3. Verify all tests still pass
4. Commit with message: `test(fixtures): update [description] for [reason]`

### Fixture Guidelines

- **Realistic:** Mirror real Claude Code project structures
- **Minimal:** Include only necessary fields for testing
- **Documented:** Inline comments explaining purpose
- **Consistent:** Follow naming conventions (valid-*, invalid-*, malformed-*)
- **Intentional Errors:** Make malformed fixtures obviously broken (not subtle)

---

## Cross-Platform Compatibility

All fixtures use Unix-style paths (`/home/...`). Tests should handle:
- Path normalization (Windows `\` vs Unix `/`)
- Home directory expansion (`~`)
- Absolute vs relative path handling

See `pathUtils.js` for cross-platform path handling utilities.

---

## Test Coverage

These fixtures support testing:

- ✅ All 11 API endpoints
- ✅ All 4 parsers (agents, commands, hooks, MCP)
- ✅ Error handling (malformed YAML/JSON)
- ✅ Missing files and directories
- ✅ Warnings system
- ✅ Project discovery
- ✅ Merge logic (project + local settings)
- ✅ Nested directory structures (commands)
- ✅ BUG-001 and BUG-002 regression tests

---

## Related Documentation

- **Test Structure:** `/home/claude/manager/docs/testing/TESTING-STRUCTURE.md`
- **Test Tickets:** `/home/claude/manager/docs/testing/TEST-TICKETS.md`
- **Backend Source:** `/home/claude/manager/src/backend/`

---

**Maintained by:** Claude Code Config Manager Testing Team
**Last Updated:** 2025-10-12
