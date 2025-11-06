# Parallel Execution Guide

## Overview

Parallel execution is a powerful optimization technique in the SWARM workflow that allows multiple subagents to work simultaneously on independent tasks. When used correctly, it can reduce total execution time by 50-70% compared to sequential execution.

However, parallelization must be applied carefully - incorrect parallel execution can lead to merge conflicts, race conditions, and data corruption.

## When Parallelization is SAFE

Parallel execution is safe when ALL of these conditions are met:

### 1. No File Conflicts

**Independent Files:**
- ✅ Each task modifies completely different files
- ✅ Tasks create new files with no overlap
- ✅ Tasks read shared files but don't write to them

**Append-Only Shared Files (with caution):**
- ✅ CSS files where each task adds new selectors (no editing existing rules)
- ✅ Test files where each task adds new test cases (no modifying existing tests)
- ⚠️ Requires careful coordination to avoid merge conflicts

**Same File - UNSAFE:**
- ❌ Multiple tasks editing the same JavaScript module
- ❌ Multiple tasks modifying the same React component
- ❌ Multiple tasks updating the same configuration file

### 2. No Logical Dependencies

**Independent Logic:**
- ✅ Task A doesn't need Task B's output to function
- ✅ Task B doesn't depend on Task A being completed first
- ✅ Both tasks can be tested independently

**Sequential Dependencies - UNSAFE:**
- ❌ Task B requires Task A's API endpoint to exist
- ❌ Task B needs Task A's component to be complete
- ❌ Task B tests Task A's functionality

### 3. Shared Resources Safe

**Safe Resource Usage:**
- ✅ Each task uses different API endpoints
- ✅ Each task has isolated test data
- ✅ Each task modifies independent database tables

**Shared Resource Conflicts - UNSAFE:**
- ❌ Both tasks need to modify the same database schema
- ❌ Both tasks need exclusive access to same test fixture
- ❌ Both tasks modify the same global state

### 4. Same Feature Branch

**Safe Branch Usage:**
- ✅ All parallel tasks work on the same feature branch
- ✅ No branch switching during parallel work
- ✅ Single batch commit after all tasks complete

**Multiple Branches - UNSAFE:**
- ❌ Tasks working on different feature branches
- ❌ Tasks requiring branch merges to integrate
- ❌ Tasks with different base branches

---

## When Parallelization is UNSAFE (Must Be Sequential)

Execute tasks sequentially when ANY of these conditions exist:

### 1. Same File Being Edited

**Example:** Three tasks all modify `src/backend/services/copy-service.js`

**Why Sequential:**
- Simultaneous edits create merge conflicts
- Second task might overwrite first task's changes
- Final result unpredictable without sequential ordering

**From Session ff4ab482 (STORY-3.1):**
```
❌ UNSAFE for parallel:
- TASK-3.1.2: Add path validation to copy-service.js
- TASK-3.1.3: Add conflict detection to copy-service.js
- TASK-3.1.5: Add resolution strategies to copy-service.js

All three edit same file → MUST be sequential
```

### 2. Task Dependencies Exist

**Example:** Task B uses API endpoint created by Task A

**Why Sequential:**
- Task B cannot be implemented until Task A is complete
- Task B's tests will fail without Task A's functionality
- Logical flow requires ordering

**Pattern:**
```
Sequential Required:
1. TASK-A: Create API endpoint
2. TASK-B: Create frontend component that calls endpoint
3. TASK-C: Add error handling to component

Each depends on previous → MUST be sequential
```

### 3. Shared State Modifications

**Example:** Multiple tasks updating global configuration

**Why Sequential:**
- Race conditions on shared state
- Last write wins (other changes lost)
- Unpredictable final state

**Pattern:**
```
❌ UNSAFE for parallel:
- TASK-X: Update .env configuration
- TASK-Y: Update .env configuration
- Both modify same file → Race condition
```

### 4. Git Operations

**Example:** Multiple commit operations happening simultaneously

**Why Sequential:**
- Git requires atomic operations
- Simultaneous commits cause conflicts
- Branch state must be consistent

**Pattern:**
```
✅ SAFE:
1. Developer A implements → tests → signals complete
2. Developer B implements → tests → signals complete
3. Git-specialist commits both changes in batch

❌ UNSAFE:
1. Developer A implements → git commits
2. Developer B implements → git commits (simultaneously)
```

---

## Decision Process

### Step 1: Orchestrator Analyzes Tasks

When invoked, subagent-orchestrator examines all tasks for the ticket:

**Analysis Questions:**
1. Do any tasks modify the same files?
2. Does any task depend on another task's output?
3. Are there shared resources that could conflict?
4. Can all tasks work on the same branch simultaneously?
5. How long is each task (time estimates)?

**Output:**
```markdown
## Task Analysis for Parallelization

TASK-3.1.4: Implement conflict resolver
- Files: src/backend/services/conflict-resolver.js (new file)
- Dependencies: None (standalone service)
- Time: 20 minutes

TASK-3.1.5: Implement unique path generator
- Files: src/backend/services/unique-path-generator.js (new file)
- Dependencies: None (standalone service)
- Time: 18 minutes

RECOMMENDATION: ✅ SAFE for parallel execution
- No file conflicts (different files)
- No logical dependencies (independent services)
- Both can be tested independently
- Expected time: 20 min (longest task) vs 38 min sequential
- Efficiency gain: 47% reduction
```

### Step 2: Orchestrator Makes Recommendation

Orchestrator explicitly recommends:

**Parallel Recommendation:**
```
RECOMMENDATION: Execute TASK-3.1.4 and TASK-3.1.5 in parallel

RATIONALE:
- Independent files (no merge conflicts)
- No dependencies (both standalone services)
- Significant time savings (47% reduction)
- Low risk (both have isolated test coverage)

EXECUTION PLAN:
1. Launch backend-architect for TASK-3.1.4
2. Launch backend-architect for TASK-3.1.5 (simultaneously)
3. Wait for both to complete
4. Run full test suite with both changes
5. Single batch commit referencing both task IDs
```

**Sequential Recommendation:**
```
RECOMMENDATION: Execute TASK-3.1.2, TASK-3.1.3, TASK-3.1.5 sequentially

RATIONALE:
- All three tasks modify copy-service.js (file conflict)
- Logical dependencies (each builds on previous)
- Sequential execution prevents merge conflicts
- Clear ordering ensures proper integration

EXECUTION PLAN:
1. TASK-3.1.2 → implement → test → commit
2. TASK-3.1.3 → implement → test → commit
3. TASK-3.1.5 → implement → test → commit
```

### Step 3: Main Agent Makes Final Decision

Main agent reviews orchestrator's recommendation and decides:

**Factors to Consider:**
- **Performance:** Is time savings significant enough?
- **Risk:** What's the impact if parallelization fails?
- **Complexity:** Is coordination overhead worth the benefit?
- **Testing:** Can both changes be tested together safely?

**Decision Options:**

**Option A: Accept Parallel Recommendation**
```
Main Agent Decision: Proceeding with parallel execution of TASK-3.1.4 and TASK-3.1.5

Invoking backend-architect for both tasks simultaneously...
```

**Option B: Override to Sequential**
```
Main Agent Decision: Overriding to sequential execution despite recommendation

Rationale: Tasks modify services that integrate closely, prefer sequential
for clearer debugging if issues arise.

Proceeding with TASK-3.1.4 first...
```

**Option C: Request User Input**
```
Main Agent: Orchestrator recommends parallel execution (47% time savings).
However, this increases complexity.

User, would you prefer:
A) Parallel (faster, more complex)
B) Sequential (slower, more straightforward)
```

---

## Examples from Exemplary Sessions

### Example 1: Independent Test File Fixes (Session ff4ab482)

**Scenario:** Two test files failing with unrelated issues

**Analysis:**
```
TASK-FIX-1: Fix resolveConflict.test.js
- File: tests/backend/services/resolveConflict.test.js
- Issue: Mock configuration incorrect
- Dependencies: None

TASK-FIX-2: Fix generateUniquePath.test.js
- File: tests/backend/services/generateUniquePath.test.js
- Issue: Test expectations outdated
- Dependencies: None

File Conflicts? ❌ No (different files)
Logical Dependencies? ❌ No (independent tests)
Shared Resources? ❌ No (isolated test data)
Same Branch? ✅ Yes
```

**Decision:** ✅ PARALLEL EXECUTION

**Execution:**
```
00:00 - Launch backend-architect-1 (resolveConflict fix) ||
        Launch backend-architect-2 (generateUniquePath fix)
00:08 - Both tasks complete (longest took 8 min)
00:10 - Run full test suite (all 879 tests pass)
00:12 - Batch commit "test: fix conflict resolver and path generator tests (FIX-1, FIX-2)"

Time: 12 minutes total
Sequential would have been: ~20 minutes
Savings: 40% reduction
```

**Result:** ✅ Successful - No conflicts, significant time savings

---

### Example 2: Final Documentation + Code Review (Session ff4ab482)

**Scenario:** After implementation complete, need docs and review

**Analysis:**
```
ACTIVITY-1: Update documentation
- Agent: documentation-engineer
- Files: CHANGELOG.md, README.md
- Dependencies: None (reads implementation files)

ACTIVITY-2: Code review
- Agent: code-reviewer
- Files: Reviews all implementation files
- Dependencies: None (reads implementation files)

File Conflicts? ❌ No (different concerns)
Logical Dependencies? ❌ No (both read same source, don't modify)
Shared Resources? ❌ No (one writes docs, one writes review)
Same Branch? ✅ Yes
```

**Decision:** ✅ PARALLEL EXECUTION

**Execution:**
```
00:00 - Launch documentation-engineer || Launch code-reviewer
00:12 - Both complete (longest took 12 min)
00:13 - Review code-reviewer's feedback
00:14 - Commit documentation updates

Time: 14 minutes total
Sequential would have been: ~25 minutes
Savings: 44% reduction
```

**Result:** ✅ Successful - Common pattern for final PR preparation

---

### Example 3: Same File Edits (Session ff4ab482 - STORY-3.1)

**Scenario:** Multiple tasks editing copy-service.js

**Analysis:**
```
TASK-3.1.2: Add path validation to copy-service.js
- File: src/backend/services/copy-service.js
- Changes: Add validatePaths() method
- Dependencies: TASK-3.1.1 (needs base structure)

TASK-3.1.3: Add conflict detection to copy-service.js
- File: src/backend/services/copy-service.js
- Changes: Add detectConflicts() method
- Dependencies: TASK-3.1.1 (needs base structure)

TASK-3.1.5: Add resolution strategies to copy-service.js
- File: src/backend/services/copy-service.js
- Changes: Add resolveConflict() method
- Dependencies: TASK-3.1.3 (uses conflict detection)

File Conflicts? ✅ YES (all edit same file)
Logical Dependencies? ✅ YES (3.1.5 depends on 3.1.3)
Shared Resources? ✅ YES (same module)
Same Branch? ✅ Yes
```

**Decision:** ❌ SEQUENTIAL EXECUTION (mandatory)

**Execution:**
```
00:00 - TASK-3.1.2 (backend-architect)
00:25 - Complete, test, commit
00:26 - TASK-3.1.3 (backend-architect)
00:48 - Complete, test, commit
00:49 - TASK-3.1.5 (backend-architect)
01:14 - Complete, test, commit

Time: 74 minutes total
Parallel would have caused: Merge conflicts, race conditions
```

**Result:** ✅ Sequential was correct - Parallel would have failed

---

### Example 4: Independent Component Files

**Scenario:** Creating four new configuration card components

**Analysis:**
```
TASK-3.2.1: Create AgentCard.vue
- File: src/components/cards/AgentCard.vue (new file)
- Dependencies: None (standalone component)

TASK-3.2.2: Create CommandCard.vue
- File: src/components/cards/CommandCard.vue (new file)
- Dependencies: None (standalone component)

TASK-3.2.3: Create HookCard.vue
- File: src/components/cards/HookCard.vue (new file)
- Dependencies: None (standalone component)

TASK-3.2.4: Create MCPCard.vue
- File: src/components/cards/MCPCard.vue (new file)
- Dependencies: None (standalone component)

File Conflicts? ❌ No (all new files)
Logical Dependencies? ❌ No (independent components)
Shared Resources? ❌ No (each has own test file)
Same Branch? ✅ Yes
```

**Decision:** ✅ PARALLEL EXECUTION (4-way parallel)

**Execution:**
```
00:00 - Launch frontend-developer-1 (AgentCard) ||
        Launch frontend-developer-2 (CommandCard) ||
        Launch frontend-developer-3 (HookCard) ||
        Launch frontend-developer-4 (MCPCard)
00:06 - All complete (longest took 6 min)
00:08 - Run full test suite (all pass)
00:10 - Batch commit "feat: implement configuration cards for all 4 types (TASK-3.2.1-3.2.4)"

Time: 10 minutes total
Sequential would have been: ~26 minutes (4 × 6-7 min each)
Savings: 62% reduction
```

**Result:** ✅ Highly successful - Dramatic time savings with no issues

---

## Parallel Invocation Syntax

### Main Agent Pattern for Parallel Execution

**Single Message with Multiple Invocations:**

```markdown
I'm now executing TASK-3.1.4 and TASK-3.1.5 in parallel since they are independent.

[Invoke backend-architect with TASK-3.1.4 context]
[Invoke backend-architect with TASK-3.1.5 context]

I'll wait for both to complete before proceeding to testing phase.
```

**Each Subagent Gets Clear Scope:**

```markdown
Invoking backend-architect for TASK-3.1.4:

Task: Implement conflict resolver service
Files: src/backend/services/conflict-resolver.js
Acceptance Criteria:
- Detect file conflicts between source and destination
- Return conflict details including file paths and types
- Include comprehensive tests

Please implement this task and test it immediately.
Do NOT commit - I will handle commits after all parallel tasks complete.
```

### Main Agent Aggregates Results

After all parallel agents complete:

```markdown
Parallel Execution Complete:

✅ TASK-3.1.4: Conflict resolver implemented
   - Created conflict-resolver.js with 3 strategies
   - Added 12 unit tests (all passing)
   - Duration: 18 minutes

✅ TASK-3.1.5: Unique path generator implemented
   - Created unique-path-generator.js with suffix logic
   - Added 8 unit tests (all passing)
   - Duration: 20 minutes

Total Time: 20 minutes (vs 38 minutes sequential)

Now running full test suite to verify integration...
```

---

## Best Practices

### 1. Default to Sequential, Use Parallel When Clear

**Philosophy:** Sequential is safer and simpler. Only parallelize when benefits are clear and risks are minimal.

✅ **Good Parallelization Candidates:**
- Multiple test file fixes
- Independent component creation
- Documentation + code review
- Bug fixes in different modules

❌ **Poor Parallelization Candidates:**
- Tasks with subtle dependencies
- Complex integration work
- Large refactoring efforts
- First-time implementations (prefer sequential to learn)

### 2. Orchestrator Recommends, Main Agent Decides

**Orchestrator Role:**
- Analyzes task independence
- Calculates time savings
- Identifies risks
- Makes recommendation

**Main Agent Role:**
- Reviews recommendation
- Applies additional context
- Makes final decision
- Can override orchestrator

**User Role:**
- Can override main agent
- Final authority on approach
- Considers team preferences

### 3. Batch Commit for Parallel Work Only

**Rule:** Batch commits are ONLY for truly parallel execution

✅ **Valid Batch Commit:**
```
feat: implement 4 configuration cards (TASK-3.2.1-3.2.4)

All four components were implemented in parallel:
- AgentCard.vue (frontend-developer-1)
- CommandCard.vue (frontend-developer-2)
- HookCard.vue (frontend-developer-3)
- MCPCard.vue (frontend-developer-4)

Execution time: 6 minutes (vs 26 minutes sequential)
```

❌ **Invalid Batch Commit:**
```
feat: implement path validation and conflict detection (TASK-3.1.2, TASK-3.1.3)

# These were executed sequentially, not in parallel!
# Should be two separate commits.
```

### 4. Monitor Parallel Execution Quality

**After Parallel Execution:**
- Run full test suite (MANDATORY)
- Review for subtle integration issues
- Verify no unexpected interactions
- Check for code duplication between parallel work

**If Issues Found:**
- Document what went wrong
- Update orchestrator's analysis for similar tasks
- Adjust parallelization criteria for future
- Don't blame agents - improve process

### 5. Document Parallelization Decisions

**In Session Tracking:**
```markdown
## Parallelization Decisions

### Decision 1: TASK-3.1.4 || TASK-3.1.5
- Recommendation: Orchestrator (parallel)
- Decision: Main agent (accepted)
- Rationale: Independent files, no dependencies, 47% time savings
- Result: ✅ Successful (no issues)

### Decision 2: TASK-3.1.2, TASK-3.1.3, TASK-3.1.5
- Recommendation: Orchestrator (sequential - same file)
- Decision: Main agent (accepted)
- Rationale: All edit copy-service.js, logical dependencies
- Result: ✅ Sequential was correct
```

---

## Troubleshooting

### Problem: Merge Conflicts After Parallel Execution

**Cause:** Tasks weren't as independent as thought

**Solution:**
1. Resolve conflicts manually
2. Document lesson learned
3. Update orchestrator's analysis criteria
4. Be more conservative with future parallelization

**Prevention:**
- More thorough file conflict analysis
- Consider subtle dependencies (shared utilities, common patterns)
- Test small parallel batches before large ones

### Problem: Tests Fail When Parallel Changes Combined

**Cause:** Integration issue between parallel work

**Solution:**
1. Isolate which task caused failure
2. Fix integration issue
3. Re-run tests
4. Document integration dependency for future

**Prevention:**
- Run integration tests more frequently
- Consider sequential for first-time implementations
- Include integration testing in acceptance criteria

### Problem: Parallel Execution Took Longer Than Sequential

**Cause:** Coordination overhead exceeded time savings

**Solution:**
1. Document actual vs. expected time
2. Analyze where overhead occurred
3. Adjust threshold for parallelization (only use for >20% time savings)

**Prevention:**
- More accurate time estimates
- Account for coordination time in calculations
- Prefer sequential for small tasks (<15 min each)

### Problem: Unclear Which Agent Worked on Which File

**Cause:** Poor tracking during parallel execution

**Solution:**
1. Review git commit details
2. Reconstruct from agent responses
3. Document in session tracking

**Prevention:**
- Assign clear task IDs to each parallel agent
- Track agent assignments in TodoWrite
- Each agent reports completion with file list

---

## Quick Reference

### Parallelization Checklist

Before executing tasks in parallel, verify:

- [ ] ✅ No file conflicts (different files or safe append-only)
- [ ] ✅ No logical dependencies (Task B doesn't need Task A's output)
- [ ] ✅ No shared resources (independent database tables, API endpoints, etc.)
- [ ] ✅ Same feature branch (all tasks on one branch)
- [ ] ✅ Time savings significant (>20% reduction)
- [ ] ✅ Risk is low (both tasks well-understood)
- [ ] ✅ Each task can be tested independently

If ALL checkboxes checked: ✅ SAFE for parallel execution

If ANY checkbox unchecked: ❌ Use sequential execution

---

## Related Documentation

- **SWARM Workflow:** `docs/guides/SWARM-WORKFLOW.md` - Complete workflow with phase details
- **Git Workflow:** `docs/guides/GIT-WORKFLOW.md` - Commit conventions and branching
- **Testing Guide:** `docs/guides/TESTING-GUIDE.md` - Test execution during parallel work

---

**Last Updated:** November 3, 2025
**Version:** 1.0
**Status:** Official Parallelization Standard
