# STORY-7.3 Architecture Analysis: Agent CRUD Implementation

**Date:** December 2, 2025
**Purpose:** Reverse-engineer the working agent CRUD implementation to guide command CRUD development
**Status:** ✅ STORY-7.3 Complete and Working

---

## Executive Summary

STORY-7.3 successfully implemented agent edit and delete operations using an **inline editing pattern** with three-tier architecture:

1. **Backend**: Express routes + service layer (updateService, deleteService, referenceChecker)
2. **Frontend State**: Pinia store + API client
3. **Frontend UI**: ConfigDetailSidebar (inline editing) + DeleteConfirmationModal + event propagation

The implementation is **production-ready**, fully tested, and follows a clean architecture that can be copied exactly for commands.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
├─────────────────────────────────────────────────────────────────┤
│  ProjectDetail.vue                                              │
│  - Owns delete modal state                                      │
│  - Handles agent-delete, agent-updated events                   │
│  - Calls store actions                                          │
│  - Refreshes data after operations                              │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ConfigPageLayout.vue                                      │ │
│  │ - Forwards events from child components to parent        │ │
│  │ - @agent-delete, @agent-updated event passthrough       │ │
│  │                                                           │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ ConfigDetailSidebar.vue                             │ │ │
│  │ │ - Inline editing with LabeledEditField              │ │ │
│  │ │ - Calls store.updateAgent on field save             │ │ │
│  │ │ - Emits agent-updated after successful edit         │ │ │
│  │ │                                                      │ │ │
│  │ │ ┌────────────────────────────────────────────────┐ │ │ │
│  │ │ │ LabeledEditField.vue (reusable component)     │ │ │ │
│  │ │ │ - Edit button per field                        │ │ │ │
│  │ │ │ - Inline edit/save/cancel                      │ │ │ │
│  │ │ │ - Emits edit-accept with new value             │ │ │ │
│  │ │ └────────────────────────────────────────────────┘ │ │ │
│  │ │                                                      │ │ │
│  │ │ ┌────────────────────────────────────────────────┐ │ │ │
│  │ │ │ ConfigItemList.vue (footer delete button)     │ │ │ │
│  │ │ │ - Delete button in sidebar footer             │ │ │ │
│  │ │ │ - Emits delete-clicked                         │ │ │ │
│  │ │ └────────────────────────────────────────────────┘ │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  DeleteConfirmationModal.vue                                    │
│  - Shared modal for all delete operations                       │
│  - Shows references, confirmation UI                            │
│  - Emits confirm/cancel events                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      State Management Layer                     │
├─────────────────────────────────────────────────────────────────┤
│  useAgentsStore (Pinia)                                         │
│  - updateAgent(projectId, agentName, updates, scope)            │
│  - deleteAgent(projectId, agentName, scope)                     │
│  - checkAgentReferences(projectId, agentName, scope)            │
│  - Updates reactive state (projectAgents, userAgents)           │
│  - Shows success/error notifications                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API Client Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  api/client.js                                                  │
│  - updateProjectAgent(projectId, agentName, updates)            │
│  - deleteProjectAgent(projectId, agentName)                     │
│  - getProjectAgentReferences(projectId, agentName)              │
│  - updateUserAgent(agentName, updates)                          │
│  - deleteUserAgent(agentName)                                   │
│  - getUserAgentReferences(agentName)                            │
│  - Handles HTTP requests with proper headers                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Backend API Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  routes/projects.js                                             │
│  - PUT /api/projects/:projectId/agents/:agentName               │
│  - DELETE /api/projects/:projectId/agents/:agentName            │
│  - GET /api/projects/:projectId/agents/:agentName/references    │
│                                                                  │
│  routes/user.js                                                 │
│  - PUT /api/user/agents/:agentName                              │
│  - DELETE /api/user/agents/:agentName                           │
│  - GET /api/user/agents/:agentName/references                   │
│                                                                  │
│  Validation:                                                    │
│  - validateProjectId middleware                                 │
│  - validateAgentName middleware                                 │
│  - Request body validation                                      │
│  - Property-specific validation (model, color, etc.)            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Service Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  updateService.js                                               │
│  - updateYamlFrontmatter(filePath, updates)                     │
│  - updateFile(filePath, content)                                │
│  - Handles frontmatter + body updates                           │
│                                                                  │
│  deleteService.js                                               │
│  - deleteFile(filePath)                                         │
│  - Returns error if file not found                              │
│                                                                  │
│  referenceChecker.js                                            │
│  - findReferences(type, name, projectPath)                      │
│  - Scans agents, commands, skills, hooks for references         │
│  - Returns array of reference locations                         │
│                                                                  │
│  parsers/subagentParser.js                                      │
│  - parseSubagent(filePath, scope)                               │
│  - Returns parsed agent object                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         File System                             │
├─────────────────────────────────────────────────────────────────┤
│  .claude/agents/agent-name.md                                   │
│  ~/.claude/agents/agent-name.md (user-level)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Event Flow: Inline Editing

### Scenario: User edits agent description

1. **User Action**: Click "Edit" button next to "Description" field in sidebar
2. **LabeledEditField**: Emits `edit-start` event
   - `editingField = 'description'` (blocks other fields)
3. **User Action**: Modify text, click "Save"
4. **LabeledEditField**: Emits `edit-accept` event with new value
5. **ConfigDetailSidebar.handleFieldUpdate('description', newValue)**:
   - Calls `agentsStore.updateAgent(projectId, agentName, { description: newValue }, 'project')`
6. **Store Action**:
   - Calls `api.updateProjectAgent(projectId, agentName, { description: newValue })`
7. **API Client**:
   - `PUT /api/projects/${projectId}/agents/${agentName}`
   - Body: `{ description: newValue }`
8. **Backend Route Handler**:
   - Validates request body
   - Validates description (min 10 chars)
   - Calls `updateYamlFrontmatter(agentFilePath, { description: newValue })`
9. **Update Service**:
   - Reads file, parses YAML frontmatter
   - Merges updates into frontmatter
   - Writes updated file
10. **Backend Response**: `{ success: true, agent: updatedAgent }`
11. **Store Updates**:
    - Updates `projectAgents.value.get(projectId)` array
    - Shows success notification
    - Returns `{ success: true, agent }`
12. **ConfigDetailSidebar**:
    - Updates `agentData.value.description = newValue`
    - Emits `agent-updated` event
13. **ProjectDetail.handleAgentUpdated()**:
    - Calls `loadAgents()` to refresh agent list
14. **UI Updates**: Sidebar shows updated value, list refreshed

---

## Event Flow: Delete with References

### Scenario: User deletes an agent

1. **User Action**: Click "Delete" button in sidebar footer (ConfigItemList)
2. **ConfigItemList**: Emits `delete-clicked(agent)`
3. **ConfigPageLayout**: Forwards event → `$emit('agent-delete', agent)`
4. **ProjectDetail.handleAgentDelete(agent)**:
   - Sets `deletingAgent.value = agent`
   - Sets `agentDeleteLoading.value = true`
   - Calls `agentsStore.checkAgentReferences(projectId, agentName, 'project')`
5. **Store Action**:
   - Calls `api.getProjectAgentReferences(projectId, agentName)`
6. **API Client**:
   - `GET /api/projects/${projectId}/agents/${agentName}/references`
7. **Backend Route Handler**:
   - Calls `findReferences('agent', agentName, projectPath)`
8. **Reference Checker Service**:
   - Scans `.claude/agents/` for mentions of agent name
   - Scans `.claude/commands/` for agent invocations
   - Scans `.claude/skills/` for agent references
   - Scans hooks in settings.json for agent references
9. **Backend Response**:
   ```json
   {
     "success": true,
     "agentName": "test-agent",
     "references": [
       {
         "type": "command",
         "file": "git/commit.md",
         "location": "Uses test-agent for git operations"
       }
     ],
     "hasReferences": true,
     "referenceCount": 1
   }
   ```
10. **ProjectDetail**:
    - Sets `agentReferences.value = result.references`
    - Sets `showDeleteDialog.value = true`
11. **DeleteConfirmationModal Appears**:
    - Shows "Delete Agent: test-agent"
    - Lists references: "1 command uses this agent"
    - Shows "Cancel" and "Delete Anyway" buttons
12. **User Action**: Click "Delete Anyway"
13. **DeleteConfirmationModal**: Emits `confirm` event
14. **ProjectDetail.handleAgentDeleteConfirm()**:
    - Calls `agentsStore.deleteAgent(projectId, agentName, 'project')`
15. **Store Action**:
    - Calls `api.deleteProjectAgent(projectId, agentName)`
16. **API Client**:
    - `DELETE /api/projects/${projectId}/agents/${agentName}`
17. **Backend Route Handler**:
    - Calls `deleteFile(agentFilePath)`
18. **Delete Service**:
    - Uses `fs.unlink()` to delete file
    - Returns error if file not found
19. **Backend Response**: `{ success: true, message: "Agent deleted" }`
20. **Store Updates**:
    - Removes agent from `projectAgents.value.get(projectId)` array
    - Shows success notification
21. **ProjectDetail**:
    - Sets `showDeleteDialog.value = false`
    - Calls `loadAgents()` to refresh list
22. **UI Updates**: Modal closes, agent removed from list

---

## File Change Summary

### Backend Files Modified

| File | Lines | Changes | Purpose |
|------|-------|---------|---------|
| `src/backend/routes/projects.js` | 447-727 | Added 3 endpoints | Agent CRUD routes |
| `src/backend/routes/user.js` | 159-408 | Added 3 endpoints | User agent CRUD routes |
| `tests/backend/routes/agent-crud.test.js` | 1-600+ | New file | Comprehensive backend tests |

**No changes to services** - Reused existing:
- `updateService.js` (already existed)
- `deleteService.js` (already existed)
- `referenceChecker.js` (already existed)

### Frontend Files Modified

| File | Lines | Changes | Purpose |
|------|-------|---------|---------|
| `src/stores/agents.js` | 20-180 | Added 3 actions | CRUD operations |
| `src/api/client.js` | 297-397 | Added 6 functions | API methods for project and user agents |
| `src/components/sidebars/ConfigDetailSidebar.vue` | 60-139, 440-502 | Added inline editing | LabeledEditField integration |
| `src/components/layouts/ConfigPageLayout.vue` | 66, 187-189, 372 | Event forwarding | Pass delete/update events to parent |
| `src/components/ProjectDetail.vue` | 47-48, 366-420, 556 | Delete handlers | Modal state, delete workflow |
| `tests/e2e/107-agent-crud-operations.spec.js` | 1-500+ | New file | E2E tests for CRUD workflows |

---

## Key Implementation Patterns

### Pattern 1: Two-Scope Support (Project + User)

**Challenge**: Agents can be project-level or user-level. Code must handle both.

**Solution**: `scope` parameter in all operations

```javascript
// Store action signature
async function updateAgent(projectId, agentName, updates, scope) {
  // Validate scope
  if (!['project', 'user'].includes(scope)) {
    throw new Error('Invalid scope')
  }

  // Call appropriate API based on scope
  const result = scope === 'project'
    ? await api.updateProjectAgent(projectId, agentName, updates)
    : await api.updateUserAgent(agentName, updates)

  // Update appropriate state
  if (scope === 'project') {
    const agents = projectAgents.value.get(projectId) || []
    // ... update project agents
  } else {
    // ... update user agents
  }
}
```

**Commands Must Copy This**: Commands also have project and user scopes.

---

### Pattern 2: Inline Editing (One Field at a Time)

**Challenge**: Edit 8+ properties without overwhelming the UI.

**Solution**: LabeledEditField component with inline edit mode

```vue
<!-- Each field gets its own edit button -->
<LabeledEditField
  v-model="agentData.description"
  field-type="textarea"
  label="Description"
  :disabled="!canEdit || editingField !== null && editingField !== 'description'"
  @edit-start="editingField = 'description'"
  @edit-cancel="editingField = null"
  @edit-accept="handleFieldUpdate('description', $event)"
/>
```

**Key Features**:
- Edit button appears on hover
- Clicking edit shows input field (textarea, select, etc.)
- Save/cancel buttons inline
- Only one field editable at a time (`editingField !== null` disables others)
- Immediate save on "Save" click (no batch update needed)

**Commands Should Copy This**: Same pattern works perfectly for command properties.

---

### Pattern 3: Smart Body Content Handling

**Challenge**: Agent files have YAML frontmatter + body content. Both need updating.

**Solution**: Special handling for `systemPrompt` field

```javascript
// In backend PUT endpoint (lines 556-612)
if (updates.systemPrompt !== undefined) {
  // Read entire file
  const content = await fs.readFile(agentFilePath, 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

  // Parse frontmatter
  let frontmatter = yaml.load(match[1]) || {}

  // Merge frontmatter updates (excluding systemPrompt)
  frontmatter = { ...frontmatter, ...updates }
  delete updates.systemPrompt // Don't put in frontmatter

  // Clean systemPrompt (strip any embedded frontmatter)
  let cleanSystemPrompt = updates.systemPrompt
  if (cleanSystemPrompt.match(/^---\n/)) {
    // systemPrompt accidentally contains frontmatter, extract body only
    cleanSystemPrompt = cleanSystemPrompt.match(/---\n[\s\S]*?\n---\n([\s\S]*)/)[1]
  }

  // Add blank line between frontmatter and body
  cleanSystemPrompt = '\n\n' + cleanSystemPrompt.replace(/^\n+/, '')

  // Write complete file
  const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 })
  const newContent = `---\n${yamlStr}---${cleanSystemPrompt}`
  await updateFile(agentFilePath, newContent)
} else {
  // Only frontmatter updates
  await updateYamlFrontmatter(agentFilePath, updates)
}
```

**Commands Must Adapt**: Replace `systemPrompt` with `content` field.

---

### Pattern 4: Reference Checking Before Delete

**Challenge**: Deleting an agent breaks configs that use it. Warn user first.

**Solution**: Check references endpoint + modal with reference list

```javascript
// Before showing delete modal
const result = await agentsStore.checkAgentReferences(projectId, agentName, scope)
agentReferences.value = result.references || []
showDeleteDialog.value = true

// Modal shows references
<DeleteConfirmationModal
  :dependent-items="agentReferences"
  @confirm="handleAgentDeleteConfirm"
/>
```

**Reference Checker Service** scans:
- Other agents (for mentions in systemPrompt)
- Commands (for `/invoke-agent <agent-name>`)
- Skills (for agent references in SKILL.md)
- Hooks (for agent names in hook commands)

**Commands Should Copy**: Check commands and skills for command references.

---

### Pattern 5: Validation Layers

**Challenge**: Prevent invalid data from corrupting files.

**Solution**: Three validation layers

1. **Middleware Validation** (parameter format):
   ```javascript
   function validateAgentName(req, res, next) {
     const { agentName } = req.params
     if (!/^[a-z0-9_-]{1,64}$/.test(agentName)) {
       return res.status(400).json({ error: 'Invalid agent name format' })
     }
     next()
   }
   ```

2. **Request Body Validation** (data presence):
   ```javascript
   if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
     return res.status(400).json({ error: 'Invalid request body' })
   }
   if (Object.keys(updates).length === 0) {
     return res.status(400).json({ error: 'Request body must contain at least one property' })
   }
   ```

3. **Property-Specific Validation** (data values):
   ```javascript
   // Description validation
   if (updates.description !== undefined) {
     if (typeof updates.description !== 'string' || updates.description.trim().length < 10) {
       return res.status(400).json({ error: 'Description must be at least 10 characters' })
     }
   }

   // Model validation
   const validModels = ['sonnet', 'opus', 'haiku', 'inherit']
   if (updates.model !== undefined && !validModels.includes(updates.model)) {
     return res.status(400).json({ error: 'Invalid model' })
   }

   // Color validation
   const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'yellow', 'pink', 'indigo', 'teal']
   if (updates.color !== undefined && updates.color !== null && !validColors.includes(updates.color)) {
     return res.status(400).json({ error: 'Invalid color' })
   }
   ```

**Commands Must Adapt**: Different property validations (no permissionMode, add argument-hint).

---

## Agent vs Command Property Comparison

| Property | Agents | Commands | Validation |
|----------|--------|----------|------------|
| **name** | ✅ Required (filename) | ✅ Required (filename) | Lowercase, alphanumeric, hyphens, underscores, max 64 chars |
| **description** | ✅ Required | ⚠️ Optional | Min 10 chars (agents), optional (commands) |
| **tools** | ✅ Optional (array) | N/A | Built-in tools + MCP tools |
| **allowed-tools** | N/A | ✅ Optional (array) | Built-in tools + MCP tools |
| **model** | ✅ Optional | ✅ Optional | sonnet, opus, haiku, inherit |
| **color** | ✅ Optional | ✅ Optional | 10 valid colors |
| **permissionMode** | ✅ Optional | ❌ Not supported | default, acceptEdits, bypassPermissions, plan, ignore |
| **skills** | ✅ Optional (array) | ❌ Not supported | List of skill names |
| **argument-hint** | ❌ Not supported | ✅ Optional | String (e.g., "<file>") |
| **disable-model-invocation** | ❌ Not supported | ✅ Optional | Boolean |
| **systemPrompt** (body) | ✅ Required | N/A | Min 20 chars |
| **content** (body) | N/A | ✅ Required | Markdown content |

**Key Takeaways for Commands**:
- Fewer properties (simpler!)
- No permissionMode, no skills
- Add argument-hint, disable-model-invocation
- Body field is `content` not `systemPrompt`
- Frontmatter field is `allowed-tools` not `tools`

---

## Nested Path Handling (Critical for Commands)

**Agents**: Flat structure (`agent-name.md`)
- File path: `.claude/agents/agent-name.md`
- URL parameter: `:agentName` (simple string)
- No encoding needed

**Commands**: Nested structure (`utils/helper.md`)
- File path: `.claude/commands/utils/helper.md`
- URL parameter: `:commandPath` (may contain slashes)
- **URL encoding REQUIRED**

### URL Encoding Examples

```javascript
// Frontend API call
const commandPath = 'utils/helper.md'
const encodedPath = encodeURIComponent(commandPath) // 'utils%2Fhelper.md'
const response = await fetch(`/api/projects/${projectId}/commands/${encodedPath}`)

// Backend route handler
router.put('/:projectId/commands/:commandPath', (req, res) => {
  const { commandPath } = req.params // 'utils%2Fhelper.md'
  const decodedPath = decodeURIComponent(commandPath) // 'utils/helper.md'

  // Construct file path
  const commandFilePath = path.join(projectPath, '.claude', 'commands', decodedPath)
  // Result: '/home/user/project/.claude/commands/utils/helper.md'
})
```

### Validation for Nested Paths

```javascript
function validateCommandPath(req, res, next) {
  const { commandPath } = req.params
  const decoded = decodeURIComponent(commandPath)

  // Must end with .md
  if (!decoded.endsWith('.md')) {
    return res.status(400).json({ error: 'Command path must end with .md' })
  }

  // No path traversal
  if (decoded.includes('..') || decoded.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid command path' })
  }

  next()
}
```

### Directory Creation for Nested Renames

```javascript
// When renaming to nested path, ensure directory exists
if (updates.name && updates.name !== commandPath) {
  const newFilePath = path.join(projectPath, '.claude', 'commands', updates.name)
  const newDir = path.dirname(newFilePath)

  // Create directory if it doesn't exist
  await fs.mkdir(newDir, { recursive: true })

  // Check for conflicts
  try {
    await fs.access(newFilePath)
    return res.status(409).json({ error: 'Command already exists' })
  } catch {
    // Good - doesn't exist
  }

  // Rename file
  await fs.rename(commandFilePath, newFilePath)
}
```

---

## Test Coverage Patterns

### Backend Test Structure (agent-crud.test.js)

```javascript
describe('Agent CRUD API Routes', () => {
  describe('PUT /api/projects/:projectId/agents/:agentName', () => {
    test('updates agent with valid data', async () => { /* ... */ })
    test('validates required fields', async () => { /* ... */ })
    test('returns 404 for non-existent agent', async () => { /* ... */ })
    test('validates model enum', async () => { /* ... */ })
    test('validates color enum', async () => { /* ... */ })
    test('handles systemPrompt updates', async () => { /* ... */ })
    test('handles rename with conflict detection', async () => { /* ... */ })
  })

  describe('DELETE /api/projects/:projectId/agents/:agentName', () => {
    test('deletes agent successfully', async () => { /* ... */ })
    test('returns 404 for non-existent agent', async () => { /* ... */ })
  })

  describe('GET /api/projects/:projectId/agents/:agentName/references', () => {
    test('finds references in other configs', async () => { /* ... */ })
    test('returns empty array when no references', async () => { /* ... */ })
  })

  describe('User-level endpoints', () => {
    test('PUT /api/user/agents/:agentName', async () => { /* ... */ })
    test('DELETE /api/user/agents/:agentName', async () => { /* ... */ })
    test('GET /api/user/agents/:agentName/references', async () => { /* ... */ })
  })
})
```

**Commands Must Copy**: Same structure, add nested path tests.

### E2E Test Structure (107-agent-crud-operations.spec.js)

```javascript
test.describe('107.001: Agent Edit Flow', () => {
  test('107.001.001: Edit agent description inline', async ({ page }) => { /* ... */ })
  test('107.001.002: Edit agent model with SelectButton', async ({ page }) => { /* ... */ })
  test('107.001.003: Edit agent color with ColorPicker', async ({ page }) => { /* ... */ })
  test('107.001.004: Edit agent tools with MultiSelect', async ({ page }) => { /* ... */ })
  test('107.001.005: Cancel edit restores original value', async ({ page }) => { /* ... */ })
})

test.describe('107.002: Agent Delete Flow', () => {
  test('107.002.001: Delete agent without references', async ({ page }) => { /* ... */ })
  test('107.002.002: Delete agent with references shows warning', async ({ page }) => { /* ... */ })
  test('107.002.003: Cancel delete keeps agent', async ({ page }) => { /* ... */ })
})

test.describe('107.003: Edit Validation', () => {
  test('107.003.001: Reject description < 10 chars', async ({ page }) => { /* ... */ })
  test('107.003.002: Reject invalid model', async ({ page }) => { /* ... */ })
})
```

**Commands Must Copy**: Same structure, add nested path tests, adapt properties.

---

## Mapping Table: Agent → Command

| Aspect | Agent Implementation | Command Adaptation |
|--------|---------------------|-------------------|
| **Route Parameter** | `:agentName` | `:commandPath` |
| **Decode Parameter** | Not needed | `decodeURIComponent(commandPath)` |
| **File Path** | `.claude/agents/${agentName}.md` | `.claude/commands/${decodedPath}` |
| **Frontmatter Tools Field** | `tools` | `allowed-tools` |
| **Body Content Field** | `systemPrompt` | `content` |
| **Properties Count** | 8 properties | 6 properties |
| **Extra Props (Agent)** | `permissionMode`, `skills` | N/A |
| **Extra Props (Command)** | N/A | `argument-hint`, `disable-model-invocation` |
| **Description Validation** | Required, min 10 chars | Optional |
| **Reference Types** | agents, commands, skills, hooks | commands, skills |
| **Store State** | `projectAgents: Map`, `userAgents: Array` | `projectCommands: Map`, `userCommands: Array` |
| **Store Actions** | `updateAgent`, `deleteAgent`, `checkAgentReferences` | `updateCommand`, `deleteCommand`, `checkCommandReferences` |
| **API Methods** | `updateProjectAgent`, `deleteProjectAgent`, etc. | `updateProjectCommand`, `deleteProjectCommand`, etc. |
| **Component Data** | `agentData: ref({...})` | `commandData: ref({...})` |
| **Events** | `@agent-delete`, `@agent-updated` | `@command-delete`, `@command-updated` |
| **Handlers** | `handleAgentDelete`, `handleAgentUpdated`, etc. | `handleCommandDelete`, `handleCommandUpdated`, etc. |

---

## Lessons Learned from STORY-7.3

### What Went Well ✅

1. **Inline Editing Pattern**: Users love editing one field at a time. No complex forms needed.
2. **LabeledEditField Reusability**: One component handles text, textarea, select, multiselect, color.
3. **Service Reuse**: updateService, deleteService, referenceChecker worked out of the box.
4. **Reference Checking**: Showing references before delete prevents broken configurations.
5. **Two-Scope Pattern**: Handling project and user agents with same code is clean.
6. **Validation Layers**: Three layers catch all invalid data before file writes.
7. **Test-First Approach**: Backend tests (100% coverage) caught edge cases early.

### What to Improve for Commands 🔧

1. **URL Encoding**: Must implement from day one for nested paths.
2. **Directory Creation**: Ensure directories exist when renaming to nested paths.
3. **Simpler Validation**: Commands have fewer properties, validation is easier.
4. **Reference Scanning**: Only need to scan commands and skills (not agents/hooks).
5. **Test Nested Paths**: Add explicit tests for `utils/helper.md` style paths.

### What Commands Can Skip ⏭️

1. **Skills Property**: Commands don't support skills array.
2. **PermissionMode Property**: Commands don't have permission modes.
3. **Complex Frontmatter**: Commands have simpler structure.
4. **Agent-Specific Tests**: No need for permissionMode validation tests.

---

## Command Implementation Checklist

Use this as a final verification before marking STORY-7.4 complete:

### Backend
- [ ] `validateCommandPath` middleware implemented with URL decoding
- [ ] PUT endpoint handles nested paths correctly
- [ ] DELETE endpoint handles nested paths correctly
- [ ] References endpoint searches commands and skills only
- [ ] User-level endpoints mirror project-level endpoints
- [ ] Validation adapted for command properties (no permissionMode, add argument-hint)
- [ ] Backend tests cover nested paths explicitly
- [ ] 100% test coverage achieved

### Frontend
- [ ] Command store has updateCommand, deleteCommand, checkCommandReferences
- [ ] API client has 6 command methods with URL encoding
- [ ] ConfigDetailSidebar replaced commands section with LabeledEditField
- [ ] commandData ref initialized with all command properties
- [ ] handleFieldUpdate supports commands with path-based identification
- [ ] ConfigPageLayout forwards command-delete and command-updated events
- [ ] ProjectDetail has command delete handlers
- [ ] DeleteConfirmationModal supports both agents and commands
- [ ] E2E tests cover nested path editing and deletion

### Integration
- [ ] Edit flow works: click edit → modify → save → list refreshes
- [ ] Delete flow works: click delete → show references → confirm → list refreshes
- [ ] Nested paths work: `utils/helper.md` edits and deletes correctly
- [ ] URL encoding verified: slashes in paths don't break API calls
- [ ] Validation works: invalid data rejected with clear error messages
- [ ] No regressions: agent CRUD still works perfectly

---

## Conclusion

STORY-7.3 established a **proven, production-ready pattern** for configuration CRUD operations. The architecture is:

- **Clean**: Three-tier separation (UI → Store → API → Backend)
- **Testable**: 100% backend coverage, comprehensive E2E tests
- **Reusable**: LabeledEditField, DeleteConfirmationModal, service layer all reusable
- **User-Friendly**: Inline editing, reference warnings, clear validation messages
- **Maintainable**: Consistent patterns across all layers

**For STORY-7.4**: Copy this pattern exactly. The main differences are:
1. URL encoding for nested paths
2. Different property names (allowed-tools, content, argument-hint)
3. Simpler validation (fewer properties)
4. Fewer reference types to check

**Estimated effort**: 8-10 hours (same as agents, despite being simpler, due to nested path complexity)

---

## Quick Reference: Line Numbers

### Backend Source Code
- Agent PUT endpoint: `src/backend/routes/projects.js` lines 447-652
- Agent DELETE endpoint: `src/backend/routes/projects.js` lines 654-694
- Agent references endpoint: `src/backend/routes/projects.js` lines 696-727
- User agent PUT: `src/backend/routes/user.js` lines 159-343
- User agent DELETE: `src/backend/routes/user.js` lines 345-377
- User agent references: `src/backend/routes/user.js` lines 379-408

### Frontend Source Code
- Agent store actions: `src/stores/agents.js` lines 20-180
- API client methods: `src/api/client.js` lines 297-397
- Sidebar inline editing: `src/components/sidebars/ConfigDetailSidebar.vue` lines 60-139
- Sidebar field update handler: `src/components/sidebars/ConfigDetailSidebar.vue` lines 478-502
- Layout event forwarding: `src/components/layouts/ConfigPageLayout.vue` lines 66, 187-189, 372
- Project detail handlers: `src/components/ProjectDetail.vue` lines 47-48, 366-420, 556

### Test Files
- Backend tests: `tests/backend/routes/agent-crud.test.js` (entire file)
- E2E tests: `tests/e2e/107-agent-crud-operations.spec.js` (entire file)

---

**End of Analysis**
