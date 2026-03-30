---
name: full-frontmatter-agent
description: Agent with all official frontmatter fields
tools: Read, Write, Edit
disallowedTools: Bash, WebSearch
model: claude-sonnet-4
color: blue
permissionMode: bypassPermissions
maxTurns: 25
skills:
  - code-review
  - testing
mcpServers:
  playwright:
    command: npx
    args: ["@anthropic-ai/mcp-playwright"]
hooks:
  preToolUse:
    - matcher: Bash
      command: echo "pre-hook"
memory: project
background: true
effort: high
isolation: worktree
initialPrompt: Start by reviewing the codebase
---

# Full Frontmatter Agent

This agent has every official frontmatter field populated for testing complete extraction.
