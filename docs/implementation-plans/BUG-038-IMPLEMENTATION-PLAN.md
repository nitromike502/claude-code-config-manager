# BUG-038 Implementation Plan: Hooks Spec Compliance

**Status:** Ready for Implementation
**Priority:** P1 (HIGH)
**Target Release:** v2.0.1 (Patch Release)
**Estimated Effort:** 11 hours
**Assignee:** backend-engineer

---

## Executive Summary

This document provides the complete implementation plan for BUG-038, which addresses multiple spec compliance issues in the hooks parser. After comprehensive specification analysis (see validation report), we're implementing **strict spec compliance** per the official Claude Code JSON Schema.

**What Changed:**
- ✅ Sample project `/home/claude/sample/.claude/settings.json` fixed to spec-compliant format
- ✅ Ticket BUG-038 completely rewritten with corrected findings
- ✅ Validation report created with comprehensive spec analysis

**What's Next:**
- Implement event name validation (9 valid events only)
- Implement structure validation per JSON Schema
- Flatten API response structure
- Add hook deduplication
- Fix test fixtures (Git hooks → Claude Code events)

---

## Quick Reference

| Item | Location |
|------|----------|
| **Ticket** | `/home/tickets/claude/manager/bugs/todo/BUG-038-hooks-display-parsing-incorrect.md` |
| **Validation Report** | `/home/claude/manager/docs/validation/BUG-038-SPECIFICATION-VALIDATION-REPORT.md` |
| **This Plan** | `/home/claude/manager/docs/implementation-plans/BUG-038-IMPLEMENTATION-PLAN.md` |
| **Main Files** | `src/backend/services/projectDiscovery.js` (lines 213-316) |
| | `src/backend/parsers/hookParser.js` (lines 36-64) |

---

## Implementation Approach: Strict Spec Compliance

### Why Strict Compliance?

1. **Official JSON Schema exists** - Clear, authoritative source of truth
2. **Our own production project uses it** - `/home/claude/manager/.claude/settings.json` validates dogfooding
3. **User trust and safety** - Tools should validate, not silently accept invalid configs
4. **Future-proof** - Aligned with Claude Code v2.0.31 and future evolution
5. **Better UX** - Clear errors better than silent failures

### What We're NOT Doing

❌ **NOT supporting undocumented "simplified" formats:**
- `"Stop": "command"` (string format)
- `"Stop": ["cmd1", "cmd2"]` (array of strings)

These formats are **not in the official JSON Schema** and were only found in the (now-fixed) sample project.

---

## The 5 Core Issues to Fix

### Issue 1: Response Structure Mismatch ⚠️

**Current:** Nested `hooks` array
```json
{
  "event": "Stop",
  "hooks": [{"type": "command", "command": "..."}]  // ❌ Nested
}
```

**Fixed:** Flattened structure
```json
{
  "event": "Stop",
  "type": "command",
  "command": "...",
  "timeout": 60,
  "matcher": "*"
}
```

**Location:** `projectDiscovery.js:238`

### Issue 2: Missing Event Validation ❌

**Current:** Accepts ANY event name (including Git hooks)
**Fixed:** Validate against 9 official Claude Code events

**Valid Events:**
- `PreToolUse`, `PostToolUse` (support matchers)
- `UserPromptSubmit`, `Notification`, `Stop`, `SubagentStop`
- `PreCompact`, `SessionStart`, `SessionEnd`

**Location:** `projectDiscovery.js:233` (add validation before processing)

### Issue 3: Missing Deduplication ❌

**Per Spec:** "Identical hook commands are automatically deduplicated"

**Current:** Same hook in `settings.json` + `settings.local.json` = 2 entries
**Fixed:** Deduplicate by `event::matcher::command` key

**Location:** `projectDiscovery.js` (after collecting all hooks)

### Issue 4: No Structure Validation ❌

**Current:** Silently accepts invalid formats
**Fixed:** Validate against JSON Schema:
- Event value MUST be array
- Array elements MUST have `hooks` property
- Each hook MUST have `type: "command"` and `command: "string"`

**Location:** `projectDiscovery.js` (during parsing)

### Issue 5: Test Fixtures Use Invalid Events ❌

**Current:** `pre-commit`, `post-commit`, `pre-push` (Git hooks)
**Fixed:** Use valid Claude Code events (`PreToolUse`, `Stop`, etc.)

**Location:** All files in `tests/fixtures/projects/*/`

---

## Implementation Steps

### Step 1: Add Validation Constants

**File:** `src/backend/services/projectDiscovery.js` (after line 232)

```javascript
const VALID_HOOK_EVENTS = [
  'PreToolUse',
  'PostToolUse',
  'UserPromptSubmit',
  'Notification',
  'Stop',
  'SubagentStop',
  'PreCompact',
  'SessionStart',
  'SessionEnd'
];

const MATCHER_EVENTS = ['PreToolUse', 'PostToolUse'];
```

**Why:** Centralized source of truth for valid events, matches official spec exactly.

### Step 2: Implement Event Validation

**File:** `src/backend/services/projectDiscovery.js` (line 233, inside hook parsing loop)

```javascript
for (const [event, matchers] of Object.entries(settings.hooks)) {
  // STEP 2A: Validate event name
  if (!VALID_HOOK_EVENTS.includes(event)) {
    warnings.push({
      file: filePath,
      error: `Invalid hook event: "${event}". Valid events are: ${VALID_HOOK_EVENTS.join(', ')}`,
      severity: 'error',
      skipped: true,
      helpUrl: 'https://docs.claude.com/en/docs/claude-code/hooks'
    });
    continue;  // Skip this event entirely
  }

  // STEP 2B: Check if event supports matchers
  const supportsMatchers = MATCHER_EVENTS.includes(event);

  // ... rest of validation
}
```

**Tests Required:**
- Valid events accepted
- Invalid events (e.g., `pre-commit`) rejected with error
- Error message includes list of valid events
- Error includes link to docs

### Step 3: Implement Structure Validation

**File:** `src/backend/services/projectDiscovery.js` (after event validation)

```javascript
// STEP 3A: Validate top-level structure (must be array)
if (!Array.isArray(matchers)) {
  warnings.push({
    file: filePath,
    error: `Hook event "${event}" must be an array, got ${typeof matchers}`,
    severity: 'error',
    skipped: true,
    helpUrl: 'https://docs.claude.com/en/docs/claude-code/hooks'
  });
  continue;
}

// STEP 3B: Validate each matcher entry
for (const matcherEntry of matchers) {
  // Must be object
  if (!matcherEntry || typeof matcherEntry !== 'object') {
    warnings.push({
      file: filePath,
      error: `Each hook entry for "${event}" must be an object with "hooks" property`,
      severity: 'error'
    });
    continue;
  }

  // Must have 'hooks' array
  if (!Array.isArray(matcherEntry.hooks)) {
    warnings.push({
      file: filePath,
      error: `Hook entry for "${event}" missing required "hooks" array`,
      severity: 'error'
    });
    continue;
  }

  // Warn if matcher used on non-matcher event
  if (matcherEntry.matcher && !supportsMatchers) {
    warnings.push({
      file: filePath,
      error: `Event "${event}" does not support matchers. Field will be ignored.`,
      severity: 'warning'
    });
  }

  // STEP 3C: Validate each hook command object
  for (const hook of matcherEntry.hooks) {
    // Must be object
    if (!hook || typeof hook !== 'object') {
      warnings.push({
        file: filePath,
        error: `Hook command must be an object with "type" and "command" fields`,
        severity: 'error'
      });
      continue;
    }

    // Validate type field
    if (hook.type !== 'command') {
      if (hook.type) {
        warnings.push({
          file: filePath,
          error: `Hook type must be "command", got "${hook.type}". Defaulting to "command".`,
          severity: 'warning'
        });
      }
      hook.type = 'command';  // Auto-fix
    }

    // Validate command field (required)
    if (!hook.command || typeof hook.command !== 'string') {
      warnings.push({
        file: filePath,
        error: `Hook missing required "command" field (must be a string)`,
        severity: 'error',
        skipped: true
      });
      continue;
    }

    // Validate timeout (optional, but must be positive number if present)
    if (hook.timeout !== undefined &&
        (typeof hook.timeout !== 'number' || hook.timeout <= 0)) {
      warnings.push({
        file: filePath,
        error: `Hook timeout must be a positive number, got ${typeof hook.timeout}`,
        severity: 'warning'
      });
    }
  }
}
```

**Tests Required:**
- Non-array values rejected
- Objects without `hooks` property rejected
- Hooks without `command` field rejected
- Invalid `type` auto-fixed with warning
- Invalid `timeout` warned
- Matcher on non-matcher event warned

### Step 4: Flatten Response Structure

**File:** `src/backend/services/projectDiscovery.js` (replace current hook pushing logic)

**Current Code (Lines 234-244):**
```javascript
matchers.forEach((matcher, index) => {
  hooks.push({
    event,
    matcher: matcher.matcher || '',
    hooks: matcher.hooks || [],  // ❌ Nested array
    source: 'settings.json',
    matcherIndex: index
  });
});
```

**New Code:**
```javascript
// Flatten structure: one API object per hook command
const flattenedHooks = [];

matchers.forEach((matcherEntry) => {
  // Each matcher entry can have multiple hook commands
  for (const hook of matcherEntry.hooks) {
    flattenedHooks.push({
      event: event,
      matcher: matcherEntry.matcher || '*',  // Default to '*' (match all)
      type: hook.type || 'command',
      command: hook.command,
      timeout: hook.timeout || 60,  // Default timeout
      enabled: true,
      source: source  // e.g., 'settings.json', 'settings.local.json'
    });
  }
});

hooks.push(...flattenedHooks);
```

**Why Flattening:**
1. Frontend expects one object = one executable hook
2. Easier to display in UI (no nested arrays to unpack)
3. Matches structure used by other config types (agents, commands)
4. Simplifies deduplication logic

**Tests Required:**
- Response has no nested `hooks` arrays
- Each hook is a top-level object
- `matcher` defaults to `'*'` when missing
- `timeout` defaults to `60` when missing
- Multiple hooks per matcher create multiple response objects

### Step 5: Implement Deduplication

**File:** `src/backend/services/projectDiscovery.js` (after collecting hooks from all files)

**New Function:**
```javascript
/**
 * Deduplicate hooks per Claude Code spec
 * @param {Array} hooks - Array of hook objects
 * @returns {Array} Deduplicated hooks
 */
function deduplicateHooks(hooks) {
  const seen = new Set();
  return hooks.filter(hook => {
    // Create unique key: event + matcher + command
    // This ensures hooks with same functionality are deduplicated
    const key = `${hook.event}::${hook.matcher}::${hook.command}`;

    if (seen.has(key)) {
      return false;  // Skip duplicate
    }

    seen.add(key);
    return true;  // Keep first occurrence
  });
}
```

**Usage:**
```javascript
// After collecting all hooks from all files
const deduplicatedHooks = deduplicateHooks(hooks);

return {
  hooks: deduplicatedHooks,
  warnings: warnings,
  // ... other fields
};
```

**Tests Required:**
- Identical hooks from different files deduplicated
- Different commands kept (not duplicates)
- Different matchers kept (not duplicates)
- Different events kept (not duplicates)
- Deduplication preserves first occurrence

### Step 6: Fix Test Fixtures

**Files:** All in `tests/fixtures/projects/*/`

**Changes Required:**

1. **Replace Git hook event names:**
   - `pre-commit` → `Stop` or `PreToolUse`
   - `post-commit` → `Stop` or `PostToolUse`
   - `pre-push` → `PreToolUse`
   - `post-merge` → `SubagentStop`
   - `post-checkout` → `Stop`

2. **Update format to spec-compliant:**

**Before (INVALID):**
```json
{
  "hooks": {
    "pre-commit": [
      {"command": "npm test"}
    ]
  }
}
```

**After (VALID):**
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {"type": "command", "command": "npm test"}
        ]
      }
    ]
  }
}
```

**Affected Files:**
```bash
tests/fixtures/projects/valid-project/.claude/settings.json
tests/fixtures/projects/valid-project/.claude/settings.local.json
tests/fixtures/projects/malformed-project/.claude/settings.json
tests/fixtures/user/.claude/settings.json
```

**Process:**
1. Read each fixture file
2. Identify invalid event names
3. Replace with appropriate Claude Code event
4. Update format to match JSON Schema
5. Verify tests still pass (update test expectations if needed)

---

## Test Strategy

### New Unit Tests (NEW FILE)

**File:** `tests/backend/parsers/hookParser.test.js`

```javascript
describe('Hook Parser - Spec Compliance', () => {
  describe('Valid Event Names', () => {
    test('accepts all 9 valid Claude Code events', () => {
      // Test each: PreToolUse, PostToolUse, UserPromptSubmit,
      // Notification, Stop, SubagentStop, PreCompact,
      // SessionStart, SessionEnd
    });
  });

  describe('Invalid Event Names', () => {
    test('rejects Git hook names (pre-commit, etc.)', () => {
      // Should return error in warnings array
    });

    test('rejects arbitrary event names', () => {
      // e.g., "CustomEvent", "MyHook"
    });
  });

  describe('Format Validation', () => {
    test('accepts valid full matcher format', () => {
      // PreToolUse with matcher
    });

    test('accepts valid simplified format (no matcher)', () => {
      // Stop without matcher
    });

    test('rejects string format with error', () => {
      // "Stop": "command"
    });

    test('rejects array-of-strings with error', () => {
      // "Stop": ["cmd1", "cmd2"]
    });
  });

  describe('Structure Validation', () => {
    test('validates type field (must be "command")', () => {
      // Auto-fixes to "command" with warning
    });

    test('validates command field is required', () => {
      // Returns error if missing
    });

    test('validates timeout is positive number', () => {
      // Warns if invalid
    });
  });

  describe('Edge Cases', () => {
    test('handles empty hooks array', () => {
      // "Stop": [] should be valid
    });

    test('handles multiple hooks per matcher', () => {
      // Should create multiple flattened objects
    });

    test('handles special characters in commands', () => {
      // Should preserve as-is
    });
  });

  describe('Deduplication', () => {
    test('deduplicates identical hooks', () => {
      // Same event + matcher + command = one entry
    });

    test('keeps hooks with different commands', () => {
      // Different command = not duplicate
    });
  });
});
```

### Updated Integration Tests

**File:** `tests/backend/endpoints/project-hooks.test.js`

**New Tests:**
```javascript
describe('GET /api/projects/:id/hooks - Spec Compliance', () => {
  test('returns flattened hook structure', async () => {
    // No nested 'hooks' arrays
  });

  test('includes validation warnings for invalid configs', async () => {
    // warnings array populated
  });

  test('rejects invalid event names', async () => {
    // Git hooks return errors
  });

  test('deduplicates hooks from multiple files', async () => {
    // Same hook in settings.json + settings.local.json = 1 entry
  });

  test('validates matcher only on PreToolUse/PostToolUse', async () => {
    // Warns if matcher on Stop event
  });
});
```

### Test Coverage Goals

- ✅ All 9 event types tested
- ✅ All invalid formats rejected
- ✅ All validation warnings tested
- ✅ Deduplication tested
- ✅ Response structure validated
- ✅ All existing tests pass (879 tests)

---

## Implementation Checklist

### Phase 1: Backend Implementation (5 hours)

- [ ] **Add validation constants** (Step 1)
  - [ ] `VALID_HOOK_EVENTS` array
  - [ ] `MATCHER_EVENTS` array
  - [ ] Add to `projectDiscovery.js`

- [ ] **Implement event validation** (Step 2)
  - [ ] Check event name against VALID_HOOK_EVENTS
  - [ ] Return error for invalid events
  - [ ] Check matcher support per event type
  - [ ] Add helpful error messages with doc links

- [ ] **Implement structure validation** (Step 3)
  - [ ] Validate top-level array structure
  - [ ] Validate matcher entry objects
  - [ ] Validate hook command objects
  - [ ] Validate type, command, timeout fields
  - [ ] Add warnings for auto-fixable issues

- [ ] **Flatten response structure** (Step 4)
  - [ ] Replace nested hooks array
  - [ ] Create one object per hook command
  - [ ] Add default values (matcher: '*', timeout: 60)
  - [ ] Maintain source tracking

- [ ] **Implement deduplication** (Step 5)
  - [ ] Create `deduplicateHooks()` function
  - [ ] Use event::matcher::command as key
  - [ ] Apply before returning response
  - [ ] Preserve first occurrence

### Phase 2: Testing (4 hours)

- [ ] **Create unit tests** (NEW FILE)
  - [ ] Create `tests/backend/parsers/hookParser.test.js`
  - [ ] Test all 9 event types
  - [ ] Test invalid event rejection
  - [ ] Test format validation
  - [ ] Test structure validation
  - [ ] Test deduplication
  - [ ] Aim for 100% code coverage

- [ ] **Update integration tests**
  - [ ] Update `tests/backend/endpoints/project-hooks.test.js`
  - [ ] Test flattened response structure
  - [ ] Test validation warnings
  - [ ] Test deduplication across files
  - [ ] Test with valid Claude Code events

- [ ] **Fix test fixtures** (Step 6)
  - [ ] Update `valid-project` fixtures
  - [ ] Update `malformed-project` fixtures
  - [ ] Update user-level fixtures
  - [ ] Replace Git hook names
  - [ ] Convert to spec-compliant format
  - [ ] Run tests to verify changes

### Phase 3: Validation & Cleanup (2 hours)

- [ ] **Manual testing**
  - [ ] Test with `/home/claude/sample/` (now spec-compliant)
  - [ ] Test with `/home/claude/manager/` (production project)
  - [ ] Test invalid configs (should return errors)
  - [ ] Test deduplication with multiple files
  - [ ] Verify UI displays hooks correctly

- [ ] **Documentation**
  - [ ] Add code comments referencing JSON Schema
  - [ ] Document validation constants
  - [ ] Document deduplication logic
  - [ ] Update CHANGELOG.md

- [ ] **Final verification**
  - [ ] All 879 tests pass
  - [ ] No regressions in other features
  - [ ] Sample project displays correctly
  - [ ] Production project unaffected

---

## Success Criteria

### Functional Requirements

- ✅ **Event Validation**: All 9 Claude Code events validated, invalid names rejected
- ✅ **Structure Validation**: Invalid formats rejected with clear, helpful errors
- ✅ **Response Format**: Flattened structure (no nested `hooks` arrays)
- ✅ **Deduplication**: Identical hooks appear once across all settings files
- ✅ **Error Messages**: Include event lists, doc links, and helpful suggestions

### Test Coverage

- ✅ **Unit Tests**: 100% coverage of validation logic
- ✅ **Integration Tests**: All API scenarios tested
- ✅ **Edge Cases**: Empty arrays, special chars, invalid values
- ✅ **Regression**: All 879 existing tests pass

### Quality Standards

- ✅ **Spec Compliance**: 100% aligned with official JSON Schema
- ✅ **Code Quality**: Clear comments, maintainable validation logic
- ✅ **Error UX**: Helpful messages guide users to correct format
- ✅ **Performance**: No degradation in API response times

---

## Risk Mitigation

### Risk 1: Breaking Changes

**Risk:** Users with invalid configs see errors after upgrade

**Mitigation:**
- Return warnings (not hard errors) for validation
- Include helpful error messages with docs links
- Keep invalid hooks in response but mark as "invalid"
- Provide migration guide in release notes

### Risk 2: Test Fixture Updates

**Risk:** Changing fixtures breaks existing tests

**Mitigation:**
- Update fixtures AND test expectations together
- Run full test suite after each fixture change
- Review test failures to ensure expected behavior
- Maintain separate "malformed" fixture for error testing

### Risk 3: Performance Impact

**Risk:** Additional validation slows down API

**Mitigation:**
- Validation is O(n) where n = number of hooks (typically small)
- Deduplication uses Set (O(n) average case)
- Profile API response times before/after
- Optimize if degradation > 10ms

### Risk 4: Missed Edge Cases

**Risk:** Real-world hooks break validation

**Mitigation:**
- Test with actual projects: `/home/claude/manager/`, `/home/claude/sample/`
- Review community examples for uncommon patterns
- Add comprehensive edge case tests
- Beta test with stakeholder before release

---

## Release Plan

### Version: v2.0.1 (Patch Release)

**Type:** Patch (bug fixes + validation improvements)

**Scope:**
- Bug fix: Proper hooks display
- Enhancement: Spec validation
- No breaking changes (warnings only)

### Release Checklist

- [ ] All implementation complete
- [ ] All tests passing (879 tests)
- [ ] Manual testing complete
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped to 2.0.1
- [ ] Git commit created
- [ ] PR created for review
- [ ] Code review passed
- [ ] Merge to main branch
- [ ] NPM package published
- [ ] Release notes published

### Migration Guide for Users

**If you have invalid hook configurations:**

1. **Review validation warnings** in API responses
2. **Update event names** to valid Claude Code events (see list in BUG-038 ticket)
3. **Update format** to match JSON Schema:
   ```json
   {
     "hooks": {
       "Stop": [
         {
           "hooks": [
             {"type": "command", "command": "your-command-here"}
           ]
         }
       ]
     }
   }
   ```
4. **Test configuration** by querying hooks API endpoint
5. **Reference docs** at https://docs.claude.com/en/docs/claude-code/hooks

---

## Related Resources

### Documentation

- **BUG-038 Ticket:** `/home/tickets/claude/manager/bugs/todo/BUG-038-hooks-display-parsing-incorrect.md`
- **Validation Report:** `/home/claude/manager/docs/validation/BUG-038-SPECIFICATION-VALIDATION-REPORT.md`
- **Official Hooks Docs:** https://docs.claude.com/en/docs/claude-code/hooks
- **JSON Schema:** https://json.schemastore.org/claude-code-settings.json

### Code References

- **Main Parser:** `src/backend/services/projectDiscovery.js` (lines 213-316)
- **Hook Parser:** `src/backend/parsers/hookParser.js` (lines 36-64)
- **Sample Project:** `/home/claude/sample/.claude/settings.json` (now spec-compliant)
- **Production Example:** `/home/claude/manager/.claude/settings.json`

### Testing

- **Unit Tests:** `tests/backend/parsers/hookParser.test.js` (to be created)
- **Integration Tests:** `tests/backend/endpoints/project-hooks.test.js` (to be updated)
- **Fixtures:** `tests/fixtures/projects/*/` (to be updated)

---

**Implementation Plan Status:** ✅ Complete and Ready
**Ticket Status:** Ready for Assignment
**Next Action:** Assign to backend-engineer and begin implementation

---

*This implementation plan is comprehensive and self-contained. A developer can follow this document from start to finish to complete BUG-038 with full spec compliance.*
