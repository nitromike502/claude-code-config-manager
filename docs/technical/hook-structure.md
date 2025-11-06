# Claude Code Hook Structure

## Overview

This document provides comprehensive documentation on Claude Code's hook system structure, merge strategies, and implementation details for the copy service.

**Last Updated:** 2025-11-05
**Related Code:** `/src/backend/services/copy-service.js`

---

## Hook Structure Verification (TASK-3.2.3)

**Investigation Results:**
- **Verified:** NO - Claude Code does NOT support simple hook arrays
- **Actual Format:** Complex nested object structure with event → matchers → hooks
- **Sources:**
  - `/tests/fixtures/samples/settings/valid-hooks.json`
  - `/tests/fixtures/projects/valid-project/.claude/settings.json`
  - `/src/backend/services/projectDiscovery.js` (lines 208-579)

---

## Claude Code Hook Structure (Official Format)

Hooks in `settings.json` follow this structure:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "*.ts",
        "hooks": [
          { "type": "command", "command": "tsc --noEmit", "enabled": true },
          { "type": "command", "command": "eslint --fix", "enabled": true }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          { "type": "command", "command": "npm test", "enabled": true }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command", "command": "git status", "enabled": true }
        ]
      }
    ]
  }
}
```

---

## Structure Breakdown (3 Levels of Nesting)

### Level 1 - Event Names

**Top-level keys under "hooks":**

Valid events: `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Notification`, `Stop`, `SubagentStop`, `PreCompact`, `SessionStart`, `SessionEnd`

**Important:** Only `PreToolUse` and `PostToolUse` support the "matcher" field. Other events ignore matcher if present.

### Level 2 - Matcher Entries

**Array of matcher config objects:**

Each event has an array of matcher entries:
```json
{ "matcher": "*.ts", "hooks": [...] }
```

Matcher is optional (defaults to `*`)

### Level 3 - Hook Commands

**Array of hook objects within each matcher:**

Each matcher entry contains a "hooks" array:
```json
{
  "type": "command",
  "command": "npm test",
  "enabled": true,
  "timeout": 60
}
```

**Required fields:** `type`, `command`
**Optional fields:** `enabled` (default true), `timeout` (default 60)

---

## API Flattened Format

The `projectDiscovery.js` service flattens this nested structure for easier consumption by the frontend. Each hook command becomes a separate object:

```json
[
  {
    "event": "PreToolUse",
    "matcher": "*.ts",
    "type": "command",
    "command": "tsc --noEmit",
    "timeout": 60,
    "enabled": true,
    "source": "settings.json"
  },
  {
    "event": "PreToolUse",
    "matcher": "*.ts",
    "type": "command",
    "command": "eslint --fix",
    "timeout": 60,
    "enabled": true,
    "source": "settings.json"
  }
]
```

**Reference:** See `projectDiscovery.js` lines 368-383 for flattening logic

---

## Deduplication Strategy

Per Claude Code spec (implemented in `projectDiscovery.js` lines 1088-1104):

> "Identical hook commands are automatically deduplicated"

**Deduplication key:** `event + matcher + command`

**Example:** `"PreToolUse::*.ts::tsc --noEmit"`

First occurrence is kept, duplicates are filtered out.

---

## Merge Strategy for copyHook (TASK-3.2.4)

The `copyHook` function must:

1. Read flattened hook from API (source hook object with event/matcher/command)
2. Read target `settings.json` file
3. Convert flattened source back to nested structure
4. Merge into target's nested structure
5. Apply deduplication (event + matcher + command)
6. Write merged nested structure back to `settings.json`

### Merge Algorithm (3-Level Merge)

**Level 1 - Event-level merge:**
- If target has event, merge into existing matcher array
- If target lacks event, create new event with matcher array

**Level 2 - Matcher-level merge:**
- Find matcher entry with same matcher pattern in event array
- If matcher exists, merge into existing hooks array
- If matcher missing, append new matcher entry to event array

**Level 3 - Hook command deduplication:**
- Within each matcher's hooks array, check for duplicate commands
- Deduplication key: "command" field (unique within event+matcher)
- If command exists, skip (keep existing)
- If command missing, append new hook object

---

## Complexity Assessment

**Complexity:** HIGH

**Reasons:**
1. Must convert between flattened API format and nested file format
2. 3-level merge algorithm (event → matcher → hooks)
3. Multiple deduplication checks at different levels
4. Must handle matcher-enabled vs non-matcher events differently
5. Must preserve existing hook structure while adding new hooks
6. Must handle missing `settings.json` (create new structure)
7. Must handle malformed `settings.json` gracefully

**Estimated Time:** 90 minutes

---

## Edge Cases to Handle

1. **Target settings.json doesn't exist**
   - Create new file with proper structure

2. **Target settings.json exists but has no "hooks" key**
   - Add "hooks" object with new event

3. **Target has event but different matcher**
   - Append new matcher entry to event array

4. **Target has same event+matcher but different command**
   - Append new hook to matcher's hooks array

5. **Target has exact duplicate (event+matcher+command)**
   - Skip (deduplication)

6. **Source event doesn't support matchers (e.g., UserPromptSubmit)**
   - Use default matcher "*" and warn if non-default matcher present

7. **Malformed target settings.json**
   - Return error, do not corrupt file

8. **Preserving other settings (mcpServers, etc.)**
   - Only modify "hooks" key, leave everything else intact

---

## Examples from Fixtures

### Example 1: Simple hook with matcher

**File:** `valid-hooks.json`

```json
{
  "hooks": {
    "pre-commit": [
      {
        "matcher": "*.ts",
        "hooks": [
          { "type": "command", "command": "tsc --noEmit", "enabled": true }
        ]
      }
    ]
  }
}
```

### Example 2: Multiple hooks per matcher

**File:** `valid-multiple-hooks-per-matcher.json`

```json
{
  "hooks": {
    "pre-commit": [
      {
        "matcher": "*.ts",
        "hooks": [
          { "type": "command", "command": "tsc --noEmit", "enabled": true },
          { "type": "command", "command": "eslint --fix", "enabled": true },
          { "type": "command", "command": "prettier --write", "enabled": true }
        ]
      }
    ]
  }
}
```

### Example 3: Multiple events

**File:** `valid-multiple-events.json`

```json
{
  "hooks": {
    "pre-commit": [
      { "matcher": "*.js", "hooks": [...] }
    ],
    "post-commit": [
      { "matcher": "*", "hooks": [...] }
    ],
    "pre-push": [
      { "matcher": "*", "hooks": [...] }
    ]
  }
}
```

### Example 4: Event without matcher support

**File:** `valid-project settings.json`

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          { "type": "command", "command": "npm test", "enabled": true }
        ]
      }
    ]
  }
}
```

---

## Recommendations for Implementation

### 1. Helper Function: `flattenedToNested(flattenedHook)`

**Input:** `{ event, matcher, type, command, timeout, enabled }`
**Output:** Partial nested structure to merge

### 2. Helper Function: `mergeHookIntoSettings(settings, nestedHook)`

**Input:** Settings object, nested hook structure
**Output:** Updated settings object
**Logic:** 3-level merge algorithm described above

### 3. Helper Function: `deduplicateHooksInSettings(settings)`

**Input:** Settings object with hooks
**Output:** Settings with deduplicated hooks
**Logic:** Apply deduplication at hook command level

### 4. Main copyHook Flow

a. Validate source (must be hook object from API)
b. Read target `settings.json` (or create empty structure)
c. Convert flattened source to nested format
d. Merge nested hook into settings
e. Apply deduplication
f. Write settings back to file
g. Return success with merged hook details

### 5. Testing Strategy

- Test each edge case listed above
- Verify structure preservation
- Verify deduplication works correctly
- Test with real fixture files

---

## References

- **Source Code:** `/src/backend/services/copy-service.js`
- **Project Discovery:** `/src/backend/services/projectDiscovery.js`
- **Test Fixtures:** `/tests/fixtures/samples/settings/`
- **Implementation Task:** TASK-3.2.4
