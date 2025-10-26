# Specification Review Checklist

**Purpose:** Prevent implementation errors from missing specification review (~1 hour waste per incident)

**When to Use:** Before implementing any feature based on official specifications (Claude Code spec, Playwright spec, MCP spec, file format specs, etc.)

---

## 1. Specification Identification

Before starting implementation, identify the authoritative specification:

- [ ] **What specification applies to this feature?**
  - Examples: Claude Code slash commands, agent definitions, hook structure, MCP server config, Playwright API, file formats

- [ ] **Where is the official documentation?**
  - Official docs URL (if external)
  - Codebase location (if internal): CLAUDE.md, docs/, templates/, etc.

- [ ] **What version/date is the spec?**
  - Note any version requirements or recent changes
  - Check for deprecation notices or upcoming changes

**Common Specifications:**
- **Claude Code Official Spec:** https://docs.claude.com/ (slash commands, agents, hooks, file formats)
- **MCP Specification:** Model Context Protocol documentation
- **Playwright API:** https://playwright.dev/docs/api/
- **Vue 3 Composition API:** https://vuejs.org/api/composition-api-setup.html
- **Pinia State Management:** https://pinia.vuejs.org/api/
- **Express.js API:** https://expressjs.com/en/api.html

---

## 2. Documentation Review

Before fetching external specs, check existing codebase knowledge:

- [ ] **Review CLAUDE.md for related patterns**
  - Search for feature name or similar implementations
  - Check "Data Sources" section for file format references
  - Review "Development History" for related bug fixes

- [ ] **Check existing implementations**
  - Search codebase for similar features (Grep tool)
  - Review related component files (Read tool)
  - Understand current patterns and conventions

- [ ] **Review related bug tickets**
  - Search docs/tickets/bugs/ for similar issues
  - Learn from past specification-related bugs
  - Check if issue was already investigated

**Example:**
```bash
# Search for existing implementations
Grep: pattern="allowed-tools", glob="**/*.js"
Read: /home/claude/manager/src/backend/services/projectDiscovery.js

# Check for related bugs
Grep: pattern="BUG-0[2-4][0-9]", path="docs/tickets/bugs/", output_mode="files_with_matches"
```

---

## 3. External Spec Fetch (If Needed)

If codebase documentation is insufficient, fetch the official specification:

- [ ] **Use WebFetch to retrieve latest official spec**
  ```
  WebFetch(url="https://docs.example.com/api",
           prompt="Extract property names, required fields, and data types for [feature]")
  ```

- [ ] **Read through ENTIRE relevant section**
  - Don't skim or guess based on partial reading
  - Pay attention to:
    - Exact property names (case-sensitive!)
    - Required vs optional fields
    - Data types and formats
    - Edge cases and constraints
    - Examples and sample code

- [ ] **Note version changes or important details**
  - Document any differences from previous versions
  - Note deprecation warnings
  - Record any important constraints or limitations

- [ ] **Save spec URL for commit reference**
  - Copy exact URL to include in commit message
  - Note specific section numbers or headings
  - Document date accessed

**Example WebFetch Usage:**
```
Tool: WebFetch
URL: https://docs.claude.com/slash-commands
Prompt: "What is the exact property name for specifying allowed tools in a slash command?
         Provide the property name, data type, format, and any examples."

Result: Property name is "allowed-tools" (hyphenated), not "tools"
        Can be comma-separated string or YAML array
        Example: allowed-tools: Read, Write, Edit
```

---

## 4. Implementation Guidance

Implement carefully using specification as source of truth:

- [ ] **Use exact property names from spec**
  - CASE-SENSITIVE: "allowed-tools" ≠ "allowedTools" ≠ "tools"
  - HYPHENATION MATTERS: "allowed-tools" ≠ "allowed_tools"
  - NO ABBREVIATIONS: Don't shorten property names

- [ ] **Reference spec sections in code comments**
  ```javascript
  // Per Claude Code spec (https://docs.claude.com/commands#allowed-tools):
  // Commands use 'allowed-tools' property for tool restrictions
  const allowedTools = frontmatter['allowed-tools'] || [];
  ```

- [ ] **Document any assumptions or deviations**
  - If deviating from spec, document WHY
  - If spec is ambiguous, document interpretation
  - If multiple valid approaches, document choice reasoning

- [ ] **Follow formatting/structure as specified**
  - Respect YAML vs JSON requirements
  - Follow indentation and syntax rules
  - Match examples from official documentation

- [ ] **Test against spec requirements**
  - Verify all required fields are handled
  - Test optional fields work correctly
  - Validate edge cases mentioned in spec
  - Use real data from spec examples

**Anti-Pattern Example (BUG-030):**
```javascript
// ❌ WRONG: Guessed property name without checking spec
const tools = frontmatter.tools || [];  // Commands use 'allowed-tools', not 'tools'!

// ✅ CORRECT: Verified property name from official spec
// Per https://docs.claude.com/slash-commands#metadata:
// Commands use 'allowed-tools' property (agents use 'tools')
const allowedTools = frontmatter['allowed-tools'] || [];
```

---

## 5. Commit Documentation

Document specification research in commit message:

- [ ] **Include spec URL in commit message body**
  ```
  fix: extract allowed-tools from slash commands

  Per https://docs.claude.com/slash-commands#metadata (section 3.2):
  Slash commands use 'allowed-tools' property for tool restrictions.

  Changed backend extraction from 'tools' to 'allowed-tools'.
  Maps to API response 'tools' field for frontend consistency.

  Fixes BUG-030
  ```

- [ ] **Reference specific sections consulted**
  - Include section numbers or headings
  - Quote key passages if relevant
  - Note any important constraints

- [ ] **Note any deviations from spec with explanation**
  - Why deviation was necessary
  - What trade-offs were made
  - Future work to align with spec

- [ ] **Document property mapping decisions**
  - If backend uses one name, frontend another
  - Explain reasoning for consistency

**Commit Message Template:**
```
<type>: <brief description>

Per <spec-url> (section X.Y):
<key specification details>

Changes:
- <what was changed>
- <why it was changed>
- <how it aligns with spec>

[Optional] Deviations:
- <any deviations from spec>
- <justification for deviation>

Fixes <BUG-XXX> (if applicable)
```

---

## 6. Test Thoroughly

Validate implementation against specification:

- [ ] **Verify against spec requirements**
  - All required fields handled
  - Optional fields work correctly
  - Default values match spec

- [ ] **Test edge cases mentioned in spec**
  - Empty values
  - Missing fields
  - Invalid data types
  - Maximum/minimum values

- [ ] **Add test comments referencing spec sections**
  ```javascript
  // Test per Claude Code spec section 3.2:
  // allowed-tools can be comma-separated string or YAML array
  test('extracts allowed-tools from comma-separated string', async () => {
    // ...
  });
  ```

- [ ] **Validate with real data**
  - Use actual command files from .claude/commands/
  - Test with real agent definitions
  - Verify with production-like configurations

- [ ] **Run full test suite**
  - Backend tests (Jest)
  - Frontend tests (Playwright)
  - Integration tests
  - Visual regression tests (if UI changes)

---

## 7. Common Spec-Based Features

### Slash Command Configuration

**Spec:** Claude Code slash commands documentation

**Key Properties:**
- `allowed-tools` (NOT "tools") - comma-separated string or YAML array
- `name` - command name (required)
- `description` - command description (required)
- `namespace` - command namespace (optional)

**Common Pitfalls:**
- ❌ Using `tools` instead of `allowed-tools`
- ❌ Assuming property names match agent format
- ❌ Not handling both string and array formats

### Agent Definitions

**Spec:** Claude Code agent documentation

**Key Properties:**
- `tools` (NOT "allowed-tools") - tools available to agent
- `model` - model name (optional)
- `color` - agent color theme (optional)
- `name` - agent name (required)
- `description` - agent description (required)

**Common Pitfalls:**
- ❌ Using `allowed-tools` instead of `tools` (opposite of commands!)
- ❌ Assuming agents and commands use same property names
- ❌ Not handling optional fields gracefully

### Hook Structure

**Spec:** Claude Code hooks documentation

**Key Properties:**
- Event types: `pre-commit`, `post-commit`, `pre-push`, etc.
- Hook patterns: glob patterns for file matching
- Command execution: shell commands to run

**Common Pitfalls:**
- ❌ Assuming all event types are supported
- ❌ Not validating hook patterns
- ❌ Missing shell command escaping

### MCP Server Configuration

**Spec:** Model Context Protocol documentation

**Key Properties:**
- Server name (required)
- Connection details (host, port, etc.)
- Authentication (if required)
- Capabilities and features

**Common Pitfalls:**
- ❌ Not validating connection parameters
- ❌ Missing error handling for server failures
- ❌ Not testing connection before saving

### Claude Code File Formats

**Locations:**
- `.claude/agents/*.md` - Agent definitions (markdown with YAML frontmatter)
- `.claude/commands/**/*.md` - Slash commands (markdown with YAML frontmatter)
- `.claude/settings.json` - Project settings (JSON with hooks, MCP servers)
- `.claude/settings.local.json` - Local project settings (JSON)
- `.mcp.json` - MCP server configurations (JSON)

**Common Pitfalls:**
- ❌ Confusing JSON and YAML syntax
- ❌ Not handling nested directory structures for commands
- ❌ Missing frontmatter delimiter validation (---)
- ❌ Not parsing markdown content separately from YAML

---

## Real-World Example: BUG-030 Resolution

### Problem
Command sidebar showed empty `tools` field, even though backend was extracting data.

### Initial Analysis (Wrong Approach)
```
Developer assumption: "Backend probably has a typo or missing extraction"
Action: Checked backend code, found it was looking for 'tools' property
Result: Confusion - why isn't 'tools' working?
Time wasted: ~30 minutes debugging wrong thing
```

### Correct Approach (With Spec Review)
```
Developer checklist:
1. ✅ Identified spec: Claude Code slash commands documentation
2. ✅ Used WebFetch to retrieve official spec
3. ✅ Read section 3.2: Command Metadata Properties
4. ✅ Found: Commands use 'allowed-tools', agents use 'tools'
5. ✅ Implemented: Changed extraction to 'allowed-tools'
6. ✅ Documented: Included spec URL in commit message
7. ✅ Tested: Verified with real command files

Result: Fixed on first try, no debugging needed
Time saved: ~50 minutes
```

### Changes Made
**Backend (projectDiscovery.js):**
```javascript
// ❌ BEFORE (wrong property name)
const tools = frontmatter.tools || [];

// ✅ AFTER (correct property from spec)
// Per https://docs.claude.com/slash-commands#metadata:
// Commands use 'allowed-tools' property (agents use 'tools')
const allowedTools = frontmatter['allowed-tools'] || [];
```

**Commit Message:**
```
fix: extract allowed-tools from slash commands per Claude Code spec

Per https://docs.claude.com/slash-commands#metadata (section 3.2):
Slash commands use 'allowed-tools' property for tool restrictions.
Agents use 'tools' property (different naming convention).

Changes:
- Backend: Extract from 'allowed-tools' in command YAML frontmatter
- Backend: Map to API response 'tools' field for frontend consistency
- Frontend: Already correctly handling 'tools' field from API

This maintains frontend consistency while aligning backend with spec.

Fixes BUG-030
```

### Verification
- ✅ Backend tests passing (270 tests)
- ✅ Frontend tests passing (313 tests)
- ✅ Manual testing: Commands show tools correctly in sidebar
- ✅ Edge cases: Empty tools, missing field, array vs string format

### Lessons Learned
1. **Always check spec first** - Don't assume property names
2. **Different configs use different conventions** - Commands ≠ Agents
3. **WebFetch is fast** - 2 minutes to retrieve spec vs 30+ minutes debugging
4. **Document in commit** - Future developers benefit from spec references
5. **Test immediately** - Spec-based changes should work first try

---

## Checklist Summary

Before implementing any specification-based feature:

1. [ ] Identify which specification applies
2. [ ] Review existing codebase documentation (CLAUDE.md, docs/)
3. [ ] Check for similar implementations in codebase
4. [ ] Fetch official spec if needed (WebFetch tool)
5. [ ] Read ENTIRE relevant section (don't skim!)
6. [ ] Use EXACT property names (case-sensitive!)
7. [ ] Reference spec in code comments
8. [ ] Document spec URL in commit message
9. [ ] Test against spec requirements
10. [ ] Verify with real data

**Time Investment:**
- Spec review: 5-10 minutes
- Wrong implementation debugging: 30-60 minutes (prevented!)

**ROI:** 5-10x time savings by doing spec review upfront

---

## Quick Reference: Specification URLs

- **Claude Code:** https://docs.claude.com/
- **MCP Protocol:** https://modelcontextprotocol.io/
- **Playwright:** https://playwright.dev/docs/api/
- **Vue 3:** https://vuejs.org/api/
- **Pinia:** https://pinia.vuejs.org/api/
- **Express.js:** https://expressjs.com/en/api.html
- **Vite:** https://vitejs.dev/config/
- **Vitest:** https://vitest.dev/api/

---

## Integration with Development Workflow

This checklist integrates with existing workflow documents:

- **Before:** Planning phase - identify if feature needs spec review
- **During:** Implementation phase - follow checklist before coding
- **After:** Commit phase - include spec references in commit message

**Related Documents:**
- `/home/claude/manager/CLAUDE.md` - Main project documentation
- `/home/claude/manager/.claude/templates/test-template.md` - Testing guidelines
- `/home/claude/manager/docs/workflow-improvements/` - Workflow best practices

**Subagent Integration:**
- Backend architects: Use checklist for API implementations
- Frontend developers: Use checklist for component integrations
- Test engineers: Verify against spec requirements
- Git specialists: Validate spec references in commits

---

**Last Updated:** 2025-10-26
**Status:** Active
**Related Bugs:** BUG-030 (motivating example)
