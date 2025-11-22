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

**Objective:** Execute all tasks with validation and commits

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
   - **Developer validates changes manually** (browser, CLI, visual inspection)
   - Run targeted tests if making risky changes (optional)

3. **Developer reports completion**
   - "TASK-3.1.1 complete: Created copy-service.js with base structure. Changes validated manually."
   - Include summary of changes and validation performed

4. **Main agent updates tracking document and TodoWrite**
   - Mark task as completed with timestamp
   - Document key decisions made
   - Note any issues encountered

5. **Main agent invokes git-workflow-specialist**
   - Commit THIS TASK only with descriptive message
   - Format: `feat: create backend service structure (TASK-3.1.1)`
   - Push commit to remote

6. **Repeat for next task** (steps 1-5)

**Example Sequential Flow:**
```
00:00 - Start TASK-3.1.1 (backend-architect)
00:25 - TASK-3.1.1 complete, validated manually
00:27 - Commit "feat: create backend service structure (TASK-3.1.1)"
00:28 - Start TASK-3.1.2 (backend-architect)
00:48 - TASK-3.1.2 complete, validated manually
00:50 - Commit "feat: implement path validation (TASK-3.1.2)"
00:51 - Start TASK-3.1.3 (backend-architect)
01:16 - TASK-3.1.3 complete, validated manually
01:18 - Commit "feat: add conflict detection (TASK-3.1.3)"
```

**Note:** Comprehensive testing is deferred until Phase 4 (Code Review & Test) to avoid the bottleneck of running full test suite (1,300+ tests, 5-7 minutes) after every single task.

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
   - Each agent validates their changes manually

3. **Main agent monitors completion**
   - Wait for ALL parallel tasks to finish
   - Aggregate results from all agents
   - Confirm all tasks validated successfully

4. **Main agent invokes git-workflow-specialist**
   - **Batch commit for parallel work:** `feat: implement conflict resolver and path generator (TASK-3.1.4, TASK-3.1.5)`
   - Push commit to remote

**Example Parallel Flow:**
```
00:00 - Start TASK-3.1.4 (backend-architect-1) || TASK-3.1.5 (backend-architect-2)
00:18 - Both tasks complete (longest task determines duration)
00:20 - Batch commit "feat: implement conflict resolver and path generator (TASK-3.1.4, TASK-3.1.5)"
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

### Phase 4: Code Review & Test

**Objective:** Validate all implementation work with comprehensive testing before creating PR

**When:** After all tasks for a story are complete and committed

**Main Agent Actions:**

#### Step 1: Targeted Testing

Run tests based on files changed during implementation:

1. **Main agent analyzes changed files**
   - Use `git diff origin/phase-3...HEAD --name-only` to see all changes
   - Determine which test suite(s) to run

2. **Main agent invokes test-automation-engineer** with targeted scope:
   - **Frontend changes only** (.vue, .js in src/):
     ```bash
     npm run test:frontend
     ```
   - **Backend changes only** (src/backend/):
     ```bash
     npm run test:backend
     ```
   - **Config/mixed changes** (.claude/, settings, both frontend & backend):
     ```bash
     npm test  # Full suite
     ```

3. **Targeted tests run** (2-3 minutes instead of 5-7 minutes)
   - If failures occur: Return to developer, fix issues, re-run targeted tests only
   - Loop until targeted tests pass

#### Step 2: Full Test Suite Validation

Once targeted tests pass, validate entire system:

1. **Main agent invokes test-automation-engineer** to run comprehensive suite
   ```bash
   npm test  # All 1,300+ tests
   ```

2. **All tests must pass** before proceeding
   - **HARD GATE:** Cannot create PR with test failures
   - If failures occur: Fix and re-run full suite
   - **Exception:** Accept documented flaky tests (see Step 3)

3. **Time investment:** One-time 5-7 minute test run per story
   - Much better than 15-20 runs × 7 min = 105-140 minutes (old approach)
   - **Savings: ~100-130 minutes (1.6-2.2 hours) per story**

#### Step 3: Handle Known Flaky Tests

Some browser-specific tests may fail intermittently:

1. **Document known flaky tests** in session tracking
   - Test name, failure reason, platform-specific issues
   - Example: "Playwright screenshot tests occasionally fail on Windows WSL2"

2. **Don't block on documented flaky tests**
   - If test is in known flaky list, proceed with PR
   - Note flaky tests in PR description
   - User will review test results before merge

3. **Maintain flaky test list** in session tracking document
   - Helps future sessions identify acceptable failures
   - Prevents wasted time re-investigating same issues

**Example Targeted Testing Flow:**
```
Phase 3 Complete: All 5 tasks committed (TASK-3.1.1 through TASK-3.1.5)
↓
Check files changed: All in src/backend/services/
↓
Run targeted: npm run test:backend (2 min)
  Result: ✅ 276/276 backend tests pass
↓
Run full suite: npm test (7 min)
  Result: ✅ 1,300/1,300 tests pass
↓
Proceed to Phase 5 (Documentation)
```

**Automatic Testing Script Example:**
```bash
# Determine test scope from git diff
CHANGED_FILES=$(git diff origin/phase-3...HEAD --name-only)

if echo "$CHANGED_FILES" | grep -q "^src/.*\\.vue$\|^src/.*\\.js$" && ! echo "$CHANGED_FILES" | grep -q "^src/backend/"; then
  echo "Running frontend tests only..."
  npm run test:frontend
elif echo "$CHANGED_FILES" | grep -q "^src/backend/"; then
  echo "Running backend tests only..."
  npm run test:backend
else
  echo "Running full test suite..."
  npm test
fi
```

---

### Phase 5: Documentation Updates

**Objective:** Update project documentation to reflect new features/changes

**IMPORTANT: CHANGELOG Policy**
- CHANGELOG.md is updated ONLY when cutting a release
- Do NOT update CHANGELOG during feature development or PR creation
- Documentation updates during development should focus on:
  - README.md (if setup/usage changed)
  - API documentation (if endpoints changed)
  - Code comments and guides

**Main Agent Decision Point:**

Documentation is only needed if:
- New features added (update README, guides)
- API changes (update API documentation)
- Configuration changes (update setup guides)
- Code patterns changed (update developer guides)

If documentation updates needed:

1. **Main agent invokes documentation-engineer**
   - Specify which documents need updates
   - Provide context about changes made
   - Reference implementation details from session tracking
   - **Do NOT ask for CHANGELOG updates** (release-time only)

2. **Documentation engineer updates files**
   - README.md (if setup/usage changed)
   - API documentation (if endpoints changed)
   - Guides (if workflows changed)
   - Code comments and JSDoc (inline documentation)
   - **NOT CHANGELOG.md** (release-time only)

3. **Main agent updates session tracking document**
   - Note which documentation was updated
   - Explain rationale for changes
   - **IMPORTANT:** Main agent maintains session tracking, NOT documentation-engineer

4. **Main agent invokes git-workflow-specialist**
   - Commit documentation changes separately
   - Format: `docs: update API documentation for copy service feature (STORY-3.1)`
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
     - Testing performed (include test results from Phase 4)
     - Documentation updates
     - Any known flaky tests (if applicable)
   - Use proper PR template format
   - Push PR to remote (GitHub/GitLab)

2. **Invoke agile-ticket-manager** to update ticket status
   - Move ticket from `in-progress` to `review`
   - Update timestamp
   - Document PR number in ticket

3. **Invoke code-reviewer** for comprehensive analysis
   - Review code quality and standards compliance
   - Check for security vulnerabilities
   - Verify test coverage is adequate (tests already passed in Phase 4)
   - Ensure documentation is complete
   - Validate commit message conventions
   - Check for code duplication or tech debt

4. **Code reviewer provides feedback**
   - ✅ **Approved:** Code meets all quality standards
   - ❌ **Changes requested:** Specific issues identified

5. **If changes requested:**
   - Main agent invokes appropriate developer agent(s)
   - Developer fixes issues and validates manually
   - Main agent invokes git-workflow-specialist (commit fixes)
   - Main agent invokes test-automation-engineer (run targeted tests for fixes)
   - Tests pass → Repeat code review if needed

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
- Updated README.md with new feature descriptions
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
Targeted tests: ✅ Passing (276/276 backend tests)
Full test suite: ✅ Passing (1,300/1,300 tests)
Documentation: ✅ Updated

Note: Full test suite will run automatically in CI/CD pipeline

Ready for your final review. Please:
1. Review the PR on GitHub
2. Verify CI/CD tests pass (automatic)
3. Test functionality if desired
4. Provide merge approval

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

4. **Validate Changes During Development**
   - Developers validate changes manually (browser, CLI, visual inspection)
   - Defer comprehensive testing until Phase 4 (story completion)
   - Running full test suite after every task creates massive bottleneck

5. **Comprehensive Testing Before PR**
   - Run targeted tests first (Phase 4, Step 1)
   - Run full test suite once (Phase 4, Step 2)
   - Tests are HARD GATE - cannot create PR with failures
   - Exception: Accept documented flaky tests

6. **Ticket Status Must Be Current**
   - Update status at ALL key transitions:
     - `todo` → `in-progress` (work starts)
     - `in-progress` → `review` (implementation complete, tests pass)
     - `review` → `done` (user approves, PR merged)
     - `review` → `in-progress` (user requests changes)

7. **Git Operations Exclusively via git-workflow-specialist**
   - Developers NEVER create branches, commits, or PRs
   - All git commands go through git-workflow-specialist
   - Ensures consistency and proper conventions

8. **User Approval is Mandatory Gate**
   - Tickets cannot move to `done` without user review
   - Main agent MUST present PR to user and wait for approval
   - User has authority to request changes or approve

9. **Session Tracking is Main Agent's Responsibility**
   - Main agent creates and maintains session tracking document
   - NOT delegated to documentation-engineer
   - Must be comprehensive enough for session resumption

10. **Documentation Updates After Implementation**
    - Documentation changes happen in Phase 5
    - Always after implementation complete
    - Committed separately from implementation code

11. **TodoWrite Mirrors Session Tracking**
    - TodoWrite provides real-time status visibility
    - Updated after each milestone completion
    - Kept in sync with session tracking document

---

## Testing Strategy Guidelines

### When to Run Tests

**During Development (Phase 3 - Per Task):**
- ❌ DO NOT run full test suite after each task
- ❌ DO NOT run targeted test suite after each task
- ✅ DO validate changes manually (browser, CLI, visual inspection)
- ✅ DO run targeted tests if making particularly risky changes (optional)

**Before PR Creation (Phase 4 - Per Story):**
- ✅ Run targeted test suite based on changed files (Step 1)
- ✅ Run full test suite once as final validation (Step 2)
- ✅ Accept documented flaky tests, don't block on them (Step 3)

**Before PR Merge (Phase 7):**
- ✅ Full test suite runs automatically in CI/CD pipeline
- ✅ User reviews test results before approving merge
- ✅ Distinguish between new failures and known flaky tests

### Targeted Testing Commands

Determine which tests to run based on files changed:

```bash
# Frontend changes only (.vue, .js in src/ excluding backend)
npm run test:frontend

# Backend changes only (src/backend/)
npm run test:backend

# Mixed or config changes
npm test  # Full suite
```

**Automatic Detection Script:**
```bash
# Use git diff to determine test scope
CHANGED_FILES=$(git diff origin/phase-3...HEAD --name-only)

if echo "$CHANGED_FILES" | grep -q "^src/.*\\.vue$\|^src/.*\\.js$" && ! echo "$CHANGED_FILES" | grep -q "^src/backend/"; then
  echo "Running frontend tests only..."
  npm run test:frontend
elif echo "$CHANGED_FILES" | grep -q "^src/backend/"; then
  echo "Running backend tests only..."
  npm run test:backend
else
  echo "Running full test suite..."
  npm test
fi
```

### Time Savings Analysis

**Old Approach (Test After Every Task):**
- 5 tasks × 7 min (full suite) = 35 minutes of testing time
- Plus 15 additional test runs for fixes/iterations = 105 minutes total
- **Total: 2-2.5 hours of testing per story**

**New Approach (Test Once at Story Completion):**
- 1 targeted run (2-3 min) + 1 full run (7 min) = 10 minutes total
- Plus occasional re-runs for fixes = ~15 minutes total
- **Total: 10-15 minutes of testing per story**

**Productivity Gain:**
- **Time saved: 90-135 minutes (1.5-2.25 hours) per story**
- **Efficiency improvement: 85-90% reduction in test time**
- **Allows 3-4× faster iteration during development**

### Evidence from Real Sessions

**Workflow Analysis Session 4c65af2e (November 8, 2025):**
- First half: Ran full test suite after every task → 61% of session time spent waiting for tests
- Second half: Switched to "Rapid Development Mode" (defer testing) → Productivity increased 3-4×
- **Conclusion:** Testing after every task creates massive bottleneck that slows development

**Recommended Strategy:**
- Trust manual validation during development (Phase 3)
- Defer comprehensive testing until story completion (Phase 4)
- Run targeted tests first, then full suite once
- Accept known flaky tests to avoid analysis paralysis

---

## Integration with Other Workflows

### Relationship to Git Workflow

SWARM workflow builds on top of feature branch workflow:
- Git-workflow-specialist enforces rules from `docs/guides/GIT-WORKFLOW.md`
- Feature branches created per story/ticket
- Small, frequent commits (every 15-30 minutes)
- Pull requests required for all merges

### Relationship to Testing Strategy

Testing is strategically deferred to avoid bottlenecks:
- Developers validate manually during implementation (Phase 3)
- Targeted testing runs once after story complete (Phase 4, Step 1)
- Full test suite runs once before PR creation (Phase 4, Step 2)
- Test-automation-engineer provides quality gate before PR (Phase 4)
- CI/CD runs full suite automatically before merge (Phase 7)
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
  - documentation-engineer updates README/API docs/guides
  - code-reviewer analyzes implementation
- Result: Faster PR preparation without sacrificing quality
- Note: CHANGELOG is updated only at release time, not during PR development

**Session 0c608e8c (Ticket Manager Enhancement - November 2, 2025):**

★ **Insight:** Parallel ticket operations when independent
- Ticket status update || Requirements document retrieval
- Both operations query agile-ticket-manager independently
- Result: Immediate responses, no waiting

**Session 4c65af2e (STORY-3.6 - November 8, 2025):**

★ **Insight:** Testing after every task is a massive bottleneck
- First half: Ran full suite after every task → 61% of session time waiting for tests
- Second half: Deferred testing to story completion → Productivity increased 3-4×
- Result: Changed workflow to validate manually during development, test comprehensively at end
- Key: Full test suite (1,300+ tests, 5-7 min) is too expensive to run 15-20 times per story

**General Patterns:**

✅ **DO:**
- Break work into small tasks (30-60 min max)
- Validate changes manually during development (browser, CLI)
- Defer comprehensive testing until story completion (Phase 4)
- Run targeted tests first, then full suite once before PR
- Commit after every task completion (sequential) or batch (parallel)
- Update ticket status at every transition
- Document decisions in session tracking as they happen
- Use parallel execution when safe and beneficial
- Accept documented flaky tests to avoid blocking progress

❌ **DON'T:**
- Run full test suite after every task (massive time sink)
- Bundle multiple sequential tasks into one commit
- Skip comprehensive testing before creating PR
- Skip user approval gate before merging
- Let documentation-engineer maintain session tracking
- Parallelize when file conflicts or dependencies exist
- Create massive tasks (>1 hour is too large)
- Block on known flaky tests (document and proceed)

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
PHASE 1-2: Session Init & Git Setup
1. Invoke orchestrator (create plan)
2. Invoke ticket-manager (move to in-progress)
3. Present plan to user (get approval)
4. Invoke git-specialist (create branch)
5. Create session tracking doc
6. Create TodoWrite list

PHASE 3: Implementation (for each task)
7. Invoke developer (implement + validate manually)
8. Invoke git-specialist (commit)
9. Update tracking & TodoWrite

PHASE 4: Code Review & Test (once after all tasks)
10. Invoke test-engineer (run targeted tests)
11. Invoke test-engineer (run full test suite)
12. If failures: Return to developer, fix, re-run targeted tests, then full suite

PHASE 5: Documentation
13. Invoke documentation-engineer (if needed)
14. Invoke git-specialist (commit docs)

PHASE 6: PR Creation
15. Invoke git-specialist (create PR)
16. Invoke ticket-manager (move to review)
17. Invoke code-reviewer (analyze)

PHASE 7: User Approval & Merge
18. Present to user (wait for approval)
19. Move tracking doc to .deleted/
20. Invoke git-specialist (merge PR)
21. Invoke ticket-manager (move to done)
22. Present final summary
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

### Tests Failing in Phase 4

**Problem:** Targeted or full test suite fails after story implementation complete
**Solution:**
1. Identify which tests are failing
2. Return to Phase 3 - invoke developer to fix issues
3. Developer fixes and validates manually
4. Commit fix with descriptive message
5. Re-run targeted tests for the fix
6. If targeted tests pass, re-run full suite
7. Loop until all tests pass (or document as known flaky)
8. Only then proceed to create PR

### Known Flaky Tests

**Problem:** Same tests fail intermittently on specific platforms
**Solution:**
1. Document in session tracking: test name, platform, failure pattern
2. If test is known flaky, proceed with PR
3. Note flaky tests in PR description
4. User reviews and decides if acceptable
5. Don't waste hours debugging known flaky tests

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

**Last Updated:** November 8, 2025
**Version:** 1.1
**Status:** Official Workflow Standard
**Key Changes in v1.1:** Implemented targeted testing strategy (defer comprehensive testing to Phase 4, avoid per-task test bottleneck)
