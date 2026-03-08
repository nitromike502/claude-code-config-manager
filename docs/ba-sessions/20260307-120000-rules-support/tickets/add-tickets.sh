#!/bin/bash
# Add all Rules Support tickets to the claude-manager database
# Run from the ticket-system scripts directory

SCRIPTS_DIR="/home/meckert/.claude/skills/ticket-system/scripts"
PROJECT="claude-manager"

echo "Adding Rules Support tickets to $PROJECT database..."
echo ""

# ============================================================
# EPIC-007
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" EPIC-007 backlog \
"# Rules Support

## Objective
Add full support for Rules as the 6th configuration type in the Claude Code Config Manager, enabling users to view, copy, and delete rules from .claude/rules/ directories at both project and user scope.

## Business Objectives
1. Complete configuration coverage - Users can view and manage all Claude Code configuration types from one interface
2. Feature parity - Rules support matches the same view/copy/delete capabilities as existing configuration types
3. Consistent UX - Rules integration follows established UI patterns so users have zero learning curve

## Acceptance Criteria
- [ ] Users can view rules in project and user-level ConfigCard sections
- [ ] Rules detail sidebar shows full content, conditional status, and path patterns
- [ ] Copy rule works across project-to-project, project-to-user, user-to-project
- [ ] Delete rule removes file and refreshes list
- [ ] Dashboard project cards display rules count
- [ ] Backend parser handles all edge cases (missing dir, invalid YAML, nested subdirs)
- [ ] 79-111 backend unit tests passing at 100%
- [ ] 33-53 frontend/E2E tests passing at 80%+
- [ ] Rules parsing for 50+ rules completes in under 500ms

## Stories
- STORY-7.1: Backend - Rules parser and config paths
- STORY-7.2: Backend - Discovery service and API routes
- STORY-7.3: Backend - Copy service
- STORY-7.4: Frontend - API client, store, and components

## References
- PRD: docs/ba-sessions/20260307-120000-rules-support/prd/PRD-Rules-Support.md
- Implementation guide: docs/ba-sessions/20260307-120000-rules-support/guides/implementation-guide.md
- Technical spec: docs/technical/rules-structure.md"

echo ""

# ============================================================
# STORY-7.1
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" STORY-7.1 backlog \
"# Backend - Rules Parser and Config Paths

## Objective
Create the foundational backend layer for Rules support: add path getters to config.js, implement the rulesParser.js module, and write comprehensive unit tests.

## Acceptance Criteria
- [ ] getUserRulesDir() returns ~/.claude/rules (or ~/.claude-dev/rules in dev mode)
- [ ] getProjectRulesDir(projectPath) returns {project}/.claude/rules (dev mode aware)
- [ ] parseRule() extracts name, description, paths, isConditional, content, scope, hasError, parseError
- [ ] parseAllRules() discovers and parses all .md files in a rules directory recursively
- [ ] getAllRules() returns both project and user rules
- [ ] Edge cases handled: missing directory, invalid YAML, no frontmatter, empty paths array, nested subdirs, empty file, deeply nested
- [ ] 25-35 parser unit tests passing at 100%
- [ ] Config path tests (4-6) passing at 100%

## Dependencies
- None (foundational story)

## Tasks
- TASK-7.1.1: Add getUserRulesDir() and getProjectRulesDir() to config.js
- TASK-7.1.2: Create rulesParser.js with parseRule() and findMarkdownFiles()
- TASK-7.1.3: Add parseAllRules() and getAllRules() to rulesParser.js
- TASK-7.1.4: Write rulesParser unit tests
- TASK-7.1.5: Write config path unit tests

## Estimate
4.5h total"

echo ""

# ============================================================
# STORY-7.2
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" STORY-7.2 backlog \
"# Backend - Discovery Service and API Routes

## Objective
Integrate rules into the project discovery service and expose GET/DELETE API routes for project and user rules, including security middleware update.

## Acceptance Criteria
- [ ] getProjectRules(projectPath) returns { rules: [...], warnings: [...] }
- [ ] getUserRules() returns { rules: [...], warnings: [...] }
- [ ] getProjectCounts() includes rules count in returned object
- [ ] GET /:projectId/rules returns project rules
- [ ] GET /user/rules returns user rules
- [ ] DELETE /:projectId/rules/* handles subdirectory names (e.g., frontend/react)
- [ ] DELETE /user/rules/* handles subdirectory names
- [ ] Security middleware validResourcePrefixes includes 'rules'
- [ ] 20-30 route unit tests passing at 100%

## Dependencies
- STORY-7.1 (rulesParser.js must exist)

## Tasks
- TASK-7.2.1: Add getProjectRules() and getUserRules() to projectDiscovery.js
- TASK-7.2.2: Update getProjectCounts() to include rules count
- TASK-7.2.3: Add GET routes for project and user rules
- TASK-7.2.4: Add DELETE routes for project and user rules
- TASK-7.2.5: Update security middleware validResourcePrefixes
- TASK-7.2.6: Write route unit tests

## Estimate
5.75h total"

echo ""

# ============================================================
# STORY-7.3
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" STORY-7.3 backlog \
"# Backend - Copy Service

## Objective
Extend the CopyService with copyRule() method that preserves subdirectory structure and handles conflict resolution, plus expose the POST /api/copy/rule route.

## Acceptance Criteria
- [ ] copyRule() reads source file and determines target directory from scope
- [ ] Subdirectory structure preserved (e.g., frontend/react.md copies to rules/frontend/react.md in target)
- [ ] Conflict detection identifies existing rules at target path
- [ ] Skip, overwrite, and rename conflict strategies all work correctly
- [ ] POST /api/copy/rule route accepts sourcePath, targetScope, targetProjectId, conflictStrategy
- [ ] buildTargetPath supports rules type
- [ ] Copy project-to-project, project-to-user, user-to-project all work
- [ ] 20-25 copy service unit tests passing at 100%

## Dependencies
- STORY-7.1 (config paths for rules dirs)

## Tasks
- TASK-7.3.1: Add copyRule() method to CopyService
- TASK-7.3.2: Add buildTargetPath support for rules type
- TASK-7.3.3: Add POST /api/copy/rule route to copy.js
- TASK-7.3.4: Write copy service unit tests for rules

## Estimate
4.5h total"

echo ""

# ============================================================
# STORY-7.4
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" STORY-7.4 backlog \
"# Frontend - API Client, Store, and Components

## Objective
Wire up the complete frontend for Rules: API client methods, Pinia store state/actions, Rules ConfigCard in project and user views, DetailSidebar rules display, dashboard rules count, and frontend/E2E tests.

## Acceptance Criteria
- [ ] getProjectRules(), getUserRules(), copyRule(), deleteProjectRule(), deleteUserRule() in API client
- [ ] deleteProjectRule/deleteUserRule URL-encode name parameter (supports slashes in subdirectory names)
- [ ] Pinia store has rules state, userRules state, rulesLoading flag, and all four actions
- [ ] Rules ConfigCard displays in project view with name, conditional badge, description, path tags
- [ ] Rules ConfigCard displays in user view with scope: user indicator
- [ ] DetailSidebar shows rule name, scope badge, conditional status, path patterns, full rendered markdown, file path, copy and delete buttons, and parse error (if any)
- [ ] Dashboard project cards display rules count alongside other config type counts
- [ ] Default stats objects include rules: 0 fallback
- [ ] ConfigItem and ConfigCard components updated to handle rules type
- [ ] 33-53 frontend/E2E tests passing at 80%+

## Dependencies
- STORY-7.1, STORY-7.2, STORY-7.3 (all backend must be complete)

## Tasks
- TASK-7.4.1: Add rules methods to API client (client.js)
- TASK-7.4.2: Add rules state and actions to Pinia store
- TASK-7.4.3: Add rules type support to ConfigItem and ConfigCard components
- TASK-7.4.4: Add Rules ConfigCard to project view and user view
- TASK-7.4.5: Add rules display to DetailSidebar
- TASK-7.4.6: Update dashboard ProjectCard with rules count
- TASK-7.4.7: Write frontend and E2E tests for rules

## Estimate
8h total"

echo ""

# ============================================================
# TASK-7.1.1
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.1.1 backlog \
"# Add getUserRulesDir() and getProjectRulesDir() to config.js

## Objective
Add two path getter functions to src/backend/config/config.js for locating rules directories at user and project scope, with automatic dev mode support.

## Acceptance Criteria
- [ ] getUserRulesDir() returns path.join(getUserClaudeDir(), 'rules')
- [ ] getProjectRulesDir(projectPath) returns path.join(getProjectClaudeDir(projectPath), 'rules')
- [ ] Both functions respect USE_DEV_PATHS (returns .claude-dev/rules when enabled)
- [ ] Functions follow exact same pattern as existing getUserSkillsDir() / getProjectSkillsDir()
- [ ] No regressions in existing config tests

## Files to Modify
- src/backend/config/config.js

## Implementation Notes
Follow the exact pattern of getUserSkillsDir() and getProjectSkillsDir(). Dev mode is handled automatically by the parent getProjectClaudeDir() and getUserClaudeDir() methods.

## Estimate
0.5h"

echo ""

# ============================================================
# TASK-7.1.2
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.1.2 backlog \
"# Create rulesParser.js with parseRule() and findMarkdownFiles()

## Objective
Create src/backend/parsers/rulesParser.js with the core parseRule() function and findMarkdownFiles() helper, following the commandParser.js pattern.

## Acceptance Criteria
- [ ] parseRule(filePath, baseDir, scope) returns rule object with all 9 fields: name, description, paths, isConditional, content, filePath, scope, hasError, parseError
- [ ] name is relative path from baseDir without .md extension, forward-slash normalized
- [ ] description extracted from first markdown heading or first non-empty line
- [ ] paths is string[] when frontmatter.paths is non-empty array, null otherwise
- [ ] isConditional is true only when paths is non-null
- [ ] content is trimmed markdown body after frontmatter
- [ ] On parse error: hasError=true, parseError=error.message, other fields gracefully set
- [ ] findMarkdownFiles(directoryPath) recursively finds all .md files
- [ ] findMarkdownFiles returns empty array when directory does not exist (no throw)
- [ ] Uses gray-matter for frontmatter parsing

## Files to Create
- src/backend/parsers/rulesParser.js

## Implementation Notes
Reference: src/backend/parsers/commandParser.js for the findMarkdownFiles pattern. Reference implementation-guide.md for parseRule() code template. The key difference from commands: only the paths field is recognized in frontmatter.

## Estimate
1h"

echo ""

# ============================================================
# TASK-7.1.3
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.1.3 backlog \
"# Add parseAllRules() and getAllRules() to rulesParser.js

## Objective
Add the two higher-level parser functions to rulesParser.js: parseAllRules() for scanning a directory and getAllRules() for combining project and user rules.

## Acceptance Criteria
- [ ] parseAllRules(directoryPath, scope) returns { rules: [...], warnings: [] }
- [ ] parseAllRules returns { rules: [], warnings: [] } when directory does not exist
- [ ] parseAllRules discovers all .md files recursively in directoryPath
- [ ] parseAllRules calls parseRule() for each file with correct baseDir and scope
- [ ] getAllRules(projectPath) calls parseAllRules for both project and user dirs
- [ ] getAllRules returns { rules: [...combined...], warnings: [...combined...] }
- [ ] Export all four functions: parseRule, findMarkdownFiles, parseAllRules, getAllRules
- [ ] Export added to src/backend/parsers/index.js

## Files to Modify
- src/backend/parsers/rulesParser.js (add functions)
- src/backend/parsers/index.js (add exports)

## Estimate
1h"

echo ""

# ============================================================
# TASK-7.1.4
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.1.4 backlog \
"# Write rulesParser unit tests

## Objective
Create comprehensive unit tests for rulesParser.js covering all parsing scenarios and edge cases defined in the PRD.

## Acceptance Criteria
- [ ] Test file created at tests/backend/parsers/rulesParser.test.js
- [ ] Test fixtures created: tests/fixtures/projects/valid-project/.claude/rules/ with coding-standards.md, security.md, frontend/react.md
- [ ] Test fixtures created: tests/fixtures/projects/malformed-project/.claude/rules/ with bad-yaml.md, empty.md
- [ ] parseRule: unconditional rule (no frontmatter) - isConditional=false, paths=null
- [ ] parseRule: conditional rule (with paths array) - isConditional=true, paths populated
- [ ] parseRule: invalid YAML frontmatter - hasError=true, parseError set
- [ ] parseRule: frontmatter with no paths field - isConditional=false
- [ ] parseRule: empty paths array - isConditional=false, paths=null
- [ ] parseRule: nested subdirectory - name includes relative path (e.g., frontend/react)
- [ ] parseRule: empty file - valid result, empty content
- [ ] parseRule: description extracted from first heading
- [ ] parseRule: description extracted from first line when no heading
- [ ] parseAllRules: missing directory returns empty results
- [ ] parseAllRules: discovers files recursively
- [ ] parseAllRules: deeply nested directories supported
- [ ] getAllRules: combines project and user rules
- [ ] Minimum 25 tests, target 30+

## Files to Create
- tests/backend/parsers/rulesParser.test.js
- tests/fixtures/projects/valid-project/.claude/rules/coding-standards.md
- tests/fixtures/projects/valid-project/.claude/rules/security.md
- tests/fixtures/projects/valid-project/.claude/rules/frontend/react.md
- tests/fixtures/projects/malformed-project/.claude/rules/bad-yaml.md
- tests/fixtures/projects/malformed-project/.claude/rules/empty.md

## Estimate
2h"

echo ""

# ============================================================
# TASK-7.1.5
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.1.5 backlog \
"# Write config path unit tests for rules

## Objective
Add unit tests to the existing config.js test suite to verify getUserRulesDir() and getProjectRulesDir() return correct paths in both normal and dev mode.

## Acceptance Criteria
- [ ] getUserRulesDir() returns ~/.claude/rules in normal mode
- [ ] getUserRulesDir() returns ~/.claude-dev/rules when USE_DEV_PATHS=true
- [ ] getProjectRulesDir('/home/user/myproject') returns /home/user/myproject/.claude/rules
- [ ] getProjectRulesDir('/home/user/myproject') returns /home/user/myproject/.claude-dev/rules in dev mode
- [ ] Tests added to existing tests/backend/config/ test file
- [ ] All existing config tests still pass

## Files to Modify
- tests/backend/config/ (existing test file)

## Estimate
0.5h"

echo ""

# ============================================================
# TASK-7.2.1
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.2.1 backlog \
"# Add getProjectRules() and getUserRules() to projectDiscovery.js

## Objective
Add two discovery functions to src/backend/services/projectDiscovery.js that use the rules parser to return rules for a project or user scope.

## Acceptance Criteria
- [ ] getProjectRules(projectPath) calls parseAllRules with project rules dir and 'project' scope
- [ ] getProjectRules returns { rules: [...], warnings: [...] }
- [ ] getUserRules() calls parseAllRules with user rules dir and 'user' scope
- [ ] getUserRules returns { rules: [...], warnings: [...] }
- [ ] Both functions imported and exported from projectDiscovery.js
- [ ] rulesParser imported correctly from parsers

## Files to Modify
- src/backend/services/projectDiscovery.js

## Dependencies
- TASK-7.1.3 (parseAllRules must exist)

## Estimate
1h"

echo ""

# ============================================================
# TASK-7.2.2
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.2.2 backlog \
"# Update getProjectCounts() to include rules count

## Objective
Update getProjectCounts() (or equivalent count function) in projectDiscovery.js to include a rules property reflecting the number of rule files in the project.

## Acceptance Criteria
- [ ] getProjectCounts() return object includes rules: <number>
- [ ] Rules count = total .md files under .claude/rules/ (recursive)
- [ ] Projects with no rules directory show rules: 0 (not undefined)
- [ ] Count does not break when rules directory is missing
- [ ] Existing count fields (agents, commands, skills, hooks, mcp) unchanged

## Files to Modify
- src/backend/services/projectDiscovery.js

## Dependencies
- TASK-7.2.1 (getProjectRules must exist)

## Estimate
0.5h"

echo ""

# ============================================================
# TASK-7.2.3
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.2.3 backlog \
"# Add GET routes for project and user rules

## Objective
Add GET route handlers to src/backend/routes/projects.js and src/backend/routes/user.js for retrieving rules lists.

## Acceptance Criteria
- [ ] GET /:projectId/rules in projects.js returns { success: true, rules: [...], warnings: [...], projectId, projectPath }
- [ ] GET /:projectId/rules returns 404 with { success: false, error: 'Project not found' } for unknown project
- [ ] GET /user/rules in user.js returns { success: true, rules: [...], warnings: [...] }
- [ ] Both routes call discovery service (getProjectRules / getUserRules)
- [ ] Error responses use 500 status with { success: false, error: message }

## Files to Modify
- src/backend/routes/projects.js
- src/backend/routes/user.js

## Dependencies
- TASK-7.2.1

## Estimate
0.5h"

echo ""

# ============================================================
# TASK-7.2.4
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.2.4 backlog \
"# Add DELETE routes for project and user rules

## Objective
Add DELETE route handlers for project and user rules that support subdirectory names with forward slashes using Express wildcard routing.

## Acceptance Criteria
- [ ] DELETE /:projectId/rules/* in projects.js captures rule name including subdirectory slashes
- [ ] DELETE /user/rules/* in user.js captures rule name including subdirectory slashes
- [ ] Route constructs absolute file path: rulesDir + ruleName + .md
- [ ] Route calls existing deleteFile() utility from deleteService.js
- [ ] Successful deletion returns { success: true }
- [ ] File not found returns 404 with { success: false, error: 'Rule not found' }
- [ ] Wildcard parameter correctly captures 'frontend/react' from DELETE /rules/frontend/react

## Files to Modify
- src/backend/routes/projects.js
- src/backend/routes/user.js

## Dependencies
- TASK-7.2.3 (routes file already has rules section)

## Estimate
1h"

echo ""

# ============================================================
# TASK-7.2.5
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.2.5 backlog \
"# Update security middleware validResourcePrefixes

## Objective
Add 'rules' to the validResourcePrefixes array in the security middleware to allow rules API routes to pass path traversal validation.

## Acceptance Criteria
- [ ] 'rules' added to validResourcePrefixes array in security middleware
- [ ] Existing prefixes (agents, commands, skills, hooks, mcp) unchanged
- [ ] Security middleware test (if exists) updated to include rules
- [ ] Path traversal attack still blocked for rules routes

## Files to Modify
- src/backend/routes/ (middleware or security file containing validResourcePrefixes)

## Estimate
0.25h"

echo ""

# ============================================================
# TASK-7.2.6
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.2.6 backlog \
"# Write route unit tests for rules API

## Objective
Create unit tests for all rules API routes (GET and DELETE for both project and user scope) following existing route test patterns.

## Acceptance Criteria
- [ ] Test file created at tests/backend/routes/rules.test.js
- [ ] GET /:projectId/rules: success case returns rules array
- [ ] GET /:projectId/rules: unknown projectId returns 404
- [ ] GET /:projectId/rules: empty rules directory returns empty array with success:true
- [ ] GET /user/rules: success case returns user rules array
- [ ] DELETE /:projectId/rules/simple-name: deletes flat rule file
- [ ] DELETE /:projectId/rules/frontend/react: deletes nested rule file
- [ ] DELETE /:projectId/rules/nonexistent: returns 404
- [ ] DELETE /user/rules/simple-name: deletes user rule
- [ ] DELETE /user/rules/frontend/react: deletes nested user rule
- [ ] Rules count included in project counts response
- [ ] Minimum 20 tests

## Files to Create
- tests/backend/routes/rules.test.js

## Estimate
2h"

echo ""

# ============================================================
# TASK-7.3.1
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.3.1 backlog \
"# Add copyRule() method to CopyService

## Objective
Implement copyRule() in src/backend/services/copy-service.js following the copyAgent() pattern but without YAML frontmatter validation (frontmatter is optional for rules).

## Acceptance Criteria
- [ ] copyRule({ sourcePath, targetScope, targetProjectId, conflictStrategy }) implemented
- [ ] Reads source file content
- [ ] Determines target directory from targetScope (user rules dir or project rules dir)
- [ ] Calculates relative path from source rules base directory
- [ ] Target path = targetDir + relative path (preserves subdirectory structure)
- [ ] Calls handleConflict() when target file already exists
- [ ] Creates subdirectories recursively (fs.mkdir with recursive: true) before writing
- [ ] Writes file to target path
- [ ] Returns { success: true, targetPath } on success
- [ ] No YAML validation requirement (unlike copyAgent which validates frontmatter)

## Files to Modify
- src/backend/services/copy-service.js

## Dependencies
- TASK-7.1.1 (getUserRulesDir, getProjectRulesDir must exist)

## Implementation Notes
Reference copyAgent() for the overall structure. The key difference: rules do not require valid YAML frontmatter. findRulesBaseDir() helper must determine the source rules directory from the absolute file path.

## Estimate
1.5h"

echo ""

# ============================================================
# TASK-7.3.2
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.3.2 backlog \
"# Add buildTargetPath support for rules type

## Objective
Update buildTargetPath() in copy-service.js (if it exists as a shared method) to handle 'rules' as a valid resource type.

## Acceptance Criteria
- [ ] buildTargetPath called with type='rules' returns correct target path
- [ ] Rules target path preserves subdirectory structure relative to rules base dir
- [ ] If buildTargetPath is not a shared method, verify copyRule() correctly builds target path inline
- [ ] No regressions in existing buildTargetPath usage for agents, commands, skills, hooks, mcp

## Files to Modify
- src/backend/services/copy-service.js

## Dependencies
- TASK-7.3.1

## Estimate
0.5h"

echo ""

# ============================================================
# TASK-7.3.3
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.3.3 backlog \
"# Add POST /api/copy/rule route to copy.js

## Objective
Add the POST /copy/rule route handler to src/backend/routes/copy.js that delegates to copyService.copyRule().

## Acceptance Criteria
- [ ] POST /copy/rule route added to copy.js
- [ ] Route calls copyService.copyRule(req.body)
- [ ] Returns response from copyRule() directly
- [ ] Error handling: 500 status with { success: false, error: message }
- [ ] Route follows exact same pattern as existing /copy/agent, /copy/command, etc.

## Files to Modify
- src/backend/routes/copy.js

## Dependencies
- TASK-7.3.1

## Estimate
0.5h"

echo ""

# ============================================================
# TASK-7.3.4
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.3.4 backlog \
"# Write copy service unit tests for rules

## Objective
Create comprehensive unit tests for copyRule() in the copy-service test suite, following existing copy service test patterns.

## Acceptance Criteria
- [ ] Test file created at tests/backend/services/copy-service/copyRule.test.js
- [ ] Copy flat rule to project scope succeeds
- [ ] Copy nested rule (frontend/react.md) preserves subdirectory structure
- [ ] Copy to user scope uses correct user rules directory
- [ ] Skip conflict strategy: does not overwrite, returns appropriate result
- [ ] Overwrite conflict strategy: overwrites existing file
- [ ] Rename conflict strategy: creates file with new name
- [ ] Missing source file returns error
- [ ] Target subdirectories created when they do not exist
- [ ] project-to-project copy works
- [ ] project-to-user copy works
- [ ] user-to-project copy works
- [ ] Minimum 20 tests

## Files to Create
- tests/backend/services/copy-service/copyRule.test.js

## Estimate
2h"

echo ""

# ============================================================
# TASK-7.4.1
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.4.1 backlog \
"# Add rules methods to API client (client.js)

## Objective
Add five rules-related API methods to src/api/client.js following existing method patterns.

## Acceptance Criteria
- [ ] getProjectRules(projectId) calls GET /api/projects/{projectId}/rules
- [ ] getUserRules() calls GET /api/user/rules
- [ ] copyRule(payload) calls POST /api/copy/rule with payload body
- [ ] deleteProjectRule(projectId, name) calls DELETE /api/projects/{projectId}/rules/{encodedName}
- [ ] deleteUserRule(name) calls DELETE /api/user/rules/{encodedName}
- [ ] name parameter URL-encoded in both delete methods (encodeURIComponent) to support forward slashes
- [ ] All methods follow existing pattern (return this.get/post/delete)

## Files to Modify
- src/api/client.js

## Dependencies
- STORY-7.2 (backend routes must exist)

## Estimate
0.5h"

echo ""

# ============================================================
# TASK-7.4.2
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.4.2 backlog \
"# Add rules state and actions to Pinia store

## Objective
Add rules state, computed properties, and actions to the existing Pinia store (following the skills pattern as the most recently added config type).

## Acceptance Criteria
- [ ] State: rules: [] for current project rules
- [ ] State: userRules: [] for user-level rules
- [ ] State: rulesLoading: boolean
- [ ] Action: fetchProjectRules(projectId) calls API client and updates rules state
- [ ] Action: fetchUserRules() calls API client and updates userRules state
- [ ] Action: copyRule(payload) calls API client copyRule
- [ ] Action: deleteRule(scope, projectId, name) calls correct delete method based on scope
- [ ] rulesLoading set true before fetch, false after (including error case)
- [ ] Actions follow exact same pattern as skills actions in the store
- [ ] No regressions to existing store state/actions

## Files to Modify
- Pinia store file (identify correct store by reviewing skills implementation)

## Dependencies
- TASK-7.4.1

## Estimate
1h"

echo ""

# ============================================================
# TASK-7.4.3
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.4.3 backlog \
"# Add rules type support to ConfigItem and ConfigCard components

## Objective
Update ConfigItem and ConfigCard components to handle 'rules' as a valid type, adding display logic for conditional status and path patterns.

## Acceptance Criteria
- [ ] ConfigCard: 'rules' added to valid type prop values
- [ ] ConfigItem: itemName returns rule.name (relative path, e.g., frontend/react)
- [ ] ConfigItem: itemDescription returns conditional status string (Conditional or Always loaded)
- [ ] ConfigItem: conditional rules show path patterns as tags below description
- [ ] Rules icon defined: pi pi-book
- [ ] Rules color defined: #E53E3E (or per design system convention)
- [ ] ConfigItem handles rule.hasError = true with error indicator
- [ ] No regressions to existing config type display (agents, commands, skills, hooks, mcp)

## Files to Modify
- src/components/ConfigCard.vue (or equivalent)
- src/components/ConfigItem.vue (or equivalent)

## Implementation Notes
Review how skills type is handled in ConfigCard and ConfigItem - rules should follow the identical pattern with rules-specific field mappings.

## Estimate
1h"

echo ""

# ============================================================
# TASK-7.4.4
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.4.4 backlog \
"# Add Rules ConfigCard to project view and user view

## Objective
Add a Rules ConfigCard section to the project detail view and user/global configuration view using the existing reusable ConfigCard component.

## Acceptance Criteria
- [ ] Rules ConfigCard appears in project view alongside agents, commands, skills, hooks, mcp
- [ ] Rules ConfigCard appears in user view with scope: user indicator on each item
- [ ] ConfigCard bound to rules data from Pinia store
- [ ] ConfigCard shows 'No rules configured' message when rules array is empty
- [ ] Clicking a rule item triggers DetailSidebar to open with that rule
- [ ] Rules loading state shown while fetch is in progress
- [ ] fetchProjectRules called when project view loads (or project changes)
- [ ] fetchUserRules called when user view loads
- [ ] Visual position of Rules card is consistent with other config cards

## Files to Modify
- Project detail view component
- User/global view component

## Dependencies
- TASK-7.4.2, TASK-7.4.3

## Estimate
1h"

echo ""

# ============================================================
# TASK-7.4.5
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.4.5 backlog \
"# Add rules display to DetailSidebar

## Objective
Add rules-specific display logic to the DetailSidebar component so that selecting a rule shows full details with all relevant fields and action buttons.

## Acceptance Criteria
- [ ] Rule name displayed prominently
- [ ] Scope badge shown (Project or User)
- [ ] Conditional/unconditional status clearly indicated
- [ ] Path patterns displayed as a structured list (not raw YAML) when rule isConditional
- [ ] Full markdown content rendered (not raw text)
- [ ] File path displayed
- [ ] Delete button present: triggers confirmation dialog with rule name and file path
- [ ] Copy To button present: opens copy dialog for selecting target project/scope
- [ ] Close button present
- [ ] Footer buttons: Delete, Copy To, Close (matching existing pattern for agents/commands/skills)
- [ ] Parse error message shown prominently when rule.hasError is true
- [ ] No regressions to existing sidebar display for other config types

## Files to Modify
- src/components/DetailSidebar.vue (or equivalent)

## Dependencies
- TASK-7.4.2, TASK-7.4.3

## Estimate
1.5h"

echo ""

# ============================================================
# TASK-7.4.6
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.4.6 backlog \
"# Update dashboard ProjectCard with rules count

## Objective
Update the ProjectCard component in the dashboard to display the rules count alongside existing config type counts (agents, commands, hooks, mcp, skills).

## Acceptance Criteria
- [ ] ProjectCard stats grid displays rules count
- [ ] Rules count sourced from project.stats.rules (or equivalent field from /api/projects response)
- [ ] Projects with no rules show 0 (not undefined or blank)
- [ ] Default/fallback stats object updated to include rules: 0
- [ ] Visual layout remains consistent with other count items
- [ ] Rules label is 'Rules' (or abbreviated per design convention)

## Files to Modify
- ProjectCard component (or dashboard project list component)
- Any location defining default stats object with existing count fields

## Dependencies
- TASK-7.2.2 (backend must return rules in project counts)

## Estimate
0.5h"

echo ""

# ============================================================
# TASK-7.4.7
# ============================================================
node "$SCRIPTS_DIR/add_ticket.js" "$PROJECT" TASK-7.4.7 backlog \
"# Write frontend and E2E tests for rules

## Objective
Create frontend component tests and E2E tests for the rules feature following existing test patterns in tests/frontend/ and tests/e2e/.

## Acceptance Criteria
- [ ] Rules ConfigCard rendering tests: card displays, empty state, rule items with conditional/unconditional badges
- [ ] Rules DetailSidebar tests: opens on click, shows name/scope/content, shows path patterns for conditional rules, error indicator for rules with hasError
- [ ] Rules copy E2E test: select rule, click Copy To, select target, confirm, verify success toast
- [ ] Rules delete E2E test: select rule, click Delete, confirm dialog, verify rule removed from list
- [ ] Dashboard rules count test: project card displays rules count
- [ ] Subdirectory name test: rule named frontend/react displays correctly
- [ ] Minimum 33 tests, target 40+
- [ ] Tests pass at 80%+ pass rate (matching project standard)

## Files to Create
- tests/frontend/ (rules ConfigCard tests)
- tests/frontend/ (rules DetailSidebar tests)
- tests/e2e/ (rules copy flow)
- tests/e2e/ (rules delete flow)

## Dependencies
- TASK-7.4.4, TASK-7.4.5, TASK-7.4.6

## Estimate
3h"

echo ""
echo "All tickets added successfully."
