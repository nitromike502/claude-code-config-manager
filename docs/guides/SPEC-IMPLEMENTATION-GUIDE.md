# Specification-Based Implementation Guide

## Overview

When implementing features based on official specifications (Claude Code spec, Playwright API, MCP protocol, etc.), follow this mandatory pattern to prevent implementation errors and save significant debugging time.

**Purpose:** Ensure accurate implementation by consulting official documentation before coding, not after encountering bugs.

**Time Impact:** 5 minutes of spec review prevents 30-60 minutes of debugging and rework.

**When to Use:**
- Implementing API integrations (Claude Code, MCP, third-party services)
- Using framework features (Vue 3, Playwright, Pinia)
- Parsing configuration files (agents, commands, hooks, MCP servers)
- Working with protocols or specifications
- Any time there's an "official way" to do something

## The 5-Step Pattern

### Step 1: Identify Specification

Before coding, determine:
- **What specification applies?** (Claude Code commands, agent definitions, MCP servers, etc.)
- **Where is official documentation?** (External URL or codebase location)
- **What version/date is the spec?** (Note any version requirements)

**Common Specifications:**
- **Claude Code:** https://docs.claude.com/ (slash commands, agents, hooks, file formats)
- **MCP Protocol:** Model Context Protocol documentation
- **Playwright API:** https://playwright.dev/docs/api/
- **Vue 3:** https://vuejs.org/api/
- **Pinia:** https://pinia.vuejs.org/api/

### Step 2: Fetch and Review

**Before implementing:**
1. Check CLAUDE.md and existing codebase for related patterns
2. Use WebFetch to retrieve latest official spec (if external)
3. Read through ENTIRE relevant section (don't skim!)
4. Identify key properties, requirements, edge cases
5. Document the URL and specific sections

**WebFetch Example:**
```
WebFetch(url="https://docs.claude.com/slash-commands",
         prompt="What is the exact property name for specifying allowed tools?")
```

### Step 3: Implement Carefully

- **Use exact property names from spec** (case-sensitive!)
  - Example: "allowed-tools" ≠ "allowedTools" ≠ "tools"
- **Reference spec in code comments**
  ```javascript
  // Per Claude Code spec (https://docs.claude.com/commands#allowed-tools):
  // Commands use 'allowed-tools' property for tool restrictions
  const allowedTools = frontmatter['allowed-tools'] || [];
  ```
- **Follow formatting/structure as specified**
- **Handle edge cases mentioned in spec**

### Step 4: Commit With Evidence

Include specification research in commit message:

```
<type>: <brief description>

Per <spec-url> (section X.Y):
<key specification details>

Changes:
- <what was changed>
- <why it was changed>
- <how it aligns with spec>

Fixes <BUG-XXX> (if applicable)
```

**Example:**
```
fix: extract allowed-tools from slash commands per Claude Code spec

Per https://docs.claude.com/slash-commands#metadata (section 3.2):
Slash commands use 'allowed-tools' property for tool restrictions.

Changed backend extraction from 'tools' to 'allowed-tools'.
Maps to API response 'tools' field for frontend consistency.

Fixes BUG-030
```

### Step 5: Test Thoroughly

- Verify implementation against spec requirements
- Test edge cases mentioned in spec
- Add test comments referencing spec sections
- Validate with real data (actual command files, agent definitions, etc.)
- Run full test suite (Jest + Playwright)

## Real-World Example: BUG-030 Fix

### Problem
Command tools field was always empty in sidebar

### Wrong Approach (No Spec Review)
```javascript
// ❌ Guessed property name without checking spec
const tools = frontmatter.tools || [];  // Wrong for commands!
// Result: 30+ minutes debugging, still broken
```

### Correct Approach (With Spec Review)
```javascript
// ✅ Verified property name from official spec
// Per https://docs.claude.com/slash-commands#metadata:
// Commands use 'allowed-tools' property (agents use 'tools')
const allowedTools = frontmatter['allowed-tools'] || [];
// Result: Fixed on first try, zero rework
```

### Key Insight
Commands use 'allowed-tools', agents use 'tools' (different conventions!)

### Resolution Steps
1. Used WebFetch to consult Claude Code spec
2. Found: Agents use 'tools' property, slash commands use 'allowed-tools'
3. Updated backend extraction to look for 'allowed-tools'
4. Mapped to API response 'tools' field for frontend consistency
5. Committed with spec reference in message
6. Test suite validated (270 backend tests passing)

### Time Saved
~50 minutes of debugging prevented by 5 minutes of spec review

### Lesson
Consulting specifications prevents implementation errors and saves significant debugging time.

## Checklist Reference

For comprehensive guidance, see:
- **Full Checklist:** `.claude/templates/spec-review-checklist.md`
- **Quick Summary:** 10-step checklist covering identification, review, implementation, documentation, and testing

## Integration Points

**Backend architects:** Use for API implementations
**Frontend developers:** Use for component integrations
**Test engineers:** Verify against spec requirements
**All developers:** Reference spec URLs in commits

## Quick Decision Guide

**Should I consult the spec?**

| Scenario | Consult Spec? | Why |
|----------|---------------|-----|
| Parsing agent YAML frontmatter | YES | Property names are case-sensitive and spec-defined |
| Implementing Claude Code commands | YES | Metadata fields have specific naming conventions |
| Using Playwright API methods | YES | API signatures and options change between versions |
| Writing Vue 3 components | MAYBE | Only if using advanced/new features |
| Fixing CSS styling | NO | Visual/subjective, no authoritative spec |
| Adding internal utility function | NO | Internal implementation detail |

**Rule of Thumb:** If there's an "official way" documented somewhere, read it first. If you're inventing the approach yourself, spec review isn't needed.

## Common Pitfalls to Avoid

1. **Assuming property names:** Don't guess "tools", "allowedTools", or "allowed_tools" - check the spec
2. **Skimming documentation:** Read the ENTIRE relevant section, not just the first example
3. **Using outdated specs:** Always fetch the latest version from official sources
4. **Forgetting edge cases:** Specs often document error conditions and edge cases - handle them
5. **No spec reference in code:** Future maintainers need to know where the implementation came from
6. **No spec URL in commit:** Code reviewers and git history benefit from spec references

## Success Metrics

**Before implementing this pattern:**
- Implementation bugs from spec misunderstanding: 20-30% of bugs
- Average debugging time per spec-related bug: 30-60 minutes
- Rework rate: 15-25% of spec-based implementations

**After implementing this pattern:**
- Implementation bugs from spec misunderstanding: <5% of bugs
- Average debugging time per spec-related bug: 5-10 minutes
- Rework rate: <5% of spec-based implementations

## Related Resources

- **Development Strategies:** `.claude/templates/development-strategies.md`
- **Spec Review Checklist:** `.claude/templates/spec-review-checklist.md`
- **CLAUDE.md:** `CLAUDE.md` (lines 322-451)

---

**Last Updated:** 2025-10-29
**Version:** 1.0
**Source:** Extracted from CLAUDE.md specification-based implementation pattern
