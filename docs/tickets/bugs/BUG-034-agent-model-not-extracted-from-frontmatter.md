---
id: BUG-034
title: Agent model field not extracted from frontmatter in API response
status: resolved
priority: critical
category: Data Display / API Response
assigned_to: null
created_at: 2025-10-24
updated_at: 2025-10-24
resolved_at: 2025-10-24
---

## Description

The agent model field is being parsed from YAML frontmatter by the backend but is NOT being extracted and added to the top-level API response object. This causes the frontend to be unable to display the model value even though it exists in the data.

## Current Behavior

- Backend parser correctly reads `model: sonnet` from agent YAML frontmatter
- Model field is stored in response `frontmatter.model`
- Model field is NOT available at top level as `model` (like `color` is)
- Frontend component tries to display `selectedItem.model` but it's undefined
- Result: Model always displays as "inherit" (the default fallback)

## Expected Behavior

- Agent model field should be extracted to top level in API response
- Should appear alongside other top-level fields: `name`, `description`, `color`, `tools`
- Format: `model: "sonnet"` or `model: "opus"` or `model: "haiku"`
- Should work in both project agents and user agents endpoints

## Affected Components

- Backend API: `/api/projects/:projectId/agents`
- Backend API: `/api/user/agents`
- Service: `src/backend/services/projectDiscovery.js` (getUserAgents, getProjectAgents)
- Frontend: Already correct (waiting for API fix)

## Root Cause

In `src/backend/services/projectDiscovery.js`, the agent response object includes:
```javascript
agents.push({
  name: ...,
  description: ...,
  tools: ...,
  color: parsed.frontmatter.color || null,  // ← Extracted correctly
  // MISSING: model: parsed.frontmatter.model || 'inherit'
});
```

The `model` field is available in `parsed.frontmatter.model` but is never extracted to the top level.

## Acceptance Criteria

- [x] Agent API response includes `model` field at top level
- [x] Model value extracted from YAML frontmatter
- [x] Defaults to "inherit" if not specified in YAML
- [x] Works for `/api/projects/:projectId/agents`
- [x] Works for `/api/user/agents`
- [x] Frontend component can display the correct model value
- [x] Verified with agents that have model defined (e.g., `/home/claude/sample/.claude/agents/api-tester.md` with `model: sonnet`)

## Resolution
**Fixed in commit `e1e2c32`**

### Changes Made
1. **projectDiscovery.js (getUserAgents):** Added `model: parsed.frontmatter.model || 'inherit'` extraction
2. **projectDiscovery.js (getProjectAgents):** Added `model: parsed.frontmatter.model || 'inherit'` extraction
3. Both API endpoints now include model field at top level in response

### Tests Verified
- ✅ API returns model field for agents with model defined
- ✅ API returns 'inherit' as fallback for agents without model
- ✅ Works on both user and project agent endpoints
- ✅ Frontend can now correctly display agent model values

### Verification
- ✅ Manual API testing with curl
- ✅ Backend Jest tests passing
- ✅ Frontend component rendering correctly

## Test Agent

Use `/home/claude/sample/.claude/agents/api-tester.md` which has:
```yaml
---
name: api-tester
model: sonnet
color: yellow
---
```

After fix, API should return:
```json
{
  "name": "api-tester",
  "model": "sonnet",
  "color": "yellow"
}
```

## Files to Update

- `src/backend/services/projectDiscovery.js` - Extract model field in both getUserAgents() and getProjectAgents()

## Severity

**CRITICAL** - Without this fix, the model field display (BUG-028) cannot work correctly. The model will always show "inherit" even when defined in YAML.
