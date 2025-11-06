# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2025-11-05

### Added

#### Copy Configuration Feature - Backend Service
- **Configuration-Specific Copy Logic** - Complete copy service for agents, commands, hooks, and MCP servers
  - `copyAgent()` - File-based copy with YAML validation and conflict resolution
  - `copyCommand()` - File-based copy with nested directory preservation
  - `copyHook()` - Complex 3-level merge algorithm for hooks (event → matcher → command)
  - `copyMcp()` - JSON merge with dual file location support (.mcp.json vs settings.json)

- **Robust Conflict Handling**
  - Automatic conflict detection for all config types
  - Configurable resolution strategies: skip, overwrite, rename
  - Safe rename logic with numeric suffixes (agent.md → agent-2.md → agent-3.md)
  - Pre-copy validation without committing changes

- **Security & Validation**
  - Path traversal protection on all copy operations
  - YAML frontmatter validation for agents and commands
  - JSON schema validation for hooks and MCP configurations
  - Permission verification before copy operations
  - Atomic writes using temp file + rename pattern for reliability

- **Smart Deduplication**
  - Hooks: Deduplication by command field within same event+matcher
  - MCP servers: Deduplication by server name
  - Agents/Commands: Filename-based duplicate detection

- **Comprehensive Error Handling**
  - File system errors (permissions, disk space, missing files)
  - Configuration parse errors with helpful messages
  - Non-existent project/scope validation
  - Symlink prevention for security
  - Transaction-like behavior (validate before committing)

#### Testing
- **111 Comprehensive Tests** for copy service (100% pass rate)
  - Agent copy: 24 tests (success, conflicts, permissions, validation)
  - Command copy: 25 tests (nested directories, deep paths)
  - Hook copy: 45 tests (3-level merging, deduplication, conflict scenarios)
  - MCP copy: 17 tests (dual file locations, JSON merge, deduplication)

### Notes
- **Skills copy deferred** - Skills viewing not yet implemented in UI (targeted for future phase)
- **API endpoints will be added in STORY-3.3** - This release contains backend service only
- **Future phases** will add UI components, API endpoints, and user-facing copy workflow

### Technical Details
- Backend implementation: `src/backend/services/copy-service.js` (1030 LOC)
- Copy validators: `src/backend/validators/copy-validator.js`
- Comprehensive test suite: `tests/backend/services/copy-service-*.test.js`

---

## [2.0.1] - 2025-11-02

### Fixed
- **BUG-038:** Hooks display and parsing now compliant with Claude Code specification
  - Validates hook event names against official Claude Code events
  - Rejects invalid event names with helpful error messages
  - Implements hook deduplication across settings files
  - Flattens response structure for easier consumption

### Changed
- **BREAKING:** Hooks API response structure flattened (no nested `hooks` arrays)

---

## [2.0.0] - 2025-11-01

### 🎯 Major Release: Complete Vue.js Migration

**Phase 2 Complete** - The Claude Code Manager has been fully migrated to a modern Vue.js 3 + Vite architecture while maintaining 100% feature parity with the Phase 1 MVP.

### Added

#### Development Infrastructure
- **Vite Build System** - Lightning-fast HMR and optimized production builds
- **Vue Router** - Client-side routing for SPA navigation
- **Pinia State Management** - Centralized application state with reactivity
- **Centralized API Client** - `/src/api/client.js` for consistent backend communication
- **NPX Support** - Run via `npx claude-code-config-manager` without local installation

#### UI Components
- **Responsive Navigation** - Mobile-friendly sidebar with auto-collapse
- **Breadcrumb Navigation** - Clear context for current view
- **Loading States** - Skeleton loaders during data fetches
- **Empty States** - Helpful messages when no data exists
- **Error Handling** - User-friendly error messages and recovery options

#### Testing
- **879 Total Tests** (276 backend + 603 frontend)
  - Backend: Jest with comprehensive API coverage
  - Frontend: Playwright E2E tests across 3 browsers
  - Visual regression tests for UI consistency
- **100% Test Pass Rate** maintained throughout migration

### Changed

#### Architecture
- **SPA Navigation** - From multi-page to single-page app with Vue Router
- **State Management** - From vanilla JS to Pinia stores
- **Build System** - From CDN imports to Vite bundling
- **Component Structure** - Modular Vue 3 components with Composition API

#### Performance
- **Development** - Sub-second HMR updates (was 3-5s page reloads)
- **Production** - Code splitting and tree-shaking reduce bundle size
- **Caching** - Intelligent state caching reduces redundant API calls

### Removed
- **CDN Dependencies** - Vue.js, PrimeVue, PrimeIcons now bundled
- **Legacy Frontend** - `/src/frontend/` directory (Phase 1 code)
- **Static HTML** - Replaced with dynamic Vue components

### Technical Debt Addressed
- Eliminated duplicate code across similar views
- Standardized API error handling
- Improved type safety with Vue 3 props
- Better separation of concerns (components, stores, API)

### Backward Compatibility
- **100% API Compatibility** - Backend unchanged, all endpoints stable
- **Data Format** - No changes to JSON structures or file formats
- **Configuration** - Existing `.claude.json` and project configs work unchanged

### Migration Notes
- **No User Action Required** - Update via `npm install -g` or `npx`
- **Browser Requirements** - Modern browsers (ES2020+)
- **Node.js** - Requires Node 18+ for development

### Documentation
- Updated README with Vite architecture
- New development guides in `/docs/guides/`
- Component documentation with examples
- Testing strategy and best practices

### Known Issues
- None - all 879 tests passing

### Contributors
This release was developed through coordinated SWARM workflow with specialized subagents:
- Backend Architect, Frontend Developer, Data Parser
- Test Automation Engineer, Documentation Engineer
- Code Reviewer, Git Workflow Specialist

**Phase 2 Status:** ✅ Complete
**Next Phase:** Phase 2.1 - Component Refactoring

---

## [1.0.0] - 2025-10-16

### Added
- Initial MVP release
- Project discovery from `~/.claude.json`
- Subagent viewing from `.claude/agents/*.md`
- Slash command viewing from `.claude/commands/**/*.md`
- Hooks viewing from `.claude/settings.json`
- MCP server viewing from `.mcp.json`
- Dark mode UI with PrimeVue components
- Express backend on port 8420
- Live file system reads (no database)

### Features
- View all Claude Code projects
- Browse subagents, commands, hooks, MCP servers
- User-level and project-level configuration support
- Responsive design for laptop/desktop
- Manual refresh capability

### Technical
- Node.js + Express backend
- Vue.js 3 + PrimeVue frontend (CDN-based)
- YAML frontmatter parsing for subagents
- Nested command directory support
- Multi-file hooks merging (settings.json + settings.local.json)

---

**Versioning:** This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- MAJOR: Breaking changes to API or data formats
- MINOR: New features, backward compatible
- PATCH: Bug fixes, backward compatible
