# Product Requirements Document: Phase 2 - Vite Migration

**Version:** 1.0
**Phase:** 2 - Vite Migration (Technical Foundation with Vite+Vue3 SPA)
**Last Updated:** 2025-10-18
**Status:** ✅ COMPLETE (October 2025)

> **NOTE:** This is a historical document. Phase 2 Vite migration is complete.
> The legacy `/src/frontend/` directory referenced in this document has been removed.
> Current architecture is documented in `/home/claude/manager/CLAUDE.md`.

---

## 1. Project Overview

**Goal:** Migrate Claude Code Manager from a hybrid HTML+Vue CDN architecture to a modern, build-optimized Vite+Vue3 Single Page Application (SPA).

**Why Now?**
- Phase 1 MVP (read-only interface) is complete and stable
- Phase 3 (Subagent edit features) requires robust state management
- Current hybrid approach limits scalability and developer experience
- SPA architecture provides foundation for all future phases

**Prerequisites:** Phase 1 MVP must be complete and stable (✅ VERIFIED)

---

## 2. Current Architecture Problems

### What We Have Now (Phase 1)
```
Frontend Architecture:
├── src/frontend/index.html              # Main dashboard (embedded Vue)
├── src/frontend/project-detail.html     # Project view (separate HTML)
├── src/frontend/user-view.html          # User configs (separate HTML)
├── src/frontend/js/
│   ├── app.js                           # Vue instance setup
│   ├── router.js                        # Manual routing via events
│   └── components/*.js                  # Components as .js files
└── src/frontend/css/                    # Global CSS
```

### Problems
| Problem | Impact | Severity |
|---------|--------|----------|
| **Full page reloads** | Lose state, animations, scroll position | HIGH |
| **Multiple HTML files** | Code duplication, inconsistent styling | HIGH |
| **No bundling** | Unoptimized code shipped to browser | MEDIUM |
| **Manual routing** | Complex event-driven navigation | MEDIUM |
| **Component .js files** | Can't use template strings in VS Code | MEDIUM |
| **No SFC format** | Missing Vue Developer Tools support | LOW |
| **CDN Vue** | Runtime compilation overhead | LOW |

---

## 3. Target Architecture

### New Stack (Phase 2+)
```
Frontend Architecture:
├── index.html                           # Single entry point
├── src/
│   ├── main.js                          # App initialization
│   ├── App.vue                          # Root component
│   ├── router/
│   │   └── index.js                     # Vue Router setup
│   ├── stores/
│   │   ├── projects.js                  # Pinia store
│   │   ├── theme.js                     # Theme state
│   │   └── notifications.js             # Toast messages
│   ├── components/
│   │   ├── Dashboard.vue                # Dashboard component
│   │   ├── ProjectDetail.vue            # Project view
│   │   ├── UserGlobal.vue               # User configs
│   │   ├── cards/
│   │   │   ├── AgentCard.vue
│   │   │   ├── CommandCard.vue
│   │   │   ├── HookCard.vue
│   │   │   └── MCPCard.vue
│   │   ├── sidebars/
│   │   │   └── DetailSidebar.vue
│   │   └── common/
│   │       └── Header.vue
│   ├── api/
│   │   └── client.js                    # Axios/fetch setup
│   ├── styles/
│   │   ├── main.css                     # Global styles
│   │   └── variables.css                # CSS variables
│   └── utils/
│       └── parsers.js                   # Data parsing helpers
├── vite.config.js                       # Vite configuration
└── package.json
```

### Benefits
✅ **Client-side routing** - No page reloads, smooth navigation
✅ **Single Vue instance** - Consistent state across routes
✅ **SFC components** - `.vue` Single File Components
✅ **Build optimization** - Minified bundle, code splitting
✅ **HMR support** - Hot module replacement for dev experience
✅ **State management** - Pinia for global state
✅ **Developer tools** - Vue DevTools, better debugging
✅ **Future-proof** - Foundation for all Phase 3+ features

---

## 4. Migration Tasks

### Story 2.1: Vite Setup & Project Structure

**Objectives:** Set up Vite build system and create modern project structure

**Tasks:**
1. **2.1.1:** Create `vite.config.js` with Vue 3 plugin (30 min)
   - Install `vite`, `@vitejs/plugin-vue`, `vue`
   - Configure hot module replacement (HMR)
   - Set API proxy for backend development
   - Set output directories

2. **2.1.2:** Create new SPA entry point `index.html` (20 min)
   - Single HTML file
   - Mount point: `<div id="app"></div>`
   - Reference `src/main.js` as module

3. **2.1.3:** Create `src/main.js` - App initialization (25 min)
   - Import Vue 3
   - Create app instance
   - Mount to `#app`
   - Load theme preference
   - Initialize stores

4. **2.1.4:** Convert `src/frontend/` to `src/` structure (30 min)
   - Move CSS to `src/styles/`
   - Create `src/components/` directory
   - Create `src/stores/` directory
   - Create `src/router/` directory
   - Create `src/api/` directory

5. **2.1.5:** Update `package.json` scripts (15 min)
   - Add `dev`: `vite`
   - Add `build`: `vite build`
   - Add `preview`: `vite preview`
   - Keep existing test scripts

6. **2.1.6:** Test Vite dev server (15 min)
   - `npm run dev` should start on `http://localhost:5173`
   - Backend proxy works (requests to `/api/*` reach backend)
   - HMR works (edit file → auto-reload)

**Acceptance Criteria:**
- ✅ Vite dev server starts without errors
- ✅ `npm run build` produces optimized bundle
- ✅ Backend API accessible via proxy
- ✅ No console errors

---

### Story 2.2: Vue Router Setup

**Objectives:** Implement client-side routing with Vue Router

**Tasks:**
1. **2.2.1:** Install Vue Router v4 (10 min)
   - `npm install vue-router@4`

2. **2.2.2:** Create `src/router/index.js` (35 min)
   - Define routes:
     - `/` → Dashboard
     - `/project/:id` → ProjectDetail
     - `/user` → UserGlobal
   - History mode (web history)
   - Scroll behavior (top on navigation)

3. **2.2.3:** Create route components with placeholders (30 min)
   - `src/components/Dashboard.vue` - placeholder
   - `src/components/ProjectDetail.vue` - placeholder
   - `src/components/UserGlobal.vue` - placeholder
   - Include router-view in App.vue

4. **2.2.4:** Update App.vue for routing (20 min)
   - Remove separate HTML files
   - Add `<router-view/>`
   - Add layout wrapper

5. **2.2.5:** Test navigation (15 min)
   - Verify routes work without page reloads
   - Check route params pass correctly
   - Test back button

**Acceptance Criteria:**
- ✅ Routes navigate without full page reload
- ✅ URL updates correctly
- ✅ Route params available in components
- ✅ Browser back button works

---

### Story 2.3: Pinia State Management

**Objectives:** Set up Pinia store for global state management

**Tasks:**
1. **2.3.1:** Install Pinia (10 min)
   - `npm install pinia`

2. **2.3.2:** Create theme store (25 min)
   - File: `src/stores/theme.js`
   - State: `currentTheme`
   - Actions: `toggleTheme()`, `loadTheme()`, `setTheme()`
   - Persist to localStorage

3. **2.3.3:** Create projects store (35 min)
   - File: `src/stores/projects.js`
   - State: `projects`, `filteredProjects`, `selectedProject`
   - Actions: `loadProjects()`, `refreshProjects()`, `selectProject()`, `filterProjects()`
   - Connect to `/api/projects` endpoint

4. **2.3.4:** Create notifications store (20 min)
   - File: `src/stores/notifications.js`
   - State: `notifications` (array)
   - Actions: `addNotification()`, `removeNotification()`
   - Auto-clear after 5 seconds

5. **2.3.5:** Update App.vue to use stores (15 min)
   - Import stores
   - Use theme store for dark/light mode
   - Use projects store for loading state

**Acceptance Criteria:**
- ✅ Theme toggle saves to localStorage
- ✅ Projects load on app mount
- ✅ Notifications display and auto-dismiss
- ✅ State persists across route changes

---

### Story 2.4: Convert Components to .vue Format

**Objectives:** Convert existing .js components to Vue Single File Components

**Tasks:**
1. **2.4.1:** Create Dashboard.vue (45 min)
   - Convert existing Dashboard.js logic
   - Template: project grid, search, loading states
   - Use composition API (optional, for cleaner code)
   - Import ConfigCard component

2. **2.4.2:** Create ProjectDetail.vue (45 min)
   - Convert ProjectDetail.js logic
   - Display agent/command/hook/MCP cards
   - Sidebar integration

3. **2.4.3:** Create UserGlobal.vue (30 min)
   - Convert UserGlobal.js logic
   - Same card layout as ProjectDetail

4. **2.4.4:** Create configuration card components (60 min)
   - `AgentCard.vue`
   - `CommandCard.vue`
   - `HookCard.vue`
   - `MCPCard.vue`
   - Props: data, colors, click handlers

5. **2.4.5:** Create DetailSidebar.vue (45 min)
   - Sidebar for viewing full content
   - Markdown rendering (use `marked` package)
   - Syntax highlighting (use `highlight.js`)
   - Copy to clipboard button
   - Keyboard shortcuts (Esc to close, Cmd+C to copy)

6. **2.4.6:** Create Header component (30 min)
   - App title/breadcrumbs
   - Search input
   - Theme toggle
   - Back button

7. **2.4.7:** Test all components (30 min)
   - Verify rendering
   - Check API integration
   - No console errors

**Acceptance Criteria:**
- ✅ All components render correctly
- ✅ Styling matches Phase 1 design
- ✅ API integration works
- ✅ No regression in functionality

---

### Story 2.5: API Integration & Data Flow

**Objectives:** Set up centralized API client and update data flow

**Tasks:**
1. **2.5.1:** Create `src/api/client.js` (25 min)
   - Axios or fetch-based client
   - Base URL from env or detect from window location
   - Error handling
   - Loading state management

2. **2.5.2:** Create API service functions (35 min)
   - `getProjects()`
   - `scanProjects()`
   - `getAgents(projectId)`
   - `getCommands(projectId)`
   - `getHooks(projectId)`
   - `getMCP(projectId)`
   - User-level variants

3. **2.5.3:** Update stores to use API client (30 min)
   - Replace direct fetch calls
   - Use API service functions
   - Handle loading/error states

4. **2.5.4:** Test API calls (20 min)
   - Verify all endpoints work
   - Check error handling
   - Validate data structure

**Acceptance Criteria:**
- ✅ All API calls use centralized client
- ✅ Error messages display properly
- ✅ Loading states work
- ✅ Data flows correctly to components

---

### Story 2.6: Styling & CSS Variables

**Objectives:** Ensure styles work with new structure and Vite bundling

**Tasks:**
1. **2.6.1:** Consolidate CSS variables (20 min)
   - File: `src/styles/variables.css`
   - Keep existing color/theme variables
   - Add new Vite-friendly structure

2. **2.6.2:** Create main stylesheet (20 min)
   - File: `src/styles/main.css`
   - Import variables.css
   - Global layout styles
   - Theme switching

3. **2.6.3:** Create component styles (30 min)
   - `scoped` styles in each .vue file
   - PrimeVue theme integration
   - Responsive design

4. **2.6.4:** Update PrimeVue setup (25 min)
   - Install PrimeVue components
   - Register globally in main.js
   - Import PrimeVue CSS

5. **2.6.5:** Test theming (15 min)
   - Dark/light mode toggle works
   - CSS variables apply correctly
   - No style conflicts

**Acceptance Criteria:**
- ✅ All existing styles work
- ✅ Dark/light mode toggle works
- ✅ No style conflicts with PrimeVue
- ✅ Responsive design maintained

---

### Story 2.7: Testing & Migration Validation

**Objectives:** Ensure migration is complete and all functionality works

**Tasks:**
1. **2.7.1:** Set up Vitest for unit tests (20 min)
   - Install `vitest`
   - Configure with Vue support
   - Test a single store

2. **2.7.2:** Migrate existing Playwright tests (60 min)
   - Update component selectors if needed
   - Test all dashboard functionality
   - Test project detail view
   - Test user view

3. **2.7.3:** Create new end-to-end tests (45 min)
   - Full user flow from dashboard to detail
   - Theme toggle
   - Search functionality
   - Navigation without page reloads

4. **2.7.4:** Performance testing (30 min)
   - Measure bundle size
   - Check load times
   - Compare with Phase 1 (should be similar or better)

5. **2.7.5:** Cross-browser testing (25 min)
   - Chrome
   - Firefox
   - Safari

6. **2.7.6:** Fix any issues (60 min buffer)
   - Debug failures
   - Optimize performance
   - Polish UX

**Acceptance Criteria:**
- ✅ All Playwright tests pass
- ✅ No console errors
- ✅ Cross-browser compatibility verified
- ✅ Performance acceptable (bundle < 500KB)

---

### Story 2.8: Documentation & Cleanup

**Objectives:** Update documentation and remove old files

**Tasks:**
1. **2.8.1:** Update CLAUDE.md (30 min)
   - Update tech stack section
   - Update project structure
   - Document Vite setup

2. **2.8.2:** Create migration guide (30 min)
   - For future developers
   - How to run dev server
   - How to build for production
   - Directory structure explanation

3. **2.8.3:** Update README.md (20 min)
   - Update installation instructions
   - Update running instructions
   - Add Vite build info

4. **2.8.4:** Remove old files (15 min)
   - Delete old `src/frontend/index.html`
   - Delete old `src/frontend/project-detail.html`
   - Delete old `src/frontend/user-view.html`
   - Keep `src/frontend/js/` and `src/frontend/css/` as reference

5. **2.8.5:** Update .gitignore (10 min)
   - Add Vite dist folder
   - Add node_modules
   - Standard Vue ignores

**Acceptance Criteria:**
- ✅ Documentation complete and accurate
- ✅ Old files removed or archived
- ✅ No broken links in docs

---

## 5. Implementation Plan

### Timeline
- **Total Estimated Time:** 10-12 hours across 8 stories
- **Parallel Work:** Stories 2.1-2.3 can overlap (Vite setup + state management)
- **Sequential Requirements:** 2.4 (components) depends on 2.1-2.3 complete

### Phase Gate Approach
Each story should have:
1. ✅ Implementation (tasks completed)
2. ✅ Manual testing (developer verifies locally)
3. ✅ Automated testing (Playwright/Vitest pass)
4. ✅ Code review (quality check)
5. ✅ One commit per story (after all tasks + tests pass)

### Branching Strategy
- Base branch: `phase-2` (for all Phase 2 work)
- Feature branches: `feature/vite-setup`, `feature/vue-router`, etc.
- Each story gets its own feature branch
- One PR per story
- All PRs merge to `phase-2`
- After Phase 2 complete, merge `phase-2` → `main` with fast-forward

---

## 6. Rollback Plan

If migration encounters critical issues:

1. Keep `src/frontend/` directory intact (archive)
2. If Vite setup fails, revert feature branch
3. Phase 1 continues working (on main)
4. Can restart migration from scratch if needed

---

## 7. Success Criteria

### Functionality (100% Match Phase 1)
- ✅ Dashboard displays all projects
- ✅ Project detail view shows all configs
- ✅ User/global config view works
- ✅ Search/filter functionality works
- ✅ Theme toggle works
- ✅ Sidebar shows full content
- ✅ Copy to clipboard works
- ✅ No page reloads during navigation

### Performance
- ✅ Bundle size < 500KB (gzipped)
- ✅ Initial load < 2 seconds
- ✅ Route transitions < 100ms
- ✅ No layout shift or jank

### Developer Experience
- ✅ `npm run dev` starts instantly
- ✅ HMR works (edit file, auto-reload in < 1 second)
- ✅ Vue DevTools integration works
- ✅ Clear error messages
- ✅ Easy component structure

### Code Quality
- ✅ All Playwright tests pass (100%)
- ✅ All Vitest tests pass (where applicable)
- ✅ No console errors or warnings
- ✅ Code review approved
- ✅ Accessible HTML/ARIA compliance

### Documentation
- ✅ CLAUDE.md updated
- ✅ Migration guide created
- ✅ README updated
- ✅ Component structure documented

---

## 8. Future Work (Post-Phase 2)

After migration complete:
- Phase 3: Subagent Edit Features (uses new SPA foundation)
- Phase 4: Command CRUD Operations
- Phase 5: Hooks Management
- Phase 6: MCP Server Management

---

## 9. Notes

### Why Vite?
- Lightning-fast dev server (instant startup, instant HMR)
- Optimized production builds
- Native ES modules
- Works seamlessly with Vue 3
- Better developer experience than webpack/bundler setups

### Why Pinia Over Vuex?
- Simpler syntax
- Better TypeScript support (optional)
- Faster to set up
- Recommended by Vue 3 docs
- Better composition API integration

### Backward Compatibility
- This is a **structural migration**, not a feature migration
- All Phase 1 functionality preserved identically
- No user-facing changes
- Only developer experience improves

---

## Appendix: File Reference

**Files to Create:**
- `vite.config.js`
- `index.html`
- `src/main.js`
- `src/App.vue`
- `src/router/index.js`
- `src/stores/theme.js`
- `src/stores/projects.js`
- `src/stores/notifications.js`
- `src/components/Dashboard.vue`
- `src/components/ProjectDetail.vue`
- `src/components/UserGlobal.vue`
- `src/components/cards/*.vue`
- `src/components/sidebars/*.vue`
- `src/components/common/*.vue`
- `src/api/client.js`
- `src/styles/main.css`
- `src/styles/variables.css`

**Files to Delete:**
- `src/frontend/index.html`
- `src/frontend/project-detail.html`
- `src/frontend/user-view.html`

**Files to Update:**
- `package.json` (add dev dependencies, update scripts)
- `CLAUDE.md` (update architecture section)
- `README.md` (update instructions)

---

**Document Status:** ✅ Ready for SWARM implementation
**Next Action:** Begin Phase 2 Story 2.1 (Vite Setup)
