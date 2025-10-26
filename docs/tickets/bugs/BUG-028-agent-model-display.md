---
id: BUG-028
title: Agent details sidebar missing model from YAML
status: completed
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-23
updated_at: 2025-10-23
---

## Description
Agent configuration sidebar detail view is not displaying the `model` field from agent YAML frontmatter, even though the field is parsed and available.

## Current Behavior
- Agent sidebar shows name, description, and allowed tools
- The `model` field is parsed from YAML but not displayed
- Users cannot see what model the agent is configured to use

## Expected Behavior
- Agent detail sidebar should display the model field
- Model field should be clearly labeled and readable
- Should handle missing/default model gracefully

## Affected Component(s)
- ProjectDetail.vue (agent sidebar metadata section)
- UserGlobal.vue (agent sidebar metadata section)

## Data Source
- Agent YAML frontmatter: `model` field
- Example: `model: sonnet`, `model: opus`, `model: haiku`
- Default value: `inherit` (if not specified)

## Steps to Reproduce
1. Navigate to any project detail page or user global config
2. Scroll to agents section
3. Click on an agent card to open sidebar
4. Observe that model field is NOT displayed in metadata section
5. Verify the agent YAML has a model field

## Acceptance Criteria
- [ ] Agent sidebar detail view displays model field
- [ ] Model field is clearly labeled
- [ ] Model value is shown in readable format
- [ ] Handles missing/default model gracefully (shows "inherit" or nothing if not set)
- [ ] Works in both ProjectDetail.vue and UserGlobal.vue
