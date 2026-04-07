---
name: full-frontmatter-cmd
description: Command with all official frontmatter fields
allowed-tools:
  - Read
  - Write
  - Bash
color: purple
model: claude-sonnet-4
argument-hint: "<task-name>"
disable-model-invocation: true
user-invocable: false
effort: medium
context: "src/**/*.js"
agent: backend-architect
hooks:
  preToolUse:
    - matcher: Bash
      command: echo "check"
paths:
  - "src/**/*.js"
  - "tests/**/*.js"
shell: powershell
---

# Full Frontmatter Command

This command has every official frontmatter field populated for testing.
