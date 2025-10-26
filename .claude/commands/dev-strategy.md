---
name: dev-strategy
description: Select development strategy for current session (approved, rapid, or parallel)
allowed-tools:
  - Read
  - Write
---

# Development Strategy Selection

This command helps establish which development approach will be used for the current session. Different strategies work better for different types of tasks.

## Quick Start

**Select your strategy with one of these commands:**

```
/dev-strategy approved   # For complex features requiring discussion
/dev-strategy rapid      # For straightforward changes
/dev-strategy parallel   # For multiple independent tasks
```

---

## Available Strategies

### 1. Development Approved (Pre-Implementation Discussion)

**Best For:**
- Complex features with multiple implementation approaches
- Architectural decisions affecting multiple components
- Bug fixes requiring user input on approach
- When avoiding rework is high priority

**Pattern:** Propose → Discuss → Approve → Implement

**Time Impact:**
- +5-10 min discussion upfront
- Saves 30-60 min rework later
- Net positive for complex changes

**Example Use Case:**
```
BUG-030: Commands show empty tools field

Developer analyzes and finds 3 possible fixes:
1. Update backend parser (spec-compliant)
2. Change spec expectation (quick fix)
3. Support both (complex)

Developer proposes Option 1, user approves, implementation proceeds.
Result: No rework, clean implementation
```

**When to Use:**
- "I see multiple ways to fix this. Which is preferred?"
- "This change affects several components. Should we discuss approach?"
- "I want to validate my understanding before implementing."

---

### 2. Rapid Iteration (Quick Changes)

**Best For:**
- Small bug fixes (<30 min)
- Documentation updates
- Obvious, non-ambiguous changes
- Established patterns being applied
- Trivial improvements

**Pattern:** Change → Test → Commit

**Time Impact:**
- Minimal overhead
- Fast execution
- No discussion delay

**Example Use Case:**
```
Found typo in README.md: "manger" should be "manager"

Developer fixes immediately, commits, moves on.
Total time: 1 minute
```

**When to Use:**
- "This is obvious, no discussion needed."
- "Following established pattern from similar fix."
- "Quick documentation improvement."

---

### 3. Parallel Execution (Multiple Independent Tasks)

**Best For:**
- 4+ independent tasks with similar scope
- No file conflicts between tasks
- No logical dependencies
- Well-defined, clear requirements

**Pattern:** Plan All → Launch All → Monitor → Validate

**Time Impact:**
- Small setup overhead
- 50-87% time savings vs sequential
- Batch commit at end

**Example Use Case:**
```
Story 3.2: Create 4 configuration card components

Tasks are independent (different files, no dependencies):
- AgentCard.vue
- CommandCard.vue
- HookCard.vue
- MCPCard.vue

Launch all 4 in parallel → complete in 11 minutes
vs. sequential: 120 minutes (4 × 30 min)

Time savings: 91%
```

**When to Use:**
- "I have several similar, independent tasks."
- "These tasks don't depend on each other."
- "I can work on multiple things simultaneously."

---

## How to Use This Command

### Option 1: Approved Strategy

**Use When:** Complex features, architectural decisions, uncertain approaches

```
/dev-strategy approved
```

**What Happens:**
1. Session documented with "Development Approved" strategy
2. All agents expect: Proposal → User Approval → Implementation
3. Developers prepare proposals before implementing
4. User reviews and approves approaches
5. Implementation proceeds with confidence

**Agent Behavior:**
- Developer analyzes and prepares proposal
- Developer waits for "development approved" signal
- Developer implements approved approach
- Developer references approval in commit

---

### Option 2: Rapid Strategy

**Use When:** Simple changes, obvious fixes, routine work

```
/dev-strategy rapid
```

**What Happens:**
1. Session documented with "Rapid Iteration" strategy
2. All agents expect: Quick execution with minimal discussion
3. Developers make changes confidently
4. Developers test and commit immediately
5. User reviews in normal code review process

**Agent Behavior:**
- Developer identifies straightforward change
- Developer implements without proposal
- Developer tests thoroughly
- Developer commits and continues

---

### Option 3: Parallel Strategy

**Use When:** Multiple independent tasks, similar scope

```
/dev-strategy parallel
```

**What Happens:**
1. Session documented with "Parallel Execution" strategy
2. Orchestrator analyzes task independence
3. Subagents launched simultaneously for independent tasks
4. Results collected and validated
5. Batch commit for all completed tasks

**Agent Behavior:**
- Orchestrator identifies independent tasks
- Orchestrator launches multiple subagents in parallel
- Subagents execute without blocking each other
- Orchestrator collects results and creates batch commit

---

## Strategy Selection Examples

### Example 1: Complex Bug Fix → Development Approved

**Situation:**
```
BUG-045: Application crashes when loading projects with malformed JSON

Analysis shows 3 possible approaches:
1. Add try-catch with error recovery
2. Pre-validate JSON before parsing
3. Use schema validation library

Developer is unsure which approach user prefers.
```

**Command:**
```
/dev-strategy approved
```

**Workflow:**
1. Developer analyzes all 3 options
2. Developer prepares proposal with pros/cons
3. Developer submits to user for approval
4. User reviews and selects approach
5. Developer implements approved approach

**Outcome:** Clean implementation matching user's architectural preferences

---

### Example 2: Documentation Update → Rapid Iteration

**Situation:**
```
Found several typos in CLAUDE.md and README.md
Need to update outdated version numbers
Want to clarify installation instructions
```

**Command:**
```
/dev-strategy rapid
```

**Workflow:**
1. Developer fixes typos immediately
2. Developer updates version numbers
3. Developer clarifies instructions
4. Developer tests (quick read-through)
5. Developer commits all changes

**Outcome:** Fast execution, no unnecessary discussion

---

### Example 3: Component Creation Sprint → Parallel Execution

**Situation:**
```
Epic 3.2: Create 6 configuration display components

All components are similar structure:
- AgentCard.vue
- CommandCard.vue
- HookCard.vue
- MCPCard.vue
- LoadingState.vue
- EmptyState.vue

All components are independent (new files, no conflicts)
```

**Command:**
```
/dev-strategy parallel
```

**Workflow:**
1. Orchestrator identifies 6 independent tasks
2. Orchestrator launches 6 frontend-developer subagents
3. All subagents work simultaneously
4. Completion time: ~15 minutes (longest task)
5. Orchestrator validates all components
6. Orchestrator creates batch commit

**Outcome:** 6 components in 15 min vs 3 hours sequential (90% time savings)

---

## Changing Strategies Mid-Session

You can switch strategies at any time during a session:

```
# Started with rapid, but encountered complex decision
/dev-strategy approved

# Finished complex work, back to simple changes
/dev-strategy rapid

# Identified batch of independent tasks
/dev-strategy parallel
```

**Effect:** New strategy applies to all subsequent work in the session.

---

## Strategy Selection Guidance

### Decision Tree

```
START: What kind of work are you doing?

┌─ Simple, obvious changes?
│  └─ /dev-strategy rapid
│
┌─ Complex features or architectural decisions?
│  └─ /dev-strategy approved
│
┌─ 4+ independent tasks of similar scope?
│  └─ /dev-strategy parallel
│
└─ Mixed work or uncertain?
   └─ /dev-strategy approved (safer default)
```

### Common Scenarios

| Scenario | Recommended Strategy |
|----------|---------------------|
| Bug sprint (multiple simple bugs) | Rapid Iteration |
| Bug sprint (complex root cause analysis) | Development Approved |
| New feature (unclear requirements) | Development Approved |
| New feature (clear spec, multiple components) | Parallel Execution |
| Refactoring (isolated change) | Rapid Iteration |
| Refactoring (widespread impact) | Development Approved |
| Documentation (typos, updates) | Rapid Iteration |
| Documentation (structural changes) | Development Approved |
| Component library (multiple similar components) | Parallel Execution |

---

## Strategy Benefits Comparison

| Strategy | Time Impact | Risk Mitigation | Best For |
|----------|-------------|-----------------|----------|
| **Development Approved** | +5-10 min upfront, saves 30-60 min rework | High (prevents wrong implementations) | Complex decisions |
| **Rapid Iteration** | Minimal overhead | Low (relies on developer judgment) | Obvious changes |
| **Parallel Execution** | Setup overhead, 50-87% overall savings | Medium (requires dependency analysis) | Independent tasks |

---

## Real-World Evidence

### Session 1: Development Approved Success (October 26, 2025)

**BUG-030 Fix:**
- Strategy: Development Approved
- Discussion time: 6 minutes
- Implementation time: 30 minutes
- Rework needed: 0 minutes
- Total: 36 minutes

**Counterfactual (Without Approval):**
- Wrong approach implemented: 30 minutes
- Code review rejection: 0 minutes (discover in review)
- Redo with correct approach: 30 minutes
- Total: 60 minutes (67% longer)

**Savings:** 24 minutes + prevented frustration

---

### Session 2: Parallel Execution Success (October 26, 2025 Analysis)

**6 Documentation Tasks:**
- Strategy: Parallel Execution
- Execution time: 15 minutes (longest task)
- Sequential estimate: 2 hours (6 × 20 min)
- Time savings: 87%

**Impact:** 105 minutes saved, enabling same-day completion

---

### Session 3: Rapid Iteration Success (October 22, 2025)

**16 Bug Fixes in 4 Groups:**
- Strategy: Hybrid (Rapid for Group 1, Approved for Groups 2-4)
- Group 1 (simple CSS): 8 minutes (Rapid)
- Groups 2-4 (complex): Development Approved pattern
- Total: 24 hours (systematic approach)
- Regressions: 0
- Test pass rate: 100%

**Result:** 5/5 star session rating, zero rework

---

## Questions About Strategies?

**Detailed Documentation:**
See `/home/claude/manager/.claude/templates/development-strategies.md` for:
- Comprehensive explanation of each strategy
- When to use each approach
- Real-world examples from past sessions
- Benefits and costs analysis
- Time impact data

**Strategy History:**
- October 7, 2025: Massive scope + late testing → 350+ errors, full revert
- October 12, 2025: Small tasks + mandatory testing → 100% completion, 0 errors
- October 22, 2025: Systematic approach → 5/5 rating, 16 bugs fixed, 0 regressions
- October 26, 2025: Development Approved pattern → 0 rework, clean implementation

---

## How Agents Use Strategy Information

### Developer Agents (backend-architect, frontend-developer)

**Development Approved Mode:**
- Prepare proposals before implementing
- Wait for user approval signal
- Implement with confidence after approval
- Reference approval in commits

**Rapid Iteration Mode:**
- Implement straightforward changes immediately
- Test thoroughly
- Commit without waiting for approval

**Parallel Execution Mode:**
- Accept parallel task assignments
- Work independently without coordination
- Return results for batch commit

---

### Orchestrator Agents (subagent-orchestrator, project-manager)

**Development Approved Mode:**
- Plan proposal preparation steps
- Schedule user approval checkpoints
- Validate approval before implementation

**Rapid Iteration Mode:**
- Minimize planning overhead
- Enable fast task execution
- Focus on testing and commit quality

**Parallel Execution Mode:**
- Analyze task independence
- Launch multiple subagents simultaneously
- Coordinate batch results collection

---

## Tips for Maximum Efficiency

### Tip 1: Start with Strategy Selection

**At beginning of every session:**
```
User: "I want to fix bugs today"
Command: /dev-strategy approved  # (if bugs are complex)
or
Command: /dev-strategy rapid     # (if bugs are simple)
```

**Benefit:** Sets expectations for entire session

---

### Tip 2: Switch Strategies as Work Changes

**During session:**
```
# Started with simple changes (rapid)
# Encountered complex decision
/dev-strategy approved

# Finished complex work
# Back to routine changes
/dev-strategy rapid
```

**Benefit:** Right strategy for right task = maximum efficiency

---

### Tip 3: Use Parallel for Component Libraries

**Whenever creating multiple similar components:**
```
/dev-strategy parallel

# Then invoke orchestrator to identify independent tasks
/swarm
```

**Benefit:** 50-87% time savings vs sequential

---

### Tip 4: When in Doubt, Use Development Approved

**If uncertain about strategy choice:**
```
/dev-strategy approved
```

**Rationale:** Safer default, prevents rework, enables user input

---

## Command Output

When you run this command, you'll see:

```
Development Strategy Selected: [STRATEGY NAME]

Strategy Active: All subsequent work will use [STRATEGY NAME] pattern.

Pattern:
[STRATEGY PATTERN DESCRIPTION]

Agent Behavior:
[HOW AGENTS WILL BEHAVE]

To Change Strategy: Run /dev-strategy [approved|rapid|parallel]

Documentation: /home/claude/manager/.claude/templates/development-strategies.md
```

---

## Integration with Other Commands

### Works Well With:

**`/swarm`** - Orchestrator respects selected strategy
```
/dev-strategy parallel
/swarm  # Will use parallel execution for independent tasks
```

**Project planning** - Strategy informs task breakdown
```
/dev-strategy approved
[Plan complex feature with proposal steps]
```

**Bug triage** - Strategy matches bug complexity
```
/dev-strategy rapid     # For simple bug sprint
/dev-strategy approved  # For complex root cause analysis
```

---

## History and Evolution

### Version 1.0 (October 26, 2025)

**Strategies Defined:**
1. Development Approved (complex decisions)
2. Rapid Iteration (simple changes)
3. Parallel Execution (independent tasks)

**Evidence Base:**
- October 7, 2025 incident analysis (workflow failures)
- October 12, 2025 success (100% completion)
- October 22, 2025 bug sprint (5/5 stars)
- October 26, 2025 BUG-030 fix (development approved pattern)

**Purpose:**
Formalize proven patterns for reuse across all future development

---

**Next Steps After Selection:**

1. **Strategy documented** in session metadata
2. **Agents aware** of selected pattern
3. **User expectations** aligned with approach
4. **Work proceeds** using appropriate pattern
5. **Results measured** against strategy goals

**Questions?** Ask user or read full documentation at:
`/home/claude/manager/.claude/templates/development-strategies.md`
