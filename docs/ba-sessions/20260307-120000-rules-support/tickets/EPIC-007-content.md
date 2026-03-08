# Rules Support

## Objective
Add full support for Rules as the 6th configuration type in the Claude Code Config Manager, enabling users to view, copy, and delete rules from `.claude/rules/` directories at both project and user scope.

## Business Objectives
1. Complete configuration coverage - Users can view and manage all Claude Code configuration types from one interface
2. Feature parity - Rules support matches the same view/copy/delete capabilities as existing configuration types
3. Consistent UX - Rules integration follows established UI patterns so users have zero learning curve

## Acceptance Criteria
- [ ] Users can view rules in project and user-level ConfigCard sections
- [ ] Rules detail sidebar shows full content, conditional status, and path patterns
- [ ] Copy rule works across project-to-project, project-to-user, user-to-project
- [ ] Delete rule removes file and refreshes list
- [ ] Dashboard project cards display rules count
- [ ] Backend parser handles all edge cases (missing dir, invalid YAML, nested subdirs)
- [ ] 79-111 backend unit tests passing at 100%
- [ ] 33-53 frontend/E2E tests passing at 80%+
- [ ] Rules parsing for 50+ rules completes in under 500ms

## Stories
- STORY-7.1: Backend - Rules parser and config paths
- STORY-7.2: Backend - Discovery service and API routes
- STORY-7.3: Backend - Copy service
- STORY-7.4: Frontend - API client, store, and components

## References
- PRD: docs/ba-sessions/20260307-120000-rules-support/prd/PRD-Rules-Support.md
- Implementation guide: docs/ba-sessions/20260307-120000-rules-support/guides/implementation-guide.md
- Technical spec: docs/technical/rules-structure.md
