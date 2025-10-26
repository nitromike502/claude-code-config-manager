---
id: BUG-018
title: Agent configurations not showing allowed tools
status: completed
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-22
updated_at: 2025-10-22
---

## Description
Agent configuration cards and sidebar detail view are not displaying the `allowed_tools` field from the agent YAML frontmatter.

## Current Behavior
- Agent configurations show only basic information (name, description)
- The `allowed_tools` list is parsed from YAML but not displayed to user
- Users cannot see which tools an agent is allowed to use

## Expected Behavior
- Agent cards should display allowed tools (or indicate if none are set)
- Sidebar detail view should show complete allowed_tools list
- Format should be clear and readable (list or badge-based)

## Affected Component(s)
- AgentCard.vue
- DetailSidebar.vue (when showing agent details)

## Data Source
- Agent YAML frontmatter: `allowed_tools` field
- Example: `allowed_tools: [tool1, tool2, tool3]`

## Steps to Reproduce
1. Navigate to any project detail page
2. Scroll to agents section
3. Click on an agent card that has allowed_tools defined
4. Open the sidebar to view full details
5. Observe that allowed_tools is not displayed

## Acceptance Criteria
- [ ] Agent cards display allowed_tools in card body or footer
- [ ] Sidebar detail view shows complete allowed_tools list
- [ ] Empty allowed_tools shows appropriate placeholder
- [ ] Handles agents with no allowed_tools gracefully
