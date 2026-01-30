# Validation Reports Directory

**Purpose:** Technical specification validation reports for bug fixes and feature implementations.

---

## Overview

This directory contains validation reports created by technical experts to ensure implementation work strictly adheres to official specifications.

**When to Create Validation Reports:**
- Before implementing spec-based bug fixes
- When official documentation exists (Claude Code, Playwright, Vue, etc.)
- For high-priority bugs requiring specification analysis
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

## Template Structure

```markdown
# [TICKET-ID]: [Title] Specification Validation Report

**Report Date:** YYYY-MM-DD
**Ticket:** [Ticket reference]
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

---

## Naming Convention

Format: `[TICKET-ID]-SPECIFICATION-VALIDATION-REPORT.md`

Examples:
- `BUG-045-SPECIFICATION-VALIDATION-REPORT.md`
- `STORY-305-SPECIFICATION-VALIDATION-REPORT.md`

---

## Quality Standards

All validation reports must:

1. **Cite Official Sources** - Link to authoritative documentation, reference schemas
2. **Provide Evidence** - Real-world examples, schema definitions
3. **Be Actionable** - Specific gaps identified, clear recommendations
4. **Maintain Currency** - Document specification version reviewed

---

## Integration with SWARM Workflow

Validation reports are part of the SWARM workflow:

1. **Expert Agent** creates validation report
2. **Ticket** updated with corrected requirements
3. **Implementation Plan** references validation report
4. **Engineers** implement per validated spec
5. **Test Engineers** verify compliance using validation criteria

---

## Related Documentation

- **Implementation Plans:** `docs/implementation-plans/` - Step-by-step implementation guides
- **SWARM Workflow:** `docs/guides/SWARM-WORKFLOW.md` - Development workflow
- **Spec Implementation:** `docs/guides/SPEC-IMPLEMENTATION-GUIDE.md` - Implementing from specifications
