---
id: BUG-015
title: MCP Servers not loading on project view page
severity: high
category: data-loading
status: completed
created: 2025-10-21
---

## Problem Statement
MCP (Model Context Protocol) servers are not loading on the project detail view page. The MCP card appears empty or doesn't display the server list at all.

## Acceptance Criteria
- [ ] MCP servers load on project detail page
- [ ] MCP card displays all servers
- [ ] MCP server names display correctly
- [ ] MCP server count accurate
- [ ] Empty state handled when no MCP servers
- [ ] Console shows no errors
- [ ] Backend API returns MCP data
- [ ] Frontend displays MCP data correctly
- [ ] Visual test confirms display

## Technical Details
**Backend:** src/backend/parsers/mcp-parser.js
**Frontend:** src/components/cards/MCPCard.vue, DetailSidebar.vue
**Files to Check:**
- `src/backend/parsers/mcp-parser.js` (parsing logic)
- `src/backend/endpoints/project-mcp.js` (API endpoint)
- `src/components/cards/MCPCard.vue` (display)
- `src/api/client.js` (API call)

**Data Source:** `.mcp.json` or `.claude/settings.json`

**Current Behavior:** MCP card is empty or shows no servers
**Expected Behavior:** MCP card displays all configured servers

## Investigation Steps
1. Check if .mcp.json file exists in test projects
2. Verify backend parser reads MCP files
3. Check API endpoint returns MCP data
4. Verify frontend API call succeeds
5. Check if MCP data passes to component
6. Debug component rendering

## Testing Requirements
**Test File:** `tests/frontend/04-mcp-servers-loading.spec.js`
**Test Cases:**
1. MCP card displays on project page
2. MCP servers load and display
3. MCP server count matches expected
4. Multiple MCP servers display
5. Server names display correctly
6. Empty state when no MCP servers
7. MCP details accessible in sidebar

## Deployment Notes
May require backend parser fix, API fix, or frontend display fix.
