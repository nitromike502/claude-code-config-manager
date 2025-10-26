---
id: BUG-021
title: Slash command configurations not showing configured color
status: completed
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-22
updated_at: 2025-10-22
---

## Description
Slash command configuration cards are not displaying the `color` field from the command YAML frontmatter, and the color indicator (if implemented) is not showing the command's configured color.

## Current Behavior
- Command cards show generic or default coloring
- The `color` field from YAML frontmatter is parsed but not displayed
- No visual indicator of which color the command is configured to use

## Expected Behavior
- Command cards should display or be styled with the command's configured color
- Sidebar should show the color configuration explicitly
- Color selector/indicator should be visually prominent

## Affected Component(s)
- CommandCard.vue
- DetailSidebar.vue (when showing command details)

## Data Source
- Command YAML frontmatter: `color` field
- Example: `color: orange` or similar

## Steps to Reproduce
1. Navigate to any project detail page
2. Scroll to commands section
3. Check if command cards show/use the configured color
4. Click on a command to open sidebar
5. Verify color field is displayed in detail view

## Acceptance Criteria
- [ ] Command cards visually represent the command's color (background, border, or icon)
- [ ] Sidebar detail view explicitly shows color configuration
- [ ] Color field is readable and clear
- [ ] Handles missing color configuration gracefully
