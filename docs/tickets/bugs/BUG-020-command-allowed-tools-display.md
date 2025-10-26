---
id: BUG-020
title: Slash command configurations not showing allowed tools
status: completed
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-22
updated_at: 2025-10-22
---

## Description
Slash command configuration cards and sidebar detail view are not displaying the `allowed_tools` field from the command YAML frontmatter.

## Current Behavior
- Command configurations show only basic information (name, description)
- The `allowed_tools` list is parsed from YAML but not displayed to user
- Users cannot see which tools a command is allowed to use

## Expected Behavior
- Command cards should display allowed tools (or indicate if none are set)
- Sidebar detail view should show complete allowed_tools list
- Format should be clear and readable (list or badge-based)

## Affected Component(s)
- CommandCard.vue
- DetailSidebar.vue (when showing command details)

## Data Source
- Command YAML frontmatter: `allowed_tools` field
- Example: `allowed_tools: [tool1, tool2, tool3]`

## Steps to Reproduce
1. Navigate to any project detail page
2. Scroll to commands section
3. Click on a command card that has allowed_tools defined
4. Open the sidebar to view full details
5. Observe that allowed_tools is not displayed

## Acceptance Criteria
- [ ] Command cards display allowed_tools in card body or footer
- [ ] Sidebar detail view shows complete allowed_tools list
- [ ] Empty allowed_tools shows appropriate placeholder
- [ ] Handles commands with no allowed_tools gracefully
