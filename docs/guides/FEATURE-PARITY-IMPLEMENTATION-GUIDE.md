# Feature Parity Implementation Guide

## Overview

When implementing a feature for Entity B that already works for Entity A (e.g., Delete/Edit for Commands after it works for Agents), follow this structured workflow to prevent implementation errors and avoid debugging cycles.

**Purpose:** Leverage existing implementations while accounting for structural differences between entity types.

**Time Impact:** 15-30 minutes of comparative analysis prevents 4+ hours of debugging and rework (16:1 ROI).

**When to Use:**
- Commands delete/edit (after Agents working)
- Skills delete/edit (after Commands working)
- Hooks management (after other entity types working)
- Any "X should work like Y" feature requests
- Copying UI patterns or workflows between entity types

**Key Insight:** Most bugs in feature parity implementations come from assuming equivalence without verification. Structural differences between entities (property names, data formats, UI placement) cause subtle but critical bugs.

---

## Quick Reference

| Step | Action | Time | Why |
|------|--------|------|-----|
| **Phase 0.1** | Identify reference implementation | 2 min | Know what to mirror |
| **Phase 0.2** | Create comparative analysis | 10-15 min | Prevents most bugs |
| **Phase 0.3** | User approves analysis | 5 min | Quality gate before work begins |
| **Phase 1** | Plan with differences documented | - | Subagents informed of traps |
| **Phase 3** | Implement with reference checklist | - | Catch discrepancies early |
| **Phase 4** | Verify pattern consistency | - | Ensure UX equivalence |

---

## Phase 0: Pre-Implementation Comparative Analysis

This phase is MANDATORY before invoking the orchestrator or beginning implementation. Skipping this step is the primary cause of extended debugging sessions.

### Phase 0.1: Identify Reference Implementation

**Main agent must determine:**

1. **Which entity has the working feature?**
   - Example: "Agents have delete functionality working"

2. **Where is the reference code located?**
   - Backend: `/home/claude/manager/src/backend/routes/` (API endpoints)
   - Frontend: `/home/claude/manager/src/components/` (UI components)
   - Services: `/home/claude/manager/src/backend/services/` (business logic)
   - Stores: `/home/claude/manager/src/stores/` (state management)

3. **What commit/PR introduced this feature?**
   - Use `git log` to find implementation commit
   - Provides context for design decisions and edge cases

**Example Output:**
```
Reference Implementation: Agent Delete Functionality
- Backend: src/backend/routes/agent-routes.js (lines 45-78)
- Frontend: src/components/AgentCard.vue (delete button, lines 89-102)
- Frontend: src/components/AgentDetailSidebar.vue (delete button, lines 156-170)
- Store: src/stores/agentStore.js (deleteAgent action, lines 234-267)
- Commit: abc1234 "feat: add delete agent functionality"
```

### Phase 0.2: Create Comparative Analysis

**Main agent MUST read and compare:**

1. **Read reference implementation files**
   - Use Read tool to examine actual code (NOT ticket descriptions)
   - Note: Tickets describe intent, code describes reality

2. **Read target entity parser/definition**
   - Agents: `src/backend/parsers/agent-parser.js`
   - Commands: `src/backend/parsers/command-parser.js`
   - Skills: `src/backend/parsers/skill-parser.js`
   - Hooks: Defined in settings files
   - MCP: Defined in .mcp.json

3. **Create comparison table**

**Comparison Table Template:**

```markdown
## Structural Differences: [Entity A] vs [Entity B]

### Data Structure
| Property | Entity A | Entity B | Notes |
|----------|----------|----------|-------|
| Identifier | `path` (string) | `namespace + name` (composite) | Command requires both fields |
| Display Name | `name` (from frontmatter) | `name` (from frontmatter) | Same |
| Location | `.claude/agents/*.md` | `.claude/commands/**/*.md` | Commands support nested dirs |

### Behavioral Differences
| Behavior | Entity A | Entity B | Impact |
|----------|----------|----------|--------|
| Delete Confirmation | Shows agent name | Must show namespace + name | UI string composition |
| File Deletion | Single file delete | May delete directory if last file | Additional cleanup logic needed |
| Refresh After Delete | Refresh agents list | Refresh commands list + check empty dirs | More complex refresh |

### UI Element Placement
| Element | Entity A Location | Entity B Expected | Verified? |
|---------|-------------------|-------------------|-----------|
| Delete Button (Card) | AgentCard.vue line 89 | CommandCard.vue | ❌ Not yet implemented |
| Delete Button (Sidebar) | AgentDetailSidebar.vue line 156 | CommandDetailSidebar.vue | ❌ Not yet implemented |
| Edit Button (Card) | AgentCard.vue line 102 | CommandCard.vue | ❌ Not yet implemented |

### Edge Cases
| Edge Case | Entity A Handling | Entity B Handling | Implementation Notes |
|-----------|-------------------|-------------------|----------------------|
| User-level vs Project-level | Handled with scope check | Same approach | Reusable pattern |
| Missing file | Returns 404 error | Same approach | Reusable pattern |
| Namespace with special chars | N/A for agents | Must sanitize for file paths | New edge case |
```

4. **Document structural differences explicitly**
   - Property name differences (e.g., `path` vs `namespace + name`)
   - Data format differences (string vs composite identifiers)
   - File structure differences (flat vs nested directories)
   - UI placement differences (if any)

5. **Create analysis document**
   - Save to `docs/sessions/comparative-analysis/[feature]-[entity-a]-vs-[entity-b].md`
   - Include comparison table and identified risks
   - Reference in session tracking document

### Phase 0.3: User Approval Gate

**Main agent presents analysis to user:**

1. **Summarize key differences**
   - Highlight structural mismatches
   - Note any new edge cases
   - Identify potential problem areas

2. **Wait for user approval**
   - User reviews comparison table
   - User confirms understanding of differences
   - User authorizes proceeding to Phase 1

**Example Approval Request:**
```
I've completed comparative analysis for Command Delete (mirroring Agent Delete).

Key differences identified:
1. Commands use composite identifier (namespace + name) vs single path
2. Commands support nested directories requiring cleanup logic
3. Commands need special character sanitization in namespaces

Analysis saved to: docs/sessions/comparative-analysis/delete-agents-vs-commands.md

Ready to proceed to Phase 1 planning with these differences documented?
```

---

## Phase 1: Planning with Documented Differences

Once user approves comparative analysis, main agent invokes orchestrator with enriched context.

### Orchestrator Context Template

```markdown
## Feature Parity Implementation: [Feature] for [Entity B]

### Reference Implementation
- Feature: [Delete/Edit/etc.] functionality
- Working for: [Entity A]
- Implementation files:
  - Backend: [file paths with line numbers]
  - Frontend: [file paths with line numbers]
  - Tests: [file paths]
- Reference commit: [commit hash]
- Reference PR: [PR number if applicable]

### Comparative Analysis Completed
- Analysis document: [path to comparative analysis]
- User approved: [date/time]

### Critical Structural Differences
1. **[Difference 1 Category]:**
   - Entity A: [how it works]
   - Entity B: [how it differs]
   - Impact: [what this means for implementation]

2. **[Difference 2 Category]:**
   - Entity A: [how it works]
   - Entity B: [how it differs]
   - Impact: [what this means for implementation]

3. **[Additional differences...]**

### New Edge Cases for Entity B
- [Edge case 1]: [description and handling approach]
- [Edge case 2]: [description and handling approach]

### UI Pattern Consistency Requirements
- [ ] Delete buttons in BOTH locations (card + sidebar) if applicable
- [ ] Edit workflow matches reference implementation
- [ ] Error messages follow reference patterns
- [ ] Confirmation dialogs follow reference format

### Task Assignment Recommendations
Based on comparative analysis, recommend:
- Backend task should handle [specific differences]
- Frontend task should mirror [specific patterns]
- Testing task should verify [specific edge cases]
```

### Task Specification Template

When orchestrator creates task specifications, include this context for developers:

```markdown
## Reference Pattern
This task implements [feature] for [Entity B].
Reference implementation exists in: [specific file paths with line numbers]
Reference commit/PR: [commit hash or PR number]

**IMPORTANT:** Read reference implementation files before coding.

## Structural Differences (From Comparative Analysis)
- Entity A uses property 'X', Entity B uses property 'Y'
- Entity A has [structure], Entity B has [different structure]
- [Other differences from Phase 0.2 analysis]

## Implementation Checklist
Before marking task complete:
- [ ] Read reference implementation files
- [ ] Verified all properties from Entity B parser are handled
- [ ] UI patterns match reference implementation exactly
- [ ] Delete/Edit buttons in SAME locations as reference (if applicable)
- [ ] Error handling matches reference patterns
- [ ] Edge cases from comparative analysis are handled
- [ ] Tests cover structural differences

## Files to Reference During Implementation
- Reference implementation: [file paths]
- Entity B parser: [parser file path]
- Comparative analysis: [analysis document path]
```

---

## Phase 3: Implementation with Reference Checklist

Developers implementing feature parity tasks must follow this workflow.

### Before Writing Code

**Read These Files (in order):**

1. **Comparative analysis document**
   - Location: Provided in task specification
   - Why: Understand structural differences before coding

2. **Reference implementation files**
   - Location: Provided in task specification
   - Why: See exact patterns to mirror

3. **Target entity parser**
   - Location: `src/backend/parsers/[entity]-parser.js`
   - Why: Know exact property names and data structure

4. **Target entity store (if frontend work)**
   - Location: `src/stores/[entity]Store.js`
   - Why: Understand state management patterns

### During Implementation

**Pattern Matching Checklist:**

- [ ] **Property names match entity B parser** (not entity A)
  - Example: Don't use `path` if entity B uses `namespace + name`

- [ ] **UI elements in same locations as reference**
  - If reference has delete button in card AND sidebar, implement both
  - If reference has edit icon in header, place in same location

- [ ] **API response format matches reference**
  - Same success/error response structure
  - Same HTTP status codes
  - Same error messages (adapted for entity name)

- [ ] **Confirmation dialogs match reference**
  - Same dialog structure and styling
  - Same confirmation text pattern (adapted for entity name)
  - Same button labels and colors

- [ ] **Error handling matches reference**
  - Same try/catch patterns
  - Same error logging approach
  - Same user-facing error messages

### Code Comments

Include references to comparative analysis and implementation decisions:

```javascript
// Reference: AgentCard.vue delete button implementation (line 89)
// Comparative Analysis: Commands use namespace + name instead of path
// See: docs/sessions/comparative-analysis/delete-agents-vs-commands.md
const handleDelete = async () => {
  // Commands require both namespace and name for deletion
  const identifier = `${command.namespace}/${command.name}`;
  await commandStore.deleteCommand(identifier, projectId);
};
```

---

## Phase 4: Post-Implementation Verification

Before code review, developer must verify pattern consistency.

### Pattern Consistency Check

**1. Compare side-by-side with reference:**

Open reference implementation and new implementation side-by-side:

```bash
# Reference
less src/components/AgentCard.vue

# New Implementation
less src/components/CommandCard.vue
```

**Verify:**
- [ ] Delete button in same location (position, styling, icon)
- [ ] Click handler follows same pattern
- [ ] Confirmation dialog structure matches
- [ ] Success/error handling matches
- [ ] Loading states match

**2. UI Element Locations:**

For each UI element in reference:
- [ ] Card delete button - Same location? Same styling?
- [ ] Sidebar delete button - Same location? Same styling?
- [ ] Edit button/icon - Same location? Same styling?
- [ ] Status indicators - Same location? Same styling?

**3. Workflow Equivalence:**

Walk through user workflows:
- [ ] Delete workflow: Same number of clicks?
- [ ] Confirmation: Same dialog appearance?
- [ ] Success feedback: Same toast message pattern?
- [ ] Error handling: Same error message pattern?

### Property Completeness Check

**Compare with entity parser:**

```javascript
// In src/backend/parsers/command-parser.js
// Ensure ALL properties are exposed in UI where relevant
```

**Verify:**
- [ ] All editable properties have UI controls
- [ ] All display properties are shown in UI
- [ ] No properties used without being in parser definition

### Edge Case Verification

**From comparative analysis document:**

For each edge case identified in Phase 0.2:
- [ ] Test case exists for edge case
- [ ] Implementation handles edge case
- [ ] Error message appropriate for edge case

**Example:**
- Edge case: "Commands with special characters in namespace"
- Test: Create command with namespace "my/special@namespace"
- Verify: Sanitization occurs, no file system errors

---

## Common Pitfalls and How to Avoid Them

### 1. Assuming Property Names Match

**Problem:**
```javascript
// Copying from Agent implementation without checking parser
const identifier = entity.path; // ❌ Commands don't have 'path'
```

**Solution:**
```javascript
// Read command-parser.js first, saw namespace + name structure
const identifier = `${entity.namespace}/${entity.name}`; // ✅
```

**Prevention:** Always read target entity parser in Phase 0.2

### 2. Assuming UI Patterns Match Completely

**Problem:**
- Reference has delete button in card AND sidebar
- Implementation only adds delete button to card
- Users can't delete from sidebar (inconsistent UX)

**Solution:**
- Document ALL UI element locations in comparative analysis
- Create checklist for each location
- Verify each location during implementation

**Prevention:** Complete UI element location table in Phase 0.2

### 3. Trusting Ticket Descriptions Over Code

**Problem:**
- Ticket says "Add delete button to CommandCard"
- Reference implementation has delete buttons in TWO locations
- Ticket didn't mention sidebar location
- Implementation incomplete because followed ticket not code

**Solution:**
- Always read reference implementation files
- Tickets describe intent, code describes reality
- Reference implementation is source of truth for patterns

**Prevention:** Read actual implementation files in Phase 0.1

### 4. Skipping Comparative Analysis Under Time Pressure

**Problem:**
- User requests "Just copy the agent delete to commands quickly"
- Developer skips Phase 0.2 to save time
- Spends 4 hours debugging property name mismatches
- Net result: Much slower than doing analysis first

**Solution:**
- Comparative analysis takes 15-30 minutes
- Debugging takes 4+ hours
- Analysis saves time overall (16:1 ROI)

**Prevention:** Make Phase 0.2 mandatory gate in workflow

### 5. Not Documenting Structural Differences

**Problem:**
- Developer knows commands use namespace + name
- Doesn't document this difference
- Another developer works on tests, assumes path property
- Tests fail with cryptic errors

**Solution:**
- Explicitly document ALL differences in comparison table
- Include in task specifications
- Reference in code comments

**Prevention:** Use structured comparison table template

### 6. Copying Code Without Understanding Context

**Problem:**
```javascript
// Copied from agent implementation
if (!agent.path) throw new Error('Path required');

// But commands don't have path property
if (!command.path) throw new Error('Path required'); // ❌ Wrong
```

**Solution:**
- Understand WHAT the reference code does (validates identifier)
- Adapt WHY to entity B's structure (namespace + name validation)
```javascript
if (!command.namespace || !command.name) {
  throw new Error('Namespace and name required');
} // ✅ Adapted to entity B
```

**Prevention:** Read and understand reference code, don't just copy/paste

---

## Evidence: Why This Matters

### STORY-7.4: Command Edit/Delete Implementation

**Context:** Implementing edit/delete for Commands after it worked for Agents

**Timeline:**
- Initial implementation: 2 hours
- Debugging phase: 6+ hours (73% of total time)
- Complete branch restart required
- Total bugs discovered: 14+ (most preventable)

**Root Causes:**
1. Assumed commands matched agents without verification
2. Did not read command-parser.js before implementing
3. Copied agent code patterns without adapting to command structure
4. Did not document structural differences

**Critical Bugs That Could Have Been Prevented:**
- BUG-7.4.1: Delete button missing from sidebar (only in card)
  - Prevention: UI element location table in Phase 0.2

- BUG-7.4.2: Delete fails - property 'path' undefined
  - Prevention: Read command-parser.js in Phase 0.2

- BUG-7.4.3: Namespace not sanitized for file operations
  - Prevention: Edge case analysis in Phase 0.2

**Results After Implementing This Guide:**
- STORY-7.5: Skills edit/delete implementation
- Comparative analysis completed: 20 minutes
- Implementation time: 3 hours
- Debugging time: 45 minutes (20% vs 73% previously)
- Zero structural bugs (all bugs were edge cases)

**ROI Calculation:**
- Time invested in analysis: 20 minutes
- Time saved in debugging: 5+ hours
- Ratio: 15:1 return on investment

---

## Code Review Checklist for Feature Parity

When reviewing PRs for feature parity implementations, verify:

### Documentation
- [ ] Comparative analysis document exists and is complete
- [ ] Analysis document linked in PR description
- [ ] Structural differences documented clearly
- [ ] New edge cases identified and documented

### Pattern Consistency
- [ ] Delete buttons appear in SAME locations as reference (if applicable)
- [ ] Edit workflow matches reference implementation exactly
- [ ] Confirmation dialogs follow reference format
- [ ] Error messages follow reference patterns
- [ ] Success feedback follows reference patterns

### Property Handling
- [ ] All properties from entity parser are handled
- [ ] No hardcoded assumptions from reference entity
- [ ] Property names match target entity parser exactly
- [ ] Composite identifiers properly composed (if applicable)

### UX Consistency
- [ ] Visual appearance matches reference entity
- [ ] Button placement identical to reference
- [ ] Icons and colors consistent with reference
- [ ] Loading states match reference implementation

### Edge Cases
- [ ] All edge cases from comparative analysis tested
- [ ] New edge cases for target entity identified and handled
- [ ] Error handling appropriate for entity-specific errors

### Tests
- [ ] Tests verify structural differences are handled
- [ ] Tests cover new edge cases for target entity
- [ ] Tests verify UI element locations match reference
- [ ] Test comments reference comparative analysis

---

## Integration with SWARM Workflow

This guide is integrated into the SWARM workflow at specific phases:

### Before Phase 1 (Session Initialization)

When user requests feature parity work:
1. Main agent recognizes parity request
2. Main agent executes Phase 0 (Comparative Analysis)
3. Main agent presents analysis to user for approval
4. User approves → proceed to SWARM Phase 1
5. User rejects → refine analysis → re-present

### During Phase 1 (Planning)

Main agent invokes orchestrator with:
- Comparative analysis document path
- Documented structural differences
- Identified edge cases
- Reference implementation locations

Orchestrator creates task specifications including:
- Reference pattern context
- Structural difference warnings
- Implementation checklists
- Verification requirements

### During Phase 3 (Implementation)

Developers follow:
- Read reference files before coding
- Use comparison table during implementation
- Follow pattern matching checklist
- Document implementation decisions in comments

### During Phase 4 (Code Review)

Code reviewer uses:
- Pattern consistency checklist
- Property completeness verification
- UX consistency checks
- Edge case verification

---

## Templates and Tools

### Comparative Analysis Document Template

Save to: `docs/sessions/comparative-analysis/[feature]-[entity-a]-vs-[entity-b].md`

```markdown
# Comparative Analysis: [Feature] - [Entity A] vs [Entity B]

**Date:** [YYYY-MM-DD]
**Analyst:** Main Agent
**Reference Ticket:** [STORY-X.X]
**Status:** ✅ User Approved / ⏳ Awaiting Approval

## Reference Implementation

**Entity:** [Entity A]
**Feature:** [Delete/Edit/etc.]
**Commit:** [commit hash]
**PR:** [PR number]

**Implementation Files:**
- Backend: [file path with line numbers]
- Frontend: [file path with line numbers]
- Store: [file path with line numbers]
- Tests: [file path with line numbers]

## Target Entity

**Entity:** [Entity B]
**Parser:** [parser file path]
**Expected Files:**
- Backend: [where implementation will go]
- Frontend: [where implementation will go]
- Store: [where implementation will go]
- Tests: [where tests will go]

## Data Structure Comparison

| Property | Entity A | Entity B | Notes |
|----------|----------|----------|-------|
| [property name] | [type/value] | [type/value] | [difference description] |

## Behavioral Differences

| Behavior | Entity A | Entity B | Impact |
|----------|----------|----------|--------|
| [behavior] | [how it works] | [how it differs] | [implementation impact] |

## UI Element Placement

| Element | Entity A Location | Entity B Expected | Status |
|---------|-------------------|-------------------|--------|
| [UI element] | [file + line] | [file + line] | ❌ Not implemented |

## Edge Cases

| Edge Case | Entity A Handling | Entity B Handling | Implementation Notes |
|-----------|-------------------|-------------------|----------------------|
| [edge case] | [how handled] | [how to handle] | [notes] |

## New Edge Cases for Entity B

1. **[Edge Case 1]:**
   - Description: [what makes this unique to entity B]
   - Handling: [how to handle it]
   - Test: [test approach]

2. **[Edge Case 2]:**
   - [same structure]

## Risk Assessment

**High Risk Areas:**
1. [risk description] - [mitigation approach]
2. [risk description] - [mitigation approach]

**Medium Risk Areas:**
1. [risk description] - [mitigation approach]

**Low Risk Areas:**
1. [risk description] - [mitigation approach]

## Implementation Recommendations

1. **[Recommendation 1]:** [detailed guidance]
2. **[Recommendation 2]:** [detailed guidance]
3. **[Recommendation 3]:** [detailed guidance]

## Testing Requirements

**Must Test:**
- [ ] [test case from structural difference]
- [ ] [test case from edge case analysis]
- [ ] [test case from behavioral difference]

**Should Test:**
- [ ] [additional test case]
- [ ] [additional test case]

## Approval

**User Comments:** [user feedback on analysis]
**Approved:** ✅ Yes / ❌ No
**Date:** [approval date]
**Conditions:** [any conditions or modifications]
```

### Quick Command for Starting Analysis

```bash
# Main agent can use this as starting template
cat > docs/sessions/comparative-analysis/[feature]-[entity-a]-vs-[entity-b].md <<'EOF'
[Use template above]
EOF
```

---

## Related Documents

- **IMPLEMENTATION-OUTLINE-GUIDE.md** - Create detailed implementation outlines with comparative analysis template
- **SWARM-WORKFLOW.md** - Complete workflow integration
- **SPEC-IMPLEMENTATION-GUIDE.md** - For implementing from official specs
- **CODING-STANDARDS.md** - Property naming and test standards
- **GIT-WORKFLOW.md** - Commit and PR guidelines
- **CODE-REVIEW-BEST-PRACTICES.md** - Review checklist details

---

## Summary: Key Takeaways

1. **Never assume equivalence** - Always verify structural differences
2. **Phase 0 is mandatory** - 15 minutes analysis prevents 4+ hours debugging
3. **Read code, not tickets** - Implementation is source of truth
4. **Document everything** - Future developers need context
5. **UI elements in BOTH locations** - If reference has it, mirror it
6. **Property names matter** - Read entity parser before coding
7. **Edge cases are entity-specific** - Don't just copy reference edge cases
8. **User approval is a gate** - Don't proceed without sign-off

**When in doubt:** Spend more time in Phase 0, less time in Phase 3 debugging.
