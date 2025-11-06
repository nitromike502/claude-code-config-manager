# SWARM Workflow Guide

## Overview

**SWARM** stands for **Specialized Workflow with Autonomous Resource Management** - a coordinated multi-agent development methodology used in the Claude Code Manager project to execute complex software development tasks efficiently and systematically.

### Architecture Philosophy

The SWARM workflow is built on three foundational principles:

1. **Centralized Coordination:** Only the main agent invokes subagents - this prevents chaos and maintains clear command structure
2. **Specialized Expertise:** Each subagent has a specific domain of expertise and does not perform operations outside their scope
3. **Systematic Progress:** Work flows through defined phases with clear gates, handoffs, and quality checkpoints

### Core Components

**Main Agent:**
- Central coordinator for all subagent invocations
- Implements execution plans created by the orchestrator
- Maintains session tracking documents
- Makes final decisions on parallelization and workflow
- Updates TodoWrite task lists

**Subagent Orchestrator:**
- Creates execution plans and identifies dependencies
- Recommends parallel vs. sequential execution
- Provides workflow recommendations
- **DOES NOT invoke other subagents** (only main agent can do this)

**Agile Ticket Manager:**
- Acts like an API/ticketing system (similar to Jira or Azure DevOps)
- Retrieves tickets and manages status transitions
- Maintains ticket hierarchy (Epic → Story → Task)
- Responds to queries from main agent and orchestrator

**Git Workflow Specialist:**
- Handles ALL git operations (branches, commits, PRs, merges)
- Enforces git best practices and commit conventions
- Developers NEVER perform git operations directly

**Development Agents:**
- backend-architect, frontend-developer, data-parser
- Focus exclusively on implementation
- Test their changes immediately
- Do NOT perform git operations

**Quality & Documentation Agents:**
- test-automation-engineer, code-reviewer, documentation-engineer
- Provide quality gates and documentation updates
- Work can often be parallelized with each other

## Complete SWARM Workflow

### Phase 0: Pre-SWARM Ticket Selection

Before invoking SWARM, determine what work to execute:

#### Option A: Enhanced `/project-status` Command

If NOT currently working on a ticket:
1. Main agent invokes `agile-ticket-manager` to retrieve available tickets
2. Main agent invokes `project-manager` to get recommendations based on priorities
3. Present options to user with context (priority, dependencies, estimates)
4. User selects ticket(s) to work on
5. User then runs `/swarm <ticket-id>`

If already working on a ticket:
1. Show current status (ticket ID, progress, blockers)
2. Offer options: continue current ticket, switch to different ticket, or finish current work
3. User makes decision

#### Option B: Direct SWARM Invocation

When user already knows the ticket:
```bash
/swarm STORY-3.1 "Focus on backend services first"
```

Main agent immediately begins workflow with specified ticket.

---

### Phase 1: Session Initialization & Planning

**Objective:** Create comprehensive execution plan and prepare session tracking

**Main Agent Actions:**

1. **Invoke subagent-orchestrator** with ticket context
   - Orchestrator analyzes ticket requirements
   - Creates detailed task breakdown
   - Identifies dependencies between tasks
   - Recommends parallel vs. sequential execution
   - Assesses risks and suggests mitigations

2. **Invoke agile-ticket-manager** to fetch full ticket details
   - Retrieve ticket content and acceptance criteria
   - Update ticket status from `todo` to `in-progress`
   - Document start timestamp

3. **Present plan to user** for approval
   - Show task breakdown with time estimates
   - Highlight parallelization opportunities
   - Explain dependencies and sequencing
   - Request approval or refinements

4. **User provides feedback**
   - Approve plan as-is
   - Request modifications (adjust priorities, add tasks, clarify requirements)
   - Main agent updates plan accordingly

**Orchestrator Deliverable:**
```markdown
## Execution Plan for STORY-3.1

### Task Breakdown
1. TASK-3.1.1: Create backend service structure (30 min)
   - Subagent: backend-architect
   - Dependencies: None
   - Files: src/backend/services/copy-service.js

2. TASK-3.1.2: Implement path validation (20 min)
   - Subagent: backend-architect
   - Dependencies: TASK-3.1.1
   - Files: src/backend/services/path-validator.js

3. TASK-3.1.3: Add conflict detection (25 min)
   - Subagent: backend-architect
   - Dependencies: TASK-3.1.1
   - Files: src/backend/services/conflict-detector.js

### Parallelization Opportunities
❌ Tasks 3.1.1-3.1.3 must be sequential (all edit copy-service.js)
✅ Tests + documentation can run in parallel after implementation

### Risk Assessment
- Risk: File system permissions on different platforms
- Mitigation: Include comprehensive error handling and test on Windows/Mac/Linux
```

---

### Phase 2: Git & Session Setup

**Objective:** Prepare git environment and create session tracking document

**Main Agent Actions:**

1. **Invoke git-workflow-specialist** for branch management
   - Checkout phase branch (e.g., `phase-3`)
   - Pull latest changes from remote
   - Create feature branch: `feature/story-3.1-copy-logic`
   - Push feature branch to remote with `-u` flag

2. **Main agent creates session tracking document**
   - Location: `docs/sessions/tracking/SESSION-STORY-3.1-2025-11-03.md`
   - Use comprehensive template from `.claude/templates/session-tracking-template.md`
   - Include all plan details from orchestrator
   - Initialize with current timestamp and git context
   - **CRITICAL:** This document must be detailed enough to resume session at any point

3. **Main agent creates TodoWrite task list**
   - Mirror the structure from tracking document
   - Provides real-time status visibility
   - Updated after each milestone completion

**Session Tracking Document Structure:**
```markdown
# Session Tracking: STORY-3.1 - Backend Copy Service Infrastructure

**Created:** 2025-11-03 14:23:00
**Branch:** feature/story-3.1-copy-logic
**Parent Branch:** phase-3
**Status:** in-progress

## Execution Plan (from Orchestrator)
[Full plan details...]

## Task Breakdown & Status
### ⏳ Pending Tasks
- TASK-3.1.1: Create backend service structure
- TASK-3.1.2: Implement path validation
- TASK-3.1.3: Add conflict detection

## Critical Context for Session Resumption
[Detailed context that allows fresh session to continue work...]
```

---

### Phase 3: Implementation

**Objective:** Execute all tasks with proper testing and commits

**Main Agent Coordinates Based on Orchestrator Recommendations:**

#### Sequential Execution (Default)

When tasks have dependencies or modify same files:

**For each task:**

1. **Main agent invokes appropriate developer agent** (e.g., `backend-architect`)
   - Provide clear task scope and acceptance criteria
   - Reference session tracking document for context
   - Specify which files to modify

2. **Developer implements task**
   - Focus on single task only
   - Write implementation code
   - Create or update tests for this specific task
   - **Developer tests immediately** (do NOT wait for separate test phase)

3. **Developer reports completion**
   - "TASK-3.1.1 complete: Created copy-service.js with base structure. All tests passing."
   - Include summary of changes and test results

4. **Main agent updates tracking document and TodoWrite**
   - Mark task as completed with timestamp
   - Document key decisions made
   - Note any issues encountered

5. **Main agent invokes test-automation-engineer**
   - Run full test suite (backend + frontend)
   - Verify no regressions introduced
   - **HARD GATE:** If tests fail, return to developer to fix (loop until pass)

6. **Tests pass → Main agent invokes git-workflow-specialist**
   - Commit THIS TASK only with descriptive message
   - Format: `feat: create backend service structure (TASK-3.1.1)`
   - Push commit to remote

7. **Repeat for next task** (steps 1-6)

**Example Sequential Flow:**
```
00:00 - Start TASK-3.1.1 (backend-architect)
00:25 - TASK-3.1.1 complete, tests pass
00:27 - Commit "feat: create backend service structure (TASK-3.1.1)"
00:28 - Start TASK-3.1.2 (backend-architect)
00:48 - TASK-3.1.2 complete, tests pass
00:50 - Commit "feat: implement path validation (TASK-3.1.2)"
00:51 - Start TASK-3.1.3 (backend-architect)
01:16 - TASK-3.1.3 complete, tests pass
01:18 - Commit "feat: add conflict detection (TASK-3.1.3)"
```

#### Parallel Execution (When Safe)

When orchestrator recommends AND main agent agrees (independent files/concerns):

**Main agent launches multiple developer agents simultaneously:**

1. **Main agent invokes multiple agents in parallel** (single message with multiple invocations)
   ```
   Invoking:
   - backend-architect for TASK-3.1.4 (conflict-resolver.js)
   - backend-architect for TASK-3.1.5 (unique-path-generator.js)
   ```

2. **Each agent works independently**
   - No file conflicts (different files)
   - No logical dependencies
   - Each agent tests their own changes

3. **Main agent monitors completion**
   - Wait for ALL parallel tasks to finish
   - Aggregate results from all agents
   - Verify all tests pass

4. **Main agent invokes test-automation-engineer**
   - Run full test suite with ALL changes
   - **HARD GATE:** If any tests fail, return to appropriate developer

5. **All tests pass → Main agent invokes git-workflow-specialist**
   - **Batch commit for parallel work:** `feat: implement conflict resolver and path generator (TASK-3.1.4, TASK-3.1.5)`
   - Push commit to remote

**Example Parallel Flow:**
```
00:00 - Start TASK-3.1.4 (backend-architect-1) || TASK-3.1.5 (backend-architect-2)
00:18 - Both tasks complete (longest task determines duration)
00:20 - Run full test suite (all tests pass)
00:22 - Batch commit "feat: implement conflict resolver and path generator (TASK-3.1.4, TASK-3.1.5)"
```

**Time Savings:**
- Sequential: 20 min (Task A) + 18 min (Task B) = 38 minutes
- Parallel: 20 min (longest task) = 20 minutes
- **Efficiency gain: 47% reduction**

**See:** `docs/guides/PARALLEL-EXECUTION-GUIDE.md` for detailed parallelization patterns

#### Main Agent Updates Throughout Implementation

After each milestone (task or parallel batch):
- Update session tracking document with completed work
- Document any decisions or issues encountered
- Update TodoWrite to reflect current status
- Note remaining work and next steps

---

### Phase 4: Commit Code Changes

**Objective:** Persist all implementation work to git with proper commit structure

This phase is integrated into Phase 3 (commits happen after each task/batch completion), but represents a distinct workflow step that git-workflow-specialist owns.

**Git Workflow Specialist Responsibilities:**

1. **Verify working directory is clean** before commit
2. **Stage appropriate files** (only files related to current task)
3. **Create commit with proper format**
   - Conventional commits format: `type: description (TASK-ID)`
   - Include ticket reference in every commit message
4. **Push to remote** immediately after commit
5. **Confirm push succeeded** before returning control

**Main Agent Updates:**
- Document commit hash in session tracking document
- Update git history section with commit message
- Verify ticket ID is properly referenced

---

### Phase 5: Documentation Updates

**Objective:** Update project documentation to reflect new features/changes

**Main Agent Decision Point:**

Documentation is only needed if:
- New features added (update README, guides)
- API changes (update API documentation)
- Breaking changes (update CHANGELOG)
- Configuration changes (update setup guides)

If documentation updates needed:

1. **Main agent invokes documentation-engineer**
   - Specify which documents need updates
   - Provide context about changes made
   - Reference implementation details from session tracking

2. **Documentation engineer updates files**
   - CHANGELOG.md (follows Keep a Changelog format)
   - README.md (if setup/usage changed)
   - API documentation (if endpoints changed)
   - Guides (if workflows changed)

3. **Main agent updates session tracking document**
   - Note which documentation was updated
   - Explain rationale for changes
   - **IMPORTANT:** Main agent maintains session tracking, NOT documentation-engineer

4. **Main agent invokes git-workflow-specialist**
   - Commit documentation changes separately
   - Format: `docs: update CHANGELOG for copy service feature (STORY-3.1)`
   - Push to remote

**Note on Session Tracking Document:**
The `docs/sessions/tracking/SESSION-*.md` file is NOT maintained by documentation-engineer. Main agent creates and maintains this file throughout the workflow as a working document for session continuity.

---

### Phase 6: PR Creation & Code Review

**Objective:** Create pull request and conduct comprehensive code review

**Main Agent Actions:**

1. **Invoke git-workflow-specialist** to create pull request
   - Generate PR title from ticket information
   - Create comprehensive PR body with:
     - Summary of changes
     - List of completed tasks
     - Testing performed
     - Documentation updates
   - Use proper PR template format
   - Push PR to remote (GitHub/GitLab)

2. **Invoke agile-ticket-manager** to update ticket status
   - Move ticket from `in-progress` to `review`
   - Update timestamp
   - Document PR number in ticket

3. **Invoke code-reviewer** for comprehensive analysis
   - Review code quality and standards compliance
   - Check for security vulnerabilities
   - Verify test coverage is adequate
   - Ensure documentation is complete
   - Validate commit message conventions
   - Check for code duplication or tech debt

4. **Code reviewer provides feedback**
   - ✅ **Approved:** Code meets all quality standards
   - ❌ **Changes requested:** Specific issues identified

5. **If changes requested:**
   - Main agent invokes appropriate developer agent(s)
   - Developer fixes issues
   - Main agent invokes test-automation-engineer
   - Tests pass → Main agent invokes git-workflow-specialist (commit fixes)
   - Repeat code review if needed

6. **Code approved → Main agent invokes agile-ticket-manager**
   - Move ticket to `approved` status (sub-status of `review`)
   - Document reviewer approval in ticket

**PR Format Example:**
```markdown
## Summary
Implemented backend copy service infrastructure for Story 3.1, including path validation, conflict detection, and resolution strategies.

## Changes Made
- Created copy-service.js with base structure (TASK-3.1.1)
- Implemented path validation service (TASK-3.1.2)
- Added conflict detection logic (TASK-3.1.3)
- Implemented conflict resolution strategies (TASK-3.1.4)
- Created unique path generator (TASK-3.1.5)

## Testing Performed
- ✅ All 276 backend tests passing
- ✅ All 603 frontend tests passing
- ✅ New tests added for all services
- ✅ No regressions introduced

## Documentation Updates
- Updated CHANGELOG.md with new features
- Added API documentation for copy service endpoints

## Related Tickets
Closes STORY-3.1
```

---

### Phase 7: User Approval & Merge

**Objective:** Obtain user approval and merge PR to complete ticket lifecycle

**Main Agent Presents to User:**

```
PR #63 created: "feat(copy): Backend Copy Service Infrastructure (STORY-3.1)"
URL: https://github.com/user/repo/pull/63

Code review: ✅ Approved
All tests: ✅ Passing (879/879)
Documentation: ✅ Updated

Ready for your final review. Please:
1. Review the PR on GitHub
2. Test functionality if desired
3. Provide merge approval

Reply with "approved" to merge, or provide feedback for changes.
```

**User Decision:**

**Option A: User Approves**

1. **Main agent moves session tracking doc to archive**
   - Move `docs/sessions/tracking/SESSION-STORY-3.1-2025-11-03.md` to `.deleted/docs/sessions/tracking/`
   - Preserves git history and allows recovery if needed
   - Use `git mv` (not direct file deletion)

2. **Main agent invokes git-workflow-specialist**
   - Commit tracking doc removal: `chore: archive session tracking for STORY-3.1`
   - Push commit

3. **Main agent invokes git-workflow-specialist** to merge PR
   - Squash-merge PR to phase branch
   - Delete feature branch (local and remote)
   - Checkout phase branch
   - Pull latest changes

4. **Main agent invokes agile-ticket-manager**
   - Move ticket from `review` to `done`
   - Update completion timestamp
   - Document merge commit hash

5. **Main agent presents final summary**
   ```
   ✅ STORY-3.1 Complete!

   Merged: PR #63 → phase-3 branch
   Commits: 5 tasks, 1 documentation update
   Tests: 879/879 passing (100%)
   Time: 2.5 hours

   Next available work:
   - STORY-3.2: Frontend copy UI components (todo)
   - STORY-3.3: Copy operation testing (todo)
   ```

**Option B: User Requests Changes**

1. **Main agent invokes agile-ticket-manager**
   - Move ticket from `review` back to `in-progress`
   - Document feedback in ticket

2. **Main agent updates session tracking document**
   - Add user feedback section
   - Document requested changes
   - Update status to "in-progress (revision)"

3. **Return to Phase 3** with revised requirements
   - Implement requested changes
   - Follow same workflow (implement → test → commit)
   - Return to Phase 6 for new code review

---

## Critical Workflow Rules

### Mandatory Practices

1. **Only Main Agent Invokes Subagents**
   - Orchestrator creates plans but does NOT invoke other agents
   - This prevents chaos and maintains clear command structure

2. **One Commit Per Task (Sequential Work)**
   - Each task completion triggers immediate commit
   - Commit message MUST reference ticket ID
   - Never bundle multiple sequential tasks into one commit

3. **Batch Commit for Parallel Work**
   - When tasks execute in parallel, use single batch commit
   - Commit message references all task IDs involved
   - Only valid when tasks truly executed simultaneously

4. **Test Immediately After Each Task**
   - Developers test their implementation before declaring complete
   - Full test suite runs before each commit
   - Tests are HARD GATE - code cannot progress with failures

5. **Ticket Status Must Be Current**
   - Update status at ALL key transitions:
     - `todo` → `in-progress` (work starts)
     - `in-progress` → `review` (implementation complete, tests pass)
     - `review` → `done` (user approves, PR merged)
     - `review` → `in-progress` (user requests changes)

6. **Git Operations Exclusively via git-workflow-specialist**
   - Developers NEVER create branches, commits, or PRs
   - All git commands go through git-workflow-specialist
   - Ensures consistency and proper conventions

7. **User Approval is Mandatory Gate**
   - Tickets cannot move to `done` without user review
   - Main agent MUST present PR to user and wait for approval
   - User has authority to request changes or approve

8. **Session Tracking is Main Agent's Responsibility**
   - Main agent creates and maintains session tracking document
   - NOT delegated to documentation-engineer
   - Must be comprehensive enough for session resumption

9. **Documentation Updates After Implementation**
   - Documentation changes happen in Phase 5
   - Always after implementation complete
   - Committed separately from implementation code

10. **TodoWrite Mirrors Session Tracking**
    - TodoWrite provides real-time status visibility
    - Updated after each milestone completion
    - Kept in sync with session tracking document

---

## Integration with Other Workflows

### Relationship to Git Workflow

SWARM workflow builds on top of feature branch workflow:
- Git-workflow-specialist enforces rules from `docs/guides/GIT-WORKFLOW.md`
- Feature branches created per story/ticket
- Small, frequent commits (every 15-30 minutes)
- Pull requests required for all merges

### Relationship to Testing Strategy

Testing is integrated throughout SWARM:
- Developers test immediately after implementation (Phase 3)
- Full test suite runs before each commit (Phase 3)
- Test-automation-engineer provides quality gate (Phase 3)
- See `docs/guides/TESTING-GUIDE.md` for test conventions

### Relationship to Ticket Manager

Agile-ticket-manager acts as API for ticket operations:
- Orchestrator queries for available tickets
- Main agent requests status updates
- Maintains Epic → Story → Task hierarchy
- See `docs/guides/TICKET-MANAGER-INTEGRATION.md` for patterns

---

## Best Practices & Lessons Learned

### From Exemplary Sessions

**Session ff4ab482 (STORY-3.1 - November 2, 2025):**

★ **Insight:** Parallel execution for independent test file fixes
- Two test files with unrelated failures
- Executed fixes in parallel: `resolveConflict.test.js` || `generateUniquePath.test.js`
- Result: 50% time reduction compared to sequential approach
- Key: No file conflicts, no logical dependencies

★ **Insight:** Parallel documentation + code review at end
- After implementation complete, two activities can run simultaneously:
  - documentation-engineer updates CHANGELOG/README
  - code-reviewer analyzes implementation
- Result: Faster PR preparation without sacrificing quality

**Session 0c608e8c (Ticket Manager Enhancement - November 2, 2025):**

★ **Insight:** Parallel ticket operations when independent
- Ticket status update || Requirements document retrieval
- Both operations query agile-ticket-manager independently
- Result: Immediate responses, no waiting

**General Patterns:**

✅ **DO:**
- Break work into small tasks (30-60 min max)
- Test immediately after each task implementation
- Commit after every task completion (sequential) or batch (parallel)
- Update ticket status at every transition
- Document decisions in session tracking as they happen
- Use parallel execution when safe and beneficial

❌ **DON'T:**
- Bundle multiple sequential tasks into one commit
- Wait until end to run tests (test continuously)
- Skip user approval gate before merging
- Let documentation-engineer maintain session tracking
- Parallelize when file conflicts or dependencies exist
- Create massive tasks (>1 hour is too large)

---

## Quick Reference Commands

### Starting SWARM Workflow
```bash
# Check project status and get recommendations
/project-status

# Direct SWARM invocation with ticket
/swarm STORY-3.2 "Focus on responsive design"
```

### During SWARM Session

**Main Agent Pattern:**
```
1. Invoke orchestrator (create plan)
2. Invoke ticket-manager (move to in-progress)
3. Present plan to user (get approval)
4. Invoke git-specialist (create branch)
5. Create session tracking doc
6. Create TodoWrite list
7. For each task:
   - Invoke developer (implement)
   - Invoke test-engineer (verify)
   - Invoke git-specialist (commit)
   - Update tracking & TodoWrite
8. Invoke documentation-engineer (if needed)
9. Invoke git-specialist (commit docs)
10. Invoke git-specialist (create PR)
11. Invoke ticket-manager (move to review)
12. Invoke code-reviewer (analyze)
13. Present to user (wait for approval)
14. Move tracking doc to .deleted/
15. Invoke git-specialist (merge PR)
16. Invoke ticket-manager (move to done)
17. Present final summary
```

---

## Related Documentation

- **Git Workflow:** `docs/guides/GIT-WORKFLOW.md` - Feature branch workflow and commit conventions
- **Testing Guide:** `docs/guides/TESTING-GUIDE.md` - Test execution and quality gates
- **Parallel Execution:** `docs/guides/PARALLEL-EXECUTION-GUIDE.md` - When and how to parallelize
- **Ticket Integration:** `docs/guides/TICKET-MANAGER-INTEGRATION.md` - Working with agile-ticket-manager
- **Development Strategies:** `docs/guides/DEVELOPMENT-STRATEGIES.md` - Choosing workflow strategies

---

## Troubleshooting

### Session Context Running Low

**Problem:** Mid-session, context window fills up
**Solution:**
1. Save current state to session tracking document
2. Start fresh session
3. Read session tracking document to resume
4. Continue from last documented state

### Tests Failing After Task Completion

**Problem:** Developer reports task complete but test-automation-engineer finds failures
**Solution:**
1. Do NOT commit - tests are HARD GATE
2. Return task to developer with specific test failures
3. Developer fixes issues and re-tests
4. Loop until all tests pass
5. Only then proceed to commit

### User Unavailable for Approval

**Problem:** PR in review status but user not responding
**Solution:**
1. Leave ticket in `review` status
2. Document wait state in session tracking
3. Move to different ticket if user wants to continue work
4. Return to complete merge when user approves

### Parallel Execution Caused Conflicts

**Problem:** Thought tasks were independent but merge conflicts occurred
**Solution:**
1. This indicates incorrect parallelization decision
2. Resolve conflicts manually
3. Document lesson learned in session tracking
4. Update orchestrator's analysis for similar future tasks
5. Be more conservative with parallelization decisions

---

**Last Updated:** November 3, 2025
**Version:** 1.0
**Status:** Official Workflow Standard
