# Comparative Analysis Documents

This directory contains comparative analysis documents created during feature parity implementations.

## Purpose

When implementing features that already exist for one entity type on another entity type (e.g., Delete for Commands after it works for Agents), a comparative analysis must be completed before implementation begins.

These documents capture:
- Structural differences between entity types
- Property name mismatches
- Behavioral differences
- UI element placement verification
- Entity-specific edge cases
- Implementation risks and mitigations

## When Documents Are Created

Comparative analysis is MANDATORY when:
- Implementing CRUD operations (Create, Read, Update, Delete) for new entity types
- Copying UI patterns between entity views
- Replicating workflows across different configuration types
- Any task described as "This should work like it does for [existing entity]"

## Document Naming Convention

```
[feature]-[reference-entity]-vs-[target-entity].md
```

**Examples:**
- `delete-agents-vs-commands.md` - Delete functionality comparison
- `edit-commands-vs-skills.md` - Edit workflow comparison
- `copy-agents-vs-hooks.md` - Copy feature comparison

## Document Template

See `docs/guides/FEATURE-PARITY-IMPLEMENTATION-GUIDE.md` for the complete comparative analysis document template.

## Workflow Integration

1. **Phase 0 (Pre-Implementation):** Main agent creates comparative analysis
2. **User Approval Gate:** User reviews and approves analysis
3. **Phase 1 (Planning):** Orchestrator references analysis in task specifications
4. **Phase 3 (Implementation):** Developers use analysis during coding
5. **Phase 4 (Code Review):** Reviewers verify structural differences were handled

## ROI Evidence

**STORY-7.4 Analysis:**
- Time spent debugging WITHOUT comparative analysis: 6+ hours (73% of dev time)
- Time spent on analysis: 15-30 minutes
- Time saved: 4+ hours
- ROI: 16:1 return on investment

## Related Documentation

- **Feature Parity Implementation Guide:** `docs/guides/FEATURE-PARITY-IMPLEMENTATION-GUIDE.md`
- **SWARM Workflow Guide:** `docs/guides/SWARM-WORKFLOW.md` (Phase 0 section)
- **Code Review Best Practices:** `docs/guides/CODE-REVIEW-BEST-PRACTICES.md`

## Directory Structure

```
comparative-analysis/
├── README.md (this file)
└── [feature]-[entity-a]-vs-[entity-b].md (analysis documents)
```

Analysis documents are preserved as historical reference and lessons learned.
