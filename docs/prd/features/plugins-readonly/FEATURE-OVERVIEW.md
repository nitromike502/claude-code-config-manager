# Feature: Plugins Read-Only Display

**Status:** Planning
**Complexity:** High
**Dependencies:** Skills feature (optional - better UX if implemented first)
**Estimated Effort:** 4-5 days

## Overview

Add read-only viewing capabilities for Claude Code Plugins, showing installed plugins, their metadata, and the configurations they provide (commands, agents, hooks, Skills, MCP servers).

## User Value Proposition

**As a Claude Code user, I want to:**
- View all installed plugins in one centralized location
- See what each plugin provides (commands, agents, hooks, Skills, MCP servers)
- Understand plugin metadata (version, author, marketplace source)
- Discover capabilities provided by plugins
- Verify plugin installation status

**So that I can:**
- Know what plugins I have installed without running CLI commands
- Understand what features each plugin adds
- Make informed decisions about which plugins to keep or uninstall
- Troubleshoot issues by seeing plugin versions and sources
- Discover functionality I didn't know my plugins provided

## What Are Claude Code Plugins?

Plugins are **custom collections** of Claude Code configurations that can be installed with a single command. They're a lightweight way to package and share any combination of:
- Slash commands
- Subagents (specialized development agents)
- Hooks (customize behavior at workflow points)
- Agent Skills (modular capabilities)
- MCP servers (Model Context Protocol integrations)

### Key Characteristics

- **Collections:** Plugins are containers that bundle multiple related features
- **Marketplaces:** Plugins are distributed through marketplaces (git repositories)
- **Installation:** Installed via CLI (`/plugin install <plugin-name>`)
- **Scoping:** Can be user-level or repository-level
- **Versioning:** Each plugin has version tracking and git commit SHA

### Plugin Architecture

```
~/.claude/plugins/
├── config.json                          # Plugin system configuration
├── installed_plugins.json               # Registry of installed plugins
├── known_marketplaces.json              # Available marketplaces
└── marketplaces/
    └── [marketplace-name]/              # e.g., "anthropic-agent-skills"
        └── plugins/
            └── [plugin-name]/           # e.g., "commit-commands"
                ├── .claude-plugin/
                │   └── plugin.json      # Plugin manifest
                ├── commands/            # Slash commands (optional)
                ├── agents/              # Subagents (optional)
                ├── hooks/               # Hooks (optional)
                ├── skills/              # Agent Skills (optional)
                ├── mcp/                 # MCP servers (optional)
                └── README.md            # Documentation
```

### Plugin Manifest Example

```json
{
  "name": "commit-commands",
  "description": "Streamline your git workflow with simple commands for committing, pushing, and creating pull requests",
  "version": "1.0.0",
  "author": {
    "name": "Anthropic",
    "email": "support@anthropic.com"
  }
}
```

## Data Sources

### Plugin Registry
- **Path:** `~/.claude/plugins/installed_plugins.json`
- **Contains:** List of installed plugins with metadata
- **Schema:**
```json
{
  "version": 1,
  "plugins": {
    "commit-commands@claude-code-plugins": {
      "version": "1.0.0",
      "installedAt": "2025-11-02T01:17:59.668Z",
      "lastUpdated": "2025-11-02T01:17:59.668Z",
      "installPath": "/home/user/.claude/plugins/marketplaces/...",
      "gitCommitSha": "b42fd9928c8f80ead5ca43e4e0673da22faca6bd",
      "isLocal": true
    }
  }
}
```

### Plugin Manifest
- **Path:** `~/.claude/plugins/marketplaces/[marketplace]/plugins/[plugin]/.claude-plugin/plugin.json`
- **Contains:** Plugin metadata (name, description, version, author)

### Plugin Contents
Plugins can contain any combination of:
- **Commands:** `.../commands/**/*.md`
- **Agents:** `.../agents/*.md`
- **Hooks:** `.../hooks/hooks.json`
- **Skills:** `.../skills/[skill-name]/SKILL.md`
- **MCP Servers:** `.../mcp/*.json`

## Technical Architecture

### Data Model

```typescript
interface Plugin {
  // Identity
  id: string;                    // "commit-commands@claude-code-plugins"
  name: string;                  // "commit-commands"
  marketplace: string;           // "claude-code-plugins"

  // Metadata (from plugin.json)
  description: string;
  version: string;
  author?: {
    name: string;
    email?: string;
  };

  // Installation Info (from installed_plugins.json)
  installedAt: string;           // ISO timestamp
  lastUpdated: string;           // ISO timestamp
  installPath: string;           // Absolute path
  gitCommitSha?: string;         // Git commit when installed
  isLocal: boolean;              // Local vs remote marketplace

  // Contents (discovered by scanning plugin directory)
  provides: {
    commands?: PluginCommand[];
    agents?: PluginAgent[];
    hooks?: PluginHook[];
    skills?: PluginSkill[];
    mcpServers?: PluginMcpServer[];
  };
}

interface PluginCommand {
  name: string;                  // Command name (e.g., "commit")
  description: string;           // From frontmatter or first line
  path: string;                  // Relative to plugin root
}

// Similar interfaces for PluginAgent, PluginSkill, etc.
```

### API Endpoints (Proposed)

```
GET /api/plugins
  Response: { plugins: Plugin[] }
  Returns all installed plugins with full metadata and contents

GET /api/plugins/:pluginId
  Response: { plugin: Plugin }
  Returns detailed information about a specific plugin

GET /api/plugins/:pluginId/commands
  Response: { commands: PluginCommand[] }
  Returns all commands provided by this plugin

GET /api/plugins/:pluginId/agents
  Response: { agents: PluginAgent[] }
  Returns all agents provided by this plugin

GET /api/plugins/:pluginId/skills
  Response: { skills: PluginSkill[] }
  Returns all skills provided by this plugin

GET /api/plugins/:pluginId/hooks
  Response: { hooks: PluginHook[] }
  Returns all hooks provided by this plugin

GET /api/plugins/:pluginId/mcp
  Response: { mcpServers: PluginMcpServer[] }
  Returns all MCP servers provided by this plugin
```

### Parser Requirements

**Plugin Registry Parser** (new):
- Read `installed_plugins.json`
- Parse plugin IDs (format: `name@marketplace`)
- Extract installation metadata

**Plugin Manifest Parser** (new):
- Read `.claude-plugin/plugin.json` for each installed plugin
- Extract name, description, version, author

**Plugin Contents Scanner** (new):
- Scan plugin directory for commands, agents, hooks, skills, MCP servers
- Reuse existing parsers (command-parser, agent-parser, etc.)
- Associate discovered items with parent plugin

## UI/UX Design

### Integration Strategy

**Option 1: Dedicated Plugins Page**
- New top-level navigation item: "Plugins"
- Main view: List of installed plugins (card-based)
- Detail view: Plugin info + what it provides

**Option 2: Add to User Global**
- Add "Plugins" card to User Global page
- Keep consistency with other user-level configs

**Option 3: Hybrid Approach**
- Show plugin badge/attribution in existing views (commands, agents, etc.)
- Add dedicated "Plugins" page for management view

**Recommendation:** Option 3 (best of both worlds)

### Plugins Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Installed Plugins (2)                          [Search] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📦 commit-commands                                  │ │
│ │ claude-code-plugins marketplace                     │ │
│ │                                                     │ │
│ │ Streamline your git workflow with simple commands  │ │
│ │ for committing, pushing, and creating PRs          │ │
│ │                                                     │ │
│ │ Provides: 3 Commands                               │ │
│ │ Version: 1.0.0 • Installed: Nov 1, 2025            │ │
│ │                                [View Details] ───► │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📦 example-skills                                   │ │
│ │ anthropic-agent-skills marketplace                  │ │
│ │                                                     │ │
│ │ Collection of example Agent Skills for common      │ │
│ │ tasks like document creation and web testing       │ │
│ │                                                     │ │
│ │ Provides: 11 Skills, 1 Command                     │ │
│ │ Version: unknown • Installed: Nov 1, 2025          │ │
│ │                                [View Details] ───► │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Plugin Detail View

```
┌───────────────────────────────────────────────────────┐
│ ← Back to Plugins                                     │
├───────────────────────────────────────────────────────┤
│ 📦 commit-commands                                    │
│ claude-code-plugins marketplace                       │
│                                                       │
│ Streamline your git workflow with simple commands    │
│ for committing, pushing, and creating pull requests  │
│                                                       │
│ Author: Anthropic (support@anthropic.com)            │
│ Version: 1.0.0                                        │
│ Installed: November 1, 2025 at 1:17 AM               │
│ Last Updated: November 1, 2025 at 1:17 AM            │
│ Git Commit: b42fd99                                   │
│ Install Path: ~/.claude/plugins/marketplaces/...     │
├───────────────────────────────────────────────────────┤
│                                                       │
│ 📝 Commands (3)                                       │
│   • /commit-commands:commit                           │
│     Create a git commit                               │
│                                                       │
│   • /commit-commands:commit-push-pr                   │
│     Commit, push, and open a PR                       │
│                                                       │
│   • /commit-commands:clean_gone                       │
│     Clean up [gone] branches and worktrees            │
│                                                       │
│ [View All Commands] ──────────────────────────────►  │
└───────────────────────────────────────────────────────┘
```

### Plugin Attribution in Existing Views

Add badges to commands/agents/skills that come from plugins:

```
┌─────────────────────────────────────────┐
│ Commands (15)                  [Search] │
├─────────────────────────────────────────┤
│ /commit                                 │
│   Create a git commit                   │
│   📦 commit-commands plugin             │  ← New badge
│                                         │
│ /analyze-workflow                       │
│   Analyze Claude Code session logs      │
│   [No badge - user-created]             │
└─────────────────────────────────────────┘
```

## Open Questions

### 1. Scope of "Read-Only"
**Question:** What level of detail should we show for plugin contents?

**Options:**
- **A:** High-level only (count of commands, agents, etc.) - simpler
- **B:** Full list with descriptions - more useful
- **C:** Full list + ability to view individual items - most complete

**Leaning toward:** Option C (full list + view) - provides most value

### 2. Plugin vs. Native Distinction
**Question:** How prominently should we distinguish plugin-provided configs from user-created ones?

**Current Approach:**
- Agent/Command/Hook views show ALL items (user + plugin)
- Could add badges or filters

**Options:**
- **A:** Add "📦 Plugin" badge to all plugin items in existing views
- **B:** Add filter toggle: "Show plugin items" / "Show user items"
- **C:** Both A and B
- **D:** Keep existing views unchanged, rely on Plugins page for discovery

**Leaning toward:** Option A (subtle badges) - low visual noise, high clarity

### 3. Plugin Update Status
**Question:** Should we show if a plugin has updates available?

**Challenge:** Requires checking remote marketplace (git fetch)
**Benefit:** Users know when plugins are outdated

**Options:**
- **A:** Show only installed version (no update checks) - simpler
- **B:** Add "Check for Updates" button - manual but accurate
- **C:** Auto-check on page load - convenient but slower

**Recommendation:** Defer to future enhancement (out of scope for read-only)

### 4. Marketplace Discovery
**Question:** Should we show available (not installed) plugins from marketplaces?

**Scope:**
- Read `known_marketplaces.json` to find marketplaces
- Fetch available plugins from each marketplace
- Show installation status

**Recommendation:** Defer to future "Plugin Management" feature (write operations)

### 5. Relationship to Existing Config Views
**Question:** If a plugin provides commands, should they appear in:
- Commands view only?
- Commands view + Plugins view?
- Commands view with link to parent plugin?

**Recommendation:** Show in both places with bi-directional navigation:
- Commands view shows plugin badge with link to plugin detail
- Plugin detail shows commands list with links to command detail

## Success Criteria

### Functional Requirements
- ✅ User can view all installed plugins
- ✅ User can see plugin metadata (name, description, version, author, marketplace)
- ✅ User can see installation info (installed date, last updated, git commit SHA)
- ✅ User can see what each plugin provides (count + list of commands/agents/skills/etc.)
- ✅ User can navigate from plugin to individual provided items
- ✅ User can navigate from provided items back to parent plugin
- ✅ User can search/filter plugins by name or marketplace
- ✅ Plugin-provided items show attribution in existing views (commands, agents, etc.)

### Non-Functional Requirements
- ✅ Parsing handles missing plugin manifests gracefully
- ✅ Scanning large plugins (100+ items) completes in <500ms
- ✅ UI consistent with existing patterns
- ✅ Responsive design works on laptop/desktop
- ✅ Error handling for corrupted installed_plugins.json

### Quality Requirements
- ✅ Unit tests for plugin parsers and scanners
- ✅ API endpoint tests for all plugin routes
- ✅ E2E tests for plugin display and navigation
- ✅ Error handling for missing/malformed files
- ✅ Documentation updated (CHANGELOG, CLAUDE.md)

## Implementation Considerations

### Complexity Factors

**Why This Is "High Complexity":**
1. **Hierarchical Data:** Plugins contain other entities (commands, agents, skills)
2. **Multiple Data Sources:** Registry + manifests + directory scanning
3. **Bidirectional Navigation:** Plugin ↔ Contents relationships
4. **Cross-Feature Integration:** Affects existing commands/agents/skills views
5. **Performance:** Scanning multiple plugin directories can be slow

### Reusable Patterns
- **Existing Parsers:** Reuse command-parser, agent-parser, skill-parser for plugin contents
- **ConfigCard Component:** Can be adapted for plugin cards
- **API Structure:** Consistent REST patterns

### New Components Needed

**Backend:**
- `src/backend/parsers/plugin-registry-parser.js` - Parse installed_plugins.json
- `src/backend/parsers/plugin-manifest-parser.js` - Parse plugin.json files
- `src/backend/scanners/plugin-contents-scanner.js` - Discover plugin contents
- `src/backend/routes/plugins.js` - Plugin API endpoints

**Frontend:**
- `src/components/plugins/PluginsCard.vue` - Installed plugins list
- `src/components/plugins/PluginDetailCard.vue` - Single plugin detail view
- `src/components/plugins/PluginBadge.vue` - Small badge for attribution
- `src/views/Plugins.vue` - Dedicated plugins page (if using Option 1/3)

### Estimated Task Breakdown
Based on 30-60 minute task sizing:

**Backend (12-15 tasks, ~12 hours):**
1. Create plugin registry parser - 60 min
2. Create plugin manifest parser - 45 min
3. Create plugin contents scanner (commands) - 60 min
4. Extend scanner for agents - 30 min
5. Extend scanner for skills - 30 min
6. Extend scanner for hooks - 30 min
7. Extend scanner for MCP servers - 30 min
8. Create GET /api/plugins endpoint - 45 min
9. Create GET /api/plugins/:id endpoint - 45 min
10. Create GET /api/plugins/:id/commands endpoint - 30 min
11. Create GET /api/plugins/:id/agents endpoint - 30 min
12. Create GET /api/plugins/:id/skills endpoint - 30 min
13. Add plugin attribution to existing endpoints - 60 min
14. Write backend unit tests - 90 min
15. Add error handling - 60 min

**Frontend (10-12 tasks, ~10 hours):**
1. Create PluginsCard component - 60 min
2. Create PluginDetailCard component - 60 min
3. Create PluginBadge component - 30 min
4. Create Plugins page view - 60 min
5. Add plugin attribution to CommandsCard - 45 min
6. Add plugin attribution to AgentsCard - 45 min
7. Add plugin attribution to SkillsCard - 45 min
8. Update API client with plugin endpoints - 45 min
9. Add plugins to Pinia store - 60 min
10. Add plugins to router - 30 min
11. Implement bidirectional navigation - 60 min
12. Write E2E tests - 90 min

**Total Estimate:** 22 hours (~4-5 days)

## Dependencies & Risks

### Dependencies
- **Optional:** Skills Read-Only feature (better UX if plugin skills can be viewed)
- **Required:** None (can be implemented standalone)

### Risks

**Medium Risk - Performance:**
- Scanning large plugin directories (100+ files) could be slow
- **Mitigation:** Cache plugin contents, lazy-load detail views

**Medium Risk - Data Consistency:**
- `installed_plugins.json` could be out of sync with actual directories
- **Mitigation:** Validate plugin paths exist, handle missing directories gracefully

**Low Risk - Marketplace Changes:**
- Plugin format could evolve (new fields in plugin.json)
- **Mitigation:** Make parser tolerant of unknown fields, version the data model

## Next Steps

1. **Review & Validate:** Stakeholder review of this feature overview
2. **Detailed Design:** Create UI mockups for plugins page and attribution badges
3. **Technical Spec:** Write detailed API and scanner specifications
4. **Performance Testing:** Benchmark plugin scanning with large marketplaces
5. **Task Breakdown:** Create Epic/Story/Task tickets with 30-60 min sizing
6. **Implementation:** Execute using SWARM methodology

## Related Documents

- **Claude Code Plugins Docs:** https://docs.claude.com/en/docs/claude-code/plugins
- **Anthropic Plugins Announcement:** https://www.anthropic.com/news/claude-code-plugins
- **Skills Read-Only Feature:** `docs/prd/features/skills-readonly/FEATURE-OVERVIEW.md`
- **Phase 2.1 Component Refactoring:** `docs/prd/PRD-Phase2-Extension-Component-Refactoring.md`

---

**Document Version:** 1.0
**Last Updated:** November 1, 2025
**Author:** Claude (project-manager + documentation-engineer)
