# Session Tracking: STORY-3.2 - Configuration-Specific Copy Logic

**Created:** 2025-11-03 15:30:00
**Branch:** feature/story-3.2-copy-logic
**Parent Branch:** phase-3
**Status:** in-progress

---

## Ticket Details

**ID:** STORY-3.2
**Type:** Story
**Priority:** P0
**Estimate:** 5 hours (5.5 hours with review)

**Objective:**
Implement type-specific copy logic for each configuration type (agents, commands, hooks, MCP) by extending the copy service infrastructure created in STORY-3.1.

**Scope Adjustment (2025-11-03):**
Skills removed from scope - not yet supported in Claude Code Manager UI. Will be added in future phase when skills viewing is implemented.

**Acceptance Criteria:**
- [ ] `copyAgent()` method implemented with YAML frontmatter validation
- [ ] `copyCommand()` method implemented with nested directory support
- [ ] Hook array support verified and documented in codebase
- [ ] `copyHook()` method implemented with smart merge algorithm
- [ ] `copyMcp()` method implemented with server name conflict detection
- [ ] Unit tests written for all copy methods (20+ tests, 100% pass rate)

---

## Execution Plan (from Orchestrator)

### Identified Tasks

#### TASK-3.2.1: Implement copyAgent Method
- **Subagent:** backend-architect
- **Files:** `src/backend/services/copy-service.js`
- **Dependencies:** STORY-3.1 (COMPLETE)
- **Estimated Time:** 30 minutes
- **Acceptance Criteria:**
  - [ ] `copyAgent(request)` method added to CopyService class
  - [ ] Uses existing helpers: validateSource(), buildTargetPath(), detectConflict(), resolveConflict()
  - [ ] Copies .md file using fs.copyFile()
  - [ ] Validates YAML frontmatter is parseable
  - [ ] Returns success or conflict response

#### TASK-3.2.2: Implement copyCommand Method
- **Subagent:** backend-architect
- **Files:** `src/backend/services/copy-service.js`
- **Dependencies:** TASK-3.2.1 (same file edit)
- **Estimated Time:** 30 minutes
- **Acceptance Criteria:**
  - [ ] `copyCommand(request)` method added to CopyService class
  - [ ] Preserves nested directory structure (handled by buildTargetPath)
  - [ ] Validates YAML frontmatter is parseable
  - [ ] Returns success or conflict response

#### ~~TASK-3.2.3: Implement copySkill Method~~ (REMOVED - Skills not supported in UI yet)

#### TASK-3.2.3: Verify Hook Array Support in Codebase (renumbered from 3.2.4)
- **Subagent:** backend-architect
- **Files:** `src/backend/services/copy-service.js` (documentation comments only)
- **Dependencies:** None (independent investigation)
- **Estimated Time:** 30 minutes
- **Acceptance Criteria:**
  - [ ] Check test fixtures for hook format examples
  - [ ] Review existing hook-related code
  - [ ] Document findings in code comment block
  - [ ] Identify actual hook structure (orchestrator found complex matcher-based format)

#### TASK-3.2.4: Implement copyHook Method (Smart Merge) - renumbered from 3.2.5
- **Subagent:** backend-architect
- **Files:** `src/backend/services/copy-service.js`
- **Dependencies:** TASK-3.2.3 (MUST complete first - needs verification results), TASK-3.2.2 (same file)
- **Estimated Time:** 60 minutes (potentially 90 min if complex)
- **Acceptance Criteria:**
  - [ ] `copyHook(request)` method added to CopyService class
  - [ ] `mergeHooks(existingHooks, newHook)` helper method created
  - [ ] Smart merge algorithm adapted to actual hook structure
  - [ ] Handles event-level, matcher-level, and hook-level merging
  - [ ] Deduplicates hooks by comparing command field
  - [ ] Validates JSON is well-formed after write
  - [ ] Returns success response

#### TASK-3.2.5: Implement copyMcp Method (renumbered from 3.2.6)
- **Subagent:** backend-architect
- **Files:** `src/backend/services/copy-service.js`
- **Dependencies:** TASK-3.2.4 (same file edit)
- **Estimated Time:** 45 minutes
- **Acceptance Criteria:**
  - [ ] `copyMcp(request)` method added to CopyService class
  - [ ] Reads source and target MCP configurations
  - [ ] Detects server name conflicts
  - [ ] Merges or adds server configuration
  - [ ] Validates JSON is well-formed after write

#### TASK-3.2.6: Write Unit Tests for All Copy Methods (renumbered from 3.2.7)
- **Subagent:** test-automation-engineer
- **Files:**
  - `tests/backend/services/copy-service-copyAgent.test.js`
  - `tests/backend/services/copy-service-copyCommand.test.js`
  - `tests/backend/services/copy-service-copyHook.test.js`
  - `tests/backend/services/copy-service-copyMcp.test.js`
- **Dependencies:** ALL implementation tasks (3.2.1-3.2.5) MUST be complete
- **Estimated Time:** 50 minutes (reduced from 60 - no skill tests)
- **Acceptance Criteria:**
  - [ ] Each copy method has dedicated test file
  - [ ] Success cases, conflict cases, validation failures tested
  - [ ] Hook merge cases tested (no duplicates, partial duplicates, complete duplicates)
  - [ ] Minimum 20+ tests total across all files (reduced from 26+)
  - [ ] All tests passing with 100% success rate

### Parallelization Opportunities

**Analysis:**
- Tasks 3.2.1-3.2.5 ALL modify `src/backend/services/copy-service.js`
- High risk of merge conflicts if run in parallel
- Logical dependency: TASK-3.2.4 (copyHook) depends on TASK-3.2.3 (hook verification) results
- Skills (original TASK-3.2.3) REMOVED from scope - not supported in UI yet

**Decisions:**
- ❌ Sequential: TASK-3.2.1 → 3.2.2 → 3.2.3 → 3.2.4 → 3.2.5 (same file conflicts, dependencies)
- ❌ Sequential: TASK-3.2.6 (depends on ALL implementations being complete)
- ✅ Parallel: documentation-engineer || code-reviewer (after testing complete, different files, 40% time savings)

### Risk Assessment

**Risk 1: Hook Structure Complexity**
- **Impact:** HIGH
- **Mitigation:**
  - TASK-3.2.4 thoroughly documents actual hook structure
  - Backend-architect allocates up to 90 min for TASK-3.2.5 if needed
  - Orchestrator discovered hooks use complex matcher-based format, not simple arrays
  - Use existing test fixtures for test cases

**Risk 2: ~~Skill Directory Symlink Handling~~ (REMOVED - Skills not in scope)**

**Risk 3: Same-File Editing Fatigue**
- **Impact:** MEDIUM (code quality degradation)
- **Mitigation:**
  - Test after EACH task completion
  - Commit after each task (clear git history)
  - Code review focuses on pattern consistency
  - Backend-architect should take breaks between 5 tasks (reduced from 6)

**Risk 4: Test Coverage Gaps**
- **Impact:** MEDIUM (bugs escape to production)
- **Mitigation:**
  - Test-automation-engineer follows existing test patterns from STORY-3.1
  - Each method needs minimum 4-5 tests
  - Use existing fixtures for realistic test data
  - Code-reviewer verifies test coverage before PR approval

**Test Distribution (Adjusted for 4 config types):**
- copyAgent: 4 tests
- copyCommand: 4 tests
- copyHook: 8 tests (merge scenarios, deduplication, complex structure)
- copyMcp: 4 tests
- Total: 20 tests minimum

**Risk 5: JSON Corruption During Merge (Hooks/MCP)**
- **Impact:** HIGH (user data corruption)
- **Mitigation:**
  - Atomic write pattern: write to temp file, validate, then rename
  - Validate JSON before write
  - Consider backup creation before overwrite

---

## Task Breakdown & Status

### ✅ Completed Tasks

_(None yet - session just started)_

---

### 🔄 In Progress Tasks

_(None yet - awaiting user approval of execution plan)_

---

### ⏳ Pending Tasks

#### TASK-3.2.1: Implement copyAgent Method
- **Subagent:** backend-architect
- **Dependencies:** STORY-3.1 (COMPLETE)
- **Preparation Needed:** Review existing copy-service.js helper methods
- **Estimated Time:** 30 minutes

#### TASK-3.2.2: Implement copyCommand Method
- **Subagent:** backend-architect
- **Dependencies:** TASK-3.2.1 must complete first
- **Preparation Needed:** None
- **Estimated Time:** 30 minutes

#### TASK-3.2.3: Implement copySkill Method
- **Subagent:** backend-architect
- **Dependencies:** TASK-3.2.2 must complete first
- **Preparation Needed:** None
- **Estimated Time:** 60 minutes

#### TASK-3.2.4: Verify Hook Array Support
- **Subagent:** backend-architect
- **Dependencies:** TASK-3.2.3 must complete first (same file)
- **Preparation Needed:** Locate test fixtures with hook examples
- **Estimated Time:** 30 minutes

#### TASK-3.2.5: Implement copyHook Method
- **Subagent:** backend-architect
- **Dependencies:** TASK-3.2.4 must complete first (needs verification results)
- **Preparation Needed:** Understand actual hook structure from TASK-3.2.4
- **Estimated Time:** 60-90 minutes

#### TASK-3.2.6: Implement copyMcp Method
- **Subagent:** backend-architect
- **Dependencies:** TASK-3.2.5 must complete first
- **Preparation Needed:** None
- **Estimated Time:** 45 minutes

#### TASK-3.2.7: Write Unit Tests
- **Subagent:** test-automation-engineer
- **Dependencies:** ALL implementation tasks (3.2.1-3.2.6) must be complete
- **Preparation Needed:** Review existing test patterns from STORY-3.1
- **Estimated Time:** 60 minutes

---

## Test Results

_(No tests run yet - session just started)_

---

## Documentation Updates

_(No documentation updates yet - will occur after implementation complete)_

---

## Git History

### Commits (Chronological)

_(No commits yet - session just started)_

---

### PR Details

**PR Number:** TBD
**Status:** Not yet created
**Created:** TBD

---

## Critical Context for Session Resumption

> **PURPOSE:** This section must contain enough detail for a fresh Claude session to continue work seamlessly if context runs low mid-session.

### What Has Been Completed

**High-Level Summary:**
Session just started. Orchestrator has analyzed STORY-3.2 and created execution plan. Feature branch `feature/story-3.2-copy-logic` already exists. Foundation from STORY-3.1 (copy-service.js with helper methods) is complete and merged to phase-3 branch.

**Detailed Breakdown:**
1. **Foundation (STORY-3.1):** Complete infrastructure exists in copy-service.js with:
   - `validateSource()` - Path validation and security (path traversal protection)
   - `buildTargetPath()` - Target path construction for all config types (agents, commands, hooks, MCP, skills)
   - `detectConflict()` - File existence checking with timestamps
   - `resolveConflict()` - Conflict resolution (skip/overwrite/rename strategies)
   - `generateUniquePath()` - Unique filename generation with numeric suffixes

2. **Branch State:** Feature branch `feature/story-3.2-copy-logic` currently contains only SWARM workflow redefinition changes (no STORY-3.2 implementation yet)

3. **Orchestrator Analysis:** Discovered critical finding - hook structure in codebase is MORE complex than PRD anticipated:
   - Actual format: `{ "event": [{ matcher: "*.ts", hooks: [{type, command, enabled}] }] }`
   - PRD assumed: Simple array format
   - Impact: TASK-3.2.5 (copyHook) will need matcher-level merging logic

### What Needs To Be Done Next

**Immediate Next Steps (in order):**

1. **User Approval of Execution Plan**
   - Present orchestrator's plan to user
   - Request approval or refinements
   - Create TodoWrite task list after approval
   - Expected outcome: User approves and authorizes Phase 3 (implementation)
   - Estimated time: 5 minutes

2. **TASK-3.2.1: Implement copyAgent Method** (if plan approved)
   - Files to modify: `src/backend/services/copy-service.js`
   - Expected outcome: New copyAgent() method that copies .md files with YAML validation
   - Estimated time: 30 minutes
   - Pattern: Use existing helpers (validateSource, buildTargetPath, detectConflict, resolveConflict)

3. **Continue sequentially through tasks 3.2.2-3.2.7**
   - Each task commits immediately after completion
   - Test after each implementation task
   - All must pass before proceeding to next

**Remaining Work:**
- All 7 implementation/testing tasks
- Documentation updates (parallel with code review)
- Code review
- PR creation and user approval

---

### Known Issues / Blockers

_(No blockers yet - session just started)_

**Note:** TASK-3.2.4 will investigate and document actual hook structure before TASK-3.2.5 implementation.

---

### Key Decisions & Rationale

#### Decision 1: Mandatory Sequential Execution
- **Decision:** Tasks 3.2.1-3.2.6 MUST execute sequentially (no parallelization)
- **Rationale:** All tasks modify the same file (copy-service.js), creating high merge conflict risk
- **Alternatives Considered:**
  - **Parallel execution:** Rejected because all tasks add methods to same class in same file
  - **Batch implementation:** Rejected because testing after each task catches regressions early
- **Impact:** Total implementation time is 255 minutes (4h 15m) sequential, cannot be reduced
- **Trade-offs:** Gained code consistency and clear git history; gave up parallelization time savings

#### Decision 2: Atomic Write Pattern for JSON Merge
- **Decision:** Use temp file write + validate + rename pattern for hooks/MCP merge operations
- **Rationale:** Prevents user settings.json or .mcp.json corruption if write fails midway
- **Alternatives Considered:**
  - **Direct write:** Rejected due to corruption risk if process interrupted
  - **Backup before write:** Considered for future enhancement
- **Impact:** Slightly more complex implementation but much safer for user data
- **Trade-offs:** Gained data safety; gave up simplicity

---

### Important Files

#### `src/backend/services/copy-service.js`
- **Purpose:** Core service for copying configuration items between scopes
- **Current State:** Foundation complete (STORY-3.1), ready for type-specific methods
- **Key Functions/Exports:**
  - `validateSource(sourcePath)` - Security validation, existence checks
  - `buildTargetPath(configType, targetScope, targetProjectId, sourcePath)` - Target path construction
  - `detectConflict(sourcePath, targetPath)` - File existence and timestamp checking
  - `resolveConflict(targetPath, strategy)` - Apply conflict resolution strategy
  - `generateUniquePath(originalPath)` - Create unique filename with numeric suffix
- **Dependencies:** fs/promises, path, os, projectDiscovery service
- **Dependents:** Will be used by copy API endpoints (STORY-3.3)
- **Recent Changes:** Foundation merged from STORY-3.1, no changes yet on feature/story-3.2-copy-logic

---

## Session Timeline

| Time | Event | Details |
|------|-------|---------|
| 15:30 | Session started | /swarm STORY-3.2 invoked by user |
| 15:31 | Ticket retrieved | agile-ticket-manager fetched STORY-3.2 details |
| 15:32 | Orchestrator planning | subagent-orchestrator analyzed ticket and codebase |
| 15:35 | Plan created | Sequential execution required, 7 tasks identified |
| 15:36 | Session tracking created | This document created by main agent |
| 15:37 | Awaiting user approval | Presenting execution plan to user |

---

## Notes & Observations

### Technical Insights
- Hook structure discovery: Orchestrator found complex matcher-based format with nested objects, more sophisticated than PRD assumption
- Symlink security: Must use fs.lstat() instead of fs.stat() to detect without following
- Atomic writes critical for JSON merge operations to prevent user data corruption

### Process Observations
- SWARM workflow separation of planning from execution working well
- Orchestrator's codebase analysis caught hook structure complexity before implementation
- Sequential execution mandatory due to same-file conflicts

### Future Considerations
- Backup creation before overwriting user settings (future enhancement)
- Consider splitting copy-service.js into separate files by config type to enable parallel development in future stories

---

## Session Metadata

**Last Updated:** 2025-11-03 15:37:00
**Updated By:** Main Agent
**Update Reason:** Initial session tracking document creation (Phase 2)
**Session Duration:** 7 minutes (planning phase)
**Estimated Remaining:** 5.5 hours (implementation + testing + review)

**Next Action:** Present execution plan to user for approval, then create TodoWrite task list

**Ready for Handoff:** Yes
- Session can be resumed by fresh agent with this document
- All context from orchestrator analysis documented
- Clear next steps identified
