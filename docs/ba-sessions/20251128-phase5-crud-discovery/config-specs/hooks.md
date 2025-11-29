# Hook Configuration Specification

## Overview

Hooks are JSON configurations stored in settings files. They execute shell commands or LLM prompts in response to Claude Code events.

## Storage

| Location | Scope | Description |
|----------|-------|-------------|
| `.claude/settings.json` → `hooks` | Project | Team-shared, checked into git |
| `.claude/settings.local.json` → `hooks` | Project-local | Machine-specific, not committed |
| `~/.claude/settings.json` → `hooks` | User | Personal configuration |

## CRUD Operations

| Operation | Supported | Notes |
|-----------|-----------|-------|
| Create | ✅ Yes | Add new hook to event |
| Read | ✅ Yes | Already implemented |
| Update | ✅ Yes | Edit hook properties (except event) |
| Delete | ✅ Yes | Remove from settings JSON |

## Complete Property Schema

| Property | Type | Field Component | Required | Default | Description |
|----------|------|-----------------|----------|---------|-------------|
| event | enum | Select (readonly after create) | **Yes** | - | Hook trigger event |
| matcher | string | MultiSelect → pipe-joined | Conditional | "*" | Tool pattern to match |
| type | enum | **SelectButton** | No | command | Command / Prompt |
| command | string | Textarea | **Yes** | - | Bash command or LLM prompt |
| timeout | number | InputNumber | No | 60 | Seconds before canceling |
| enabled | boolean | **SelectButton** | No | true | Enabled / Disabled |
| suppressOutput | boolean | **SelectButton** | No | false | Yes / No |
| continue | boolean | **SelectButton** | No | true | Yes / No |
| systemMessage | string | Textarea | No | - | Warning message to user |

## Field Details

### event (10 Event Types)
- **Required:** Yes
- **Readonly:** After creation (cannot change event type)
- **Options:**
  ```javascript
  const eventTypes = [
    { label: 'PreToolUse', value: 'PreToolUse', hasMatcher: true },
    { label: 'PostToolUse', value: 'PostToolUse', hasMatcher: true },
    { label: 'PermissionRequest', value: 'PermissionRequest', hasMatcher: true },
    { label: 'Notification', value: 'Notification', hasMatcher: true },
    { label: 'UserPromptSubmit', value: 'UserPromptSubmit', hasMatcher: false },
    { label: 'Stop', value: 'Stop', hasMatcher: false },
    { label: 'SubagentStop', value: 'SubagentStop', hasMatcher: false },
    { label: 'PreCompact', value: 'PreCompact', hasMatcher: false },
    { label: 'SessionStart', value: 'SessionStart', hasMatcher: false },
    { label: 'SessionEnd', value: 'SessionEnd', hasMatcher: false }
  ]
  ```
- **UI:** Select dropdown

### matcher
- **Conditional:** Only for events with `hasMatcher: true`
- **Format:** Tool names joined with pipe (`|`)
- **Options:**
  ```javascript
  const matcherOptions = [
    { label: 'All Tools (*)', value: '*' },
    ...builtInTools.map(t => ({ label: t, value: t }))
  ]
  ```
- **Examples:**
  - `"Bash"` - Single tool
  - `"Read|Write|Edit"` - Multiple tools (OR)
  - `"*"` - Wildcard (all tools)
- **UI:** MultiSelect with chips, values joined with `|` on save

### type
- **Options:**
  ```javascript
  [
    { label: 'Command', value: 'command' },
    { label: 'Prompt', value: 'prompt' }
  ]
  ```
- **Note:** `prompt` type only valid for Stop/SubagentStop events
- **UI:** SelectButton (binary)

### command
- **Required:** Yes
- **Format:**
  - For `type: command`: Bash command or script path
  - For `type: prompt`: LLM prompt text
- **UI:** Textarea with auto-resize

### timeout
- **Format:** Positive integer (seconds)
- **Default:** 60
- **UI:** InputNumber with min=1

### enabled
- **Options:**
  ```javascript
  [
    { label: 'Enabled', value: true },
    { label: 'Disabled', value: false }
  ]
  ```
- **UI:** SelectButton (binary)

### suppressOutput
- **Purpose:** Hide hook output from transcript
- **Options:**
  ```javascript
  [
    { label: 'No', value: false },
    { label: 'Yes', value: true }
  ]
  ```
- **UI:** SelectButton (binary)

### continue
- **Purpose:** Whether to continue after hook execution
- **Options:**
  ```javascript
  [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ]
  ```
- **UI:** SelectButton (binary)

### systemMessage
- **Purpose:** Warning message shown to user (for PermissionRequest, PreToolUse)
- **UI:** Textarea

## JSON Structure

### Single Hook
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/script.py",
            "timeout": 30,
            "enabled": true
          }
        ]
      }
    ]
  }
}
```

### Multiple Matchers (Same Event)
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "script1.py" }]
      },
      {
        "matcher": "Read|Write",
        "hooks": [{ "type": "command", "command": "script2.py" }]
      }
    ]
  }
}
```

### Event Without Matcher
```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/cleanup.py"
          }
        ]
      }
    ]
  }
}
```

## Create Modal

When creating a new hook:
1. Select event type (required first step)
2. If event has matcher: show matcher MultiSelect
3. Show remaining fields based on event type

## Delete Confirmation

Hooks are identified by: `event + matcher + command` combination

No external references to check - hooks are self-contained in settings files.

## Backend Considerations

### Create Operation
1. Read existing settings.json
2. Add new hook to appropriate event array
3. Handle nested structure (event → matcher → hooks array)
4. Atomic write using temp file + rename pattern

### Update Operation
1. Read existing settings.json
2. Find hook by event + matcher + command (original values)
3. Update properties (except event)
4. Handle matcher changes (may need to move between arrays)
5. Atomic write

### Delete Operation
1. Read existing settings.json
2. Find and remove hook from event array
3. Clean up empty arrays/objects
4. Atomic write
