# MCP Server Configuration Specification

## Overview

MCP (Model Context Protocol) servers are JSON configurations that connect Claude Code to external tools and services. They can use different transport mechanisms.

## Storage

| Location | Scope | Description |
|----------|-------|-------------|
| `.mcp.json` | Project | Project-level MCP servers |
| `.claude/settings.json` → `mcpServers` | Project | Alternative project location |
| `.claude/settings.local.json` → `mcpServers` | Project-local | Machine-specific |
| `~/.claude/settings.json` → `mcpServers` | User | Personal configuration |

## CRUD Operations

| Operation | Supported | Notes |
|-----------|-----------|-------|
| Create | ✅ Yes | Add new MCP server |
| Read | ✅ Yes | Already implemented |
| Update | ✅ Yes | Edit all properties |
| Delete | ✅ Yes | Remove from JSON |

## Complete Property Schema

| Property | Type | Field Component | Required | Default | Description |
|----------|------|-----------------|----------|---------|-------------|
| name | string | InputText | **Yes** | - | Server identifier (JSON key) |
| type | enum | **SelectButton** | **Yes** | stdio | stdio / http / sse |
| command | string | InputText | Conditional | - | Executable path (stdio only) |
| args | array | Chips input | No | [] | Command arguments |
| env | object | Key-value editor | No | {} | Environment variables |
| url | string | InputText | Conditional | - | Server URL (http/sse only) |
| headers | object | Key-value editor | No | {} | HTTP headers |
| enabled | boolean | **SelectButton** | No | true | Enabled / Disabled |
| timeout | number | InputNumber | No | 30 | Seconds before timeout |
| retries | number | InputNumber | No | 3 | Retry attempts on failure |

## Field Details

### name
- **Required:** Yes
- **Validation:** lowercase, letters, numbers, hyphens, underscores
- **Purpose:** JSON key in `mcpServers` object
- **Uniqueness:** Must be unique within scope

### type (Transport)
- **Required:** Yes
- **Options:**
  ```javascript
  [
    { label: 'stdio', value: 'stdio' },
    { label: 'http', value: 'http' },
    { label: 'sse', value: 'sse' }
  ]
  ```
- **UI:** SelectButton (3 options)
- **Behavior:** Changes which fields are shown/required

### command (stdio only)
- **Required:** Yes (when type = stdio)
- **Format:** Absolute path to executable or command name
- **Examples:** `/usr/local/bin/mcp-server`, `npx`, `python`
- **UI:** InputText

### args (stdio only)
- **Format:** Array of strings
- **Examples:** `["-y", "@modelcontextprotocol/server-filesystem"]`
- **UI:** Chips input (add/remove arguments)

### env (stdio only)
- **Format:** Key-value object
- **Supports:** Environment variable expansion: `${VAR}`, `${VAR:-default}`
- **Examples:** `{ "DEBUG": "true", "PATH": "${HOME}/bin:${PATH}" }`
- **UI:** Key-value editor with dynamic rows

### url (http/sse only)
- **Required:** Yes (when type = http or sse)
- **Format:** Valid HTTP/HTTPS URL
- **Examples:** `https://mcp-server.example.com`
- **UI:** InputText with URL validation

### headers (http/sse only)
- **Format:** Key-value object
- **Supports:** Environment variable expansion
- **Examples:** `{ "Authorization": "Bearer ${MCP_TOKEN}" }`
- **UI:** Key-value editor with dynamic rows

### enabled
- **Options:**
  ```javascript
  [
    { label: 'Enabled', value: true },
    { label: 'Disabled', value: false }
  ]
  ```
- **UI:** SelectButton (binary)

### timeout
- **Format:** Positive integer (seconds)
- **Default:** 30
- **UI:** InputNumber with min=1

### retries
- **Format:** Non-negative integer
- **Default:** 3
- **UI:** InputNumber with min=0

## Conditional Field Visibility

| Transport | command | args | env | url | headers |
|-----------|---------|------|-----|-----|---------|
| stdio | ✅ Required | ✅ Show | ✅ Show | ❌ Hide | ❌ Hide |
| http | ❌ Hide | ❌ Hide | ❌ Hide | ✅ Required | ✅ Show |
| sse | ❌ Hide | ❌ Hide | ❌ Hide | ✅ Required | ✅ Show |

## JSON Structure

### stdio Transport
```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "DEBUG": "true"
      },
      "enabled": true,
      "timeout": 30
    }
  }
}
```

### http Transport
```json
{
  "mcpServers": {
    "weather-api": {
      "type": "http",
      "url": "https://mcp-weather.example.com",
      "headers": {
        "Authorization": "Bearer ${WEATHER_API_KEY}"
      },
      "enabled": true,
      "timeout": 30,
      "retries": 3
    }
  }
}
```

## Create Modal

When creating a new MCP server:
1. Enter server name (required)
2. Select transport type (required)
3. Show/hide conditional fields based on transport
4. Enter required fields for selected transport
5. Optional: configure timeout, retries, enabled state

## Delete Confirmation

MCP servers may be referenced by:
1. Tool permissions in settings (`allow`, `ask`, `deny` arrays)
2. Subagent `tools` fields (as `mcp__servername__*`)

Check for references before deletion.

## Backend Considerations

### Create Operation
1. Read existing .mcp.json or settings.json
2. Add new server to `mcpServers` object
3. Validate required fields based on transport type
4. Atomic write using temp file + rename pattern

### Update Operation
1. Read existing config file
2. Find server by name
3. Update properties
4. Handle name change (remove old key, add new)
5. Atomic write

### Delete Operation
1. Read existing config file
2. Check for references in permissions
3. Return warnings if references found
4. Remove server from `mcpServers` object
5. Atomic write

## Environment Variable Expansion

The following patterns are supported in `env`, `command`, `args`, and `headers`:

| Pattern | Description | Example |
|---------|-------------|---------|
| `${VAR}` | Expand variable | `${HOME}` → `/home/user` |
| `${VAR:-default}` | Default if unset | `${PORT:-8080}` → `8080` |

**Note:** Expansion happens at runtime, not in UI. UI shows literal strings.
