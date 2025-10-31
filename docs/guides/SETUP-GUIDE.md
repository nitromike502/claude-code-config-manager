# Setup Guide

Welcome to the Claude Code Manager! This guide will help you get the application up and running on your local machine.

## Overview

Claude Code Manager is a web-based tool for managing Claude Code projects, subagents, slash commands, hooks, and MCP servers. It provides a centralized interface to view and manage configurations across all your Claude Code projects.

**Access:** Local web server at `http://localhost:5173` (development) or `http://localhost:8420` (production)

## Prerequisites

Before installing, ensure you have the following:

- **Node.js 18.0.0 or higher** - [Download from nodejs.org](https://nodejs.org/)
- **npm** - Comes with Node.js installation
- **Claude Code** - Installed and configured with at least one project in `~/.claude.json`

To verify your Node.js version:
```bash
node --version  # Should output v18.0.0 or higher
npm --version   # Should output npm version
```

## Installation

Follow these steps to install the Claude Code Manager:

```bash
# Clone the repository
git clone <repository-url>
cd manager

# Install dependencies
npm install

# Setup Git hooks (enforces feature branch workflow)
./scripts/setup-git-hooks.sh

# Start the server
npm start
```

The installation process will:
1. Install all required Node.js dependencies
2. Configure Git hooks for the feature branch workflow
3. Start the backend server on port 8420

## Usage

### Development Mode (Recommended)

For active development with Hot Module Replacement (HMR), run both the frontend and backend servers in separate terminals:

**Terminal 1 - Frontend (Vite dev server):**
```bash
npm run dev
```
Opens http://localhost:5173 with HMR enabled (< 1s reload on file changes)

**Terminal 2 - Backend (Express server):**
```bash
npm run dev:backend
```
Runs on http://localhost:8420 (API endpoints)

**Benefits of Development Mode:**
- Instant feedback on code changes (< 1 second reload)
- Source maps for easier debugging
- Detailed error messages
- Vue DevTools support

### Production Mode

To build and serve the optimized production bundle:

```bash
npm run build    # Build frontend to dist/
npm start        # Start backend server (serves frontend from dist/)
```
Opens http://localhost:8420

**Production mode features:**
- Optimized bundle size (< 500KB gzipped)
- Minified code for faster loading
- Single server process (serves both frontend and API)

### First Launch

The application will automatically:
1. Read your Claude Code projects from `~/.claude.json`
2. Display all discovered projects in the dashboard
3. Allow you to view agents, commands, hooks, and MCP servers for each project

If you don't see any projects:
- Verify Claude Code is installed and configured
- Check that `~/.claude.json` exists and contains valid project paths
- Use the "Rescan Projects" button in the dashboard to refresh

## Server Restart Protocol

When code changes don't appear to take effect in tests or browser, the server may be running stale code. Follow this protocol to prevent wasting time debugging correct code:

### Quick Restart

```bash
npm run server:restart
```

This performs a force restart:
- Kills any existing server process on port 8420
- Waits 2 seconds for cleanup
- Starts a fresh server instance
- Shows PID transition (OLD_PID → NEW_PID)

### Debugging Protocol

If code changes show old behavior in tests/browser:

1. **Kill and restart:** `npm run server:restart`
2. **Wait 2 seconds** for full startup
3. **Test again** with browser cache cleared (Ctrl+Shift+R or Cmd+Shift+R)
4. **Only then** add debug logging if still failing

This prevents 20+ min debugging sessions on code that's actually correct but running on a stale server instance.

### Alternative Commands

```bash
# Check server status and start if needed (default mode)
npm run server:check
./scripts/ensure-server-running.sh

# Force restart (kills and restarts)
npm run server:restart
./scripts/ensure-server-running.sh --restart
```

## Common Issues

### Port Already in Use

If you see an error about port 8420 or 5173 being in use:

```bash
# Kill the process using the port
npm run server:restart
```

### No Projects Found

If the dashboard shows no projects:

1. Verify `~/.claude.json` exists: `cat ~/.claude.json`
2. Check that it contains valid project paths
3. Ensure Claude Code is properly configured
4. Click "Rescan Projects" in the dashboard

### Module Not Found Errors

If you see module import errors:

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- **Read the main documentation:** `CLAUDE.md`
- **Explore the codebase:** See project structure in main README
- **Review testing documentation:** `docs/testing/`
- **Learn the Git workflow:** See Git Workflow section in CLAUDE.md
- **Check out subagent architecture:** `.claude/agents/` directory

## Getting Help

- **Documentation:** All docs are in `docs/`
- **Session Summaries:** See `docs/sessions/` for development history
- **Issue Tracking:** Check `docs/tickets/` for known issues

Welcome aboard!
