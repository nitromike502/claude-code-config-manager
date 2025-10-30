---
name: docs
description: Instructs Claude to review and update project documentation
tools: Read, Write, Bash, Glob, Grep
argument-hint: "[optional-instructions] - Additional context for documentation updates"
color: blue
---

# Documentation Review & Update

Review and update all project documentation to ensure accuracy, completeness, and consistency.

**Additional Instructions:** $ARGUMENTS

<task>
Delegate to the @documentation-engineer agent to comprehensively review and update all project documentation.
</task>

<context>
The user has requested a documentation review and update. If additional instructions were provided above, they should be prioritized and incorporated into the documentation work.

**Documentation Standards:**
- All documentation must be accurate and reflect current project state
- Code examples must be correct and tested when possible
- File references must be accurate and consistently formatted
- Documentation should be comprehensive but appropriately balanced - avoid excessive detail
- Component documentation should focus on usage, not internal implementation
- Strike a balance that helps users understand the project without investigating source code

**Documentation Review Archive:**
Historical documentation reviews are stored in `docs/reviews/` for reference. Previous review findings and improvements can inform current documentation work.
</context>

<execution>
Invoke the `documentation-engineer` agent with these specific instructions:

## Primary Objectives
1. **Accommodate User Instructions**: If additional instructions were provided above, prioritize and address them first
2. **Verify Accuracy**: Review all existing documentation for technical accuracy
3. **Validate Code Examples**: Test all code examples when possible and ensure they are correct
4. **Check File References**: Ensure all file paths and references are accurate and consistently formatted
5. **Balance Detail Appropriately**: Documentation should be comprehensive but not overwhelming

## Documentation Guidelines

**For Component Documentation (e.g., Vue components):**
- Show clear usage examples with minimal required attributes
- Demonstrate how optional attributes affect behavior
- Provide practical examples of common use cases
- DO NOT explain internal implementation details
- DO NOT document subcomponents unless they are exported/reusable
- Focus on what users need to know to USE the component effectively

**For API Documentation:**
- Document endpoints, parameters, and responses clearly
- Include example requests and responses
- Note error conditions and edge cases
- Keep descriptions concise but complete

**For Project Documentation (README, guides):**
- Ensure getting started instructions are accurate
- Verify setup steps work as described
- Update outdated information
- Add missing critical information
- Maintain consistent formatting and structure

**Balance Principle:**
The goal is documentation that enables users to work with the project effectively without needing to dive into source code, while avoiding excessive detail that overwhelms or becomes maintenance burden.

## Execution Steps
1. Use Glob to discover all documentation files
2. Use Read to review existing documentation
3. Use Grep to find undocumented features or outdated references
4. Use Write/Edit to update or create documentation as needed
5. Use Bash to test code examples when possible
6. Provide comprehensive summary of all changes made

## Output Requirements
Provide a clear summary including:
- Files modified or created (with absolute paths)
- Key improvements made
- Any remaining documentation gaps
- Recommendations for future documentation work

Execute this documentation review thoroughly and systematically.
</execution>
