# Phase Requirements Documents (PRDs)

## Purpose

This directory contains Product Requirements Documents for the Claude Code Manager project, organized by development phase.

## Active PRDs

### Phase 3: Copy Configuration ✅ Complete (Nov 2025)
- **PRD**: `PRD-Phase3-Copy-Configuration.md`
- **Status**: Implemented and released in v2.1.0
- **Features**: Copy agents, commands, hooks, and MCP servers between projects with conflict resolution

### Phase 4: Subagents Management 📅 Planned
- **PRD**: `PRD-Phase4-Subagents.md`
- **Scope**: Create, edit, and delete subagent definitions from the UI
- **Status**: Design phase

### Phase 5: Commands Management 📅 Planned
- **PRD**: `PRD-Phase5-Commands.md`
- **Scope**: Create, edit, and delete slash commands from the UI
- **Status**: Design phase

### Phase 6: Hooks Configuration 📅 Planned
- **PRD**: `PRD-Phase6-Hooks.md`
- **Scope**: Visual editor for configuring Claude Code hooks
- **Status**: Design phase

### Phase 7: MCP Management 📅 Future
- **PRD**: `PRD-Phase7-MCP.md`
- **Scope**: Enable/disable MCP servers, advanced configuration
- **Status**: Future planning

## Feature Research

The `features/` subdirectory contains research and analysis for potential features:
- **FEATURE-COMPARISON.md** - Comparative analysis of Skills, Plugins, and Copy features
- **skills-readonly/** - Skills feature specifications and designs

## Historical PRDs

Completed Phase 1-2 PRDs have been archived in the ticketing system for historical reference:
- Phase 1 (MVP): `/home/tickets/claude/manager/archives/phases/phase1/`
- Phase 2 (Vite Migration): `/home/tickets/claude/manager/archives/phases/phase2/`

These archives preserve the requirements and completion criteria for completed phases without cluttering the active documentation.

## PRD Lifecycle

1. **Draft** → Research and requirements gathering
2. **Active** → Development in progress, document actively referenced
3. **Complete** → Feature implemented and released
4. **Archived** → Moved to ticketing system archives for historical reference

## Related Documentation

- **Roadmap**: `docs/guides/ROADMAP.md` - Phase timeline and dependencies
- **SWARM Workflow**: `docs/guides/SWARM-WORKFLOW.md` - Implementation process
- **Archives**: `/home/tickets/claude/manager/archives/phases/` - Completed phase documentation
