# Feature: Skills Read-Only Display

**Status:** Planning
**Complexity:** Medium
**Dependencies:** None (extends existing patterns)
**Estimated Effort:** 2-3 days

## Overview

Add read-only viewing capabilities for Claude Code Agent Skills across user-level and project-level scopes, including skills provided by installed plugins.

## User Value Proposition

**As a Claude Code user, I want to:**
- View all available Agent Skills in one place
- Understand which skills are available at user vs. project scope
- See which skills come from installed plugins
- Quickly access skill documentation and usage instructions

**So that I can:**
- Discover capabilities I didn't know existed
- Understand the difference between personal and project skills
- Make informed decisions about which skills to use
- Reference skill documentation without leaving the web interface

## What Are Agent Skills?

Agent Skills are modular capabilities that extend Claude's functionality in Claude Code. Unlike slash commands (user-invoked), skills are **model-invoked** - Claude autonomously decides when to use them based on the skill's description and the user's request.

### Key Characteristics

- **Progressive Disclosure:** Skills load information only when needed (like a well-organized manual)
- **Storage Locations:** Three tiers with precedence
  1. Personal Skills: `~/.claude/skills/[skill-name]/SKILL.md`
  2. Project Skills: `.claude/skills/[skill-name]/SKILL.md`
  3. Plugin Skills: Provided by installed plugins
- **Structure:** Each skill is a directory containing:
  - `SKILL.md` - Main documentation with YAML frontmatter
  - Optional supporting files (scripts, templates, resources)

### File Format Example

```markdown
---
name: canvas-design
description: Create beautiful visual art in .png and .pdf documents using design philosophy.
license: Complete terms in LICENSE.txt
---

# Canvas Design Skill

[Detailed instructions that Claude reads when the skill is invoked...]
```

## Data Sources

### User-Level Skills
- **Path:** `~/.claude/skills/[skill-name]/SKILL.md`
- **Scope:** Available across all projects for this user
- **Example:** `write-file`, `custom-formatter`, `test-generator`

### Project-Level Skills
- **Path:** `.claude/skills/[skill-name]/SKILL.md`
- **Scope:** Shared with team, version-controlled with project
- **Example:** Project-specific skills for domain logic, workflows

### Plugin-Provided Skills
- **Source:** Installed plugins that include skills
- **Registry:** `~/.claude/plugins/installed_plugins.json`
- **Location:** `~/.claude/plugins/marketplaces/[marketplace]/[plugin]/skills/[skill-name]/`
- **Example:** `anthropic-agent-skills` plugin provides canvas-design, pdf, pptx, etc.

## Technical Architecture

### Data Model

```typescript
interface Skill {
  name: string;              // From YAML frontmatter
  description: string;       // From YAML frontmatter
  license?: string;          // From YAML frontmatter (optional)
  content: string;           // Full SKILL.md content
  scope: 'user' | 'project' | 'plugin';
  path: string;              // Absolute path to SKILL.md
  pluginInfo?: {             // Only for plugin-provided skills
    pluginName: string;      // e.g., "example-skills"
    marketplace: string;     // e.g., "anthropic-agent-skills"
    version: string;
  };
  supportingFiles?: string[]; // Paths to scripts, templates, etc.
}
```

### API Endpoints (Proposed)

```
GET /api/user/skills
  Response: { skills: Skill[] }
  Returns all user-level skills from ~/.claude/skills/

GET /api/projects/:projectId/skills
  Response: { skills: Skill[] }
  Returns project-level skills from .claude/skills/

GET /api/plugins/skills
  Response: { skills: Skill[] }
  Returns all skills provided by installed plugins
```

### Parser Requirements

**Skill Parser** (new):
- Read `SKILL.md` files
- Extract YAML frontmatter (name, description, license)
- Parse markdown content
- Discover supporting files in skill directory
- Determine scope based on file path

**Plugin Skills Discovery** (new):
- Read `~/.claude/plugins/installed_plugins.json`
- For each installed plugin, check if it contains skills
- Parse skills from plugin directory structure
- Associate skill with parent plugin metadata

## UI/UX Design

### Integration Points

**Option 1: Add to existing views**
- User Global page: Add "Skills" card alongside Agents, Commands, Hooks, MCP
- Project Detail page: Add "Skills" card to project-specific config cards

**Option 2: Dedicated Skills page**
- New top-level navigation item
- Unified view showing all skills (user, project, plugin) with filtering

**Recommendation:** Option 1 (consistency with existing pattern)

### Skills Card Layout

```
┌─────────────────────────────────────────┐
│ Skills (12)                    [Search] │
├─────────────────────────────────────────┤
│ 📦 Plugin Skills (9)                    │
│   ├─ canvas-design                      │
│   │   └─ Create visual art (.png/.pdf) │
│   ├─ pdf                                │
│   │   └─ Read and parse PDF files      │
│   └─ [Show all...]                     │
│                                         │
│ 👤 User Skills (2)                      │
│   ├─ write-file                         │
│   │   └─ Write content using heredoc   │
│   └─ custom-validator                   │
│       └─ Validate config files         │
│                                         │
│ 📁 Project Skills (1)                   │
│   └─ domain-analyzer                    │
│       └─ Analyze domain-specific logic │
└─────────────────────────────────────────┘
```

### Skill Detail Sidebar

When clicking a skill, show:
- **Name** (from frontmatter)
- **Description** (from frontmatter)
- **License** (if present)
- **Scope Badge** (User / Project / Plugin)
- **Plugin Info** (if from plugin): plugin name, marketplace, version
- **Full Documentation** (rendered markdown from SKILL.md)
- **Supporting Files** (if present): list of scripts, templates, etc.
- **File Path** (for power users)

## Open Questions

### 1. Plugin Skills Display Strategy
**Question:** Should plugin-provided skills be shown separately, or integrated into user/project lists?

**Options:**
- **A:** Separate "Plugin Skills" section (proposed above) - clearer origin
- **B:** Merge into user-level (since they're globally available) - simpler
- **C:** Show in all three sections with "Provided by plugin X" badge - most visibility

**Leaning toward:** Option A (separate section) - makes it clear these come from plugins

### 2. Scope Precedence Indication
**Question:** If a skill exists at multiple scopes (e.g., user and project both have "write-file"), how do we show which takes precedence?

**Note:** Project skills override user skills in Claude Code. Should we:
- Show both with a "⚠️ Overridden" badge on the user-level one?
- Only show the active one with an indicator that others exist?
- Show all with clear precedence indication?

### 3. Supporting Files Handling
**Question:** Skills can have supporting files (scripts, templates). Should we:
- Just list them by name?
- Allow viewing their contents?
- Download them?
- Ignore them in read-only view?

**Recommendation:** List them with view capability (similar to how we show markdown content)

### 4. Search/Filter Requirements
**Question:** What search capabilities do users need?
- Search by skill name? (definitely)
- Search within skill content? (maybe)
- Filter by scope (user/project/plugin)? (useful)
- Filter by plugin source? (useful for plugin skills)

## Success Criteria

### Functional Requirements
- ✅ User can view all user-level skills from `~/.claude/skills/`
- ✅ User can view all project-level skills from `.claude/skills/`
- ✅ User can view all plugin-provided skills
- ✅ User can see skill metadata (name, description, license)
- ✅ User can read full skill documentation (SKILL.md content)
- ✅ User can identify skill scope (user/project/plugin)
- ✅ User can search/filter skills by name
- ✅ Skills from plugins show plugin attribution

### Non-Functional Requirements
- ✅ Parsing handles malformed YAML frontmatter gracefully
- ✅ Missing SKILL.md files don't break the view
- ✅ Performance: <200ms to load skills list
- ✅ UI consistent with existing agent/command/hook patterns
- ✅ Responsive design works on laptop/desktop

### Quality Requirements
- ✅ Unit tests for skill parser
- ✅ API endpoint tests
- ✅ E2E tests for skills display
- ✅ Error handling for missing/malformed files
- ✅ Documentation updated (CHANGELOG, CLAUDE.md)

## Implementation Considerations

### Reusable Patterns
This feature can leverage existing patterns:
- **Parser Logic:** Similar to agent parser (YAML frontmatter + markdown)
- **Card Layout:** Reuse ConfigCard component from Phase 2.1
- **Detail Sidebar:** Reuse ConfigDetailSidebar component
- **API Structure:** Consistent with `/api/user/agents`, `/api/projects/:id/agents`

### New Components Needed
- **SkillsCard.vue** - Displays skills list with scope grouping
- **Backend:** `src/backend/parsers/skill-parser.js`
- **Backend:** `src/backend/routes/skills.js`

### Estimated Task Breakdown
Based on 30-60 minute task sizing:

**Backend (6-8 tasks, ~5 hours):**
1. Create skill parser (extract YAML, parse markdown) - 60 min
2. Add skill discovery logic (find all SKILL.md files) - 45 min
3. Create GET /api/user/skills endpoint - 30 min
4. Create GET /api/projects/:id/skills endpoint - 30 min
5. Add plugin skills discovery logic - 60 min
6. Create GET /api/plugins/skills endpoint - 30 min
7. Write backend unit tests - 60 min
8. Add error handling for malformed files - 45 min

**Frontend (5-7 tasks, ~4 hours):**
1. Create SkillsCard component - 60 min
2. Add skills to UserGlobal view - 30 min
3. Add skills to ProjectDetail view - 30 min
4. Update API client with skills endpoints - 30 min
5. Add skills to Pinia store - 45 min
6. Implement search/filter in SkillsCard - 45 min
7. Write frontend E2E tests - 60 min

**Total Estimate:** 9-10 hours (~2 days)

## Dependencies & Risks

### Dependencies
- None - this extends existing read-only patterns

### Risks
**Low Risk:**
- Similar to existing agent/command display
- Well-understood file parsing requirements
- No complex logic or state management

**Mitigation:**
- Follow established patterns from Phase 1/2
- Reuse existing components (ConfigCard, ConfigDetailSidebar)
- Comprehensive error handling for file system operations

## Next Steps

1. **Review & Validate:** Stakeholder review of this feature overview
2. **Detailed Design:** Create UI mockups/wireframes for skills display
3. **Technical Spec:** Write detailed API and parser specifications
4. **Task Breakdown:** Create Epic/Story/Task tickets with 30-60 min sizing
5. **Implementation:** Execute using SWARM methodology

## Related Documents

- **Claude Code Skills Docs:** https://docs.claude.com/en/docs/claude-code/skills
- **Anthropic Skills Blog:** https://www.anthropic.com/news/skills
- **Phase 2.1 Component Refactoring:** `docs/prd/PRD-Phase2-Extension-Component-Refactoring.md`
- **Existing Parser Patterns:** `src/backend/parsers/agent-parser.js`

---

**Document Version:** 1.0
**Last Updated:** November 1, 2025
**Author:** Claude (project-manager + documentation-engineer)
