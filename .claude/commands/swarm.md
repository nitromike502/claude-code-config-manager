---
name: swarm
description: Launch the subagent-orchestrator to coordinate Claude Code Manager development through a structured workflow with Epic/Story/Task breakdown
tools: Task
argument-hint: "[ticket] [additional-instructions] - Optional ticket ID (e.g., HIGH-005) and/or custom instructions"
color: purple
---

# SWARM Orchestrator
# Multi-Agent Claude Code Manager Development Coordinator

<task>
Launch the subagent-orchestrator to coordinate Claude Code Manager development through a structured workflow with Epic/Story/Task breakdown. Automatically creates tickets if none exist.
</task>

<context>
**Project**: Claude Code Manager - Web-based tool for managing Claude Code projects
**Tech Stack**: Node.js + Express (backend), Vue 3 + Vite (frontend SPA)
**Architecture**: Local web server on port 8420, live file system reads

**Current Phase**: Phase 2.2 - Cleanup & Optimization for Production Release
**Development Method**: SWARM (Simultaneous Work And Resource Management)
**Team Structure**: See docs/Subagent-Team.md for complete team definitions

**Ticket Storage**: Local markdown documents in `docs/tickets/phase-*/*.md`
- Phase 2.2 cleanup tickets: `docs/tickets/phase-2.2/`
- Epics within phase directories: `PHASE-2.X-EPIC.md`
- Individual tickets: `CRITICAL-001-*.md`, `HIGH-005-*.md`, etc.

**Available PRDs**:
- docs/prd/PRD-Phase1-MVP.md (reviewed & approved)
- docs/prd/PRD-Phase2-Vite-Migration.md (Phase 2 complete - Architecture modernization)
- docs/prd/PRD-Phase2-Extension-Component-Refactoring.md (Phase 2.1 - Planned)
- docs/prd/PRD-Phase3-Subagents.md (Phase 3 - Planned)
</context>

<execution>
Invoke the `subagent-orchestrator` agent to:

## Step 1: Parse Arguments

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

## Step 2: Check for Existing Tickets
1. **Query `agile-ticket-manager` for tickets in `backlog`, `todo`, and `in-progress` statuses**
2. Review ticket metadata (ID, title, priority, dependencies, status)
3. Understand current Epic/Story/Task hierarchy from ticket manager
4. Determine if tickets are sufficient to proceed with development

## Step 3: Auto-Plan if Needed (ENFORCE SMALL FEATURE SIZING)
If NO tickets exist or tickets are stale/completed:
1. Invoke `project-manager` subagent to create tickets
2. Project manager will:
   - Assess current project state (read CLAUDE.md, git status)
   - Reference PRDs in `/home/tickets/claude/manager/prds/`
   - Determine current phase and what work comes next
   - Create comprehensive Epic/Story/Task ticket files:
     - **Epics**: Major feature areas (e.g., "Backend API Development", "Frontend UI Development")
     - **Stories**: User-facing features within each epic (e.g., "Project List View", "Subagent Viewer")
     - **Tasks**: Technical implementation steps for each story (e.g., "Create /api/projects endpoint")
     - **⚠️ CRITICAL: ALL tasks MUST be 30-60 minutes max**
     - **⚠️ CRITICAL: Each task must be independently testable and committable**
     - **⚠️ CRITICAL: Break down any task >1 hour into multiple sub-tasks**
   - Write ticket files with complete frontmatter
   - Invoke `agile-ticket-manager` to organize tickets into proper directory structure
   - Reference `/home/claude/manager/docs/workflow-analysis-20251007.md` for sizing best practices
3. Verify tickets are organized in `/home/tickets/claude/manager/`

**Note**: Project manager creates tickets, ticket manager organizes them.

## Step 4: Ticket Selection & Dependency Analysis

**Ticket Selection Mode:** {Based on Step 1 parsing results}

### If Ticket ID Provided (from Step 1):
- **Target Ticket:** {ticket_id from Step 1}
- **Skip ticket options menu** - proceed directly to this ticket
- **Query `agile-ticket-manager`:** Request ticket details for {ticket_id}
- **If ticket not found:**
  - Ask ticket manager to list available tickets matching the prefix (e.g., all HIGH-* tickets)
  - Ask user to confirm correct ticket ID
- **If ticket found:** Load ticket details from ticket manager and proceed to Step 5

### If NO Ticket ID Provided (from Step 1):
Present ticket options to user as normal:

1. **Invoke project-manager agent** to analyze ticket dependencies and priorities
2. Project manager should:
   - **Query `agile-ticket-manager` for all tickets in `todo`, `backlog`, and `in-progress` statuses**
   - Request ticket manager to return Epic/Story/Task hierarchy information
   - Analyze ticket priorities (P0, P1, P2, P3)
   - Check git status for any pending PRs awaiting merge
   - Identify ticket dependencies (which tickets block others via `parent` field)
   - Determine which tickets are independent and could be worked on in parallel
   - Consider Epic/Story groupings for logical sequencing
3. **Present 2-4 ticket options to user** with clear rationale:
   - **Option A**: Single ticket (safest, no dependencies)
   - **Option B**: 2-3 independent tickets (each gets own branch/PR, can work simultaneously)
   - **Option C**: Next logical ticket in sequence (explain any blockers)
   - **Option D**: Recommend skip if ticket depends on pending PR
4. **Include for each option**:
   - Ticket ID(s) and descriptions
   - Estimated time (30-60 min per ticket)
   - Dependencies (blocks/blocked by which tickets/PRs)
   - Whether backend + frontend can work in parallel within the ticket
   - Risk level (low/medium/high)
   - Current ticket status (todo/backlog/in-progress)
5. **WAIT FOR USER SELECTION** - Do not proceed until user chooses an option
6. User may also specify custom ticket selection

### Additional Instructions (from Step 1):
**User Instructions:** {instructions from Step 1, or "None"}

{If instructions provided:}
Apply these instructions when:
- Selecting tickets (if no ticket_id provided)
- Prioritizing work within the ticket
- Choosing development approach
- Any other context the user intended

Instructions: "{instructions}"

{If no instructions:}
(No additional instructions provided - use standard workflow)

## Step 5: Execute Development Workflow (ONE TICKET = ONE BRANCH = ONE PR)
After user selects ticket(s) to work on:

**For EACH selected ticket (process sequentially or delegate to parallel agents):**

1. **BEFORE starting work:** Request `agile-ticket-manager` to move ticket from `todo` to `in-progress` status
2. Read relevant PRD documents from `/home/tickets/claude/manager/prds/`
3. **Query `agile-ticket-manager` for full ticket details** (description, acceptance criteria, dependencies)
4. **Validate task sizing before starting** - reject any task >1 hour
5. **Create dedicated feature branch** for THIS ticket (e.g., `feature/TASK-3.2.1-implement-agent-card`)
6. Coordinate specialized agents through development workflow:
   - git-workflow-specialist creates feature branch FIRST (mandatory) with ticket ID in name
   - **Run parallel subagents within this ticket** (backend + frontend together on same branch)
   - wireframe-designer for UI mockups (if needed)
   - backend-architect for API development
   - frontend-developer for Vue/PrimeVue components
   - data-parser for configuration file parsing
   - **Developer tests their implementation manually** (quick sanity check)
   - **git-workflow-specialist commits after EACH tested sub-feature (15-30 min)** with ticket ID in message
   - **test-automation-engineer runs automated tests (MANDATORY after all sub-features complete)**
   - **If tests FAIL:** Return to developer to fix issues, re-run tests (loop until pass)
   - **If tests PASS:** Proceed to documentation and code review preparation
7. **AFTER implementation complete:** Request `agile-ticket-manager` to move ticket from `in-progress` to `review` status
8. **Continue with review preparation:**
   - documentation-engineer for documentation updates
   - code-reviewer for quality assurance (reviews implementation + test results)
9. **Ensure incremental commit chain:** developer implements + tests → git-commit (with ticket ID) → next sub-feature → test-automation-engineer → **move to review** → docs → code-review
10. **After all work complete and tests pass:** documentation-engineer → code-reviewer → git-PR
11. **Create PR for THIS ticket** - one ticket = one PR (only if automated tests passed), include ticket ID in PR title
12. **Monitor commit frequency - must see commits every 15-30 minutes**
13. **Present PR to user for code review** - ticket now in `review` status awaiting user approval

**CRITICAL: Automated testing (test-automation-engineer) is a mandatory quality gate that runs AFTER all sub-features complete but BEFORE moving to review status. Tickets cannot move to review if tests fail.**

**After all selected tickets have their PRs created:**
- STOP and present all PR URLs to user
- Ticket(s) are in `review` status awaiting user approval
- User will review code and either:
  - **APPROVE:** Orchestrator requests ticket manager to move ticket to `done` status (PR gets merged)
  - **REQUEST CHANGES:** Orchestrator requests ticket manager to move ticket back to `in-progress` (developer makes changes, cycle repeats)
- Wait for user decision before continuing

## Step 6: Deliver Results & Wait for User Review
1. Provide summary of completed work for each ticket
2. Show all PR URLs created (one per ticket)
3. Explain ticket status: "Ticket(s) moved to `review` status, awaiting your approval"
4. **STOP HERE - Do not proceed to next tickets**
5. **Wait for user review decision:**
   - **If user APPROVES:** Orchestrator requests ticket manager to move ticket(s) to `done`, then PR(s) get merged
   - **If user REQUESTS CHANGES:** Orchestrator requests ticket manager to move ticket(s) back to `in-progress`, developers make changes
6. After user provides decision on current tickets:
   - Run `/swarm` again to continue with next ticket(s)
   - Or implement requested changes on tickets returned to `in-progress`

**Key Points**:
- One ticket = One branch = One PR (always)
- Multiple tickets selected = Multiple branches = Multiple PRs (processed in sequence or parallel)
- Parallel subagents work WITHIN a single ticket's branch (backend + frontend together)
- Never combine multiple tickets into one branch/PR
- Each `/swarm` execution stops after creating PR(s) for selected ticket(s)
- **Tickets move to `review` status when PR created, awaiting user approval**
- **Tickets move to `done` only after user approval and PR merge**
- **Tickets can move back to `in-progress` if user requests changes**

The orchestrator intelligently handles both planning and execution. It proposes ticket options with dependency analysis, waits for your selection, executes work with parallel subagents where appropriate (within each ticket), creates one PR per ticket, and stops for your review.
</execution>

## Examples

### Work on specific ticket with instructions:
```
/swarm HIGH-005 Use the approval workflow for this ticket
```
- Parses: ticket_id="HIGH-005", instructions="Use the approval workflow for this ticket"
- Skips ticket options menu, goes directly to HIGH-005
- Applies instructions to development approach

### Work on specific ticket without instructions:
```
/swarm CRITICAL-001
```
- Parses: ticket_id="CRITICAL-001", instructions=None
- Skips ticket options menu, goes directly to CRITICAL-001
- Uses standard workflow

### Guide ticket selection without specifying ticket:
```
/swarm prioritize bug tickets in the options
```
- Parses: ticket_id=None, instructions="prioritize bug tickets in the options"
- Shows ticket options menu as normal
- Project manager considers instructions when presenting options

### Provide workflow instructions without ticket:
```
/swarm use rapid development strategy
```
- Parses: ticket_id=None, instructions="use rapid development strategy"
- Shows ticket options menu as normal
- Instructions applied during development workflow

### Standard behavior (show options):
```
/swarm
```
- Parses: ticket_id=None, instructions=None
- Shows ticket options menu as normal
- Standard workflow throughout
