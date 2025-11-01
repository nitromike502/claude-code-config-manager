# Documentation Index

**Purpose:** Central navigation guide for all Claude Code Manager documentation

**Quick Links:**
- [Project Overview](../README.md) - User-facing project README
- [Development Guide](../CLAUDE.md) - Main development documentation
- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute
- [Change Log](../CHANGELOG.md) - Version history

---

## Documentation by Category

### Requirements & Planning
Location: [`/docs/prd/`](prd/)
- [Phase 1 MVP](prd/PRD-Phase1-MVP.md) - Original MVP requirements (archived)
- [Phase 2 - Vite Migration](prd/PRD-Phase2-Vite-Migration.md) - Architecture modernization (complete)
- [Phase 2.1 - Component Refactoring](prd/PRD-Phase2-Extension-Component-Refactoring.md) - Code optimization (ready)
- [Phase 3 - Subagent CRUD](prd/PRD-Phase3-Subagents.md) - Future CRUD operations (planned)
- [Phase 4-6](prd/) - Additional planned phases

### API Documentation
- [API Reference](API.md) - Complete API endpoint documentation
- Backend routes, request/response formats, error handling

### Testing Documentation
Location: [`/docs/testing/`](testing/)
- [Testing Strategy](TESTING-STRATEGY.md) - Overall testing approach
- [Test Structure](testing/TESTING-STRUCTURE.md) - Test organization
- [Test File Index](testing/TEST-FILE-INDEX.md) - Complete test inventory
- [Visual Regression Guide](testing/VISUAL-REGRESSION-QUICK-START.md) - Visual testing
- [Test Reports](testing/test-reports/) - Historical test results

### UI/UX Design
Location: [`/docs/wireframes/`](wireframes/)
- [Color System Guide](wireframes/00-color-system-guide.md) - Theme colors
- [Dashboard View](wireframes/01-dashboard-view.md) - Main dashboard specs
- [Project Detail View](wireframes/02-project-detail-view.md) - Detail page specs
- [User/Global View](wireframes/03-user-global-view.md) - Global config specs
- Additional wireframes for components and interactions

### Development History
Location: [`/docs/sessions/`](sessions/)
- [Session Index](sessions/INDEX.md) - Complete development history
- [Workflow Analyses](sessions/workflow-analyses/) - Pattern analyses
- [Session Summaries](sessions/summaries/) - Individual reports

**Current Status:** Phase 2.3 Complete - Production ready for NPM publication

### Session History & Workflow Analyses
Location: [`/docs/sessions/`](sessions/)
- [Session Index](sessions/INDEX.md) - Complete session archive
- [Workflow Analyses](sessions/workflow-analyses/) - Development pattern analyses
- [Session Summaries](sessions/summaries/) - Individual session reports
- [Cleanup Session (Oct 26)](sessions/cleanup-2025-10-26/) - Production readiness review

### Features & Fixes
- [Sidebar Fix Documentation](features/sidebar-fix/) - Historical fix documentation

---

## Documentation by Role

### For New Contributors
1. Start: [README.md](../README.md) - Project overview
2. Read: [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
3. Setup: Follow installation steps in README
4. Review: [CLAUDE.md](../CLAUDE.md) - Development patterns

### For Developers
1. Architecture: [CLAUDE.md](../CLAUDE.md) - Tech stack, patterns, workflows
2. API: [API.md](API.md) - Backend endpoint reference
3. Testing: [TESTING-STRATEGY.md](TESTING-STRATEGY.md) - How to test
4. PRDs: [/docs/prd/](prd/) - Feature specifications

### For Project Managers
1. Current Phase: Phase 2.3 Complete - Production ready
2. Session History: [/docs/sessions/INDEX.md](sessions/INDEX.md) - Progress tracking
3. Test Reports: [/docs/testing/test-reports/](testing/test-reports/) - Quality metrics
4. Roadmap: [/docs/guides/ROADMAP.md](guides/ROADMAP.md) - Future phases

### For Designers
1. Wireframes: [/docs/wireframes/](wireframes/) - All UI specifications
2. Color System: [00-color-system-guide.md](wireframes/00-color-system-guide.md) - Theme colors
3. Components: [05-component-specifications.md](wireframes/05-component-specifications.md) - Component specs

### For QA/Testers
1. Test Structure: [testing/TESTING-STRUCTURE.md](testing/TESTING-STRUCTURE.md) - Test organization
2. Test Index: [testing/TEST-FILE-INDEX.md](testing/TEST-FILE-INDEX.md) - All available tests
3. Visual Testing: [testing/VISUAL-REGRESSION-QUICK-START.md](testing/VISUAL-REGRESSION-QUICK-START.md) - Visual regression
4. Test Reports: [testing/test-reports/](testing/test-reports/) - Historical results

---

## Quick Reference

### Current Status (Phase 2.3 Complete)
- **Test Coverage:** 879 tests (100% pass rate)
- **Backend Tests:** 276 Jest tests
- **Frontend Tests:** 603 Playwright tests
- **Current Branch:** phase-2.3
- **Status:** Production ready for NPM publication

### Project Health
- **Architecture:** ✅ Modern (Vite + Vue 3 + Vue Router + Pinia)
- **Documentation:** ✅ Complete (verified November 2025)
- **Test Suite:** ✅ Excellent (879 tests, 100% pass rate)
- **Production Ready:** ✅ Phase 2.3 complete, NPM publication ready

### Key Files
- `/home/claude/manager/CLAUDE.md` - Main development documentation
- `/home/claude/manager/README.md` - User-facing project README
- `/home/claude/manager/docs/prd/` - All requirements documents
- `/home/claude/manager/docs/sessions/INDEX.md` - Development history
- `/home/claude/manager/docs/guides/ROADMAP.md` - Future development plans

---

## Documentation Standards

### File Naming
- PRDs: `PRD-Phase#-Name.md`
- Tests: `##-test-name.spec.js` (numbered by category)
- Wireframes: `##-name.md` (numbered for order)
- Session summaries: `SESSION-SUMMARY-YYYYMMDD.md`

### Documentation Updates
- Always update date/timestamp when modifying
- Cross-reference related documents
- Keep phase terminology consistent ("Phase 2 - Vite Migration")
- Archive completed phase documentation

---

### Documentation Reviews
Location: [`/docs/reviews/`](reviews/)
- [Latest Review (Oct 29, 2025)](reviews/DOCUMENTATION-REVIEW-2025-10-29.md) - Post-CRITICAL-002 updates
- [Major Review (Oct 26, 2025)](reviews/DOCUMENTATION-REVIEW-2025-10-26.md) - Production readiness review
- [Review Archive](reviews/archive/) - Historical documentation reviews

---

**Last Updated:** 2025-10-31
**Total Documentation Files:** 260+
**Documentation Quality:** ✅ Verified and optimized (October 2025)
