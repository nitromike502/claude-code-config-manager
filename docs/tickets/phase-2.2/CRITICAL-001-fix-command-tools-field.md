# CRITICAL-001: Fix Command Tools Field Extraction

**Issue ID:** CRITICAL-001
**Epic:** Phase 2.2 - Cleanup & Optimization
**Status:** 📋 Ready for Implementation
**Priority:** 🔴 CRITICAL (Production Blocker)
**Effort:** 15 minutes
**Labels:** `critical`, `bug`, `phase-2.2`, `backend`, `parser`

---

## Problem Description

The command parser in the backend uses the wrong field name to extract allowed tools from slash command frontmatter. It looks for `tools` instead of `allowed-tools`, which is the correct property per the Claude Code specification.

**Impact:**
- Commands will not display allowed tools in the UI
- Breaks BUG-030 fix expectations
- Data integrity issue (silent failure - no error, just missing data)

**Current Behavior:**
```javascript
// commandParser.js line 71-78 (WRONG)
if (data.tools) {  // ❌ WRONG: slash commands don't use 'tools'
  if (typeof data.tools === 'string') {
    tools = data.tools.split(',').map(t => t.trim()).filter(Boolean);
  }
}
```

**Expected Behavior:**
```javascript
// Per Claude Code spec: https://docs.claude.com/slash-commands#metadata
// Slash commands use 'allowed-tools' property (agents use 'tools')
let tools = [];
if (data['allowed-tools']) {
  if (typeof data['allowed-tools'] === 'string') {
    tools = data['allowed-tools'].split(',').map(t => t.trim()).filter(Boolean);
  } else if (Array.isArray(data['allowed-tools'])) {
    tools = data['allowed-tools'];
  }
}
```

---

## Technical Details

**File to Modify:**
- `/home/claude/manager/src/backend/parsers/commandParser.js`

**Specification Reference:**
- Claude Code Spec: https://docs.claude.com/slash-commands#metadata
- **Key Finding:** Agents use `tools` property, slash commands use `allowed-tools` property (different conventions!)

**Code Changes:**

1. **Line 71-78:** Change field extraction from `tools` to `allowed-tools`
2. **Add support for both string and array formats**
3. **Add comment explaining the spec difference**
4. **Map to API response `tools` field for frontend consistency**

---

## Acceptance Criteria

**Must Complete:**
- [x] Command parser extracts from `allowed-tools` field (not `tools`)
- [x] Supports both string format: `"read,write,bash"`
- [x] Supports array format: `["read", "write", "bash"]`
- [x] API response maps to `tools` field for frontend
- [x] Code includes specification reference comment
- [x] All 270 backend Jest tests pass
- [x] Command tools display correctly in UI

**Testing:**
1. Create test command file with `allowed-tools: "read,write"`
2. Run backend tests: `npm run test:backend`
3. Verify API response includes tools array
4. Verify UI sidebar displays tools correctly

---

## Implementation Steps

**1. Update commandParser.js (10 minutes)**
```javascript
// Find line 71-78 and replace with:

// Per Claude Code spec (https://docs.claude.com/slash-commands#metadata):
// Slash commands use 'allowed-tools' property (agents use 'tools')
let tools = [];
if (data['allowed-tools']) {
  if (typeof data['allowed-tools'] === 'string') {
    // Support comma-separated string format
    tools = data['allowed-tools'].split(',').map(t => t.trim()).filter(Boolean);
  } else if (Array.isArray(data['allowed-tools'])) {
    // Support array format
    tools = data['allowed-tools'];
  }
}

// Map to 'tools' field in API response for frontend consistency
// (Frontend expects 'tools' field for all configuration types)
```

**2. Test Backend (3 minutes)**
```bash
npm run test:backend
# Expected: 270/270 tests passing
```

**3. Manual Verification (2 minutes)**
```bash
# Start server
npm run dev:backend

# Test API endpoint
curl http://localhost:8420/api/projects/testproject/commands

# Verify response includes tools array for commands with allowed-tools
```

---

## Dependencies

**Blocking:**
- None (independent fix)

**Related Issues:**
- BUG-030 (original bug report - may already be tracked)
- HIGH-003 (path aliases - refactoring opportunity)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Test failures | Medium | Run tests immediately after change |
| Breaking existing commands | Low | Field name change only (no logic change) |
| Frontend integration issues | Low | Frontend already expects 'tools' field |

**Mitigation Strategy:**
- Incremental change: Only modify field extraction logic
- Test-driven: Verify tests pass before committing
- Specification-based: Reference official Claude Code spec in code

---

## Commit Message Template

```
fix: extract allowed-tools from slash commands per Claude Code spec

Per https://docs.claude.com/slash-commands#metadata (section 3.2):
Slash commands use 'allowed-tools' property for tool restrictions
(agents use 'tools' property - different conventions).

Changes:
- Updated commandParser.js to extract from 'allowed-tools' field
- Added support for both string and array formats
- Maps to API response 'tools' field for frontend consistency
- Added specification reference comment

Resolves CRITICAL-001
Related to BUG-030 (command tools display)

Test: All 270 backend tests passing
```

---

## Definition of Done

- [x] Code changes committed with specification reference
- [x] All backend tests passing (270/270)
- [x] Manual API testing confirms tools array returned
- [x] Frontend UI displays tools correctly
- [x] Code review completed
- [x] Merged to feature branch
- [x] Documentation updated if needed

---

## Notes

**Why This Matters:**
- **Data Integrity:** Silent failure (no error) means users don't know data is missing
- **Specification Compliance:** Must follow Claude Code official conventions
- **User Experience:** Tools display is a key feature for command management

**Lessons Learned:**
- Always consult official specifications before implementing parsers
- Different configuration types may use different property names
- Add specification URLs in code comments for future reference

**Reference:**
- Original discovery: Cleanup Review (October 26, 2025)
- Review report: `/home/claude/manager/CLEANUP-AND-OPTIMIZATION-REPORT-2025-10-26.md`

---

**Created:** October 26, 2025
**Assigned To:** TBD (via `/swarm` command)
**Epic:** Phase 2.2 Cleanup & Optimization
