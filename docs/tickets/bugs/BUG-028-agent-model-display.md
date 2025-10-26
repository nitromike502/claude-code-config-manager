---
id: BUG-028
title: Agent details sidebar missing model from YAML
status: resolved
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-23
updated_at: 2025-10-24
resolved_at: 2025-10-24
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
- [x] Agent sidebar detail view displays model field
- [x] Model field is clearly labeled
- [x] Model value is shown in readable format
- [x] Handles missing/default model gracefully (shows "inherit" or nothing if not set)
- [x] Works in both ProjectDetail.vue and UserGlobal.vue

## Resolution
**Fixed in commit `253461c`**

### Changes Made
1. **ProjectDetail.vue (line 272):** Added model field display to agent metadata section
2. **UserGlobal.vue (line 255):** Added model field display to agent metadata section
3. Both components display model value or "inherit" as fallback

### Tests Added
- [Test 04.004.003] Agent model displays in ProjectDetail sidebar [BUG-028]
- [Test 04.004.004] Agent model displays in UserGlobal sidebar [BUG-028]
- All tests passing (17/17 in file 04-component-rendering.spec.js)

### Verification
- ✅ Manual testing on Vite dev server (port 5173)
- ✅ Playwright E2E tests passing
- ✅ All 270+ backend Jest tests passing
- ✅ Code committed and pushed to origin/phase-2
