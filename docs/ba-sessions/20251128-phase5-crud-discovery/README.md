# Phase 5: CRUD Features - Discovery & Planning

**Session Date:** November 28, 2025
**Status:** 🔄 In Progress
**Branch:** `feature/phase5-crud`

## Overview

Phase 5 adds Create, Read, Update, Delete (CRUD) operations for Claude Code configuration types. This discovery phase documents all configuration properties and UI component specifications before implementation begins.

## User Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Documentation Location** | `docs/ba-sessions/` | Follow BA session pattern |
| **Property Scope** | All Properties | Include all Claude Code properties |
| **Color Selection** | Predefined Palette | Official Claude Code colors |
| **Boolean Fields** | SelectButton | Enabled/Disabled, Yes/No options |
| **Model Selection** | SelectButton | Sonnet/Opus/Haiku/Inherit options |
| **Skills in Subagents** | MultiSelect | Project + user skills combined |
| **Hook Matcher** | MultiSelect → pipe-joined | Tool names joined with `|` |

## Progress Tracking

### Discovery Phase

- [x] Create feature branch (`feature/phase5-crud`)
- [x] Create BA session directory structure
- [x] Create progress tracking document
- [x] Document subagent specifications (`config-specs/subagents.md`)
- [x] Document command specifications (`config-specs/commands.md`)
- [x] Document skill specifications (`config-specs/skills.md`)
- [x] Document hook specifications (`config-specs/hooks.md`)
- [x] Document MCP server specifications (`config-specs/mcp-servers.md`)
- [x] Document InlineEditField component spec (`component-specs/inline-edit-field.md`)
- [x] Document DeleteConfirmationModal spec (`component-specs/delete-confirmation-modal.md`)
- [x] Document ColorPaletteDropdown spec (`component-specs/color-palette-dropdown.md`)
- [x] Document form field type mappings (`component-specs/form-field-types.md`)

### Implementation Phase (Future)

- [ ] Stage 1: Foundation Components
  - [ ] InlineEditField.vue
  - [ ] DeleteConfirmationModal.vue
  - [ ] useFormValidation composable
- [ ] Stage 2: Config-Specific Implementation
  - [ ] TBD: By action type or config type
- [ ] Stage 3: Backend API Endpoints
  - [ ] PUT/DELETE endpoints for each config type
  - [ ] Reference checking endpoint

## Directory Structure

```
docs/ba-sessions/20251128-phase5-crud-discovery/
├── README.md                    # This file - progress tracking
├── config-specs/               # Configuration type specifications
│   ├── subagents.md
│   ├── commands.md
│   ├── skills.md
│   ├── hooks.md
│   └── mcp-servers.md
├── component-specs/            # UI component specifications
│   ├── inline-edit-field.md
│   ├── delete-confirmation-modal.md
│   ├── color-palette-dropdown.md
│   └── form-field-types.md
└── wireframes/                 # UI mockups (if needed)
```

## Key References

### Official Claude Code Colors
```javascript
['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'yellow', 'pink', 'indigo', 'teal']
```

### Built-in Tools
```javascript
['AskUserQuestion', 'Bash', 'BashOutput', 'Edit', 'ExitPlanMode', 'Glob', 'Grep',
 'KillShell', 'NotebookEdit', 'Read', 'Skill', 'SlashCommand', 'Task', 'TodoWrite',
 'WebFetch', 'WebSearch', 'Write']
```

### Model Options
```javascript
['sonnet', 'opus', 'haiku', 'inherit']
```

### Hook Event Types
- **With matcher:** PreToolUse, PostToolUse, PermissionRequest, Notification
- **Without matcher:** UserPromptSubmit, Stop, SubagentStop, PreCompact, SessionStart, SessionEnd

## Session Notes

- MCP tools are NOT extracted automatically - users type them manually (prefix: `mcp__`)
- Hook matchers use pipe (`|`) to join multiple tool names
- Wildcard `*` matches all tools for matchers
- Skills MultiSelect should include both project and user-level skills

---

**Last Updated:** 2025-11-28
