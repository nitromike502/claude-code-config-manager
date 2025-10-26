---
id: BUG-025
title: Hooks not showing the type field
status: completed
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-22
updated_at: 2025-10-22
---

## Description
Hook configurations in the sidebar detail view are not displaying the `type` field, which specifies when the hook runs relative to an event (e.g., pre, post).

## Current Behavior
- Hook cards show only basic information (name, description)
- The `type` field is parsed from settings.json but not displayed to user
- Users cannot see whether a hook runs before or after an event

## Expected Behavior
- Hook detail view should display the type field prominently
- Type should clearly indicate the hook timing (pre/post/etc.)
- Format should be clear and readable

## Affected Component(s)
- HookCard.vue
- DetailSidebar.vue (when showing hook details)

## Data Source
- Hook configuration: `type` field from `.claude/settings.json`
- Example: `"type": "pre-commit"` or `"type": "post-push"`

## Steps to Reproduce
1. Navigate to any project detail page or user global config
2. Scroll to hooks section
3. Click on a hook card
4. Open the sidebar to view full details
5. Observe that the type field is not displayed

## Acceptance Criteria
- [ ] Hook detail sidebar displays type field
- [ ] Type is shown in a readable format
- [ ] Type field is clearly labeled
- [ ] Handles missing type gracefully
