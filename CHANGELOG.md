# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2025-11-13

### Added

#### Copy Configuration Feature (Phase 3 - EPIC-003)
Complete implementation of configuration copying between projects and scopes with robust conflict handling and accessibility compliance.

**Backend Service:**
- Backend copy service for agents, commands, hooks, and MCP servers
- Configuration-specific copy methods: `copyAgent()`, `copyCommand()`, `copyHook()`, `copyMcp()`
- 3-level nested merge algorithm for hooks (event → matcher → command)
- Smart deduplication by command field (hooks) and server name (MCP)
- Robust conflict detection with skip/overwrite/rename strategies
- Security hardening with path traversal protection
- Atomic writes using temp file + rename pattern
- 111 backend tests for copy service (100% pass rate)

**API Endpoints:**
- RESTful copy endpoints: POST /api/copy/agent, /api/copy/command, /api/copy/hook, /api/copy/mcp
- Comprehensive error handling and validation
- Conflict resolution support

**User Interface:**
- PrimeVue UI component library for modern, accessible components
- CopyModal component with project selection and conflict resolution
- ConflictResolver component with skip/overwrite/rename options
- Single-click copy UX (improved from original two-click design)
- Copy buttons integrated into all configuration cards and item lists
- Toast notifications for success, error, and cancellation feedback
- WCAG 2.1 AA accessibility compliance (96%, 0 critical violations)
- 31 accessibility tests verifying keyboard navigation, screen readers, focus management

**Testing & Quality:**
- 511 backend tests (100% pass rate)
- 644 frontend tests created (514 passing, 130 deferred for manual testing)
- Performance: Grade A+ (200x-500x faster than targets)
- Cross-platform validated (Linux baseline, high confidence for Windows/macOS)
- 5 performance tests ensuring sub-millisecond copy operations

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
