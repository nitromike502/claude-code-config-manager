---
description: Automates the release workflow for publishing new versions to npm
allowed-tools:
  - Task
  - AskUserQuestion
  - Read
  - Bash
---

# Deploy Command

Automates the complete release workflow for publishing new versions of Claude Code Config Manager to npm.

## Usage

```bash
/deploy [branch]
```

**Arguments:**
- `[branch]` - Optional branch name to release from (defaults to current branch)

## Workflow Overview

This command orchestrates a complete release process:
1. Documentation review and version bumping
2. Git commit and PR creation
3. User review pause
4. Code review
5. Fix application (if needed)
6. Wait for PR merge
7. Sync main and create git tag
8. Remind user to publish to npm

## Execution Steps

### Step 1: Get Current Version and Branch

First, read the current version from package.json and get the current branch (or use the provided branch argument):

```bash
cd /home/claude/manager
cat package.json | grep '"version"'
git branch --show-current
```

Store the current version and branch for reference throughout the workflow.

### Step 2: Documentation Review and Version Bump

Invoke the `documentation-engineer` subagent with the following context:

**Task:** Prepare documentation for release

**Context to provide:**
- Current version from package.json
- Release branch name
- All documentation files in:
  - `/home/claude/manager/README.md`
  - `/home/claude/manager/CLAUDE.md`
  - `/home/claude/manager/CHANGELOG.md`
  - `/home/claude/manager/docs/guides/` directory
  - `/home/claude/manager/docs/prd/` directory

**Required actions:**
1. Review all documentation for accuracy and consistency
2. Remove any phase-specific or temporary development language
3. Update CHANGELOG.md with new version entry based on recent git commits
4. Analyze changes and suggest appropriate version bump (patch/minor/major) following semver
5. Get user approval for suggested version bump
6. Update version in:
   - `package.json`
   - `package-lock.json` (via npm version command)
   - `CLAUDE.md` (Current Release section)
   - `CHANGELOG.md` (new version header)
7. Provide summary of all changes made

**Important:** The subagent should use `npm version <bump-type> --no-git-tag-version` to update package files properly.

### Step 3: Git Operations (Commit & PR)

After documentation is updated, invoke the `git-workflow-specialist` subagent:

**Task:** Create release PR

**Context to provide:**
- New version number (from previous step)
- Current/release branch name
- Summary of documentation changes
- CHANGELOG entry content

**Required actions:**
1. Ensure all changes are staged
2. Create commit with message: `release: prepare v<version> for release`
3. Push to release branch (e.g., `release/v<version>`)
4. Create PR to merge into `main` branch
5. PR title: `Release v<version>`
6. PR body should include:
   - Version number
   - CHANGELOG highlights
   - Link to CHANGELOG.md
   - Checklist: "- [ ] Documentation reviewed and updated"
7. Return the PR URL

### Step 4: User Review Pause

Use AskUserQuestion to pause execution:

```
Question: "I've created the release PR at [URL]. Please review the PR in GitHub."
Options:
  - "Ready for code review" (description: "I've reviewed the PR and it looks good")
  - "Need to make changes" (description: "I found issues and will make manual changes")
Header: "PR Review"
```

If user selects "Need to make changes", exit the command and remind them to re-run `/deploy` when ready.

### Step 5: Code Review

Invoke the `code-reviewer` subagent:

**Task:** Review release PR

**Context to provide:**
- PR URL or branch name
- Version number being released
- List of changed files (from git diff)

**Required actions:**
1. Review all documentation changes for:
   - Accuracy and consistency
   - Proper version numbers in all locations
   - No broken links or references
   - No phase-specific or development language
   - CHANGELOG follows format and includes all significant changes
2. Review version bump appropriateness based on changes
3. Check that package.json and package-lock.json are properly updated
4. Report any issues found with severity (critical/major/minor)
5. If no issues, explicitly state "Approved for merge"

### Step 6: Apply Fixes (If Needed)

If code review finds issues:
1. Display the issues to the user
2. Use AskUserQuestion to confirm whether to fix automatically or manually:
   ```
   Question: "Code review found issues. How would you like to proceed?"
   Options:
     - "Auto-fix" (description: "Have documentation-engineer fix the issues")
     - "Manual fix" (description: "I'll fix them manually")
     - "Ignore" (description: "Issues are not critical, proceed anyway")
   Header: "Fix Issues"
   ```
3. If "Auto-fix", invoke `documentation-engineer` again with the issues list
4. If "Manual fix", exit command and remind user to re-run when ready
5. If "Ignore", proceed to next step

### Step 7: Wait for PR Merge

Use AskUserQuestion to pause:

```
Question: "Please merge the PR in GitHub when ready. Have you merged it?"
Options:
  - "Merged" (description: "PR has been merged to main")
  - "Not yet" (description: "Still waiting or need more time")
Header: "PR Merge"
```

If "Not yet", exit command gracefully with reminder to re-run `/deploy` after merging.

### Step 8: Sync Main and Create Tag

After PR is merged, invoke `git-workflow-specialist` subagent:

**Task:** Create release tag

**Context to provide:**
- Version number (e.g., "2.1.0")
- CHANGELOG entry for this version
- Confirmation that PR is merged

**Required actions:**
1. Checkout `main` branch
2. Pull latest changes from origin
3. Verify the version in package.json matches expected version
4. Create annotated git tag:
   ```bash
   git tag -a v<version> -m "Release v<version>

   <CHANGELOG highlights>"
   ```
5. Push tag to origin: `git push origin v<version>`
6. Confirm tag was created successfully
7. Return tag name and SHA

### Step 9: Remind User to Publish

Display final instructions to user:

```
✅ Release v<version> is ready!

Git tag v<version> has been created and pushed.

Next steps:
1. Verify the tag exists on GitHub: https://github.com/<org>/<repo>/releases/tag/v<version>
2. Create a GitHub Release from the tag (optional but recommended)
3. Publish to npm:

   cd /home/claude/manager
   npm publish

4. Verify the package is live: https://www.npmjs.com/package/<package-name>

The release workflow is complete!
```

## Error Handling

Throughout the workflow:
- If any subagent fails, stop execution and display the error
- If git operations fail, provide clear instructions for manual recovery
- If user cancels at any pause point, provide instructions to resume
- Validate that each step completed successfully before proceeding

## Notes

- This command requires active GitHub authentication for creating PRs
- The command does NOT automatically publish to npm (requires npm authentication)
- All git operations should be performed by the `git-workflow-specialist` subagent
- All documentation changes should be performed by the `documentation-engineer` subagent
- The command can be safely re-run if interrupted - it will pick up from current state

## Example Execution

```bash
# Release from current branch
/deploy

# Release from specific branch
/deploy phase-3.1
```

## Subagents Required

This command invokes the following subagents:
- **documentation-engineer** - Handles all documentation updates and version bumping
- **git-workflow-specialist** - Handles all git operations (commit, push, PR, tag)
- **code-reviewer** - Reviews the release PR for quality and correctness

All three subagents must exist in `.claude/agents/` for this command to work properly.
