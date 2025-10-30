# HIGH-009: Fix Absolute Path References in Documentation

**Status:** ✅ COMPLETE
**Priority:** High
**Assignee:** documentation-engineer
**Created:** 2025-10-29
**Completed:** 2025-10-29
**Actual Time:** 30 minutes

## Problem

Documentation contains absolute paths (`/home/claude/manager/...`) that break portability:
- Won't work if cloned to different locations
- Won't work on Windows
- Won't work in different workspace structures

## Scope

**Total:** 106 absolute path references
- **Guides:** 28 occurrences across 7 files (docs/guides/)
- **Agents:** 78 occurrences across 12 files (.claude/agents/)

## Solution

Replace absolute paths with relative paths from project root.

**Before:** `/home/claude/manager/docs/guides/GIT-WORKFLOW.md`
**After:** `docs/guides/GIT-WORKFLOW.md`

## Implementation Plan

### Task 1: Fix Guide Paths (28 occurrences)
- `docs/guides/DEVELOPMENT-STRATEGIES.md` (2 paths)
- `docs/guides/ROADMAP.md` (3 paths)
- `docs/guides/SETUP-GUIDE.md` (5 paths)
- `docs/guides/SPEC-IMPLEMENTATION-GUIDE.md` (4 paths)
- `docs/guides/TESTING-GUIDE.md` (6 paths)
- `docs/guides/archives/PHASE1-SUCCESS-CRITERIA.md` (5 paths)
- `docs/guides/archives/PHASE2-COMPLETION-SUMMARY.md` (3 paths)

### Task 2: Fix Agent Paths (78 occurrences)
Affected agents:
- backend-architect.md (3)
- code-reviewer.md (3)
- data-parser.md (2)
- frontend-developer.md (11)
- git-workflow-specialist.md (9)
- integration-tester.md (3)
- playwright-testing-expert.md (7)
- project-manager.md (3)
- subagent-orchestrator.md (7)
- test-automation-engineer.md (21)
- wireframe-designer.md (3)
- workflow-analyzer.md (6)

### Task 3: Validation
- Run grep to confirm zero absolute paths remain
- Test that documentation links work
- Verify agent references resolve correctly

## Acceptance Criteria

- [x] All 28 guide paths converted to relative
- [x] All 78 agent paths converted to relative
- [x] Grep `/home/claude/manager` returns 0 results in docs/ and .claude/
- [x] Documentation links tested and working
- [x] Committed with proper message

## Completion Status

**Status:** ✅ COMPLETE
**Completed:** October 29, 2025
**Branch:** phase-2.2
**PR:** #49 (pending merge)
**Commits:**
- 74e14b7: docs: fix absolute path references for portability
- 3a56019: chore: add HIGH-009 ticket and session progress tracking

**Results:**
- 28 paths fixed in docs/guides/
- 78 paths fixed in .claude/agents/
- Project now fully portable across directory structures
- All documentation links verified and working

## Notes

- Claude Code provides `CLAUDE_PROJECT_ROOT` environment variable
- Git root available via `$(git rev-parse --show-toplevel)`
- Relative paths work universally across platforms
