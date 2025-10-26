---
id: BUG-012
title: Ensure other parsers handle invalid YAML like agent parser
severity: high
category: parser/consistency
status: completed
created: 2025-10-21
---

## Problem Statement
After fixing the agent parser to handle invalid YAML gracefully (BUG-011), all other parsers (commands, hooks, MCP) should follow the same approach for consistency.

## Acceptance Criteria
- [ ] Commands parser handles invalid YAML
- [ ] Hooks parser handles invalid YAML
- [ ] MCP parser handles invalid YAML
- [ ] All parsers attempt data recovery
- [ ] Warnings issued for malformed files
- [ ] All parsers continue processing after errors
- [ ] Consistent behavior across all parsers
- [ ] Backend tests added for all parsers
- [ ] No console errors or warnings

## Technical Details
**Backend Parsers:**
- `src/backend/parsers/commands-parser.js`
- `src/backend/parsers/hooks-parser.js`
- `src/backend/parsers/mcp-parser.js`

**Baseline:** BUG-011 agent parser implementation

**Current Behavior:** Parsers may skip files with invalid YAML
**Expected Behavior:** All parsers attempt recovery, issue warnings, continue

## Implementation Notes
- Review agent parser (BUG-011) as baseline
- Apply same YAML error handling to each parser
- Ensure consistent warning messages
- Test each parser independently

## Testing Requirements
**Test Files:**
- `tests/backend/commands-parser-yaml-recovery.test.js`
- `tests/backend/hooks-parser-yaml-recovery.test.js`
- `tests/backend/mcp-parser-yaml-recovery.test.js`

**Test Cases (for each parser):**
1. File with invalid YAML is not skipped
2. Valid fields extracted from malformed YAML
3. Warning issued for malformed YAML
4. Parser continues processing after error
5. Multiple files with mixed valid/invalid YAML
6. Completely invalid YAML handled gracefully

## Deployment Notes
Improves robustness across all parsers. Coordinates with BUG-011.
