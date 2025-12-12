# Project Status Check
# Claude Code Config Manager Development Assessment & Intelligent Ticket Selection

<task>
Assess the current state of Claude Code Config Manager development, check for active work in progress, and intelligently recommend next tickets to work on using the ticket manager and project manager.
</task>

<context>
**Project**: Claude Code Config Manager - Web-based tool for managing Claude Code projects
**Tech Stack**: Node.js + Express (backend), Vue 3 + Vite (frontend SPA)
**Architecture**: Local web server on port 8420, live file system reads

**Current Phase**: Phase 3 - CRUD Operations for Configuration Management
**Development Method**: SWARM (Specialized Workflow with Autonomous Resource Management)

This command performs intelligent project assessment and ticket recommendation:
1. Check for active work (in-progress tickets, feature branches, session tracking docs)
2. If NO active work → Invoke ticket manager and project manager for recommendations
3. If active work found → Show current status and offer to continue or switch
4. Present actionable next steps with context

**Integration with SWARM Workflow:**
- Works with `agile-ticket-manager` for ticket queries
- Works with `project-manager` for ticket recommendations
- Seamlessly hands off to `/swarm` command for execution
</context>

<execution>
## Phase 1: Check for Active Work

### Step 1: Check Git Status

**Determine current branch and status:**
```bash
cd /home/claude/manager
git branch --show-current
git status --porcelain
```

**Analyze:**
- Current branch name (feature branch indicates active work)
- Uncommitted changes (implementation in progress)
- Modified files

### Step 2: Check for In-Progress Tickets

**Main agent invokes `agile-ticket-manager`:**
- Query for tickets with status `in-progress`
- Check if any tickets are actively being worked on

### Step 3: Check for Session Tracking Documents

**Check for active session tracking:**
```bash
ls -la /home/claude/manager/docs/sessions/tracking/SESSION-*.md 2>/dev/null
```

**If tracking docs exist:**
- Active session may have been interrupted
- Document contains resumption context

---

## Phase 2: Intelligent Ticket Selection

### Scenario A: NO Active Work Found

**When:**
- On main or phase branch (not feature branch)
- No in-progress tickets
- No session tracking documents
- No uncommitted changes

**Action: Invoke Ticket Manager and Project Manager**

**Step 1: Main agent invokes `agile-ticket-manager`:**
- Request: Retrieve all tickets with status `backlog` or `todo`
- Get ticket metadata (ID, title, priority, dependencies, estimate)

**Step 2: Main agent invokes `project-manager`:**
- Provide: List of available tickets from ticket manager
- Request: Analyze tickets and recommend 3-5 options
- Project manager considers:
  - Ticket priorities (P0, P1, P2, P3)
  - Dependencies (blocks/blocked by)
  - Logical sequencing (Epic/Story flow)
  - Complexity and risk
  - Available time estimates

**Step 3: Present Recommendations to User**

Format:
```
## Recommended Tickets

### Option 1: [TICKET-ID] - [Title] (Recommended)
- **Priority:** P0/P1/P2/P3
- **Type:** Story | Task | Bug
- **Estimate:** XX minutes
- **Dependencies:** None | Blocked by [TICKET-ID]
- **Rationale:** [Why this is recommended]
- **Risk:** Low | Medium | High

### Option 2: [TICKET-ID] - [Title]
[Same structure]

### Option 3: [TICKET-ID] - [Title]
[Same structure]

**To start work on a ticket:** `/swarm [TICKET-ID]`
```

---

### Scenario B: Active Work Found

**When:**
- On feature branch, OR
- In-progress tickets exist, OR
- Session tracking documents exist, OR
- Uncommitted changes present

**Action: Show Current Status and Options**

**Display:**
```
## Current Work Status

### Active Feature Branch
- **Branch:** feature/story-X.X-description
- **Parent:** phase-X
- **Created:** [timestamp from git]

### In-Progress Ticket
- **Ticket:** STORY-X.X - [Title]
- **Status:** in-progress
- **Started:** [timestamp from ticket]

### Session Tracking
- **Document:** docs/sessions/tracking/SESSION-STORY-X.X-YYYY-MM-DD.md
- **Last Updated:** [timestamp]
- **Progress:** [summary from tracking doc]

### Uncommitted Changes
- [List of modified files]
- [Brief description of changes]

---

## What would you like to do?

**A) Continue Current Work**
   - Resume work on STORY-X.X
   - Main agent reads session tracking doc for context
   - Continue from last documented milestone
   - Command: `/swarm STORY-X.X`

**B) Complete and Switch**
   - Finish current work (commit, PR, merge)
   - Then select new ticket to work on
   - Ensures clean handoff between tickets

**C) Abandon Current Work**
   - Reset to clean state
   - Discard uncommitted changes
   - Select new ticket to work on
   - ⚠️ Warning: Will lose current progress

**D) Switch Without Completing**
   - Leave current work as-is
   - Start new ticket on different branch
   - ⚠️ Not recommended: Creates multiple parallel branches

**E) View Available Tickets**
   - Show recommendations for next ticket
   - Keep current work in progress
   - Decide later whether to continue or switch
```

---

## Phase 3: Project Health Summary

**Always include project health metrics:**

```
## Claude Code Config Manager - Project Health

### Current Phase
- **Phase:** Phase 3 - CRUD Operations for Configuration Management
- **Status:** [Active development | Planning | Blocked]

### Ticket Summary (from agile-ticket-manager)
- **Backlog:** [count] tickets
- **Todo:** [count] tickets
- **In-Progress:** [count] tickets
- **Review:** [count] tickets awaiting user approval
- **Done:** [count] tickets completed

### Recent Activity
- **Last Commit:** [timestamp and message]
- **Last PR:** [PR number and status]
- **Last Merge:** [timestamp]

### Test Status
- **Backend Tests:** [XXX/XXX passing]
- **Frontend Tests:** [XXX/XXX passing]
- **Total:** [XXX/XXX passing]
```

---

## Examples

### Example 1: No active work - Show recommendations
```
User: /project-status

Response:
- Git status: On phase-3 branch, clean working directory
- Ticket manager: No in-progress tickets
- Session tracking: No active sessions
- Recommendation: Invoke ticket manager and project manager
- Present 3-5 ticket options with rationale
- Offer: `/swarm [TICKET-ID]` to start work
```

### Example 2: Active work found - Show current status
```
User: /project-status

Response:
- Git status: On feature/story-3.2-copy-ui branch
- Ticket manager: STORY-3.2 is in-progress
- Session tracking: SESSION-STORY-3.2-2025-11-03.md exists
- Progress: 3/5 tasks complete
- Offer options: Continue, Complete & Switch, Abandon, etc.
```

### Example 3: Multiple in-progress tickets (edge case)
```
User: /project-status

Response:
- Warning: Multiple tickets in progress (anti-pattern)
- Show all in-progress tickets
- Recommend consolidating to one ticket
- Offer to help clean up and focus
```

---

## Related Documentation

- **SWARM Workflow:** `docs/guides/SWARM-WORKFLOW.md` - Complete workflow specification
- **Ticket Manager Integration:** `docs/guides/TICKET-MANAGER-INTEGRATION.md` - Working with tickets
- **Project Overview:** `CLAUDE.md` - Project context and current phase

</execution>
