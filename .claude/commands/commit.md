---
name: commit
description: Automates the git commit workflow by delegating to git-workflow-specialist subagent
tools: Bash, Read, Task
argument-hint: "[instructions] - Optional instructions for commit process (e.g., 'Only commit documents', 'commit all changes to a single branch')"
color: green
---

# Automated Git Commit Workflow

Automates the complete git commit workflow by delegating to the git-workflow-specialist subagent. This command handles feature branch creation, commit creation, PR generation, and merging while enforcing the project's mandatory feature branch workflow.

**User Instructions:** $ARGUMENTS

**SWARM Integration:** This command implements Phase 4 (Commit Code Changes) of the SWARM workflow when used standalone. Within SWARM execution, git-workflow-specialist is invoked by the main agent after each task completion.

## Critical Workflow Requirements

This command enforces the following mandatory workflow:

1. **Feature Branch Creation FIRST** - Create a dedicated feature branch BEFORE any commits (NEVER commit directly to main)
2. **Review All Changes** - Examine all uncommitted changes and untracked files
3. **Logical Commit Grouping** - Group related changes into well-structured commits
4. **Conventional Commits Format** - Use proper commit message formatting (see GIT-WORKFLOW.md)
5. **Push to Feature Branch** - Push all commits to the feature branch
6. **Create Pull Request** - Generate PR with appropriate title and description
7. **Auto-Merge** - Merge PR automatically unless user explicitly requests review

**See:** `docs/guides/GIT-WORKFLOW.md` for complete git workflow and commit conventions

## Execution

<task>
Delegate to the @git-workflow-specialist agent to execute the complete commit workflow.
</task>

### Step 1: Check Current Branch Status

Before delegating to git-workflow-specialist, determine the current state:

```bash
cd /home/claude/manager
git branch --show-current
git status --porcelain
```

This helps identify:
- Current branch name (if on main, feature branch creation is MANDATORY)
- Uncommitted changes (modified, untracked files)
- Whether any work has already been done

### Step 2: Delegate to Git Workflow Specialist

Invoke the `git-workflow-specialist` subagent using the Task tool with comprehensive instructions:

**Task Prompt:**

```
Complete Git Commit Workflow - All Changes to Feature Branch

**Current Context:**
- Project: Claude Code Manager (/home/claude/manager)
- Current Branch: {branch from step 1}
- Uncommitted Changes: {summary from step 1}

**User-Provided Instructions:**
{If $ARGUMENTS is provided, include here. Otherwise, state "None - use default workflow"}

**Your Task:**

Execute the complete git commit workflow following these requirements:

### Phase 1: Feature Branch Creation (MANDATORY)

**CRITICAL: This step cannot be skipped under any circumstances.**

If current branch is `main` or any protected branch:
1. Review all uncommitted changes using `git status` and `git diff`
2. Determine an appropriate feature branch name based on the changes
   - Use format: `feature/brief-descriptive-name`
   - Example: `feature/update-documentation`, `feature/fix-sidebar-bug`, `feature/add-commit-command`
3. Create and checkout the feature branch:
   ```bash
   git checkout -b feature/descriptive-name
   ```
4. Verify you're on the new branch: `git branch --show-current`
5. Push the branch to remote: `git push -u origin feature/descriptive-name`

If already on a feature branch:
1. Verify the branch name follows the project's naming convention
2. Confirm this is the correct branch for the changes being committed
3. Proceed to Phase 2

**Never proceed to Phase 2 without a feature branch.**

### Phase 2: Review and Group Changes

1. Use `git status` to see all changes
2. Use `git diff` to review specific file modifications
3. Check for untracked files that should be included
4. Group related changes into logical commits:
   - **One commit per logical change** (not per file)
   - Example groupings:
     - "Add new slash command" (command file + documentation)
     - "Update documentation" (all doc files)
     - "Fix bug in parser" (bug fix + related test)
   - If changes span multiple concerns, create multiple commits

### Phase 3: Create Commits

For each logical group of changes:

1. Stage the relevant files: `git add <files>`
2. Create a commit message following Conventional Commits format:
   ```
   type: brief description

   [optional body with more details]
   - Detail 1
   - Detail 2
   ```

   **Types:**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `chore:` - Maintenance tasks
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `style:` - Code style changes

3. Commit: `git commit -m "message"`
4. Verify commit was created: `git log -1 --oneline`

**Special Handling Based on User Instructions:**

- If user said "Only commit documents":
  - Only stage and commit files in `/docs/` or documentation-related files
  - Leave other changes uncommitted

- If user said "commit all changes to a single branch":
  - Put ALL changes into the same feature branch (no multiple branches)
  - Can still create multiple commits within that branch

- If user provided other instructions:
  - Apply them while maintaining workflow integrity
  - If instructions conflict with mandatory workflow, explain why and adapt appropriately

### Phase 4: Push to Remote

After all commits are created:

```bash
git push origin feature/branch-name
```

Verify the push succeeded.

### Phase 5: Create Pull Request

Create a PR using the GitHub CLI:

```bash
gh pr create \
  --title "type: brief description of overall changes" \
  --body "$(cat <<'EOF'
## Summary
Brief overview of all changes in this PR

## Changes
- Change 1
- Change 2
- Change 3

## Testing
Describe how changes were tested (if applicable)

## References
- Related issue/ticket (if applicable)
EOF
)"
```

Capture and report the PR URL.

### Phase 6: Merge PR (Auto-Merge by Default)

**Default behavior:** Merge the PR automatically unless user explicitly requested review.

**If no review requested:**
1. Wait 5 seconds for PR to be created on GitHub
2. Merge the PR using: `gh pr merge --squash --delete-branch`
3. Switch back to main: `git checkout main`
4. Pull latest: `git pull origin main`
5. Clean up local branch: `git branch -d feature/branch-name`

**If user requested review:**
- Report the PR URL
- Do NOT merge automatically
- Instruct user to review and merge manually when ready

## Output Requirements

Provide a comprehensive summary of the workflow execution:

```
Git Commit Workflow Complete

✓ Feature Branch: feature/branch-name
  - Created from: main
  - Pushed to: origin

✓ Commits Created: {count}
  1. {commit 1 message}
  2. {commit 2 message}
  ...

✓ Pull Request: #{pr_number}
  - Title: {pr_title}
  - URL: {pr_url}
  - Status: {Merged | Awaiting Review}

{If merged:}
✓ Merged and Cleaned Up:
  - Squash-merged to main
  - Remote branch deleted
  - Local branch deleted
  - Switched to main branch

{If awaiting review:}
⏳ Awaiting Review:
  - PR ready for review at {url}
  - Merge with: gh pr merge #{pr_number} --squash --delete-branch

{If changes were left uncommitted based on user instructions:}
ℹ️ Uncommitted Changes:
  - {list of files not committed}
  - Reason: {explanation based on user instructions}
```

## Edge Cases and Error Handling

**If on main branch and user has uncommitted changes:**
- STOP and create feature branch first
- Never allow commits directly to main

**If on a feature branch but changes don't relate:**
- Ask user if they want to create a new feature branch
- Or continue on current branch if appropriate

**If no changes to commit:**
- Report: "No uncommitted changes found. Working directory is clean."
- Exit gracefully

**If git operations fail:**
- Report the error clearly
- Provide troubleshooting steps
- Do not proceed to next phase

**If PR creation fails:**
- Report the error
- Verify branch was pushed successfully
- Check GitHub CLI authentication
- Provide manual PR creation instructions

**If merge fails:**
- Report the error (likely merge conflicts)
- Provide instructions for manual resolution
- Leave PR open for manual handling

## Important Notes

- **Absolute Paths:** Always use `/home/claude/manager` as the project root
- **Branch Verification:** Always verify current branch before committing
- **User Instructions Priority:** Honor user's optional instructions while maintaining workflow integrity
- **Never Skip Feature Branch:** This is a hard requirement - no exceptions
- **Clear Communication:** Report what's happening at each phase
- **Error Recovery:** If anything fails, explain clearly and provide guidance

Execute this workflow thoroughly and systematically.
```

### Step 3: Follow-Up Options

After git-workflow-specialist completes the workflow, offer the user:

1. **View PR:** "Would you like to view the PR in your browser? I can open the URL."
2. **Make Additional Changes:** "Need to make more changes to this branch? I can help you continue working."
3. **New Work:** "Ready to start new work? I can help you create another feature branch."

## Examples

**Basic usage (commit all changes):**
```
/commit
```
Result: Creates feature branch, commits all changes with logical grouping, creates PR, auto-merges

**Commit only documentation:**
```
/commit Only commit documents
```
Result: Creates feature branch, commits only doc files, creates PR, auto-merges

**Commit to single branch:**
```
/commit commit all changes to a single branch
```
Result: Ensures all changes go to one feature branch (helpful if you have multiple types of changes)

**Request review:**
```
/commit I want to review the PR before merging
```
Result: Creates feature branch, commits, creates PR, but does NOT auto-merge

## Best Practices

- Run this command frequently (after completing logical units of work)
- Let the command handle the workflow - don't manually create branches first
- Provide specific instructions if you want non-default behavior
- Trust the git-workflow-specialist to group commits appropriately
- Review the summary to understand what was committed

## SWARM Workflow Pattern

**Within SWARM execution (`/swarm` command):**
- Main agent invokes git-workflow-specialist after each task completion
- Commits include ticket IDs (e.g., `feat: description (TASK-3.1.1)`)
- Sequential tasks get individual commits
- Parallel tasks get batch commits
- See Phase 3 and Phase 4 in `docs/guides/SWARM-WORKFLOW.md`

**Standalone usage (this command):**
- Useful for quick commits outside SWARM workflow
- Documentation updates
- Configuration changes
- Small fixes or adjustments

---

**Ready to commit!** I'll delegate to git-workflow-specialist to handle your commit workflow with full feature branch enforcement.

## Related Documentation

- **Git Workflow:** `docs/guides/GIT-WORKFLOW.md` - Feature branch workflow and commit conventions
- **SWARM Workflow:** `docs/guides/SWARM-WORKFLOW.md` - Complete SWARM workflow with git integration
