# Business Analysis: Rules Support

**Session Date:** 2026-03-07
**Analyst:** Claude Business Analyst
**Status:** Complete

## Executive Summary

This analysis covers adding full Rules support to the Claude Code Config Manager as the 6th configuration type. Rules are markdown files with optional YAML frontmatter stored in `.claude/rules/` directories that provide modular, topic-specific instructions extending CLAUDE.md. They support optional path-based conditional loading via a `paths` frontmatter field.

The implementation follows established patterns from the existing five config types (Agents, Commands, Skills, Hooks, MCP Servers), requiring a new parser, discovery service functions, API routes, copy/delete operations, and frontend integration. The estimated effort is ~23 hours across 4 stories.

Rules are the simplest config type to implement — they're file-based like agents/commands (no JSON merging like hooks), have minimal frontmatter (just `paths`), and the existing `ConfigCard`/`DetailSidebar` components are already reusable.

## Problem Statement

The Config Manager supports viewing and managing 5 of 6 Claude Code configuration types. Users cannot see or manage Rules, leaving a gap in configuration visibility. As Rules become more widely adopted for modular project instructions, users need the same management capabilities they have for other config types.

## Business Objectives

1. **Complete coverage** — All Claude Code config types manageable from one interface
2. **Feature parity** — Rules get the same view/copy/delete capabilities as existing types
3. **Consistent UX** — Zero learning curve for users already familiar with the app

## User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-1 | View project rules with conditional/unconditional indicators | Must |
| US-2 | View user-level rules | Must |
| US-3 | View rule details in sidebar (paths, content, frontmatter) | Must |
| US-4 | Copy rules between projects with subdirectory preservation | Must |
| US-5 | Delete rules with confirmation | Must |
| US-6 | Dashboard config counts include rules | Must |

## Solution Overview

Rules integrates into every layer of the existing architecture:

- **Backend:** New `rulesParser.js` (follows `commandParser.js` pattern), discovery service additions, API routes, copy service method
- **Frontend:** API client methods, Pinia store state, ConfigCard with conditional badge, DetailSidebar with path patterns section, dashboard stats update
- **Design:** `pi pi-book` icon in red-orange `#E53E3E`, amber conditional badge, relative path as name

## Design Summary

See: `wireframes/`

Key design decisions:
- **Icon:** `pi pi-book` (instructions metaphor) in red-orange `#E53E3E`
- **Card position:** 6th (last) to preserve existing layout stability
- **Name display:** Full relative path (e.g., `frontend/react`) to handle subdirectory collisions
- **Conditional indicator:** Amber badge + "Loads when: [patterns]" description
- **Sidebar:** Unique Path Patterns section for conditional rules, standard markdown content section

## Technical Approach

Rules follows the command parser pattern most closely:
- Markdown files with optional YAML frontmatter
- Recursive subdirectory discovery
- Name derived from relative file path
- Both project-level and user-level scopes
- File-based copy (no JSON merging complexity)

The only unique aspects are:
- Single frontmatter field (`paths`) vs multiple fields for agents/commands
- Conditional vs unconditional loading distinction (UI badge)
- Subdirectory structure preservation during copy

## Dependencies & Constraints

- All dependencies are existing (gray-matter, ConfigCard, CopyService, etc.)
- No database changes needed
- Must respect `USE_DEV_PATHS` for development mode
- Path traversal security must be enforced on all new routes

## Deliverables Created

- [x] Product Requirements Document (`prd/PRD-Rules-Support.md`)
- [x] Wireframes & Design Specs (`wireframes/`)
  - [x] Rules Config Card (`wireframes/rules-config-card.md`)
  - [x] Rules Detail Sidebar (`wireframes/rules-detail-sidebar.md`)
  - [x] Dashboard Integration (`wireframes/rules-dashboard-integration.md`)
  - [x] Design Notes (`wireframes/design-notes.md`)
- [x] Implementation Guide (`guides/implementation-guide.md`)
- [x] Technical Specification (`docs/technical/rules-structure.md` — created prior to this session)

## Next Steps

1. Review and approve this analysis
2. Have project-manager create Epic/Story/Task tickets from the PRD
3. Begin development via `/swarm <ticket-id>`

## Session Artifacts

All documents for this analysis session are in:
`docs/ba-sessions/20260307-120000-rules-support/`
