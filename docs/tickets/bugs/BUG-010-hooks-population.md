---
id: BUG-010
title: Hooks not fully populating in sidebar
severity: high
category: data/parser
status: completed
created: 2025-10-21
---

## Problem Statement
Hooks are not fully populating in the sidebar detail view, or the parser is not working correctly. This could be either a parsing issue on the backend or a display issue on the frontend.

## Acceptance Criteria
- [ ] All hooks populate correctly in sidebar
- [ ] Hook data is complete and accurate
- [ ] Hook names display correctly
- [ ] Hook content/details display correctly
- [ ] No hooks are skipped or missing
- [ ] Console shows no errors related to hooks
- [ ] Visual test confirms all hooks display
- [ ] Backend API returns complete hook data

## Technical Details
**Backend:** src/backend/parsers/hooks-parser.js
**Frontend:** src/components/DetailSidebar.vue, HookCard.vue
**Files to Check:**
- `src/backend/parsers/hooks-parser.js`
- `src/components/DetailSidebar.vue`
- `src/components/cards/HookCard.vue`
- `src/api/client.js` (for API calls)

**Data Source:** `.claude/settings.json` (hooks configuration)

**Current Behavior:** Hooks partially display or missing from sidebar
**Expected Behavior:** All hooks display completely in sidebar

## Investigation Steps
1. Check backend API endpoint `/api/projects/:id/hooks`
2. Verify parser reads all hooks from settings.json
3. Check frontend API call is receiving complete data
4. Verify sidebar iteration through hooks array
5. Check for any filtering or limiting logic

## Testing Requirements
**Test File:** `tests/frontend/04-hooks-population.spec.js`
**Test Cases:**
1. All hooks display in hooks card
2. Hook count matches expected count
3. Hook names display correctly
4. Hook content accessible in sidebar
5. Multiple hooks display without truncation
6. Empty hooks handled gracefully
7. Invalid hook data doesn't break display

## Deployment Notes
May require backend parser fix, frontend display fix, or both.
