# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.3.0] - 2025-11-01

### 🎯 Phase 2.3: Production Readiness Fixes

This release addresses critical production blockers identified in comprehensive code review (PR #58), preparing Claude Code Manager for NPM publication.

### ✨ Added

#### Legal & Professional Quality
- **MIT LICENSE file** - Legal compliance for NPM publication
- **favicon.svg** - Professional branding (eliminates 404 errors)
- **dist/ in NPM package** - Pre-built frontend for instant NPX startup

#### Accessibility Compliance
- **WCAG 2.1 AA compliance** - Screen reader support and keyboard navigation
- **ARIA labels** - Comprehensive accessibility attributes across all components
- **Lighthouse score ≥90** - Verified accessibility compliance

### 🔧 Changed

#### Documentation Updates
- **Test count consistency** - Updated all docs to reflect 276 backend + 603 frontend = 879 total tests
- **Phase status updates** - Phase 2.3 marked complete across all documentation
- **Roadmap updates** - Current phase accurately reflected

### 🐛 Fixed

#### Critical Production Fixes
- **Memory leak** - Dashboard event listener cleanup (CRITICAL-005)
- **Security vulnerability** - Vite updated to 7.1.12 (CVE fix)
- **Event handler mismatch** - Sidebar navigation signature corrected (HIGH-011)

### 📊 Test Results

```
Phase 2.3 Test Suite:
✅ Backend Tests:  276/276 passing (100%)
✅ Frontend Tests: 603/603 passing (100%)
─────────────────────────────────────
   TOTAL:         879/879 passing (100%) ✅
```

### 🎉 Production Ready

Claude Code Manager is now ready for NPM publication with:
- Zero vulnerabilities
- WCAG 2.1 AA accessibility compliance
- Professional appearance and branding
- Comprehensive test coverage
- Legal compliance

---

## [2.0.0] - 2025-10-20

### 🎯 Major Release: Phase 2 Vite Migration Complete

This is a **major version release** representing a complete architectural modernization of the Claude Code Manager from Phase 1 (static HTML) to Phase 2 (Vue 3 SPA with Vite).

### ✨ Added

#### Architecture & Build System
- **Vite build system** - Modern dev server with Hot Module Replacement (< 1s reload)
- **Vue 3 Single File Components** - Complete conversion from static HTML to Vue SFCs
- **Vue Router** - Client-side routing with SPA navigation (no page reloads)
- **Pinia state management** - Centralized store for theme, projects, and notifications
- **CSS Variables system** - 80+ CSS variables for theme management (dark/light mode)
- **Centralized API client** - Unified API layer with timeout and error handling

#### Components (6 new Vue components)
- `App.vue` - Root component with routing integration
- `Dashboard.vue` - Project list view with filtering and sorting
- `ProjectDetail.vue` - Detailed project configuration viewer with sidebar
- `UserGlobal.vue` - User-level configuration viewer
- Configuration cards for agents, commands, hooks, and MCP servers
- Theme toggle functionality

#### Testing
- **Visual Regression Tests (Test 300)** - 57 tests across 6 suites
  - Dashboard visual states (normal, loading, error, empty)
  - Dark/light mode switching
  - Project detail view variations
  - Component rendering verification
  - Responsive design (mobile, tablet, desktop)
  - Interactive hover states
  - Baseline snapshots for Chromium, Firefox, WebKit

#### Documentation
- Comprehensive Phase 2 migration guide
- Test patterns reference for developers
- Phase 2 quick reference guide
- Test numbering reference guide
- Frontend test infrastructure documentation
- Mock fixtures guide for test writers

### 🔧 Changed

#### Frontend Architecture
- **Removed:** Static HTML templates (replaced with Vue components)
- **Removed:** jQuery and vanilla JavaScript
- **Removed:** Multi-page HTML navigation (replaced with Vue Router SPA)
- **Updated:** API client to use Vite proxy instead of direct Express calls
- **Updated:** All styling to use CSS variables and Vue component scoping

#### Test Suite Modernization
- **API Routes:** Updated to use wildcard patterns (`**/api/*`) for Vite proxy
- **URLs:** Migrated from query params (`/project-detail.html?id=X`) to Vue Router paths (`/project/:id`)
- **Selectors:** Updated all test selectors to match Phase 2 Vue component names
- **Mock Data:** Enhanced fixtures with Phase 2-specific data structures
- **Removed redundant E2E tests:** Deleted Test 103 (unimplemented search) and Test 104 (redundant error handling)

#### Test Coverage
- **E2E Tests (101, 100, 102, 105):** Updated for Phase 2 SPA architecture (90 tests)
- **Frontend Component Tests (01-06, 23):** Migrated to Phase 2 patterns (120 tests)
- **Responsive Design Tests (200):** Fixed viewport and selector issues (44 tests)
- **Visual Regression Tests (300):** Created new suite with baseline snapshots (57 tests)

### 🐛 Fixed

#### E2E Test Fixes
- [Test 101] Project discovery flow - 18/18 passing ✅
- [Test 100] Complete workflows integration - 24/24 passing ✅
- [Test 102] Configuration viewing - 27/27 passing ✅
- [Test 105] Theme toggle persistence - 21/21 passing ✅

#### Frontend Test Fixes
- [Test 02] Component tests - updated selectors and API mocking
- [Test 06.003.001] Light mode colors - unskipped and verified
- [Test 06.005.003] CSS variables - unskipped and verified

#### Responsive Test Fixes
- [Test 200] Layout responsive - fixed strict mode selector issues (44/44 passing ✅)

#### Visual Regression Test Fixes
- [Test 300.001] Dashboard visual regression - 4/4 tests passing ✅
- [Test 300.002] Dark/light mode - 2/2 tests passing ✅
- [Test 300.003] Project detail view - 4/4 tests passing ✅
- [Test 300.004] Dashboard components - 3/3 tests passing ✅
- [Test 300.005] Responsive design - 3/3 tests passing ✅
- [Test 300.006] Interactive states - 3/3 tests passing ✅

### 📊 Test Results

```
Before Phase 2 Migration:
- E2E Tests: Multiple failures due to HTML → Vue mismatch
- Component Tests: Outdated selectors and mock data
- Visual Tests: All skipped (no Phase 2 baselines)

After Phase 2 Migration:
✅ E2E Tests:        90/90 passing (100%)
✅ Component Tests: 120/120 passing (100%)
✅ Responsive Tests: 44/44 passing (100%)
✅ Visual Tests:     57/57 passing (100%)
✅ Backend Tests:   270/270 passing (100%)
─────────────────────────────────
   TOTAL:          581/581 passing (100%) ✅
```

### 🔄 Migration Guide

For developers upgrading from v1.0.1 to v2.0.0:

1. **Development mode** now uses Vite dev server (instead of webpack)
   ```bash
   npm run dev        # Vite frontend (port 5173)
   npm run dev:backend # Express backend (port 8420)
   ```

2. **URLs have changed** - Use new Vue Router paths
   - Old: `/project-detail.html?id=homeuserprojectsmyapp`
   - New: `/project/homeuserprojectsmyapp`

3. **API routing** through Vite proxy instead of direct Express
   - Requests to `/api/*` are proxied to Express backend
   - Tests use `**/api/*` wildcard pattern for Vite compatibility

4. **Component selectors** have been updated for Vue components
   - Old: `.project-detail-view`
   - New: `.project-detail`

5. **Test suite** has reorganized numbering:
   - 01-99: Frontend component tests
   - 100-199: E2E integration tests
   - 200-299: Responsive design tests
   - 300-399: Visual regression tests

### 📦 Performance Improvements

- **Dev Server Startup:** < 1 second (Vite)
- **HMR (Hot Module Replacement):** < 1 second file change reload
- **Bundle Size:** < 500KB (gzipped)
- **Initial Load Time:** < 2 seconds
- **No Page Reloads:** Complete SPA experience

### 🚀 Breaking Changes

This is a **major version release** with breaking changes:

1. **URLs** - All old HTML page URLs no longer work
   - Update bookmarks and links to use new Vue Router paths
2. **Build system** - Webpack replaced with Vite
   - Update build scripts if customized
3. **Frontend framework** - Static HTML replaced with Vue 3
   - Custom frontend modifications need Vue rewrite
4. **API integration** - Uses Vite proxy instead of direct Express calls
   - Update API mock configuration if customized

### 📝 Known Limitations

- Search functionality (Test 103) - Not yet implemented in Phase 2
- Advanced error handling (Test 104) - Consolidated with component tests
- Some visual regression tests captured at different resolutions than Phase 1

### 📚 Documentation

- [Phase 2 Migration Guide](./docs/PHASE2-MIGRATION-GUIDE.md)
- [Phase 2 Quick Reference](./docs/PHASE2-QUICK-REFERENCE.md)
- [Test Patterns Reference](./docs/testing/TEST-PATTERNS-REFERENCE.md)
- [Frontend Test Infrastructure](./docs/FRONTEND_TEST_INFRASTRUCTURE.md)

---

## [1.0.1] - 2025-10-19

### Added
- NPX CLI with port detection and instance management
- Cross-browser test updates (Chromium, Firefox, WebKit)

### Fixed
- Property name in MCP server click handler (BUG-006)
- YAML error handling improvements

### Changed
- Test organization with number prefixes
- Achieved 100% pass rate for implemented features

---

## [1.0.0] - 2025-10-15

### Initial Release

- Phase 1 MVP: Read-only interface for Claude Code configuration management
- Project discovery from ~/.claude.json
- Subagent, slash command, hooks, and MCP server viewing
- Dark/light theme support
- Responsive design for desktop/laptop
- 100% feature completion for Phase 1 scope
