---
id: BUG-017
title: Sidebar scroll should not scroll main page
status: completed
priority: medium
category: UI/UX
assigned_to: null
created_at: 2025-10-22
updated_at: 2025-10-22
---

## Description
When the sidebar is showing/open, scrolling the mouse wheel should only scroll the content within the sidebar, not the main page background behind it.

## Current Behavior
- When sidebar is open and user scrolls, both sidebar and main page scroll
- Creates a confusing interaction where multiple elements respond to scroll events
- User loses context as page moves while viewing sidebar details

## Expected Behavior
- Scrolling should be isolated to the active sidebar
- Main page should remain stationary when sidebar is open
- Only sidebar content should respond to scroll events

## Affected Component
- DetailSidebar.vue (or similar sidebar component)

## Steps to Reproduce
1. Open any project detail page
2. Click on a configuration item to open the sidebar
3. Attempt to scroll with mouse wheel while sidebar is visible
4. Observe both sidebar and main page scrolling

## Acceptance Criteria
- [ ] Sidebar has `overflow-y: auto` or similar
- [ ] Main page has scroll disabled when sidebar is open
- [ ] Sidebar content is fully scrollable independently
- [ ] No visual jank or scroll conflicts
