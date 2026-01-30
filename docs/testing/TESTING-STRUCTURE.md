# Backend Testing Structure

**Document Version:** 1.0
**Last Updated:** 2025-10-12
**Status:** Approved

---

## Overview

This document defines the comprehensive testing structure for the Claude Code Config Manager backend. All test development must follow this organization to ensure consistency across development sessions.

**Testing Framework:** Jest + Supertest
**Test Location:** `/home/claude/manager/tests/backend/`
**Fixtures Location:** `/home/claude/manager/tests/fixtures/`

---

## Directory Structure

```
tests/
├── setup.js                           # Jest setup (already exists)
├── backend/
│   ├── api-smoke.test.js             # Basic smoke tests (already exists)
│   │
│   ├── endpoints/                     # API endpoint tests
│   │   ├── health.test.js            # GET /api/health
│   │   ├── projects.test.js          # GET /api/projects, POST /api/projects/scan
│   │   ├── project-agents.test.js    # GET /api/projects/:id/agents
│   │   ├── project-commands.test.js  # GET /api/projects/:id/commands
│   │   ├── project-hooks.test.js     # GET /api/projects/:id/hooks
│   │   ├── project-mcp.test.js       # GET /api/projects/:id/mcp
│   │   ├── user-agents.test.js       # GET /api/user/agents
│   │   ├── user-commands.test.js     # GET /api/user/commands
│   │   ├── user-hooks.test.js        # GET /api/user/hooks
│   │   └── user-mcp.test.js          # GET /api/user/mcp
│   │
│   ├── parsers/                       # Parser unit tests
│   │   ├── subagentParser.test.js    # Agent parser tests
│   │   ├── commandParser.test.js     # Command parser tests
│   │   ├── hookParser.test.js        # Hook parser tests
│   │   └── mcpParser.test.js         # MCP parser tests
│   │
│   ├── services/                      # Service layer tests
│   │   ├── projectDiscovery.test.js  # Project discovery service
│   │   └── fileReader.test.js        # File reader service
│   │
│   ├── utils/                         # Utility function tests
│   │   └── pathUtils.test.js         # Cross-platform path handling
│   │
│   ├── integration/                   # Integration tests
│   │   ├── full-workflow.test.js     # Complete project discovery → data retrieval
│   │   └── multi-project.test.js     # Multiple projects with various configs
│   │
│   ├── errors/                        # Error handling tests
│   │   ├── malformed-yaml.test.js    # YAML parsing errors
│   │   ├── malformed-json.test.js    # JSON parsing errors
│   │   ├── missing-files.test.js     # Missing files/directories
│   │   └── warnings.test.js          # Warnings system validation
│   │
│   └── regression/                    # Regression tests for fixed bugs
│       ├── bug-001-yaml.test.js      # BUG-001: Malformed YAML frontmatter
│       └── bug-002-hooks.test.js     # BUG-002: Hooks parser error handling
│
└── fixtures/                          # Test fixtures (shared across all tests)
    ├── projects/                      # Mock project directories
    │   ├── valid-project/             # Complete valid project
    │   │   ├── .claude/
    │   │   │   ├── agents/
    │   │   │   │   ├── valid-agent.md
    │   │   │   │   └── malformed-agent.md
    │   │   │   ├── commands/
    │   │   │   │   ├── simple-command.md
    │   │   │   │   └── nested/
    │   │   │   │       └── nested-command.md
    │   │   │   └── settings.json
    │   │   └── .mcp.json
    │   │
    │   ├── minimal-project/           # Minimal valid project
    │   │   └── .claude/
    │   │       └── settings.json
    │   │
    │   └── malformed-project/         # Project with various errors
    │       ├── .claude/
    │       │   ├── agents/
    │       │   │   └── invalid.md
    │       │   └── settings.json (invalid JSON)
    │       └── .mcp.json (invalid JSON)
    │
    ├── user/                          # Mock user-level configs
    │   ├── .claude/
    │   │   ├── agents/
    │   │   │   └── user-agent.md
    │   │   ├── commands/
    │   │   │   └── user-command.md
    │   │   └── settings.json
    │   └── claude.json                # Mock project list
    │
    └── samples/                       # Sample files for parser tests
        ├── agents/
        │   ├── valid-complete.md      # All fields present
        │   ├── valid-minimal.md       # Only required fields
        │   ├── invalid-yaml.md        # Malformed YAML
        │   ├── missing-frontmatter.md # No YAML frontmatter
        │   └── empty.md               # Empty file
        │
        ├── commands/
        │   ├── valid-complete.md
        │   ├── valid-minimal.md
        │   ├── invalid-yaml.md
        │   └── empty.md
        │
        ├── settings/
        │   ├── valid-complete.json
        │   ├── valid-minimal.json
        │   ├── invalid-json.json
        │   ├── valid-hooks.json
        │   └── valid-mcp.json
        │
        └── mcp/
            ├── valid-complete.json
            ├── valid-minimal.json
            └── invalid.json
```

---

## Directory Purposes

### 1. `endpoints/` - API Endpoint Tests

**Purpose:** Validate HTTP endpoints, response structures, status codes, error cases

**One file per endpoint or logical grouping:**
- Focus on HTTP layer validation
- Test response structure and data accuracy
- Test error responses (404, 500, etc.)
- Test query parameters and filters

**Naming Convention:** Matches API route structure
- Example: `GET /api/projects` → `projects.test.js`
- Example: `GET /api/projects/:id/agents` → `project-agents.test.js`

---

### 2. `parsers/` - Parser Unit Tests

**Purpose:** Unit test parsing logic in isolation from HTTP layer

**One file per parser module:**
- `subagentParser.test.js` - Tests for `src/backend/parsers/subagentParser.js`
- `commandParser.test.js` - Tests for `src/backend/parsers/commandParser.js`
- `hookParser.test.js` - Tests for `src/backend/parsers/hookParser.js`
- `mcpParser.test.js` - Tests for `src/backend/parsers/mcpParser.js`

**Test Coverage:**
- Valid inputs with all fields
- Valid inputs with minimal fields
- Malformed YAML/JSON
- Missing frontmatter
- Empty files
- Edge cases (special characters, large files, etc.)

---

### 3. `services/` - Service Layer Tests

**Purpose:** Test business logic separate from HTTP and parsing layers

**One file per service module:**
- `projectDiscovery.test.js` - Tests for `src/backend/services/projectDiscovery.js`
- `fileReader.test.js` - Tests for `src/backend/services/fileReader.js`

**Test Coverage:**
- Service-level functionality
- Data transformations
- Business logic validation
- Integration with parsers

---

### 4. `utils/` - Utility Function Tests

**Purpose:** Test helper functions in isolation

**One file per utility module:**
- `pathUtils.test.js` - Tests for `src/backend/utils/pathUtils.js`

**Test Coverage:**
- Cross-platform path handling (Windows, Mac, Linux)
- Edge cases (spaces, special characters, long paths)
- Path normalization and conversion

---

### 5. `integration/` - Full Workflow Tests

**Purpose:** Test how components work together in realistic scenarios

**Files:**
- `full-workflow.test.js` - Complete project discovery → data retrieval
- `multi-project.test.js` - Multiple projects with various configurations

**Test Coverage:**
- End-to-end scenarios
- Multi-step processes
- Data flow through entire system
- Real-world usage patterns

---

### 6. `errors/` - Error Handling Tests

**Purpose:** Validate resilient error handling and warnings system

**Files by error type:**
- `malformed-yaml.test.js` - YAML parsing errors
- `malformed-json.test.js` - JSON parsing errors
- `missing-files.test.js` - Missing files/directories
- `warnings.test.js` - Warnings system validation

**Test Coverage:**
- Graceful degradation
- Warning generation
- Error messages
- System continues functioning despite errors

---

### 7. `regression/` - Bug-Specific Tests

**Purpose:** Prevent regressions of previously fixed bugs

**Naming Convention:** One file per bug (`bug-XXX-description.test.js`)
- `bug-001-yaml.test.js` - BUG-001: Malformed YAML frontmatter handling
- `bug-002-hooks.test.js` - BUG-002: Hooks parser error handling

**Test Coverage:**
- Reproduce original bug scenario
- Verify fix still works
- Test related edge cases

**Documentation:** Each test file must include:
- Link to original bug report/PR
- Description of bug symptoms
- Description of fix
- Date bug was discovered and fixed

---

## Test Fixtures

### Purpose
Provide realistic, reusable test data for all test suites. Single source of truth for test data.

### Organization

#### `fixtures/projects/` - Mock Project Directories
Full project directory structures for integration tests.

**`valid-project/`** - Complete valid project with all config types
- Agents (valid and malformed)
- Commands (simple and nested)
- Hooks (in settings.json)
- MCP servers (.mcp.json)

**`minimal-project/`** - Minimal valid project
- Only required files (settings.json)
- Tests bare minimum configuration

**`malformed-project/`** - Project with intentional errors
- Invalid JSON files
- Malformed YAML files
- Tests error handling

#### `fixtures/user/` - Mock User-Level Configs
User-level configuration files (~/.claude/)

**`claude.json`** - Mock project list
- Points to fixture projects
- Used for project discovery tests

**`.claude/`** - User-level configs
- User agents
- User commands
- User settings (hooks, MCP)

#### `fixtures/samples/` - Sample Files for Parser Tests
Individual files for parser unit tests (not full project structures)

**`agents/`** - Agent file samples
- `valid-complete.md` - All YAML fields present
- `valid-minimal.md` - Only required fields
- `invalid-yaml.md` - Malformed YAML frontmatter
- `missing-frontmatter.md` - No YAML frontmatter
- `empty.md` - Empty file

**`commands/`** - Command file samples
- Similar structure to agents

**`settings/`** - Settings JSON samples
- `valid-complete.json` - All optional fields
- `valid-minimal.json` - Only required fields
- `invalid-json.json` - Malformed JSON
- `valid-hooks.json` - Settings with hooks configured
- `valid-mcp.json` - Settings with MCP servers configured

**`mcp/`** - MCP JSON samples
- `valid-complete.json` - Complete .mcp.json
- `valid-minimal.json` - Minimal .mcp.json
- `invalid.json` - Malformed JSON

---

## Test Execution

### Run All Backend Tests
```bash
npm test                    # Run all Jest tests
npm run test:backend        # Explicitly run backend tests
```

### Run Specific Test Directories
```bash
npm test -- tests/backend/endpoints/
npm test -- tests/backend/parsers/
npm test -- tests/backend/errors/
npm test -- tests/backend/regression/
```

### Run Specific Test Files
```bash
npm test -- tests/backend/parsers/subagentParser.test.js
npm test -- tests/backend/endpoints/project-agents.test.js
```

### Run Tests by Pattern
```bash
npm test -- --testNamePattern="agent"     # Run tests with "agent" in name
npm test -- --testPathPattern="parsers"   # Run tests in parsers directory
```

### Watch Mode (Development)
```bash
npm run test:watch          # Re-run tests on file changes
```

### Coverage Report
```bash
npm run test:coverage       # Generate coverage report
```

---

## Test Development Order

### Phase 1: Foundation (High Priority)
1. **Fixtures** - Create all test fixtures first
2. **Parsers** - Unit test all 4 parsers thoroughly
3. **Endpoints** - Test all 11 API endpoints with fixtures

### Phase 2: Robustness (High Priority)
4. **Errors** - Comprehensive error handling tests
5. **Regression** - BUG-001 and BUG-002 tests

### Phase 3: Comprehensive (Medium Priority)
6. **Services** - Business logic tests
7. **Utils** - Helper function tests

### Phase 4: End-to-End (Medium Priority)
8. **Integration** - Full workflow tests

---

## Test Grouping Strategy

Tests are grouped by **feature/functionality** rather than by layer. Each feature test suite covers:
- API endpoint(s)
- Related parser(s)
- Related service(s)
- Error handling
- Regression tests (if applicable)

### Feature Groups

#### 1. **Agents Feature**
- `endpoints/project-agents.test.js`
- `endpoints/user-agents.test.js`
- `parsers/subagentParser.test.js`
- `errors/malformed-yaml.test.js` (agent-specific tests)
- `regression/bug-001-yaml.test.js`

#### 2. **Commands Feature**
- `endpoints/project-commands.test.js`
- `endpoints/user-commands.test.js`
- `parsers/commandParser.test.js`
- `errors/malformed-yaml.test.js` (command-specific tests)

#### 3. **Hooks Feature**
- `endpoints/project-hooks.test.js`
- `endpoints/user-hooks.test.js`
- `parsers/hookParser.test.js`
- `errors/malformed-json.test.js` (hooks-specific tests)
- `regression/bug-002-hooks.test.js`

#### 4. **MCP Feature**
- `endpoints/project-mcp.test.js`
- `endpoints/user-mcp.test.js`
- `parsers/mcpParser.test.js`
- `errors/malformed-json.test.js` (MCP-specific tests)

#### 5. **Project Discovery Feature**
- `endpoints/projects.test.js`
- `services/projectDiscovery.test.js`
- `integration/full-workflow.test.js`

#### 6. **Core Infrastructure**
- `endpoints/health.test.js`
- `services/fileReader.test.js`
- `utils/pathUtils.test.js`
- `errors/missing-files.test.js`
- `errors/warnings.test.js`

---

## Expected Test Counts

| Directory | Estimated Tests | Purpose |
|-----------|----------------|---------|
| `endpoints/` | 50-70 tests | All endpoint scenarios |
| `parsers/` | 40-60 tests | Parser edge cases |
| `services/` | 20-30 tests | Business logic |
| `utils/` | 10-15 tests | Helper functions |
| `integration/` | 10-15 tests | Full workflows |
| `errors/` | 25-35 tests | Error scenarios |
| `regression/` | 5-10 tests | Bug prevention |
| **Total** | **160-235 tests** | Comprehensive coverage |

---

## Test Quality Standards

### Every Test Must Include:
1. **Clear description** - What is being tested
2. **Arrange-Act-Assert structure** - Setup, execute, verify
3. **Isolated** - No dependencies on other tests
4. **Fast** - Completes in < 1 second (except integration tests)
5. **Deterministic** - Always produces same result

### Test File Structure:
```javascript
const request = require('supertest');
const app = require('../../src/backend/server');

describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    test('should do X when Y', async () => {
      // Arrange - Setup test data

      // Act - Execute functionality

      // Assert - Verify results
      expect(result).toBe(expected);
    });
  });
});
```

---

## Fixture Management

### Creating New Fixtures
1. Add fixture to appropriate directory under `tests/fixtures/`
2. Document fixture purpose in this file
3. Keep fixtures minimal but realistic
4. Use fixtures across multiple test files

### Fixture Naming Conventions
- **Descriptive names** - `valid-complete.md`, `invalid-yaml.json`
- **Purpose-based** - `agent-with-all-fields.md`, `minimal-settings.json`
- **Error cases** - `malformed-yaml.md`, `missing-frontmatter.md`

### Fixture Maintenance
- Update fixtures when data structures change
- Keep fixtures in sync with actual project structure
- Document any special fixture requirements

---

## Continuous Integration

### Pre-Commit
- All tests must pass before commit
- Run `npm test` locally

### Pre-PR
- All tests must pass
- Coverage should not decrease
- New features must include tests

### Post-Merge
- Regression tests run automatically
- Any failures block subsequent merges

---

## References

- **PRD:** `/home/claude/manager/docs/prd/PRD-Phase1-MVP.md`
- **Test Reports:** `/home/claude/manager/docs/testing/test-reports/`
- **Source Code:** `/home/claude/manager/src/backend/`
- **Jest Config:** `/home/claude/manager/jest.config.js`

---

**Document Owner:** Claude Code Config Manager Team
**Review Schedule:** After each major feature addition
**Change Log:**
- 2025-10-12: Initial version created and approved
