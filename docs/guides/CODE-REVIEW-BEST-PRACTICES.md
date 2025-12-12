# Code Review Best Practices

This guide provides checklists and best practices for reviewing code in the Claude Code Config Manager project, with special emphasis on **UX consistency verification** for feature parity implementations.

## Table of Contents

1. [General Code Review Checklist](#general-code-review-checklist)
2. [UX Consistency Checks (Feature Parity Work)](#ux-consistency-checks-feature-parity-work)
3. [Backend API Review](#backend-api-review)
4. [Frontend Review](#frontend-review)
5. [Test Review](#test-review)
6. [Review Response Templates](#review-response-templates)
7. [Related Documentation](#related-documentation)

---

## General Code Review Checklist

### Code Quality
- [ ] Code follows project coding standards (see `CODING-STANDARDS.md`)
- [ ] No unnecessary complexity or over-engineering
- [ ] Clear variable and function naming
- [ ] Appropriate error handling
- [ ] No hardcoded values that should be configurable
- [ ] DRY principle followed (no duplicate logic)

### Security
- [ ] No exposed secrets or credentials
- [ ] Input validation where appropriate
- [ ] No SQL injection or XSS vulnerabilities
- [ ] Safe file path handling (no path traversal)
- [ ] Authentication/authorization checks present

### Testing
- [ ] Tests exist for new functionality
- [ ] Tests are meaningful (not just coverage padding)
- [ ] Edge cases covered
- [ ] Test data follows project standards (see `CODING-STANDARDS.md`)
- [ ] Tests pass consistently (not flaky)

### Documentation
- [ ] Complex logic has comments explaining WHY (not WHAT)
- [ ] Public APIs have JSDoc comments
- [ ] README updated if user-facing changes
- [ ] CHANGELOG NOT updated (release-time only - see `CODING-STANDARDS.md`)

---

## UX Consistency Checks (Feature Parity Work)

**CRITICAL:** When reviewing implementations of features that already exist for other entity types.

### When This Section Applies

Use these checks for PRs implementing patterns that **already exist** for other entity types:

**Examples:**
- ✅ Delete/Edit for Commands (reference: Agents - STORY-7.3)
- ✅ Delete/Edit for Skills (reference: Commands or Agents)
- ✅ Delete/Edit for Hooks (reference: existing CRUD patterns)
- ✅ Delete/Edit for MCP Servers (reference: existing CRUD patterns)
- ✅ Any PR described as "implement X like it works for Y"

**Key Indicator:** If the PR description mentions "similar to [entity]" or "following the pattern from [feature]", this section is **MANDATORY**.

### Background: Why UX Consistency Reviews Are Critical

**Real-World Evidence:** STORY-7.4 (Command Edit/Delete) Analysis

The STORY-7.4 implementation required **7 sessions over 8 days** with **73% of development time spent debugging** issues that could have been prevented with 10-15 minutes of comparative analysis during code review.

**Key Statistics from STORY-7.4:**
- **Total Development Time:** ~10 hours
- **Debugging Time:** ~7.3 hours (73%)
- **Bugs Discovered:** 10+ (5 in Session 5, 2 in Session 3, 3+ in Session 6)
- **Code Restarts:** 1 complete branch deletion and restart
- **Prevention Cost:** 10-15 minutes of upfront comparison
- **Actual Cost:** 3+ hours of debugging across multiple sessions

**Root Cause:** Missing comparative analysis when implementing commands (STORY-7.4) after agents (STORY-7.3) led to:
1. Delete buttons in wrong locations (sidebar only vs. both card AND sidebar)
2. Incorrect property mapping (`path` vs `filePath`, `namespace + name` structure)
3. Missing fields (model, color, disableModelInvocation) due to duplicate parser logic
4. Edit field value persistence issues

**See:** `docs/sessions/workflow-analyses/story-7.4-analysis/synthesis-report.md` for complete analysis

### Mandatory Comparison Checklist

Before approving ANY feature parity PR, reviewer MUST:

#### 1. Read Reference Implementation
- [ ] **Opened reference entity's view file** (e.g., `AgentsView.vue` for agents reference)
- [ ] **Noted ALL UI element locations** (cards, sidebar, modals)
- [ ] **Documented behavioral patterns** (inline editing vs modal, confirmation flows)
- [ ] **Identified data structure differences** (properties, field names, nested structures)

#### 2. Compare UI Patterns
- [ ] **Delete button locations match** reference (if reference has card + sidebar, new entity must too)
- [ ] **Edit workflow matches** (inline editing, modal, sidebar drawer - same pattern)
- [ ] **Confirmation dialogs match** (same modal component, same messaging style)
- [ ] **Error handling matches** (toast messages, error displays, retry patterns)
- [ ] **Loading states match** (spinners, skeletons, disabled states during operations)

#### 3. Verify Data Structure Handling
- [ ] **Compared parser outputs** (reference parser vs. target entity parser)
- [ ] **All properties from target entity are editable** (if edit feature implemented)
- [ ] **Property name differences handled** (e.g., `path` vs `filePath`, `namespace + name` structure)
- [ ] **Optional fields displayed correctly** (model, color, tools arrays, etc.)
- [ ] **No properties missing** without documented explanation

#### 4. Check for Duplicate Logic
- [ ] **Single parsing source** (not duplicated in multiple files like `projectDiscovery.js` and `commandParser.js`)
- [ ] **Service layer reuse** (deleteService, updateService used consistently)
- [ ] **Component reuse** (DeleteConfirmationModal, InlineEditField, etc.)

### Common Issues to Flag

| Issue | Severity | Action | Example from STORY-7.4 |
|-------|----------|--------|------------------------|
| Delete button in different location than reference | **BLOCKER** | Require fix | Commands had delete only in sidebar; agents had it in card + sidebar |
| Missing editable field that reference entity has | **BLOCKER** | Require fix or documented reason | Commands missing model, color, disableModelInvocation fields |
| Incorrect property mapping | **BLOCKER** | Require fix | Using `path` instead of `filePath` for commands |
| Different confirmation modal behavior | **HIGH** | Require explanation | Different modal component or flow than reference |
| Duplicate parsing logic | **HIGH** | Require refactoring | Parsing in both `projectDiscovery.js` and `commandParser.js` |
| Inconsistent error messages | **MEDIUM** | Suggest fix | Different toast message style or wording |
| Minor styling differences | **LOW** | Note for future | Slightly different spacing or colors |

### Investigation Methodology

If inconsistency suspected, use this methodical approach (learned from Session 6 of STORY-7.4):

1. **Frontend Component Check**
   - Open reference view file (e.g., `AgentsView.vue`)
   - Open target view file (e.g., `CommandsView.vue`)
   - Compare side-by-side for UI element placement

2. **Data Store Verification**
   - Check Pinia store methods (e.g., `projectStore.deleteAgent` vs `projectStore.deleteCommand`)
   - Verify API client calls match

3. **Backend API Comparison**
   - Compare API endpoints (e.g., `/api/projects/:id/agents/:name` vs `/api/projects/:id/commands/:namespace/:name`)
   - Check request/response formats

4. **Parser Investigation**
   - Compare parser outputs (e.g., `subagentParser.js` vs `commandParser.js`)
   - Look for duplicate parsing in `projectDiscovery.js` or similar files
   - Verify all fields extracted

5. **File Structure Check**
   - Verify entity-specific file organization differences
   - Check for nested directory handling (commands support `namespace/name` structure)

### Escalation Protocol

If UX inconsistency found:

1. **Flag as "UX CONSISTENCY ISSUE"** in review comment
2. **Reference specific location** in reference implementation with line numbers
3. **Provide side-by-side comparison** (screenshot or code snippet)
4. **Request fix OR documented explanation** if intentional deviation
5. **Do NOT approve** until resolved

**Example Review Comment:**
```markdown
**UX CONSISTENCY ISSUE**

This implementation differs from the reference pattern established in STORY-7.3:

**Reference (AgentsView.vue:245-250):**
- Delete button appears in ConfigCard component
- Delete button also appears in DetailSidebar component
- Users can delete from list view OR detail view

**This PR (CommandsView.vue):**
- Delete button only in DetailSidebar
- No delete button on ConfigCard

**Required Action:**
Either:
1. Add delete button to CommandCard to match agent pattern, OR
2. Document why commands intentionally deviate from this UX pattern

Cannot approve until resolved. This type of inconsistency caused 10+ bugs in STORY-7.4.

**Reference:** `docs/sessions/workflow-analyses/story-7.4-analysis/synthesis-report.md`
```

---

## Backend API Review

### Endpoint Design
- [ ] RESTful conventions followed
- [ ] Appropriate HTTP methods (GET, POST, PUT, DELETE)
- [ ] Consistent error response format
- [ ] Request validation present
- [ ] Proper status codes (200, 201, 400, 404, 500)

### Parser Changes
- [ ] All fields extracted match entity specification
- [ ] No duplicate parsing logic introduced (check `projectDiscovery.js`)
- [ ] Backward compatibility maintained (if applicable)
- [ ] Optional fields handled gracefully
- [ ] Model enum values used (not full model IDs - see `CODING-STANDARDS.md`)

### File Operations
- [ ] Safe path construction (no path traversal vulnerabilities)
- [ ] Appropriate error handling for file not found
- [ ] Atomic operations where needed (temp file + rename pattern)
- [ ] File permissions preserved
- [ ] Directory creation for nested paths (commands support `namespace/name`)

### Service Layer
- [ ] Reuses existing services (deleteService, updateService, copyService)
- [ ] No duplicate business logic
- [ ] Proper error propagation
- [ ] Logging for debugging

---

## Frontend Review

### Vue Component Quality
- [ ] Props properly typed/validated
- [ ] Events follow naming conventions (kebab-case)
- [ ] No memory leaks (cleanup in `onUnmounted`)
- [ ] Reactive state used correctly (`ref`, `computed`, `reactive`)
- [ ] Watchers cleaned up when component unmounts

### PrimeVue Usage
- [ ] Using PrimeVue components where available (not custom implementations)
- [ ] Following PrimeVue patterns (see `primevue-consultant` agent for guidance)
- [ ] Theme-aware styling (no hardcoded colors - use CSS variables)
- [ ] Consistent component variants (e.g., Button severity: primary, secondary, danger)

### State Management (Pinia)
- [ ] Store actions properly defined
- [ ] Mutations avoid direct state modification outside actions
- [ ] Computed properties used for derived state
- [ ] Store modules logically organized

### Accessibility
- [ ] Interactive elements have appropriate `aria-label` or `aria-labelledby`
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus management correct (dialogs trap focus)
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Screen reader announcements for dynamic content

### Component Reuse
- [ ] Existing components reused (DeleteConfirmationModal, InlineEditField, LabeledEditField)
- [ ] No duplicate component implementations
- [ ] Props passed correctly to reusable components

---

## Test Review

### Test Quality
- [ ] Tests test behavior, not implementation details
- [ ] Clear test descriptions (`it('should...')` not `it('test...')`)
- [ ] Appropriate use of mocks/stubs
- [ ] No flaky tests (random failures)
- [ ] Tests isolated (no shared state between tests)

### Test Coverage
- [ ] Happy path covered
- [ ] Error cases covered (API failures, validation errors)
- [ ] Edge cases covered (empty arrays, null values, missing properties)
- [ ] Integration points tested (API calls, store updates)
- [ ] User interactions tested (clicks, inputs, keyboard navigation)

### Test Data Standards
- [ ] Uses test fixtures from `tests/fixtures/`
- [ ] Does NOT create test data in manager project (uses mocked responses)
- [ ] Data structures match actual parser output
- [ ] Model enum values used (not full model IDs - see `CODING-STANDARDS.md`)
- [ ] Comprehensive frontmatter properties included (see `TESTING-GUIDE.md`)

### Test File Naming
- [ ] Follows project conventions (numbered prefixes for Playwright tests)
- [ ] Descriptive file names
- [ ] Organized in correct directory (`tests/frontend/`, `tests/e2e/`, etc.)

---

## Review Response Templates

### Approving with Minor Suggestions
```markdown
**LGTM!**

A few minor suggestions (optional):
- [Suggestion 1 with specific line reference]
- [Suggestion 2 with specific line reference]

Approved - suggestions are optional and can be addressed in a future PR if desired.
```

### Requesting Changes (General)
```markdown
**Good progress!** Requesting changes before approval:

**Required:**
- [ ] [Required change 1 with specific reasoning]
- [ ] [Required change 2 with specific reasoning]

**Suggested (optional):**
- [Suggestion 1]
- [Suggestion 2]

Please address required items and re-request review. Thanks!
```

### Flagging UX Consistency Issue
```markdown
**UX CONSISTENCY ISSUE**

This implementation differs from the reference pattern:

**Reference ([file]:[line]):**
```[code snippet showing reference pattern]
```

**This PR ([file]:[line]):**
```[code snippet showing deviation]
```

**Impact:** [Explain user experience impact]

**Required Action:**
Please either:
1. Update to match reference pattern, OR
2. Document why this intentional difference is needed (and update PRD/ADR)

Cannot approve until resolved. This type of inconsistency caused 10+ bugs in STORY-7.4 that consumed 73% of development time.

**Reference:** `docs/sessions/workflow-analyses/story-7.4-analysis/synthesis-report.md`
```

### Flagging Duplicate Logic
```markdown
**DUPLICATE LOGIC DETECTED**

**Location 1:** [file]:[line]
**Location 2:** [file]:[line]

This violates DRY principle and can cause field inconsistency bugs (as seen in STORY-7.4 Session 6 where duplicate parsing logic in `commandParser.js` and `projectDiscovery.js` caused missing fields).

**Required Action:**
- Consolidate logic into single source of truth
- Ensure all callers use the centralized version
- Add test coverage for the consolidated logic

**Severity:** HIGH - Can cause hard-to-debug field inconsistency issues

Cannot approve until resolved.
```

### Requesting Data Structure Documentation
```markdown
**DATA STRUCTURE VERIFICATION NEEDED**

This PR implements [feature] for [entity type] following the pattern from [reference entity].

**Required before approval:**
Please add a comment documenting the data structure differences between [entity type] and [reference entity]:
- Property name differences (e.g., `path` vs `filePath`)
- Nested structure differences (e.g., `namespace + name` vs flat `name`)
- Optional field differences

This documentation prevents future bugs when other developers work on this entity type.

**Example format:**
```javascript
/**
 * Command Data Structure (differs from Agents):
 * - Commands use `filePath` property (agents use `path`)
 * - Commands have namespace structure: `namespace/name` (agents are flat)
 * - Commands support `disableModelInvocation` (agents do not)
 * - Commands lack `color` property (agents have it)
 */
```

**Rationale:** Missing this documentation caused 5+ bugs in STORY-7.4 Session 5.
```

---

## Code Review Anti-Patterns

### What NOT to Do

**❌ Rubber Stamp Approval**
```markdown
LGTM! Looks good.
```
**Problem:** No verification, no checklist review, no comparative analysis

**✅ Better:**
```markdown
Reviewed implementation:
- ✅ UI patterns match AgentsView reference
- ✅ All parser fields handled correctly
- ✅ Tests cover happy path and error cases
- ✅ No duplicate logic introduced

LGTM! Approved.
```

---

**❌ Vague Feedback**
```markdown
This doesn't look right. Can you check it?
```
**Problem:** No specific issue identified, no guidance for fix

**✅ Better:**
```markdown
**Issue:** Delete button location differs from reference pattern.

**Reference:** AgentsView.vue:245 shows delete button in both ConfigCard and DetailSidebar.
**This PR:** CommandsView.vue only has delete in sidebar.

**Action:** Please add delete button to CommandCard component to match the established pattern.
```

---

**❌ Assuming Structural Equivalence**
```markdown
Since this works for agents, it should work for commands. Approved.
```
**Problem:** No verification of entity-specific differences (caused 10+ bugs in STORY-7.4)

**✅ Better:**
```markdown
**Verification Completed:**
- Compared AgentsView.vue vs CommandsView.vue
- Verified command-specific properties handled: `filePath`, `namespace`, `disableModelInvocation`
- Confirmed delete buttons in both card and sidebar locations
- Checked parser output includes all fields

LGTM! Approved.
```

---

**❌ Approving with Known Issues**
```markdown
There's a bug with field persistence, but let's merge and fix it later.
```
**Problem:** Ships known bugs, violates quality gate

**✅ Better:**
```markdown
**Cannot approve** - field persistence bug detected.

**Issue:** SelectButton fields (model, color) not persisting after edit.
**Action Required:** Investigate parser and store logic before merge.

Please address and re-request review.
```

---

## Review Efficiency Tips

### Use GitHub's Review Features

**Request Changes Mode:** Use for blocking issues
**Comment Mode:** Use for questions or optional suggestions
**Approve Mode:** Use only after thorough checklist verification

### Batch Review Comments

Instead of commenting on each line individually, batch related issues:

**❌ Inefficient:**
- Comment 1: "Missing delete button on card"
- Comment 2: "Delete button in sidebar looks wrong"
- Comment 3: "Delete confirmation modal different from agents"

**✅ Efficient:**
```markdown
**Delete Feature Issues (3 items):**

1. Missing delete button on ConfigCard (reference: AgentsView.vue:245)
2. Delete button in sidebar uses wrong component
3. Confirmation modal differs from agent pattern (reference: AgentsView.vue:312)

Please address all three for UX consistency.
```

### Use Code Suggestions

GitHub's suggestion feature allows reviewers to propose specific fixes:

```suggestion
<Button label="Delete" severity="danger" @click="handleDelete" />
```

This is more helpful than just saying "wrong button component."

---

## Checklist Summary

**Before Approving ANY PR:**
- [ ] General code quality verified
- [ ] Security considerations checked
- [ ] Tests exist and are meaningful
- [ ] **If feature parity work:** UX consistency verification completed
- [ ] **If feature parity work:** Data structure differences documented
- [ ] **If feature parity work:** Reference implementation reviewed side-by-side
- [ ] No duplicate logic introduced
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG NOT updated (release-time only)

---

## Related Documentation

- **CODING-STANDARDS.md** - Code style and test data standards
- **TESTING-GUIDE.md** - Test execution and patterns
- **GIT-WORKFLOW.md** - Branch strategy and commit format
- **SWARM-WORKFLOW.md** - Development workflow phases
- **STORY-7.4 Analysis:** `docs/sessions/workflow-analyses/story-7.4-analysis/synthesis-report.md` - Real-world evidence for why UX consistency reviews are critical

---

**Last Updated:** December 7, 2025
**Maintained by:** Documentation Engineer
**Based on:** STORY-7.4 post-implementation analysis
