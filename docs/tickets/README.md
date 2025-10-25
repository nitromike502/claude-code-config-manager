# Claude Code Manager - Tickets

All project tickets organized by phase for easy discovery and navigation.

## Directory Structure

```
docs/tickets/
├── phase-1/                 # Phase 1: MVP (COMPLETE ✅)
│   ├── epic-1-wireframes/   # EPIC-1: Wireframe Design
│   ├── README.md            # Phase 1 overview and metrics
│   └── [17 wireframe tasks]
│
├── phase-2/                 # Phase 2: Vite Migration (COMPLETE ✅)
│   ├── epic-2-backend/      # EPIC-2: Backend API Implementation
│   ├── epic-3-frontend/     # EPIC-3: Frontend Development
│   ├── README.md            # Phase 2 overview and metrics
│   └── [45 backend & frontend tasks]
│
├── phase-2-extension/       # Phase 2.1: Component Refactoring (READY FOR IMPLEMENTATION)
│   ├── EPIC-4.md            # Phase 2 Extension epic overview
│   ├── STORY-2.1.md         # Extract core card components
│   ├── STORY-2.2.md         # Extract sidebar component
│   ├── STORY-2.3.md         # Extract utility components
│   ├── STORY-2.4.md         # Testing & documentation
│   ├── README.md            # Phase 2 Extension overview
│   └── [16 component refactoring tasks]
│
├── bugs/                    # Bug Tracking
│   ├── BUG-001-*.md         # Resolved bugs (Phase 1)
│   ├── BUG-027-*.md         # Recently fixed bugs (Phase 2)
│   ├── BUG-030-*.md         # Open bugs (Phase 2+)
│   └── [38 bug tickets total]
│
├── EPIC-001-phase2-migration-bugfixes.md
├── EPIC-002-data-display-bugs.md
├── EPIC-003-agent-color-display.md
├── PR-Workflow.md
├── TICKET-SUMMARY.md
├── NEXT-STEPS.md
└── README.md                # This file
```

## Epic Status Summary

### EPIC-1: Wireframe Design & Approval ✅
**Status:** COMPLETE (100%)
**Tasks:** 17 tasks (TASK-1.1.1 through TASK-1.6.2)
**Location:** `epic-1-wireframes/`

All wireframes approved. Includes dashboard, project detail, user/global views, responsive design, and dark mode.

---

### EPIC-2: Backend API Implementation ✅
**Status:** COMPLETE (100%)
**Tasks:** 21 tasks (TASK-2.1.1 through TASK-2.5.4)
**Location:** `epic-2-backend/`

Complete backend with all 8 API endpoints, 4 parsers, error handling, and 194 passing tests.

**Key Achievements:**
- All API endpoints functional
- Resilient error handling with warnings system
- Cross-platform path support
- BUG-001 and BUG-002 resolved
- Comprehensive test coverage (Jest + Supertest)

---

### EPIC-3: Frontend Development ✅
**Status:** COMPLETE (100%)
**Tasks:** 20 tasks (TASK-3.1.1 through TASK-3.5.3)
**Location:** `phase-2/epic-3-frontend/`

Vue 3 SPA frontend with project detail view, configuration cards, user/global views, sidebar navigation, dark mode support, and 313 passing tests.

**Key Achievements:**
- All 4 configuration types displaying correctly
- Detail sidebar with metadata and content display
- User/global configuration view
- Responsive design (mobile/tablet/desktop)
- Cross-browser compatibility verified
- 313 frontend tests (100% pass rate)

---

### EPIC-4: Phase 2 Extension - Component Refactoring 📋
**Status:** READY FOR IMPLEMENTATION
**Tasks:** 16 tasks (TASK-2.1.1 through TASK-2.4.3)
**Location:** `phase-2-extension/`
**Timeline:** 3-4 hours

High-impact architecture improvement to reduce code duplication and enable Phase 3+ features.

**Stories:**
- Story 2.1: Extract core card components (5 tasks, 60-90 min)
- Story 2.2: Extract sidebar component (4 tasks, 45-60 min)
- Story 2.3: Extract utility components (4 tasks, 30-45 min)
- Story 2.4: Testing & documentation (3 tasks, 30-45 min)

---

## Current Next Steps

1. **HIGH PRIORITY:** Complete Phase 2 Extension component refactoring
2. **Then:** Fix remaining display bugs (BUG-030 through BUG-033)
3. **Then:** Plan Phase 3 (Subagent CRUD operations)

---

## Ticket Naming Convention

```
EPIC-[number].md              # Epic overview
TASK-[epic].[story].[task].md # Individual tasks
BUG-[number]-description.md   # Bug tracking
```

**Examples:**
- `EPIC-3.md` - Frontend Development epic overview
- `TASK-3.1.1.md` - First task in Story 3.1
- `BUG-001-user-agents-yaml-parsing.md` - Bug fix ticket

---

## Ticket Workflow

1. **Project Manager** creates Epic and generates all tasks
2. **Git-workflow-specialist** creates feature branch (`feature/TASK-X.X.X-description`)
3. **Developer** implements feature + tests immediately
4. **Test-automation-engineer** runs automated tests
5. **Code-reviewer** reviews implementation and test results
6. **Git-workflow-specialist** commits, creates PR, and merges after approval

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project overview
- [PRD-Phase1-MVP.md](../PRD-Phase1-MVP.md) - MVP requirements
- [PR-Workflow.md](PR-Workflow.md) - Pull request process
- [TICKET-SUMMARY.md](TICKET-SUMMARY.md) - Quick reference guide

---

## Archive Policy

Obsolete or superseded tickets are moved to `_archived/` with descriptive names:
- Old epic files replaced by new structure
- Duplicate or outdated planning documents
- Superseded task definitions

Active tickets are never archived - they remain in their epic folders as historical record.
