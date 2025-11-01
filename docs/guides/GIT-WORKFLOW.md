# Git Workflow

This guide documents the feature branch workflow used in the Claude Code Manager project. This workflow ensures code quality, enables frequent small commits, and prevents accidental pushes to protected branches.

## Overview

The Claude Code Manager project enforces a **feature branch workflow** to ensure code quality and enable frequent, small commits. All development work must be done on feature branches, and direct commits to main are blocked by Git hooks.

## Mandatory Workflow Rules

1. **No Direct Commits to Main** - A pre-push hook prevents direct pushes to `main`, `master`, or `develop` branches
2. **Feature Branches Required** - All work must be done on feature branches
3. **Small, Focused Tasks** - Tasks should be 30-60 minutes maximum
4. **One Commit Per Task** - Each completed task MUST receive its own dedicated commit
5. **Frequent Commits** - Commit every 15-30 minutes of productive work
6. **Test Immediately** - Test after every task completion
7. **Pull Request Required** - All features require code review before merging

## Feature Branch Workflow

```bash
# 1. Create a feature branch from main BEFORE starting work
git checkout main
git pull
git checkout -b feature/your-feature-name

# 2. Work on ONE task at a time (30-60 min max per task)
# ...edit files for Task A...

# 3. Test your changes for this task
npm test  # or manual testing

# 4. Commit THIS TASK immediately after completion
# IMPORTANT: Verify you're on feature branch before committing
git branch --show-current  # Should show feature/your-feature-name
git add <files>
git commit -m "type: brief description of THIS task"
git push -u origin feature/your-feature-name

# 5. Repeat steps 2-4 for each subsequent task
# Task B → test → commit → push
# Task C → test → commit → push
# Each task gets its own commit!

# 6. Create a Pull Request on GitHub after ALL tasks complete
# IMPORTANT: Create PR from feature branch, do NOT checkout to main first
# The gh pr create command works from the feature branch
gh pr create --title "..." --body "..."

# 7. After PR approval, merge and delete branch
gh pr merge <pr-number>
git checkout main
git pull
git branch -d feature/your-feature-name
```

**Common Mistake to Avoid:**
- ❌ **DO NOT** checkout to main to create the PR - this often leads to accidentally committing on main
- ✅ **DO** stay on your feature branch and run `gh pr create` directly from there

## Branch Naming Conventions

- `feature/` - New features (e.g., `feature/project-discovery`)
- `fix/` - Bug fixes (e.g., `fix/sidebar-scrolling`)
- `chore/` - Maintenance tasks (e.g., `chore/update-deps`)
- `docs/` - Documentation only (e.g., `docs/api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/api-service`)

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <brief description>

[optional body]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `style:` - Code style changes (formatting)

**Examples:**
```
feat: add project discovery service
fix: resolve sidebar scrolling issue
docs: update API endpoint documentation
chore: consolidate sidebar fix docs
test: add [Test 06] sidebar interaction tests
test: fix [Test 100] complete user flow timeout
```

**Test-Related Commit Messages:**

When working with tests, include the test number reference:
```
test: add [Test XXX] description
test: fix [Test XXX] description
test: remove [Test XXX] description
```

Where XXX is the test file number:
- 01-99: Frontend component tests
- 100-199: E2E integration tests
- 200-299: Responsive tests
- 300-399: Visual regression tests

## Why This Workflow?

Per the workflow analysis (see `docs/workflow-analysis-20251007.md`), the October 7 revert was caused by:
- Massive feature scope (2-3 hour chunks)
- No feature branches (100% work on main)
- Infrequent commits (40+ min gaps)
- Late testing (only after "completion")

This resulted in **350+ errors** and lost work. The new workflow prevents these issues by enforcing small, testable, reviewable changes.

## One Commit Per Task Policy

**Why it matters:**
- **Traceability:** Each commit maps to exactly one task, making history clear
- **Revert Granularity:** Can revert individual tasks without losing other work
- **Progress Visibility:** Commit history shows actual work progression
- **Code Review:** Reviewers can see logical progression of changes
- **Debugging:** Easier to identify when/where bugs were introduced

**How to implement:**

### Default: Sequential Work
When tasks must be completed in order:

1. **Start task** → Work on feature
2. **Complete task** → Test immediately
3. **Tests pass** → Commit immediately with task reference
4. **Push to remote** → Make work visible
5. **Start next task** → Repeat cycle

**Example (Sequential):**
```
Task 3.2.1: Create AgentCard component
→ Implement component (20 min)
→ Test rendering (5 min)
→ Commit: "feat: create AgentCard component (Task 3.2.1)"
→ Push to origin

Task 3.2.2: Add agent metadata display
→ Implement metadata (15 min)
→ Test display (5 min)
→ Commit: "feat: add agent metadata display (Task 3.2.2)"
→ Push to origin

Task 3.2.3: Add agent action buttons
→ Implement buttons (20 min)
→ Test interactions (10 min)
→ Commit: "feat: add agent action buttons (Task 3.2.3)"
→ Push to origin
```

### Exception: Parallel Work
When multiple tasks have **no dependencies** and **no file conflicts**, they can be executed in parallel with a batch commit:

**Criteria for parallel execution:**
- ✅ Independent files (or append-only shared files)
- ✅ No logical dependencies between tasks
- ✅ Same feature branch
- ✅ Similar scope (15-30 min each)

**Example (Parallel):**
```
Tasks 3.2.1-3.2.4: Four independent component files
→ Launch 4 agents in parallel (00:00)
→ Agent 1: AgentCard.js (6 min)
→ Agent 2: CommandCard.js (4 min)
→ Agent 3: HookCard.js (3 min)
→ Agent 4: MCPCard.js (3 min)
→ All complete at 00:06 (longest task)
→ Batch commit: "feat: implement configuration cards for all 4 types (Tasks 3.2.1-3.2.4)"
→ Push to origin

Time savings: 20 min sequential → 6 min parallel (70% reduction)
```

**Commit timing for parallel work:**
- Parallel execution: 4 tasks × 5 min = 5 min total (not 20 min)
- Single batch commit after all complete
- Still maintains "commit every 15-30 min" guideline if total parallel time < 30 min

**Reference:** See `docs/workflow-patterns/PARALLEL-EXECUTION.md` for detailed patterns

**Never bundle independent sequential tasks:**
- ❌ BAD (Sequential): "feat: implement agent card with metadata and buttons (Tasks 3.2.1-3.2.3)"
- ✅ GOOD (Sequential): Three separate commits, one per task
- ✅ GOOD (Parallel): "feat: implement 4 configuration cards (Tasks 3.2.1-3.2.4)" - if truly parallel execution

**Exception:** Only bundle related changes if they are part of the same atomic task (e.g., fixing a typo in documentation doesn't need its own commit if it's noticed during the same task).

## Pre-Push Hook

A pre-push Git hook is installed at `.git/hooks/pre-push` that prevents direct pushes to protected branches. If you accidentally try to push to main, you'll see:

```
❌ ERROR: Direct pushes to 'main' branch are not allowed!

Please use the feature branch workflow:
  1. Create a feature branch: git checkout -b feature/your-feature-name
  2. Make your changes and commit
  3. Push your feature branch: git push -u origin feature/your-feature-name
  4. Create a Pull Request for review
```

## Setting Up Git Hooks

To install the pre-push hook that enforces this workflow:

```bash
./scripts/setup-git-hooks.sh
```

This script copies the pre-push hook to `.git/hooks/` and ensures it's executable.

## Pull Request Guidelines

### PR Template

When creating pull requests, use this template for consistency:

```markdown
## Summary
[Brief description of changes and their purpose]

## Changes Made
- [Change 1]
- [Change 2]
- [Change 3]

## Testing Performed
- [ ] All tests passing (npm test)
- [ ] Manual testing completed
- [ ] No breaking changes
- [ ] Documentation updated (if applicable)

## Screenshots (if applicable)
[Add UI screenshots or visual changes]

## Code Review
- [ ] Self-review completed
- [ ] Code follows project conventions
- [ ] All acceptance criteria met

## Related Issues
Closes #[issue-number]
Related to #[issue-number]
```

### PR Creation Process

1. **Ensure all tests pass** before creating PR
2. **Stay on your feature branch** when running `gh pr create`
3. **Use descriptive title** following commit message format
4. **Fill out PR template completely**
5. **Request review** from appropriate team members
6. **Respond to feedback** promptly

## Agent-Based Workflow Architecture

This project uses specialized Claude Code subagents for different aspects of development:

### Separation of Concerns

**Development Agents:**
- `backend-architect` - Backend implementation
- `frontend-developer` - Frontend implementation
- `data-parser` - Data parsing and utilities
- `test-automation-engineer` - Test implementation

**Coordination Agents:**
- `git-workflow-specialist` - All git operations (commits, branches, PRs, merges)
- `subagent-orchestrator` - Task delegation and workflow coordination
- `code-reviewer` - Code quality and standards review
- `documentation-engineer` - Documentation updates

### Workflow Sequence

1. **Orchestrator** assigns task to appropriate developer agent
2. **Developer** implements feature AND tests immediately (no git operations)
3. **Test Engineer** runs full test suite (if needed)
4. **Documentation Engineer** updates docs (if applicable)
5. **Code Reviewer** reviews implementation and tests
6. **Git Specialist** handles all git operations (commits, PRs)

### Benefits

- **Single Source of Truth** - All git operations centralized with git-workflow-specialist
- **Consistent Standards** - Each agent follows specialized best practices
- **Clear Responsibilities** - Developers focus on implementation, not git mechanics
- **Better Code Review** - Dedicated review agent catches issues early
- **Audit Trail** - All operations traceable to specific agents

For SWARM-based development workflows, use the `/swarm` command to launch coordinated multi-agent tasks.

## Related Documentation

- **Workflow Analysis (October 7, 2025):** `docs/workflow-analysis-20251007.md` - Critical incident analysis that led to this workflow
- **Parallel Execution Pattern:** `docs/workflow-patterns/PARALLEL-EXECUTION.md` - Detailed guide for parallel task execution
- **Contributing Guide:** `CONTRIBUTING.md` - General contribution guidelines
- **Project Overview:** `CLAUDE.md` - Complete project documentation
- **Subagent Coordination:** `.claude/agents/` - Individual agent specifications

## Quick Reference

**Start new feature:**
```bash
git checkout main && git pull
git checkout -b feature/your-feature-name
```

**Commit after each task:**
```bash
git add <files>
git commit -m "type: description"
git push -u origin feature/your-feature-name
```

**Create PR (from feature branch):**
```bash
gh pr create --title "..." --body "..."
```

**Merge and cleanup:**
```bash
gh pr merge <pr-number>
git checkout main && git pull
git branch -d feature/your-feature-name
```
