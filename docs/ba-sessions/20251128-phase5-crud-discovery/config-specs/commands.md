# Slash Command Configuration Specification

## Overview

Slash commands are markdown files with optional YAML frontmatter stored in `.claude/commands/` (project) or `~/.claude/commands/` (user). Supports nested directories for organization.

## Storage

| Location | Scope | Description |
|----------|-------|-------------|
| `.claude/commands/**/*.md` | Project | Team-shared, checked into git |
| `~/.claude/commands/**/*.md` | User | Personal configuration |

## CRUD Operations

| Operation | Supported | Notes |
|-----------|-----------|-------|
| Create | ❌ No | Not in Phase 5 scope |
| Read | ✅ Yes | Already implemented |
| Update | ✅ Yes | Edit all properties |
| Delete | ✅ Yes | Check references first |

## Complete Property Schema

| Property | Type | Field Component | Required | Default | Description |
|----------|------|-----------------|----------|---------|-------------|
| name | string | InputText | No | filename | Command name (without `/` prefix) |
| description | string | Textarea | No | First content line | Shown in `/help` output |
| allowed-tools | string/array | MultiSelect + manual MCP input | No | Inherited | Restricted tool access |
| model | enum | **SelectButton** | No | Session model | Sonnet / Opus / Haiku / Inherit |
| argument-hint | string | InputText | No | None | Expected parameters hint |
| disable-model-invocation | boolean | **SelectButton** | No | false | Yes / No |
| color | string | Select (color palette) | No | null | Visual identifier |
| content | string | Textarea (large) | **Yes** | - | Command body (markdown) |

## Field Details

### name
- **Validation:** lowercase, letters, numbers, hyphens
- **Derived from:** Filename (e.g., `optimize.md` → `/optimize`)
- **Rename impact:** Must update references in other configs

### description
- **Purpose:** Shown in `/help` command output
- **Auto-derived:** First non-empty line of content if not specified

### allowed-tools (maps to `tools` in parsed output)
- **Format:** Array or comma-separated string
- **Options:** Built-in tools from predefined list
- **MCP Tools:** User types manually (prefix: `mcp__`)
- **UI:** MultiSelect with chips display, manual input field for MCP

### model
- **Options:**
  ```javascript
  [
    { label: 'Sonnet', value: 'sonnet' },
    { label: 'Opus', value: 'opus' },
    { label: 'Haiku', value: 'haiku' },
    { label: 'Inherit', value: 'inherit' }
  ]
  ```
- **UI:** SelectButton (4 options)

### argument-hint
- **Format:** Bracketed parameters (e.g., `[filepath] [focus-area]`)
- **Purpose:** Guides users on expected arguments
- **UI:** InputText with placeholder example

### disable-model-invocation
- **Purpose:** When true, prevents LLM processing (static commands)
- **Options:**
  ```javascript
  [
    { label: 'No', value: false },
    { label: 'Yes', value: true }
  ]
  ```
- **UI:** SelectButton (binary)

### color
- **Options:** Official Claude Code colors
  ```javascript
  ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'yellow', 'pink', 'indigo', 'teal']
  ```
- **UI:** Select dropdown with color chip preview

### content
- **Format:** Markdown body after frontmatter
- **Special syntax:**
  - `$ARGUMENTS` - All arguments passed
  - `$1`, `$2`, `$3` - Individual positional arguments
  - `` !`command` `` - Execute bash and include output
  - `@filepath` - Include file contents
- **UI:** Large textarea with auto-resize

## Namespace Derivation

Commands in subdirectories get a namespace from the path:

| File Path | Namespace | Command |
|-----------|-----------|---------|
| `.claude/commands/deploy.md` | null | `/deploy` |
| `.claude/commands/tools/lint.md` | "tools" | `/tools:lint` |
| `.claude/commands/qa/test/run.md` | "qa/test" | `/qa/test:run` |

**Note:** Namespace is read-only (derived from directory structure).

## Delete Confirmation

Before deleting a command, check for references in:
1. Other slash commands (`.claude/commands/**/*.md`)
2. Subagents (`.claude/agents/*.md`)
3. Skills (`.claude/skills/*/SKILL.md`)

Display found references in delete confirmation modal.

## Example Frontmatter

```yaml
---
name: analyze-code
description: Analyze code for performance improvements
allowed-tools: Read, Bash, Grep
model: sonnet
argument-hint: [filepath] [focus-area]
disable-model-invocation: false
color: cyan
---

# Code Analysis

Analyzing: $ARGUMENTS
File: $1
Focus: $2
```

## Backend Considerations

### Update Operation
1. Parse existing file to preserve structure
2. Update YAML frontmatter properties
3. Update markdown body (content)
4. Handle file rename if name changes
5. Preserve directory structure (namespace)
6. Atomic write using temp file + rename pattern

### Delete Operation
1. Check for references in other configs
2. Return warnings if references found
3. Remove file from filesystem
4. Return success/failure status
