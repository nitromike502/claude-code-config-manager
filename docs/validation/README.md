# Validation Reports Directory

**Purpose:** Technical specification validation reports for bug fixes and feature implementations

**Last Updated:** November 2, 2025

---

## Overview

This directory contains comprehensive validation reports created by technical experts (particularly the claude-code-expert agent) to ensure implementation work strictly adheres to official specifications.

**When to Create Validation Reports:**
- Before implementing spec-based bug fixes
- When official documentation exists (Claude Code, Playwright, Vue, etc.)
- For high-priority bugs (P0, P1) requiring specification analysis
- When multiple interpretations of requirements exist

---

## Validation Report Format

Each validation report should include:

1. **Executive Summary** - Critical findings and recommendations
2. **Official Specification Review** - Authoritative source analysis
3. **Current Implementation Analysis** - What exists today
4. **Gap Identification** - What's missing or incorrect
5. **Recommendations** - Specific corrective actions
6. **Supporting Evidence** - Schema definitions, examples, documentation links

---

## Current Validation Reports

| Report ID | Title | Status | Created | Related Ticket |
|-----------|-------|--------|---------|----------------|
| BUG-038 | Hooks Parsing Specification Validation | ✅ Complete | 2025-11-02 | [BUG-038](/home/tickets/claude/manager/bugs/todo/BUG-038-hooks-display-parsing-incorrect.md) |

---

## How Validation Reports Are Used

### 1. Pre-Implementation Review
**Purpose:** Ensure tickets accurately describe spec requirements

**Process:**
1. Expert agent reviews official specification
2. Identifies gaps in current implementation
3. Updates ticket with correct requirements
4. Creates validation report documenting findings

### 2. Implementation Reference
**Purpose:** Developers use reports as authoritative source during coding

**Benefits:**
- Prevents spec misinterpretation
- Reduces implementation errors
- Ensures compliance with official standards
- Documents decision rationale

### 3. Quality Assurance
**Purpose:** Testers verify implementation matches validated requirements

**Process:**
1. Test plans reference validation report
2. Tests verify each identified gap is closed
3. Edge cases from spec analysis are covered
4. Compliance is measurable and verifiable

---

## Relationship to Other Documentation

### Implementation Plans
- **Location:** `/home/claude/manager/docs/implementation-plans/`
- **Relationship:** Implementation plans cite validation reports as authoritative source
- **Example:** BUG-038 implementation plan references BUG-038 validation report

### Bug Tickets
- **Location:** `/home/tickets/claude/manager/bugs/`
- **Relationship:** Tickets updated based on validation findings
- **Example:** BUG-038 ticket completely rewritten after validation discovered spec issues

### Project Documentation
- **Location:** `/home/claude/manager/docs/tickets/bugs/`
- **Relationship:** Duplicate ticket stored in project docs for historical reference
- **Purpose:** Centralized documentation alongside validation reports

---

## Quality Standards

All validation reports must:

1. **Cite Official Sources**
   - Link to authoritative documentation
   - Reference official JSON schemas
   - Include specification version numbers
   - Quote exact specification language

2. **Provide Evidence**
   - Real-world examples from production code
   - Schema definitions and validation rules
   - Community implementation patterns
   - Official repository examples

3. **Be Actionable**
   - Specific gaps identified with line numbers
   - Clear recommendations for fixes
   - Measurable compliance criteria
   - Implementation guidance

4. **Maintain Currency**
   - Document specification version reviewed
   - Include review date
   - Note when specifications change
   - Update reports if spec evolves

---

## Creating New Validation Reports

### Template Structure

```markdown
# [TICKET-ID]: [Title] Specification Validation Report

**Report Date:** YYYY-MM-DD
**Ticket:** [Ticket file path]
**Validator:** [Agent or person name]
**Status:** [APPROVED|ISSUES FOUND|BLOCKED]

---

## Executive Summary

[Key findings and critical issues]

---

## 1. Official Specification Review

### 1.1 Authoritative Sources
- Official Docs: [URL]
- JSON Schema: [URL]
- Version: [X.Y.Z]

### 1.2 Specification Requirements
[Detailed spec analysis]

---

## 2. Current Implementation Analysis

[What exists today, with file paths and line numbers]

---

## 3. Gap Identification

[Specific gaps with severity levels]

---

## 4. Recommendations

[Actionable steps to close gaps]

---

## 5. Supporting Evidence

[Schemas, examples, links]
```

### Naming Convention

Format: `[TICKET-ID]-SPECIFICATION-VALIDATION-REPORT.md`

Examples:
- `BUG-038-SPECIFICATION-VALIDATION-REPORT.md`
- `STORY-305-SPECIFICATION-VALIDATION-REPORT.md`

---

## Integration with SWARM Workflow

Validation reports are a critical part of the SWARM (Specialized Workstreams Across Multiple Resources) workflow:

1. **Expert Agent** creates validation report
2. **Ticket** updated with corrected requirements
3. **Implementation Plan** references validation report
4. **Backend/Frontend Engineers** implement per validated spec
5. **Test Engineers** verify compliance using validation criteria

This ensures all team members work from the same authoritative source.

---

## File Permissions

Validation reports are created with restricted permissions (700) to prevent accidental modification:

```bash
drwx------ validation/  # Only owner can read/write/execute
```

This protects the integrity of specification analysis during active development.

---

## Maintenance

- **Review Frequency:** When specifications are updated
- **Ownership:** claude-code-expert agent (primary), technical leads (secondary)
- **Archival:** Reports remain current unless specification changes
- **Updates:** If spec evolves, create new dated version or append update section

---

## Questions?

For questions about validation reports or the validation process:

1. Review the example: `BUG-038-SPECIFICATION-VALIDATION-REPORT.md`
2. Check the related implementation plan in `/docs/implementation-plans/`
3. Reference the official Claude Code specification guide
4. Consult `/home/claude/manager/docs/guides/SPEC-IMPLEMENTATION-GUIDE.md`

---

**Maintained By:** claude-code-expert agent, Agile Ticket Manager
**Directory Created:** November 2, 2025
**Purpose:** Ensure spec compliance through rigorous validation
