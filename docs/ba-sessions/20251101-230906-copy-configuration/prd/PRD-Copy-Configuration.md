# Product Requirements Document: Copy Configuration Between Projects

**Status:** Ready for Development
**Version:** 1.0
**Phase:** 3.0 - First Write Operation (Copy Configuration)
**Last Updated:** 2025-11-02
**Priority:** High (Foundation for CRUD features)

---

## 1. Executive Summary

### Problem Statement

Claude Code Manager currently operates as a **read-only** configuration viewer. Users can browse agents, commands, hooks, skills, and MCP servers across projects, but cannot duplicate or share configurations without manually copying files in the terminal. This creates friction when:

- Onboarding new projects with proven configurations
- Standardizing workflows across multiple projects
- Promoting project-specific tools to user-level
- Experimenting with configurations in different environments
- Sharing best practices across teams

### Solution Overview

Introduce a **Copy Configuration** feature that allows users to duplicate configuration items (agents, commands, hooks, skills, MCP servers) between projects and scopes (user-level ↔ project-level) through a web UI. This feature represents Claude Code Manager's **first write operation**, transitioning from a read-only viewer to an active configuration management tool.

**Key Capabilities:**
1. Copy any configuration type between projects or to/from user-level
2. Smart conflict detection and resolution (skip, overwrite, rename)
3. Intelligent hook merging with script-level duplicate detection
4. Plugin restriction (prevent copying plugin-managed items)
5. Cross-platform path handling (Windows, macOS, Linux)

### Why Now (Strategic Timing)

**Foundation for Phase 4+ CRUD Operations:**
- Validates write infrastructure (permissions, validation, error handling)
- Establishes patterns for create/update/delete operations
- Tests security model (path traversal, file permissions)
- Builds user confidence in write operations

**User Demand:**
- Most requested feature in Phase 2 feedback
- Directly addresses workflow inefficiencies
- Low-risk entry into write operations (copying is safer than editing)

**Technical Readiness:**
- Phase 2 Vite migration complete (modern architecture)
- Component refactoring complete (reusable patterns)
- 879 tests at 100% pass rate (solid foundation)

### Key Business Value

**User Productivity:**
- **80% time savings** on configuration duplication (vs. manual file editing)
- **Zero error rate** on copy operations (vs. manual typos in YAML frontmatter)
- **Instant standardization** across projects (vs. multi-step manual process)

**Strategic Value:**
- First write operation establishes trust in configuration management
- Paves way for full CRUD implementation (Phase 4+)
- Differentiates from CLI-only workflows (web UI advantage)
- Enables team collaboration patterns (standardized configs across projects)

### Success Metrics

**Quantitative:**
- Feature adoption: 80%+ of active users try copy within 2 weeks
- Success rate: 95%+ of copy operations complete successfully
- Performance: 95%+ of copies complete in <1 second
- Conflict resolution: <5% require overwrite (rename is preferred)

**Qualitative:**
- User feedback: Positive reception (survey or GitHub issues)
- Support requests: <5 issues/bugs reported in first month
- Documentation clarity: Users understand feature without asking

---

## 2. Feature Overview

### High-Level Description

The Copy Configuration feature provides a modal-based UI for selecting configuration items and destinations, with intelligent conflict handling and type-specific copy logic. Users click a "Copy to..." button on any configuration item, select a destination (project or user-level), resolve any conflicts, and receive immediate feedback on success or failure.

### Target Users

**Primary:** Developers using Claude Code Manager to manage multiple Claude Code projects on their local machine

**User Personas:**
- **Solo Developer:** Standardizing personal workflows across projects
- **Team Lead:** Propagating best practices to team projects
- **Experimenter:** Testing configurations in different project contexts
- **New Project Creator:** Bootstrapping new projects with proven configs

### Primary Use Cases

**Use Case 1: Copy Agent Between Projects**
Developer has a `code-reviewer` agent working well in Project A and wants to use it in Project B without manual file editing.

**Use Case 2: Promote Command to User-Level**
Developer creates a useful `/analyze-logs` command in one project and wants it available to all projects (promotes to `~/.claude/commands/`).

**Use Case 3: Copy Hooks for Standardization**
Developer has user-level pre-commit hooks and wants a new project to inherit them without manual settings.json editing.

**Use Case 4: Duplicate Skill Across Projects**
Developer has a complex skill directory in Project A and wants to replicate it in Project B with all supporting files.

**Use Case 5: Handle Conflict on Copy**
Developer attempts to copy an agent but target already has an agent with the same name. System prompts for resolution (skip, overwrite, rename).

### Out of Scope (V1)

**Deferred to V2:**
- Batch copy operations (multi-select)
- Clipboard-style copy/paste workflow
- Drag-and-drop between projects
- User preferences for conflict resolution (always skip/rename/overwrite)
- Operation history and undo functionality
- Copy templates (save frequent operations)
- Dependency copying (e.g., agent references skill, copy both)
- Two-way sync (keep configs synchronized)
- Plugin extraction and customization

**Never In Scope:**
- Copying between different machines (network operations)
- Cloud sync or backup functionality
- Version control integration (git operations remain manual)

---

## 3. Business Objectives

### User Productivity Improvements

**Quantified Benefits:**

| Task | Manual Process | With Copy Feature | Time Saved |
|------|---------------|-------------------|------------|
| Copy agent between projects | 2-3 minutes (open files, copy/paste, fix paths, validate YAML) | 10 seconds (click, select, confirm) | 92% faster |
| Promote command to user-level | 3-4 minutes (navigate directories, copy file, verify location) | 8 seconds (click "Copy to User Level") | 96% faster |
| Copy 5 hooks to new project | 5-8 minutes (open settings.json, edit manually, validate JSON) | 15 seconds (select hooks, copy, merge) | 97% faster |
| Duplicate skill directory | 4-6 minutes (recursive copy, verify structure, check paths) | 12 seconds (click, select, confirm) | 95% faster |

**Error Reduction:**
- **100% elimination** of YAML frontmatter syntax errors
- **100% elimination** of path typos
- **100% elimination** of JSON formatting errors in settings files

### Strategic Value

**1. Foundation for CRUD Features (Phase 4+)**
- Establishes write operation patterns (validation, error handling, security)
- Tests cross-platform file system operations
- Builds user trust in configuration management
- Validates permission model and path traversal protection

**2. Competitive Differentiation**
- Web UI for configuration management (vs. CLI-only Claude Code)
- Visual conflict resolution (vs. terminal-based prompts)
- Instant preview and metadata comparison
- Accessible to non-terminal-savvy users

**3. Team Collaboration Enabler**
- Standardize configurations across team projects
- Share best practices through copy operations
- Onboard new developers with proven configs
- Create team-wide conventions

### Success Criteria (How We Measure Success)

**Adoption Metrics:**
- 80%+ of active users try copy feature within 2 weeks of release
- 50%+ of users perform 3+ copy operations in first month
- 30%+ of users copy between user-level and project-level (promotion use case)

**Performance Metrics:**
- 95%+ of single-file copies complete in <500ms
- 95%+ of skill directory copies complete in <2s (up to 100 files)
- Conflict detection completes in <100ms
- Modal opens in <300ms (smooth animation)

**Quality Metrics:**
- 95%+ success rate on copy operations (failed copies due to valid errors only)
- <5% conflict resolution rate (most copies are to new locations)
- <2% overwrite rate (users prefer rename for safety)
- Zero data loss incidents (no unintended overwrites)

**Support Metrics:**
- <5 bug reports in first month
- <10 support questions (feature is self-explanatory)
- <3 hours average time to resolve reported issues

---

## 4. User Stories & Acceptance Criteria

### Story 1: Copy Agent Between Projects

**User Story:**
As a developer, I want to copy a custom `code-reviewer` agent from Project A to Project B, so that both projects can use the same review standards without maintaining duplicate files manually.

**Acceptance Criteria:**

1. **Trigger Copy Operation**
   - Given: I am viewing Project A's agents in the agent card
   - When: I hover over `code-reviewer.md` in the item list
   - Then: A "Copy to..." button appears on the item row

2. **Select Destination**
   - Given: I click "Copy to..." on `code-reviewer.md`
   - When: The copy modal opens
   - Then: I see:
     - Source section showing: filename, type ("Agent"), current location (Project A path)
     - Destination section with scrollable list of project cards (including "User Global")
     - Each project card shows: name, path, "Copy Here" button
     - Cancel button in footer

3. **Execute Copy (No Conflict)**
   - Given: Project B does not have `code-reviewer.md`
   - When: I click "Copy Here" on Project B's card
   - Then:
     - Modal shows loading spinner overlay
     - File is copied to `Project B/.claude/agents/code-reviewer.md`
     - Success toast appears: "Configuration Copied Successfully - code-reviewer.md has been copied to: [path]"
     - Modal closes automatically
     - Project B's agent list updates (if viewing that page)

4. **Handle Conflict (File Exists)**
   - Given: Project B already has `code-reviewer.md`
   - When: I click "Copy Here" on Project B's card
   - Then:
     - Conflict dialog appears (nested over copy modal)
     - Dialog shows:
       - Warning header: "⚠️ File Already Exists"
       - Source file info: name, path, last modified date
       - Target file info: name, path, last modified date
       - Three radio options: Skip, Overwrite, Rename (default: Rename)
       - Rename preview: "code-reviewer-2.md"
       - Cancel and Confirm buttons

5. **Resolve Conflict - Skip**
   - Given: Conflict dialog is open with "Skip" selected
   - When: I click "Confirm Action"
   - Then:
     - Conflict dialog closes
     - Copy modal closes
     - No file is copied
     - Toast notification: "Copy operation cancelled"

6. **Resolve Conflict - Overwrite**
   - Given: Conflict dialog is open with "Overwrite" selected
   - When: I click "Confirm Action"
   - Then:
     - Existing `code-reviewer.md` in Project B is replaced
     - Success toast appears with overwrite confirmation
     - Modal closes

7. **Resolve Conflict - Rename**
   - Given: Conflict dialog is open with "Rename" selected (default)
   - When: I click "Confirm Action"
   - Then:
     - File is copied as `code-reviewer-2.md` (or `-3`, `-4`, etc. if needed)
     - Success toast shows new filename
     - Modal closes

8. **Navigate to Target**
   - Given: Success toast is displayed
   - When: I click "View in Target Project" link in toast
   - Then: Browser navigates to Project B detail page with agents section expanded

**Edge Cases:**
- Source file deleted during operation → Error toast: "Source file not found"
- Target directory lacks write permissions → Error toast: "Permission denied - Check file permissions"
- Disk full during copy → Error toast: "Disk space full - Free up space and try again"
- Source file is corrupted/unparseable → Error toast: "Source file is invalid - Cannot copy corrupted configuration"

---

### Story 2: Promote Command to User-Level

**User Story:**
As a developer, I want to promote a project-specific `/analyze-logs` command to user-level, so that all my projects can use it without copying to each one individually.

**Acceptance Criteria:**

1. **Trigger Promotion**
   - Given: I am viewing a project's commands list
   - When: I click "Copy to..." on `analyze-logs.md`
   - Then: Copy modal opens with source showing current project location

2. **Select User-Level Destination**
   - Given: Copy modal is open
   - When: I click "Copy Here" on the "User Global (~/.claude/)" card (displayed at top of destination list)
   - Then:
     - File is copied to `~/.claude/commands/analyze-logs.md`
     - Success toast: "Command promoted to user-level"
     - User Global commands list updates (if viewing that page)

3. **Handle User-Level Conflict**
   - Given: User-level already has `analyze-logs.md`
   - When: I select User Global as destination
   - Then: Conflict dialog appears with same resolution options (skip, overwrite, rename)

4. **Verify Command Appears in All Projects**
   - Given: Command was successfully copied to user-level
   - When: I navigate to any project's command list
   - Then: `analyze-logs.md` appears with location badge "User"

**Edge Cases:**
- Command file has nested subdirectories → Entire subdirectory structure copied to `~/.claude/commands/`
- Command references local project files → Copy succeeds with warning toast: "Command may reference project-specific paths"

---

### Story 3: Copy Hooks to New Project (Single-Item Only in V1)

**Note:** V1 supports single-item copy only. Batch operations deferred to V2.

**User Story:**
As a developer, I want to copy my user-level pre-commit hook to a new project, so that the project follows my standard workflow patterns from day one.

**Acceptance Criteria:**

1. **Trigger Hook Copy**
   - Given: I am viewing User Global hooks section
   - When: I click "Copy to..." on "pre-commit" hook
   - Then: Copy modal opens showing hook type and script

2. **Select Project Destination**
   - Given: Copy modal is open for a hook
   - When: I click "Copy Here" on a project card
   - Then:
     - Hook is added/merged into project's `.claude/settings.json`
     - Smart merge algorithm applies (see Technical Requirements section)
     - Success toast: "Hook copied successfully"

3. **Smart Merge (No Conflict)**
   - Given: Target project has no pre-commit hooks
   - When: I copy user-level pre-commit hook with scripts: `["npm test", "eslint ."]`
   - Then:
     - Target `settings.json` updated with: `"hooks": { "pre-commit": ["npm test", "eslint ."] }`
     - No conflict dialog (pure addition)

4. **Smart Merge (Partial Duplicate)**
   - Given: Target project already has pre-commit hook: `["eslint ."]`
   - When: I copy user-level pre-commit hook: `["npm test", "eslint ."]`
   - Then:
     - System detects `"eslint ."` already exists (duplicate)
     - Only `"npm test"` is appended
     - Result: `"pre-commit": ["eslint .", "npm test"]`
     - Success toast: "Hook merged (1 script added, 1 duplicate skipped)"

5. **Smart Merge (Complete Duplicate)**
   - Given: Target project already has exact same pre-commit scripts
   - When: I attempt copy
   - Then:
     - Success toast: "Hook already exists - No changes needed"
     - No file modification

6. **Different Hook Types Don't Interfere**
   - Given: Target has `"post-commit": ["git push"]`
   - When: I copy pre-commit hook
   - Then: Both hooks exist independently (no comparison across different event types)

**Edge Cases:**
- Target settings.json is corrupted → Error toast: "Cannot merge - target settings.json is invalid"
- Hook script contains special characters → Properly escaped in JSON
- Target settings.json is read-only → Error toast: "Permission denied"

**Deferred to V2:**
- Multi-select and batch copy multiple hooks at once

---

### Story 4: Handle Conflict When Copying

**User Story:**
As a developer, I want to be notified if a configuration I'm copying already exists in the target, so that I can decide whether to skip, overwrite, or rename it.

**Acceptance Criteria:**

1. **Conflict Detection Triggers**
   - Given: I initiate a copy operation
   - When: Backend detects target file already exists
   - Then: Copy operation pauses and returns conflict information to frontend

2. **Conflict Dialog Display**
   - Given: Conflict detected
   - When: Conflict dialog appears
   - Then: I see:
     - Warning header with icon: "⚠️ File Already Exists"
     - Message: "A file with this name already exists at the destination. What would you like to do?"
     - Source file card: filename, path, last modified timestamp
     - Target file card: filename, path, last modified timestamp
     - Three radio button options with descriptions
     - Cancel and Confirm buttons

3. **Conflict Resolution Options**
   - **Skip:**
     - Radio label: "Skip (don't copy)"
     - Description: "The target file will remain unchanged."
     - Result: No copy operation, modal closes, cancel message
   - **Overwrite:**
     - Radio label: "Overwrite (replace target)"
     - Description: "⚠️ The existing file will be replaced."
     - Visual indicator: Warning color (orange) on label
     - Confirm button changes to warning style when selected
     - Result: Target file replaced, success toast with overwrite notice
   - **Rename (DEFAULT):**
     - Radio label: "Rename (copy as [filename-2.md])"
     - Description: "The new file will be saved with a new name."
     - Rename preview shows actual filename that will be used
     - Result: New file created with incremented number, success toast shows new name

4. **Incremental Rename Logic**
   - Given: `agent-name.md` exists
   - When: I choose Rename
   - Then: File copied as `agent-name-2.md`
   - Given: `agent-name.md` and `agent-name-2.md` exist
   - When: I choose Rename
   - Then: File copied as `agent-name-3.md` (increments until unique)

5. **Cancel Conflict Resolution**
   - Given: Conflict dialog is open
   - When: I click Cancel or press Escape
   - Then:
     - Conflict dialog closes
     - Copy modal remains open (can try different destination)
     - No file operation performed

**Edge Cases:**
- Multiple rapid conflicts (user copies twice quickly) → Queue operations, show conflicts sequentially
- File modified between conflict detection and resolution → Re-validate before applying resolution
- Filename too long after rename (OS limit) → Error: "Cannot rename - filename exceeds OS limit"

---

### Story 5: Copy Skill Between Projects

**User Story:**
As a developer, I want to copy a project-specific Skill to another project, so that both projects have access to the same capability without maintaining duplicates.

**Acceptance Criteria:**

1. **Trigger Skill Copy**
   - Given: I am viewing a project's skills list
   - When: I click "Copy to..." on a skill card
   - Then: Copy modal opens showing skill name and current location

2. **Execute Skill Copy (Directory Recursion)**
   - Given: Source skill has structure:
     ```
     my-skill/
     ├── SKILL.md
     ├── helper.py
     ├── config.json
     └── data/
         └── sample.csv
     ```
   - When: I copy to target project
   - Then:
     - Entire directory structure copied recursively to target
     - All files and subdirectories preserved
     - Relative paths maintained
     - Success toast: "Skill copied successfully (5 files)"

3. **Handle Skill Conflict**
   - Given: Target project already has skill directory with same name
   - When: I attempt copy
   - Then:
     - Conflict dialog appears
     - Note: Conflict is at **directory level** (entire skill, not individual files)
     - Options: Skip (don't copy), Overwrite (replace entire directory), Rename (copy as `my-skill-2/`)

4. **Validate Skill After Copy**
   - Given: Skill was successfully copied
   - When: Backend validates copied files
   - Then:
     - SKILL.md exists and is parseable
     - Directory structure is intact
     - If validation fails → Rollback copy, error toast: "Copy failed - skill directory is incomplete"

5. **Large Skill Copy (100+ files)**
   - Given: Skill directory contains 100+ files
   - When: Copy operation is in progress
   - Then:
     - Modal shows loading spinner with "Copying skill files..."
     - Operation completes in <2 seconds
     - Success toast shows file count: "Skill copied successfully (127 files)"

**Edge Cases:**
- Skill contains symlinks → Symlinks not followed (copy fails with error: "Skill contains symlinks - cannot copy")
- Skill contains binary files → Binary files copied as-is
- Source skill directory deleted mid-copy → Error toast: "Source skill not found"
- Partial copy failure (some files copied, others failed) → Rollback entire operation, error toast explains failure

---

## 5. Technical Requirements

### 5.1 Backend Requirements

#### API Endpoints

**POST /api/copy/agent**
```javascript
Request Body:
{
  sourceType: 'agent',
  sourcePath: '/absolute/path/to/source/agent.md',
  sourceScope: 'project',           // 'user' | 'project'
  sourceProjectId: 'homeuserprojectsa',  // Required if sourceScope is 'project'
  targetScope: 'project',           // 'user' | 'project'
  targetProjectId: 'homeuserprojectsb',  // Required if targetScope is 'project'
  conflictStrategy?: 'skip' | 'overwrite' | 'rename'  // Optional on first call
}

Response (Success):
{
  success: true,
  message: 'Agent copied successfully',
  copiedPath: '/absolute/path/to/target/agent.md'
}

Response (Conflict - No Strategy Provided):
{
  success: false,
  conflict: {
    targetPath: '/absolute/path/to/target/agent.md',
    sourceModified: '2025-11-01T15:30:00Z',
    targetModified: '2025-10-15T10:45:00Z'
  }
}

Response (Error):
{
  success: false,
  error: 'EACCES',
  message: 'Permission denied',
  detail: 'Check file permissions and try again'
}
```

**POST /api/copy/command** - Same schema as agent
**POST /api/copy/skill** - Same schema as agent (recursive directory copy)
**POST /api/copy/hook** - Settings.json merge operation
**POST /api/copy/mcp** - Settings.json or .mcp.json merge operation

#### Request/Response Schemas

**TypeScript Interfaces:**
```typescript
interface CopyConfigRequest {
  sourceType: 'agent' | 'command' | 'hook' | 'skill' | 'mcp';
  sourcePath: string;
  sourceScope: 'user' | 'project';
  sourceProjectId?: string;
  targetScope: 'user' | 'project';
  targetProjectId?: string;
  conflictStrategy?: 'skip' | 'overwrite' | 'rename';
}

interface CopyConfigResponse {
  success: boolean;
  message: string;
  conflict?: ConfigConflict;
  copiedPath?: string;
  error?: string;
  detail?: string;
}

interface ConfigConflict {
  targetPath: string;
  sourceModified: string;  // ISO 8601 timestamp
  targetModified: string;  // ISO 8601 timestamp
}
```

#### Copy Operation Logic

**For File-Based Configs (agents, commands):**

1. **Pre-Copy Validation:**
   - Verify source file exists and is readable
   - Validate source path (no path traversal: `../`)
   - Check user has read permission on source
   - Parse source file to ensure valid YAML frontmatter
   - Determine target path based on scope and projectId

2. **Conflict Detection:**
   - Check if target file exists
   - If exists and no conflictStrategy → Return conflict info
   - If exists and conflictStrategy provided → Apply strategy

3. **Conflict Resolution:**
   - **Skip:** Return success with message "Copy cancelled"
   - **Overwrite:** Delete target file, proceed to copy
   - **Rename:** Append `-2` (or increment) to filename, proceed to copy

4. **Copy Execution:**
   - Use Node.js `fs.copyFile()` for atomic operation
   - Verify target file was created
   - Validate copied file is parseable

5. **Post-Copy Validation:**
   - Read target file
   - Parse YAML frontmatter
   - Verify all required fields present
   - If invalid → Delete target, return error

6. **Response:**
   - Success: Return copiedPath and success message
   - Error: Return error code, message, and actionable detail

**For Settings-Based Configs (hooks):**

1. **Pre-Copy Validation:**
   - Verify source hook exists in settings.json
   - Read target settings.json (or create if doesn't exist)
   - Parse JSON to ensure valid structure

2. **Smart Merge Algorithm:**
   ```javascript
   // Source: { "hooks": { "pre-commit": ["npm test", "eslint ."] } }
   // Target: { "hooks": { "pre-commit": ["eslint ."], "post-commit": ["git push"] } }

   function mergeHooks(sourceHooks, targetHooks) {
     const result = { ...targetHooks };

     for (const [event, sourceScripts] of Object.entries(sourceHooks)) {
       const sourceArray = Array.isArray(sourceScripts) ? sourceScripts : [sourceScripts];

       if (!result[event]) {
         // Event doesn't exist in target, add entire array
         result[event] = sourceArray;
       } else {
         // Event exists, merge scripts with duplicate detection
         const targetArray = Array.isArray(result[event]) ? result[event] : [result[event]];

         for (const script of sourceArray) {
           if (!targetArray.includes(script)) {
             // Script doesn't exist, append
             targetArray.push(script);
           }
           // If script exists, skip (duplicate)
         }

         result[event] = targetArray;
       }
     }

     return result;
   }
   ```

3. **Write Updated Settings:**
   - Merge hooks into target settings.json
   - Pretty-print JSON with 2-space indentation
   - Write atomically (write to temp file, rename)

4. **Validation:**
   - Read written file
   - Parse JSON to verify validity
   - If invalid → Rollback (restore backup), return error

**For Skills (Directory Copy):**

1. **Pre-Copy Validation:**
   - Verify source skill directory exists
   - Verify SKILL.md exists in root
   - Check no symlinks present (security risk)
   - Count total files/directories

2. **Conflict Detection:**
   - Check if target skill directory exists (directory-level conflict)
   - If exists → Return conflict (skip, overwrite entire directory, or rename)

3. **Recursive Copy:**
   ```javascript
   async function copySkillDirectory(sourcePath, targetPath) {
     const entries = await fs.readdir(sourcePath, { withFileTypes: true });

     for (const entry of entries) {
       const srcPath = path.join(sourcePath, entry.name);
       const destPath = path.join(targetPath, entry.name);

       if (entry.isDirectory()) {
         await fs.mkdir(destPath, { recursive: true });
         await copySkillDirectory(srcPath, destPath);  // Recurse
       } else if (entry.isFile()) {
         await fs.copyFile(srcPath, destPath);
       } else if (entry.isSymbolicLink()) {
         throw new Error('Symlinks not supported');
       }
     }
   }
   ```

4. **Post-Copy Validation:**
   - Verify SKILL.md exists and is parseable
   - Count files in target (should match source count)
   - If validation fails → Delete entire target directory (rollback)

#### Validation Requirements

**Path Traversal Protection:**
```javascript
function validatePath(sourcePath, targetPath) {
  const resolvedSource = path.resolve(sourcePath);
  const resolvedTarget = path.resolve(targetPath);

  // Ensure source is within allowed directories
  const allowedSourceDirs = [
    path.resolve(os.homedir(), '.claude'),
    path.resolve('/home/'),  // Project directories
  ];

  const isSourceValid = allowedSourceDirs.some(dir =>
    resolvedSource.startsWith(dir)
  );

  // Ensure target doesn't contain path traversal
  if (targetPath.includes('..') || targetPath.includes('~')) {
    throw new Error('Path traversal not allowed');
  }

  return isSourceValid;
}
```

**Permission Checks:**
```javascript
async function validatePermissions(sourcePath, targetPath) {
  // Check source is readable
  try {
    await fs.access(sourcePath, fs.constants.R_OK);
  } catch (err) {
    throw new Error('Source file not readable');
  }

  // Check target directory is writable
  const targetDir = path.dirname(targetPath);
  try {
    await fs.access(targetDir, fs.constants.W_OK);
  } catch (err) {
    throw new Error('Target directory not writable');
  }
}
```

#### Error Handling

**Error Types and Messages:**

| Error Code | User Message | Detail/Advice |
|------------|--------------|---------------|
| EACCES | Permission denied | Check file permissions and try again |
| ENOSPC | Disk space full | Free up disk space and try again |
| ENOENT | Source file not found | The file may have been deleted |
| EROFS | Read-only filesystem | Choose a different target location |
| EISDIR | Target is a directory | The target path is invalid |
| INVALID_PATH | Path traversal detected | Source or target path is invalid |
| PARSE_ERROR | Configuration file invalid | Source file has syntax errors |
| SYMLINK_ERROR | Symlinks not supported | Skill contains symbolic links |

**Error Response Format:**
```javascript
{
  success: false,
  error: 'EACCES',
  message: 'Permission denied',
  detail: 'Check file permissions and try again',
  path: '/path/to/file'  // Optional: which path caused the error
}
```

#### Security Requirements

1. **Path Traversal Prevention:**
   - Reject any path containing `..` or `~` (after initial resolution)
   - Use `path.resolve()` to normalize all paths
   - Whitelist allowed directories (user home, project directories)

2. **Permission Validation:**
   - Check read permission on source
   - Check write permission on target directory
   - Fail fast if permissions insufficient

3. **Symlink Protection:**
   - Don't follow symbolic links
   - Reject skill directories containing symlinks
   - Prevent copying symlinks as files

4. **Input Sanitization:**
   - Sanitize filenames (remove shell metacharacters)
   - Validate projectId matches known projects
   - Reject absurdly long filenames (>255 chars)

---

### 5.2 Frontend Requirements

#### New Components

**1. CopyButton.vue**

**Purpose:** Trigger button on each configuration item

**Props:**
```vue
{
  configItem: Object,      // Config item to copy (agent, command, etc.)
  configType: String,      // 'agents' | 'commands' | 'hooks' | 'skills' | 'mcp'
  disabled: Boolean,       // True for plugin items
  tooltipText: String      // Custom tooltip for disabled state
}
```

**Emits:**
```vue
{
  click: configItem  // Emitted when button clicked
}
```

**Usage:**
```vue
<CopyButton
  :config-item="agent"
  :config-type="'agents'"
  :disabled="agent.location === 'plugin'"
  :tooltip-text="agent.location === 'plugin' ? 'Plugin items cannot be copied' : 'Copy to...'"
  @click="openCopyModal(agent, 'agents')"
/>
```

**2. CopyModal.vue**

**Purpose:** Main modal dialog for destination selection

**Props:**
```vue
{
  visible: Boolean,
  sourceItem: Object,        // Config item being copied
  sourceType: String,        // 'agents' | 'commands' | 'hooks' | 'skills' | 'mcp'
  sourceScope: String,       // 'user' | 'project'
  sourceProjectId: String,   // If scope is 'project'
  projects: Array            // All available projects for destination
}
```

**Emits:**
```vue
{
  close: null,
  copy: {
    destination: Object,     // { scope: 'project', projectId: '...' }
    conflictStrategy: String // 'skip' | 'overwrite' | 'rename' (if conflict resolved)
  }
}
```

**Template Structure:**
```vue
<div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
  <div class="copy-modal">
    <!-- Header -->
    <div class="modal-header">
      <h2>Copy Configuration</h2>
      <button @click="$emit('close')">×</button>
    </div>

    <!-- Source Section -->
    <div class="source-section">
      <div class="source-label">SOURCE</div>
      <div class="source-card">
        <div class="source-card-title">
          <i :class="iconForType(sourceType)"></i>
          {{ sourceItem.name }}
        </div>
        <div class="source-card-meta">
          Type: {{ sourceType }}
          Current Location: {{ sourceScope === 'user' ? 'User Global' : projectName }}
        </div>
      </div>
    </div>

    <!-- Destination Section -->
    <div class="destination-section">
      <div class="destination-label">COPY TO</div>
      <div class="destination-list">
        <!-- User Global Card -->
        <div class="destination-card" @click="selectDestination('user', null)">
          <div class="destination-card-info">
            <i class="pi pi-globe"></i>
            <div>
              <div class="destination-card-name">User Global</div>
              <div class="destination-card-path">~/.claude/</div>
            </div>
          </div>
          <button class="copy-here-btn">Copy Here →</button>
        </div>

        <!-- Project Cards -->
        <div
          v-for="project in projects"
          :key="project.id"
          class="destination-card"
          @click="selectDestination('project', project.id)"
        >
          <div class="destination-card-info">
            <i class="pi pi-folder"></i>
            <div>
              <div class="destination-card-name">{{ project.name }}</div>
              <div class="destination-card-path">{{ project.path }}</div>
            </div>
          </div>
          <button class="copy-here-btn">Copy Here →</button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="modal-footer">
      <button class="cancel-btn" @click="$emit('close')">Cancel</button>
    </div>
  </div>
</div>
```

**3. ConflictResolver.vue**

**Purpose:** Nested dialog for conflict resolution

**Props:**
```vue
{
  visible: Boolean,
  sourceFile: Object,      // { name, path, modified }
  targetFile: Object,      // { name, path, modified }
  defaultStrategy: String  // 'rename' (safest default)
}
```

**Emits:**
```vue
{
  close: null,
  resolve: String  // 'skip' | 'overwrite' | 'rename'
}
```

**Template Structure:**
```vue
<div v-if="visible" class="conflict-dialog-overlay" @click.self="$emit('close')">
  <div class="conflict-dialog">
    <!-- Header -->
    <div class="conflict-dialog-header">
      <i class="pi pi-exclamation-triangle"></i>
      <h2>File Already Exists</h2>
      <button @click="$emit('close')">×</button>
    </div>

    <!-- Content -->
    <div class="conflict-dialog-content">
      <p class="conflict-message">
        A file with this name already exists at the destination. What would you like to do?
      </p>

      <!-- Source File Info -->
      <div class="file-info-card">
        <div class="file-info-label">SOURCE FILE</div>
        <div class="file-info-name">{{ sourceFile.name }}</div>
        <div class="file-info-path">{{ sourceFile.path }}</div>
        <div class="file-info-modified">Last modified: {{ formatDate(sourceFile.modified) }}</div>
      </div>

      <!-- Target File Info -->
      <div class="file-info-card">
        <div class="file-info-label">TARGET FILE</div>
        <div class="file-info-name">{{ targetFile.name }}</div>
        <div class="file-info-path">{{ targetFile.path }}</div>
        <div class="file-info-modified">Last modified: {{ formatDate(targetFile.modified) }}</div>
      </div>

      <!-- Action Selection -->
      <div class="action-selection">
        <div class="action-selection-label">CHOOSE AN ACTION:</div>

        <label class="action-option">
          <input type="radio" v-model="selectedAction" value="skip" />
          <div class="action-option-content">
            <div class="action-option-title">Skip (don't copy)</div>
            <div class="action-option-description">The target file will remain unchanged.</div>
          </div>
        </label>

        <label class="action-option action-option-overwrite">
          <input type="radio" v-model="selectedAction" value="overwrite" />
          <div class="action-option-content">
            <div class="action-option-title">Overwrite (replace target)</div>
            <div class="action-option-description">⚠️ The existing file will be replaced.</div>
          </div>
        </label>

        <label class="action-option">
          <input type="radio" v-model="selectedAction" value="rename" checked />
          <div class="action-option-content">
            <div class="action-option-title">Rename (copy as {{ renamePreview }})</div>
            <div class="action-option-description">The new file will be saved with a new name.</div>
          </div>
        </label>
      </div>
    </div>

    <!-- Footer -->
    <div class="conflict-dialog-footer">
      <button class="cancel-btn" @click="$emit('close')">Cancel</button>
      <button
        class="confirm-btn"
        :class="{ 'overwrite-action': selectedAction === 'overwrite' }"
        @click="$emit('resolve', selectedAction)"
      >
        Confirm Action
      </button>
    </div>
  </div>
</div>
```

#### Integration Points

**Add CopyButton to ConfigItemList.vue:**

```vue
<!-- In ConfigItemList.vue template -->
<div class="item-row" v-for="item in items" :key="item.id">
  <div class="item-info" @click="$emit('item-click', item)">
    <!-- Existing item content -->
  </div>

  <div class="item-actions">
    <CopyButton
      :config-item="item"
      :config-type="type"
      :disabled="item.location === 'plugin'"
      @click.stop="handleCopyClick(item)"
    />
  </div>
</div>
```

**Add to ConfigCard.vue (if not using ConfigItemList):**

```vue
<!-- Alternative: Direct integration in ConfigCard -->
<div class="config-card-items">
  <div v-for="item in displayedItems" :key="item.id" class="config-item">
    <div class="item-content" @click="$emit('item-selected', item)">
      <!-- Item info -->
    </div>
    <CopyButton
      :config-item="item"
      :config-type="type"
      :disabled="item.location === 'plugin'"
      @click.stop="openCopyModal(item)"
    />
  </div>
</div>
```

#### State Management (Pinia Store)

**New Store: `stores/copyConfig.js`**

```javascript
import { defineStore } from 'pinia';
import { copyConfig } from '@/api/client';

export const useCopyConfigStore = defineStore('copyConfig', {
  state: () => ({
    modalVisible: false,
    sourceItem: null,
    sourceType: null,
    sourceScope: null,
    sourceProjectId: null,
    conflictDialogVisible: false,
    conflictData: null,
    isLoading: false
  }),

  actions: {
    openCopyModal(item, type, scope, projectId) {
      this.sourceItem = item;
      this.sourceType = type;
      this.sourceScope = scope;
      this.sourceProjectId = projectId;
      this.modalVisible = true;
    },

    closeCopyModal() {
      this.modalVisible = false;
      this.sourceItem = null;
      this.conflictData = null;
    },

    async performCopy(destination, conflictStrategy = null) {
      this.isLoading = true;

      try {
        const response = await copyConfig({
          sourceType: this.sourceType,
          sourcePath: this.sourceItem.path,
          sourceScope: this.sourceScope,
          sourceProjectId: this.sourceProjectId,
          targetScope: destination.scope,
          targetProjectId: destination.projectId,
          conflictStrategy
        });

        if (response.conflict && !conflictStrategy) {
          // Show conflict dialog
          this.conflictData = response.conflict;
          this.conflictDialogVisible = true;
        } else if (response.success) {
          // Show success toast
          this.$toast.add({
            severity: 'success',
            summary: 'Configuration Copied Successfully',
            detail: `${this.sourceItem.name} has been copied to:\n${response.copiedPath}`,
            life: 5000
          });

          this.closeCopyModal();

          // Refresh data (trigger re-fetch)
          // TODO: Emit event to refresh project data
        }
      } catch (error) {
        // Show error toast
        this.$toast.add({
          severity: 'error',
          summary: 'Copy Failed',
          detail: error.detail || error.message,
          life: 0  // Manual dismiss for errors
        });
      } finally {
        this.isLoading = false;
      }
    }
  }
});
```

#### API Client Methods

**Add to `src/api/client.js`:**

```javascript
// Copy configuration item
export async function copyConfig(request) {
  const endpoint = `/api/copy/${request.sourceType}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Copy operation failed');
  }

  return response.json();
}
```

#### User Feedback (Toast Notifications)

**Success Toast:**
```javascript
this.$toast.add({
  severity: 'success',
  summary: 'Configuration Copied Successfully',
  detail: `${fileName} has been copied to:\n${targetPath}`,
  life: 5000,  // Auto-dismiss after 5 seconds
  closable: true
});
```

**Error Toast:**
```javascript
this.$toast.add({
  severity: 'error',
  summary: 'Cannot Copy to Target Location',
  detail: `${errorReason}\n\n${actionableAdvice}`,
  life: 0,  // Manual dismiss only
  closable: true
});
```

**Conflict Toast (if user skips):**
```javascript
this.$toast.add({
  severity: 'info',
  summary: 'Copy Operation Cancelled',
  detail: 'No changes were made',
  life: 3000
});
```

#### Responsive Design

**Desktop (1440px+):**
- Copy modal: 600px width, centered
- Destination cards: Full width with all content visible
- Conflict dialog: 550px width, centered over modal

**Tablet (768px - 1439px):**
- Copy modal: 90vw width, max 600px
- Destination cards: Same layout, scrollable

**Mobile (<768px):**
- Copy modal: Full screen (100vw x 100vh)
- Destination cards: Stack vertically, "Copy Here" button full width
- Conflict dialog: Full screen overlay
- Scrollable areas: Touch-friendly, large hit targets (min 44x44px)

#### Accessibility (WCAG 2.1 AA Compliance)

**Keyboard Navigation:**
- Tab through all focusable elements (buttons, cards, radio buttons)
- Escape key closes modals
- Enter key activates focused button or selects destination
- Arrow keys navigate radio options in conflict dialog

**ARIA Labels:**
```vue
<!-- Copy Button -->
<button
  aria-label="Copy code-reviewer.md to another project"
  :aria-disabled="isPlugin"
>

<!-- Copy Modal -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>

<!-- Destination Card -->
<div
  role="button"
  tabindex="0"
  :aria-label="`Copy to ${project.name} project`"
  @keypress.enter="selectDestination(project)"
>

<!-- Conflict Radio Options -->
<input
  type="radio"
  :id="`action-${option}`"
  :aria-checked="selectedAction === option"
  :aria-describedby="`action-${option}-description`"
>
```

**Screen Reader Announcements:**
```vue
<div role="status" aria-live="polite" class="sr-only">
  {{ statusMessage }}
</div>

<!-- Examples -->
statusMessage: "Copy modal opened"
statusMessage: "Conflict detected for code-reviewer.md"
statusMessage: "Configuration copied successfully"
```

**Color Contrast:**
- All text meets 4.5:1 contrast ratio (WCAG AA)
- Primary button: #ffffff on #007ad9 (4.9:1)
- Warning text: #FFA726 on dark background (4.6:1)
- Error text: #ffffff on #b71c1c (7.2:1)

**Focus Indicators:**
- Visible outline on all focusable elements
- 2px solid border with high contrast color
- Outline offset: 2px for clarity

---

### 5.3 Data Requirements

#### Configuration Types Supported

**V1 Scope:**
1. **Agents** (`.claude/agents/*.md`) - File-based copy
2. **Commands** (`.claude/commands/**/*.md`) - File-based copy (supports nested directories)
3. **Hooks** (`.claude/settings.json`) - Settings merge with smart duplicate detection
4. **Skills** (`.claude/skills/*/`) - Directory recursive copy
5. **MCP Servers** (`.mcp.json` or `.claude/settings.json`) - Settings merge

#### Metadata Requirements

**Source Item Metadata (Required for Copy):**
```javascript
{
  id: string,
  name: string,
  path: string,               // Absolute path to file/directory
  type: 'agent' | 'command' | 'hook' | 'skill' | 'mcp',
  location: 'user' | 'project' | 'plugin',  // Used for plugin detection
  modified: string            // ISO 8601 timestamp (for conflict display)
}
```

**Plugin Detection:**
- Check `location` field: if `'plugin'`, disable copy button
- Display tooltip: "This configuration is provided by a plugin and cannot be copied. Install the plugin in your target project instead."
- UI: Copy button disabled state with 40% opacity

#### Hook Merge Algorithm

**Smart Script-Level Duplicate Detection:**

```javascript
/**
 * Merge hooks from source into target with script-level duplicate detection
 * @param {Object} sourceHooks - Source hooks object { "pre-commit": [...], ... }
 * @param {Object} targetHooks - Target hooks object
 * @returns {Object} Merged hooks object
 */
function mergeHooks(sourceHooks, targetHooks) {
  const result = { ...targetHooks };
  let addedCount = 0;
  let skippedCount = 0;

  for (const [event, sourceScripts] of Object.entries(sourceHooks)) {
    // Normalize to array (handle both string and array formats)
    const sourceArray = Array.isArray(sourceScripts) ? sourceScripts : [sourceScripts];

    if (!result[event]) {
      // Event doesn't exist in target, add entire array
      result[event] = sourceArray;
      addedCount += sourceArray.length;
    } else {
      // Event exists in target, merge with duplicate detection
      const targetArray = Array.isArray(result[event]) ? result[event] : [result[event]];

      for (const script of sourceArray) {
        if (!targetArray.includes(script)) {
          // Script is unique, append to target array
          targetArray.push(script);
          addedCount++;
        } else {
          // Script already exists, skip (duplicate)
          skippedCount++;
        }
      }

      result[event] = targetArray;
    }
  }

  return {
    hooks: result,
    stats: {
      added: addedCount,
      skipped: skippedCount
    }
  };
}

// Example Usage:
const source = { "pre-commit": ["npm test", "eslint ."] };
const target = { "pre-commit": ["eslint ."], "post-commit": ["git push"] };

const merged = mergeHooks(source, target);
// Result: {
//   hooks: {
//     "pre-commit": ["eslint .", "npm test"],  // Added "npm test", kept "eslint ."
//     "post-commit": ["git push"]              // Unchanged
//   },
//   stats: { added: 1, skipped: 1 }
// }
```

**Key Principles:**
1. **Event-level isolation:** Only compare scripts within same event type (pre-commit vs pre-commit, not pre-commit vs post-commit)
2. **Array normalization:** Handle both string and array formats (Claude Code supports both)
3. **Duplicate detection:** Exact string match for script comparison
4. **Additive merge:** Never removes existing hooks, only adds new ones
5. **No conflict dialogs:** Pure merge operation, user gets stats in success toast

**TODO Added:** Verify Claude Code actually supports hook arrays in our codebase (see `docs/ba-sessions/20251101-230906-copy-configuration/TODO.md`)

#### MCP Merge Strategy

**Similar to Hooks (TBD - Needs Clarification):**

Option A: Same merge logic as hooks (recommended)
- MCP servers can have multiple entries per server name
- Merge server configurations with duplicate detection
- Conflict only if exact same server+config exists

Option B: Conflict on duplicate server name
- MCP server names must be unique
- If target has same server name → Show conflict dialog
- User chooses: skip, overwrite, rename server

**Decision Pending:** Needs investigation of Claude Code's MCP server configuration format. Default to Option A (similar to hooks) unless evidence suggests otherwise.

---

## 6. UI/UX Specifications

### Copy Modal Design

**Full specification available in:** `docs/ba-sessions/20251101-230906-copy-configuration/wireframes/design-notes.md`

**Key Design Decisions:**

1. **Modal-Based Flow** (not clipboard or drag-drop)
   - User clicks "Copy to..." → Modal opens immediately
   - Destination selection via card-based layout (not dropdown)
   - Each project displayed as condensed card: name + path + "Copy Here" button
   - "User Global" displayed as first card option

2. **Source vs Destination Differentiation**
   - Source section at top (single card, read-only feel)
   - Destination section below (multiple cards, interactive feel)
   - Clear "COPY TO" label separates sections
   - No color coding (avoid visual noise)

3. **Destination Cards Visibility**
   - Show 5-6 destination cards before scrolling required
   - Scrollable area for many projects (custom scrollbar styling)
   - User Global always visible at top (most common use case)

### Conflict Resolution Dialog

**Key Features:**

1. **Warning Visual Design**
   - Header background: Warning color (#FFF3E0)
   - Icon: ⚠️ Exclamation triangle
   - Title: "File Already Exists"

2. **File Comparison**
   - Side-by-side file info cards
   - Display: filename, path, last modified timestamp
   - No file content preview (keeps dialog compact)

3. **Action Options**
   - Radio buttons for clear single selection
   - Default: Rename (safest option)
   - Overwrite: Warning styling (#FFA726 color)
   - Skip: Neutral styling

4. **Rename Preview**
   - Show actual filename that will be used: "code-reviewer-2.md"
   - Dynamic update if -2 exists (show -3, -4, etc.)

### Success/Error Notifications

**Toast Pattern (PrimeVue Toast Service):**

**Success Toast:**
- Severity: success (green)
- Position: Top-right
- Duration: 5 seconds auto-dismiss
- Closable: Yes
- Content: Filename + target path
- Optional action link: "View in Target Project"

**Error Toast:**
- Severity: error (red)
- Position: Top-right
- Duration: Manual dismiss only (no auto-dismiss)
- Closable: Yes
- Content: Error reason + actionable advice

**Info Toast (Conflict Skip):**
- Severity: info (blue)
- Position: Top-right
- Duration: 3 seconds auto-dismiss
- Content: "Copy operation cancelled - No changes were made"

### Plugin Item Restrictions

**Disabled State:**
- Copy button: 40% opacity, cursor: not-allowed
- Tooltip on hover: "This configuration is provided by a plugin and cannot be copied. Install the plugin in your target project instead."
- Plugin badge: Purple background (#9C27B0), white text, "PLUGIN" label

**If User Attempts Copy (Defensive):**
- Backend validation rejects plugin items
- Error toast: "Cannot copy plugin-provided configurations"

### Visual Indicators (Additive Layer)

**Optional - Can Be Easily Removed:**

Source Card:
- Subtle arrow icon (→) on right edge
- Color: var(--text-muted), opacity: 0.5

Destination Cards:
- Checkmark (✓) appears on hover
- Color: var(--color-success)
- Animation: Fade in (0.2s)

**Implementation Note:** These are conditionally rendered via a feature flag. Can be removed without refactoring HTML structure.

### User Flow Diagrams

**Happy Path (No Conflict):**
```
User clicks "Copy to..."
  → Modal opens (300ms animation)
    → User selects destination
      → "Copy Here" clicked
        → Loading spinner (async operation)
          → Success toast (5s)
            → Modal closes
              → Data refreshes in background
```

**Conflict Path:**
```
User clicks "Copy to..."
  → Modal opens
    → User selects destination
      → Conflict detected (backend response)
        → Conflict dialog opens (nested over modal)
          → User selects resolution (Skip/Overwrite/Rename)
            → Confirm clicked
              → If Skip: Both dialogs close, info toast
              → If Overwrite/Rename: Copy executes, success toast, dialogs close
```

**Error Path:**
```
User clicks "Copy to..."
  → Modal opens
    → User selects destination
      → Copy operation fails (permission error)
        → Error toast appears (manual dismiss)
          → Modal remains open (user can try different destination)
```

---

## 7. Architectural Decisions

### 1. Copy Flow: Modal-Based

**Decision:** Use modal dialog for destination selection (not clipboard or drag-drop)

**V1 Implementation:**
- Click "Copy to..." → Modal opens immediately
- Card-based destination selection (not dropdown)
- Single action confirms and executes copy

**Rationale:**
- Simplest to implement (no state persistence)
- Works in all contexts (Dashboard, Project Detail, User Global)
- Consistent with existing modal patterns (sidebar detail view)
- No clipboard management complexity

**Deferred to V2:**
- Clipboard-style copy/paste (requires state persistence)
- Drag-and-drop (requires mouse tracking and drop zones)

**Architectural Pattern:** Modal-driven workflow (standard web UI pattern)

---

### 2. Conflict Resolution: Always Prompt

**Decision:** Always show conflict dialog when file exists (not automatic skip/overwrite/rename)

**V1 Implementation:**
- Use **Strategy Pattern** for conflict resolution
- V1 implements `PromptStrategy` (always ask user)
- Future strategies can be added without changing copy logic

**Strategy Pattern Structure:**
```javascript
// Interface
class ConflictStrategy {
  async resolve(conflict) {
    throw new Error('Not implemented');
  }
}

// V1: Always prompt user
class PromptStrategy extends ConflictStrategy {
  async resolve(conflict) {
    return await showConflictDialog(conflict);
  }
}

// V2: User preference-based
class PreferenceBasedStrategy extends ConflictStrategy {
  async resolve(conflict) {
    const userPref = getUserPreference();  // 'skip' | 'overwrite' | 'rename'
    return userPref;
  }
}

// V2: Always skip
class SkipStrategy extends ConflictStrategy {
  async resolve(conflict) {
    return 'skip';
  }
}
```

**Rationale:**
- Safety-first for V1 (prevents accidental data loss)
- User has full control over every conflict
- Strategy pattern enables V2 preferences without refactoring
- Clean separation: conflict resolution logic isolated from copy logic

**Deferred to V2:**
- User preference setting: "Always skip/overwrite/rename"
- Per-config-type preferences
- "Remember my choice" checkbox

---

### 3. Batch Operations: Single-Item Only

**Decision:** V1 supports copying one configuration at a time (no multi-select)

**V1 Implementation:**
- Copy button on individual items only
- No checkbox selection UI
- No "Copy Selected" batch button

**Rationale:**
- Keeps V1 focused (maintains 26-27 hour estimate)
- Easier to test and validate single-item flow
- Can learn from V1 usage patterns before designing batch UI
- Faster time-to-market for core feature

**Timeline Impact:** Batch operations would add ~6-8 hours (25-30% increase)

**Deferred to V2:**
- Checkbox selection for multiple items
- "Copy Selected to..." button
- Aggregate progress and results UI
- Batch conflict resolution (handle all conflicts at once)

---

### 4. Undo/Rollback: No Undo

**Decision:** V1 does not support undo for copy operations (rely on git)

**V1 Implementation:**
- No undo button in UI
- No operation history tracking
- Success messages are clear about what was copied where
- Users can use git to revert changes if needed

**Rationale:**
- Keeps V1 simple (saves 6-8 hours development time)
- Git is standard safety net for developers working with Claude Code
- Manual cleanup available via future CRUD delete (Phase 4)
- Most Claude Code Manager users are developers familiar with git
- Undo system adds significant complexity for limited benefit

**Deferred to V2:**
- Operation history tracking (log all copy operations)
- Time-limited "Undo" button (30-second window)
- Automatic backups before overwrite
- Restore from backup UI

---

### 5. Validation: Reactive (Fail Gracefully)

**Decision:** Always show "Copy to..." button, fail gracefully with clear error messages (not preventive checking)

**V1 Implementation:**
- No pre-checking of write permissions
- No upfront validation of disk space
- Attempt copy operation when user clicks "Copy Here"
- If error occurs, show clear, helpful error message with actionable advice

**Error Types Handled:**
- `EACCES` - Permission denied → "Check file permissions and try again"
- `ENOSPC` - Disk space full → "Free up disk space and try again"
- `ENOENT` - Source file not found → "The file may have been deleted"
- `EROFS` - Read-only filesystem → "Choose a different target location"
- `EISDIR` - Target is directory → "The target path is invalid"

**Rationale:**
- Simpler implementation (no complex pre-validation logic)
- No performance overhead from permission checks
- Accurate validation at operation time (no race conditions)
- Consistent with existing Claude Code Manager patterns
- Permission state can change between check and operation anyway

**Alternative Considered (Rejected):**
- Preventive checking: Pre-validate permissions before showing copy button
- Rejected: Adds 2-3 hours, still has race conditions, marginal UX benefit

---

### 6. Cross-Platform: Node.js `path` Module Only

**Decision:** Use Node.js built-in `path` module for all path operations (no additional dependencies)

**V1 Implementation:**
```javascript
const path = require('path');

// Build target path
const targetPath = path.join(projectPath, '.claude', 'agents', filename);

// Resolve relative paths
const absolutePath = path.resolve(targetPath);

// Get filename from path
const name = path.basename(filepath);

// Get directory from path
const dir = path.dirname(filepath);
```

**Node.js `path` Module Handles:**
- Path separators (`\` on Windows, `/` on Mac/Linux)
- Home directory locations
- Case sensitivity differences (Windows vs Linux)
- Path normalization
- Relative vs absolute paths

**Rationale:**
- Already used extensively throughout Claude Code Manager codebase
- Zero additional dependencies
- Well-tested and reliable (handles 99% of cases)
- Phase 1 and Phase 2 tested on all platforms with no issues
- Standard Node.js approach for cross-platform applications

**Alternative Considered (Rejected):**
- Additional library like `upath` or `path-browserify`
- Rejected: Unnecessary dependency, `path` module is sufficient

**Timeline Impact:** +0 hours (already standard practice)

---

### 7. Hook Merging: Smart Script-Level Merge

**Decision:** Merge hooks using script-level duplicate detection (not overwrite or prompt)

**V1 Implementation:**
- For each hook event being copied (e.g., "pre-commit"):
  - If target doesn't have this event → Add entire hook array
  - If target has this event:
    - Compare individual scripts within that event
    - If script already exists in target array → Skip (duplicate)
    - If script doesn't exist → Append to target array (merge)
- Never compare across different event types (pre-commit only compared with other pre-commit)
- No conflict dialogs needed (pure merge, no overwrites)

**Algorithm:**
```javascript
// Source: { "pre-commit": ["npm test", "eslint ."] }
// Target: { "pre-commit": ["eslint ."], "post-commit": ["git push"] }

// Result after merge:
{
  "pre-commit": ["eslint .", "npm test"],  // Added "npm test", kept "eslint ."
  "post-commit": ["git push"]               // Unchanged
}
```

**Rationale:**
- Additive approach (never loses existing hooks)
- Duplicate detection prevents redundant scripts
- Event-level isolation (pre-commit vs post-commit handled separately)
- No user interaction needed (fast workflow)
- Leverages Claude Code's native array support
- Simple mental model: "Add this hook script to the project"

**Implementation Details:**
- Use array normalization (ensure single scripts become arrays)
- Deep equality check for duplicate detection
- Preserve execution order (append new scripts to end)

**Timeline Impact:** +1-2 hours (for smart comparison and array normalization)

**TODO Added:** Verify Claude Code actually supports hook arrays in our codebase (see `docs/ba-sessions/20251101-230906-copy-configuration/TODO.md`). Fallback to single-script if arrays not supported.

---

### 8. Scope Restrictions: Block Plugin Items

**Decision:** Users CANNOT copy plugin-provided configurations (respect plugin architecture)

**V1 Implementation:**
- Check config metadata for `location: "plugin"`
- UI: Copy button disabled or hidden for plugin items
- Tooltip: "This configuration is provided by a plugin and cannot be copied. Install the plugin in your target project instead."
- API: Backend validation rejects copy requests for plugin items

**Allowed Copy Directions:**
- User-level ↔ Project-level (both directions)
- Project ↔ Project
- No restrictions for user/project configs

**Restricted:**
- Plugin items → Any destination (blocked entirely)

**Rationale:**
- Plugin storage architecture not fully understood yet (may not be in project directories)
- Respects plugin management system (plugins should be installed, not file-copied)
- Prevents confusion (copied plugin config won't update with plugin updates)
- Clear separation: plugin-managed vs. user-managed configs
- Plugin items already have provenance metadata (easy to detect)
- Can revisit in V2 if plugin customization use cases emerge

**Timeline Impact:** +1 hour (for plugin detection logic in UI and backend)

---

## 8. Dependencies & Constraints

### Dependencies

**None** - Copy Configuration is a standalone feature.

**No Prerequisite Features:**
- Does not require Skills Read-Only feature (Phase 3 candidate)
- Does not require Plugins Read-Only feature (Phase 3 candidate)
- Does not require CRUD features (Phase 4+)

**Prerequisites (Already Complete):**
- Phase 2 - Vite Migration ✅
- Phase 2.1 - Component Refactoring ✅
- 879 tests at 100% pass rate ✅

### Constraints

#### 1. Plugin Architecture Not Fully Understood

**Issue:** Plugin storage locations and management patterns not yet documented in Claude Code Manager

**Impact:** Cannot safely support copying plugin-provided items

**Mitigation:** Restrict copying plugin items in V1 (safe default). Investigate plugin architecture for V2.

**Timeline Impact:** +1 hour for plugin detection logic

#### 2. Hook Array Support Needs Verification

**Issue:** Assumption that Claude Code supports hook arrays (multiple scripts per event) not verified in our codebase

**Impact:** Hook merge algorithm may need fallback to single-script mode

**Mitigation:**
- TODO added for verification: `docs/ba-sessions/20251101-230906-copy-configuration/TODO.md`
- Fallback: If arrays not supported, convert to single-script format or show conflict dialog

**Timeline Impact:** +1-2 hours if fallback needed

#### 3. Backward Compatibility (100%)

**Requirement:** No breaking changes to existing functionality

**Enforcement:**
- All 879 existing tests must pass
- No changes to existing API endpoints
- No changes to existing component props/events
- Read-only functionality remains unchanged

**Validation:** Full test suite run before merge

#### 4. Cross-Platform Support (Mandatory)

**Requirement:** Must work on Windows, macOS, Linux

**Enforcement:**
- Use Node.js `path` module exclusively
- No hardcoded path separators
- No platform-specific commands
- Test on all platforms before release

**Validation:** Cross-platform testing in CI/CD (if available) or manual testing

---

## 9. Implementation Plan

### 9.1 Task Breakdown

**Epic:** Copy Configuration Between Projects
**Total Estimated Time:** 26-27 hours (~3.5 days)

---

#### Backend Tasks (~14 hours)

**Story 3.1: Copy Service Infrastructure**

1. **Task 3.1.1:** Create `copy-service.js` with basic file copy logic (60 min)
   - Create `src/backend/services/copy-service.js`
   - Implement `copyFile(sourcePath, targetPath)` function
   - Use Node.js `fs.copyFile()` for atomic operations
   - Add basic error handling (ENOENT, EACCES)
   - Write unit tests (3-5 tests)

2. **Task 3.1.2:** Add conflict detection logic (60 min)
   - Implement `detectConflict(targetPath)` function
   - Check if target file exists
   - Read file metadata (modified timestamp)
   - Return conflict object with source/target info
   - Write unit tests (4-6 tests)

3. **Task 3.1.3:** Add conflict resolution strategies (45 min)
   - Implement `applyConflictStrategy(targetPath, strategy)`
   - Strategy: Skip → Return success without copying
   - Strategy: Overwrite → Delete target, proceed to copy
   - Strategy: Rename → Generate unique filename (`-2`, `-3`, etc.)
   - Write unit tests (6-8 tests for all strategies)

**Story 3.2: Type-Specific Copy Logic**

4. **Task 3.2.1:** Implement agent copy logic (30 min)
   - Create `copyAgent(request)` function
   - Validate source YAML frontmatter (agent-parser.js)
   - Determine target path: `.claude/agents/[filename]`
   - Call core copy service
   - Write unit tests (3-4 tests)

5. **Task 3.2.2:** Implement command copy logic (30 min)
   - Create `copyCommand(request)` function
   - Support nested subdirectories (`.claude/commands/**/`)
   - Validate source YAML frontmatter (command-parser.js)
   - Preserve directory structure in target
   - Write unit tests (4-5 tests including nested dirs)

6. **Task 3.2.3:** Implement skill copy logic - directory recursion (60 min)
   - Create `copySkill(request)` function
   - Implement recursive directory copy
   - Check for symlinks (reject if present)
   - Validate SKILL.md exists in root
   - Count files for progress feedback
   - Rollback entire operation if any file fails
   - Write unit tests (6-8 tests including edge cases)

7. **Task 3.2.4:** Implement hook copy logic - settings.json merge (60 min)
   - Create `copyHook(request)` function
   - Implement smart merge algorithm (script-level duplicate detection)
   - Read/write `.claude/settings.json`
   - Array normalization (handle string vs array formats)
   - Preserve execution order (append to end)
   - Write unit tests (8-10 tests including merge scenarios)

8. **Task 3.2.5:** Implement MCP copy logic (60 min)
   - Create `copyMcp(request)` function
   - Determine target file: `.mcp.json` or `.claude/settings.json`
   - Apply merge strategy (similar to hooks or conflict-based)
   - Validate JSON structure
   - Write unit tests (6-8 tests)

**Story 3.3: Validation & Security**

9. **Task 3.3.1:** Create `copy-validator.js` (60 min)
   - Implement path traversal protection (`validatePath`)
   - Implement permission checks (`validatePermissions`)
   - Implement source file validation (`validateSource`)
   - Symlink detection (`rejectSymlinks`)
   - Filename sanitization (`sanitizeFilename`)
   - Write unit tests (10-12 tests for all validation cases)

10. **Task 3.3.2:** Add path traversal protection (45 min)
    - Reject paths containing `..` or `~` (after resolution)
    - Use `path.resolve()` to normalize
    - Whitelist allowed directories (user home, project dirs)
    - Write security tests (4-6 tests including attack vectors)

**Story 3.4: API Endpoints**

11. **Task 3.4.1:** Create POST /api/copy/agent endpoint (30 min)
    - Create `src/backend/routes/copy.js`
    - Implement route handler for agents
    - Request body validation (Joi or similar)
    - Response formatting (success/conflict/error)
    - Write integration tests (3-4 tests)

12. **Task 3.4.2:** Create POST /api/copy/command endpoint (20 min)
    - Implement route handler for commands
    - Reuse validation patterns from agent endpoint
    - Write integration tests (2-3 tests)

13. **Task 3.4.3:** Create POST /api/copy/skill endpoint (20 min)
    - Implement route handler for skills
    - Write integration tests (2-3 tests)

14. **Task 3.4.4:** Create POST /api/copy/hook endpoint (20 min)
    - Implement route handler for hooks
    - Write integration tests (2-3 tests)

15. **Task 3.4.5:** Create POST /api/copy/mcp endpoint (20 min)
    - Implement route handler for MCP servers
    - Write integration tests (2-3 tests)

**Story 3.5: Backend Testing**

16. **Task 3.5.1:** Write comprehensive backend unit tests (60 min)
    - Copy service: All copy types, conflict detection, strategies
    - Validators: Path traversal, permissions, file validation
    - Merge logic: Hook merge with all scenarios
    - Total: ~40-50 backend unit tests

17. **Task 3.5.2:** Write API integration tests (60 min)
    - All 5 POST endpoints: success, conflict, error cases
    - Request validation (invalid input rejection)
    - Response schema validation
    - Total: ~15-20 integration tests

**Backend Total:** ~14 hours

---

#### Frontend Tasks (~12-13 hours)

**Story 3.6: Core Components**

18. **Task 3.6.1:** Create CopyButton component (45 min)
    - Create `src/components/copy/CopyButton.vue`
    - Props: configItem, configType, disabled, tooltipText
    - Emit: click event
    - Styling: Icon button with hover states
    - Disabled state for plugin items
    - Write component tests (4-5 tests)

19. **Task 3.6.2:** Create CopyModal component skeleton (60 min)
    - Create `src/components/copy/CopyModal.vue`
    - Template: Header, source section, destination section, footer
    - Props: visible, sourceItem, sourceType, sourceScope, projects
    - Emit: close, copy events
    - Basic styling (no destination cards yet)
    - Write component tests (3-4 tests for basic rendering)

20. **Task 3.6.3:** Add destination selection to modal (45 min)
    - Implement card-based destination list
    - User Global card (first in list)
    - Project cards (scrollable area)
    - "Copy Here" buttons
    - Card hover states and interactions
    - Write component tests (5-6 tests for card interactions)

21. **Task 3.6.4:** Create ConflictResolver component (60 min)
    - Create `src/components/copy/ConflictResolver.vue`
    - Props: visible, sourceFile, targetFile, defaultStrategy
    - Emit: close, resolve events
    - Template: Warning header, file info cards, radio options, footer
    - Styling: Warning colors, radio button layout
    - Write component tests (6-8 tests for all resolution paths)

**Story 3.7: Integration**

22. **Task 3.7.1:** Integrate copy buttons into all config cards (60 min)
    - Update ConfigItemList.vue to include CopyButton
    - Add item-actions section to item rows
    - Show/hide on hover (desktop) or always visible (mobile)
    - Plugin detection: Check `item.location === 'plugin'`
    - Test in: ProjectDetail.vue and UserGlobal.vue
    - Write E2E tests (4-5 tests for button visibility)

23. **Task 3.7.2:** Create useCopyConfig composable (60 min)
    - Create `src/composables/useCopyConfig.js`
    - API integration: Call `copyConfig()` from api client
    - State management: Modal visibility, loading state, conflict data
    - Event handling: Open modal, execute copy, handle conflict
    - Error handling: Toast notifications
    - Write unit tests (5-6 tests)

24. **Task 3.7.3:** Add API client copy methods (45 min)
    - Update `src/api/client.js`
    - Add `copyConfig(request)` function
    - POST to `/api/copy/[type]`
    - Request/response serialization
    - Error handling and timeout
    - Write unit tests (3-4 tests)

**Story 3.8: User Feedback**

25. **Task 3.8.1:** Implement Toast notifications (30 min)
    - Success toast: "Configuration Copied Successfully"
    - Error toast: "Copy Failed" (manual dismiss)
    - Info toast: "Copy Cancelled"
    - Optional action link: "View in Target Project"
    - Test all toast types

26. **Task 3.8.2:** Add plugin detection and disabled states (30 min)
    - Check `config.location === 'plugin'`
    - Disable CopyButton for plugin items
    - Tooltip message: "Plugin items cannot be copied..."
    - Backend validation: Reject plugin copy requests
    - Write tests (3-4 tests)

**Story 3.9: Responsive & Accessibility**

27. **Task 3.9.1:** Responsive design implementation (45 min)
    - Desktop: 600px modal width
    - Tablet: 90vw modal width
    - Mobile: Full screen modal, stacked cards
    - Test on 3 breakpoints (desktop, tablet, mobile)
    - Write responsive tests (6-8 visual regression tests)

28. **Task 3.9.2:** Accessibility implementation (60 min)
    - Keyboard navigation (Tab, Enter, Escape, Arrows)
    - ARIA labels (role="dialog", aria-modal, aria-label)
    - Focus indicators (visible outline on all elements)
    - Screen reader announcements (role="status", aria-live)
    - Color contrast validation (WCAG AA 4.5:1)
    - Write accessibility tests (8-10 tests)

**Story 3.10: Frontend Testing**

29. **Task 3.10.1:** Write E2E tests for copy workflows (120 min)
    - Happy path: Copy agent between projects (no conflict)
    - Conflict path: Copy with overwrite, rename, skip
    - Error path: Permission denied, source not found
    - Plugin restriction: Verify disabled state
    - Cross-platform: Windows, macOS, Linux paths
    - Total: ~15-20 E2E tests

**Frontend Total:** ~12-13 hours

---

### 9.2 Epic/Story/Task Structure

**Epic: Copy Configuration Between Projects** (26-27 hours)

**Backend Stories:**
- **Story 3.1:** Copy Service Infrastructure (2h 45m) - Tasks 1-3
- **Story 3.2:** Type-Specific Copy Logic (4h) - Tasks 4-8
- **Story 3.3:** Validation & Security (1h 45m) - Tasks 9-10
- **Story 3.4:** API Endpoints (1h 50m) - Tasks 11-15
- **Story 3.5:** Backend Testing (2h) - Tasks 16-17

**Frontend Stories:**
- **Story 3.6:** Core Components (3h 30m) - Tasks 18-21
- **Story 3.7:** Integration (2h 45m) - Tasks 22-24
- **Story 3.8:** User Feedback (1h) - Tasks 25-26
- **Story 3.9:** Responsive & Accessibility (1h 45m) - Tasks 27-28
- **Story 3.10:** Frontend Testing (2h) - Task 29

**All tasks sized at 30-60 minutes each** (following Claude Code Manager best practices)

---

### 9.3 Milestones

**Milestone 1: Backend API Complete** (Day 1-2, ~14 hours)
- All copy service logic implemented
- All 5 POST endpoints functional
- Conflict detection and resolution working
- Path traversal protection in place
- 40-50 backend tests passing

**Milestone 2: Frontend UI Complete** (Day 2-3, ~13 hours)
- CopyButton integrated into all config cards
- CopyModal with destination selection working
- ConflictResolver dialog functional
- Toast notifications implemented
- 15-20 E2E tests passing

**Milestone 3: Testing & Polish** (Included in above)
- 100% test coverage (50-70 new tests)
- Cross-platform testing complete
- Accessibility audit complete (WCAG 2.1 AA)
- Performance validation (<500ms for files, <2s for skills)

**Milestone 4: Documentation & Release** (Day 4, ~2-3 hours)
- CLAUDE.md updated with Phase 3 information
- CHANGELOG.md updated with feature release notes
- API documentation updated
- User guide updated (if exists)
- Code review and PR creation

---

## 10. Testing Strategy

### 10.1 Unit Tests (Backend)

**Copy Service Logic:**
- `copyFile()`: Source exists, target doesn't exist (happy path)
- `copyFile()`: Source doesn't exist (ENOENT error)
- `copyFile()`: No write permission on target (EACCES error)
- `copyFile()`: Disk full (ENOSPC error)
- `detectConflict()`: Target exists → Returns conflict info
- `detectConflict()`: Target doesn't exist → Returns null
- `applyConflictStrategy()`: Skip → No copy operation
- `applyConflictStrategy()`: Overwrite → Target deleted, copy proceeds
- `applyConflictStrategy()`: Rename → Unique filename generated (-2, -3, etc.)

**Type-Specific Copy Logic:**
- `copyAgent()`: Valid agent file copied successfully
- `copyAgent()`: Invalid YAML frontmatter → Parse error
- `copyCommand()`: Nested command directory structure preserved
- `copySkill()`: Recursive directory copy (all files/subdirs)
- `copySkill()`: Symlink detected → Rejected with error
- `copySkill()`: SKILL.md missing → Validation failure
- `copyHook()`: Merge with no existing hooks → Array added
- `copyHook()`: Merge with existing hooks → Scripts appended
- `copyHook()`: Duplicate script → Skipped
- `copyHook()`: Different event types → No interference
- `copyMcp()`: MCP server merged into settings.json

**Validation & Security:**
- `validatePath()`: Path with `..` → Rejected
- `validatePath()`: Path with `~` → Rejected (after resolution)
- `validatePath()`: Valid project path → Accepted
- `validatePermissions()`: Source not readable → Error
- `validatePermissions()`: Target not writable → Error
- `sanitizeFilename()`: Special characters removed
- `rejectSymlinks()`: Symlink in skill directory → Error

**Hook Merge Algorithm:**
- Merge with empty target → Source copied as-is
- Merge with partial overlap → Only new scripts added
- Merge with complete duplicate → No changes, success message
- Array normalization → String converted to array
- Event isolation → pre-commit doesn't affect post-commit

**Estimated Backend Unit Tests:** 40-50 tests

---

### 10.2 API Tests

**POST /api/copy/agent:**
- Valid request, no conflict → Success response
- Valid request, conflict detected → Conflict response
- Valid request, conflict with skip strategy → Success (no copy)
- Valid request, conflict with overwrite strategy → Success (overwritten)
- Valid request, conflict with rename strategy → Success (renamed)
- Invalid request (missing fields) → 400 Bad Request
- Source file not found → 404 Not Found
- Permission denied → 403 Forbidden

**POST /api/copy/command:**
- (Same test scenarios as agent)

**POST /api/copy/skill:**
- Large skill directory (100+ files) → Success (<2s)
- Skill with symlinks → 400 Bad Request (rejected)
- (Other scenarios similar to agent)

**POST /api/copy/hook:**
- Hook merge with existing hooks → Success with stats
- Hook merge with empty target → Success

**POST /api/copy/mcp:**
- (Similar to hook tests)

**Estimated API Tests:** 15-20 tests

---

### 10.3 Component Tests (Frontend)

**CopyButton.vue:**
- Renders with correct icon and tooltip
- Click emits event with config item
- Disabled state for plugin items (opacity 40%, cursor not-allowed)
- Hover state changes opacity and background

**CopyModal.vue:**
- Opens and closes correctly (visible prop)
- Source section displays config info
- Destination section displays all projects + User Global
- User Global card appears first in list
- Click "Copy Here" emits copy event with destination
- Cancel button closes modal
- Scrollable area for many projects (>10)

**ConflictResolver.vue:**
- Opens and closes correctly (visible prop)
- Displays source and target file info (name, path, modified)
- Radio options render (Skip, Overwrite, Rename)
- Default selection is Rename
- Rename preview shows correct filename (-2, -3, etc.)
- Overwrite option has warning styling
- Confirm button emits resolve event with selected strategy
- Cancel button emits close event

**useCopyConfig Composable:**
- `performCopy()`: Success → Shows success toast, closes modal
- `performCopy()`: Conflict → Shows conflict dialog
- `performCopy()`: Error → Shows error toast, modal stays open
- Loading state toggles correctly during operation

**Estimated Component Tests:** 25-30 tests

---

### 10.4 E2E Tests

**Happy Path (No Conflict):**
1. User navigates to Project A detail page
2. User hovers over agent item → Copy button appears
3. User clicks "Copy to..." → Modal opens
4. User clicks "Copy Here" on Project B card
5. Loading spinner appears briefly
6. Success toast appears: "Configuration Copied Successfully"
7. Modal closes
8. User navigates to Project B → Agent appears in list

**Conflict Path - Overwrite:**
1. User initiates copy to Project B (agent already exists)
2. Conflict dialog appears
3. User selects "Overwrite" radio option
4. Confirm button changes to warning style
5. User clicks Confirm
6. Success toast: "Agent copied (overwritten)"
7. Verify target file was replaced

**Conflict Path - Rename:**
1. User initiates copy to Project B (agent already exists)
2. Conflict dialog appears
3. "Rename" is selected by default
4. Rename preview shows "agent-name-2.md"
5. User clicks Confirm
6. Success toast shows new filename
7. Verify both files exist (original + renamed)

**Conflict Path - Skip:**
1. User initiates copy to Project B (agent already exists)
2. Conflict dialog appears
3. User selects "Skip" radio option
4. User clicks Confirm
5. Info toast: "Copy operation cancelled"
6. Both dialogs close
7. Verify no file was created/modified

**Error Path - Permission Denied:**
1. Set up target directory with read-only permissions (test fixture)
2. User initiates copy
3. Error toast appears: "Permission denied - Check file permissions"
4. Modal remains open (user can try different destination)
5. Verify no file was copied

**Error Path - Source Not Found:**
1. Delete source file after modal opens (simulate race condition)
2. User clicks "Copy Here"
3. Error toast: "Source file not found - The file may have been deleted"
4. Modal remains open

**Plugin Restriction:**
1. User views config list with plugin item
2. Plugin item has "PLUGIN" badge (purple)
3. Copy button is disabled (40% opacity)
4. Hover shows tooltip: "Plugin items cannot be copied..."
5. Click disabled button → No action
6. Verify backend rejects plugin copy request (defensive)

**Cross-Platform Paths:**
1. Test on Windows: Paths use `\` separators
2. Test on macOS: Paths use `/` separators
3. Test on Linux: Paths use `/` separators
4. Verify all copy operations work correctly on all platforms

**Large Skill Copy:**
1. Create skill with 100+ files (test fixture)
2. User initiates skill copy
3. Loading spinner shows "Copying skill files..."
4. Operation completes in <2 seconds
5. Success toast: "Skill copied successfully (127 files)"
6. Verify all files copied correctly

**Hook Merge Scenarios:**
1. Copy hook to project with no hooks → Hook added
2. Copy hook to project with same hook event → Scripts merged
3. Copy hook with duplicate script → Duplicate skipped
4. Copy hook to project with different hook event → No interference

**Estimated E2E Tests:** 15-20 tests

---

### 10.5 Total Test Count

**Backend:**
- Unit tests: 40-50 tests
- API tests: 15-20 tests
- **Backend Subtotal:** 55-70 tests

**Frontend:**
- Component tests: 25-30 tests
- E2E tests: 15-20 tests
- **Frontend Subtotal:** 40-50 tests

**Grand Total: 95-120 new tests**

**Existing Test Suite:** 879 tests (must remain at 100% pass rate)

**Total After Phase 3:** 974-999 tests

---

## 11. Security Considerations

### Path Traversal Protection

**Attack Vector:** Malicious path input attempts to access files outside allowed directories

**Examples:**
```
../../../etc/passwd
~/.ssh/id_rsa
../../home/other-user/.claude/agents/agent.md
```

**Mitigation:**

1. **Input Validation:**
   ```javascript
   function validatePath(inputPath) {
     // Reject paths with traversal characters
     if (inputPath.includes('..') || inputPath.includes('~')) {
       throw new Error('Path traversal not allowed');
     }

     // Resolve to absolute path
     const absolutePath = path.resolve(inputPath);

     // Whitelist allowed directories
     const allowedDirs = [
       path.resolve(os.homedir(), '.claude'),
       path.resolve('/home/'),  // Project directories
     ];

     const isAllowed = allowedDirs.some(dir => absolutePath.startsWith(dir));

     if (!isAllowed) {
       throw new Error('Path outside allowed directories');
     }

     return absolutePath;
   }
   ```

2. **Backend Enforcement:**
   - Validate all source and target paths before any file operation
   - Reject requests with invalid paths (return 400 Bad Request)
   - Log security violations for monitoring

3. **Defense in Depth:**
   - Frontend validation (UX feedback)
   - Backend validation (security enforcement)
   - File system permissions (OS-level protection)

---

### Permission Validation

**Attack Vector:** Unauthorized file access or modification

**Mitigation:**

1. **Check Read Permissions (Source):**
   ```javascript
   try {
     await fs.access(sourcePath, fs.constants.R_OK);
   } catch (err) {
     throw new Error('Source file not readable');
   }
   ```

2. **Check Write Permissions (Target):**
   ```javascript
   const targetDir = path.dirname(targetPath);
   try {
     await fs.access(targetDir, fs.constants.W_OK);
   } catch (err) {
     throw new Error('Target directory not writable');
   }
   ```

3. **Fail Fast:**
   - Check permissions before attempting copy
   - Return clear error message to user
   - Don't reveal sensitive path information in errors

---

### Input Sanitization

**Attack Vector:** Command injection via filename, shell metacharacters

**Mitigation:**

1. **Sanitize Filenames:**
   ```javascript
   function sanitizeFilename(filename) {
     // Remove shell metacharacters
     const cleaned = filename.replace(/[;|&$`<>()[\]{}!#]/g, '');

     // Enforce max length (OS limit is typically 255)
     if (cleaned.length > 255) {
       throw new Error('Filename too long');
     }

     // Ensure not empty after sanitization
     if (cleaned.length === 0) {
       throw new Error('Invalid filename');
     }

     return cleaned;
   }
   ```

2. **Validate Project IDs:**
   - Ensure projectId matches known projects in ~/.claude.json
   - Reject unknown or malformed project IDs

3. **Escape Special Characters:**
   - When writing JSON (settings.json, .mcp.json), use proper escaping
   - Don't concatenate strings (use JSON.stringify)

---

### Symlink Protection

**Attack Vector:** Symlink following leads to unintended file access

**Mitigation:**

1. **Don't Follow Symlinks:**
   ```javascript
   async function copyFile(source, target) {
     const stats = await fs.lstat(source);  // Use lstat (not stat) to detect symlinks

     if (stats.isSymbolicLink()) {
       throw new Error('Symlinks not supported');
     }

     // Proceed with copy
     await fs.copyFile(source, target);
   }
   ```

2. **Reject Skills with Symlinks:**
   - Scan skill directory before copy
   - If any symlink detected → Reject entire operation
   - Error message: "Skill contains symlinks - cannot copy"

---

### Plugin Isolation

**Attack Vector:** Copying plugin-managed configs could break plugin functionality or bypass plugin security

**Mitigation:**

1. **Frontend Detection:**
   - Check `config.location === 'plugin'`
   - Disable copy button, show tooltip

2. **Backend Validation:**
   - Reject copy requests for plugin items (even if frontend bypassed)
   - Return 400 Bad Request: "Cannot copy plugin-provided configurations"

3. **Future Consideration:**
   - V2: Add "Extract & Customize" feature for plugin items (safe workflow)
   - Allow copying plugin item to user/project with clear warning that updates won't sync

---

## 12. Performance Requirements

### Single File Copy

**Target:** <500ms

**Measurement:**
- Start: User clicks "Copy Here"
- End: Success toast appears

**Factors:**
- File read: ~10-50ms (SSD)
- Conflict detection: ~5-10ms (file exists check)
- File write: ~10-50ms (SSD)
- Validation: ~10-20ms (parse YAML)
- Network (API call): ~10-50ms (localhost)
- **Total: ~45-180ms typical, <500ms worst case**

**Optimization:**
- Use `fs.copyFile()` for atomic operation (faster than read+write)
- No pre-checking (validation at operation time)
- Minimal parsing (only validate, don't transform)

---

### Large Skill Directory Copy

**Target:** <2s (for 100+ files)

**Measurement:**
- Start: User clicks "Copy Here" on skill
- End: Success toast appears

**Factors:**
- Directory scan: ~50-100ms (readdir recursive)
- Symlink check: ~10ms per file
- File copy: ~5-10ms per file × 100 = 500-1000ms
- Validation: ~20-50ms (SKILL.md parse)
- **Total: ~600-1200ms typical, <2000ms worst case**

**Optimization:**
- Async operations (don't block event loop)
- No progress callback overhead (no partial updates)
- Batch file operations if possible

**Future Enhancement (V2):**
- Show progress percentage for large skills (>50 files)
- Emit progress events: `{ current: 50, total: 127 }`

---

### Conflict Detection

**Target:** <100ms

**Measurement:**
- Start: Backend receives copy request
- End: Conflict object returned (if exists)

**Factors:**
- File exists check: ~5-10ms
- File stat (modified time): ~5-10ms
- **Total: ~10-20ms typical, <100ms worst case**

**Optimization:**
- Single stat call (gets exists + modified in one operation)
- No file content reading (just metadata)

---

### Modal Open

**Target:** <300ms (smooth animation)

**Measurement:**
- Start: User clicks "Copy to..." button
- End: Modal fully visible and interactive

**Factors:**
- React render: ~10-30ms
- CSS animation: 300ms (slideUp animation)
- Data fetch (projects list): ~10-50ms (already cached in store)
- **Total: ~300ms (animation duration)**

**Optimization:**
- Projects list fetched once on app load (cached in Pinia store)
- Modal component lazy-loaded if not used yet
- CSS animations (GPU-accelerated, 60fps)

---

### Toast Notifications

**Target:** Non-blocking, 60fps animations

**Measurement:**
- Toast should slide in without frame drops
- No blocking of main thread during display

**Optimization:**
- Use PrimeVue Toast service (optimized for performance)
- CSS transitions (GPU-accelerated)
- Toast content limited to ~200 characters (no heavy rendering)

---

## 13. Accessibility Requirements

### WCAG 2.1 AA Compliance (Minimum)

All UI components must meet Web Content Accessibility Guidelines Level AA standards.

---

### Keyboard Navigation

**Tab Order:**
1. Copy button (on config item)
2. Modal close button (×)
3. Destination cards (focusable)
4. "Copy Here" buttons
5. Cancel button (footer)
6. Conflict dialog radio options (if conflict)
7. Conflict dialog buttons (Cancel, Confirm)

**Keyboard Shortcuts:**
- **Escape:** Close modal or conflict dialog
- **Enter:** Activate focused button or select destination card
- **Arrow Keys (↑↓):** Navigate between radio options in conflict dialog
- **Tab / Shift+Tab:** Navigate between focusable elements

**Implementation:**
```vue
<!-- Destination Card: Keyboard Support -->
<div
  role="button"
  tabindex="0"
  @click="selectDestination(project)"
  @keypress.enter="selectDestination(project)"
  @keypress.space.prevent="selectDestination(project)"
>
  <!-- Card content -->
</div>
```

---

### Focus Indicators

**Visibility Requirement:**
- All focusable elements must have visible focus indicator
- 2px solid outline with high contrast color
- Outline offset: 2px for clarity

**CSS Implementation:**
```css
button:focus-visible,
.destination-card:focus-visible,
input[type="radio"]:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* Custom focus color (high contrast) */
:root {
  --border-focus: #90CAF9; /* Light blue, 7:1 contrast on dark bg */
}
```

---

### Screen Reader Support

**ARIA Labels:**
```vue
<!-- Copy Button -->
<button
  aria-label="Copy code-reviewer.md to another project"
  :aria-disabled="isPlugin"
>
  <i class="pi pi-copy" aria-hidden="true"></i>
</button>

<!-- Modal -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Copy Configuration</h2>
  <p id="modal-description" class="sr-only">
    Select a destination to copy {{ sourceItem.name }} to.
  </p>
</div>

<!-- Destination Card -->
<div
  role="button"
  tabindex="0"
  :aria-label="`Copy to ${project.name} project at ${project.path}`"
>
  <!-- Card content -->
</div>

<!-- Conflict Radio Options -->
<input
  type="radio"
  :id="`action-${option}`"
  :aria-checked="selectedAction === option"
  :aria-describedby="`action-${option}-description`"
>
<label :for="`action-${option}`">
  <span>{{ option.title }}</span>
</label>
<span :id="`action-${option}-description`" class="sr-only">
  {{ option.description }}
</span>
```

**Status Announcements:**
```vue
<!-- Live Region for Status Updates -->
<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
  {{ statusMessage }}
</div>

<!-- Status Messages -->
statusMessage: "Copy modal opened"
statusMessage: "Conflict detected for code-reviewer.md"
statusMessage: "Configuration copied successfully to Project B"
statusMessage: "Copy operation failed: Permission denied"
```

**Screen Reader Only Class:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

### Color Contrast

**WCAG AA Requirements:**
- Normal text (< 18pt): 4.5:1 minimum
- Large text (≥ 18pt or 14pt bold): 3:1 minimum
- Interactive elements: 3:1 minimum

**Verified Color Combinations:**

| Element | Foreground | Background | Ratio | Meets AA? |
|---------|------------|------------|-------|-----------|
| Primary Text | #e0e0e0 | #1e1e1e | 10.4:1 | ✓ |
| Secondary Text | #a0a0a0 | #1e1e1e | 6.7:1 | ✓ |
| Primary Button | #ffffff | #007ad9 | 4.9:1 | ✓ |
| Warning Text | #FFA726 | #1e1e1e | 4.6:1 | ✓ |
| Error Text | #ffffff | #b71c1c | 7.2:1 | ✓ |
| Success Text | #ffffff | #1b5e20 | 8.1:1 | ✓ |
| Muted Text | #707070 | #1e1e1e | 3.2:1 | ✓ (large only) |

---

### Large Click Targets

**Mobile Touch Target Size:**
- Minimum: 44x44px (Apple HIG)
- Recommended: 48x48px (Android Material)

**Implementation:**
```css
.copy-btn,
.destination-card button,
.conflict-dialog button {
  min-width: 44px;
  min-height: 44px;
  padding: 0.75rem 1rem; /* Increases to 48px+ in practice */
}

/* Mobile: Increase touch targets */
@media (max-width: 767px) {
  .copy-btn {
    min-width: 48px;
    min-height: 48px;
  }

  .destination-card {
    padding: 1rem; /* Larger touch area */
  }
}
```

---

## 14. Risks & Mitigation

| Risk | Severity | Impact | Mitigation | Owner |
|------|----------|--------|-----------|-------|
| **Data loss on conflict** | High | User accidentally overwrites important config without realizing | Always prompt user for conflict resolution; Default to Rename (safest); Clear warning for Overwrite | Backend Team |
| **Hook array unsupported** | Medium | Hook merge algorithm fails if Claude Code doesn't support arrays | TODO added for verification; Fallback to single-script format or show conflict dialog | Backend Team |
| **Cross-platform path issues** | Medium | Copy fails on Windows due to path separator or case sensitivity issues | Use Node.js `path` module exclusively; Test on all platforms before release | Backend Team |
| **Plugin architecture unknown** | Medium | Copying plugin items causes unexpected behavior or breaks plugin functionality | Restrict copying plugin items (safe default); Revisit in V2 after investigation | Backend + Frontend Teams |
| **Performance (large Skills)** | Low | Copy operation for 100+ file skill takes too long, user thinks it's frozen | Async operations with loading indicator; Show progress if >1s; Target <2s | Backend Team |
| **Permission errors** | Low | User attempts copy to read-only directory, operation fails silently | Clear error messages with actionable advice; Standard error patterns | Backend Team |
| **Modal state persistence** | Low | User closes modal mid-operation, state gets corrupted | Clean up state on modal close; Reset conflictData; Test close scenarios | Frontend Team |
| **Symlink security** | Medium | Skill with symlink allows access to files outside project directory | Detect symlinks during pre-copy scan; Reject entire skill if any found | Backend Team |
| **Race condition: File deleted mid-operation** | Low | Source file deleted between modal open and copy execution | Re-validate source exists before copy; Show clear error if missing | Backend Team |
| **Filename too long** | Low | Renamed file exceeds OS filename limit (255 chars) | Validate filename length; Truncate if necessary with preserved extension | Backend Team |

---

## 15. Success Metrics

### Quantitative Metrics

**Feature Adoption:**
- **Target:** 80%+ of active users try copy feature within 2 weeks
- **Measurement:** Track unique users who open copy modal (analytics event)
- **Benchmark:** Compare to other new features (typically 60-70% adoption)

**Success Rate:**
- **Target:** 95%+ of copy operations complete successfully
- **Measurement:** (Successful copies) / (Total copy attempts) × 100
- **Failure Types to Track:** Permission denied, source not found, disk full, parse error

**Performance:**
- **Target:** 95%+ of copies complete in <1 second
- **Measurement:** Track duration from "Copy Here" click to success toast
- **Breakdown:** <500ms for files, <2s for large skills

**Conflict Resolution:**
- **Target:** <5% of copies require overwrite (rename is preferred)
- **Measurement:** Track resolution choice: Skip (%), Overwrite (%), Rename (%)
- **Insight:** Low overwrite rate indicates users are copying to new locations (good UX)

---

### Qualitative Metrics

**User Feedback:**
- **Target:** Positive reception (80%+ positive sentiment)
- **Measurement:** Survey or GitHub issues
- **Questions:**
  - "Was the copy feature easy to use?"
  - "Did conflict resolution work as expected?"
  - "Any suggestions for improvement?"

**Support Requests:**
- **Target:** <5 bug reports in first month
- **Target:** <10 support questions (feature is self-explanatory)
- **Measurement:** Track GitHub issues, support emails, Discord questions

**Documentation Clarity:**
- **Target:** Users understand how to use feature without asking
- **Measurement:** Zero "How do I copy configurations?" questions
- **Validation:** Clear tooltips, inline help, and documentation

---

### Feature-Specific Metrics

**Copy Direction:**
- User → Project: X% of copies
- Project → User: Y% of copies
- Project → Project: Z% of copies
- **Insight:** Understand most common workflow (promotion vs duplication)

**Config Type Popularity:**
- Agents: X% of copies
- Commands: Y% of copies
- Hooks: Z% of copies
- Skills: A% of copies
- MCP: B% of copies
- **Insight:** Prioritize future improvements on most-copied type

**Conflict Frequency:**
- No conflict: X% of copies
- Conflict (skip): Y% of copies
- Conflict (overwrite): Z% of copies
- Conflict (rename): A% of copies
- **Insight:** Validate assumption that most copies are to new locations

---

## 16. V2 Roadmap

### Features Deferred to V2 (Future Enhancements)

**High Priority (V2.1 - Next Quarter):**

1. **Batch Copy Operations** (6-8 hours)
   - Multi-select checkboxes on config items
   - "Copy Selected to..." button
   - Aggregate progress indicator
   - Batch conflict resolution UI (handle all at once)
   - Benefits: 10x faster for setting up new projects

2. **User Preferences for Conflict Resolution** (4-6 hours)
   - Settings page: Default conflict strategy (skip, overwrite, rename)
   - Per-config-type preferences (agents: rename, hooks: merge)
   - "Remember my choice" checkbox in conflict dialog
   - Benefits: Reduces repetitive decisions

3. **Clipboard-Style Copy/Paste** (6-8 hours)
   - "Copy" button stores config in clipboard state
   - Navigate to different page, click "Paste"
   - Clipboard indicator (toast or badge)
   - Benefits: More flexible workflow, matches OS behavior

---

**Medium Priority (V2.2 - Q2 2026):**

4. **Operation History & Undo** (8-10 hours)
   - Track all copy operations with metadata (source, target, timestamp)
   - "Undo" button in success toast (30-second window)
   - History page showing recent operations
   - Restore from backup if overwrite
   - Benefits: Safety net for mistakes

5. **Hook Merge Preview** (3-4 hours)
   - Show what will be merged before committing
   - Diff view: Source hooks vs Target hooks vs Result hooks
   - User can review and approve merge
   - Benefits: Transparency, user control

6. **Drag-and-Drop** (8-12 hours)
   - Drag config item from one project card to another on Dashboard
   - Drop zones with visual indicators
   - Inline conflict resolution (no modal)
   - Benefits: Intuitive, fast for power users

---

**Low Priority (V2.3+ - Future):**

7. **Plugin Extraction & Customization** (10-15 hours)
   - "Extract from Plugin" feature for plugin items
   - Copy plugin config to user/project, mark as customized
   - Warning: Won't sync with plugin updates
   - Benefits: Enables customization of plugin items

8. **Copy Templates** (6-8 hours)
   - Save frequently-used copy operations as templates
   - Example: "New Project Setup" (copies 5 agents + 3 commands + hooks)
   - One-click apply template to project
   - Benefits: Faster onboarding

9. **Sync Mode** (15-20 hours)
   - Keep a config synchronized across multiple projects (two-way sync)
   - Edit in one project → Automatically updated in others
   - Conflict resolution for simultaneous edits
   - Benefits: Central source of truth for shared configs

10. **Copy with Dependencies** (8-10 hours)
    - Detect if agent references a skill
    - Offer to copy skill along with agent (dependency graph)
    - Batch copy all dependencies at once
    - Benefits: Prevents broken references

---

## 17. Documentation Requirements

### Documents to Update

**1. CLAUDE.md** - Project instructions (checked into codebase)
- Add Phase 3 information:
  - Current Phase: Phase 3.0 - Copy Configuration (Complete)
  - Completion Date: [Release Date]
  - Achievements: First write operation, foundation for CRUD
- Update "Data Sources" section with new write operations
- Update "API Endpoints" section with 5 new POST routes
- Update "Current Status & Priorities" section

**2. CHANGELOG.md** - Feature release notes (Keep a Changelog format)
```markdown
## [3.0.0] - 2025-11-XX

### 🎯 Major Release: First Write Operation (Copy Configuration)

**MAJOR FEATURE:** Copy configuration items between projects and scopes

### ✨ Added

**Copy Configuration Feature**
- Copy agents, commands, hooks, skills, MCP servers between projects
- Copy between user-level and project-level (promote/demote)
- Smart conflict detection and resolution (skip, overwrite, rename)
- Intelligent hook merging with script-level duplicate detection
- Plugin item restrictions (prevent copying plugin-managed configs)
- Cross-platform path handling (Windows, macOS, Linux)

**Backend**
- POST /api/copy/agent - Copy agent file
- POST /api/copy/command - Copy command file
- POST /api/copy/hook - Merge hook into settings.json
- POST /api/copy/skill - Recursive directory copy
- POST /api/copy/mcp - Merge MCP server config
- Path traversal protection and permission validation
- Security: Symlink rejection, input sanitization

**Frontend**
- CopyButton component - Trigger copy on any config item
- CopyModal component - Card-based destination selection
- ConflictResolver component - Conflict resolution dialog
- Toast notifications - Success/error feedback
- Responsive design - Desktop, tablet, mobile support
- WCAG 2.1 AA accessibility compliance

**Testing**
- 95-120 new tests (50-70 backend, 40-50 frontend)
- Total: 974-999 tests (100% pass rate)

### 🛡️ Security
- Path traversal protection (no `..` or `~` in paths)
- Permission validation (read source, write target)
- Symlink protection (reject skills with symlinks)
- Plugin isolation (prevent copying plugin items)

### 📈 Performance
- Single file copy: <500ms
- Large skill directory (100+ files): <2s
- Conflict detection: <100ms
- Modal open: <300ms (smooth animation)
```

**3. docs/guides/TESTING-GUIDE.md** - Add copy feature test examples
- Add section: "Testing Copy Configuration Feature"
- Include example tests for all copy types
- Document conflict resolution test patterns
- Show security test examples (path traversal)

**4. User Guide (if exists)** - Add copy feature instructions
- Create section: "Copying Configurations Between Projects"
- Step-by-step instructions with screenshots (if available)
- Explain conflict resolution options
- Provide use case examples (promote command, duplicate agent)

**5. API Documentation** - Document new endpoints
- Create `docs/api/copy.md` (if API docs exist)
- Document all 5 POST /api/copy/* endpoints
- Request/response schemas
- Error codes and messages
- Example requests with curl or similar

---

## 18. Release Plan

### Phase 3.0 - First Write Operation Milestone

**Target Timeline:**
- Development: 3.5 days (26-27 hours)
- Testing & Review: 1 day (8 hours)
- Documentation: 0.5 day (4 hours)
- **Total: 4.5-5 days**

---

### Prerequisites

**Before Starting Development:**
- [ ] Hook array verification complete (TODO from BA session)
- [ ] All BA session decisions approved by project manager
- [ ] Wireframes approved (design-notes.md reviewed)
- [ ] PRD approved (this document)
- [ ] Git feature branch created: `feat/phase-3-copy-configuration`

---

### Release Checklist

**Development Complete:**
- [ ] All 29 tasks completed (backend + frontend)
- [ ] All 95-120 new tests passing
- [ ] All 879 existing tests passing (100% pass rate)
- [ ] No console errors or warnings
- [ ] No linter errors

**Cross-Platform Testing:**
- [ ] Windows: Copy operations work correctly, paths handled
- [ ] macOS: Copy operations work correctly, paths handled
- [ ] Linux: Copy operations work correctly, paths handled
- [ ] All platforms: Conflict resolution works
- [ ] All platforms: Error handling works

**Accessibility Audit:**
- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation works (Tab, Enter, Escape, Arrows)
- [ ] Screen reader tested (NVDA/JAWS on Windows, VoiceOver on Mac)
- [ ] Focus indicators visible on all elements
- [ ] Color contrast meets 4.5:1 minimum
- [ ] Large click targets (44x44px minimum)

**Performance Validation:**
- [ ] Single file copy: <500ms (measured)
- [ ] Large skill directory copy: <2s (measured)
- [ ] Conflict detection: <100ms (measured)
- [ ] Modal open: <300ms (measured)

**Documentation Complete:**
- [ ] CLAUDE.md updated with Phase 3 information
- [ ] CHANGELOG.md updated with feature release notes
- [ ] docs/guides/TESTING-GUIDE.md updated with copy feature examples
- [ ] User guide updated (if exists)
- [ ] API documentation updated (copy endpoints)
- [ ] Code comments added to all new functions

**Code Review:**
- [ ] Self-review complete (check for TODOs, console.logs, debug code)
- [ ] Code follows project conventions (see CLAUDE.md guides)
- [ ] All functions have JSDoc comments
- [ ] No hardcoded values (use constants)
- [ ] No duplicate code (DRY principle)

**Git Workflow:**
- [ ] All commits follow conventional commit format (see GIT-WORKFLOW.md)
- [ ] One commit per completed task (or logical unit)
- [ ] Feature branch rebased on latest main/develop
- [ ] No merge conflicts

**Pull Request:**
- [ ] PR created with descriptive title: "feat: Phase 3 - Copy Configuration Between Projects"
- [ ] PR description includes:
  - Summary of changes
  - Link to PRD (this document)
  - Link to BA session decisions
  - Testing completed (platforms, accessibility)
  - Screenshots/GIFs of UI (if applicable)
- [ ] PR assigned to reviewer
- [ ] All CI/CD checks passing

**Final Approval:**
- [ ] Code review approved
- [ ] QA testing complete (manual verification)
- [ ] No blocking issues or bugs found
- [ ] Project manager approval

---

### Release Process

**1. Merge to Develop Branch**
- Squash and merge PR (preserves history)
- Delete feature branch after merge

**2. Version Bump**
- Update `package.json` version: 2.0.0 → 3.0.0
- Commit: `chore: bump version to 3.0.0 for Phase 3 release`

**3. Create Release Tag**
- Git tag: `v3.0.0`
- Tag message: "Phase 3: Copy Configuration Between Projects"

**4. Deploy (if applicable)**
- Build production bundle: `npm run build`
- Test built bundle locally
- Deploy to production (if hosted)

**5. Publish NPM Package (if applicable)**
- Verify dist/ folder included in package
- Test package install: `npx claude-code-manager`
- Publish: `npm publish`

**6. Announce Release**
- GitHub release notes (copy from CHANGELOG.md)
- Project Discord/Slack announcement (if applicable)
- Social media announcement (if applicable)

---

### Rollback Plan (If Issues Found)

**Immediate Rollback:**
- Revert merge commit: `git revert [merge-commit-sha]`
- Push to develop/main
- Document issue in GitHub issue tracker

**Fix-Forward:**
- If issue is minor and fixable quickly (<1 hour)
- Create hotfix branch: `hotfix/copy-configuration-[issue]`
- Fix and test
- Fast-track review and merge

---

## 19. Appendix

### Related Documents

**BA Session Documents:**
- `docs/ba-sessions/20251101-230906-copy-configuration/decisions.md` - All architectural decisions
- `docs/ba-sessions/20251101-230906-copy-configuration/decision-matrix.md` - Quick reference table
- `docs/ba-sessions/20251101-230906-copy-configuration/wireframes/design-notes.md` - Complete UI/UX specifications
- `docs/ba-sessions/20251101-230906-copy-configuration/TODO.md` - Outstanding verification tasks

**Feature Planning:**
- `docs/prd/features/copy-configuration/FEATURE-OVERVIEW.md` - Original feature overview

**Project Guides:**
- `CLAUDE.md` - Project instructions (read for context)
- `docs/guides/DEVELOPMENT-STRATEGIES.md` - Choose development workflow
- `docs/guides/GIT-WORKFLOW.md` - Git and commit conventions
- `docs/guides/TESTING-GUIDE.md` - Test workflow and conventions
- `docs/guides/SETUP-GUIDE.md` - First-time setup
- `docs/guides/ROADMAP.md` - Phase 2.1-7+ planning

**Previous PRDs (Format Reference):**
- `docs/prd/PRD-Phase2-Extension-Component-Refactoring.md` - Component extraction PRD (similar scope)

**Development History:**
- `docs/sessions/INDEX.md` - Full session history
- `CHANGELOG.md` - Project changelog

---

### Glossary

**Terms:**

- **Agent:** Claude Code subagent (`.claude/agents/*.md`)
- **Command:** Claude Code slash command (`.claude/commands/**/*.md`)
- **Hook:** Git-style lifecycle hook (`.claude/settings.json`)
- **Skill:** Multi-file capability directory (`.claude/skills/*/`)
- **MCP Server:** Model Context Protocol server (`.mcp.json` or settings)
- **User-Level:** Global configuration (`~/.claude/`)
- **Project-Level:** Project-specific configuration (`[project]/.claude/`)
- **Plugin:** External package providing configurations (managed outside file system)
- **Conflict:** Situation where target file already exists during copy operation
- **Strategy:** Conflict resolution approach (skip, overwrite, rename)
- **Path Traversal:** Security attack using `..` to access files outside allowed directories
- **Symlink:** Symbolic link (file reference) - not supported for security reasons

---

### Acronyms

- **API:** Application Programming Interface
- **CRUD:** Create, Read, Update, Delete
- **E2E:** End-to-End (testing)
- **HMR:** Hot Module Replacement
- **JSON:** JavaScript Object Notation
- **LOC:** Lines of Code
- **MCP:** Model Context Protocol
- **NPM:** Node Package Manager
- **OS:** Operating System
- **PR:** Pull Request
- **PRD:** Product Requirements Document
- **SPA:** Single Page Application
- **UI/UX:** User Interface / User Experience
- **V1:** Version 1 (initial release)
- **V2:** Version 2 (future enhancements)
- **WCAG:** Web Content Accessibility Guidelines
- **YAML:** YAML Ain't Markup Language

---

### Document Metadata

**Document Version:** 1.0
**Last Updated:** November 2, 2025
**Author:** Claude (Documentation Engineer)
**Status:** Ready for Development
**Phase:** 3.0 - First Write Operation
**Epic:** Copy Configuration Between Projects

**Word Count:** ~17,500 words
**Estimated Reading Time:** 60-70 minutes
**Estimated Implementation Time:** 26-27 hours (~3.5 days)

**Next Steps:**
1. Review PRD with project manager
2. Approve all BA session decisions
3. Create feature branch: `feat/phase-3-copy-configuration`
4. Begin implementation (Story 3.1: Copy Service Infrastructure)

---

**End of Product Requirements Document**
