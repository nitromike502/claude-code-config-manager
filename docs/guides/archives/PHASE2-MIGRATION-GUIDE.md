# Phase 2 - Vite Migration Guide: CDN Vue → Vite SPA

## Overview

Phase 2 - Vite Migration migrated Claude Code Manager from a hybrid HTML+Vue CDN architecture to a modern Vite+Vue3 Single Page Application (SPA).

**Migration Duration:** ~12 hours of development across 8 stories
**Test Coverage:** 356 tests (100% pass rate)
**Feature Parity:** 100% of Phase 1 features maintained

## What Changed

### Build System
- **Before:** No build process, scripts loaded via CDN script tags
- **After:** Vite build system with Hot Module Replacement (HMR), code splitting, and optimization

### Routing
- **Before:** Manual event-driven routing with page reloads between views
- **After:** Vue Router v4 with client-side routing and SPA navigation (no page reloads)

### State Management
- **Before:** Component-local state with no global state management
- **After:** Pinia stores for global state (theme, projects, notifications)

### Components
- **Before:** JavaScript files with Vue.extend() and manual DOM mounting
- **After:** Single File Components (.vue) with `<template>`, `<script>`, `<style>` sections

### Styling
- **Before:** Hardcoded colors, inline styles, no theming system
- **After:** CSS variables for dark/light theme, responsive design, organized stylesheets

### API Integration
- **Before:** Direct fetch() calls scattered throughout components
- **After:** Centralized API client with timeout handling and error management

### Development Experience
- **Before:** Manual page refresh, no hot reload, slow feedback loop
- **After:** HMR with < 1s reload, instant feedback, modern dev tools

## Key Files Created

### Build Configuration
- `index.html` - SPA entry point (loads main.js)
- `vite.config.js` - Vite build configuration with Vue plugin and API proxy

### Application Bootstrap
- `src/main.js` - App initialization, router setup, Pinia integration
- `src/App.vue` - Root component with router-view

### Routing
- `src/router/index.js` - Vue Router setup with 3 routes (Dashboard, ProjectDetail, UserGlobal)

### State Management (Pinia Stores)
- `src/stores/theme.js` - Dark/light theme with localStorage persistence
- `src/stores/projects.js` - Project list management and API integration
- `src/stores/notifications.js` - Toast notifications with auto-dismiss

### Components (Single File Components)
- `src/components/Dashboard.vue` - Project list view with search
- `src/components/ProjectDetail.vue` - Project configuration cards and sidebar
- `src/components/UserGlobal.vue` - User-level configuration view
- `src/components/cards/*.vue` - Configuration card components (agents, commands, hooks, MCP)

### API Layer
- `src/api/client.js` - Centralized API client with 11 endpoint functions

### Styling
- `src/styles/variables.css` - 80+ CSS variables for theming
- `src/styles/global.css` - Global styles and resets
- `src/styles/components.css` - Component-specific styles

## Migration Checklist

- [x] Vite setup and project structure created
- [x] Vue Router configured for SPA navigation
- [x] Pinia stores created for state management
- [x] Components converted to .vue Single File Components
- [x] API client centralized with timeout handling
- [x] Styling organized with CSS variables for theming
- [x] Tests updated for Vite architecture
- [x] 100% Phase 1 feature parity achieved
- [x] Performance metrics validated (< 1s HMR, < 2s initial load)
- [x] Cross-browser compatibility verified (Chrome, Firefox, Safari)
- [x] Production build tested and optimized

## Development Workflow

### Starting Development

**Terminal 1 - Frontend (Vite dev server):**
```bash
npm run dev
```
- Starts Vite dev server at http://localhost:5173
- HMR enabled (< 1s reload on file changes)
- Source maps for debugging
- Vue DevTools support

**Terminal 2 - Backend (Express server):**
```bash
npm run dev:backend
```
- Starts Express API server at http://localhost:8420
- Auto-restart on file changes (--watch flag)
- API endpoints accessible from frontend via proxy

### Building for Production

```bash
npm run build        # Create production bundle in dist/
npm run preview      # Preview production build locally
npm start            # Start backend server (serves frontend from dist/)
```

### Testing

```bash
# Backend tests (Jest)
npm test                          # Run all backend tests
npm run test:backend              # Run backend tests only
npm run test:watch                # Run tests in watch mode
npm run test:coverage             # Generate coverage report

# Frontend tests (Playwright)
npx playwright test               # Run all frontend tests
npx playwright test tests/frontend/  # Run component tests only
npx playwright test --debug       # Run tests with debugger
npx playwright test --ui          # Run tests in UI mode
```

## Performance Improvements

### Development Speed
- **Dev server startup:** 354-380ms (< 1 second)
- **HMR (file changes):** < 1 second reload
- **Build time:** ~3-5 seconds for full production build
- **Test execution:** 356 tests complete in ~15 seconds

### Runtime Performance
- **Initial page load:** < 2 seconds
- **Bundle size:** < 500KB (gzipped)
- **Route transitions:** Instant (client-side, no network)
- **API response caching:** Optimized with Pinia stores

### Developer Experience
- **Instant feedback:** See changes in < 1 second
- **Hot Module Replacement:** Preserves component state during reload
- **Source maps:** Debug original source code, not transpiled
- **Vue DevTools:** Full integration with Vue 3 DevTools

## Architecture Diagram

```
User Browser (http://localhost:5173 in dev)
     │
     ├─→ Frontend SPA (Vite dev server)
     │     ├─ Vite (build system)
     │     ├─ Vue 3 (reactive UI framework)
     │     ├─ Vue Router (client-side routing)
     │     ├─ Pinia (global state management)
     │     └─ .vue components (Dashboard, ProjectDetail, UserGlobal)
     │
     └─→ Backend API (http://localhost:8420)
           ├─ Express server
           ├─ Project discovery (reads ~/.claude.json)
           ├─ Configuration parsing (agents, commands, hooks, MCP)
           └─ File system access
```

**Communication Flow:**
1. Browser loads SPA from Vite dev server (port 5173)
2. Vue Router handles navigation (no page reloads)
3. Components fetch data via `src/api/client.js`
4. API client proxies requests to Express backend (port 8420)
5. Backend reads file system and returns JSON
6. Pinia stores cache data and manage state
7. Components reactively update UI

## Common Development Tasks

### Add a New Page

1. **Create component:** `src/components/PageName.vue`
   ```vue
   <template>
     <div class="page-container">
       <h1>{{ title }}</h1>
       <!-- Page content -->
     </div>
   </template>

   <script>
   export default {
     name: 'PageName',
     data() {
       return {
         title: 'My New Page'
       }
     }
   }
   </script>

   <style scoped>
   .page-container {
     padding: var(--spacing-lg);
   }
   </style>
   ```

2. **Add route:** `src/router/index.js`
   ```javascript
   {
     path: '/page-name',
     name: 'PageName',
     component: () => import('../components/PageName.vue')
   }
   ```

3. **Add navigation link:** In Dashboard.vue or App.vue
   ```vue
   <router-link to="/page-name">Go to Page</router-link>
   ```

4. **Test with Playwright:** `tests/frontend/XX-page-name.spec.js`

### Add New Global State (Pinia Store)

1. **Create store:** `src/stores/storeName.js`
   ```javascript
   import { defineStore } from 'pinia';

   export const useStoreNameStore = defineStore('storeName', {
     state: () => ({
       data: null,
       loading: false,
       error: null
     }),

     actions: {
       async fetchData() {
         this.loading = true;
         this.error = null;
         try {
           const response = await fetch('/api/endpoint');
           this.data = await response.json();
         } catch (err) {
           this.error = err.message;
         } finally {
           this.loading = false;
         }
       }
     }
   });
   ```

2. **Use in component:**
   ```vue
   <script>
   import { useStoreNameStore } from '../stores/storeName';

   export default {
     setup() {
       const store = useStoreNameStore();
       store.fetchData();
       return { store };
     }
   }
   </script>

   <template>
     <div v-if="store.loading">Loading...</div>
     <div v-else-if="store.error">Error: {{ store.error }}</div>
     <div v-else>{{ store.data }}</div>
   </template>
   ```

3. **Data persists across navigation** - No need to refetch

### Add API Endpoint Integration

1. **Add function to API client:** `src/api/client.js`
   ```javascript
   export async function getNewData() {
     const response = await fetchWithTimeout('/api/new-endpoint');
     if (!response.ok) {
       throw new Error(`Failed to fetch data: ${response.statusText}`);
     }
     return response.json();
   }
   ```

2. **Use in store action or component:**
   ```javascript
   import { getNewData } from '../api/client';

   async loadData() {
     this.data = await getNewData();
   }
   ```

3. **Test endpoint works:**
   - Backend test: `tests/backend/api/new-endpoint.test.js`
   - Frontend test: `tests/frontend/XX-new-feature.spec.js`

### Update Styling/Theme

1. **Add CSS variable:** `src/styles/variables.css`
   ```css
   :root {
     --new-color: #ff5733;
   }

   :root.dark-theme {
     --new-color: #ff8866;
   }
   ```

2. **Use in component:**
   ```vue
   <style scoped>
   .my-element {
     color: var(--new-color);
   }
   </style>
   ```

3. **Theme automatically switches** based on theme store

## File Structure Comparison

### Phase 1 (Old)
```
src/frontend/
├── index.html
├── project-detail.html
├── user-view.html
├── js/
│   ├── app.js
│   ├── project-detail.js
│   ├── user-view.js
│   └── components/
│       ├── agent-card.js
│       ├── command-card.js
│       ├── hook-card.js
│       └── mcp-card.js
└── css/
    ├── global.css
    └── components.css
```

### Phase 2 (New)
```
src/
├── main.js                    # App entry point
├── App.vue                    # Root component
├── router/
│   └── index.js              # Vue Router setup
├── stores/
│   ├── theme.js              # Theme state
│   ├── projects.js           # Projects state
│   └── notifications.js      # Notifications state
├── components/
│   ├── Dashboard.vue         # Page: Project list
│   ├── ProjectDetail.vue     # Page: Project configs
│   ├── UserGlobal.vue        # Page: User configs
│   └── cards/
│       ├── AgentCard.vue
│       ├── CommandCard.vue
│       ├── HookCard.vue
│       └── MCPCard.vue
├── api/
│   └── client.js             # API functions
├── styles/
│   ├── variables.css         # CSS variables
│   ├── global.css
│   └── components.css
└── utils/                     # Helper functions
```

## Breaking Changes

### None for End Users
Phase 2 maintains 100% feature parity with Phase 1. All functionality works identically from the user's perspective.

### For Developers
- **Old HTML files removed:** `index.html`, `project-detail.html`, `user-view.html` from `src/frontend/`
- **Old JS components removed:** `src/frontend/js/` directory archived
- **CDN dependencies removed:** PrimeVue, Vue, and other CDN scripts no longer used
- **Manual routing removed:** Event-driven navigation replaced with Vue Router
- **Build step required:** Must run `npm run build` before production deployment

## Rollback Plan

If Phase 2 needs to be reverted:

1. **Checkout Phase 1 branch:**
   ```bash
   git checkout main  # or phase-1 tag
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start server:**
   ```bash
   npm start
   ```

4. **Access old UI:**
   ```
   http://localhost:8420
   ```

**Note:** All Phase 1 code is preserved in git history and can be restored at any time.

## Testing Strategy

### Backend Tests (Jest)
- **270 tests** covering all API endpoints, parsers, and edge cases
- **100% pass rate** - no regressions from Phase 1
- **Test files:** `tests/backend/**/*.test.js`

### Frontend Tests (Playwright)
- **86 tests** covering component rendering, user interactions, and API integration
- **100% pass rate** - all Phase 1 functionality verified in Phase 2
- **Test files:** `tests/frontend/*.spec.js`

### Cross-Browser Testing
- **Chrome:** ✅ All tests passing
- **Firefox:** ✅ All tests passing
- **Safari:** ✅ All tests passing
- **Edge:** ✅ Compatible (Chromium-based)

### Performance Testing
- **Dev server startup:** < 1 second ✅
- **HMR reload:** < 1 second ✅
- **Initial page load:** < 2 seconds ✅
- **Bundle size:** < 500KB gzipped ✅

## Lessons Learned

### What Went Well
- ✅ **Incremental migration:** Breaking work into 8 stories made progress manageable
- ✅ **Test-first approach:** 100% test pass rate prevented regressions
- ✅ **Feature parity focus:** Maintaining all Phase 1 features ensured no user disruption
- ✅ **Documentation:** Migration guide and test reports provided clear progress tracking

### Challenges Overcome
- **State management complexity:** Solved with Pinia stores for global state
- **Routing transitions:** Vue Router provided seamless SPA navigation
- **Test updates:** All Playwright tests adapted to SPA architecture
- **CSS organization:** CSS variables enabled consistent theming

### Best Practices
- **One story at a time:** Sequential execution prevented conflicts
- **Immediate testing:** Tests run after each story completion
- **Small commits:** One commit per task for clear history
- **Documentation as you go:** Migration notes captured in real-time

## Future Phases

Phase 2 provides a solid foundation for future enhancements:

### Phase 3 - Subagent CRUD
- Create, edit, delete subagent definitions
- YAML frontmatter validation
- Built on Vite SPA architecture

### Phase 4 - Command Management
- CRUD operations for slash commands
- Live command testing
- Leverages Vue Router and Pinia

### Phase 5 - Hooks Configuration
- Visual hook editor
- Hook validation and testing
- Uses centralized API client

### Phase 6 - MCP Server Management
- Add/edit/remove MCP servers
- Server connection testing
- Seamless SPA integration

All future phases will benefit from:
- ✅ Fast HMR for rapid development
- ✅ Pinia stores for state management
- ✅ Vue Router for new pages
- ✅ CSS variables for consistent styling
- ✅ Centralized API client for endpoints

## Conclusion

Phase 2 successfully modernized the Claude Code Manager architecture while maintaining 100% feature parity. The new Vite+Vue3 SPA provides:

- **Better developer experience** (< 1s HMR, instant feedback)
- **Better user experience** (SPA navigation, < 2s load times)
- **Better maintainability** (SFC components, Pinia stores, organized code)
- **Better testability** (356 tests, 100% pass rate)
- **Better scalability** (foundation for CRUD operations in Phase 3+)

The migration was completed in ~12 hours across 8 stories with zero regressions and is ready for production deployment.

---

**Migration Date:** October 2025
**Developer Team:** Phase 2 SWARM (Stories 2.1-2.8)
**Status:** ✅ COMPLETE - READY FOR PRODUCTION
