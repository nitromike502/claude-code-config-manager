# Implementation Outline Guide

**Purpose:** Create detailed implementation plans BEFORE coding to catch architectural issues, data structure mismatches, and design gaps early.

**When to Use:** End of Phase 1 (after orchestrator plan approval, before Phase 3 implementation)

**Key Principle:** 15 minutes of outlining prevents 2+ hours of debugging

---

## Table of Contents

1. [What Is An Implementation Outline?](#what-is-an-implementation-outline)
2. [When to Create an Outline](#when-to-create-an-outline)
3. [Real-World Evidence](#real-world-evidence)
4. [Outline Template](#outline-template)
5. [When Outline Reveals Problems](#when-outline-reveals-problems)
6. [Feature Parity Outlining](#feature-parity-outlining)
7. [Example: Delete Feature Outline](#example-delete-feature-outline)
8. [Related Documents](#related-documents)

---

## What Is An Implementation Outline?

An implementation outline is a written architectural specification created by the main agent showing:

1. **Architecture:** How components interact (with ASCII diagrams)
2. **Data Flow:** Where data comes from, how it transforms, where it goes
3. **File Changes:** Which files need modification, which are new
4. **Key Decisions:** What architectural choices were made and why
5. **Edge Cases:** What complications might arise and how to handle them
6. **Testing Strategy:** How this will be tested comprehensively

**Critical Distinction:**
- **Orchestrator Plan (Phase 1):** High-level task breakdown, dependencies, time estimates
- **Implementation Outline (End of Phase 1):** Low-level architectural specification with file paths, data structures, and decision rationale

---

## When to Create an Outline

### Always Create Outline For:

- **Multi-file changes** (3+ files modified)
- **New API endpoints** with frontend integration
- **New UI components** with backend integration
- **Feature parity work** (implementing existing feature for different entity type)
- **Data structure changes** affecting multiple layers (parser → API → store → component)
- **Any work estimated at 2+ hours**

### Skip Outline For:

- **Single-file bug fixes** (unless complex logic)
- **Documentation-only changes**
- **Test-only changes**
- **Simple configuration changes** (adding a color, updating a label)
- **Copy-paste changes** following established pattern exactly

### Feature Parity Requires Comparative Analysis:

When implementing features for a new entity type (e.g., Commands) that already exist for another entity (e.g., Agents):

**MANDATORY STEPS:**
1. Read reference implementation files (both frontend and backend)
2. Compare data structures (frontmatter properties, API responses, store state)
3. Identify differences and document them explicitly
4. Adjust architectural decisions based on actual differences

**See:** [Feature Parity Outlining](#feature-parity-outlining) section below

---

## Real-World Evidence

### Case Study: STORY-7.4 Command Edit/Delete (December 2025)

**Scenario:** Implementing edit/delete for Commands after successfully implementing for Agents

**Without Comparative Analysis:**
- **Session 3:** Main agent assumed Commands used same data structure as Agents
- **Result:** Specified delete button in wrong location (DetailSidebar only, not ConfigCard)
- **Bug Count:** 2 bugs requiring additional development session

**Without Implementation Outline:**
- **Session 5:** Proceeded directly to implementation without data structure comparison
- **Result:** Discovered Commands use `namespace + name` instead of single `path` property
- **Bug Count:** 5 bugs discovered mid-implementation
- **Debugging Time:** 40+ minutes (73% of session time)
- **Root Cause:** Commands have `filePath` property, not `path` like Agents

**Additional Discovery (Session 6):**
- During debugging, discovered duplicate parsing logic in two files
- Both parsers missing same 3 fields: `model`, `color`, `disableModelInvocation`
- Could have been caught with outline review of backend architecture

**Total Impact:**
- **Prevention Cost:** 15 minutes of comparative analysis + outlining
- **Actual Cost:** 3+ hours of debugging across 3 sessions
- **Code Waste:** 1 complete branch deletion and restart

**Lesson Learned:**
> "When implementing features for commands that already worked for agents, developers assumed structural equivalence without verification. 10-15 minutes of upfront comparative analysis would have prevented 3+ hours of debugging." - STORY-7.4 Synthesis Report

---

## Outline Template

```markdown
# Implementation Outline: [Feature] for [Entity]

**Date:** [YYYY-MM-DD]
**Task:** [STORY-X.X or TASK-X.X.X]
**Estimated Time:** [X hours]
**Outline Status:** [ ] Draft | [ ] Reviewed | [X] Approved

---

## Overview

[2-3 sentence description of what this implementation accomplishes]

---

## Comparative Analysis (for Feature Parity Work)

**Reference Implementation:** [Entity type already implemented, e.g., Agents]
**Target Implementation:** [Entity type being implemented, e.g., Commands]

### Data Structure Comparison

| Property | Agents | Commands | Notes |
|----------|--------|----------|-------|
| Identifier | `path` (string) | `namespace` + `name` (object) | Commands use composite key |
| File Path | `filePath` | `filePath` | Same |
| Location | Single file | Single file | Same |
| Frontmatter | `name`, `description`, `tools`, `model` | `name`, `description`, `model` | Commands lack `tools` |

### API Response Comparison

**Agents API Response:**
```javascript
{
  path: "subagent-orchestrator",
  name: "Subagent Orchestrator",
  filePath: "/abs/path/to/.claude/agents/subagent-orchestrator.md",
  // ...
}
```

**Commands API Response:**
```javascript
{
  namespace: "project",
  name: "swarm",
  filePath: "/abs/path/to/.claude/commands/swarm.md",
  // ...
}
```

### Key Differences Identified

1. **Identifier Construction:**
   - Agents: Use `path` directly as unique ID
   - Commands: Must construct ID from `${namespace}/${name}`

2. **Delete Button Locations:**
   - Agents: ConfigCard AND DetailSidebar (verified in AgentsView.vue line 87, DetailSidebar line 312)
   - Commands: Must match this pattern for UX consistency

3. **Edit Field Availability:**
   - Agents: Can edit `name`, `description`, `tools`, `model`, `color`
   - Commands: Can only edit `name`, `description`, `model` (no `tools` or `color`)

**Verification Complete:** [ ] AgentsView.vue read | [ ] CommandsView.vue read | [ ] Agent parser reviewed | [ ] Command parser reviewed

---

## Architecture Diagram

```
User Action Flow:
User Click → Vue Component → Pinia Store → API Client → Express Route → Parser → File System
                                                                                       ↓
User Sees ← Vue Component ← Pinia Store ← API Client ← Express Route ← Response ← Parse Result
```

**Component Interaction:**
```
CommandsView.vue
  ├── ConfigItemList (for cards display)
  │     └── ConfigCard
  │           └── DeleteButton (NEW)
  │
  └── ConfigDetailSidebar
        ├── InlineEditField × N (name, description, model)
        └── DeleteButton (NEW)
```

---

## Implementation Steps

### Backend Changes

#### 1. Parser Changes (if needed)

**File:** `src/backend/parsers/commandParser.js`

**Changes:**
- Add `updateCommand(projectPath, namespace, name, updates)` function
- Add `deleteCommand(projectPath, namespace, name)` function
- Validate frontmatter schema on update
- Preserve content below frontmatter on update

**New Functions:**
```javascript
async updateCommand(projectPath, namespace, name, updates) {
  // Read existing file
  // Parse frontmatter
  // Merge updates
  // Validate schema
  // Write back to file
}

async deleteCommand(projectPath, namespace, name) {
  // Construct file path from namespace + name
  // Verify file exists
  // Delete file
  // Return confirmation
}
```

**Edge Cases:**
- Invalid YAML in frontmatter → Validation error before write
- File doesn't exist → 404 error
- File permissions issue → 500 error with details

#### 2. API Endpoint Changes

**File:** `src/backend/routes/commands.js`

**New Endpoints:**
```javascript
PUT /api/projects/:projectId/commands/:namespace/:name
DELETE /api/projects/:projectId/commands/:namespace/:name
```

**Request/Response Specs:**

**PUT Request:**
```json
{
  "updates": {
    "name": "new-name",
    "description": "New description",
    "model": "haiku"
  }
}
```

**PUT Response (200):**
```json
{
  "success": true,
  "command": { /* updated command object */ }
}
```

**DELETE Response (200):**
```json
{
  "success": true,
  "message": "Command 'swarm' deleted successfully"
}
```

**Error Responses (4xx/5xx):**
```json
{
  "error": "Command not found",
  "details": "..."
}
```

### Frontend Changes

#### 1. Store Changes

**File:** `src/stores/commands.js`

**New Actions:**
```javascript
// Update command frontmatter
async updateCommand(projectId, namespace, name, updates) {
  const updatedCommand = await apiClient.updateCommand(projectId, namespace, name, updates);
  // Update store state
  return updatedCommand;
}

// Delete command
async deleteCommand(projectId, namespace, name) {
  await apiClient.deleteCommand(projectId, namespace, name);
  // Remove from store state
  // Close sidebar if this command was selected
}
```

**State Updates:**
- Replace updated command in `commands` array
- Remove deleted command from `commands` array
- Clear `selectedCommand` if deleted command was selected

#### 2. API Client Changes

**File:** `src/api/client.js`

**New Methods:**
```javascript
async updateCommand(projectId, namespace, name, updates) {
  return this.put(`/projects/${projectId}/commands/${namespace}/${name}`, { updates });
}

async deleteCommand(projectId, namespace, name) {
  return this.delete(`/projects/${projectId}/commands/${namespace}/${name}`);
}
```

#### 3. Component Changes

**File:** `src/components/ConfigCard.vue`

**Changes:**
- Add delete button to card footer (conditional: only for agents/commands)
- Wire to `@click="$emit('delete', item)"`
- Match styling from AgentsView implementation

**File:** `src/components/ConfigDetailSidebar.vue`

**Changes:**
- Add delete button at bottom of sidebar (before close button)
- Wire to `@click="$emit('delete')"`
- Include loading state during delete operation

**File:** `src/components/InlineEditField.vue`

**No Changes:** Already supports all field types needed

#### 4. View Changes

**File:** `src/views/CommandsView.vue`

**Changes:**
- Add `@delete` handler to ConfigCard instances
- Add `@delete` handler to ConfigDetailSidebar
- Add `@update` handler to InlineEditField instances
- Wire delete handlers to DeleteConfirmationModal
- Wire update handlers to store actions

**Delete Flow:**
```javascript
async handleDelete(command) {
  this.commandToDelete = command;
  this.showDeleteModal = true;
}

async confirmDelete() {
  await this.commandsStore.deleteCommand(
    this.projectId,
    this.commandToDelete.namespace,
    this.commandToDelete.name
  );
  this.showDeleteModal = false;
  this.showSuccessToast(`Command '${this.commandToDelete.name}' deleted`);
}
```

**Update Flow:**
```javascript
async handleUpdate(field, newValue) {
  await this.commandsStore.updateCommand(
    this.projectId,
    this.selectedCommand.namespace,
    this.selectedCommand.name,
    { [field]: newValue }
  );
  this.showSuccessToast(`Command updated`);
}
```

### Test Changes

#### 1. Backend Tests

**File:** `tests/backend/routes/commands.test.js`

**New Tests (minimum 20):**
- PUT endpoint success cases (valid updates, partial updates)
- PUT endpoint validation (invalid model, missing name)
- PUT endpoint error cases (command not found, file permissions)
- DELETE endpoint success
- DELETE endpoint error cases (command not found, file permissions)
- Integration: Update then delete
- Integration: Delete then verify 404 on GET

**Coverage Target:** 20+ tests minimum (10 update, 10 delete)

#### 2. Frontend/E2E Tests

**File:** `tests/e2e/commands-crud.spec.js`

**New Tests (minimum 15):**
- Edit command name inline
- Edit command description inline
- Edit command model via SelectButton
- Delete command from card
- Delete command from sidebar
- Cancel delete confirmation
- Delete command and verify removal from list
- Edit then delete workflow
- Error handling: Update invalid field
- Error handling: Delete non-existent command

**Coverage Target:** 15+ tests minimum

---

## Data Flow

### Update Flow

1. User clicks inline edit field (name/description) or SelectButton (model)
2. InlineEditField/SelectButton emits `@update` event
3. CommandsView calls `handleUpdate(field, newValue)`
4. Store action `updateCommand()` called
5. API client sends PUT to `/api/projects/:id/commands/:namespace/:name`
6. Backend route validates request
7. Parser reads command file, updates frontmatter, writes back
8. Backend returns updated command object
9. Store updates command in state
10. Component re-renders with new values
11. Success toast shown to user

### Delete Flow

1. User clicks delete button (on card OR in sidebar)
2. CommandsView calls `handleDelete(command)`
3. DeleteConfirmationModal shown with command details
4. User clicks "Delete" in modal
5. CommandsView calls `confirmDelete()`
6. Store action `deleteCommand()` called
7. API client sends DELETE to `/api/projects/:id/commands/:namespace/:name`
8. Backend route validates request
9. Parser deletes command file from filesystem
10. Backend returns success confirmation
11. Store removes command from state
12. If sidebar open with this command, close sidebar
13. Component re-renders list without deleted command
14. Success toast shown to user

---

## Edge Cases & Risk Mitigation

| Edge Case | Risk | Mitigation | Test Coverage |
|-----------|------|------------|---------------|
| User edits command name to duplicate | Name collision | Backend validation: Check if name already exists in namespace | backend test #4 |
| User deletes command while editing | Stale UI state | Clear selectedCommand in store on delete | e2e test #7 |
| Network failure during update | Lost changes, no feedback | Try-catch with error toast, optimistic UI rollback | e2e test #9 |
| File permissions prevent delete | Operation fails silently | Backend returns 500 with details, frontend shows error toast | backend test #8 |
| User edits command used by another config | Orphan references | Future: Add reference checking (not in scope for this story) | N/A (deferred) |
| Concurrent edits from multiple users | Last write wins | Acceptable risk (local filesystem, unlikely scenario) | N/A (documented limitation) |
| Command file has invalid YAML | Update fails | Backend parser validation before write, error response | backend test #3 |
| Empty command name | Invalid state | Frontend validation: Require non-empty, backend validation as backup | e2e test #10 |

---

## Questions & Assumptions

### Assumptions

- [X] Commands use `namespace` + `name` as composite identifier (verified in commandParser.js line 42)
- [X] Delete buttons appear in BOTH locations (ConfigCard AND Sidebar) per STORY-7.3 pattern (verified in AgentsView.vue)
- [X] InlineEditField component supports all field types needed (verified - no changes required)
- [ ] User does NOT want confirmation modal for edits, only for deletes (needs user confirmation)

### Open Questions

- [ ] Should we validate command name format (alphanumeric, hyphens only)?
- [ ] Should we prevent deletion of built-in commands (e.g., /swarm)?
- [ ] What happens if user deletes command and then clicks "undo" in toast?

**Resolution Required Before Implementation:** Questions must be answered or explicitly deferred

---

## Dependencies

### Must Be Completed First

- InlineEditField component must exist (already done in STORY-7.1)
- DeleteConfirmationModal component must exist (already done in STORY-7.1)
- Commands store must be functional (already done in Phase 2)

### Can Run in Parallel

- Backend endpoint implementation (PUT/DELETE routes)
- Frontend component wiring (view changes)
- Test creation (backend tests can run parallel to frontend tests)

**Parallelization Note:** Backend and frontend can be developed in parallel ONLY if interface contract (API spec) is clearly defined first (see "API Endpoint Changes" section above)

---

## Sign-Off Checklist

Before proceeding to Phase 3 implementation:

- [ ] Outline reviewed by main agent
- [ ] Comparative analysis completed for feature parity work (if applicable)
- [ ] Reference implementation consulted and differences documented
- [ ] Data structure comparison verified with actual code reading
- [ ] All assumptions verified or marked as open questions
- [ ] Edge cases identified with mitigation strategies
- [ ] API contract clearly specified (request/response formats)
- [ ] Test coverage targets set (minimum test counts)
- [ ] No obvious architectural gaps identified
- [ ] User questions answered or explicitly deferred

**Approval:** _______________ (Main Agent) | Date: _______________

**Ready to proceed to Phase 3 Implementation:** [ ] Yes | [ ] No (resolve issues first)

```

---

## When Outline Reveals Problems

### Red Flags During Outlining

If during outline creation you discover:

**Data Structure Uncertainty:**
- "I don't know which properties exist on this entity"
- "I'm not sure if this uses `path` or `filePath`"
- "I don't know the structure of the API response"

**Pattern Inconsistency:**
- "This doesn't match the reference implementation"
- "The orchestrator plan says X but the reference code does Y"
- "I'm seeing duplicate logic in two files"

**Architectural Gaps:**
- "I don't know which files to modify"
- "There's a dependency I didn't know about"
- "This requires changes to components I wasn't expecting"

**Validation Confusion:**
- "I'm not sure what fields are required"
- "I don't know what validation rules apply"
- "I don't know the valid values for this enum"

### Stop and Escalate

**DO NOT proceed to implementation with unresolved questions.**

**Instead:**

1. **Return to Planning Phase**
   - Re-read orchestrator plan to identify gaps
   - Identify which information is missing or assumed incorrectly

2. **Re-Consult Reference Code**
   - For feature parity work: Read BOTH reference entity files (frontend + backend)
   - Create explicit comparison table (see Comparative Analysis template)
   - Document ALL differences, not just obvious ones

3. **Update Comparative Analysis**
   - Add newly discovered differences to outline
   - Adjust architectural decisions based on actual data structures
   - Document why assumptions were wrong

4. **Ask Questions**
   - If user input needed: Present questions clearly with context
   - If specification ambiguous: Ask for clarification
   - If multiple valid approaches: Present options with pros/cons

5. **Revise Outline**
   - Incorporate answers into outline
   - Mark assumptions as "verified" with evidence
   - Get approval before proceeding

### Example: Discovering Data Structure Mismatch

**During Outline Creation:**
```markdown
## Data Flow
1. User clicks delete on command
2. Store calls deleteCommand(projectId, path)  // ⚠️ Wait, do commands have "path"?
```

**STOP - Verify Assumption:**
```bash
# Read command parser to verify data structure
Read src/backend/parsers/commandParser.js
```

**Discovery:**
```javascript
// Commands use namespace + name, NOT path!
{
  namespace: "project",
  name: "swarm",
  filePath: "/abs/path/..."  // ⚠️ This is different from "path"
}
```

**Update Outline:**
```markdown
## Data Flow (CORRECTED)
1. User clicks delete on command
2. Store calls deleteCommand(projectId, namespace, name)  // ✓ Uses composite key
```

**Result:** Bug prevented before any code written

---

## Feature Parity Outlining

### What Is Feature Parity?

**Definition:** Implementing a feature for a new entity type that already exists for a different entity type

**Examples:**
- Edit/Delete for Commands (when already done for Agents)
- Copy for Skills (when already done for Agents and Commands)
- Search for Hooks (when already done for Agents)

### Why Feature Parity Needs Comparative Analysis

**Common Mistake:** Assuming entities are structurally identical

**Reality:** Even similar entities have subtle differences:
- Different identifier schemes (single property vs. composite key)
- Different frontmatter properties (agents have `tools`, commands don't)
- Different API response shapes
- Different file locations or structures

**Without Comparative Analysis:**
- Incorrect architectural decisions
- Bugs discovered mid-implementation
- Wasted time on debugging "why doesn't this work?"

**With Comparative Analysis:**
- Correct architecture from the start
- Bugs prevented before code written
- Implementation time reduced by 50-70%

### Comparative Analysis Template

```markdown
## Comparative Analysis: [Target Entity] based on [Reference Entity]

### Step 1: Data Structure Comparison

**Read these files:**
- [ ] Reference entity parser: `src/backend/parsers/[reference]Parser.js`
- [ ] Target entity parser: `src/backend/parsers/[target]Parser.js`
- [ ] Reference entity store: `src/stores/[reference].js`
- [ ] Target entity store: `src/stores/[target].js`

**Create comparison table:**

| Property | Reference Entity | Target Entity | Impact on Implementation |
|----------|------------------|---------------|--------------------------|
| Identifier | [property name] | [property name] | [how this affects code] |
| File Path | [property name] | [property name] | [how this affects code] |
| Unique Fields | [list] | [list] | [how this affects code] |

### Step 2: API Response Comparison

**Reference API Response:**
```json
[paste actual response from reference API endpoint]
```

**Target API Response:**
```json
[paste actual response from target API endpoint]
```

**Differences Identified:**
1. [Difference 1 with explanation]
2. [Difference 2 with explanation]

### Step 3: UI Pattern Comparison

**Read these files:**
- [ ] Reference view: `src/views/[Reference]View.vue`
- [ ] Target view: `src/views/[Target]View.vue`

**UI Pattern Differences:**
- Button placement: [where are action buttons in reference vs. target?]
- Field availability: [what fields can be edited in each?]
- Validation rules: [any different validation between entities?]

### Step 4: Implementation Adjustments

**Based on comparative analysis, adjust implementation:**

| Original Plan | Adjustment Needed | Reason |
|---------------|-------------------|--------|
| [original approach] | [adjusted approach] | [why adjustment needed] |

### Step 5: Verification

- [ ] All differences documented
- [ ] Implementation plan adjusted for all differences
- [ ] No assumptions remaining - everything verified with code reading
```

### Real-World Example: Commands vs. Agents

**Scenario:** Implementing delete for Commands after implementing for Agents

**Comparative Analysis Reveals:**

| Aspect | Agents | Commands | Impact |
|--------|--------|----------|--------|
| Identifier | Single `path` string | `namespace` + `name` composite | Must construct ID differently in delete function |
| API Endpoint | `/agents/:path` | `/commands/:namespace/:name` | Different URL structure |
| Frontmatter | Has `tools` array | No `tools` field | Edit UI only shows name/description/model |
| Delete Locations | Card + Sidebar | Card + Sidebar | Same pattern (verified by reading AgentsView.vue) |

**Result:** Implementation proceeds with correct architecture, zero identifier-related bugs

---

## Example: Delete Feature Outline

```markdown
# Implementation Outline: Delete for Skills

**Date:** 2025-12-07
**Task:** STORY-7.5
**Estimated Time:** 5-6 hours
**Outline Status:** [X] Approved

---

## Overview

Add delete functionality for Skills, mirroring the Commands delete implementation. Skills are directory-based (not single files), requiring recursive directory deletion and external reference checking.

---

## Comparative Analysis

**Reference Implementation:** Commands (single file delete)
**Target Implementation:** Skills (directory delete)

### Data Structure Comparison

| Property | Commands | Skills | Impact |
|----------|----------|--------|--------|
| Identifier | `namespace` + `name` | `name` (directory name) | Simpler ID construction |
| Storage | Single .md file | Directory with SKILL.md + supporting files | Requires recursive delete |
| Location | `.claude/commands/` | `.claude/skills/[name]/` | Different path construction |

### Key Differences

1. **File Structure:**
   - Commands: Single file (`swarm.md`)
   - Skills: Directory with multiple files (`skill-name/SKILL.md`, `skill-name/helper.js`, etc.)

2. **Delete Operation:**
   - Commands: `fs.unlink(filePath)` (single file)
   - Skills: `fs.rm(dirPath, { recursive: true })` (directory with contents)

3. **Risk Level:**
   - Commands: Low risk (single file, no dependencies)
   - Skills: Higher risk (recursive delete, potential for external references)

**Verification Complete:** [X] Commands delete code read | [X] Skills parser structure reviewed | [X] Skills data model verified

---

## Architecture

```
Delete Button Click → skillsStore.deleteSkill() → apiClient.deleteSkill(projectId, name)
    ↓
DELETE /api/projects/:id/skills/:name → skillParser.deleteSkill(projectPath, name)
    ↓
fs.rm(skillDir, {recursive: true, force: true}) → Return success
```

---

## Implementation Steps

### Backend

1. **Add DELETE endpoint to skills routes**
   - File: `src/backend/routes/skills.js`
   - Route: `DELETE /api/projects/:projectId/skills/:name`
   - Error handling: 404 if skill not found, 500 if filesystem error

2. **Add deleteSkill function to skillParser**
   - File: `src/backend/parsers/skillParser.js`
   - Function: `async deleteSkill(projectPath, name)`
   - Use: `fs.rm(skillDir, { recursive: true, force: true })`
   - Validate: Skill directory exists before delete

3. **Add reference checking (future enhancement marker)**
   - Comment in code: "TODO: Check if skill is referenced by agents/commands"
   - Return warning in response if references exist (implement later)

### Frontend

1. **Add deleteSkill action to skills store**
   - File: `src/stores/skills.js`
   - Remove skill from state after successful delete
   - Close sidebar if deleted skill was selected

2. **Add deleteSkill method to API client**
   - File: `src/api/client.js`
   - Method: `async deleteSkill(projectId, name)`

3. **Add delete button to skill cards**
   - File: `src/views/SkillsView.vue`
   - Wire to ConfigCard: `@delete="handleDelete"`
   - Match pattern from CommandsView

4. **Add delete button to skill sidebar**
   - File: Same as above
   - Wire to ConfigDetailSidebar: `@delete="handleDeleteSelected"`

5. **Wire up DeleteConfirmationModal**
   - File: Same as above
   - Show modal on delete button click
   - Call store action on confirm

---

## Edge Cases

| Edge Case | Risk | Mitigation | Test |
|-----------|------|------------|------|
| Skill directory has nested subdirectories | Incomplete deletion | Use `recursive: true` flag | Backend test #3 |
| Skill has external file references | References break after delete | Show warning in modal (implement reference check later) | Backend test #5 |
| Skill referenced by agent | Agent has broken reference | Show warning message, require confirmation | Future enhancement |
| Filesystem permissions prevent delete | Silent failure | Return 500 error with details, show error toast | Backend test #4 |
| Network timeout during delete | Orphaned state | Refetch skills list on error | E2E test #8 |

---

## Testing Strategy

### Backend Tests (15 minimum)

**File:** `tests/backend/parsers/skillParser.test.js`

1. Delete skill success - single file in directory
2. Delete skill success - multiple files in directory
3. Delete skill success - nested subdirectories
4. Delete skill error - skill doesn't exist (404)
5. Delete skill warning - external references detected
6. Delete skill validation - empty name rejected
7. Delete skill validation - path traversal attempt rejected
8. Delete skill integration - create then delete

**File:** `tests/backend/routes/skills.test.js`

9. DELETE endpoint success
10. DELETE endpoint 404
11. DELETE endpoint 500 (filesystem error simulation)
12. DELETE endpoint validation (invalid project ID)
13. DELETE endpoint validation (invalid skill name)
14. DELETE endpoint authorization (if applicable)
15. DELETE endpoint idempotency (delete already deleted skill)

### Frontend/E2E Tests (10 minimum)

**File:** `tests/e2e/skills-crud.spec.js`

1. Delete skill from card
2. Delete skill from sidebar
3. Cancel delete confirmation
4. Delete skill and verify removal from list
5. Delete skill and verify sidebar closes
6. Delete skill with external references - warning shown
7. Delete non-existent skill - error shown
8. Network error during delete - error toast shown
9. Delete skill and verify filesystem (using test fixtures)
10. Delete multiple skills in sequence

---

## Sign-Off Checklist

- [X] Comparative analysis completed (Commands vs. Skills)
- [X] Recursive deletion approach verified
- [X] External reference checking designed (deferred to future)
- [X] Edge cases identified with mitigations
- [X] Test coverage targets set (25 tests minimum)
- [X] No blocking questions remaining
- [X] Matches established CRUD patterns

**Approval:** Main Agent | Date: 2025-12-07

**Ready to proceed to Phase 3 Implementation:** [X] Yes
```

---

## Related Documents

### Before Outlining

- **SWARM-WORKFLOW.md** - Phase 1 creates orchestrator plan; outline happens at end of Phase 1
- **DEVELOPMENT-STRATEGIES.md** - Choose workflow strategy before creating outline

### During Outlining

- **SPEC-IMPLEMENTATION-GUIDE.md** - For implementing from official specifications
- **CODING-STANDARDS.md** - Code style and conventions to follow

### After Outlining

- **TESTING-GUIDE.md** - Test creation and execution guidelines
- **GIT-WORKFLOW.md** - Commit and branch conventions for implementation

### Reference for Feature Parity

- **FEATURE-PARITY-IMPLEMENTATION-GUIDE.md** - Complete workflow for implementing features across entity types
- **Create comparison table:** Read both reference and target entity files
- **Verify assumptions:** Use Read tool to check actual code, not assumptions
- **Document differences:** Explicit comparison prevents bugs

---

## Appendix: Quick Reference Checklist

**Before starting implementation, verify:**

- [ ] Architecture diagram created showing component interactions
- [ ] Data flow documented for all user actions
- [ ] All files to modify identified with absolute paths
- [ ] API contract specified (request/response formats)
- [ ] Edge cases identified with mitigation strategies
- [ ] Test coverage targets set
- [ ] For feature parity: Comparative analysis completed
- [ ] For feature parity: Data structure differences documented
- [ ] For feature parity: Reference implementation read and verified
- [ ] All assumptions verified with code reading
- [ ] Open questions answered or explicitly deferred
- [ ] Main agent approved outline

**If any checkbox is unchecked, DO NOT proceed to Phase 3 implementation.**

Return to planning, read more code, ask questions, or update outline until all boxes checked.
