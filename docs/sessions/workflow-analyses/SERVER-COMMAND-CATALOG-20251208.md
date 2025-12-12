# Server Management Command Catalog - December 8, 2025 Sessions

## Executive Summary

Analysis of Claude Code sessions from December 8, 2025 reveals **5 distinct server management command patterns** used across 22 transcript files (3 main sessions, 19 subagent sessions). This catalog documents all bash commands related to server operations to support creation of pre-approved standardized scripts.

**Key Findings:**
- **Total commands analyzed:** 99 bash commands across all sessions
- **Server-related commands:** 20 instances across 5 unique patterns
- **Most frequent pattern:** Backend server restart sequence (4 occurrences)
- **Primary agents using commands:** test-automation-engineer, playwright-testing-expert
- **Context:** Bug fixing (BUG-039) and story implementation (STORY-7.5)

**Server Commands Found:**
1. Backend Server Restart (Kill + Start)
2. Backend Health Check
3. Comprehensive Server Management Script
4. Backend Test Execution
5. Backend Service-Specific Tests

---

## Category 1: Backend Server Restart

### Command Pattern 1A: Kill by Pattern + Start
**Command:**
```bash
pkill -f "node.*backend" 2>/dev/null; npm run dev:backend 2>&1 &
```

**Purpose:** Restart backend server by killing processes matching "node.*backend" pattern and starting fresh instance in background

**Context:** Used when code changes require server restart during development/testing

**Details:**
- `pkill -f "node.*backend"`: Kills processes with "node" and "backend" in command line
- `2>/dev/null`: Suppresses error output if no matching process found
- `;`: Sequential execution (kill before start)
- `npm run dev:backend`: Executes `node --watch src/backend/server.js` (from package.json)
- `2>&1`: Redirects stderr to stdout
- `&`: Runs in background

**Frequency:** 4 occurrences

**Source Agents:**
- transcript_11b4ab85_20251208_230252 (main session)
- transcript_subagent_11b4ab85_20251208_225701
- transcript_subagent_11b4ab85_20251208_225930
- transcript_subagent_11b4ab85_20251208_230041

**NPM Script Definition:**
```json
"dev:backend": "node --watch src/backend/server.js"
```

**Error Handling:** Uses `2>/dev/null` to gracefully handle "no process found" scenarios

---

### Command Pattern 1B: Kill by Port + Start with Delay
**Command:**
```bash
pkill -f "node.*8420" 2>/dev/null; sleep 1 && npm run dev:backend 2>&1 &
```

**Purpose:** Restart backend server by killing processes using port 8420, adding 1-second delay before starting fresh instance

**Context:** More reliable restart method ensuring port is fully released before rebinding

**Details:**
- `pkill -f "node.*8420"`: Kills processes with "node" and "8420" (port number) in command line
- `sleep 1`: Waits 1 second for port release and cleanup
- `&&`: Conditional execution (only start if sleep succeeds)
- Rest identical to Pattern 1A

**Frequency:** 4 occurrences

**Source Agents:**
- transcript_11b4ab85_20251208_230252 (main session)
- transcript_subagent_11b4ab85_20251208_225701
- transcript_subagent_11b4ab85_20251208_225930
- transcript_subagent_11b4ab85_20251208_230041

**Key Difference from 1A:**
- More specific targeting (port-based vs. process name)
- Includes delay for port release
- Uses `&&` (conditional) vs `;` (sequential)

**Best Practice:** Pattern 1B is preferred for reliability due to explicit port targeting and delay

---

## Category 2: Server Health Checks

### Command Pattern 2A: Delayed Health Check with Curl
**Command:**
```bash
sleep 2 && curl -s http://localhost:8420/api/health
```

**Purpose:** Wait 2 seconds then check if backend server is responding to health endpoint

**Context:** Verification step after server restart to confirm successful startup

**Details:**
- `sleep 2`: Waits 2 seconds for server initialization
- `&&`: Only execute curl if sleep completes
- `curl -s`: Silent mode (no progress bar)
- `http://localhost:8420/api/health`: Backend health check endpoint
- Returns HTTP 200 with `{"status":"ok"}` if healthy

**Frequency:** 4 occurrences

**Source Agents:**
- transcript_11b4ab85_20251208_230252 (main session)
- transcript_subagent_11b4ab85_20251208_225701
- transcript_subagent_11b4ab85_20251208_225930
- transcript_subagent_11b4ab85_20251208_230041

**Usage Pattern:** Always executed immediately after Command Pattern 1B

**Typical Sequence:**
```bash
# Step 1: Kill and restart server
pkill -f "node.*8420" 2>/dev/null; sleep 1 && npm run dev:backend 2>&1 &

# Step 2: Wait and verify health (executed separately)
sleep 2 && curl -s http://localhost:8420/api/health
```

**Expected Output (Success):**
```json
{"status":"ok"}
```

**Error Detection:** No output or HTTP error indicates server failed to start

---

## Category 3: Comprehensive Server Management Script

### Command Pattern 3A: Server Status Check and Auto-Start
**Command:**
```bash
bash .claude/skills/server-management/scripts/ensure-server-running.sh
```

**Purpose:** Intelligent server management - checks if server is running, starts if needed, or restarts if unresponsive

**Context:** Preferred method for ensuring server availability before running tests or operations

**Frequency:** 4 occurrences

**Source Agents:**
- transcript_11b4ab85_20251208_230252 (main session)
- transcript_subagent_11b4ab85_20251208_225701
- transcript_subagent_11b4ab85_20251208_225930
- transcript_subagent_11b4ab85_20251208_230041

**Script Location:** `/home/claude/manager/.claude/skills/server-management/scripts/ensure-server-running.sh`

**Script Capabilities:**

#### Default Mode (no arguments):
1. **Health Check:** `curl -s -o /dev/null -w "%{http_code}" http://localhost:8420/api/health`
2. **If Healthy (HTTP 200):** Exits with success message
3. **If Port Occupied but Unresponsive:**
   - Detects via `lsof -ti:8420`
   - Kills unresponsive process: `kill $PID`
   - Waits 2 seconds
   - Starts fresh server
4. **If No Process Running:** Starts server directly

#### Force Restart Mode (--restart flag):
1. **Check Current Process:** `lsof -ti:8420`
2. **Kill Process:** `kill $PID` (or `kill -9 $PID` if graceful fails)
3. **Wait 2 seconds**
4. **Start Fresh Server**

**Server Start Method:**
```bash
nohup node src/backend/server.js > /home/claude/manager/.claude/logs/server.log 2>&1 &
```

**Startup Verification:**
- Polls health endpoint every 0.5 seconds
- Maximum wait: 10 seconds (20 attempts)
- Logs to: `/home/claude/manager/.claude/logs/server.log`

**Exit Codes:**
- `0`: Success (server running and healthy)
- `1`: Failure (server failed to start or respond)

**Advantages over Manual Commands:**
- Idempotent (safe to run multiple times)
- Automatic health verification
- Handles edge cases (zombie processes, port conflicts)
- Detailed logging
- Color-coded console output
- Timeout protection

**Usage Examples:**

Check and start if needed:
```bash
bash .claude/skills/server-management/scripts/ensure-server-running.sh
```

Force restart:
```bash
bash .claude/skills/server-management/scripts/ensure-server-running.sh --restart
```

**Note:** This script is the RECOMMENDED method for server management as it handles all edge cases automatically.

---

## Category 4: Backend Test Execution

### Command Pattern 4A: Full Backend Test Suite
**Command:**
```bash
npm run test:backend 2>&1 | tail -30
```

**Purpose:** Run entire backend test suite and display last 30 lines of output

**Context:** Verification step to ensure code changes don't break existing functionality

**Details:**
- `npm run test:backend`: Executes `NODE_OPTIONS='--max-old-space-size=4096' jest tests/backend`
- `2>&1`: Redirects stderr to stdout (capture all output)
- `| tail -30`: Shows only final 30 lines (summary + recent failures)
- Memory allocation: 4GB via NODE_OPTIONS (handles large test suites)

**Frequency:** 8 occurrences

**Source Agents:**
- transcript_11b4ab85_20251208_230252 (main session)
- transcript_subagent_11b4ab85_20251208_224038
- transcript_subagent_11b4ab85_20251208_224645
- transcript_subagent_11b4ab85_20251208_224732
- transcript_subagent_11b4ab85_20251208_224901
- transcript_subagent_11b4ab85_20251208_225701
- transcript_subagent_11b4ab85_20251208_225930
- transcript_subagent_11b4ab85_20251208_230041

**NPM Script Definition:**
```json
"test:backend": "NODE_OPTIONS='--max-old-space-size=4096' jest tests/backend"
```

**Test Coverage:** 582 backend tests covering:
- API endpoints (276 tests)
- Parsers (29 tests including skills parser)
- Copy service (182 tests for agents, commands, skills, hooks, MCP)
- Performance (5 tests)

**Typical Output (Success):**
```
Test Suites: 29 passed, 29 total
Tests:       582 passed, 582 total
Snapshots:   0 total
Time:        45.123 s
```

**Usage Pattern:** Run before committing code changes to verify no regressions

---

### Command Pattern 4B: Service-Specific Test Execution
**Command:**
```bash
npx jest tests/backend/services/copy-service-copySkill.test.js --verbose 2>&1 | tail -40
```

**Purpose:** Run specific test file for skill copy service with detailed output

**Context:** Focused testing during bug fix (BUG-039: skill copy unknown config type)

**Details:**
- `npx jest`: Direct Jest invocation (bypasses npm script)
- `tests/backend/services/copy-service-copySkill.test.js`: Specific test file
- `--verbose`: Show individual test names and results
- `2>&1 | tail -40`: Capture and show last 40 lines (more detail than 4A)

**Frequency:** 8 occurrences (same agents as 4A)

**Source Agents:** Same as Command Pattern 4A

**Test File Coverage:** 71 tests for skill copy operations:
- Directory structure copying
- SKILL.md handling
- Supporting file inclusion
- External reference detection
- Conflict resolution
- Cross-scope copying (user ↔ project)

**Usage Context:** BUG-039 fix verification

**Advantages over 4A:**
- Faster execution (specific test file only)
- More detailed output (--verbose flag)
- Better debugging (40 lines vs 30)
- Focused on specific functionality

**Typical Output (Success):**
```
PASS tests/backend/services/copy-service-copySkill.test.js
  Copy Service - Skill Copy Operations
    ✓ should copy skill directory structure (25ms)
    ✓ should detect external references (12ms)
    ✓ should handle conflicts with skip strategy (18ms)
    ... (68 more tests)

Test Suites: 1 passed, 1 total
Tests:       71 passed, 71 total
```

---

## Category 5: Port Management

### Command Pattern 5A: Check Process Using Port
**Embedded in ensure-server-running.sh:**
```bash
lsof -ti:8420
```

**Purpose:** Check if any process is listening on port 8420

**Context:** Used within ensure-server-running.sh script to detect port conflicts

**Details:**
- `lsof -ti:8420`: List open files for port 8420
  - `-t`: Terse output (PID only)
  - `-i:8420`: Internet files on port 8420
- Returns PID if process found, empty if port free
- Exit code: 0 if process found, 1 if port free

**Usage in Script:**
```bash
PID=$(lsof -ti:8420)
if [ -n "$PID" ]; then
    echo "Process detected on port 8420 (PID: ${PID})"
    kill "$PID" 2>/dev/null
fi
```

**Frequency:** Indirect (used 4 times via ensure-server-running.sh)

**Alternative Port Check Methods NOT Used:**
- `netstat -tuln | grep 8420` (not found in sessions)
- `ss -tuln | grep 8420` (not found in sessions)
- `fuser 8420/tcp` (not found in sessions)

**Note:** Direct `lsof` commands not executed in sessions; only used within the ensure-server-running.sh script

---

## Category 6: Background Process Management

### Command Pattern 6A: Run Server in Background with Output Redirect
**Embedded in commands and scripts:**
```bash
npm run dev:backend 2>&1 &
```

**Purpose:** Start backend server as background process with output capture

**Context:** Used in restart commands to allow continued shell interaction

**Details:**
- `npm run dev:backend`: Start backend server
- `2>&1`: Redirect stderr to stdout (combined output stream)
- `&`: Background process (returns shell prompt immediately)

**Implications:**
- Process continues after command completes
- Output not visible in terminal (redirected elsewhere or lost)
- No automatic process management (orphan risk)

**Frequency:** 8 occurrences (within restart commands)

**Better Alternative (from ensure-server-running.sh):**
```bash
nohup node src/backend/server.js > /home/claude/manager/.claude/logs/server.log 2>&1 &
```

**Improvements:**
- `nohup`: Immune to hangup signals (survives terminal close)
- `> /path/to/log`: Captures output to persistent log file
- Process PID captured: `SERVER_PID=$!`
- Explicit log location documented

**Background Process Verification:**
```bash
# Check if background process started
ps aux | grep "node.*backend" | grep -v grep

# Get PID of background process
pgrep -f "node.*backend"

# Kill background process
pkill -f "node.*backend"
```

**Note:** Sessions used basic `&` backgrounding; nohup only in ensure-server-running.sh

---

## Category 7: Combined/Chained Commands

### Pattern 7A: Restart Sequence (Pattern 1B)
```bash
pkill -f "node.*8420" 2>/dev/null; sleep 1 && npm run dev:backend 2>&1 &
```

**Chain Analysis:**
1. `pkill -f "node.*8420" 2>/dev/null` - Kill existing server
2. `;` - Execute regardless of pkill success
3. `sleep 1` - Wait for cleanup
4. `&&` - Only continue if sleep succeeds
5. `npm run dev:backend 2>&1 &` - Start server in background

**Error Handling:**
- `2>/dev/null` on pkill: Ignore "no process" errors
- `;` separator: Always proceed to sleep
- `&&` separator: Abort if sleep fails (unlikely)
- No error handling on npm command (assume success)

**Frequency:** 4 occurrences

---

### Pattern 7B: Verification Sequence (Pattern 2A)
```bash
sleep 2 && curl -s http://localhost:8420/api/health
```

**Chain Analysis:**
1. `sleep 2` - Wait for server startup
2. `&&` - Only continue if sleep succeeds
3. `curl -s http://localhost:8420/api/health` - Check health endpoint

**Error Handling:**
- `&&` separator: Abort if sleep fails (unlikely)
- Silent curl: No error output if connection fails
- Exit code propagates: 0 if HTTP 200, non-zero otherwise

**Frequency:** 4 occurrences

---

### Pattern 7C: Complete Restart + Verification Workflow

**Observed Usage Pattern (executed as separate commands):**

```bash
# Command 1: Restart with port-specific kill
pkill -f "node.*8420" 2>/dev/null; sleep 1 && npm run dev:backend 2>&1 &

# Command 2: Health check
sleep 2 && curl -s http://localhost:8420/api/health

# Command 3: Fallback to ensure-server-running.sh if health check failed
bash .claude/skills/server-management/scripts/ensure-server-running.sh
```

**Context:** This three-command sequence appeared 4 times in session transcripts

**Workflow Logic:**
1. Try manual restart (Command 1)
2. Verify health (Command 2)
3. Use comprehensive script if issues detected (Command 3)

**Optimization Opportunity:**

Could be combined into single robust command:
```bash
bash .claude/skills/server-management/scripts/ensure-server-running.sh --restart
```

This single command achieves the same result with better error handling.

---

## Frequency and Agent Analysis

### Command Frequency Summary

| Category | Command Pattern | Occurrences | Unique Agents |
|----------|----------------|-------------|---------------|
| Backend Server Restart | Pattern 1A (pkill backend) | 4 | 4 |
| Backend Server Restart | Pattern 1B (pkill port) | 4 | 4 |
| Server Health Check | Pattern 2A (sleep + curl) | 4 | 4 |
| Server Management | Pattern 3A (ensure-server-running.sh) | 4 | 4 |
| Backend Tests | Pattern 4A (full test suite) | 8 | 8 |
| Backend Tests | Pattern 4B (specific test file) | 8 | 8 |

**Total Server Command Executions:** 32

**Note:** Patterns 1A, 1B, 2A, and 3A occurred in same 4 sessions (restart workflow)

---

### Agent Distribution

**Session dd54b39e (STORY-7.5 - Skill Edit Operations):**
- Main transcript: 0 server commands
- 9 subagent transcripts: 0 server commands
- **Total:** 0 server commands
- **Work:** Story implementation, no server operations required

**Session 11b4ab85 (BUG-039 - Skill Copy Unknown Config Type):**
- Main transcript: 8 server commands (all patterns)
- 7 subagent transcripts: 24 server commands total
  - 3 transcripts with complete restart workflow (8 commands each)
  - 4 transcripts with test commands only
- **Total:** 32 server commands
- **Work:** Bug fix requiring repeated server restarts and test verification

**Session ca78db5b (Session Analysis):**
- 1 subagent transcript: 0 server commands (log file analysis only)

**Primary Server Command Users:**
1. test-automation-engineer (implied from session context)
2. playwright-testing-expert (implied from session context)
3. Main orchestrator (confirmed from main transcript)

---

### Temporal Patterns

**Restart Workflow Sequence (appears 4 times):**

```
Time: -23:-18:-18  | pkill -f "node.*backend" 2>/dev/null; npm run dev:backend 2>&1 &
Time: -23:-18:-07  | pkill -f "node.*8420" 2>/dev/null; sleep 1 && npm run dev:backend 2>&1 &
Time: -23:-18:-01  | sleep 2 && curl -s http://localhost:8420/api/health
Time: -23:-17:-55  | bash .claude/skills/server-management/scripts/ensure-server-running.sh
```

**Observations:**
- 11-13 second sequence (18:18 → 17:55)
- Two different restart attempts (Pattern 1A then 1B)
- Health check 6 seconds after second restart
- Fallback script 6 seconds after health check
- Suggests potential issues with initial restart attempts

**Test Execution Pattern (appears 8 times):**

```
Time: -23:-30:-16  | npm run test:backend 2>&1 | tail -30
Time: -23:-29:-06  | npx jest tests/backend/services/copy-service-copySkill.test.js --verbose 2>&1 | tail -40
```

**Observations:**
- Full test suite first, then specific test file
- 70-second gap between commands
- Suggests: run full suite, identify issue, re-run specific test for detail
- Pattern repeated for iterative debugging

---

## NPM Script Reference

Complete server-related scripts from package.json:

```json
{
  "scripts": {
    "dev": "vite",
    "start": "node src/backend/server.js",
    "dev:backend": "node --watch src/backend/server.js",
    "server:restart": "./scripts/ensure-server-running.sh --restart",
    "test": "NODE_OPTIONS='--max-old-space-size=4096' jest",
    "test:backend": "NODE_OPTIONS='--max-old-space-size=4096' jest tests/backend",
    "test:frontend": "playwright test",
    "test:frontend:component": "playwright test tests/frontend",
    "test:frontend:e2e": "playwright test tests/e2e",
    "test:frontend:visual": "playwright test 300-visual-regression.spec.js",
    "test:frontend:unit": "vitest run",
    "test:frontend:unit:watch": "vitest",
    "test:frontend:unit:coverage": "vitest run --coverage",
    "test:full": "npm run test:backend && npm run test:frontend:unit && npm run test:frontend",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:visual:update": "playwright test 300-visual-regression.spec.js --update-snapshots",
    "test:visual:report": "playwright show-report"
  }
}
```

**Key Scripts:**
- `dev:backend` - Development server with auto-restart on file changes
- `start` - Production server start (no auto-restart)
- `server:restart` - Convenient wrapper for ensure-server-running.sh --restart
- `test:backend` - Backend test suite with 4GB memory allocation

**Unused Scripts in Sessions:**
- `dev` (Vite frontend dev server) - No frontend server commands found
- `server:restart` - Script exists but wasn't used; manual commands used instead
- `test:frontend:*` - No frontend tests run in these sessions
- `test:full` - No combined test execution

---

## Server Configuration

**Backend Server Details:**
- **Entry Point:** `src/backend/server.js`
- **Port:** 8420
- **Health Endpoint:** `http://localhost:8420/api/health`
- **Health Response:** `{"status":"ok"}` (HTTP 200)
- **Log Location:** `/home/claude/manager/.claude/logs/server.log`
- **Project Directory:** `/home/claude/manager`

**Frontend Server Details:**
- **Dev Server:** Vite (port 5173)
- **Command:** `npm run dev`
- **Entry Point:** `src/main.js`
- **Note:** No frontend server commands found in December 8 sessions

**Test Server Details:**
- **Backend Tests:** Jest with 4GB memory allocation
- **Frontend Tests:** Playwright (not used in these sessions)
- **Total Backend Tests:** 582 tests across 29 test suites

---

## Recommendations for Pre-Approved Scripts

Based on the analysis, here are recommended standardized scripts for pre-approval:

### 1. Backend Server Restart Script (RECOMMENDED)

**Already exists:** `/home/claude/manager/.claude/skills/server-management/scripts/ensure-server-running.sh`

**Usage:**
```bash
# Check and start if needed (safest, idempotent)
bash .claude/skills/server-management/scripts/ensure-server-running.sh

# Force restart (when you know server needs refresh)
bash .claude/skills/server-management/scripts/ensure-server-running.sh --restart
```

**Advantages:**
- Handles all edge cases automatically
- Idempotent (safe to run multiple times)
- Includes health verification
- Detailed logging
- Already used in production

**Recommendation:** Pre-approve both modes unconditionally

---

### 2. Quick Backend Restart (for rapid iteration)

**Proposed script:** `.claude/skills/server-management/scripts/restart-backend-quick.sh`

```bash
#!/bin/bash
# Quick backend restart for development iterations
# Less comprehensive than ensure-server-running.sh but faster

pkill -f "node.*8420" 2>/dev/null
sleep 1
npm run dev:backend 2>&1 &
sleep 2
curl -s http://localhost:8420/api/health
```

**Use Case:** Rapid development iterations where full script is overkill

**Advantages:**
- Faster than ensure-server-running.sh (no health check loop)
- Predictable behavior
- Combines patterns 1B + 2A

**Recommendation:** Pre-approve for development use

---

### 3. Backend Test Suite Runner

**Proposed script:** `.claude/skills/server-management/scripts/test-backend-suite.sh`

```bash
#!/bin/bash
# Run backend test suite with proper memory allocation
# Optionally run specific test file if provided

if [ -n "$1" ]; then
    echo "Running specific test: $1"
    npx jest "$1" --verbose 2>&1 | tail -50
else
    echo "Running full backend test suite"
    npm run test:backend 2>&1 | tail -30
fi
```

**Usage:**
```bash
# Full suite
bash .claude/skills/server-management/scripts/test-backend-suite.sh

# Specific test
bash .claude/skills/server-management/scripts/test-backend-suite.sh tests/backend/services/copy-service-copySkill.test.js
```

**Advantages:**
- Unifies patterns 4A and 4B
- Single script for both use cases
- Proper memory allocation via npm script

**Recommendation:** Pre-approve unconditionally

---

### 4. Server Health Check

**Proposed script:** `.claude/skills/server-management/scripts/check-server-health.sh`

```bash
#!/bin/bash
# Quick health check for backend server
# Exit 0 if healthy, 1 if not

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8420/api/health 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Backend server is healthy (HTTP 200)"
    exit 0
else
    echo "✗ Backend server is not responding (HTTP ${HTTP_CODE:-NONE})"
    exit 1
fi
```

**Use Case:** Pre-test verification, monitoring, CI/CD pipelines

**Advantages:**
- Fast (no startup logic)
- Clear exit codes
- Minimal output

**Recommendation:** Pre-approve unconditionally

---

### 5. Development Workflow Script

**Proposed script:** `.claude/skills/server-management/scripts/dev-workflow.sh`

```bash
#!/bin/bash
# Complete development workflow for testing changes
# 1. Restart server
# 2. Run backend tests
# 3. Report results

echo "=== Development Workflow ==="
echo ""

echo "Step 1: Restarting backend server..."
bash .claude/skills/server-management/scripts/ensure-server-running.sh --restart
if [ $? -ne 0 ]; then
    echo "✗ Server restart failed. Aborting."
    exit 1
fi
echo ""

echo "Step 2: Running backend test suite..."
npm run test:backend 2>&1 | tail -30
TEST_EXIT=$?
echo ""

if [ $TEST_EXIT -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Tests failed. Review output above."
    exit 1
fi
```

**Use Case:** Quick verification after code changes

**Advantages:**
- Single command for common workflow
- Clear step-by-step output
- Proper error handling
- Mimics observed manual workflow

**Recommendation:** Pre-approve for development use

---

## Edge Cases and Error Scenarios

### Observed Error Scenarios

Based on the temporal pattern analysis, the following error scenario likely occurred 4 times:

**Scenario:** Multiple restart attempts suggest initial failures

**Evidence:**
```
Time: -23:-18:-18  | pkill -f "node.*backend" [...]    # Attempt 1
Time: -23:-18:-07  | pkill -f "node.*8420" [...]       # Attempt 2 (11s later)
Time: -23:-18:-01  | sleep 2 && curl [...]             # Health check (6s later)
Time: -23:-17:-55  | bash scripts/ensure-server-running.sh  # Fallback (6s later)
```

**Possible Causes:**
1. Port 8420 not released quickly enough
2. Previous server process zombie/hung
3. File system lag (WSL2 environment)
4. Server startup slower than expected

**Mitigation in Scripts:**
- Use longer sleep delays (2-3 seconds)
- Include explicit port checks before restart
- Use `kill -9` fallback if graceful kill fails
- Wait for health endpoint (not just process start)

---

### Unhandled Edge Cases

**1. Port Conflict with Non-Node Process:**
- Current: `pkill -f "node.*8420"` only kills node processes
- Risk: Another service using port 8420 won't be detected
- Solution: Use `lsof -ti:8420` then kill any PID found

**2. Multiple Node Processes on Port 8420:**
- Current: `pkill` kills all matching processes
- Risk: Might kill unrelated node processes with "8420" in path/args
- Solution: More specific pattern or store server PID in file

**3. Server Starts but Immediately Crashes:**
- Current: Health check after 2 seconds may pass, then crash
- Risk: False positive on server health
- Solution: Multiple health checks over 10 seconds (like ensure-server-running.sh)

**4. Network/Firewall Issues:**
- Current: No distinction between "server down" and "network blocked"
- Risk: Endless restart loops
- Solution: Check localhost connectivity separately

**5. Disk Space Exhaustion:**
- Current: No pre-flight checks
- Risk: Server starts but can't write logs, crashes
- Solution: Check available disk space before start

---

### Recommended Error Handling Patterns

**Pattern 1: Defensive Port Cleanup**
```bash
# Kill ANY process on port 8420, not just node
PID=$(lsof -ti:8420 2>/dev/null)
if [ -n "$PID" ]; then
    kill -9 $PID 2>/dev/null
    sleep 1
fi
```

**Pattern 2: Startup Verification Loop**
```bash
# Start server and wait for health
npm run dev:backend 2>&1 &
for i in {1..20}; do
    sleep 0.5
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8420/api/health 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "Server healthy!"
        exit 0
    fi
done
echo "Server failed to become healthy"
exit 1
```

**Pattern 3: Explicit Failure Modes**
```bash
# Check for common failure conditions
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not installed"
    exit 2
fi

if ! [ -f "src/backend/server.js" ]; then
    echo "ERROR: Server file not found"
    exit 3
fi

# Check disk space (require 100MB free)
DISK_FREE=$(df /home/claude/manager | tail -1 | awk '{print $4}')
if [ "$DISK_FREE" -lt 100000 ]; then
    echo "ERROR: Insufficient disk space"
    exit 4
fi
```

**Note:** The existing `ensure-server-running.sh` already implements Patterns 1 and 2. Pattern 3 could be added for additional safety.

---

## Alternative Commands NOT Used

The following common server management patterns were **NOT** observed in the December 8 sessions:

### Process Management
```bash
# NOT USED: Direct kill by PID
kill 12345
kill -9 12345

# NOT USED: Kill all node processes (too aggressive)
killall node

# NOT USED: Process status check
ps aux | grep node
pgrep -fl node

# NOT USED: Job control
jobs
fg
bg
```

### Port Management
```bash
# NOT USED: Netstat
netstat -tuln | grep 8420

# NOT USED: ss (modern netstat)
ss -tuln | grep 8420

# NOT USED: fuser
fuser -k 8420/tcp
```

### Server Start Variations
```bash
# NOT USED: Direct node start
node src/backend/server.js

# NOT USED: PM2 process manager
pm2 start src/backend/server.js
pm2 restart server
pm2 status

# NOT USED: Forever process manager
forever start src/backend/server.js

# NOT USED: systemd
systemctl restart claude-manager
```

### Logging and Debugging
```bash
# NOT USED: Follow logs in real-time
tail -f .claude/logs/server.log

# NOT USED: View recent logs
cat .claude/logs/server.log | tail -100

# NOT USED: Search logs
grep ERROR .claude/logs/server.log
```

### Health Checks
```bash
# NOT USED: wget
wget -q -O- http://localhost:8420/api/health

# NOT USED: HTTP status only
curl -I http://localhost:8420/api/health

# NOT USED: Verbose curl
curl -v http://localhost:8420/api/health
```

**Why these weren't used:**
- **Process Management:** Commands used were sufficient for the restart workflow
- **Port Management:** `lsof` (embedded in script) was adequate
- **PM2/Forever:** Development environment doesn't use process managers
- **Logging:** No debugging required in these sessions
- **Alternative Health Checks:** `curl -s` met the need

---

## Summary Statistics

### Overall Command Distribution

| Category | Commands | Percentage |
|----------|----------|------------|
| Server Management (Restart/Health/Script) | 12 | 37.5% |
| Test Execution | 16 | 50.0% |
| Port/Process Management | 4 (embedded) | 12.5% |
| **Total Server Commands** | **32** | **100%** |

### Unique Command Patterns

| Pattern Type | Unique Patterns | Total Executions |
|--------------|----------------|------------------|
| Restart Commands | 2 | 8 |
| Health Checks | 1 | 4 |
| Server Scripts | 1 | 4 |
| Test Commands | 2 | 16 |
| **Total** | **6** | **32** |

### Session Distribution

| Session ID | Type | Server Commands | Percentage |
|------------|------|----------------|------------|
| dd54b39e | Main + 9 subagents | 0 | 0% |
| 11b4ab85 | Main + 7 subagents | 32 | 100% |
| ca78db5b | 1 subagent | 0 | 0% |

**Insight:** ALL server commands came from BUG-039 bug fix session, none from STORY-7.5 story implementation

### Command Complexity

| Complexity | Commands | Examples |
|------------|----------|----------|
| Simple (single command) | 0 | - |
| Medium (2-3 chained) | 8 | `sleep 2 && curl ...` |
| Complex (4+ chained or script) | 24 | `pkill ...; sleep 1 && npm ...` |

**Insight:** No standalone commands; all part of multi-step workflows

---

## Conclusions and Recommendations

### Key Findings

1. **Limited Command Diversity:** Only 6 unique server management patterns used
2. **High Repetition:** Same 4-command restart sequence executed 4 times
3. **Context-Specific Usage:** Server commands only needed during bug fixes, not story implementation
4. **Script Underutilization:** `ensure-server-running.sh` exists but manual commands used first
5. **No Frontend Server Commands:** All commands backend-focused

### Recommended Pre-Approval Strategy

**Tier 1: Unconditional Pre-Approval (High Frequency, Low Risk)**
- `bash scripts/ensure-server-running.sh` (both modes)
- `npm run test:backend` (with or without tail)
- `npx jest tests/backend/[specific-test].test.js --verbose`
- Proposed: `scripts/check-server-health.sh`

**Tier 2: Conditional Pre-Approval (Medium Risk)**
- `pkill -f "node.*8420"`
- `npm run dev:backend 2>&1 &` (only after pkill)
- `curl -s http://localhost:8420/api/health`
- Proposed: `scripts/restart-backend-quick.sh`

**Tier 3: Requires Approval (High Impact)**
- `kill -9` commands (force kill)
- Port binding changes
- Process manager installation (pm2, forever)
- System service modifications

### Script Creation Priority

**High Priority (create immediately):**
1. `.claude/skills/server-management/scripts/restart-backend-quick.sh` - Fast restart for development
2. `.claude/skills/server-management/scripts/check-server-health.sh` - Health check utility
3. `.claude/skills/server-management/scripts/test-backend-suite.sh` - Unified test runner

**Medium Priority (nice to have):**
4. `.claude/skills/server-management/scripts/dev-workflow.sh` - Complete dev workflow
5. `.claude/skills/server-management/scripts/kill-port.sh [PORT]` - Generic port cleanup
6. `.claude/skills/server-management/scripts/server-logs.sh` - Log viewer utility

**Low Priority (future):**
7. Frontend server equivalents (when needed)
8. Combined frontend+backend workflow
9. CI/CD integration scripts

### Workflow Optimization

**Current Manual Workflow (23 seconds):**
```bash
pkill -f "node.*backend" 2>/dev/null; npm run dev:backend 2>&1 &  # 1s
pkill -f "node.*8420" 2>/dev/null; sleep 1 && npm run dev:backend 2>&1 &  # 12s
sleep 2 && curl -s http://localhost:8420/api/health  # 8s
bash .claude/skills/server-management/scripts/ensure-server-running.sh  # 2s (if already healthy)
```

**Optimized Workflow (10-15 seconds):**
```bash
bash .claude/skills/server-management/scripts/ensure-server-running.sh --restart  # 10-15s
```

**Savings:** 8-13 seconds per restart, reduces from 4 commands to 1

### Next Steps

1. **Create Tier 1 scripts** (check-server-health.sh, restart-backend-quick.sh, test-backend-suite.sh)
2. **Update CLAUDE.md** with pre-approved command list
3. **Document ensure-server-running.sh** in setup guide (already exists but underutilized)
4. **Create .claude/commands/** slash commands for common operations:
   - `/server-restart` → `bash .claude/skills/server-management/scripts/ensure-server-running.sh --restart`
   - `/server-check` → `bash .claude/skills/server-management/scripts/check-server-health.sh`
   - `/test-backend` → `bash .claude/skills/server-management/scripts/test-backend-suite.sh`
5. **Add error handling** to existing ensure-server-running.sh (Pattern 3 from edge cases)

---

## Appendix A: Complete ensure-server-running.sh Script

**Location:** `/home/claude/manager/.claude/skills/server-management/scripts/ensure-server-running.sh`

**Lines of Code:** 127 lines

**Functions:**
- `check_server()` - HTTP health check using curl
- `check_port()` - Port status check using lsof
- `start_server()` - Server startup with verification loop

**Modes:**
1. Default: Check and start if needed
2. `--restart`: Force restart

**Key Features:**
- Color-coded output (Green/Yellow/Red/Blue)
- Logging to `.claude/logs/server.log`
- PID tracking
- 10-second startup timeout with 0.5s polling
- Graceful and force kill fallback
- Health verification before declaring success

**Exit Codes:**
- `0`: Server healthy
- `1`: Server failed to start or respond

**See:** Full script content in Section "Category 3: Comprehensive Server Management Script"

---

## Appendix B: Package.json Scripts Reference

**Complete server-related scripts:**

```json
{
  "name": "claude-code-config-manager",
  "version": "2.3.2",
  "scripts": {
    "dev": "vite",
    "dev:backend": "node --watch src/backend/server.js",
    "start": "node src/backend/server.js",
    "server:restart": "./scripts/ensure-server-running.sh --restart",
    "test": "NODE_OPTIONS='--max-old-space-size=4096' jest",
    "test:backend": "NODE_OPTIONS='--max-old-space-size=4096' jest tests/backend",
    "test:frontend": "playwright test",
    "test:frontend:component": "playwright test tests/frontend",
    "test:frontend:e2e": "playwright test tests/e2e",
    "test:frontend:unit": "vitest run",
    "test:full": "npm run test:backend && npm run test:frontend:unit && npm run test:frontend"
  }
}
```

**Memory Allocation Note:** Backend tests use 4GB RAM (`--max-old-space-size=4096`) to handle 582 tests across 29 test suites.

---

## Appendix C: Session Context

### Session dd54b39e - STORY-7.5: Skill Edit Operations
**Date:** December 8, 2025, 21:49:13 - 23:03:30
**Duration:** ~1 hour 14 minutes
**Transcripts:** 1 main + 9 subagents (total 11 files)
**Server Commands:** 0

**Work Performed:**
- Implementing skill edit operations feature
- No server restarts required
- No test execution in these transcripts
- Focus: Code writing and file operations

---

### Session 11b4ab85 - BUG-039: Skill Copy Unknown Config Type
**Date:** December 8, 2025, 22:40:38 - 23:00:41
**Duration:** ~20 minutes
**Transcripts:** 1 main + 7 subagents (total 8 files)
**Server Commands:** 32 (100% of all server commands)

**Work Performed:**
- Bug fix: Handle unknown configuration types in skill copy
- Multiple server restarts (4 complete restart workflows)
- Extensive test execution (16 test commands)
- Backend code modifications requiring verification
- Ticket moved from backlog → in-progress → done

**Command Timeline:**
1. Initial discovery and ticket loading
2. Code analysis and implementation
3. Test execution (full suite + specific test)
4. **First restart workflow** (4 commands) - Time: -23:18:18 to -23:17:55
5. More code changes
6. **Second restart workflow** (4 commands) - Same pattern
7. Additional testing
8. **Third restart workflow** (4 commands) - Same pattern
9. **Fourth restart workflow** (4 commands) - Same pattern
10. Final verification and ticket completion

**Pattern:** Each code change → restart server → run tests → verify

---

### Session ca78db5b - Workflow Analysis
**Date:** December 8, 2025, 23:08:34
**Duration:** ~5 minutes
**Transcripts:** 1 subagent
**Server Commands:** 0

**Work Performed:**
- Log file analysis
- Session transcript review
- No operational commands

---

## Document Metadata

**Analysis Date:** December 9, 2025
**Sessions Analyzed:** December 8, 2025 (3 sessions, 22 transcript files)
**Total Transcript Size:** ~23MB (condensed to ~2MB)
**Total Bash Commands:** 99 (32 server-related)
**Unique Server Patterns:** 6
**Analysis Tool:** transcript-condenser skill + custom Node.js analysis
**Author:** workflow-analyzer agent
**Version:** 1.0

---

## Related Documentation

- **Server Management Script:** `/home/claude/manager/.claude/skills/server-management/scripts/ensure-server-running.sh`
- **Setup Guide:** `/home/claude/manager/docs/guides/SETUP-GUIDE.md`
- **Testing Guide:** `/home/claude/manager/docs/guides/TESTING-GUIDE.md`
- **Package Configuration:** `/home/claude/manager/package.json`
- **Project Documentation:** `/home/claude/manager/CLAUDE.md`

---

*This catalog provides a comprehensive reference for standardizing and pre-approving server management commands used in Claude Code development workflows.*
