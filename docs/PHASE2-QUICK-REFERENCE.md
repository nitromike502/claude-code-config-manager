# Phase 2 - Vite Migration Quick Reference Guide

**For:** Developers implementing Vite+Vue3 SPA Migration
**Duration:** 8 stories, ~12 hours total
**Goal:** Transform from CDN Vue to modern build-optimized SPA (zero feature changes)

---

## Why Phase 2 - Vite Migration Matters

### Problems We're Solving
```
❌ BEFORE (Phase 1):           ✅ AFTER (Phase 2 - Vite Migration):
- Full page reloads             - Smooth SPA transitions
- Multiple HTML files           - Single entry point
- Manual event routing          - Vue Router v4
- No state management           - Pinia stores
- CDN Vue + loose scripts       - Vite build system
- No HMR                        - Instant HMR feedback
- No Vue DevTools               - Full Vue DevTools support
```

---

## Story Breakdown

### Story 2.1: Vite Setup (2 hours)
**What:** Create Vite build system and project structure
**Tasks:** 6 tasks (30-30-45-30-15-15 min)
**Deliverable:** Working `npm run dev` server on http://localhost:5173

**Key Files to Create:**
- `vite.config.js` - Vite configuration
- `index.html` - Single entry point
- `src/main.js` - App initialization
- `package.json` - Updated scripts

**Acceptance Criteria:**
- ✅ `npm run dev` starts without errors
- ✅ Backend proxy works (`/api/*` requests reach backend)
- ✅ HMR functional (edit file → auto-reload in < 1 sec)

---

### Story 2.2: Vue Router (1.5 hours)
**What:** Implement client-side routing (no page reloads)
**Tasks:** 5 tasks (10-35-30-20-15 min)
**Deliverable:** Routes work without full page reloads

**Routes to Create:**
- `/` → Dashboard
- `/project/:id` → ProjectDetail
- `/user` → UserGlobal

**Acceptance Criteria:**
- ✅ Navigate between routes without page reload
- ✅ URL updates correctly
- ✅ Browser back button works
- ✅ Route params available in components

---

### Story 2.3: Pinia State (1.5 hours)
**What:** Set up global state management
**Tasks:** 5 tasks (10-25-35-20-15 min)
**Deliverable:** Global state accessible from all components

**Stores to Create:**
- `theme.js` - Theme switching, localStorage persistence
- `projects.js` - Projects list, filtering, selection
- `notifications.js` - Toast messages, auto-dismiss

**Acceptance Criteria:**
- ✅ Theme toggle persists to localStorage
- ✅ Projects load on app mount
- ✅ State persists across route changes
- ✅ Notifications display and auto-dismiss

---

### Story 2.4: Component Conversion (3.5 hours)
**What:** Convert .js components to .vue Single File Components
**Tasks:** 7 tasks (45-45-30-60-45-30-30 min)
**Deliverable:** All UI components as proper Vue components

**Components to Create:**
- `Dashboard.vue` - Project list
- `ProjectDetail.vue` - Project config view
- `UserGlobal.vue` - User config view
- `cards/AgentCard.vue`, `CommandCard.vue`, etc. - Config cards
- `sidebars/DetailSidebar.vue` - Full content viewer
- `common/Header.vue` - App header

**Acceptance Criteria:**
- ✅ All components render correctly
- ✅ Styling matches Phase 1 design
- ✅ API integration works
- ✅ No console errors

---

### Story 2.5: API Integration (1.5 hours)
**What:** Centralize API calls and integrate with stores
**Tasks:** 4 tasks (25-35-30-20 min)
**Deliverable:** Clean, centralized API client

**Files to Create:**
- `src/api/client.js` - Axios or fetch-based client
- API service functions for all endpoints

**Acceptance Criteria:**
- ✅ All API calls use centralized client
- ✅ Error handling works
- ✅ Loading states managed by stores
- ✅ Data flows correctly to components

---

### Story 2.6: Styling & CSS (1.5 hours)
**What:** Ensure styles work with Vite and organize for maintainability
**Tasks:** 5 tasks (20-20-30-25-15 min)
**Deliverable:** Fully styled SPA with dark/light mode

**Files to Update:**
- `src/styles/main.css` - Global styles
- `src/styles/variables.css` - CSS variables
- Add scoped styles to .vue components

**Acceptance Criteria:**
- ✅ All Phase 1 styles apply correctly
- ✅ Dark/light mode toggle works
- ✅ No style conflicts
- ✅ Responsive design maintained

---

### Story 2.7: Testing & Validation (2 hours)
**What:** Verify migration is complete and all tests pass
**Tasks:** 6 tasks (20-60-45-30-25-60 min)
**Deliverable:** 100% test pass rate, verified cross-browser

**Testing Checklist:**
- ✅ All Playwright tests pass
- ✅ No console errors or warnings
- ✅ Cross-browser (Chrome, Firefox, Safari)
- ✅ Performance acceptable (bundle < 500KB)

---

### Story 2.8: Documentation & Cleanup (1 hour)
**What:** Update docs and remove old files
**Tasks:** 5 tasks (30-30-20-15-10 min)
**Deliverable:** Complete documentation, clean codebase

**Documentation Updates:**
- CLAUDE.md - Tech stack section
- README.md - Installation/running instructions
- Migration guide for future developers

**Files to Remove:**
- Old HTML files (`index.html`, `project-detail.html`, `user-view.html`)
- Archive old `src/frontend/` directory

---

## Development Workflow

### For Each Story

```
1. Read the story in PRD-Phase2-Vite-Migration.md
2. Create feature branch from phase-2: feature/story-name
3. Work through tasks sequentially:
   - Implement
   - Test manually
   - Commit after each task (6 commits per story)
4. Push all commits to remote
5. Run automated tests (Playwright + Jest)
   - If fail: Fix and re-run (loop until pass)
   - If pass: Proceed to PR
6. Create PR targeting phase-2 branch
7. Wait for code review + approval
8. Merge to phase-2
```

### Branching Example

```bash
# Before starting Story 2.1
git checkout phase-2
git pull
git checkout -b feature/vite-setup

# Work on task 2.1.1
# Commit after testing
git add .
git commit -m "feat: create vite configuration (Task 2.1.1)"
git push -u origin feature/vite-setup

# Work on task 2.1.2
# Commit after testing
git add .
git commit -m "feat: create SPA entry point index.html (Task 2.1.2)"
git push

# ... continue for tasks 2.1.3-2.1.6 ...

# After all tasks complete and tests pass
gh pr create --title "Story 2.1: Vite Setup" --body "..." --base phase-2
```

---

## Key Dependencies

### Story Dependencies
```
2.1 (Vite Setup)
  ↓
  ├─→ 2.2 (Vue Router)
  ├─→ 2.3 (Pinia)
  └─→ 2.4 (Components) [depends on 2.2 + 2.3]
        ↓
        → 2.5 (API Integration)
           ↓
           → 2.6 (Styling)
              ↓
              → 2.7 (Testing)
                 ↓
                 → 2.8 (Documentation)
```

**Parallel Opportunities:**
- Stories 2.2, 2.3 can start after 2.1 complete (independent)
- Story 2.6 can start after 2.5 complete (independent)

---

## Time Estimates

| Story | Duration | Best For |
|-------|----------|----------|
| 2.1 | 2 hours | Foundation |
| 2.2 | 1.5 hours | Routing foundation |
| 2.3 | 1.5 hours | State management |
| 2.4 | 3.5 hours | Component conversion (longest) |
| 2.5 | 1.5 hours | API glue |
| 2.6 | 1.5 hours | Polish |
| 2.7 | 2 hours | Validation |
| 2.8 | 1 hour | Cleanup |
| **Total** | **~12 hours** | Flexible scheduling |

**Recommended Schedule:**
- Day 1: Stories 2.1-2.2 (3.5 hours)
- Day 2: Stories 2.3-2.5 (4.5 hours)
- Day 3: Stories 2.6-2.8 (4.5 hours)

Or: Spread across multiple sessions (flexible)

---

## Success Checklist (Phase 2 Complete)

### Functionality
- [ ] Dashboard displays all projects (100% Phase 1 parity)
- [ ] Project detail view shows all config cards
- [ ] User/global config view works
- [ ] Search/filter functionality works
- [ ] Theme toggle works and persists
- [ ] Sidebar shows full content
- [ ] Copy to clipboard works
- [ ] **NO page reloads** on navigation

### Technical
- [ ] `npm run dev` starts instantly
- [ ] HMR works (edit file → reload < 1 sec)
- [ ] `npm run build` produces optimized bundle
- [ ] Bundle size < 500KB (gzipped)
- [ ] Vue DevTools shows component tree
- [ ] No console errors or warnings

### Quality
- [ ] All Playwright tests pass (100%)
- [ ] Cross-browser compatible
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Old files removed/archived

### Post-Phase 2
- [ ] Phase 3 (Subagent Edit) ready to start
- [ ] Team familiar with new structure
- [ ] Development faster (HMR + DevTools)

---

## Common Issues & Solutions

### Issue: HMR Not Working
**Solution:** Check `vite.config.js` has HMR configured for your environment
```js
server: {
  middlewareMode: false,
  hmr: {
    host: 'localhost',
    port: 5173,
    protocol: 'ws'
  }
}
```

### Issue: API Requests Timeout
**Solution:** Verify backend proxy in `vite.config.js`
```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8420',
      changeOrigin: true
    }
  }
}
```

### Issue: Styles Not Loading
**Solution:** Ensure `src/main.js` imports `src/styles/main.css`
```js
import './styles/main.css'
```

### Issue: Component Not Rendering
**Solution:** Check component is registered in `main.js`
```js
app.component('my-component', MyComponent)
// OR use in .vue template
import MyComponent from './components/MyComponent.vue'
```

---

## Resources

- **Main PRD:** `docs/PRD-Phase2-Vite-Migration.md` (comprehensive reference)
- **Rationale:** `docs/PHASE-REORGANIZATION-SUMMARY.md` (why Phase 2?)
- **Architecture:** `CLAUDE.md` (overall project structure)
- **Vite Docs:** https://vitejs.dev/guide/
- **Vue 3 Docs:** https://vuejs.org/guide/introduction.html
- **Vue Router:** https://router.vuejs.org/
- **Pinia:** https://pinia.vuejs.org/

---

## Contact & Questions

If you get stuck:
1. Check the issue in "Common Issues & Solutions" above
2. Review the relevant story section in `PRD-Phase2-Vite-Migration.md`
3. Check console errors (Vite errors are usually descriptive)
4. Review the full CLAUDE.md for architecture context

---

**Status:** Phase 2 Ready for Implementation
**Next Action:** Run `/swarm` to begin development
