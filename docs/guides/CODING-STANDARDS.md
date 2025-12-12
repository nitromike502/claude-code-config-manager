# Coding Standards

## Overview

This document codifies coding standards and best practices learned from code reviews and production experience in the Claude Code Config Manager project. Following these standards prevents common mistakes, improves maintainability, and ensures consistency across the codebase.

## Table of Contents

1. [Test Fixtures and Data](#test-fixtures-and-data)
2. [Import Paths](#import-paths)
3. [Documentation Placement](#documentation-placement)
4. [CHANGELOG Policy](#changelog-policy)
5. [What NOT to Commit](#what-not-to-commit)
6. [Documentation Organization](#documentation-organization)

---

## Test Fixtures and Data

### Model Values

**Always use enum values in test fixtures, never full model IDs:**

**Correct:**
```yaml
---
name: test-agent
model: sonnet
---
```

```yaml
---
name: test-command
model: haiku
---
```

**Incorrect:**
```yaml
---
name: test-agent
model: claude-3-5-sonnet-20241022  # ❌ Don't use full model IDs
---
```

**Rationale:**
- Full model IDs change with every new release (e.g., `claude-3-5-sonnet-20241022` → `claude-3-5-sonnet-20250101`)
- Enum values (`sonnet`, `haiku`, `opus`) are stable across releases
- Tests remain valid even when new models are released
- Matches Claude Code's internal configuration format

**Valid Enum Values:**
- `sonnet` - Latest Claude 3.5 Sonnet model
- `haiku` - Latest Claude 3 Haiku model
- `opus` - Latest Claude 3 Opus model

### Frontmatter Properties for Test Coverage

**Include comprehensive properties in test fixtures to ensure thorough test coverage:**

#### Agent Frontmatter

**Recommended (Comprehensive):**
```yaml
---
name: test-agent
description: Test agent description
tools: [Read, Write, Bash]
model: sonnet
color: blue
---
```

**Minimal (Acceptable for basic tests):**
```yaml
---
name: test-agent
description: Test agent description
---
```

**Properties:**
- **Required:** `name`, `description`
- **Optional (recommended for comprehensive tests):** `tools`, `model`, `color`
- Including optional properties exercises more code paths in parsers

#### Command Frontmatter

**Recommended (Comprehensive):**
```yaml
---
name: test-command
model: sonnet
allowed-tools: [Read, Write]
argument-hint: Optional hint text
disable-model-invocation: false
---
```

**Minimal (Acceptable for basic tests):**
```yaml
---
name: test-command
---
```

**Properties:**
- **Required:** `name`
- **Optional (recommended for comprehensive tests):** `model`, `allowed-tools`, `argument-hint`, `disable-model-invocation`
- Including optional properties ensures parsers handle all fields correctly

---

## Import Paths

### Backend (Node.js/Jest)

**Use relative paths:**

```javascript
// ✅ Correct - Backend tests use relative paths
const copyService = require('../../../src/backend/services/copy-service');
const { parseSubagent } = require('../../../src/backend/parsers/subagentParser');
```

**Rationale:**
- Jest does NOT have `@` alias configured in this project
- Relative paths work reliably across all Node.js environments
- Consistent with Node.js module resolution standards

### Frontend (Vite/Vue)

**Use @ aliases:**

```javascript
// ✅ Correct - Frontend uses @ aliases
import { useProjectStore } from '@/stores/projectStore';
import ConfigCard from '@/components/ConfigCard.vue';
import { apiClient } from '@/api/client';
```

**Rationale:**
- Vite has `@` alias configured in `vite.config.js` to point to `/src`
- Cleaner imports without `../../../` chains
- Standard Vue.js convention

**Vite Alias Configuration:**
```javascript
// vite.config.js
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

---

## Documentation Placement

### When to Use Inline Comments

**Use inline comments for:**
- Brief explanations (< 20 lines)
- Algorithm complexity notes
- Cross-references to external documentation
- Quick implementation notes

**Example:**
```javascript
/**
 * HOOK STRUCTURE DOCUMENTATION
 *
 * For complete documentation, see: docs/technical/hook-structure.md
 *
 * Quick reference:
 * - Hooks use 3-level nested structure: Event → Matcher → Commands
 * - Deduplication key: event + matcher + command
 */
function mergeHooks(source, target) {
  // Implementation...
}
```

### When to Create Documentation Files

**Create documentation files (`docs/technical/`) for:**
- Extensive documentation (> 50 lines)
- Specification documents
- Complex algorithm explanations
- Architecture documentation
- Multi-component system documentation

**Example: docs/technical/hook-structure.md**
- Comprehensive hook structure specification
- Merge algorithm documentation
- Edge case handling
- Testing strategies

**Pattern:**
```
In code: Brief reference + link to docs
In docs/technical/: Comprehensive details with examples
```

**Benefits:**
- Code files stay focused and readable
- Documentation can be comprehensive without cluttering code
- Easier to maintain and update documentation
- Better for onboarding new developers

---

## CHANGELOG Policy

### Release-Time Updates Only

**IMPORTANT: CHANGELOG.md is maintained by project maintainers**
- Updates occur ONLY when cutting a new release (not during PR development)
- Do NOT update CHANGELOG.md in feature branches
- Do NOT include CHANGELOG updates in pull requests
- Follow "Keep a Changelog" format: https://keepachangelog.com/

**During Feature Development:**
- Focus on code comments, README updates, and inline documentation
- Update API documentation if endpoints change
- Update user guides if workflows change
- **Skip CHANGELOG** - it will be updated at release time

**At Release Time:**
- Project maintainer reviews all merged PRs since last release
- Maintainer adds consolidated CHANGELOG entry for the release
- Entry includes version number, date, and categorized changes

### Keep Entries Concise (When Release Time Comes)

**Maximum:** 3-4 bullet points per version
**Focus:** User-facing features only
**Avoid:** Implementation details, technical internals, test counts in every line

### Good Example

```markdown
## [2.1.0] - 2025-11-05

### Added
- Backend copy service for agents, commands, hooks, and MCP servers
- Conflict detection with smart resolution strategies
- Security hardening with path validation
- Comprehensive test coverage: 111 tests (100% pass rate)
```

### Bad Example (Too Verbose)

```markdown
## [2.1.0] - 2025-11-05

### Added
- Backend copy service for agents, commands, hooks, and MCP servers with the following features:
  - Agent copying with frontmatter parsing (23 tests)
  - Command copying with nested directory support (18 tests)
  - Hook copying with 3-level merge algorithm (31 tests)
  - MCP server copying with deduplication (19 tests)
  - Path validation service using regex patterns (12 tests)
  - Conflict detection service with 6 different strategies (20 tests)
  - Conflict resolution with rename, skip, and overwrite modes (15 tests)
  - Unique path generator with incremental suffixes (8 tests)
  - Atomic file writes using temp files (5 tests)
- Total: 151 lines of production code, 3,287 lines of test code
- Code coverage: 98.7% line coverage, 96.2% branch coverage
```

**Why This is Bad:**
- Overwhelming detail for end users
- Test counts belong in test reports, not CHANGELOG
- Line counts are irrelevant to users
- Implementation details obscure the actual features

### Guidelines

**DO Include:**
- High-level feature descriptions
- Breaking changes (with migration path)
- Security fixes
- Notable bug fixes
- Deprecations
- Overall test count (one line at end)

**DON'T Include:**
- Test counts for individual components
- Line counts (production or test code)
- Implementation details (algorithm names, file structures)
- Internal refactoring (unless it affects users)
- Technical debt cleanup

**Format:**
```markdown
### Added
- [Feature 1] - Brief user-facing description
- [Feature 2] - What users can now do
- Test coverage: X tests (100% pass rate)

### Changed
- [Change 1] - Impact on existing functionality

### Fixed
- [Bug fix] - What was broken and now works
```

---

## What NOT to Commit

### Excluded Files and Artifacts

**Never commit these files to the repository:**

#### Test Reports and Artifacts
```
# ❌ Don't commit
docs/testing/test-reports/report-2025-11-05.md
test-results/
playwright-report/
screenshots/
*-actual.png
*-diff.png
```

**Rationale:**
- Test results come from CI/CD pipelines and `npm test` output
- Test reports quickly become stale and outdated
- Screenshots and diffs are generated artifacts
- These files create noise in git history

**Exception:**
- Visual regression baseline images (`*-snapshots/`) ARE committed for comparison

#### Generated Documentation
```
# ❌ Don't commit (if auto-generated)
docs/api/generated/
docs/coverage/
```

**Rationale:**
- Generated docs can be recreated from source
- Often large and create unnecessary diffs
- Should be built during CI/deployment

#### Build Artifacts
```
# ❌ Don't commit (unless in dist/ for NPM)
build/
.cache/
.temp/
*.tmp
```

**Rationale:**
- Build outputs are generated from source
- Large binary files bloat repository size

**Exception:**
- `dist/` IS committed for NPM packages to enable instant `npx` startup

#### IDE and OS Files
```
# ❌ Don't commit
.DS_Store
.vscode/
.idea/
Thumbs.db
Desktop.ini
```

**Rationale:**
- Personal IDE preferences vary by developer
- OS-specific files are not relevant to the project
- Already covered in `.gitignore`

### Use .gitignore Appropriately

**Verify exclusions:**
```bash
# Check if file is ignored
git check-ignore -v path/to/file

# View effective .gitignore rules
git check-ignore -v *
```

**Key sections from project .gitignore:**
```gitignore
# Test artifacts
test-results/
playwright-report/
screenshots/
*-actual.png
*-diff.png

# Deleted files directory
.deleted/

# Build outputs (except dist/ for NPM)
build/
.cache/
.temp/
```

---

## Documentation Organization

### Directory Structure

```
docs/
├── guides/              # User and developer guides
│   ├── SETUP-GUIDE.md
│   ├── TESTING-GUIDE.md
│   ├── GIT-WORKFLOW.md
│   ├── CODING-STANDARDS.md (this file)
│   └── SWARM-WORKFLOW.md
├── technical/           # Technical specifications and architecture
│   ├── README.md        # Index of technical docs
│   ├── hook-structure.md
│   └── api-design.md
├── ba-sessions/         # Business analysis artifacts
│   └── PRD-Phase-X.md
├── sessions/            # Development session history
│   ├── summaries/
│   └── workflow-analyses/
├── prd/                 # Phase Requirements Documents
│   └── PRD-Phase2-Extension-Component-Refactoring.md
└── testing/            # Test documentation and reports
    ├── TEST-FILE-INDEX.md
    └── test-reports/   # Excluded from git
```

### Avoid Duplication

**Anti-pattern:**
```javascript
// ❌ Don't duplicate extensive docs in code
/**
 * Hook Structure Documentation
 *
 * Hooks in settings.json follow this structure:
 * {
 *   "hooks": {
 *     "PreToolUse": [
 *       { "matcher": "*.ts", "hooks": [...] }
 *     ]
 *   }
 * }
 *
 * Level 1 - Event Names:
 * Valid events: PreToolUse, PostToolUse, UserPromptSubmit...
 *
 * Level 2 - Matcher Entries:
 * Each event has an array of matcher entries...
 *
 * [100+ more lines of documentation]
 */
function parseHooks() { ... }
```

**Better pattern:**
```javascript
// ✅ Brief reference in code
/**
 * Parse Claude Code hooks from settings.json
 *
 * Hooks use 3-level nested structure (Event → Matcher → Commands).
 * For complete documentation, see: docs/technical/hook-structure.md
 *
 * @param {object} settings - Settings object containing hooks
 * @returns {array} Flattened array of hook objects
 */
function parseHooks(settings) { ... }
```

```markdown
<!-- ✅ Comprehensive docs in docs/technical/hook-structure.md -->
# Claude Code Hook Structure

## Overview
[Comprehensive documentation with examples, edge cases, algorithms, etc.]
```

---

## Best Practices Summary

1. **Test Data:** Use enum values (`sonnet`, `haiku`, `opus`) not full model IDs
2. **Frontmatter:** Include optional properties for comprehensive test coverage
3. **Imports:** Backend uses relative paths, frontend uses `@` aliases
4. **Documentation:** Brief comments in code, comprehensive docs in `docs/technical/`
5. **CHANGELOG:** Updated at release time only (not during PR development)
6. **Git Commits:** Don't commit test reports, generated docs, or IDE files
7. **File Organization:** Follow established directory structure
8. **Duplication:** One source of truth per concept

---

## Related Documentation

- **Testing Guide:** `docs/guides/TESTING-GUIDE.md` - Test execution and conventions
- **Git Workflow:** `docs/guides/GIT-WORKFLOW.md` - Branching, commits, PRs
- **Development Strategies:** `docs/guides/DEVELOPMENT-STRATEGIES.md` - SWARM workflow patterns
- **Technical Docs Index:** `docs/technical/README.md` - Technical documentation catalog

---

**Last Updated:** 2025-11-05
**Maintained by:** Documentation Engineer
