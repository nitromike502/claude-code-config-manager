# Project Roadmap

## Overview

The Claude Code Manager follows a phased development approach, building incrementally on a solid foundation. With Phase 1 MVP and Phase 2 - Vite Migration complete with 100% test coverage and all critical bugs resolved, the following phases will extend functionality while maintaining quality standards.

## Development Philosophy

- **Incremental Delivery:** Each phase delivers complete, production-ready features
- **Quality First:** 100% test coverage and zero critical bugs before moving to next phase
- **Foundation Before Features:** Architecture and tooling improvements precede major features
- **User Value:** Every phase delivers measurable user benefits

## Phase Status

| Phase | Status | Timeline | Priority |
|-------|--------|----------|----------|
| Phase 1 - MVP | ✅ Complete | Completed | - |
| Phase 2 - Vite Migration | ✅ Complete | Completed | - |
| Phase 2.1 - Component Refactoring | ✅ Complete | Completed (Oct 26, 2025) | - |
| Phase 2.2 - Bug Fixes | ✅ Complete | Completed (Oct 27, 2025) | - |
| Phase 2.3 - Production Readiness | ✅ Complete | Completed (Nov 1, 2025) | - |
| Phase 3 - Copy Configuration | 🚧 In Progress | Started Nov 2, 2025 | High |
| Phase 4 - Subagent CRUD | 📅 Planned | TBD | Medium |
| Phase 5 - Command Management | 📅 Planned | TBD | Medium |
| Phase 6 - Hooks Configuration | 📅 Planned | TBD | Medium |
| Phase 7 - MCP Server Management | 📅 Planned | TBD | Medium |
| Phase 8+ - Advanced Features | 🔮 Future | TBD | Low |

---

## Phase 3 - Copy Configuration Feature

**Status:** 🚧 In Progress
**Started:** November 2, 2025
**Priority:** High (First write operation in Claude Code Manager)

### Objective

Enable users to copy configuration items (agents, commands, hooks, MCP servers) between projects and scopes through a complete end-to-end feature including backend service, API endpoints, and user interface.

### Epic Structure

**EPIC-003** contains 7 stories organized in 3 delivery stages:

**Stage 1: Backend Service (Stories 3.1-3.2) - ✅ COMPLETE**
- STORY-3.1: Backend Copy Service Infrastructure
- STORY-3.2: Configuration-Specific Copy Logic

**Stage 2: API Layer (Story 3.3) - 📅 BACKLOG**
- STORY-3.3: Copy API Endpoints

**Stage 3: User Interface (Stories 3.4-3.7) - 📅 BACKLOG**
- STORY-3.4: Frontend Copy UI Components
- STORY-3.5: State Management and API Integration
- STORY-3.6: UI Integration and Accessibility
- STORY-3.7: Testing and Cross-Platform Validation

### Completed Work (Stories 3.1-3.2)

**Completion Date:** November 5, 2025

1. **Configuration-Specific Copy Methods**
   - `copyAgent()` - File-based copy with YAML validation
   - `copyCommand()` - File-based copy with nested directory support
   - `copyHook()` - Complex 3-level merge algorithm (event → matcher → command)
   - `copyMcp()` - JSON merge with dual file location support

2. **Robust Conflict Handling**
   - Automatic conflict detection for all config types
   - Configurable resolution strategies: skip, overwrite, rename
   - Safe rename logic with numeric suffixes
   - Pre-copy validation without committing changes

3. **Security & Validation**
   - Path traversal protection on all operations
   - YAML/JSON schema validation
   - Permission verification before copy
   - Atomic writes using temp file + rename pattern
   - Symlink prevention

4. **Smart Deduplication**
   - Hooks: Deduplication by command field
   - MCP servers: Deduplication by server name
   - Agents/Commands: Filename-based duplicate detection

### Results Achieved

- ✅ **Complete copy service:** 1030 LOC with all config types supported
- ✅ **111 comprehensive tests:** 100% pass rate
  - Agent copy: 24 tests
  - Command copy: 25 tests
  - Hook copy: 45 tests
  - MCP copy: 17 tests
- ✅ **Robust error handling:** File system, validation, and edge cases
- ✅ **Security hardening:** Path traversal and permission checks

### Remaining Work (Stories 3.3-3.7)

**Timeline:** Ready to Start
**Focus:** Complete the copy feature with API and UI

**Deliverables:**
- RESTful API endpoints for all copy operations
- Copy modal with conflict resolution UI
- Copy buttons integrated into configuration cards
- State management for copy operations
- WCAG 2.1 AA accessibility compliance
- E2E tests for complete copy workflows
- Cross-platform validation (Windows, macOS, Linux)

### Deferred Items

- **Skills copy** - Deferred until Skills viewing is implemented in UI

---

## Phase 4 - Subagent CRUD

**Status:** Planned
**Priority:** Medium

### Features

- Create, edit, and delete subagent definitions
- YAML frontmatter validation
- Live preview of subagent content
- Template system for common subagent types

### User Value

Enables users to manage their Claude Code subagents directly through the web interface, eliminating the need for manual file editing and reducing configuration errors.

---

## Phase 5 - Command Management

**Status:** Planned
**Priority:** Medium

### Features

- Create, edit, and delete slash commands
- Command testing and validation
- Nested directory support
- Import/export command libraries

### User Value

Simplifies slash command creation and sharing, making it easy to build and distribute custom command libraries across projects.

---

## Phase 6 - Hooks Configuration

**Status:** Planned
**Priority:** Medium

### Features

- Visual hook editor
- Hook testing and validation
- Pre-built hook templates
- Hook dependency management

### User Value

Provides a user-friendly interface for configuring Claude Code hooks, making workflow automation accessible without JSON editing.

---

## Phase 7 - MCP Server Management

**Status:** Planned
**Priority:** Medium

### Features

- Add, edit, and remove MCP servers
- Server configuration validation
- Connection testing
- Server discovery and recommendations

### User Value

Streamlines MCP server setup and management, with built-in validation and testing to ensure correct configuration.

---

## Phase 8+ - Advanced Features

**Status:** Future
**Priority:** Low

### Features

- Real-time file watching for automatic updates
- Configuration version history and rollback
- Bulk operations and batch editing
- Multi-project synchronization
- Configuration backup and restore

### User Value

Advanced functionality for power users and teams managing multiple projects, with enterprise-grade features like version control and bulk operations.

---

## Roadmap Notes

### Completed Sub-Phases (Phase 2.x)

**Phase 2.1 - Component Refactoring** (October 26, 2025)
- Extracted 6 reusable components (ConfigCard, ConfigItemList, ConfigDetailSidebar, etc.)
- Reduced code duplication from 62% to <10% (83% reduction)
- ProjectDetail.vue: -52.3% LOC, UserGlobal.vue: -61.1% LOC
- See: `docs/prd/PRD-Phase2-Extension-Component-Refactoring.md`

**Phase 2.2 - Bug Fixes** (October 27, 2025)
- Fixed agent display bugs (BUG-027, 028, 029, 035)
- Resolved event handler and memory leak issues

**Phase 2.3 - Production Readiness** (November 1, 2025)
- Added MIT LICENSE and favicon
- Updated Vite to 7.1.12 (security fix)
- Achieved WCAG 2.1 AA accessibility compliance

### Why Phase 3 Before Phase 4-7?

Copy Configuration (Phase 3) is prioritized before other CRUD features because:

1. **Validates Write Infrastructure:** First write operation tests our security model and error handling
2. **Lower Risk:** Copy operations are safer than create/update/delete (source remains unchanged)
3. **High User Value:** Enables immediate productivity gains without requiring full CRUD
4. **Foundation for CRUD:** Patterns established in copy operations inform create/update/delete features

### Phase Dependencies

```
Phase 1 (MVP) → Phase 2 (Vite Migration) → Phase 2.1 (Refactoring) → Phase 3 (Copy) → Phases 4-7 (CRUD) → Phase 8+ (Advanced)
     ✅                ✅                         ✅                    🚧 In Progress   📅 Planned       🔮 Future
```

**Key Insight:** Phase 3 (Copy Configuration) is the first write operation and validates our write infrastructure. Once complete, Phases 4-7 (CRUD features) can be developed in parallel, as they operate on independent configuration types (agents, commands, hooks, MCP) and share the component foundation from Phase 2.1.

### Success Criteria

Each phase must meet these criteria before advancement:

- ✅ 100% test coverage maintained
- ✅ Zero critical bugs
- ✅ Documentation complete (PRD, guides, API docs)
- ✅ User acceptance testing passed
- ✅ Performance benchmarks met

---

## Contributing to the Roadmap

Have ideas for features or improvements? See the following resources:

- **PRD Template:** `.claude/templates/prd-template.md`
- **Discussion:** Review existing PRDs in `/docs/prd/` before proposing new features
- **Development History:** Review `/docs/sessions/INDEX.md` for lessons learned

---

**Last Updated:** 2025-11-05
**Roadmap Version:** 1.4
**Current Phase:** Phase 3 In Progress 🚧 - Copy Configuration Feature
**Progress:** Stories 3.1-3.2 complete (backend), Stories 3.3-3.7 in backlog (API & UI)
