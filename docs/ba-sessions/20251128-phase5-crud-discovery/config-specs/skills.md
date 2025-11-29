# Skill Configuration Specification

## Overview

Skills are directory-based configurations containing a `SKILL.md` file with YAML frontmatter and optional supporting files. Stored in `.claude/skills/` (project) or `~/.claude/skills/` (user).

## Storage

| Location | Scope | Description |
|----------|-------|-------------|
| `.claude/skills/*/SKILL.md` | Project | Team-shared, checked into git |
| `~/.claude/skills/*/SKILL.md` | User | Personal configuration |
| Plugin-bundled | Plugin | System-distributed via plugin |

## CRUD Operations

| Operation | Supported | Notes |
|-----------|-----------|-------|
| Create | ❌ No | Not in Phase 5 scope |
| Read | ✅ Yes | Already implemented |
| Update | ✅ Yes | Edit SKILL.md properties only |
| Delete | ✅ Yes | Remove entire directory |

## Complete Property Schema

| Property | Type | Field Component | Required | Default | Description |
|----------|------|-----------------|----------|---------|-------------|
| name | string | InputText | No | directory name | Skill identifier |
| description | string | Textarea | **Yes** | - | What skill does + activation triggers |
| allowed-tools | string/array | MultiSelect (chips) | No | Empty | Restricted tool access |
| content | string | Textarea (large) | **Yes** | - | SKILL.md markdown body |

## Field Details

### name
- **Validation:** lowercase, letters, numbers, hyphens
- **Max length:** 64 characters
- **Derived from:** Directory name if not specified
- **Rename impact:** Must update references in agents/commands

### description
- **Required:** Yes
- **Max length:** 1024 characters
- **Best practice:** Include both functionality AND activation triggers
- **Example:** "Creates comprehensive test suites using Jest. Activates when test coverage is needed or test failures are found."

### allowed-tools
- **Format:** Array or comma-separated string
- **Options:** Built-in tools from predefined list
- **UI:** MultiSelect with chips display

### content
- **Format:** Markdown body after frontmatter in SKILL.md
- **Purpose:** Step-by-step instructions for the skill
- **Best practice:**
  - Clear activation conditions
  - Usage examples
  - Relative paths for file references (forward slashes)
- **UI:** Large textarea with auto-resize

## Directory Structure (Read-Only View)

Skills include a file tree showing directory contents:

```
skill-name/
├── SKILL.md           # Required: frontmatter + description
├── helper.js          # Optional: supporting script
├── template.txt       # Optional: template file
└── scripts/
    └── setup.sh       # Optional: utility
```

**Note:** File tree is read-only in UI. Users manage supporting files outside the manager.

## External Reference Detection

The parser detects external references that may cause issues when copying:

| Pattern | Type | Severity |
|---------|------|----------|
| `/absolute/path` | Absolute path | Warning |
| `~/home/path` | Home directory | Warning |
| `../parent/path` | Parent traversal | Warning |

External references are displayed in the detail sidebar.

## Delete Confirmation

Before deleting a skill, check for references in:
1. Subagents with `skills` field (`.claude/agents/*.md`)
2. Slash commands referencing skill (`.claude/commands/**/*.md`)

Display found references in delete confirmation modal.

**Important:** Deleting a skill removes the ENTIRE directory, including all supporting files.

## Example SKILL.md

```yaml
---
name: test-runner
description: Creates comprehensive test suites using Jest for backend and Playwright for frontend. Use when test coverage is needed or test failures occur.
allowed-tools: Read, Write, Bash
---

# Test Runner Skill

## Activation
This skill activates when:
- User mentions testing or test coverage
- Test failures are detected
- New features need test coverage

## Usage
1. Analyze existing test patterns
2. Create appropriate test files
3. Run tests and verify coverage

## Supporting Files
- `./templates/jest.template.js` - Jest test template
- `./scripts/coverage.sh` - Coverage report generator
```

## Backend Considerations

### Update Operation
1. Parse existing SKILL.md to preserve structure
2. Update YAML frontmatter properties
3. Update markdown body (content)
4. Handle directory rename if name changes
5. Do NOT modify supporting files
6. Atomic write using temp file + rename pattern

### Delete Operation
1. Check for references in agents and commands
2. Return warnings if references found
3. Remove entire skill directory (recursive)
4. Return success/failure status
