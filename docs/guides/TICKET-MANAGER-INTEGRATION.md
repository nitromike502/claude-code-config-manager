# Ticket Manager Integration Guide

**Created:** 2025-11-02
**Status:** Active
**Purpose:** Define how all subagents and workflows integrate with the agile-ticket-manager

---

## Overview

The **agile-ticket-manager** subagent serves as the central ticketing system for the Claude Code Config Manager project. It functions like enterprise Agile tools (Jira, Azure DevOps, Linear) but uses a file-based structure at `/home/tickets/claude/manager/`.

### Key Principle

> **The ticket manager is NOT a project planner - it's a ticketing system.**
> - **Project Manager** creates and writes tickets (defines what needs to be done)
> - **Ticket Manager** organizes, retrieves, and manages ticket files (the filing system)
> - **Other Agents** communicate with ticket manager to fetch/update tickets

---

## Ticket System Architecture

### Ticket Storage Location
**Base Directory:** `/home/tickets/claude/manager/`

### Directory Structure
```
/home/tickets/claude/manager/
├── epics/[epic-id]-[epic-name]/
│   ├── epic.md
│   └── stories/[story-id]-[story-name]/
│       ├── story.md
│       └── tasks/
│           ├── backlog/
│           ├── todo/
│           ├── in-progress/
│           ├── review/
│           └── done/
├── bugs/
│   ├── backlog/
│   ├── todo/
│   ├── in-progress/
│   ├── review/
│   └── done/
└── standalone-tasks/
    ├── backlog/
    ├── todo/
    ├── in-progress/
    ├── review/
    └── done/
```

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
- Write ticket content directly to filesystem

**Workflow:**
1. **Planning:** Analyze PRD and create comprehensive Epic/Story/Task breakdown
2. **Ticket Creation:** Write ticket files directly to working directory or appropriate location
3. **Ticket Organization:** Invoke agile-ticket-manager to organize newly created tickets
4. **Status Updates:** Request agile-ticket-manager to move tickets between statuses

**Example Interaction:**
```markdown
Project Manager creates ticket file:
→ Writes: /home/claude/manager/new-task.md

Project Manager invokes agile-ticket-manager:
→ "I've created TASK-3.2.1-implement-agent-card.md in the working directory"
→ agile-ticket-manager validates and moves to proper location
→ agile-ticket-manager responds with confirmation and location
```

**Never Does:**
- Move ticket files manually (delegates to ticket manager)
- Query ticket locations directly (asks ticket manager)
- Organize directory structure (ticket manager handles this)

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

agile-ticket-manager responds:
→ Returns list with ticket IDs, titles, priorities, descriptions

Orchestrator to agile-ticket-manager (after work starts):
→ "Move TASK-3.2.1 to in-progress status"

agile-ticket-manager responds:
→ "Moved TASK-3.2.1-implement-agent-card.md to in-progress/"
```

**Never Does:**
- Create tickets (project manager does this)
- Write ticket content (project manager does this)
- Move files manually (asks ticket manager)

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
Project Manager (creates ticket files)
    ↓
agile-ticket-manager (organizes tickets into proper directories)
    ↓
Tickets available in ticketing system
```

### 2. Ticket Execution Flow
```
Orchestrator queries ticket manager ("Show todo tickets")
    ↓
agile-ticket-manager (returns available tickets)
    ↓
Orchestrator (presents options to user)
    ↓
User selects ticket
    ↓
Orchestrator requests ticket manager ("Move ticket to in-progress")
    ↓
agile-ticket-manager (moves ticket: todo → in-progress)
    ↓
Orchestrator assigns to developer
    ↓
Developer implements and tests
    ↓
Developer reports completion
    ↓
Orchestrator requests ticket manager ("Move to review")
    ↓
agile-ticket-manager (moves ticket: in-progress → review)
    ↓
User reviews code
    ↓
IF User approves:
    Orchestrator requests ticket manager ("Move to done")
    agile-ticket-manager (moves ticket: review → done)
    PR merged, ticket complete
    ↓
IF User requests changes:
    Orchestrator requests ticket manager ("Move back to in-progress")
    agile-ticket-manager (moves ticket: review → in-progress)
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
Project Manager creates Epic/Story/Task tickets
    ↓
agile-ticket-manager organizes tickets
```

---

## Workflow Commands Integration

### `/swarm` Command Integration

**Current Behavior:**
- Presents ticket options from `docs/tickets/phase-*/` (old location)

**Updated Behavior:**
1. **Step 2: Check for Existing Tickets**
   - Query agile-ticket-manager for tickets in `todo` and `backlog` status
   - Review ticket metadata (ID, title, priority, dependencies)

2. **Step 4: Ticket Selection & Dependency Analysis**
   - Invoke project-manager agent to analyze tickets from agile-ticket-manager
   - Project manager queries ticket manager for:
     - All pending tickets across all statuses
     - Epic/Story relationships
     - Ticket dependencies
   - Present 2-4 ticket options based on analysis

3. **Step 5: Execute Development Workflow**
   - Before starting work: Request ticket manager to move ticket to `in-progress`
   - After testing complete: Request ticket manager to move ticket to `review`
   - After PR merged: Request ticket manager to move ticket to `done`

### `/ba` Command Integration

**Current Behavior:**
- Creates PRD in BA session directory

**Updated Behavior:**
- No changes to BA workflow
- BA creates PRDs, project manager creates tickets from PRDs
- Clear handoff: BA produces documentation, PM produces tickets

---

## Key Interaction Patterns

### Pattern 1: Creating New Tickets
```markdown
# Project Manager Workflow
1. Analyze requirements (from PRD or user request)
2. Create ticket file(s) in working directory or appropriate location
3. Invoke agile-ticket-manager with ticket details
4. Ticket manager validates, assigns ID, organizes into directory structure
5. Ticket manager confirms location and status
```

### Pattern 2: Querying Available Tickets
```markdown
# Orchestrator Workflow
1. Invoke agile-ticket-manager: "Show all tickets in `todo` status with priority P0 or P1"
2. Ticket manager searches directory structure
3. Ticket manager returns list with metadata (ID, title, priority, parent, etc.)
4. Orchestrator presents options to user
```

### Pattern 3: Updating Ticket Status
```markdown
# Orchestrator Workflow
1. Developer reports task completion
2. Orchestrator invokes agile-ticket-manager: "Move TASK-3.2.1 to review status"
3. Ticket manager moves file to review/ directory
4. Ticket manager updates frontmatter `status` field
5. Ticket manager updates `updated` timestamp
6. Ticket manager confirms new location
```

### Pattern 4: Finding Related Tickets
```markdown
# Orchestrator Workflow
1. Invoke agile-ticket-manager: "Show all tasks under STORY-3.2"
2. Ticket manager traverses directory hierarchy
3. Ticket manager returns all tasks with parent: STORY-3.2
4. Orchestrator uses for dependency planning
```

---

## Migration Notes

### Old System (DEPRECATED)
- Tickets stored in `/home/claude/manager/docs/tickets/phase-*/`
- No status workflow
- Manual file organization
- No agent responsible for organization

### New System (CURRENT)
- Tickets in `/home/tickets/claude/manager/`
- Status-based workflow (backlog → todo → in-progress → review → done)
- agile-ticket-manager handles all organization
- Project manager creates tickets, ticket manager organizes them

### Transition Plan
1. Update subagent documentation to reference ticket manager
2. Update /swarm command to query ticket manager
3. Update /ba command to clarify handoff to project manager
4. Update CLAUDE.md to document ticketing workflow
5. All agents must use ticket manager for ticket operations

---

## Best Practices

### For All Agents
1. **Never move ticket files directly** - Always request from ticket manager
2. **Never query filesystem directly** - Always ask ticket manager for ticket information
3. **Always use ticket IDs** - Reference tickets by ID (TASK-3.2.1, BUG-027, etc.)
4. **Track status accurately** - Request status updates at appropriate workflow steps
5. **Maintain relationships** - Preserve parent-child relationships (Epic → Story → Task)

### For Project Manager
1. **Write complete tickets** - Include all frontmatter fields
2. **Define clear acceptance criteria** - Make success measurable
3. **Set appropriate priorities** - P0 for critical, P1 for important, P2-P3 for nice-to-have
4. **Document dependencies** - Identify blockers and relationships
5. **Hand off to ticket manager** - Let ticket manager handle file organization

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

3. Creates story and task files similarly
4. Invokes agile-ticket-manager:
   "I've created EPIC-004-global-search.md, STORY-4.1-backend-search-api.md,
   and 3 task files in the working directory"

agile-ticket-manager:
1. Validates ticket files
2. Creates directory structure:
   /home/tickets/claude/manager/epics/EPIC-004-global-search/
   /home/tickets/claude/manager/epics/EPIC-004-global-search/stories/STORY-4.1-backend-search-api/
3. Moves files to appropriate locations
4. Confirms: "Organized EPIC-004 with 2 stories and 6 tasks. All tickets in `todo` status."
```

### Example 2: Working on a Task

**Scenario:** Orchestrator assigns TASK-4.1.1 to backend-architect

```markdown
Orchestrator to agile-ticket-manager:
"Move TASK-4.1.1 to in-progress status"

agile-ticket-manager:
- Moves file from tasks/todo/ to tasks/in-progress/
- Updates status field in frontmatter
- Responds: "TASK-4.1.1-create-search-endpoint.md moved to in-progress"

Orchestrator to backend-architect:
"Implement TASK-4.1.1: Create search endpoint"

backend-architect:
- Implements feature
- Tests implementation
- Reports completion

Orchestrator to agile-ticket-manager:
"Move TASK-4.1.1 to review status"

agile-ticket-manager:
- Moves file from tasks/in-progress/ to tasks/review/
- Updates status and timestamp
- Responds: "TASK-4.1.1 moved to review. Awaiting code review."

After code review and PR merge:

Orchestrator to agile-ticket-manager:
"Move TASK-4.1.1 to done status"

agile-ticket-manager:
- Moves file to tasks/done/
- Updates status and timestamp
- Responds: "TASK-4.1.1 completed and archived in done/"
```

### Example 3: Finding Tickets for Next Sprint

**Scenario:** User runs /swarm to see available work

```markdown
Orchestrator invokes project-manager:
"Analyze available tickets and suggest options"

Project Manager queries agile-ticket-manager:
"Show all tickets in `todo` and `backlog` status with priorities P0, P1, P2"

agile-ticket-manager responds:
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

Orchestrator:
- Moves BUG-038 to in-progress (via ticket manager)
- Moves TASK-4.1.1 to in-progress (via ticket manager)
- Assigns to appropriate agents
```

---

## Summary

The **agile-ticket-manager** is the central filing system for all project tickets. It:
- Organizes tickets created by project-manager
- Provides ticket retrieval and querying
- Manages status transitions
- Maintains Epic/Story/Task relationships
- Acts like Jira/Azure DevOps but file-based

All agents must interact with the ticket manager rather than accessing ticket files directly. This ensures:
- Consistent ticket organization
- Accurate status tracking
- Proper relationship maintenance
- Audit trail of all ticket operations
- Single source of truth for ticket information

---

**Next Steps:**
1. Update subagent definitions with ticket manager interaction patterns
2. Update /swarm command to query ticket manager
3. Update /ba command to clarify ticket creation handoff
4. Update CLAUDE.md with ticketing workflow documentation
5. Test integration with real workflow scenarios
