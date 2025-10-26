# Development Strategies Guide

**Version:** 1.0
**Created:** October 26, 2025
**Last Updated:** October 26, 2025
**Purpose:** Comprehensive guide to development strategy patterns for optimal workflow efficiency

---

## Overview

### What Are Development Strategies?

Development strategies are **proven workflow patterns** that guide how teams approach implementation tasks. Different strategies are optimized for different types of work, from complex architectural decisions requiring discussion to straightforward changes requiring rapid execution.

The right strategy for the right task maximizes efficiency, reduces rework, and ensures quality outcomes.

### Why Multiple Strategies Exist

Not all development tasks are created equal:

- **Complex features** benefit from upfront alignment (Development Approved)
- **Simple changes** benefit from rapid execution (Rapid Iteration)
- **Independent tasks** benefit from parallel execution (Parallel Execution)

Using the wrong strategy for a task introduces inefficiency:
- Development Approved on trivial changes = unnecessary overhead
- Rapid Iteration on complex features = high rework risk
- Sequential execution on independent tasks = wasted time

### When to Use Each Strategy

| Strategy | Best For | Time Impact | Risk Mitigation |
|----------|----------|-------------|-----------------|
| **Development Approved** | Complex features, architectural decisions | +5-10 min discussion, saves 30-60 min rework | High - prevents wrong implementations |
| **Rapid Iteration** | Small fixes, obvious changes | Minimal overhead | Medium - relies on developer judgment |
| **Parallel Execution** | Multiple independent tasks | 50-87% time savings | Medium - requires careful dependency analysis |

### How Strategies Improve Outcomes

**Evidence from Real Sessions:**

- **October 22, 2025 (Session 48b4cb87):** Systematic bug resolution using organized workflow → 5/5 star rating, zero regressions
- **October 12, 2025 (Session c6d23edd):** Small task sizing + mandatory testing → 100% completion, 0 errors
- **October 7, 2025 (Session bb8fbe33):** Massive scope + late testing → 350+ errors, full revert required

**Key Insight:** The *strategy selection* is as important as the implementation quality.

---

## Strategy 1: Development Approved

**Pattern:** Propose → Discuss → Approve → Implement

**When to Use:**
- Complex features with multiple implementation approaches
- Bug fixes requiring architectural decisions
- Changes affecting multiple components
- When validating approach before implementing
- When avoiding potential rework is high priority

**Time Investment:**
- **Discussion Phase:** 5-10 minutes (proposal preparation + user review)
- **Implementation Phase:** Standard development time
- **Net Savings:** 30-60 minutes of rework avoided

**Pattern Flow (5 Steps)**

### Step 1: Analysis Phase

**Developer Activities:**
1. Analyze requirement or bug thoroughly
2. Identify key concerns and constraints
3. Research existing patterns in codebase
4. Identify potential gotchas or edge cases
5. List assumptions requiring validation

**Example (BUG-030 Analysis):**
```
Commands show empty tools field in sidebar.

Root cause investigation:
- Backend response includes tools: []
- Sidebar displays empty array as "(none)"
- Claude Code spec defines 'allowed-tools' property for commands
- Current parser looks for 'tools' property (doesn't exist)

Key concerns:
- Is this spec compliance issue?
- Should we change backend or frontend?
- Are there other fields with similar issues?
```

### Step 2: Proposal Preparation

**Developer Activities:**
1. Write detailed analysis with findings
2. Propose 2-3 implementation approaches
3. Include pros/cons for each approach
4. Prepare specific questions for user
5. Include estimated time for implementation

**Proposal Template:**
```markdown
## [BUG/FEATURE ID] Analysis

**Root Cause:** [Brief description]

**Implementation Options:**

### Option 1: [Approach Name]
**Description:** [How it works]
**Pros:**
- [Benefit 1]
- [Benefit 2]
**Cons:**
- [Drawback 1]
- [Drawback 2]
**Time Estimate:** [X minutes]

### Option 2: [Alternative Approach]
[Same structure]

**Recommendation:** Option [X] because [clear rationale]

**Questions for Approval:**
- [Specific decision point 1]
- [Specific decision point 2]

**Proposed Approach:** [If option X approved]
```

**Example (BUG-030 Proposal):**
```
BUG-030 Analysis: Commands show empty tools field.

Root cause: backend looks for 'tools' property but Claude Code spec
defines 'allowed-tools' for commands.

Options:
1. Update backend to look for 'allowed-tools' (recommended)
   Pros: Spec-compliant, fixes root cause
   Cons: Backend change required
   Time: 30 minutes including tests

2. Update spec to expect 'tools' (not recommended)
   Pros: No code changes
   Cons: Breaks Claude Code consistency
   Time: 5 minutes

3. Support both 'tools' and 'allowed-tools'
   Pros: Backward compatible
   Cons: Adds complexity, maintains bug
   Time: 45 minutes

Proposed fix: Option 1 - Extract from allowed-tools in projectDiscovery.js
Map to response 'tools' field for frontend consistency.

Approach approved?
```

### Step 3: Proposal Submission

**Developer Activities:**
1. Submit proposal message to user
2. Format: Analysis → Problem statement → Proposed solutions → Questions
3. Ask for explicit approval: "Should we do X or Y?"
4. Wait for response before proceeding

**Key Phrase to Include:**
```
Awaiting approval before proceeding with implementation.
```

**Communication Format:**
```
I've analyzed [ISSUE] and prepared an implementation proposal.

[ANALYSIS SUMMARY]

[PROPOSED APPROACHES WITH PROS/CONS]

**Recommendation:** [Option X] because [rationale]

**Should I proceed with Option X?** (Awaiting approval)
```

### Step 4: Approval/Feedback Loop

**User Activities:**
1. Review proposal (typically 5-10 minutes)
2. Ask clarifications if needed
3. Provide feedback on approach
4. Grant explicit approval

**Developer Activities:**
1. If "development approved" → proceed with implementation (Step 5)
2. If feedback → refine proposal → resubmit (return to Step 2)
3. If rejection → explore alternative approach → resubmit
4. Process repeats until approval received

**Approval Signals:**
- **Explicit:** "development approved"
- **Explicit:** "go ahead with option 2"
- **Explicit:** "yes, that approach looks good"
- **Not Approval:** "okay" (too vague - ask for clarification)
- **Not Approval:** "sounds reasonable" (ask for explicit go-ahead)

**Example Exchange:**
```
Developer: [Submits BUG-030 proposal with 3 options]

User: "Option 1 makes sense, but have you considered how this affects
the MCP server field extraction? It might have the same issue."

Developer: "Good catch! I'll check MCP parser and include it in the fix.
Updated proposal: Fix both command and MCP 'allowed-tools' extraction
in single commit. Time estimate now 45 minutes. Proceed?"

User: "development approved"

Developer: [Proceeds to Step 5]
```

### Step 5: Implementation Phase

**Developer Activities:**
1. Proceed with approved approach
2. Reference approval in implementation comments
3. Implement without additional check-ins (unless blockers)
4. Test thoroughly before committing
5. Commit with reference to approved approach

**Implementation Best Practices:**
- Include approval timestamp in commit body
- Reference user's approval message if helpful
- Document any deviations from proposal (with rationale)
- If blockers discovered, stop and re-engage user

**Example Commit:**
```
fix: extract allowed-tools from slash commands per Claude Code spec

Refs BUG-030
Approved: User approval at [timestamp]

Root cause: Parser looked for 'tools' but spec defines 'allowed-tools'

Implementation:
- Updated projectDiscovery.js to extract 'allowed-tools' from commands
- Map to response 'tools' field for frontend consistency
- Added test coverage for allowed-tools extraction

This implements Option 1 from the approved proposal.
```

---

## Benefits of Development Approved Strategy

### Benefit 1: Prevents Implementing Wrong Solution

**Problem Prevented:**
- Developer implements solution based on incomplete understanding
- User reviews and rejects approach
- Work must be discarded and redone
- 30-60 minutes of wasted effort

**Example (Prevented):**
```
WITHOUT Development Approved:
10:00 - Developer assumes frontend fix is needed
10:30 - Implements complex frontend workaround
11:00 - User reviews: "This should be fixed in backend spec compliance"
11:00 - All work discarded
11:30 - Start over with backend fix
[Net: 90 minutes, 30 minutes wasted]

WITH Development Approved:
10:00 - Developer analyzes and proposes both frontend and backend options
10:05 - User approves backend approach
10:35 - Backend fix implemented correctly
[Net: 35 minutes, 0 minutes wasted]
```

### Benefit 2: Aligns on Approach Before Time Investment

**Value:**
- User and developer agree on direction upfront
- Reduces "surprise" factor in code review
- Ensures user's strategic preferences are honored
- Developer has confidence to proceed without hesitation

**Example:**
```
User preference: "We should always fix root causes, not symptoms"
Developer proposal: Option 1 (root cause) vs Option 2 (workaround)
User approves: Option 1
Developer implements with confidence (no second-guessing)
```

### Benefit 3: Reduces Rework and Reverts

**Evidence from October 7, 2025 Incident:**
- Massive features implemented without approval → 350+ errors → full revert
- Development Approved pattern would have caught misalignments early
- 6 hours of work lost due to lack of upfront alignment

**Evidence from October 22, 2025 Bug Sprint:**
- BUG-030 used Development Approved pattern
- Zero rework needed after approval
- Clean single-commit implementation
- 5/5 star session rating

### Benefit 4: Clear Approval Trail in Session Transcript

**Value for Audit and Documentation:**
- User approval is timestamped in transcript
- Future developers can see reasoning for approach
- Compliance and decision traceability
- Reduces "why was it done this way?" questions

**Example Audit Trail:**
```
[2025-10-26 10:05:32 UTC]
Developer: "BUG-030 proposal: Fix backend to extract allowed-tools"
User: "development approved"
[2025-10-26 10:35:17 UTC]
Commit: fix: extract allowed-tools (refs approval at 10:05:32)
```

### Benefit 5: Team Alignment on Architectural Decisions

**Value:**
- Establishes precedent for similar issues
- Documents architectural philosophy
- Reduces future debates on similar decisions
- Builds shared understanding

**Example:**
```
Decision: "Always comply with Claude Code spec, even if frontend workaround is faster"
Future impact: Similar spec compliance issues default to backend fix
Team alignment: Everyone knows the standard approach
```

### Benefit 6: Confidence in Implementation Direction

**Developer Perspective:**
- "I know this is the right approach because user approved it"
- No second-guessing during implementation
- Can focus on quality execution, not strategy

**User Perspective:**
- "I reviewed and approved this, so I'm confident in the outcome"
- No surprises in code review
- Can provide focused feedback on execution, not strategy

---

## Costs of Development Approved Strategy

### Cost 1: Adds 5-10 Minutes Discussion Time

**Breakdown:**
- 2-3 minutes: Developer analysis and proposal preparation
- 1-2 minutes: User review
- 1-2 minutes: Clarification (if needed)
- 1 minute: Explicit approval and transition

**When This Cost Is Worth It:**
- Complex features (>30 min implementation)
- Architectural decisions affecting multiple areas
- High rework risk if wrong approach chosen
- User has strong preferences or constraints

**When This Cost Is Not Worth It:**
- Trivial fixes (<10 min implementation)
- Obvious, non-ambiguous changes
- Low rework risk (easy to change later)
- Established pattern already exists

### Cost 2: Requires Proposal Clarity Upfront

**Challenge:**
- Developer must think through options before implementing
- Requires more upfront analysis
- Can feel like "slowing down" for experienced developers

**Mitigation:**
- Use proposal template for consistency
- Practice makes proposal preparation faster (2-3 min with experience)
- Upfront thinking reduces debugging time later (net positive)

### Cost 3: Not Suitable for Routine/Obvious Tasks

**Anti-Patterns (Don't Use Development Approved For):**
- Fixing typos in documentation
- Updating version numbers
- Adding missing semicolons
- Obvious spec compliance (no alternatives)
- Copy-paste code duplication fixes

**Rule of Thumb:**
```
If there are no meaningful alternatives to discuss, skip Development Approved.
Use Rapid Iteration instead.
```

---

## Evidence from Session 2 (Real-World Example)

### Context: BUG-030 Fix

**Session:** October 26, 2025 (Phase 2.3 planning)
**Bug:** Commands showing empty tools field in sidebar
**Strategy Used:** Development Approved

### Timeline

**10:00:00** - Bug identified during testing
**10:02:30** - Developer analyzes root cause (backend parser issue)
**10:05:15** - Developer prepares proposal with 3 options
**10:06:00** - Developer submits proposal to user
**10:08:45** - User reviews proposal (2min 45sec)
**10:09:00** - User responds: "development approved"
**10:09:30** - Developer begins implementation
**10:35:00** - Implementation complete with tests
**10:36:00** - Commit created with approval reference

**Total Time:** 36 minutes (6 min discussion + 30 min implementation)
**Rework:** 0 minutes
**Approval Trail:** Clear timestamp at 10:09:00

### Key Success Factors

1. **Clear Proposal:** 3 options with pros/cons made decision easy
2. **Quick User Review:** 2min 45sec review time (well-structured proposal)
3. **Explicit Approval:** "development approved" left no ambiguity
4. **Confident Implementation:** Developer proceeded without hesitation
5. **Zero Rework:** First implementation was correct and accepted
6. **Audit Trail:** Commit referenced approval timestamp

### Counterfactual (Without Development Approved)

**Alternative Timeline (Estimated):**
```
10:00:00 - Bug identified
10:01:00 - Developer assumes frontend fix (wrong assumption)
10:30:00 - Frontend workaround implemented
10:35:00 - User reviews in code review
10:36:00 - User: "This should be backend fix, not frontend workaround"
10:36:30 - Developer reverts frontend changes
10:37:00 - Developer starts backend fix
11:05:00 - Backend fix complete
11:10:00 - Commit created

Total: 70 minutes (30 min wasted on wrong approach)
```

**Actual Savings:** 70 - 36 = 34 minutes saved

### Lessons Applied

This pattern directly addresses issues from October 7, 2025 workflow analysis:
- **Issue:** "Massive feature scope implemented without validation"
- **Solution:** Validate approach before implementing
- **Issue:** "Testing happened too late to catch direction issues"
- **Solution:** Approval catches direction issues before implementation
- **Issue:** "No feedback loops during development"
- **Solution:** Proposal → Approval creates early feedback loop

---

## Real-World Examples

### Example 1: BUG-030 Command Tools Field

**Category:** Backend parser bug with architectural decision

**Proposal:**
```
BUG-030 Analysis: Commands show empty tools field

Root cause: Backend extracts 'tools' but Claude Code spec defines 'allowed-tools'

Options:
1. Update backend parser (recommended) - 30 min
2. Change spec expectation (not recommended) - 5 min
3. Support both (adds complexity) - 45 min

Recommendation: Option 1 (spec compliance)

Approach approved?
```

**User Response:** "development approved"

**Outcome:** 30 min implementation, 0 min rework, clean commit

---

### Example 2: Phase 2.1 Component Refactoring (Hypothetical)

**Category:** Large refactoring with multiple architectural approaches

**Proposal:**
```
Phase 2.1 Component Extraction Strategy

Goal: Reduce 62% code duplication in ProjectDetail.vue and UserGlobal.vue

Options:

1. Extract full components (ConfigCard, ConfigDetailSidebar, etc.)
   Pros: Maximum reusability, clean separation
   Cons: More upfront work (3-4 hours)
   Risk: Medium - large refactor

2. Extract shared utilities only (keep components monolithic)
   Pros: Faster (1-2 hours), lower risk
   Cons: Still significant duplication remains
   Risk: Low

3. Mixins/Composables approach (Vue 3 composition API)
   Pros: Modern Vue pattern, flexible
   Cons: Learning curve, may complicate
   Risk: Medium - team unfamiliarity

Recommendation: Option 1 - Full component extraction
Rationale: Sets foundation for Phase 3+ scalability, addresses root cause

Questions:
- Is 3-4 hour investment acceptable for Phase 2.1?
- Should we defer to Phase 3 if time-constrained?

Approach approved?
```

**Expected User Response:**
```
"Let's go with Option 1. The investment is worth it for long-term maintainability.
development approved"
```

**Implementation:** Proceed with full component extraction per PRD

---

### Example 3: Navigation Bug Fix (Hypothetical)

**Category:** UI bug with simple vs complex fix trade-off

**Proposal:**
```
BUG-015 Analysis: Breadcrumb navigation not visible on mobile

Root cause: CSS uses fixed width, doesn't adapt to viewport

Options:

1. Quick CSS fix: Use responsive units (vw instead of px)
   Pros: 5 minute fix, low risk
   Cons: Doesn't address root layout issues
   Time: 5 min

2. Refactor breadcrumb component with mobile-first design
   Pros: Robust solution, works on all breakpoints
   Cons: Requires component rewrite
   Time: 45 min

Recommendation: Option 2 - Mobile-first refactor
Rationale: We're getting multiple mobile layout bugs. Better to fix properly once.

Approach approved?
```

**User Response:** "Actually, let's do Option 1 for now. We can refactor in Phase 2.1 component work. development approved for Option 1"

**Outcome:** 5 min fix, deferred refactor to planned work, user's timeline priorities honored

---

## When NOT to Use Development Approved

### Anti-Pattern 1: Trivial Changes

**Example (Bad Use):**
```
Developer: "I found a typo in README.md: 'manger' should be 'manager'.
Should I fix it?"

[This doesn't need approval - just fix it]
```

### Anti-Pattern 2: Established Patterns

**Example (Bad Use):**
```
Developer: "BUG-031 is the same root cause as BUG-030 (allowed-tools extraction).
Should I apply the same fix to MCP parser?"

[Yes, obviously - it's an established pattern]
```

### Anti-Pattern 3: No Meaningful Alternatives

**Example (Bad Use):**
```
Developer: "The test is failing because I hardcoded 'tools' but it should check 'allowed-tools'.
Should I update the test to match the new behavior?"

[Yes, this is obvious - test should match code behavior]
```

### Rule of Thumb

**Use Development Approved When:**
- Multiple valid implementation approaches exist
- Architectural decision affects multiple components
- User's preferences or constraints are unclear
- High rework risk if wrong approach chosen

**Use Rapid Iteration When:**
- Only one obvious approach exists
- Change is trivial or routine
- Established pattern already exists
- Low rework risk

---

## Strategy 2: Rapid Iteration

**Pattern:** Implement → Test → Commit

**When to Use:**
- Small bug fixes (<30 min)
- Documentation updates
- Quick refactors with clear direction
- Tests already passing, simple changes
- Obvious/non-ambiguous improvements

**Pattern Flow (3 Steps)**

### Step 1: Make Change

**Developer Activities:**
1. Identify straightforward change needed
2. Make modification with confidence
3. No discussion phase needed

**Examples:**
- Fix typo in documentation
- Update version number
- Add missing semicolon
- Remove debug console.log
- Fix obvious test assertion

### Step 2: Test Thoroughly

**Developer Activities:**
1. Run relevant tests
2. Manual verification if appropriate
3. Check for regressions
4. Confirm change works as expected

**Test Levels:**
- Unit tests (if applicable)
- Integration tests (if applicable)
- Manual smoke test (quick check)

### Step 3: Commit

**Developer Activities:**
1. Create commit with clear message
2. Push to feature branch
3. Continue to next task

**Commit Message Format:**
```
fix: correct typo in README.md

Changed 'manger' to 'manager' in installation section.
```

---

## Benefits of Rapid Iteration

### Benefit 1: Fast Execution

**Time Comparison:**
- Development Approved: 5-10 min discussion + implementation
- Rapid Iteration: 0 min discussion + implementation

**Net Savings:** 5-10 minutes per trivial change

**Example:**
```
10:00:00 - Identify typo
10:00:30 - Fix typo
10:01:00 - Commit
[Total: 1 minute]

vs. Development Approved:
10:00:00 - Identify typo
10:01:00 - Prepare proposal (unnecessary)
10:03:00 - User reviews (unnecessary)
10:04:00 - Approval
10:04:30 - Fix typo
10:05:00 - Commit
[Total: 5 minutes, 4 minutes wasted]
```

### Benefit 2: Minimal Overhead

**No Process Friction:**
- No proposal preparation
- No waiting for approval
- No context switching
- Developer stays in flow

### Benefit 3: Good for Routine Changes

**Established Patterns:**
- Applying existing pattern to new case
- Following documented standard
- Repeating prior successful approach

---

## Costs of Rapid Iteration

### Cost 1: Higher Risk of Wrong Approach

**If Change Is Not Actually Trivial:**
- Developer may miss edge cases
- May implement suboptimal solution
- User may reject in code review
- Rework required

**Mitigation:**
- Use Development Approved if ANY doubt exists
- "When in doubt, ask for approval"

### Cost 2: No User Input on Preferences

**Potential Issue:**
- User may have specific preferences
- User may be aware of broader context
- User may prefer different approach

**Mitigation:**
- Reserve Rapid Iteration for truly obvious changes
- Escalate to Development Approved if user feedback desired

---

## Strategy 3: Parallel Execution

**Pattern:** Plan → Launch All → Monitor → Validate

**When to Use:**
- Multiple independent tasks, no file conflicts
- 4+ tasks of similar scope (15-30 min each)
- No logical dependencies between tasks
- Well-defined, non-overlapping scope

**Pattern Flow (4 Steps)**

### Step 1: Plan All Tasks

**Project Manager/Orchestrator Activities:**
1. Identify all tasks in batch
2. Analyze dependencies between tasks
3. Confirm file-level independence
4. Verify similar scope/complexity

**Independence Checklist:**
- [ ] Tasks modify different files OR
- [ ] Tasks modify same file in non-conflicting sections (append-only)
- [ ] No logical dependencies (Task B doesn't need Task A output)
- [ ] Similar time estimates (avoid one task blocking others)

**Example:**
```
Story 3.2: Configuration Cards

Tasks:
- TASK-3.2.1: Create AgentCard.vue (new file) - 30 min
- TASK-3.2.2: Create CommandCard.vue (new file) - 30 min
- TASK-3.2.3: Create HookCard.vue (new file) - 30 min
- TASK-3.2.4: Create MCPCard.vue (new file) - 30 min

Independence check:
✅ Different files (no conflicts)
✅ No dependencies (cards are independent)
✅ Similar scope (all 30 min)
✅ 4 tasks (good candidate for parallel)

Decision: Execute in parallel
```

### Step 2: Launch All Subagents

**Orchestrator Activities:**
1. Invoke all subagents simultaneously
2. Provide clear task scope to each
3. Set return information expectations

**Example:**
```javascript
// Launch 4 frontend developers in parallel
Promise.all([
  Task({
    subagent_type: "frontend-developer",
    description: "Create AgentCard.vue component",
    prompt: "Implement TASK-3.2.1: AgentCard.vue with props, events, styling"
  }),
  Task({
    subagent_type: "frontend-developer",
    description: "Create CommandCard.vue component",
    prompt: "Implement TASK-3.2.2: CommandCard.vue with props, events, styling"
  }),
  Task({
    subagent_type: "frontend-developer",
    description: "Create HookCard.vue component",
    prompt: "Implement TASK-3.2.3: HookCard.vue with props, events, styling"
  }),
  Task({
    subagent_type: "frontend-developer",
    description: "Create MCPCard.vue component",
    prompt: "Implement TASK-3.2.4: MCPCard.vue with props, events, styling"
  })
])
```

### Step 3: Monitor Completion

**Orchestrator Activities:**
1. Wait for all subagents to complete
2. Track which tasks finish first
3. Identify any blockers or errors
4. Collect results from all agents

**Timeline Example:**
```
00:00 - Launch all 4 agents
00:06 - Agent 3 completes (HookCard) - fastest
00:08 - Agent 2 completes (CommandCard)
00:09 - Agent 4 completes (MCPCard)
00:11 - Agent 1 completes (AgentCard) - slowest

Total: 11 minutes (longest task)
vs. Sequential: 4 × 30 min = 120 minutes

Time savings: 109 minutes (91% reduction)
```

### Step 4: Validate Results

**Quality Assurance Activities:**
1. Review all completed tasks
2. Run tests on all changes
3. Check for integration issues
4. Verify all acceptance criteria met

**Batch Commit:**
```
feat: implement configuration cards for all 4 types (Tasks 3.2.1-3.2.4)

Parallel implementation:
- AgentCard.vue: Display agent metadata
- CommandCard.vue: Display command metadata
- HookCard.vue: Display hook metadata
- MCPCard.vue: Display MCP server metadata

All cards follow consistent design pattern with theme support.
```

---

## Benefits of Parallel Execution

### Benefit 1: 50-87% Time Savings vs Sequential

**Real-World Evidence:**

**October 26, 2025 Analysis:**
- 6 documentation tasks executed in parallel
- Completion time: 15 minutes (longest task)
- Sequential estimate: 2+ hours
- Time savings: 87%

**Hypothetical Configuration Cards:**
- 4 component tasks in parallel
- Completion time: 11 minutes (longest task)
- Sequential time: 120 minutes (4 × 30 min)
- Time savings: 91%

### Benefit 2: Better Resource Utilization

**Multiple Agents Working Simultaneously:**
- Main agent doesn't block on single task
- Subagents execute in parallel
- System resources (CPU, tools) utilized efficiently

### Benefit 3: Faster Overall Execution

**Project Timeline Impact:**
- Stories complete faster
- More stories per day
- Faster path to Phase completion

**Example:**
```
Sequential: 5 stories × 4 hours each = 20 hours (2.5 days)
Parallel:   5 stories × 1 hour each  = 5 hours  (0.6 days)
```

---

## Costs of Parallel Execution

### Cost 1: Requires Careful Dependency Analysis

**Risk:**
- If tasks are NOT independent, parallel execution creates conflicts
- Merge conflicts from overlapping changes
- Logical errors from missing dependencies

**Mitigation:**
- Thorough upfront analysis
- Conservative approach (if doubt exists, execute sequentially)

### Cost 2: Coordination Overhead

**Complexity:**
- Must manage multiple subagent lifecycles
- Must collect and aggregate results
- More complex error handling

**When Overhead Exceeds Benefits:**
- Only 2-3 tasks (not worth parallel complexity)
- Tasks have unclear scope (risk of rework)
- High likelihood of conflicts

### Cost 3: Batch Commit Loses Granularity

**Trade-Off:**
```
Sequential: 4 separate commits (fine-grained history)
Parallel:   1 batch commit (coarse-grained history)
```

**When This Matters:**
- Need to revert individual task
- Want detailed git blame information
- Complex code review process

**Mitigation:**
- Document all tasks in commit body
- Use clear task references (TASK-3.2.1, 3.2.2, etc.)

---

## Comparison Table

| Aspect | Development Approved | Rapid Iteration | Parallel Execution |
|--------|---------------------|-----------------|-------------------|
| **Best For** | Complex decisions | Simple changes | Independent tasks |
| **Time Investment** | +5-10 min discussion | Minimal overhead | Setup overhead, large savings |
| **Risk Mitigation** | High (prevents rework) | Low (relies on judgment) | Medium (requires analysis) |
| **User Involvement** | High (approval required) | None (dev decides) | Medium (validates plan) |
| **Commit Frequency** | After approval + impl | After change | Batch commit |
| **Rollback Ease** | Easy (clear rationale) | Easy (small change) | Medium (batch revert) |
| **When to Use** | Uncertainty exists | Obvious change | 4+ independent tasks |
| **When NOT to Use** | Trivial changes | Complex decisions | Dependent tasks |

---

## Decision Tree

```
START: New task identified

├─ Is this a trivial/obvious change?
│  ├─ YES → Rapid Iteration
│  └─ NO → Continue
│
├─ Are there multiple implementation approaches?
│  ├─ YES → Development Approved
│  └─ NO → Continue
│
├─ Are there 4+ similar independent tasks?
│  ├─ YES → Parallel Execution
│  └─ NO → Sequential execution with appropriate strategy
│
└─ When in doubt → Development Approved (safer default)
```

---

## How to Select a Strategy

### Ask These Questions

1. **How complex is the change?**
   - Trivial → Rapid Iteration
   - Complex → Development Approved
   - Multiple independent parts → Parallel Execution

2. **How many implementation approaches exist?**
   - One obvious way → Rapid Iteration
   - Multiple valid ways → Development Approved

3. **How much rework risk exists?**
   - Low (easy to change later) → Rapid Iteration
   - High (expensive to redo) → Development Approved

4. **How many similar tasks are there?**
   - 1-3 tasks → Sequential with appropriate strategy
   - 4+ tasks → Consider Parallel Execution

5. **What is the user's preferred involvement level?**
   - Hands-off → Rapid Iteration for routine work
   - Collaborative → Development Approved for decisions

### Default Strategy Recommendations

| Task Type | Default Strategy |
|-----------|------------------|
| Bug fix (simple) | Rapid Iteration |
| Bug fix (complex) | Development Approved |
| New feature (small) | Rapid Iteration |
| New feature (large) | Development Approved |
| Refactoring (isolated) | Rapid Iteration |
| Refactoring (widespread) | Development Approved |
| Documentation (typos) | Rapid Iteration |
| Documentation (structure) | Development Approved |
| Tests (add missing) | Rapid Iteration |
| Tests (refactor suite) | Development Approved |
| Multiple independent components | Parallel Execution |

---

## Workflow Integration

See `/home/claude/manager/.claude/commands/dev-strategy.md` for slash command to select strategy at session start.

See individual subagent prompts for strategy-aware implementation guidance.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-26 | Initial creation with 3 strategies |

---

**Next:** See `/home/claude/manager/.claude/commands/dev-strategy.md` for usage instructions.
