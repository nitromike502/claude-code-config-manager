---
id: BUG-038
type: bug
title: Hooks Display and Parsing - Spec Compliance Issues
status: todo
priority: P1
created: 2025-11-02T00:00:00Z
updated: 2025-11-02T14:30:00Z
assignee: backend-engineer
parent: null
tags: backend, parser, hooks, api, high-priority, spec-compliance, validation
severity: HIGH
component: Hooks Display & Parsing
estimated_effort: 6-8 hours
related_issues:
  - TODO.md Line 50
  - Phase 3 Blocker
  - Validation Report: /home/claude/manager/docs/validation/BUG-038-SPECIFICATION-VALIDATION-REPORT.md
---

# BUG-038: Hooks Display and Parsing - Spec Compliance Issues

## Description

The hooks parser has multiple spec compliance and validation issues that prevent proper display and validation of Claude Code hook configurations. After comprehensive specification review (see validation report), the following critical issues were identified:

**Current Issues:**
1. **Response Structure Mismatch**: API returns nested `hooks` arrays instead of flattened hook objects
2. **Missing Event Validation**: Accepts invalid event names (e.g., Git hooks like `pre-commit`)
3. **Missing Hook Deduplication**: Doesn't deduplicate identical hooks from multiple settings files
4. **Test Fixtures Invalid**: All test fixtures use Git hook names instead of Claude Code events
5. **No JSON Schema Validation**: Doesn't validate against official Claude Code schema

**Sample Issue Demonstration:**

Test case from `/home/claude/sample/.claude/settings.json` contained **invalid format** (not per official spec):
```json
{
  "hooks": {
    "Stop": ["echo 'cmd1'", "echo 'cmd2'"],     // ❌ INVALID per JSON Schema
    "SubagentStop": "echo 'Task completed!'"     // ❌ INVALID per JSON Schema
  }
}
```

This should have been rejected with validation errors, but was silently accepted.

---

## Official Claude Code Hooks Specification

### Valid Event Types (9 Total)

Per official documentation at https://docs.claude.com/en/docs/claude-code/hooks:

| Event Name | Supports Matchers | Description |
|------------|-------------------|-------------|
| `PreToolUse` | YES | Executes before tool calls; can block them |
| `PostToolUse` | YES | Runs after tool calls complete |
| `UserPromptSubmit` | NO | Triggers when users submit prompts |
| `Notification` | NO | Activates when Claude Code sends notifications |
| `Stop` | NO | Executes when Claude Code finishes responding |
| `SubagentStop` | NO | Runs when subagent tasks complete |
| `PreCompact` | NO | Triggers before compact operations |
| `SessionStart` | NO | Activates when sessions begin/resume |
| `SessionEnd` | NO | Runs when sessions conclude |

### Valid Hook Format (Per JSON Schema)

**Official JSON Schema**: https://json.schemastore.org/claude-code-settings.json

**Only ONE valid format** exists (with or without matcher):

#### With Matcher (PreToolUse, PostToolUse only):
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

#### Without Matcher (all other events):
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Task complete'"
          }
        ]
      }
    ]
  }
}
```

**Key Requirements:**
- Event value MUST be an array `[]`
- Each array element MUST be an object with `hooks` property
- `hooks` property MUST be an array of hook command objects
- Each hook command MUST have `type: "command"` and `command: "string"`
- `matcher` field is OPTIONAL (only applies to PreToolUse/PostToolUse)
- `timeout` field is OPTIONAL (numeric, > 0)

**Invalid Formats (NOT in specification):**
- ❌ String format: `"Stop": "command"`
- ❌ Array of strings: `"Stop": ["cmd1", "cmd2"]`
- ❌ Object format: `"Stop": {"command": "..."}`

---

## Impact

**Severity:** HIGH - Multiple critical issues affecting core functionality

**User Impact:**
1. **Invalid configurations accepted silently** - Users don't know their configs are wrong
2. **Duplicate hooks not deduplicated** - Commands run multiple times unnecessarily
3. **Invalid event names accepted** - Git hooks mixed with Claude Code hooks
4. **Cannot audit hook configurations** - Response structure doesn't match frontend expectations
5. **Blocks Phase 3+ features** - Copy Configuration requires accurate hook handling

**Scope:**
- All hooks endpoints: `/api/projects/:id/hooks` and `/api/user/hooks`
- Both project and user-level configurations
- All settings files: `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/settings.json`

---

## Root Cause Analysis

### Issue 1: Response Structure Mismatch

**Current API Response:**
```json
{
  "event": "Stop",
  "matcher": "",
  "hooks": [{"type": "command", "command": "echo hello"}],  // ❌ Nested array
  "source": "settings.json"
}
```

**Expected Flattened Structure:**
```json
{
  "event": "Stop",
  "matcher": "*",
  "type": "command",
  "command": "echo hello",
  "timeout": 60,
  "enabled": true,
  "source": "settings.json"
}
```

**Location:** `projectDiscovery.js:238` - Returns nested structure instead of flattening

### Issue 2: Missing Event Name Validation

**Problem:** Accepts ANY event name, including invalid ones like `pre-commit`, `post-merge`, etc.

**Evidence:** All test fixtures use Git hook names:
```bash
$ grep -r "pre-commit\|post-commit" tests/fixtures/
# Returns multiple matches in test fixtures
```

**Location:** `projectDiscovery.js:233` - No validation against VALID_HOOK_EVENTS list

### Issue 3: Missing Hook Deduplication

**Per Official Spec:** "Identical hook commands are automatically deduplicated"

**Current Behavior:** If same hook appears in `settings.json` and `settings.local.json`, it appears twice

**Location:** `projectDiscovery.js` - No deduplication logic after collecting hooks from multiple files

### Issue 4: No Structure Validation

**Problem:** Parser doesn't validate against JSON Schema requirements

**Examples of invalid formats accepted:**
- String values: `"Stop": "command"`
- Direct arrays: `"Stop": ["cmd1", "cmd2"]`
- Missing required fields: `{"type": "command"}` (missing `command`)
- Invalid type values: `{"type": "script", ...}` (must be "command")

**Location:** `hookParser.js` and `projectDiscovery.js` - No schema validation

---

## Reproduction Steps

### Test Case 1: Invalid Event Names (Test Fixtures)

1. Check test fixtures:
```bash
grep -r "\"pre-commit\"\|\"post-commit\"" tests/fixtures/projects/
```

2. **Expected:** Should use valid Claude Code events (`PreToolUse`, `Stop`, etc.)
3. **Actual:** Uses Git hook names throughout

### Test Case 2: Response Structure

1. Start server and query hooks endpoint:
```bash
curl http://localhost:8420/api/projects/homeclaudemanager/hooks | jq '.hooks[0]'
```

2. **Expected:** Flattened structure with `type`, `command` fields at top level
3. **Actual:** Nested structure with `hooks` array containing command objects

### Test Case 3: Missing Validation

1. Create settings file with invalid format:
```json
{
  "hooks": {
    "InvalidEvent": "some command",
    "Stop": ["cmd1", "cmd2"]
  }
}
```

2. **Expected:** Validation errors/warnings in API response
3. **Actual:** Silently accepts or partially processes invalid config

### Test Case 4: Duplicate Hooks

1. Add same hook to both `settings.json` and `settings.local.json`
2. **Expected:** Only one instance returned (deduplicated)
3. **Actual:** Both instances returned

---

## Proposed Solution (Strict Spec Compliance)

### Approach: Option A - Strict Specification Compliance

**Rationale:**
- Official JSON Schema explicitly defines valid formats
- Users expect validation against official specs
- Prevents future breaking changes
- Maintains consistency with Claude Code CLI

### Implementation Plan

#### Step 1: Add Event Name Validation

**File:** `projectDiscovery.js` (after line 232)

```javascript
const VALID_HOOK_EVENTS = [
  'PreToolUse', 'PostToolUse', 'UserPromptSubmit',
  'Notification', 'Stop', 'SubagentStop',
  'PreCompact', 'SessionStart', 'SessionEnd'
];

const MATCHER_EVENTS = ['PreToolUse', 'PostToolUse'];

for (const [event, matchers] of Object.entries(settings.hooks)) {
  // Validate event name
  if (!VALID_HOOK_EVENTS.includes(event)) {
    warnings.push({
      file: filePath,
      error: `Invalid hook event: "${event}". Valid events: ${VALID_HOOK_EVENTS.join(', ')}`,
      severity: 'error',
      skipped: true
    });
    continue;
  }

  // Validate matcher usage
  const supportsMatchers = MATCHER_EVENTS.includes(event);

  // ... rest of parsing
}
```

#### Step 2: Add Structure Validation

```javascript
// Validate top-level structure
if (!Array.isArray(matchers)) {
  warnings.push({
    file: filePath,
    error: `Hook event "${event}" must be an array of hook objects, got ${typeof matchers}`,
    severity: 'error',
    skipped: true,
    helpText: 'See https://docs.claude.com/en/docs/claude-code/hooks for valid format'
  });
  continue;
}

// Validate each matcher entry
for (const matcherEntry of matchers) {
  if (!matcherEntry || typeof matcherEntry !== 'object') {
    warnings.push({
      file: filePath,
      error: `Each hook entry for "${event}" must be an object with "hooks" property`,
      severity: 'error'
    });
    continue;
  }

  if (!Array.isArray(matcherEntry.hooks)) {
    warnings.push({
      file: filePath,
      error: `Hook entry for "${event}" missing required "hooks" array`,
      severity: 'error'
    });
    continue;
  }

  // Validate matcher field usage
  if (matcherEntry.matcher && !supportsMatchers) {
    warnings.push({
      file: filePath,
      error: `Event "${event}" does not support matchers. Matcher will be ignored.`,
      severity: 'warning'
    });
  }

  // Validate each hook command
  for (const hook of matcherEntry.hooks) {
    if (!hook || typeof hook !== 'object') {
      warnings.push({
        file: filePath,
        error: `Hook command must be an object with "type" and "command" fields`,
        severity: 'error'
      });
      continue;
    }

    if (hook.type !== 'command') {
      warnings.push({
        file: filePath,
        error: `Hook type must be "command", got "${hook.type}". Defaulting to "command".`,
        severity: 'warning'
      });
      hook.type = 'command';
    }

    if (!hook.command || typeof hook.command !== 'string') {
      warnings.push({
        file: filePath,
        error: `Hook missing required "command" field (string)`,
        severity: 'error',
        skipped: true
      });
      continue;
    }

    if (hook.timeout && (typeof hook.timeout !== 'number' || hook.timeout <= 0)) {
      warnings.push({
        file: filePath,
        error: `Hook timeout must be a positive number, got ${hook.timeout}`,
        severity: 'warning'
      });
    }
  }
}
```

#### Step 3: Flatten Response Structure

```javascript
// After parsing all hook entries, flatten the structure
const flattenedHooks = [];

for (const matcherEntry of matchers) {
  for (const hook of matcherEntry.hooks) {
    flattenedHooks.push({
      event: event,
      matcher: matcherEntry.matcher || '*',
      type: hook.type || 'command',
      command: hook.command,
      timeout: hook.timeout || 60,
      enabled: true,
      source: source
    });
  }
}

hooks.push(...flattenedHooks);
```

#### Step 4: Implement Deduplication

```javascript
// After collecting all hooks from all files, deduplicate
function deduplicateHooks(hooks) {
  const seen = new Set();
  return hooks.filter(hook => {
    // Create unique key from event, matcher, and command
    const key = `${hook.event}::${hook.matcher}::${hook.command}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Apply deduplication before returning
const deduplicatedHooks = deduplicateHooks(hooks);

return {
  hooks: deduplicatedHooks,
  warnings: warnings
};
```

#### Step 5: Fix Test Fixtures

**Update all test fixtures** to use valid Claude Code event names:

- `pre-commit` → `PreToolUse` or `Stop`
- `post-commit` → `PostToolUse` or `Stop`
- `pre-push` → `PreToolUse`
- `post-merge` → `Stop` or `SubagentStop`

**Update fixture format** to match JSON Schema:
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {"type": "command", "command": "echo 'done'"}
        ]
      }
    ]
  }
}
```

#### Step 6: Fix Sample Project

**Update `/home/claude/sample/.claude/settings.json`** to use spec-compliant format:
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {"type": "command", "command": "echo 'Starting task...'"},
          {"type": "command", "command": "echo 'Duh!'"}
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {"type": "command", "command": "echo 'Task completed!'"}
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {"type": "command", "command": "echo 'Error occurred: Check logs'"}
        ]
      }
    ]
  },
  "theme": "dark",
  "editor": "vscode"
}
```

---

## Test Cases Required

### Unit Tests (`tests/backend/parsers/hookParser.test.js` - NEW FILE)

```javascript
describe('Hook Parser - Spec Compliance', () => {
  test('should accept valid full matcher format');
  test('should accept valid simplified format (no matcher)');
  test('should reject invalid event names with error');
  test('should reject string format with error');
  test('should reject array-of-strings format with error');
  test('should handle multiple hooks per matcher');
  test('should handle empty hooks array');
  test('should deduplicate identical hooks');
  test('should handle special characters in commands');
  test('should warn when matcher used on non-matcher event');
  test('should validate timeout is positive number');
  test('should default type to "command" with warning');
  test('should error on missing command field');
  test('should handle all 9 valid event types');
});
```

### Integration Tests (`tests/backend/endpoints/project-hooks.test.js`)

```javascript
describe('GET /api/projects/:id/hooks - Spec Compliance', () => {
  test('should return flattened hook structure');
  test('should include validation warnings for invalid configs');
  test('should reject invalid event names');
  test('should deduplicate hooks from multiple files');
  test('should handle all valid Claude Code events');
  test('should validate matcher only on PreToolUse/PostToolUse');
  test('should return helpful error messages with docs links');
});
```

### Edge Cases

1. Empty hooks array: `"Stop": []` ✅ Valid
2. Multiple matchers: Multiple objects in event array ✅ Valid
3. Empty matcher: `"matcher": ""` → Should default to `"*"`
4. Multiple hooks per matcher: Array in `hooks` field ✅ Valid
5. Complex commands with special chars ✅ Valid
6. Environment variables in commands ✅ Valid
7. Null/undefined values ❌ Should error
8. Missing required fields ❌ Should error

---

## Validation Strategy

### Phase 1: Strict Validation (v2.0.1 Patch)
- Validate event names against VALID_HOOK_EVENTS
- Validate structure against JSON Schema requirements
- Return detailed warnings/errors
- Link to official documentation

### Phase 2: Enhanced Validation (Future)
- Use JSON Schema validator library (e.g., Ajv)
- Validate entire settings.json against official schema
- Provide auto-fix suggestions
- Migration tool for invalid configs

---

## Files to Modify

1. **`src/backend/services/projectDiscovery.js`** (Lines 213-316)
   - Add event name validation
   - Add structure validation
   - Flatten response structure
   - Implement deduplication

2. **`src/backend/parsers/hookParser.js`** (Lines 36-64)
   - Add validation constants
   - Update parsing logic for validation
   - Return warnings array

3. **`tests/backend/parsers/hookParser.test.js`** (NEW FILE)
   - Add comprehensive unit tests
   - Test all 9 event types
   - Test validation errors
   - Test deduplication

4. **`tests/backend/endpoints/project-hooks.test.js`** (UPDATE)
   - Update existing tests for flattened structure
   - Add validation test cases
   - Test with valid Claude Code events

5. **All test fixtures in `tests/fixtures/projects/*/`** (UPDATE)
   - Replace Git hook names with Claude Code events
   - Update format to match JSON Schema

6. **`/home/claude/sample/.claude/settings.json`** (FIX)
   - Convert to spec-compliant format
   - Use as validation test case

---

## Success Criteria

### Functional Requirements
- ✅ All 9 Claude Code event types validated correctly
- ✅ Invalid event names rejected with clear error messages
- ✅ Response structure flattened (no nested `hooks` arrays)
- ✅ Duplicate hooks deduplicated across files
- ✅ Validation warnings include helpful messages and doc links

### Test Coverage
- ✅ 100% of valid event types tested
- ✅ All invalid formats tested and rejected
- ✅ Edge cases covered (empty arrays, special chars, etc.)
- ✅ All existing tests pass (879 tests)

### Documentation
- ✅ Sample project uses spec-compliant format
- ✅ Test fixtures use valid Claude Code events
- ✅ Error messages link to official docs
- ✅ Code comments reference JSON Schema

---

## Estimated Effort

- **Investigation & Planning:** ✅ Complete (4 hours)
- **Implementation:**
  - Event validation: 1 hour
  - Structure validation: 2 hours
  - Response flattening: 1 hour
  - Deduplication: 1 hour
  - **Subtotal:** 5 hours
- **Testing:**
  - Unit tests: 2 hours
  - Integration tests: 1 hour
  - Fixture updates: 1 hour
  - **Subtotal:** 4 hours
- **Validation & Cleanup:**
  - Sample project fix: 0.5 hours
  - Manual testing: 1 hour
  - Documentation: 0.5 hours
  - **Subtotal:** 2 hours

**Total Estimated Effort:** 11 hours (revised from 4-5 hours due to comprehensive scope)

---

## Related Documentation

- **Specification Validation Report:** `/home/claude/manager/docs/validation/BUG-038-SPECIFICATION-VALIDATION-REPORT.md` (557 lines, comprehensive analysis)
- **Official Claude Code Hooks Docs:** https://docs.claude.com/en/docs/claude-code/hooks
- **Official JSON Schema:** https://json.schemastore.org/claude-code-settings.json
- **TODO Item:** Line 50 in `TODO.md` - "Verify Claude Code Manager hook array handling"

---

## Notes

### Why Strict Spec Compliance?

1. **Official JSON Schema exists** - Clear source of truth
2. **Our own project uses compliant format** - Dogfooding proves it works
3. **User trust** - Tools should validate configs, not silently accept invalid formats
4. **Future-proof** - Stays aligned with Claude Code evolution
5. **Better UX** - Clear errors better than silent failures

### Migration Path for Users

If users have invalid hook configs:
1. API returns detailed validation warnings
2. Warnings include links to official documentation
3. Warnings suggest correct format with examples
4. Future: Auto-fix tool to migrate configs

### Compatibility Notes

- **Claude Code v2.0.31** - Current version, uses JSON Schema format
- **Backward compatibility** - Not required (JSON Schema is current spec)
- **Forward compatibility** - If spec changes, we update to match

---

**Status:** Ready for Implementation
**Assignee:** backend-engineer
**Priority:** P1 (HIGH)
**Target Release:** v2.0.1 (Patch Release)
