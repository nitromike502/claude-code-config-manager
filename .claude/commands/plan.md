# Project Planning & Ticket Creation
# Creates Epic/Story/Task breakdown for Claude Code Manager development

<task>
Launch the project-manager agent to assess current project state and create appropriate Epic/Story/Task breakdown based on what's next in the development workflow.
</task>

<context>
**Project**: Claude Code Manager - Web-based tool for managing Claude Code projects
**Tech Stack**: Node.js + Express (backend), Vue 3 + PrimeVue (frontend, CDN)
**Architecture**: Local web server on port 8420, live file system reads

**Development Method**: SWARM (Simultaneous Work And Resource Management)
**Team Structure**: See docs/Subagent-Team.md for complete team definitions

**Available PRDs**:
- docs/prd/PRD-Phase1-MVP.md (reviewed & approved)
- docs/prd/PRD-Phase2-*.md (future phases, not reviewed)
</context>

<execution>
Invoke the `project-manager` agent to:

## Step 1: Assess Current Project State
1. Read CLAUDE.md to understand project structure and success criteria
2. Read docs/workflow-analysis-20251007.md to understand feature sizing requirements
3. Check current directory structure (src/, package.json, wireframes/, etc.)
4. Review git status and recent commits to understand completed work
5. Check for existing TodoWrite tickets/tasks
6. Determine current phase based on CLAUDE.md success criteria:
   - Phase 0: Requirements/Planning (wireframes needed?)
   - Phase 1: MVP Development (backend/frontend work?)
   - Testing/Polish phase?
   - Phase 2: Future features?

## Step 2: Identify Next Development Work
Based on current state, determine which PRD sections need tickets:
- If wireframes not done: Create tickets for wireframe design phase
- If backend not started: Create tickets from PRD backend requirements
- If frontend not started: Create tickets from PRD frontend requirements
- If integration needed: Create integration and testing tickets
- If Phase 1 complete: Check if user wants Phase 2 planning

## Step 3: Create Appropriate Ticket Breakdown (ENFORCE SMALL FEATURE SIZING)
Use TodoWrite tool to create Epic/Story/Task breakdown for identified next work:
- **Epics**: Major feature areas (e.g., "Backend API Development", "Frontend UI Development")
- **Stories**: User-facing features within each epic (e.g., "Project List View", "Subagent Viewer")
- **Tasks**: Technical implementation steps for each story (e.g., "Create /api/projects endpoint")

**⚠️ CRITICAL TASK SIZING REQUIREMENTS:**
- **ALL tasks MUST be completable in 30-60 minutes maximum**
- **Each task must be independently testable** (can run test immediately after)
- **Each task must be independently committable** (enables 15-30 min commit cadence)
- **Break down large features** into smallest possible units
- **Examples of GOOD task sizing:**
  - ✅ "Create /api/projects endpoint" (30 min)
  - ✅ "Add error handling middleware" (30 min)
  - ✅ "Create ProjectList component" (45 min)
  - ✅ "Add sidebar scroll behavior" (30 min)
- **Examples of BAD task sizing:**
  - ❌ "Implement complete backend API" (too large - 3+ hours)
  - ❌ "Build entire Vue SPA" (too large - 3+ hours)
  - ❌ "Add all frontend components" (too large - multiple hours)

Also include:
- Appropriate specialized agent assignments based on team structure
- Dependencies between tasks (minimize to enable parallel work)
- Acceptance criteria for each story
- Phase gates and review checkpoints
- Testing checkpoints after each task

## Step 4: Output Plan Summary
Provide clear summary including:
- What phase/work area these tickets address
- Which PRD sections were used for planning
- High-level overview of epics and stories created
- **Confirmation that all tasks are 30-60 minutes max**
- **Number of tasks created and their sizing distribution**
- Recommendation to run `/swarm` to begin execution

## Step 5: Validate Task Sizing
Before completing, perform final validation:
- Count tasks by estimated duration (30 min, 45 min, 60 min)
- Identify any tasks that might be >60 minutes
- Break down or flag any oversized tasks
- Ensure task descriptions clearly indicate they are small, focused units

The project-manager will intelligently generate properly-sized tickets for whatever work comes next, ensuring continuity in the development workflow while maintaining the commit-friendly task sizing that prevents the "big bang" development pattern.
</execution>

Additional Instructions: $ARGUMENTS