# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2025-11-01

### 🎯 Major Release: Complete Vue.js Migration

**BREAKING CHANGE:** Complete architectural rewrite from static HTML to Vue 3 SPA with Vite.

### ✨ Added

**Frontend Architecture**
- Vite build system with Hot Module Replacement (< 1s reload)
- Vue 3 Single File Components (SFCs)
- Vue Router for SPA navigation
- Pinia state management (theme, projects, notifications)
- Centralized API client with timeout and error handling

**Components**
- `App.vue` - Root component with routing
- `Dashboard.vue` - Project list with filtering and sorting
- `ProjectDetail.vue` - Configuration viewer with sidebar
- `UserGlobal.vue` - User-level configuration viewer
- Theme toggle with dark/light mode persistence

**Production Readiness**
- MIT LICENSE file for NPM publication
- favicon.svg for professional branding
- Pre-built dist/ folder for instant NPX startup
- Security: Vite updated to 7.1.12 (CVE fix)

**Testing**
- 879 total tests (276 backend + 603 frontend)
- Visual regression tests (57 tests, 3 browsers)
- E2E tests updated for SPA architecture
- Responsive design tests (mobile, tablet, desktop)

### 🔧 Changed

**Architecture**
- Replaced static HTML with Vue 3 components
- Replaced jQuery/vanilla JS with Vue composition API
- Multi-page HTML → Single Page Application
- Direct Express calls → Vite proxy to backend

**URLs**
- Old: `/project-detail.html?id=X`
- New: `/project/X`

**Development**
- `npm run dev` - Vite frontend (port 5173)
- `npm run dev:backend` - Express backend (port 8420)

### 🐛 Fixed

**Critical Bugs**
- Memory leak in Dashboard event listeners (CRITICAL-005)
- Event handler signature mismatch (HIGH-011)
- Agent color/model/tools display in sidebars (BUG-027, BUG-028, BUG-029)
- User configuration card persistence (BUG-035)

**Test Suite**
- E2E tests: 90/90 passing (updated for Vue Router)
- Frontend tests: 603/603 passing (updated selectors)
- Backend tests: 276/276 passing (maintained)

### 📦 Performance

- Dev server startup: < 1 second
- Hot Module Replacement: < 1 second
- Bundle size: < 500KB (gzipped)
- Initial load: < 2 seconds

### 🚀 Migration Notes

For developers upgrading from v1.0.1:
1. URLs use Vue Router paths (no query params)
2. Dev mode now requires both Vite and Express servers
3. API requests go through Vite proxy
4. Component selectors updated for Vue

---

## [1.0.1] - 2025-10-19

### Added
- NPX CLI with port detection and instance management
- Cross-browser test support (Chromium, Firefox, WebKit)

### Fixed
- MCP server click handler property name (BUG-006)
- YAML error handling improvements

### Changed
- Test organization with hierarchical numbering
- 100% pass rate for all implemented features

---

## [1.0.0] - 2025-10-15

### Initial Release

**Phase 1 MVP Features**
- Read-only interface for Claude Code configurations
- Project discovery from ~/.claude.json
- View subagents, slash commands, hooks, and MCP servers
- Dark/light theme support
- Responsive design for desktop/laptop
