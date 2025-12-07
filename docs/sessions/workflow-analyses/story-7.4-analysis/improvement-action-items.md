# STORY-7.4 Workflow Analysis - Action Items & Discussion Topics

**Created:** December 7, 2025
**Session:** Workflow analysis of STORY-7.4 sessions to identify improvements

---

## Completed This Session

1. ✅ Located 7 STORY-7.4 session transcripts (identified fork families, found correct paths)
2. ✅ Ran 7 workflow analyzer agents in parallel
3. ✅ Generated synthesis report

---

## Discussion Topics (To Address)

### 1. Agent Tool Configurations

**Issue:** Agents may not have the tools they need to do their job effectively.

**Example:** Playwright screenshot capability (`mcp__playwright__browser_take_screenshot`) is useful for verifying UI elements exist and are positioned correctly, but only a few agents have it.

**Current State:**
- `frontend-developer` - Has Playwright tools
- `integration-tester` - Has Playwright tools
- `test-audit-specialist` - Has Playwright tools
- `playwright-testing-expert` - Does NOT have Playwright MCP tools (only Bash, Read, Write, etc.)

**Action:** Review all agent tool configurations and ensure they have appropriate tools for their responsibilities.

---

### 2. Orchestrator Agent - Plan Mode?

**Question:** Should the `subagent-orchestrator` run in Plan Mode?

**Potential Benefits:**
- More structured planning output
- Forces exploration before execution
- Clear plan approval checkpoint

**Potential Drawbacks:**
- Additional overhead
- May slow down simple orchestration tasks

**Action:** Discuss and decide on orchestrator mode.

---

### 3. Schema Documentation

**Existing:** `/home/meckert/personal/schemas/frontmatter-schema.md`
- Covers: Agents frontmatter, Commands frontmatter
- Includes: YAML formatting rules, validation checklists

**Missing:**
- Hooks JSON structure (`settings.json` hooks array)
- MCP servers JSON structure (`.mcp.json` and `settings.json`)
- Skills SKILL.md structure

**Purpose:**
- Reference during development
- Compare against new Claude Code releases
- Validate implementations

**Action:** Expand schema documentation to cover all config types.

---

### 4. Workflow/Development Doc Improvements

**Goal:** Review existing guides and propose universal improvements (not feature-specific).

**Guides to Review:**
- `docs/guides/SWARM-WORKFLOW.md`
- `docs/guides/CODING-STANDARDS.md`
- `docs/guides/TESTING-GUIDE.md`
- `docs/guides/GIT-WORKFLOW.md`
- `docs/guides/SPEC-IMPLEMENTATION-GUIDE.md`
- Other guides in `docs/guides/`

**Constraint:** Updates should be universal, not specific to current features.

**Action:** Review docs and propose improvements based on synthesis report findings.

---

### 5. New Agents (Only If Universally Beneficial)

**Constraint:** Only suggest new agents if they are universally beneficial to the workflow. Do not suggest agents just to provide a suggestion.

**Action:** Evaluate based on workflow gaps identified in synthesis report.

---

### 6. Separate Delete from Edit Features

**Decision:** For Skills, Hooks, MCP Servers - implement Delete and Edit as separate stories.

**Rationale:**
- Reduces scope per story
- Allows focused implementation and testing
- Prevents scope creep and complexity

**Action:** When creating tickets for remaining CRUD features, separate Delete and Edit.

---

## Synthesis Report "What Needs Improvement" - Decisions

| # | Report Item | Decision |
|---|-------------|----------|
| 1 | Mandatory Pre-Implementation Comparative Analysis | **Create dedicated doc** for altering workflows when copying features between config types. Reference only when needed to save context. |
| 2 | Consolidate Duplicate Parser Logic | **Agreed** - no duplicate code allowed |
| 3 | Enhanced Code Review Checklist | **TBD** - Dedicated doc or add to agent prompt? Discuss. |
| 4 | Subagent Task Specification Best Practices | **Add implementation outline step** - abbreviated task list before implementation (no code snippets). Example: "Implement Delete button on config card", "Implement Delete button in sidebar", "Implement LabeledInlineEditField for each property: description (textarea), model (dropdown), ..." |
| 5 | Property Audit Protocol | **Approved** |
| 6 | Test Data Standards | **Approved** |

---

## Files Created This Session

```
/home/claude/manager/docs/sessions/workflow-analyses/story-7.4-analysis/
├── session-1-analysis.md   (21 KB) - Nov 29 foundation work
├── session-2-analysis.md   (11 KB) - Nov 30 STORY-7.3 reference
├── session-3-analysis.md   (26 KB) - Dec 1 primary implementation
├── session-4-analysis.md   (20 KB) - Dec 2/3 failed fixes, restart
├── session-5-analysis.md   (19 KB) - Dec 5 restart with parallelization
├── session-6-analysis.md   (22 KB) - Dec 5 parser bug discovery
├── session-7-analysis.md   (18 KB) - Dec 6 test fixes
├── synthesis-report.md     (37 KB) - Combined findings
└── improvement-action-items.md     - This file
```

---

## Reference Files

- **Schema doc:** `/home/meckert/personal/schemas/frontmatter-schema.md`
- **Plan file:** `/home/meckert/.claude/plans/vectorized-purring-summit.md`
- **Synthesis report:** `/home/claude/manager/docs/sessions/workflow-analyses/story-7.4-analysis/synthesis-report.md`

---

## Next Steps

1. Investigate agent tool configurations
2. Research orchestrator Plan Mode implications
3. Identify schema gaps for hooks, MCP, skills
4. Review workflow docs for improvement opportunities
5. Evaluate need for new agents
6. Build comprehensive improvement plan
7. Get user approval before implementing changes
