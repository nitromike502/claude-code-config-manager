# Documentation Index

Quick reference guide to help you find the right documentation for your current task.

---

## Decision Tree

### Starting a New Session or Task?
1. **Choose your workflow:** `DEVELOPMENT-STRATEGIES.md`
2. **Execute SWARM workflow:** `SWARM-WORKFLOW.md`

### Implementing Feature That Already Exists for Another Entity?
1. **Feature parity guide:** `FEATURE-PARITY-IMPLEMENTATION-GUIDE.md`
2. **Phase 0 comparative analysis:** `SWARM-WORKFLOW.md` (Phase 0)
3. **Pre-coding outline:** `IMPLEMENTATION-OUTLINE-GUIDE.md`

### Working from Official Specification?
1. **Spec implementation pattern:** `SPEC-IMPLEMENTATION-GUIDE.md`
2. **Include in SWARM Phase 1 task specs**
3. **Reference in implementation:** Document spec URL and version

### Running Tests?
1. **Test execution workflow:** `TESTING-GUIDE.md`
2. **Parallel execution patterns:** WSL2-optimized settings in guide
3. **Quality gate:** Automated checks before commit

### Git Operations?
1. **Branch workflow:** `GIT-WORKFLOW.md`
2. **Commit format:** Same guide (conventional commits)
3. **PR creation:** Same guide (feature branch workflow)

### Reviewing Code?
1. **Review checklist:** `CODE-REVIEW-BEST-PRACTICES.md`
2. **UX consistency:** Same guide, critical for feature parity work
3. **Response templates:** Same guide

### Planning Parallel Work?
1. **Safety criteria:** `PARALLEL-EXECUTION-GUIDE.md`
2. **When to parallelize:** Decision matrix in guide
3. **Performance gains:** Real-world metrics included

### Code Quality Questions?
1. **Coding standards:** `CODING-STANDARDS.md`
2. **Test data conventions:** Same guide
3. **Documentation placement:** Same guide

### Setting Up Project?
1. **First-time setup:** `SETUP-GUIDE.md`
2. **Server restart protocol:** Same guide
3. **Troubleshooting:** Same guide

### Planning Future Features?
1. **Feature roadmap:** `ROADMAP.md`
2. **Phase planning:** Same guide
3. **Dependencies:** Same guide

### Understanding Ticket System?
1. **Ticket integration:** `TICKET-MANAGER-INTEGRATION.md`
2. **Ticket hierarchy:** Same guide (Epic → Story → Task)
3. **Status workflow:** Same guide

---

## Guide Quick Reference

| Guide | Size | Use When | Key Sections |
|-------|------|----------|--------------|
| **SWARM-WORKFLOW.md** | 33 KB | Executing any ticket | 7-phase workflow, parallelization |
| **IMPLEMENTATION-OUTLINE-GUIDE.md** | 31 KB | Before coding (complex features) | Outline template, comparative analysis |
| **FEATURE-PARITY-IMPLEMENTATION-GUIDE.md** | 25 KB | Similar feature for new entity | Checklist, 16:1 ROI workflow |
| **PARALLEL-EXECUTION-GUIDE.md** | 20 KB | Planning parallel tasks | Safety checklist, decision criteria, metrics |
| **TICKET-MANAGER-INTEGRATION.md** | 20 KB | Understanding ticket system | Hierarchy, roles, workflow |
| **TAILWIND-INTEGRATION.md** | 20 KB | Tailwind CSS usage | v4 setup, PrimeUI plugin |
| **CODE-REVIEW-BEST-PRACTICES.md** | 19 KB | Reviewing PRs | UX consistency, review checklists |
| **ROADMAP.md** | 14 KB | Planning future work | Phase 2.1-7+ timelines |
| **TESTING-GUIDE.md** | 13 KB | Running or creating tests | Test types, naming conventions, parallel execution |
| **CODING-STANDARDS.md** | 13 KB | Code quality, conventions | Test data, import paths, CHANGELOG policy |
| **CSS-VARIABLES.md** | 13 KB | Styling questions | CSS custom properties, theming |
| **GIT-WORKFLOW.md** | 12 KB | Git operations | Branch naming, commit format, PR workflow |
| **SPEC-IMPLEMENTATION-GUIDE.md** | 7 KB | Implementing from official docs | 5-step pattern, common pitfalls |
| **DEVELOPMENT-STRATEGIES.md** | 7 KB | Choosing development approach | Strategy selection, decision criteria |
| **SETUP-GUIDE.md** | 5 KB | Installing or troubleshooting | Prerequisites, server restart |

---

## Common Scenarios

### "I'm implementing a feature that exists for Agents, but for Commands/Skills"
1. Read `FEATURE-PARITY-IMPLEMENTATION-GUIDE.md`
2. Complete Phase 0 comparative analysis from `SWARM-WORKFLOW.md`
3. Create implementation outline per `IMPLEMENTATION-OUTLINE-GUIDE.md`
4. Follow `SWARM-WORKFLOW.md` Phases 1-7
5. Have PR reviewed with UX consistency checklist from `CODE-REVIEW-BEST-PRACTICES.md`

### "I'm starting work on a ticket"
1. Read `SWARM-WORKFLOW.md` for 7-phase process
2. Phase 0: Understand requirements
3. Phase 1: Gather context and create task specs
4. Phase 2-7: Implementation through merge

### "I'm implementing from an official spec"
1. Use `SPEC-IMPLEMENTATION-GUIDE.md` 5-step pattern
2. Document spec URL and version in code
3. Include spec validation in Phase 1 task specs
4. Reference in test cases

### "I'm working on a complex feature"
1. Follow `SWARM-WORKFLOW.md` through Phase 1
2. Create implementation outline: `IMPLEMENTATION-OUTLINE-GUIDE.md`
3. Review outline before coding (15 min saves 2+ hours)
4. Continue with Phase 2-7

### "I'm fixing a bug"
1. If simple: Fix immediately, follow `CODING-STANDARDS.md`
2. If complex: Create outline per `IMPLEMENTATION-OUTLINE-GUIDE.md`
3. Follow `SWARM-WORKFLOW.md`
4. Commit per `GIT-WORKFLOW.md` (one commit per task)

### "I'm reviewing a PR"
1. Use `CODE-REVIEW-BEST-PRACTICES.md`
2. If feature parity work: Use UX Consistency section
3. Check against `CODING-STANDARDS.md`
4. Verify tests per `TESTING-GUIDE.md`

### "I need to run tests"
1. See `TESTING-GUIDE.md` for commands
2. Backend: `npm run test:backend:parallel`
3. Frontend: `npm run test:frontend:parallel`
4. Use parallel execution for speed

### "I'm creating a PR"
1. Follow `GIT-WORKFLOW.md` for branch naming
2. Use conventional commit format
3. One commit per task (squash if needed)
4. Include ticket number in branch name

### "I'm adding a new feature"
1. Choose strategy: `DEVELOPMENT-STRATEGIES.md`
2. Execute workflow: `SWARM-WORKFLOW.md`
3. Test immediately: `TESTING-GUIDE.md`
4. Follow standards: `CODING-STANDARDS.md`

### "Can I work on multiple tasks in parallel?"
1. Check safety criteria: `PARALLEL-EXECUTION-GUIDE.md`
2. No shared dependencies? Safe to parallelize
3. Document parallelization in session tracking
4. 40-62% time reduction demonstrated

---

## Configuration Schemas

For configuration file structures and frontmatter specifications:

**Location:** `/home/meckert/personal/schemas/frontmatter-schema.md`

**Contents:**
- Subagent frontmatter schema (name, description, priority, etc.)
- Slash command frontmatter schema
- Hooks JSON structure (lifecycle hooks)
- MCP Servers JSON structure
- Skills SKILL.md structure

---

## Context Efficiency Strategy

Load documentation strategically to minimize context window usage:

### Tier 1 - Always Load First
- `DOCUMENTATION-INDEX.md` (this file - quick reference)
- `DEVELOPMENT-STRATEGIES.md` (choose your approach)

### Tier 2 - Load Based on Task Type
- **Ticket work:** `SWARM-WORKFLOW.md`
- **Feature parity:** `FEATURE-PARITY-IMPLEMENTATION-GUIDE.md`
- **Complex features:** `IMPLEMENTATION-OUTLINE-GUIDE.md`
- **Code review:** `CODE-REVIEW-BEST-PRACTICES.md`
- **Spec implementation:** `SPEC-IMPLEMENTATION-GUIDE.md`
- **Testing:** `TESTING-GUIDE.md`
- **Git operations:** `GIT-WORKFLOW.md`

### Tier 3 - Reference as Needed
- **Code quality:** `CODING-STANDARDS.md`
- **Parallelization:** `PARALLEL-EXECUTION-GUIDE.md`
- **Setup:** `SETUP-GUIDE.md`
- **Planning:** `ROADMAP.md`
- **Tickets:** `TICKET-MANAGER-INTEGRATION.md`
- **Styling:** `CSS-VARIABLES.md`, `TAILWIND-INTEGRATION.md`

### Tier 4 - Historical Reference
- **Phase 1:** `docs/guides/archives/PHASE1-SUCCESS-CRITERIA.md`
- **Phase 2:** `docs/guides/archives/PHASE2-COMPLETION-SUMMARY.md`
- **Sessions:** `docs/sessions/INDEX.md`

---

## Related Documentation Locations

### Templates
- **Location:** `/home/claude/manager/.claude/templates/`
- **Contents:**
  - `session-tracking-template.md` - SWARM workflow tracking
  - `test-template.md` - Test file creation
  - `test-creation-checklist.md` - Comprehensive test checklist
  - `spec-review-checklist.md` - Specification review
  - `development-strategies.md` - Strategy selection

### Phase Requirements
- **Location:** `/home/claude/manager/docs/prd/`
- **Contents:** Historical PRDs from completed phases
- **Use:** Reference past requirements and decisions

### Session History
- **Location:** `/home/claude/manager/docs/sessions/`
- **Contents:**
  - `INDEX.md` - Complete session catalog
  - `summaries/` - Session summaries
  - `workflow-analyses/` - Workflow best practices
  - `tracking/` - Current session tracking documents

### Technical Specifications
- **Location:** `/home/claude/manager/docs/technical/`
- **Contents:**
  - `README.md` - Technical documentation index
  - Hook structures, merge algorithms, edge cases

---

## Guide Update History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-07 | 1.0.0 | Initial creation - comprehensive documentation index |

---

## Quick Tips

1. **Start with this index** - Don't load all guides at once
2. **Load guides on-demand** - Only read what you need for current task
3. **Use decision tree** - Follow the "Starting..." questions above
4. **Check schemas** - Configuration frontmatter specs are external
5. **Reference history** - Session analyses contain proven best practices
6. **Follow SWARM** - All ticket work uses 7-phase workflow
7. **Test immediately** - Testing is part of development, not separate phase
8. **One commit per task** - Follow GIT-WORKFLOW.md religiously

---

## Need Help?

**Can't find what you need?**
1. Check `docs/guides/` directory for all guides
2. Review `CLAUDE.md` for project overview
3. Check `docs/sessions/INDEX.md` for historical context
4. See `docs/technical/README.md` for technical specs
5. See `docs/DOCUMENTATION-INDEX.md` for comprehensive project-wide documentation index

**Guide seems outdated?**
- Documentation updates happen in Phase 5 of SWARM workflow
- Check git history for latest changes: `git log -- docs/guides/`
