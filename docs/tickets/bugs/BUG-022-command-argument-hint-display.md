---
id: BUG-022
title: Slash command configurations not showing argument hint
status: completed
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-22
updated_at: 2025-10-22
---

## Description
Slash command configuration cards and sidebar detail view are not displaying the `argument_hint` field from the command YAML frontmatter.

## Current Behavior
- Command configurations show only basic information (name, description)
- The `argument_hint` field is parsed from YAML but not displayed to user
- Users cannot see what arguments or parameters a command expects

## Expected Behavior
- Command cards should display argument hint (or indicate if not required)
- Sidebar detail view should show complete argument_hint information
- Format should be clear and helpful to users

## Affected Component(s)
- CommandCard.vue
- DetailSidebar.vue (when showing command details)

## Data Source
- Command YAML frontmatter: `argument_hint` field
- Example: `argument_hint: "[instructions] - Optional context for command"`

## Steps to Reproduce
1. Navigate to any project detail page
2. Scroll to commands section
3. Click on a command card that has argument_hint defined
4. Open the sidebar to view full details
5. Observe that argument_hint is not displayed

## Acceptance Criteria
- [ ] Command cards display argument_hint in card body or footer
- [ ] Sidebar detail view shows complete argument_hint information
- [ ] Empty argument_hint shows appropriate placeholder
- [ ] Handles commands with no argument_hint gracefully
