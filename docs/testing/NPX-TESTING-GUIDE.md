# NPX Package Testing Guide

**Purpose:** Validate the `npx claude-code-config-manager` execution flow before publishing to NPM.

**Last Updated:** October 31, 2025
**Phase:** 2.2 - Production Readiness

---

## Overview

This package is designed to be executed via NPX, allowing users to run the Claude Code Config Manager without installing it globally. The CLI (`bin/cli.js`) handles server startup, port detection, and instance management.

## NPX Execution Flow

```
User runs: npx claude-code-config-manager
    ↓
NPM downloads package (or uses cache)
    ↓
NPM executes bin/cli.js (shebang: #!/usr/bin/env node)
    ↓
CLI checks for existing instance (ports 8420-8430)
    ├─ Found → Display URL and exit
    └─ Not found → Start server
        ↓
    Find available port (8420 default, fallback to 8421-8430)
        ↓
    Spawn server.js with PORT environment variable
        ↓
    Server builds frontend (Vite) and starts API (Express)
        ↓
    User accesses http://localhost:8420
```

---

## Pre-Publishing Test Checklist

### 1. Direct CLI Execution

Test the entry point directly:

```bash
# From project root
node bin/cli.js
```

**Expected:**
- ✓ Server starts on port 8420
- ✓ Console shows "🚀 Starting Claude Code Config Manager..."
- ✓ URL displayed: "http://localhost:8420"
- ✓ Process runs until Ctrl+C

**Verify:**
```bash
curl http://localhost:8420/api/health
# Should return: {"success":true,"status":"ok",...}
```

### 2. Build Verification

Ensure production build works:

```bash
npm run build
```

**Expected:**
- ✓ Build completes in < 5 seconds
- ✓ `dist/` directory created with:
  - `index.html`
  - `assets/*.css`
  - `assets/*.js`
  - `assets/primeicons-*` (fonts)
- ✓ Bundle size < 500KB (gzipped)
- ✓ No build warnings or errors

**Check bundle size:**
```bash
ls -lh dist/assets/*.js | awk '{print $5, $9}'
```

### 3. Package Files Inclusion

Verify correct files will be published:

```bash
npm pack --dry-run
```

**Expected files:**
```
bin/cli.js
src/backend/**/*
src/components/**/*
src/api/**/*
src/router/**/*
src/stores/**/*
src/styles/**/*
src/main.js
src/App.vue
README.md
LICENSE
package.json
```

**Should NOT include:**
```
tests/
docs/
.claude/
node_modules/
dist/ (built by user's npm)
```

### 4. npm link Testing

Simulate global installation:

```bash
# From project root
npm link

# Verify global command
which claude-code-config-manager
# Should show path in global node_modules

# Test execution
claude-code-config-manager
```

**Expected:**
- ✓ Command available globally
- ✓ Server starts on port 8420
- ✓ Duplicate instance detection works

**Cleanup:**
```bash
npm unlink -g claude-code-config-manager
```

### 5. Port Fallback Testing

Test alternate port selection:

```bash
# Terminal 1: Start on default port
node bin/cli.js

# Terminal 2: Try to start another (should fallback)
PORT=8421 node src/backend/server.js
```

**Expected:**
- ✓ First instance uses 8420
- ✓ Second instance uses 8421
- ✓ CLI detects first instance and exits with message

### 6. Instance Detection Testing

```bash
# Start server
node bin/cli.js &

# Try to start again
node bin/cli.js
```

**Expected output:**
```
✅ An instance is already running!
📍 Open in browser: http://localhost:8420
```

### 7. Frontend Accessibility

With server running:

```bash
# Test static file serving
curl -I http://localhost:8420/ | head -1
# Should return: HTTP/1.1 200 OK

# Test frontend loads
curl -s http://localhost:8420/ | grep "<title>"
# Should return: <title>Claude Code Config Manager</title>
```

### 8. API Endpoints

```bash
# Health check
curl -s http://localhost:8420/api/health | jq .

# Projects endpoint
curl -s http://localhost:8420/api/projects | jq .

# User endpoints
curl -s http://localhost:8420/api/user/agents | jq .
curl -s http://localhost:8420/api/user/commands | jq .
```

**All should return valid JSON without errors.**

### 9. Cross-Platform Testing

Test on all supported platforms:

- [ ] **Linux** (Ubuntu 20.04+)
- [ ] **macOS** (Monterey+)
- [ ] **Windows** (WSL2 recommended)

**For each platform:**
```bash
npm link
claude-code-config-manager
# Verify server starts and is accessible
```

### 10. Node Version Testing

Test with supported Node versions (package.json: `>=18.0.0`):

```bash
# Using nvm
nvm use 18
npm link && claude-code-config-manager

nvm use 20
npm link && claude-code-config-manager

nvm use 22
npm link && claude-code-config-manager
```

---

## Automated Test Script

Use the provided test script for comprehensive validation:

```bash
./test-npx-execution.sh
```

**Tests included:**
1. ✓ Direct CLI execution
2. ✓ Health endpoint response
3. ✓ Duplicate instance detection
4. ✓ Port fallback mechanism
5. ✓ Frontend static files
6. ✓ API endpoints accessibility
7. ✓ npm link workflow

---

## Common Issues & Solutions

### Issue: "Port 8420 already in use"

**Solution:** CLI should automatically use next available port (8421-8430).

**Verify:**
```bash
lsof -i :8420
# Kill process if needed
kill -9 <PID>
```

### Issue: "Cannot find module 'X'"

**Cause:** Missing dependency or incorrect package.json "files" field.

**Solution:**
```bash
# Check dependencies
npm install

# Verify files field includes required directories
npm pack --dry-run
```

### Issue: CLI starts but frontend doesn't load

**Cause:** Vite build not triggered or CORS issues.

**Solution:**
```bash
# Rebuild frontend
npm run build

# Check server logs for Vite errors
node bin/cli.js 2>&1 | grep -i error
```

### Issue: npm link fails

**Cause:** Permission issues or existing global package.

**Solution:**
```bash
# Remove existing link
npm unlink -g claude-code-config-manager

# Try with sudo (macOS/Linux)
sudo npm link

# Or use prefix (recommended)
npm config set prefix ~/.npm-global
npm link
```

---

## Pre-Publish Checklist

Before running `npm publish`:

- [ ] All automated tests pass (`./test-npx-execution.sh`)
- [ ] Build completes without errors (`npm run build`)
- [ ] Package files verified (`npm pack --dry-run`)
- [ ] npm link test successful
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] README.md reflects current features
- [ ] No .env or sensitive files in package
- [ ] LICENSE file included
- [ ] Repository URL correct in package.json

---

## Testing After Publication

Once published to NPM:

```bash
# Test from clean directory
cd /tmp
npx claude-code-config-manager@latest

# Verify installation
npm info claude-code-config-manager

# Check package contents
npm pack claude-code-config-manager
tar -tzf claude-code-config-manager-*.tgz | less
```

---

## Manual Testing Checklist

When server is running:

1. **Dashboard**
   - [ ] Projects load correctly
   - [ ] User card appears
   - [ ] Clicking project navigates to detail view
   - [ ] Theme toggle works

2. **Project Detail**
   - [ ] All configuration cards display
   - [ ] Sidebar opens when clicking items
   - [ ] Breadcrumb navigation works
   - [ ] Back to dashboard works

3. **User View**
   - [ ] User configurations load
   - [ ] Sidebar functionality works
   - [ ] All sections accessible

4. **Error Handling**
   - [ ] Invalid project ID shows error
   - [ ] Network errors display properly
   - [ ] Loading states appear correctly

---

## Performance Benchmarks

**Startup Time:**
- CLI initialization: < 1 second
- Server ready: < 3 seconds
- Frontend first paint: < 2 seconds

**Bundle Sizes:**
- Total JS (gzipped): < 100 KB
- Total CSS (gzipped): < 15 KB
- Fonts: ~600 KB (PrimeIcons, cached)

**API Response Times:**
- Health check: < 10ms
- Projects list: < 100ms
- Configuration fetch: < 50ms

---

## Related Documentation

- [Setup Guide](../guides/SETUP-GUIDE.md) - Installation and configuration
- [Testing Guide](../guides/TESTING-GUIDE.md) - Full test suite documentation
- [Development Strategies](../guides/DEVELOPMENT-STRATEGIES.md) - Development workflows

---

**Last Review:** October 31, 2025
**Reviewed By:** Documentation Engineer
**Status:** ✅ Complete - Ready for production testing
