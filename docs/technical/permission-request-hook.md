# PermissionRequest Hook

**Last Updated:** 2025-11-19
**Claude Code Version:** 2025+ (Recently Added)

---

## Overview

The `PermissionRequest` hook is a Claude Code feature that executes when Claude attempts to use a tool requiring user approval. It enables programmatic control over permission dialogs, allowing developers to auto-approve safe operations, block dangerous commands, or modify tool parameters.

---

## Configuration

### Structure in settings.json

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/permission-handler.sh",
            "enabled": true,
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

Follows standard 3-level nesting: **Event → Matcher → Hooks**

### Matcher Support

PermissionRequest supports the same matchers as `PreToolUse` and `PostToolUse`:

**Available Tool Names:**
- `Task`, `Bash`, `Glob`, `Grep`, `Read`, `Edit`, `Write`
- `WebFetch`, `WebSearch`, `NotebookEdit`, `TodoWrite`
- `AskUserQuestion`, `BashOutput`, `KillShell`

**Matcher Examples:**
- Single tool: `"Bash"`
- Multiple tools: `"Bash|Write|Edit"` (pipe-separated)
- All tools: `"*"`

**Note:** Matchers are case-sensitive and must match exact tool names.

---

## Hook Behavior

### When It Fires

The hook activates when:
1. Claude attempts to use a tool requiring permission
2. Permission mode requires user confirmation
3. **BEFORE** the permission dialog is shown to the user

### Processing Order

```
Claude creates tool call
      ↓
PreToolUse Hook
      ↓
Deny/Allow/Ask Rules Check
      ↓
Permission Mode Check
      ↓
🔵 PermissionRequest Hook ← YOU ARE HERE
      ↓
User Dialog (if hook doesn't decide)
      ↓
Tool Execution
      ↓
PostToolUse Hook
```

---

## Hook Input/Output

### Input Format (JSON via stdin)

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default",
  "hook_event_name": "PermissionRequest",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm run build"
  }
}
```

**Key Fields:**
- `tool_name`: Tool requiring permission (Bash, Write, Read, Edit, etc.)
- `tool_input`: Tool-specific parameters (varies by tool)
- `permission_mode`: Current permission setting (default, always_allow, always_ask)

### Output Format (JSON via stdout)

**Allow (Basic):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow"
    }
  }
}
```

**Allow with Modified Input:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedInput": {
        "command": "npm run lint"
      }
    }
  }
}
```

**Deny with Message:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "deny",
      "message": "Production database commands require manual approval"
    }
  }
}
```

**Deny with Interrupt:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "deny",
      "message": "Dangerous system command blocked",
      "interrupt": true
    }
  }
}
```

**Note:** Setting `interrupt: true` stops Claude's execution immediately.

---

## Key Capabilities

- ✅ **Auto-approve safe operations** - Bypass user prompts for trusted actions
- ✅ **Block dangerous commands** - Prevent destructive operations
- ✅ **Modify tool parameters** - Change command inputs before execution
- ✅ **Provide feedback to Claude** - Explain why requests were denied
- ✅ **Interrupt execution** - Stop Claude immediately for critical violations

---

## Comparison with Other Hooks

### vs PreToolUse

| Feature | PermissionRequest | PreToolUse |
|---------|-------------------|------------|
| **Timing** | Before permission dialog | Before all permission checks |
| **Can Block** | ✅ Yes (deny) | ✅ Yes (return error) |
| **Can Modify Input** | ✅ Yes | ✅ Yes |
| **Sees Permission Mode** | ✅ Yes | ❌ No |
| **Can Interrupt Claude** | ✅ Yes | ❌ No |

### vs PostToolUse

| Feature | PermissionRequest | PostToolUse |
|---------|-------------------|-------------|
| **Timing** | Before tool execution | After tool completes |
| **Can Block** | ✅ Yes | ❌ No (too late) |
| **Sees Tool Output** | ❌ No | ✅ Yes |

---

## Common Use Cases

1. **Auto-Approve Documentation Reads** - No prompts for .md, .txt files
2. **Block Production Database Commands** - Enforce manual approval workflow
3. **Add Safety Flags** - Automatically append `--dry-run` to deployment commands
4. **Sandbox File Operations** - Redirect writes to test directories
5. **Compliance Logging** - Audit all file modifications
6. **Multi-Tenant Isolation** - Enforce directory boundaries

---

## Claude Code Manager Integration

### Backend Status

✅ **Already Supported** - The hook parser (`hookParser.js`) is event-agnostic and handles all hook types dynamically, including PermissionRequest.

**No code changes needed.** The parser iterates all event types and applies the standard 3-level merge algorithm.

### Frontend Status

✅ **Already Supported** - Hook display components show all hook types automatically.

**Recommended Enhancement:** Add PermissionRequest to the valid events documentation.

### Required Documentation Update

Update `/docs/technical/hook-structure.md` line 67 to add `PermissionRequest` to the valid events list:

**Before:**
```
Valid events: PreToolUse, PostToolUse, UserPromptSubmit, Notification, Stop, SubagentStop, PreCompact, SessionStart, SessionEnd
```

**After:**
```
Valid events: PreToolUse, PostToolUse, UserPromptSubmit, PermissionRequest, Notification, Stop, SubagentStop, PreCompact, SessionStart, SessionEnd
```

---

## References

- **Official Documentation:** https://code.claude.com/docs/en/hooks
- **Hook Structure:** `docs/technical/hook-structure.md`
- **Hook Parser:** `src/backend/parsers/hookParser.js`
- **Copy Service:** `src/backend/services/copy-service.js`
