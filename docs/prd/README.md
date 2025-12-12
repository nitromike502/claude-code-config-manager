# Phase Requirements Documents (PRDs)

## Purpose

This directory contains Product Requirements Documents for the Claude Code Config Manager project, organized by development phase.

## Active PRDs

### Phase 3: Copy Configuration ✅ Complete (Nov 2025)
- **PRD**: `PRD-Phase3-Copy-Configuration.md`
- **Status**: Implemented and released in v2.1.0
- **Features**: Copy agents, commands, hooks, and MCP servers between projects with conflict resolution

### Subagents Management 📅 Planned
- **PRD**: `PRD-Subagents.md`
- **Scope**: Create, edit, and delete subagent definitions from the UI
- **Status**: Design phase
- **Priority**: High

### Commands Management 📅 Planned
- **PRD**: `PRD-Commands.md`
- **Scope**: Create, edit, and delete slash commands from the UI
- **Status**: Design phase
- **Priority**: Medium

### Hooks Configuration 📅 Planned
- **PRD**: `PRD-Hooks.md`
- **Scope**: Visual editor for configuring Claude Code hooks
- **Status**: Design phase
- **Priority**: Medium

### MCP Management 📅 Future
- **PRD**: `PRD-MCP.md`
- **Scope**: Enable/disable MCP servers, advanced configuration
- **Status**: Future planning
- **Priority**: Medium

**Note:** Implementation order for planned features will be determined based on user feedback and project priorities.

## Feature Research

The `features/` subdirectory contains research and analysis for potential features:
- **FEATURE-COMPARISON.md** - Comparative analysis of Skills, Plugins, and Copy features
- **skills-readonly/** - Skills feature specifications and designs

## Historical PRDs

Completed Phase 1-2 PRDs have been archived in the ticketing system for historical reference. The agile-ticket-manager agent maintains these archives to preserve requirements and completion criteria for completed phases without cluttering the active documentation.

## PRD Lifecycle

1. **Draft** → Research and requirements gathering
2. **Active** → Development in progress, document actively referenced
3. **Complete** → Feature implemented and released
4. **Archived** → Moved to ticketing system archives for historical reference

## Related Documentation

- **Roadmap**: `docs/guides/ROADMAP.md` - Phase timeline and dependencies
- **SWARM Workflow**: `docs/guides/SWARM-WORKFLOW.md` - Implementation process
- **Archives**: Completed phase documentation (archived in ticketing system, managed by agile-ticket-manager)
