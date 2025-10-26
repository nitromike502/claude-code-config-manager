---
id: BUG-029
title: Agent details sidebar missing allowed tools from YAML
status: completed
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-23
updated_at: 2025-10-23
---

## Description
Agent configuration sidebar detail view is not displaying the `allowed_tools` (or `tools`) field from agent YAML frontmatter, even though the field is parsed and available.

## Current Behavior
- Agent sidebar shows name and description
- The `tools` field is parsed from YAML but not displayed in sidebar
- Users cannot see which tools the agent is allowed to use

## Expected Behavior
- Agent detail sidebar should display allowed tools field
- Tools field should show list of allowed tools in readable format
- Should handle missing tools gracefully (show "None specified" or empty state)

## Affected Component(s)
- ProjectDetail.vue (agent sidebar metadata section)
- UserGlobal.vue (agent sidebar metadata section)

## Data Source
- Agent YAML frontmatter: `tools` field (note: field name is `tools`, not `allowed_tools`)
- Example: `tools: Read, Write, Edit, Bash, Glob, Grep`
- Can be comma-separated string or YAML array

## Steps to Reproduce
1. Navigate to any project detail page or user global config
2. Scroll to agents section
3. Click on an agent card to open sidebar
4. Observe that allowed tools field is NOT displayed in metadata section
5. Verify the agent YAML has a tools field

## Acceptance Criteria
- [ ] Agent sidebar detail view displays allowed tools field
- [ ] Tools field is clearly labeled as "Allowed Tools"
- [ ] Tools are shown as comma-separated list or badge format
- [ ] Handles missing tools gracefully (shows "None specified")
- [ ] Works in both ProjectDetail.vue and UserGlobal.vue
- [ ] NOTE: Frontend code currently references this as `tools`, not `allowed_tools`
