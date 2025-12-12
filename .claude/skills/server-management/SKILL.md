---
name: server-management
description: Manages the Claude Code Config Manager development servers (backend on port 8420, frontend on port 5173). Claude and subagents should use this skill before running tests, after modifying backend code, or when server issues occur. Triggers on server operations, test preparation, backend restarts, health checks, or when encountering connection errors to localhost:8420.
---

# Server Management Skill

Provides reliable server management for Claude and subagents working on the Claude Code Config Manager. These scripts ensure the development environment is properly configured before running tests or making API calls.

## When to Use This Skill

Claude and subagents should invoke this skill:
- **Before running tests** - Verify backend is available before Jest or Playwright tests
- **After modifying backend code** - Restart to pick up changes to routes, services, or parsers
- **When tests fail with connection errors** - Server may have crashed or not started
- **At session start** - Ensure development environment is ready
- **When encountering "ECONNREFUSED" errors** - Server likely needs to be started

## Server Configuration

| Server | Port | Health Endpoint | Log Location |
|--------|------|-----------------|--------------|
| Backend (Express) | 8420 | `/api/health` | `.claude/logs/server.log` |
| Frontend (Vite) | 5173 | N/A | Console |

## Available Scripts

All scripts are located in `.claude/skills/server-management/scripts/` relative to the project root.

### 1. Check Server Status (`check-server-status.sh`)

**Purpose:** Read-only diagnostic - check if servers are running and healthy without making changes.

**Usage:**
```bash
# Check all servers (minimal output)
bash .claude/skills/server-management/scripts/check-server-status.sh

# Detailed status report
bash .claude/skills/server-management/scripts/check-server-status.sh --verbose

# Check backend only (most common for subagents)
bash .claude/skills/server-management/scripts/check-server-status.sh --backend

# JSON output for programmatic checks
bash .claude/skills/server-management/scripts/check-server-status.sh --json
```

**Exit Codes:**
- `0` - All checked servers are running and healthy
- `1` - One or more servers are not running or unhealthy

**Subagent Usage:** Run this before executing test suites to verify the backend is available.

---

### 2. Ensure Server Running (`ensure-server-running.sh`)

**Purpose:** Start the backend server if it's not already running. Non-destructive - won't restart a healthy server.

**Usage:**
```bash
# Check and start if needed (recommended for subagents)
bash .claude/skills/server-management/scripts/ensure-server-running.sh

# Force restart (kill existing and start fresh)
bash .claude/skills/server-management/scripts/ensure-server-running.sh --restart
```

**Exit Codes:**
- `0` - Server is running (was already running or started successfully)
- `1` - Server failed to start

**Subagent Usage:** This is the **recommended script for subagents** - it's safe to call repeatedly and only starts the server when needed.

---

### 3. Restart Backend (`restart-backend.sh`)

**Purpose:** Force restart the backend server - kills existing process and starts fresh.

**Usage:**
```bash
# Standard restart with health verification
bash .claude/skills/server-management/scripts/restart-backend.sh

# Verbose mode for debugging
bash .claude/skills/server-management/scripts/restart-backend.sh --verbose

# Quick restart (skip health check verification)
bash .claude/skills/server-management/scripts/restart-backend.sh --quick

# Force kill unresponsive server (SIGKILL)
bash .claude/skills/server-management/scripts/restart-backend.sh --force
```

**Exit Codes:**
- `0` - Server restarted successfully
- `1` - Server failed to restart

**Subagent Usage:** Use after modifying backend code (routes, services, parsers) to pick up changes.

---

### 4. Kill Servers (`kill-servers.sh`)

**Purpose:** Stop development servers without restarting them.

**Usage:**
```bash
# Kill all servers
bash .claude/skills/server-management/scripts/kill-servers.sh

# Kill backend only
bash .claude/skills/server-management/scripts/kill-servers.sh --backend

# Force kill unresponsive processes
bash .claude/skills/server-management/scripts/kill-servers.sh --force

# Dry run - show what would be killed
bash .claude/skills/server-management/scripts/kill-servers.sh --dry-run --verbose
```

**Exit Codes:**
- `0` - All target servers stopped (or none were running)
- `1` - Failed to stop one or more servers

**Subagent Usage:** Rarely needed - use when freeing ports or cleaning up before switching contexts.

## Common Workflows for Claude/Subagents

### Before Running Tests (Most Common)
```bash
# Ensure backend is available, then run tests
bash .claude/skills/server-management/scripts/ensure-server-running.sh && npm test
```

### After Backend Code Changes
```bash
# Restart to pick up code changes
bash .claude/skills/server-management/scripts/restart-backend.sh
```

### Debugging Test Failures
```bash
# First, check if server is the issue
bash .claude/skills/server-management/scripts/check-server-status.sh --verbose

# If unhealthy or stopped, restart with force
bash .claude/skills/server-management/scripts/restart-backend.sh --force --verbose
```

### Quick Health Check Before API Calls
```bash
# Verify backend responds before making API requests
bash .claude/skills/server-management/scripts/check-server-status.sh --backend && curl http://localhost:8420/api/projects
```

## Guidelines for Claude and Subagents

1. **Always verify server before tests** - Run `ensure-server-running.sh` before `npm test` or Playwright tests
2. **Restart after backend changes** - Modified `src/backend/` files? Run `restart-backend.sh`
3. **Use verbose for debugging** - Add `--verbose` when troubleshooting to see detailed progress
4. **Check exit codes** - Chain commands with `&&` to stop on failure
5. **Prefer ensure over restart** - `ensure-server-running.sh` is safer for repeated calls
6. **Allow startup time** - Backend needs ~5 seconds to fully initialize after restart

## Error Recovery

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "ECONNREFUSED localhost:8420" | Server not running | `ensure-server-running.sh` |
| "Server failed to start" | Code error or port conflict | Check `.claude/logs/server.log` |
| "Port already in use" | Zombie process | `kill-servers.sh --force` then restart |
| "Health check failed" | Server crashed during startup | Check log file for stack trace |
| Tests timeout waiting for server | Slow startup | Increase wait or check server health first |

## Related Resources

- **Server log:** `.claude/logs/server.log`
- **Backend entry point:** `src/backend/server.js`
- **Health endpoint:** `http://localhost:8420/api/health`
- **API base URL:** `http://localhost:8420/api`
