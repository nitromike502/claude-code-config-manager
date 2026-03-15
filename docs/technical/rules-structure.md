# Claude Code Rules Structure

## Overview

This document provides comprehensive documentation on Claude Code's Rules system structure, file format, loading behavior, and implementation details for the Config Manager's rules parser and copy service.

**Last Updated:** 2026-03-14
**Related Code:** `/src/backend/parsers/rulesParser.js`

---

## What Are Rules?

Rules are an organizational system for breaking up large `CLAUDE.md` files into modular, topic-specific files. They allow distributing instructions across targeted files that can optionally load only when relevant files are accessed by Claude Code.

**Key distinction:** Rules provide context and instructions only. They are not executable (unlike agents) and not invocable (unlike commands).

---

## File Storage Locations

### Project-Level Rules

```
{project}/.claude/rules/*.md
```

Recursive subdirectory support - all `.md` files under `.claude/rules/` are discovered regardless of nesting depth.

### User-Level Rules

```
~/.claude/rules/*.md
```

Same recursive subdirectory support as project-level.

---

## File Format

Plain markdown files (`.md`) with optional YAML frontmatter parsed using `gray-matter` style extraction (same library used for agents and commands).

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules

- All API endpoints must include input validation
- Use the standard error response format
```

---

## Structure Breakdown (2 Levels)

### Level 1 - Frontmatter (Optional)

YAML frontmatter delimited by `---` markers at the top of the file.

**Supported fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `paths` | `string[]` | No | (none) | Array of glob patterns that scope the rule to specific files |

**Important:** The `paths` field is the only supported frontmatter field. When omitted, the rule loads unconditionally at session start.

### Level 2 - Markdown Content

The body of the file after frontmatter. Contains the actual rules, instructions, and context that Claude Code incorporates into its working context.

**Best practice:** Keep each rule file under 200 lines for maintainability.

---

## Path Pattern Syntax

The `paths` field accepts glob patterns following standard glob syntax:

| Pattern | Matches |
|---------|---------|
| `**/*.ts` | All TypeScript files in any directory |
| `src/**/*` | All files under `src/` |
| `*.md` | Markdown files in project root only |
| `src/components/*.tsx` | Files in specific directory (non-recursive) |
| `src/**/*.{ts,tsx}` | Multiple extensions via brace expansion |
| `tests/**/*.test.js` | Test files matching naming convention |

**Behavior:**
- When `paths` is present: rule loads on-demand when Claude reads files matching any of the patterns
- When `paths` is absent: rule loads unconditionally at session start (like `CLAUDE.md`)

---

## Loading Behavior

### Unconditional Rules (No `paths` Frontmatter)

- Loaded at session start alongside `CLAUDE.md`
- Always available as context throughout the session
- Equivalent to having the content in `CLAUDE.md`

### Conditional Rules (With `paths` Frontmatter)

- Not loaded at session start
- Loaded on-demand when Claude reads a file matching any pattern in `paths`
- Remain in context after loading for the duration of the session

### Loading Priority

1. User-level rules (`~/.claude/rules/`) load first
2. Project-level rules (`{project}/.claude/rules/`) load second (higher priority)
3. Rules loaded as context alongside `CLAUDE.md` files

---

## Directory Structure Example

```
.claude/
└── rules/
    ├── code-style.md           # Unconditional - loads at session start
    ├── testing.md              # Unconditional - loads at session start
    ├── security.md             # Conditional - paths: ["src/auth/**/*"]
    └── frontend/
        └── react.md            # Conditional - paths: ["src/components/**/*.tsx"]
```

**Naming convention:** kebab-case filenames (e.g., `api-design.md`, `code-style.md`)

**Subdirectory support:** Subdirectories are purely organizational. The rule name is derived from the relative path within the `rules/` directory (e.g., `frontend/react` for `.claude/rules/frontend/react.md`).

---

## API Flattened Format

The rules parser flattens rule files for frontend consumption. Each rule file becomes a single object:

```json
{
  "name": "code-style",
  "description": "First line or heading of content",
  "paths": ["src/**/*.ts"],
  "isConditional": true,
  "content": "Full markdown content",
  "filePath": "/home/user/project/.claude/rules/code-style.md",
  "scope": "project",
  "hasError": false,
  "parseError": null
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Derived from filename without extension, includes subdirectory path (e.g., `frontend/react`) |
| `description` | `string` | First heading or first line of markdown content |
| `paths` | `string[]` or `null` | Glob patterns from frontmatter, `null` if unconditional |
| `isConditional` | `boolean` | `true` if `paths` frontmatter is present, `false` otherwise |
| `content` | `string` | Full markdown content (after frontmatter extraction) |
| `filePath` | `string` | Absolute path to the rule file on disk |
| `scope` | `string` | `"project"` or `"user"` |
| `hasError` | `boolean` | `true` if parsing failed |
| `parseError` | `string` or `null` | Error message if parsing failed |

---

## Comparison with Other Claude Code Features

### Rules vs CLAUDE.md

| Aspect | CLAUDE.md | Rules |
|--------|-----------|-------|
| Location | Project root, `~/.claude/CLAUDE.md` | `.claude/rules/*.md` |
| Modularity | Single file | Multiple topic-specific files |
| Path scoping | Not supported | Supported via `paths` frontmatter |
| Loading | Always at session start | Unconditional or on-demand |
| Use case | General project instructions | Targeted, topic-specific instructions |

### Rules vs Skills

| Aspect | Rules | Skills |
|--------|-------|--------|
| Location | `.claude/rules/*.md` | `.claude/skills/*/SKILL.md` |
| Structure | Single file with optional frontmatter | Directory with `SKILL.md` and supporting files |
| Loading | Automatic (unconditional or path-triggered) | On-demand when referenced by agents/commands |
| Scope | Context/instructions always available | Task-specific instructions loaded for specific workflows |
| File tree | Not applicable | Can include multiple supporting files |

### Rules vs Agents

| Aspect | Rules | Agents |
|--------|-------|--------|
| Location | `.claude/rules/*.md` | `.claude/agents/*.md` |
| Purpose | Provide context/instructions | Define executable subprocesses |
| Frontmatter | `paths` only | `name`, `description`, `tools`, etc. |
| Invocation | Automatic loading | Explicitly invoked as subagents |
| Execution | Not executable | Runs as separate Claude Code process |

### Rules vs Commands

| Aspect | Rules | Commands |
|--------|-------|----------|
| Location | `.claude/rules/*.md` | `.claude/commands/**/*.md` |
| Purpose | Provide context/instructions | Define invocable slash commands |
| Invocation | Automatic loading | User types `/command-name` |
| Parameters | None | Supports `$ARGUMENTS` placeholder |

---

## Similarity to Agents/Commands for Parsing

Rules share significant parsing characteristics with agents and commands:

| Characteristic | Rules | Agents | Commands |
|----------------|-------|--------|----------|
| File format | Markdown + YAML frontmatter | Markdown + YAML frontmatter | Markdown + YAML frontmatter |
| Directory | `.claude/rules/` | `.claude/agents/` | `.claude/commands/` |
| Recursive discovery | Yes | Yes | Yes |
| User-level scope | `~/.claude/rules/` | `~/.claude/agents/` | `~/.claude/commands/` |
| Project-level scope | `{project}/.claude/rules/` | `{project}/.claude/agents/` | `{project}/.claude/commands/` |
| Frontmatter library | `gray-matter` | `gray-matter` | `gray-matter` |

**Implementation note:** The rules parser can reuse patterns from the existing agent and command parsers, adapting the frontmatter field extraction to handle only the `paths` field.

---

## Additional Capabilities

### Symlinks

Rules support symlinks for sharing rules across projects. A symlinked rule file is resolved and read like a regular file.

### File References

Rules can reference other files using `@path/to/import` syntax within their markdown content.

---

## Config Manager Integration

### Parser

**File:** `src/backend/parsers/rulesParser.js`

**Functions:**
- `parseRule(filePath, baseDir, scope)` - Parse a single rule file, extract `paths` frontmatter and markdown content
- `findMarkdownFiles(directoryPath)` - Recursively find all `.md` files in a rules directory
- `parseAllRules(directoryPath, scope)` - Discover and parse all rules in a rules directory
- `getAllRules(projectPath)` - Get both project and user rules

### Configuration Paths

**In `src/backend/config/config.js`:**

```javascript
paths.getUserRulesDir()                    // ~/.claude/rules
paths.getProjectRulesDir(projectPath)      // {project}/.claude/rules
```

Dev mode paths automatically use `.claude-dev/rules/` based on existing `getProjectClaudeDir()` and `getUserClaudeDir()` methods.

### API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/:projectId/rules` | Get project rules |
| `GET` | `/api/user/rules` | Get user rules |
| `POST` | `/api/copy/rule` | Copy rule between projects |
| `DELETE` | `/api/projects/:projectId/rules/:name` | Delete project rule |
| `DELETE` | `/api/user/rules/:name` | Delete user rule |

**Note:** `projectId` follows the existing encoding convention (project path with slashes removed). The `:name` parameter supports forward slashes for subdirectory-based names (e.g., `frontend/react`).

### Copy Service

**Method:** `copyRule()` in `CopyService` class (`src/backend/services/copy-service.js`).

**Copy operation:** File-based copy similar to agents and commands.

1. Read source rule file
2. Determine target directory from target project/user rules directory
3. Calculate relative path from source rules dir to preserve subdirectory structure
4. Build target path (e.g., `rules/frontend/react.md` in target)
5. Check for conflicts (same relative path in target)
6. Apply conflict resolution strategy (skip/overwrite/rename)
7. Create subdirectories if needed and write file
8. Return success with copied rule details

**Complexity:** LOW - File-based copy, no merge algorithm needed (unlike hooks).

### Frontend Integration

**UI Components:**
- Rules ConfigCard: 6th card (last) in project and user detail views
- Rules DetailSidebar: Path Patterns section for conditional rules, rendered markdown content
- Dashboard: Rules count in project card stats (3x2 grid)

**Visual Design:**
- Icon: `pi pi-book` in red-orange `#E53E3E`
- Conditional badge: Amber `#F59E0B` outlined PrimeVue `Tag` with `pi pi-filter` icon
- Name display: Full relative path (e.g., `frontend/react`) to handle subdirectory collisions

---

## Edge Cases to Handle

1. **Rules directory doesn't exist**
   - Return empty array, do not create directory on read

2. **Rule file has invalid YAML frontmatter**
   - Set `hasError: true` and `parseError` with message
   - Include rule in results so user sees the error

3. **Rule file has frontmatter but no `paths` field**
   - Treat as unconditional rule (`isConditional: false`, `paths: null`)
   - Other frontmatter fields are ignored

4. **Rule file has empty `paths` array**
   - Treat as unconditional rule (empty array means no path conditions)

5. **Rule file has no frontmatter**
   - Treat as unconditional rule (`isConditional: false`, `paths: null`)

6. **Nested subdirectory rules**
   - Name includes relative path: `frontend/react` for `rules/frontend/react.md`
   - Copy preserves subdirectory structure in target

7. **Symlinked rule files**
   - Resolve symlink and read content
   - `filePath` reports the symlink path, not the resolved target

8. **Name collision during copy**
   - Apply standard conflict resolution: skip, overwrite, or rename
   - Rename appends suffix: `code-style-copy.md`

9. **Rule file with no content (empty body)**
   - Valid file, return with empty `content` and empty `description`

10. **Deeply nested subdirectories**
    - Support arbitrary nesting depth
    - Name uses full relative path: `frontend/components/forms`

---

## Examples

### Example 1: Unconditional Rule (No Frontmatter)

**File:** `.claude/rules/code-style.md`

```markdown
# Code Style Rules

- Use 2-space indentation
- Prefer const over let
- Use single quotes for strings
- Always include trailing commas in multiline structures
```

**Parsed output:**
```json
{
  "name": "code-style",
  "description": "Code Style Rules",
  "paths": null,
  "isConditional": false,
  "content": "# Code Style Rules\n\n- Use 2-space indentation\n...",
  "filePath": "/home/user/project/.claude/rules/code-style.md",
  "scope": "project",
  "hasError": false,
  "parseError": null
}
```

### Example 2: Conditional Rule with Path Scoping

**File:** `.claude/rules/security.md`

```markdown
---
paths:
  - "src/auth/**/*"
  - "src/middleware/auth*.js"
---

# Security Rules

- Never log sensitive tokens or credentials
- Always validate JWT expiration before trusting claims
- Use parameterized queries for all database operations
```

**Parsed output:**
```json
{
  "name": "security",
  "description": "Security Rules",
  "paths": ["src/auth/**/*", "src/middleware/auth*.js"],
  "isConditional": true,
  "content": "# Security Rules\n\n- Never log sensitive tokens...",
  "filePath": "/home/user/project/.claude/rules/security.md",
  "scope": "project",
  "hasError": false,
  "parseError": null
}
```

### Example 3: Nested Subdirectory Rule

**File:** `.claude/rules/frontend/react.md`

```markdown
---
paths:
  - "src/components/**/*.tsx"
  - "src/components/**/*.jsx"
---

# React Component Rules

- Use functional components with hooks
- Prefer composition over inheritance
- Extract reusable logic into custom hooks
- Co-locate component tests in __tests__ directories
```

**Parsed output:**
```json
{
  "name": "frontend/react",
  "description": "React Component Rules",
  "paths": ["src/components/**/*.tsx", "src/components/**/*.jsx"],
  "isConditional": true,
  "content": "# React Component Rules\n\n- Use functional components...",
  "filePath": "/home/user/project/.claude/rules/frontend/react.md",
  "scope": "project",
  "hasError": false,
  "parseError": null
}
```

### Example 4: User-Level Rule

**File:** `~/.claude/rules/personal-preferences.md`

```markdown
# Personal Preferences

- Always explain code changes before making them
- Use verbose variable names over abbreviations
- Include JSDoc comments on all exported functions
```

**Parsed output:**
```json
{
  "name": "personal-preferences",
  "description": "Personal Preferences",
  "paths": null,
  "isConditional": false,
  "content": "# Personal Preferences\n\n- Always explain code changes...",
  "filePath": "/home/user/.claude/rules/personal-preferences.md",
  "scope": "user",
  "hasError": false,
  "parseError": null
}
```

### Example 5: Rule with Brace Expansion Paths

**File:** `.claude/rules/testing.md`

```markdown
---
paths:
  - "tests/**/*.{test,spec}.{js,ts}"
  - "**/__tests__/**/*"
---

# Testing Rules

- Each test file must have a describe block matching the module name
- Use meaningful test descriptions that read as sentences
- Prefer integration tests over unit tests for API endpoints
- Mock external services, never mock internal modules
```

---

## References

- **Claude Code Documentation:** [https://docs.anthropic.com/claude-code](https://docs.anthropic.com/claude-code)
- **Rules Parser:** `/src/backend/parsers/rulesParser.js`
- **Agent Parser (similar pattern):** `/src/backend/parsers/agentParser.js`
- **Command Parser (similar pattern):** `/src/backend/parsers/commandParser.js`
- **Configuration Module:** `/src/backend/config/config.js`
- **Copy Service:** `/src/backend/services/copy-service.js`
- **Wireframes:** `/docs/wireframes/02-project-detail-view.md`, `/docs/wireframes/04-detail-interactions.md`
