# Session Tracking Documents

## Purpose

This directory contains active SWARM workflow session tracking documents. These documents are **ephemeral** and should be maintained only during active development sessions.

## Usage

### During Active Development

When executing a SWARM workflow with `/swarm <ticket-id>`, session tracking documents may be created here to:
- Track progress across the 7 phases
- Document decisions made during implementation
- Capture blockers and resolutions
- Maintain communication between subagents

### After Session Completion

**Session tracking documents should be removed after the associated PR is merged.** The key outcomes are:
- ✅ Working code (in the repository)
- ✅ Git commit messages (documenting changes)
- ✅ Updated tests (validating functionality)
- ✅ PR review comments (capturing discussion)

Session tracking docs are **process artifacts**, not deliverables. They don't need to be preserved in git.

## Git Tracking

Session tracking documents are **not tracked in git** by default (see `.gitignore`). They exist locally during development but are not committed to the repository.

If a session contains strategic insights that should be preserved (e.g., critical incident analysis, workflow improvements), those insights should be:
1. Extracted into a workflow analysis document (see `docs/sessions/summaries/`)
2. Incorporated into relevant guides (e.g., `docs/guides/SWARM-WORKFLOW.md`)
3. Then archived in the ticketing system at `/home/tickets/claude/manager/archives/workflow-analyses/`

## Historical Context

For historical workflow analyses and lessons learned, see:
- `/home/tickets/claude/manager/archives/workflow-analyses/` - Critical workflow analyses (Oct 2025)
- `docs/sessions/summaries/` - Session summaries with key outcomes
- `docs/sessions/INDEX.md` - Complete session history index
