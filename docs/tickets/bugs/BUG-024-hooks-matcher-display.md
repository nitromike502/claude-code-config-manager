---
id: BUG-024
title: Hooks not showing the matcher field
status: completed
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-22
updated_at: 2025-10-22
---

## Description
Hook configurations in the sidebar detail view are not displaying the `matcher` field, which specifies the event pattern that triggers the hook.

## Current Behavior
- Hook cards show only basic information (name, description)
- The `matcher` field is parsed from settings.json but not displayed to user
- Users cannot see what event pattern triggers a hook

## Expected Behavior
- Hook detail view should display the matcher field prominently
- Matcher should show the event pattern or regex that triggers the hook
- Format should be clear and readable

## Affected Component(s)
- HookCard.vue
- DetailSidebar.vue (when showing hook details)

## Data Source
- Hook configuration: `matcher` field from `.claude/settings.json`
- Example: `"matcher": "git-push"` or regex pattern

## Steps to Reproduce
1. Navigate to any project detail page or user global config
2. Scroll to hooks section
3. Click on a hook card
4. Open the sidebar to view full details
5. Observe that the matcher field is not displayed

## Acceptance Criteria
- [ ] Hook detail sidebar displays matcher field
- [ ] Matcher is shown in a readable format
- [ ] Matcher field is clearly labeled
- [ ] Handles missing matcher gracefully
