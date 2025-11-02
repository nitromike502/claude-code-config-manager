# Copy Configuration Feature - Decision Matrix

**BA Session:** 20251101-230906-copy-configuration
**Date:** November 1, 2025

## Quick Reference Table

| # | Decision Area | V1 Choice | Timeline Impact | V2 Considerations |
|---|---------------|-----------|-----------------|-------------------|
| **0** | **Copy Flow** | Modal-based with card selection | ±0 hours | Add clipboard-style, drag-drop |
| **1** | **Conflict Resolution** | Always prompt user | ±0 hours | Add user preference setting |
| **2** | **Batch Operations** | Single-item only | ±0 hours | Add multi-select checkbox UI |
| **3** | **Direction Indicators** | Subtle icons/colors (additive) | ±0 hours | A/B test with users |
| **4** | **Undo/Rollback** | No undo (rely on git) | ±0 hours | Add operation history & undo |
| **5** | **Permissions** | Reactive validation | ±0 hours | Consider pre-checking for UX |
| **6** | **Cross-Platform** | Node.js `path` module only | ±0 hours | Monitor for edge cases |
| **7** | **Hook Merging** | Smart script-level merge | **+1-2 hours** | Add merge preview UI |
| **8** | **Scope Restrictions** | Block plugin items | **+1 hour** | Add "extract & customize" flow |

**Total Timeline:** 26-27 hours (~3.5 days)

---

## Detailed Decision Breakdown

### 0. Copy Flow Pattern (Foundational)

**Chosen:** Modal-based with card destination selection

**Key Details:**
- User clicks "Copy to..." button
- Modal shows condensed project cards (not dropdown)
- Each card has "Copy Here" button
- Scrollable area for many projects
- Include "User Global" as card option

**Why This Choice:**
- Consistent with existing card-based UI
- More visual and scannable than dropdown
- Works in all contexts (Dashboard, Project Detail, User Global)
- No clipboard state management needed

**Deferred to V2:**
- Clipboard-style copy/paste
- Drag-and-drop between projects
- "Team Builder" feature (user-mentioned future idea)

---

### 1. Conflict Resolution Strategy

**Chosen:** Always prompt user (strategy pattern for extensibility)

**Key Details:**
- Every conflict shows dialog with choices: skip, overwrite, rename
- Use strategy pattern (`ConflictStrategy` interface)
- V1 implements `PromptStrategy`
- Easy to add `SkipStrategy`, `RenameStrategy`, `PreferenceBasedStrategy` later

**Why This Choice:**
- Safety-first for V1 (prevents data loss)
- User has full control
- Strategy pattern enables V2 preferences without refactoring core logic

**Deferred to V2:**
- User preference setting: "Always skip/overwrite/rename"
- Per-config-type preferences
- Remember last choice

---

### 2. Batch Operations

**Chosen:** Single-item copy only

**Key Details:**
- Copy one configuration at a time
- No multi-select checkboxes in V1
- Simpler UI and error handling

**Why This Choice:**
- Keeps V1 focused (24-hour base estimate maintained)
- Easier to test single-item flow thoroughly
- Learn usage patterns before designing batch UI

**Deferred to V2:**
- Checkbox selection for multiple items
- "Copy Selected to..." button
- Batch conflict resolution (aggregate feedback)
- Progress indicator for multiple copies

---

### 3. Copy Direction Indicators

**Chosen:** Subtle icons/colors (additive layer, easy to remove)

**Key Details:**
- Source section: subtle "source" icon
- Destination cards: subtle "target" icon on hover
- HTML structure identical to "no indicators" version
- Icons added as optional components (conditionally rendered)
- CSS classes for styling (can toggle off)

**Why This Choice:**
- Provides visual clarity without clutter
- Easy to A/B test (just remove icons)
- Maintains design for changeability principle

**Implementation Note:**
> Keep indicators as additive layer. If user feedback shows they're not helpful, remove them without refactoring HTML structure.

---

### 4. Undo/Rollback

**Chosen:** No undo (rely on git + future CRUD delete)

**Key Details:**
- No undo system in V1
- Success messages clear about what was copied where
- Users can use git to revert if needed
- CRUD delete functionality coming in future phase

**Why This Choice:**
- Keeps V1 simple (saves 6-8 hours)
- Git is standard safety net for dev projects
- Users are developers familiar with version control
- Delete in future CRUD provides manual cleanup

**Deferred to V2:**
- Operation history tracking
- Time-limited "Undo" button (30-second window)
- Automatic backups before overwrite
- Restore from backup UI

---

### 5. Permissions & Validation

**Chosen:** Reactive validation (fail gracefully)

**Key Details:**
- Always show "Copy to..." button (no pre-checking)
- Attempt operation when user clicks "Copy Here"
- If error occurs, show clear, helpful message
- Standard Node.js error handling patterns

**Error Types Handled:**
- `EACCES` - Permission denied
- `ENOSPC` - Disk space full
- `ENOENT` - Source file not found
- `EROFS` - Read-only filesystem
- `EISDIR` - Target is directory, not file

**Why This Choice:**
- Simpler than preventive checking
- No performance overhead
- Accurate (checks at operation time, no race conditions)
- Consistent with existing codebase patterns

**Considered but Rejected:**
- Pre-checking permissions (adds 2-3 hours, still has race conditions)
- Hybrid checking (adds complexity for marginal benefit)

---

### 6. Cross-Platform Path Handling

**Chosen:** Node.js `path` module only

**Key Details:**
- Use `path.join()`, `path.resolve()`, `path.basename()`, `path.dirname()`
- Node.js handles platform differences automatically
- No additional dependencies
- Already used throughout codebase

**Why This Choice:**
- Proven solution (Phase 1 & 2 tested on all platforms)
- Zero additional work (already standard practice)
- Well-tested and reliable for 99% of cases
- Simple and maintainable

**Implementation Pattern:**
```javascript
const path = require('path');
const targetPath = path.join(projectPath, '.claude', 'agents', filename);
const absolutePath = path.resolve(targetPath);
const name = path.basename(filepath);
```

---

### 7. Settings.json Merge Strategy for Hooks

**Chosen:** Smart merge with script-level duplicate detection

**Key Details:**
- Claude Code supports array-style hooks (verified assumption)
- For each hook event being copied:
  - If target doesn't have event → add entire array
  - If target has event → compare individual scripts
    - Script exists in target → skip (duplicate)
    - Script doesn't exist → append to target array
- Never compare across different event types
- No conflict dialogs (pure additive merge)

**Example:**
```javascript
// Source
{ "hooks": { "pre-commit": ["npm test", "eslint ."] } }

// Target
{ "hooks": { "pre-commit": ["eslint ."], "post-commit": ["git push"] } }

// Result
{ "hooks": { "pre-commit": ["eslint .", "npm test"], "post-commit": ["git push"] } }
```

**Why This Choice:**
- Additive (never loses existing hooks)
- Duplicate detection prevents redundant scripts
- Event-level isolation (pre-commit ≠ post-commit)
- Fast workflow (no user interaction needed)
- Leverages Claude Code's native array support

**Timeline Impact:** +1-2 hours for smart comparison logic

**TODO Added:** Verify Claude Code actually supports hook arrays (see `./TODO.md`)

---

### 8. Scope Restrictions

**Chosen:** Restrict plugin-provided items only

**Key Details:**
- Users CANNOT copy plugin-provided configs
- "Copy to..." button disabled/hidden for plugin items
- Error message if attempted: "This configuration is provided by a plugin and cannot be copied. Install the plugin in your target project instead."
- Users CAN copy user/project items in any direction:
  - User ↔ Project (both directions)
  - Project ↔ Project

**Why This Choice:**
- Plugin architecture not fully understood yet
- Respects plugin management system (install, don't copy)
- Prevents confusion (copied plugin config won't update with plugin)
- Clear separation: plugin-managed vs. user-managed
- Can revisit in V2 if customization use cases emerge

**Timeline Impact:** +1 hour for plugin detection logic

**Implementation:**
- Check config metadata for `location: "plugin"`
- UI: Conditional rendering based on config source
- API: Validate source before allowing copy

---

## Architecture Patterns

### Strategy Pattern (Conflict Resolution)

```javascript
// V1 Implementation
class ConflictStrategy {
  async resolve(conflict) { throw new Error('Not implemented'); }
}

class PromptStrategy extends ConflictStrategy {
  async resolve(conflict) {
    // Show UI dialog, return user choice
    return await showConflictDialog(conflict);
  }
}

// V2 Can Add:
class PreferenceBasedStrategy extends ConflictStrategy {
  async resolve(conflict) {
    const userPref = getUserPreference();
    return userPref; // 'skip', 'overwrite', or 'rename'
  }
}
```

### Additive UI Layers (Direction Indicators)

```vue
<!-- HTML structure identical with or without indicators -->
<div class="copy-modal">
  <div class="source-section">
    <Icon v-if="showIndicators" name="source" />  <!-- Optional -->
    <SourceInfo />
  </div>

  <div class="destination-section">
    <DestinationCard v-for="project in projects">
      <Icon v-if="showIndicators" name="target" />  <!-- Optional -->
      <ProjectInfo />
    </DestinationCard>
  </div>
</div>
```

---

## V2 Enhancement Roadmap

Based on decisions deferred to V2:

### High Priority (V2.1)
1. **User preferences for conflict resolution** - Most requested, high value
2. **Batch copy operations** - Significant workflow improvement
3. **Clipboard-style copy/paste** - Power user feature

### Medium Priority (V2.2)
4. **Operation history & undo** - Safety net for mistakes
5. **Hook merge preview** - Show what will be merged before committing
6. **Drag-and-drop** - Intuitive but complex to implement

### Low Priority (V2.3+)
7. **Plugin extraction & customization** - If use cases emerge
8. **Copy templates** - Save frequently-used copy operations
9. **Sync mode** - Keep config synchronized across projects

---

## Testing Implications

Each decision has specific testing requirements:

| Decision | Test Coverage Needed |
|----------|---------------------|
| Modal flow | E2E tests: open modal, select destination, confirm |
| Conflict resolution | Unit: all strategies; E2E: dialog interaction |
| Single-item copy | Unit: copy logic; E2E: one item at a time |
| Direction indicators | Visual regression tests (with/without icons) |
| No undo | Manual test: verify git rollback works |
| Reactive validation | Unit: all error types; E2E: permission failures |
| Path handling | Cross-platform tests (Windows, Mac, Linux) |
| Hook merging | Unit: merge logic; Integration: array normalization |
| Plugin restrictions | Unit: detection; E2E: button disabled for plugins |

**Estimated Test Count:** ~40-50 new tests (backend + frontend + E2E)

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Data loss on conflict | Always prompt user (Decision #1) |
| Hook array unsupported | TODO added for verification; fallback to single-script |
| Cross-platform paths | Use Node.js `path` module (proven solution) |
| Plugin architecture unknown | Restrict copying (safe default); revisit in V2 |
| Performance (large Skills) | Show progress indicator; async operations |
| Permission errors | Clear error messages; standard patterns |

---

**Document Version:** 1.0
**Last Updated:** November 1, 2025
**Next Steps:** Use this matrix as input for PRD, wireframes, and implementation guide
