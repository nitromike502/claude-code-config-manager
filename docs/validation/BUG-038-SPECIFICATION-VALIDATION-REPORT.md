# BUG-038: Hooks Parsing Specification Validation Report

**Report Date:** 2025-11-02
**Ticket:** BUG-038-hooks-display-parsing-incorrect.md
**Validator:** claude-code-expert
**Status:** CRITICAL ISSUES FOUND - Ticket requires updates

---

## Executive Summary

After comprehensive analysis of Claude Code's official hooks specification, the JSON Schema, real-world examples, and community implementations, **the proposed solution in BUG-038 is INCOMPLETE and does NOT match the official specification**.

### Critical Finding

**The ticket identifies a "simplified format" that DOES NOT EXIST in the official Claude Code specification.**

The formats shown in `/home/claude/sample/.claude/settings.json`:
```json
{
  "hooks": {
    "Stop": ["echo 'cmd1'", "echo 'cmd2'"],
    "SubagentStop": "echo 'Task completed!'"
  }
}
```

**These are NOT valid according to the official Claude Code JSON Schema.**

---

## 1. Official Claude Code Hooks Specification

### 1.1 Authoritative Sources

1. **Official Documentation:** https://docs.claude.com/en/docs/claude-code/hooks
2. **JSON Schema:** https://www.schemastore.org/claude-code-settings.json (referenced in `.claude/settings.json` files)
3. **Official Hooks Guide:** https://docs.claude.com/en/docs/claude-code/hooks-guide

### 1.2 Valid Hook Event Types

According to the official specification, there are **9 valid hook events**:

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

**CRITICAL:** The test fixtures use `pre-commit`, `post-commit`, `pre-push`, `post-merge`, `post-checkout` which are **NOT valid Claude Code hook events**. These appear to be Git hooks, not Claude Code hooks.

### 1.3 Valid Hook Formats (Per Official Specification)

According to the JSON Schema at https://www.schemastore.org/claude-code-settings.json, there are **ONLY TWO valid formats**:

#### Format 1: Full Matcher-Based (PreToolUse, PostToolUse)
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

**Required fields:**
- Event name must be an array `[]`
- Each array element must be an object with `hooks` property
- `hooks` property must be an array of hook command objects
- Each hook command object requires `type: "command"` and `command: "string"`
- `matcher` is optional (only applies to PreToolUse/PostToolUse)
- `timeout` is optional (numeric, > 0)

#### Format 2: Simplified (No Matcher) for Non-Tool Events
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

**Key difference from Format 1:** The `matcher` field is omitted for events that don't support matchers.

**Structure is IDENTICAL otherwise:**
- Event name must be an array `[]`
- Each array element must be an object with `hooks` property
- The `hooks` property contains an array of command objects

---

## 2. Invalid Formats Found in the Wild

### 2.1 The "Super-Simplified" Format (INVALID)

**Source:** `/home/claude/sample/.claude/settings.json`

```json
{
  "hooks": {
    "Stop": ["echo 'cmd1'", "echo 'cmd2'"],        // ❌ INVALID
    "SubagentStop": "echo 'Task completed!'"       // ❌ INVALID
  }
}
```

**Why invalid:**
- The JSON Schema requires `hooks[EventName]` to be an **array of objects**
- Each object must have a `hooks` property containing command objects
- Raw strings and arrays of strings are **NOT allowed** by the schema

### 2.2 The "Object with Command" Format (INVALID)

**Source:** Pascal Poredda blog post (https://www.pascal-poredda.com/blog/claude-code-audio-feedback-with-hooks)

```json
{
  "hooks": {
    "Stop": {                                      // ❌ INVALID
      "command": "npx tsx .claude/hooks/stop.ts"
    }
  }
}
```

**Why invalid:**
- The JSON Schema requires `hooks[EventName]` to be an **array**, not an object
- This format is not documented in the official specification
- The JSON Schema explicitly sets `additionalProperties: false` which would reject this

### 2.3 Analysis of Discrepancy

**Possible explanations:**

1. **Outdated examples:** The sample file may have been created with an older version of Claude Code that supported different formats
2. **Unofficial shortcuts:** Some community implementations may use non-standard formats that happen to work due to lenient parsing
3. **Documentation lag:** Real-world Claude Code implementation may accept formats not yet documented in the JSON Schema

**Evidence from real Claude Code projects:**

- `/home/claude/manager/.claude/settings.json` - Uses VALID format (matcher-based)
- `/home/claude/hooks/claude-code-hooks-mastery/.claude/settings.json` - Uses VALID format
- `/home/claude/claude-code-training/examples/dev-session-1/.claude/settings.json` - Uses VALID format

**Conclusion:** The "super-simplified" format appears to be either:
1. A test case that doesn't reflect actual Claude Code behavior
2. An undocumented feature not in the JSON Schema
3. Invalid syntax that happens to partially work

---

## 3. Gap Analysis: BUG-038 Proposed Solution

### 3.1 Issues with Proposed Solution (Lines 326-377)

**Proposed code claims to handle:**
```javascript
// Handle simplified format: string or array of strings
if (typeof value === 'string') { /* ... */ }
if (Array.isArray(value) && value.every(v => typeof v === 'string')) { /* ... */ }
```

**Problems:**

1. **Not Spec-Compliant:** The official JSON Schema does NOT allow these formats
2. **Incorrect Parsing Logic:** Even if we wanted to support these formats, the current parser (`hookParser.js`) won't be used by `projectDiscovery.js`
3. **Misleading Documentation:** The ticket claims these are "valid Claude Code formats" when they are not in the spec

### 3.2 What the Code Actually Does

Looking at `/home/claude/manager/src/backend/services/projectDiscovery.js` lines 233-244:

```javascript
for (const [event, matchers] of Object.entries(settings.hooks)) {
  if (Array.isArray(matchers)) {
    matchers.forEach((matcher, index) => {
      hooks.push({
        event,
        matcher: matcher.matcher || '',
        hooks: matcher.hooks || [],        // ❌ This is the problem!
        source: 'settings.json',
        matcherIndex: index
      });
    });
  }
}
```

**The actual bug is on line 238:** `hooks: matcher.hooks || []`

**What happens with valid format:**
```json
{
  "Stop": [
    {
      "hooks": [
        {"type": "command", "command": "echo 'hello'"}
      ]
    }
  ]
}
```

**Expected:** `matcher.hooks` is an array of hook command objects
**Current code returns:** The array correctly
**Display issue:** The response structure is wrong

The response format is:
```json
{
  "event": "Stop",
  "matcher": "",
  "hooks": [{"type": "command", "command": "echo 'hello'"}],
  "source": "settings.json"
}
```

But the frontend/API might be expecting a different structure. **This needs investigation.**

### 3.3 What's Actually Broken

After analyzing the code and specification, the **REAL issue** is likely:

1. **Response Structure Mismatch:** The API returns `hooks` as an array of command objects, but the frontend expects something else
2. **Event Name Validation:** The code accepts ANY event name, including invalid ones like `pre-commit`
3. **No Schema Validation:** The code doesn't validate against the official JSON Schema

---

## 4. Edge Cases and Missing Scenarios

### 4.1 Edge Cases That SHOULD Be Tested

Based on the official specification, here are valid edge cases:

#### 4.1.1 Empty Hooks Array
```json
{
  "hooks": {
    "Stop": []
  }
}
```
**Expected:** Valid, no hooks to execute

#### 4.1.2 Multiple Matchers for Same Event
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [{"type": "command", "command": "cmd1"}]
      },
      {
        "matcher": "Write",
        "hooks": [{"type": "command", "command": "cmd2"}]
      }
    ]
  }
}
```
**Expected:** Both matchers should be parsed

#### 4.1.3 Empty Matcher (Matches All)
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [{"type": "command", "command": "cmd"}]
      }
    ]
  }
}
```
**Expected:** Equivalent to `"matcher": "*"`

#### 4.1.4 Multiple Hooks per Matcher
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {"type": "command", "command": "cmd1"},
          {"type": "command", "command": "cmd2", "timeout": 120}
        ]
      }
    ]
  }
}
```
**Expected:** Both commands should execute

#### 4.1.5 Regex Matchers
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{"type": "command", "command": "cmd"}]
      }
    ]
  }
}
```
**Expected:** Matches both Edit and Write tools

#### 4.1.6 Complex Commands with Special Characters
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Task: \"Build\" completed!' && notify-send 'Done'"
          }
        ]
      }
    ]
  }
}
```
**Expected:** Command should be passed as-is to shell

#### 4.1.7 Environment Variables
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo $CLAUDE_PROJECT_DIR && ls $HOME/.claude"
          }
        ]
      }
    ]
  }
}
```
**Expected:** Variables should be expanded by shell

#### 4.1.8 Multi-line Commands (Escaped Newlines)
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Line 1' && \\\necho 'Line 2'"
          }
        ]
      }
    ]
  }
}
```
**Expected:** Command should work with escaped newlines

### 4.2 Invalid Formats That SHOULD Be Rejected

#### 4.2.1 Invalid Event Names
```json
{
  "hooks": {
    "pre-commit": [...]  // ❌ Not a valid Claude Code event
  }
}
```
**Expected:** Warning or error, hook should be skipped

#### 4.2.2 Missing Required Fields
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {"type": "command"}  // ❌ Missing 'command'
        ]
      }
    ]
  }
}
```
**Expected:** Warning, hook should be skipped

#### 4.2.3 Invalid Type
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {"type": "script", "command": "cmd"}  // ❌ type must be "command"
        ]
      }
    ]
  }
}
```
**Expected:** Warning, hook should be skipped or type should default to "command"

#### 4.2.4 Null/Undefined Values
```json
{
  "hooks": {
    "Stop": null,           // ❌ Must be array
    "SubagentStop": undefined  // ❌ Invalid JSON
  }
}
```
**Expected:** Error or skip

#### 4.2.5 Matcher on Non-Matcher Event
```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "Edit",  // ❌ Stop doesn't support matchers
        "hooks": [{"type": "command", "command": "cmd"}]
      }
    ]
  }
}
```
**Expected:** Warning (matcher will be ignored), or validation error

### 4.3 File Source Scenarios

#### 4.3.1 Multiple Settings Files
- `.claude/settings.json` (project)
- `.claude/settings.local.json` (project-local)
- `~/.claude/settings.json` (user-global)

**Expected merge behavior:** All hooks from all files should be collected and returned

#### 4.3.2 Duplicate Hooks
```json
// settings.json
{
  "hooks": {
    "Stop": [{"hooks": [{"type": "command", "command": "cmd1"}]}]
  }
}

// settings.local.json
{
  "hooks": {
    "Stop": [{"hooks": [{"type": "command", "command": "cmd1"}]}]
  }
}
```

**Per Claude Code spec:** "Identical hook commands are automatically deduplicated"
**Expected:** Should return only one instance of `cmd1`
**Current code:** Likely returns both (no deduplication logic visible)

#### 4.3.3 Conflicting Hooks
```json
// settings.json
{
  "hooks": {
    "Stop": [{"hooks": [{"type": "command", "command": "cmd1"}]}]
  }
}

// settings.local.json
{
  "hooks": {
    "Stop": [{"hooks": [{"type": "command", "command": "cmd2"}]}]
  }
}
```

**Expected:** Both should execute (different commands)

---

## 5. Proposed Solution Validation

### 5.1 Current Parser (`hookParser.js`) Issues

**Line 37:** `if (!Array.isArray(matchers)) continue;`

**Problem:** This skips ANY non-array value, including:
1. Invalid formats (correct behavior)
2. But the ticket claims string/array-of-strings are valid (incorrect claim)

### 5.2 Current `projectDiscovery.js` Issues

**Lines 234-244:** Only processes array format

**Problem:** Same as above - it's actually CORRECT per the spec, but the ticket says it's wrong

### 5.3 The Real Bug

After thorough analysis, I believe the **real bug** is:

1. **Response Structure:** The API returns hooks in a format the frontend doesn't understand
2. **Missing Deduplication:** Hooks from multiple files aren't deduplicated
3. **No Event Validation:** Invalid event names like `pre-commit` are accepted
4. **Test Fixtures Use Invalid Events:** All test fixtures use Git hooks, not Claude Code hooks

### 5.4 What Needs to Be Fixed

#### Fix 1: Validate Event Names
```javascript
const VALID_HOOK_EVENTS = [
  'PreToolUse', 'PostToolUse', 'UserPromptSubmit',
  'Notification', 'Stop', 'SubagentStop',
  'PreCompact', 'SessionStart', 'SessionEnd'
];

for (const [event, matchers] of Object.entries(settings.hooks)) {
  if (!VALID_HOOK_EVENTS.includes(event)) {
    warnings.push({
      file: filePath,
      error: `Invalid hook event: "${event}". Valid events: ${VALID_HOOK_EVENTS.join(', ')}`,
      skipped: true
    });
    continue;
  }
  // ... rest of parsing
}
```

#### Fix 2: Validate Hook Structure
```javascript
if (!Array.isArray(matchers)) {
  warnings.push({
    file: filePath,
    error: `Hook event "${event}" must be an array, got ${typeof matchers}`,
    skipped: true
  });
  continue;
}

for (const matcherEntry of matchers) {
  if (!matcherEntry.hooks || !Array.isArray(matcherEntry.hooks)) {
    warnings.push({
      file: filePath,
      error: `Hook matcher for "${event}" missing required "hooks" array`,
      skipped: true
    });
    continue;
  }

  for (const hook of matcherEntry.hooks) {
    if (hook.type !== 'command') {
      warnings.push({
        file: filePath,
        error: `Hook type must be "command", got "${hook.type}"`,
        skipped: false  // Can default to 'command'
      });
      hook.type = 'command';
    }

    if (!hook.command || typeof hook.command !== 'string') {
      warnings.push({
        file: filePath,
        error: `Hook missing required "command" field`,
        skipped: true
      });
      continue;
    }
  }
}
```

#### Fix 3: Implement Deduplication
```javascript
// After collecting all hooks
const seen = new Set();
const deduplicated = hooks.filter(h => {
  const key = `${h.event}:${h.matcher}:${h.command}`;
  if (seen.has(key)) {
    return false;
  }
  seen.add(key);
  return true;
});

return { hooks: deduplicated, warnings };
```

#### Fix 4: Fix Response Structure

**Current structure:**
```json
{
  "event": "Stop",
  "matcher": "",
  "hooks": [{"type": "command", "command": "echo hello"}],
  "source": "settings.json"
}
```

**Should be flattened to:**
```json
{
  "event": "Stop",
  "matcher": "",
  "type": "command",
  "command": "echo hello",
  "timeout": 60,
  "enabled": true,
  "source": "settings.json"
}
```

This matches what the frontend likely expects and what the proposed solution tries to achieve.

---

## 6. Additional Test Cases Needed

### 6.1 Unit Tests for `hookParser.js`

```javascript
describe('Hook Parser - Spec Compliance', () => {
  test('should accept valid full matcher format', () => {
    const settings = {
      hooks: {
        PreToolUse: [
          {
            matcher: "Edit|Write",
            hooks: [
              { type: "command", command: "cmd1" }
            ]
          }
        ]
      }
    };
    const result = parseHooksFromSettings(settings, 'project', '/path/to/file');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      event: 'PreToolUse',
      matcher: 'Edit|Write',
      type: 'command',
      command: 'cmd1'
    });
  });

  test('should accept valid simplified format (no matcher)', () => {
    const settings = {
      hooks: {
        Stop: [
          {
            hooks: [
              { type: "command", command: "echo done" }
            ]
          }
        ]
      }
    };
    const result = parseHooksFromSettings(settings, 'project', '/path/to/file');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      event: 'Stop',
      matcher: '*',  // Should default to '*' when omitted
      command: 'echo done'
    });
  });

  test('should reject invalid event names', () => {
    const settings = {
      hooks: {
        'pre-commit': [  // Invalid - not a Claude Code event
          { hooks: [{ type: "command", command: "cmd" }] }
        ]
      }
    };
    const { hooks, warnings } = parseHooksFromSettings(settings, 'project', '/path/to/file');
    expect(hooks).toHaveLength(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].error).toContain('Invalid hook event');
  });

  test('should reject string format (not in spec)', () => {
    const settings = {
      hooks: {
        Stop: "echo done"  // Invalid per JSON Schema
      }
    };
    const { hooks, warnings } = parseHooksFromSettings(settings, 'project', '/path/to/file');
    expect(hooks).toHaveLength(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].error).toContain('must be an array');
  });

  test('should reject array of strings format (not in spec)', () => {
    const settings = {
      hooks: {
        Stop: ["echo cmd1", "echo cmd2"]  // Invalid per JSON Schema
      }
    };
    const { hooks, warnings } = parseHooksFromSettings(settings, 'project', '/path/to/file');
    expect(hooks).toHaveLength(0);
    expect(warnings).toHaveLength(1);
  });

  test('should handle multiple hooks per matcher', () => {
    const settings = {
      hooks: {
        Stop: [
          {
            hooks: [
              { type: "command", command: "cmd1" },
              { type: "command", command: "cmd2", timeout: 120 }
            ]
          }
        ]
      }
    };
    const result = parseHooksFromSettings(settings, 'project', '/path/to/file');
    expect(result).toHaveLength(2);
    expect(result[0].command).toBe('cmd1');
    expect(result[1].command).toBe('cmd2');
    expect(result[1].timeout).toBe(120);
  });

  test('should handle empty hooks array', () => {
    const settings = {
      hooks: {
        Stop: []
      }
    };
    const result = parseHooksFromSettings(settings, 'project', '/path/to/file');
    expect(result).toHaveLength(0);
  });

  test('should deduplicate identical hooks', () => {
    const settings = {
      hooks: {
        Stop: [
          { hooks: [{ type: "command", command: "cmd1" }] },
          { hooks: [{ type: "command", command: "cmd1" }] }  // Duplicate
        ]
      }
    };
    const result = parseHooksFromSettings(settings, 'project', '/path/to/file');
    expect(result).toHaveLength(1);
  });

  test('should handle special characters in commands', () => {
    const settings = {
      hooks: {
        Stop: [
          {
            hooks: [
              { type: "command", command: "echo 'Task: \"Build\" complete!' && notify-send 'Done'" }
            ]
          }
        ]
      }
    };
    const result = parseHooksFromSettings(settings, 'project', '/path/to/file');
    expect(result).toHaveLength(1);
    expect(result[0].command).toContain('"Build"');
  });

  test('should validate matcher only on PreToolUse/PostToolUse', () => {
    const settings = {
      hooks: {
        Stop: [
          {
            matcher: "Edit",  // Should be ignored/warned for Stop event
            hooks: [{ type: "command", command: "cmd" }]
          }
        ]
      }
    };
    const { hooks, warnings } = parseHooksFromSettings(settings, 'project', '/path/to/file');
    expect(hooks).toHaveLength(1);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].error).toContain('matcher not supported');
  });
});
```

### 6.2 Integration Tests

```javascript
describe('GET /api/projects/:id/hooks - Spec Compliance', () => {
  test('should return flattened hook structure', async () => {
    const response = await request(app)
      .get(`/api/projects/${validProjectId}/hooks`);

    expect(response.status).toBe(200);
    expect(response.body.hooks).toBeInstanceOf(Array);

    if (response.body.hooks.length > 0) {
      const hook = response.body.hooks[0];
      expect(hook).toHaveProperty('event');
      expect(hook).toHaveProperty('type');
      expect(hook).toHaveProperty('command');
      expect(hook).toHaveProperty('source');
      // Should NOT have nested 'hooks' array
      expect(hook.hooks).toBeUndefined();
    }
  });

  test('should reject invalid event names with warnings', async () => {
    // Create test project with invalid event
    const response = await request(app)
      .get(`/api/projects/${invalidEventProjectId}/hooks`);

    expect(response.status).toBe(200);
    expect(response.body.warnings).toBeInstanceOf(Array);
    expect(response.body.warnings.length).toBeGreaterThan(0);
    expect(response.body.warnings[0].error).toContain('Invalid hook event');
  });

  test('should deduplicate hooks from multiple files', async () => {
    // Project with same hook in settings.json and settings.local.json
    const response = await request(app)
      .get(`/api/projects/${duplicateHooksProjectId}/hooks`);

    expect(response.status).toBe(200);
    const stopHooks = response.body.hooks.filter(h =>
      h.event === 'Stop' && h.command === 'echo done'
    );
    expect(stopHooks).toHaveLength(1);  // Should be deduplicated
  });
});
```

---

## 7. Recommendations

### 7.1 Immediate Actions Required

1. **Update BUG-038 Ticket**
   - Remove references to "simplified string/array format" as valid
   - Clarify that the JSON Schema only supports array-of-objects format
   - Update test cases to use valid Claude Code event names
   - Document that `/home/claude/sample/.claude/settings.json` contains INVALID syntax

2. **Fix Test Fixtures**
   - Replace `pre-commit`, `post-commit`, etc. with valid Claude Code events
   - Use `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, etc.
   - Ensure all test fixtures follow the official JSON Schema

3. **Implement Proper Validation**
   - Validate event names against VALID_HOOK_EVENTS list
   - Validate structure matches JSON Schema
   - Return warnings for invalid configurations
   - Add deduplication logic

4. **Fix Response Structure**
   - Flatten nested `hooks` array into individual hook objects
   - Each response item should be a single hook, not a matcher with hooks

5. **Update Documentation**
   - Add comments explaining the two valid formats
   - Reference the official JSON Schema
   - Document that community examples may show invalid formats

### 7.2 Decision Required: Sample File

**Question:** What should we do with `/home/claude/sample/.claude/settings.json`?

**Options:**

**A) Fix it to match spec:**
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

**B) Keep it as invalid test case** (for testing error handling)

**C) Investigate if Claude Code actually accepts this format** (despite JSON Schema saying it shouldn't)

### 7.3 Long-Term Improvements

1. **JSON Schema Validation**
   - Use a JSON Schema validator library
   - Validate settings files against official schema
   - Return detailed validation errors

2. **Better Error Messages**
   - Link to official documentation in error messages
   - Suggest corrections for common mistakes
   - Show examples of valid format

3. **Support for Future Formats**
   - If Claude Code adds new formats, update parser accordingly
   - Keep alignment with official JSON Schema
   - Add migration guide for users with old formats

---

## 8. Conclusion

### 8.1 Summary of Findings

1. **Proposed solution is based on incorrect assumption** that string/array-of-strings formats are valid
2. **Official JSON Schema only supports array-of-objects format**
3. **Test fixtures use invalid Git hook event names** instead of Claude Code events
4. **Current code actually parses valid formats correctly** but may have response structure issues
5. **Missing critical features:** event validation, deduplication, proper error handling

### 8.2 Specification Compliance Status

| Feature | BUG-038 Proposed | Spec-Compliant | Status |
|---------|------------------|----------------|--------|
| Full matcher format | ✅ Yes | ✅ Yes | ✅ COMPLIANT |
| Simplified no-matcher format | ✅ Yes | ✅ Yes | ✅ COMPLIANT |
| String format | ✅ Yes | ❌ No | ❌ NON-COMPLIANT |
| Array-of-strings format | ✅ Yes | ❌ No | ❌ NON-COMPLIANT |
| Event name validation | ❌ No | ✅ Required | ❌ MISSING |
| Hook deduplication | ❌ No | ✅ Required | ❌ MISSING |
| Response structure | ⚠️ Unclear | ✅ Flat | ⚠️ NEEDS REVIEW |

### 8.3 Next Steps

1. **Clarify with Claude Code Team:** Does the actual Claude Code CLI accept the string/array formats?
2. **Update Ticket:** Remove non-compliant format support
3. **Fix Test Fixtures:** Use valid Claude Code event names
4. **Implement Validation:** Add event name and structure validation
5. **Test Against Real Claude Code:** Verify parser behavior matches actual Claude Code CLI

---

## 9. References

### 9.1 Official Documentation
- **Hooks Guide:** https://docs.claude.com/en/docs/claude-code/hooks-guide
- **Hooks Reference:** https://docs.claude.com/en/docs/claude-code/hooks
- **JSON Schema:** https://www.schemastore.org/claude-code-settings.json

### 9.2 Community Resources
- **GitHub Examples:** https://github.com/disler/claude-code-hooks-mastery
- **Blog Posts:** https://www.pascal-poredda.com/blog/claude-code-audio-feedback-with-hooks

### 9.3 Internal Files
- **BUG-038 Ticket:** `/home/tickets/claude/manager/bugs/todo/BUG-038-hooks-display-parsing-incorrect.md`
- **Hook Parser:** `/home/claude/manager/src/backend/parsers/hookParser.js`
- **Project Discovery:** `/home/claude/manager/src/backend/services/projectDiscovery.js`
- **Sample File:** `/home/claude/sample/.claude/settings.json`
- **Test Fixtures:** `/home/claude/manager/tests/fixtures/projects/*/. claude/settings*.json`

---

**Report Prepared By:** Claude Code Expert Agent
**Validation Date:** 2025-11-02
**Status:** CRITICAL ISSUES FOUND - TICKET REQUIRES REVISION
