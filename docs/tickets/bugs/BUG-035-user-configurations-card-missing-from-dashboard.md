---
id: BUG-035
title: User Configurations card missing from dashboard
status: completed
priority: critical
category: UI Display / Dashboard
assigned_to: null
created_at: 2025-10-24
updated_at: 2025-10-24
---

## Description

The "User Configurations" card is not displaying on the dashboard homepage. This card should appear at the top of the project list to show user-level agents, commands, hooks, and MCP servers stored in `~/.claude/`.

## Current Behavior

- Dashboard loads with projects list
- User Configurations card is completely missing
- Cannot navigate to user-level configurations
- The "View" button to access user configs is not visible

## Expected Behavior

- User Configurations card appears as the first item on the dashboard
- Card shows:
  - Title: "User Configurations"
  - Path: `~/.claude`
  - Count of user-level agents, commands, hooks, and MCP servers
  - "View" button to navigate to `/user` route
- Card has visual indicator (e.g., purple accent like other config types)

## Affected Components

- Frontend: `src/components/Dashboard.vue`
- Route: `/user` should be accessible

## Root Cause

Unknown - needs investigation. Possibilities:
1. Dashboard component not rendering user config card
2. CSS hiding the card
3. API not returning user config data
4. Router not set up for user route

## Acceptance Criteria

- [ ] User Configurations card visible on dashboard
- [ ] Card displays correct metadata (path, counts)
- [ ] "View" button navigates to user configs page
- [ ] User page loads and displays agents/commands/hooks/MCP
- [ ] Card styling consistent with project cards

## Test Steps

1. Navigate to dashboard (home page)
2. Verify "User Configurations" card appears at top
3. Verify card shows `~/.claude` path
4. Verify counts display (e.g., "5 Agents", "1 Commands")
5. Click "View" button
6. Verify navigation to `/user` route
7. Verify all user configs display correctly

## Severity

**CRITICAL** - User-level configurations are completely inaccessible with this bug. Users cannot view or manage their global config without this card.

## Notes

- This bug was discovered during BUG-028 testing
- Appears to be a recent regression or missing implementation
- Affects usability of entire user config management feature
