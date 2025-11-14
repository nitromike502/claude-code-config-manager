# TODO - Future Tasks & Ideas

## Purpose

This file is a **personal idea backlog** for the Claude Code Manager project. It serves as a collection point for:
- Feature ideas and enhancement suggestions
- Potential improvements discovered during development
- Nice-to-have functionality for future phases
- Technical debt or refactoring opportunities worth exploring

**This is NOT a project status tracker.** Project progress and task completion are tracked via:
- Git commits (one commit per completed task)
- Pull requests and code reviews
- Test suite execution and results
- Documentation in `CLAUDE.md` (for architecture/feature status)

## Guidelines

- **Add freely**: Capture ideas as they emerge during development
- **Keep it rough**: Ideas don't need to be fully fleshed out
- **Organize loosely**: Group related ideas by category/phase when it makes sense
- **Review occasionally**: Periodically review to identify patterns or priorities
- **Link to PR/commits**: When an idea becomes a task, link it to the PR/commit that implements it

**Note:** Changes to this file can be included in any branch/PR regardless of the feature being developed.

---

## Future Enhancement Ideas

### Phase 4 - Subagent CRUD (Next Major Feature)
- [ ] Create, edit, and delete subagent definitions
- [ ] YAML frontmatter validation
- [ ] Live preview of subagent content
- [ ] Template system for common subagent types

### Phase 5 - Command Management
- [ ] Create, edit, and delete slash commands
- [ ] Command testing and validation
- [ ] Nested directory support
- [ ] Import/export command libraries

### Phase 6 - Hooks Configuration
- [ ] Visual hook editor
- [ ] Hook testing and validation
- [ ] Pre-built hook templates
- [ ] Hook dependency management

### Project Discovery Improvements
- [ ] **Filter projects without `.claude` directory**: Modify project discovery to ignore any projects from the project listing if the directory does not contain a `.claude` directory. This prevents listing directories that aren't actually Claude Code projects, improving accuracy of the project list and reducing clutter.

### Phase 7 - MCP Server Management
- [ ] Add, edit, and remove MCP servers
- [ ] Server configuration validation
- [ ] Connection testing
- [ ] Server discovery and recommendations

### Scripts to Skills Migration
- [ ] Migrate utility scripts from `scripts/` directory to Claude Code skills
- [ ] Convert `ensure-server-running.sh` to a reusable skill
- [ ] Evaluate other scripts for skill conversion potential
- [ ] Update documentation to reference skills instead of direct script paths

### Workflow Analyzer Script Integration
- [ ] Update `/analyze-workflow` slash command to utilize condense-transcript.js helper script
- [ ] Update `workflow-analyzer` agent instructions to leverage condense-transcript.js for large transcripts
- [ ] Add documentation in workflow-analyzer about when/how to use the transcript condenser
- [ ] Test workflow analysis with condensed vs. raw transcripts for efficiency comparison

### YAML Frontmatter Validation & Auto-Fix
- [ ] Add YAML validation UI that highlights files with parsing errors
- [ ] Implement "Fix YAML" button/feature to auto-correct common issues
- [ ] Support unquoted text values (add quotes where needed)
- [ ] Handle special characters in YAML values (colons, brackets, etc.)
- [ ] Provide diff preview before applying fixes
- [ ] Add option to bulk-fix all YAML errors in a project

### UI/UX Enhancements
- [ ] **Migrate existing components to PrimeVue** - Installed PrimeVue in Phase 3 for copy feature components (CopyButton, CopyModal, ConflictResolver). Consider migrating existing custom HTML/CSS components (ConfigCard, ConfigDetailSidebar, etc.) to PrimeVue components for consistency and reduced maintenance. Low priority - focus on feature completion first.

### Performance Optimization Ideas
- ✅ **RESOLVED: Jest test performance issue** - Copy service tests were split from one monolithic file (653 lines) into 5 focused test files. Now runs in ~0.3s with all 67 tests passing. Resolved in TASK-3.1.6 (November 2, 2025).

### Developer Experience Ideas

- [ ] **Review and optimize test suite** - With 1,300+ tests taking 5+ minutes to run, review all tests for duplicates, redundancy, and unnecessary coverage. Consider consolidating overlapping tests, removing trivial tests that don't add value, and restructuring test organization for faster execution. Goal: Reduce test suite to essential coverage only, targeting <2 minute full suite execution.

- [ ] **Modify SWARM workflow for targeted testing** - Current workflow runs full test suite (1,300+ tests) after each task completion, causing significant delays. Update workflow to: (1) Run tests only after all development for a ticket is complete, not after each individual task, (2) Run only targeted/relevant tests for the changed code (e.g., only frontend tests for UI changes, only copy tests for copy feature changes), (3) Reserve full test suite for final PR validation. Update `docs/guides/SWARM-WORKFLOW.md` and `docs/guides/TESTING-GUIDE.md` to reflect this approach.

---

## Ideas That Have Been Implemented

These ideas were originally captured in this TODO and have since been completed:

- ✅ **Copy Configuration (Phase 3)** - Copy agents, commands, hooks, and MCP servers between projects with conflict resolution (Completed 2025-11-13)
- ✅ **Vite Migration (Phase 2)** - Modernize frontend architecture with Vite build system, Vue Router, and Pinia state management (Completed 2025-10-20)
- ✅ **NPX Support** - Allow running Claude Code Manager via `npx claude-code-config-manager` without local installation (Completed 2025-10-17)
