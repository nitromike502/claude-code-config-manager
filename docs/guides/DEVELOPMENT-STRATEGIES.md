# Development Strategies

## Introduction

This guide describes the three proven development strategies used in the Claude Code Manager project. Each strategy is optimized for different types of work, and selecting the right strategy for your task can dramatically improve efficiency and reduce rework.

Different types of work require different development approaches. This project uses **three proven strategies** optimized for different task characteristics.

## Strategy Overview

| Strategy | Best For | Pattern | Time Impact |
|----------|----------|---------|-------------|
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

## Related Resources

- **CLAUDE.md:** Project overview and complete documentation
- **development-strategies.md template:** Detailed implementation patterns
- **/dev-strategy command:** Interactive strategy selection tool
- **Workflow analyses:** Real-world examples in `/docs/sessions/workflow-analyses/`
