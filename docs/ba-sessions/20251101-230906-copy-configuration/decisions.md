# Copy Configuration Feature - Decision Log

**BA Session:** 20251101-230906-copy-configuration
**Date:** November 1, 2025
**Status:** In Progress

## Overview

This document records all architectural and design decisions made during the BA session for the Copy Configuration feature. These decisions will inform the PRD, wireframes, and implementation guide.

---

## Decisions Made

### Foundational: Copy Flow Pattern

**Question:** What is the fundamental user flow for copying a configuration?

**Decision:** **Option 1 (Modal-Based)** with enhanced card-based destination selection

**Details:**
- User clicks "Copy to..." on a configuration item
- Modal opens immediately
- **Destination selection:** Card-based layout (NOT dropdown)
  - Each project displayed as condensed card showing: name + path
  - Each card has "Copy Here" button
  - Include "User Global" as a card option
  - Scrollable area for many projects
- User clicks "Copy Here" on desired destination
- Conflict resolution (if needed)
- Success message, modal closes

**Rationale:**
- Simplest to implement for V1
- Works in all contexts (Dashboard, Project Detail, User Global)
- Card-based selection is more visual and scannable than dropdown
- Maintains consistency with existing ConfigCard component patterns
- No state management complexity (vs clipboard-style)

**Future Considerations:**
- V2: Add clipboard-style copy/paste for power users
- V2+: "Team Builder" feature (user mentioned as future idea)
- V2: Drag-and-drop on Dashboard

---

### Question 1: Conflict Resolution Strategy

**Question:** What should be the default conflict resolution behavior when copying to a location where a file already exists?

**Decision:** **Option A (always prompt user)** - design with **Option D (user preferences)** in mind for future

**Details:**
- V1: Every conflict shows a dialog asking user to choose:
  - Skip (cancel copy)
  - Overwrite (replace target)
  - Rename (copy as `filename-2.md`)
- Architecture: Use **strategy pattern** for conflict resolution
  - Create `ConflictStrategy` interface
  - V1 implements `PromptStrategy`
  - V2 can add `SkipStrategy`, `RenameStrategy`, `PreferenceBasedStrategy`
  - No changes to core copy logic needed for extension

**Rationale:**
- Safety-first approach for V1 (prevents accidental data loss)
- User has full control over every conflict
- Strategy pattern allows easy extension to user preferences later
- Clean separation: conflict resolution logic separate from copy logic

**Implementation Note:**
> Design with extensibility in mind - use configurable conflict resolver that can easily support user preferences in V2 without refactoring core copy service.

---

### Question 2: Batch Operations

**Question:** Should V1 support copying multiple configurations at once?

**Decision:** **Option B (defer to V2)** - single-item copy only for V1

**Details:**
- V1 supports copying one item at a time
- Batch operations (select multiple, copy all) deferred to V2
- Focus on getting core copy operation right first

**Rationale:**
- Simpler V1 implementation (stays within 24-hour estimate)
- Easier to test and validate single-item flow
- Can learn from V1 usage patterns before designing batch UI
- Faster time-to-market for core feature
- Batch operations would add ~6-8 hours (25-30% increase)

**Future V2 Features:**
- Checkbox selection for multiple items
- "Copy Selected to..." button
- Aggregate progress and results
- Batch conflict resolution UI

---

### Question 3: Copy Direction Indicators

**Question:** Should we visually indicate copy direction (source → target) in the UI?

**Decision:** **Option C (subtle indicators - icons/colors)** with **architecture to easily revert to Option B**

**Details:**
- Source section: subtle "source" icon
- Destination cards: subtle "target" icon on hover
- Minimal visual noise, provides clarity
- **Architecture:** HTML structure identical to Option B (no indicators)
  - Indicators added as optional icon components (conditionally rendered)
  - CSS classes for styling (can be toggled/disabled)
  - **Easy revert:** Remove icon components or disable CSS class

**Rationale:**
- Provides visual clarity without clutter
- Maintains consistency with card-based UI
- Easy to test both approaches (C vs B) without refactoring
- Design for changeability - indicators are additive layer

**Implementation Note:**
> Keep indicators as additive layer, not structural dependency. Separate structure (HTML), behavior (JS), and presentation (CSS/icons) so each can evolve independently.

---

### Question 4: Undo/Rollback

**Question:** Should we support undo for copy operations?

**Decision:** **Option B (rely on git)** - no undo feature in V1

**Details:**
- No undo system in V1
- Users can use git to revert changes if needed
- Manual cleanup available once CRUD delete functionality is implemented
- Success messages are clear about what was copied where

**Rationale:**
- Keeps V1 focused and simple (no timeline increase)
- Git is the standard safety net for file changes in dev projects
- Delete functionality coming in CRUD phase provides manual cleanup path
- Undo system adds significant complexity (~6-8 hours) for limited benefit
- Most users working with Claude Code Manager are developers familiar with git

**Timeline Impact:** +0 hours (maintains 24-hour estimate)

---

### Question 5: Permissions & Validation

**Question:** How should we handle permission errors and validation failures?

**Decision:** **Option B (fail gracefully with clear error messages)** - reactive approach

**Details:**
- Always show "Copy to..." button (no pre-checking)
- Attempt copy operation when user clicks "Copy Here"
- If error occurs, show clear, helpful error message:
  - "Cannot copy to [path] - permission denied"
  - "Check file permissions and try again"
  - "Disk space full - cannot complete copy"
- Standard Node.js error handling patterns

**Rationale:**
- Simpler implementation (no complex pre-validation logic)
- No performance overhead from permission checks
- Accurate validation at operation time (no race conditions)
- Consistent with existing Claude Code Manager patterns
- Users are developers, understand filesystem errors
- Permission state can change between check and operation anyway

**Error Types to Handle:**
- `EACCES` - Permission denied
- `ENOSPC` - Disk space full
- `ENOENT` - Source file not found
- `EROFS` - Read-only filesystem
- `EISDIR` - Target is a directory, not a file

**Timeline Impact:** +0 hours (simpler than preventive checking)

---

### Question 6: Cross-Platform Path Handling

**Question:** How do we handle path differences between Windows/Mac/Linux?

**Decision:** **Option A (Node.js `path` module only)** - standard approach

**Details:**
- Use Node.js built-in `path` module for all path operations
- Methods: `path.join()`, `path.resolve()`, `path.basename()`, `path.dirname()`, etc.
- Node.js automatically handles platform differences:
  - Path separators (`\` vs `/`)
  - Home directory locations
  - Case sensitivity
  - Path normalization
- No additional dependencies needed

**Rationale:**
- Already used extensively throughout Claude Code Manager codebase
- Zero additional dependencies
- Well-tested and reliable (handles 99% of cases)
- Phase 1 and Phase 2 tested on all platforms with no issues
- Standard Node.js approach for cross-platform applications
- Simple, maintainable, proven solution

**Implementation Pattern:**
```javascript
const path = require('path');

// Build target path
const targetPath = path.join(projectPath, '.claude', 'agents', filename);

// Resolve relative paths
const absolutePath = path.resolve(targetPath);

// Get filename from path
const name = path.basename(filepath);
```

**Timeline Impact:** +0 hours (already standard practice)

---

### Question 7: Settings.json Merge Strategy for Hooks

**Question:** When copying hooks to a target that already has hooks, what should the merge strategy be?

**Decision:** **Smart merge with script-level duplicate detection** - additive with conflict avoidance

**Details:**
- Claude Code supports array-style hooks (each event can have multiple scripts)
- **Merge algorithm:**
  1. For each hook event being copied (e.g., "pre-commit"):
     - If target doesn't have this event → add entire hook array
     - If target has this event:
       - Compare individual scripts within that event
       - If script already exists in target array → skip (duplicate)
       - If script doesn't exist → append to target array (merge)
  2. Never compare across different event triggers
     - pre-commit scripts only compared with other pre-commit scripts
     - post-commit scripts only compared with other post-commit scripts
  3. No conflict dialogs needed (pure merge, no overwrites)

**Example:**
```javascript
// Source: User Global hooks
{
  "hooks": {
    "pre-commit": ["npm test", "eslint ."]
  }
}

// Target: Project hooks
{
  "hooks": {
    "pre-commit": ["eslint ."],      // Already has "eslint ."
    "post-commit": ["git push"]
  }
}

// Result after copy:
{
  "hooks": {
    "pre-commit": ["eslint .", "npm test"],  // Added "npm test", kept "eslint ."
    "post-commit": ["git push"]               // Unchanged
  }
}
```

**Rationale:**
- Additive approach (never loses existing hooks)
- Duplicate detection prevents redundant scripts
- Event-level isolation (pre-commit vs post-commit handled separately)
- No user interaction needed (fast workflow)
- Leverages Claude Code's native array support
- Simple mental model: "Add this hook script to the project"

**Implementation Note:**
- Use array normalization (ensure single scripts become arrays)
- Deep equality check for duplicate detection (handle string vs array cases)
- Preserve execution order (append new scripts to end)

**Timeline Impact:** +1-2 hours (for smart comparison and array normalization)

---

### Question 8: Scope Restrictions

**Question:** Should certain copy operations be restricted?

**Decision:** **Option A (restrict plugin-provided items only)** - respect plugin architecture

**Details:**
- Users CANNOT copy plugin-provided configurations:
  - Plugin agents, commands, hooks, skills, MCP servers are restricted
  - "Copy to..." button disabled or hidden for plugin items
  - If user attempts copy, show message: "This configuration is provided by a plugin and cannot be copied. Install the plugin in your target project instead."
- Users CAN copy in all directions for non-plugin items:
  - User-level ↔ Project-level (both directions)
  - Project ↔ Project
  - No directional restrictions for user/project configs

**Rationale:**
- Plugin storage architecture not fully understood yet (may not be in project directories)
- Respects plugin management system (plugins should be installed, not file-copied)
- Prevents confusion (copied plugin config won't update with plugin updates)
- Clear separation: plugin-managed vs. user-managed configs
- Plugin items already have provenance metadata (location: "plugin")
- Can revisit in V2 if plugin customization use cases emerge

**Implementation:**
- Check config metadata for `location: "plugin"` or similar indicator
- UI: Conditionally render copy button based on config source
- API: Validate config source before allowing copy operation
- Error handling: Clear message explaining why plugin items can't be copied

**Timeline Impact:** +1 hour (for plugin detection logic)

---

## All Questions Complete! ✅

---

## Summary Statistics

- **Total Questions:** 9 (1 foundational + 8 detailed questions)
- **Completed:** 9 ✅
- **Remaining:** 0

## Final V1 Timeline Estimate

- **Base estimate:** 24 hours
- **Adjustments:**
  - Hooks merge logic: +1-2 hours
  - Plugin detection: +1 hour
- **Final V1 estimate:** **26-27 hours** (~3.5 days)

## Key Architectural Decisions

1. **Modal-based copy flow** with card destination selection
2. **Strategy pattern** for conflict resolution (extensible to preferences)
3. **Single-item only** (defer batch to V2)
4. **Subtle visual indicators** (additive layer, easy to remove)
5. **No undo** (rely on git + future CRUD delete)
6. **Reactive validation** (fail gracefully vs. pre-checking)
7. **Node.js path module** (standard cross-platform approach)
8. **Smart hook merging** (script-level duplicate detection)
9. **Plugin restrictions** (respect plugin architecture)

---

**Last Updated:** November 1, 2025 23:09 UTC
**Next Steps:** Complete remaining 5 questions, create decision matrix, delegate to subagents
