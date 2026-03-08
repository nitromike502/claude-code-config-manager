# Implementation Guide: Rules Support

*Date: 2026-03-07*

---

## Architecture Overview

Rules integrates into the existing architecture as a 6th configuration type, following the same layered pattern:

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Vue 3 + PrimeVue)                            │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────────┐  │
│  │ API      │ │ Pinia    │ │ Components             │  │
│  │ Client   │→│ Store    │→│ ConfigCard, Sidebar    │  │
│  └──────────┘ └──────────┘ └────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Backend (Express)                                      │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────────┐  │
│  │ Routes   │→│ Discovery│→│ Parser                 │  │
│  │          │ │ Service  │ │ (rulesParser.js)       │  │
│  └──────────┘ └──────────┘ └────────────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────────┐  │
│  │ Copy     │ │ Delete   │ │ Config                 │  │
│  │ Routes   │ │ Service  │ │ (paths module)         │  │
│  └──────────┘ └──────────┘ └────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  File System                                            │
│  .claude/rules/*.md  |  ~/.claude/rules/*.md            │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Order

Implementation follows a dependency chain. Each step builds on the previous:

### Phase 1: Backend Foundation

**Step 1: Config Paths** (dependency: none)

Add to `src/backend/config/config.js`:

```javascript
// In paths object:
getUserRulesDir() {
  return path.join(this.getUserClaudeDir(), 'rules');
},

getProjectRulesDir(projectPath) {
  return path.join(this.getProjectClaudeDir(projectPath), 'rules');
}
```

Dev mode paths will automatically use `.claude-dev/rules/` based on the existing `getProjectClaudeDir()` and `getUserClaudeDir()` methods.

**Step 2: Rules Parser** (dependency: config paths)

Create `src/backend/parsers/rulesParser.js`. Follow `commandParser.js` pattern since both:
- Are markdown files with optional frontmatter
- Support recursive subdirectory discovery
- Derive names from relative paths

```javascript
const matter = require('gray-matter');
const path = require('path');
const fs = require('fs').promises;

/**
 * Parse a single rule file.
 *
 * @param {string} filePath - Absolute path to the .md file
 * @param {string} baseDir - Base rules directory (for calculating relative name)
 * @param {string} scope - 'project' or 'user'
 * @returns {Object} Parsed rule object
 */
async function parseRule(filePath, baseDir, scope = 'project') {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);

    // Name = relative path without .md extension
    const relativePath = path.relative(baseDir, filePath);
    const name = relativePath.replace(/\.md$/i, '').replace(/\\/g, '/');

    // Extract description from first heading or first line
    const description = extractDescription(content);

    // Determine conditional status
    const paths = Array.isArray(frontmatter.paths) && frontmatter.paths.length > 0
      ? frontmatter.paths
      : null;
    const isConditional = paths !== null;

    return {
      name,
      description,
      paths,
      isConditional,
      content: content.trim(),
      filePath,
      scope,
      hasError: false,
      parseError: null
    };
  } catch (error) {
    // Graceful degradation - return partial entry with error
    const relativePath = path.relative(baseDir, filePath);
    const name = relativePath.replace(/\.md$/i, '').replace(/\\/g, '/');
    return {
      name,
      description: '',
      paths: null,
      isConditional: false,
      content: '',
      filePath,
      scope,
      hasError: true,
      parseError: error.message
    };
  }
}

function extractDescription(content) {
  if (!content || !content.trim()) return '';
  const lines = content.trim().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Strip markdown heading markers
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/^#+\s*/, '');
    }
    return trimmed;
  }
  return '';
}
```

**Key pattern:** `findMarkdownFiles()` can be shared with the command parser or duplicated. It recursively walks the directory and returns all `.md` file paths.

**Step 3: Discovery Service** (dependency: parser)

Add to `src/backend/services/projectDiscovery.js`:

```javascript
const { parseAllRules } = require('../parsers/rulesParser');
const { paths } = require('../config/config');

async function getProjectRules(projectPath) {
  const rulesDir = paths.getProjectRulesDir(projectPath);
  return parseAllRules(rulesDir, 'project');
}

async function getUserRules() {
  const rulesDir = paths.getUserRulesDir();
  return parseAllRules(rulesDir, 'user');
}
```

Update `getProjectConfigCounts()`:

```javascript
// Add rules count alongside existing counts
const rulesResult = await getProjectRules(projectPath);
counts.rules = rulesResult.rules.length;
```

**Step 4: API Routes** (dependency: discovery service)

Add to `src/backend/routes/projects.js`:

```javascript
// GET project rules
router.get('/:projectId/rules', async (req, res) => {
  try {
    const project = await getProjectById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const result = await getProjectRules(project.path);
    res.json({ success: true, rules: result.rules, warnings: result.warnings, projectId: req.params.projectId, projectPath: project.path });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE project rule (name may contain slashes)
router.delete('/:projectId/rules/*', async (req, res) => {
  // req.params[0] captures the wildcard portion (the rule name with slashes)
  const ruleName = req.params[0];
  // ... construct file path and delete
});
```

### Phase 2: Backend Operations

**Step 5: Copy Service** (dependency: config paths, routes)

Add to `src/backend/services/copy-service.js`:

```javascript
async copyRule({ sourcePath, targetScope, targetProjectId, conflictStrategy }) {
  // 1. Read source file
  const sourceContent = await fs.readFile(sourcePath, 'utf-8');

  // 2. Determine target directory
  const targetDir = targetScope === 'user'
    ? paths.getUserRulesDir()
    : paths.getProjectRulesDir(getProjectPath(targetProjectId));

  // 3. Calculate relative path from source rules dir
  const sourceRulesDir = this.findRulesBaseDir(sourcePath);
  const relativePath = path.relative(sourceRulesDir, sourcePath);

  // 4. Build target path preserving subdirectory structure
  const targetPath = path.join(targetDir, relativePath);

  // 5. Check for conflict
  if (await fileExists(targetPath)) {
    return this.handleConflict(targetPath, sourceContent, conflictStrategy);
  }

  // 6. Create subdirectories if needed and write
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, sourceContent, 'utf-8');

  return { success: true, targetPath };
}
```

Add copy route to `src/backend/routes/copy.js`:

```javascript
router.post('/rule', async (req, res) => {
  const result = await copyService.copyRule(req.body);
  res.json(result);
});
```

**Step 6: Delete Route Handler** (dependency: routes, existing deleteFile)

```javascript
// Uses existing deleteFile() utility - no new service code needed
const filePath = path.join(paths.getProjectRulesDir(project.path), `${ruleName}.md`);
await deleteFile(filePath);
```

### Phase 3: Frontend Integration

**Step 7: API Client** (dependency: backend routes)

Add to `src/api/client.js`:

```javascript
async getProjectRules(projectId) {
  return this.get(`/api/projects/${projectId}/rules`);
},

async getUserRules() {
  return this.get('/api/user/rules');
},

async copyRule(payload) {
  return this.post('/api/copy/rule', payload);
},

async deleteProjectRule(projectId, name) {
  return this.delete(`/api/projects/${projectId}/rules/${encodeURIComponent(name)}`);
},

async deleteUserRule(name) {
  return this.delete(`/api/user/rules/${encodeURIComponent(name)}`);
}
```

**Step 8: Pinia Store** (dependency: API client)

Add rules state and actions to the existing project/config store, following the pattern used for skills (the most recently added type).

**Step 9: ConfigCard & ConfigItem** (dependency: store)

Add a Rules ConfigCard instance to the project detail view and user view. The `ConfigCard` component is already reusable — the main work is:

1. Add `'rules'` to the `type` prop type definition
2. Add rules display logic to `ConfigItem` computed properties:
   - `itemName`: return `rule.name` (relative path)
   - `itemDescription`: return conditional status + patterns or "Loads always"
3. Add rules icon (`pi pi-book`) and color (`#E53E3E`) constants

**Step 10: DetailSidebar** (dependency: store, components)

Add rules-specific section to the DetailSidebar:

1. **Path Patterns section** (new, rules-only): displayed for conditional rules
2. Reuse existing YAML Frontmatter section
3. Reuse existing Markdown Content section
4. Add Copy/Delete actions using existing action patterns

**Step 11: Dashboard Integration** (dependency: backend counts)

Update ProjectCard component to include rules count in the stats display grid.

### Phase 4: Testing

**Step 12: Backend Tests** (dependency: all backend steps)

Create test files following existing patterns:

- `tests/backend/parsers/rulesParser.test.js`
- `tests/backend/routes/rules.test.js`
- `tests/backend/services/copy-service/copyRule.test.js`

**Step 13: Frontend Tests** (dependency: all frontend steps)

- Add rules to existing E2E test suites
- Add rules ConfigCard rendering tests
- Add rules sidebar tests

---

## Test Fixtures

Create in `tests/fixtures/`:

### Valid Rule Files

```
tests/fixtures/projects/valid-project/.claude/rules/
├── coding-standards.md      # Unconditional rule (no frontmatter)
├── security.md              # Conditional rule (with paths)
└── frontend/
    └── react.md             # Nested conditional rule
```

**`coding-standards.md`:**
```markdown
# Coding Standards

- Use 2-space indentation
- Prefer const over let
```

**`security.md`:**
```markdown
---
paths:
  - "src/auth/**/*"
---

# Security Rules

- Never log credentials
```

**`frontend/react.md`:**
```markdown
---
paths:
  - "src/components/**/*.tsx"
  - "src/components/**/*.jsx"
---

# React Rules

- Use functional components
```

### Malformed Rule Files

```
tests/fixtures/projects/malformed-project/.claude/rules/
├── bad-yaml.md             # Invalid YAML frontmatter
└── empty.md                # Empty file
```

---

## Integration Points

### Files to Create
| File | Purpose |
|------|---------|
| `src/backend/parsers/rulesParser.js` | Rules parser |
| `tests/backend/parsers/rulesParser.test.js` | Parser tests |
| `tests/backend/routes/rules.test.js` | Route tests |
| `tests/backend/services/copy-service/copyRule.test.js` | Copy tests |

### Files to Modify
| File | Changes |
|------|---------|
| `src/backend/config/config.js` | Add `getUserRulesDir()`, `getProjectRulesDir()` |
| `src/backend/parsers/index.js` | Export rules parser functions |
| `src/backend/services/projectDiscovery.js` | Add `getProjectRules()`, `getUserRules()`, update counts |
| `src/backend/routes/projects.js` | Add GET/DELETE rules routes |
| `src/backend/routes/user.js` | Add GET/DELETE rules routes |
| `src/backend/routes/copy.js` | Add POST `/copy/rule` route |
| `src/backend/services/copy-service.js` | Add `copyRule()` method |
| `src/api/client.js` | Add rules API methods |
| Pinia store file | Add rules state and actions |
| Project detail view | Add Rules ConfigCard |
| User/global view | Add Rules ConfigCard |
| DetailSidebar component | Add rules-specific display |
| ProjectCard component | Add rules count to stats |
| ConfigItem component | Add rules type handling |

---

## Rollout Plan

1. **Backend first** — Implement and test parser, discovery, routes, copy/delete
2. **Frontend second** — Wire up API client, store, components
3. **Integration testing** — E2E tests covering full flow
4. **Review** — Code review with feature parity checklist against agents/commands implementation
5. **Release** — Include in next version bump

---

## References

- Technical specification: `docs/technical/rules-structure.md`
- Wireframes: `docs/ba-sessions/20260307-120000-rules-support/wireframes/`
- PRD: `docs/ba-sessions/20260307-120000-rules-support/prd/PRD-Rules-Support.md`
- Feature parity guide: `docs/guides/FEATURE-PARITY-IMPLEMENTATION-GUIDE.md`
- Existing parser patterns: `src/backend/parsers/commandParser.js`
