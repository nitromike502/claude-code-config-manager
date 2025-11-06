# TASK-3.2.4: copyHook Method Implementation Summary

**Date:** 2025-11-05
**Task:** Implement `copyHook(request)` method in CopyService
**Status:** ✅ COMPLETE
**Test Coverage:** 45 new tests (100% pass rate)

---

## Implementation Overview

Implemented the `copyHook` method in `/home/claude/manager/src/backend/services/copy-service.js` to perform intelligent merging of hook configurations into settings.json files.

### Key Features

1. **3-Level Nested Structure Handling**
   - Level 1: Event (PreToolUse, PostToolUse, etc.)
   - Level 2: Matcher pattern (*.ts, *.js, etc.)
   - Level 3: Hook commands array

2. **Smart Deduplication**
   - Based on command field within same event+matcher
   - Prevents duplicate hooks from being added
   - Preserves existing hooks unchanged

3. **Atomic Write Safety**
   - Uses temp file + rename pattern
   - Validates JSON before committing
   - Cleans up temp files on error
   - Preserves existing settings on failure

4. **Comprehensive Error Handling**
   - Missing required fields (event, command)
   - Nonexistent projects
   - Malformed settings.json
   - File system errors

---

## Files Created

### Implementation
- `/home/claude/manager/src/backend/services/copy-service.js` (modified)
  - Added `copyHook(request)` method (lines 911-1030)
  - Added `isDuplicateHook(existingHooks, newHook)` helper (lines 822-828)
  - Added `mergeHookIntoSettings(settings, event, matcher, hookCommand)` helper (lines 843-884)

### Tests
- `/home/claude/manager/tests/backend/services/copy-service-copyHook.test.js` (created)
  - 24 comprehensive integration tests
  - Tests all edge cases documented in TASK-3.2.3

- `/home/claude/manager/tests/backend/services/copy-service-copyHook-helpers.test.js` (created)
  - 21 unit tests for helper methods
  - Tests isDuplicateHook and mergeHookIntoSettings

- `/home/claude/manager/tests/backend/services/manual-test-copyHook.js` (created)
  - Manual test script for demonstration purposes
  - Shows end-to-end hook merging workflow

---

## Implementation Details

### Helper Methods

#### `isDuplicateHook(existingHooks, newHook)`
```javascript
/**
 * Checks if a hook already exists in the hooks array
 * Deduplication is based on the "command" field
 */
```

**Logic:**
- Returns false if existingHooks is not an array or is empty
- Uses `Array.some()` to check if any hook.command matches newHook.command
- Case-sensitive comparison (matches Claude Code behavior)

**Test Coverage:** 6 tests

---

#### `mergeHookIntoSettings(settings, event, matcher, hookCommand)`
```javascript
/**
 * Performs 3-level merge of hook into settings object
 *
 * Level 1: Find or create event in settings.hooks
 * Level 2: Find or create matcher entry in event array
 * Level 3: Add hook command to matcher's hooks array (if not duplicate)
 */
```

**Logic:**
1. **Level 0:** Ensure `settings.hooks` object exists
2. **Level 1:** Find or create event array (e.g., PreToolUse)
3. **Level 2:** Find matcher entry or create new one
   - Treats undefined and "*" as equivalent
   - Omits matcher field when value is "*"
4. **Level 3:** Add hook command if not duplicate
   - Uses `isDuplicateHook()` to check
   - Preserves existing hooks unchanged

**Test Coverage:** 15 tests

---

### Main Method: `copyHook(request)`

#### Request Object Structure
```javascript
{
  sourceHook: {
    event: 'PreToolUse',
    matcher: '*.ts',
    type: 'command',
    command: 'tsc --noEmit',
    enabled: true,
    timeout: 60
  },
  targetScope: 'project' | 'user',
  targetProjectId: 'homeuserprojectsmyapp' | null
}
```

#### Return Values

**Success:**
```javascript
{
  success: true,
  mergedInto: '/absolute/path/to/settings.json',
  hook: {
    event: 'PreToolUse',
    matcher: '*.ts',
    command: 'tsc --noEmit'
  }
}
```

**Error:**
```javascript
{
  success: false,
  error: 'Descriptive error message'
}
```

#### Implementation Flow

1. **Extract and Validate** (lines 914-923)
   - Extract hook details from request.sourceHook
   - Validate required fields: event, command
   - Return error if validation fails

2. **Build Target Path** (lines 925-934)
   - Use `buildTargetPath()` to get settings.json path
   - Supports both project and user scope

3. **Read Existing Settings** (lines 936-947)
   - Read existing settings.json if it exists
   - Handle ENOENT (file doesn't exist) gracefully
   - Return error for read failures

4. **Validate Settings Structure** (lines 949-952)
   - Ensure settings is a valid JSON object
   - Return error for malformed JSON

5. **Perform 3-Level Merge** (lines 954-967)
   - Build hookCommand object with defaults
   - Call `mergeHookIntoSettings()` helper
   - Apply deduplication automatically

6. **Ensure Directory Exists** (lines 969-975)
   - Create parent directory if needed
   - Return error if mkdir fails

7. **Atomic Write** (lines 977-983)
   - Write to temp file (settings.json.tmp)
   - Return error if write fails

8. **Validate JSON** (lines 985-997)
   - Read temp file and parse as JSON
   - Clean up temp file on validation failure
   - Return error if JSON is invalid

9. **Atomic Rename** (lines 999-1010)
   - Rename temp file to final path
   - Clean up temp file on rename failure
   - Return error if rename fails

10. **Return Success** (lines 1012-1021)
    - Return success with merged file path
    - Include hook details for confirmation

---

## Edge Cases Handled

All edge cases from TASK-3.2.3 documentation are covered:

### ✅ Handled Edge Cases

1. **Target settings.json doesn't exist**
   - Creates new file with proper structure
   - Test: "merges hook into empty settings.json (creates new file)"

2. **Target has no "hooks" key**
   - Adds "hooks" object with new event
   - Test: "merges hook into existing settings.json with no hooks"

3. **Target has event but different matcher**
   - Appends new matcher entry to event array
   - Test: "Level 2: Adds new matcher to existing event"

4. **Target has same event+matcher but different command**
   - Appends new hook to matcher's hooks array
   - Test: "Level 3: Adds new hook command to existing event+matcher"

5. **Target has exact duplicate (event+matcher+command)**
   - Skips (deduplication)
   - Test: "skips duplicate hook (same event+matcher+command)"

6. **Source event doesn't support matchers**
   - Uses default matcher "*" and omits field
   - Test: "omits matcher field when value is '*'"

7. **Malformed target settings.json**
   - Returns error with descriptive message
   - Test: "handles malformed settings.json gracefully"

8. **Preserving other settings (mcpServers, etc.)**
   - Only modifies "hooks" key
   - Test: "preserves mcpServers configuration"

### Additional Edge Cases

9. **Missing required fields**
   - Tests for missing event and command
   - Returns descriptive error messages

10. **Project not found**
    - Validates project existence via projectDiscovery
    - Returns error if project doesn't exist

11. **Temp file cleanup on error**
    - Ensures temp files are cleaned up
    - Test: "cleans up temp file on JSON validation failure"

12. **Settings preservation on error**
    - Original file unchanged if operation fails
    - Test: "preserves existing settings on error"

---

## Test Results

### Test Suites
- `copy-service-copyHook.test.js`: 24 tests ✅
- `copy-service-copyHook-helpers.test.js`: 21 tests ✅
- **Total:** 45 new tests (100% pass rate)

### Test Coverage Breakdown

#### Basic Hook Merging (3 tests)
- Empty settings.json (new file creation)
- Existing settings.json with no hooks
- User scope (~/.claude/settings.json)

#### 3-Level Merge Algorithm (3 tests)
- Level 1: New event addition
- Level 2: New matcher addition
- Level 3: New hook command addition

#### Deduplication (3 tests)
- Skip duplicate hook
- Allow same command in different event
- Allow same command in different matcher

#### Matcher Handling (3 tests)
- Treat undefined as "*"
- Omit matcher field when "*"
- Include matcher field when not "*"

#### Default Values (4 tests)
- Default enabled=true
- Default timeout=60
- Default type="command"
- Preserve explicit enabled=false

#### Error Handling (5 tests)
- Missing event
- Missing command
- Project not found
- Malformed settings.json
- Temp file cleanup

#### Atomic Write Safety (2 tests)
- Temp file + rename pattern
- Preserve settings on error

#### Complex Real-World Scenarios (1 test)
- Multiple hooks from different sources

#### Helper Methods (21 tests)
- isDuplicateHook: 6 tests
- mergeHookIntoSettings: 15 tests

---

## Design Decisions

### 1. Singleton Pattern
The CopyService uses the singleton pattern (line 1034):
```javascript
module.exports = new CopyService();
```

**Rationale:**
- Ensures consistent state across all callers
- Simplifies dependency injection for tests
- Aligns with other services in the project

### 2. Atomic Write Pattern
Uses temp file + rename for atomic writes (lines 977-1010).

**Rationale:**
- Prevents corruption if process crashes mid-write
- Ensures settings.json is always in valid state
- Standard pattern for safe file updates

### 3. Defense-in-Depth Validation
Multiple validation layers (input, business logic, file system).

**Rationale:**
- Input validation: Reject invalid requests early
- Business logic: Apply deduplication rules
- File system: Validate JSON after write

### 4. Deduplication Key: Command Only
Deduplication based solely on "command" field, not type/enabled/timeout.

**Rationale:**
- Matches Claude Code behavior
- Two hooks with same command but different timeouts are duplicates
- Prevents accidental duplication from parameter variations

### 5. Matcher "*" Omission
Omits matcher field when value is "*" (lines 870-873).

**Rationale:**
- Cleaner JSON output
- Matches Claude Code convention
- Treats undefined and "*" as equivalent

### 6. No Conflict Strategy Parameter
Unlike copyAgent/copyCommand, copyHook doesn't support conflict strategies.

**Rationale:**
- Hooks are always merged, never replaced
- No concept of "overwrite" or "skip" for merged data
- Deduplication handles conflicts automatically

---

## Performance Considerations

### Promise.all() Usage
Not applicable for copyHook (single file operation).

### Caching
No caching implemented - each call reads/writes settings.json.

**Rationale:**
- Settings.json is small (typically < 100KB)
- Hooks are added infrequently
- Risk of stale cache outweighs performance benefit

### Async Operations
All file operations use async/await (lines 936-1010).

**Rationale:**
- Non-blocking I/O for Node.js event loop
- Allows concurrent operations on different files
- Standard pattern for file system operations

---

## Security Considerations

### Path Traversal Prevention
Reuses `buildTargetPath()` which includes security checks.

**Rationale:**
- Centralized security validation
- Prevents path escaping base directory
- Already tested in copy-service-buildTargetPath.test.js

### Input Sanitization
Validates all user inputs before processing (lines 916-923).

**Rationale:**
- Reject invalid requests early
- Prevent malformed data from corrupting files
- Return descriptive errors to caller

### Atomic Writes
Prevents partial file corruption (lines 977-1010).

**Rationale:**
- Settings.json must always be valid JSON
- Process crash shouldn't corrupt file
- Temp file cleanup ensures no orphaned files

---

## Integration Points

### Dependencies
- `fs.promises`: File system operations
- `path`: Path manipulation
- `os.homedir()`: User directory resolution
- `discoverProjects()`: Project validation

### Callers (Future)
- Copy API endpoint: `POST /api/copy/hook`
- Frontend: Hook copy dialog
- CLI: Hook copy command

### Related Methods
- `copyAgent()`: Similar pattern for agents
- `copyCommand()`: Similar pattern for commands
- `buildTargetPath()`: Shared path resolution
- `mergeHookIntoSettings()`: Core merge logic

---

## Known Limitations

### 1. No Conflict Reporting
Unlike copyAgent/copyCommand, copyHook doesn't report when hooks are deduplicated.

**Impact:** Low - Deduplication is expected behavior
**Workaround:** None needed - silent deduplication is correct

### 2. No Backup Before Merge
Settings.json is modified in-place (with atomic write safety).

**Impact:** Low - Atomic writes prevent corruption
**Workaround:** Users should use version control

### 3. No Hook Validation
Hook commands are not validated for correctness.

**Impact:** Low - Claude Code will validate at runtime
**Workaround:** None needed - fail-fast is acceptable

---

## Future Enhancements

### 1. Backup Before Merge
Create `.settings.json.backup` before modifying.

**Benefit:** Allow users to rollback changes
**Effort:** Low (30 minutes)
**Priority:** Low

### 2. Hook Command Validation
Validate that hook commands are executable.

**Benefit:** Catch errors at copy time vs. runtime
**Effort:** Medium (2 hours)
**Priority:** Low

### 3. Deduplication Reporting
Return list of skipped hooks in success response.

**Benefit:** Inform user of deduplication decisions
**Effort:** Low (30 minutes)
**Priority:** Low

### 4. Merge Preview
Allow "dry run" mode to preview merge without writing.

**Benefit:** Let users review changes before committing
**Effort:** Low (1 hour)
**Priority:** Medium

---

## Verification Steps

### Manual Testing
1. ✅ Create empty settings.json
2. ✅ Merge first hook
3. ✅ Merge second hook to same event+matcher
4. ✅ Merge hook with different matcher
5. ✅ Merge hook with different event
6. ✅ Try to merge duplicate (should skip)
7. ✅ Verify mcpServers preserved

### Automated Testing
1. ✅ Run all 45 new tests
2. ✅ Run all 392 backend tests
3. ✅ Verify 100% pass rate

### Edge Case Testing
1. ✅ Missing required fields
2. ✅ Nonexistent project
3. ✅ Malformed settings.json
4. ✅ Temp file cleanup
5. ✅ Settings preservation on error

---

## Conclusion

The `copyHook` method is fully implemented and tested. It handles the complex 3-level nested hook structure correctly, applies intelligent deduplication, and uses atomic writes for safety. All 45 tests pass, and the implementation is ready for integration with the Copy API endpoint (TASK-3.3).

**Next Steps:**
- TASK-3.3: Implement Copy API endpoint that calls copyHook()
- TASK-3.4: Add frontend UI for hook copying
- TASK-3.5: Integration testing with real Claude Code projects

---

## References

- **TASK-3.2.3:** Hook structure verification (lines 19-303 in copy-service.js)
- **Claude Code Spec:** Hook structure documentation
- **Project Discovery:** lines 208-579 in projectDiscovery.js (hook parsing)
- **Test Fixtures:** /home/claude/manager/tests/fixtures/samples/settings/

---

**Implementation Completed:** 2025-11-05
**Total Time:** ~90 minutes (as estimated in TASK-3.2.3)
**Test Coverage:** 100% (45/45 tests passing)
