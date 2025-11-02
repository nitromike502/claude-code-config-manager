# Implementation Plans Directory

**Purpose:** Detailed, step-by-step implementation guides for developers executing bug fixes and feature work

**Last Updated:** November 2, 2025

---

## Overview

This directory contains comprehensive implementation plans that guide developers through complex bug fixes and feature implementations. Each plan provides complete context, specifications, step-by-step instructions, and testing requirements.

**When to Create Implementation Plans:**
- Complex bug fixes requiring multiple file changes (P0, P1 priority)
- Features with intricate technical requirements
- Spec-compliance work requiring careful implementation
- Work requiring coordination across multiple developers
- Tasks blocked until prerequisite analysis completes

---

## Implementation Plan Format

Each implementation plan should include:

1. **Executive Summary** - Quick overview, status, effort estimate
2. **Quick Reference** - Links to related documents (tickets, validation reports)
3. **Implementation Approach** - Strategy and methodology
4. **Step-by-Step Instructions** - Numbered tasks with file paths and line numbers
5. **Testing Requirements** - Test updates, new test cases, validation criteria
6. **Acceptance Criteria** - Measurable success criteria
7. **Rollback Plan** - How to revert if issues discovered

---

## Current Implementation Plans

| Plan ID | Title | Status | Effort | Assignee | Related Ticket |
|---------|-------|--------|--------|----------|----------------|
| BUG-038 | Hooks Spec Compliance | Ready | 11 hours | backend-engineer | [BUG-038](/home/tickets/claude/manager/bugs/todo/BUG-038-hooks-display-parsing-incorrect.md) |

---

## How Implementation Plans Are Used

### 1. Pre-Work Preparation
**Purpose:** Developer reviews plan before starting implementation

**Benefits:**
- Complete context before writing code
- Clear understanding of scope and complexity
- Identifies all affected files upfront
- Estimates effort accurately

**Developer Actions:**
1. Read executive summary and quick reference
2. Review related validation report (if exists)
3. Study implementation approach
4. Identify any questions or blockers
5. Confirm effort estimate is realistic

### 2. During Implementation
**Purpose:** Step-by-step guide for systematic execution

**Benefits:**
- Prevents missing critical steps
- Ensures correct file modifications
- Maintains spec compliance
- Reduces implementation errors

**Developer Actions:**
1. Follow steps sequentially
2. Mark completed steps (mental checklist)
3. Verify each change against acceptance criteria
4. Run tests incrementally per plan
5. Document any deviations or discoveries

### 3. Code Review Preparation
**Purpose:** Reviewer verifies implementation matches plan

**Benefits:**
- Clear review criteria
- Measurable compliance verification
- Faster review process
- Consistent quality standards

**Reviewer Actions:**
1. Compare implementation to plan steps
2. Verify all files modified as specified
3. Check test coverage matches requirements
4. Confirm acceptance criteria met
5. Validate spec compliance (if applicable)

---

## Relationship to Other Documentation

### Validation Reports
- **Location:** `/home/claude/manager/docs/validation/`
- **Relationship:** Plans cite validation reports as authoritative spec source
- **Example:** BUG-038 plan references BUG-038 validation report for spec requirements

### Bug Tickets
- **Location:** `/home/tickets/claude/manager/bugs/`
- **Relationship:** Plans implement ticket requirements with additional technical detail
- **Example:** BUG-038 ticket describes "what" to fix, plan describes "how" to fix it

### Project Documentation
- **Location:** `/home/claude/manager/docs/tickets/bugs/`
- **Relationship:** Duplicate tickets stored alongside implementation plans
- **Purpose:** Centralized access to all bug-related documentation

### Test Files
- **Location:** `/home/claude/manager/tests/`
- **Relationship:** Plans specify required test updates with file paths
- **Example:** BUG-038 plan identifies 8 test files requiring updates

---

## Quality Standards

All implementation plans must:

1. **Be Specific**
   - Exact file paths (absolute paths)
   - Line number ranges for modifications
   - Precise code snippets (before/after)
   - Specific function/class names

2. **Be Complete**
   - All affected files identified
   - All test updates documented
   - All dependencies noted
   - Edge cases considered

3. **Be Measurable**
   - Clear acceptance criteria
   - Specific success metrics
   - Test coverage requirements
   - Performance benchmarks (if applicable)

4. **Be Actionable**
   - Sequential steps (numbered)
   - Clear decision points
   - Rollback procedures
   - Troubleshooting guidance

---

## Creating New Implementation Plans

### Template Structure

```markdown
# [TICKET-ID] Implementation Plan: [Title]

**Status:** [Ready for Implementation|Blocked|In Progress]
**Priority:** [P0|P1|P2|P3]
**Target Release:** [Version]
**Estimated Effort:** [X hours/days]
**Assignee:** [Role or name]

---

## Executive Summary

[Overview of what's being implemented and why]

**What Changed:**
- ✅ [Prerequisite 1]
- ✅ [Prerequisite 2]

**What's Next:**
- [Implementation step 1]
- [Implementation step 2]

---

## Quick Reference

| Item | Location |
|------|----------|
| **Ticket** | [Absolute path] |
| **Validation Report** | [Absolute path] (if exists) |
| **Main Files** | [File paths with line ranges] |

---

## Implementation Approach

[Strategy description, methodology, rationale]

---

## Step-by-Step Implementation

### Step 1: [Task Name]

**File:** `/absolute/path/to/file.js`
**Lines:** XXX-YYY

**Current Code:**
```javascript
// existing code
```

**New Code:**
```javascript
// updated code
```

**Rationale:** [Why this change]

[Repeat for all steps]

---

## Testing Requirements

### Test Updates Required

1. **Test File:** `/absolute/path/to/test.spec.js`
   - **Action:** Update test case for [scenario]
   - **Reason:** [Why update needed]

### New Test Cases

1. **Test:** [Test name]
   - **Purpose:** [What it validates]
   - **Expected Result:** [Pass criteria]

---

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] All tests passing
- [ ] Code review approved

---

## Rollback Plan

If issues discovered:
1. [Revert step 1]
2. [Revert step 2]
```

### Naming Convention

Format: `[TICKET-ID]-IMPLEMENTATION-PLAN.md`

Examples:
- `BUG-038-IMPLEMENTATION-PLAN.md`
- `STORY-305-IMPLEMENTATION-PLAN.md`
- `CRITICAL-007-IMPLEMENTATION-PLAN.md`

---

## Integration with SWARM Workflow

Implementation plans are central to SWARM execution:

```
┌─────────────────┐
│ Validation      │
│ Report Created  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Ticket Updated  │
│ w/ Correct Reqs │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Implementation  │◄─── YOU ARE HERE
│ Plan Created    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Developer       │
│ Implements      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Tests Verify    │
│ Compliance      │
└─────────────────┘
```

This workflow ensures:
- Validated requirements
- Clear implementation path
- Measurable success criteria
- Systematic execution

---

## Effort Estimation

Implementation plans include effort estimates:

| Complexity | Estimated Hours | Characteristics |
|------------|----------------|-----------------|
| Simple | 2-4 hours | Single file, straightforward logic |
| Moderate | 4-8 hours | Multiple files, some complexity |
| Complex | 8-16 hours | Many files, intricate logic, spec compliance |
| Very Complex | 16+ hours | Major refactoring, architecture changes |

**BUG-038 Example:** 11 hours (Complex)
- 5 backend files to modify
- 8 test files to update
- JSON Schema validation to implement
- Comprehensive spec compliance work

---

## File Permissions

Implementation plans have restricted permissions (700) during active development:

```bash
drwx------ implementation-plans/  # Owner read/write/execute only
```

This prevents modification while developers execute the plan, ensuring consistency.

---

## Plan Lifecycle

### 1. Creation
- Expert agent or tech lead creates plan
- Reviews validation report (if exists)
- Identifies all affected files
- Documents step-by-step approach

### 2. Review
- Technical lead reviews for completeness
- Developer confirms feasibility
- Effort estimate validated
- Prerequisites confirmed ready

### 3. Execution
- Developer follows plan steps
- Documents any deviations
- Updates plan if discoveries made
- Marks progress internally

### 4. Completion
- All acceptance criteria met
- Tests passing
- Code review approved
- Plan marked complete in ticket

### 5. Archival
- Plan remains for historical reference
- Not deleted after implementation
- Used for similar future work
- Helps with troubleshooting

---

## Maintenance

- **Review Frequency:** Before implementation starts
- **Ownership:** Tech leads, expert agents, assigned developers
- **Updates:** If discoveries during implementation require plan changes
- **Archival:** Permanent - never deleted

---

## Questions?

For questions about implementation plans:

1. Review the example: `BUG-038-IMPLEMENTATION-PLAN.md`
2. Check the related validation report in `/docs/validation/`
3. Reference the ticket in `/home/tickets/claude/manager/bugs/`
4. Consult `/home/claude/manager/docs/guides/SPEC-IMPLEMENTATION-GUIDE.md`
5. Review SWARM workflow in project `.claude/agents/` directory

---

**Maintained By:** Technical Leads, Expert Agents, Agile Ticket Manager
**Directory Created:** November 2, 2025
**Purpose:** Provide clear, actionable implementation guidance for complex work
