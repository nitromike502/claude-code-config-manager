# Session Tracking: [TICKET-ID] - [Feature Name]

**Created:** [YYYY-MM-DD HH:MM:SS]
**Branch:** [feature-branch-name]
**Parent Branch:** [phase-branch-name]
**Status:** [in-progress | blocked | testing | review | complete]

---

## Ticket Details

**ID:** [TICKET-ID]
**Type:** [Epic | Story | Task | Bug]
**Priority:** [P0 | P1 | P2 | P3]
**Estimate:** [time-estimate]

**Objective:**
[Clear, concise statement of what this ticket accomplishes]

**Acceptance Criteria:**
- [ ] Criterion 1: [Specific, measurable outcome]
- [ ] Criterion 2: [Specific, measurable outcome]
- [ ] Criterion 3: [Specific, measurable outcome]

---

## Execution Plan (from Orchestrator)

### Identified Tasks

#### TASK-X.X.1: [Task Description]
- **Subagent:** [agent-name]
- **Files:** [list of files to modify/create]
- **Dependencies:** [List dependencies or "None"]
- **Estimated Time:** [XX minutes]
- **Acceptance Criteria:**
  - [ ] [Specific criterion 1]
  - [ ] [Specific criterion 2]

#### TASK-X.X.2: [Task Description]
- **Subagent:** [agent-name]
- **Files:** [list of files to modify/create]
- **Dependencies:** [TASK-X.X.1 or "None"]
- **Estimated Time:** [XX minutes]
- **Acceptance Criteria:**
  - [ ] [Specific criterion 1]
  - [ ] [Specific criterion 2]

### Parallelization Opportunities

**Analysis:**
- Tasks X and Y can run in parallel because: [reason - independent files, no dependencies]
- Tasks A and B must run sequentially because: [reason - same file edits, logical dependencies]

**Decisions:**
- ✅ Parallel: TASK-X.X.4 || TASK-X.X.5 (independent services, 47% time savings)
- ❌ Sequential: TASK-X.X.1 → TASK-X.X.2 → TASK-X.X.3 (same file, dependencies)

### Risk Assessment

**Risk 1: [Description]**
- **Impact:** [High | Medium | Low]
- **Mitigation:** [Specific strategy to address risk]

**Risk 2: [Description]**
- **Impact:** [High | Medium | Low]
- **Mitigation:** [Specific strategy to address risk]

---

## Task Breakdown & Status

### ✅ Completed Tasks

#### TASK-X.X.1: [Task Description]
- **Started:** [YYYY-MM-DD HH:MM:SS]
- **Completed:** [YYYY-MM-DD HH:MM:SS]
- **Duration:** [actual time taken]
- **Subagent:** [agent-name]

**Changes Made:**
- Created: `path/to/new-file.js` (description of file)
- Modified: `path/to/existing-file.js` (what changed)
- Added tests: `tests/path/to/test-file.test.js` (XX tests)

**Implementation Details:**
- [Key technical decision 1 and rationale]
- [Key technical decision 2 and rationale]
- [Important implementation note]

**Decisions Made:**
- **Decision:** [What was decided]
  - **Rationale:** [Why this approach was chosen]
  - **Alternatives Considered:** [Other options that were rejected and why]
  - **Impact:** [How this affects the implementation]

**Issues Encountered:**
- **Issue:** [Problem description]
  - **Resolution:** [How it was fixed]
  - **Time Impact:** [Additional time required]
  - **Lessons Learned:** [What to do differently next time]

**Tests:**
- Backend: [XX/XX passing] or [N/A]
- Frontend: [XX/XX passing] or [N/A]
- New tests added: [count and description]

**Git:**
- Commit: `[commit-hash]` - "[commit message]"

---

#### TASK-X.X.2: [Task Description]
- **Started:** [YYYY-MM-DD HH:MM:SS]
- **Completed:** [YYYY-MM-DD HH:MM:SS]
- **Duration:** [actual time taken]
- **Subagent:** [agent-name]

[Repeat same structure as TASK-X.X.1 above]

---

### 🔄 In Progress Tasks

#### TASK-X.X.3: [Task Description]
- **Started:** [YYYY-MM-DD HH:MM:SS]
- **Current Status:** [Brief status update]
- **Subagent:** [agent-name]

**Progress:**
- [What has been completed so far]
- [What is currently being worked on]
- [What remains to be done]

**Current State:**
- What works: [Functionality that is working]
- What doesn't work: [Known issues or incomplete features]
- Blockers: [Any blockers preventing progress]

**Next Steps:**
1. [Immediate next action]
2. [Following action]
3. [Subsequent action]

---

### ⏳ Pending Tasks

#### TASK-X.X.4: [Task Description]
- **Subagent:** [agent-name]
- **Dependencies:** [What must be complete before this can start]
- **Preparation Needed:** [Any setup required before starting]
- **Estimated Time:** [XX minutes]

---

## Parallelization Log

### Parallel Execution #1: [Description]

**Tasks Executed:** TASK-X.X.4 || TASK-X.X.5

**Decision:**
- **Recommended By:** [Orchestrator | Main Agent | User]
- **Rationale:** [Why parallel execution was chosen]
- **Risk Assessment:** [Low | Medium | High] - [Brief explanation]

**Execution:**
- **Started:** [YYYY-MM-DD HH:MM:SS]
- **Task A (TASK-X.X.4):** Completed in [XX] minutes
- **Task B (TASK-X.X.5):** Completed in [XX] minutes
- **Total Duration:** [XX] minutes (longest task)
- **Sequential Would Have Been:** [XX] minutes
- **Time Savings:** [XX]% reduction

**Results:**
- ✅ Success - No conflicts, all tests passing
- ❌ Issues - [Description of problems encountered]

**Commit:**
- Batch commit: `[commit-hash]` - "[commit message referencing both task IDs]"

**Lessons Learned:**
- [What worked well]
- [What could be improved]
- [Recommendations for similar future parallelization]

---

## Test Results

### Backend Tests (Jest)
- **Suite:** `npm run test:backend`
- **Total Tests:** [XXX]
- **Passing:** [XXX]
- **Failing:** [XXX]
- **Execution Time:** [XX.XX seconds]
- **Coverage:** [XX%] (if applicable)

**New Tests Added:**
- `tests/backend/path/to/test1.test.js` - [XX tests] - [Description]
- `tests/backend/path/to/test2.test.js` - [XX tests] - [Description]

**Failed Tests (if any):**
- [Test name]: [Failure reason] - [Resolution status]

---

### Frontend Tests (Playwright)
- **Suite:** `npm run test:frontend`
- **Total Tests:** [XXX]
- **Passing:** [XXX]
- **Failing:** [XXX]
- **Execution Time:** [XX.XX seconds]

**Test Breakdown:**
- Component Tests (01-99): [XX/XX passing]
- E2E Tests (100-199): [XX/XX passing]
- Responsive Tests (200-299): [XX/XX passing]
- Visual Tests (300-399): [XX/XX passing]

**New Tests Added:**
- `tests/frontend/XX-test-name.spec.js` - [Description]

**Failed Tests (if any):**
- [Test name]: [Failure reason] - [Resolution status]

---

### Test Summary
- **Last Full Test Run:** [YYYY-MM-DD HH:MM:SS]
- **Overall Status:** ✅ All passing | ❌ [X] failures
- **Quality Gate:** ✅ Passed | ❌ Blocked (cannot proceed to PR)

---

## Documentation Updates

### CHANGELOG.md
**Section:** [Added | Changed | Fixed | Deprecated]
**Entry:**
```markdown
### [Version] - [YYYY-MM-DD]
#### [Section]
- [Description of change with reference to ticket ID]
```

**Rationale:** [Why this change was documented in CHANGELOG]

---

### README.md
**Section:** [Section name]
**Changes:** [Brief description of what was updated]
**Rationale:** [Why this documentation was needed]

---

### API Documentation
**Endpoint:** [Endpoint path or section]
**Changes:** [Brief description of what was updated]
**Rationale:** [Why this documentation was needed]

---

### Other Documentation
- **File:** `path/to/doc.md`
- **Changes:** [Brief description]
- **Rationale:** [Why needed]

---

## Git History

### Commits (Chronological)

1. **[commit-hash]** - `[commit message]` ([YYYY-MM-DD HH:MM:SS])
   - Task: [TASK-ID]
   - Files: [count] files changed
   - Type: [feat | fix | docs | chore | test | refactor]

2. **[commit-hash]** - `[commit message]` ([YYYY-MM-DD HH:MM:SS])
   - Task: [TASK-ID]
   - Files: [count] files changed
   - Type: [feat | fix | docs | chore | test | refactor]

---

### PR Details

**PR Number:** #[number]
**Title:** [PR title]
**URL:** [GitHub/GitLab URL]
**Status:** [Draft | Open | Review | Approved | Merged | Changes Requested]
**Created:** [YYYY-MM-DD HH:MM:SS]
**Merged:** [YYYY-MM-DD HH:MM:SS] or [N/A]

**Summary:**
[Brief summary of what the PR accomplishes]

**Changes Made:**
- [Change 1]
- [Change 2]
- [Change 3]

**Reviewer Feedback:**
- **Reviewer:** [Reviewer name/role]
- **Status:** [Approved | Changes Requested]
- **Comments:**
  - [Feedback item 1]
  - [Feedback item 2]
- **Resolution:** [How feedback was addressed]

**Merge Details:**
- **Merge Type:** [Squash | Merge | Rebase]
- **Target Branch:** [branch-name]
- **Final Commit:** [commit-hash]

---

## Critical Context for Session Resumption

> **PURPOSE:** This section must contain enough detail for a fresh Claude session to continue work seamlessly if context runs low mid-session. Read this section carefully to understand exactly where things stand.

### What Has Been Completed

**High-Level Summary:**
[2-3 sentence overview of what has been accomplished so far]

**Detailed Breakdown:**
1. **[Component/Feature 1]:** [What was built, how it works, key decisions]
2. **[Component/Feature 2]:** [What was built, how it works, key decisions]
3. **[Component/Feature 3]:** [What was built, how it works, key decisions]

**Integration Points:**
- [How components integrate with each other]
- [External dependencies and their state]
- [Data flow between components]

---

### What Needs To Be Done Next

**Immediate Next Steps (in order):**
1. **[Step 1]:** [Detailed description with enough context to start immediately]
   - Files to modify: [list]
   - Expected outcome: [what success looks like]
   - Estimated time: [XX minutes]

2. **[Step 2]:** [Detailed description with enough context to start immediately]
   - Files to modify: [list]
   - Expected outcome: [what success looks like]
   - Estimated time: [XX minutes]

3. **[Step 3]:** [Detailed description with enough context to start immediately]
   - Files to modify: [list]
   - Expected outcome: [what success looks like]
   - Estimated time: [XX minutes]

**Remaining Work:**
- [Task or component still to complete]
- [Task or component still to complete]

---

### Known Issues / Blockers

#### Issue 1: [Issue Description]
- **Severity:** [Critical | High | Medium | Low]
- **Impact:** [How this affects progress]
- **Current Status:** [Investigation | Fixing | Waiting for dependency]
- **Potential Solutions:** [Ideas for resolution]
- **Workarounds:** [Temporary measures if available]

#### Issue 2: [Issue Description]
[Repeat structure above]

---

### Key Decisions & Rationale

> **PURPOSE:** Document architectural and implementation decisions so future work aligns with these choices.

#### Decision 1: [Decision Title]
- **Decision:** [What was decided]
- **Rationale:** [Why this approach was chosen over alternatives]
- **Alternatives Considered:**
  - **Option A:** [Description] - Rejected because [reason]
  - **Option B:** [Description] - Rejected because [reason]
- **Impact:** [How this affects current and future implementation]
- **Trade-offs:** [What we gained vs. what we gave up]

#### Decision 2: [Decision Title]
[Repeat structure above]

---

### Important Files

> **PURPOSE:** Quick reference to key files and their current state.

#### `path/to/critical-file-1.js`
- **Purpose:** [What this file does]
- **Current State:** [Functional status]
- **Key Functions/Exports:**
  - `functionName()` - [What it does]
  - `anotherFunction()` - [What it does]
- **Dependencies:** [What this file depends on]
- **Dependents:** [What depends on this file]
- **Recent Changes:** [Latest modifications]

#### `path/to/critical-file-2.vue`
[Repeat structure above]

---

## Session Timeline

| Time | Event | Details |
|------|-------|---------|
| [HH:MM] | Session started | Orchestrator analyzed TICKET-ID |
| [HH:MM] | Planning complete | User approved execution plan |
| [HH:MM] | Branch created | feature/story-x.x-description |
| [HH:MM] | TASK-X.X.1 started | backend-architect implementing |
| [HH:MM] | TASK-X.X.1 complete | Tests passing, committed |
| [HH:MM] | TASK-X.X.2 started | backend-architect implementing |
| [HH:MM] | Issue encountered | [Brief description] |
| [HH:MM] | Issue resolved | [How it was fixed] |
| [HH:MM] | TASK-X.X.2 complete | Tests passing, committed |
| [HH:MM] | Parallel execution | TASK-X.X.4 || TASK-X.X.5 |
| [HH:MM] | Documentation updated | CHANGELOG, README |
| [HH:MM] | PR created | PR #XX opened |
| [HH:MM] | Code review complete | Approved by code-reviewer |
| [HH:MM] | User approval | Ready to merge |
| [HH:MM] | PR merged | Merged to phase-branch |
| [HH:MM] | Session complete | TICKET-ID moved to done |

---

## Notes & Observations

> **PURPOSE:** Capture insights, learning, and context that doesn't fit elsewhere but may be valuable.

### Technical Insights
- [Observation about code structure, patterns, or architecture]
- [Learning about tools, frameworks, or libraries]
- [Performance considerations discovered]

### Process Observations
- [What worked well in this session]
- [What could be improved in workflow]
- [Time estimation accuracy (over/under estimates)]

### Future Considerations
- [Technical debt identified but not addressed]
- [Potential optimizations for future]
- [Features to consider adding later]

### Questions for User (if any)
1. [Question about requirements or priorities]
2. [Question about technical approach]
3. [Question about testing strategy]

---

## Session Metadata

**Last Updated:** [YYYY-MM-DD HH:MM:SS]
**Updated By:** Main Agent
**Update Reason:** [Why tracking doc was updated]
**Session Duration:** [Total time from start to current state]
**Estimated Remaining:** [Time estimate to completion]

**Next Action:** [Clear, specific next step to take when resuming]

**Ready for Handoff:** [Yes | No]
- If Yes: [Session can be resumed by fresh agent with this document]
- If No: [What context is still missing or needs clarification]

---

## Phase 7: Post-Merge Cleanup

> **PURPOSE:** Systematic checklist to ensure all cleanup steps are completed after PR merge. This phase ensures proper ticket closure, documentation archival, and readiness for next work.

**Status:** [ ] Not Started | [ ] In Progress | [X] Complete

### Cleanup Checklist

**After user approves and PR is merged:**

- [ ] **Move ticket to done status**
  - Invoke `agile-ticket-manager` to move ticket from `review` to `done`
  - Update ticket completion timestamp
  - Document final merge commit hash in ticket

- [ ] **Move all child tasks to done status**
  - Verify all TASK-X.X.Y tickets moved to done
  - Ensure no tasks left in `in-progress` or `todo` status
  - Confirm ticket hierarchy reflects completion

- [ ] **Archive session tracking document**
  - Move this document from `docs/sessions/tracking/` to `docs/sessions/completed/`
  - Preserve all content (do NOT delete)
  - Verify document accessible in completed directory

- [ ] **Verify feature branch cleanup**
  - Confirm feature branch deleted locally (`git branch`)
  - Confirm feature branch deleted remotely (`git branch -r`)
  - No orphaned branches remaining

- [ ] **Checkout parent branch and pull latest**
  - Switch to parent branch (e.g., `phase-3`)
  - Pull latest changes: `git pull origin [parent-branch]`
  - Verify local branch is up-to-date with merged PR

- [ ] **Query ticket manager for next available work**
  - Invoke `agile-ticket-manager` to retrieve todo/backlog tickets
  - Get recommendations for next logical ticket
  - Consider dependencies and priorities

- [ ] **Present final summary to user**
  - Show completion metrics (time, tests, commits)
  - Show recommended next tickets
  - Offer to start next ticket or end session

### Cleanup Execution Log

**Started:** [YYYY-MM-DD HH:MM:SS]

**Actions Performed:**

1. **Ticket Status Update:**
   - Time: [HH:MM:SS]
   - Action: Moved [TICKET-ID] to done
   - Result: ✅ Success | ❌ Failed - [reason]

2. **Child Tasks Update:**
   - Time: [HH:MM:SS]
   - Tasks Moved: [count] tasks
   - Result: ✅ Success | ❌ Failed - [reason]

3. **Session Tracking Archive:**
   - Time: [HH:MM:SS]
   - Original Path: `docs/sessions/tracking/SESSION-[TICKET-ID]-[DATE].md`
   - New Path: `docs/sessions/completed/SESSION-[TICKET-ID]-[DATE].md`
   - Result: ✅ Success | ❌ Failed - [reason]

4. **Branch Cleanup Verification:**
   - Time: [HH:MM:SS]
   - Feature Branch: [branch-name]
   - Local Deleted: ✅ Yes | ❌ No
   - Remote Deleted: ✅ Yes | ❌ No

5. **Parent Branch Update:**
   - Time: [HH:MM:SS]
   - Current Branch: [branch-name]
   - Pull Result: ✅ Up-to-date | ❌ Conflicts - [resolution]

6. **Next Work Query:**
   - Time: [HH:MM:SS]
   - Available Tickets: [count] in todo, [count] in backlog
   - Recommended: [TICKET-ID] - [Title]

**Completed:** [YYYY-MM-DD HH:MM:SS]
**Duration:** [total cleanup time]

### Final Summary Presented to User

```
✅ [TICKET-ID] Complete!

Merged: PR #[XX] → [parent-branch]
Commits: [count] implementation + [count] documentation
Tests: [XXX/XXX] passing (100%)
Time: [total session duration]

Next available work:
- [TICKET-ID-1]: [Title] ([status]) - [estimate]
- [TICKET-ID-2]: [Title] ([status]) - [estimate]
- [TICKET-ID-3]: [Title] ([status]) - [estimate]

Ready to start next ticket or end session.
```

### Post-Merge Notes

**Lessons Learned:**
- [What went well in this session]
- [What could be improved for next time]
- [Process improvements identified]

**Cleanup Issues (if any):**
- **Issue:** [Description]
  - **Resolution:** [How it was handled]
  - **Impact:** [Effect on workflow]

**Session Complete:** ✅ Yes - All cleanup steps verified
**Ready for Next Work:** ✅ Yes | ❌ No - [blocker]

---

## Template Usage Instructions

**For Main Agent:**

1. **Create this document at session start (Phase 2)** using this template
2. **Location:** `docs/sessions/tracking/SESSION-[TICKET-ID]-[YYYY-MM-DD].md`
3. **Update after each milestone:**
   - After each task completion
   - After each commit
   - After any significant decision
   - After encountering and resolving issues
4. **Keep "Critical Context for Session Resumption" comprehensive**
   - Write as if a fresh session needs to continue work
   - Include enough detail to understand state fully
   - Document WHY not just WHAT
5. **Move to `.deleted/` when PR merged (Phase 7)**
   - Use `git mv` to preserve history
   - Commit the move before merging PR

**For Fresh Session Resuming Work:**

1. **Read entire document** to understand context
2. **Start with "Critical Context for Session Resumption" section**
3. **Review "What Needs To Be Done Next"** for immediate actions
4. **Check "Known Issues / Blockers"** before starting work
5. **Review "Key Decisions & Rationale"** to align with architecture
6. **Continue updating document** as work progresses

**Key Principles:**

- ✅ Detail is better than brevity (this is for resumption)
- ✅ Document WHY decisions were made (rationale matters)
- ✅ Update immediately after events (don't batch updates)
- ✅ Include timestamps for all events
- ✅ Reference ticket IDs in all task descriptions
- ✅ Keep current status accurate at all times

---

**Template Version:** 1.1
**Last Updated:** November 5, 2025
**Template Location:** `.claude/templates/session-tracking-template.md`
**Changelog:**
- v1.1 (2025-11-05): Added Phase 7 Post-Merge Cleanup section with systematic checklist
- v1.0 (2025-11-03): Initial template creation
