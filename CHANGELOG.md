# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [2.2.0] - 2025-11-26

### Added
- Tailwind CSS v4 integration with tailwindcss-primeui plugin for responsive design
- PrimeVue Aura theme components throughout the application (Button, Dropdown, Skeleton)
- Comprehensive CSS variable system for theme customization

### Changed
- Migrated all interactive UI components to PrimeVue Aura theme
- Reduced custom CSS from 1,734 lines to 634 lines (63% reduction)
- Consolidated layout components (ConfigPageLayout, ConfigPanel) for consistency
- Optimized component styling with Tailwind utility classes

### Fixed
- Playwright test compatibility with PrimeVue components
- UI performance test reliability and execution

---

## [2.1.0] - 2025-11-13

### Added
- Copy configuration feature: Copy agents, commands, hooks, and MCP servers between projects
- Smart conflict resolution with skip/overwrite/rename strategies
- PrimeVue UI components for modern, accessible interface
- WCAG 2.1 AA accessibility compliance (96%, 0 critical violations)

### Changed
- Improved copy workflow with single-click UX and toast notifications

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
