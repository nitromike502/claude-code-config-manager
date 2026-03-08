# PRD: Rules Support for Claude Code Config Manager

*Date: 2026-03-07*
*Author: Business Analyst*
*Status: Draft*
*Priority: High*

---

## Executive summary

The Claude Code Config Manager currently supports viewing, copying, and deleting five configuration types: Agents, Commands, Skills, Hooks, and MCP Servers. This PRD defines requirements for adding full support for a sixth configuration type: **Rules**.

Rules are markdown files with optional YAML frontmatter stored in `.claude/rules/` directories. They provide modular, topic-specific instructions that extend `CLAUDE.md`, with optional path-based conditional loading. Adding Rules support gives users complete visibility and management capabilities over all Claude Code configuration types from a single interface.

---

## Business objectives

### Primary objectives

1. **Complete configuration coverage** - Users can view and manage all Claude Code configuration types from one interface
2. **Feature parity** - Rules support matches the same view/copy/delete capabilities as existing configuration types
3. **Consistent UX** - Rules integration follows established UI patterns so users have zero learning curve

### Success criteria

| Criteria | Metric | Target |
|----------|--------|--------|
| Feature completeness | All user stories pass acceptance criteria | 100% |
| Test coverage | Backend unit tests passing | 100% |
| Test coverage | Frontend E2E tests passing | 80%+ (matching project standard) |
| Performance | Rules parsing for 50+ rule files | < 500ms |
| UX consistency | Rules card layout matches existing config cards | Visual parity |
| Dashboard integration | Project cards display rules count | Included in stats |

---

## User stories

### US-1: View project rules

**As a** user viewing a project's configuration,
**I want to** see all rules defined in the project's `.claude/rules/` directory,
**So that** I can understand what context instructions are configured for this project.

**Acceptance criteria:**

- [ ] Rules appear as a ConfigCard section on the project page alongside existing config types
- [ ] Each rule displays its name (relative path without `.md` extension, e.g., `frontend/react`)
- [ ] Each rule displays whether it is conditional (has `paths`) or unconditional
- [ ] Conditional rules display their glob patterns
- [ ] Rules from nested subdirectories are discovered and displayed
- [ ] Rules with parse errors display with an error indicator and the error message
- [ ] Empty rules directory shows "No rules configured" message

### US-2: View user-level rules

**As a** user viewing their global configuration,
**I want to** see all rules defined in `~/.claude/rules/`,
**So that** I can understand what user-level context instructions are active.

**Acceptance criteria:**

- [ ] User rules are accessible from the user configuration view
- [ ] User rules display with `scope: "user"` indicator
- [ ] Same display format as project rules (name, conditional status, paths)

### US-3: View rule details in sidebar

**As a** user who has selected a rule from the list,
**I want to** see the full rule content in the detail sidebar,
**So that** I can read the complete rule instructions and frontmatter.

**Acceptance criteria:**

- [ ] Clicking a rule opens the DetailSidebar with full content
- [ ] Markdown content is rendered with proper formatting
- [ ] Frontmatter `paths` field is displayed in a structured format (not raw YAML)
- [ ] The rule's file path is shown
- [ ] Conditional vs unconditional status is clearly indicated
- [ ] Rules with parse errors show the error message prominently

### US-4: Copy rules between projects

**As a** user who wants to share rules across projects,
**I want to** copy a rule from one project to another (or to/from user-level),
**So that** I can reuse context instructions across my development environments.

**Acceptance criteria:**

- [ ] Copy dialog allows selecting target project or user scope
- [ ] Subdirectory structure is preserved during copy (e.g., `frontend/react.md` copies to `rules/frontend/react.md` in target)
- [ ] Conflict detection identifies existing rules with the same relative path
- [ ] Conflict resolution supports skip, overwrite, and rename strategies
- [ ] Successful copy shows a toast notification with the copied rule name
- [ ] Copy from project-to-project, project-to-user, user-to-project all work

### US-5: Delete rules

**As a** user who wants to remove a rule,
**I want to** delete a rule from a project or user-level configuration,
**So that** the rule no longer provides context to Claude Code sessions.

**Acceptance criteria:**

- [ ] Delete button appears in the detail sidebar and/or context menu
- [ ] Confirmation dialog shows the rule name and file path before deletion
- [ ] Successful deletion removes the file and refreshes the rules list
- [ ] Deleting a rule in a subdirectory only removes the file, not the subdirectory
- [ ] Error handling displays a message if deletion fails

### US-6: Dashboard config counts include rules

**As a** user browsing the project list,
**I want to** see the rules count alongside other config type counts on each project card,
**So that** I have a complete picture of each project's configuration at a glance.

**Acceptance criteria:**

- [ ] Project cards in the dashboard display a `rules` count
- [ ] The count reflects the total number of `.md` files under `.claude/rules/` (recursive)
- [ ] Projects with no rules show `0` for the rules count

---

## Technical requirements

### Backend requirements

#### BE-1: Configuration paths

Add rules directory path getters to `src/backend/config/config.js`:

| Function | Returns |
|----------|---------|
| `paths.getUserRulesDir()` | `~/.claude/rules` (or `~/.claude-dev/rules` in dev mode) |
| `paths.getProjectRulesDir(projectPath)` | `{project}/.claude/rules` (or `{project}/.claude-dev/rules`) |

#### BE-2: Rules parser

Create `src/backend/parsers/rulesParser.js` following the command parser pattern (recursive directory discovery with `gray-matter` frontmatter extraction).

**Functions:**

| Function | Description |
|----------|-------------|
| `parseRule(filePath, baseDir, scope)` | Parse a single rule file, extract `paths` frontmatter and markdown content |
| `findMarkdownFiles(directoryPath)` | Recursively find all `.md` files (reuse from commandParser or extract shared utility) |
| `parseAllRules(directoryPath, scope)` | Discover and parse all rules in a rules directory |
| `getAllRules(projectPath)` | Get both project and user rules |

**Parsed rule object schema:**

```json
{
  "name": "string - relative path without .md (e.g., frontend/react)",
  "description": "string - first heading or first line of content",
  "paths": "string[] | null - glob patterns from frontmatter",
  "isConditional": "boolean - true if paths frontmatter present",
  "content": "string - full markdown content after frontmatter",
  "filePath": "string - absolute file path",
  "scope": "string - project or user",
  "hasError": "boolean",
  "parseError": "string | null"
}
```

**Edge cases (from technical spec):**

1. Missing rules directory: return empty array
2. Invalid YAML frontmatter: set `hasError: true`, include in results
3. Frontmatter with no `paths` field: unconditional (`isConditional: false`)
4. Empty `paths` array: unconditional
5. No frontmatter: unconditional
6. Nested subdirectories: name includes relative path
7. Empty file body: valid, return empty content
8. Deeply nested directories: support arbitrary depth

#### BE-3: Discovery service

Add to `src/backend/services/projectDiscovery.js`:

| Function | Description |
|----------|-------------|
| `getProjectRules(projectPath)` | Returns `{ rules: [...], warnings: [...] }` |
| `getUserRules()` | Returns `{ rules: [...], warnings: [...] }` |

Update `getProjectCounts()` to include `rules` in the returned counts object.

#### BE-4: API routes

Add to `src/backend/routes/projects.js`:

| Method | Route | Handler |
|--------|-------|---------|
| `GET` | `/:projectId/rules` | Return project rules |
| `DELETE` | `/:projectId/rules/:name(*)` | Delete project rule (name may contain `/` for subdirs) |

Add to `src/backend/routes/user.js`:

| Method | Route | Handler |
|--------|-------|---------|
| `GET` | `/rules` | Return user rules |
| `DELETE` | `/rules/:name(*)` | Delete user rule |

**Note:** The `:name` parameter must support forward slashes for subdirectory-based names (e.g., `frontend/react`). Use Express wildcard or regex route parameter.

Update security middleware `validResourcePrefixes` array to include `'rules'`.

#### BE-5: Copy service

Add `copyRule(request)` method to `CopyService` class in `src/backend/services/copy-service.js`.

**Behavior:** File-based copy identical to `copyAgent()` but without YAML frontmatter validation requirement (frontmatter is optional for rules).

**Copy request schema:**

```json
{
  "sourcePath": "string - absolute path to source rule file",
  "targetScope": "string - 'project' or 'user'",
  "targetProjectId": "string | null - required if targetScope is 'project'",
  "conflictStrategy": "string | null - 'skip', 'overwrite', 'rename'"
}
```

**Subdirectory preservation:** When copying `rules/frontend/react.md`, the target path must maintain the `frontend/` subdirectory under the target rules directory.

Add copy route to `src/backend/routes/copy.js`:

| Method | Route | Handler |
|--------|-------|---------|
| `POST` | `/copy/rule` | Copy rule between scopes |

#### BE-6: Delete service

Rules deletion uses the existing `deleteFile()` function from `src/backend/services/deleteService.js`. No new delete service code is needed -- the route handler constructs the file path and calls `deleteFile()`.

### Frontend requirements

#### FE-1: API client

Add to `src/api/client.js`:

| Function | Endpoint |
|----------|----------|
| `getProjectRules(projectId)` | `GET /api/projects/:projectId/rules` |
| `getUserRules()` | `GET /api/user/rules` |
| `copyRule(payload)` | `POST /api/copy/rule` |
| `deleteProjectRule(projectId, name)` | `DELETE /api/projects/:projectId/rules/:name` |
| `deleteUserRule(name)` | `DELETE /api/user/rules/:name` |

**Note:** The `name` parameter in delete calls must be URL-encoded since it may contain forward slashes.

#### FE-2: Pinia store

Add rules state and actions to the appropriate Pinia store (likely the project store or a new rules store, depending on existing patterns).

**State:**

- `rules: []` - current project's rules
- `userRules: []` - user-level rules
- `rulesLoading: boolean`

**Actions:**

- `fetchProjectRules(projectId)`
- `fetchUserRules()`
- `copyRule(payload)`
- `deleteRule(scope, projectId, name)`

#### FE-3: ConfigCard integration

Add a Rules ConfigCard to the project view using the existing `ConfigCard` component.

**Display per rule item:**

- Name (relative path, e.g., `frontend/react`)
- Conditional badge ("Conditional" or "Always loaded")
- Description (first line/heading)
- Path patterns (if conditional, shown as tags)

#### FE-4: DetailSidebar integration

When a rule is selected, the DetailSidebar displays:

- Rule name and scope badge
- Conditional/unconditional status
- Path patterns list (if conditional)
- Full rendered markdown content
- File path
- Copy and Delete action buttons
- Parse error message (if applicable)

#### FE-5: Dashboard integration

Update the project card component to display `rules` count alongside existing counts (agents, commands, hooks, mcp, skills).

Update any fallback/default stats objects to include `rules: 0`.

---

## Dependencies and constraints

### Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| `gray-matter` npm package | Existing | Already used by agent and command parsers |
| `ConfigCard` component | Existing | Reusable for rules display |
| `ConfigItem` component | Existing | Reusable for individual rule items |
| `DetailSidebar` component | Existing | Reusable for rule detail view |
| `CopyService` class | Existing | Extend with `copyRule()` method |
| `deleteFile()` function | Existing | Reuse for rule file deletion |
| Technical spec | Existing | `docs/technical/rules-structure.md` |

### Constraints

1. **No database changes** - The application reads directly from the file system
2. **Dev mode support** - All paths must respect `USE_DEV_PATHS` environment variable
3. **Security** - Path traversal prevention must be applied to all new routes
4. **Performance** - Recursive directory scanning must handle projects with many rules efficiently
5. **Backward compatibility** - No changes to existing config type behavior

---

## Testing approach

### Backend unit tests

Follow existing patterns in `tests/backend/`:

| Test Area | Estimated Tests | Pattern Reference |
|-----------|----------------|-------------------|
| Rules parser (`rulesParser.test.js`) | 25-35 | `tests/backend/parsers/` |
| Rules API routes | 20-30 | `tests/backend/routes/` |
| Rules copy service | 20-25 | `tests/backend/services/copy-service/` |
| Rules delete operations | 10-15 | `tests/backend/services/deleteService.test.js` |
| Config paths | 4-6 | `tests/backend/config/` |

**Total estimated backend tests:** 79-111

**Key test scenarios for parser:**

- Parse unconditional rule (no frontmatter)
- Parse conditional rule (with `paths`)
- Parse rule with invalid YAML
- Parse rule with frontmatter but no `paths` field
- Parse rule with empty `paths` array
- Parse rule in nested subdirectory
- Parse empty file
- Handle missing rules directory
- Handle deeply nested directories

### Frontend tests

Follow existing patterns in `tests/frontend/` and `tests/e2e/`:

| Test Area | Estimated Tests | Pattern Reference |
|-----------|----------------|-------------------|
| Rules ConfigCard rendering | 10-15 | Existing ConfigCard tests |
| Rules DetailSidebar | 10-15 | Existing sidebar tests |
| Rules copy flow (E2E) | 5-10 | Existing copy E2E tests |
| Rules delete flow (E2E) | 5-8 | Existing delete E2E tests |
| Dashboard rules count | 3-5 | Existing dashboard tests |

**Total estimated frontend tests:** 33-53

---

## Epic/story/task breakdown estimate

### EPIC: Rules Support

#### STORY 1: Backend - Rules parser and config paths

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Add `getUserRulesDir()` and `getProjectRulesDir()` to config.js | 0.5h | None |
| Create `rulesParser.js` with `parseRule()`, `parseAllRules()`, `getAllRules()` | 2h | Config paths |
| Write parser unit tests | 2h | Parser |
| **Story total** | **4.5h** | |

#### STORY 2: Backend - Discovery service and API routes

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Add `getProjectRules()` and `getUserRules()` to projectDiscovery.js | 1h | Parser |
| Update `getProjectCounts()` to include rules | 0.5h | Discovery |
| Add GET routes for project and user rules | 1h | Discovery |
| Add DELETE routes for project and user rules | 1h | Existing delete service |
| Update security middleware `validResourcePrefixes` | 0.25h | None |
| Write route unit tests | 2h | Routes |
| **Story total** | **5.75h** | |

#### STORY 3: Backend - Copy service

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Add `copyRule()` to CopyService | 1.5h | Config paths |
| Add `buildTargetPath` support for rules type | 0.5h | Copy service |
| Add POST `/api/copy/rule` route | 0.5h | Copy method |
| Write copy service unit tests | 2h | Copy method |
| **Story total** | **4.5h** | |

#### STORY 4: Frontend - API client, store, and components

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Add rules methods to API client | 0.5h | Backend routes |
| Add rules state and actions to Pinia store | 1h | API client |
| Add Rules ConfigCard to project view | 1.5h | Store |
| Add Rules display to DetailSidebar | 1.5h | Store |
| Update dashboard project cards with rules count | 0.5h | Backend counts |
| Write frontend/E2E tests | 3h | Components |
| **Story total** | **8h** | |

### Total estimate

| Category | Hours |
|----------|-------|
| Backend | 14.75h |
| Frontend | 8h |
| **Total** | **22.75h** |

---

## Out of scope

The following are explicitly not part of this PRD:

1. **Rule creation/editing** - Creating new rules or editing existing rules via the UI (future enhancement)
2. **Rule validation** - Validating glob pattern syntax in `paths` frontmatter
3. **Rule preview** - Simulating which files would trigger conditional rule loading
4. **Rule ordering** - Controlling the load order of rules
5. **CLAUDE.md integration** - Viewing or editing CLAUDE.md alongside rules

---

## References

- Technical specification: `docs/technical/rules-structure.md`
- Existing parser patterns: `src/backend/parsers/subagentParser.js`, `src/backend/parsers/commandParser.js`
- Copy service: `src/backend/services/copy-service.js`
- Feature parity guide: `docs/guides/FEATURE-PARITY-IMPLEMENTATION-GUIDE.md`
