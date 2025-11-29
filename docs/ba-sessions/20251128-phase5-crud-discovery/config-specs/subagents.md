# Subagent Configuration Specification

## Overview

Subagents are markdown files with YAML frontmatter stored in `.claude/agents/` (project) or `~/.claude/agents/` (user).

## Storage

| Location | Scope | Description |
|----------|-------|-------------|
| `.claude/agents/*.md` | Project | Team-shared, checked into git |
| `~/.claude/agents/*.md` | User | Personal configuration |

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
| name | string | InputText | No | filename | Identifier (derived from filename if omitted) |
| description | string | Textarea | **Yes** | - | When/why to use this subagent |
| tools | string/array | MultiSelect + manual MCP input | No | Empty | Allowed tools (chips display) |
| model | enum | **SelectButton** | No | inherit | Sonnet / Opus / Haiku / Inherit |
| color | string | Select (color palette) | No | null | Visual identifier |
| permissionMode | enum | Select | No | default | Permission handling mode |
| skills | string/array | **MultiSelect** | No | Empty | Auto-loaded skills (project + user) |
| systemPrompt | string | Textarea (large) | **Yes** | - | Markdown body after frontmatter |

## Field Details

### name
- **Validation:** lowercase, letters, numbers, hyphens, underscores
- **Max length:** 64 characters
- **Rename impact:** Must update references in other agents, commands, skills

### description
- **Required:** Yes
- **Purpose:** Displayed in UI help/info, describes when to use agent

### tools
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

### color
- **Options:** Official Claude Code colors
  ```javascript
  ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'yellow', 'pink', 'indigo', 'teal']
  ```
- **UI:** Select dropdown with color chip preview in template slot

### permissionMode
- **Options:**
  ```javascript
  ['default', 'acceptEdits', 'bypassPermissions', 'plan', 'ignore']
  ```
- **UI:** Select dropdown

### skills
- **Format:** Array or comma-separated string
- **Options:** Combined list of project skills + user skills
- **UI:** MultiSelect with chips display

### systemPrompt
- **Format:** Markdown content after frontmatter delimiter (`---`)
- **UI:** Large textarea with auto-resize

## Delete Confirmation

Before deleting a subagent, check for references in:
1. Other subagents (`.claude/agents/*.md`)
2. Slash commands (`.claude/commands/**/*.md`)
3. Skills (`.claude/skills/*/SKILL.md`)

Display found references in delete confirmation modal.

## Example Frontmatter

```yaml
---
name: code-reviewer
description: Reviews pull requests for code quality and best practices
tools: Read, Write, Bash, Grep
model: sonnet
color: blue
permissionMode: default
skills: code-analysis, testing
---

# You are a code reviewer...
```

## Backend Considerations

### Update Operation
1. Parse existing file to preserve structure
2. Update YAML frontmatter properties
3. Update markdown body (systemPrompt)
4. Handle file rename if name changes
5. Atomic write using temp file + rename pattern

### Delete Operation
1. Check for references in other configs
2. Return warnings if references found
3. Remove file from filesystem
4. Return success/failure status
