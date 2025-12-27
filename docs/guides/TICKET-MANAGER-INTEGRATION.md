# Ticket Manager Integration Guide

**Created:** 2025-11-02
**Status:** Active
**Purpose:** Define how all subagents and workflows integrate with the agile-ticket-manager

---

## Overview

The **agile-ticket-manager** subagent serves as the central ticketing system for the Claude Code Config Manager project. It functions like enterprise Agile tools (Jira, Azure DevOps, Linear) but uses a **SQLite database** at `/home/tickets/databases/claude-manager.db`.

### Key Principle

> **The ticket manager is NOT a project planner - it's a database API.**
> - **Project Manager** creates tickets (defines what needs to be done)
> - **Ticket Manager** executes database operations via `ticket-system` skill scripts
> - **Other Agents** communicate with ticket manager to fetch/update tickets from the database
> - **NO DIRECT FILE ACCESS** - All operations use Node.js scripts from the `ticket-system` skill

---

## Ticket System Architecture

### Ticket Storage Location
**Database:** `/home/tickets/databases/claude-manager.db` (SQLite)
**Skill Location:** `/home/meckert/.claude/skills/ticket-system/` (user-level skill)

### Database Schema
Tickets are stored in a relational database with the following structure:
- **tickets** table: id, type, title, status, priority, created, updated, assignee, parent, tags, estimate, content
- **Hierarchical relationships:** Tasks → Stories → Epics
- **Status workflow:** backlog → todo → in-progress → review → done | closed

### Available Scripts
All ticket operations use Node.js scripts in the `ticket-system` skill:

| Script | Purpose | Usage |
|--------|---------|-------|
| `list_databases.js` | List available project databases | `node scripts/list_databases.js` |
| `show_status.js` | Get status summary | `node scripts/show_status.js claude-manager` |
| `show_backlog.js` | Query backlog tickets | `node scripts/show_backlog.js claude-manager [type] [priority]` |
| `filter_by_status.js` | Filter tickets by status | `node scripts/filter_by_status.js claude-manager <status> [type]` |
| `show_epic.js` | Show epic hierarchy | `node scripts/show_epic.js claude-manager <epic-id>` |
| `add_ticket.js` | Create new ticket | `node scripts/add_ticket.js claude-manager <ticket-id> <status> "<content>"` |
| `move_ticket.js` | Change ticket status | `node scripts/move_ticket.js claude-manager <ticket-id> <new-status>` |
| `copy_ticket.js` | Duplicate a ticket | `node scripts/copy_ticket.js claude-manager <source-id> <new-id>` |

### Status Workflow
1. **backlog** → Not prioritized, ticket exists but not scheduled
2. **todo** → Prioritized and ready to start
3. **in-progress** → Developer actively working on implementation
4. **review** → Implementation complete, awaiting user code review
5. **done** → User approved, PR merged, ticket complete

**Status Transition Rules:**
- **backlog → todo:** Orchestrator assigns ticket to current sprint/iteration
- **todo → in-progress:** Developer starts work (orchestrator must update status BEFORE work begins)
- **in-progress → review:** Developer completes implementation (orchestrator updates when work ready for review)
- **review → done:** User approves code review and PR is merged
- **review → in-progress:** User requests changes during code review (ticket goes back for rework)

---

## Agent Responsibilities

### Project Manager (`project-manager`)
**Primary Ticket Writer - Creates All Tickets**

**Responsibilities:**
- Define business objectives and requirements
- Create Epic tickets for major initiatives
- Break down Epics into Story tickets
- Write detailed Task tickets with acceptance criteria
- Set priorities (P0-P3) based on business value
- Define dependencies and relationships
- Invoke agile-ticket-manager to add tickets to the database

**Workflow:**
1. **Planning:** Analyze PRD and create comprehensive Epic/Story/Task breakdown
2. **Ticket Creation:** Invoke agile-ticket-manager with ticket content (markdown with frontmatter)
3. **Database Storage:** Agile-ticket-manager executes `add_ticket.js` script to insert into database
4. **Status Updates:** Request agile-ticket-manager to update ticket status via `move_ticket.js`

**Example Interaction:**
```markdown
Project Manager prepares ticket content (markdown with frontmatter)

Project Manager invokes agile-ticket-manager:
→ "Add ticket TASK-3.2.1 with the following content: [markdown content]"

Agile-ticket-manager executes:
→ node /home/meckert/.claude/skills/ticket-system/scripts/add_ticket.js claude-manager TASK-3.2.1 backlog "[content]"
→ Returns confirmation: "Ticket TASK-3.2.1 created in database with status: backlog"
```

**Never Does:**
- Access database directly (uses ticket manager as API)
- Execute ticket-system scripts directly (delegates to ticket manager)
- Query tickets without ticket manager (no direct database access)

---

### Subagent Orchestrator (`subagent-orchestrator`)
**Workflow Coordinator - Requests Tickets for Execution**

**Responsibilities:**
- Request available tickets from ticket manager for planning
- Coordinate which agents work on which tickets
- Request ticket status updates from ticket manager
- Track Epic/Story/Task progress through ticket manager
- Ensure tickets are moved to correct status as work progresses

**Workflow:**
1. **Ticket Discovery:** Ask ticket manager "What tickets are in `todo` status?"
2. **Ticket Selection:** Present options to user based on dependencies
3. **Work Assignment:** Assign tickets to appropriate agents
4. **Status Tracking:** Request ticket manager to update status at key transitions:
   - **BEFORE development starts** → Move ticket from `todo` to `in-progress`
   - **AFTER implementation complete** → Move ticket from `in-progress` to `review`
   - **AFTER user approves review** → Move ticket from `review` to `done`
   - **IF user requests changes** → Move ticket from `review` back to `in-progress`

**Example Interaction:**
```markdown
Orchestrator to agile-ticket-manager:
→ "Show me all P0 and P1 tickets in `todo` status"

agile-ticket-manager executes:
→ node /home/meckert/.claude/skills/ticket-system/scripts/filter_by_status.js claude-manager todo
→ Returns list with ticket IDs, titles, priorities, descriptions from database

Orchestrator to agile-ticket-manager (after work starts):
→ "Move TASK-3.2.1 to in-progress status"

agile-ticket-manager executes:
→ node /home/meckert/.claude/skills/ticket-system/scripts/move_ticket.js claude-manager TASK-3.2.1 in-progress
→ Returns confirmation: "Moved TASK-3.2.1 from todo to in-progress"
```

**Never Does:**
- Create tickets (project manager does this)
- Write ticket content (project manager does this)
- Access database directly (uses ticket manager as API)

---

### Business Analyst (`/ba` command)
**Feature Solutioning - Creates PRDs for Project Manager**

**Responsibilities:**
- Analyze feature requests using ultrathink reasoning
- Research Claude Code capabilities
- Design UI/UX wireframes
- Create comprehensive PRDs in BA session directory
- Provide PRDs to project manager for ticket creation

**Workflow:**
1. **Analysis:** Deep analysis of feature request
2. **Research:** Invoke claude-code-expert for technical research
3. **Design:** Invoke wireframe-designer for UI/UX
4. **Documentation:** Create PRD in `docs/ba-sessions/[timestamp-topic]/prd/`
5. **Handoff:** Provide PRD to project manager
6. **Project Manager** then creates tickets based on the PRD

**Example Interaction:**
```markdown
User: /ba Add batch export functionality

BA conducts analysis:
→ Creates docs/ba-sessions/20251102-143000-batch-export/
→ Generates PRD-Batch-Export.md
→ Creates wireframes and implementation guide

BA to Project Manager:
→ "PRD complete at docs/ba-sessions/20251102-143000-batch-export/prd/"

Project Manager:
→ Reads PRD
→ Creates Epic, Stories, and Tasks
→ Invokes agile-ticket-manager to organize tickets
```

**Never Does:**
- Create tickets directly (provides PRDs for project manager to create tickets)
- Organize tickets (ticket manager does this)

---

### Developer Agents (backend, frontend, etc.)
**Implementation - Update Ticket Progress**

**Responsibilities:**
- Implement assigned tasks
- Test implementations
- Report completion to orchestrator
- Orchestrator requests ticket manager to update status

**Workflow:**
1. **Receive Assignment:** Orchestrator assigns ticket (e.g., TASK-3.2.1)
2. **Orchestrator Updates Status:** Orchestrator requests ticket manager to move ticket to `in-progress`
3. **Implementation:** Develop feature
4. **Testing:** Test implementation
5. **Report Completion:** Notify orchestrator that work is ready for review
6. **Orchestrator Updates Status:** Orchestrator requests ticket manager to move ticket to `review`
7. **User Review:** User reviews code and approves OR requests changes
8. **If Approved:** Orchestrator requests ticket manager to move ticket to `done`
9. **If Changes Needed:** Orchestrator requests ticket manager to move ticket back to `in-progress`

**Never Do:**
- Create tickets (project manager does this)
- Move tickets (orchestrator requests from ticket manager)
- Query tickets directly (orchestrator handles this)

---

### Git Workflow Specialist (`git-workflow-specialist`)
**Git Operations - Tracks Ticket IDs in Commits**

**Responsibilities:**
- Create feature branches with ticket ID naming
- Create commits referencing ticket IDs
- Create PRs linking to ticket IDs
- Merge PRs and notify orchestrator for ticket status update

**Workflow:**
1. **Branch Creation:** `git checkout -b feature/TASK-3.2.1-implement-agent-card`
2. **Commit Messages:** `feat: implement agent card component (TASK-3.2.1)`
3. **PR Creation:** Include ticket ID in PR title and description
4. **PR Merge:** After merge, notify orchestrator
5. **Orchestrator** requests ticket manager to move ticket to `done`

**Never Does:**
- Create tickets (project manager does this)
- Move tickets directly (orchestrator requests from ticket manager)

---

## Integration Points Summary

### 1. Ticket Creation Flow
```
User Request
    ↓
Project Manager (analyzes requirements)
    ↓
Project Manager (prepares ticket content with frontmatter)
    ↓
Project Manager invokes agile-ticket-manager (adds ticket to database)
    ↓
agile-ticket-manager executes add_ticket.js script
    ↓
Ticket stored in SQLite database (/home/tickets/databases/claude-manager.db)
```

### 2. Ticket Execution Flow
```
Orchestrator queries ticket manager ("Show todo tickets")
    ↓
agile-ticket-manager executes filter_by_status.js script
    ↓
agile-ticket-manager returns tickets from database
    ↓
Orchestrator (presents options to user)
    ↓
User selects ticket
    ↓
Orchestrator requests ticket manager ("Move ticket to in-progress")
    ↓
agile-ticket-manager executes move_ticket.js script (todo → in-progress)
    ↓
Orchestrator assigns to developer
    ↓
Developer implements and tests
    ↓
Developer reports completion
    ↓
Orchestrator requests ticket manager ("Move to review")
    ↓
agile-ticket-manager executes move_ticket.js script (in-progress → review)
    ↓
User reviews code
    ↓
IF User approves:
    Orchestrator requests ticket manager ("Move to done")
    agile-ticket-manager executes move_ticket.js script (review → done)
    PR merged, ticket complete
    ↓
IF User requests changes:
    Orchestrator requests ticket manager ("Move back to in-progress")
    agile-ticket-manager executes move_ticket.js script (review → in-progress)
    Developer makes changes, cycle repeats
```

### 3. BA Session to Tickets Flow
```
User runs /ba command
    ↓
BA analyzes and creates PRD
    ↓
PRD created in docs/ba-sessions/[timestamp]/
    ↓
User reviews and approves
    ↓
Project Manager reads PRD
    ↓
Project Manager prepares Epic/Story/Task ticket content
    ↓
Project Manager invokes agile-ticket-manager for each ticket
    ↓
agile-ticket-manager executes add_ticket.js for each ticket
    ↓
All tickets stored in SQLite database
```

---

## Workflow Commands Integration

### `/swarm` Command Integration

**Behavior:**
1. **Step 2: Check for Existing Tickets**
   - Main agent invokes agile-ticket-manager
   - Ticket manager executes `filter_by_status.js` for `todo` and `backlog` statuses
   - Returns ticket metadata (ID, title, priority, dependencies) from database

2. **Step 4: Ticket Selection & Dependency Analysis**
   - Invoke project-manager agent to analyze tickets from agile-ticket-manager
   - Project manager invokes ticket manager with queries:
     - All pending tickets across all statuses (via `show_status.js`)
     - Epic/Story relationships (via `show_epic.js`)
     - Ticket dependencies (from database parent/child relationships)
   - Present 2-4 ticket options based on analysis

3. **Step 5: Execute Development Workflow**
   - Before starting work: Ticket manager executes `move_ticket.js` (status → in-progress)
   - After testing complete: Ticket manager executes `move_ticket.js` (in-progress → review)
   - After PR merged: Ticket manager executes `move_ticket.js` (review → done)

### `/ba` Command Integration

**Behavior:**
- No changes to BA workflow
- BA creates PRDs, project manager creates tickets from PRDs
- Clear handoff: BA produces documentation, PM invokes ticket manager to add tickets to database

---

## Key Interaction Patterns

### Pattern 1: Creating New Tickets
```markdown
# Project Manager Workflow
1. Analyze requirements (from PRD or user request)
2. Prepare ticket content (markdown with YAML frontmatter)
3. Invoke agile-ticket-manager: "Add ticket TASK-3.2.1 with content: [markdown]"
4. Ticket manager executes: node scripts/add_ticket.js claude-manager TASK-3.2.1 backlog "[content]"
5. Ticket manager confirms: "Ticket TASK-3.2.1 created in database with status: backlog"
```

### Pattern 2: Querying Available Tickets
```markdown
# Orchestrator Workflow
1. Invoke agile-ticket-manager: "Show all tickets in `todo` status with priority P0 or P1"
2. Ticket manager executes: node scripts/filter_by_status.js claude-manager todo
3. Ticket manager filters results by priority in-memory
4. Ticket manager returns list with metadata (ID, title, priority, parent, etc.) from database
5. Orchestrator presents options to user
```

### Pattern 3: Updating Ticket Status
```markdown
# Orchestrator Workflow
1. Developer reports task completion
2. Orchestrator invokes agile-ticket-manager: "Move TASK-3.2.1 to review status"
3. Ticket manager executes: node scripts/move_ticket.js claude-manager TASK-3.2.1 review
4. Ticket manager updates status field in database
5. Ticket manager updates `updated` timestamp in database
6. Ticket manager confirms: "Moved TASK-3.2.1 from in-progress to review"
```

### Pattern 4: Finding Related Tickets
```markdown
# Orchestrator Workflow
1. Invoke agile-ticket-manager: "Show all tasks under STORY-3.2"
2. Ticket manager executes: node scripts/show_epic.js claude-manager STORY-3.2
3. Ticket manager queries database for all tickets with parent: STORY-3.2
4. Ticket manager returns hierarchical list
5. Orchestrator uses for dependency planning
```

---

## Migration Notes

### Old System (DEPRECATED - Pre-December 2025)
- Tickets stored as files in `/home/tickets/claude/manager/` directory hierarchy
- File-based organization with status directories (backlog/, todo/, in-progress/, review/, done/)
- Manual file moves for status transitions
- Direct filesystem access by agents

### Current System (December 2025+)
- **SQLite database** at `/home/tickets/databases/claude-manager.db`
- **Script-based operations** via `ticket-system` user-level skill
- **No direct file access** - all operations through ticket-system scripts
- **Database API pattern** - agile-ticket-manager acts as API interface
- Status-based workflow maintained (backlog → todo → in-progress → review → done)

### Key Changes
1. **Storage:** Files → SQLite database
2. **Access:** Direct filesystem reads → Node.js scripts (ticket-system skill)
3. **Agent behavior:** File manipulation → Database API calls via ticket manager
4. **Location:** `/home/tickets/claude/manager/` (legacy files may exist) vs `/home/tickets/databases/claude-manager.db` (authoritative)

---

## Best Practices

### For All Agents
1. **Never access database directly** - Always invoke ticket manager as API interface
2. **Never execute ticket-system scripts directly** - Always request operations from ticket manager
3. **Always use ticket IDs** - Reference tickets by ID (TASK-3.2.1, BUG-027, etc.)
4. **Track status accurately** - Request status updates at appropriate workflow steps via ticket manager
5. **Maintain relationships** - Preserve parent-child relationships (Epic → Story → Task)

### For Project Manager
1. **Write complete tickets** - Include all frontmatter fields (id, type, title, status, priority, created, updated, assignee, parent, tags, estimate)
2. **Define clear acceptance criteria** - Make success measurable
3. **Set appropriate priorities** - P0 for critical, P1 for important, P2-P3 for nice-to-have
4. **Document dependencies** - Identify blockers and relationships
5. **Invoke ticket manager for storage** - Provide complete ticket content for database insertion

### For Orchestrator
1. **Query ticket manager frequently** - Stay updated on ticket status
2. **Move tickets at appropriate times** - Don't skip workflow steps
3. **Validate relationships** - Ensure tasks belong to stories, stories to epics
4. **Track progress visibly** - Use ticket statuses to show user progress

---

## Examples

### Example 1: Creating a New Feature Epic

**Scenario:** User requests "Add search functionality across all projects"

```markdown
Project Manager:
1. Analyzes requirements
2. Creates epic file:

---
id: EPIC-004
type: epic
title: Global Search Functionality
status: todo
priority: P1
created: 2025-11-02T14:30:00Z
updated: 2025-11-02T14:30:00Z
assignee: project-manager
tags: feature, search, phase-3
---

# Global Search Functionality

## Description
Enable users to search across all projects for subagents, commands, hooks, and MCP servers.

## Acceptance Criteria
- [ ] User can search by keyword
- [ ] Results show matches across all config types
- [ ] Search is performant (<500ms)
- [ ] Results are highlighted and clickable

## Stories
- STORY-4.1: Backend search API
- STORY-4.2: Frontend search UI
- STORY-4.3: Search performance optimization

3. Prepares story and task content similarly
4. Invokes agile-ticket-manager for each ticket:
   "Add ticket EPIC-004 with content: [epic markdown]"
   "Add ticket STORY-4.1 with content: [story markdown]"
   "Add ticket TASK-4.1.1 with content: [task markdown]" (repeat for each task)

agile-ticket-manager:
1. Executes add_ticket.js for each ticket
2. Inserts into SQLite database with proper relationships
3. Confirms: "Created EPIC-004, 2 stories, and 6 tasks in database. All tickets in `backlog` status."
```

### Example 2: Working on a Task

**Scenario:** Orchestrator assigns TASK-4.1.1 to backend-architect

```markdown
Orchestrator to agile-ticket-manager:
"Move TASK-4.1.1 to in-progress status"

agile-ticket-manager:
- Executes: node scripts/move_ticket.js claude-manager TASK-4.1.1 in-progress
- Updates status field in database
- Responds: "TASK-4.1.1 moved from todo to in-progress"

Orchestrator to backend-architect:
"Implement TASK-4.1.1: Create search endpoint"

backend-architect:
- Implements feature
- Tests implementation
- Reports completion

Orchestrator to agile-ticket-manager:
"Move TASK-4.1.1 to review status"

agile-ticket-manager:
- Executes: node scripts/move_ticket.js claude-manager TASK-4.1.1 review
- Updates status and timestamp in database
- Responds: "TASK-4.1.1 moved from in-progress to review. Awaiting code review."

After code review and PR merge:

Orchestrator to agile-ticket-manager:
"Move TASK-4.1.1 to done status"

agile-ticket-manager:
- Executes: node scripts/move_ticket.js claude-manager TASK-4.1.1 done
- Updates status and timestamp in database
- Responds: "TASK-4.1.1 moved from review to done. Ticket complete."
```

### Example 3: Finding Tickets for Next Sprint

**Scenario:** User runs /swarm to see available work

```markdown
Orchestrator invokes project-manager:
"Analyze available tickets and suggest options"

Project Manager queries agile-ticket-manager:
"Show all tickets in `todo` and `backlog` status with priorities P0, P1, P2"

agile-ticket-manager:
- Executes: node scripts/filter_by_status.js claude-manager todo
- Executes: node scripts/filter_by_status.js claude-manager backlog
- Filters by priority (P0, P1, P2)
- Returns from database:
  - TASK-4.1.1 (P1, todo) - Create search endpoint
  - TASK-4.1.2 (P1, todo) - Add search filters
  - BUG-038 (P0, todo) - Fix hooks display parsing
  - TASK-4.2.1 (P2, backlog) - Design search UI

Project Manager analyzes dependencies:
- BUG-038 has no dependencies → Can start immediately
- TASK-4.1.1 has no dependencies → Can start immediately
- TASK-4.1.2 depends on TASK-4.1.1 → Blocked
- TASK-4.2.1 depends on TASK-4.1.1 and 4.1.2 → Blocked

Project Manager presents to user:
**Option A:** BUG-038 (P0, ~30 min, no dependencies)
**Option B:** TASK-4.1.1 (P1, ~45 min, unlocks 2 other tasks)
**Option C:** Both BUG-038 and TASK-4.1.1 in parallel (~45 min total)

User selects Option C

Orchestrator invokes agile-ticket-manager:
- "Move BUG-038 to in-progress" (executes move_ticket.js)
- "Move TASK-4.1.1 to in-progress" (executes move_ticket.js)
- Assigns to appropriate agents
```

---

## Summary

The **agile-ticket-manager** is the database API interface for all project tickets. It:
- Executes database operations via ticket-system skill scripts
- Provides ticket retrieval and querying from SQLite database
- Manages status transitions in the database
- Maintains Epic/Story/Task relationships
- Acts like Jira/Azure DevOps but SQLite-based

All agents must interact with the ticket manager as a database API - no direct database or filesystem access. This ensures:
- Consistent database operations
- Accurate status tracking
- Proper relationship maintenance
- Query abstraction layer
- Single source of truth for ticket information

---

**Implementation Complete (December 2025):**
1. ✅ SQLite database at `/home/tickets/databases/claude-manager.db`
2. ✅ ticket-system user-level skill with Node.js scripts
3. ✅ agile-ticket-manager subagent acts as database API
4. ✅ All agents use ticket manager instead of direct file/database access
5. ✅ Documentation updated to reflect database-based system
