---
id: BUG-011
title: Agent parser skips agents with invalid YAML frontmatter
severity: high
category: parser/robustness
status: completed
created: 2025-10-21
---

## Problem Statement
The agent parser is skipping agent definition files where the YAML frontmatter is invalid. Instead of skipping, the parser should do its best to extract valid data from malformed YAML, improving robustness and recovering as much agent data as possible.

## Acceptance Criteria
- [ ] Parser attempts to recover from invalid YAML
- [ ] Valid agent data is extracted even from malformed YAML
- [ ] Invalid agents don't crash the parser
- [ ] Warning issued for each malformed YAML
- [ ] Parser continues processing remaining agents
- [ ] No agents lost due to YAML errors
- [ ] Backend test added for YAML error handling
- [ ] No console errors or warnings

## Technical Details
**Backend:** src/backend/parsers/agents-parser.js
**Files to Check:**
- `src/backend/parsers/agents-parser.js`
- Look for YAML parsing logic
- Error handling for malformed YAML

**Current Behavior:** Agents with invalid YAML are skipped entirely
**Expected Behavior:** Parser extracts valid data, issues warning, continues

## Implementation Strategy
1. Catch YAML parse errors
2. Attempt to extract fields manually
3. Return partial data with warning
4. Log warning to warnings array
5. Continue processing other agents

**Example Improvements:**
- Unquoted strings in YAML
- Missing colons
- Improper indentation
- Special characters

## Testing Requirements
**Test File:** `tests/backend/agents-parser-yaml-recovery.test.js`
**Test Cases:**
1. Agent with invalid YAML is not skipped
2. Valid fields extracted from malformed YAML
3. Warning issued for malformed YAML
4. Parser continues processing after error
5. Multiple agents with mixed valid/invalid YAML
6. Agent without frontmatter handled
7. Completely invalid YAML handled gracefully

## Deployment Notes
Improves data recovery and user experience. May require parser logic update.
