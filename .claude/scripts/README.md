# Claude Code Scripts

Utility scripts for managing and analyzing Claude Code sessions.

> **Note:** The core scripts `condense-transcript.js` and `analyze-session.js` have been converted to Claude Code Skills for automatic discovery. See `.claude/skills/` for the skill versions. This directory maintains the original standalone scripts for reference and direct usage.

## Skills vs. Scripts

**Recommended:** Use the skills in `.claude/skills/` which Claude can automatically invoke:
- `.claude/skills/transcript-condenser/` - Auto-invoked when analyzing sessions
- `.claude/skills/session-analyzer/` - Auto-invoked when discovering sessions

**Legacy Scripts:** The scripts in this directory remain functional for direct CLI usage but may not receive updates.

---

## condense-transcript.js

**Status:** ⚠️ Migrated to skill at `.claude/skills/transcript-condenser/`

Condenses Claude Code session transcripts into human-readable summaries by filtering out verbose metadata, system notifications, and command artifacts.

### Features

- **Filtering:** Automatically removes meta messages, hook notifications, command clears, and empty stdout
- **Multiple Formats:** Output as Markdown (default) or JSON
- **Verbosity Levels:** Minimal, Standard, or Detailed
- **Batch Processing:** Process entire directories of transcripts
- **Tool Analysis:** Filter to show only tool usage
- **Subagent Tracking:** Identify and filter subagent interactions
- **Session Metadata:** Extract duration, branch, working directory, and version info

### Installation

No installation required. The script uses only Node.js built-in modules (`fs`, `path`).

### Usage

```bash
# Basic usage - output to stdout
node .claude/scripts/condense-transcript.js <transcript-file>

# Save to file
node .claude/scripts/condense-transcript.js <transcript-file> --output=summary.md

# JSON format
node .claude/scripts/condense-transcript.js <transcript-file> --format=json

# Batch process directory
node .claude/scripts/condense-transcript.js logs/20251012/ --output-dir=condensed/

# Show only tool usage
node .claude/scripts/condense-transcript.js <transcript-file> --only-tools

# Show only subagent interactions
node .claude/scripts/condense-transcript.js <transcript-file> --only-subagents

# Minimal verbosity (condensed output)
node .claude/scripts/condense-transcript.js <transcript-file> --verbosity=minimal

# Detailed verbosity (full content)
node .claude/scripts/condense-transcript.js <transcript-file> --verbosity=detailed
```

### Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format=<type>` | Output format: `markdown` or `json` | `markdown` |
| `--output=<file>` | Save to file instead of stdout | stdout |
| `--output-dir=<dir>` | Directory for batch processing output | - |
| `--verbosity=<level>` | `minimal`, `standard`, or `detailed` | `standard` |
| `--only-tools` | Show only assistant messages with tool calls | false |
| `--only-subagents` | Show only subagent interactions | false |
| `--no-system` | Strip all system messages | true |
| `--include-usage` | Include token usage statistics | false |
| `--help`, `-h` | Show help message | - |

### Output Format

#### Markdown (Default)

```markdown
# Session Analysis: 9e913579

**Date:** 2025-10-12
**Branch:** main
**Duration:** 5m 23s
**Working Directory:** /home/user/project
**Version:** 2.0.14

## Timeline

**[00:00:15] USER:** Create a new feature...

**[00:00:20] ASSISTANT:** I'll help you create that feature.
- Tool: **Read**(file_path="/path/to/file")
- Tool: **Write**(file_path="/path/to/file", content="...")

## Summary

**Total Events:** 25 (filtered to 12)

**Tools Used:**
- Read: 3
- Write: 2
- Edit: 1

**Subagents:**
- @backend-architect: 1

**Files Modified:** 3
**Errors:** 0
**Warnings:** 0
**Duration:** 5m 23s
```

#### JSON

```json
{
  "session": {
    "id": "9e913579",
    "fullId": "9e913579-20c2-4e5c-a3c2-48a686f5f74a",
    "date": "2025-10-12",
    "branch": "main",
    "duration": "5m 23s",
    ...
  },
  "timeline": [
    {
      "time": "00:00:15",
      "type": "user",
      "content": "Create a new feature...",
      "wordCount": 42
    },
    ...
  ],
  "summary": {
    "toolsUsed": { "Read": 3, "Write": 2 },
    "subagentsUsed": { "backend-architect": 1 },
    "filesModified": 3,
    "errors": 0,
    "warnings": 0,
    "totalEvents": 25,
    "filteredEvents": 12
  }
}
```

### Filtering Rules

**Always filtered (cannot be disabled):**
- Events with `isMeta: true`
- Hook notifications (`type: "system"`, `subtype: "informational"`)
- Command clear messages (`<command-name>/clear</command-name>`)
- Empty stdout messages (`<local-command-stdout></local-command-stdout>`)

**Optionally filtered:**
- System messages (with `--no-system` flag, enabled by default)
- Assistant messages without tools (with `--only-tools` flag)
- Non-subagent user messages (with `--only-subagents` flag)

### Examples

**Example 1: Quick session summary**
```bash
node .claude/scripts/condense-transcript.js \
  ~/.claude/logs/20251012/transcript_abc123.json \
  --verbosity=minimal
```

**Example 2: Analyze tool usage**
```bash
node .claude/scripts/condense-transcript.js \
  ~/.claude/logs/20251012/transcript_abc123.json \
  --only-tools \
  --output=tools-report.md
```

**Example 3: Batch process all transcripts from today**
```bash
node .claude/scripts/condense-transcript.js \
  ~/.claude/logs/20251012/ \
  --output-dir=~/analysis/20251012/ \
  --verbosity=standard
```

**Example 4: Generate JSON for automated analysis**
```bash
node .claude/scripts/condense-transcript.js \
  ~/.claude/logs/20251012/transcript_abc123.json \
  --format=json \
  --output=session-data.json
```

### Verbosity Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `minimal` | Short summaries, condensed content | Quick overview, high-level analysis |
| `standard` | Balanced detail, truncated long messages | General review, daily summaries |
| `detailed` | Full content, all parameters | Deep analysis, debugging, complete record |

### Exit Codes

- `0` - Success
- `1` - Error (invalid input, file not found, processing failure)

### Requirements

- Node.js 18.0.0 or higher
- No external dependencies

### Performance

- Handles transcripts up to 5MB efficiently
- Typical processing time: 100-500ms per transcript
- Batch processing: ~2-3 seconds for 10-20 transcripts

### Troubleshooting

**Error: "File not found"**
- Verify the transcript file path is correct
- Use absolute paths or ensure working directory is correct

**Error: "Invalid JSON"**
- Transcript file may be corrupted
- Verify file is a valid Claude Code transcript

**Error: "Batch processing requires --output-dir"**
- When processing a directory, you must specify `--output-dir`

### Development

The script is modular and exports key functions for testing:
- `parseArguments(args)` - Parse CLI arguments
- `loadTranscript(filePath)` - Load and validate JSON
- `filterEvents(events, options)` - Apply filtering rules
- `extractTimeline(events, options)` - Build timeline
- `generateSummary(timeline, events)` - Generate statistics
- `formatMarkdown(...)` - Format as Markdown
- `formatJSON(...)` - Format as JSON

### License

Part of the Claude Code Config Manager project.

---

## analyze-session.js

**Status:** ⚠️ Migrated to skill at `.claude/skills/session-analyzer/`

**Purpose:** Analyzes Claude Code session transcripts to identify workflow improvements, inefficiencies, and optimization opportunities.

**Development Status:** 🚧 In Development - Core session discovery complete, analysis logic pending

### Usage

```bash
# List all available session dates
node analyze-session.js

# List sessions for a specific date
node analyze-session.js YYYYMMDD

# Analyze a specific session
node analyze-session.js YYYYMMDD sessionId

# Show help
node analyze-session.js --help
```

### Examples

```bash
# List all available sessions
node .claude/scripts/analyze-session.js

# Show all sessions from October 12, 2025
node .claude/scripts/analyze-session.js 20251012

# Analyze session c6d23edd from October 12
node .claude/scripts/analyze-session.js 20251012 c6d23edd
```

### Features

#### Implemented ✅
- Auto-discovery of session logs from `.claude/logs/`
- Date validation and formatting
- Session grouping (main + subagent transcripts)
- Timeline display with start times
- Colored terminal output

#### Planned 🚧
- Transcript parsing and correlation
- Workflow analysis (task decomposition, handoffs, bottlenecks)
- Metrics extraction (duration, success rate, tool usage)
- Subagent orchestration evaluation
- Code quality assessment
- Recommendation generation
- Report export (markdown format)

### Integration with Slash Command

This script is designed to work in tandem with the `/analyze-workflow` slash command:
- **Slash command:** High-level workflow, delegates to workflow-analyzer subagent
- **Node script:** Standalone CLI tool for quick session discovery and analysis

### Sample Output

```
Available Claude Code session logs:

  1. October 12, 2025 (20251012)
  2. October 11, 2025 (20251011)
  3. October 7, 2025 (20251007)

Run with date to analyze:
  node analyze-session.js 20251012
```

```
Sessions for October 12, 2025:

  1. Session c6d23edd
     Time: 22:07:56
     Main: transcript_c6d23edd_20251012_220756.json
     Subagents: 13

  2. Session cc0f0c9f
     Time: 16:13:57
     Main: transcript_cc0f0c9f_20251012_161357.json
     Subagents: 22

Run with session ID to analyze:
  node analyze-session.js 20251012 c6d23edd
```

### Requirements

- Node.js 18.0.0 or higher
- No external dependencies (uses built-in modules only)

### Next Steps

1. Implement transcript parsing logic (JSON structure analysis)
2. Build correlation engine (link subagent transcripts to main session)
3. Add workflow analysis (task patterns, efficiency metrics)
4. Generate actionable recommendations
