# Development Strategies

## Introduction

This guide describes the three proven development strategies used in the Claude Code Manager project. Each strategy is optimized for different types of work, and selecting the right strategy for your task can dramatically improve efficiency and reduce rework.

Different types of work require different development approaches. This project uses **three proven strategies** optimized for different task characteristics.

## Strategy Overview

| Strategy | Best For | Pattern | Time Impact |
|----------|----------|---------|-------------|
| **SWARM** | Ticket-based development | 7 phases, quality gates | 40-62% time savings with parallelization |
| **Development Approved** | Complex features, architectural decisions | Propose → Approve → Implement | +5-10 min discussion, saves 30-60 min rework |
| **Rapid Iteration** | Simple changes, obvious fixes | Implement → Test → Commit | Minimal overhead, fast execution |
| **Parallel Execution** | Multiple independent tasks | Plan → Launch All → Validate | 50-87% time savings vs sequential |

## When to Use Each Strategy

### Use Development Approved when:
- Multiple implementation approaches exist
- Architectural decision affects multiple components
- High rework risk if wrong approach chosen
- User preferences or constraints unclear

### Use Rapid Iteration when:
- Only one obvious approach exists
- Change is trivial or routine
- Established pattern already exists
- Low rework risk, easy to change later

### Use Parallel Execution when:
- 4+ independent tasks with similar scope
- No file conflicts between tasks
- No logical dependencies
- Well-defined, clear requirements

## Strategy Selection Command

Select development strategy at session start:

```bash
/dev-strategy approved   # For complex features
/dev-strategy rapid      # For straightforward changes
/dev-strategy parallel   # For independent tasks
```

**Effect:** All agents adapt their workflow to selected strategy.

## Real-World Evidence

### October 26, 2025 - BUG-030 Fix (Development Approved)
- Proposal prepared: 3 options with pros/cons
- User approval: "development approved" (6 min discussion)
- Implementation: 30 min, zero rework
- **Result:** 36 min total vs 70 min with wrong approach (48% faster)

### October 22, 2025 - Bug Sprint (Hybrid Strategies)
- 16 bugs fixed in 4 organized groups
- Simple CSS fixes: Rapid Iteration (8 min for 4 bugs)
- Complex parser fixes: Development Approved pattern
- **Result:** 5/5 star session, zero regressions, 100% test pass rate

### October 26, 2025 - Documentation Tasks (Parallel Execution)
- 6 independent documentation tasks
- Parallel execution: 15 min (longest task)
- Sequential estimate: 2+ hours
- **Result:** 87% time savings

## Strategy Documentation

**Comprehensive Guide:**
`.claude/templates/development-strategies.md`

**Slash Command:**
`.claude/commands/dev-strategy.md`

**Key Principle:** Right strategy for right task = maximum efficiency with minimal rework.

## How to Apply This Guide

1. **At session start:** Assess the type of work you'll be doing
2. **Choose your strategy:** Use the "When to Use" criteria above
3. **Execute the command:** Run `/dev-strategy <type>` to set the strategy
4. **Follow the pattern:** Adapt your workflow to match the selected strategy
5. **Review results:** Compare actual vs. expected time impact

## SWARM Strategy (Recommended for Tickets)

**Definition:** Specialized Workflow with Autonomous Resource Management

**When to Use:**
- Implementing any ticket (Epic/Story/Task/Bug) from the ticketing system
- Feature development requiring multiple subagents
- Work that benefits from structured phases and quality gates
- Projects requiring session continuity (tracking documents)

**Architecture:**
- **Main Agent:** Coordinates all subagent invocations
- **Orchestrator:** Creates execution plans (does NOT invoke subagents)
- **Ticket Manager:** API-style ticket operations
- **Session Tracking:** Maintained by main agent for continuity

**7-Phase Workflow:**
1. **Session Initialization:** Orchestrator analyzes ticket, creates plan
2. **Git & Session Setup:** Branch creation, tracking document creation
3. **Implementation:** Sequential or parallel execution based on orchestrator's recommendations
4. **Code Commit:** Commit implementation changes
5. **Documentation Commit:** Commit documentation updates (separate commit)
6. **PR & Review:** Code-reviewer provides quality gate
7. **User Approval & Merge:** User approves, git-workflow-specialist merges

**Parallelization:**
- Orchestrator identifies safe parallel opportunities (independent files, no dependencies)
- Main agent decides whether to execute in parallel
- Reference: `docs/guides/PARALLEL-EXECUTION-GUIDE.md`

**Session Continuity:**
- Tracking document: `docs/sessions/tracking/SESSION-<ticket-id>-<date>.md`
- Comprehensive state tracking enables resumption at any point
- Template: `.claude/templates/session-tracking-template.md`

**Evidence:**
- 5 exemplary sessions analyzed (Nov 2, 2025)
- 100% completion rate
- 879/879 tests passing across all sessions
- 40-62% time savings with parallelization

**Commands:**
- `/project-status` - Intelligent ticket selection
- `/swarm <ticket-id>` - Execute SWARM workflow

**Complete Documentation:** `docs/guides/SWARM-WORKFLOW.md`

**When NOT to Use:**
- Quick exploratory work (use Rapid strategy)
- Simple one-file changes (use Approved strategy)
- Purely investigative tasks (use general-purpose agent)

## Code Quality and Standards

All development work must adhere to project coding standards:

**Key Standards:**
- **Test Data:** Use enum model values (`sonnet`, `haiku`, `opus`) not full IDs
- **Import Paths:** Backend uses relative paths, frontend uses `@` aliases
- **Documentation:** Brief comments in code, comprehensive docs in `docs/technical/`
- **CHANGELOG:** Concise entries (3-4 bullets), user-facing features only
- **Commits:** Don't commit test reports or generated documentation

**See:** `docs/guides/CODING-STANDARDS.md` for complete standards and best practices

## Related Resources

- **CLAUDE.md:** Project overview and complete documentation
- **SWARM-WORKFLOW.md:** Complete SWARM workflow documentation
- **PARALLEL-EXECUTION-GUIDE.md:** Parallelization decision criteria and patterns
- **CODING-STANDARDS.md:** Coding standards and best practices
- **TESTING-GUIDE.md:** Test execution and fixture standards
- **development-strategies.md template:** Detailed implementation patterns
- **/dev-strategy command:** Interactive strategy selection tool
- **Workflow analyses:** Real-world examples in `/docs/sessions/workflow-analyses/`
