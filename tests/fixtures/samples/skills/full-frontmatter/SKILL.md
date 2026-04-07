---
name: full-frontmatter-skill
description: Skill with all official frontmatter fields
allowed-tools:
  - Read
  - Write
argument-hint: "<filename> [options]"
disable-model-invocation: true
user-invocable: false
model: claude-sonnet-4
effort: high
context: "src/**/*.ts"
agent: code-reviewer
hooks:
  preToolUse:
    - matcher: Write
      command: echo "validate"
paths: "src/**/*.ts, tests/**/*.ts"
shell: bash
---

# Full Frontmatter Skill

This skill has every official frontmatter field populated for testing.
