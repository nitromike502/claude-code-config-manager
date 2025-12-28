---
name: swarm
description: Execute SWARM (Specialized Workflow with Autonomous Resource Management) development workflow for coordinated multi-agent implementation
tools: Task
argument-hint: "[ticket] [additional-instructions] - Optional ticket ID (e.g., STORY-3.1) and/or custom instructions"
color: purple
---

# SWARM Workflow Command
# Coordinated Multi-Agent Development with Main Agent Control

<task>
Execute the complete SWARM workflow where the main agent coordinates all subagent invocations, manages session tracking, and implements the orchestrator's execution plan.
</task>

<context>
**Project**: Claude Code Config Manager - Web-based tool for managing Claude Code projects
**Tech Stack**: Node.js + Express (backend), Vue 3 + Vite (frontend SPA)
**Architecture**: Local web server on port 8420, live file system reads

**Current Phase**: Phase 3 - CRUD Operations for Configuration Management
**Development Method**: SWARM (Specialized Workflow with Autonomous Resource Management)
**Team Structure**: See `.claude/agents/` for subagent definitions

**Ticket Storage**: SQLite database (project: `claude-manager`)
- Managed by `agile-ticket-manager` subagent (acts as database API)
- Accessed via `ticket-system` user-level skill scripts
- Hierarchical relationships: Epics → Stories → Tasks
- Status workflow: backlog → todo → in-progress → review → done

**Key Workflow Documents**:
- `docs/guides/SWARM-WORKFLOW.md` - Complete SWARM workflow specification
- `docs/guides/PARALLEL-EXECUTION-GUIDE.md` - Parallelization patterns and safety
- `docs/guides/GIT-WORKFLOW.md` - Feature branch workflow and commit conventions
- `docs/guides/TESTING-GUIDE.md` - Test execution and quality gates

**CRITICAL ARCHITECTURE PRINCIPLE**:
Only the main agent invokes subagents. The orchestrator creates plans but does NOT invoke other subagents.
</context>

<execution>
**Reference:** See `docs/guides/SWARM-WORKFLOW.md` for complete workflow specification.

**User Arguments:** `$ARGUMENTS`

## SWARM Workflow Overview

This command implements the complete SWARM workflow across 7 phases:
1. **Session Initialization & Planning** - Orchestrator creates plan, main agent manages
2. **Git & Session Setup** - Branch creation, session tracking doc creation by main agent
3. **Implementation** - Sequential or parallel execution based on orchestrator recommendations
4. **Commit Code Changes** - Git-workflow-specialist handles all git operations
5. **Documentation Updates** - Documentation-engineer updates docs, committed separately
6. **PR Creation & Code Review** - Git-workflow-specialist creates PR, code-reviewer analyzes
7. **User Approval & Merge** - Main agent moves tracking doc to `.deleted/`, handles merge

---

## Phase 1: Session Initialization & Planning

### Step 1: Parse Arguments

**Arguments provided:** `$ARGUMENTS`

### Parse Ticket ID and Instructions

1. **If `$ARGUMENTS` is empty:**
   - ticket_id = None
   - instructions = None
   - Proceed with current auto-select behavior (show ticket options in Step 3)

2. **If `$ARGUMENTS` is not empty:**
   - Extract first token from `$ARGUMENTS`
   - Check if first token matches pattern `^[a-zA-Z]+-[0-9]+$`

   **If matches (valid ticket ID):**
   - ticket_id = first token (e.g., "HIGH-005", "CRITICAL-001")
   - instructions = everything after first token (may be empty)

   **If doesn't match (no valid ticket ID):**
   - ticket_id = None
   - instructions = all of `$ARGUMENTS`

3. **Validation:**
   - If first token looks like a ticket ID but doesn't match pattern exactly:
     - Inform user of correct format: `[PREFIX]-[NUMBER]` (e.g., HIGH-005, ABC-123)
     - Provide helpful feedback on what was received vs expected

4. **Result Summary:**
   - **Ticket ID:** {display ticket_id or "None - will show options"}
   - **Instructions:** {display instructions or "None"}

### Step 2: Invoke Orchestrator for Planning

**Main agent invokes `subagent-orchestrator`** with ticket context:

**If ticket ID provided in $ARGUMENTS:**
- Main agent invokes `agile-ticket-manager` to fetch ticket details
- Main agent invokes `subagent-orchestrator` with ticket content
- Orchestrator analyzes and creates execution plan

**If NO ticket ID provided:**
- Main agent invokes `agile-ticket-manager` to query database for available tickets (backlog, todo statuses)
- Ticket manager executes filter_by_status.js scripts and returns results from database
- Main agent invokes `project-manager` to analyze tickets and recommend options
- Present ticket options to user (see Phase 0 in SWARM-WORKFLOW.md)
- User selects ticket
- Main agent invokes `agile-ticket-manager` to fetch selected ticket from database
- Main agent invokes `subagent-orchestrator` with ticket content

**Orchestrator Deliverable:**
- Detailed task breakdown
- Dependencies between tasks
- Parallel vs. sequential execution recommendations
- Risk assessment and mitigations
- Time estimates

**⚠️ TRUST SUBAGENT OUTPUT:** Present the orchestrator's plan directly to the user without additional research. Subagents run in isolated contexts specifically to do analysis work - duplicating that work wastes main agent context.

### Step 3: Invoke Ticket Manager

**Main agent invokes `agile-ticket-manager`:**
- Request: Move ticket from `todo` to `in-progress`
- Ticket manager executes move_ticket.js script to update database
- Document start timestamp
- Confirm ticket status updated in database

**Main agent presents orchestrator's plan to user:**

Show:
- Task breakdown with time estimates
- Parallelization opportunities and rationale
- Dependencies and sequencing
- Risk assessment
- Total estimated time

Request user approval or refinements.

**User provides feedback:**
- Approve plan as-is → Proceed to Phase 2
- Request modifications → Main agent updates plan, re-present
- Reject plan → End workflow

---

## Phase 2: Git & Session Setup

### Step 1: Invoke Git Workflow Specialist

**Main agent invokes `git-workflow-specialist`:**
- Checkout phase branch (e.g., `phase-3`)
- Pull latest changes from remote
- Create feature branch: `feature/story-X.X-description`
- Push feature branch to remote with `-u` flag

### Step 2: Main Agent Creates Session Tracking Document

**CRITICAL: Main agent creates this, NOT documentation-engineer**

**Location:** `docs/sessions/tracking/SESSION-[TICKET-ID]-[YYYY-MM-DD].md`

**Template:** Use `.claude/templates/session-tracking-template.md`

**Content:**
- Execution plan from orchestrator (full details)
- Task breakdown with acceptance criteria
- Git context (branch names, parent branch)
- Critical context for session resumption
- Parallelization decisions
- All timestamps and metadata

**Purpose:** This document must be detailed enough for a fresh session to resume work at any point.

### Step 3: Main Agent Creates TodoWrite Task List

**Main agent uses TodoWrite tool:**
- Mirror structure from session tracking document
- Provides real-time status visibility
- Updated after each milestone completion

---

## Phase 3: Implementation

**Main agent coordinates execution based on orchestrator recommendations.**

See `docs/guides/PARALLEL-EXECUTION-GUIDE.md` for parallelization patterns.

### Sequential Execution (When tasks have dependencies or modify same files)

**For each task:**

1. **Main agent invokes appropriate developer agent**
   - Provide clear task scope and acceptance criteria
   - Reference session tracking document for context
   - Specify files to modify

2. **Developer implements task**
   - Focus on single task only
   - Write implementation code
   - Create/update tests for this specific task
   - **Developer tests immediately** (do NOT wait)

3. **Developer reports completion**
   - Summary of changes and test results

4. **Main agent updates tracking document and TodoWrite**
   - Mark task completed with timestamp
   - Document key decisions

5. **Main agent invokes test-automation-engineer**
   - Run full test suite (backend + frontend)
   - **HARD GATE:** If tests fail, return to developer (loop until pass)

6. **Tests pass → Main agent invokes git-workflow-specialist**
   - Commit THIS TASK only
   - Format: `type: description (TASK-ID)`
   - Push commit to remote

7. **Repeat for next task**

### Parallel Execution (When orchestrator recommends AND main agent agrees)

**Main agent launches multiple developer agents simultaneously:**

1. **Main agent invokes multiple agents in parallel**
   - Each agent gets clear, independent scope
   - No file conflicts
   - No logical dependencies

2. **Each agent works independently**
   - Different files or safe append-only
   - Each agent tests their changes

3. **Main agent monitors completion**
   - Wait for ALL parallel tasks to finish
   - Aggregate results

4. **Main agent invokes test-automation-engineer**
   - Run full test suite with ALL changes
   - **HARD GATE:** If tests fail, return to appropriate developer

5. **All tests pass → Main agent invokes git-workflow-specialist**
   - **Batch commit:** `type: description (TASK-X, TASK-Y)`
   - Push commit to remote

### Main Agent Updates Throughout

After each milestone:
- Update session tracking document
- Document decisions and issues
- Update TodoWrite
- Note remaining work

---

## Phase 4: Commit Code Changes

**Integrated into Phase 3** - commits happen after each task/batch completion.

**Git-workflow-specialist responsibilities:**
- Verify working directory clean
- Stage appropriate files
- Create commit with proper format
- Push to remote immediately
- Confirm push succeeded

**Main agent updates:**
- Document commit hash in session tracking
- Update git history section

---

## Phase 5: Documentation Updates

**Only if documentation updates needed** (new features, API changes, breaking changes, config changes).

### Step 1: Main Agent Invokes Documentation Engineer

**Main agent invokes `documentation-engineer`:**
- Specify which documents need updates
- Provide context about changes made
- Reference implementation details

**Documentation engineer updates:**
- CHANGELOG.md (Keep a Changelog format)
- README.md (if setup/usage changed)
- API documentation (if endpoints changed)
- Guides (if workflows changed)

### Step 2: Main Agent Updates Session Tracking

**Main agent (NOT documentation-engineer) maintains session tracking:**
- Note which documentation was updated
- Explain rationale for changes

### Step 3: Main Agent Invokes Git Workflow Specialist

**Commit documentation changes separately:**
- Format: `docs: description (STORY-ID)`
- Push to remote

---

## Phase 6: PR Creation & Code Review

### Step 1: Main Agent Invokes Git Workflow Specialist

**Create pull request:**
- Generate PR title from ticket
- Create comprehensive PR body
- Push PR to remote

### Step 2: Main Agent Invokes Ticket Manager

**Update ticket status:**
- Move from `in-progress` to `review` (via move_ticket.js script)
- Update database with PR metadata

### Step 3: Main Agent Invokes Code Reviewer

**Comprehensive code review:**
- Code quality and standards
- Security vulnerabilities
- Test coverage
- Documentation completeness
- Commit message conventions

**Code reviewer provides feedback:**
- ✅ Approved → Proceed to Phase 7
- ❌ Changes requested → Fix issues, re-test, re-review

### Step 4: Ticket Status Update

**If approved, main agent invokes ticket manager:**
- Update status in database to `approved` (sub-status of `review`)
- Document reviewer approval via move_ticket.js script

---

## Phase 7: User Approval & Merge

### Step 1: Main Agent Presents PR to User

Present:
- PR URL and summary
- Code review status
- Test results
- Documentation status

Request user decision:
- Approve → Proceed to merge
- Request changes → Return to Phase 3

### Step 2: User Approves - Cleanup & Merge

**Main agent moves session tracking doc to archive:**
- Move `docs/sessions/tracking/SESSION-*.md` to `.deleted/docs/sessions/tracking/`
- Use `git mv` to preserve history

**Main agent invokes git-workflow-specialist:**
- Commit tracking doc removal: `chore: archive session tracking for [TICKET-ID]`
- Push commit

**Main agent invokes git-workflow-specialist to merge PR:**
- Squash-merge PR to phase branch
- Delete feature branch (local and remote)
- Checkout phase branch
- Pull latest changes

**Main agent invokes agile-ticket-manager:**
- Execute move_ticket.js script to update status from `review` to `done`
- Update completion timestamp in database
- Document merge commit hash

### Step 3: Main Agent Presents Final Summary

Show:
- Ticket completion confirmation
- Merge details
- Test results
- Time taken
- Next available work

---

## Critical Workflow Rules

**Mandatory Practices:**

1. **Only Main Agent Invokes Subagents** - Orchestrator creates plans but does NOT invoke
2. **Trust Subagent Output** - Present subagent results directly; do NOT duplicate their analysis with your own file reads
3. **One Commit Per Task (Sequential)** - Each task completion triggers immediate commit
4. **Batch Commit for Parallel Work** - Single commit when tasks truly execute simultaneously
5. **Test Immediately After Each Task** - Developers test before declaring complete
6. **Ticket Status Must Be Current** - Update at ALL key transitions
7. **Git Operations via git-workflow-specialist** - Developers NEVER do git operations
8. **User Approval is Mandatory Gate** - Tickets cannot move to `done` without user review
9. **Session Tracking is Main Agent's Job** - NOT delegated to documentation-engineer
10. **Documentation Updates After Implementation** - Committed separately from code
11. **TodoWrite Mirrors Session Tracking** - Updated after each milestone

**See:** `docs/guides/SWARM-WORKFLOW.md` for complete workflow details and best practices.

---

## MAIN AGENT DELEGATION RULES - MANDATORY

**CRITICAL:** As the main agent in SWARM workflow, you are a **COORDINATOR**, not an implementer. Your role is to invoke subagents and track progress - NEVER to perform implementation work directly.

### What You MUST NEVER Do Directly:

| Action | Use This Subagent Instead |
|--------|---------------------------|
| ❌ Edit code files (Edit tool on src/, tests/) | `frontend-developer` or `backend-architect` |
| ❌ Run tests (Bash npm test, npx jest, etc.) | `playwright-testing-expert` or `test-automation-engineer` |
| ❌ Execute git commands (git add, commit, push, etc.) | `git-workflow-specialist` |
| ❌ Query/update tickets in database | `agile-ticket-manager` |
| ❌ Update documentation files | `documentation-engineer` |

### The "One Line Change" Rule

Even if a task appears trivial (one-line fix, simple file move, single git command), you **MUST delegate** to the appropriate specialist. Specialists handle:

- **Complete workflows** - not just the "hard parts"
- **Quality validation** - they know domain-specific standards
- **Safety protocols** - especially for git operations and ticket integrity
- **Pattern consistency** - they maintain codebase conventions

**Wrong thinking:** "This is just one line → I'll do it directly"
**Correct thinking:** "This is code modification → frontend-developer owns code quality"

### What You MAY Do Directly:

✅ Read files for analysis and understanding
✅ Search/glob for information gathering
✅ Invoke subagents via Task tool
✅ Update TodoWrite task lists
✅ Create/update session tracking documents
✅ Present information to users and request decisions
✅ Parse orchestrator plans and coordinate execution

### Pre-Action Check

Before using Edit, Bash, or Write tools, ask yourself:
1. "Is this an implementation action?" → If yes, **delegate**
2. "Does a specialist own this domain?" → If yes, **delegate**
3. "Am I about to modify project state?" → If yes, **delegate**

### Why This Matters

**Context efficiency:** Delegation actually SAVES context because subagents work in isolated contexts. Direct implementation consumes MORE main agent context through file reads, debugging, and multiple attempts.

**Quality assurance:** Specialists know domain-specific rules. Example: git-workflow-specialist knows the branching strategy and will create bug fixes from `main`, not from feature branches.

**Process integrity:** When you bypass specialists, you bypass the quality gates and safety protocols they enforce.

</execution>

## Examples

### Example 1: Work on specific ticket
```
/swarm STORY-3.2
```
- Main agent fetches STORY-3.2 from ticket manager
- Main agent invokes orchestrator for planning
- Main agent invokes ticket manager to move to `in-progress`
- Main agent presents plan to user for approval
- Upon approval, main agent executes all 7 phases
- Session tracking doc created and maintained by main agent
- PR created and presented to user for approval

### Example 2: Work with custom instructions
```
/swarm STORY-3.2 Focus on backend first, then frontend
```
- Same flow as Example 1
- Instructions applied to orchestrator's planning
- Main agent coordinates accordingly

### Example 3: Let main agent recommend ticket
```
/swarm
```
- Main agent invokes ticket manager for available tickets
- Main agent invokes project-manager for recommendations
- User selects from presented options
- Main agent proceeds with selected ticket

### Example 4: Session resumption scenario
```
/swarm STORY-3.2
```
- If session tracking doc exists for STORY-3.2
- Main agent reads tracking doc to understand current state
- Resumes from last documented milestone
- Continues updating tracking doc throughout

## Related Documentation

- **Complete Workflow:** `docs/guides/SWARM-WORKFLOW.md`
- **Parallelization Guide:** `docs/guides/PARALLEL-EXECUTION-GUIDE.md`
- **Git Workflow:** `docs/guides/GIT-WORKFLOW.md`
- **Testing Guide:** `docs/guides/TESTING-GUIDE.md`
- **Session Tracking Template:** `.claude/templates/session-tracking-template.md`
