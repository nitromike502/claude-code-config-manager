# Technical Documentation

## Overview

This directory contains comprehensive technical specifications, architecture documentation, and implementation details for the Claude Code Manager project. These documents provide in-depth coverage beyond what inline code comments can reasonably contain.

## When to Create Technical Documentation

**Create technical documentation files when:**
- Documentation exceeds 50 lines
- Explaining complex algorithms or data structures
- Documenting system architecture or component interactions
- Providing specification references
- Detailing edge cases and error handling
- Creating onboarding materials for new developers

**Use inline code comments when:**
- Brief explanations (< 20 lines)
- Quick implementation notes
- Cross-references to technical docs
- Algorithm complexity annotations

**See:** `docs/guides/CODING-STANDARDS.md` for complete documentation placement guidelines.

---

## Technical Documents Index

### Data Structures and Specifications

#### Hook Structure Documentation
**File:** `hook-structure.md`

**Covers:**
- Claude Code's 3-level nested hook structure (Event → Matcher → Commands)
- Official format from Claude Code specification
- API flattened format for frontend consumption
- Merge algorithm for copy service
- Deduplication strategies
- Edge cases and error handling

**Use When:**
- Implementing hook-related features
- Understanding hook parsing logic
- Debugging hook merge issues
- Extending copy service for hooks

**Related Code:**
- `/src/backend/services/copy-service.js`
- `/src/backend/parsers/hookParser.js`
- `/src/backend/services/projectDiscovery.js`

---

## Documentation Patterns

### Reference Pattern in Code

When creating technical documentation, use this pattern in related code files:

```javascript
/**
 * Brief description of function/component
 *
 * For complete documentation including [specific topics],
 * see: docs/technical/[document-name].md
 *
 * Quick reference:
 * - [Key point 1]
 * - [Key point 2]
 * - [Key point 3]
 */
```

**Example:**
```javascript
/**
 * Merge hook into target settings.json file
 *
 * For complete documentation on hook structure, merge algorithm,
 * and edge cases, see: docs/technical/hook-structure.md
 *
 * Quick reference:
 * - Hooks use 3-level nested structure
 * - Deduplication key: event + matcher + command
 * - Preserves existing settings structure
 */
function copyHook(source, targetProjectId, options) {
  // Implementation...
}
```

### Document Structure

Technical documentation should follow this structure:

```markdown
# [Topic Name]

## Overview
Brief introduction to the topic and its relevance

**Last Updated:** YYYY-MM-DD
**Related Code:** File paths to implementation

---

## [Main Section 1]
Detailed explanation with examples

## [Main Section 2]
Detailed explanation with examples

## Edge Cases
Common edge cases and how they're handled

## Examples
Real-world examples from the codebase

## References
- Links to related documentation
- Links to external specifications
- Links to source code
```

---

## Cross-References

### Related Documentation

**User Guides:**
- `docs/guides/SETUP-GUIDE.md` - Installation and setup
- `docs/guides/TESTING-GUIDE.md` - Test execution and conventions
- `docs/guides/GIT-WORKFLOW.md` - Git workflow and branching
- `docs/guides/CODING-STANDARDS.md` - Coding standards and best practices

**Architecture Documentation:**
- `CLAUDE.md` - Project overview and architecture
- `docs/guides/SWARM-WORKFLOW.md` - Development workflow architecture

**Specifications:**
- Claude Code Official Documentation - [https://docs.anthropic.com/claude-code](https://docs.anthropic.com/claude-code)

---

## Contributing to Technical Documentation

### Creating New Technical Documentation

1. **Identify the need:**
   - Documentation exceeds inline comment threshold (50+ lines)
   - Multiple code files reference the same concept
   - Complex algorithm needs detailed explanation

2. **Create the document:**
   - Place in `docs/technical/`
   - Use descriptive filename (kebab-case)
   - Follow document structure template above

3. **Update this index:**
   - Add entry under appropriate section
   - Include brief description of coverage
   - List related code files

4. **Add code references:**
   - Update related code files with cross-references
   - Use reference pattern shown above
   - Keep inline comments brief

### Updating Existing Documentation

1. **Update the document:**
   - Maintain structure and formatting
   - Update "Last Updated" date
   - Add new sections if needed

2. **Review cross-references:**
   - Ensure code references are still accurate
   - Update file paths if code moved
   - Add new code references if applicable

3. **Update this index:**
   - Revise description if scope changed
   - Add new related code files

---

## Documentation Style Guide

### Writing Style

- **Be concise:** Remove unnecessary words
- **Be specific:** Use concrete examples
- **Be accurate:** Verify against actual code
- **Be current:** Update when code changes

### Code Examples

- **Use real examples:** From actual codebase when possible
- **Include context:** Show where code is used
- **Explain edge cases:** Don't just show happy path
- **Format consistently:** Use proper syntax highlighting

### Cross-References

- **Use relative paths:** For portability
- **Link bidirectionally:** Code ↔ docs
- **Keep links current:** Update when files move
- **Provide context:** Explain why link is relevant

---

## Maintenance Schedule

**Monthly Review:**
- Verify all cross-references are valid
- Check for outdated information
- Review "Last Updated" dates
- Identify missing documentation

**Per-Feature Review:**
- Update docs when implementing new features
- Add docs for complex algorithms
- Document breaking changes
- Update architecture diagrams

**Quarterly Audit:**
- Comprehensive review of all technical docs
- Consolidate duplicate information
- Archive obsolete documentation
- Update index and cross-references

---

## Index of Documents

### Current Documents (1)

1. **hook-structure.md** - Claude Code hook structure specification
   - Last Updated: 2025-11-05
   - Status: Current
   - Related: Copy service, hook parser

### Planned Documents (Future)

*Document needs will be identified through development and added here.*

---

**Maintained by:** Documentation Engineer
**Last Updated:** 2025-11-05
