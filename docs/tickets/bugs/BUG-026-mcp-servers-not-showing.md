---
id: BUG-026
title: MCP servers still not showing
status: completed
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-22
updated_at: 2025-10-22
---

## Description
MCP server configurations are not appearing or loading in the project detail view or user global configuration view. The MCP servers section is completely empty or missing.

## Current Behavior
- MCP servers section shows no content
- API endpoint may be failing or returning empty results
- No error messages shown to user
- Backend may not be parsing MCP files correctly

## Expected Behavior
- MCP servers should be listed in project and user configuration views
- Each server should show name, type, and configuration details
- Loading state should be shown while fetching
- Error messages should display if loading fails

## Affected Component(s)
- ProjectDetail.vue (MCP servers section)
- UserGlobal.vue (MCP servers section)
- DetailSidebar.vue (when showing MCP details)
- Backend API endpoint: GET /api/projects/:projectId/mcp
- Backend API endpoint: GET /api/user/mcp

## Data Sources
- Project MCP servers: `.mcp.json`
- User MCP servers: `~/.claude/settings.json`

## Steps to Reproduce
1. Navigate to any project detail page
2. Scroll to the MCP Servers section
3. Observe that no servers are displayed
4. Open browser console to check for API errors
5. Verify backend is returning data

## Acceptance Criteria
- [ ] MCP servers section displays configured servers
- [ ] Backend API correctly parses `.mcp.json` files
- [ ] Backend API correctly extracts MCP servers from settings files
- [ ] Frontend displays loading state while fetching
- [ ] Error messages display if loading fails
- [ ] Empty state shows helpful message if no servers configured
- [ ] Server details are complete and readable
