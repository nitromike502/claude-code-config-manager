---
id: BUG-023
title: Hooks not showing the command field
status: completed
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-22
updated_at: 2025-10-22
---

## Description
Hook configurations in the sidebar detail view are not displaying the `command` field, which specifies the shell command that the hook executes.

## Current Behavior
- Hook cards show only basic information (name, description)
- The `command` field is parsed from settings.json but not displayed to user
- Users cannot see what command a hook will execute

## Expected Behavior
- Hook detail view should display the command field prominently
- Command should be shown in a code block or similar format for readability
- Users should be able to copy the command or view it clearly

## Affected Component(s)
- HookCard.vue
- DetailSidebar.vue (when showing hook details)

## Data Source
- Hook configuration: `command` field from `.claude/settings.json`
- Example: `"command": "npm test"`

## Steps to Reproduce
1. Navigate to any project detail page or user global config
2. Scroll to hooks section
3. Click on a hook card
4. Open the sidebar to view full details
5. Observe that the command field is not displayed

## Acceptance Criteria
- [ ] Hook detail sidebar displays command field
- [ ] Command is shown in a readable format (code block or monospace)
- [ ] Command field is clearly labeled
- [ ] Handles missing command gracefully
