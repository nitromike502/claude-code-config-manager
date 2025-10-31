---
name: command-manager
description: Interactive slash command builder and editor that guides you through creating new commands or editing existing ones with Claude Code best practices
tools: Glob, Grep, Read, Edit, MultiEdit, Write, SlashCommand, Bash
argument-hint: "[mode] [command-name] [additional-instructions] - 'new' to create, 'edit' to modify, optional command name and instructions"
color: blue
---

# Claude Code Command Manager

I help you build and manage slash commands following Claude Code best practices. I'll collect all necessary information first, then implement your solution.

## Mode Selection

**Arguments:** `$ARGUMENTS`

### Step 1: Parse Arguments

1. **If `$ARGUMENTS` is empty:**
   - mode = None
   - command_name = None
   - instructions = None
   - → Show interactive help

2. **If `$ARGUMENTS` is not empty:**
   - Extract first token from `$ARGUMENTS`

   **Check if first token is `new` or `edit`:**

   a) **If first token is `new` or `edit`:**
      - mode = first token
      - Extract second token (if exists) as command_name
      - Extract remaining tokens (if exist) as instructions

   b) **If first token is NOT `new` or `edit`:**
      - mode = None (will trigger interactive help)
      - Treat all arguments as potential instructions/guidance
      - Inform user of correct format

3. **Result:**
   - Mode: {mode or "Interactive"}
   - Command Name: {command_name or "To be selected"}
   - Instructions: {instructions or "None"}

### Step 2: Route Based on Parsed Values

**Scenario A: No arguments** (`/command-manager`)
→ Show interactive help (offer to create or edit)

**Scenario B: Mode only** (`/command-manager edit` or `/command-manager new`)
- For `edit`: Scan commands and let user select which to edit
- For `new`: Interactive creation (gather requirements)

**Scenario C: Mode + command-name** (`/command-manager edit code-reviewer`)
→ Direct action on specified command (NEW FEATURE)
- For `edit`: Read `.claude/commands/{command-name}.md` directly
- For `new`: Create `.claude/commands/{command-name}.md` interactively
- Skip command scanning step

**Scenario D: Mode + command-name + instructions** (`/command-manager edit code-reviewer Update...`)
→ Direct action with instructions (NEW FEATURE)
- Same as Scenario C, but pass instructions to claude-code-expert
- Minimal user interaction required

### Step 3: Validate Command File (Edit Mode Only)

If mode = "edit" and command_name is provided:

1. **Construct file path:** `.claude/commands/{command_name}.md`
2. **Check if file exists** using Read or Bash
3. **If file exists:**
   - Proceed to gather requirements or delegate to expert
4. **If file does NOT exist:**
   - Inform user: "Command `{command_name}` not found at `.claude/commands/{command_name}.md`"
   - Suggest: "Run `/command-manager edit` to see all available commands"
   - Exit gracefully

## Information Collection Process

**IMPORTANT:** I will NOT use the claude-code-expert subagent until I have collected ALL required information from you.

### For New Commands, I need:
- **Command name** and **description** (may be provided via arguments)
- **Required tools** (Bash, Read, Write, etc.)
- **Arguments** it should accept
- **Functionality** and expected behavior

### For Editing Commands, I need:
- **Which command** to modify (may be provided via arguments, or I'll scan and show options)
- **What changes** you want to make (may be provided via instructions)
- **Scope** of modifications (bug fix, new features, refactoring)

## Implementation Flow

1. **Gather Requirements** - I collect all details directly (or extract from provided arguments)
2. **Validate Completeness** - Ensure nothing is missing
3. **Expert Implementation** - Only then engage claude-code-expert subagent

## Step 4: Delegate to Claude Code Expert

Invoke the `claude-code-expert` subagent with:

**Mode:** {mode}
**Command Name:** {command_name or "User will specify"}
**Command File Path:** {`.claude/commands/{command_name}.md` if known}

**User-Provided Instructions:**
{If instructions provided:}
{instructions}

{If no instructions:}
(Gather requirements interactively)

**Task:**
{Based on mode, describe what expert should do:}
- For `new`: Create a new slash command following Claude Code best practices
- For `edit`: Modify the existing command with the requested changes

---

## Examples

**Edit with full instructions:**
```
/command-manager edit code-reviewer Update the agent by adding security checks
```

**Edit specific command (interactive refinement):**
```
/command-manager edit code-reviewer
```

**Create with full specification:**
```
/command-manager new my-command Create a command that analyzes test coverage
```

**Edit mode (list all commands):**
```
/command-manager edit
```

**Create mode (interactive):**
```
/command-manager new
```

**Interactive help:**
```
/command-manager
```

---

**Let's start! Tell me:**
- Do you want to create a **new** command or **edit** an existing one?
- What's your specific goal?

I'll ask follow-up questions to collect complete requirements before proceeding to implementation.
