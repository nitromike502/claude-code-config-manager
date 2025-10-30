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

## Step 1: Check for Existing Tickets
1. Check if TodoWrite tickets/tasks already exist from previous `/plan` execution
2. Review any existing tickets to understand current work scope and status
3. Determine if tickets are sufficient to proceed with development

## Step 2: Auto-Plan if Needed (ENFORCE SMALL FEATURE SIZING)
If NO tickets exist or tickets are stale/completed:
1. Assess current project state (read CLAUDE.md, git status)
2. Determine current phase and what work comes next
3. Identify appropriate PRD sections for planning
4. Create comprehensive Epic/Story/Task breakdown with TodoWrite tool:
   - **Epics**: Major feature areas (e.g., "Backend API Development", "Frontend UI Development")
   - **Stories**: User-facing features within each epic (e.g., "Project List View", "Subagent Viewer")
   - **Tasks**: Technical implementation steps for each story (e.g., "Create /api/projects endpoint")
   - **⚠️ CRITICAL: ALL tasks MUST be 30-60 minutes max**
   - **⚠️ CRITICAL: Each task must be independently testable and committable**
   - **⚠️ CRITICAL: Break down any task >1 hour into multiple sub-tasks**
5. Include agent assignments, dependencies, acceptance criteria, and phase gates
6. Reference `/home/claude/manager/docs/workflow-analysis-20251007.md` for sizing best practices

**Note**: This auto-planning mirrors the `/plan` command functionality, ensuring you can run `/swarm` at any time.

## Step 3: Ticket Selection & Dependency Analysis (PROPOSE OPTIONS TO USER)
Before starting any development work:
1. **Invoke project-manager agent** to analyze ticket dependencies and priorities
2. Project manager should:
   - Scan all pending tickets in phase directories: `docs/tickets/phase-2.2/`, `docs/tickets/phase-2.1/`, etc.
   - Look for Epics like: `PHASE-2.2-EPIC.md`, `PHASE-2.1-EPIC.md` (organized within phase subdirectories)
   - Look for individual tickets: `CRITICAL-001-*.md`, `HIGH-005-*.md`, etc. (status markers in filenames)
   - Check git status for any pending PRs awaiting merge
   - Identify ticket dependencies (which tickets block others)
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
   - Dependencies (blocks/blocked by which PRs)
   - Whether backend + frontend can work in parallel within the ticket
   - Risk level (low/medium/high)
5. **WAIT FOR USER SELECTION** - Do not proceed until user chooses an option
6. User may also specify custom ticket selection

## Step 4: Execute Development Workflow (ONE TICKET = ONE BRANCH = ONE PR)
After user selects ticket(s) to work on:

**For EACH selected ticket (process sequentially or delegate to parallel agents):**

1. Read relevant PRD documents and ticket details
2. **Validate task sizing before starting** - reject any task >1 hour
3. **Create dedicated feature branch** for THIS ticket (e.g., `feature/task-1.1.1`)
4. Coordinate specialized agents through development workflow:
   - git-workflow-specialist creates feature branch FIRST (mandatory)
   - **Run parallel subagents within this ticket** (backend + frontend together on same branch)
   - wireframe-designer for UI mockups
   - backend-architect for API development
   - frontend-developer for Vue/PrimeVue components
   - data-parser for configuration file parsing
   - **Developer tests their implementation manually** (quick sanity check)
   - **git-workflow-specialist commits after EACH tested sub-feature (15-30 min)**
   - **test-automation-engineer runs automated tests (MANDATORY after all sub-features complete)**
   - **If tests FAIL:** Return to developer to fix issues, re-run tests (loop until pass)
   - **If tests PASS:** Proceed to documentation and code review
   - documentation-engineer for documentation updates
   - code-reviewer for quality assurance (reviews implementation + test results)
5. **Ensure incremental commit chain:** developer implements + tests → git-commit → next sub-feature → test-automation-engineer → docs → code-review
6. **After all work complete and tests pass:** documentation-engineer → code-reviewer → git-PR
7. **Create PR for THIS ticket** - one ticket = one PR (only if automated tests passed)
8. **Mark ticket as "pending PR review"**
9. **Monitor commit frequency - must see commits every 15-30 minutes**

**CRITICAL: Automated testing (test-automation-engineer) is a mandatory quality gate that runs AFTER all sub-features complete but BEFORE PR creation. PRs cannot be created if tests fail.**

**After all selected tickets have their PRs created:**
- STOP and present all PR URLs to user
- Wait for user approval/merge before continuing

## Step 5: Deliver Results & Wait for PR Approval
1. Provide summary of completed work for each ticket
2. Show all PR URLs created (one per ticket)
3. Explain which tickets are complete and awaiting review
4. **STOP HERE - Do not proceed to next tickets**
5. User will review and merge PRs, then:
   - Run `/swarm` again to continue with next ticket(s)
   - Or request changes on specific PRs

**Key Points**:
- One ticket = One branch = One PR (always)
- Multiple tickets selected = Multiple branches = Multiple PRs (processed in sequence or parallel)
- Parallel subagents work WITHIN a single ticket's branch (backend + frontend together)
- Never combine multiple tickets into one branch/PR
- Each `/swarm` execution stops after creating PR(s) for selected ticket(s)

The orchestrator intelligently handles both planning and execution. It proposes ticket options with dependency analysis, waits for your selection, executes work with parallel subagents where appropriate (within each ticket), creates one PR per ticket, and stops for your review.
</execution>
